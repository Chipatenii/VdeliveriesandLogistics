"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
    Users,
    UserPlus,
    MoreVertical,
    ShieldCheck,
    Bike,
    Car,
    Truck,
    Search,
    Filter,
    AlertCircle,

    Copy,
    Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface Driver {
    id: string;
    full_name: string;
    email: string;
    vehicle_type: string;
    is_online: boolean;
    created_at: string;
}

export default function DriverManagementView() {
    const { loading: authLoading, user } = useAuth();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [schemaError, setSchemaError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllDrivers = async () => {
            if (authLoading || !user) return;

            setLoading(true);
            setSchemaError(null);

            // Try fetching with order by created_at
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'driver')
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) {
                console.error("Fetch drivers error:", error);
                // Specifically detect missing column error (PostgREST error code 42703 is undefined_column)
                if (error.message?.includes('created_at') || error.code === '42703') {
                    setSchemaError("MISSING_CREATED_AT");
                    // Fallback: fetch without ordering
                    const fallbackQuery = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('role', 'driver');
                    if (fallbackQuery.data) setDrivers(fallbackQuery.data);
                }
            } else if (data) {
                setDrivers(data);
            }
            setLoading(false);
        };

        fetchAllDrivers();
    }, [authLoading, user]);

    const filteredDrivers = drivers.filter(d =>
        d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getVehicleIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'motorcycle': return <Bike className="h-4 w-4" />;
            case 'car': return <Car className="h-4 w-4" />;
            case 'van': case 'truck': return <Truck className="h-4 w-4" />;
            default: return <Bike className="h-4 w-4" />;
        }
    };

    return (
        <div className="space-y-8">
            {schemaError === "MISSING_CREATED_AT" && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                            <AlertCircle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">Database Schema Sync Required</p>
                            <p className="text-xs text-muted-foreground mt-1">The `created_at` column is missing from your `profiles` table. Please run the provided SQL fix.</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20 rounded-xl px-6 h-10 font-black text-[10px] tracking-widest"
                        onClick={() => window.open('file:///c:/Users/Innocent%20Manda/Documents/VdeliveriesandLogistics/fix_profiles_schema.sql', '_blank')}
                    >
                        VIEW SQL FIX
                    </Button>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">DRIVER REGISTRY</h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <Users className="h-3 w-3 text-accent" />
                        Fleet Member Management & Onboarding
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="SEARCH DRIVERS..."
                            className="pl-10 h-12 bg-secondary/30 border-border rounded-xl text-xs font-bold uppercase tracking-widest focus:ring-accent w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-black px-6 h-12 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-95">
                        <UserPlus className="h-4 w-4 mr-2" />
                        ONBOARD DRIVER
                    </Button>
                </div>
            </div>

            {/* Driver Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDrivers.map((driver) => (
                    <Card key={driver.id} className="bg-card/40 border-border backdrop-blur-md hover:border-accent/40 transition-all group relative overflow-hidden rounded-3xl">
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1",
                            driver.is_online ? "bg-green-500" : "bg-muted/30"
                        )} />
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-secondary/80 rounded-2xl flex items-center justify-center border border-border group-hover:border-accent/40 transition-colors relative">
                                        <Users className="h-7 w-7 text-white/50" />
                                        {driver.is_online && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-card animate-pulse" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-white tracking-tight uppercase leading-none">{driver.full_name}</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2">{driver.email}</p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-secondary/50 rounded-xl transition-colors">
                                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Vehicle Type</p>
                                    <div className="flex items-center gap-2 text-white">
                                        {getVehicleIcon(driver.vehicle_type)}
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{driver.vehicle_type}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50">
                                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">Verification</p>
                                    <div className="flex items-center gap-2 text-green-500">
                                        <ShieldCheck className="h-4 w-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">VERIFIED</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-border/30">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Status</span>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest mt-1",
                                        driver.is_online ? "text-green-500" : "text-muted-foreground/50"
                                    )}>
                                        {driver.is_online ? 'Currently Online' : 'Offline'}
                                    </span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest hover:bg-accent/10 hover:text-accent rounded-lg px-3">
                                    VIEW FILE
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredDrivers.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center bg-secondary/10 border border-dashed border-border rounded-[2.5rem]">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-10 text-muted-foreground" />
                        <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">No drivers found matching criteria</p>
                    </div>
                )}
            </div>
        </div>
    );
}
