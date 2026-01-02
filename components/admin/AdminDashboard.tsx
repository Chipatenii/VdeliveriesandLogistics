"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MapPin, AlertCircle, Plus } from 'lucide-react';
import CreateOrderModal from './CreateOrderModal';
import { Button } from '@/components/ui/button';

const FleetMap = dynamic(() => import('./FleetMap'), { ssr: false });

export default function AdminDashboard() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    useEffect(() => {
        // 1. Initial fetch of online drivers
        const fetchDrivers = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'driver')
                .eq('is_online', true);

            if (data) setDrivers(data);
            setLoading(false);
        };

        fetchDrivers();

        // 2. Subscribe to realtime updates for profile locations
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
                        // Remove if they went offline
                        return prev.filter(d => d.id !== updatedDriver.id);
                    }
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Fleet Overview</h1>
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => setIsOrderModalOpen(true)}
                        className="bg-white text-black hover:bg-zinc-200 font-bold px-6 h-10 rounded-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Dispatch Order
                    </Button>
                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">{drivers.length} Drivers Online</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Sidebar: Driver List */}
                <div className="lg:col-span-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {drivers.map(driver => (
                        <Card key={driver.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-zinc-100">{driver.full_name || 'Unnamed Driver'}</p>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{driver.vehicle_type}</p>
                                    </div>
                                    <Users className="h-4 w-4 text-zinc-600" />
                                </div>
                                <div className="mt-4 flex items-center text-xs text-zinc-400">
                                    <MapPin className="h-3 w-3 mr-1 text-zinc-600" />
                                    Live Tracking
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {drivers.length === 0 && !loading && (
                        <div className="text-center py-12 text-zinc-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>No drivers online</p>
                        </div>
                    )}
                </div>

                {/* Main: Large Fleet Map */}
                <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative">
                    <FleetMap drivers={drivers} />
                </div>
            </div>

            <CreateOrderModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                onlineDrivers={drivers}
            />
        </div>
    );
}
