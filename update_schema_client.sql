-- 1. Update Profile Roles to include 'client'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('driver', 'admin', 'client'));

-- 2. Update Orders table to support Client relationship and enhanced status
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS vehicle_type_required TEXT DEFAULT 'motorcycle';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receiver_name TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receiver_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS item_description TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS driver_notes TEXT;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'requested', 'assigned', 'picked_up', 'delivered', 'cancelled', 'expired'));

-- 3. Enhance RLS for Clients
DROP POLICY IF EXISTS "Clients can view their own orders." ON public.orders;
CREATE POLICY "Clients can view their own orders." ON public.orders
  FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Clients can create their own orders." ON public.orders;
CREATE POLICY "Clients can create their own orders." ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- 4. Driver Assignment Logic (Requested state)
DROP POLICY IF EXISTS "Drivers can view requested orders." ON public.orders;
CREATE POLICY "Drivers can view requested orders." ON public.orders
  FOR SELECT USING (
    (EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'driver'
    ) AND (status = 'requested' OR status = 'pending')) OR
    (auth.uid() = assigned_driver_id)
  );

-- 5. Track Payouts and Ratings (Optional but recommended for "proper functionality")
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 5.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 6. Add trigger for updated_at in orders
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_timestamp ON public.orders;
CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE PROCEDURE update_order_timestamp();
