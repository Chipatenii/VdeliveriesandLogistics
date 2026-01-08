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

    // If user is already signed in and trying to access login/signup
    if (session && (url.pathname === '/login' || url.pathname === '/signup')) {
        // Fetch profile to redirect based on role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        url.pathname = profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/driver';
        return NextResponse.redirect(url);
    }

    // If user is not signed in and trying to access restricted areas
    if (!session && url.pathname.startsWith('/dashboard')) {
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    if (session) {
        // Fetch profile to check role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            // Role-based protection
            if (url.pathname.startsWith('/dashboard/admin') && profile.role !== 'admin') {
                url.pathname = '/dashboard/driver'; // Redirect non-admins to driver dashboard as default
                return NextResponse.redirect(url);
            }
            if (url.pathname.startsWith('/dashboard/driver') && profile.role !== 'driver') {
                url.pathname = profile.role === 'admin' ? '/dashboard/admin' : '/dashboard/client';
                return NextResponse.redirect(url);
            }
        }
    }

    return res;
}

export const config = {
    matcher: ['/dashboard/:path*', '/login', '/signup'],
};
