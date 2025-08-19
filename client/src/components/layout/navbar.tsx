import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <div className="navbar bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-700 lg:hidden">
      <div className="flex-none">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onMenuClick}
          data-testid="menu-toggle"
          className="min-h-[44px] min-w-[44px] touch-manipulation"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-file-invoice text-white text-sm"></i>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 truncate">InvoiceFlow</span>
        </div>
      </div>
    </div>
  );
}
