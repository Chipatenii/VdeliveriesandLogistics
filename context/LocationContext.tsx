"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface LocationContextType {
  coords: GeolocationCoordinates | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentPosition: () => Promise<GeolocationCoordinates | null>;
  error: string | null;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<any>(null);

  // Screen Wake Lock API
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
        console.log('Wake Lock active');
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      await wakeLock.current.release();
      wakeLock.current = null;
      console.log('Wake Lock released');
    }
  };

  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsTracking(true);
    await requestWakeLock();

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setCoords(position.coords);
        updateLocationInDB(position.coords);
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopTracking = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    await releaseWakeLock();

    // Set driver offline in DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ is_online: false })
        .eq('id', user.id);
    }
  };

  const getCurrentPosition = (): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported");
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos.coords),
        (err) => {
          setError(err.message);
          resolve(null);
        }
      );
    });
  };

  const updateLocationInDB = async (coords: GeolocationCoordinates) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    // Fetch profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'driver') return;

    // Use the RPC call from the SQL script
    await supabase.rpc('update_driver_location', {
      lat: coords.latitude,
      lng: coords.longitude
    });

    // Also ensure online status is true
    await supabase
      .from('profiles')
      .update({ is_online: true })
      .eq('id', session.user.id);
  };

  // Re-acquire wake lock if tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (wakeLock.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <LocationContext.Provider value={{ coords, isTracking, startTracking, stopTracking, getCurrentPosition, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
