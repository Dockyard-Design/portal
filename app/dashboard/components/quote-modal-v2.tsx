"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { CheckCircle, Download, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SPLIT_PAYMENT_TERMS } from "@/lib/invoice-payments";
import type { Quote } from "@/types/agency";
import type { UserRole } from "@/types/auth";
import type { Customer } from "@/types/kanban";

const quoteItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit_price: z.coerce.number().nonnegative("Unit price cannot be negative"),
});

const quoteSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  title: z.string().trim().min(1, "Quote title is required"),
  description: z.string().trim().optional(),
  taxRate: z.coerce
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100"),
  notes: z.string().trim().optional(),
  terms: z.string().trim().optional(),
  items: z.array(quoteItemSchema).min(1, "Add at least one line item"),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;
type QuoteFormInput = z.input<typeof quoteSchema>;
type QuoteFormOutput = z.output<typeof quoteSchema>;

interface QuoteModalProps {
  quote: Quote | null;
  customers: Customer[];
  preselectedCustomerId?: string | null;
  mode: "create" | "edit" | "view";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  role?: UserRole;
}

function getDefaultValues(
  quote: Quote | null,
  preselectedCustomerId?: string | null
): QuoteFormValues {
  if (quote) {
    return {
      customerId: quote.customer_id,
      title: quote.title,
      description: quote.description ?? "",
      taxRate: quote.tax_rate,
      notes: quote.notes ?? "",
      terms: quote.terms ?? "",
      items:
        quote.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })) ?? [{ description: "", quantity: 1, unit_price: 0 }],
    };
  }

  return {
    customerId: preselectedCustomerId ?? "",
    title: "",
    description: "",
    taxRate: 20,
    notes: "",
    terms: SPLIT_PAYMENT_TERMS,
    items: [{ description: "", quantity: 1, unit_price: 0 }],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function getQuoteStatusColor(status: string) {
  switch (status) {
    case "accepted":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "sent":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";
    case "expired":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200";
  }
}

function canAcceptQuote(quote: Quote): boolean {
  if (quote.status !== "sent") return false;
  if (!quote.valid_until) return true;
  const validUntil = new Date(quote.valid_until);
  validUntil.setHours(23, 59, 59, 999);
  return validUntil.getTime() >= Date.now();
}

export function QuoteModal({
  quote,
  customers,
  preselectedCustomerId,
  mode,
  open,
  onOpenChange,
  onSuccess,
  role = "admin",
}: QuoteModalProps) {
  const [saving, setSaving] = useState(false);
  const isViewOnly = mode === "view";
  const isCustomerView = role === "customer" && isViewOnly;
  const isCustomerLocked = Boolean(preselectedCustomerId);

  const form = useForm<QuoteFormInput, unknown, QuoteFormOutput>({
    resolver: zodResolver(quoteSchema),
    mode: "onChange",
    defaultValues: getDefaultValues(quote, preselectedCustomerId),
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (!open) return;
    reset(getDefaultValues(quote, preselectedCustomerId));
  }, [open, quote, preselectedCustomerId, reset]);

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  const items = watch("items");
  const taxRate = Number(watch("taxRate")) || 0;

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        return sum + quantity * unitPrice;
      }, 0),
    [items]
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleGeneratePdf = () => {
    if (!quote) return;
    window.open(`/api/pdf/quote/${quote.id}`, "_blank", "noopener,noreferrer");
  };

  const onSubmit = async (values: QuoteFormOutput) => {
    setSaving(true);

    try {
      const payload = {
        customer_id: values.customerId,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        tax_rate: values.taxRate,
        notes: values.notes?.trim() || undefined,
        terms: values.terms?.trim() || undefined,
        items: values.items.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      if (mode === "create") {
        const { createQuote } = await import("@/app/actions/agency");
        await createQuote(payload);
        toast.success("Quote created successfully");
      } else if (mode === "edit" && quote) {
        const { updateQuote } = await import("@/app/actions/agency");
        await updateQuote(quote.id, payload);
        toast.success("Quote updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving quote:", error);
      toast.error("Failed to save quote");
    } finally {
      setSaving(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quote) return;
    try {
      const { sendQuoteToCustomer } = await import("@/app/actions/agency");
      await sendQuoteToCustomer(quote.id);
      toast.success("Quote sent to customer");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send quote");
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote) return;
    try {
      const { acceptQuote } = await import("@/app/actions/agency");
      await acceptQuote(quote.id);
      toast.success("Quote accepted and invoice generated");
      onSuccess?.();
    } catch {
      toast.error("Failed to accept quote");
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;
    try {
      const { rejectQuote } = await import("@/app/actions/agency");
      await rejectQuote(quote.id);
      toast.success("Quote marked as rejected");
      onSuccess?.();
    } catch {
      toast.error("Failed to reject quote");
    }
  };

  if (isCustomerView && quote) {
    const canRespond = canAcceptQuote(quote);

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto border-border/60 bg-background p-0">
          <DialogHeader className="border-b border-border/60 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <DialogTitle className="text-2xl tracking-tight">{quote.title}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Review the scope, line items, and terms before responding.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={getQuoteStatusColor(quote.status)}>{quote.status}</Badge>
                <Button variant="outline" size="sm" onClick={handleGeneratePdf}>
                  <Download className="mr-2 size-4" />
                  PDF
                </Button>
                {canRespond && (
                  <>
                    <Button size="sm" onClick={handleAcceptQuote}>
                      <CheckCircle className="mr-2 size-4" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleRejectQuote}>
                      <X className="mr-2 size-4" />
                      Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              {quote.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Scope</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quote.description}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Line Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(quote.items ?? []).map((item) => (
                    <div key={item.id} className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} x £{item.unit_price.toLocaleString()}
                        </p>
                      </div>
                      <p className="font-semibold md:text-right">£{item.total.toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {(quote.terms || quote.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Terms & Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quote.terms && (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quote.terms}</p>
                    )}
                    {quote.notes && (
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quote.notes}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <aside>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>£{quote.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>£{quote.tax_amount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border/70 pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Grand total</span>
                      <span className="text-xl font-semibold">£{quote.total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[94vh] overflow-y-auto border-border/60 bg-background p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl tracking-tight">
                {mode === "create" && "Create Quote"}
                {mode === "edit" && "Edit Quote"}
                {mode === "view" && (quote?.title || "Quote Details")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                One place to shape the scope, validate the form live, and keep the money visible.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {quote && <Badge className={getQuoteStatusColor(quote.status)}>{quote.status}</Badge>}
              {quote && (
                <Button variant="outline" size="sm" onClick={handleGeneratePdf}>
                  <Download className="mr-2 size-4" />
                  PDF
                </Button>
              )}
              {mode === "view" && quote?.status === "draft" && (
                <Button size="sm" onClick={handleSendQuote}>
                  <Send className="mr-2 size-4" />
                  Send Email
                </Button>
              )}
              {mode === "view" && quote?.status === "sent" && (
                <>
                  {canAcceptQuote(quote) && (
                    <>
                      <Button size="sm" onClick={handleAcceptQuote}>
                        <CheckCircle className="mr-2 size-4" />
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleRejectQuote}>
                        <X className="mr-2 size-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client & Scope</CardTitle>
                <CardDescription>Set the recipient, headline, and quote scope.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                {isCustomerLocked ? (
                  <div className="grid gap-2 md:col-span-2">
                    <Label>Customer</Label>
                    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-medium">
                        {selectedCustomer?.name || "Selected customer"}
                      </span>
                      {selectedCustomer?.company && (
                        <span className="text-muted-foreground"> ({selectedCustomer.company})</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="quote-customer">Customer</Label>
                    <Select
                      disabled={isViewOnly}
                      value={selectedCustomerId}
                      onValueChange={(value) =>
                        setValue("customerId", value ?? "", {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    >
                      <SelectTrigger id="quote-customer" className="w-full" aria-invalid={Boolean(errors.customerId)}>
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                            {customer.company ? ` (${customer.company})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.customerId?.message} />
                  </div>
                )}

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="quote-title">Quote title</Label>
                  <Input
                    id="quote-title"
                    aria-invalid={Boolean(errors.title)}
                    disabled={isViewOnly}
                    placeholder="Website redesign and launch support"
                    {...register("title")}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="quote-description">Description</Label>
                  <Textarea
                    id="quote-description"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder="Summarize the work, deliverables, and assumptions."
                    {...register("description")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quote-tax-rate">Tax rate (%)</Label>
                  <Input
                    id="quote-tax-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    aria-invalid={Boolean(errors.taxRate)}
                    disabled={isViewOnly}
                    {...register("taxRate")}
                  />
                  <FieldError message={errors.taxRate?.message} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Line Items</CardTitle>
                  <CardDescription>Each item updates totals immediately as you type.</CardDescription>
                </div>
                {!isViewOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ description: "", quantity: 1, unit_price: 0 })}
                  >
                    <Plus className="mr-2 size-4" />
                    Add Item
                  </Button>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {fields.map((field, index) => {
                  const itemError = errors.items?.[index];
                  const quantity = Number(items[index]?.quantity) || 0;
                  const unitPrice = Number(items[index]?.unit_price) || 0;

                  return (
                    <div key={field.id} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_130px_150px_140px_auto] lg:items-start">
                        <div className="grid gap-2">
                          <Label htmlFor={`quote-item-description-${index}`}>Description</Label>
                          <Textarea
                            id={`quote-item-description-${index}`}
                            aria-invalid={Boolean(itemError?.description)}
                            disabled={isViewOnly}
                            rows={3}
                            placeholder="Discovery workshop and interface exploration"
                            {...register(`items.${index}.description`)}
                          />
                          <FieldError message={itemError?.description?.message} />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`quote-item-quantity-${index}`}>Quantity / units</Label>
                          <Input
                            id={`quote-item-quantity-${index}`}
                            type="number"
                            min="0"
                            step="1"
                            aria-invalid={Boolean(itemError?.quantity)}
                            disabled={isViewOnly}
                            {...register(`items.${index}.quantity`)}
                          />
                          <FieldError message={itemError?.quantity?.message} />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`quote-item-price-${index}`}>Unit price</Label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                            <Input
                              id={`quote-item-price-${index}`}
                              className="pl-7"
                              type="number"
                              min="0"
                              step="0.01"
                              aria-invalid={Boolean(itemError?.unit_price)}
                              disabled={isViewOnly}
                              {...register(`items.${index}.unit_price`)}
                            />
                          </div>
                          <FieldError message={itemError?.unit_price?.message} />
                        </div>

                        <div className="grid gap-2">
                          <Label>Line total</Label>
                          <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-background px-3 text-sm font-medium">
                            £{(quantity * unitPrice).toLocaleString()}
                          </div>
                        </div>

                        {!isViewOnly && fields.length > 1 && (
                          <div className="flex items-end">
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <FieldError message={errors.items?.message} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Terms & Notes</CardTitle>
                <CardDescription>Capture commercial terms and client-facing notes.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="quote-terms">Terms</Label>
                  <Textarea
                    id="quote-terms"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder={SPLIT_PAYMENT_TERMS}
                    {...register("terms")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quote-notes">Notes</Label>
                  <Textarea
                    id="quote-notes"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder="Anything the client should know before approval."
                    {...register("notes")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="flex flex-col gap-6">
            <Card className="sticky top-0">
              <CardHeader>
                <CardTitle className="text-base">Live Summary</CardTitle>
                <CardDescription>Financial context stays visible while you edit.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Customer</p>
                  <p className="mt-2 text-base font-semibold">
                    {selectedCustomer?.name || "No customer selected"}
                  </p>
                  {selectedCustomer?.company && (
                    <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                  )}
                  {selectedCustomer?.email && (
                    <p className="mt-2 text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  )}
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>£{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>£{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="mt-4 border-t border-border/70 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Grand total</span>
                      <span className="text-xl font-semibold">£{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {quote && (
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Quote Timeline</p>
                    <p className="mt-2 font-medium">
                      Created {format(new Date(quote.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                )}

                {!isViewOnly && (
                  <Button type="submit" disabled={saving || !isValid}>
                    {saving ? "Saving..." : mode === "create" ? "Create Quote" : "Save Changes"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>
        </form>
      </DialogContent>
    </Dialog>
  );
}
