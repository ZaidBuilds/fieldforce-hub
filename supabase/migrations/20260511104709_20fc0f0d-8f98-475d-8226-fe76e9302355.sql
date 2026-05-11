
CREATE TABLE public.technician_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL,
  item_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (technician_id, item_id)
);
ALTER TABLE public.technician_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access technician_stock" ON public.technician_stock FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  technician_id uuid,
  job_id uuid,
  type text NOT NULL DEFAULT 'issue',
  quantity numeric NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Open access inventory_movements" ON public.inventory_movements FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_inv_mov_item ON public.inventory_movements(item_id);
CREATE INDEX idx_inv_mov_tech ON public.inventory_movements(technician_id);
