"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2, MapPin, X } from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

interface AddressSearchProps {
    onSelect: (address: string, coords: number[]) => void;
    placeholder?: string;
    icon?: React.ReactNode;
}

export default function AddressSearch({ onSelect, placeholder, icon }: AddressSearchProps) {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 2) {
                setLoading(true);
                try {
                    const response = await fetch(`/api/geocoding?type=forward&q=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    setSuggestions(data || []);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Geocoding error:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const response = await fetch(`/api/geocoding?type=reverse&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                const address = data.address || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                setQuery(address);
                onSelect(address, [longitude, latitude]);
            } catch (err) {
                console.error("Reverse geocoding error:", err);
                onSelect(`GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, [longitude, latitude]);
            } finally {
                setLoading(false);
            }
        }, (err) => {
            console.error("Geolocation error:", err);
            setLoading(false);
        });
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    {loading ? <Loader2 className="h-5 w-5 text-accent animate-spin" /> : (icon || <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-accent transition-colors" />)}
                </div>
                <Input
                    placeholder={placeholder || "Search address..."}
                    className="h-14 pl-12 pr-24 bg-secondary/30 border-border text-white rounded-2xl focus:ring-accent/50 focus:border-accent transition-all font-medium placeholder:text-muted-foreground/50 shadow-inner"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setSuggestions([]); }}
                            className="p-2 hover:bg-secondary/50 rounded-full transition-colors text-muted-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCurrentLocation}
                        className="p-2 bg-accent/10 hover:bg-accent/20 rounded-xl transition-colors text-accent border border-accent/20"
                        title="Use my location"
                    >
                        <MapPin className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {isOpen && query.length > 2 && !MAPBOX_TOKEN && suggestions.length === 0 && !loading && (
                <div className="absolute w-full mt-2 bg-popover border border-border rounded-2xl p-4 shadow-2xl z-[6000]">
                    <p className="text-[10px] text-muted-foreground text-center">
                        Searching via OpenStreetMap...
                    </p>
                </div>
            )}

            {isOpen && suggestions.length > 0 && (
                <div className="absolute w-full mt-2 bg-popover border border-border rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] z-[6000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
                    {suggestions.map((item: any) => (
                        <button
                            key={item.id}
                            className="w-full text-left px-5 py-4 hover:bg-accent/10 border-b border-border/30 last:border-0 flex items-start gap-4 group transition-colors"
                            onClick={() => {
                                setQuery(item.place_name);
                                setSuggestions([]);
                                setIsOpen(false);
                                onSelect(item.place_name, item.center);
                            }}
                        >
                            <div className="mt-1 w-8 h-8 rounded-xl bg-secondary/50 flex items-center justify-center border border-border group-hover:border-accent group-hover:bg-accent/10 transition-all">
                                <MapPin className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-white truncate tracking-tight uppercase">{item.text}</p>
                                <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{item.place_name}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
