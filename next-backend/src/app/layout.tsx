import type { Metadata } from 'next'
import '../styles/global.css'

export const metadata: Metadata = {
  title: 'Mingle Kerala – Anonymous Social Discovery | Kerala 18+',
  description: 'Anonymous social discovery platform for adults 18+ from Kerala. Private, safe, and encrypted.',
  themeColor: '#0d1117',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Mingle Kerala – Anonymous Social Discovery',
    description: 'Meet people from Kerala anonymously. Privacy-first, 18+ platform.',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mingle',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
