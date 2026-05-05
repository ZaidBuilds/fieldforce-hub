
-- =========================================
-- AMC / Service contracts
-- =========================================
CREATE TABLE public.service_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  title TEXT NOT NULL,
  service_type TEXT,
  frequency_days INTEGER NOT NULL DEFAULT 90,
  next_due_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.service_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access service_contracts" ON public.service_contracts FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sc_updated BEFORE UPDATE ON public.service_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Inventory
-- =========================================
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  stock NUMERIC NOT NULL DEFAULT 0,
  low_stock_threshold NUMERIC NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access inventory" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Expenses
-- =========================================
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  spent_on DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- =========================================
-- Roles (proper, separate table)
-- =========================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'technician');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Anyone can read roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Owners can manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'owner'))
  WITH CHECK (public.has_role(auth.uid(), 'owner'));
