import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mingle Kerala | Connect Hearts Across Kerala',
  description: 'An anonymous discovery space for adults across Kerala.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
