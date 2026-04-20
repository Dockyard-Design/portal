import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getUnreadMessageCount } from "@/app/actions/messaging";
import { getCurrentUserAccess } from "@/lib/authz";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [access, unreadMessageCount] = await Promise.all([
    getCurrentUserAccess(),
    getUnreadMessageCount().catch(() => 0),
  ]);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          initialUnreadMessageCount={unreadMessageCount}
          role={access.role}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-4 px-4 border-b">
            <SidebarTrigger />
            <Breadcrumbs />
          </header>
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
    </TooltipProvider>
  );
}
