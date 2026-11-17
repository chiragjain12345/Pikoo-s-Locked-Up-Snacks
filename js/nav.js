/* =========================================================
   Back + Pause buttons (top-right of the game), and the
   "jump to a step" machinery they share with the test menu
   (js/debug-menu.js).

   Must load BEFORE js/game.js: it tracks the game's timers so
   that jumping to another step cancels anything still pending.
   ========================================================= */
(() => {
  /* ---------- Track game timers so a jump starts clean ---------- */
  const _setTimeout = window.setTimeout.bind(window);
  const _setInterval = window.setInterval.bind(window);
  const timeouts = new Set();
  const intervals = new Set();
  window.setTimeout = (fn, ms, ...args) => {
    const id = _setTimeout(() => {
      timeouts.delete(id);
      if (typeof fn === 'function') fn(...args);
    }, ms);
    timeouts.add(id);
    return id;
  };
  window.setInterval = (fn, ms, ...args) => {
    const id = _setInterval(fn, ms, ...args);
    intervals.add(id);
    return id;
  };
  const clearTimers = () => {
    timeouts.forEach((id) => clearTimeout(id));
    intervals.forEach((id) => clearInterval(id));
    timeouts.clear();
    intervals.clear();
  };

  /* ---------- Reset every screen to its starting state ---------- */
  function reset() {
    clearTimers();
    stopVoice();
    Idle.clear();
    const q = (s) => document.querySelector(s);
    const qa = (s) => document.querySelectorAll(s);

    q('#transition').classList.remove('open', 'close');
    q('.trans-bubbles').innerHTML = '';
    const zw = q('#zoom-wrap');
    zw.style.transition = 'none';
    zw.classList.remove('zooming');
    q('#cam-title').style.transition = 'none';
    q('#cam-title').classList.remove('focus');
    void zw.offsetWidth;
    zw.style.transition = '';
    q('#cam-title').style.transition = '';

    setRings([]);
    qa('.speech').forEach((b) => { b.classList.remove('show'); delete b.dataset.who; });
    qa('.ost').forEach((o) => o.classList.remove('show'));
    qa('.pulse').forEach((b) => b.classList.remove('pulse'));
    qa('.screen.page-out, .screen.scene-in').forEach((s) => s.classList.remove('page-out', 'scene-in'));
    q('#btn-start').classList.remove('btn-gone');
    q('#cover-start').style.pointerEvents = '';
    q('#next-title').classList.add('btn-gone');
    q('#next-story2').classList.add('btn-gone');
    q('#hint').classList.remove('show');
    q('#win').classList.remove('show');
    q('#screen-game').classList.remove('enter', 'vo-lock');
    q('#top-panel').classList.remove('slide-away');
    q('#pikoo-actor').classList.remove('in');
    q('#neeli-actor').getAnimations().forEach((a) => a.cancel());
    q('#btn-win-next').classList.add('btn-gone');
    resetShelf(1);
    if (typeof resetEnding === 'function') resetEnding();
    bulbsEl.classList.remove('all-lit');
    hideHand();
  }

  /* Game screen with the first `released` pins already in their sockets */
  function gameAt(released) {
    showScreen('screen-game', true);
    startGame(false);
    clearTimers(); // drop the how-to-play setup
    btnBegin.classList.add('hidden');
    state.phase = 'play';
    for (let i = 0; i < released; i++) {
      state.pins[i].style.visibility = 'hidden';
      const img = document.createElement('img');
      img.src = 'assets/images/pin.webp';
      img.className = 'socket-pin';
      img.alt = '';
      state.sockets[i].appendChild(img);
      state.sockets[i].classList.add('lit');
    }
    progressText.textContent = `${released} / 7 pins released`;
  }

  /* Lock 2 game screen with the first `cracked` codes already done */
  function lock2At(cracked) {
    showScreen('screen-game', true);
    startLock2(false);
    clearTimers();
    btnBegin.classList.add('hidden');
    L2.phase = 'play';
    for (let i = 0; i < cracked; i++) {
      const g = document.createElement('div');
      g.className = 'gem';
      state.sockets[i].appendChild(g);
      state.sockets[i].classList.add('lit');
    }
    progressText.textContent = `${cracked} / ${CODES.length} codes cracked`;
  }

  /* Lock 3 game screen with the first `lit` bulbs already lit */
  function lock3At(lit) {
    showScreen('screen-game', true);
    startLock3(false);
    clearTimers();
    btnBegin.classList.add('hidden');
    L3.phase = 'play';
    for (let i = 0; i < lit; i++) {
      bulbsEl.children[i].classList.add('lit');
      const g = document.createElement('div');
      g.className = 'gem gold';
      state.sockets[i].appendChild(g);
      state.sockets[i].classList.add('lit');
    }
    progressText.textContent = `${lit} / 7 shell-bulbs lit`;
  }

  /* ---------- The steps of the game, in order (Back goes one step back) ---------- */
  const STEPS = () => [
    { id: 'cover', go: () => { showScreen('screen-cover', true); } },
    { id: 'narrator', go: () => { showScreen('screen-title', true); btnStart.click(); } },
    { id: 'story1', go: () => goStory1() },
    { id: 'story2', go: () => goStory2() },
    ...LEVELS.map((L, i) => ({
      id: `level-${i + 1}`,
      go: i === 0 ? () => { showScreen('screen-game', true); startGame(true); } : () => { gameAt(i); loadLevel(i); },
    })),
    ...ROUNDS.map((rd, i) => ({
      id: `code-${i + 1}`,
      go: i === 0 ? () => { showScreen('screen-game', true); startLock2(true); } : () => { lock2At(rd.codes[0]); loadCode(i); },
    })),
    { id: 'l3-howto', go: () => { showScreen('screen-game', true); startLock3(true); } },
    ...BULBS.map((b, i) => ({ id: `bulb-${i + 1}`, go: () => { lock3At(i); loadBulb(i); } })),
    { id: 'reveal', go: () => goReveal() },
    { id: 'happy', go: () => goHappy() },
  ];
  // where Back goes from the scenes between steps
  const BACK_FROM = { shelf1: 'level-7', shelf2: `code-4` };

  let current = 'cover';
  // Record the step the game is on: wrap the functions that start each step
  function track() {
    const wrap = (name, idOf) => {
      const fn = window[name];
      if (typeof fn !== 'function') return;
      window[name] = function (...args) {
        current = idOf(...args);
        return fn.apply(this, args);
      };
    };
    wrap('goStory1', () => 'story1');
    wrap('goStory2', () => 'story2');
    wrap('loadLevel', (i) => `level-${i + 1}`);
    wrap('loadCode', (i) => `code-${i + 1}`);
    wrap('startLock3', () => 'l3-howto');
    wrap('loadBulb', (i) => `bulb-${i + 1}`);
    wrap('goShelf', (n = 1) => `shelf${n}`);
    wrap('goReveal', () => 'reveal');
    wrap('goHappy', () => 'happy');
    btnStart.addEventListener('click', () => { current = 'narrator'; });
  }

  function jump(id) {
    const step = STEPS().find((s) => s.id === id);
    if (!step) return;
    resume(true);
    reset();
    step.go();
    current = id;
  }

  function back() {
    const list = STEPS().map((s) => s.id);
    let i = list.indexOf(BACK_FROM[current] || current);
    if (BACK_FROM[current]) i += 1; // from a between-locks scene: back to the last question before it
    if (i <= 0) return;
    sfx('click');
    jump(list[i - 1]);
  }

  /* ---------- Pause ---------- */
  let paused = false;
  function pause() {
    if (paused) return;
    paused = true;
    window.MANUAL_PAUSE = true;
    pauseAllAudio();
    document.getElementById('pause-card').classList.add('show');
  }
  function resume(silent) {
    if (!paused) return;
    paused = false;
    window.MANUAL_PAUSE = false;
    document.getElementById('pause-card').classList.remove('show');
    resumeAllAudio();
    if (!silent) sfx('click');
  }

  window.Nav = { reset, gameAt, lock2At, lock3At, clearTimers, jump, back, pause, resume, get current() { return current; } };

  document.addEventListener('DOMContentLoaded', () => {
    track();
    const backBtn = document.getElementById('btn-back');
    const pauseBtn = document.getElementById('btn-pause');
    backBtn.addEventListener('click', (e) => { e.stopPropagation(); back(); });
    pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); pause(); });
    document.getElementById('btn-resume').addEventListener('click', (e) => { e.stopPropagation(); resume(); });
    // the buttons are not shown on the cover page
    const sync = () => {
      const onCover = document.getElementById('screen-cover').classList.contains('active');
      document.getElementById('stage').classList.toggle('on-cover', onCover);
    };
    new MutationObserver(sync).observe(document.getElementById('screen-cover'), { attributes: true, attributeFilter: ['class'] });
    sync();
  });
})();
