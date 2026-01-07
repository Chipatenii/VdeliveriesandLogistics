"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const bikeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3198/3198336.png', // Motorcycle icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function MapEvents({ onMapClick, isPicking }: { onMapClick: (lat: number, lng: number) => void, isPicking: boolean }) {
    useMapEvents({
        click: (e) => {
            if (isPicking) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

export default function FleetMap({
    drivers,
    isPicking,
    onPointSelect
}: {
    drivers: any[],
    isPicking?: boolean,
    onPointSelect?: (address: string, coords: [number, number]) => void
}) {
    const defaultCenter: [number, number] = [-15.3875, 28.3228];
    const [pickingLoading, setPickingLoading] = useState(false);

    const handleMapClick = async (lat: number, lng: number) => {
        if (!onPointSelect) return;
        setPickingLoading(true);
        try {
            const response = await fetch(`/api/geocoding?type=reverse&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            const address = data.address || `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            onPointSelect(address, [lng, lat]);
        } catch (err) {
            console.error("Map reverse geocoding error:", err);
            onPointSelect(`Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, [lng, lat]);
        } finally {
            setPickingLoading(false);
        }
    };

    const tileUrl = MAPBOX_TOKEN
        ? `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png";

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%', cursor: isPicking ? 'crosshair' : 'grab' }}
        >
            <TileLayer
                url={tileUrl}
                attribution={MAPBOX_TOKEN ? '&copy; Mapbox' : '&copy; OpenStreetMap contributors &copy; CARTO'}
                tileSize={512}
                zoomOffset={-1}
            />
            <MapEvents onMapClick={handleMapClick} isPicking={!!isPicking} />

            {pickingLoading && (
                <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
                    <div className="bg-card p-4 rounded-2xl border border-border flex items-center gap-3 shadow-2xl">
                        <Loader2 className="h-5 w-5 text-accent animate-spin" />
                        <span className="text-xs font-black uppercase tracking-widest text-white">Reverse Geocoding...</span>
                    </div>
                </div>
            )}

            {drivers.map(driver => {
                const lat = driver.last_lat || -15.3875 + (Math.random() - 0.5) * 0.05;
                const lng = driver.last_lng || 28.3228 + (Math.random() - 0.5) * 0.05;

                return (
                    <Marker
                        key={driver.id}
                        position={[lat, lng]}
                        icon={bikeIcon}
                    >
                        <Popup className="dark-popup">
                            <div className="p-1">
                                <p className="font-black text-white text-sm tracking-tight">{driver.full_name?.toUpperCase()}</p>
                                <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1">{driver.vehicle_type}</p>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
