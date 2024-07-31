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
  const requiresCompanyData = ['/invoices', '/products', '/customers'].some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user) {
    if (
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/auth')
    ) {
      // No user, redirect to the login page
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } else if (requiresCompanyData) {
    // User is authenticated, check for company data
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !company) {
      // No company data found, redirect to company setup
      const settingsUrl = new URL('/settings', request.url)
      return NextResponse.redirect(settingsUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}