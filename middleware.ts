import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Here's where we get information about the incoming request
// let's make comments for personal understanding
export async function middleware(request: NextRequest) {
  // here we create an instance of the response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requiresCompanyData = [
    "/home",
    "/home/products",
    "/home/customers",
  ].some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user) {
    if (
      !request.nextUrl.pathname.startsWith("/auth/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      const loginUrl = new URL("/auth/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  } else if (!request.nextUrl.pathname.startsWith("/home/settings")) {
    // User is authenticated, check for company data
    const { data: company, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (requiresCompanyData && company === null) {
      const urlWithQuery = new URL("/home/settings", request.url);
      urlWithQuery.searchParams.set("showToast", "companySetupRequired");
      return NextResponse.redirect(urlWithQuery);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
