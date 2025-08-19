import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InvoiceTableNew } from "@/components/invoice-table-new";
import { AnalyticsChart } from "@/components/analytics-chart";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Invoice } from "@shared/schema";
import { 
  Plus, 
  TrendingUp, 
  FileText, 
  Clock, 
  DollarSign,
  AlertCircle 
} from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/invoices/${id}/duplicate`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Invoice duplicated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate invoice",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this invoice?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateMutation.mutate(id);
  };

  // Calculate stats
  const stats = invoices.reduce(
    (acc, invoice) => {
      const total = parseFloat(invoice.total);
      acc.totalInvoices += 1;
      
      switch (invoice.status) {
        case 'PAID':
          acc.paidAmount += total;
          acc.paidCount += 1;
          break;
        case 'SENT':
          acc.pendingAmount += total;
          acc.pendingCount += 1;
          break;
        case 'DRAFT':
          acc.draftCount += 1;
          break;
      }
      
      acc.totalRevenue += invoice.status === 'PAID' ? total : 0;
      
      return acc;
    },
    {
      totalInvoices: 0,
      totalRevenue: 0,
      paidAmount: 0,
      paidCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
      draftCount: 0,
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="h-96 bg-muted rounded animate-pulse"></div>

        {/* Table skeleton */}
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your invoices and revenue performance
          </p>
        </div>
        <Link href="/create">
          <Button className="flex items-center gap-2 w-auto" data-testid="create-invoice-button">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-base-100 rounded-lg p-4 shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums text-green-600 dark:text-green-400" data-testid="total-revenue">
              ${stats.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {stats.paidCount} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="bg-base-100 rounded-lg p-4 shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums text-yellow-600 dark:text-yellow-400" data-testid="pending-amount">
              ${stats.pendingAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingCount} invoices sent
            </p>
          </CardContent>
        </Card>

        <Card className="bg-base-100 rounded-lg p-4 shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums" data-testid="total-invoices">
              {stats.totalInvoices}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="px-1 py-0 text-xs">
                {stats.draftCount} drafts
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-base-100 rounded-lg p-4 shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono tabular-nums" data-testid="success-rate">
              {stats.totalInvoices > 0 
                ? Math.round((stats.paidCount / stats.totalInvoices) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Payment success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      {invoices.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsChart invoices={invoices} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">No Data Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Create your first invoice to see analytics
                </p>
              </div>
              <Link href="/create">
                <Button>Get Started</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Invoices */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent Invoices</h2>
          {invoices.length > 5 && (
            <Link href="/invoices">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          )}
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">No invoices yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Get started by creating your first invoice. You can track payments, 
                    send reminders, and analyze your revenue.
                  </p>
                </div>
                <Link href="/create">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Invoice
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto md:overflow-x-visible">
            <InvoiceTableNew 
              invoices={invoices.slice(0, 10)} // Show recent 10
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              isLoading={deleteMutation.isPending || duplicateMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link href="/create">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto p-4">
                  <Plus className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Create Invoice</div>
                    <div className="text-sm text-muted-foreground">New invoice for client</div>
                  </div>
                </Button>
              </Link>

              <Link href="/settings">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto p-4">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Business Settings</div>
                    <div className="text-sm text-muted-foreground">Update company info</div>
                  </div>
                </Button>
              </Link>

              {stats.pendingCount > 0 && (
                <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                  <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Follow Up</span>
                  </div>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {stats.pendingCount} invoice{stats.pendingCount !== 1 ? 's' : ''} awaiting payment
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}