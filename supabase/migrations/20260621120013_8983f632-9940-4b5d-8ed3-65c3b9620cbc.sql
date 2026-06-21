
ALTER TABLE public.contact_leads
  ADD COLUMN IF NOT EXISTS ai_score text,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS ai_suggested_reply text,
  ADD COLUMN IF NOT EXISTS ai_qualified_at timestamptz;
