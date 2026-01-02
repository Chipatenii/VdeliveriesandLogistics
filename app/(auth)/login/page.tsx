"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Fetch profile to redirect based on role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user?.id)
            .single();

        if (profile?.role === 'admin') {
            router.push('/dashboard/admin'); // Using cleaner paths
        } else {
            router.push('/dashboard/driver');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
                    <CardDescription className="text-zinc-500">Log in to your V deliveries account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-10 bg-black border-zinc-800 text-white"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-black border-zinc-800 text-white"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200 h-12 font-bold"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-zinc-500">
                        Don't have an account?{' '}
                        <button onClick={() => router.push('/signup')} className="text-white hover:underline">
                            Sign Up
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
