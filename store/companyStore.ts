import { Company } from "@/lib/supabase/services/company";
import { create } from "zustand";

type CompanyStore = {
  company: Company | null;
  setCompany: (company: Company) => void;
};

export const useCompanyStore = create<CompanyStore>((set) => ({
  company: null,
  setCompany: (company) => set({ company: company }),
}));
