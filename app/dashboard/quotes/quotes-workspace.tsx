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
import { format } from "date-fns";
import type { Customer } from "@/types/kanban";
import type { Quote } from "@/types/agency";
import type { UserRole } from "@/types/auth";
import { acceptQuote, rejectQuote, sendQuoteToCustomer } from "@/app/actions/agency";
import { QuoteModal } from "@/app/dashboard/components/quote-modal-v2";
import { PdfViewDialog } from "@/app/dashboard/components/pdf-view-dialog";
import { toast } from "sonner";

export interface QuotesWorkspaceProps {
  quotes: Quote[];
  customers: Customer[];
  role: UserRole;
  selectedCustomerId?: string;
}

export function QuotesWorkspace({
  quotes,
  customers,
  role,
  selectedCustomerId,
}: QuotesWorkspaceProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteModalMode, setQuoteModalMode] = useState<"create" | "edit" | "view">("create");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [pdfQuote, setPdfQuote] = useState<Quote | null>(null);
  const router = useRouter();
  const isCustomerRole = role === "customer";

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.description ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customers.find(c => c.id === quote.customer_id)?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customers.find(c => c.id === quote.customer_id)?.company ?? "").toLowerCase().includes(searchQuery.toLowerCase());
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

  const getStatusLabel = (status: string) => {
    if (isCustomerRole && status === "sent") return "Waiting";
    return status;
  };

  const handleSendQuote = async (quoteId: string) => {
    setSendingId(quoteId);
    try {
      await sendQuoteToCustomer(quoteId);
      toast.success("Quote sent to customer");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send quote");
    } finally {
      setSendingId(null);
    }
  };

  const handleAcceptQuote = async (quoteId: string) => {
    setActionId(quoteId);
    try {
      await acceptQuote(quoteId);
      toast.success("Quote accepted and invoice generated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept quote");
    } finally {
      setActionId(null);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    setActionId(quoteId);
    try {
      await rejectQuote(quoteId);
      toast.success("Quote rejected");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reject quote");
    } finally {
      setActionId(null);
    }
  };

  const openPdf = (quoteId: string) => {
    window.open(`/api/pdf/quote/${quoteId}`, "_blank", "noopener,noreferrer");
  };

  const openPdfModal = (quote: Quote) => {
    setPdfQuote(quote);
  };

  const openViewQuote = (quote: Quote) => {
    setSelectedQuote(quote);
    setQuoteModalMode("view");
    setQuoteModalOpen(true);
  };

  const openEditQuote = (quote: Quote) => {
    router.push(`/dashboard/quotes/${quote.id}/edit`);
  };

  const refreshData = () => {
    router.refresh();
  };

  const selectedCustomer = selectedCustomerId
    ? customers.find((customer) => customer.id === selectedCustomerId)
    : null;
  const canCustomerAcceptQuote = (quote: Quote) => {
    if (quote.status !== "sent") return false;
    if (!quote.valid_until) return true;
    const validUntil = new Date(quote.valid_until);
    validUntil.setHours(23, 59, 59, 999);
    return validUntil.getTime() >= Date.now();
  };
  const canAdminSendQuote = (quote: Quote) => quote.status !== "accepted";
  const canAdminEditQuote = (quote: Quote) =>
    quote.status === "draft" || quote.status === "rejected";

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
              {selectedCustomer
                ? `Quotes for ${selectedCustomer.name}`
                : isCustomerRole
                ? "Review proposals and respond when you are ready"
                : "Manage quotes and proposals"}
            </p>
          </div>
        </div>
        {!isCustomerRole && (
          <Button asChild>
            <Link href={`/dashboard/quotes/new${selectedCustomerId ? `?customerId=${selectedCustomerId}` : ""}`}>
              <Plus className="size-4 mr-1" />
              Create Quote
            </Link>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm text-muted-foreground mb-2 block">Search</Label>
              <Input
                placeholder="Search by quote or customer name..."
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
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="draft">draft</SelectItem>
                  <SelectItem value="sent">{isCustomerRole ? "Waiting" : "sent"}</SelectItem>
                  <SelectItem value="accepted">accepted</SelectItem>
                  <SelectItem value="rejected">rejected</SelectItem>
                  <SelectItem value="expired">expired</SelectItem>
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
                  {!isCustomerRole && <TableHead>Customer</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className={isCustomerRole ? "w-44 text-right" : "w-10"}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => {
                  const customer = customers.find(c => c.id === quote.customer_id);
                  return (
                    <TableRow
                      key={quote.id}
                      role={isCustomerRole ? "button" : undefined}
                      tabIndex={isCustomerRole ? 0 : undefined}
                      className={isCustomerRole ? "cursor-pointer" : undefined}
                      onClick={
                        isCustomerRole
                          ? () => openPdfModal(quote)
                          : undefined
                      }
                      onKeyDown={
                        isCustomerRole
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                openPdfModal(quote);
                              }
                            }
                          : undefined
                      }
                    >
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
                      {!isCustomerRole && (
                        <TableCell>
                          {customer?.name || "Unknown Customer"}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={getStatusColor(quote.status)}>
                          {getStatusLabel(quote.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(quote.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        £{quote.total.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={isCustomerRole ? "text-right" : undefined}
                        onClick={isCustomerRole ? (event) => event.stopPropagation() : undefined}
                        onKeyDown={isCustomerRole ? (event) => event.stopPropagation() : undefined}
                      >
                        {!isCustomerRole && quote.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleSendQuote(quote.id)}
                            disabled={sendingId === quote.id}
                            className="mr-2"
                          >
                            <Send className="mr-2 size-4" />
                            {sendingId === quote.id ? "Sending..." : "Send"}
                          </Button>
                        )}
                        {isCustomerRole ? (
                          canCustomerAcceptQuote(quote) && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => void handleAcceptQuote(quote.id)}
                                disabled={actionId === quote.id}
                              >
                                <CheckCircle className="mr-2 size-4" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleRejectQuote(quote.id)}
                                disabled={actionId === quote.id}
                              >
                                <X className="mr-2 size-4" />
                                Reject
                              </Button>
                            </div>
                          )
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium size-8 hover:bg-accent hover:text-accent-foreground">
                              <MoreVertical className="size-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => openViewQuote(quote)}>
                                <Eye className="size-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <>
                                {canAdminEditQuote(quote) && (
                                  <DropdownMenuItem onClick={() => openEditQuote(quote)}>
                                    <FileText className="size-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {quote.status === "sent" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => void handleAcceptQuote(quote.id)}
                                      disabled={actionId === quote.id}
                                    >
                                      <CheckCircle className="size-4 mr-2" />
                                      Accept Quote
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => void handleRejectQuote(quote.id)}
                                      disabled={actionId === quote.id}
                                    >
                                      <X className="size-4 mr-2" />
                                      Reject Quote
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuItem onClick={() => openPdf(quote.id)}>
                                  <Download className="size-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                {canAdminSendQuote(quote) && (
                                  <DropdownMenuItem
                                    onClick={() => void handleSendQuote(quote.id)}
                                    disabled={sendingId === quote.id}
                                  >
                                    <Send className="size-4 mr-2" />
                                    {sendingId === quote.id ? "Sending..." : "Send Message"}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  <Trash2 className="size-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <QuoteModal
        quote={selectedQuote}
        customers={customers}
        preselectedCustomerId={selectedCustomerId ?? null}
        mode={quoteModalMode}
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        onSuccess={refreshData}
        role={role}
      />
      <PdfViewDialog
        open={Boolean(pdfQuote)}
        onOpenChange={(open) => {
          if (!open) setPdfQuote(null);
        }}
        title={pdfQuote?.title ?? "Quote PDF"}
        pdfUrl={pdfQuote ? `/api/pdf/quote/${pdfQuote.id}` : null}
      />
    </div>
  );
}
