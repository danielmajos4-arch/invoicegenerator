import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Users, 
  BarChart3, 
  Settings,
  User,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { 
      href: "/", 
      icon: LayoutDashboard, 
      label: "Dashboard",
      active: location === "/"
    },
    { 
      href: "/create", 
      icon: Plus, 
      label: "Create Invoice",
      active: location === "/create"
    },
    { 
      href: "/invoices", 
      icon: FileText, 
      label: "All Invoices",
      badge: "24",
      active: location === "/invoices"
    },
    { 
      href: "/clients", 
      icon: Users, 
      label: "Clients",
      active: location === "/clients"
    },
    { 
      href: "/reports", 
      icon: BarChart3, 
      label: "Reports",
      active: location === "/reports"
    },
    { 
      href: "/settings", 
      icon: Settings, 
      label: "Settings",
      active: location === "/settings"
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 sm:w-72 lg:w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-r border-border shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <FileText className="text-white h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 truncate">InvoiceFlow</h1>
              <p className="text-xs text-slate-600 dark:text-slate-300 truncate">Professional Invoicing</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 flex-1">
          <ul className="space-y-1 sm:space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 min-h-[44px] touch-manipulation transition-all duration-200 ease-in-out relative group",
                      item.active 
                        ? "bg-gradient-to-r from-primary to-primary/90 text-white hover:from-primary/90 hover:to-primary shadow-lg border-l-4 border-primary-foreground font-semibold" 
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 hover:shadow-md hover:scale-[1.02] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100"
                    )}
                    onClick={onClose}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transition-transform duration-200",
                      item.active ? "scale-110" : "group-hover:scale-105"
                    )} />
                    <span className="truncate font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant={item.active ? "outline" : "secondary"} 
                        className={cn(
                          "ml-auto text-xs transition-all duration-200",
                          item.active 
                            ? "bg-white/20 text-white border-white/30" 
                            : "bg-slate-200 text-slate-700 group-hover:bg-slate-300"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Menu */}
        <div className="p-3 sm:p-4 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer flex-1 min-w-0 min-h-[44px] touch-manipulation">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="text-white h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">John Doe</div>
                <div className="text-xs text-muted-foreground truncate">john@example.com</div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
