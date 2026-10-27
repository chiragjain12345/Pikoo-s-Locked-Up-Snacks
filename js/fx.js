/* =========================================================
   Visual effects: confetti cannons, star bursts, tap bubbles,
   and underwater light rays on every screen.
   ========================================================= */

const fxLayer = document.createElement('div');
fxLayer.id = 'fx-layer';
stage.appendChild(fxLayer);

const CONFETTI_COLORS = ['#ffd25a', '#ff9f1c', '#2f7ae0', '#ff5fa2', '#2fbf5b', '#8b4ad8', '#3fe0e8', '#ffffff'];
const CONFETTI_SHAPES = ['rect', 'rect', 'circle', 'star', 'ribbon', 'shell'];

function confettiPiece(x, y, vx, vy, delay) {
  const el = document.createElement('i');
  const shape = CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)];
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  el.className = `cf cf-${shape}`;
  if (shape === 'star') el.textContent = '★';
  else if (shape === 'shell') el.textContent = '🐚';
  el.style.setProperty('--c', color);
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  fxLayer.appendChild(el);

  // simple physics: launch, gravity, air drag, flutter
  const g = 1500;
  const T = 2.6 + Math.random() * 1.4;
  const spin = (Math.random() * 2 - 1) * 900;
  const sway = 30 + Math.random() * 40;
  const frames = [];
  for (let k = 0; k <= 16; k++) {
    const t = (k / 16) * T;
    const drag = 1 - Math.exp(-t * 1.6);
    const px = (vx / 1.6) * drag + Math.sin(t * 6) * sway * (t / T);
    const py = (vy / 1.6) * drag + 0.5 * g * t * t * 0.45;
    frames.push({
      transform: `translate(${px}px, ${py}px) rotate(${spin * t}deg) rotateX(${t * 540}deg)`,
      opacity: k > 13 ? (16 - k) / 3 : 1,
    });
  }
  el.animate(frames, { duration: T * 1000, delay, easing: 'linear', fill: 'both' }).onfinish = () => el.remove();
}

// Sea-themed confetti (GSAP): a gentle, light shower of tiny sea things that
// drift down and sway like they're underwater. Falls back to the old burst
// if GSAP couldn't load (e.g. offline).
const SEA_COLORS = ['#7fd8ff', '#ffd25a', '#ff9fc8', '#9be8c8', '#c9a6ff', '#ffffff'];
const SEA_BITS = [
  { t: 'shell', w: 22 }, { t: 'star', w: 20 }, { t: 'fish', w: 26 },
  { t: 'bubble', w: 16 }, { t: 'bubble', w: 11 }, { t: 'flake', w: 12 }, { t: 'flake', w: 9 },
];
const SEA_SVG = {
  shell: (c) => `<svg viewBox="0 0 24 22"><path d="M12 21C6 21 1 17 1 10 1 6 4 2 8 1.5 10 1 11 1 12 1s2 0 4 .5C20 2 23 6 23 10c0 7-5 11-11 11z" fill="${c}"/><path d="M12 20V3M12 20 7 4M12 20l5-16M12 20 3 9M12 20l9-11" stroke="rgba(0,0,0,.18)" stroke-width="1.1" fill="none"/></svg>`,
  star: (c) => `<svg viewBox="0 0 24 24"><path d="M12 1.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 8.7l7.1-.6z" fill="${c}" stroke="rgba(0,0,0,.12)" stroke-linejoin="round"/></svg>`,
  fish: (c) => `<svg viewBox="0 0 28 16"><path d="M2 8c4-6 12-7 17-3l6-4v14l-6-4C14 15 6 14 2 8z" fill="${c}"/><circle cx="7" cy="7" r="1.4" fill="#23305c"/></svg>`,
};

