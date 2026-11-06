// Elementy interfejsu wspólne dla całej aplikacji: powiadomienia, konfetti, okno modalne, dźwięk.

export function toast(msg, { action, onAction, ms = 3200 } = {}) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  const text = document.createElement('span');
  text.textContent = msg;
  el.append(text);
  if (action) {
    const b = document.createElement('button');
    b.textContent = action;
    b.addEventListener('click', () => {
      onAction();
      el.remove();
    });
    el.append(b);
  }
  box.append(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, ms);
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#ef4444', '#14b8a6'];

export function confetti(n = 30) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'confetti';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = COLORS[i % COLORS.length];
    p.style.animationDelay = `${Math.random() * 0.3}s`;
    p.style.animationDuration = `${1 + Math.random() * 0.9}s`;
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--x', `${Math.random() * 160 - 80}px`);
    frag.append(p);
    setTimeout(() => p.remove(), 2400);
  }
  document.body.append(frag);
}

export function openModal(html) {
  const d = document.getElementById('modal');
  d.querySelector('.modal-body').innerHTML = html;
  if (!d.open) d.showModal();
}

export function closeModal() {
  document.getElementById('modal').close();
}

export function beep() {
  try {
    const ctx = new AudioContext();
    [660, 880, 1100].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.25;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.25);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* brak dźwięku to nie tragedia */
  }
}
