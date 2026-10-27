/* =========================================================
   Lock 3: The Shell-Lights — tap the numbers in order
   (ascending / descending). Each finished set lights one of the
   7 shell-bulbs on the locker.
   Uses helpers from js/game.js and js/lock2.js.
   ========================================================= */

/* ---------------- Content (from the requirement sheet) ---------------- */
const L3_HOWTO = { id: 'l3_howto_neeli', who: 'Neeli', text: 'This locker has seven shell-shaped bulbs. Arrange each set of numbers in the given order and one shell-bulb lights up.', voiceOnly: true };
const HINT_ASC = 'Find the smallest number, and tap the one that is next.';
const HINT_DESC = 'Find the biggest number, and tap the one that is next.';
// Hint-card text (on screen); Neeli reads it in full, then the tip above
const HINT_CARD_ASC = 'If the numbers are of different lengths, the one with fewer digits is smaller. If the numbers are of the same length, compare from the left.';
const HINT_CARD_DESC = 'If the numbers are of different lengths, the one with more digits is bigger. If the numbers are of the same length, compare from the left.';

// `nums` are listed in the correct order; they're shown shuffled
const BULBS = [
  { order: 'asc', nums: ['30,450', '34,050', '43,578'], fb: { who: 'Pikoo', text: 'Small to big - first shell-bulb lights up! Bravo!!' } },
  { order: 'asc', nums: ['34,407', '40,347', '47,340', '74,430'], fb: { who: 'Neeli', text: 'Good job!' } },
  { order: 'asc', nums: ['89,900', '98,716', '1,00,050', '1,05,600'], fb: { who: 'Pikoo', text: 'And another shell-bulb glows!' } },
  { order: 'desc', nums: ['66,540', '65,900', '65,232', '56,380'], fb: { who: 'Neeli', text: 'Now biggest to the smallest - easy.' } },
  { order: 'desc', nums: ['1,42,000', '1,24,000', '1,20,400', '1,02,400'], fb: { who: 'Pikoo', text: 'The number in lakhs - in order!' } },
  { order: 'asc', nums: ['90,090', '99,999', '1,00,090', '1,00,900', '1,09,000'], fb: { who: 'Pikoo', text: 'Almost there - nearly all bulbs have lit up!' } },
  { order: 'desc', nums: ['1,45,978', '1,45,578', '1,45,562', '99,400', '94,050'], show: ['99,400', '1,45,562', '1,45,578', '1,45,978', '94,050'], fb: { who: 'Neeli', text: 'Last shell-bulb - they all glow now!' } },
];

function bulbInstruction(b) {
  return b.order === 'asc'
    ? 'Arrange the numbers in ascending order. Tap them in order.'
    : 'Arrange the numbers in descending order. Tap them in order.';
}

/* ---------------- Layout (stage coordinates) ---------------- */
const CARD_H = 80, ROW_CX = 938;              // centre of the board's beige panel
const HOLES_X = [517, 669, 819, 969, 1120, 1270, 1421], HOLE_Y = 442; // pin holes on the board
// Cards shrink a little for 5-number sets so the row fits the panel
let CARD_W = 216, CARD_GAP = 36;
function sizeRow(n) {
  CARD_W = n >= 5 ? 180 : 216;
  CARD_GAP = n >= 5 ? 28 : 36;
  game.classList.toggle('cards-small', n >= 5);
}
const SLOT_TOP = 630;   // slots sit in the middle of the beige panel, below the order tag
const CARD_TOP = 806;   // number cards sit just below the board, clear of the bottom panels
const CARD_ROW_H = 82;

const L3 = { level: 0, attempts: 0, busy: true, phase: 'howto', next: 0, cards: [], slots: [] };
const bulbsEl = $('#bulbs');
const slotsEl = $('#order-slots');
const cardsEl = $('#order-cards');
const orderTag = $('#order-tag');

