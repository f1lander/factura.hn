import { getAuthAndCompanyData } from "@/lib/supabase/utils";
import CompanyDataForm from "@/components/molecules/CompanyDataForm";
import { redirect } from "next/navigation";

export default async function Settings() {
  const { isAuthenticated, user, company, error } =
    await getAuthAndCompanyData();

  if (!isAuthenticated || !user) {
    redirect("/auth/login");
  }

  if (error) {
    // You might want to handle this error more gracefully
    throw new Error("Failed to load user or company data");
  }

  // maybe this is the place where I should add the toaster and tell the user they need to
  // add information about the company
  return (
    <div className="container mx-auto">
      <CompanyDataForm initialCompany={company} />
    </div>
  );
}
