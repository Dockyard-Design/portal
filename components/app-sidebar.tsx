import {
  LayoutDashboard,
  Key,
  FolderKanban,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  Sidebar collapsible="icon",
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarInset,
} from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    title: "Dashboard",
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
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <Sidebar selectable>
      <SidebarHeader className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            A
          </div>
          <span>AdminPanel</span>
        </div>
        <UserButton afterSignOutUrl="/" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.title}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
      {children}
    </Sidebar>
  );
}
