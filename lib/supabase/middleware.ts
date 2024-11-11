import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  blockedRoutesForGuests,
  blockedRoutesForUsers,
  routesThatRequireCompanyData,
} from "./routeRestrictionsLists";

/**
 * Even though the name of the function is updateSession, it also performs
 * authentication, which it shouldn't (Single responsibility principle).
 *
 * The thing is that I still don't know a way to chain a restrictRoutes middleware,
 * maybe it could be by passing the response object incluing both all Supabase cookies and
 * user object for checking current session.
 *
 * If you can find out a way to implement that, I'd be glad to know your solution :)
 * */
export async function updateSession(request: NextRequest) {
  const isRouteBlockedForGuests: boolean = blockedRoutesForGuests.some(
    (route) => {
      return route.test(request.nextUrl.pathname);
    },
  );

  const routeNeedsACompany: boolean = routesThatRequireCompanyData.some(
    (route) => {
      return route.test(request.nextUrl.pathname);
    },
  );

  const isRouteBlockedForUsers: boolean = blockedRoutesForUsers.some(
    (route) => {
      return route.test(request.nextUrl.pathname);
    },
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  /** This is the code that ACTUALLY write cookies and updates the session */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /** guest is a shorter way to refer to someone who hasn't logged in */
  const isGuest: boolean = user === null;

  /** Redirect to login page in case someone hasn't an active session */
  if (isGuest && isRouteBlockedForGuests) {
    const urlToLoginPage = request.nextUrl.clone();
    urlToLoginPage.pathname = "/auth/login";
    return NextResponse.redirect(urlToLoginPage);
  }

  /** Redirect to settings page in case a user hasn't added data about their company */
  if (!isGuest) {
    // TODO: Write a separate function that checks if the company exists so that it becomes more readable
    const { data: company } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    const companyExists: boolean = company !== undefined && company !== null;
    if (!companyExists && routeNeedsACompany) {
      const urlToSettingsPage = new URL("/home/settings", request.url);
      urlToSettingsPage.searchParams.set("showToast", "companySetupRequired");
      return NextResponse.redirect(urlToSettingsPage);
    }
    if (isRouteBlockedForUsers) {
      const urlToInvoicesPage = new URL("/home/invoices", request.url);
      return NextResponse.redirect(urlToInvoicesPage);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
