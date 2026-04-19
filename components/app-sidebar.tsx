"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  FolderKanban,
  Key,
  MessageSquare,
  User,
  LogOut,
  KanbanSquare,
  Building,
  ChevronRight,
  Briefcase,
  Users,
  Receipt,
  Trash2,
  AlertTriangle,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useKanbanStore, useSidebarStore } from "@/lib/store";
import { wipeDatabase } from "@/app/actions/dev-wipe";
import { getBoards, getCustomers } from "@/app/actions/kanban";
import { toast } from "sonner";
import type { Customer, KanbanBoard } from "@/types/kanban";

// Sidebar Menu Configuration
// Easy to add/remove/modify menu items here

interface SubMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  boardId?: string;
}

interface MenuGroup {
  title: string;
  icon: LucideIcon;
  items: SubMenuItem[];
}

interface SingleMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

const NAV_OVERVIEW: SingleMenuItem = {
  title: "Overview",
  href: "/dashboard",
  icon: LayoutDashboard,
};

const NAV_GROUPS: MenuGroup[] = [
  {
    title: "Dockyard",
    icon: Briefcase,
    items: [
      { title: "Projects", href: "/dashboard/projects", icon: FolderKanban },
      {
        title: "Contact Submissions",
        href: "/dashboard/contact",
        icon: MessageSquare,
      },
      {
        title: "Messaging Centre",
        href: "/dashboard/messages",
        icon: MessageSquare,
      },
      {
        title: "Expense Tracker",
        href: "/dashboard/expenses",
        icon: Receipt,
      },
    ],
  },
];

const NAV_SETTINGS: SingleMenuItem[] = [
  {
    title: "User Management",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "API",
    href: "/dashboard/api-keys",
    icon: Key,
  },
];

const ALLOWED_WIPE_EMAIL = "fredericomelogarcia@outlook.com";

function getCustomerNavGroup(
  selectedCustomerId: string | null,
  boards: KanbanBoard[],
): MenuGroup {
  const items: SubMenuItem[] = selectedCustomerId
    ? [
        ...[...boards].sort((a, b) => a.name.localeCompare(b.name)).map((board) => ({
          title: board.name,
          href: "/dashboard/kanban",
          icon: KanbanSquare,
          boardId: board.id,
        })),
        {
          title: "Messages",
          href: "/dashboard/messages",
          icon: MessageSquare,
        },
        {
          title: "Customer Details",
          href: `/dashboard/customers/${selectedCustomerId}`,
          icon: Building,
        },
      ]
    : [
        {
          title: "Select a customer",
          href: "/dashboard/customers",
          icon: Building,
        },
      ];

  return {
    title: "Customers",
    icon: Briefcase,
    items,
  };
}

