-- PRODUCTION HARDENING SCRIPT

-- 1. CLEANUP PERMISSIVE POLICIES (THE VULNERABILITY)
-- These were found in supabase_setup.sql and allow too much access
DROP POLICY IF EXISTS "Authenticated users can read orders." ON public.orders;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- 2. HARDEN PROFILE PRIVACY
-- Only authenticated users can see profiles, and we limit what they see via views if needed
-- For now, we allow authenticated users to see basic info (names, roles) for operational flow
CREATE POLICY "Authenticated users can see profile basics." ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. HARDEN ORDER ISOLATION (ZERO TRUST)
-- Admins: Full access (already exists, but we verify)
-- Clients: See ONLY their own (already exists in update_schema_client.sql)
-- Drivers: See target states (pending/requested) OR if they are assigned (verified in update_schema_client.sql)

-- 4. ADD CRITICAL PERFORMANCE INDEXES
-- Essential for scaling and preventing table scans as order volume increases
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_driver_id ON public.orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);

-- 5. ATOMICITY HELPER
-- Add a constraint to ensure status transitions are valid (already handled by CHECK constraint in updates)

-- 6. VERIFY RLS IS ACTIVE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
