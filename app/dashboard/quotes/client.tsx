"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  Send,
  Trash2,
  FileText,
  CheckCircle,
  X,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Customer } from "@/types/kanban";
import type { Quote } from "@/types/agency";

interface QuotesClientProps {
  quotes: Quote[];
  customers: Customer[];
}

export default function QuotesClient({ quotes, customers }: QuotesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customers.find(c => c.id === quote.customer_id)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "sent": return "bg-blue-100 text-blue-700 border-blue-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      case "expired": return "bg-slate-100 text-slate-700 border-slate-200";
      default: return "bg-amber-100 text-amber-700 border-amber-200";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Quotes</h1>
            <p className="text-sm text-muted-foreground">
              Manage quotes and proposals
            </p>
          </div>
        </div>
        <Button>
          <Plus className="size-4 mr-1" />
          Create Quote
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
              <Input
                placeholder="Search by title or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Label className="text-sm text-muted-foreground mb-2 block">Status</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value || "all")}>
                <SelectTrigger>
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotes Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Quotes ({filteredQuotes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredQuotes.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="size-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-medium mb-2">No quotes found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your filters" 
                  : "Create your first quote to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const customer = customers.find(c => c.id === quote.customer_id);
                  return (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quote.title}</p>
                          {quote.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {quote.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer?.name || "Unknown Customer"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(quote.status)}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(quote.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        £{quote.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium size-8 hover:bg-accent hover:text-accent-foreground">
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="size-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="size-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="size-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="size-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            {quote.status === "sent" && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="size-4 mr-2" />
                                  Mark Accepted
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <X className="size-4 mr-2" />
                                  Mark Rejected
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="size-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
