import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertSettingsSchema, type Settings, type InsertSettings } from "@shared/schema";
import { z } from "zod";
import { Upload, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const settingsFormSchema = insertSettingsSchema.extend({
  logoFile: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      if (response.status === 404) {
        // No settings yet, return defaults
        return {
          businessName: '',
          businessEmail: '',
          businessAddress: '',
          businessPhone: '',
          businessWebsite: '',
          businessLogo: '',
          accentColor: '#3B82F6',
          taxRate: '0',
          stripeCustomerPortalUrl: '',
        } as Settings;
      }
      return response.json();
    }
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: settings || {
      businessName: '',
      businessEmail: '',
      businessAddress: '',
      businessPhone: '',
      businessWebsite: '',
      businessLogo: '',
      accentColor: '#3B82F6',
      taxRate: '0',
      stripeCustomerPortalUrl: '',
    },
  });

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      form.reset({
        businessName: settings.businessName || '',
        businessEmail: settings.businessEmail || '',
        businessAddress: settings.businessAddress || '',
        businessPhone: settings.businessPhone || '',
        businessWebsite: settings.businessWebsite || '',
        businessLogo: settings.businessLogo || '',
        accentColor: settings.accentColor || '#3B82F6',
        taxRate: settings.taxRate || '0',
        stripeCustomerPortalUrl: settings.stripeCustomerPortalUrl || '',
      });
    }
  }, [settings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      if (settings?.id) {
        return apiRequest("PUT", `/api/settings/${settings.id}`, data);
      } else {
        return apiRequest("POST", "/api/settings", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    },
  });

  const handleLogoUpload = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
      const data = await response.json();
      return {
        method: "PUT" as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful?.[0]?.uploadURL) {
      const logoUrl = result.successful[0].uploadURL;
      form.setValue("businessLogo", logoUrl);
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    }
    setUploading(false);
  };

  const onSubmit = async (data: SettingsFormData) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-96 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business settings and preferences</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="business-name" 
                          placeholder="Your Business Name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          data-testid="business-email"
                          placeholder="contact@yourbusiness.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Phone</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="business-phone"
                          placeholder="+1 (555) 123-4567"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Website</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          data-testid="business-website"
                          placeholder="https://yourbusiness.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="businessAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        data-testid="business-address"
                        placeholder="123 Business St, City, State 12345"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0"
                        data-testid="tax-rate"
                        placeholder="8.25"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-4">
                  {form.watch("businessLogo") && (
                    <div className="w-16 h-16 rounded border border-border overflow-hidden">
                      <img 
                        src={`/public-objects${form.watch("businessLogo")}`} 
                        alt="Business Logo" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleLogoUpload}
                    onComplete={handleUploadComplete}
                    buttonClassName="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </ObjectUploader>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your business logo (PNG, JPG, max 5MB)
                </p>
              </div>

              <FormField
                control={form.control}
                name="accentColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accent Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input 
                          {...field} 
                          type="color" 
                          data-testid="accent-color"
                          className="w-16 h-10"
                        />
                        <Input 
                          {...field} 
                          data-testid="accent-color-hex"
                          placeholder="#3B82F6"
                          className="font-mono"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="stripeCustomerPortalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stripe Customer Portal URL</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        data-testid="stripe-portal-url"
                        placeholder="https://billing.stripe.com/p/login/..."
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-muted-foreground">
                      URL for customers to manage their payment methods and billing
                    </p>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={saveMutation.isPending}
              data-testid="save-settings"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}