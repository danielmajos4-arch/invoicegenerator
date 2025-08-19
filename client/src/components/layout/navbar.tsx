import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  return (
    <div className="navbar bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg border-b border-slate-200/80 dark:border-slate-700/80 lg:hidden transition-all duration-200">
      <div className="flex-none">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onMenuClick}
          data-testid="menu-toggle"
          className="min-h-[44px] min-w-[44px] touch-manipulation hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors duration-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
            <i className="fas fa-file-invoice text-white text-sm"></i>
          </div>
          <span className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 truncate">InvoiceFlow</span>
        </div>
      </div>
    </div>
  );
}
