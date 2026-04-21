"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createQuote } from "@/app/actions/agency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SPLIT_PAYMENT_TERMS } from "@/lib/invoice-payments";
import type { Customer } from "@/types/kanban";

type DraftItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

interface NewQuoteClientProps {
  customers: Customer[];
  selectedCustomerId?: string;
}

export function NewQuoteClient({ customers, selectedCustomerId }: NewQuoteClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(selectedCustomerId ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taxRate, setTaxRate] = useState(20);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(SPLIT_PAYMENT_TERMS);
  const [items, setItems] = useState<DraftItem[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
    [items]
  );
  const total = subtotal + subtotal * (taxRate / 100);

  const updateItem = (index: number, update: Partial<DraftItem>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item));
  };

  const submit = async () => {
    const cleanedItems = items
      .map((item) => ({ ...item, description: item.description.trim() }))
      .filter((item) => item.description.length > 0);

    if (!customerId || !title.trim() || cleanedItems.length === 0) {
      toast.error("Select a customer, add a title, and include at least one line item");
      return;
    }

    setSaving(true);
    try {
      await createQuote({
        customer_id: customerId,
        title: title.trim(),
        description: description.trim() || undefined,
        tax_rate: taxRate,
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        items: cleanedItems,
      });
      toast.success("Quote created");
      router.push("/dashboard/quotes");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create quote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/quotes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Quote</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a quote and open a customer message thread.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Quote Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={(value) => setCustomerId(value ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company || customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Website redesign" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-28" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => setItems((current) => [...current, { description: "", quantity: 1, unit_price: 0 }])}>
                  <Plus className="size-4" />
                  Add Item
                </Button>
              </div>
              <div className="flex flex-col gap-3">
                {items.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 md:grid-cols-[minmax(0,1fr)_120px_150px_130px_40px] md:items-end">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`new-quote-item-description-${index}`}>Description</Label>
                      <Input
                        id={`new-quote-item-description-${index}`}
                        value={item.description}
                        onChange={(event) => updateItem(index, { description: event.target.value })}
                        placeholder="Discovery workshop"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`new-quote-item-quantity-${index}`}>Quantity / units</Label>
                      <Input
                        id={`new-quote-item-quantity-${index}`}
                        type="number"
                        min="0"
                        step="1"
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                        placeholder="1"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`new-quote-item-price-${index}`}>Unit price</Label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                        <Input
                          id={`new-quote-item-price-${index}`}
                          className="pl-7"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(event) => updateItem(index, { unit_price: Number(event.target.value) })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Line total</Label>
                      <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-background px-3 text-sm font-medium">
                        £{(item.quantity * item.unit_price).toLocaleString()}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Tax Rate</Label>
                <Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(event) => setTaxRate(Number(event.target.value))} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Terms</Label>
              <Textarea value={terms} onChange={(event) => setTerms(event.target.value)} className="min-h-24" />
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>GBP {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{taxRate}%</span></div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Total</span><span>GBP {total.toFixed(2)}</span></div>
            <Button onClick={() => void submit()} disabled={saving} className="mt-3">
              {saving ? "Creating..." : "Create Quote"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
