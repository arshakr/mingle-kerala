import Link from 'next/link';

const highlights = [
  { icon: '✦', label: 'Anonymous profiles' },
  { icon: '◎', label: 'All 14 districts' },
  { icon: '♡', label: 'Meaningful connections' },
];
export default function Home() {
  return (
    <main className="landing" aria-labelledby="hero-title">
      <div className="sky" aria-hidden="true" /><div className="sun" aria-hidden="true" />
      <div className="hills" aria-hidden="true" /><div className="water" aria-hidden="true" />
      <div className="boat" aria-hidden="true"><i /></div>
      <div className="shade" aria-hidden="true" />
      <header className="topbar">
        <Link href="/" className="brand" aria-label="Mingle Kerala home"><span className="brandmark">m✦</span>Mingle<span>Kerala</span></Link>
        <span className="beta">● PRIVATE DEV BETA</span>
      </header>
      <section className="hero">
        <p className="eyebrow">🌴 MADE FOR KERALA · ADULTS 18+</p>
        <h1 id="hero-title">A little mystery.<br /><span>A lot of connection.</span></h1>
        <h2>Connect Hearts Across Kerala.</h2>
        <p className="intro">Discover like-minded people across all 14 districts, express yourself through a unique avatar, and chat your way — without putting your real identity on display.</p>
        <Link href="/login" className="cta">Start Mingling <span aria-hidden="true">↗</span></Link>
        <p className="note">Invite-only access · 18+ · Free during DEV</p>
      </section>
      <footer className="features">
        {highlights.map(item => <span key={item.label}><strong>{item.icon}</strong> {item.label}</span>)}
      </footer>
    </main>
  );
}
