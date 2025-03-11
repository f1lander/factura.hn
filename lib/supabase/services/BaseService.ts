import { SupabaseClient } from '@supabase/supabase-js';
import supabase from '../client';

export type Table =
  | 'companies'
  | 'users'
  | 'products'
  | 'customers'
  | 'invoices'
  | 'invoice_items'
  | 'product_register_orders'
  | 'sar_cai';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

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
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found');
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

  protected async getAllPaginated<T>(
    table: Table,
    { page, pageSize }: PaginationOptions
  ): Promise<PaginatedResponse<T>> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return { data: [], total: 0 };

    // Calculate range for pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Get total count
    const countQuery = this.supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (table === 'customers') {
      countQuery.or(`company_id.eq.${companyId},is_universal.eq.true`);
    } else {
      countQuery.eq('company_id', companyId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error(`Error counting ${table}:`, countError);
      return { data: [], total: 0 };
    }

    // Get paginated data
    const dataQuery = this.supabase.from(table).select('*');

    if (table === 'customers') {
      dataQuery.or(`company_id.eq.${companyId},is_universal.eq.true`);
    } else {
      dataQuery.eq('company_id', companyId);
    }

    const { data, error } = await dataQuery
      .range(start, end)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(`Error fetching paginated ${table}:`, error);
      return { data: [], total: 0 };
    }

    return {
      data: data as T[],
      total: count || 0,
    };
  }

  protected async getAll<T>(
    table: Table,
    filters?: Record<string, any>
  ): Promise<T[]> {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return [];

    const query = this.supabase.from(table).select('*');

    // Apply default table-specific filters
    if (table === 'products') {
      query.or('archived.eq.false,archived.is.null');
    }

    if (table === 'customers') {
      query.or(`company_id.eq.${companyId},is_universal.eq.true`);
    } else {
      query.eq('company_id', companyId);
    }

    // Apply additional filters if provided
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query.in(key, value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operators like gt, lt, gte, lte, etc.
          Object.entries(value).forEach(([operator, operatorValue]) => {
            // Type-safe operator handling
            switch (operator) {
              case 'gt':
                query.gt(key, operatorValue);
                break;
              case 'lt':
                query.lt(key, operatorValue);
                break;
              case 'gte':
                query.gte(key, operatorValue);
                break;
              case 'lte':
                query.lte(key, operatorValue);
                break;
              case 'neq':
                query.neq(key, operatorValue);
                break;
              default:
                query.eq(key, operatorValue);
            }
          });
        } else {
          query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;

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

    const insertData =
      table === 'product_register_orders'
        ? item
        : { ...item, company_id: companyId };

    const { data, error } = await this.supabase
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error(`Error creating ${table}:`, error);
      return null;
    }

    return data as T;
  }

  protected async createMultiple<T>(
    table: Table,
    items: Partial<T>[]
  ): Promise<{ success: boolean; message: string }> {
    const companyId = await this.ensureCompanyId();
    if (!companyId)
      return {
        success: false,
        message: 'No existe ninguna compañía. ¿Has iniciado sesión?',
      };

    const rowsWithId = items.map((item) => {
      const newItem = {
        company_id: companyId,
        ...item,
      };
      return newItem;
    });

    console.log('length: ', rowsWithId.length);
    const { error } = await this.supabase.from(table).insert(rowsWithId);

    if (error) {
      console.error(`Error creating ${table}:`, error);
      return {
        success: false,
        message: 'Hubo un error al subir los elementos',
      };
    } else {
      console.log('Se han subido los elementos con éxito');
    }

    return { success: true, message: 'Se subieron los elementos con éxito' };
  }

  protected async update<T>(
    table: Table,
    id: string,
    updates: Partial<T>
  ): Promise<T | null> {
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

  /** This function assumes the items have an id embedded to it */
  protected async updateMultiple<T extends { id: string }>(
    table: Table,
    updates: Array<Partial<T> & { id: string }>
  ): Promise<{ success: boolean; message: string }> {
    const updatedRowsPromise = updates.map(async (update) => {
      const { id, ...otherUpdateFields } = update;
      return await this.supabase
        .from(table)
        .update(otherUpdateFields)
        .eq('id', id);
    });
    const updatedRows = await Promise.all(updatedRowsPromise);
    const didSomeRowUpdateFail = updatedRows.some(
      (updatedRow) => updatedRow.error !== null
    );
    if (didSomeRowUpdateFail)
      return {
        success: false,
        message: 'No se pudieron actualizar los valores',
      };
    return { success: true, message: 'Se actualizaron los valores con éxito' };
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

  protected async search<T>(
    table: Table,
    column: string,
    query: string
  ): Promise<T[]> {
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
}
