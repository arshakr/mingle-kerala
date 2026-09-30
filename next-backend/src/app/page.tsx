'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import '../styles/landing.css';
import ParticleCanvas from '@/components/ParticleCanvas';

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [districts, setDistricts] = useState(0);
  const [anonymous, setAnonymous] = useState(0);

  useEffect(() => {
    // Scroll listener for navbar
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Simple counter animation on mount
    let start = performance.now();
    const duration = 2000;
    
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setOnlineCount(Math.floor(eased * 12480));
      setDistricts(Math.floor(eased * 14));
      setAnonymous(Math.floor(eased * 100));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, []);

  return (
    <div className="page-landing">
      <ParticleCanvas />

      {/* Floating Organic Shapes */}
      <div className="organic-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
      </div>

      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <div className="logo-icon">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <defs>
                  <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#00d4aa' }} />
                    <stop offset="100%" style={{ stopColor: '#f59e0b' }} />
                  </linearGradient>
                </defs>
                <path d="M4 28 L4 8 Q4 4 8 4 L12 4 L18 20 L24 4 L28 4 Q32 4 32 8 L32 28 Q32 32 28 32 L24 32 L24 16 L20 28 L16 28 L12 16 L12 32 L8 32 Q4 32 4 28 Z" fill="url(#logoGrad)"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-main">Mingle</span>
              <span className="logo-sub">Kerala</span>
            </div>
          </Link>
          <div className="nav-actions">
            <button className="btn btn-ghost" onClick={() => router.push('/login')}>Login</button>
            <button className="btn btn-primary" onClick={() => router.push('/age-verify')}>Join Free</button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="hero">
          <div className="hero-container">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>Kerala • 18+ • Anonymous • Secure</span>
            </div>

            <h1 className="hero-title">
              <span className="title-line-1">Connect Anonymously.</span>
              <span className="title-line-2 gradient-text">Stay Private.</span>
            </h1>

            <p className="hero-subtitle">
              കേരളത്തിലെ ആൾക്കാരെ ആരെയും അറിയിക്കാതെ കണ്ടെത്തൂ.<br/>
              <span className="subtitle-en">Discover people across Kerala with zero identity exposure.</span>
            </p>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{onlineCount.toLocaleString('en-IN')}</span>
                <span className="stat-label">Online Now</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{districts}</span>
                <span className="stat-label">Districts</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{anonymous}</span>
                <span className="stat-label">% Anonymous</span>
              </div>
            </div>

            <div className="hero-cta">
              <button className="btn btn-hero" onClick={() => router.push('/age-verify')}>
                <span>Start Mingling</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>End-to-End Encrypted</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
                <span>No Real Name Needed</span>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                <span>18+ Verified Only</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features and Districts would go here similarly translated to JSX */}

      </main>
    </div>
  );
}