export default function AppSidebar() {
  const pathname = usePathname();
  const { isLoaded, user } = useUser();
  const { openUserProfile, signOut } = useClerk();
  const { openGroups, setGroupOpen } = useSidebarStore();
  const {
    selectedCustomerId,
    selectedBoardId,
    setSelectedCustomer,
    setSelectedBoard,
    clearSelection,
  } = useKanbanStore();
  const [showWipeDialog, setShowWipeDialog] = useState(false);
  const [wipePassword, setWipePassword] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);

  // Check if user can wipe database - computed directly from user data
  const canWipe =
    isLoaded && user?.primaryEmailAddress?.emailAddress === ALLOWED_WIPE_EMAIL;

  const handleWipe = async () => {
    const result = await wipeDatabase(wipePassword);
    if (result.success) {
      toast.success(result.message);
      // Redirect to dashboard and refresh
      window.location.href = "/dashboard";
    } else {
      toast.error(result.message);
    }
    setWipePassword("");
    setShowWipeDialog(false);
  };

  // Auto-expand groups with active items on navigation
  useEffect(() => {
    [getCustomerNavGroup(selectedCustomerId, boards), ...NAV_GROUPS].forEach((group) => {
      const isGroupActive = group.items.some((item) =>
        pathname.startsWith(item.href),
      );
      if (isGroupActive) {
        setGroupOpen(group.title, true);
      }
    });
  }, [pathname, setGroupOpen, selectedCustomerId, boards]);

  useEffect(() => {
    let cancelled = false;
    getCustomers()
      .then((data) => {
        if (!cancelled) setCustomers([...data].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load customers");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!selectedCustomerId) {
      return () => {
        cancelled = true;
      };
    }

    getBoards(selectedCustomerId)
      .then((data) => {
        if (cancelled) return;
        setBoards([...data].sort((a, b) => a.name.localeCompare(b.name)));
        if (data.length > 0 && !data.some((board) => board.id === selectedBoardId)) {
          setSelectedBoard(data.find((board) => board.is_default)?.id ?? data[0].id);
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load customer boards");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId, selectedBoardId, setSelectedBoard]);

  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const navGroups = [getCustomerNavGroup(selectedCustomerId, boards), ...NAV_GROUPS];

  return (
    <Sidebar className="border-r-border/40">
      <SidebarHeader className="p-6">
        <div className="flex items-center justify-center gap-3 group cursor-pointer">
          <Image
            src="/logo.svg"
            alt="Dockyard"
            width={128}
            height={32}
            className="h-8 w-auto"
          />
        </div>
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2">
            <Select
              value={selectedCustomer && selectedCustomerId ? selectedCustomerId : ""}
              onValueChange={(value) => setSelectedCustomer(value || null)}
            >
              <SelectTrigger className="h-9 bg-background text-sm">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCustomerId && (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear customer selection"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          {selectedCustomer && (
            <p className="truncate text-xs text-muted-foreground">
              Focused on {selectedCustomer.name}
            </p>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {/* Overview - Single Item */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === NAV_OVERVIEW.href}
                className={cn(
                  "transition-all duration-200 rounded-lg h-10 px-3",
                  pathname === NAV_OVERVIEW.href
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Link
                  href={NAV_OVERVIEW.href}
                  className="flex items-center gap-3 w-full"
                >
                  <NAV_OVERVIEW.icon
                    className={cn(
                      "size-4",
                      pathname === NAV_OVERVIEW.href && "text-primary",
                    )}
                  />
                  <span className="font-medium">{NAV_OVERVIEW.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menu Groups with Submenus */}
            {navGroups.map((group) => {
              const isGroupActive = group.items.some((item) =>
                pathname.startsWith(item.href),
              );

              return (
                <Collapsible
                  key={group.title}
                  open={openGroups[group.title] ?? true}
                  onOpenChange={(open) => setGroupOpen(group.title, open)}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      className={cn(
                        "w-full flex items-center gap-3 px-3 h-10 rounded-lg cursor-pointer transition-all duration-200",
                        isGroupActive
                          ? "hover:bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                      )}
                    >
                      <group.icon
                        className={cn(
                          "size-4",
                          isGroupActive && "text-primary",
                        )}
                      />
                      <span className="font-medium flex-1 text-left">
                        {group.title}
                      </span>
                      <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const isItemActive = pathname === item.href;
                        return (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton
                              isActive={isItemActive}
                              className={cn(
                                "transition-all duration-200 rounded-md h-9",
                                isItemActive
                                  ? "bg-primary/10"
                                  : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                              )}
                              render={
                                <Link
                                  href={item.href}
                                  className="flex items-center gap-2"
                                  onClick={() => {
                                    if (item.boardId) setSelectedBoard(item.boardId);
                                  }}
                                >
                                  <item.icon
                                    className={cn(
                                      "size-4",
                                      isItemActive && "text-primary!",
                                    )}
                                  />
                                  <span>{item.title}</span>
                                </Link>
                              }
                            />
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Settings Section */}
      <div className="mt-auto px-4 pb-2">
        <SidebarMenu className="gap-1">
          {NAV_SETTINGS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                className={cn(
                  "transition-all duration-200 rounded-lg h-10 px-3",
                  pathname === item.href
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-3 w-full"
                >
                  <item.icon
                    className={cn(
                      "size-4",
                      pathname === item.href && "text-primary",
                    )}
                  />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      {/* Account Section */}
      <div className="mt-auto p-6 border-t border-border/40">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-3 w-full p-2 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors text-left cursor-pointer">
                <Avatar className="size-8">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback>
                    {user?.firstName?.[0] ??
                      user?.emailAddresses[0]?.emailAddress?.[0] ??
                      "U"}
                  </AvatarFallback>
                </Avatar>
                {isLoaded && user && (
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">
                      {user.firstName ?? user.username ?? "Account"}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user.emailAddresses[0]?.emailAddress ?? ""}
                    </span>
                  </div>
                )}
              </button>
            }
          />
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => openUserProfile()}
              className="gap-2"
            >
              <User className="size-4" />
              Account
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ redirectUrl: "/" })}
              className="gap-2 text-destructive"
            >
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
            {canWipe && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowWipeDialog(true)}
                  className="gap-2 text-destructive"
                >
                  <Trash2 className="size-4" />
                  Wipe Database
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showWipeDialog} onOpenChange={(open) => {
          setShowWipeDialog(open);
          if (!open) setWipePassword("");
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Wipe Database?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete ALL data from all application
                tables. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">
                Enter your password to confirm:
              </label>
              <Input
                type="password"
                value={wipePassword}
                onChange={(e) => setWipePassword(e.target.value)}
                placeholder="Your password..."
                className="w-full"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setWipePassword("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleWipe}
                disabled={!wipePassword}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                Wipe Database
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
