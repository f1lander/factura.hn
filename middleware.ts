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

  // supabase service for interacting with the database
  // yes, we're interacting with databases before the request
  // arrives our app
  const supabase = createClient();

  // Before the user makes a request, we try to get information about the user
  // by making use of the getUser() method
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // This is a flag that tells us the path we're trying to access
  // needs company data
  const requiresCompanyData = [
    "/home",
    "/home/products",
    "/home/customers",
  ].some((path) => request.nextUrl.pathname.startsWith(path));

  console.log("requiresCompanyData", requiresCompanyData);

  if (!user) {
    if (
      !request.nextUrl.pathname.startsWith("/auth/login") &&
      !request.nextUrl.pathname.startsWith("/auth")
    ) {
      // No user, redirect to the login page
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

    console.log("company", company);

    // If you're trying to access a route that
    if (requiresCompanyData && company === null) {
      console.log("No company data found, redirect to company setup");
      // No company data found, redirect to company setup
      return NextResponse.redirect(new URL("/home/settings", request.url));
      // this is the place where we should do something for
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
