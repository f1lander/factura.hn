// services/companyService.ts
import { createClient, PostgrestError, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface Company {
  id: string;
  name: string;
  rtn: string;
  address0: string;
  address1: string;
  address2: string;
  phone: string;
  cai: string;
  limit_date: string;
  range_invoice1: string;
  range_invoice2: string;
  email: string;
}

class CompanyService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  async getCompany(): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from("companies")
      .select("*")
      .single();

    if (error) {
      console.error("Error fetching company:", error);
      return null;
    }

    return data;
  }
  async createCompany(
    companyData: Omit<Company, "id">
  ): Promise<Company | null> {
    const { data: user } = await this.supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }

    const { data, error } = await this.supabase
      .from("companies")
      .insert({ ...companyData })
      .single();

    if (error) {
      console.error("Error creating company:", error);
      return null;
    }

    return data;
  }

  async updateCompany(
    id: string,
    updates: Partial<Company>
  ): Promise<PostgrestError | true> {
    const { error } = await this.supabase
      .from("companies")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error updating company:", error);
      return error;
    }

    return true;
  }

  async login(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error logging in:", error);
      return null;
    }

    return true;
  }
}

export const companyService = new CompanyService();
