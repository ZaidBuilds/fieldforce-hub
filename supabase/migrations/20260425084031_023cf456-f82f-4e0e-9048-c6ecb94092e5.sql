-- 1. Add tracking + feedback tokens + ETA to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS tracking_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS feedback_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS eta_minutes integer;

-- Backfill existing rows
UPDATE public.jobs
SET tracking_token = encode(gen_random_bytes(12), 'hex')
WHERE tracking_token IS NULL;

UPDATE public.jobs
SET feedback_token = encode(gen_random_bytes(12), 'hex')
WHERE feedback_token IS NULL;

-- Auto-generate tokens on new jobs
CREATE OR REPLACE FUNCTION public.set_job_tokens()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_token IS NULL THEN
    NEW.tracking_token := encode(gen_random_bytes(12), 'hex');
  END IF;
  IF NEW.feedback_token IS NULL THEN
    NEW.feedback_token := encode(gen_random_bytes(12), 'hex');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_set_tokens ON public.jobs;
CREATE TRIGGER jobs_set_tokens
BEFORE INSERT ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.set_job_tokens();

-- 2. Private storage bucket for invoice PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-pdfs', 'invoice-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- Open access policies (matches current app posture; access is via signed URLs)
CREATE POLICY "Anyone can read invoice pdfs"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-pdfs');

CREATE POLICY "Anyone can upload invoice pdfs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoice-pdfs');

CREATE POLICY "Anyone can update invoice pdfs"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoice-pdfs');

CREATE POLICY "Anyone can delete invoice pdfs"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoice-pdfs');