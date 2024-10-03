import { Company } from "@/lib/supabase/services/company";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CompanyStore = {
  company: Company | null;
  setCompany: (company: Company) => void;
};

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      company: null,
      setCompany: (company) => set({ company: company }),
    }),
    {
      name: "companyStore",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
