import { BaseService, Table } from './BaseService';
export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  company_id?: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export class PaymentMethodService extends BaseService {
  protected tableName: Table = 'payment_methods';

  async getAllPaymentMethods(companyId: string): Promise<PaymentMethod[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .or(`company_id.eq.${companyId},is_default.eq.true`)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name');

    if (error) throw error;
    return data;
  }

  async createPaymentMethod(
    method: Partial<PaymentMethod>
  ): Promise<PaymentMethod | null> {
    return this.create<PaymentMethod>(this.tableName, method);
  }

  async updatePaymentMethod(
    id: string,
    method: Partial<PaymentMethod>
  ): Promise<PaymentMethod> {
    // First check if it's a default method
    const { data: existingMethod, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('is_default')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (existingMethod?.is_default) {
      throw new Error('Cannot modify default payment methods');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(method)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePaymentMethod(id: string): Promise<void> {
    // First check if it's a default method
    const { data: existingMethod, error: fetchError } = await this.supabase
      .from(this.tableName)
      .select('is_default')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (existingMethod?.is_default) {
      throw new Error('Cannot delete default payment methods');
    }

    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

export const paymentMethodService = new PaymentMethodService();
