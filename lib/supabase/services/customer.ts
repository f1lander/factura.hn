import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure you have these environment variables set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
  contacts: Contact[];
  created_at?: string;
  updated_at?: string;
}

class CustomerService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Create a new customer
  async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .insert(customer)
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return null;
    }

    return data;
  }

  // Get a customer by ID
  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching customer:', error);
      return null;
    }

    return data;
  }

  // Get all customers for a company
  async getCustomersByCompany(companyId: string): Promise<Customer[]> {
    const { data, error } = await this.supabase
      .from('customers')
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return data || [];
  }

  // Update a customer
  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return null;
    }

    return data;
  }

  // Delete a customer
  async deleteCustomer(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting customer:', error);
      return false;
    }

    return true;
  }

  // Add a contact to a customer
  async addContactToCustomer(customerId: string, contact: Contact): Promise<Customer | null> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;

    const updatedContacts = [...(customer.contacts || []), contact];
    return this.updateCustomer(customerId, { contacts: updatedContacts });
  }

  // Remove a contact from a customer
  async removeContactFromCustomer(customerId: string, contactIndex: number): Promise<Customer | null> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;

    const updatedContacts = customer.contacts.filter((_, index) => index !== contactIndex);
    return this.updateCustomer(customerId, { contacts: updatedContacts });
  }

  // Update a contact for a customer
  async updateContactForCustomer(customerId: string, contactIndex: number, updatedContact: Contact): Promise<Customer | null> {
    const customer = await this.getCustomerById(customerId);
    if (!customer) return null;

    const updatedContacts = customer.contacts.map((contact, index) => 
      index === contactIndex ? updatedContact : contact
    );
    return this.updateCustomer(customerId, { contacts: updatedContacts });
  }
}

// Export a single instance of the service
export const customerService = new CustomerService();