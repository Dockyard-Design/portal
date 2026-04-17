"use client";

import Image from "next/image";
import {
  LayoutDashboard,
  FolderKanban,
  Key,
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
  SidebarRail,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderKanban,
  },
  {
    title: "API Keys",
    href: "/dashboard/api-keys",
    icon: Key,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r-border/40">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3 group cursor-pointer">
          <Image src="/logo.svg" alt="Dockyard" width={128} height={32} className="h-8 w-auto brightness-200" />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground/60">
            Navigation
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1 mt-2">
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  className={`
                    transition-all duration-200
                    ${pathname === item.href 
                      ? "bg-primary/10 text-primary hover:bg-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    } 
                    rounded-lg h-10 px-3
                  `}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className={`size-4 ${pathname === item.href ? "text-primary" : ""}`} />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-6 border-t border-border/40">
        <button
          onClick={() => document.querySelector('[data-clerk-user-button]')?.querySelector('button')?.click()}
          className="flex items-center gap-3 w-full p-2 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors text-left"
        >
          <div data-clerk-user-button>
            <UserButton />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Account</span>
            <span className="text-xs text-muted-foreground truncate">Manage profile</span>
          </div>
        </button>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}