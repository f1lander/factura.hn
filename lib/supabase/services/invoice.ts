import { BaseService, Table } from './BaseService';
import { PostgrestError } from '@supabase/supabase-js';

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
  exento: boolean;
  created_at: string;
  updated_at: string;
  customers: {
    name: string;
    email: string;
    rtn: string;
  };
  invoice_items: InvoiceItem[];
  status: 'pending' | 'paid' | 'cancelled';
  generated_invoice_id?: string | null;
  s3_key?: string | null;
  s3_url?: string | null;
  notes?: string | null;
  delivered_date?: string | null;
  reg_order_id?: string | null;
  sar_cai_id?: string | null;
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
  is_service?: boolean;
}

interface CustomerInfo {
  name: string;
  email: string;
  rtn: string;
}

interface SarCaiInfo {
  id: string;
  invoice_number: string;
  cai: string;
  limit_date: string;
  range_invoice1: string;
  range_invoice2: string;
}

class InvoiceService extends BaseService {
  private tableName: Table = 'invoices';

  /**
   * Ensures that a valid company ID is available for generating an invoice.
   *
   * @private
   * @async
   * @returns {Promise<string | null>} - Returns the company ID as a string if available; otherwise, returns null.
   *   - Logs an error message if no company ID is found.
   *
   * @example
   * async function generateInvoice() {
   *   const companyId = await ensureCompanyIdForInvoice();
   *   if (companyId) {
   *     // Proceed with invoice generation
   *   } else {
   *     // Handle missing company ID case
   *   }
   * }
   */
  private async ensureCompanyIdForInvoice(): Promise<string | null> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) {
      console.error('No company ID available for this operation');
    }
    return companyId;
  }

  /**
   * Determines whether the "Generate Invoice" button should be disabled.
   *
   * The button is disabled if any of the following conditions are met:
   * - At least one invoice item does not have a specified product description.
   * - There are no invoice items.
   * - The customer information is incomplete.
   *
   * @param {InvoiceItem[]} invoiceItems - An array of invoice items.
   * @param {CustomerInfo} customer - The customer's information.
   * @returns {boolean} `true` if the button should be disabled, otherwise `false`.
   */
  generateInvoiceButtonShouldBeDisabled(
    isProforma: boolean,
    invoiceItems: InvoiceItem[],
    customer: CustomerInfo
  ): boolean {
    const anInvoiceItemHasNotSpecifiedProduct: boolean = invoiceItems.some(
      (invoiceItem) => invoiceItem.description.length < 1
    );
    const thereAreNoProductEntries: boolean = invoiceItems.length < 1;
    const noCustomerDefined: boolean =
      'name' in customer && customer.name.length < 1;
    const mustBeHaveRtn: boolean =
      !isProforma && 'rtn' in customer && customer.rtn.length < 1;

    if (
      anInvoiceItemHasNotSpecifiedProduct ||
      thereAreNoProductEntries ||
      noCustomerDefined ||
      mustBeHaveRtn
    ) {
      return true;
    }
    return false;
  }

  /**
   * Generates the next invoice number by incrementing the last segment of the previous invoice number.
   *
   * This method takes a `previousInvoiceNumber` in the format "000-000-00-00000000", splits it into its
   * constituent parts, increments the last 8-digit segment by one, pads it with leading zeros to maintain
   * the required length, and then reconstructs the next invoice number.
   *
   * @param {string} previousInvoiceNumber - The previous invoice number, expected in the format "000-000-00-00000000".
   * @returns {string} - The next invoice number, following the format "000-000-00-00000000".
   *
   * @memberof InvoiceService
   */
  generateNextInvoiceNumber(previousInvoiceNumber: string) {
    const parts = previousInvoiceNumber.split('-');
    const lastPart = parts[parts.length - 1];
    const nextInvoiceNumber = (parseInt(lastPart, 10) + 1)
      .toString()
      .padStart(8, '0');
    parts[parts.length - 1] = nextInvoiceNumber;
    return parts.join('-');
  }

  /**
   * Computes the subtotal, tax, and total for a given list of invoice items.
   *
   * @param {InvoiceItem[]} invoiceItems - Array of items on the invoice. Each item should have:
   *   - {number} quantity - Quantity of the item.
   *   - {number} unit_cost - Unit cost of the item.
   * @returns {{ subtotal: number, tax: number, total: number }} - Object containing:
   *   - subtotal: Sum of all items (quantity * unit_cost for each item).
   *   - tax: Total tax calculated at 15% of the subtotal.
   *   - total: Final total including tax.
   *
   * @example
   * const items = [
   *   { quantity: 2, unit_cost: 50 },
   *   { quantity: 1, unit_cost: 100 }
   * ];
   * computeInvoiceData(items);
   * // Returns: { subtotal: 200, tax: 30, total: 230 }
   *
   * @example
   * const items = [
   *   { quantity: 3, unit_cost: 40 },
   *   { quantity: 4, unit_cost: 60 }
   * ];
   * computeInvoiceData(items);
   * // Returns: { subtotal: 360, tax: 54, total: 414 }
   *
   * @example
   * const items = [
   *   { quantity: 5, unit_cost: 10 },
   *   { quantity: 2, unit_cost: 15 }
   * ];
   * computeInvoiceData(items);
   * // Returns: { subtotal: 80, tax: 12, total: 92 }
   */

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
    lastInvoiceNumber: string
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

  /**
   * Compares two invoice numbers based on their structure and numerical values.
   *
   * @param {string} invoiceNumber1 - The first invoice number to compare. Must follow the format "XXX-XXX-XX-XXXXXXXX".
   * @param {string} invoiceNumber2 - The second invoice number to compare. Must follow the format "XXX-XXX-XX-XXXXXXXX".
   * @returns {"first less than second" | "first greater than second" | "equal" | "invalid"}
   * - "first less than second" if the first invoice number is less than the second.
   * - "first greater than second" if the first invoice number is greater than the second.
   * - "equal" if both invoice numbers are exactly the same.
   * - "invalid" if either of the invoice numbers does not match the required format.
   *
   * @example
   * compareInvoiceNumbers("123-456-78-12345678", "123-456-78-22345678");
   * // Returns: "first less than second"
   *
   * @example
   * compareInvoiceNumbers("123-456-78-22345678", "123-456-78-12345678");
   * // Returns: "first greater than second"
   *
   * @example
   * compareInvoiceNumbers("123-456-78-12345678", "123-456-78-12345678");
   * // Returns: "equal"
   *
   * @example
   * compareInvoiceNumbers("123-456-78-123", "123-456-78-22345678");
   * // Returns: "invalid"
   */

  compareInvoiceNumbers(
    invoiceNumber1: string,
    invoiceNumber2: string
  ):
    | 'first less than second'
    | 'first greater than second'
    | 'equal'
    | 'invalid' {
    const invoiceNumberStructure: RegExp = /^(\d{3})-(\d{3})-(\d{2})-(\d{8})$/;
    const invoiceNumberHasCorrectFormat: boolean =
      invoiceNumberStructure.test(invoiceNumber1) &&
      invoiceNumberStructure.test(invoiceNumber2);
    if (!invoiceNumberHasCorrectFormat) return 'invalid';
    if (invoiceNumber1 === invoiceNumber2) return 'equal';
    const invoice1Numbers = invoiceNumber1
      .match(invoiceNumberStructure)!
      .slice(1)
      .map(Number);
    const invoice2Numbers = invoiceNumber2
      .match(invoiceNumberStructure)!
      .slice(1)
      .map(Number);
    for (let i = 0; i < invoice1Numbers.length; i++) {
      if (invoice1Numbers[i] > invoice2Numbers[i])
        return 'first greater than second';
      if (invoice1Numbers[i] < invoice2Numbers[i])
        return 'first less than second';
    }
    return 'equal';
  }

  /**
   * Validates the next invoice number against the previous invoice number and the last invoice range.
   *
   * This method ensures that the `nextInvoiceNumber` adheres to the required format and falls within
   * the permissible billing range. It performs the following checks:
   *
   * 1. Verifies that `previousInvoiceNumber`, `nextInvoiceNumber`, and `lastInvoiceRange` match the
   *    format `000-000-00-00000000`.
   * 2. Ensures that `nextInvoiceNumber` is within the current billing range as defined by `lastInvoiceRange`.
   * 3. Compares `nextInvoiceNumber` with `previousInvoiceNumber` to ensure proper sequencing.
   *    - If `lastInvoiceExists` is `false`, `nextInvoiceNumber` must be greater than or equal to `previousInvoiceNumber`.
   *    - If `lastInvoiceExists` is `true`, `nextInvoiceNumber` must be strictly greater than `previousInvoiceNumber`.
   *
   * @param {string} previousInvoiceNumber - The previous invoice number, expected in the format "000-000-00-00000000".
   * @param {string} nextInvoiceNumber - The next invoice number to validate, expected in the format "000-000-00-00000000".
   * @param {string} lastInvoiceRange - The last invoice range number, expected in the format "000-000-00-00000000".
   * @param {boolean} lastInvoiceExists - Indicates whether the last invoice in the current range exists.
   * @returns {string|true} - Returns `true` if the `nextInvoiceNumber` is valid. Otherwise, returns a descriptive error message.
   *
   * @memberof InvoiceService
   */
  validateNextInvoiceNumber(
    previousInvoiceNumber: string,
    nextInvoiceNumber: string,
    lastInvoiceRange: string,
    lastInvoiceExists: boolean
  ): string | true {
    const invoiceNumberPattern = /^\d{3}-\d{3}-\d{2}-\d{8}$/;
    if (!invoiceNumberPattern.test(previousInvoiceNumber)) {
      return 'El número de factura anterior debe tener el formato 000-000-00-00000000';
    }
    if (!invoiceNumberPattern.test(nextInvoiceNumber)) {
      return 'El número de factura siguiente debe tener el formato 000-000-00-00000000';
    }
    if (!invoiceNumberPattern.test(lastInvoiceRange)) {
      return 'El número de factura del último rango válido debe tener el formato 000-000-00-00000000';
    }
    if (!this.isInvoiceNumberValid(nextInvoiceNumber, lastInvoiceRange))
      return 'El siguiente número de factura está fuera del rango de facturación actual';
    const nextAndPreviousComparison = this.compareInvoiceNumbers(
      nextInvoiceNumber,
      previousInvoiceNumber
    );
    if (!lastInvoiceExists) {
      const nextGreaterOrEqualThanPrevious =
        nextAndPreviousComparison === 'first greater than second' ||
        nextAndPreviousComparison === 'equal';
      if (!nextGreaterOrEqualThanPrevious) {
        return 'El siguiente número de factura no puede ser menor que el anterior';
      }
    }
    if (lastInvoiceExists) {
      const nextGreaterThanPrevious =
        nextAndPreviousComparison === 'first greater than second';
      if (!nextGreaterThanPrevious)
        return 'El siguiente número de factura debe ser mayor que el anterior';
    }

    return true;
  }

  /**
   * Validates the next invoice number using the SAR CAI system
   *
   * @param {string} previousInvoiceNumber - The previous invoice number
   * @param {string} nextInvoiceNumber - The next invoice number to validate
   * @returns {Promise<string|true>} - Returns `true` if valid, or an error message
   */
  async validateNextInvoiceNumberWithSarCai(
    previousInvoiceNumber: string,
    nextInvoiceNumber: string,
    latestSarCaiInfo?: SarCaiInfo,
    _lastInvoiceExists?: boolean
  ): Promise<string | true> {
    // Get the latest SAR CAI
    const latestSarCai = latestSarCaiInfo || (await this.getLatestSarCai());
    if (!latestSarCai) {
      return 'No se encontró un registro SAR CAI válido';
    }

    // Check if CAI is expired
    const limitDate = new Date(latestSarCai.limit_date);
    const today = new Date();
    if (today > limitDate) {
      return 'El CAI ha expirado. Por favor, actualice su registro CAI antes de continuar.';
    }

    // Check if invoice number is within the allowed range
    if (
      !this.isInvoiceNumberInRange(
        nextInvoiceNumber,
        latestSarCai.range_invoice1,
        latestSarCai.range_invoice2
      )
    ) {
      return `El número de factura ${nextInvoiceNumber} está fuera del rango permitido (${latestSarCai.range_invoice1} - ${latestSarCai.range_invoice2})`;
    }

    // Check if the last invoice exists
    const lastInvoice = _lastInvoiceExists || (await this.getLastInvoice());
    const lastInvoiceExists = !!lastInvoice;

    // Use the existing validation logic with the SAR CAI range
    return this.validateNextInvoiceNumber(
      previousInvoiceNumber,
      nextInvoiceNumber,
      latestSarCai.range_invoice2,
      lastInvoiceExists
    );
  }

  // Helper method to check if invoice number is within range
  private isInvoiceNumberInRange(
    invoiceNumber: string,
    rangeStart: string,
    rangeEnd: string
  ): boolean {
    const compareWithStart = this.compareInvoiceNumbers(
      invoiceNumber,
      rangeStart
    );
    const compareWithEnd = this.compareInvoiceNumbers(invoiceNumber, rangeEnd);

    return (
      (compareWithStart === 'equal' ||
        compareWithStart === 'first greater than second') &&
      (compareWithEnd === 'equal' ||
        compareWithEnd === 'first less than second')
    );
  }

  async searchInvoices(
    searchTerm: string,
    startDate?: Date,
    endDate?: Date,
    statuses?: string[]
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
      `
      )
      .eq('company_id', companyId)
      .or(
        `invoice_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%,invoice_items.description.ilike.%${searchTerm}%`
      )
      .order('date', { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    }

    if (statuses && statuses.length > 0) {
      query = query.in('status', statuses);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching invoices:', error);
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
    newStatus: string
  ): Promise<void | PostgrestError> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return;

    const { error } = await this.supabase
      .from(this.tableName)
      .update({ status: newStatus })
      .in('id', invoiceIds)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error updating invoice statuses:', error);
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
      `
      )
      .eq('company_id', companyId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
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
      `
      )
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
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

  async getTotalRevenue(period: 'week' | 'month'): Promise<number> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return 0;

    const now = new Date();
    let startDate: Date;

    if (period === 'week') {
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
      .from(this.tableName)
      .select('total')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .gte('date', startDate.toISOString())
      .lte('date', now.toISOString());

    if (error) {
      console.error('Error fetching total revenue:', error);
      return 0;
    }

    return data.reduce(
      (sum: number, invoice: { total: number }) => sum + invoice.total,
      0
    );
  }

  async createInvoiceWithItems(
    invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    // Get the appropriate SAR CAI for this invoice number if it exists
    let sarCaiId = null;
    if (invoice.invoice_number) {
      const { isValid, sarCai } = await this.validateInvoiceNumberWithSarCai(
        invoice.invoice_number
      );
      if (isValid && sarCai) {
        sarCaiId = sarCai.id;
      }
    }

    const { invoice_items: invoiceItems, ...rest } = invoice;
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({ ...rest, company_id: companyId, sar_cai_id: sarCaiId })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return null;
    }

    if (invoiceItems && invoiceItems.length > 0) {
      const itemsToInsert = invoiceItems.map(({ id, ...item }) => ({
        ...item,
        invoice_id: data.id,
      }));

      const { error: itemsError } = await this.supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        // You might want to delete the invoice here if items fail to insert
        return null;
      }
    }

    return this.getInvoiceById(data.id);
  }

  async updateInvoiceWithItems(
    id: string,
    updates: Partial<Invoice>
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { invoice_items, ...invoiceUpdates } = updates;
    console.log({ updates });
    const { error } = await this.supabase
      .from(this.tableName)
      .update(invoiceUpdates)
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error updating invoice:', error);
      return null;
    }

    if (invoice_items && invoice_items.length > 0) {
      const { error: deleteError } = await this.supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);

      if (deleteError) {
        console.error('Error deleting old invoice items:', deleteError);
        return null;
      }

      const itemsToInsert = invoice_items.map(({ id: itemId, ...item }) => ({
        ...item,
        invoice_id: id,
      }));

      const { error: insertError } = await this.supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (insertError) {
        console.error('Error inserting new invoice items:', insertError);
        return null;
      }
    }

    return this.getInvoiceById(id);
  }

  async createInvoice(
    invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
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
    updates: Partial<Invoice>
  ): Promise<Invoice | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.update(this.tableName, id, updates);
  }

  async createInvoiceItem(
    invoiceItemData: Omit<InvoiceItem, 'id' | 'created_at' | 'updated_at'>
  ): Promise<InvoiceItem | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.create<InvoiceItem>('invoice_items', invoiceItemData);
  }

  async updateInvoiceItem(
    id: string,
    updates: Partial<InvoiceItem>
  ): Promise<InvoiceItem | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    return this.update('invoice_items', id, updates);
  }

  async getLastInvoice(): Promise<string | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const sarCai = await this.getLatestSarCai();
    if (!sarCai) return null;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('invoice_number')
      .eq('company_id', companyId)
      .lte('invoice_number', sarCai.range_invoice2)
      .gte('invoice_number', sarCai.range_invoice1)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching last invoice:', error);
      return null;
    }

    return data.invoice_number;
  }

  /**
   * Gets the latest invoice number using a direct SQL query within the range of the latest SAR CAI
   *
   * @returns {Promise<string | null>} The latest invoice number or null if not found
   */
  async getLatestInvoiceNumberInSarCaiRange(): Promise<string | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { data, error } = await this.supabase.rpc(
      'get_latest_invoice_number_in_range',
      {
        p_company_id: companyId,
      }
    );

    if (error) {
      console.error('Error fetching latest invoice number in range:', error);
      return null;
    }

    return data;
  }

  /**
   * Gets the latest SAR CAI entry for the current company
   *
   * @returns {Promise<{id: string, cai: string, range_invoice1: string, range_invoice2: string, expiration_date: string} | null>}
   */
  async getLatestSarCai(): Promise<any | null> {
    const companyId = await this.ensureCompanyIdForInvoice();
    if (!companyId) return null;

    const { data: companyData, error: companyError } = await this.supabase
      .from('companies')
      .select(
        'current_sar_cai_id, sar_cai!companies_current_sar_cai_id_fkey(*)'
      )
      .eq('id', companyId)
      .single();

    if (companyError) {
      console.error('Error fetching company SAR CAI:', companyError);
      return null;
    }

    const { data, error } = await this.supabase
      .from('sar_cai')
      .select('*')
      .eq('id', companyData.current_sar_cai_id)
      .single();

    if (error) {
      console.error('Error fetching latest SAR CAI:', error);
      return null;
    }

    return data;
  }

  /**
   * Validates if an invoice number is within a valid SAR CAI range
   *
   * @param {string} invoiceNumber - The invoice number to validate
   * @returns {Promise<{isValid: boolean, sarCai: any | null}>}
   */
  async validateInvoiceNumberWithSarCai(
    invoiceNumber: string
  ): Promise<{ isValid: boolean; sarCai: any | null }> {
    const sarCai = await this.getLatestSarCai();

    if (!sarCai) {
      console.error('No active SAR CAI found');
      return { isValid: false, sarCai: null };
    }

    if (this.isInvoiceNumberValid(invoiceNumber, sarCai.range_invoice2)) {
      return { isValid: true, sarCai };
    }

    return { isValid: false, sarCai: null };
  }
}

export const invoiceService = new InvoiceService();
