import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LineItemForm, type LineItem } from "@/components/line-item-form";
import { insertInvoiceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useBusinessInfo } from "@/hooks/use-business-info";
import { ArrowLeft, Send, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { z } from "zod";

const formSchema = insertInvoiceSchema.extend({
  taxEnabled: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateInvoice() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { businessInfo, updateBusinessInfo } = useBusinessInfo();
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      total: 0,
    }
  ]);
  const [taxEnabled, setTaxEnabled] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: businessInfo.name,
      businessEmail: businessInfo.email,
      businessAddress: businessInfo.address,
      businessPhone: businessInfo.phone,
      businessWebsite: businessInfo.website,
      businessLogo: businessInfo.logo,
      clientName: '',
      clientEmail: '',
      items: [],
      subtotal: '0',
      taxRate: businessInfo.taxRate.toString(),
      taxAmount: '0',
      total: '0',
      status: 'DRAFT',
      taxEnabled: false,
    },
  });

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = taxEnabled ? parseFloat(form.watch('taxRate') || '0') : 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    return { subtotal, taxAmount, total, taxRate };
  }, [lineItems, taxEnabled, form.watch('taxRate')]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/invoices", data);
      const invoice = await response.json();
      await apiRequest("POST", `/api/invoices/${invoice.id}/send`);
      return invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      toast({
        title: "Success",
        description: "Invoice created and sent successfully",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invoice",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (draft: boolean = true) => {
    if (lineItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one line item",
        variant: "destructive",
      });
      return;
    }

    // Update business info in localStorage
    const businessData = {
      name: form.getValues('businessName'),
      email: form.getValues('businessEmail'),
      address: form.getValues('businessAddress') || '',
      phone: form.getValues('businessPhone') || '',
      website: form.getValues('businessWebsite') || '',
      logo: form.getValues('businessLogo') || '',
      taxRate: parseFloat(form.getValues('taxRate') || '0'),
    };
    updateBusinessInfo(businessData);

    const invoiceData = {
      ...form.getValues(),
      items: lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        total: item.total,
      })),
      subtotal: calculations.subtotal.toFixed(2),
      taxRate: taxEnabled ? calculations.taxRate.toFixed(2) : '0',
      taxAmount: calculations.taxAmount.toFixed(2),
      total: calculations.total.toFixed(2),
      status: draft ? 'DRAFT' : 'SENT',
    };

    if (draft) {
      createMutation.mutate(invoiceData);
    } else {
      sendMutation.mutate(invoiceData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 min-h-[44px] touch-manipulation self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Create Invoice</h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">Generate a new invoice for your client</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Invoice Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Business Information */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    {...form.register('businessName')}
                    placeholder="Your Business Name"
                    className="min-h-[44px]"
                    data-testid="input-business-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    {...form.register('businessEmail')}
                    placeholder="business@example.com"
                    className="min-h-[44px]"
                    data-testid="input-business-email"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea
                    id="businessAddress"
                    {...form.register('businessAddress')}
                    placeholder="123 Business St, City, State 12345"
                    data-testid="input-business-address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    {...form.register('clientName')}
                    placeholder="Client Name"
                    className="min-h-[44px]"
                    data-testid="input-client-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Client Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    {...form.register('clientEmail')}
                    placeholder="client@example.com"
                    className="min-h-[44px]"
                    data-testid="input-client-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <LineItemForm 
                items={lineItems} 
                onItemsChange={setLineItems}
              />
            </CardContent>
          </Card>
        </div>

        {/* Invoice Summary */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          {/* Totals */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Invoice Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold" data-testid="subtotal-amount">
                    ${calculations.subtotal.toFixed(2)}
                  </span>
                </div>
                
                {/* Tax Toggle */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="tax-toggle" className="text-slate-600 cursor-pointer">
                    Add Tax
                  </Label>
                  <Switch
                    id="tax-toggle"
                    checked={taxEnabled}
                    onCheckedChange={setTaxEnabled}
                    data-testid="toggle-tax"
                  />
                </div>
                
                {taxEnabled && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Label htmlFor="taxRate" className="text-sm">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        {...form.register('taxRate')}
                        className="h-10 sm:h-6 text-xs min-h-[40px] sm:min-h-[24px]"
                        data-testid="input-tax-rate"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Tax ({calculations.taxRate}%)</span>
                      <span data-testid="tax-amount">${calculations.taxAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary" data-testid="total-amount">
                    ${calculations.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <Button 
                  className="w-full gap-2 min-h-[48px] touch-manipulation" 
                  onClick={() => onSubmit(false)}
                  disabled={sendMutation.isPending}
                  data-testid="button-send-invoice"
                >
                  <Send className="h-4 w-4" />
                  {sendMutation.isPending ? "Sending..." : "Send Invoice"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 min-h-[48px] touch-manipulation"
                  onClick={() => onSubmit(true)}
                  disabled={createMutation.isPending}
                  data-testid="button-save-draft"
                >
                  <Save className="h-4 w-4" />
                  {createMutation.isPending ? "Saving..." : "Save as Draft"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Preview</h3>
              <div className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-lg">
                <div className="font-semibold mb-2">Invoice Preview</div>
                <div className="text-slate-600 dark:text-slate-400 mb-3">
                  <div>{form.watch('businessName') || 'Your Business Name'}</div>
                  <div>{form.watch('businessEmail') || 'business@example.com'}</div>
                </div>
                <div className="text-slate-600 dark:text-slate-400 mb-3">
                  <div className="font-medium">Bill To:</div>
                  <div>{form.watch('clientName') || 'Client Name'}</div>
                  <div>{form.watch('clientEmail') || 'client@example.com'}</div>
                </div>
                <div className="text-right font-semibold text-primary">
                  Total: ${calculations.total.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
