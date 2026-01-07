-- 1. Create System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Seed Default Settings
INSERT INTO public.system_settings (key, value, description) VALUES
('base_delivery_fee', '25.00', 'Base fee for any delivery (ZMW)'),
('km_rate', '5.50', 'Price per kilometer (ZMW)'),
('service_tax', '16', 'Tax percentage applied to orders (%)'),
('min_payout', '100.00', 'Minimum ZMW for driver withdrawal')
ON CONFLICT (key) DO NOTHING;

-- 3. RLS for Settings
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

-- 4. Set up Realtime for Settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
