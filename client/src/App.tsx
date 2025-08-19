import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

// Pages
import Dashboard from "@/pages/dashboard";
import CreateInvoice from "@/pages/create-invoice";
import InvoiceView from "@/pages/invoice-view";
import Settings from "@/pages/settings";
import Checkout from "@/pages/checkout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/create" component={CreateInvoice} />
      <Route path="/edit/:id" component={CreateInvoice} />
      <Route path="/invoice/:id" component={InvoiceView} />
      <Route path="/checkout/:invoiceId" component={Checkout} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Fixed layout to prevent sidebar-related size jumps */}
      <div className="lg:pl-64 min-h-screen transition-[padding] duration-300 ease-in-out">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Router />
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppLayout />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
