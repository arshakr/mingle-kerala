/* ============================================================
   MINGLE KERALA — Landing Page Logic (landing.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ── Animate Counters ──────────────────────────────────── */
  window.animateCounters();

  /* ── Floating Cards Staggered Entrance ─────────────────── */
  const floatingCards = document.querySelectorAll('.floating-card');
  floatingCards.forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform += ' translateY(30px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
      card.style.opacity = '1';
      card.style.transform = card.style.transform.replace(' translateY(30px)', '');
    }, 400 + i * 200);
  });

  /* ── Parallax on Mouse Move ────────────────────────────── */
  const blobs = document.querySelectorAll('.blob');
  document.addEventListener('mousemove', window.debounce((e) => {
    const { clientX: x, clientY: y } = e;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;

    blobs.forEach((blob, i) => {
      const factor = (i + 1) * 12;
      blob.style.transform = `translate(${dx * factor}px, ${dy * factor}px) scale(${blob.style.transform.includes('scale') ? '1' : '1'})`;
    });

    // Parallax on hero content
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.style.transform = `translate(${dx * -4}px, ${dy * -4}px)`;
    }

    // Parallax on floating cards
    floatingCards.forEach((card, i) => {
      const f = (i + 1) * 8;
      const sign = i % 2 === 0 ? 1 : -1;
      const existingAnim = card.style.animationName;
      card.style.setProperty('--px', `${dx * f * sign}px`);
      card.style.setProperty('--py', `${dy * f * sign}px`);
    });
  }, 20));

  /* ── Features Section Intersection Observer ────────────── */
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card, i) => {
    card.classList.add('reveal');
    card.style.transitionDelay = `${i * 0.1}s`;
  });

  /* ── District Chips Hover Effects ──────────────────────── */
  const districtChips = document.querySelectorAll('.district-chip');
  districtChips.forEach(chip => {
    chip.addEventListener('mouseenter', () => {
      chip.style.transform = 'scale(1.06)';
    });
    chip.addEventListener('mouseleave', () => {
      chip.style.transform = 'scale(1)';
    });
  });

  /* ── Start Mingle Button ────────────────────────────────── */
  const startBtn = document.getElementById('startMinglingBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const verified = localStorage.getItem('mk_age_verified');
      if (verified === 'true') {
        if (window.checkAuth()) {
          window.navigateTo('dashboard.html');
        } else {
          window.navigateTo('login.html');
        }
      } else {
        window.navigateTo('age-verify.html');
      }
    });
  }

  /* ── How It Works Scroll ────────────────────────────────── */
  const howBtn = document.getElementById('howItWorksBtn');
  if (howBtn) {
    howBtn.addEventListener('click', () => {
      const section = document.getElementById('featuresSection');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ── Login / Join Buttons ───────────────────────────────── */
  const loginBtn = document.getElementById('navLoginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      window.navigateTo(window.checkAuth() ? 'dashboard.html' : 'login.html');
    });
  }

  const joinBtn = document.getElementById('navJoinBtn');
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      window.navigateTo(window.checkAuth() ? 'dashboard.html' : 'age-verify.html');
    });
  }

  /* ── Live "online" ticker simulation ───────────────────── */
  const onlineEl = document.getElementById('onlineStat');
  if (onlineEl) {
    setInterval(() => {
      const base = 12480;
      const delta = Math.floor(Math.random() * 80) - 40;
      const current = parseInt(onlineEl.textContent.replace(/,/g, ''), 10) || base;
      onlineEl.textContent = (current + delta).toLocaleString('en-IN');
    }, 5000);
  }

  /* ── Scroll Reveal (re-init after cards added) ─────────── */
  window.initScrollReveal();
});
