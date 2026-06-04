-- 004_billing_and_prefs.sql
-- Adds:
--  • organisations.monthly_rate_inr (display-only billing rate; payment is offline)
--  • users.notification_prefs (per-user JSONB toggle map)
--
-- Channel codes used inside notification_prefs:
--   "in_app" | "email" | "whatsapp"

alter table organisations
  add column if not exists monthly_rate_inr numeric;

alter table users
  add column if not exists notification_prefs jsonb not null default jsonb_build_object(
    'new_lead',          jsonb_build_array('in_app', 'email', 'whatsapp'),
    'reel_approval',     jsonb_build_array('in_app', 'email'),
    'followup',          jsonb_build_array('in_app', 'email', 'whatsapp'),
    'deliverable',       jsonb_build_array('in_app', 'email'),
    'escalation',        jsonb_build_array('in_app', 'email', 'whatsapp')
  );
