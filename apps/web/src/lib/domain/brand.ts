export type BrandTokens = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
};

export function getBrandTokens(): BrandTokens {
  return {
    primary: '#10B981',
    secondary: '#7C3AED',
    accent: '#FBBF24',
    background: '#071C18',
  };
}
