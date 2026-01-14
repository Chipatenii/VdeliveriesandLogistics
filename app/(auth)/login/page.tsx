"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react';

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

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (signInError) {
                setError(signInError.message.includes('Email not confirmed')
                    ? 'Please verify your email address.'
                    : signInError.message);
                setLoading(false);
                return;
            }

            if (!data.user) {
                setError('Login failed. Please try again.');
                setLoading(false);
                return;
            }

            // Fetch profile to redirect based on role
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.error('Profile fetch error:', profileError);
                // Fallback: the middleware will handle unauthorized access
                router.push('/dashboard/driver');
                return;
            }

            if (profile?.role === 'admin') {
                router.push('/dashboard/admin');
            } else if (profile?.role === 'client') {
                router.push('/dashboard/client');
            } else {
                router.push('/dashboard/driver');
            }
        } catch (err: any) {
            console.error('Unexpected login error:', err);
            setError('A system error occurred. Please refresh and try again.');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 antialiased">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                        <Lock className="h-8 w-8 text-accent" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">WELCOME BACK</h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">Logistics Portal • V Deliveries</p>
                </div>

                <Card className="bg-card/40 border-border backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
                    <CardHeader className="pt-8 pb-4 text-center">
                        <CardTitle className="text-xl font-black text-white px-6">Secure Sign In</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium">Enter your credentials to access the dashboard</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="admin@vdeliveries.com"
                                        autoComplete="email"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive text-xs font-bold text-center">
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-lg border-b-4 border-accent/50 transition-all active:scale-95 text-lg"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                                    <>
                                        SIGN IN
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted-foreground font-bold">
                                NEW TO THE FLEET?{' '}
                                <button
                                    onClick={() => router.push('/signup')}
                                    className="text-accent hover:text-accent/80 transition-colors uppercase ml-1 tracking-tighter"
                                >
                                    Register Now
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
