"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { CalendarIcon, CheckCircle, Download, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Invoice, Quote } from "@/types/agency";
import type { Customer } from "@/types/kanban";

const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unit_price: z.coerce.number().nonnegative("Unit price cannot be negative"),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  quoteId: z.string().optional(),
  title: z.string().trim().min(1, "Invoice title is required"),
  description: z.string().trim().optional(),
  taxRate: z.coerce
    .number()
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100"),
  dueDate: z.date().optional(),
  notes: z.string().trim().optional(),
  terms: z.string().trim().optional(),
  paymentInstructions: z.string().trim().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;
type InvoiceFormInput = z.input<typeof invoiceSchema>;
type InvoiceFormOutput = z.output<typeof invoiceSchema>;

interface InvoiceModalProps {
  invoice: Invoice | null;
  customers: Customer[];
  quotes: Quote[];
  preselectedCustomerId?: string | null;
  mode: "create" | "edit" | "view";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function getDefaultValues(
  invoice: Invoice | null,
  preselectedCustomerId?: string | null
): InvoiceFormValues {
  if (invoice) {
    return {
      customerId: invoice.customer_id,
      quoteId: invoice.quote_id ?? "",
      title: invoice.title,
      description: invoice.description ?? "",
      taxRate: invoice.tax_rate,
      dueDate: invoice.due_date ? parseISO(invoice.due_date) : undefined,
      notes: invoice.notes ?? "",
      terms: invoice.terms ?? "",
      paymentInstructions: invoice.payment_instructions ?? "",
      items:
        invoice.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })) ?? [{ description: "", quantity: 1, unit_price: 0 }],
    };
  }

  return {
    customerId: preselectedCustomerId ?? "",
    quoteId: "",
    title: "",
    description: "",
    taxRate: 20,
    dueDate: undefined,
    notes: "",
    terms: "Payment due within 30 days.",
    paymentInstructions: "Bank transfer preferred.",
    items: [{ description: "", quantity: 1, unit_price: 0 }],
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  disabled,
  invalid,
}: {
  value?: Date;
  onChange: (value?: Date) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-invalid={invalid}
        className={cn(
          "inline-flex h-9 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-left text-sm shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none",
          !value && "text-muted-foreground",
          invalid && "border-destructive focus-visible:ring-destructive/20"
        )}
      >
        <CalendarIcon className="mr-2 size-4" />
        {value ? format(value, "PPP") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

function getInvoiceStatusColor(status: string) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "sent":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "partial":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "overdue":
      return "bg-red-100 text-red-700 border-red-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function InvoiceModal({
  invoice,
  customers,
  quotes,
  preselectedCustomerId,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: InvoiceModalProps) {
  const [saving, setSaving] = useState(false);
  const isViewOnly = mode === "view";
  const isCustomerLocked = Boolean(preselectedCustomerId);

  const form = useForm<InvoiceFormInput, unknown, InvoiceFormOutput>({
    resolver: zodResolver(invoiceSchema),
    mode: "onChange",
    defaultValues: getDefaultValues(invoice, preselectedCustomerId),
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
    reset(getDefaultValues(invoice, preselectedCustomerId));
  }, [open, invoice, preselectedCustomerId, reset]);

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  const acceptedQuotes = useMemo(
    () => quotes.filter((entry) => entry.status === "accepted" && entry.customer_id === selectedCustomerId),
    [quotes, selectedCustomerId]
  );

  const linkedQuoteId = watch("quoteId") || "";
  const linkedQuote = useMemo(
    () => quotes.find((entry) => entry.id === linkedQuoteId) ?? null,
    [quotes, linkedQuoteId]
  );

  useEffect(() => {
    if (!linkedQuote) return;
    if (mode !== "create") return;

    const currentTitle = watch("title");
    const currentDescription = watch("description");
    const currentItems = watch("items");

    if (!currentTitle.trim()) {
      setValue("title", linkedQuote.title, { shouldDirty: true });
    }
    if (!currentDescription?.trim() && linkedQuote.description) {
      setValue("description", linkedQuote.description, { shouldDirty: true });
    }
    if (
      currentItems.length === 1 &&
      !currentItems[0]?.description.trim() &&
      linkedQuote.items?.length
    ) {
      setValue(
        "items",
        linkedQuote.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        { shouldDirty: true, shouldValidate: true }
      );
    }
  }, [linkedQuote, mode, setValue, watch]);

  useEffect(() => {
    if (!linkedQuoteId) return;
    if (acceptedQuotes.some((entry) => entry.id === linkedQuoteId)) return;
    setValue("quoteId", "", { shouldDirty: true, shouldValidate: true });
  }, [acceptedQuotes, linkedQuoteId, setValue]);

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
    if (!invoice) return;
    window.open(`/api/pdf/invoice/${invoice.id}`, "_blank", "noopener,noreferrer");
  };

  const onSubmit = async (values: InvoiceFormOutput) => {
    setSaving(true);

    try {
      const payload = {
        customer_id: values.customerId,
        quote_id: values.quoteId?.trim() || undefined,
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        tax_rate: values.taxRate,
        due_date: values.dueDate ? format(values.dueDate, "yyyy-MM-dd") : undefined,
        notes: values.notes?.trim() || undefined,
        terms: values.terms?.trim() || undefined,
        payment_instructions: values.paymentInstructions?.trim() || undefined,
        items: values.items.map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      if (mode === "create") {
        const { createInvoice } = await import("@/app/actions/agency");
        await createInvoice(payload);
        toast.success("Invoice created successfully");
      } else if (mode === "edit" && invoice) {
        const { updateInvoice } = await import("@/app/actions/agency");
        await updateInvoice(invoice.id, payload);
        toast.success("Invoice updated successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast.error("Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!invoice) return;
    try {
      const { updateInvoice } = await import("@/app/actions/agency");
      await updateInvoice(invoice.id, {
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      toast.success("Invoice sent");
      onSuccess?.();
    } catch {
      toast.error("Failed to send invoice");
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    try {
      const { updateInvoice } = await import("@/app/actions/agency");
      await updateInvoice(invoice.id, {
        status: "paid",
        amount_paid: invoice.total,
      });
      toast.success("Invoice marked as paid");
      onSuccess?.();
    } catch {
      toast.error("Failed to update invoice");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[94vh] overflow-y-auto border-border/60 bg-background p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <DialogTitle className="text-2xl tracking-tight">
                {mode === "create" && "Create Invoice"}
                {mode === "edit" && "Edit Invoice"}
                {mode === "view" && (invoice?.invoice_number || "Invoice Details")}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Build one clean invoice flow with live validation, linked quote context, and a proper calendar picker.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {invoice && <Badge className={getInvoiceStatusColor(invoice.status)}>{invoice.status}</Badge>}
              {invoice && (
                <Button variant="outline" size="sm" onClick={handleGeneratePdf}>
                  <Download className="mr-2 size-4" />
                  PDF
                </Button>
              )}
              {mode === "view" && invoice?.status === "draft" && (
                <Button size="sm" onClick={handleSendInvoice}>
                  <Send className="mr-2 size-4" />
                  Mark Sent
                </Button>
              )}
              {mode === "view" && invoice && invoice.status !== "paid" && invoice.status !== "cancelled" && (
                <Button size="sm" onClick={handleMarkPaid}>
                  <CheckCircle className="mr-2 size-4" />
                  Mark Paid
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client & Billing Setup</CardTitle>
                <CardDescription>Choose the recipient, optionally link an accepted quote, and set timing.</CardDescription>
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
                    <Label htmlFor="invoice-customer">Customer</Label>
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
                      <SelectTrigger id="invoice-customer" className="w-full" aria-invalid={Boolean(errors.customerId)}>
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
                  <Label htmlFor="invoice-linked-quote">Linked accepted quote</Label>
                  <Select
                    disabled={isViewOnly || acceptedQuotes.length === 0}
                    value={linkedQuoteId || "none"}
                    onValueChange={(value) =>
                      setValue("quoteId", value === "none" ? "" : (value ?? ""), {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger id="invoice-linked-quote" className="w-full">
                      <SelectValue
                        placeholder={
                          acceptedQuotes.length > 0
                            ? "Select an accepted quote"
                            : "No accepted quotes for this customer"
                        }
                      >
                        {linkedQuote
                          ? `${linkedQuote.title} - £${linkedQuote.total.toLocaleString()}`
                          : "None"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {acceptedQuotes.map((quoteOption) => (
                        <SelectItem key={quoteOption.id} value={quoteOption.id}>
                          {quoteOption.title} • £{quoteOption.total.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="invoice-title">Invoice title</Label>
                  <Input
                    id="invoice-title"
                    aria-invalid={Boolean(errors.title)}
                    disabled={isViewOnly}
                    placeholder="Website development phase one"
                    {...register("title")}
                  />
                  <FieldError message={errors.title?.message} />
                </div>

                <div className="grid gap-2 md:col-span-2">
                  <Label htmlFor="invoice-description">Description</Label>
                  <Textarea
                    id="invoice-description"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder="Summarize the billed work and any specific billing notes."
                    {...register("description")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="invoice-tax-rate">Tax rate (%)</Label>
                  <Input
                    id="invoice-tax-rate"
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

                <div className="grid gap-2">
                  <Label>Due date</Label>
                  <DatePickerField
                    value={watch("dueDate")}
                    invalid={Boolean(errors.dueDate)}
                    disabled={isViewOnly}
                    placeholder="Pick a due date"
                    onChange={(value) =>
                      setValue("dueDate", value, {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
                  />
                  <FieldError message={errors.dueDate?.message} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Line Items</CardTitle>
                  <CardDescription>Amounts update live, with validation as you type.</CardDescription>
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
                      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_110px_140px_140px_auto] lg:items-start">
                        <div className="grid gap-2">
                          <Label htmlFor={`invoice-item-description-${index}`}>Description</Label>
                          <Textarea
                            id={`invoice-item-description-${index}`}
                            aria-invalid={Boolean(itemError?.description)}
                            disabled={isViewOnly}
                            rows={3}
                            placeholder="Implementation sprint and QA pass"
                            {...register(`items.${index}.description`)}
                          />
                          <FieldError message={itemError?.description?.message} />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor={`invoice-item-quantity-${index}`}>Qty</Label>
                          <Input
                            id={`invoice-item-quantity-${index}`}
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
                          <Label htmlFor={`invoice-item-price-${index}`}>Unit price</Label>
                          <Input
                            id={`invoice-item-price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            aria-invalid={Boolean(itemError?.unit_price)}
                            disabled={isViewOnly}
                            {...register(`items.${index}.unit_price`)}
                          />
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
                <CardTitle className="text-base">Payment Terms</CardTitle>
                <CardDescription>Keep commercial terms and payment instructions readable.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="invoice-terms">Terms</Label>
                  <Textarea
                    id="invoice-terms"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder="Payment due within 30 days."
                    {...register("terms")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="invoice-payment-instructions">Payment instructions</Label>
                  <Textarea
                    id="invoice-payment-instructions"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder="Bank transfer preferred."
                    {...register("paymentInstructions")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="invoice-notes">Notes</Label>
                  <Textarea
                    id="invoice-notes"
                    disabled={isViewOnly}
                    rows={4}
                    placeholder="Anything the client should know when paying this invoice."
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
                <CardDescription>Customer and linked quote context stay visible while editing.</CardDescription>
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
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Linked Quote</p>
                  <p className="mt-2 text-base font-semibold">
                    {linkedQuote?.title || (invoice?.quote_id ? "Linked quote unavailable" : "No linked quote")}
                  </p>
                  {linkedQuote && (
                    <p className="text-sm text-muted-foreground">£{linkedQuote.total.toLocaleString()}</p>
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

                {invoice && (
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Invoice number</p>
                    <p className="mt-2 font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Created {format(new Date(invoice.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                )}

                {!isViewOnly && (
                  <Button type="submit" disabled={saving || !isValid}>
                    {saving ? "Saving..." : mode === "create" ? "Create Invoice" : "Save Changes"}
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
