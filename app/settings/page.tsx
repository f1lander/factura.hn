import { getAuthAndCompanyData } from "@/lib/supabase/utils";
import CompanyDataForm from "@/components/molecules/CompanyDataForm";
import { redirect } from "next/navigation";

export default async function Settings() {
  const { isAuthenticated, user, company, error } = await getAuthAndCompanyData();

  if (!isAuthenticated || !user) {
    redirect("/login");
  }

  if (error) {
    // You might want to handle this error more gracefully
    throw new Error("Failed to load user or company data");
  }

  return (
    <div className="container mx-auto">
      <CompanyDataForm initialCompany={company} />
    </div>
  );
}