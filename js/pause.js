/* =========================================================
   Pause the whole game while its tab/window is not active.
   Loaded before every other script, so all of the game's
   setTimeout / setInterval calls go through pausable timers:
   on pause they freeze with their remaining time, on resume
   they carry on from the same point. Animations and CSS
   transitions in progress are paused/resumed too.
   Audio is paused separately (pauseAllAudio in js/game.js),
   which calls GamePause.pause()/resume().
   ========================================================= */
(function () {
  const nativeSet = window.setTimeout.bind(window);
  const nativeClear = window.clearTimeout.bind(window);
  const now = () => performance.now();

  let paused = false;
  let nextId = 1;
  const timers = new Map(); // id → { fn, args, ms, interval, left, due, real }
  let frozenAnims = [];

  function run(t) {
    try {
      if (typeof t.fn === 'function') t.fn(...t.args);
      else (0, eval)(String(t.fn)); // setTimeout('code') — not used by the game, kept for safety
    } catch (e) {
      nativeSet(() => { throw e; }); // keep the error visible in the console
    }
  }
  function arm(t) {
    t.due = now() + t.left;
    t.real = nativeSet(() => {
      if (t.interval) { t.left = t.ms; arm(t); } else timers.delete(t.id);
      run(t);
    }, t.left);
  }
  function add(fn, ms, args, interval) {
    const id = nextId++;
    const delay = Math.max(0, Number(ms) || 0);
    const t = { id, fn, args, ms: interval ? Math.max(delay, 4) : delay, interval, left: interval ? Math.max(delay, 4) : delay };
    timers.set(id, t);
    if (!paused) arm(t);
    return id;
  }
  function clear(id) {
    const t = timers.get(id);
    if (!t) return;
    nativeClear(t.real);
    timers.delete(id);
  }

  window.setTimeout = (fn, ms, ...args) => add(fn, ms, args, false);
  window.setInterval = (fn, ms, ...args) => add(fn, ms, args, true);
  window.clearTimeout = clear;
  window.clearInterval = clear;

  window.GamePause = {
    get paused() { return paused; },
    pause() {
      if (paused) return;
      paused = true;
      const t0 = now();
      timers.forEach((t) => { nativeClear(t.real); t.left = Math.max(0, t.due - t0); });
      // animations + transitions that are moving right now (CSS and element.animate)
      frozenAnims = document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running') : [];
      frozenAnims.forEach((a) => { try { a.pause(); } catch (e) { /* finished meanwhile */ } });
    },
    resume() {
      if (!paused) return;
      paused = false;
      frozenAnims.forEach((a) => { try { a.play(); } catch (e) { /* removed meanwhile */ } });
      frozenAnims = [];
      timers.forEach(arm);
    },
  };
})();
