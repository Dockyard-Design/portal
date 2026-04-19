"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Building,
  Mail,
  Briefcase,
  Edit,
  ArrowLeft,
  FileText,
  Receipt,
  LayoutGrid,
  PoundSterling,
  Clock,
  MoreVertical,
  Plus,
  Trash2,
  Eye,
  Download,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { QuoteModal } from "../../components/quote-modal";
import { InvoiceModal } from "../../components/invoice-modal";
import type { Customer } from "@/types/kanban";
import type { Quote, Invoice, CustomerStats } from "@/types/agency";

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Modal states
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceModalMode, setInvoiceModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => { loadData(); }, [customerId]);

  async function loadData() {
    setLoading(true);
    try {
      const { getCustomer, getCustomers } = await import("@/app/actions/kanban");
      const { getQuotes, getInvoices, getCustomerStats } = await import("@/app/actions/agency");
      
      const [customerData, customersData, quotesData, invoicesData, statsData] = await Promise.all([
        getCustomer(customerId),
        getCustomers(),
        getQuotes(customerId),
        getInvoices(customerId),
        getCustomerStats(customerId),
      ]);
      
      if (!customerData) {
        notFound();
        return;
      }
      
      setCustomer(customerData);
      setAllCustomers(customersData);
      setQuotes(quotesData);
      setInvoices(invoicesData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading customer data:", error);
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  }

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "expired": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "partial": return "bg-amber-100 text-amber-700 border-amber-200";
      case "overdue": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    try {
      const { deleteQuote } = await import("@/app/actions/agency");
      await deleteQuote(quoteId);
      toast.success("Quote deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete quote");
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const { deleteInvoice } = await import("@/app/actions/agency");
      await deleteInvoice(invoiceId);
      toast.success("Invoice deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  const generatePDF = async (type: "quote" | "invoice", id: string) => {
    window.open(`/api/pdf/${type}/${id}`, "_blank");
  };

  // Modal handlers
  const openCreateQuote = () => {
    setSelectedQuote(null);
    setQuoteModalMode("create");
    setQuoteModalOpen(true);
  };

  const openViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuoteModalMode("view");
    setQuoteModalOpen(true);
  };

  const openEditQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuoteModalMode("edit");
    setQuoteModalOpen(true);
  };

  const openCreateInvoice = () => {
    setSelectedInvoice(null);
    setInvoiceModalMode("create");
    setInvoiceModalOpen(true);
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

  if (loading) {
    return (
      <div className="w-full min-h-screen p-6 space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
        <div className="h-32 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!customer || !stats) {
    return notFound();
  }

  return (
    <div className="w-full min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">{customer.name}</h1>
            {customer.company && (
              <p className="text-muted-foreground">{customer.company}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/kanban">
              <LayoutGrid className="size-4 mr-2" />
              Kanban
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Edit className="size-4 mr-2" />
              Edit Customer
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Receipt className="size-4" />
              <span className="text-sm">Quotes</span>
            </div>
            <p className="text-2xl font-semibold">{stats.totalQuotes}</p>
            <p className="text-xs text-muted-foreground">{stats.quotesAccepted} accepted</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="size-4" />
              <span className="text-sm">Invoices</span>
            </div>
            <p className="text-2xl font-semibold">{stats.totalInvoices}</p>
            <p className="text-xs text-muted-foreground">{stats.invoicesPaid} paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <PoundSterling className="size-4" />
              <span className="text-sm">Revenue</span>
            </div>
            <p className="text-2xl font-semibold">£{stats.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="size-4" />
              <span className="text-sm">Outstanding</span>
            </div>
            <p className="text-2xl font-semibold">£{stats.outstandingBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="w-full justify-start h-auto p-0 bg-transparent border-b border-border/50 rounded-none">
          <TabsTrigger value="overview" className="gap-2 rounded-none border-b-2 border-transparent data-[active]:border-primary data-[active]:bg-transparent data-[active]:shadow-none px-4 py-3">
            <Building className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2 rounded-none border-b-2 border-transparent data-[active]:border-primary data-[active]:bg-transparent data-[active]:shadow-none px-4 py-3">
            <Receipt className="size-4" />
            Quotes ({quotes.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2 rounded-none border-b-2 border-transparent data-[active]:border-primary data-[active]:bg-transparent data-[active]:shadow-none px-4 py-3">
            <FileText className="size-4" />
            Invoices ({invoices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="size-4" />Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                {customer.email && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="size-4 text-muted-foreground" />
                      <p className="font-medium">{customer.email}</p>
                    </div>
                  </div>
                )}
                {customer.company && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Company</p>
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-4 text-muted-foreground" />
                      <p className="font-medium">{customer.company}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Quotes</span>
                  <span className="font-semibold">{stats.totalQuotes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Invoiced</span>
                  <span className="font-semibold">£{stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Outstanding</span>
                  <span className="font-semibold text-amber-600">£{stats.outstandingBalance.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quotes</CardTitle>
              <Button onClick={openCreateQuote}><Plus className="size-4 mr-1" />Create Quote</Button>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-muted-foreground">No quotes yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Quote</TableHead>
                      <TableHead className="w-[15%]">Status</TableHead>
                      <TableHead className="w-[15%]">Date</TableHead>
                      <TableHead className="w-[15%] text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <button onClick={() => openViewQuote(quote)} className="text-left w-full">
                            <p className="font-medium hover:text-primary transition-colors">{quote.title}</p>
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge className={getQuoteStatusColor(quote.status)}>{quote.status}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(quote.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right font-semibold">£{quote.total.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium size-8 hover:bg-accent hover:text-accent-foreground">
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openViewQuote(quote)}><Eye className="size-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditQuote(quote)}><Edit className="size-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => generatePDF("quote", quote.id)}><Download className="size-4 mr-2" />Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteQuote(quote.id)}><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem>
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
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <Button onClick={openCreateInvoice}><Plus className="size-4 mr-1" />Create Invoice</Button>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-muted-foreground">No invoices yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Invoice #</TableHead>
                      <TableHead className="w-[15%]">Status</TableHead>
                      <TableHead className="w-[15%]">Due Date</TableHead>
                      <TableHead className="w-[15%] text-right">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <button onClick={() => openViewInvoice(invoice)} className="text-left w-full">
                            <p className="font-medium hover:text-primary transition-colors">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">{invoice.title}</p>
                          </button>
                        </TableCell>
                        <TableCell>
                          <Badge className={getInvoiceStatusColor(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell>{invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "-"}</TableCell>
                        <TableCell className="text-right font-semibold">£{invoice.total.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium size-8 hover:bg-accent hover:text-accent-foreground">
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openViewInvoice(invoice)}><Eye className="size-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditInvoice(invoice)}><Edit className="size-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => generatePDF("invoice", invoice.id)}><Download className="size-4 mr-2" />Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteInvoice(invoice.id)}><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem>
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
        </TabsContent>
      </Tabs>

      {/* Quote Modal */}
      <QuoteModal
        quote={selectedQuote}
        customers={allCustomers}
        preselectedCustomerId={customerId}
        mode={quoteModalMode}
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        onSuccess={loadData}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        invoice={selectedInvoice}
        customers={allCustomers}
        quotes={quotes}
        preselectedCustomerId={customerId}
        mode={invoiceModalMode}
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
