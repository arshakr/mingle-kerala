import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../../../app/page';
import { getBrandTokens } from '../brand';

describe('Mingle Kerala DEV shell', () => {
  it('uses the approved Kerala palette', () => {
    expect(getBrandTokens()).toEqual({ primary:'#10B981', secondary:'#7C3AED', accent:'#FBBF24', background:'#071C18' });
  });
  it('offers the approved login entry', () => {
    render(<HomePage />);
    expect(screen.getByRole('link',{name:/Start Mingling/i}).getAttribute('href')).toBe('/login');
    expect(screen.getByRole('heading',{level:1}).textContent).toMatch(/Real connections/);
  });
});
