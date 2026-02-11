import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/register')
  
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/learn') ||
                           request.nextUrl.pathname.startsWith('/admin') ||
                           request.nextUrl.pathname.startsWith('/battle')

  // Redirect unauthenticated users trying to access protected routes
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users trying to access auth pages
  if (user && isAuthPage) {
    // Get user profile to determine role-based redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      const redirectUrl = profile.role === 'teacher' || profile.role === 'system_admin'
        ? '/admin/dashboard'
        : '/learn'
      
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    // Default redirect if profile not found
    return NextResponse.redirect(new URL('/learn', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/login',
    '/register',
    '/learn/:path*',
    '/admin/:path*',
    '/battle/:path*',
  ]
}
