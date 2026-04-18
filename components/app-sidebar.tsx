"use client";

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
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Sidebar Menu Configuration
// Easy to add/remove/modify menu items here

interface SubMenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
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
    title: "Customers",
    icon: Briefcase,
    items: [
      { title: "Kanban Board", href: "/dashboard/work", icon: KanbanSquare },
      {
        title: "Customer Management",
        href: "/dashboard/customers",
        icon: Building,
      },
    ],
  },
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
    ],
  },
];

const NAV_SETTINGS: SingleMenuItem[] = [
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { isLoaded, user } = useUser();
  const { openUserProfile, signOut } = useClerk();

  return (
    <Sidebar className="border-r-border/40">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <Image
            src="/logo.svg"
            alt="Dockyard"
            width={128}
            height={32}
            className="h-8 w-auto"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1 mt-2">
            {/* Overview - Single Item */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname === NAV_OVERVIEW.href}
                className={cn(
                  "transition-all duration-200 rounded-lg h-10 px-3",
                  pathname === NAV_OVERVIEW.href
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
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
            {NAV_GROUPS.map((group) => (
              <Collapsible
                key={group.title}
                defaultOpen
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <SidebarMenuButton className="transition-all duration-200 rounded-lg h-10 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary">
                    <group.icon className="size-4" />
                    <span className="font-medium flex-1 text-left">
                      {group.title}
                    </span>
                    <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {group.items.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarMenuSubButton
                          isActive={pathname === item.href}
                          className={cn(
                            "transition-all duration-200 rounded-md",
                            pathname === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                          )}
                          render={
                            <Link
                              href={item.href}
                              className="flex items-center gap-2"
                            >
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          }
                        />
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            ))}
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
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
