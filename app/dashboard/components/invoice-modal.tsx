"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Receipt,
  Download,
  Send,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import type { Invoice, Quote } from "@/types/agency";
import type { Customer } from "@/types/kanban";

interface InvoiceItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

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
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState(preselectedCustomerId || "");
  const [quoteId, setQuoteId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taxRate, setTaxRate] = useState("20");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within 30 days.");
  const [paymentInstructions, setPaymentInstructions] = useState(
    "Bank transfer preferred."
  );
  const [items, setItems] = useState<InvoiceItemInput[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  // Load invoice data when in edit/view mode
  useEffect(() => {
    if (open) {
      if ((mode === "edit" || mode === "view") && invoice) {
        setCustomerId(invoice.customer_id);
        setQuoteId(invoice.quote_id || "");
        setTitle(invoice.title);
        setDescription(invoice.description || "");
        setTaxRate(invoice.tax_rate.toString());
        setDueDate(invoice.due_date ? invoice.due_date.split("T")[0] : "");
        setNotes(invoice.notes || "");
        setTerms(invoice.terms || "");
        setPaymentInstructions(invoice.payment_instructions || "");
        setItems(
          invoice.items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })) || [{ description: "", quantity: 1, unit_price: 0 }]
        );
      } else {
        // Reset form for create mode
        setCustomerId(preselectedCustomerId || "");
        setQuoteId("");
        setTitle("");
        setDescription("");
        setTaxRate("20");
        setDueDate("");
        setNotes("");
        setTerms("Payment due within 30 days.");
        setPaymentInstructions("Bank transfer preferred.");
        setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      }
      setActiveTab("details");
    }
  }, [open, invoice, mode, preselectedCustomerId]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItemInput,
    value: string | number
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0
    );
    const taxAmount = subtotal * (parseFloat(taxRate) / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const validItems = items.filter(
      (i) => i.description.trim() && i.quantity > 0 && i.unit_price > 0
    );
    if (validItems.length === 0) {
      toast.error("Please add at least one valid line item");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const { createInvoice } = await import("@/app/actions/agency");
        await createInvoice({
          customer_id: customerId,
          quote_id: quoteId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          tax_rate: parseFloat(taxRate) || 0,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
          terms: terms.trim() || undefined,
          payment_instructions: paymentInstructions.trim() || undefined,
          items: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        });
        toast.success("Invoice created successfully");
      } else if (mode === "edit" && invoice) {
        const { updateInvoice } = await import("@/app/actions/agency");
        await updateInvoice(invoice.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          tax_rate: parseFloat(taxRate) || 0,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
          terms: terms.trim() || undefined,
          payment_instructions: paymentInstructions.trim() || undefined,
          items: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        });
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to update invoice");
    }
  };

  const generatePDF = () => {
    if (!invoice) return;
    window.open(`/api/pdf/invoice/${invoice.id}`, "_blank");
  };

  const getCustomerName = (id: string) => {
    return customers.find((c) => c.id === id)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
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
  };

  const { subtotal, taxAmount, total } = calculateTotals();
  const isViewOnly = mode === "view";

  const acceptedQuotes = quotes.filter(
    (q) => q.status === "accepted" && q.customer_id === customerId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {mode === "create" && "Create Invoice"}
              {mode === "edit" && "Edit Invoice"}
              {mode === "view" &&
                (invoice?.invoice_number || "Invoice Details")}
            </DialogTitle>
            {mode === "view" && invoice && (
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
                <Button variant="outline" size="sm" onClick={generatePDF}>
                  <Download className="size-4 mr-1" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">Line Items</TabsTrigger>
            <TabsTrigger value="terms">Terms & Payment</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isViewOnly && invoice ? (
                    <div>
                      <p className="font-medium">
                        {getCustomerName(invoice.customer_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {
                          customers.find((c) => c.id === invoice.customer_id)
                            ?.email
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-2">
                        <Label>Select Customer *</Label>
                        <Select
                          value={customerId}
                          onValueChange={(v) => setCustomerId(v || "")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}{" "}
                                {customer.company && `(${customer.company})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {acceptedQuotes.length > 0 && (
                        <div className="grid gap-2">
                          <Label>Link to Accepted Quote (Optional)</Label>
                          <Select
                            value={quoteId}
                            onValueChange={(v) => setQuoteId(v || "")}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a quote" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {acceptedQuotes.map((quote) => (
                                <SelectItem key={quote.id} value={quote.id}>
                                  {quote.title} - £{quote.total.toLocaleString()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Invoice Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Website Development Phase 1"
                      disabled={isViewOnly}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the work..."
                      rows={3}
                      disabled={isViewOnly}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        disabled={isViewOnly}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Due Date</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        disabled={isViewOnly}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Line Items</CardTitle>
                  {!isViewOnly && (
                    <Button type="button" variant="outline" onClick={addItem}>
                      <Plus className="size-4 mr-1" />
                      Add Item
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <div className="flex-1 grid gap-2">
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            updateItem(index, "description", e.target.value)
                          }
                          placeholder="Item description"
                          disabled={isViewOnly}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantity",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="Qty"
                          min="1"
                          disabled={isViewOnly}
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          value={item.unit_price || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unit_price",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          disabled={isViewOnly}
                        />
                      </div>
                      <div className="w-28 text-right pt-2 font-medium">
                        £
                        {(
                          (item.quantity || 0) * (item.unit_price || 0)
                        ).toLocaleString()}
                      </div>
                      {!isViewOnly && items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>£{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">
                        Tax ({taxRate}%)
                      </span>
                      <span>£{taxAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t">
                      <span>Total</span>
                      <span>£{total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Terms & Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={4}
                    disabled={isViewOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Bank details, payment methods..."
                    rows={3}
                    disabled={isViewOnly}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal notes (not visible to customer)..."
                    rows={3}
                    disabled={isViewOnly}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              {mode === "view" && invoice?.status === "sent" && (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleMarkPaid}>
                    <CheckCircle className="size-4 mr-1" />
                    Mark Paid
                  </Button>
                </div>
              )}
              {mode === "view" && invoice?.status === "draft" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendInvoice}
                >
                  <Send className="size-4 mr-1" />
                  Send Invoice
                </Button>
              )}
              {mode === "view" && 
                invoice?.status !== "sent" && 
                invoice?.status !== "draft" && <div />}
              {mode !== "view" && <div />}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {mode === "view" ? "Close" : "Cancel"}
                </Button>
                {(mode === "create" || mode === "edit") && (
                  <Button type="submit" disabled={saving}>
                    <Receipt className="size-4 mr-1" />
                    {saving
                      ? "Saving..."
                      : mode === "create"
                      ? "Create Invoice"
                      : "Save Changes"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
