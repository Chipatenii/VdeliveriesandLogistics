"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollText, Package, CheckCircle2, User, MapPin, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

import { getOrderStatusStyles, formatZMW, formatDateTime } from '@/lib/utils';
import { useOrders } from '@/hooks/useOrders';

export default function OrderLogs() {
    const { orders: logs, loading } = useOrders();

    if (loading) return null;

    return (
        <Card className="bg-card/40 border-border rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-border/50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center border border-accent/20">
                        <ScrollText className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tighter text-white">AUDIT TRAIL</CardTitle>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Operational History & Logs</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full border border-border">
                    <Activity className="h-3 w-3 text-accent animate-pulse" />
                    LIVE UPDATING
                </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[700px] overflow-auto custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="p-24 text-center">
                        <Package className="h-16 w-16 mx-auto mb-6 opacity-10 text-muted-foreground" />
                        <p className="text-sm font-black text-muted-foreground/50 uppercase tracking-widest">NO SHIPMENTS LOGGED</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        {/* Mobile Card List */}
                        <div className="md:hidden divide-y divide-border/20 px-4">
                            {logs.map((log) => (
                                <div key={log.id} className="py-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-muted-foreground font-mono font-bold">
                                                {formatDateTime(log.created_at).time} • {formatDateTime(log.created_at).date}
                                            </p>
                                            <p className="text-sm font-black text-white tracking-tight leading-tight">{log.customer_name.toUpperCase()}</p>
                                        </div>
                                        <div className={cn(
                                            "inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em]",
                                            getOrderStatusStyles(log.status)
                                        )}>
                                            {log.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                                        <p className="text-[11px] text-muted-foreground font-medium truncate italic">{log.dropoff_address}</p>
                                    </div>
                                    <div className="flex justify-between items-center bg-secondary/20 p-3 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-secondary/50 rounded flex items-center justify-center">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                            <p className="text-[11px] font-bold text-white tracking-tight">
                                                {log.driver?.full_name?.toUpperCase() || "UNASSIGNED"}
                                            </p>
                                        </div>
                                        <p className="text-sm font-black text-accent tracking-tighter">{formatZMW(log.price_zmw)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border/50 z-10">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Client</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Destination</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Personnel</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Fee (ZMW)</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-accent/5 transition-all group border-l-4 border-l-transparent hover:border-l-accent">
                                        <td className="px-8 py-6">
                                            <p className="text-xs text-white font-mono font-bold">
                                                {formatDateTime(log.created_at).time}
                                            </p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-black text-white tracking-tight">{log.customer_name.toUpperCase()}</p>
                                        </td>
                                        <td className="px-8 py-6 max-w-xs">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                                                <p className="text-xs text-muted-foreground font-medium truncate italic">{log.dropoff_address}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-secondary/50 rounded-lg flex items-center justify-center border border-border">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <p className="text-xs font-bold text-white tracking-tight">
                                                    {log.driver?.full_name?.toUpperCase() || <span className="text-muted-foreground/30 italic">UNASSIGNED</span>}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <p className="text-sm font-black text-white">K {log.price_zmw.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className={cn(
                                                "inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em]",
                                                log.status === 'delivered' ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                                                    log.status === 'assigned' || log.status === 'picked_up' ? "bg-accent/10 text-accent border border-accent/20" :
                                                        "bg-secondary/50 text-muted-foreground border border-border"
                                            )}>
                                                {log.status.replace('_', ' ')}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
