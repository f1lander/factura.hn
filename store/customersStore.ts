import { Customer } from "@/lib/supabase/services/customer";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CustomersStore = {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
};

export const useCustomersStore = create<CustomersStore>()(
  persist(
    (set) => ({
      customers: [],
      setCustomers: (customers) => set({ customers: customers }),
    }),
    {
      name: "customersStore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