function buildBulbs() {
  bulbsEl.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    // Each bulb is screwed into one of the board's pin holes
    const b = document.createElement('div');
    b.className = 'bulb';
    b.style.left = `${HOLES_X[i] - 48}px`;
    b.style.top = `${HOLE_Y - 100}px`; // brass cup sits over the hole
    b.innerHTML = '<img class="off" src="assets/images/shell_bulb_off.png?v=2" alt="" /><img class="on" src="assets/images/shell_bulb_on.png?v=2" alt="" />';
    bulbsEl.appendChild(b);
  }
}

function setOrderTag(b) {
  orderTag.innerHTML = b.order === 'asc'
    ? 'Ascending order <span>(smallest to biggest)</span>'
    : 'Descending order <span>(biggest to smallest)</span>';
  orderTag.classList.toggle('smallest', b.order === 'desc');
  orderTag.classList.remove('swap');
  void orderTag.offsetWidth;
  orderTag.classList.add('swap');
}

/* ---------------- Start / how to play ---------------- */
function startLock3(withEntrance) {
  l3TutRun++;
  game.classList.remove('l3-tutorial');
  setMode(3);
  Object.assign(L3, { level: 0, attempts: 0, busy: true, phase: 'howto', next: 0, cards: [], slots: [] });
  pinsEl.innerHTML = '';
  [choiceA, choiceB].forEach((c) => { c.className = 'choice hidden'; });
  buildSockets();
  buildBulbs();
  progressText.textContent = '0 / 7 shell-bulbs lit';
  hideHand();
  $('#win').classList.remove('show');
  board.classList.remove('unlocked', 'shine');
  slotsEl.innerHTML = '';
  cardsEl.innerHTML = '';
  $('#fly-note').classList.remove('fall');
  setOrderTag(BULBS[0]);

  if (withEntrance) {
    game.classList.remove('enter');
    void game.offsetWidth;
    game.classList.add('enter');
    setTimeout(() => game.classList.remove('enter'), 1600);
  }

  btnBegin.classList.add('hidden');
  // No Next button: the first numbers appear right away under the how-to line
  setTimeout(() => runL3Tutorial(), withEntrance ? 1000 : 300);
}

/* ---------------- Tutorial: Neeli shows how to play with a practice set ----------------
   A practice row (not one of the 7 bulbs) is solved step by step: the hand points at the
   smallest number left, taps it, and it slides into the next slot. No bulb lights up.
   Then the board clears and the child plays bulb 1. */
const L3_DEMO = { order: 'asc', nums: ['1,250', '2,150', '5,120'], show: ['5,120', '1,250', '2,150'] };
const L3_TUT = [
  { id: 'l3_tut_1', who: 'Neeli', text: "Let me show you how! These numbers go in ascending order - from the smallest to the biggest." },
  { id: 'l3_tut_2', who: 'Neeli', text: 'First, find the smallest number. 1,250 is the smallest - tap it!' },
  { id: 'l3_tut_3', who: 'Neeli', text: 'Next, the smallest number of the remaining ones: 2,150.' },
  { id: 'l3_tut_4', who: 'Neeli', text: 'And the biggest goes last: 5,120. All in order!' },
  { id: 'l3_tut_5', who: 'Neeli', text: "Now it's your turn. Each set you get right lights up a shell-bulb!" },
];
let l3TutRun = 0;

function sayStep(line) {
  return new Promise((res) => {
    let done = false;
    const fin = () => { if (!done) { done = true; setTimeout(res, 350); } };
    setInstruction(line, line.id, fin);
    setTimeout(fin, Sound.on ? 1600 + line.text.length * 80 : 900 + line.text.length * 45);
  });
}

function pointHandAt(el) {
  handEl.style.left = `${parseFloat(el.style.left) + CARD_W / 2 - 30}px`;
  handEl.style.top = `${parseFloat(el.style.top) + 30}px`;
  handEl.classList.add('show');
}

