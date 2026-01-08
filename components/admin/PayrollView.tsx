"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    CircleDollarSign,
    ArrowUpRight,
    History,
    CheckCircle2,
    Clock,
    UserCircle,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';


interface PayrollStat {
    driver_id: string;
    full_name: string;
    total_earned: number;
    deliveries: number;
    pending_payout: number;
}

export default function PayrollView() {
    const { loading: authLoading, user } = useAuth();
    const [stats, setStats] = useState<PayrollStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayrollData = async () => {
            if (authLoading || !user) return;

            setLoading(true);
            // Fetch total earnings per driver from delivered orders
            const { data: orders, error } = await supabase
                .from('orders')
                .select('price_zmw, status, assigned_driver_id, profiles(full_name)')
                .eq('status', 'delivered');

            if (orders) {
                const driverMap: Record<string, PayrollStat> = {};

                orders.forEach((order: any) => {
                    const driverId = order.assigned_driver_id;
                    if (!driverId) return;

                    if (!driverMap[driverId]) {
                        driverMap[driverId] = {
                            driver_id: driverId,
                            full_name: order.profiles?.full_name || 'Unknown Driver',
                            total_earned: 0,
                            deliveries: 0,
                            pending_payout: 0
                        };
                    }
                    driverMap[driverId].total_earned += Number(order.price_zmw);
                    driverMap[driverId].deliveries += 1;
                    // For MVP simplicity, let's assume all delivered earnings are "pending payout" until processed
                    driverMap[driverId].pending_payout += Number(order.price_zmw);
                });

                setStats(Object.values(driverMap));
            }
            setLoading(false);
        };

        fetchPayrollData();
    }, [authLoading, user]);


    const exportToCSV = () => {
        if (stats.length === 0) return;

        const headers = ["Driver ID", "Full Name", "Total Earned (ZMW)", "Deliveries", "Pending Payout (ZMW)"];
        const rows = stats.map(s => [
            s.driver_id,
            s.full_name,
            s.total_earned,
            s.deliveries,
            s.pending_payout
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalFleetEarnings = stats.reduce((acc, s) => acc + s.total_earned, 0);
    const totalPendingPayouts = stats.reduce((acc, s) => acc + s.pending_payout, 0);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">PAYROLL & FINANCE</h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <CircleDollarSign className="h-3 w-3 text-accent" />
                        Financial Settlement Overview
                    </p>
                </div>
                <Button
                    onClick={exportToCSV}
                    disabled={stats.length === 0}
                    className="bg-secondary hover:bg-secondary/80 text-white font-black px-6 h-12 rounded-2xl border border-border transition-all active:scale-95"
                >
                    <Download className="h-4 w-4 mr-2" />
                    EXPORT REPORT
                </Button>
            </div>


            {/* Financial KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card/40 border-border backdrop-blur-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fleet Revenue</span>
                            <div className="p-2 bg-green-500/10 rounded-xl">
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">ZMW {totalFleetEarnings.toLocaleString()}</p>
                        <p className="text-[10px] text-green-500 font-bold mt-2">+12% FROM LAST WEEK</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-border backdrop-blur-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pending Payouts</span>
                            <div className="p-2 bg-accent/10 rounded-xl">
                                <Clock className="h-4 w-4 text-accent" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">ZMW {totalPendingPayouts.toLocaleString()}</p>
                        <p className="text-[10px] text-accent font-bold mt-2">REQUIRES APPROVAL</p>
                    </CardContent>
                </Card>

                <Card className="bg-card/40 border-border backdrop-blur-md">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deliveries Processed</span>
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <CheckCircle2 className="h-4 w-4 text-purple-500" />
                            </div>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.reduce((acc, s) => acc + s.deliveries, 0)}</p>
                        <p className="text-[10px] text-purple-500 font-bold mt-2">COMPLETED ORDERS</p>
                    </CardContent>
                </Card>
            </div>

            {/* Payroll Table */}
            <Card className="bg-card/40 border-border backdrop-blur-md overflow-hidden rounded-[2rem]">
                <div className="p-6 border-b border-border/50 flex items-center gap-3">
                    <History className="h-4 w-4 text-accent" />
                    <span className="text-xs font-black uppercase tracking-widest text-white">Driver Earning Records</span>
                </div>
                <div className="overflow-x-auto">
                    {/* Mobile Driver Earning Cards */}
                    <div className="md:hidden divide-y divide-border/20 px-4 mb-4">
                        {stats.map((driver) => (
                            <div key={driver.driver_id} className="py-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-secondary/80 rounded-xl flex items-center justify-center border border-border">
                                            <UserCircle className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white uppercase tracking-tight text-sm">{driver.full_name}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{driver.deliveries} DELIVERIES</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-accent tracking-widest">PENDING</p>
                                        <p className="text-sm font-black text-white">K {driver.pending_payout}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Lifetime Earned</p>
                                        <p className="text-sm font-black text-white">K {driver.total_earned}</p>
                                    </div>
                                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-black text-[10px] tracking-widest h-10 rounded-xl px-6">
                                        SETTLE
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table */}
                    <table className="hidden md:table w-full text-left">
                        <thead>
                            <tr className="bg-secondary/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <th className="px-6 py-4">Driver Name</th>
                                <th className="px-6 py-4">Total Earned</th>
                                <th className="px-6 py-4">Deliveries</th>
                                <th className="px-6 py-4">Pending Payout</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {stats.map((driver) => (
                                <tr key={driver.driver_id} className="hover:bg-accent/5 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-secondary/80 rounded-xl flex items-center justify-center border border-border group-hover:border-accent/40 transition-colors">
                                                <UserCircle className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <span className="font-bold text-white uppercase tracking-tight">{driver.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="font-black text-white tracking-widest text-sm">ZMW {driver.total_earned}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="px-3 py-1 bg-secondary/50 rounded-lg inline-flex font-mono text-xs font-bold text-accent">
                                            {driver.deliveries}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-accent tracking-widest text-sm">
                                        ZMW {driver.pending_payout}
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-yellow-500/20">
                                            Awaiting Settlement
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-black text-[10px] tracking-widest h-9 rounded-xl px-4 transition-all active:scale-95 shadow-md shadow-accent/20">
                                            SETTLE NOW
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {stats.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No delivered orders found for payroll.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
