"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, User, Loader2, Coins, Navigation, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AddressSearch from '../shared/AddressSearch';
import { useToast } from '@/components/ui/toaster';

export default function CreateOrderModal({
    isOpen,
    onClose,
    externalPickup,
    externalDropoff
}: {
    isOpen: boolean,
    onClose: () => void,
    externalPickup?: { address: string, coords: [number, number] },
    externalDropoff?: { address: string, coords: [number, number] }
}) {
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [pickup, setPickup] = useState({ address: '', coords: [28.3228, -15.3875] });
    const [dropoff, setDropoff] = useState({ address: '', coords: [28.3228, -15.3875] });
    const [price, setPrice] = useState('');
    const [assignedDriverId, setAssignedDriverId] = useState<string>('');
    const { toast } = useToast();

    // Sync with external updates from map pick
    React.useEffect(() => {
        if (externalPickup) setPickup(externalPickup);
        if (externalDropoff) setDropoff(externalDropoff);
    }, [externalPickup, externalDropoff]);

    const handleCreateOrder = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!customerName || !pickup.address || !dropoff.address || !price) {
            toast('Please fill in all required fields.', 'warning');
            return;
        }

        setLoading(true);

        const { error } = await supabase.from('orders').insert([
            {
                customer_name: customerName,
                pickup_address: pickup.address,
                dropoff_address: dropoff.address,
                pickup_coords: `POINT(${pickup.coords[0]} ${pickup.coords[1]})`,
                dropoff_coords: `POINT(${dropoff.coords[0]} ${dropoff.coords[1]})`,
                price_zmw: parseFloat(price),
                status: assignedDriverId ? 'assigned' : 'pending',
                assigned_driver_id: assignedDriverId || null
            }
        ]);

        if (!error) {
            toast('Dispatch created successfully!', 'success');
            onClose();
            setCustomerName('');
            setPickup({ address: '', coords: [28.3228, -15.3875] });
            setDropoff({ address: '', coords: [28.3228, -15.3875] });
            setPrice('');
            setAssignedDriverId('');
        } else {
            console.error('Error creating order:', error);
            toast('Failed to create dispatch.', 'error');
        }
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] rounded-[2.5rem] shadow-2xl backdrop-blur-2xl p-0 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-accent opacity-50" />
                <DialogHeader className="p-6 md:p-8 pb-4">
                    <DialogTitle className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                        Manual <span className="text-accent italic">Dispatch</span>
                    </DialogTitle>
                    <DialogDescription className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest pt-2">
                        Create a new order bypass or manual assign
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 md:p-8 pt-0 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleCreateOrder} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 px-1">
                                <span className="w-1 h-3 bg-accent rounded-full" />
                                Customer Details
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Customer Name"
                                    className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Route configuration</label>
                            <div className="space-y-3">
                                <div className="relative">
                                    <AddressSearch
                                        placeholder="Set Pickup Point"
                                        onSelect={(addr, coords) => setPickup({ address: addr, coords: coords as [number, number] })}
                                        icon={<MapPin className="h-5 w-5 text-green-500" />}
                                        initialValue={pickup.address}
                                        key={`pickup-${pickup.address}`}
                                    />
                                </div>
                                <div className="relative">
                                    <AddressSearch
                                        placeholder="Set Dropoff Point"
                                        onSelect={(addr, coords) => setDropoff({ address: addr, coords: coords as [number, number] })}
                                        icon={<MapPin className="h-5 w-5 text-destructive" />}
                                        initialValue={dropoff.address}
                                        key={`dropoff-${dropoff.address}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Fee (ZMW)</label>
                                <div className="relative">
                                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="Price"
                                        className="h-14 pl-12 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Priority</label>
                                <Select onValueChange={setAssignedDriverId}>
                                    <SelectTrigger className="h-14 bg-secondary/30 border-border text-white rounded-2xl">
                                        <SelectValue placeholder="Express" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-white">
                                        <SelectItem value="none">Standard</SelectItem>
                                        <SelectItem value="priority">High Priority</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-14 md:h-16 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 border-b-6 border-accent/50 text-lg transition-all active:scale-95 mt-4"
                            disabled={loading || !customerName || !pickup.address || !dropoff.address}
                        >
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                <>
                                    CONFIRM DISPATCH
                                    <ArrowRight className="ml-2 h-6 w-6" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
