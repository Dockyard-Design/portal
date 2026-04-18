import { getCustomers } from "@/app/actions/kanban";
import { Button } from "@/components/ui/button";
import { Building, Plus, Mail, Briefcase } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Building className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer list
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/dashboard/work">
            <Plus className="size-4 mr-1" />
            New Customer
          </Link>
        </Button>
      </div>

      {/* Customers Grid */}
      {customers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/50 bg-card/30">
          <Building className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">No customers yet</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Create your first customer from the Work page.
          </p>
          <Button asChild>
            <Link href="/dashboard/work">Go to Work</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{customer.name}</h3>
                    {customer.company && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Briefcase className="size-3" />
                        {customer.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {customer.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <Mail className="size-3" />
                  {customer.email}
                </p>
              )}

              {customer.notes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {customer.notes}
                </p>
              )}

              <div className="mt-4 pt-3 border-t border-border/50">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/dashboard/work?customer=${customer.id}`}>
                    View Tasks
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
