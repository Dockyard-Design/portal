"use client";

import { useState } from "react";
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
  CheckCircle,
  Clock,
  MoreVertical,
  Plus,
  Trash2,
  Eye,
  Download,
  Send,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import type { Customer } from "@/types/kanban";
import type { Quote, Invoice, CustomerStats } from "@/types/agency";

interface CustomerDetailProps {
  customer: Customer;
  quotes: Quote[];
  invoices: Invoice[];
  stats: CustomerStats;
}

export default function CustomerDetailPage({ 
  customer, 
  quotes, 
  invoices, 
  stats 
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState("overview");

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

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/customers">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{customer.name}</h1>
            {customer.company && (
              <p className="text-sm text-muted-foreground">{customer.company}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/kanban">
              <LayoutGrid className="size-4 mr-1" />
              Kanban
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/customers/${customer.id}/edit`}>
              <Edit className="size-4 mr-1" />
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
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
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
              <Button><Plus className="size-4 mr-1" />Create Quote</Button>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-muted-foreground">No quotes yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotes.map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          <p className="font-medium">{quote.title}</p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getQuoteStatusColor(quote.status)}>{quote.status}</Badge>
                        </TableCell>
                        <TableCell>{format(new Date(quote.created_at), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right font-semibold">£{quote.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="size-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem><Edit className="size-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem><Download className="size-4 mr-2" />Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive"><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem>
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
              <Button><Plus className="size-4 mr-1" />Create Invoice</Button>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-muted-foreground">No invoices yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-sm text-muted-foreground">{invoice.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getInvoiceStatusColor(invoice.status)}>{invoice.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {invoice.due_date ? format(new Date(invoice.due_date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">£{invoice.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem><Eye className="size-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem><Edit className="size-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem><Download className="size-4 mr-2" />Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive"><Trash2 className="size-4 mr-2" />Delete</DropdownMenuItem>
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
    </div>
  );
}
