"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapPin, Banknote, User, Loader2 } from 'lucide-react';

export default function CreateOrderModal({
    isOpen,
    onClose,
    onlineDrivers
}: {
    isOpen: boolean;
    onClose: () => void;
    onlineDrivers: any[];
}) {
    const [loading, setLoading] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [dropoffAddress, setDropoffAddress] = useState('');
    const [price, setPrice] = useState('');
    const [assignedDriverId, setAssignedDriverId] = useState<string>('');

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Mock coordinates for Lusaka for the MVP demo (ST_MakePoint(lng, lat))
        // In a real app, you'd geocode the addresses
        const pickupLng = 28.3228 + (Math.random() - 0.5) * 0.05;
        const pickupLat = -15.3875 + (Math.random() - 0.5) * 0.05;
        const dropoffLng = 28.3228 + (Math.random() - 0.5) * 0.05;
        const dropoffLat = -15.3875 + (Math.random() - 0.5) * 0.05;

        const { error } = await supabase.from('orders').insert([
            {
                customer_name: customerName,
                pickup_address: pickupAddress,
                pickup_coords: `POINT(${pickupLng} ${pickupLat})`,
                dropoff_address: dropoffAddress,
                dropoff_coords: `POINT(${dropoffLng} ${dropoffLat})`,
                price_zmw: parseFloat(price),
                assigned_driver_id: assignedDriverId || null,
                status: assignedDriverId ? 'assigned' : 'pending'
            }
        ]);

        if (!error) {
            onClose();
            // Reset form
            setCustomerName('');
            setPickupAddress('');
            setDropoffAddress('');
            setPrice('');
            setAssignedDriverId('');
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Create New Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateOrder} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Customer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                            <Input
                                placeholder="e.g. Lusaka Logistics Center"
                                className="pl-10 bg-black border-zinc-800"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pickup Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                            <Input
                                placeholder="e.g. Cairo Road, Post Office"
                                className="pl-10 bg-black border-zinc-800"
                                value={pickupAddress}
                                onChange={(e) => setPickupAddress(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Dropoff Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                            <Input
                                placeholder="e.g. Manda Hill Shopping Mall"
                                className="pl-10 bg-black border-zinc-800"
                                value={dropoffAddress}
                                onChange={(e) => setDropoffAddress(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Price (ZMW)</label>
                            <div className="relative">
                                <Banknote className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                <Input
                                    type="number"
                                    placeholder="50"
                                    className="pl-10 bg-black border-zinc-800"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Assign Driver</label>
                            <Select value={assignedDriverId} onValueChange={setAssignedDriverId}>
                                <SelectTrigger className="bg-black border-zinc-800">
                                    <SelectValue placeholder="Optional" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {onlineDrivers.map(driver => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                            {driver.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-white text-black hover:bg-zinc-200 h-12 font-bold"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Dispatch Order'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
