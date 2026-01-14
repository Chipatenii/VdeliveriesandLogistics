"use client";

import React from 'react';
import { useLocation } from '@/context/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Power, Truck, Banknote, LayoutDashboard } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { useDriverStats } from '@/hooks/useDriverStats';
import { LogOut } from 'lucide-react';
import OrderManagement from './OrderManagement';
import OrderHistory from './OrderHistory';
import { cn, formatZMW } from '@/lib/utils';
import ProfileModal from '@/components/shared/ProfileModal';
import { Loader2 } from 'lucide-react';

// Dynamically import map to avoid SSR issues with Leaflet
const DriverMap = dynamic(() => import('./DriverMap'), { ssr: false });

export default function DriverDashboard() {
    const { coords, isTracking, startTracking, stopTracking, error: locationError } = useLocation();
    const { user, signOut } = useAuth();
    const { totalEarnings, deliveriesCount, loading: statsLoading } = useDriverStats(user?.id);
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [loggingOut, setLoggingOut] = React.useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        await signOut();
    };

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-foreground p-4 md:p-10">
            {/* Header: Title & Context */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
                        DRIVER <span className="text-accent italic">HUB</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isTracking ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-muted shadow-none"
                        )} />
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                            {isTracking ? "ONLINE • LUSAKA CENTER" : "OFFLINE • STANDBY"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
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
                        <LayoutDashboard className="h-6 w-6 text-accent" />
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-card/60 to-card/20 border-border/40 backdrop-blur-2xl rounded-3xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500/30 group-hover:bg-green-500/60 transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 md:p-8 pb-2">
                        <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">EARNINGS</CardTitle>
                        <div className="p-1.5 bg-green-500/10 rounded-lg">
                            <Banknote className="h-3.5 w-3.5 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 md:p-8 pt-0">
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {statsLoading ? "..." : formatZMW(totalEarnings)}
                        </div>
                        <div className="mt-3 h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                                style={{ width: `${Math.min((totalEarnings / 2000) * 100, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-card/60 to-card/20 border-border/40 backdrop-blur-2xl rounded-3xl overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 group-hover:bg-accent/60 transition-colors" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 md:p-8 pb-2">
                        <CardTitle className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">VOLUME</CardTitle>
                        <div className="p-1.5 bg-accent/10 rounded-lg">
                            <Truck className="h-3.5 w-3.5 text-accent" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 md:p-8 pt-0">
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {statsLoading ? "..." : deliveriesCount}
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-2 font-black uppercase tracking-widest opacity-40">Today's Jobs</p>
                    </CardContent>
                </Card>
            </div>

            {/* Order Management Layer */}
            {user && <OrderManagement driverId={user.id} />}

            {/* Map Area */}
            <div className="flex-1 rounded-[2.5rem] overflow-hidden relative border border-border/50 mt-4 shadow-2xl">
                <DriverMap coords={coords} />
                {!isTracking && (
                    <div className="absolute inset-0 bg-background/90 flex items-center justify-center z-[1000] backdrop-blur-xl">
                        <div className="text-center p-8 max-w-[280px]">
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <div className="absolute inset-0 bg-muted/20 rounded-full border-2 border-dashed border-muted/30 animate-spin-slow" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Power className="h-10 w-10 text-muted-foreground/30" />
                                </div>
                            </div>
                            <p className="text-white font-black text-2xl tracking-tighter uppercase">STATION OFFLINE</p>
                            <p className="text-muted-foreground text-xs mt-3 leading-relaxed font-medium uppercase tracking-widest">Enable tracking to broadcast location and receive dispatches</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Persistent Bottom Zone (Thumb Zone) */}
            <div className="mt-6 pb-6">
                {locationError && (
                    <div className="text-destructive text-[10px] mb-3 text-center font-black uppercase tracking-widest bg-destructive/10 p-3 rounded-2xl border border-destructive/20 mx-4">
                        {locationError}
                    </div>
                )}

                <Button
                    size="lg"
                    className={cn(
                        "w-full h-18 text-xl font-black rounded-3xl shadow-2xl transition-all active:scale-95 border-b-6 uppercase tracking-[0.2em]",
                        isTracking
                            ? "bg-destructive hover:bg-destructive/90 text-white border-destructive/50"
                            : "bg-accent hover:bg-accent/90 text-white border-accent/50 shadow-accent/40"
                    )}
                    onClick={isTracking ? stopTracking : startTracking}
                >
                    <Power className="mr-3 h-7 w-7" />
                    {isTracking ? 'GO OFFLINE' : 'GO ONLINE'}
                </Button>
            </div>

            {/* Order History */}
            {user && (
                <div className="mt-4 pb-20 overflow-auto custom-scrollbar">
                    <OrderHistory driverId={user.id} />
                </div>
            )}

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </div>
    );
}
