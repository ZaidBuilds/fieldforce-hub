
-- Business settings (single row per owner) for branded invoices
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL DEFAULT 'My Business',
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  default_gst_rate NUMERIC NOT NULL DEFAULT 18.00,
  invoice_prefix TEXT NOT NULL DEFAULT 'INV',
  next_invoice_number INTEGER NOT NULL DEFAULT 1,
  upi_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own settings" ON public.business_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job parts/items consumed - drives line items on invoices
CREATE TABLE IF NOT EXISTS public.job_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage job parts" ON public.job_parts
  FOR ALL USING (true) WITH CHECK (true);

-- Customer feedback / ratings on a job
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_rating INTEGER;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS customer_feedback TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

-- Open access policies on existing tables since auth was removed (preview mode)
DROP POLICY IF EXISTS "Owners can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Techs can view customers for their jobs" ON public.customers;
CREATE POLICY "Open access customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Techs can update assigned jobs" ON public.jobs;
DROP POLICY IF EXISTS "Techs can view assigned jobs" ON public.jobs;
CREATE POLICY "Open access jobs" ON public.jobs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage invoices" ON public.invoices;
CREATE POLICY "Open access invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can manage all photos" ON public.job_photos;
DROP POLICY IF EXISTS "Techs can manage photos for their jobs" ON public.job_photos;
CREATE POLICY "Open access photos" ON public.job_photos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Techs can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Open access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
