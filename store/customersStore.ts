import { Customer } from "@/lib/supabase/services/customer";
import { create } from "zustand";

type CustomersStore = {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
};

export const useCustomersStore = create<CustomersStore>((set) => ({
  customers: [],
  setCustomers: (customers) => set({ customers: customers }),
}));
