"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Mail, User, Bike, Loader2, ArrowRight } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'driver' | 'admin' | 'client'>('client');
    const [vehicleType, setVehicleType] = useState<string>('motorcycle');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: role,
                    vehicle_type: role === 'driver' ? vehicleType : null,
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            if (!data.session) {
                setError('Registration successful! Please check your email to confirm your account before logging in.');
                setLoading(false);
                return;
            }

            if (role === 'admin') router.push('/dashboard/admin');
            else if (role === 'driver') router.push('/dashboard/driver');
            else router.push('/dashboard/client');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 antialiased">
            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-4">
                        <User className="h-8 w-8 text-accent" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-foreground">JOIN THE FLEET</h1>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">Registration • V Deliveries</p>
                </div>

                <Card className="bg-card/40 border-border backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden mb-12">
                    <CardHeader className="pt-8 pb-4 text-center">
                        <CardTitle className="text-xl font-black text-white px-6">Create Account</CardTitle>
                        <CardDescription className="text-muted-foreground font-medium px-4">Join Lusaka's premium delivery network</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        placeholder="Innocent Manda"
                                        autoComplete="name"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fleet Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="email"
                                        placeholder="name@vdeliveries.com"
                                        autoComplete="email"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        autoComplete="new-password"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-center block">Account Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setRole('client')}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${role === 'client' ? 'bg-accent/10 border-accent text-accent' : 'bg-secondary/30 border-border text-muted-foreground hover:border-muted-foreground/30'}`}
                                    >
                                        <User className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Client</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('driver')}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${role === 'driver' ? 'bg-accent/10 border-accent text-accent' : 'bg-secondary/30 border-border text-muted-foreground hover:border-muted-foreground/30'}`}
                                    >
                                        <Bike className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Driver</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole('admin')}
                                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${role === 'admin' ? 'bg-accent/10 border-accent text-accent' : 'bg-secondary/30 border-border text-muted-foreground hover:border-muted-foreground/30'}`}
                                    >
                                        <Lock className="h-6 w-6" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Admin</span>
                                    </button>
                                </div>
                            </div>

                            {role === 'driver' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Vehicle Specification</label>
                                    <div className="relative">
                                        <Bike className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Select value={vehicleType} onValueChange={setVehicleType}>
                                            <SelectTrigger className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium">
                                                <SelectValue placeholder="Select vehicle" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border rounded-2xl">
                                                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                                <SelectItem value="car">Car</SelectItem>
                                                <SelectItem value="bicycle">Bicycle</SelectItem>
                                                <SelectItem value="van">Van</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive text-xs font-bold text-center">
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-lg border-b-4 border-accent/50 transition-all active:scale-scale-95 text-lg"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (
                                    <>
                                        START JOURNEY
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </form>
                        <div className="mt-8 text-center pb-4">
                            <p className="text-sm text-muted-foreground font-bold italic">
                                ALREADY REGISTERED?{' '}
                                <button
                                    onClick={() => router.push('/login')}
                                    className="text-accent hover:text-accent/80 transition-colors uppercase ml-1 tracking-tighter"
                                >
                                    Log In
                                </button>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
