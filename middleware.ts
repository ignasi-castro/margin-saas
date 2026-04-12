import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must be called before any conditional logic
  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const protectedRoutes = ['/dashboard', '/onboarding', '/configuracion'];
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r));

  // Sin sesión → login
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Usuario autenticado en /onboarding → comprobar si ya tiene snapshots
  if (user && pathname === '/onboarding') {
    try {
      const { data: snaps } = await supabase
        .from('snapshots')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      if (snaps && snaps.length > 0) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    } catch {
      // Si falla la query, dejar pasar al onboarding
    }
  }

  // Usuario autenticado intentando acceder a /login → dashboard
  if (pathname === '/login' && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
