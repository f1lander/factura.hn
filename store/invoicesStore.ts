import { Invoice } from "@/lib/supabase/services/invoice";
import { create } from "zustand";

type InvoicesStore = {
  allInvoices: Invoice[];
  setAllInvoices: (invoices: Invoice[]) => void;
};

export const useInvoicesStore = create<InvoicesStore>((set) => ({
  allInvoices: [],
  setAllInvoices: (invoices) => set({ allInvoices: invoices }),
}));
