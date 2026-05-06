
ALTER TABLE public.contact_leads
ADD COLUMN status text NOT NULL DEFAULT 'novo'
CONSTRAINT contact_leads_status_check CHECK (status IN ('novo', 'em_contato', 'convertido'));
