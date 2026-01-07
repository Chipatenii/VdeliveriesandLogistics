"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Plus,
    History,
    MapPin,
    Truck,
    Navigation,
    LogOut,
    Coins,
    Package,
    ShieldCheck,
    Star,
    Clock,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import CreateBookingModal from './CreateBookingModal';

export default function ClientDashboard() {
    const { user, profile, signOut } = useAuth();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetchBookings();

        const channel = supabase
            .channel('client-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `client_id=eq.${user.id}`
            }, () => {
                fetchBookings();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchBookings = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                driver:profiles!assigned_driver_id(full_name, vehicle_type, phone)
            `)
            .eq('client_id', user?.id)
            .order('created_at', { ascending: false });

        if (!error && data) setBookings(data);
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-foreground p-4 md:p-10 pb-20 custom-scrollbar">
            {/* Top Bar: Identity & Quick Wallet */}
            <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
                        V<span className="text-accent italic">CLIENT</span>
                    </h1>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2">Personal Dispatch Console</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-2">
                        <span className="text-[10px] font-black text-muted-foreground uppercase">Active Wallet</span>
                        <span className="text-lg font-black text-white tracking-tighter">K 1,250.00</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={signOut}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl h-12 w-12 border border-border/50"
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                    <div className="bg-secondary/30 p-3 rounded-2xl border border-border/50 backdrop-blur-md">
                        <Users className="h-6 w-6 text-accent" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Stats & New Dispatch */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-card/60 to-card/20 border-border/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 group-hover:bg-accent/60 transition-colors" />
                        <CardHeader className="p-6 md:p-8 pb-4">
                            <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active Bookings</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 pt-0">
                            <div className="text-5xl font-black text-white tracking-tighter mb-4">
                                {bookings.filter(b => ['pending', 'assigned', 'picked_up'].includes(b.status)).length}
                            </div>
                            <Button
                                className="w-full h-14 md:h-16 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-xl shadow-accent/20 border-b-6 border-accent/50 text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                onClick={() => setIsModalOpen(true)}
                            >
                                <Plus className="h-5 w-5" />
                                NEW DISPATCH
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/40 border-border backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Quick Insights</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-4 w-4 text-accent" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Avg. Pickup</span>
                                </div>
                                <span className="text-xs font-black text-white">12 Mins</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Account Level</span>
                                </div>
                                <span className="text-xs font-black text-white">PREMIUM</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: History List */}
                <div className="lg:col-span-2">
                    <Card className="bg-card/30 border-border backdrop-blur-xl rounded-[2.5rem] overflow-hidden h-full flex flex-col">
                        <div className="p-6 md:p-8 border-b border-border/50 flex items-center justify-between bg-secondary/10">
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tighter uppercase">Activity Log</h2>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Real-time status updates</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Live Stream active</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-4 min-h-[400px]">
                            {loading ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-card/20 rounded-2xl border border-border/50 animate-pulse" />
                                ))
                            ) : bookings.length === 0 ? (
                                <div className="py-20 text-center">
                                    <Package className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">No dispatches found</p>
                                </div>
                            ) : (
                                bookings.map(order => (
                                    <Card key={order.id} className="bg-card/40 border-border/40 rounded-[2rem] overflow-hidden backdrop-blur-md group hover:border-accent/30 transition-all">
                                        <CardContent className="p-5 md:p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-secondary/80 rounded-xl flex items-center justify-center border border-border">
                                                        <Truck className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
                                                            {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        <p className="text-lg font-black text-white uppercase tracking-tight">K {order.price_zmw}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                    order.status === 'delivered' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                        order.status === 'pending' || order.status === 'requested' ? "bg-accent/10 text-accent border border-accent/20" :
                                                            "bg-secondary/50 text-muted-foreground border border-border"
                                                )}>
                                                    {order.status.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-3.5 w-3.5 text-accent" />
                                                    <p className="text-xs text-muted-foreground font-medium truncate italic">{order.dropoff_address}</p>
                                                </div>
                                                {order.driver && (
                                                    <div className="flex items-center gap-2 mt-2 bg-secondary/20 p-3 rounded-xl border border-border/50">
                                                        <ShieldCheck className="h-4 w-4 text-green-500" />
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                                            Assigned: {order.driver.full_name} • {order.driver.vehicle_type}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            <CreateBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                clientId={user?.id || ''}
            />
        </div>
    );
}
