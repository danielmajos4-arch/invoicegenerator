import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, TriangleAlert } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Invoice } from "@shared/schema";

export default function InvoiceView() {
  const [, params] = useRoute("/invoice/:id");
  const { toast } = useToast();
  const invoiceId = params?.id;

  const { data: invoice, isLoading } = useQuery<Invoice>({
    queryKey: ['/api/invoices', invoiceId],
    enabled: !!invoiceId,
  });

  const paymentMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/invoices/${invoiceId}/checkout`),
    onSuccess: async (response) => {
      const data = await response.json();
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate payment",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-4">Invoice Not Found</h1>
            <p className="text-slate-600">The invoice you're looking for doesn't exist or has been removed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    DRAFT: { variant: "outline" as const, className: "border-slate-500 text-slate-500" },
    SENT: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    PAID: { variant: "default" as const, className: "bg-green-100 text-green-800 border-green-200" },
  };

  const config = statusConfig[invoice.status];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {/* Business Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              {invoice.businessLogo ? (
                <img 
                  src={invoice.businessLogo} 
                  alt="Business Logo" 
                  className="w-16 h-16 rounded-lg object-contain"
                />
              ) : (
                <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-invoice text-white text-2xl"></i>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-slate-800" data-testid="business-name">
                  {invoice.businessName}
                </h1>
                <p className="text-slate-600" data-testid="business-email">
                  {invoice.businessEmail}
                </p>
                {invoice.businessAddress && (
                  <p className="text-sm text-slate-500 mt-1">
                    {invoice.businessAddress}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-primary">INVOICE</h2>
              <p className="text-slate-600 font-mono" data-testid="invoice-number">
                #{invoice.id.slice(0, 8)}
              </p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Bill To
              </h3>
              <div className="text-slate-800">
                <div className="font-semibold" data-testid="client-name">
                  {invoice.clientName}
                </div>
                <div data-testid="client-email">
                  {invoice.clientEmail}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Invoice Details
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Issue Date:</span>
                  <span data-testid="issue-date">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <Badge 
                    variant={config.variant}
                    className={config.className}
                    data-testid="invoice-status"
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
              Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left text-slate-600 font-medium py-2">Description</th>
                    <th className="text-center text-slate-600 font-medium py-2">Qty</th>
                    <th className="text-right text-slate-600 font-medium py-2">Rate</th>
                    <th className="text-right text-slate-600 font-medium py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="text-slate-800 py-3" data-testid={`item-description-${index}`}>
                        {item.description}
                      </td>
                      <td className="text-center py-3" data-testid={`item-quantity-${index}`}>
                        {item.quantity}
                      </td>
                      <td className="text-right py-3" data-testid={`item-rate-${index}`}>
                        ${item.rate.toFixed(2)}
                      </td>
                      <td className="text-right font-semibold py-3" data-testid={`item-total-${index}`}>
                        ${item.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-64 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold" data-testid="invoice-subtotal">
                  ${invoice.subtotal}
                </span>
              </div>
              {parseFloat(invoice.taxAmount ?? "0") > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Tax ({invoice.taxRate}%):</span>
                  <span className="font-semibold" data-testid="invoice-tax">
                    ${invoice.taxAmount}
                  </span>
                </div>
              )}
              <div className="border-t border-slate-200 pt-2">
                <div className="flex justify-between py-2">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-lg font-bold text-primary" data-testid="invoice-total">
                    ${invoice.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          {invoice.status !== "PAID" && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="text-center">
                <Alert className="mb-4 border-yellow-200 bg-yellow-50">
                  <TriangleAlert className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    This invoice is pending payment. Click the button below to pay securely with Stripe.
                  </AlertDescription>
                </Alert>
                <Button 
                  size="lg" 
                  className="gap-2"
                  onClick={() => paymentMutation.mutate()}
                  disabled={paymentMutation.isPending}
                  data-testid="button-pay-now"
                >
                  <CreditCard className="h-5 w-5" />
                  {paymentMutation.isPending ? "Processing..." : `Pay Now - $${invoice.total}`}
                </Button>
                <p className="text-sm text-slate-500 mt-2">Secure payment powered by Stripe</p>
              </div>
            </div>
          )}

          {invoice.status === "PAID" && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <div className="text-center">
                <Alert className="border-green-200 bg-green-50">
                  <i className="fas fa-check-circle text-green-600"></i>
                  <AlertDescription className="text-green-800">
                    This invoice has been paid. Thank you for your business!
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
