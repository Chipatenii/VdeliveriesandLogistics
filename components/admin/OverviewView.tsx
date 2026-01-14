"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import {
    TrendingUp,
    Users,
    Package,
    CheckCircle2,
    ArrowUpRight,
    Activity,
    Clock
} from 'lucide-react';
import { cn, formatZMW } from '@/lib/utils';

interface DashboardStats {
    totalRevenue: number;
    activeOrders: number;
    onlineDrivers: number;
    deliveryCount: number;
    successRate: number;
}

export default function OverviewView() {
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: 0,
        activeOrders: 0,
        onlineDrivers: 0,
        deliveryCount: 0,
        successRate: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);

            // 1. Fetch Revenue and Delivery Counts
            const { data: orders } = await supabase
                .from('orders')
                .select('price_zmw, status');

            // 2. Fetch Online Drivers
            const { count: onlineDriversCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'driver')
                .eq('is_online', true);

            if (orders) {
                const delivered = orders.filter(o => o.status === 'delivered');
                const active = orders.filter(o => ['pending', 'assigned', 'picked_up'].includes(o.status));
                const revenue = delivered.reduce((acc, o) => acc + Number(o.price_zmw), 0);

                setStats({
                    totalRevenue: revenue,
                    activeOrders: active.length,
                    onlineDrivers: onlineDriversCount || 0,
                    deliveryCount: delivered.length,
                    successRate: orders.length > 0 ? (delivered.length / orders.length) * 100 : 0
                });
            }
            setLoading(false);
        };

        fetchStats();

        // Real-time subscription for instant updates
        const channel = supabase
            .channel('admin-overview-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.driver' }, () => fetchStats())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const kpis = [
        {
            label: 'Total Revenue',
            value: formatZMW(stats.totalRevenue),
            sub: '+8% from last month',
            icon: TrendingUp,
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        },
        {
            label: 'Active Dispatches',
            value: stats.activeOrders,
            sub: 'Currently in transit',
            icon: Package,
            color: 'text-accent',
            bg: 'bg-accent/10'
        },
        {
            label: 'Online Fleet',
            value: stats.onlineDrivers,
            sub: 'Ready for dispatch',
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            label: 'Success Rate',
            value: `${Math.round(stats.successRate)}%`,
            sub: 'On-time deliveries',
            icon: CheckCircle2,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10'
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div>
                <h2 className="text-3xl font-black tracking-tighter uppercase">Command Center</h2>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-accent" />
                    Real-time Operational Intelligence
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, i) => (
                    <Card key={i} className="bg-card/40 border-border backdrop-blur-md overflow-hidden relative group">
                        <div className={cn("absolute top-0 left-0 w-full h-1 opacity-50", kpi.bg.replace('/10', '/30'))} />
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
                                <div className={cn("p-2 rounded-xl border border-white/5", kpi.bg)}>
                                    <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                                </div>
                            </div>
                            <p className="text-3xl font-black text-white tracking-tighter leading-none">{kpi.value}</p>
                            <div className="flex items-center gap-2 mt-4">
                                <ArrowUpRight className={cn("h-3 w-3", kpi.color)} />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{kpi.sub}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-card/40 border-border rounded-[2rem] overflow-hidden backdrop-blur-xl">
                    <div className="p-8 border-b border-border/50 bg-secondary/10 flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black tracking-tighter uppercase">Fleet Activity</h3>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Live Load Distribution</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Live Updates</span>
                        </div>
                    </div>
                    <div className="p-12 text-center text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">Activity Chart Visualization Pending Integration</p>
                    </div>
                </Card>

                <Card className="bg-accent/5 border-accent/20 rounded-[2rem] p-8 flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Clock className="h-32 w-32 text-accent" />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black text-white tracking-tighter uppercase mb-4">Quick Stats</h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-2">Lifetime Deliveries</p>
                                <p className="text-4xl font-black text-white tracking-tighter">{stats.deliveryCount.toLocaleString()}</p>
                            </div>
                            <div className="pt-6 border-t border-accent/10">
                                <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-2">Fleet Utilization</p>
                                <p className="text-4xl font-black text-white tracking-tighter">
                                    {stats.onlineDrivers > 0 ? Math.min(Math.round((stats.activeOrders / stats.onlineDrivers) * 100), 100) : 0}%
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-accent/10 relative z-10">
                        <p className="text-[10px] text-muted-foreground font-medium italic">"Efficiency is the engine of Logistics."</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
