"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, Mail, User, Bike, Loader2 } from 'lucide-react';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'driver' | 'admin'>('driver');
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
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // Create profile record (usually handled by a trigger, but good to be explicit for MVP)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: data.user.id,
                        email,
                        full_name: fullName,
                        role,
                        vehicle_type: role === 'driver' ? vehicleType : null,
                    }
                ]);

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/driver');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-white">Join V deliveries</CardTitle>
                    <CardDescription className="text-zinc-500">Create your account to start delivering in Lusaka</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                <Input
                                    placeholder="Full Name"
                                    className="pl-10 bg-black border-zinc-800 text-white"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
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

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium">I am a...</label>
                            <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                <SelectTrigger className="bg-black border-zinc-800 text-white">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="driver">Driver (Moto/Car)</SelectItem>
                                    <SelectItem value="admin">Admin / Fleet Manager</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role === 'driver' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-xs text-zinc-500 font-medium">Vehicle Type</label>
                                <div className="relative">
                                    <Bike className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Select value={vehicleType} onValueChange={setVehicleType}>
                                        <SelectTrigger className="pl-10 bg-black border-zinc-800 text-white">
                                            <SelectValue placeholder="Select vehicle" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800">
                                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                                            <SelectItem value="car">Car</SelectItem>
                                            <SelectItem value="bicycle">Bicycle</SelectItem>
                                            <SelectItem value="van">Van</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}
                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-zinc-200 h-12 font-bold"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-zinc-500">
                        Already have an account?{' '}
                        <button onClick={() => router.push('/login')} className="text-white hover:underline">
                            Log In
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