async function runL3Tutorial() {
  const run = ++l3TutRun;
  const alive = () => run === l3TutRun && currentLock === 3 && L3.phase === 'tutorial';
  L3.phase = 'tutorial';
  L3.busy = true;
  lockPlay(true);
  game.classList.add('l3-tutorial');
  buildRow(L3_DEMO);
  setOrderTag(L3_DEMO);
  showPanelText(''); // the intro is voice-only: don't leave lock 2's question in the panel
  await sayStep(L3_HOWTO); if (!alive()) return;
  await sayStep(L3_TUT[0]); if (!alive()) return;
  for (let k = 0; k < L3_DEMO.nums.length; k++) {
    const card = L3.cards.find((c) => c.num === L3_DEMO.nums[k]);
    const said = sayStep(L3_TUT[k + 1]);
    await wait(500); if (!alive()) return;
    pointHandAt(card.el);
    await wait(1300); if (!alive()) return;
    card.el.classList.add('tut-tap');
    sfx('click');
    await wait(250);
    hideHand();
    // slide into the next slot (practice only: no bulb, no progress)
    const slot = L3.slots[k];
    card.placed = true;
    card.el.classList.add('placed');
    card.el.style.left = `${slot.x}px`;
    card.el.style.top = `${SLOT_TOP}px`;
    card.el.style.height = `${CARD_H}px`;
    slot.el.classList.add('filled');
    sfx('land');
    sparkles(slot.x + CARD_W / 2, SLOT_TOP + CARD_H / 2, 8, 70);
    await said; if (!alive()) return;
  }
  L3.cards.forEach((c) => c.el.classList.add('right'));
  if (typeof setMood === 'function') setMood('happy', 2800); // js/avatar.js
  sfx('correct');
  await sayStep(L3_TUT[4]); if (!alive()) return;
  game.classList.remove('l3-tutorial');
  lockPlay(false);
  L3.phase = 'play';
  loadBulb(0);
}

// Called from the Next button in js/game.js
function lock3Begin() {
  L3.phase = 'play';
  loadBulb(0);
}

/* ---------------- One set of numbers ---------------- */
function rowLeft(n) {
  return ROW_CX - (n * CARD_W + (n - 1) * CARD_GAP) / 2;
}

