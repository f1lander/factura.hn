import { Product } from "@/lib/supabase/services/product";
import { create } from "zustand";

type ProductsStore = {
  products: Product[];
  setProducts: (products: Product[]) => void;
};

export const useCompanyStore = create<ProductsStore>((set) => ({
  products: [],
  setProducts: (products) => set({ products: products }),
}));
