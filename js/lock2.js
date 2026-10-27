/* =========================================================
   Lock 1 complete → shelf (lock 1 opens) → zoom into lock 2
   → Lock 2: The Code (make the BIGGEST / SMALLEST number)
   Uses helpers from js/game.js (setInstruction, sfx, speak, Idle, …).
   ========================================================= */

/* ---------------- Content (from the requirement sheet) ---------------- */
// Shelf scene after each lock: Neeli speaks while the lock opens, then Pikoo swims in from the right
const SHELF = {
  1: {
    bg: 'assets/images/screen3_story_bg_lock1_open.png',
    sprite: 'assets/images/lock_sprite.png',
    neeli: { id: 'l1_done_neeli', who: 'Neeli', text: 'Bravo!! One lock down.', voiceOnly: true, at: { left: 133, top: 364, width: 560 } },
    pikoo: { id: 'l1_done_pikoo', who: 'Pikoo', text: 'Yayy!! Two more to go!', voiceOnly: true, flip: false, at: { left: 1395, top: 468, width: 440 } },
  },
  2: {
    bg: 'assets/images/screen3_story_bg_lock2_open.png',
    sprite: 'assets/images/lock2_sprite.png',
    neeli: { id: 'l2_done_neeli', who: 'Neeli', text: 'Biggest and smallest, all numbers correctly made - one lock left.', voiceOnly: true, at: { left: 133, top: 364, width: 560 } },
    pikoo: { id: 'l2_done_pikoo', who: 'Pikoo', text: 'Whoever locked this really cares about snacks, huh...', voiceOnly: true, flip: false, shifty: true, at: { left: 1395, top: 448, width: 470 } },
  },
};

// Speak a line and resolve when the voice ends (or after a fallback time)
function sayLine(l) {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const said = l.vo || l.text; // `vo` = what is spoken when it differs from the bubble text
    speak(l.id, l.who, said, null, () => setTimeout(finish, 300));
    setTimeout(finish, Sound.on ? 1500 + said.length * 95 : 900 + said.length * 60);
  });
}

function showStoryBubble(bubble, l) {
  showBubble(bubble, l);
  if (l.flip === false) bubble.classList.remove('flip');
  else if (BUBBLES[l.who].flip) bubble.classList.add('flip');
}

const L2_HOWTO = [
  { id: 'l2_howto_pikoo', who: 'Pikoo', text: 'This lock wants BOTH... The BIGGEST!', voiceOnly: true },
  { id: 'l2_howto_neeli', who: 'Neeli', text: '...and the SMALLEST.', voiceOnly: true },
];

// One wording everywhere (panel + hint card)
const HINT_BIG = 'Put the biggest digit first, then the next biggest, and so on.';
const HINT_SMALL = 'Put the smallest digit first, then the next smallest, and so on.';
// 2nd wrong answer on a SMALLEST set that has a 0: ask about the length (4 → "four-digit", 6 → "six-digit")
const hintZero = (n) => `Check again. Is it a ${['', '', '', 'three', 'four', 'five', 'six'][n]}-digit number? Because if you put 0 first, it loses a digit.`;

const CODES = [
  { digits: [5, 2, 8, 1], goal: 'biggest', who: 'Pikoo', hint: HINT_BIG, fb: { who: 'Pikoo', text: 'Biggest number… good!' } },
  { digits: [5, 2, 8, 1], goal: 'smallest', who: 'Neeli', hint: HINT_SMALL, fb: { who: 'Neeli', text: 'And the smallest too. Proud of you!' } },
  { digits: [4, 0, 7, 3], goal: 'biggest', who: 'Pikoo', hint: HINT_BIG, fb: { who: 'Pikoo', text: 'Biggest again! Yayy!!' } },
  { digits: [4, 0, 7, 3], goal: 'smallest', who: 'Neeli', hint: hintZero(4), fb: { who: 'Neeli', text: "Smallest done - and you kept 0 out of the front, because a number can't start with 0." } },
  { digits: [6, 2, 9, 5, 1], goal: 'biggest', who: 'Pikoo', hint: HINT_BIG, fb: { who: 'Pikoo', text: 'Five digits on the shells - biggest number, done!' } },
  { digits: [6, 2, 9, 5, 1], goal: 'smallest', who: 'Neeli', hint: HINT_SMALL, fb: { who: 'Pikoo', text: 'Smallest done too, You are smart!' } },
  { digits: [7, 0, 4, 2, 9, 1], goal: 'biggest', master: true, who: 'Pikoo', hint: HINT_BIG, fb: { who: 'Neeli', text: 'A number in lakhs. Yayy… you made the biggest number.' } },
  { digits: [7, 0, 4, 2, 9, 1], goal: 'smallest', master: true, who: 'Neeli', hint: hintZero(6), fb: { who: 'Neeli', text: 'And now you made the smallest too… You did it.' } },
];

