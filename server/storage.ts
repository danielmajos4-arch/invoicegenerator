import { 
  invoices, type Invoice, type InsertInvoice, type UpdateInvoice,
  users, type User, type InsertUser,
  settings, type Settings, type InsertSettings, type UpdateSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Settings methods
  getSettings(): Promise<Settings | undefined>;
  createSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(id: string, updates: UpdateSettings): Promise<Settings | undefined>;
  
  // Invoice methods
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoices(): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: UpdateInvoice): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PAID"): Promise<Invoice | undefined>;
  updateInvoiceStripeSession(id: string, stripeSessionId: string): Promise<Invoice | undefined>;
  duplicateInvoice(id: string): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([insertUser])
      .returning();
    return user;
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [created] = await db
      .insert(invoices)
      .values([invoice])
      .returning();
    return created;
  }

  async updateInvoice(id: string, updates: UpdateInvoice): Promise<Invoice | undefined> {
    const validUpdates: Record<string, any> = {};
    
    // Only include defined values and exclude auto-generated fields
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UpdateInvoice] !== undefined && key !== 'id' && key !== 'createdAt') {
        validUpdates[key] = updates[key as keyof UpdateInvoice];
      }
    });
    
    // Always update the updatedAt field
    validUpdates.updatedAt = new Date();
    
    const [updated] = await db
      .update(invoices)
      .set(validUpdates)
      .where(eq(invoices.id, id))
      .returning();
    return updated || undefined;
  }

  async updateInvoiceStatus(id: string, status: "DRAFT" | "SENT" | "PAID"): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return updated || undefined;
  }

  async updateInvoiceStripeSession(id: string, stripeSessionId: string): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({
        stripeSessionId,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return updated || undefined;
  }

  async getSettings(): Promise<Settings | undefined> {
    const [settingsData] = await db.select().from(settings).limit(1);
    return settingsData || undefined;
  }

  async createSettings(insertSettings: InsertSettings): Promise<Settings> {
    const [created] = await db
      .insert(settings)
      .values([insertSettings])
      .returning();
    return created;
  }

  async updateSettings(id: string, updates: UpdateSettings): Promise<Settings | undefined> {
    const validUpdates: Record<string, any> = {};
    
    // Only include defined values and exclude auto-generated fields
    Object.keys(updates).forEach(key => {
      if (updates[key as keyof UpdateSettings] !== undefined && key !== 'id' && key !== 'createdAt') {
        validUpdates[key] = updates[key as keyof UpdateSettings];
      }
    });
    
    // Always update the updatedAt field
    validUpdates.updatedAt = new Date();
    
    const [updated] = await db
      .update(settings)
      .set(validUpdates)
      .where(eq(settings.id, id))
      .returning();
    return updated || undefined;
  }

  async duplicateInvoice(id: string): Promise<Invoice | undefined> {
    const original = await this.getInvoice(id);
    if (!original) return undefined;

    const { id: _, createdAt, updatedAt, stripeSessionId, ...duplicateData } = original;
    const duplicateInvoice: InsertInvoice = {
      ...duplicateData,
      status: "DRAFT" as const,
    };

    return await this.createInvoice(duplicateInvoice);
  }

  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
