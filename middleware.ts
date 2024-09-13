import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if the route requires company data
  const requiresCompanyData = ['/home', '/home/products', '/home/customers'].some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  console.log('requiresCompanyData', requiresCompanyData);

  if (!user) {
    if (
      !request.nextUrl.pathname.startsWith('/auth/login') &&
      !request.nextUrl.pathname.startsWith('/auth')
    ) {
      // No user, redirect to the login page
      const loginUrl = new URL('/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } else if(!request.nextUrl.pathname.startsWith('/home/settings')) {
    // User is authenticated, check for company data
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('company', company);

    if (requiresCompanyData && company === null) {
      console.log('No company data found, redirect to company setup');
      // No company data found, redirect to company setup
      return NextResponse.redirect(new URL('/home/settings', request.url));

    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}