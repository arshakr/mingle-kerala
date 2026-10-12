import assert from 'node:assert/strict';
import test from 'node:test';
import { getBrandTokens } from './brand.ts';

test('Mingle Kerala uses the approved green/purple theme', () => {
  assert.deepEqual(getBrandTokens(), {
    primary: '#10B981',
    secondary: '#7C3AED',
    accent: '#FBBF24',
    background: '#071C18',
  });
});
