"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, CheckCircle2, XCircle, Clock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

import { getOrderStatusStyles, formatZMW, formatDateTime } from '@/lib/utils';
import { useOrders } from '@/hooks/useOrders';

export default function OrderHistory({ driverId }: { driverId: string }) {
    const { orders: history, loading } = useOrders({ driverId });

    if (loading) return null;

    return (
        <Card className="bg-card/40 border-border mt-8 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-md">
            <CardHeader className="pb-4 px-6 border-b border-border/50 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
                        <History className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-black text-white tracking-tighter">ORDER LOG</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Performance History</p>
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center shadow-lg">
                            <span className="text-[10px] font-black text-muted-foreground">V</span>
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {history.length === 0 ? (
                    <div className="p-16 text-center text-muted-foreground font-bold italic opacity-30">
                        <p className="uppercase tracking-[0.2em] text-xs">Awaiting First delivery...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border/30">
                        {history.map((order) => (
                            <div key={order.id} className="px-6 py-6 flex items-center justify-between hover:bg-accent/5 transition-all group active:bg-accent/10">
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-black text-white tracking-tight leading-none truncate group-hover:text-accent transition-colors">
                                            {order.customer_name.toUpperCase()}
                                        </p>
                                        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium truncate italic tracking-tight">{order.dropoff_address}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] text-muted-foreground/40 font-mono">
                                            {formatDateTime(order.created_at).time}
                                        </span>
                                        <span className="h-1 w-1 bg-border rounded-full" />
                                        <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-tighter">
                                            {formatDateTime(order.created_at).date}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 ml-4">
                                    <p className="font-black text-lg text-white tracking-tighter leading-none">{formatZMW(order.price_zmw)}</p>
                                    <div className={cn(
                                        "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border shadow-sm",
                                        getOrderStatusStyles(order.status)
                                    )}>
                                        {order.status === 'delivered' && <CheckCircle2 className="h-2.5 w-2.5" />}
                                        {order.status === 'cancelled' && <XCircle className="h-2.5 w-2.5" />}
                                        {['pending', 'assigned', 'picked_up'].includes(order.status) && <Clock className="h-2.5 w-2.5 animate-pulse" />}
                                        {order.status.replace('_', ' ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
