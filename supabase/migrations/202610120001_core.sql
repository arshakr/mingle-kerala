-- Mingle Kerala private DEV beta — foundational schema only.
-- RLS is enabled with NO browser policies until separately reviewed Task 3.
-- Never apply this migration to the existing Neon/Render database.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE public.districts (
  id smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 14),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  name text NOT NULL UNIQUE
);

INSERT INTO public.districts (id, slug, name) VALUES
  (1, 'thiruvananthapuram', 'Thiruvananthapuram'),
  (2, 'kollam', 'Kollam'),
  (3, 'pathanamthitta', 'Pathanamthitta'),
  (4, 'alappuzha', 'Alappuzha'),
  (5, 'kottayam', 'Kottayam'),
  (6, 'idukki', 'Idukki'),
  (7, 'ernakulam', 'Ernakulam'),
  (8, 'thrissur', 'Thrissur'),
  (9, 'palakkad', 'Palakkad'),
  (10, 'malappuram', 'Malappuram'),
  (11, 'kozhikode', 'Kozhikode'),
  (12, 'wayanad', 'Wayanad'),
  (13, 'kannur', 'Kannur'),
  (14, 'kasaragod', 'Kasaragod')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_email text NOT NULL UNIQUE
    CHECK (normalized_email = lower(btrim(normalized_email)))
    CHECK (position('@' in normalized_email) > 1),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'redeemed', 'revoked', 'expired')),
  expires_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE TABLE public.private_accounts (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  state text NOT NULL DEFAULT 'pending_age'
    CHECK (state IN ('pending_age', 'active', 'restricted', 'suspended')),
  age_eligible boolean NOT NULL DEFAULT false,
  age_confirmation_version text,
  age_confirmed_at timestamptz,
  terms_version text,
  terms_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  restricted_at timestamptz,
  CHECK ((age_confirmed_at IS NULL AND age_confirmation_version IS NULL)
    OR (age_confirmed_at IS NOT NULL AND age_confirmation_version IS NOT NULL)),
  CHECK (state <> 'active' OR (age_eligible AND age_confirmed_at IS NOT NULL))
);

CREATE TABLE public.public_profiles (
  account_id uuid PRIMARY KEY REFERENCES public.private_accounts(auth_user_id) ON DELETE CASCADE,
  mingle_id text NOT NULL UNIQUE CHECK (mingle_id ~ '^MK-[A-Z0-9]{8,16}$'),
  anonymous_name text NOT NULL UNIQUE CHECK (length(anonymous_name) BETWEEN 3 AND 32),
  district_id smallint NOT NULL REFERENCES public.districts(id),
  display_age_band text NOT NULL
    CHECK (display_age_band IN ('18-20', '21-24', '25-29', '30-34', '35-39', '40-49', '50+')),
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'prefer_not_to_say')),
  languages text[] NOT NULL DEFAULT ARRAY['ml']::text[]
    CHECK (cardinality(languages) BETWEEN 1 AND 2)
    CHECK (languages <@ ARRAY['ml', 'en']::text[]),
  bio text NOT NULL DEFAULT '' CHECK (length(bio) <= 300),
  relationship_intent text NOT NULL
    CHECK (relationship_intent IN ('friendship', 'dating', 'serious')),
  avatar_config jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(avatar_config) = 'object'),
  is_discoverable boolean NOT NULL DEFAULT true,
  invisible_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.interests (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z][a-z0-9-]*$'),
  label_en text NOT NULL CHECK (length(label_en) BETWEEN 1 AND 50),
  label_ml text
);

CREATE TABLE public.profile_interests (
  account_id uuid NOT NULL REFERENCES public.public_profiles(account_id) ON DELETE CASCADE,
  interest_id integer NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (account_id, interest_id)
);

CREATE TABLE public.discovery_preferences (
  account_id uuid PRIMARY KEY REFERENCES public.private_accounts(auth_user_id) ON DELETE CASCADE,
  district_ids smallint[] NOT NULL DEFAULT '{}'::smallint[]
    CHECK (district_ids <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12,13,14]::smallint[]),
  genders text[] NOT NULL DEFAULT ARRAY['male','female','prefer_not_to_say']::text[]
    CHECK (genders <@ ARRAY['male','female','prefer_not_to_say']::text[]),
  age_min smallint NOT NULL DEFAULT 18 CHECK (age_min BETWEEN 18 AND 100),
  age_max smallint NOT NULL DEFAULT 100 CHECK (age_max BETWEEN age_min AND 100),
  languages text[] NOT NULL DEFAULT '{}'::text[]
    CHECK (languages <@ ARRAY['ml','en']::text[]),
  intentions text[] NOT NULL DEFAULT '{}'::text[]
    CHECK (intentions <@ ARRAY['friendship','dating','serious']::text[]),
  online_only boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX public_profiles_district_idx ON public.public_profiles(district_id);
CREATE INDEX public_profiles_visibility_idx ON public.public_profiles(is_discoverable, invisible_mode);
CREATE INDEX private_accounts_state_idx ON public.private_accounts(state);
CREATE INDEX invitations_status_idx ON public.invitations(status, expires_at);
CREATE INDEX profile_interests_interest_idx ON public.profile_interests(interest_id);

ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_preferences ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.private_accounts IS 'Private OAuth-backed identity; never expose to discovery.';
COMMENT ON TABLE public.public_profiles IS 'Anonymous display attributes only; account_id is an internal key.';
COMMENT ON TABLE public.invitations IS 'Private DEV invitation allowlist, redeemed by verified Google email.';
