import { Customer, customerService } from "@/lib/supabase/services/customer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CustomersStore = {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  resetCustomers: () => void;
  syncCustomers: () => void;
};

export const useCustomersStore = create<CustomersStore>()(
  persist(
    (set) => ({
      customers: [],
      setCustomers: (customers) => set({ customers: customers }),
      resetCustomers: () => set({ customers: [] }),
      syncCustomers: async () => {
        const customers = await customerService.getCustomersByCompany();
        set({ customers });
      },
    }),
    {
      name: "customersStore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
