import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  businessEmail: text("business_email").notNull(),
  businessAddress: text("business_address"),
  businessPhone: text("business_phone"),
  businessWebsite: text("business_website"),
  businessLogo: text("business_logo"),
  clientEmail: text("client_email").notNull(),
  clientName: text("client_name").notNull(),
  items: jsonb("items").notNull().$type<Array<{
    description: string;
    quantity: number;
    rate: number;
    total: number;
  }>>(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["DRAFT", "SENT", "PAID"] }).notNull().default("DRAFT"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  stripeSessionId: true,
});

export const updateInvoiceSchema = insertInvoiceSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof updateInvoiceSchema>;
