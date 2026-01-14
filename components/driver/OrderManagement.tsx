"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Package, CheckCircle2, Navigation, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '@/components/ui/toaster';
import { getOrderStatusStyles, formatZMW } from '@/lib/utils';

export default function OrderManagement({ driverId }: { driverId: string }) {
    const [activeOrder, setActiveOrder] = useState<any | null>(null);
    const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchActiveOrder = async () => {
            // Priority 1: Current active order (assigned/picked_up)
            const { data: active } = await supabase
                .from('orders')
                .select('*')
                .eq('assigned_driver_id', driverId)
                .in('status', ['assigned', 'picked_up'])
                .maybeSingle();

            if (active) {
                setActiveOrder(active);
                return;
            }

            // Priority 2: New pending orders that haven't been assigned yet
            const { data: pending } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (pending) setNewOrderAlert(pending);
        };

        fetchActiveOrder();

        const channel = supabase
            .channel(`driver-orders-${driverId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: 'status=eq.pending'
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
        setLoading(true);

        // ATOMIC UPDATE: Only update if the status is still 'pending'
        const { data, error } = await supabase
            .from('orders')
            .update({
                status: 'assigned',
                assigned_driver_id: driverId
            })
            .eq('id', newOrderAlert.id)
            .eq('status', 'pending')
            .select();

        if (error || !data || data.length === 0) {
            console.error('Failed to claim order:', error);
            toast('Order taken by another driver or unavailable.', 'error');
            setNewOrderAlert(null);
        } else {
            toast('Order claimed successfully!', 'success');
            setActiveOrder({ ...newOrderAlert, status: 'assigned', assigned_driver_id: driverId });
            setNewOrderAlert(null);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (status: string) => {
        if (!activeOrder) return;
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', activeOrder.id);

        if (!error) {
            toast(`Status updated to ${status.replace('_', ' ')}`, 'success');
            if (status === 'delivered') {
                setActiveOrder(null);
            } else {
                setActiveOrder({ ...activeOrder, status });
            }
        } else {
            toast('Failed to update status.', 'error');
        }
    };

    if (newOrderAlert) {
        return (
            <div className="fixed bottom-28 inset-x-4 bg-accent/90 backdrop-blur-2xl text-white p-6 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-accent/20 animate-in slide-in-from-bottom-20 duration-700 z-[2000]">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-white/10 p-4 rounded-3xl border border-white/20">
                        <Package className="h-8 w-8 text-white animate-bounce" />
                    </div>
                    <div>
                        <p className="font-black text-2xl tracking-tighter">NEW JOB ALERT!</p>
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest mt-1">
                            K {newOrderAlert.price_zmw} • {newOrderAlert.pickup_address.split(',')[0]}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setNewOrderAlert(null)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black h-16 rounded-[2rem] border border-white/10 uppercase tracking-widest text-[10px]"
                    >
                        DECLINE
                    </Button>
                    <Button
                        onClick={handleAcceptOrder}
                        disabled={loading}
                        className="flex-[2] bg-white text-accent hover:bg-white/90 font-black h-16 rounded-[2rem] shadow-xl px-8"
                    >
                        {loading ? 'ACCEPTING...' : (
                            <>
                                ACCEPT JOB
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    if (activeOrder) {
        return (
            <Card className="bg-card/40 border-accent/30 mt-4 overflow-hidden rounded-[2rem] shadow-2xl backdrop-blur-xl relative">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-accent opacity-50" />
                <CardContent className="p-5 md:p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mb-1">In-Progress Task</p>
                            <p className="text-xl font-black text-white tracking-tight leading-none">{activeOrder.customer_name.toUpperCase()}</p>
                        </div>
                        <div className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em]",
                            getOrderStatusStyles(activeOrder.status)
                        )}>
                            {activeOrder.status.replace('_', ' ')}
                        </div>
                    </div>

                    <div className="space-y-6 mb-8 relative">
                        <div className="absolute left-[9px] top-4 bottom-4 w-0.5 bg-border border-dashed opacity-50" />

                        <div className="flex items-start gap-4">
                            <div className="w-5 h-5 bg-green-500 rounded-full border-4 border-background shrink-0 mt-1 z-10" />
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pick up From</p>
                                <p className="text-sm font-bold text-white leading-relaxed">{activeOrder.pickup_address}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-5 h-5 bg-destructive rounded-full border-4 border-background shrink-0 mt-1 z-10" />
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Drop off To</p>
                                <p className="text-sm font-bold text-white leading-relaxed">{activeOrder.dropoff_address}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-secondary/20 p-5 rounded-2xl border border-border/50 mb-8 space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Package className="h-3 w-3 text-accent" />
                                Shipment Contents
                            </p>
                            <p className="text-xs font-bold text-white">{activeOrder.item_description || 'General Parcel'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
                            <div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Recipient</p>
                                <p className="text-xs font-bold text-white truncate">{activeOrder.receiver_name || 'Customer'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Contact</p>
                                <p className="text-xs font-bold text-accent">{activeOrder.receiver_phone || 'N/A'}</p>
                            </div>
                        </div>
                        {activeOrder.driver_notes && (
                            <div className="pt-3 border-t border-border/30">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 italic">Instruction</p>
                                <p className="text-[11px] font-medium text-white/80 italic">"{activeOrder.driver_notes}"</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${activeOrder.dropoff_address}`, '_blank')}
                            variant="outline"
                            className="w-full bg-secondary/30 border-border text-white hover:bg-secondary/50 h-14 rounded-2xl font-black"
                        >
                            <Navigation className="h-5 w-5 mr-3 text-accent" />
                            LAUNCH NAVIGATOR
                        </Button>

                        {activeOrder.status === 'assigned' ? (
                            <Button
                                onClick={() => handleUpdateStatus('picked_up')}
                                className="w-full bg-accent hover:bg-accent/90 text-white h-16 rounded-2xl font-black text-lg border-b-4 border-accent/50 transition-all active:scale-95 shadow-xl"
                            >
                                <Package className="mr-3 h-6 w-6" />
                                MARK AS PICKED UP
                            </Button>
                        ) : (
                            <Button
                                onClick={() => handleUpdateStatus('delivered')}
                                className="w-full bg-green-500 hover:bg-green-600 text-white h-16 rounded-2xl font-black text-lg border-b-4 border-green-700/50 transition-all active:scale-95 shadow-xl"
                            >
                                <CheckCircle2 className="mr-3 h-6 w-6" />
                                JOB COMPLETE
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="text-center py-10 bg-secondary/5 border border-dashed border-border/50 rounded-[2rem] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/50 relative">
                    <div className="absolute inset-0 border-2 border-dashed border-accent/20 rounded-full animate-spin-slow" />
                    <Package className="h-6 w-6 text-accent/40" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 animate-pulse">
                    Scanning for active dispatches...
                </p>
            </div>
        </div>
    );
}
