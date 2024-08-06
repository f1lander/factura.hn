import { SupabaseClient, User } from "@supabase/supabase-js";
import supabase from "../client";  // Import your existing client

export type Table = 'companies' | 'users' | 'products' | 'customers' | 'invoices' | 'invoice_items';

export class BaseService {
  protected supabase: SupabaseClient;
  private user: User | null = null;
  public companyId: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.supabase = supabase();
    this.initializationPromise = this.initializeAuth();
  }

  protected async initializeAuth(): Promise<void> {
    try {
      if (!this.user) {
        const { data: { user }, error: userError } = await this.supabase.auth.getUser();
        if (userError) throw userError;
        this.user = user;
      }

      if (this.user && !this.companyId) {
        const { data, error: companyError } = await this.supabase
          .from('companies')
          .select('id')
          .eq('user_id', this.user.id)
          .single();

        if (companyError) {
          if (companyError.code === 'PGRST116') {
            // No company found for this user
            console.warn("No company found for the user. They might need to create one.");
            this.companyId = null;
          } else {
            throw companyError;
          }
        } else {
          this.companyId = data.id;
        }
      }

      if (!this.user) {
        throw new Error("User not authenticated");
      }
    } catch (error) {
      console.error("Error in initialization:", error);
      this.initializationPromise = null; // Reset so we can try again
      throw error;
    }
  }

  public async ensureInitialized(): Promise<void> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeAuth();
    }
    await this.initializationPromise;
  }

  protected async requireCompany(): Promise<void> {
    await this.ensureInitialized();
    if (!this.companyId) {
      throw new Error("Company not found. User needs to create or select a company.");
    }
  }

  protected async getAll<T>(table: Table): Promise<T[]> {
    await this.requireCompany();
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('company_id', this.companyId);

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }

    return data as T[];
  }

  protected async getById<T>(table: Table, id: string): Promise<T | null> {
    await this.requireCompany();
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .eq('company_id', this.companyId)
      .single();

    if (error) {
      console.error(`Error fetching ${table} by id:`, error);
      return null;
    }

    return data as T;
  }

  protected async create<T>(table: Table, item: Partial<T>): Promise<T | null> {
    await this.requireCompany();
    const { data, error } = await this.supabase
      .from(table)
      .insert({ ...item, company_id: this.companyId })
      .single();

    if (error) {
      console.error(`Error creating ${table}:`, error);
      return null;
    }

    return data as T;
  }

  protected async update<T>(table: Table, id: string, updates: Partial<T>): Promise<T | null> {
    await this.requireCompany();
    const { data, error } = await this.supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('company_id', this.companyId)
      .single();

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }

    return data as T;
  }

  protected async delete(table: Table, id: string): Promise<boolean> {
    await this.requireCompany();
    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('company_id', this.companyId);

    if (error) {
      console.error(`Error deleting ${table}:`, error);
      return false;
    }

    return true;
  }

  protected async search<T>(table: Table, column: string, query: string): Promise<T[]> {
    await this.requireCompany();
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('company_id', this.companyId)
      .ilike(column, `%${query}%`);

    if (error) {
      console.error(`Error searching ${table}:`, error);
      return [];
    }

    return data as T[];
  }
}
