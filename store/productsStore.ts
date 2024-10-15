import { Product, productService } from "@/lib/supabase/services/product";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ProductsStore = {
  products: Product[];
  setProducts: (products: Product[]) => void;
  resetProducts: () => void;
  syncProducts: () => void;
};

export const useProductsStore = create<ProductsStore>()(
  persist(
    (set) => ({
      products: [],
      setProducts: (products) => set({ products: products }),
      resetProducts: () => set({ products: [] }),
      syncProducts: async () => {
        const products = await productService.getProductsByCompany();
        set({ products });
      },
    }),
    {
      name: "productsStore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