function seaPiece(x, delay) {
  const kind = SEA_BITS[Math.floor(Math.random() * SEA_BITS.length)];
  const color = SEA_COLORS[Math.floor(Math.random() * SEA_COLORS.length)];
  const el = document.createElement('i');
  el.className = `sea-bit sea-${kind.t}`;
  const size = kind.w * 1.5 * (0.8 + Math.random() * 0.5);
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  if (SEA_SVG[kind.t]) el.innerHTML = SEA_SVG[kind.t](color);
  else if (kind.t === 'flake') el.style.background = color;
  fxLayer.appendChild(el);

  const fall = 6 + Math.random() * 4;            // slow, underwater pace
  gsap.set(el, { x, y: -40, rotation: Math.random() * 360, opacity: 0 });
  const tl = gsap.timeline({ delay, onComplete: () => el.remove() });
  tl.to(el, { opacity: kind.t === 'bubble' ? 0.75 : 0.9, duration: 0.6 }, 0)
    .to(el, { y: 1120, duration: fall, ease: 'none' }, 0)
    .to(el, { opacity: 0, duration: 1 }, fall - 1);
  // gentle side-to-side sway + slow tumble
  gsap.to(el, { x: `+=${40 + Math.random() * 50}`, duration: 1.4 + Math.random(), ease: 'sine.inOut', yoyo: true, repeat: Math.ceil(fall / 1.4), delay });
  if (kind.t !== 'bubble') {
    gsap.to(el, { rotation: `+=${(Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 180)}`, duration: fall, ease: 'none', delay });
  }
}

function confettiBurst() {
  if (!window.gsap) { legacyConfettiBurst(); return; }
  const N = 46;                                   // subtle: a light shower, not a blizzard
  for (let i = 0; i < N; i++) seaPiece(40 + Math.random() * 1840, Math.random() * 1.6);
}

function legacyConfettiBurst() {
  for (let i = 0; i < 70; i++) {
    const ang = (-60 - Math.random() * 25) * (Math.PI / 180);
    const sp = 1500 + Math.random() * 900;
    confettiPiece(40, 1060, Math.cos(ang) * sp * 0.75, Math.sin(ang) * sp, Math.random() * 180);
    confettiPiece(1880, 1060, -Math.cos(ang) * sp * 0.75, Math.sin(ang) * sp, Math.random() * 180);
  }
  for (let i = 0; i < 50; i++) {
    confettiPiece(Math.random() * 1920, -40, (Math.random() * 2 - 1) * 200, 100 + Math.random() * 200, 300 + Math.random() * 900);
  }
}

// Gold stars that fly out from a point (correct answers)
function starBurst(x, y, n = 10) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('i');
    s.className = 'fx-star';
    s.textContent = '★';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.fontSize = `${26 + Math.random() * 30}px`;
    fxLayer.appendChild(s);
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const d = 110 + Math.random() * 90;
    s.animate([
      { transform: 'translate(-50%, -50%) scale(.2) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * d}px), calc(-50% + ${Math.sin(ang) * d}px)) scale(1) rotate(160deg)`, opacity: 1, offset: 0.65 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * d * 1.2}px), calc(-50% + ${Math.sin(ang) * d * 1.2 + 40}px)) scale(.4) rotate(220deg)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => s.remove();
  }
}

// Centre of an element in stage coordinates
function stageCenter(el) {
  const r = el.getBoundingClientRect();
  const st = stage.getBoundingClientRect();
  const k = st.width / 1920;
  return { x: (r.left - st.left + r.width / 2) / k, y: (r.top - st.top + r.height / 2) / k };
}

/* ---------------- Bubble pop wherever a child taps ---------------- */
stage.addEventListener('pointerdown', (e) => {
  const st = stage.getBoundingClientRect();
  const k = st.width / 1920;
  const x = (e.clientX - st.left) / k;
  const y = (e.clientY - st.top) / k;
  const ring = document.createElement('i');
  ring.className = 'tap-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  fxLayer.appendChild(ring);
  ring.addEventListener('animationend', () => ring.remove());
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('i');
    b.className = 'tap-bubble';
    const size = 8 + Math.random() * 12;
    b.style.width = b.style.height = `${size}px`;
    b.style.left = `${x + (Math.random() * 40 - 20)}px`;
    b.style.top = `${y}px`;
    b.style.animationDelay = `${i * 0.05}s`;
    fxLayer.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  }
}, true);

/* ---------------- Underwater light rays on every screen ---------------- */
document.querySelectorAll('.screen').forEach((scr) => {
  const rays = document.createElement('div');
  rays.className = 'light-rays';
  rays.setAttribute('aria-hidden', 'true');
  rays.innerHTML = '<i></i><i></i><i></i><i></i><i></i>';
  const bubblesEl = scr.querySelector('.bubbles');
  scr.insertBefore(rays, bubblesEl || null);
});
