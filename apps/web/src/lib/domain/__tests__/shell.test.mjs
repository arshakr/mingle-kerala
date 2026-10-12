import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getBrandTokens } from '../brand.ts';

test('official Mingle Kerala palette matches the approved specification', () => {
  assert.deepEqual(getBrandTokens(), {
    primary: '#10B981', secondary: '#7C3AED', accent: '#FBBF24', background: '#071C18',
  });
});

test('the home page has the approved Start Mingling action', () => {
  const home = readFileSync(new URL('../../../app/page.tsx', import.meta.url), 'utf8');
  assert.match(home, /Start Mingling/);
  assert.match(home, /\/login/);
});
