/* =========================================================
   Loading screen: every image the game shows is downloaded and
   decoded before the home screen appears, so nothing pops in
   piece by piece. Voice clips and the ending video load in the
   background afterwards (see 'game-ready' in js/game.js).
   ========================================================= */
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;
  const fill = loader.querySelector('.loader-fill');
  const pct = loader.querySelector('.loader-pct');

  // Images used only from scripts (everything in the page and in css/style.css is found automatically).
  // Keep the exact spelling used in the code, including any ?v= — a different URL would download twice.
  const JS_IMAGES = [
    'assets/images/char_pikoo.png', 'assets/images/char_neeli.png', 'assets/images/pikoo.png',
    'assets/images/neeli_avatar.png', 'assets/images/neeli_talk_blink_strip.png',
    'assets/images/neeli_sad_blink_strip.png', 'assets/images/neeli_happy_anim_strip.png',
    'assets/images/dialogue_neeli.png', 'assets/images/dialogue_pikoo.png', 'assets/images/dialogue_shells.png',
    'assets/images/lock_board.png', 'assets/images/lock2_board.png', 'assets/images/lock2_board.png?v=2',
    'assets/images/lock_sprite.png', 'assets/images/lock2_sprite.png', 'assets/images/lock3_sprite.png',
    'assets/images/pin.png', 'assets/images/shell_tile.png', 'assets/images/number_card.png',
    'assets/images/shell_bulb_off.png?v=2', 'assets/images/shell_bulb_on.png?v=2',
    'assets/images/screen3_story_bg_lock1_open.jpg', 'assets/images/screen3_story_bg_lock2_open.jpg',
    'assets/images/screen3_story_bg_lock3_open.jpg',
    'assets/images/pikoo_eye0_mask.png', 'assets/images/pikoo_eye1_mask.png',
    'assets/images/pikoo_eye0_pupil.png', 'assets/images/pikoo_eye1_pupil.png',
  ];
  const SKIP = /neeli_sheet\.png/; // only in a CSS rule nothing uses (2.7 MB)

  const urls = new Set();
  const add = (u, base) => {
    if (!u || u.startsWith('data:') || SKIP.test(u)) return;
    try { urls.add(new URL(u, base || document.baseURI).href); } catch (e) { /* bad url */ }
  };
  const URL_RE = /url\(\s*["']?([^"')]+?\.(?:png|jpe?g|gif|webp)(?:\?[^"')]*)?)["']?\s*\)/g;

  document.querySelectorAll('img[src]').forEach((i) => add(i.getAttribute('src')));
  document.querySelectorAll('[style*="url("]').forEach((el) => {
    for (const m of el.getAttribute('style').matchAll(URL_RE)) add(m[1]);
  });
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch (e) { continue; } // e.g. Google Fonts (other site)
    const scan = (list) => {
      for (const r of list) {
        if (r.cssRules) scan(r.cssRules);
        if (r.cssText) for (const m of r.cssText.matchAll(URL_RE)) add(m[1], sheet.href);
      }
    };
    scan(rules);
  }
  JS_IMAGES.forEach((u) => add(u));

  const list = [...urls];
  const keep = []; // hold the decoded images so the browser keeps them ready
  let done = 0;
  const show = () => {
    const p = list.length ? done / list.length : 1;
    fill.style.width = `${Math.round(p * 100)}%`;
    pct.textContent = `${Math.round(p * 100)}%`;
  };
  show();

  const loadOne = (src) => new Promise((res) => {
    const img = new Image();
    keep.push(img);
    let counted = false;
    const fin = () => { if (counted) return; counted = true; done++; show(); res(); };
    img.onerror = fin;
    img.src = src;
    if (img.decode) img.decode().then(fin, () => (img.complete ? fin() : (img.onload = fin)));
    else img.onload = fin;
  });

  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
  const all = Promise.all([...list.map(loadOne), fonts]);
  const safety = new Promise((res) => setTimeout(res, 30000)); // never stuck on a bad connection
  const minShow = new Promise((res) => setTimeout(res, 500));  // no flash on a fast reload

  // taps on the loading screen do nothing (no music before the game is visible)
  loader.addEventListener('pointerdown', (e) => e.stopPropagation());

  Promise.all([Promise.race([all, safety]), minShow]).then(() => {
    fill.style.width = '100%';
    pct.textContent = '100%';
    window.GAME_READY = true;
    window.hideLoader = () => {
      if (loader.classList.contains('done')) return;
      loader.classList.add('done');
      setTimeout(() => loader.remove(), 700);
    };
    // "Tap to play": shown when the browser won't play sound before a tap (see js/game.js)
    window.showTapToPlay = (onTap) => {
      loader.classList.add('tap');
      const btn = loader.querySelector('.loader-play');
      btn.hidden = false;
      btn.addEventListener('click', () => { window.hideLoader(); onTap(); }, { once: true });
    };
    window.dispatchEvent(new Event('game-ready'));
    if (!window.TITLE_ON_OPEN) window.hideLoader(); // (js/game.js normally takes over here)
  });
})();
