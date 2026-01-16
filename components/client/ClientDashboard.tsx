"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Truck,
    Navigation,
    LogOut,
    Package,
    Star,
    Clock,
    Users,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import CreateBookingModal from './CreateBookingModal';
import ProfileModal from '@/components/shared/ProfileModal';
import { useOrders } from '@/hooks/useOrders';
import { getOrderStatusStyles, formatZMW, formatDateTime } from '@/lib/utils';

export default function ClientDashboard() {
    const { user, profile, signOut } = useAuth();
    const { orders: bookings, loading, refresh } = useOrders({ clientId: user?.id });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await signOut();
    };

    useEffect(() => {
        if (!user) return;
        refresh();

        const channel = supabase
            .channel('client-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `client_id=eq.${user.id}`
            }, () => {
                refresh();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, refresh]);

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
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl h-12 w-12 border border-border/50"
                    >
                        {loggingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsProfileOpen(true)}
                        className="bg-secondary/30 p-3 rounded-2xl border border-border/50 backdrop-blur-md hover:bg-secondary/50 transition-all h-12 w-12 flex items-center justify-center"
                    >
                        <Users className="h-6 w-6 text-accent" />
                    </Button>
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
                                <span className="text-xs font-black text-white">12 Mins {/* TODO: Make Dynamic based on historical data */}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-secondary/20 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="text-[10px] font-black text-muted-foreground uppercase">Account Level</span>
                                </div>
                                <span className="text-xs font-black text-white">PREMIUM {/* TODO: Fetch from profile tier */}</span>
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
                                                            {formatDateTime(order.created_at).relative} • {formatDateTime(order.created_at).time}
                                                        </p>
                                                        <p className="text-lg font-black text-white uppercase tracking-tight">{formatZMW(order.price_zmw)}</p>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em]",
                                                    getOrderStatusStyles(order.status)
                                                )}>
                                                    {order.status.replace('_', ' ')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                                                <p className="text-[11px] text-muted-foreground font-medium truncate italic">{order.dropoff_address}</p>
                                            </div>
                                            <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl border border-border/10">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className="w-6 h-6 bg-secondary/50 rounded flex items-center justify-center border border-border/50">
                                                        <Navigation className="h-3 w-3 text-muted-foreground" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-[10px] font-black text-white tracking-tight truncate">
                                                            {order.driver?.full_name?.toUpperCase() || "SEARCHING..."}
                                                        </p>
                                                        {order.driver && (
                                                            <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest truncate">
                                                                {order.driver.vehicle_type || 'Vehicle'} • 4.8★
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-accent tracking-tighter whitespace-nowrap">{formatZMW(order.price_zmw)}</p>
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

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </div>
    );
}
