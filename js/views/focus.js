// 🍅 Focus — minutnik do pracy w skupieniu (Pomodoro), z dźwiękiem i konfetti na koniec.
import { getState, update } from '../store.js';
import { esc, uid, dateKey, fmtClock } from '../utils.js';
import { beep, confetti, toast } from '../ui.js';

const R = 96;
const C = 2 * Math.PI * R;
const PRESETS = [5, 15, 25, 45];

const T = { total: 25 * 60, remaining: 25 * 60, running: false, endAt: 0, taskId: null };
let timer = null;

export const isRunning = () => T.running;
export function presetTask(id) {
  T.taskId = id;
}

const fmt = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

function paint() {
  const time = document.getElementById('ring-time');
  const prog = document.getElementById('ring-prog');
  if (time) time.textContent = fmt(T.remaining);
  if (prog) prog.style.strokeDashoffset = String(C * (1 - T.remaining / T.total));
  if (T.running) document.title = `⏳ ${fmt(T.remaining)} · Focus`;
}

function tick() {
  if (!T.running) return;
  T.remaining = Math.max(0, Math.round((T.endAt - Date.now()) / 1000));
  if (T.remaining === 0) finish();
  else paint();
}

function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function finish() {
  stopTimer();
  T.running = false;
  const minutes = Math.round(T.total / 60);
  T.remaining = T.total;
  document.title = 'Ogarniacz · Focus';
  beep();
  confetti(60);
  toast(`🍅 Brawo! ${minutes} min skupienia. Teraz 5 min przerwy 💧`, { ms: 6000 });
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Ogarniacz 🍅', { body: `Koniec sesji (${minutes} min). Czas na przerwę!` });
  }
  update((s) => {
    s.focus.push({ id: uid(), date: dateKey(), at: Date.now(), minutes, taskId: T.taskId });
  });
}

export function render(s) {
  const today = dateKey();
  const sessions = s.focus.filter((f) => f.date === today);
  const mins = sessions.reduce((sum, f) => sum + f.minutes, 0);
  const tasks = s.tasks.filter((t) => !t.done).sort((a, b) => b.today - a.today);
  const titleOf = (id) => s.tasks.find((t) => t.id === id)?.title;

  return `
    <div class="focus-wrap">
      <section class="card focus-card" style="--c:#ef4444">
        <div class="presets">
          ${PRESETS.map((m) => `<button class="fchip ${T.total === m * 60 ? 'on' : ''}" style="--c:#ef4444" data-action="preset" data-v="${m}" ${T.running ? 'disabled' : ''}>${m} min</button>`).join('')}
        </div>
        <div class="ring">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <circle class="track" cx="110" cy="110" r="${R}"/>
            <circle class="prog" id="ring-prog" cx="110" cy="110" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0"/>
          </svg>
          <div class="ring-time" id="ring-time" role="timer">${fmt(T.remaining)}</div>
        </div>
        <select data-change="focusTask" aria-label="Nad czym pracujesz?">
          <option value="">🎯 Nad czym pracujesz? (opcjonalnie)</option>
          ${tasks.map((t) => `<option value="${t.id}" ${t.id === T.taskId ? 'selected' : ''}>${t.today ? '⭐ ' : ''}${esc(t.title)}</option>`).join('')}
        </select>
        <div class="row center">
          ${T.running
            ? `<button class="btn big" data-action="pause">⏸ Pauza</button>`
            : `<button class="btn big" data-action="start">▶ ${T.remaining < T.total ? 'Wznów' : 'Start'}</button>`}
          <button class="btn ghost" data-action="reset">↺ Reset</button>
        </div>
      </section>

      <section class="card" style="--c:#ef4444">
        <h3>🍅 Dziś: ${mins} min</h3>
        ${sessions.length
          ? `<ul class="sessions">${sessions.slice().reverse().map((f) => `
              <li><span class="muted">${f.at ? fmtClock(f.at) : ''}</span> <b>${f.minutes} min</b> ${titleOf(f.taskId) ? `· ${esc(titleOf(f.taskId))}` : ''}</li>`).join('')}</ul>`
          : `<p class="empty">Jeszcze żadnej sesji. Zacznij od 5 minut — to się liczy.</p>`}
        <h3>💡 Triki na start</h3>
        <ul class="tips">
          <li><b>Zasada 2 minut</b> — zacznij od najmniejszego możliwego kroku.</li>
          <li><b>Telefon w innym pokoju</b> 📵 — serio działa.</li>
          <li><b>Nie wiesz od czego?</b> Kliknij 🎲 „Co teraz?” u góry.</li>
          <li><b>Po sesji</b> — 5 min przerwy: woda, ruch, okno 💧</li>
        </ul>
      </section>
    </div>`;
}

export function mount() {
  paint();
}

const rerender = () => update(() => {}, { silent: false });

export const actions = {
  preset(el) {
    T.total = Number(el.dataset.v) * 60;
    T.remaining = T.total;
    rerender();
  },
  start() {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    T.running = true;
    T.endAt = Date.now() + T.remaining * 1000;
    stopTimer();
    timer = setInterval(tick, 500);
    rerender();
  },
  pause() {
    tick();
    T.running = false;
    stopTimer();
    document.title = 'Ogarniacz · Focus';
    rerender();
  },
  reset() {
    T.running = false;
    stopTimer();
    T.remaining = T.total;
    document.title = 'Ogarniacz · Focus';
    rerender();
  },
  focusTask(el) {
    T.taskId = el.value || null;
  },
};

// Gdy zadanie z sesji zostanie usunięte, nie trzymamy martwego odwołania.
export function unmount() {
  if (T.taskId && !getState().tasks.some((t) => t.id === T.taskId)) T.taskId = null;
}
