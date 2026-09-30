/* ============================================================
   MINGLE KERALA — Kerala Monsoon Rain (rain.js)
   ============================================================ */

(function() {
  'use strict';

  const DROP_COUNT = 40;

  function createRain() {
    const container = document.getElementById('rainContainer');
    if (!container) return;

    for (let i = 0; i < DROP_COUNT; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';

      // Random properties
      const left      = Math.random() * 100;              // % from left
      const height    = 40 + Math.random() * 80;          // px length
      const duration  = 0.6 + Math.random() * 0.7;        // seconds
      const delay     = Math.random() * 4;                 // seconds stagger
      const opacity   = 0.15 + Math.random() * 0.45;

      drop.style.cssText = `
        left: ${left}%;
        height: ${height}px;
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        opacity: ${opacity};
        top: -${height}px;
      `;

      container.appendChild(drop);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createRain);
  } else {
    createRain();
  }
})();
