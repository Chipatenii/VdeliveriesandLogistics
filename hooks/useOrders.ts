import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Order {
    id: string;
    created_at: string;
    customer_name: string;
    pickup_address: string;
    dropoff_address: string;
    status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
    price_zmw: number;
    assigned_driver_id?: string;
    client_id?: string;
    receiver_name?: string;
    receiver_phone?: string;
    vehicle_type_required?: string;
    driver?: {
        full_name: string;
        vehicle_type?: string;
    };
}

export function useOrders(filter?: { driverId?: string, clientId?: string, status?: string[] }) {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        if (authLoading || !user) return;

        let query = supabase
            .from('orders')
            .select(`
                *,
                driver:profiles!assigned_driver_id(full_name, vehicle_type)
            `);

        if (filter?.driverId) {
            query = query.eq('assigned_driver_id', filter.driverId);
        }
        if (filter?.clientId) {
            query = query.eq('client_id', filter.clientId);
        }
        if (filter?.status && filter.status.length > 0) {
            query = query.in('status', filter.status);
        }

        const { data, error: fetchError } = await query.order('created_at', { ascending: false });

        if (fetchError) {
            setError(fetchError.message);
        } else {
            setOrders(data || []);
        }
        setLoading(false);
    }, [authLoading, user, filter?.driverId, filter?.clientId, JSON.stringify(filter?.status)]);

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel('orders_realtime')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    fetchOrders();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchOrders]);

    return { orders, loading, error, refresh: fetchOrders };
}
