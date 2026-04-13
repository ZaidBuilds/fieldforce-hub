
-- Create enums
CREATE TYPE public.job_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.user_role AS ENUM ('owner', 'technician');
CREATE TYPE public.payment_method AS ENUM ('cash', 'upi', 'online');
CREATE TYPE public.payment_status AS ENUM ('pending', 'collected', 'verified');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'technician',
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND role = 'owner');
$$;

CREATE POLICY "Owners can view all profiles" ON public.profiles FOR SELECT USING (public.is_owner(auth.uid()));
CREATE POLICY "Techs can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can insert profiles" ON public.profiles FOR INSERT WITH CHECK (public.is_owner(auth.uid()) OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT,
  pincode TEXT,
  gst_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage customers" ON public.customers FOR ALL USING (public.is_owner(auth.uid()));

-- Jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  assigned_to UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  service_type TEXT,
  status public.job_status NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  address TEXT,
  city TEXT,
  pincode TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  checkin_at TIMESTAMPTZ,
  checkout_at TIMESTAMPTZ,
  checkin_latitude DOUBLE PRECISION,
  checkin_longitude DOUBLE PRECISION,
  customer_signature_url TEXT,
  notes TEXT,
  payment_amount NUMERIC(10,2) DEFAULT 0,
  payment_method public.payment_method,
  payment_status public.payment_status DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage all jobs" ON public.jobs FOR ALL USING (public.is_owner(auth.uid()));
CREATE POLICY "Techs can view assigned jobs" ON public.jobs FOR SELECT USING (assigned_to = auth.uid());
CREATE POLICY "Techs can update assigned jobs" ON public.jobs FOR UPDATE USING (assigned_to = auth.uid());

-- Now add customer policy that references jobs
CREATE POLICY "Techs can view customers for their jobs" ON public.customers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.customer_id = id AND j.assigned_to = auth.uid())
);

-- Job Photos
CREATE TABLE public.job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  uploaded_by UUID REFERENCES auth.users(id),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage all photos" ON public.job_photos FOR ALL USING (public.is_owner(auth.uid()));
CREATE POLICY "Techs can manage photos for their jobs" ON public.job_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.assigned_to = auth.uid())
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  invoice_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC(10,2) NOT NULL,
  gst_rate NUMERIC(4,2) NOT NULL DEFAULT 18.00,
  gst_amount NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage invoices" ON public.invoices FOR ALL USING (public.is_owner(auth.uid()));

-- Indexes
CREATE INDEX idx_jobs_assigned_to ON public.jobs(assigned_to);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_scheduled_date ON public.jobs(scheduled_date);
CREATE INDEX idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX idx_job_photos_job_id ON public.job_photos(job_id);
CREATE INDEX idx_invoices_job_id ON public.invoices(job_id);
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for job photos and signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('job-assets', 'job-assets', true);
CREATE POLICY "Anyone can view job assets" ON storage.objects FOR SELECT USING (bucket_id = 'job-assets');
CREATE POLICY "Authenticated users can upload job assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'job-assets' AND auth.role() = 'authenticated');
