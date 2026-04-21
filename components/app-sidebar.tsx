"use client";

import { useCallback, useEffect, useState } from "react";
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
  FileText,
  Settings,
  Trash2,
  AlertTriangle,
  X,
  Check,
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
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useKanbanStore, useSidebarStore } from "@/lib/store";
import { wipeDatabase } from "@/app/actions/dev-wipe";
import { getBoards, getCustomers } from "@/app/actions/kanban";
import { getUnreadMessageCount } from "@/app/actions/messaging";
import { getUnreadContactSubmissionCount } from "@/app/actions/contact";
import { toast } from "sonner";
import type { UserRole } from "@/types/auth";
import type { Customer } from "@/types/kanban";

// Sidebar Menu Configuration
// Easy to add/remove/modify menu items here

interface SubMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  boardId?: string;
  items?: SubMenuItem[];
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

const NAV_MESSAGES: SingleMenuItem = {
  title: "Messaging Centre",
  href: "/dashboard/messages",
  icon: MessageSquare,
};

const NAV_QUOTES: SingleMenuItem = {
  title: "Quotes",
  href: "/dashboard/quotes",
  icon: Receipt,
};

const NAV_INVOICES: SingleMenuItem = {
  title: "Invoices",
  href: "/dashboard/invoices",
  icon: FileText,
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
        title: "Expenses",
        href: "/dashboard/expenses",
        icon: Receipt,
      },
      {
        title: "Reports",
        href: "/dashboard/reports",
        icon: LayoutDashboard,
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

function getCustomerLabel(customer: Customer | undefined): string {
  return customer?.company || customer?.name || "Selected customer";
}

function getCustomerNavGroup(
  selectedCustomerId: string | null,
  selectedCustomer: Customer | undefined,
  boards: Array<{ id: string; name: string; is_default: boolean }>,
): MenuGroup | SingleMenuItem {
  if (!selectedCustomerId) {
    return {
      title: "Customers",
      href: "/dashboard/customers",
      icon: Briefcase,
    };
  }

  const items: SubMenuItem[] = [];

  items.push({
    title: "Details",
    href: `/dashboard/customers/${selectedCustomerId}`,
    icon: Building,
    items: [
      {
        title: "Quotes",
        href: `/dashboard/quotes?customerId=${selectedCustomerId}`,
        icon: Receipt,
      },
      {
        title: "Invoices",
        href: `/dashboard/invoices?customerId=${selectedCustomerId}`,
        icon: FileText,
      },
      {
        title: "Kanban Board",
        href: "/dashboard/kanban",
        icon: KanbanSquare,
        items: boards.map((board) => ({
          title: board.name,
          href: "/dashboard/kanban",
          icon: KanbanSquare,
          boardId: board.id,
        })),
      },
    ],
  });

  return {
    title: getCustomerLabel(selectedCustomer),
    icon: Briefcase,
    items,
  };
}

function getRoutePath(href: string): string {
  return href.split("?")[0] ?? href;
}

export default function AppSidebar({
  initialUnreadMessageCount,
  initialUnreadContactSubmissionCount,
  role,
}: {
  initialUnreadMessageCount: number;
  initialUnreadContactSubmissionCount: number;
  role: UserRole;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
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
  const [selectedCustomerBoards, setSelectedCustomerBoards] = useState<
    Array<{ id: string; name: string; is_default: boolean }>
  >([]);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(
    initialUnreadMessageCount,
  );
  const [unreadContactSubmissionCount, setUnreadContactSubmissionCount] =
    useState(initialUnreadContactSubmissionCount);
  const [showPasswordChangePrompt, setShowPasswordChangePrompt] =
    useState(false);
  const isCustomerRole = role === "customer";
  const isSubMenuItemActive = useCallback(
    (item: SubMenuItem) =>
      pathname === getRoutePath(item.href) ||
      item.items?.some(
        (nestedItem) => pathname === getRoutePath(nestedItem.href),
      ) === true,
    [pathname],
  );

  // Check if user can wipe database - computed directly from user data
  const canWipe =
    !isCustomerRole &&
    isLoaded &&
    user?.primaryEmailAddress?.emailAddress === ALLOWED_WIPE_EMAIL;

  useEffect(() => {
    if (!isLoaded || !user || !isCustomerRole) return;

    const metadata = user.publicMetadata as {
      initialPasswordChangeRequired?: unknown;
      firstLoginAt?: unknown;
    };

    if (metadata.initialPasswordChangeRequired === true) {
      setShowPasswordChangePrompt(true);
    }

  }, [isCustomerRole, isLoaded, user]);

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
    if (isCustomerRole) return;

    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedCustomerId,
    );
    const customerNavGroup = getCustomerNavGroup(
      selectedCustomerId,
      selectedCustomer,
      selectedCustomerBoards,
    );
    const groupsToExpand =
      "items" in customerNavGroup
        ? [customerNavGroup, ...NAV_GROUPS]
        : NAV_GROUPS;

    groupsToExpand.forEach((group) => {
      const isGroupActive = group.items.some((item) =>
        isSubMenuItemActive(item),
      );
      if (isGroupActive) {
        setGroupOpen(group.title, true);
      }
    });
  }, [
    customers,
    isCustomerRole,
    isSubMenuItemActive,
    selectedCustomerBoards,
    setGroupOpen,
    selectedCustomerId,
  ]);

  const refreshUnreadMessageCount = useCallback(() => {
    getUnreadMessageCount()
      .then(setUnreadMessageCount)
      .catch(() => {
        setUnreadMessageCount(0);
      });
  }, []);

  useEffect(() => {
    setUnreadMessageCount(initialUnreadMessageCount);
  }, [initialUnreadMessageCount]);

  useEffect(() => {
    refreshUnreadMessageCount();
  }, [pathname, refreshUnreadMessageCount]);

  const refreshUnreadContactSubmissionCount = useCallback(() => {
    if (isCustomerRole) return;
    getUnreadContactSubmissionCount()
      .then(setUnreadContactSubmissionCount)
      .catch(() => {
        setUnreadContactSubmissionCount(0);
      });
  }, [isCustomerRole]);

  useEffect(() => {
    setUnreadContactSubmissionCount(initialUnreadContactSubmissionCount);
  }, [initialUnreadContactSubmissionCount]);

  useEffect(() => {
    refreshUnreadContactSubmissionCount();
  }, [pathname, refreshUnreadContactSubmissionCount]);

  useEffect(() => {
    if (isCustomerRole) return;
    window.addEventListener("focus", refreshUnreadContactSubmissionCount);
    window.addEventListener(
      "contact-submissions:changed",
      refreshUnreadContactSubmissionCount,
    );

    return () => {
      window.removeEventListener("focus", refreshUnreadContactSubmissionCount);
      window.removeEventListener(
        "contact-submissions:changed",
        refreshUnreadContactSubmissionCount,
      );
    };
  }, [isCustomerRole, refreshUnreadContactSubmissionCount]);

  useEffect(() => {
    window.addEventListener("focus", refreshUnreadMessageCount);
    window.addEventListener("messages:changed", refreshUnreadMessageCount);

    return () => {
      window.removeEventListener("focus", refreshUnreadMessageCount);
      window.removeEventListener("messages:changed", refreshUnreadMessageCount);
    };
  }, [refreshUnreadMessageCount]);

  const loadCustomers = useCallback(() => {
    if (isCustomerRole) {
      setCustomers([]);
      return () => {};
    }

    let cancelled = false;
    getCustomers()
      .then((data) => {
        if (!cancelled)
          setCustomers([...data].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load customers");
      });

    return () => {
      cancelled = true;
    };
  }, [isCustomerRole]);

  useEffect(() => loadCustomers(), [loadCustomers]);

  useEffect(() => {
    const handleCustomersChanged = () => {
      loadCustomers();
    };

    window.addEventListener("customers:changed", handleCustomersChanged);
    return () =>
      window.removeEventListener("customers:changed", handleCustomersChanged);
  }, [loadCustomers]);

  useEffect(() => {
    let cancelled = false;

    if (isCustomerRole || !selectedCustomerId) {
      return () => {
        cancelled = true;
      };
    }

    getBoards(selectedCustomerId)
      .then((data) => {
        if (cancelled) return;
        setSelectedCustomerBoards(data);
        if (
          data.length > 0 &&
          !data.some((board) => board.id === selectedBoardId)
        ) {
          setSelectedBoard(
            data.find((board) => board.is_default)?.id ?? data[0].id,
          );
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load customer boards");
      });

    return () => {
      cancelled = true;
    };
  }, [isCustomerRole, selectedCustomerId, selectedBoardId, setSelectedBoard]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedCustomerBoards([]);
    }
  }, [selectedCustomerId]);

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const customerNavGroup = getCustomerNavGroup(
    selectedCustomerId,
    selectedCustomer,
    selectedCustomerBoards,
  );
  const navGroups = isCustomerRole
    ? []
    : "items" in customerNavGroup
      ? [customerNavGroup, ...NAV_GROUPS]
      : NAV_GROUPS;
  const customerLink =
    !isCustomerRole && "href" in customerNavGroup ? customerNavGroup : null;
  const messageBadgeCount = unreadMessageCount;

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
        {!isCustomerRole && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-2">
              <Popover
                open={customerPickerOpen}
                onOpenChange={setCustomerPickerOpen}
              >
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 min-w-0 flex-1 justify-start overflow-hidden bg-background px-3 text-left text-sm font-medium"
                    >
                      <Building className="mr-2 size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {selectedCustomer
                          ? getCustomerLabel(selectedCustomer)
                          : "All customers"}
                      </span>
                    </Button>
                  }
                />
                <PopoverContent align="start" className="w-72 p-1">
                  <Command>
                    <CommandInput placeholder="Search customers..." />
                    <CommandList>
                      <CommandEmpty>No customers found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all-customers"
                          onSelect={() => {
                            clearSelection();
                            setCustomerPickerOpen(false);
                          }}
                        >
                          <Building className="size-4 text-muted-foreground" />
                          <span>All customers</span>
                          {!selectedCustomerId && (
                            <Check className="ml-auto size-4" />
                          )}
                        </CommandItem>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={`${customer.name} ${customer.company ?? ""} ${customer.email ?? ""}`}
                            onSelect={() => {
                              setSelectedCustomer(customer.id);
                              setCustomerPickerOpen(false);
                            }}
                          >
                            <Building className="size-4 text-muted-foreground" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                {customer.name}
                              </p>
                              {(customer.company || customer.email) && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {customer.company || customer.email}
                                </p>
                              )}
                            </div>
                            {selectedCustomerId === customer.id && (
                              <Check className="ml-auto size-4" />
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                Focused on {getCustomerLabel(selectedCustomer)}
              </p>
            )}
          </div>
        )}
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

            {customerLink && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === customerLink.href}
                  className={cn(
                    "transition-all duration-200 rounded-lg h-10 px-3",
                    pathname === customerLink.href
                      ? "bg-primary/10 hover:bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <Link
                    href={customerLink.href}
                    className="flex w-full items-center gap-3"
                  >
                    <customerLink.icon
                      className={cn(
                        "size-4",
                        pathname === customerLink.href && "text-primary",
                      )}
                    />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {customerLink.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {isCustomerRole && (
              <>
                {[NAV_QUOTES, NAV_INVOICES].map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        className={cn(
                          "transition-all duration-200 rounded-lg h-10 px-3",
                          isActive
                            ? "bg-primary/10 hover:bg-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        <Link
                          href={item.href}
                          className="flex w-full items-center gap-3"
                        >
                          <item.icon
                            className={cn("size-4", isActive && "text-primary")}
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">
                            {item.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </>
            )}

            {/* Messaging Centre - Single Item */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === NAV_MESSAGES.href}
                className={cn(
                  "transition-all duration-200 rounded-lg h-10 px-3",
                  pathname === NAV_MESSAGES.href
                    ? "bg-primary/10 hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Link
                  href={NAV_MESSAGES.href}
                  className="flex w-full items-center gap-3"
                >
                  <NAV_MESSAGES.icon
                    className={cn(
                      "size-4",
                      pathname === NAV_MESSAGES.href && "text-primary",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {NAV_MESSAGES.title}
                  </span>
                  {messageBadgeCount > 0 && (
                    <span
                      aria-label={`${messageBadgeCount} unread messages`}
                      className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold leading-none text-primary-foreground"
                    >
                      {messageBadgeCount > 99 ? "99+" : messageBadgeCount}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menu Groups with Submenus */}
            {navGroups.map((group) => {
              const isGroupActive = group.items.some((item) =>
                isSubMenuItemActive(item),
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
                      {group.title === "Dockyard" &&
                        unreadContactSubmissionCount > 0 && (
                          <span
                            aria-label={`${unreadContactSubmissionCount} unread contact submissions`}
                            className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold leading-none text-primary-foreground"
                          >
                            {unreadContactSubmissionCount > 99
                              ? "99+"
                              : unreadContactSubmissionCount}
                          </span>
                        )}
                      <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {group.items.map((item) => {
                        const isItemActive = isSubMenuItemActive(item);
                        return (
                          <SidebarMenuSubItem
                            key={`${item.href}:${item.boardId ?? item.title}`}
                          >
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
                                    if (item.boardId)
                                      setSelectedBoard(item.boardId);
                                  }}
                                >
                                  <item.icon
                                    className={cn(
                                      "size-4",
                                      isItemActive && "text-primary!",
                                    )}
                                  />
                                  <span>{item.title}</span>
                                  {item.href === "/dashboard/contact" &&
                                    unreadContactSubmissionCount > 0 && (
                                      <span
                                        aria-label={`${unreadContactSubmissionCount} unread contact submissions`}
                                        className="ml-auto inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold leading-none text-primary-foreground"
                                      >
                                        {unreadContactSubmissionCount > 99
                                          ? "99+"
                                          : unreadContactSubmissionCount}
                                      </span>
                                    )}
                                </Link>
                              }
                            />
                            {item.items && item.items.length > 0 && (
                              <SidebarMenuSub className="mx-4 mt-1 py-0">
                                {item.items.map((nestedItem) => {
                                  const isNestedItemActive =
                                    pathname === getRoutePath(nestedItem.href);

                                  return (
                                    <SidebarMenuSubItem
                                      key={`${nestedItem.href}:${nestedItem.title}`}
                                    >
                                      <SidebarMenuSubButton
                                        size="sm"
                                        isActive={isNestedItemActive}
                                        className={cn(
                                          "transition-all duration-200 rounded-md h-8",
                                          isNestedItemActive
                                            ? "bg-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                                        )}
                                        render={
                                          <Link
                                            href={nestedItem.href}
                                            className="flex items-center gap-2"
                                            onClick={() => {
                                              if (nestedItem.boardId) {
                                                setSelectedBoard(
                                                  nestedItem.boardId,
                                                );
                                              }
                                            }}
                                          >
                                            <nestedItem.icon
                                              className={cn(
                                                "size-4",
                                                isNestedItemActive &&
                                                  "text-primary!",
                                              )}
                                            />
                                            <span>{nestedItem.title}</span>
                                          </Link>
                                        }
                                      />
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            )}
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
      {!isCustomerRole && (
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
      )}

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
            <DropdownMenuItem className="gap-2" onClick={() => router.push("/dashboard/settings")}>
              <Settings className="size-4" />
              Settings
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

        <AlertDialog
          open={showWipeDialog}
          onOpenChange={(open) => {
            setShowWipeDialog(open);
            if (!open) setWipePassword("");
          }}
        >
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
              <AlertDialogCancel onClick={() => setWipePassword("")}>
                Cancel
              </AlertDialogCancel>
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
      <AlertDialog
        open={showPasswordChangePrompt}
        onOpenChange={setShowPasswordChangePrompt}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change your temporary password</AlertDialogTitle>
            <AlertDialogDescription>
              This account was created with a temporary password. Open your
              account settings and set a new password before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                window.location.href = "/dashboard/settings";
                setShowPasswordChangePrompt(false);
              }}
            >
              Open Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SidebarRail />
    </Sidebar>
  );
}
