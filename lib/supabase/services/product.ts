import {
  BaseService,
  Table,
  PaginatedResponse,
} from '@/lib/supabase/services/BaseService';

export interface Product {
  id: string;
  company_id: string;
  sku: string;
  description: string;
  unit_cost: number;
  is_service: boolean;
  quantity_in_stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductToOrder {
  product_id: string;
  product?: Product;
  quantity_delta: number;
}
export interface ProductOrder {
  id?: string;
  type: 'ADD' | 'DELETE';
  update_products: ProductToOrder[];
  reason_description: string;
}

class ProductService extends BaseService {
  private tableName: Table = 'products';
  private ordersTableName: Table = 'product_register_orders';

  async getProductsPaginated(
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<Product>> {
    return this.getAllPaginated<Product>(this.tableName, { page, pageSize });
  }
  async createProduct(
    product: Omit<Product, 'id' | 'company_id' | 'created_at' | 'updated_at'>
  ): Promise<Product | null> {
    return this.create<Product>(this.tableName, product);
  }

  async createMultipleProducts(
    products: Record<string, any>[]
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.createMultiple<Product>(
      this.tableName,
      products
    );
    return response;
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.getById<Product>(this.tableName, id);
  }

  async getProductsByCompany(
    filters: Partial<Product> = {}
  ): Promise<Product[]> {
    return await this.getAll<Product>(this.tableName, filters);
  }

  async getActiveProductsCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .or('archived.eq.false,archived.is.null');

    if (error) {
      console.error('Error getting active products count:', error);
      return 0;
    }

    return count ?? 0;
  }

  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    return this.update<Product>(this.tableName, id, updates);
  }

  async updateMultipleProducts(
    updates: Product[]
  ): Promise<{ success: boolean; message: string }> {
    return this.updateMultiple<Product>(this.tableName, updates);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.delete(this.tableName, id);
  }

  // soft delete: mark as archived
  async deleteMultipleProducts(
    id: string[]
  ): Promise<{ success: boolean; message: string }> {
    const updates = id.map((id) => ({ id, archived: true }));
    return this.updateMultiple<Product>(this.tableName, updates);
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.search<Product>(this.tableName, 'description', query);
  }

  async searchProductsByCompany(
    searchString: string
  ): Promise<
    Pick<Product, 'id' | 'unit_cost' | 'description' | 'is_service'>[]
  > {
    const companyId = await this.ensureCompanyId();
    if (!companyId) return [];
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('company_id', companyId)
      .or('archived.eq.false,archived.is.null')
      .or(`sku.ilike.%${searchString}%,description.ilike.%${searchString}%`);
    if (error || !data) return [];
    return data;
  }

  async generateProductRegisterOrder(
    order: ProductOrder
  ): Promise<ProductOrder | null> {
    const newOrder = await this.create<ProductOrder | null>(
      this.ordersTableName,
      order
    );

    if (!newOrder) {
      console.error('Error generating product register order!');
      return null;
    }

    return newOrder;
  }

  async updateInventory(orderId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('update_product_stock', {
      register_order_id: orderId,
    });

    if (error) {
      console.error('Error updating inventory:', error);
      return false;
    }

    return true;
  }

  // async updateInventory(productId: string, quantity: number): Promise<boolean> {
  //   const { data, error } = await this.supabase.rpc(
  //     "update_product_inventory",
  //     {
  //       product_id: productId,
  //       quantity_change: quantity,
  //     },
  //   );

  //   if (error) {
  //     console.error("Error updating inventory:", error);
  //     return false;
  //   }

  //   return true;
  // }
}

export const productService = new ProductService();
