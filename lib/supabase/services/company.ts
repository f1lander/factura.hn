import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import supabaseClient from '../client';
import { BaseService } from './BaseService';
import { format, parse } from 'date-fns';

const convertDateFormat = (inputDate: string): string => {
  // Check if the input is in the correct format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  // Split the input string into year, month, and day
  const [year, month, day] = inputDate.split('-');

  // Return the formatted date string
  return `${day}/${month}/${year}`;
};

export interface Company {
  id: string;
  name: string;
  user_id: string;
  rtn?: string;
  address0?: string;
  address1?: string;
  address2?: string;
  ceo_name?: string;
  ceo_lastname?: string;
  phone?: string;
  cai?: string;
  limit_date?: string;
  range_invoice1?: string;
  range_invoice2?: string;
  email?: string;
  template_url?: string;
  logo_url?: string | null;
}

class CompanyService extends BaseService {
  constructor() {
    super();
  }
  private async ensureCompanyIdForCompany(): Promise<string | null> {
    const companyId = await this.ensureCompanyId();

    if (!companyId) {
      console.error('No company ID available for this operation');
    }
    return companyId;
  }

  async getCompany(userId: string): Promise<Company | null> {
    if (!userId) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }

    return data;
  }

  async getCompanyId(): Promise<string | null> {
    const companyId = await this.ensureCompanyIdForCompany();
    if (!companyId) {
      console.error('No company ID available for this operation');
      return null;
    }
    return companyId;
  }

  async getCompanyById(): Promise<Company | null> {
    const companyId = await this.ensureCompanyIdForCompany();

    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    if (error) {
      console.error('Error fetching company:', error);
      return null;
    }
    return data;
  }

  /**
   * Creates a new company entry in the database associated with the authenticated user.
   *
   * @param {Omit<Company, "id">} companyData - The data for the new company, excluding the `id` field which is auto-generated.
   * @returns {Promise<Company[] | null>} A promise that resolves to an array of created companies, or `null` if there was an error or no authenticated user was found.
   *
   * @throws {Error} Logs an error message if there is no authenticated user or if there is an error during the database insertion.
   */

  async createCompany(
    companyData: Omit<Company, 'id'>
  ): Promise<Company[] | null> {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
      return null;
    }

    const { data, error } = await this.supabase
      .from('companies')
      .insert({ ...companyData, user_id: user.id })
      .select('*');

    if (error) {
      console.error('Error creating company:', error);
      return null;
    }

    return data as unknown as Company[];
  }

  // TODO: Create a new version of the createCompany function
  async createCompanyv2(
    companyData: Omit<Company, 'id' | 'user_id'>,
    user_id: string
  ): Promise<{ success: boolean; message: string; data: Company | null }> {
    const { data: companyCreated, error } = await this.supabase
      .from('companies')
      .insert({ ...companyData, user_id })
      .select('*')
      .single();
    console.log('companyCreated is: ', companyCreated);
    if (error !== null) {
      console.log(
        'There was an error when creating the company. The error message is: ',
        error
      );
      return {
        success: false,
        message: 'Hubo un error al crear la compañía',
        data: null,
      };
    }
    return {
      success: true,
      message: 'Se creó la compañía con éxito',
      data: companyCreated,
    };
  }

  async updateCompany(
    id: string,
    updates: Partial<Omit<Company, 'id' | 'user_id'>>
    // ): Promise<PostgrestError | true> {
  ): Promise<{ error: PostgrestError | null }> {
    const { error } = await this.supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error updating company:', error);
      return { error };
    }

    return { error: null };
  }
}

export const companyService = new CompanyService();
