import { SupabaseClient } from "@supabase/supabase-js";
import supabase from "../client";  // Import your existing client

export type Table =
  | "companies"
  | "users"
  | "products"
  | "customers"
  | "invoices"
  | "invoice_items";

export class BaseService {
  protected supabase: SupabaseClient;
  private companyIdPromise: Promise<string | null> | null = null;

  constructor() {
    this.supabase = supabase();
  }

  protected async ensureCompanyId(): Promise<string | null> {
    if (this.companyIdPromise === null) {
      this.companyIdPromise = this.fetchCompanyId();
    }
    return this.companyIdPromise;
  }

  private async fetchCompanyId(): Promise<string | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }

    const { data, error } = await this.supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }

    return data?.id || null;
  }

  protected async getAll<T>(table: Table): Promise<T[]> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return [];

    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('company_id', companyId);

    if (error) {
      console.error(`Error fetching ${table}:`, error);
      return [];
    }

    return data as T[];
  }

  protected async getById<T>(table: Table, id: string): Promise<T | null> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return null;

    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error(`Error fetching ${table} by id:`, error);
      return null;
    }

    return data as T;
  }

  protected async create<T>(table: Table, item: Partial<T>): Promise<T | null> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return null;

    const { data, error } = await this.supabase
      .from(table)
      .insert({ ...item, company_id: companyId })
      .single();

    if (error) {
      console.error(`Error creating ${table}:`, error);
      return null;
    }

    return data as T;
  }

  protected async update<T>(table: Table, id: string, updates: Partial<T>): Promise<T | null> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return null;

    const { data, error } = await this.supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return null;
    }

    return data as T;
  }

  protected async delete(table: Table, id: string): Promise<boolean> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return false;

    const { error } = await this.supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) {
      console.error(`Error deleting ${table}:`, error);
      return false;
    }

    return true;
  }

  protected async search<T>(table: Table, column: string, query: string): Promise<T[]> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return [];

    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .eq('company_id', companyId)
      .ilike(column, `%${query}%`);

    if (error) {
      console.error(`Error searching ${table}:`, error);
      return [];
    }

    return data as T[];
  }
