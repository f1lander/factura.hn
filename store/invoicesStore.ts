import { Invoice } from "@/lib/supabase/services/invoice";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type InvoicesStore = {
  allInvoices: Invoice[];
  setAllInvoices: (invoices: Invoice[]) => void;
  resetInvoices: () => void;
};

export const useInvoicesStore = create<InvoicesStore>()(
  persist(
    (set) => ({
      allInvoices: [],
      setAllInvoices: (invoices: Invoice[]) => set({ allInvoices: invoices }),
      resetInvoices: () => set({ allInvoices: [] }),
    }),
    {
      name: "invoicesStore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// export const useInvoicesStore = create<InvoicesStore>((set) => ({
//   allInvoices: [],
//   setAllInvoices: (invoices) => set({ allInvoices: invoices }),
// }));
