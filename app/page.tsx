"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (profile) {
                if (profile.role === 'admin') {
                    router.push('/dashboard/admin');
                } else {
                    router.push('/dashboard/driver');
                }
            }
        }
    }, [user, profile, loading, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black">
            <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-white mx-auto" />
                <p className="text-zinc-500 font-medium">V deliveries is loading...</p>
            </div>
        </div>
    );
}
