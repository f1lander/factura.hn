// services/invoiceService.ts
import {
  createClient,
  PostgrestError,
  SupabaseClient,
} from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface Invoice {
  id: string;
  company_id: string;
  customer_id: string;
  invoice_number: string;
  date: string;
  subtotal: number;
  tax_exonerado: number;
  tax_exento: number;
  tax_gravado_15: number;
  tax_gravado_18: number;
  tax: number;
  tax_18: number;
  total: number;
  numbers_to_letters: string;
  proforma_number: string | null;
  is_proforma: boolean;
  created_at: string;
  updated_at: string;
  customers: {
    name: string;
    email: string;
    rtn: string;
  };
  invoice_items: InvoiceItem[];
  status: 'pending' | 'paid' | 'cancelled'
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  discount: number;
  created_at: string;
  updated_at: string;
}

class InvoiceService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async searchInvoices(
    searchTerm: string,
    startDate?: Date,
    endDate?: Date,
    statuses?: string[]
  ): Promise<Invoice[]> {
    let query = this.supabase
      .from("invoices")
      .select(`
        *,
        customers (rtn, name, email),
        invoice_items (*)
      `)
      .or(`invoice_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%,invoice_items.description.ilike.%${searchTerm}%`)
      .order("date", { ascending: false });

    if (startDate && endDate) {
      query = query.gte("date", startDate.toISOString()).lte("date", endDate.toISOString());
    }

    if (statuses && statuses.length > 0) {
      query = query.in("status", statuses);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error searching invoices:", error);
      return [];
    }

    return data.map((invoice: any) => ({
      ...invoice,
      customers: {
        rtn: invoice.customers.rtn,
        name: invoice.customers.name,
        email: invoice.customers.email,
      },
      invoice_items: invoice.invoice_items,
    }));
  }

  async updateInvoicesStatus(invoiceIds: string[], newStatus: string): Promise<void | PostgrestError> {
    const { error } = await this.supabase
      .from('invoices')
      .update({ status: newStatus })
      .in('id', invoiceIds);

    if (error) {
      console.error("Error updating invoice statuses:", error);
      return error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select(`
        *,
        customers (rtn, name, email),
        invoice_items (
          id,
          product_id,
          description,
          quantity,
          unit_cost,
          discount,
          created_at,
          updated_at
        )
      `)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    return data;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select(
        `
        *,
        customers (rtn, name, email),
        invoice_items (*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching invoice:", error);
      return null;
    }

    return {
      ...data,
      customer: {
        rtn: data.customers.rtn,
        name: data.customers.name,
        email: data.customers.email,
      },

      items: data.invoice_items,
    };
  }

  async getTotalRevenue(period: "week" | "month"): Promise<number> {
    const now = new Date();
    let startDate: Date;

    if (period === "week") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7
      );
    } else {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
      );
    }

    const { data, error } = await this.supabase
      .from("invoices")
      .select("total")
      .gte("date", startDate.toISOString())
      .lte("date", now.toISOString());

    if (error) {
      console.error("Error fetching total revenue:", error);
      return 0;
    }

    return data.reduce(
      (sum: number, invoice: { total: number }) => sum + invoice.total,
      0
    );
  }

  async createInvoiceWithItems(invoice: Omit<Invoice, "id" | "created_at" | "updated_at">): Promise<Invoice | null> {
    debugger;
    const { invoice_items: invoiceItems, ...rest } = invoice
    const { data, error } = await this.supabase
      .from("invoices")
      .insert({ ...rest })
      .select()
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      return null;
    }

    if (invoiceItems && invoiceItems.length > 0) {
      const itemsToInsert = invoiceItems.map(({ id, ...item }) => ({
        ...item,
        invoice_id: data.id,
      }));

      const { error: itemsError } = await this.supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) {
        console.error("Error creating invoice items:", itemsError);
        // You might want to delete the invoice here if items fail to insert
        return null;
      }
    }

    return this.getInvoiceById(data.id);
  }

  async updateInvoiceWithItems(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const { invoice_items, ...invoiceUpdates } = updates;
    debugger;
    const { error } = await this.supabase
      .from("invoices")
      .update(invoiceUpdates)
      .eq("id", id);

    if (error) {
      console.error("Error updating invoice:", error);
      return null;
    }

    if (invoice_items && invoice_items.length > 0) {
      const { error: deleteError } = await this.supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", id);

      if (deleteError) {
        console.error("Error deleting old invoice items:", deleteError);
        return null;
      }

      const itemsToInsert = invoice_items.map(item => ({
        ...item,
        invoice_id: id
      }));

      const { error: insertError } = await this.supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (insertError) {
        console.error("Error inserting new invoice items:", insertError);
        return null;
      }
    }

    return this.getInvoiceById(id);
  }

  async createInvoice(
    invoiceData: Omit<Invoice, "id" | "created_at" | "updated_at">
  ): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from("invoices")
      .insert({ ...invoiceData })
      .single();

    if (error) {
      console.error("Error creating invoice:", error);
      return null;
    }

    return data;
  }

  async updateInvoice(
    id: string,
    updates: Partial<Invoice>
  ): Promise<PostgrestError | true> {
    const { error } = await this.supabase
      .from("invoices")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error updating invoice:", error);
      return error;
    }

    return true;
  }

  async createInvoiceItem(
    invoiceItemData: Omit<InvoiceItem, "id" | "created_at" | "updated_at">
  ): Promise<InvoiceItem | null> {
    const { data, error } = await this.supabase
      .from("invoice_items")
      .insert({ ...invoiceItemData })
      .single();

    if (error) {
      console.error("Error creating invoice item:", error);
      return null;
    }

    return data;
  }

  async updateInvoiceItem(
    id: string,
    updates: Partial<InvoiceItem>
  ): Promise<PostgrestError | true> {
    const { error } = await this.supabase
      .from("invoice_items")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error updating invoice item:", error);
      return error;
    }

    return true;
  }

  async getLastInvoice(companyId: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from("invoices")
      .select("invoice_number")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching last invoice:", error);
      return null;
    }

    return data.invoice_number;
  }
}



export const invoiceService = new InvoiceService();
