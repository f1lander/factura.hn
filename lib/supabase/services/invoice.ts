import { BaseService, Table } from "./BaseService";
import { PostgrestError } from "@supabase/supabase-js";

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
  status: "pending" | "paid" | "cancelled";
  generated_invoice_id?: string | null;
  s3_key?: string | null;
  s3_url?: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  description: string;
  quantity: number;
  unit_cost: number;
  discount: number;
  updated_at: string;
  created_at: string;
}

class InvoiceService extends BaseService {
  private tableName: Table = "invoices";

  // Helper method to ensure company ID is available
  private async ensureCompanyIdForInvoice(): Promise<string | null> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) {
      console.error("No company ID available for this operation");
    }
    return companyId;
  }

  computeInvoiceData(invoiceItems: InvoiceItem[]): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    let subtotal = 0;
    let tax = 0;
    invoiceItems.forEach((invoiceItem) => {
      subtotal = subtotal + invoiceItem.quantity * invoiceItem.unit_cost;
      tax = tax + subtotal * 0.15;
    });
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total,
    };
  }

  /**
   * Validates whether a given invoice number is valid by comparing it against the last issued invoice number.
   *
   * **Format Requirement**: An invoice number must strictly follow the pattern `XXX-XXX-XX-XXXXXXXX`, where:
   * - `X` represents a digit.
   * - It consists of four groups separated by hyphens, with lengths of 3, 3, 2, and 8 digits respectively.
   *
   * An invoice number is considered valid if it:
   * - Matches the exact required format.
   * - Follows a sequential order compared to the `lastInvoiceNumber`.
   *
   * @param {string} invoiceNumber - The new invoice number to validate.
   * @param {string} lastInvoiceNumber - The last issued invoice number for comparison.
   * @returns {boolean} - `true` if the invoice number has the correct format and is sequentially valid, otherwise `false`.
   *
   * @example
   * // Returns true because "002-001-01-12345678" has the correct format and is sequentially valid.
   * isInvoiceNumberValid("002-001-01-12345678", "003-000-01-12345678");
   *
   * @example
   * // Returns false because "005" is greater than "004" in the second group.
   * isInvoiceNumberValid("003-005-01-12345678", "003-004-01-12345678");
   *
   * @example
   * // Returns false due to incorrect format (last group contains 9 digits instead of 8).
   * isInvoiceNumberValid("003-004-01-123456789", "003-004-01-12345678");
   *
   * @example
   * // Returns false due to incorrect format (missing a group).
   * isInvoiceNumberValid("003-001-12345678", "003-001-01-12345678");
   */
  isInvoiceNumberValid(
    invoiceNumber: string,
    lastInvoiceNumber: string,
  ): boolean {
    const invoiceNumberStructure = /^(\d{3})-(\d{3})-(\d{2})-(\d{8})$/;
    const invoiceNumberHasCorrectFormat: boolean =
      invoiceNumberStructure.test(invoiceNumber) &&
      invoiceNumberStructure.test(lastInvoiceNumber);
    if (!invoiceNumberHasCorrectFormat) return false;
    const invoiceNumbers = invoiceNumber
      .match(invoiceNumberStructure)!
      .slice(1)
      .map(Number);
    const lastInvoiceNumbers = lastInvoiceNumber
      .match(invoiceNumberStructure)!
      .slice(1)
      .map(Number);
    for (let i = 0; i < invoiceNumbers.length; i++) {
      if (invoiceNumbers[i] > lastInvoiceNumbers[i]) return false;
      if (invoiceNumbers[i] < lastInvoiceNumbers[i]) return true;
    }
    return true;
  }

  async searchInvoices(
    searchTerm: string,
    startDate?: Date,
    endDate?: Date,
    statuses?: string[],
  ): Promise<Invoice[]> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return [];

    let query = this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        customers (rtn, name, email),
        invoice_items (*)
      `,
      )
      .eq("company_id", companyId)
      .or(
        `invoice_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%,invoice_items.description.ilike.%${searchTerm}%`,
      )
      .order("date", { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString());
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

  async updateInvoicesStatus(
    invoiceIds: string[],
    newStatus: string,
  ): Promise<void | PostgrestError> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return;

    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: newStatus })
      .in("id", invoiceIds)
      .eq("company_id", companyId);

    if (error) {
      console.error("Error updating invoice statuses:", error);
      return error;
    }
  }

  async getInvoices(): Promise<Invoice[]> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return [];

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
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
      `,
      )
      .eq("company_id", companyId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }

    return data;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(
        `
        *,
        customers (rtn, name, email),
        invoice_items (*)
      `,
      )
      .eq("id", id)
      .eq("company_id", companyId)
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
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return 0;

    const now = new Date();
    let startDate: Date;

    if (period === "week") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 7,
      );
    } else {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("total")
      .eq("company_id", companyId)
      .gte("date", startDate.toISOString())
      .lte("date", now.toISOString());

    if (error) {
      console.error("Error fetching total revenue:", error);
      return 0;
    }

    return data.reduce(
      (sum: number, invoice: { total: number }) => sum + invoice.total,
      0,
    );
  }

  async createInvoiceWithItems(
    invoice: Omit<Invoice, "id" | "created_at" | "updated_at">,
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { invoice_items: invoiceItems, ...rest } = invoice;
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({ ...rest, company_id: companyId })
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

  async updateInvoiceWithItems(
    id: string,
    updates: Partial<Invoice>,
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { invoice_items, ...invoiceUpdates } = updates;

    const { error } = await this.supabase
      .from(this.tableName)
      .update(invoiceUpdates)
      .eq("id", id)
      .eq("company_id", companyId);

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

      const itemsToInsert = invoice_items.map((item) => ({
        ...item,
        invoice_id: id,
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
    invoiceData: Omit<Invoice, "id" | "created_at" | "updated_at">,
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.create<Invoice>(this.tableName, {
      ...invoiceData,
      company_id: companyId,
    });
  }

  async updateInvoice(
    id: string,
    updates: Partial<Invoice>,
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.update(this.tableName, id, updates);
  }

  async createInvoiceItem(
    invoiceItemData: Omit<InvoiceItem, "id" | "created_at" | "updated_at">,
  ): Promise<InvoiceItem | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.create<InvoiceItem>("invoice_items", invoiceItemData);
  }

  async updateInvoiceItem(
    id: string,
    updates: Partial<InvoiceItem>,
  ): Promise<InvoiceItem | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.update("invoice_items", id, updates);
  }

  async getLastInvoice(): Promise<string | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { data, error } = await this.supabase
      .from(this.tableName)
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
