import { BaseService, Table } from '@/lib/supabase/services/BaseService';

// Contact type definition
export interface Contact {
  name: string;
  position: string;
  email: string;
  phone: string;
}

// Customer type definition
export interface Customer {
  id: string;
  company_id: string;
  name: string;
  rtn: string;
  email: string;
  is_universal?: boolean;
  contacts: Contact[];
  created_at?: string;
  updated_at?: string;
  archived?: boolean;
}

class CustomerService extends BaseService {
  private tableName: Table = 'customers';

  // Helper method to ensure company ID is available
  private async ensureCompanyIdForCustomer(): Promise<string | null> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) {
      console.error('No company ID available for this operation');
    }
    return companyId;
  }

  // Create a new customer
  async createCustomer(
    customer: Omit<Customer, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<Customer | null> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return null;
    return this.create<Customer>(this.tableName, {
      ...customer,
      company_id: companyId,
    });
  }

  // Get a customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return null;
    return this.getById<Customer>(this.tableName, id);
  }

  // Get all customers for the company
  async getCustomersByCompany(): Promise<Customer[]> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return [];
    return this.getAll<Customer>(this.tableName);
  }

  async getUniversalCustomers(): Promise<Customer[]> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return [];
    return this.getAll<Customer>(this.tableName, { is_universal: true });
  }

  async getCustomersByCompanyAndCustomerName(customerName: string): Promise<
    // { id: string | number; name: string; email: string; rtn: string }[]
    Pick<Customer, 'id' | 'name' | 'rtn' | 'email'>[]
  > {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return [];
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id, name, email, rtn')
      .or(`company_id.eq.${companyId},is_universal.eq.true`)
      .or(`archived.eq.false,archived.is.null`)
      .ilike('name', `%${customerName}%`);
    if (error || !data) return [];
    return data;
  }

  // Update a customer
  async updateCustomer(
    id: string,
    updates: Partial<Customer>
  ): Promise<Customer | null> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return null;
    return this.update<Customer>(this.tableName, id, updates);
  }

  async updateMultipleCustomers(
    customers: Partial<Customer>[]
  ): Promise<{ success: boolean; message: string }> {
    const filteredCustomers = customers.filter(
      (customer) => !customer.is_universal
    );
    const response = await this.updateMultiple<Customer>(
      this.tableName,
      filteredCustomers as Customer[]
    );
    return response;
  }

  // Delete a customer
  async deleteCustomer(id: string): Promise<boolean> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return false;
    return this.delete(this.tableName, id);
  }

  // Add a contact to a customer
  async addContactToCustomer(
    customerId: string,
    contact: Contact
  ): Promise<Customer | null> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return null;

    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;

    const updatedContacts = [...(customer.contacts || []), contact];
    return this.updateCustomer(customerId, { contacts: updatedContacts });
  }

  async createMultipleCustomers(
    customers: Record<string, any>[]
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.createMultiple<Customer>(
      this.tableName,
      customers
    );
    return response;
  }

  // Remove a contact from a customer
  async removeContactFromCustomer(
    customerId: string,
    contactIndex: number
  ): Promise<Customer | null> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return null;

    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;

    const updatedContacts = customer.contacts.filter(
      (_, index) => index !== contactIndex
    );
    return this.updateCustomer(customerId, { contacts: updatedContacts });
  }

  // Update a contact for a customer
  async updateContactForCustomer(
    customerId: string,
    contactIndex: number,
    updatedContact: Contact
  ): Promise<Customer | null> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return null;

    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;

    const updatedContacts = customer.contacts.map((contact, index) =>
      index === contactIndex ? updatedContact : contact
    );
    return this.updateCustomer(customerId, { contacts: updatedContacts });
  }

  // Search customers by name or email
  async searchCustomers(query: string): Promise<Customer[]> {
    const companyId = await this.ensureCompanyIdForCustomer();
    if (!companyId) return [];

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`);

    if (error) {
      console.error('Error searching customers:', error);
      return [];
    }

    return data as Customer[];
  }

  // Archive a customer
  async archiveCustomers(
    ids: string[]
  ): Promise<{ success: boolean; message: string }> {
    return this.updateMultipleCustomers(
      ids.map((id) => ({
        id,
        archived: true,
      }))
    );
  }
}

// Export a single instance of the service
export const customerService = new CustomerService();
