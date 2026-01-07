-- 1. Enable PostGIS extension (required for geography types)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Profiles Table (Public info about drivers and admins)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('driver', 'admin')) DEFAULT 'driver',
  vehicle_type TEXT, -- motorcycle, car, van, etc.
  is_online BOOLEAN DEFAULT false,
  current_location GEOGRAPHY(POINT), -- Real-time GPS location
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create Orders Table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  pickup_address TEXT NOT NULL,
  pickup_coords GEOGRAPHY(POINT) NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_coords GEOGRAPHY(POINT) NOT NULL,
  price_zmw DECIMAL NOT NULL,
  status TEXT CHECK (status IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')) DEFAULT 'pending',
  assigned_driver_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

-- FIX: Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. Orders Policies
CREATE POLICY "Authenticated users can read orders." ON public.orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage orders." ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Drivers can update assigned orders." ON public.orders
  FOR UPDATE USING (
    auth.uid() = assigned_driver_id
  );

-- 7. Realtime setup
-- Add tables to the 'supabase_realtime' publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 8. Functions
-- RPC function for efficient location updates from mobile
CREATE OR REPLACE FUNCTION update_driver_location(lat FLOAT, lng FLOAT)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET 
    current_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    last_seen_at = now(),
    is_online = true
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
