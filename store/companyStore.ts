import { Company, companyService } from "@/lib/supabase/services/company";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type CompanyStore = {
  company: Company | null;
  setCompany: (company: Company) => void;
  resetCompany: () => void;
  syncCompany: () => void;
};

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set) => ({
      company: null,
      setCompany: (company) => set({ company: company }),
      resetCompany: () => set({ company: null }),
      syncCompany: async () => {
        try {
          const company = await companyService.getCompanyById();
          set({ company });
        } catch (error) {
          console.error("Failed to sync company", error);
        }
      },
    }),
    {
      name: "companyStore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
