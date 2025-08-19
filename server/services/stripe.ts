import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export interface CreateCheckoutSessionParams {
  amount: number;
  invoiceId: string;
  customerEmail: string;
  invoiceNumber: string;
}

export async function createCheckoutSession({
  amount,
  invoiceId,
  customerEmail,
  invoiceNumber,
}: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Invoice ${invoiceNumber}`,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/invoice/${invoiceId}?payment=success`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/invoice/${invoiceId}?payment=cancelled`,
    customer_email: customerEmail,
    metadata: {
      invoiceId,
    },
  });

  return session;
}

export async function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Missing required Stripe webhook secret: STRIPE_WEBHOOK_SECRET');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
