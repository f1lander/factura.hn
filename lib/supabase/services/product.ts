// services/productService.ts
import {
  createClient,
  PostgrestError,
  SupabaseClient,
} from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

class ProductService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // Create a new product
  async createProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from("products")
      .insert(product)
      .single();

    if (error) {
      console.error("Error creating product:", error);
      return null;
    }

    return data;
  }

  // Get a product by ID
  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return null;
    }

    return data;
  }

  // Get all products for a company
  async getProductsByCompany(companyId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId);

    if (error) {
      console.error("Error fetching products:", error);
      return [];
    }

    return data || [];
  }

  // Update a product
  async updateProduct(
    id: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error updating product:", error);
      return null;
    }

    return data;
  }

  // Delete a product
  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      return false;
    }

    return true;
  }

  // Search products by description
  async searchProducts(companyId: string, query: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from("products")
      .select("*")
      .eq("company_id", companyId)
      .ilike("description", `%${query}%`);

    if (error) {
      console.error("Error searching products:", error);
      return [];
    }

    return data || [];
  }

  async updateInventory(productId: string, quantity: number): Promise<boolean> {
    const { data, error } = await this.supabase.rpc(
      "update_product_inventory",
      {
        product_id: productId,
        quantity_change: quantity,
      }
    );

    if (error) {
      console.error("Error updating inventory:", error);
      return false;
    }

    return true;
  }
}

// Export a single instance of the service
export const productService = new ProductService();
