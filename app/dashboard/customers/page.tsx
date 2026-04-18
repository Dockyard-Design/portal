"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKanbanStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building, Plus, Mail, Briefcase, LayoutGrid, ExternalLink, ChevronDown } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  notes?: string | null;
  boards?: Board[];
  boardCount?: number;
}

interface Board {
  id: string;
  name: string;
  is_default?: boolean;
  customer_id: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const { setSelectedCustomer, setSelectedBoard } = useKanbanStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
      setLoading(false);
    }
    
    loadData();
  }, []);

  const handleOpenCustomer = (customerId: string, boardId?: string) => {
    setSelectedCustomer(customerId);
    if (boardId) {
      setSelectedBoard(boardId);
    } else {
      setSelectedBoard(null);
    }
    router.push("/dashboard/work");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Building className="size-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Customers</h1>
            <p className="text-sm text-muted-foreground">
              Manage your customer list and their kanban boards
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
      ) : customers.length === 0 ? (
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

              {/* Board Actions */}
              <div className="mt-4 pt-3 border-t border-border/50">
                {customer.boardCount && customer.boardCount > 0 ? (
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="flex-1 flex justify-between items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="flex items-center gap-1">
                          <LayoutGrid className="size-4" />
                          {customer.boardCount} board{customer.boardCount !== 1 ? 's' : ''}
                        </span>
                        <ChevronDown className="size-3 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Boards</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {customer.boards?.map((board) => (
                            <DropdownMenuItem 
                              key={board.id}
                              onClick={() => handleOpenCustomer(customer.id, board.id)}
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
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleOpenCustomer(customer.id)}
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleOpenCustomer(customer.id)}
                  >
                    <LayoutGrid className="size-4 mr-1" />
                    Create Board
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
