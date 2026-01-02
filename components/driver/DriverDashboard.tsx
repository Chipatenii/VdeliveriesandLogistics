"use client";

import React from 'react';
import { useLocation } from '@/context/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Power, Truck, Banknote } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import OrderManagement from './OrderManagement';

// Dynamically import map to avoid SSR issues with Leaflet
const DriverMap = dynamic(() => import('./DriverMap'), { ssr: false });

export default function DriverDashboard() {
    const { coords, isTracking, startTracking, stopTracking, error } = useLocation();
    const { user } = useAuth();

    return (
        <div className="flex flex-col h-screen bg-black text-white p-4">
            {/* Header / Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-400">Total ZMW</CardTitle>
                        <Banknote className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">K 1,240</div>
                        <p className="text-[10px] text-zinc-500">Target: K 2,000</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-medium text-zinc-400">Deliveries</CardTitle>
                        <Truck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">14</div>
                        <p className="text-[10px] text-zinc-500">Today's Volume</p>
                    </CardContent>
                </Card>
            </div>

            {/* Order Management Layer */}
            {user && <OrderManagement driverId={user.id} />}

            {/* Map Area */}
            <div className="flex-1 rounded-xl overflow-hidden relative border border-zinc-800">
                <DriverMap coords={coords} />
                {!isTracking && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-[1000] backdrop-blur-sm">
                        <p className="text-zinc-400 font-medium">Go online to start tracking</p>
                    </div>
                )}
            </div>

            {/* Persistent Bottom Zone (Thumb Zone) */}
            <div className="mt-4 pb-4">
                {error && <div className="text-red-500 text-xs mb-2 text-center">{error}</div>}

                <Button
                    size="lg"
                    className={`w-full h-16 text-lg font-bold rounded-2xl transition-all active:scale-95 ${isTracking
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                    onClick={isTracking ? stopTracking : startTracking}
                >
                    <Power className="mr-2 h-6 w-6" />
                    {isTracking ? 'GO OFFLINE' : 'GO ONLINE'}
                </Button>
            </div>
        </div>
    );
}
