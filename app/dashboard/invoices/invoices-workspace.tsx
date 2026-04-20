"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Receipt,
  MoreVertical,
  Eye,
  Download,
  Send,
  Trash2,
  Edit,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import type { Customer } from "@/types/kanban";
import type { Invoice, Quote } from "@/types/agency";
import type { UserRole } from "@/types/auth";
import { payInvoice, sendInvoiceToCustomer } from "@/app/actions/agency";
import { InvoiceModal } from "@/app/dashboard/components/invoice-modal-v2";
import { PdfViewDialog } from "@/app/dashboard/components/pdf-view-dialog";
import { toast } from "sonner";

export interface InvoicesWorkspaceProps {
  invoices: Invoice[];
  quotes: Quote[];
  customers: Customer[];
  role: UserRole;
  selectedCustomerId?: string;
}

export function InvoicesWorkspace({
  invoices,
  quotes,
  customers,
  role,
  selectedCustomerId,
}: InvoicesWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalMode, setInvoiceModalMode] = useState<"edit" | "view">("view");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pdfInvoice, setPdfInvoice] = useState<Invoice | null>(null);
  const router = useRouter();
  const isCustomerRole = role === "customer";

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customers.find(c => c.id === invoice.customer_id)?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customers.find(c => c.id === invoice.customer_id)?.company ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "partial": return "bg-amber-100 text-amber-700 border-amber-200";
      case "overdue": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || "Unknown";
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setSendingId(invoiceId);
    try {
      await sendInvoiceToCustomer(invoiceId);
      toast.success("Invoice sent to customer");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invoice");
    } finally {
      setSendingId(null);
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    alert("Payment placeholder: this will be replaced with a real payment flow.");
    setPayingId(invoiceId);
    try {
      await payInvoice(invoiceId);
      toast.success("Invoice marked as paid");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to pay invoice");
    } finally {
      setPayingId(null);
    }
  };

  const openPdf = (invoiceId: string) => {
    window.open(`/api/pdf/invoice/${invoiceId}`, "_blank", "noopener,noreferrer");
  };

  const openPdfModal = (invoice: Invoice) => {
    setPdfInvoice(invoice);
  };

  const openViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceModalMode("view");
    setInvoiceModalOpen(true);
  };

  const openEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setInvoiceModalMode("edit");
    setInvoiceModalOpen(true);
  };

  const refreshData = () => {
    router.refresh();
  };

  const selectedCustomer = selectedCustomerId
    ? customers.find((customer) => customer.id === selectedCustomerId)
    : null;

  return (
    <div className="w-full min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Receipt className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Invoices</h1>
            <p className="text-muted-foreground">
              {selectedCustomer
                ? `${filteredInvoices.length} invoices for ${selectedCustomer.name}`
                : isCustomerRole
                ? `${filteredInvoices.length} invoices available to view or pay`
                : `${filteredInvoices.length} invoices`}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference or invoice and name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Label className="text-sm text-muted-foreground mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="sent">sent</SelectItem>
                  <SelectItem value="paid">paid</SelectItem>
                  <SelectItem value="partial">partial</SelectItem>
                  <SelectItem value="overdue">overdue</SelectItem>
                  <SelectItem value="cancelled">cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Receipt className="size-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-4">
                {isCustomerRole ? "No invoices are ready for you yet." : "No invoices match the current view."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  {!isCustomerRole && <TableHead>Customer</TableHead>}
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <span className="font-medium">{invoice.invoice_number}</span>
                    </TableCell>
                    {!isCustomerRole && (
                      <TableCell>
                        {getCustomerName(invoice.customer_id)}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className="text-sm">{invoice.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.due_date 
                        ? format(new Date(invoice.due_date), "MMM d, yyyy")
                        : "—"
                      }
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      £{invoice.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium size-8 hover:bg-accent hover:text-accent-foreground">
                          <MoreVertical className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => isCustomerRole ? openPdfModal(invoice) : openViewInvoice(invoice)}>
                            <Eye className="size-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {isCustomerRole ? (
                            invoice.status !== "paid" && invoice.status !== "cancelled" && (
                              <DropdownMenuItem
                                onClick={() => void handlePayInvoice(invoice.id)}
                                disabled={payingId === invoice.id}
                              >
                                <CreditCard className="size-4 mr-2" />
                                {payingId === invoice.id ? "Paying..." : "Pay"}
                              </DropdownMenuItem>
                            )
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => openEditInvoice(invoice)}>
                                <Edit className="size-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openPdf(invoice.id)}>
                                <Download className="size-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => void handleSendInvoice(invoice.id)}
                                disabled={sendingId === invoice.id}
                              >
                                <Send className="size-4 mr-2" />
                                {sendingId === invoice.id ? "Sending..." : "Send Email"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="size-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <InvoiceModal
        invoice={selectedInvoice}
        customers={customers}
        quotes={quotes}
        preselectedCustomerId={selectedCustomerId ?? null}
        mode={invoiceModalMode}
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        onSuccess={refreshData}
        role={role}
      />
      <PdfViewDialog
        open={Boolean(pdfInvoice)}
        onOpenChange={(open) => {
          if (!open) setPdfInvoice(null);
        }}
        title={pdfInvoice?.invoice_number ?? "Invoice PDF"}
        pdfUrl={pdfInvoice ? `/api/pdf/invoice/${pdfInvoice.id}` : null}
      />
    </div>
  );
}
