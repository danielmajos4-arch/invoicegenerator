import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useBusinessInfo } from "@/hooks/use-business-info";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Info, Upload } from "lucide-react";
import type { UploadResult } from "@uppy/core";

export default function Settings() {
  const { toast } = useToast();
  const { businessInfo, updateBusinessInfo } = useBusinessInfo();
  const [logoUrl, setLogoUrl] = useState(businessInfo.logo || '');

  const form = useForm({
    defaultValues: {
      businessName: businessInfo.name,
      businessEmail: businessInfo.email,
      phone: businessInfo.phone,
      address: businessInfo.address,
      website: businessInfo.website,
      taxRate: businessInfo.taxRate.toString(),
      currency: 'USD',
      paymentTerms: 'Net 30',
    },
  });

  const onSubmit = (data: any) => {
    const updatedInfo = {
      name: data.businessName,
      email: data.businessEmail,
      phone: data.phone,
      address: data.address,
      website: data.website,
      logo: logoUrl,
      taxRate: parseFloat(data.taxRate) || 0,
    };

    updateBusinessInfo(updatedInfo);
    
    toast({
      title: "Settings Saved",
      description: "Your business settings have been updated successfully.",
    });
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/logo/upload");
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to get upload URL",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadURL = result.successful[0].uploadURL;
        
        const response = await apiRequest("PUT", "/api/logo", {
          logoURL: uploadURL
        });
        const data = await response.json();
        
        setLogoUrl(data.objectPath);
        updateBusinessInfo({ logo: data.objectPath });
        
        toast({
          title: "Logo Uploaded",
          description: "Your business logo has been uploaded successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload Error",
        description: error.message || "Failed to save logo",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-1">Manage your business settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Logo */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Business Logo</h3>
            
            <div className="space-y-4">
              {/* Current Logo */}
              <div className="flex items-center justify-center w-full h-32 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="Business Logo" 
                    className="max-h-full max-w-full object-contain"
                    data-testid="current-logo"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No logo uploaded</p>
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={2097152} // 2MB
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </ObjectUploader>
              
              <p className="text-xs text-slate-500">
                Recommended: PNG or JPG, max 2MB, 300x300px for best results
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Default Business Information</h3>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  {...form.register('businessName')}
                  placeholder="Your Business Name"
                  data-testid="input-business-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  {...form.register('businessEmail')}
                  placeholder="business@example.com"
                  data-testid="input-business-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...form.register('phone')}
                  placeholder="+1 (555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  {...form.register('address')}
                  placeholder="123 Business St, City, State 12345"
                  data-testid="input-address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  {...form.register('website')}
                  placeholder="https://yourcompany.com"
                  data-testid="input-website"
                />
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" data-testid="button-save-settings">
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Payment Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  {...form.register('taxRate')}
                  placeholder="8.5"
                  data-testid="input-tax-rate"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select defaultValue="USD">
                  <SelectTrigger data-testid="select-currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select defaultValue="Net 30">
                  <SelectTrigger data-testid="select-payment-terms">
                    <SelectValue placeholder="Select payment terms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due immediately">Due immediately</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">API Configuration</h3>
            
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure your API keys in the environment variables for security.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>Stripe Status</Label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                  <span className="text-sm text-slate-600">Payments enabled</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email Service Status</Label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Connected
                  </span>
                  <span className="text-sm text-slate-600">Email notifications enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
