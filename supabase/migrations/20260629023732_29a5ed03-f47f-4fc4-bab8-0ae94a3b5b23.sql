
-- =========================================================
-- CRM: contacts + events
-- =========================================================

CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  raw_phone text,
  phone_normalized text UNIQUE,
  raw_email text,
  email_normalized text UNIQUE,
  status text NOT NULL DEFAULT 'novo',
  ai_score text,
  ai_summary text,
  ai_suggested_reply text,
  ai_qualified_at timestamptz,
  tags text[] NOT NULL DEFAULT '{}',
  source_first text,
  source_last text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage crm_contacts"
  ON public.crm_contacts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS crm_contacts_last_interaction_idx ON public.crm_contacts (last_interaction_at DESC);
CREATE INDEX IF NOT EXISTS crm_contacts_status_idx ON public.crm_contacts (status);
CREATE INDEX IF NOT EXISTS crm_contacts_score_idx ON public.crm_contacts (ai_score);

CREATE TABLE IF NOT EXISTS public.crm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  type text NOT NULL,
  source text,
  title text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_events TO authenticated;
GRANT ALL ON public.crm_events TO service_role;

ALTER TABLE public.crm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage crm_events"
  ON public.crm_events FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS crm_events_contact_created_idx ON public.crm_events (contact_id, created_at DESC);

-- updated_at trigger
CREATE TRIGGER crm_contacts_set_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Normalization helpers
-- =========================================================

CREATE OR REPLACE FUNCTION public.normalize_phone(p text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(regexp_replace(COALESCE(p,''), '\D', '', 'g'), '')
$$;

CREATE OR REPLACE FUNCTION public.normalize_email(e text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(lower(trim(COALESCE(e,''))), '')
$$;

-- =========================================================
-- merge_lead: dedup + upsert + event
-- =========================================================

CREATE OR REPLACE FUNCTION public.merge_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_source text,
  p_event_type text,
  p_title text,
  p_payload jsonb,
  p_event_at timestamptz DEFAULT now()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := public.normalize_phone(p_phone);
  v_email text := public.normalize_email(p_email);
  v_id uuid;
BEGIN
  -- locate existing contact
  SELECT id INTO v_id FROM public.crm_contacts
   WHERE (v_phone IS NOT NULL AND phone_normalized = v_phone)
      OR (v_email IS NOT NULL AND email_normalized = v_email)
   ORDER BY last_interaction_at DESC
   LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.crm_contacts (
      name, raw_phone, phone_normalized, raw_email, email_normalized,
      source_first, source_last, last_interaction_at
    ) VALUES (
      NULLIF(trim(COALESCE(p_name,'')), ''),
      NULLIF(trim(COALESCE(p_phone,'')), ''), v_phone,
      NULLIF(trim(COALESCE(p_email,'')), ''), v_email,
      p_source, p_source, COALESCE(p_event_at, now())
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.crm_contacts SET
      name = COALESCE(NULLIF(trim(COALESCE(p_name,'')), ''), name),
      raw_phone = COALESCE(raw_phone, NULLIF(trim(COALESCE(p_phone,'')), '')),
      phone_normalized = COALESCE(phone_normalized, v_phone),
      raw_email = COALESCE(raw_email, NULLIF(trim(COALESCE(p_email,'')), '')),
      email_normalized = COALESCE(email_normalized, v_email),
      source_last = p_source,
      last_interaction_at = GREATEST(last_interaction_at, COALESCE(p_event_at, now())),
      updated_at = now()
    WHERE id = v_id;
  END IF;

  INSERT INTO public.crm_events (contact_id, type, source, title, payload, created_at)
  VALUES (v_id, p_event_type, p_source, p_title, COALESCE(p_payload, '{}'::jsonb), COALESCE(p_event_at, now()));

  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.merge_lead(text,text,text,text,text,text,jsonb,timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.merge_lead(text,text,text,text,text,text,jsonb,timestamptz) TO authenticated, anon, service_role;

-- =========================================================
-- Triggers on existing lead tables
-- =========================================================

CREATE OR REPLACE FUNCTION public.trg_contact_lead_to_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.merge_lead(
    NEW.name, NEW.phone, NEW.email,
    COALESCE(NEW.source, 'contato'),
    'form_contato',
    'Formulário de contato',
    jsonb_build_object('message', NEW.message, 'lead_id', NEW.id),
    NEW.created_at
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS contact_leads_to_crm ON public.contact_leads;
CREATE TRIGGER contact_leads_to_crm
  AFTER INSERT ON public.contact_leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_contact_lead_to_crm();

CREATE OR REPLACE FUNCTION public.trg_seller_lead_to_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.merge_lead(
    NEW.name, NEW.phone, NEW.email,
    COALESCE(NEW.source, 'avaliacao_gratuita'),
    'form_avaliacao',
    'Pedido de avaliação',
    jsonb_build_object(
      'property_type', NEW.property_type,
      'address', NEW.address,
      'neighborhood', NEW.neighborhood,
      'desired_price', NEW.desired_price,
      'bedrooms', NEW.bedrooms,
      'notes', NEW.notes,
      'lead_id', NEW.id
    ),
    NEW.created_at
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS seller_leads_to_crm ON public.seller_leads;
CREATE TRIGGER seller_leads_to_crm
  AFTER INSERT ON public.seller_leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_seller_lead_to_crm();

CREATE OR REPLACE FUNCTION public.trg_match_lead_to_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.merge_lead(
    NEW.name, NEW.phone, NEW.email,
    'match_ia',
    'form_match',
    'Quiz Match IA',
    jsonb_build_object(
      'answers', NEW.answers,
      'recommended_property_ids', NEW.recommended_property_ids,
      'ai_reasoning', NEW.ai_reasoning,
      'lead_id', NEW.id
    ),
    NEW.created_at
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS match_leads_to_crm ON public.match_leads;
CREATE TRIGGER match_leads_to_crm
  AFTER INSERT ON public.match_leads
  FOR EACH ROW EXECUTE FUNCTION public.trg_match_lead_to_crm();

-- =========================================================
-- Backfill existing data (idempotent — function dedupes)
-- =========================================================

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM public.contact_leads ORDER BY created_at LOOP
    PERFORM public.merge_lead(
      r.name, r.phone, r.email, COALESCE(r.source,'contato'),
      'form_contato', 'Formulário de contato',
      jsonb_build_object('message', r.message, 'lead_id', r.id, 'backfill', true),
      r.created_at
    );
  END LOOP;

  FOR r IN SELECT * FROM public.seller_leads ORDER BY created_at LOOP
    PERFORM public.merge_lead(
      r.name, r.phone, r.email, COALESCE(r.source,'avaliacao_gratuita'),
      'form_avaliacao', 'Pedido de avaliação',
      jsonb_build_object(
        'property_type', r.property_type, 'address', r.address,
        'neighborhood', r.neighborhood, 'desired_price', r.desired_price,
        'bedrooms', r.bedrooms, 'notes', r.notes, 'lead_id', r.id, 'backfill', true
      ),
      r.created_at
    );
  END LOOP;

  FOR r IN SELECT * FROM public.match_leads ORDER BY created_at LOOP
    PERFORM public.merge_lead(
      r.name, r.phone, r.email, 'match_ia',
      'form_match', 'Quiz Match IA',
      jsonb_build_object(
        'answers', r.answers,
        'recommended_property_ids', r.recommended_property_ids,
        'ai_reasoning', r.ai_reasoning, 'lead_id', r.id, 'backfill', true
      ),
      r.created_at
    );
  END LOOP;
END $$;
