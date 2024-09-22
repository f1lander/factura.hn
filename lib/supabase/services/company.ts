import { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import supabaseClient from "../client";

export interface Company {
  id: string;
  user_id: string;
  ceo_name: string;
  ceo_lastname: string;
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
  template_url?: string;
  logo_url?: string;
}

class CompanyService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseClient();
  }

  async getCompany(userId: string): Promise<Company | null> {
    if (!userId) {
      console.error("No authenticated user found");
      return null;
    }

    const { data, error } = await this.supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("Error fetching company:", error);
      return null;
    }

    return data;
  }

  async createCompany(
    companyData: Omit<Company, "id">,
  ): Promise<Company[] | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found");
      return null;
    }

    const { data, error } = await this.supabase
      .from("companies")
      .insert({ ...companyData, user_id: user.id })
      .select("*");

    if (error) {
      console.error("Error creating company:", error);
      return null;
    }

    return data as unknown as Company[];
  }

  async updateCompany(
    id: string,
    updates: Partial<Omit<Company, "id" | "user_id">>,
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
}

export const companyService = new CompanyService();
