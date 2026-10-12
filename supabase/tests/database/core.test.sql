-- pgTAP integration tests; run against a disposable local Supabase DB only.
BEGIN;
SELECT plan(21);

SELECT has_table('public', 'districts');
SELECT has_table('public', 'invitations');
SELECT has_table('public', 'private_accounts');
SELECT has_table('public', 'public_profiles');
SELECT has_table('public', 'interests');
SELECT has_table('public', 'profile_interests');
SELECT has_table('public', 'discovery_preferences');

SELECT is((SELECT count(*) FROM public.districts), 14::bigint, 'Exactly 14 Kerala districts');
SELECT is((SELECT count(DISTINCT slug) FROM public.districts), 14::bigint, 'Unique district slugs');
SELECT ok((SELECT bool_and(id BETWEEN 1 AND 14) FROM public.districts), 'District ids constrained 1..14');
SELECT throws_ok(
  $$INSERT INTO public.districts (id,slug,name) VALUES (15,'not-kerala','Other')$$,
  '23514', NULL, 'Cannot create a 15th district'
);

SELECT has_column('public', 'public_profiles', 'mingle_id');
SELECT has_column('public', 'public_profiles', 'anonymous_name');
SELECT hasnt_column('public', 'public_profiles', 'email');
SELECT hasnt_column('public', 'public_profiles', 'date_of_birth');
SELECT hasnt_column('public', 'public_profiles', 'google_name');
SELECT hasnt_column('public', 'public_profiles', 'phone');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.invitations'::regclass), 'Invitations RLS enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.private_accounts'::regclass), 'Private accounts RLS enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.public_profiles'::regclass), 'Profiles RLS enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.discovery_preferences'::regclass), 'Preferences RLS enabled');

SELECT * FROM finish();
ROLLBACK;
