"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useDriverStats(driverId: string | undefined) {
    const [stats, setStats] = useState({
        totalEarnings: 0,
        deliveriesCount: 0,
        loading: true
    });

    useEffect(() => {
        if (!driverId) return;

        const fetchStats = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data, error } = await supabase
                .from('orders')
                .select('price_zmw, status')
                .eq('assigned_driver_id', driverId)
                .eq('status', 'delivered')
                .gte('created_at', today.toISOString());

            if (!error && data) {
                const total = data.reduce((acc, order) => acc + Number(order.price_zmw), 0);
                setStats({
                    totalEarnings: total,
                    deliveriesCount: data.length,
                    loading: false
                });
            }
        };

        fetchStats();

        // Subscribe to order updates to refresh stats in real-time
        const channel = supabase
            .channel(`stats-${driverId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `assigned_driver_id=eq.${driverId}`
            }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [driverId]);

    return stats;
}
