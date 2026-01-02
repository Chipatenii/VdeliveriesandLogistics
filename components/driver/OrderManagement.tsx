"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Package, CheckCircle2, Navigation } from 'lucide-react';

export default function OrderManagement({ driverId }: { driverId: string }) {
    const [activeOrder, setActiveOrder] = useState<any | null>(null);
    const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);

    useEffect(() => {
        // 1. Check for existing assigned order
        const fetchActiveOrder = async () => {
            const { data } = await supabase
                .from('orders')
                .select('*')
                .eq('assigned_driver_id', driverId)
                .in('status', ['assigned', 'picked_up'])
                .single();

            if (data) setActiveOrder(data);
        };

        fetchActiveOrder();

        // 2. Listen for new order assignments
        const channel = supabase
            .channel(`driver-orders-${driverId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `assigned_driver_id=eq.${driverId}`
            }, (payload) => {
                setNewOrderAlert(payload.new);
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `assigned_driver_id=eq.${driverId}`
            }, (payload) => {
                const order = payload.new as any;
                if (order.status === 'delivered' || order.status === 'cancelled') {
                    setActiveOrder(null);
                } else {
                    setActiveOrder(order);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [driverId]);

    const handleAcceptOrder = async () => {
        if (!newOrderAlert) return;
        const { error } = await supabase
            .from('orders')
            .update({ status: 'assigned' })
            .eq('id', newOrderAlert.id);

        if (!error) {
            setActiveOrder(newOrderAlert);
            setNewOrderAlert(null);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!activeOrder) return;
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', activeOrder.id);

        if (!error) {
            if (status === 'delivered') {
                setActiveOrder(null);
            } else {
                setActiveOrder({ ...activeOrder, status });
            }
        }
    };

    if (newOrderAlert) {
        return (
            <div className="fixed bottom-24 inset-x-4 bg-white text-black p-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 duration-500 z-[2000]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-yellow-100 p-2 rounded-full">
                        <Package className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="font-bold text-lg">New Delivery Available!</p>
                        <p className="text-sm text-zinc-600">K {newOrderAlert.price_zmw} • {newOrderAlert.pickup_address}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setNewOrderAlert(null)} variant="outline" className="flex-1 border-zinc-200 text-zinc-500">
                        Decline
                    </Button>
                    <Button onClick={handleAcceptOrder} className="flex-1 bg-black text-white hover:bg-zinc-800">
                        Accept Order
                    </Button>
                </div>
            </div>
        );
    }

    if (activeOrder) {
        return (
            <Card className="bg-zinc-900 border-zinc-800 mt-4 overflow-hidden">
                <div className="bg-blue-600 h-1" />
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Active Order</p>
                            <p className="text-white font-bold">{activeOrder.customer_name}</p>
                        </div>
                        <p className="bg-zinc-800 px-2 py-1 rounded text-xs text-blue-400 font-bold uppercase">{activeOrder.status.replace('_', ' ')}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                            <div>
                                <p className="text-[10px] text-zinc-500">Pick up at</p>
                                <p className="text-sm text-white">{activeOrder.pickup_address}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-red-500 mt-1 shrink-0" />
                            <div>
                                <p className="text-[10px] text-zinc-500">Deliver to</p>
                                <p className="text-sm text-white">{activeOrder.dropoff_address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 bg-zinc-800 border-none text-white hover:bg-zinc-700">
                            <Navigation className="h-4 w-4 mr-2" />
                            Navigate
                        </Button>

                        {activeOrder.status === 'assigned' ? (
                            <Button
                                onClick={() => handleUpdateStatus('picked_up')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                Mark as Picked Up
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleUpdateStatus('delivered')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Done
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="text-center py-8 text-zinc-600 italic">
            <p>No active orders</p>
        </div>
    );
}
