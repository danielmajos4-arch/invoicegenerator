import nodemailer from "nodemailer";
import type { Invoice } from "@shared/schema";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvoiceEmail(invoice: Invoice): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('Email configuration missing. Please set SMTP_USER and SMTP_PASS environment variables.');
  }

  const invoiceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/invoice/${invoice.id}`;
  
  const mailOptions = {
    from: `"${invoice.businessName}" <${process.env.SMTP_USER}>`,
    to: invoice.clientEmail,
    subject: `Invoice #${invoice.id.slice(0, 8)} from ${invoice.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">New Invoice from ${invoice.businessName}</h2>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Invoice Details</h3>
          <p><strong>Invoice ID:</strong> #${invoice.id.slice(0, 8)}</p>
          <p><strong>Amount:</strong> $${invoice.total}</p>
          <p><strong>Client:</strong> ${invoice.clientName}</p>
        </div>
        
        <p>Hello ${invoice.clientName},</p>
        
        <p>You have received a new invoice from ${invoice.businessName}. Please click the button below to view and pay your invoice securely.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invoiceUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View & Pay Invoice
          </a>
        </div>
        
        <p>If you have any questions, please contact us at ${invoice.businessEmail}.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="color: #64748b; font-size: 12px;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendPaymentConfirmationEmail(invoice: Invoice): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return; // Skip if email not configured
  }

  const mailOptions = {
    from: `"${invoice.businessName}" <${process.env.SMTP_USER}>`,
    to: invoice.clientEmail,
    subject: `Payment Received - Invoice #${invoice.id.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Payment Received!</h2>
        
        <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <h3>Payment Confirmation</h3>
          <p><strong>Invoice ID:</strong> #${invoice.id.slice(0, 8)}</p>
          <p><strong>Amount Paid:</strong> $${invoice.total}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <p>Hello ${invoice.clientName},</p>
        
        <p>Thank you for your payment! We have successfully received your payment for invoice #${invoice.id.slice(0, 8)}.</p>
        
        <p>If you need a receipt or have any questions, please contact us at ${invoice.businessEmail}.</p>
        
        <p>Best regards,<br>${invoice.businessName}</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
