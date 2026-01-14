export interface PricingParams {
    baseFee: number;
    perKmRate: number;
    vehicleMultiplier: number;
    distanceKm: number;
}

export function calculatePrice({ baseFee, perKmRate, vehicleMultiplier, distanceKm }: PricingParams): number {
    return Math.round((baseFee + (distanceKm * perKmRate)) * vehicleMultiplier);
}

// Distance proxy if real distance is unavailable
export function getDistanceProxy(addr1: string, addr2: string): number {
    // Simple length-based proxy as used previously, but normalized to "approximate KM"
    const lengthSum = (addr1?.length || 0) + (addr2?.length || 0);
    return Math.max(2, lengthSum / 5); // Minimum 2km
}

export const VEHICLE_MULTIPLIERS: Record<string, number> = {
    'bike': 1.0,
    'car': 1.5,
    'van': 2.0,
    'truck': 3.5
};
