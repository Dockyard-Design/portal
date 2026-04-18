import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building,
  Mail,
  Briefcase,
  Edit,
  ArrowLeft,
  FileText,
  Receipt,
  LayoutGrid,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getCustomer } from "@/app/actions/kanban";
import { getQuotes, getInvoices, getCustomerStats } from "@/app/actions/agency";
import type { Customer } from "@/types/kanban";
import type { Quote, Invoice, CustomerStats } from "@/types/agency";

interface CustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerPageProps) {
  const { id } = await params;
  
  const [customer, quotes, invoices, stats] = await Promise.all([
    getCustomer(id),
    getQuotes(id),
    getInvoices(id),
    getCustomerStats(id),
  ]);

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
            <Link href="/dashboard/work">
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
            <p className="text-xs text-muted-foreground">
              {stats.quotesAccepted} accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="size-4" />
              <span className="text-sm">Invoices</span>
            </div>
            <p className="text-2xl font-semibold">{stats.totalInvoices}</p>
            <p className="text-xs text-muted-foreground">
              {stats.invoicesPaid} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <DollarSign className="size-4" />
              <span className="text-sm">Revenue</span>
            </div>
            <p className="text-2xl font-semibold">
              £{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Total received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="size-4" />
              <span className="text-sm">Outstanding</span>
            </div>
            <p className="text-2xl font-semibold">
              £{stats.outstandingBalance.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats.invoicesOverdue} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotes">Quotes ({quotes.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="size-4" />
                  Contact Information
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
                    <p className="font-medium">{customer.email}</p>
                  </div>
                )}
                {customer.company && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{customer.company}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {quotes.length === 0 && invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-3">
                    {quotes.slice(0, 3).map((quote) => (
                      <div key={quote.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{quote.title}</p>
                          <p className="text-xs text-muted-foreground">Quote</p>
                        </div>
                        <Badge variant={getQuoteStatusVariant(quote.status)}>
                          {quote.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="quotes">
          <QuotesList quotes={quotes} customerId={customer.id} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesList invoices={invoices} customerId={customer.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getQuoteStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "accepted":
      return "default";
    case "sent":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

// Quotes List Component
function QuotesList({ quotes, customerId }: { quotes: Quote[]; customerId: string }) {
  if (quotes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Receipt className="size-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-medium mb-2">No quotes yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first quote for this customer.
        </p>
        <Button>Create Quote</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">All Quotes</h3>
        <Button>Create Quote</Button>
      </div>
      
      <div className="grid gap-4">
        {quotes.map((quote) => (
          <Card key={quote.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{quote.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${quote.total.toLocaleString()}
                  </p>
                  <Badge variant={getQuoteStatusVariant(quote.status)}>
                    {quote.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Invoices List Component
function InvoicesList({ invoices, customerId }: { invoices: Invoice[]; customerId: string }) {
  const getInvoiceStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "paid":
        return "default";
      case "sent":
        return "secondary";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (invoices.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="size-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-medium mb-2">No invoices yet</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create your first invoice for this customer.
        </p>
        <Button>Create Invoice</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">All Invoices</h3>
        <Button>Create Invoice</Button>
      </div>
      
      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <Badge variant={getInvoiceStatusVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {invoice.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${invoice.total.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due {invoice.due_date 
                      ? new Date(invoice.due_date).toLocaleDateString() 
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
