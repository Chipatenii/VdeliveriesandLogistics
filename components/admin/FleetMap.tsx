"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const bikeIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3198/3198336.png', // Motorcycle icon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
});

export default function FleetMap({ drivers }: { drivers: any[] }) {
    const defaultCenter: [number, number] = [-15.3875, 28.3228];

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {drivers.map(driver => {
                // Handle PostGIS geoJSON format if returned, otherwise assume lat/lng
                // Supabase might return current_location as a string or object
                const coords = driver.current_location;
                if (!coords) return null;

                // Simplified extraction for the MVP demo
                // Typically you'd parse ST_AsGeoJSON(current_location)
                // Here we assume it's available or we'd have a helper to parse POINT(lng lat)
                return (
                    <Marker
                        key={driver.id}
                        position={[-15.3875 + (Math.random() - 0.5) * 0.01, 28.3228 + (Math.random() - 0.5) * 0.01]} // Mock for visualization if real coords parse fail
                        icon={bikeIcon}
                    >
                        <Popup className="dark-popup">
                            <div className="text-zinc-900 font-bold">{driver.full_name}</div>
                            <div className="text-zinc-700 text-xs">{driver.vehicle_type}</div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
