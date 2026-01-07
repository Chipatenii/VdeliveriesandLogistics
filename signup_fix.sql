-- 1. Create a function to handle new user signups
-- This function will run as superuser (security definer) to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, vehicle_type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'driver'),
    new.raw_user_meta_data->>'vehicle_type'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Update existing policies to be simpler
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

-- No need for an INSERT policy anymore since the Trigger handles it as System
-- But users still need to be able to UPDATE their own profile (status, location, online toggle)
CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
