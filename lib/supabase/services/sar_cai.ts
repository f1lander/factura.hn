import { queryClient } from '@/utils/providers/ReactQueryProvider';
import supabase from '../client';
import { BaseService, Table } from './BaseService';

export interface SarCai {
  id: string;
  company_id: string;
  cai: string;
  limit_date: string;
  range_invoice1: string;
  range_invoice2: string;
  created_at: string;
  updated_at: string;
}

class SarCaiService extends BaseService {
  private tableName: Table = 'sar_cai';

  private invalidateSarCaiQueries(companyId: string) {
    queryClient.invalidateQueries(['latestSarCai', companyId]);
    queryClient.invalidateQueries(['sar_cai', companyId]);
    queryClient.invalidateQueries(['latestInvoiceNumberInRange', companyId]);
    queryClient.invalidateQueries(['sar-cai-data', companyId]);
  }

  /**
   * Create a new SAR CAI record
   */
  async createSarCai(
    sarCaiData: Omit<SarCai, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SarCai | null> {
    const now = new Date().toISOString();

    // Start a transaction
    const { data, error: insertError } = await supabase()
      .from(this.tableName)
      .insert({
        ...sarCaiData,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating SAR CAI:', insertError);
      return null;
    }

    // Update company's current_sar_cai_id
    const { error: updateError } = await supabase()
      .from('companies')
      .update({
        current_sar_cai_id: data.id,
        updated_at: now,
      })
      .eq('id', sarCaiData.company_id);

    if (updateError) {
      console.error('Error updating company current SAR CAI:', updateError);
      // Consider rolling back the SAR CAI creation here if needed
      return null;
    }

    if (data) {
      this.invalidateSarCaiQueries(sarCaiData.company_id);
    }

    return data;
  }

  /**
   * Get a SAR CAI record by ID
   */
  async getSarCaiById(id: string): Promise<SarCai | null> {
    const { data, error } = await supabase()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching SAR CAI:', error);
      return null;
    }

    return data;
  }

  /**
   * Get the active SAR CAI for a company
   */
  async getActiveSarCaiByCompanyId(companyId: string): Promise<SarCai | null> {
    // First, get the current_sar_cai_id from the company
    const { data: company, error: companyError } = await supabase()
      .from('companies')
      .select('current_sar_cai_id')
      .eq('id', companyId)
      .single();

    if (companyError || !company || !company.current_sar_cai_id) {
      // If no company or no current SAR CAI, return null
      return null;
    }

    // Then fetch the actual SAR CAI record
    const { data: sarCai, error: sarCaiError } = await supabase()
      .from(this.tableName)
      .select('*')
      .eq('id', company.current_sar_cai_id)
      .single();

    if (sarCaiError) {
      console.error('Error fetching active SAR CAI:', sarCaiError);
      return null;
    }

    return sarCai;
  }

  /**
   * Get all SAR CAI records for a company
   */
  async getSarCaisByCompanyId(companyId: string): Promise<SarCai[]> {
    const { data, error } = await supabase()
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching SAR CAIs:', error);
      return [];
    }

    return data || [];
  }
}

export const sarCaiService = new SarCaiService();
