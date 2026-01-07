import { NextResponse } from 'next/server';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const type = searchParams.get('type') || 'forward'; // 'forward' or 'reverse'

    try {
        if (type === 'forward' && q) {
            if (MAPBOX_TOKEN) {
                const bbox = "28.1,-15.5,28.5,-15.2";
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&limit=5`
                );
                const data = await response.json();
                return NextResponse.json(data.features || []);
            } else {
                // Fallback to Nominatim
                const viewbox = "28.1,-15.5,28.5,-15.2";
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`,
                    {
                        headers: {
                            'User-Agent': 'VDeliveries/1.0 (contact@vdeliveries.com)'
                        }
                    }
                );
                const data = await response.json();
                const formatted = data.map((item: any) => ({
                    id: item.place_id,
                    place_name: item.display_name,
                    text: item.name || item.display_name.split(',')[0],
                    center: [parseFloat(item.lon), parseFloat(item.lat)]
                }));
                return NextResponse.json(formatted);
            }
        }

        if (type === 'reverse' && lat && lon) {
            if (MAPBOX_TOKEN) {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi,place&limit=1`
                );
                const data = await response.json();
                return NextResponse.json({
                    address: data.features?.[0]?.place_name || `GPS: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`
                });
            } else {
                // Fallback to Nominatim Reverse
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
                    {
                        headers: {
                            'User-Agent': 'VDeliveries/1.0 (contact@vdeliveries.com)'
                        }
                    }
                );
                const data = await response.json();
                return NextResponse.json({
                    address: data.display_name || `GPS: ${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)}`
                });
            }
        }

        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    } catch (error) {
        console.error('Proxy Geocoding Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
