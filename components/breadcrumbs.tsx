"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Static mapping of paths to display names
const PATH_NAMES: Record<string, string> = {
  "dashboard": "Dashboard",
  "kanban": "Kanban Board",
  "customers": "Customers",
  "projects": "Projects",
  "contact": "Contact Submissions",
  "api-keys": "API Keys",
  "users": "User Management",
  "new": "New",
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  
  // If custom items provided, use those
  if (items) {
    return (
      <nav className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
        <Link 
          href="/dashboard" 
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Home className="size-4" />
          <span className="sr-only">Dashboard</span>
        </Link>
        {items.map((item, index) => (
          <div key={item.href} className="flex items-center">
            <ChevronRight className="size-4 mx-1" />
            {item.isCurrent ? (
              <span className="text-foreground font-medium">{item.label}</span>
            ) : (
              <Link 
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Auto-generate from pathname
  const segments = pathname.split("/").filter(Boolean);
  
  // Skip if we're at the dashboard root
  if (segments.length <= 1) return null;

  const breadcrumbItems: BreadcrumbItem[] = [];
  let currentPath = "";

  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Skip UUID-like IDs - we'll handle these specially
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      continue;
    }
    
    const label = PATH_NAMES[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbItems.push({
      label,
      href: currentPath,
      isCurrent: i === segments.length - 1,
    });
  }

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}>
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="size-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      {breadcrumbItems.map((item) => (
        <div key={item.href} className="flex items-center">
          <ChevronRight className="size-4 mx-1" />
          {item.isCurrent ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link 
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// Hook to generate breadcrumbs from dynamic data
export function useBreadcrumbs(
  customItems?: { label: string; href?: string }[]
): BreadcrumbItem[] {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  
  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/dashboard" }];
  
  let currentPath = "";
  
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Check if we have a custom label for this segment
    const customItem = customItems?.find((_, idx) => idx === i - 1);
    
    if (customItem) {
      items.push({
        label: customItem.label,
        href: customItem.href || currentPath,
        isCurrent: i === segments.length - 1,
      });
    } else if (!segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const label = PATH_NAMES[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      items.push({
        label,
        href: currentPath,
        isCurrent: i === segments.length - 1,
      });
    }
  }
  
  return items;
}
