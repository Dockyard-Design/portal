"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useKanbanStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Building, 
  Plus, 
  Mail, 
  Briefcase, 
  LayoutGrid, 
  ChevronDown,
  Search,
  ArrowRight,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Customer, KanbanBoard } from "@/types/kanban";

interface CustomerWithBoards extends Customer {
  boards: KanbanBoard[];
  boardCount: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const { setSelectedCustomer, setSelectedBoard } = useKanbanStore();
  const [customers, setCustomers] = useState<CustomerWithBoards[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    company: "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { getCustomers, getBoards } = await import("@/app/actions/kanban");
      const customersData = await getCustomers();

      const customersWithBoards = await Promise.all(
        customersData.map(async (customer: Customer) => {
          const boards = await getBoards(customer.id);
          return {
            ...customer,
            boards,
            boardCount: boards.length,
          };
        })
      );

      setCustomers(customersWithBoards);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    
    const query = searchQuery.toLowerCase();
    return customers.filter((customer) => 
      customer.name.toLowerCase().includes(query) ||
      customer.company?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleOpenKanban = (customerId: string, boardId?: string) => {
    setSelectedCustomer(customerId);
    if (boardId) {
      setSelectedBoard(boardId);
    } else {
      setSelectedBoard(null);
    }
    router.push("/dashboard/kanban");
  };

  const handleCreateCustomer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !customerForm.firstName.trim() ||
      !customerForm.lastName.trim() ||
      !customerForm.email.trim() ||
      !customerForm.company.trim()
    ) {
      return;
    }

    setIsCreatingCustomer(true);
    try {
      const { createCustomer } = await import("@/app/actions/kanban");
      const customer = await createCustomer({
        first_name: customerForm.firstName.trim(),
        last_name: customerForm.lastName.trim(),
        phone: customerForm.phone.trim() || undefined,
        email: customerForm.email.trim() || undefined,
        company: customerForm.company.trim(),
        notes: customerForm.notes.trim() || undefined,
      });

      setCustomerForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        company: "",
        notes: "",
      });
      setIsCustomerDialogOpen(false);
      setSelectedCustomer(customer.id);
      window.dispatchEvent(new CustomEvent("customers:changed"));
      await loadData();
      router.refresh();
      toast.success(`${customer.name} created`);
    } catch {
      toast.error("Failed to create customer");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Building className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer list and their kanban boards
            </p>
          </div>
        </div>

        <Button onClick={() => setIsCustomerDialogOpen(true)}>
            <Plus className="size-4 mr-1" />
            New Customer
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, company, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-start gap-3 mb-3">
                <div className="size-10 rounded-lg bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-5 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </div>
              <div className="h-4 bg-muted animate-pulse rounded mb-3 w-1/2" />
              <div className="mt-4 pt-3 border-t border-border/50">
                <div className="h-9 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-xl border border-dashed border-border/50 bg-card/30">
          <Building className="size-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? "No matching customers" : "No customers yet"}
          </h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {searchQuery 
              ? "Try adjusting your search terms" 
              : "Create your first customer from the kanban page."}
          </p>
          {!searchQuery && (
            <Button onClick={() => setIsCustomerDialogOpen(true)}>
              <Plus className="size-4 mr-1" />
              New Customer
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
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
                    <Link 
                      href={`/dashboard/customers/${customer.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {customer.name}
                    </Link>
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

              {/* Actions Row */}
              <div className="mt-4 pt-3 border-t border-border/50 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  asChild
                >
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <FileText className="size-4 mr-1" />
                    Details
                    <ArrowRight className="size-3 ml-auto" />
                  </Link>
                </Button>
                
                {/* Board Dropdown */}
                {customer.boardCount && customer.boardCount > 0 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium border rounded-md"
                    >
                      <LayoutGrid className="size-4" />
                      {customer.boardCount}
                      <ChevronDown className="size-3 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Boards</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {customer.boards?.map((board: KanbanBoard) => (
                          <DropdownMenuItem 
                            key={board.id}
                            onClick={() => handleOpenKanban(customer.id, board.id)}
                          >
                            <span className="flex-1 truncate">{board.name}</span>
                            {board.is_default && (
                              <Badge variant="secondary" className="text-xs ml-2">Default</Badge>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenKanban(customer.id)}
                  >
                    <LayoutGrid className="size-4 mr-1" />
                    Board
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Add the customer details, then continue to their customer workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="customer-first-name">First Name</Label>
                <Input
                  id="customer-first-name"
                  value={customerForm.firstName}
                  onChange={(event) =>
                    setCustomerForm((current) => ({ ...current, firstName: event.target.value }))
                  }
                  placeholder="First name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer-last-name">Last Name</Label>
                <Input
                  id="customer-last-name"
                  value={customerForm.lastName}
                  onChange={(event) =>
                    setCustomerForm((current) => ({ ...current, lastName: event.target.value }))
                  }
                  placeholder="Last name"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerForm.email}
                onChange={(event) =>
                  setCustomerForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="client@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-phone">Phone Number</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerForm.phone}
                onChange={(event) =>
                  setCustomerForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+44 20 0000 0000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-company">Company</Label>
              <Input
                id="customer-company"
                value={customerForm.company}
                onChange={(event) =>
                  setCustomerForm((current) => ({ ...current, company: event.target.value }))
                }
                placeholder="Company name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer-notes">Notes</Label>
              <Textarea
                id="customer-notes"
                value={customerForm.notes}
                onChange={(event) =>
                  setCustomerForm((current) => ({ ...current, notes: event.target.value }))
                }
                rows={3}
                placeholder="Context, requirements, or relationship notes"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomerDialogOpen(false)}
                disabled={isCreatingCustomer}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isCreatingCustomer ||
                  !customerForm.firstName.trim() ||
                  !customerForm.lastName.trim() ||
                  !customerForm.email.trim() ||
                  !customerForm.company.trim()
                }
              >
                {isCreatingCustomer ? "Creating..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
