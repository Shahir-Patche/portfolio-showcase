/*
  # Database Security & Governance Policies
  
  Demonstrates Row Level Security (RLS) implementation for multi-tenant data isolation 
  and "Break Glass" emergency access procedures common in industrial environments.

  1. Tables:
     - `subjects`: Pseudonymized user identities.
     - `audit_logs`: Immutable security trail.
     - `break_glass_requests`: Emergency access workflow.

  2. Security Features:
     - Encrypted data support.
     - Strict RLS policies (User can only see own data).
     - Service Role bypass for authorized edge functions.
*/

-- 1. Pseudonymization Layer
-- "subjects" table decouples medical/biometric data from auth.users (PII).
CREATE TABLE IF NOT EXISTS subjects (
  subject_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS: Users can only see their own subject mapping.
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subject record"
  ON subjects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Audit Logging (Immutable)
-- Stores all access attempts, successes, and failures.
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid, -- Link to auth.users
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now()
);

-- Security: Append-only log. No UPDATE/DELETE policies exist.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. "Break Glass" Protocol
-- Allows authorized personnel to access sensitive data during emergencies.
-- Requires dual-authorization or audited justification.
CREATE TABLE IF NOT EXISTS break_glass_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  target_id uuid NOT NULL,
  justification text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'expired', 'completed')),
  expires_at timestamptz
);

-- Only Service Role (via Edge Function) can manage these requests to ensure business logic is enforced.
ALTER TABLE break_glass_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages break glass"
  ON break_glass_requests FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: Automatically expire old requests (to be run via pg_cron)
CREATE OR REPLACE FUNCTION expire_break_glass_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE break_glass_requests
  SET status = 'expired'
  WHERE status = 'pending'
  AND created_at < now() - interval '24 hours';
END;
$$;
