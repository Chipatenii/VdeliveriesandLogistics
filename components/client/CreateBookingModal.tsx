"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MapPin,
    ArrowRight,
    Package,
    Coins,
    Loader2,
    Navigation,
    Info,
    CheckCircle2,
    Bike,
    Truck
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toaster';
import { useLocation } from '@/context/LocationContext';
import AddressSearch from '../shared/AddressSearch';
import { calculatePrice, VEHICLE_MULTIPLIERS } from '@/lib/pricing';

interface CreateBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string;
}

export default function CreateBookingModal({ isOpen, onClose, clientId }: CreateBookingModalProps) {
    const { getCurrentPosition } = useLocation();
    const [step, setStep] = useState(1);
    const [pickup, setPickup] = useState({ address: '', coords: [0, 0] });
    const [dropoff, setDropoff] = useState({ address: '', coords: [0, 0] });
    const [settings, setSettings] = useState({ baseFee: 25, kmRate: 5.5 });
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [itemDesc, setItemDesc] = useState('');
    const [vehicleType, setVehicleType] = useState('motorcycle');
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash');
    const [scheduledFor, setScheduledFor] = useState<'now' | 'later'>('now');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { toast } = useToast();

    const vehicles = [
        { id: 'motorcycle', name: 'Economy V', icon: <Bike className="h-6 w-6" />, multiplier: 1, desc: 'Fastest for small items' },
        { id: 'car', name: 'Premium V', icon: <Truck className="h-6 w-6" />, multiplier: 2.5, desc: 'Standard parcel delivery' },
        { id: 'van', name: 'Cargo V', icon: <Package className="h-6 w-6" />, multiplier: 5, desc: 'Bulk or heavy shipments' },
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['base_delivery_fee', 'km_rate']);

            if (data) {
                const base = data.find(s => s.key === 'base_delivery_fee');
                const km = data.find(s => s.key === 'km_rate');
                setSettings({
                    baseFee: base ? parseFloat(base.value) : 25,
                    kmRate: km ? parseFloat(km.value) : 5.5
                });
            }
        };
        fetchSettings();
    }, []);

    const getPrice = () => {
        if (!pickup.address || !dropoff.address) return 0;
        const distanceProxy = Math.max(2, (pickup.address.length + dropoff.address.length) / 10);
        return calculatePrice({
            baseFee: settings.baseFee,
            perKmRate: settings.kmRate,
            vehicleMultiplier: VEHICLE_MULTIPLIERS[vehicleType] || 1,
            distanceKm: distanceProxy
        });
    };

    const handleUseCurrentLocation = async () => {
        setLoading(true);
        const coords = await getCurrentPosition();
        if (coords) {
            const addr = `My Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`;
            setPickup({ address: addr, coords: [coords.longitude, coords.latitude] });
            toast("Location acquired", "success");
        } else {
            toast("Could not get location", "error");
        }
        setLoading(false);
    };

    const handleCreateOrder = async () => {
        setLoading(true);
        const price = getPrice();

        const { error } = await supabase
            .from('orders')
            .insert({
                client_id: clientId,
                customer_name: 'Client',
                pickup_address: pickup.address,
                dropoff_address: dropoff.address,
                pickup_coords: `POINT(${pickup.coords[0]} ${pickup.coords[1]})`,
                dropoff_coords: `POINT(${dropoff.coords[0]} ${dropoff.coords[1]})`,
                price_zmw: price,
                status: 'pending',
                vehicle_type_required: vehicleType,
                receiver_name: receiverName,
                receiver_phone: receiverPhone,
                item_description: itemDesc,
                payment_method: paymentMethod,
                scheduled_for: scheduledFor === 'now' ? new Date().toISOString() : null,
                driver_notes: notes
            });

        setLoading(false);
        if (!error) {
            setSuccess(true);
            toast("Order placed successfully", "success");
            setTimeout(() => {
                onClose();
                resetForm();
            }, 2000);
        } else {
            toast("Failed to create order", "error");
        }
    };

    const resetForm = () => {
        setSuccess(false);
        setStep(1);
        setPickup({ address: '', coords: [0, 0] });
        setDropoff({ address: '', coords: [0, 0] });
        setReceiverName('');
        setReceiverPhone('');
        setItemDesc('');
        setVehicleType('motorcycle');
        setNotes('');
        setScheduledFor('now');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px] rounded-[2.5rem] shadow-2xl backdrop-blur-2xl p-0 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-accent opacity-50" />

                {success ? (
                    <div className="p-8 md:p-12 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Request Sent</h2>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Finding a driver nearby...</p>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="p-6 md:p-8 pb-4">
                            <div className="flex justify-between items-center w-full">
                                <DialogTitle className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase leading-none">
                                    Book <span className="text-accent italic">Dispatch</span>
                                </DialogTitle>
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={cn("h-1 w-4 md:w-6 rounded-full transition-all", step >= i ? "bg-accent" : "bg-secondary")} />
                                    ))}
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="p-6 md:p-8 pt-0 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-4">
                                        <div className="space-y-2 group">
                                            <div className="flex justify-between items-center ml-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pickup Station</label>
                                                <button
                                                    onClick={handleUseCurrentLocation}
                                                    type="button"
                                                    className="text-[9px] font-black uppercase tracking-widest text-accent hover:underline"
                                                >
                                                    Use Current Location
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <AddressSearch
                                                    placeholder="Where from?"
                                                    initialValue={pickup.address}
                                                    onSelect={(addr, coords) => setPickup({ address: addr, coords })}
                                                    icon={<MapPin className="h-5 w-5 text-accent" />}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2 group">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destination</label>
                                            <div className="relative">
                                                <AddressSearch
                                                    placeholder="Where to?"
                                                    initialValue={dropoff.address}
                                                    onSelect={(addr, coords) => setDropoff({ address: addr, coords })}
                                                    icon={<Navigation className="h-5 w-5 text-accent" />}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-14 md:h-16 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 border-b-6 border-accent/50 text-lg"
                                        disabled={!pickup.address || !dropoff.address}
                                        onClick={() => setStep(2)}
                                    >
                                        NEXT STEP
                                        <ArrowRight className="ml-2 h-6 w-6" />
                                    </Button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="grid grid-cols-1 gap-3">
                                        {vehicles.map(v => (
                                            <button
                                                key={v.id}
                                                onClick={() => setVehicleType(v.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-3xl border-2 transition-all text-left",
                                                    vehicleType === v.id ? "bg-accent/10 border-accent shadow-lg shadow-accent/10" : "bg-secondary/20 border-border hover:border-border/80"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("p-3 rounded-2xl", vehicleType === v.id ? "bg-accent text-white" : "bg-card text-muted-foreground")}>
                                                        {v.icon}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-white tracking-tight uppercase">{v.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{v.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-white">K {calculatePrice({
                                                        baseFee: settings.baseFee,
                                                        perKmRate: settings.kmRate,
                                                        vehicleMultiplier: VEHICLE_MULTIPLIERS[v.id] || 1,
                                                        distanceKm: Math.max(2, (pickup.address.length + dropoff.address.length) / 10)
                                                    })}</p>
                                                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Estimated</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 h-14 md:h-16 font-black rounded-2xl text-muted-foreground" onClick={() => setStep(1)}>BACK</Button>
                                        <Button
                                            className="flex-[2] h-14 md:h-16 bg-accent text-white font-black rounded-2xl shadow-xl shadow-accent/20 border-b-6 border-accent/50 text-lg"
                                            onClick={() => setStep(3)}
                                        >
                                            CONTINUE
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">What are we carrying?</label>
                                            <Input
                                                placeholder="e.g. Medium Box, Documents, Furniture"
                                                className="h-14 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent font-medium"
                                                value={itemDesc}
                                                onChange={(e) => setItemDesc(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Receiver Name</label>
                                                <Input
                                                    placeholder="Name"
                                                    className="h-14 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent font-medium"
                                                    value={receiverName}
                                                    onChange={(e) => setReceiverName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Receiver Phone</label>
                                                <Input
                                                    placeholder="09..."
                                                    className="h-14 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent font-medium"
                                                    value={receiverPhone}
                                                    onChange={(e) => setReceiverPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">When?</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setScheduledFor('now')}
                                                    className={cn("flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all", scheduledFor === 'now' ? "bg-accent border-accent text-white" : "bg-card border-border text-muted-foreground")}
                                                >
                                                    Now
                                                </button>
                                                <button
                                                    onClick={() => setScheduledFor('later')}
                                                    className={cn("flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all", scheduledFor === 'later' ? "bg-accent border-accent text-white" : "bg-card border-border text-muted-foreground")}
                                                >
                                                    Later
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Payment</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setPaymentMethod('cash')}
                                                    className={cn("flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all", paymentMethod === 'cash' ? "bg-accent border-accent text-white" : "bg-card border-border text-muted-foreground")}
                                                >
                                                    Cash
                                                </button>
                                                <button
                                                    onClick={() => setPaymentMethod('wallet')}
                                                    className={cn("flex-1 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all", paymentMethod === 'wallet' ? "bg-accent border-accent text-white" : "bg-card border-border text-muted-foreground")}
                                                >
                                                    Wallet
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes for Driver</label>
                                        <Input
                                            placeholder="e.g. Near the green gate, Floor 2..."
                                            className="h-14 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent font-medium italic"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </div>

                                    <div className="bg-accent/5 border border-accent/20 p-6 rounded-[2rem]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Final Price</p>
                                                <p className="text-3xl font-black text-white tracking-tighter">K {getPrice()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-accent uppercase tracking-widest mb-1">{vehicleType.toUpperCase()}</p>
                                                <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{paymentMethod === 'cash' ? 'Pay on Delivery' : 'Paid via Wallet'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="ghost" className="flex-1 h-14 md:h-16 font-black rounded-2xl text-muted-foreground" onClick={() => setStep(2)}>BACK</Button>
                                        <Button
                                            className="flex-[2] h-14 md:h-16 bg-accent hover:bg-accent/90 text-white font-black rounded-2xl shadow-xl shadow-accent/20 border-b-6 border-accent/50 text-lg transition-all active:scale-95"
                                            disabled={loading || !itemDesc || !receiverPhone}
                                            onClick={handleCreateOrder}
                                        >
                                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM ORDER"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
