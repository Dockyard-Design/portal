"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Plus,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import type { Customer } from "@/types/kanban";
import type { Invoice } from "@/types/agency";

interface InvoicesClientProps {
  invoices: Invoice[];
  customers: Customer[];
}

export default function InvoicesClient({ invoices, customers }: InvoicesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customers.find(c => c.id === invoice.customer_id)?.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <div className="w-full min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Receipt className="size-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Invoices</h1>
            <p className="text-muted-foreground">
              {filteredInvoices.length} invoices
            </p>
          </div>
        </div>
        <Button>
          <Plus className="size-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by number, title or customer..."
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <p className="text-muted-foreground mb-4">Create your first invoice</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
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
                    <TableCell>
                      {getCustomerName(invoice.customer_id)}
                    </TableCell>
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
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Eye className="size-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Download className="size-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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
    </div>
  );
}
