-- Contact form storage migration.
-- Run once in the Supabase SQL Editor for projects whose base schema is already installed.
-- The API writes only with the server-side SUPABASE_SERVICE_ROLE_KEY.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.contact_messages FROM anon, authenticated;
GRANT ALL ON TABLE public.contact_messages TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.contact_messages_id_seq TO service_role;
