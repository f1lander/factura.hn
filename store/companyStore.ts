import { Company } from "@/lib/supabase/services/company";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CompanyStore = {
  company: Company | null;
  setCompany: (company: Company) => void;
  resetCompany: () => void;
};

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      company: null,
      setCompany: (company) => set({ company: company }),
      resetCompany: () => set({ company: null }),
    }),
    {
      name: "companyStore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
