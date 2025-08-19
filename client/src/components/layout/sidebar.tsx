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
        "fixed left-0 top-0 z-50 h-full w-64 bg-card border-r border-border shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">InvoiceFlow</h1>
              <p className="text-xs text-slate-500">Professional Invoicing</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-10",
                      item.active 
                        ? "bg-primary text-white hover:bg-primary" 
                        : "text-slate-700 hover:bg-slate-100"
                    )}
                    onClick={onClose}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
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
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="text-white h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">John Doe</div>
                <div className="text-xs text-muted-foreground truncate">john@example.com</div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
