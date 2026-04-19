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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  FileText,
  Download,
  Send,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Quote, QuoteItem } from "@/types/agency";
import type { Customer } from "@/types/kanban";

interface QuoteItemInput {
  description: string;
  quantity: number;
  unit_price: number;
}

interface QuoteModalProps {
  quote: Quote | null;
  customers: Customer[];
  preselectedCustomerId?: string | null;
  mode: "create" | "edit" | "view";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function QuoteModal({
  quote,
  customers,
  preselectedCustomerId,
  mode,
  open,
  onOpenChange,
  onSuccess,
}: QuoteModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [customerId, setCustomerId] = useState(preselectedCustomerId || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taxRate, setTaxRate] = useState("20");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Payment due within 30 days of acceptance.");
  const [items, setItems] = useState<QuoteItemInput[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);

  // Load quote data when in edit/view mode
  useEffect(() => {
    if (open) {
      if ((mode === "edit" || mode === "view") && quote) {
        setCustomerId(quote.customer_id);
        setTitle(quote.title);
        setDescription(quote.description || "");
        setTaxRate(quote.tax_rate.toString());
        setValidUntil(quote.valid_until ? quote.valid_until.split("T")[0] : "");
        setNotes(quote.notes || "");
        setTerms(quote.terms || "");
        setItems(
          quote.items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })) || [{ description: "", quantity: 1, unit_price: 0 }]
        );
      } else {
        // Reset form for create mode
        setCustomerId(preselectedCustomerId || "");
        setTitle("");
        setDescription("");
        setTaxRate("20");
        setValidUntil("");
        setNotes("");
        setTerms("Payment due within 30 days of acceptance.");
        setItems([{ description: "", quantity: 1, unit_price: 0 }]);
      }
      setActiveTab("details");
    }
  }, [open, quote, mode, preselectedCustomerId]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof QuoteItemInput,
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
        const { createQuote } = await import("@/app/actions/agency");
        await createQuote({
          customer_id: customerId,
          title: title.trim(),
          description: description.trim() || undefined,
          tax_rate: parseFloat(taxRate) || 0,
          valid_until: validUntil || undefined,
          notes: notes.trim() || undefined,
          terms: terms.trim() || undefined,
          items: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        });
        toast.success("Quote created successfully");
      } else if (mode === "edit" && quote) {
        const { updateQuote } = await import("@/app/actions/agency");
        await updateQuote(quote.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          tax_rate: parseFloat(taxRate) || 0,
          valid_until: validUntil || undefined,
          notes: notes.trim() || undefined,
          terms: terms.trim() || undefined,
          items: validItems.map((item) => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        });
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
      const { updateQuote } = await import("@/app/actions/agency");
      await updateQuote(quote.id, {
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      toast.success("Quote sent");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to send quote");
    }
  };

  const handleAcceptQuote = async () => {
    if (!quote) return;
    try {
      const { updateQuote } = await import("@/app/actions/agency");
      await updateQuote(quote.id, {
        status: "accepted",
        accepted_at: new Date().toISOString(),
      });
      toast.success("Quote marked as accepted");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to accept quote");
    }
  };

  const handleRejectQuote = async () => {
    if (!quote) return;
    try {
      const { updateQuote } = await import("@/app/actions/agency");
      await updateQuote(quote.id, {
        status: "rejected",
      });
      toast.success("Quote marked as rejected");
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to reject quote");
    }
  };

  const generatePDF = () => {
    if (!quote) return;
    window.open(`/api/pdf/quote/${quote.id}`, "_blank");
  };

  const getCustomerName = (id: string) => {
    return customers.find((c) => c.id === id)?.name || "Unknown";
  };

  const getStatusColor = (status: string) => {
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
  };

  const { subtotal, taxAmount, total } = calculateTotals();
  const isViewOnly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {mode === "create" && "Create Quote"}
              {mode === "edit" && "Edit Quote"}
              {mode === "view" && (quote?.title || "Quote Details")}
            </DialogTitle>
            {mode === "view" && quote && (
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(quote.status)}>
                  {quote.status}
                </Badge>
                {(mode === "view" || mode === "edit") && quote && (
                  <Button variant="outline" size="sm" onClick={generatePDF}>
                    <Download className="size-4 mr-1" />
                    PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="items">Line Items</TabsTrigger>
            <TabsTrigger value="terms">Terms & Notes</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="details" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  {isViewOnly && quote ? (
                    <div>
                      <p className="font-medium">{getCustomerName(quote.customer_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {customers.find((c) => c.id === quote.customer_id)?.email}
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={customerId}
                      onValueChange={(v) => setCustomerId(v || "")}
                      disabled={isViewOnly}
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
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quote Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Quote Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Website Redesign Project"
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
                      <Label htmlFor="validUntil">Valid Until</Label>
                      <Input
                        id="validUntil"
                        type="date"
                        value={validUntil}
                        onChange={(e) => setValidUntil(e.target.value)}
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
                  <CardTitle className="text-base">Terms & Conditions</CardTitle>
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
              {mode === "view" && quote?.status === "sent" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRejectQuote}
                  >
                    <X className="size-4 mr-1" />
                    Mark Rejected
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAcceptQuote}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="size-4 mr-1" />
                    Mark Accepted
                  </Button>
                </div>
              )}
              {mode === "view" && quote?.status === "draft" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendQuote}
                >
                  <Send className="size-4 mr-1" />
                  Send Quote
                </Button>
              )}
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
                    <FileText className="size-4 mr-1" />
                    {saving
                      ? "Saving..."
                      : mode === "create"
                      ? "Create Quote"
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
