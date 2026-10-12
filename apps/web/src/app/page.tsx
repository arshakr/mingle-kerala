import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="landing-shell">
      <div className="ambient ambient-green" aria-hidden="true" />
      <div className="ambient ambient-purple" aria-hidden="true" />
      <header className="topbar" aria-label="Main navigation">
        <div className="wordmark" aria-label="Mingle Kerala">
          <span className="brand-symbol" aria-hidden="true">✦</span>
          <span>Mingle<span className="wordmark-accent">Kerala</span></span>
        </div>
        <span className="beta-badge"><span className="badge-dot" /> Private Beta</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="scene-backdrop" aria-hidden="true">
          <span className="setting-sun" />
          <span className="backwater-line backwater-line-one" />
          <span className="backwater-line backwater-line-two" />
          <span className="palm palm-left">✺</span>
          <span className="palm palm-right">✺</span>
          <span className="boat"><span className="boat-roof" /></span>
        </div>
        <div className="hero-content">
          <span className="eyebrow"><span className="eyebrow-line" /> FROM KERALA, FOR KERALA</span>
          <h1 id="hero-title">Real connections.<br /><em>Beautifully anonymous.</em></h1>
          <p className="hero-description">Meet interesting people across all 14 districts. Discover, match, and start something meaningful—while keeping your identity yours.</p>
          <div className="hero-actions">
            <Link className="primary-cta" href="/login">Start Mingling <span aria-hidden="true">↗</span></Link>
            <span className="cta-note">🔒 Invite-only · 18+ · Free during beta</span>
          </div>
        </div>
        <div className="scene-caption" aria-hidden="true">01 / THE BACKWATERS</div>
      </section>
      <footer className="site-footer">
        <span>🌴 Made for meaningful connections</span>
        <span>Anonymous by design. Kindness by choice.</span>
      </footer>
    </main>
  );
}