// Rounds: BIGGEST and SMALLEST of the same shells are solved together on one screen
// (codes are paired) — 8 codes in 4 rounds.
const ROUNDS = [{ codes: [0, 1] }, { codes: [2, 3] }, { codes: [4, 5] }, { codes: [6, 7] }];

// Correct answer: biggest = digits high→low; smallest = low→high, but 0 can't lead
function codeAnswer(c) {
  const d = [...c.digits].sort((a, b) => (c.goal === 'biggest' ? b - a : a - b));
  if (c.goal === 'smallest' && d[0] === 0) {
    const k = d.findIndex((x) => x !== 0);
    [d[0], d[k]] = [d[k], d[0]];
  }
  return d.join('');
}

// Indian grouping: 974210 → 9,74,210
function fmtIndian(str) {
  if (str.length <= 3) return str;
  let rest = str.slice(0, -3);
  const groups = [];
  while (rest.length > 2) { groups.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
  if (rest) groups.unshift(rest);
  return `${groups.join(',')},${str.slice(-3)}`;
}

function codeInstruction(c) {
  const what = c.goal === 'biggest' ? (c.master ? 'BIGGEST (MASTER)' : 'BIGGEST') : 'SMALLEST';
  return `Make the ${what} number from the digits on these shells: ${c.digits.join(', ')}. Drag them into the windows, then press Enter.`;
}

/* ---------------- Layout (stage coordinates) ---------------- */
const WIN_W = 96, WIN_H = 104, WIN_GAP = 14, COMMA_W = 20, WIN_TOP = 382, WIN_CENTER_X = 1030;
const SHELL_W = 128, SHELL_H = 113, TRAY_CENTER_X = 941, TRAY_TOP = 576, TRAY_H = 140;
const ENTER_X = 960, ENTER_TOP = 870; // centred just below the board (see .btn-enter)
const shellGap = (n) => (n >= 6 ? 16 : 28);

const L2 = { level: 0, attempts: 0, busy: true, phase: 'howto', slots: [], shells: [], windows: [] };
const windowsEl = $('#code-windows');
const shellsEl = $('#shells');
const trayEl = $('#shell-tray');
const tagEl = $('#code-tag');
const btnEnter = $('#btn-enter');

/* ---------------- Lock complete celebration ---------------- */
async function lockComplete(n) {
  // No "Lock n is open!" card — go straight to the lock opening on the cupboard
  // (that scene has its own confetti + applause).
  stopVoice();
  Idle.clear();
  await wait(600);
  if (n < 3) goShelf(n);
  else goReveal();
}

// (old celebration card, no longer used)
async function lockCompleteCard(n) {
  const win = $('#win');
  const btn = $('#btn-win-next');
  const linesEl = $('#win-lines');
  $('#win-title').textContent = `Lock ${n} is open!`;
  $('#win-sub').textContent = ['7 / 7 pins released', '8 / 8 codes cracked', '7 / 7 shell-bulbs lit'][n - 1];
  linesEl.innerHTML = '';
  btn.classList.add('btn-gone');
  btn.onclick = null;

  throwConfetti();
  win.classList.add('show');
  sfx('clap');
  sfx('win');
  [400, 700, 1000].forEach((d) => setTimeout(() => sfx('star'), d));

  const lines = [];
  await wait(1100);
  for (const l of lines) {
    const row = document.createElement('div');
    row.className = `win-line ${l.who === 'Pikoo' ? 'pikoo' : ''}`;
    const img = l.who === 'Pikoo' ? 'assets/images/char_pikoo.png' : 'assets/images/char_neeli.png';
    row.innerHTML = `<img src="${img}" alt="${l.who}" /><span>${l.text}</span>`;
    linesEl.appendChild(row);
    speak(l.id, l.who, l.text);
    await wait(2300);
  }

  btn.innerHTML = ['On to the second lock &rsaquo;', 'On to the last lock &rsaquo;', 'Open the cupboard &rsaquo;'][n - 1];
  btn.classList.remove('btn-gone');
  pulseUntilClicked(btn);
  btn.onclick = () => {
    sfx('click');
    btn.classList.remove('pulse');
    btn.onclick = null;
    Idle.clear();
    if (n < 3) {
      goShelf(n);
    } else {
      goReveal(); // all locks open — who did it? (js/ending.js)
    }
  };
}

/* ---------------- Shelf: lock n opens, zoom into lock n+1 ---------------- */
function resetShelf(n = 1) {
  const cfg = SHELF[n];
  const y = LOCK_Y[n - 1];
  $('#shelf-bg').style.backgroundImage = `url(${cfg.bg})`;
  const lk = $('#lock1-sprite');
  lk.className = 'lock1-sprite';
  lk.style.top = `${y - 73}px`;
  lk.querySelectorAll('div').forEach((d) => { d.style.backgroundImage = `url(${cfg.sprite})`; });
  const ring = $('#ring-next');
  ring.classList.remove('show');
  ring.style.top = `${LOCK_Y[n]}px`;
  $('span', ring).textContent = n + 1;
  $('#pikoo-shelf').classList.remove('in', 'shifty');
  $('#speech-shelf-neeli').classList.remove('show');
  $('#speech-shelf-pikoo').classList.remove('show');
  const zw = $('#zoom-wrap-shelf');
  zw.style.transition = 'none';
  zw.classList.remove('zooming');
  // zoom target = the next lock (shifted to the screen centre)
  zw.style.transformOrigin = `1068px ${LOCK_Y[n]}px`;
  zw.style.setProperty('--zoom-ty', `${540 - LOCK_Y[n]}px`);
  void zw.offsetWidth;
  zw.style.transition = '';
}

async function goShelf(n = 1) {
  const cfg = SHELF[n];
  const y = LOCK_Y[n - 1];
  stopVoice();
  await irisTransition(() => {
    $('#win').classList.remove('show');
    resetShelf(n);
    showScreen('screen-shelf', true);
  });
  await wait(300);

  // Neeli speaks while the lock glows, shakes, pops open and drops away
  const neeliBubble = $('#speech-shelf-neeli');
  if (!cfg.neeli.voiceOnly) showStoryBubble(neeliBubble, cfg.neeli); // voiceOnly: spoken, no bubble
  const neeliSaid = sayLine(cfg.neeli);
  const lk = $('#lock1-sprite');
  lk.classList.add('glow');
  sfx('sparkle');
  await wait(700);
  lk.classList.add('shake');
  await wait(650);
  lk.classList.remove('shake');
  lk.classList.add('open');
  sfx('unlock');
  sparkles(1068, y - 50, 16, 130);
  await wait(800);
  lk.classList.add('fall');
  sfx('whoosh');
  await wait(700);
  // Lock is open: confetti + applause
  confettiBurst();
  sfx('clap');
  sfx('win');
  await wait(300);
  await neeliSaid;

  // Pikoo swims in from the right, then says her line
  neeliBubble.classList.remove('show');
  const pk = $('#pikoo-shelf');
  pk.classList.add('in');
  sfx('swim');
  await wait(3000);
  if (cfg.pikoo.shifty) pk.classList.add('shifty');
  const pikooBubble = $('#speech-shelf-pikoo');
  if (!cfg.pikoo.voiceOnly) showStoryBubble(pikooBubble, cfg.pikoo); // voiceOnly: spoken, no bubble
  await sayLine(cfg.pikoo);
  await wait(300);
  pikooBubble.classList.remove('show');
  pk.classList.remove('shifty');
  await wait(300);

  // Next lock lights up, then the camera zooms in on it
  $('#ring-next').classList.add('show');
  sfx('sparkle');
  sparkles(1068, LOCK_Y[n], 18, 160);
  await wait(1000);
  const zw = $('#zoom-wrap-shelf');
  sfx('whoosh');
  zw.classList.add('zooming');
  await wait(1450);

  await irisTransition(() => {
    showScreen('screen-game', true);
    if (n === 1) startLock2(true);
    else startLock3(true); // js/lock3.js
  });
}

/* ---------------- Lock 2 game ---------------- */
const tagEl2 = $('#code-tag2');
function roundCodes(i) { return ROUNDS[i].codes.map((k) => CODES[k]); }

function startLock2(withEntrance) {
  setMode(2);
  Object.assign(L2, { level: 0, attempts: 0, busy: true, phase: 'howto', slots: [], shells: [], windows: [], rows: [] });
  pinsEl.innerHTML = '';
  [choiceA, choiceB].forEach((c) => { c.className = 'choice hidden'; });
  buildSockets(CODES.length);
  progressText.textContent = `0 / ${CODES.length} codes cracked`;
  hideHand();
  $('#win').classList.remove('show');
  board.classList.remove('unlocked', 'shine');
  shellsEl.innerHTML = '';
  trayEl.style.display = 'none';
  layoutRound(0);
  btnEnter.classList.add('btn-gone');

  if (withEntrance) {
    game.classList.remove('enter');
    void game.offsetWidth;
    game.classList.add('enter');
    setTimeout(() => game.classList.remove('enter'), 1600);
  }

  btnBegin.classList.add('hidden');
  setTimeout(() => {
    L2.phase = 'play';
    loadCode(0, L2_HOWTO);
  }, withEntrance ? 1000 : 300);
}

function lock2Begin() {
  L2.phase = 'play';
  loadCode(0);
}

function setTag(el, c) {
  el.textContent = c.goal === 'biggest' ? 'BIGGEST' : 'SMALLEST';
  el.classList.toggle('smallest', c.goal === 'smallest');
  el.classList.remove('swap');
  void el.offsetWidth;
  el.classList.add('swap');
}

// Geometry for a round: one row (master code) or two rows (BIGGEST + SMALLEST)
function geom(dual, n = 4) {
  // the tray holds n shells per row; 6-digit pairs (12 shells) use smaller shells
  const big = n >= 6;
  return dual
    ? { rowsY: [418, 554], tagsY: [470, 606], shellW: 100, shellH: 88, trayTop: 693, trayH: 96, gap: 22 }
    : { rowsY: [384], tagsY: [439], shellW: SHELL_W, shellH: SHELL_H, trayTop: TRAY_TOP, trayH: TRAY_H, gap: null };
}

function layoutRound(i) {
  const codes = roundCodes(i);
  const dual = codes.length === 2;
  game.classList.toggle('l2-dual', dual);
  const g = geom(dual, codes[0].digits.length);
  L2.g = g;
  setTag(tagEl, codes[0]);
  const panelTop = 401;
  tagEl.style.top = `${g.tagsY[0] - panelTop}px`;
  tagEl2.style.display = dual ? '' : 'none';
  if (dual) { setTag(tagEl2, codes[1]); tagEl2.style.top = `${g.tagsY[1] - panelTop}px`; }
  windowsEl.innerHTML = '';
  L2.windows = [];
  L2.rows = codes.map((c, r) => {
    const n = c.digits.length;
    const commaAfter = (k) => [3, 5].includes(n - 1 - k);
    const commas = c.digits.filter((_, k) => k < n - 1 && commaAfter(k)).length;
    const total = n * WIN_W + (n - 1) * WIN_GAP + commas * COMMA_W;
    let x = WIN_CENTER_X - total / 2;
    const y = g.rowsY[r];
    const idx = [];
    for (let k = 0; k < n; k++) {
      const w = document.createElement('div');
      w.className = 'code-window';
      w.style.left = `${x}px`;
      w.style.top = `${y}px`;
      w.style.animationDelay = `${(r * n + k) * 0.05}s`;
      windowsEl.appendChild(w);
      idx.push(L2.windows.length);
      L2.windows.push({ el: w, x, y, row: r });
      x += WIN_W;
      if (k < n - 1) {
        if (commaAfter(k)) {
          const cm = document.createElement('div');
          cm.className = 'code-comma';
          cm.textContent = ',';
          cm.style.left = `${x + (WIN_GAP + COMMA_W) / 2 - 10}px`;
          cm.style.top = `${y + 46}px`;
          windowsEl.appendChild(cm);
          x += WIN_GAP + COMMA_W;
        } else x += WIN_GAP;
      }
    }
    return { code: c, idx };
  });
  L2.slots = new Array(L2.windows.length).fill(null);
  // The second row waits for the first: a padlock sits on it (and on its tag) until BIGGEST is done
  if (dual) {
    const lk = document.createElement('div');
    lk.className = 'row-lock';
    lk.textContent = '🔒';
    lk.style.left = `${WIN_CENTER_X}px`;
    lk.style.top = `${g.rowsY[1] + WIN_H / 2}px`;
    windowsEl.appendChild(lk);
  }
}

function buildShells(i) {
  const codes = roundCodes(i);
  const g = L2.g;
  // ONE set of digit shells: first used for BIGGEST, then they come back for SMALLEST
  const digits = codes[0].digits;
  const n = digits.length;
  // the shell row is centred under the code windows
  const winCols = L2.rows[0].idx.map((w) => L2.windows[w].x + WIN_W / 2);
  // evenly spaced, spanning exactly from the first window to the last one
  const step = n > 1 ? (winCols[n - 1] - winCols[0]) / (n - 1) : 0;
  const cols = winCols.map((_, k) => winCols[0] + k * step);
  const left = cols[0] - g.shellW / 2;
  const right = cols[n - 1] + g.shellW / 2;
  trayEl.style.display = '';
  trayEl.style.left = `${left - 22}px`;
  trayEl.style.width = `${right - left + 44}px`;
  trayEl.style.top = `${g.trayTop}px`;
  trayEl.style.height = `${g.trayH}px`;
  L2.shells = digits.map((d, k) => {
    const el = document.createElement('div');
    el.className = 'shell enter';
    el.style.width = `${g.shellW}px`;
    el.style.height = `${g.shellH}px`;
    el.innerHTML = `<img src="assets/images/shell_tile.png" alt="" /><span class="shell-digit">${d}</span>`;
    el.style.animationDelay = `${0.15 + k * 0.06}s`;
    const x = cols[k] - g.shellW / 2;
    const home = { x, y: g.trayTop + (g.trayH - g.shellH) / 2 };
    const sh = { el, d, home, slot: null };
    moveShell(sh);
    shellsEl.appendChild(el);
    el.addEventListener('animationend', () => el.classList.remove('enter'), { once: true });
    bindDrag(sh);
    return sh;
  });
}

function moveShell(sh) {
  const g = L2.g;
  if (sh.slot === null) {
    sh.el.style.left = `${sh.home.x}px`;
    sh.el.style.top = `${sh.home.y}px`;
    sh.el.classList.remove('in-slot');
  } else {
    const w = L2.windows[sh.slot];
    sh.el.style.left = `${w.x + WIN_W / 2 - g.shellW / 2}px`;
    sh.el.style.top = `${w.y + WIN_H / 2 - g.shellH / 2 + 4}px`;
    sh.el.classList.add('in-slot');
  }
}

function setSlot(sh, idx) {
  if (sh.slot !== null && L2.slots[sh.slot] === sh) L2.slots[sh.slot] = null;
  sh.slot = idx;
  if (idx !== null) L2.slots[idx] = sh;
  moveShell(sh);
}

const activeRow = () => L2.rows[L2.active || 0];
function refreshWindows() {
  L2.windows.forEach((w, i) => {
    w.el.classList.toggle('filled', !!L2.slots[i]);
    w.el.classList.toggle('inactive', w.row > (L2.active || 0));   // rows still to come are dimmed
  });
  const waiting = (L2.active || 0) < 1;
  const lk = windowsEl.querySelector('.row-lock');
  if (lk && !waiting && !lk.classList.contains('open')) { lk.textContent = '🔓'; lk.classList.add('open'); }
  tagEl2.classList.toggle('waiting', waiting && L2.rows && L2.rows.length > 1);
  const row = activeRow();
  btnEnter.classList.toggle('disabled', !row || row.idx.some((w) => !L2.slots[w]));
}

// Put `sh` into window `target` (or back to the tray when null); a shell already in that window returns to the tray
function placeShell(sh, target) {
  if (target === null) {
    setSlot(sh, null);
  } else {
    const occ = L2.slots[target];
    if (occ && occ !== sh) {
      L2.slots[target] = null;
      setSlot(occ, null);
    }
    setSlot(sh, target);
  }
  sfx('land');
  refreshWindows();
}

function nearestWindow(pt) {
  let best = null;
  let bestD = 90;
  L2.windows.forEach((w, i) => {
    if (w.row !== (L2.active || 0)) return; // only the row being built accepts shells
    const d = Math.hypot(pt.x - (w.x + WIN_W / 2), pt.y - (w.y + WIN_H / 2));
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

function toStage(e) {
  const r = stage.getBoundingClientRect();
  const k = r.width / 1920;
  return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
}

function bindDrag(sh) {
  const el = sh.el;
  let start = null;
  let origin = null;
  let moved = false;

  el.addEventListener('pointerdown', (e) => {
    if (L2.busy || L2.phase !== 'play') return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    L2.shells.forEach((s) => s.el.classList.remove('idle'));
    start = toStage(e);
    origin = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
    moved = false;
  });

  el.addEventListener('pointermove', (e) => {
    if (!start) return;
    const p = toStage(e);
    const dx = p.x - start.x;
    const dy = p.y - start.y;
    if (!moved && Math.hypot(dx, dy) < 8) return;
    if (!moved) { moved = true; el.classList.add('dragging'); sfx('pick'); }
    el.style.left = `${origin.x + dx}px`;
    el.style.top = `${origin.y + dy}px`;
    const hot = nearestWindow({ x: origin.x + dx + L2.g.shellW / 2, y: origin.y + dy + L2.g.shellH / 2 });
    L2.windows.forEach((w, i) => w.el.classList.toggle('hot', i === hot));
  });

  const end = (e) => {
    if (!start) return;
    const p = toStage(e);
    const center = { x: origin.x + (p.x - start.x) + L2.g.shellW / 2, y: origin.y + (p.y - start.y) + L2.g.shellH / 2 };
    start = null;
    el.classList.remove('dragging');
    L2.windows.forEach((w) => w.el.classList.remove('hot'));
    if (!moved) {
      el.animate(
        [{ rotate: '0deg' }, { rotate: '-10deg' }, { rotate: '8deg' }, { rotate: '-4deg' }, { rotate: '0deg' }],
        { duration: 450, easing: 'ease-in-out' }
      );
      sfx('pick');
      return;
    }
    placeShell(sh, nearestWindow(center));
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function roundInstruction(i) {
  const codes = roundCodes(i);
  if (codes.length === 1) return codeInstruction(codes[0]);
  const ask = `Make the BIGGEST and the SMALLEST ${codes[0].digits.length}-digit number from the digits on these shells: ${codes[0].digits.join(', ')}.`;
  return ask; // stops at the digits (no repeated drag/Enter how-to)
}

function loadCode(i, intro) {
  L2.level = i;
  L2.attempts = 0;
  L2.active = 0;
  L2.busy = true;
  hideHand();

  shellsEl.querySelectorAll('.shell.frozen').forEach((f) => { f.classList.add('leave'); setTimeout(() => f.remove(), 500); });
  L2.shells.forEach((s) => {
    s.el.classList.add('leave');
    setTimeout(() => s.el.remove(), 500);
  });
  L2.windows.forEach((w) => w.el.classList.remove('right', 'wrong'));
  setTimeout(() => {
    layoutRound(i);
    L2.active = 0;
    buildShells(i);
    btnEnter.classList.remove('btn-gone');
    refreshWindows();
    L2.busy = false;
    armIdle2();
  }, L2.shells.length ? 450 : 0);

  const line = { who: 'Neeli', text: roundInstruction(i) };
  setQuestion(line, `l2_round${i + 1}`);
  if (intro) playIntro(intro, line, `l2_round${i + 1}`);
  else setInstruction(line, `l2_round${i + 1}`);
}

function armIdle2(ms = IDLE_MS) {
  Idle.arm(ms, () => {
    if (L2.busy || L2.phase !== 'play') return;
    showNudge(IDLE_DRAG);
    L2.shells.forEach((s) => { if (s.slot === null) s.el.classList.add('idle'); });
    armIdle2(IDLE_REPEAT_MS);
  });
}

const rowBuilt = (row) => row.idx.map((w) => L2.slots[w] && L2.slots[w].d).join('');
const rowRight = (row) => rowBuilt(row) === codeAnswer(row.code);

btnEnter.addEventListener('click', () => {
  if (L2.busy || L2.phase !== 'play') return;
  sfx('click');
  hideHand();
  const row = activeRow();
  if (row.idx.some((w) => !L2.slots[w])) {
    row.idx.forEach((w) => {
      if (L2.slots[w]) return;
      L2.windows[w].el.classList.add('hot');
      setTimeout(() => L2.windows[w].el.classList.remove('hot'), 700);
    });
    return;
  }
  if (!rowRight(row)) { lock2Wrong(); return; }
  if (L2.active < L2.rows.length - 1) nextRow();
  else codeRight();
});

// BIGGEST is right: its digits stay shown in the windows, the shells swim back to the tray for SMALLEST
async function nextRow() {
  const row = activeRow();
  L2.busy = true;
  Idle.clear();
  row.idx.forEach((w) => L2.windows[w].el.classList.add('right'));
  sfx('correct');
  starBurst(WIN_CENTER_X, L2.g.rowsY[L2.active] + WIN_H / 2, 12);
  const fb = sayFeedback(row.code.fb, `l2_round${L2.level + 1}_big_ok`);
  await wait(900);
  row.idx.forEach((w) => {
    const sh = L2.slots[w];
    const frozen = sh.el.cloneNode(true);
    frozen.classList.add('frozen');
    frozen.classList.remove('dragging', 'idle');
    shellsEl.appendChild(frozen);
    L2.slots[w] = { d: sh.d, frozen: true };
    sh.slot = null;
    moveShell(sh);
  });
  sfx('whoosh');
  L2.active++;
  L2.attempts = 0;
  refreshWindows();
  await fb;
  L2.busy = false;
  armIdle2();
}

async function codeRight() {
  const i = L2.level;
  L2.busy = true;
  Idle.clear();
  L2.windows.forEach((w) => w.el.classList.add('right'));
  sfx('correct');
  starBurst(WIN_CENTER_X, L2.g.rowsY[0] + WIN_H / 2, 14);
  sparkles(WIN_CENTER_X, L2.g.rowsY[L2.g.rowsY.length - 1] + WIN_H / 2, 22, 260);
  const codes = roundCodes(i);
  const fbDone = sayFeedback(codes[codes.length - 1].fb, `l2_round${i + 1}_correct`);

  ROUNDS[i].codes.forEach((k) => {
    const socket = state.sockets[k];
    const gem = document.createElement('div');
    gem.className = 'gem';
    socket.appendChild(gem);
    socket.classList.add('lit');
  });
  const done = ROUNDS[i].codes[ROUNDS[i].codes.length - 1] + 1;
  progressText.textContent = `${done} / ${CODES.length} codes cracked`;
  progressText.classList.remove('bump');
  void progressText.offsetWidth;
  progressText.classList.add('bump');
  sfx('land');

  await Promise.all([fbDone, wait(2000)]);
  if (i < ROUNDS.length - 1) loadCode(i + 1);
  else finale2();
}

function lock2Wrong() {
  L2.attempts++;
  sfx('wrong');
  const bad = [activeRow()];
  bad[0].idx.forEach((w) => {
    const el = L2.windows[w].el;
    el.classList.remove('wrong');
    void el.offsetWidth;
    el.classList.add('wrong');
    setTimeout(() => el.classList.remove('wrong'), 700);
  });
  const c = bad[0].code;

  if (L2.attempts === 1) {
    setInstruction({ who: 'Neeli', text: `Oops! Check the ${c.goal.toUpperCase()} number again.`, voiceOnly: true, restore: true }, WRONG_1.id);
  } else if (L2.attempts === 2) {
    const hintVo = c.goal === 'biggest' ? 'l2_hint_big'
      : c.digits.includes(0) ? (c.digits.length === 4 ? 'l2_hint_zero4' : 'l2_hint_zero') // "Check again. Is it a four-digit number?…"
      : 'l2_hint_small';
    setInstruction({ who: 'Neeli', text: c.hint }, hintVo);
    L2.busy = true;
    setTimeout(() => openHint2(c), 800);
  } else {
    const parts = bad.map((r) => `${r.code.goal.toUpperCase()}: ${fmtIndian(codeAnswer(r.code))}`);
    setInstruction({ who: 'Neeli', text: `Set it like this - ${parts.join(', ')}. Then press Enter.`, voiceOnly: true, restore: true }, 'l2_hand');
    autoArrange(bad);
  }
  armIdle2();
}

// Attempt 3: the shells of the wrong row(s) slide into the right order, then the hand points at Enter
function autoArrange(rows = L2.rows) {
  L2.busy = true;
  let t = 250;
  rows.forEach((row) => {
    row.idx.forEach((w) => { const sh = L2.slots[w]; if (sh) { sh.slot = null; L2.slots[w] = null; moveShell(sh); } });
  });
  rows.forEach((row) => {
    const ans = codeAnswer(row.code);
    [...ans].forEach((ch, j) => {
      const w = row.idx[j];
      setTimeout(() => {
        const sh = L2.shells.find((s) => s.slot === null && String(s.d) === ch);
        if (!sh) return;
        sh.slot = w;
        L2.slots[w] = sh;
        moveShell(sh);
        sfx('land');
        refreshWindows();
      }, t);
      t += 200;
    });
  });
  setTimeout(() => {
    L2.busy = false;
    handEl.style.left = `${ENTER_X + 40}px`;
    handEl.style.top = `${ENTER_TOP + 40}px`;
    handEl.classList.add('show');
  }, t + 200);
}

function openHint2(c = (L2.rows[0] || {}).code || CODES[0]) {
  // Hint card (sheet): only the title + verdict are on screen; the hint itself is already in the panel
  $('.hint-line').textContent = '';
  $('.hint-line').style.display = 'none';
  const rows = $('#hint-rows');
  rows.innerHTML = '';
  const towers = document.createElement('div');
  towers.className = 'towers';
  c.digits.forEach((d, k) => {
    const t = document.createElement('div');
    t.className = 'tower';
    t.style.height = `${48 + d * 20}px`;
    t.style.animationDelay = `${0.25 + k * 0.12}s`;
    t.textContent = d;
    towers.appendChild(t);
  });
  rows.appendChild(towers);
  $('#hint-verdict').textContent = `${c.goal.toUpperCase()}: ${c.hint}`;
  $('#hint').classList.add('show');
  sfx('sparkle');
}

function lock2HintClosed() {
  L2.busy = false;
  armIdle2();
}

async function finale2() {
  L2.phase = 'done';
  await wait(300);
  board.classList.add('unlocked', 'shine');
  sfx('unlock');
  sfx('chime');
  sparkles(WIN_CENTER_X, 480, 26, 300);
  await wait(2400);
  lockComplete(2);
}
