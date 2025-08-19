import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertInvoiceSchema, updateInvoiceSchema, insertSettingsSchema, updateSettingsSchema } from "@shared/schema";
import { createCheckoutSession, constructWebhookEvent } from "./services/stripe";
import { sendInvoiceEmail, sendPaymentConfirmationEmail } from "./services/email";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import puppeteer from "puppeteer-core";
import chromium from "chrome-aws-lambda";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiting for invoice creation
  const invoiceCreateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: { message: "Too many invoice creation requests, try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Object storage routes  
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    res.json({ uploadURL });
  });
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

  app.post("/api/invoices", invoiceCreateLimiter, async (req, res) => {
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

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching settings: " + error.message });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.createSettings(validatedData);
      res.status(201).json(settings);
    } catch (error: any) {
      res.status(400).json({ message: "Error creating settings: " + error.message });
    }
  });

  app.put("/api/settings/:id", async (req, res) => {
    try {
      const validatedData = updateSettingsSchema.parse(req.body);
      const settings = await storage.updateSettings(req.params.id, validatedData);
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }
      res.json(settings);
    } catch (error: any) {
      res.status(400).json({ message: "Error updating settings: " + error.message });
    }
  });

  // PDF generation route
  app.post("/api/invoices/:id/pdf", async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const settings = await storage.getSettings();
      
      // Generate HTML for PDF
      const html = generateInvoicePDFHTML(invoice, settings);
      
      let browser;
      try {
        if (process.env.NODE_ENV === "production") {
          browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
          });
        } else {
          browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          });
        }

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20mm',
            right: '20mm',
            bottom: '20mm',
            left: '20mm'
          }
        });

        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.id}.pdf"`,
          'Content-Length': pdf.length,
        });
        
        res.send(pdf);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Error generating PDF: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateInvoicePDFHTML(invoice: any, settings: any): string {
  const lineItems = invoice.lineItems.map((item: any) => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">$${parseFloat(item.rate).toFixed(2)}</td>
      <td style="text-align: right;">$${(parseFloat(item.rate) * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const subtotal = parseFloat(invoice.subtotal);
  const tax = parseFloat(invoice.tax);
  const total = parseFloat(invoice.total);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice #${invoice.id}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid ${settings?.accentColor || '#3B82F6'};
        }
        .company-info h1 {
          color: ${settings?.accentColor || '#3B82F6'};
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .company-info p {
          margin: 2px 0;
          color: #666;
        }
        .invoice-details {
          text-align: right;
        }
        .invoice-details h2 {
          color: ${settings?.accentColor || '#3B82F6'};
          font-size: 24px;
          margin: 0;
        }
        .invoice-details p {
          margin: 5px 0;
          color: #666;
        }
        .client-info {
          margin-bottom: 40px;
        }
        .client-info h3 {
          color: ${settings?.accentColor || '#3B82F6'};
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          padding: 12px 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .totals {
          width: 300px;
          margin-left: auto;
        }
        .totals tr:last-child {
          background-color: ${settings?.accentColor || '#3B82F6'};
          color: white;
          font-weight: bold;
        }
        .totals tr:last-child td {
          border-bottom: none;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${settings?.businessName || 'Your Business'}</h1>
          <p>${settings?.businessEmail || ''}</p>
          <p>${settings?.businessPhone || ''}</p>
          <p>${settings?.businessAddress?.replace(/\n/g, '<br>') || ''}</p>
        </div>
        <div class="invoice-details">
          <h2>INVOICE</h2>
          <p><strong>#${invoice.id.slice(0, 8)}</strong></p>
          <p>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
          <p>Due: ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          <p>Status: <span style="color: ${invoice.status === 'PAID' ? '#10B981' : invoice.status === 'SENT' ? '#F59E0B' : '#6B7280'}">${invoice.status}</span></p>
        </div>
      </div>

      <div class="client-info">
        <h3>Bill To:</h3>
        <p><strong>${invoice.clientName}</strong></p>
        <p>${invoice.clientEmail}</p>
        <p>${invoice.clientAddress?.replace(/\n/g, '<br>') || ''}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th style="text-align: left;">Description</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItems}
        </tbody>
      </table>

      <table class="totals">
        <tr>
          <td><strong>Subtotal:</strong></td>
          <td style="text-align: right;"><strong>$${subtotal.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td><strong>Tax (${settings?.taxRate || 0}%):</strong></td>
          <td style="text-align: right;"><strong>$${tax.toFixed(2)}</strong></td>
        </tr>
        <tr>
          <td><strong>Total:</strong></td>
          <td style="text-align: right;"><strong>$${total.toFixed(2)}</strong></td>
        </tr>
      </table>

      <div class="footer">
        <p>Thank you for your business!</p>
        ${settings?.businessWebsite ? `<p>Visit us at: ${settings.businessWebsite}</p>` : ''}
      </div>
    </body>
    </html>
  `;
}
