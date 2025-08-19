import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Make Stripe optional so app can start without credentials
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Thank you for your payment!",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentElement />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe}
            data-testid="submit-payment"
          >
            Complete Payment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default function Checkout() {
  const [, params] = useRoute("/checkout/:invoiceId");
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const invoiceId = params?.invoiceId;
  const { toast } = useToast();

  useEffect(() => {
    if (!invoiceId) return;
    
    apiRequest("POST", `/api/invoices/${invoiceId}/checkout`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sessionUrl) {
          window.location.href = data.sessionUrl;
        }
      })
      .catch((error) => {
        console.error('Checkout error:', error);
        setError(error.message || 'Payment processing is not configured');
        toast({
          title: "Payment Configuration Error",
          description: "Payment processing is currently unavailable. Please contact support.",
          variant: "destructive",
        });
      });
  }, [invoiceId, toast]);

  // Show error state if Stripe is not configured
  if (!stripePromise) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Payment Unavailable</h2>
            <p className="text-muted-foreground mb-4">
              Payment processing is currently not configured. Please contact support to complete your payment.
            </p>
            <Button onClick={() => window.history.back()} data-testid="button-back">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Payment Error</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.history.back()} data-testid="button-back">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}
