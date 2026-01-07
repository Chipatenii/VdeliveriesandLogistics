"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, AlertCircle, Plus, ScrollText, Activity } from 'lucide-react';
import CreateOrderModal from './CreateOrderModal';
import OrderLogs from './OrderLogs';
import { Button } from '@/components/ui/button';

import AdminSidebar, { AdminView } from './AdminSidebar';
import PayrollView from './PayrollView';
import DriverManagementView from './DriverManagementView';
import SystemSettingsView from './SystemSettingsView';
import OverviewView from './OverviewView';
import { cn } from '@/lib/utils';

const FleetMap = dynamic(() => import('./FleetMap'), { ssr: false });

export default function AdminDashboard() {
    const [activeView, setActiveView] = useState<AdminView>('overview');
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [pickingMode, setPickingMode] = useState<{ type: 'pickup' | 'dropoff', active: boolean }>({ type: 'pickup', active: false });
    const [externalPickup, setExternalPickup] = useState<{ address: string, coords: [number, number] } | null>(null);
    const [externalDropoff, setExternalDropoff] = useState<{ address: string, coords: [number, number] } | null>(null);

    useEffect(() => {
        // ... (existing useEffect logic same as before)
        const fetchDrivers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'driver')
                .eq('is_online', true);

            if (data) setDrivers(data);
            setLoading(false);
        };

        fetchDrivers();

        const subscription = supabase
            .channel('fleet-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
                filter: 'role=eq.driver'
            }, (payload) => {
                const updatedDriver = payload.new as any;
                setDrivers(prev => {
                    const index = prev.findIndex(d => d.id === updatedDriver.id);
                    if (updatedDriver.is_online) {
                        if (index > -1) {
                            const newDrivers = [...prev];
                            newDrivers[index] = updatedDriver;
                            return newDrivers;
                        } else {
                            return [...prev, updatedDriver];
                        }
                    } else {
                        return prev.filter(d => d.id !== updatedDriver.id);
                    }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const renderFleetView = () => (
        <>
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-8 gap-4">
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div>
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter leading-none">FLEET OVERVIEW</h1>
                        <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2 truncate">
                            <Activity className="h-2.5 w-2.5 text-accent" />
                            <span>Real-time Logistics Monitoring</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center justify-center gap-2 bg-secondary/50 px-3 py-2 rounded-xl border border-border backdrop-blur-md h-12">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)] shrink-0" />
                        <span className="text-[10px] font-black tracking-widest uppercase whitespace-nowrap">{drivers.length} DRIVERS ACTIVE</span>
                    </div>
                    <Button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="bg-accent hover:bg-accent/90 text-white font-black px-4 md:px-8 h-12 md:h-12 rounded-xl shadow-lg border-b-4 border-accent/50 transition-all active:scale-95 text-[10px] md:text-base uppercase tracking-widest"
                    >
                        <Plus className="h-3.5 w-3.5 md:h-5 md:w-5 mr-1 md:mr-2" />
                        DISPATCH
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8 mb-8">
                {/* Nearby Fleet - Desktop only or non-empty */}
                <div className={cn(
                    "lg:col-span-1 max-h-[600px] overflow-y-auto space-y-4 pr-2 custom-scrollbar order-2 lg:order-1",
                    drivers.length === 0 ? "hidden lg:block" : "block"
                )}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nearby Fleet</span>
                    </div>
                    {drivers.map(driver => (
                        <Card key={driver.id} className="bg-card/40 border-border hover:border-accent/40 transition-all cursor-pointer backdrop-blur-md group overflow-hidden">
                            <CardContent className="p-3 md:p-4 relative">
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Activity className="h-3 w-3 text-accent" />
                                </div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-black text-white text-sm md:text-base tracking-tight">{driver.full_name || 'Unnamed Driver'}</p>
                                        <p className="text-[9px] md:text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1.5 flex items-center gap-1">
                                            <span className="w-1 h-1 bg-accent rounded-full" />
                                            {driver.vehicle_type}
                                        </p>
                                    </div>
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-secondary/80 rounded-lg md:rounded-xl flex items-center justify-center border border-border">
                                        <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {drivers.length === 0 && !loading && (
                        <div className="hidden lg:flex flex-col items-center justify-center py-16 bg-card/20 border border-dashed border-border rounded-3xl text-center">
                            <AlertCircle className="h-10 w-10 mb-3 opacity-20 text-muted-foreground" />
                            <p className="text-sm font-bold text-muted-foreground font-mono">NO DRIVERS ONLINE</p>
                        </div>
                    )}
                </div>

                <div className={cn(
                    "lg:col-span-3 h-[500px] md:h-[600px] rounded-[2rem] overflow-hidden border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative order-1 lg:order-2",
                    drivers.length === 0 ? "lg:col-span-4" : "lg:col-span-3"
                )}>
                    {pickingMode.active && (
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-top-4 duration-500">
                            <div className="bg-accent text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
                                <MapPin className="h-5 w-5 animate-bounce" />
                                <span className="font-black text-sm tracking-widest uppercase">
                                    Click Map to set {pickingMode.type}
                                </span>
                            </div>
                        </div>
                    )}
                    <FleetMap
                        drivers={drivers}
                        isPicking={pickingMode.active}
                        onPointSelect={(address, coords) => {
                            if (pickingMode.type === 'pickup') {
                                setExternalPickup({ address, coords });
                            } else {
                                setExternalDropoff({ address, coords });
                            }
                            setPickingMode(prev => ({ ...prev, active: false }));
                            setIsOrderModalOpen(true);
                        }}
                    />
                </div>
            </div>

            <div className="mt-8 md:mt-12 pb-24 md:pb-24">
                <OrderLogs />
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <AdminSidebar activeView={activeView} onViewChange={setActiveView} />

            <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 custom-scrollbar relative">
                <div className="max-w-7xl mx-auto">
                    {activeView === 'overview' && <OverviewView />}
                    {activeView === 'fleet' && renderFleetView()}
                    {activeView === 'payroll' && <PayrollView />}
                    {activeView === 'drivers' && <DriverManagementView />}
                    {activeView === 'settings' && <SystemSettingsView />}
                </div>

                <CreateOrderModal
                    isOpen={isOrderModalOpen}
                    onClose={() => setIsOrderModalOpen(false)}
                    onlineDrivers={drivers}
                    onPickFromMap={(type) => {
                        setIsOrderModalOpen(false);
                        setPickingMode({ type, active: true });
                    }}
                    externalPickup={externalPickup}
                    externalDropoff={externalDropoff}
                />
            </main>
        </div>
    );
}
