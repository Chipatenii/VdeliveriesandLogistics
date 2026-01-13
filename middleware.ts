import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    res.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    res.cookies.set({
                        name,
                        value: '',
                        ...options,
                    });
                },
            },
        }
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();

    const url = req.nextUrl.clone();
    const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
    const isDashboardPage = url.pathname.startsWith('/dashboard');

    // 1. Redirect unauthenticated users away from protected routes
    if (!session && isDashboardPage) {
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 2. Handle authenticated users
    if (session) {
        // Fetch profile once
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        const role = profile?.role || 'driver'; // Default to driver if fetching fails

        // 3. Prevent authenticated users from visiting login/signup
        if (isAuthPage) {
            if (role === 'admin') url.pathname = '/dashboard/admin';
            else if (role === 'client') url.pathname = '/dashboard/client';
            else url.pathname = '/dashboard/driver';
            return NextResponse.redirect(url);
        }

        // 4. Role-based route protection
        if (isDashboardPage) {
            if (url.pathname.startsWith('/dashboard/admin') && role !== 'admin') {
                url.pathname = '/dashboard/driver';
                return NextResponse.redirect(url);
            }
            if (url.pathname.startsWith('/dashboard/driver') && role !== 'driver') {
                url.pathname = role === 'admin' ? '/dashboard/admin' : '/dashboard/client';
                return NextResponse.redirect(url);
            }
            if (url.pathname.startsWith('/dashboard/client') && role !== 'client') {
                url.pathname = role === 'admin' ? '/dashboard/admin' : '/dashboard/driver';
                return NextResponse.redirect(url);
            }
        }
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/signup'],
};
