import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = () => readFileSync(new URL('../../supabase/migrations/202610120001_core.sql', import.meta.url), 'utf8');

test('private DEV database defines 14 Kerala districts', () => {
  const sql = source();
  const districts = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
    'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod',
  ];
  for (const district of districts) assert.ok(sql.includes(`'${district}'`), `missing district ${district}`);
  assert.match(sql, /districts\s*\(/i);
  assert.match(sql, /CHECK\s*\(id BETWEEN 1 AND 14\)/i);
});

test('DEV schema separates private auth identity from public anonymous profile', () => {
  const sql = source();
  for (const table of ['invitations', 'private_accounts', 'public_profiles', 'districts', 'interests', 'profile_interests', 'discovery_preferences']) {
    assert.match(sql, new RegExp(`CREATE TABLE public\\.${table}\\s*\\(`, 'i'));
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'));
  }
  const fields = sql.match(/CREATE TABLE public\.public_profiles\s*\(([\s\S]*?)\n\);/i)?.[1] ?? '';
  for (const banned of ['email','date_of_birth','google_name','google_picture','phone']) {
    assert.doesNotMatch(fields, new RegExp(`^\\s*${banned}\\s+`, 'im'));
  }
  assert.match(fields, /mingle_id\s+text\s+NOT NULL\s+UNIQUE/i);
  assert.match(fields, /anonymous_name\s+text\s+NOT NULL\s+UNIQUE/i);
});

test('age, intent, discovery and language inputs are database constrained', () => {
  const sql = source();
  assert.match(sql, /age_min\s+smallint\s+NOT NULL\s+DEFAULT 18/i);
  assert.match(sql, /CHECK\s*\(age_max BETWEEN age_min AND 100\)/i);
  assert.match(sql, /CHECK\s*\(gender IN \('male', 'female', 'prefer_not_to_say'\)\)/i);
  assert.match(sql, /CHECK\s*\(relationship_intent IN \('friendship', 'dating', 'serious'\)\)/i);
  assert.match(sql, /languages\s+text\[\]/i);
  assert.match(sql, /CHECK\s*\(length\(bio\) <= 300\)/i);
});
