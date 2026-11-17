/* =========================================================
   TEST MENU (hamburger, top-left) — for testing screens only.
   To remove: delete this file and its <script> line in index.html.

   Must load BEFORE js/game.js (after js/nav.js, whose jump helpers it uses).
   Deep links also work, e.g. index.html#level-3, #hint, #win.
   ========================================================= */
(() => {
  // timer tracking, reset() and the gameAt/lock2At/lock3At helpers live in js/nav.js
  const { reset, gameAt, lock2At, lock3At } = window.Nav;

  /* ---------- Screen list ---------- */
  let ITEMS = [];
  const buildItems = () => [
    { group: 'Story' },
    { id: 'cover', label: '0. Cover page', go: () => { $('#cover-start').style.pointerEvents = ''; showScreen('screen-cover', true); } },
    { id: 'title', label: '1. Title', go: () => { showScreen('screen-title', true); pulseUntilClicked(btnStart); } },
    { id: 'narrator', label: '1b. Title — narrator zoom', go: () => { showScreen('screen-title', true); btnStart.click(); } },
    { id: 'story1', label: '2. Story 1 — Mr. Shells & Pikoo', go: () => goStory1() },
    { id: 'story2', label: '3. Story 2 — Neeli & the locks', go: () => goStory2() },
    { id: 'zoom', label: '3b. Zoom into lock 1 → game', go: () => { showScreen('screen-story2', true); zoomToFirstLock(); } },
    { group: 'Lock 1 — The Pins' },
    { id: 'howto', label: '4. How to play', go: () => { showScreen('screen-game', true); startGame(true); } },
    ...LEVELS.map((L, i) => ({
      id: `level-${i + 1}`,
      label: `${i + 5}. Pin ${i + 1} of 7 (${L.nums.join(' vs ')})`,
      go: () => { gameAt(i); loadLevel(i); },
    })),
    { group: 'Feedback' },
    { id: 'hint', label: 'Hint screen (pin 1)', go: () => { gameAt(0); loadLevel(0); state.busy = true; openHint(); } },
    { id: 'hand', label: 'Hand nudge (pin 1)', go: () => { gameAt(0); loadLevel(0); state.attempts = 2; onWrong(state.correct === 0 ? choiceB : choiceA); } },
    { id: 'win', label: 'Lock 1 open (finale)', go: () => { gameAt(7); finale(); } },
    { group: 'Lock 1 → Lock 2' },
    { id: 'lock1-done', label: '12. Lock 1 complete → lock opens', go: () => { gameAt(7); state.phase = 'done'; lockComplete(1); } },
    { id: 'shelf', label: '12b. Lock 1 opens → zoom into lock 2', go: () => goShelf(1) },
    { group: 'Lock 2 — The Code' },
    { id: 'l2-howto', label: '13. How to play', go: () => { showScreen('screen-game', true); startLock2(true); } },
    ...ROUNDS.map((rd, i) => ({
      id: `code-${i + 1}`,
      label: `${14 + i}. Round ${i + 1} of 4 (${rd.codes.map((k) => CODES[k].goal.toUpperCase()).join(' + ')}: ${CODES[rd.codes[0]].digits.join(', ')})`,
      go: () => { lock2At(rd.codes[0]); loadCode(i); },
    })),
    { id: 'l2-hint', label: 'Hint screen (code 1)', go: () => { lock2At(0); loadCode(0); L2.busy = true; openHint2(); } },
    { id: 'l2-hand', label: 'Shells slide + hand (code 1)', go: () => { lock2At(0); loadCode(0); setTimeout(() => { L2.attempts = 2; lock2Wrong(); }, 600); } },
    { id: 'l2-win', label: '21. Lock 2 complete → lock opens', go: () => { lock2At(8); L2.phase = 'done'; lockComplete(2); } },
    { id: 'shelf2', label: '21b. Lock 2 opens → zoom into lock 3', go: () => goShelf(2) },
    { group: 'Lock 3 — The Shell-Lights' },
    { id: 'l3-howto', label: '22. How to play (tutorial)', go: () => { showScreen('screen-game', true); startLock3(true); } },
    ...BULBS.map((b, i) => ({
      id: `bulb-${i + 1}`,
      label: `${23 + i}. Bulb ${i + 1} of 7 (${b.order === 'asc' ? 'ASCENDING' : 'DESCENDING'})`,
      go: () => { lock3At(i); loadBulb(i); },
    })),
    { id: 'l3-hint', label: 'Hint screen (bulb 1)', go: () => { lock3At(0); loadBulb(0); setTimeout(() => { L3.busy = true; openHint3(); }, 200); } },
    { id: 'l3-hand', label: 'Hand nudge (bulb 1)', go: () => { lock3At(0); loadBulb(0); setTimeout(() => { L3.attempts = 2; wrongCard(L3.cards.find((c) => c.num !== BULBS[0].nums[0])); }, 300); } },
    { id: 'l3-win', label: '30. Finale — all 7 bulbs glow, note flies down', go: () => { lock3At(7); finale3(); } },
    { group: 'Ending' },
    { id: 'reveal', label: '31. Lock 3 opens → who did it?', go: () => goReveal() },
    { id: 'happy', label: '32. Happy ending — the cafe opens', go: () => goHappy() },
  ];

  function jump(item) {
    reset();
    item.go();
    history.replaceState(null, '', `#${item.id}`);
    current = item.id;
    render();
  }

  /* ---------- UI ---------- */
  const css = `
  #dbg-btn{position:fixed;left:12px;bottom:12px;z-index:9999;width:52px;height:52px;border-radius:14px;
    border:3px solid #fff;background:rgba(20,12,60,.85);color:#fff;font-size:28px;line-height:1;cursor:pointer;
    box-shadow:0 4px 14px rgba(0,0,0,.4);font-family:system-ui,sans-serif}
  #dbg-btn:hover{background:rgba(60,40,150,.95)}
  #dbg-panel{position:fixed;left:12px;bottom:72px;z-index:9999;width:310px;max-height:calc(100vh - 90px);overflow:auto;
    background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.45);padding:8px 0;
    font:14px/1.3 system-ui,sans-serif;color:#222;display:none}
  #dbg-panel.open{display:block}
  #dbg-panel .dbg-title{padding:6px 16px 8px;font-weight:800;font-size:12px;letter-spacing:.08em;color:#c0392b}
  #dbg-panel .dbg-group{padding:10px 16px 4px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#888}
  #dbg-panel button{display:block;width:100%;text-align:left;padding:8px 16px;border:0;background:none;font:inherit;color:inherit;cursor:pointer}
  #dbg-panel button:hover{background:#f1ecff}
  #dbg-panel button.on{background:#5b2bb0;color:#fff;font-weight:700}`;
  let current = null;
  let panel;

  function render() {
    panel.innerHTML = '<div class="dbg-title">TEST MENU — remove before release</div>';
    ITEMS.forEach((it) => {
      if (it.group) {
        panel.insertAdjacentHTML('beforeend', `<div class="dbg-group">${it.group}</div>`);
        return;
      }
      const b = document.createElement('button');
      b.textContent = it.label;
      if (it.id === current) b.className = 'on';
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.remove('open');
        jump(it);
      });
      panel.appendChild(b);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    ITEMS = buildItems();
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const btn = document.createElement('button');
    btn.id = 'dbg-btn';
    btn.title = 'Test menu';
    btn.textContent = '☰';
    panel = document.createElement('div');
    panel.id = 'dbg-panel';
    document.body.append(btn, panel);
    render();

    btn.addEventListener('click', (e) => { e.stopPropagation(); panel.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') panel.classList.remove('open'); });

    // Deep link: index.html#level-3 etc.
    const fromHash = ITEMS.find((it) => it.id && `#${it.id}` === location.hash);
    if (fromHash) jump(fromHash);
  });
})();
