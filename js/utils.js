/* ============================================================
   MINGLE KERALA — Shared Utilities (utils.js)
   ============================================================ */

'use strict';

/* ── Toast Notifications ─────────────────────────────────── */
window.showToast = function(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-msg">${msg}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};

/* ── Page Navigation with Fade Transition ────────────────── */
window.navigateTo = function(url) {
  document.body.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  document.body.style.opacity = '0';
  document.body.style.transform = 'translateY(8px)';
  setTimeout(() => { window.location.href = url; }, 300);
};

/* ── Scroll Reveal ───────────────────────────────────────── */
window.initScrollReveal = function() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => io.observe(el));
};

/* ── Navbar Glass on Scroll ──────────────────────────────── */
window.initNavbarScroll = function() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', update, { passive: true });
  update();
};

/* ── Animated Counters ───────────────────────────────────── */
window.animateCounters = function() {
  const counters = document.querySelectorAll('[data-count]');
  counters.forEach(el => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 2000;
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
};

/* ── Time-based Gradient ─────────────────────────────────── */
window.setTimeBasedGradient = function() {
  const h = new Date().getHours();
  let gradient;
  if (h >= 5 && h < 9) {
    // Dawn — pink/orange
    gradient = 'radial-gradient(ellipse at 20% 80%, rgba(236,72,153,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.08) 0%, transparent 60%)';
  } else if (h >= 9 && h < 17) {
    // Day — teal/blue
    gradient = 'radial-gradient(ellipse at 20% 80%, rgba(0,212,170,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(59,130,246,0.06) 0%, transparent 60%)';
  } else if (h >= 17 && h < 20) {
    // Dusk — gold/purple
    gradient = 'radial-gradient(ellipse at 20% 80%, rgba(245,158,11,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.08) 0%, transparent 60%)';
  } else {
    // Night — deep purple
    gradient = 'radial-gradient(ellipse at 20% 80%, rgba(139,92,246,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,170,0.04) 0%, transparent 60%)';
  }
  document.body.style.backgroundImage = gradient;
};

/* ── Debounce ────────────────────────────────────────────── */
window.debounce = function(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/* ── Format Time (Indian locale) ─────────────────────────── */
window.formatTime = function(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

/* ── Generate Anonymous Username ──────────────────────────── */
window.generateUsername = function() {
  const adjectives = [
    'Silent','Swift','Calm','Wild','Bold','Serene','Mystic','Azure',
    'Golden','Silver','Amber','Jade','Teal','Lunar','Solar','Storm',
    'Misty','Vivid','Brave','Noble','Gentle','Keen','Bright','Dark'
  ];
  const nouns = [
    'Wave','River','Moon','Star','Rain','Cloud','Wind','Lotus',
    'Tiger','Eagle','Falcon','Mist','Storm','Breeze','Shore','Tide',
    'Dusk','Dawn','Gale','Reef','Creek','Peak','Crest','Flame'
  ];
  const adj  = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num  = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
};

/* ── Auth Helpers ────────────────────────────────────────── */
window.checkAuth = function() {
  try { return !!localStorage.getItem('mk_user'); }
  catch { return false; }
};

window.getUser = function() {
  try {
    const raw = localStorage.getItem('mk_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

window.requireAuth = function(redirect = 'login.html') {
  if (!window.checkAuth()) {
    window.location.href = redirect;
    return false;
  }
  return true;
};

window.logout = function() {
  try { localStorage.removeItem('mk_user'); } catch {}
  window.navigateTo('index.html');
};

/* ── Safe LocalStorage ───────────────────────────────────── */
window.storage = {
  get(key) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  remove(key) {
    try { localStorage.removeItem(key); return true; }
    catch { return false; }
  }
};

/* ── Modal Helpers ───────────────────────────────────────── */
window.openModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
};

window.closeModal = function(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.remove('open');
    document.body.style.overflow = '';
  }
};

/* ── Mock Users ──────────────────────────────────────────── */
window.MOCK_USERS = [
  { id:'u1',  name:'MistyRiver4821', district:'Kozhikode',       gender:'Female', interests:['Music','Travel'],           online:true  },
  { id:'u2',  name:'AzureWave9043',  district:'Thrissur',         gender:'Male',   interests:['Gaming','Movies'],          online:true  },
  { id:'u3',  name:'GoldenTide3312', district:'Kottayam',         gender:'Female', interests:['Books','Art'],              online:false },
  { id:'u4',  name:'SilentMoon7754', district:'Ernakulam',        gender:'Male',   interests:['Food','Travel'],            online:true  },
  { id:'u5',  name:'BoldStorm2198',  district:'Thiruvananthapuram',gender:'Male',  interests:['Sports','Tech'],            online:true  },
  { id:'u6',  name:'LunarBreeze6631',district:'Palakkad',         gender:'Female', interests:['Nature','Cooking'],         online:false },
  { id:'u7',  name:'VividFlame8820', district:'Kannur',           gender:'Male',   interests:['Music','Gaming'],           online:true  },
  { id:'u8',  name:'JadeLotus5509',  district:'Malappuram',       gender:'Female', interests:['Fashion','Art'],            online:true  },
  { id:'u9',  name:'SolarPeak3347',  district:'Kollam',           gender:'Male',   interests:['Travel','Books'],           online:false },
  { id:'u10', name:'SereneGale7712', district:'Alappuzha',        gender:'Female', interests:['Nature','Music'],           online:true  },
  { id:'u11', name:'SwiftCrest4490', district:'Idukki',           gender:'Male',   interests:['Sports','Cooking'],         online:true  },
  { id:'u12', name:'AmberDawn9981',  district:'Wayanad',          gender:'Female', interests:['Art','Travel'],             online:false },
  { id:'u13', name:'TealMoon2267',   district:'Kasaragod',        gender:'Male',   interests:['Tech','Gaming'],            online:true  },
  { id:'u14', name:'NobleReef5543',  district:'Pathanamthitta',   gender:'Female', interests:['Books','Fashion'],          online:true  },
  { id:'u15', name:'MysticTide8834', district:'Thrissur',         gender:'Male',   interests:['Movies','Food'],            online:false },
  { id:'u16', name:'BrightDawn3391', district:'Kozhikode',        gender:'Female', interests:['Cooking','Music'],          online:true  },
  { id:'u17', name:'DarkFlame7723',  district:'Ernakulam',        gender:'Male',   interests:['Tech','Sports'],            online:true  },
  { id:'u18', name:'CalmTide9901',   district:'Thrissur',         gender:'Female', interests:['Art','Nature'],             online:false },
];

window.KERALA_DISTRICTS = [
  'Thiruvananthapuram','Kollam','Pathanamthitta','Alappuzha',
  'Kottayam','Idukki','Ernakulam','Thrissur',
  'Palakkad','Malappuram','Kozhikode','Wayanad',
  'Kannur','Kasaragod'
];

/* ── Avatar gradient picker ──────────────────────────────── */
window.getAvatarGradient = function(name) {
  const gradients = [
    'linear-gradient(135deg,#00d4aa,#8b5cf6)',
    'linear-gradient(135deg,#f59e0b,#ec4899)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#00d4aa,#f59e0b)',
    'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    'linear-gradient(135deg,#ec4899,#f59e0b)',
  ];
  const idx = (name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % gradients.length;
  return gradients[idx];
};

/* ── Render User Card ────────────────────────────────────── */
window.renderUserCard = function(user, onChat) {
  const card = document.createElement('div');
  card.className = 'user-card';
  const initial = user.name.charAt(0).toUpperCase();
  const tags = user.interests.slice(0, 3).map(i =>
    `<span class="interest-chip">${i}</span>`
  ).join('');

  card.innerHTML = `
    <div class="flex items-center gap-12 mb-16">
      <div class="user-avatar" style="background:${window.getAvatarGradient(user.name)}">
        ${initial}
        <span class="online-dot${user.online ? '' : ' offline'}"></span>
      </div>
      <div style="flex:1;min-width:0">
        <div class="truncate" style="font-weight:700;font-size:0.9rem">${user.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">📍 ${user.district}</div>
      </div>
      <span class="badge ${user.online ? 'badge-online' : ''}" style="${!user.online ? 'background:rgba(255,255,255,0.05);color:var(--text-muted);border:1px solid var(--border-glass)' : ''}">
        ${user.online ? '● Online' : 'Offline'}
      </span>
    </div>
    <div class="interests-tags">${tags}</div>
    <button class="btn btn-primary btn-sm w-full mt-16 chat-btn" data-id="${user.id}">
      💬 Start Chat
    </button>
  `;

  const btn = card.querySelector('.chat-btn');
  if (btn && onChat) btn.addEventListener('click', () => onChat(user));

  return card;
};

/* ── Service Worker Registration ──────────────────────────── */
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .catch(() => {}); // Silent fail in dev
    });
  }
}

/* ── DOMContentLoaded Init ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Animate page entrance
  document.body.classList.add('page-enter');

  // Core inits
  window.setTimeBasedGradient();
  window.initScrollReveal();
  window.initNavbarScroll();
  registerSW();

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        const id = overlay.id;
        if (id) window.closeModal(id);
      }
    });
  });

  // Close modals on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });
});
