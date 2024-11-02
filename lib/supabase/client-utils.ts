import supabaseClient from "@/lib/supabase/client";
import { companyService } from "./services/company";
export async function getAuthAndCompanyDataClient() {
  const supabase = supabaseClient();

  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError) throw authError;

    if (!user) {
      return { isAuthenticated: false, user: null, company: null, error: null };
    }

    // Fetch company data
    const company = await companyService.getCompany(user.id);

    return {
      isAuthenticated: true,
      user,
      company,
      error: null,
    };
  } catch (error) {
    console.error("Error in authentication or fetching company:", error);
    return {
      isAuthenticated: false,
      user: null,
      company: null,
      error:
        error instanceof Error ? error : new Error("An unknown error occurred"),
    };
  }
}