// Shuffle so the cards never start out already in the right order
function shuffled(list) {
  let a;
  do {
    a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (a.every((v, i) => v === list[i]));
  return a;
}

function loadBulb(i, intro) {
  l3TutRun++;
  game.classList.remove('l3-tutorial');
  const b = BULBS[i];
  Object.assign(L3, { level: i, attempts: 0, busy: true, next: 0 });
  hideHand();

  const old = [...cardsEl.children, ...slotsEl.children];
  old.forEach((el) => el.classList.add('leave'));
  setTimeout(() => {
    old.forEach((el) => el.remove());
    buildRow(b);
    setOrderTag(b);
    L3.busy = false;
    armIdle3();
  }, old.length ? 450 : 0);

  const line = { who: 'Neeli', text: bulbInstruction(b) };
  const voId = b.order === 'asc' ? 'l3_instr_asc' : 'l3_instr_desc'; // one recording per order
  setQuestion(line, voId);
  if (intro) playIntro(intro, line, voId);
  else setInstruction(line, voId);
}

function buildRow(b) {
  const n = b.nums.length;
  sizeRow(n);
  const left = rowLeft(n);
  const sym = b.order === 'asc' ? '&lt;' : '&gt;';
  L3.slots = [];
  for (let k = 0; k < n; k++) {
    const x = left + k * (CARD_W + CARD_GAP);
    const s = document.createElement('div');
    s.className = 'order-slot';
    s.style.left = `${x}px`;
    s.style.top = `${SLOT_TOP}px`;
    s.style.animationDelay = `${k * 0.06}s`;
    s.innerHTML = `<span>${k + 1}</span>`;
    slotsEl.appendChild(s);
    L3.slots.push({ el: s, x });
    if (k < n - 1) {
      const c = document.createElement('div');
      c.className = 'order-sym';
      c.innerHTML = sym;
      c.style.left = `${x + CARD_W}px`;
      c.style.top = `${SLOT_TOP}px`;
      slotsEl.appendChild(c);
    }
  }
  // `show` = fixed on-screen order from the sheet; otherwise shuffle
  L3.cards = (b.show || shuffled(b.nums)).map((num, k) => {
    const el = document.createElement('button');
    el.className = 'order-card enter';
    el.innerHTML = `<img src="assets/images/number_card.png" alt="" /><span>${num}</span>`;
    el.style.left = `${left + k * (CARD_W + CARD_GAP)}px`;
    el.style.top = `${CARD_TOP}px`;
    el.style.height = `${CARD_ROW_H}px`;
    el.style.animationDelay = `${0.15 + k * 0.08}s`;
    el.addEventListener('animationend', () => el.classList.remove('enter'), { once: true });
    const card = { el, num, placed: false };
    el.addEventListener('click', () => onCardTap(card));
    cardsEl.appendChild(el);
    return card;
  });
}

function armIdle3(ms = IDLE_MS) {
  Idle.arm(ms, () => {
    if (L3.busy || L3.phase !== 'play') return;
    showNudge(IDLE);
    L3.cards.forEach((c) => { if (!c.placed) c.el.classList.add('idle'); });
    armIdle3(IDLE_REPEAT_MS);
  });
}

function onCardTap(card) {
  if (L3.busy || L3.phase !== 'play' || card.placed) return;
  L3.cards.forEach((c) => c.el.classList.remove('idle'));
  hideHand();
  const b = BULBS[L3.level];
  if (card.num === b.nums[L3.next]) placeCard(card);
  else wrongCard(card);
}

// Correct tap: the card slides up into the next slot
function placeCard(card) {
  const slot = L3.slots[L3.next];
  card.placed = true;
  card.el.classList.add('placed');
  card.el.style.left = `${slot.x}px`;
  card.el.style.top = `${SLOT_TOP}px`;
  card.el.style.height = `${CARD_H}px`;
  slot.el.classList.add('filled');
  sfx('land');
  sparkles(slot.x + CARD_W / 2, SLOT_TOP + CARD_H / 2, 8, 70);
  L3.next++;
  armIdle3();
  if (L3.next === BULBS[L3.level].nums.length) setDone();
}

function wrongCard(card) {
  L3.attempts++;
  sfx('wrong');
  card.el.classList.remove('wrong');
  void card.el.offsetWidth;
  card.el.classList.add('wrong');
  setTimeout(() => card.el.classList.remove('wrong'), 700);
  const b = BULBS[L3.level];

  if (L3.attempts === 1) {
    setInstruction(WRONG_1);
  } else if (L3.attempts === 2) {
    const asc = b.order === 'asc';
    setInstruction({ who: 'Neeli', text: `${asc ? HINT_CARD_ASC : HINT_CARD_DESC} ${asc ? HINT_ASC : HINT_DESC}`, voiceOnly: true, noCaption: true }, asc ? 'l3_hint_asc' : 'l3_hint_desc');
    L3.busy = true;
    setTimeout(openHint3, 800);
  } else {
    setInstruction({ who: 'Neeli', text: 'This one comes next.', voiceOnly: true, restore: true }, 'l3_hand');
    const target = L3.cards.find((c) => c.num === b.nums[L3.next]);
    handEl.style.left = `${parseFloat(target.el.style.left) + CARD_W / 2 - 30}px`;
    handEl.style.top = `${CARD_TOP + 30}px`;
    handEl.classList.add('show');
  }
  armIdle3();
}

/* Set finished: the cards glow and the next shell-bulb lights up */
async function setDone() {
  const i = L3.level;
  L3.busy = true;
  Idle.clear();
  await wait(650); // let the last card finish sliding in: feedback only once the whole row is arranged
  L3.cards.forEach((c) => c.el.classList.add('right'));
  if (typeof setMood === 'function') setMood('happy', 2800); // js/avatar.js
  sfx('correct');

  const bulb = bulbsEl.children[i];
  bulb.classList.add('lit');
  const r = bulb.getBoundingClientRect();
  const st = stage.getBoundingClientRect();
  const k = st.width / 1920;
  sparkles((r.left - st.left + r.width / 2) / k, (r.top - st.top + r.height / 2) / k, 16, 120);
  sfx('bulbon');
  starBurst((r.left - st.left + r.width / 2) / k, (r.top - st.top + r.height / 2) / k, 10);
  const fbDone = sayFeedback(BULBS[i].fb, `l3_bulb${i + 1}_correct`);

  const socket = state.sockets[i];
  const gem = document.createElement('div');
  gem.className = 'gem gold';
  socket.appendChild(gem);
  socket.classList.add('lit');
  progressText.textContent = `${i + 1} / 7 shell-bulbs lit`;
  progressText.classList.remove('bump');
  void progressText.offsetWidth;
  progressText.classList.add('bump');

  await Promise.all([fbDone, wait(2000)]);
  if (i < BULBS.length - 1) loadBulb(i + 1);
  else finale3();
}

/* ---------------- Hint: line the remaining numbers up by place value ---------------- */
function openHint3() {
  const b = BULBS[L3.level];
  $('.hint-line').style.display = '';
  $('.hint-line').textContent = b.order === 'asc' ? HINT_CARD_ASC : HINT_CARD_DESC;
  const rows = $('#hint-rows');
  rows.innerHTML = '';
  const left = L3.cards.filter((c) => !c.placed).map((c) => c.num.replace(/,/g, ''));
  const maxLen = Math.max(...left.map((d) => d.length));
  const rowEls = left.map((d) => {
    const row = document.createElement('div');
    row.className = 'hint-row';
    row.innerHTML = `<span class="label">${d.length} digits</span>`;
    for (let k = 0; k < maxLen - d.length; k++) row.insertAdjacentHTML('beforeend', '<span class="digit ghost"></span>');
    [...d].forEach((ch) => row.insertAdjacentHTML('beforeend', `<span class="digit">${ch}</span>`));
    rows.appendChild(row);
    return row;
  });
  $('#hint').classList.add('show');
  sfx('sparkle');
  const tiles = rowEls.flatMap((r) => [...r.querySelectorAll('.digit:not(.ghost)')]);
  tiles.forEach((t, k) => setTimeout(() => t.classList.add('in'), 250 + k * 35));
  setTimeout(() => {
    // Like the Lock 1 hint: among numbers of the same length, grey out the matching front digits
    // and light up the first digit that differs from its closest neighbour (30,450 vs 34,050 → the 0 and the 4).
    // A number alone at the longest length is simply the biggest: mark it green.
    const firstDiff = (a, b) => { let k = 0; while (k < a.length && a[k] === b[k]) k++; return k; };
    left.forEach((d, i) => {
      const peers = left.filter((o, j) => j !== i && o.length === d.length);
      if (!peers.length) {
        if (d.length === maxLen && left.some((o) => o.length < maxLen)) rowEls[i].classList.add('longer');
        return;
      }
      const k = Math.max(...peers.map((o) => firstDiff(d, o)));
      rowEls[i].querySelectorAll('.digit:not(.ghost)').forEach((t, idx) => {
        if (idx < k) t.classList.add('same');
        if (idx === k) t.classList.add('focus');
      });
    });
  }, 300 + tiles.length * 35);
  $('#hint-verdict').textContent = b.order === 'asc' ? HINT_ASC : HINT_DESC;
}

// Called from the hint "Got it!" button in js/game.js
function lock3HintClosed() {
  L3.busy = false;
  armIdle3();
}

/* ---------------- All 7 bulbs lit ---------------- */
// First half on the game screen (text + voice); the second half is voice-only,
// heard in the cafe while the locker opens and the note flies out (js/ending.js).
const FINALE_VO = { id: 'finale_narrator', who: 'Narrator', text: 'The last shell-bulb lights up - all seven shell-bulbs glow.', voiceOnly: true };

async function finale3() {
  L3.phase = 'done';
  await wait(300);
  bulbsEl.classList.add('all-lit');
  board.classList.add('shine');
  sfx('chime');
  sparkles(960, 434, 30, 420);
  const voDone = new Promise((res) => {
    setInstruction(FINALE_VO, FINALE_VO.id, res);
    setTimeout(res, Sound.on ? 1800 + FINALE_VO.text.length * 80 : 4000);
  });
  await wait(1200);
  confettiBurst();
  sfx('clap');
  sfx('win');
  await voDone;
  await wait(1000);
  bulbsEl.classList.remove('all-lit');
  goReveal(); // js/ending.js
}
