import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertInvoiceSchema, updateInvoiceSchema } from "@shared/schema";
import { createCheckoutSession, constructWebhookEvent } from "./services/stripe";
import { sendInvoiceEmail, sendPaymentConfirmationEmail } from "./services/email";
import { ObjectStorageService } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Invoice CRUD routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching invoices: " + error.message });
    }
  });

  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching invoice: " + error.message });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating invoice: " + error.message });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const validatedData = updateInvoiceSchema.parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, validatedData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating invoice: " + error.message });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const success = await storage.deleteInvoice(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: "Error deleting invoice: " + error.message });
    }
  });

  // Send invoice email
  app.post("/api/invoices/:id/send", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      await sendInvoiceEmail(invoice);
      await storage.updateInvoiceStatus(req.params.id, "SENT");
      
      res.json({ message: "Invoice sent successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Error sending invoice: " + error.message });
    }
  });

  // Create Stripe checkout session
  app.post("/api/invoices/:id/checkout", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status === "PAID") {
        return res.status(400).json({ message: "Invoice already paid" });
      }

      const session = await createCheckoutSession({
        amount: parseFloat(invoice.total),
        invoiceId: invoice.id,
        customerEmail: invoice.clientEmail,
        invoiceNumber: invoice.id.slice(0, 8),
      });

      await storage.updateInvoiceStripeSession(invoice.id, session.id);

      res.json({ sessionUrl: session.url });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating checkout session: " + error.message });
    }
  });

  // Stripe webhook
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const event = await constructWebhookEvent(req.body, signature);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const invoiceId = session.metadata.invoiceId;

        if (invoiceId) {
          const invoice = await storage.updateInvoiceStatus(invoiceId, "PAID");
          if (invoice) {
            await sendPaymentConfirmationEmail(invoice);
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ message: "Webhook error: " + error.message });
    }
  });

  // Logo upload endpoints
  app.post("/api/logo/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      res.status(500).json({ message: "Error getting upload URL: " + error.message });
    }
  });

  app.put("/api/logo", async (req, res) => {
    try {
      if (!req.body.logoURL) {
        return res.status(400).json({ error: "logoURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.logoURL);

      res.status(200).json({ objectPath });
    } catch (error: any) {
      res.status(500).json({ message: "Error setting logo: " + error.message });
    }
  });

  // Serve uploaded logos
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      if (error.name === "ObjectNotFoundError") {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
