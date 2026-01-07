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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function DriverMap({ coords }: { coords: GeolocationCoordinates | null }) {
    const defaultCenter: [number, number] = [-15.3875, 28.3228]; // Lusaka Center

    // Use Mapbox style if token exists, fallback to CartoDB Dark (brightened) or Voyager
    const tileUrl = MAPBOX_TOKEN
        ? `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png";

    return (
        <MapContainer
            center={defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%', filter: MAPBOX_TOKEN ? 'none' : 'brightness(0.8) contrast(1.2)' }}
            zoomControl={false}
        >
            <TileLayer
                url={tileUrl}
                attribution={MAPBOX_TOKEN ? '&copy; Mapbox' : '&copy; OpenStreetMap contributors &copy; CARTO'}
                tileSize={512}
                zoomOffset={-1}
            />
            {coords && (
                <Marker position={[coords.latitude, coords.longitude]} icon={customIcon} />
            )}
            <RecenterMap coords={coords} />
        </MapContainer>
    );
}
