"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, User, Loader2, Coins, Navigation, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculatePrice, VEHICLE_MULTIPLIERS, getDistanceProxy } from '@/lib/pricing';
import AddressSearch from '../shared/AddressSearch';
import { useToast } from '@/components/ui/toaster';
import { useAuth } from '@/context/AuthContext';

export default function CreateOrderModal({
    isOpen,
    onClose,
    onlineDrivers = [],
    onPickFromMap,
    externalPickup,
    externalDropoff
}: {
    isOpen: boolean,
    onClose: () => void,
    onlineDrivers?: any[],
    onPickFromMap?: (type: 'pickup' | 'dropoff') => void,
    externalPickup?: { address: string, coords: [number, number] },
    externalDropoff?: { address: string, coords: [number, number] }
}) {
    const [customerName, setCustomerName] = useState('');
    const [loading, setLoading] = useState(false);
    const [pickup, setPickup] = useState({ address: '', coords: [28.3228, -15.3875] });
    const [dropoff, setDropoff] = useState({ address: '', coords: [28.3228, -15.3875] });
    const [price, setPrice] = useState('');
    const [vehicleType, setVehicleType] = useState('bike');
    const [assignedDriverId, setAssignedDriverId] = useState<string>('');
    const [settings, setSettings] = useState({ baseFee: 20, kmRate: 5 });
    const { toast } = useToast();
    const { user } = useAuth();

    // Fetch pricing settings
    React.useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('system_settings').select('*');
            if (data) {
                const base = data.find(s => s.key === 'base_delivery_fee')?.value || 20;
                const km = data.find(s => s.key === 'km_rate')?.value || 5;
                setSettings({ baseFee: Number(base), kmRate: Number(km) });
            }
        };
        fetchSettings();
    }, []);

    // Auto-calculate price when route or vehicle changes
    React.useEffect(() => {
        if (pickup.address && dropoff.address) {
            const distance = getDistanceProxy(pickup.address, dropoff.address);
            const calculated = calculatePrice({
                baseFee: settings.baseFee,
                perKmRate: settings.kmRate,
                vehicleMultiplier: VEHICLE_MULTIPLIERS[vehicleType] || 1,
                distanceKm: distance
            });
            setPrice(calculated.toString());
        }
    }, [pickup.address, dropoff.address, vehicleType, settings]);

    const handleCreateOrder = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!customerName || !pickup.address || !dropoff.address || !price) {
            toast('Please fill in all required fields.', 'warning');
            return;
        }

        setLoading(true);



        const { error } = await supabase.from('orders').insert([
            {
                client_id: user?.id,
                customer_name: customerName,
                pickup_address: pickup.address,
                dropoff_address: dropoff.address,
                pickup_coords: `POINT(${pickup.coords[0]} ${pickup.coords[1]})`,
                dropoff_coords: `POINT(${dropoff.coords[0]} ${dropoff.coords[1]})`,
                vehicle_type_required: vehicleType,
                price_zmw: parseFloat(price),
                status: assignedDriverId && assignedDriverId !== 'none' ? 'assigned' : 'pending',
                assigned_driver_id: (assignedDriverId && assignedDriverId !== 'none') ? assignedDriverId : null
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
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <AddressSearch
                                            placeholder="Set Pickup Point"
                                            onSelect={(addr, coords) => setPickup({ address: addr, coords: coords as [number, number] })}
                                            icon={<MapPin className="h-5 w-5 text-green-500" />}
                                            initialValue={pickup.address}
                                            key={`pickup-${pickup.address}`}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-14 w-14 rounded-2xl border border-border bg-secondary/20 text-accent hover:bg-accent/10 transition-all"
                                        onClick={() => onPickFromMap?.('pickup')}
                                    >
                                        <Navigation className="h-5 w-5" />
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <AddressSearch
                                            placeholder="Set Dropoff Point"
                                            onSelect={(addr, coords) => setDropoff({ address: addr, coords: coords as [number, number] })}
                                            icon={<MapPin className="h-5 w-5 text-destructive" />}
                                            initialValue={dropoff.address}
                                            key={`dropoff-${dropoff.address}`}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-14 w-14 rounded-2xl border border-border bg-secondary/20 text-accent hover:bg-accent/10 transition-all"
                                        onClick={() => onPickFromMap?.('dropoff')}
                                    >
                                        <Navigation className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Vehicle Class</label>
                                <Select value={vehicleType} onValueChange={setVehicleType}>
                                    <SelectTrigger className="h-14 bg-secondary/30 border-border text-white rounded-2xl">
                                        <SelectValue placeholder="Select Vehicle" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border text-white">
                                        <SelectItem value="bike">Motorcycle (Fast)</SelectItem>
                                        <SelectItem value="car">Car (Standard)</SelectItem>
                                        <SelectItem value="van">Van (Bulk)</SelectItem>
                                        <SelectItem value="truck">Truck (Heavy)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Direct Assignment</label>
                            <Select onValueChange={setAssignedDriverId}>
                                <SelectTrigger className="h-14 bg-secondary/30 border-border text-white rounded-2xl">
                                    <SelectValue placeholder="Broadcast to Fleet" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    <SelectItem value="none">Broadcast to Fleet</SelectItem>
                                    {onlineDrivers.filter(d => d.is_online).map(driver => (
                                        <SelectItem key={driver.id} value={driver.id}>
                                            {driver.full_name} ({driver.vehicle_type})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
