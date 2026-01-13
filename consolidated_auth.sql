-- CONSOLIDATED AUTH & SECURITY SCRIPT
-- This script should be run in the Supabase SQL Editor to ensure a clean and secure auth foundation.

-- 1. CLEANUP PREVIOUS TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREATE ROBUST NEW USER HANDLER
-- This handles profile creation for all roles (admin, driver, client)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, vehicle_type, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'client'), -- Default to client if no role specified
    new.raw_user_meta_data->>'vehicle_type',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREATE TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. HARDEN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. CLEANUP OLD POLICIES (Comprehensive)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can see profile basics." ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Authenticated users can read orders." ON public.orders;
DROP POLICY IF EXISTS "Admins have full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can see pending or assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Drivers can update their assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can view their own orders." ON public.orders;
DROP POLICY IF EXISTS "Clients can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can create their own orders" ON public.orders;

-- 6. APPLY HARDENED POLICIES
-- Profiles: Users can see only basic info unless they are admins
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Orders: Detailed isolation
CREATE POLICY "Admins have full access to orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Drivers can see pending or assigned orders" ON public.orders
  FOR SELECT USING (
    status = 'pending' OR status = 'requested' OR assigned_driver_id = auth.uid()
  );

CREATE POLICY "Drivers can update their assigned orders" ON public.orders
  FOR UPDATE USING (
    assigned_driver_id = auth.uid()
  );

-- Client and Order Schema Enhancements
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vehicle_type_required TEXT DEFAULT 'motorcycle';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receiver_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receiver_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_notes TEXT;

-- Update status constraint to include all app states
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'requested', 'assigned', 'picked_up', 'delivered', 'cancelled', 'expired'));

-- RLS Policies
CREATE POLICY "Clients can view their own orders" ON public.orders
  FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 7. BACKFILL MISSING PROFILES
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', COALESCE(raw_user_meta_data->>'role', 'client')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 8. SYSTEM SETTINGS (App Configuration)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.system_settings (key, value, description) VALUES
('base_delivery_fee', '25.00', 'Base fee for any delivery (ZMW)'),
('km_rate', '5.50', 'Price per kilometer (ZMW)'),
('service_tax', '16', 'Tax percentage applied to orders (%)'),
('min_payout', '100.00', 'Minimum ZMW for driver withdrawal')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Settings are viewable by authenticated users." ON public.system_settings;
CREATE POLICY "Settings are viewable by authenticated users." ON public.system_settings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Settings are manageable by admins." ON public.system_settings;
CREATE POLICY "Settings are manageable by admins." ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ensure settings are in the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'system_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
END $$;

COMMIT;
