"use client";

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet + Next.js
const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function RecenterMap({ coords }: { coords: GeolocationCoordinates | null }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.setView([coords.latitude, coords.longitude], 15);
        }
    }, [coords, map]);
    return null;
}

export default function DriverMap({ coords }: { coords: GeolocationCoordinates | null }) {
    const defaultCenter: [number, number] = [-15.3875, 28.3228]; // Lusaka Center

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            {coords && (
                <Marker position={[coords.latitude, coords.longitude]} icon={customIcon} />
            )}
            <RecenterMap coords={coords} />
        </MapContainer>
    );
}
