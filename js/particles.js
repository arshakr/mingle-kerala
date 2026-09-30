/* ============================================================
   MINGLE KERALA — Particle Canvas (particles.js)
   ============================================================ */

(function() {
  'use strict';

  const CONFIG = {
    count:     80,
    color:     'rgba(0, 212, 170, ',
    radius:    { min: 1, max: 3 },
    speed:     { min: 0.1, max: 0.4 },
    linkDist:  130,
    linkAlpha: 0.12,
  };

  let canvas, ctx, particles = [], animId, W, H;

  function Particle() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = CONFIG.radius.min + Math.random() * (CONFIG.radius.max - CONFIG.radius.min);
    const angle = Math.random() * Math.PI * 2;
    const speed = CONFIG.speed.min + Math.random() * (CONFIG.speed.max - CONFIG.speed.min);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 0.2 + Math.random() * 0.6;
  }

  Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0)  { this.x = 0;  this.vx *= -1; }
    if (this.x > W)  { this.x = W;  this.vx *= -1; }
    if (this.y < 0)  { this.y = 0;  this.vy *= -1; }
    if (this.y > H)  { this.y = H;  this.vy *= -1; }
  };

  Particle.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.color + this.alpha + ')';
    ctx.fill();
  };

  function drawLinks() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.linkDist) {
          const alpha = CONFIG.linkAlpha * (1 - dist / CONFIG.linkDist);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = CONFIG.color + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLinks();
    animId = requestAnimationFrame(animate);
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init() {
    canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    particles = Array.from({ length: CONFIG.count }, () => new Particle());
    animate();

    window.addEventListener('resize', () => {
      resize();
      particles = Array.from({ length: CONFIG.count }, () => new Particle());
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
