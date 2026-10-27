/* =========================================================
   Eye blinks for every character in the game and story.
   Eyes are measured in each picture's own pixels; a skin-coloured
   eyelid slides down over each eye and back up.
   Neeli's animated GIF is played here frame by frame
   (assets/images/neeli_sheet.png) so her eyelid can follow her eye.
   ========================================================= */
const BLINK_DATA = {"none": {"w": 1, "h": 1, "chars": []}, "cover": {"w": 1920, "h": 1080, "chars": [[[406, 679, 36, 33, "#fdd332"], [510, 667, 16, 27, "#fdd332"]], [[894, 532, 24, 23, "#f22d1b"], [954, 528, 24, 23, "#f22d1b"]], [[1475, 600, 31, 23, "#1e5fd0"]]]}, "title": {"w": 1920, "h": 1080, "chars": [[[863, 588, 15, 14, "#f22d1b"], [901, 586, 14, 14, "#f22d1b"]]]}, "story1": {"w": 1920, "h": 1080, "chars": [[[838, 724, 18, 27, "#f93425"]]]}, "cupboard": {"w": 1920, "h": 1080, "chars": [[[1817, 684, 31, 31, "#f22d1b"], [1889, 684, 32, 31, "#f22d1b"]]]}, "cafe": {"w": 1920, "h": 1080, "chars": [[[272, 636, 20, 23, "#edb941"], [207, 653, 25, 27, "#fdcf30"]], [[436, 670, 12, 19, "#fc740f"], [476, 682, 16, 21, "#fc740f"]], [[899, 529, 12, 15, "#f83321"], [871, 534, 14, 15, "#f83321"]], [[1110, 586, 13, 13, "#fbe1d6"], [1083, 582, 6, 10, "#fbe1d6"]], [[1607, 615, 18, 24, "#064ec3"]], [[1757, 749, 12, 18, "#c288fb"], [1804, 760, 14, 19, "#c990fc"]]]}, "pikoo": {"w": 780, "h": 702, "chars": [[[599, 327, 52, 46, "#fdc41d"], [750, 315, 20, 38, "#fdc41d"]]]}, "avatar": {"w": 1135, "h": 756, "chars": [[[686, 277, 80, 74, "#3c87fd"], [1050, 271, 46, 70, "#3c87fd"]]]}, "gif": {"w": 630, "h": 390, "rx": 21, "ry": 24, "frames": [[214, 198], [214, 195], [214, 191], [215, 188], [215, 184], [215, 179], [216, 174], [217, 172], [219, 166], [220, 161], [221, 157], [222, 152], [224, 148], [224, 144], [224, 142], [223, 142], [223, 142], [222, 143], [221, 145], [220, 148], [218, 152], [217, 157], [216, 164], [215, 171], [214, 178], [214, 182], [213, 185], [213, 188], [213, 190], [213, 193], [213, 195], [213, 196], [213, 198], [214, 198], [214, 199], [214, 199]], "color": "#1f5fc8"}, "neeli": {"w": 900, "h": 483, "chars": [[[326, 144, 31, 21, "#074dae"]]]}, "neeliStory": {"w": 706, "h": 362, "chars": [[[481, 121, 28, 21, "#014dcc"]]]}, "turtle": {"w": 155, "h": 128, "chars": [[[31, 26, 9, 9, "#fbefe6"], [13, 14, 5, 7, "#fbefe6"]]]}};

const blinkChars = []; // { el, next }

function lidHTML(w, h, [x, y, rx, ry, color]) {
  return `<i class="lid" style="left:${((x - rx) / w) * 100}%;top:${((y - ry) / h) * 100}%;width:${((2 * rx) / w) * 100}%;height:${((2 * ry) / h) * 100}%;--c:${color}"></i>`;
}

// Fill `layer` with eyelids for picture set `key` (one group per character)
function fillBlinkLayer(layer, key) {
  const set = BLINK_DATA[key];
  layer.querySelectorAll('.blink-char').forEach((c) => {
    const i = blinkChars.findIndex((b) => b.el === c);
    if (i !== -1) blinkChars.splice(i, 1);
  });
  layer.innerHTML = '';
  set.chars.forEach((eyes) => {
    const ch = document.createElement('div');
    ch.className = 'blink-char';
    ch.innerHTML = eyes.map((e) => lidHTML(set.w, set.h, e)).join('');
    layer.appendChild(ch);
    blinkChars.push({ el: ch, next: performance.now() + 800 + Math.random() * 4000 });
  });
}

function addBlinkLayer(host, key, extraClass = '') {
  if (!host) return null;
  const layer = document.createElement('div');
  layer.className = `blink-layer ${extraClass}`.trim();
  fillBlinkLayer(layer, key);
  host.appendChild(layer);
  return layer;
}

function onShownScreen(el) {
  const scr = el.closest('.screen');
  return !scr || scr.classList.contains('active') || scr.classList.contains('page-out');
}

// One blink: lids close quickly, hold a moment, open again
function blinkOnce(el) {
  el.classList.add('shut');
  setTimeout(() => el.classList.remove('shut'), 140);
}

/* ---------------- Neeli GIF → frame-by-frame sprite ---------------- */
const NEELI = BLINK_DATA.gif;
const neeliSprites = [];
function setupNeeliSprite(div) {
  const lid = document.createElement('i');
  lid.className = 'lid';
  lid.style.setProperty('--c', NEELI.color);
  lid.style.width = `${((2 * NEELI.rx) / NEELI.w) * 100}%`;
  lid.style.height = `${((2 * NEELI.ry) / NEELI.h) * 100}%`;
  const ch = document.createElement('div');
  ch.className = 'blink-char';
  ch.appendChild(lid);
  div.appendChild(ch);
  neeliSprites.push({ div, lid, frame: -1 });
  blinkChars.push({ el: ch, next: performance.now() + 1500 + Math.random() * 3000 });
}

/* ---------------- One loop drives everything (an animation frame,
   not a timer, so the test menu's "clear timers" never stops it) ---------------- */
function blinkLoop(now) {
  const frame = Math.floor(now / 90) % NEELI.frames.length;
  neeliSprites.forEach((s) => {
    if (s.frame === frame) return;
    s.frame = frame;
    s.div.style.backgroundPosition = `${(frame % 6) * 20}% ${Math.floor(frame / 6) * 20}%`;
    const [x, y] = NEELI.frames[frame];
    s.lid.style.left = `${((x - NEELI.rx) / NEELI.w) * 100}%`;
    s.lid.style.top = `${((y - NEELI.ry) / NEELI.h) * 100}%`;
  });
  blinkChars.forEach((b) => {
    if (now < b.next) return;
    if (onShownScreen(b.el)) {
      blinkOnce(b.el);
      if (Math.random() < 0.2) setTimeout(() => blinkOnce(b.el), 300); // sometimes a double blink
    }
    b.next = now + 2200 + Math.random() * 3800; // natural, uneven rhythm
  });
  requestAnimationFrame(blinkLoop);
}

/* ---------------- Hook up every character ---------------- */
addBlinkLayer($('#screen-cover .cover-bg'), 'cover');
addBlinkLayer($('#cam-title .bg'), 'title');
addBlinkLayer($('#screen-story1 > .bg'), 'story1');
addBlinkLayer($('#zoom-wrap'), 'cupboard');
addBlinkLayer($('#zoom-wrap-shelf'), 'cupboard');
addBlinkLayer($('#cam-reveal'), 'cupboard');
addBlinkLayer($('#cam-happy .bg'), 'cafe');
addBlinkLayer($('#pikoo-actor'), 'pikoo');
addBlinkLayer($('#pikoo-shelf'), 'pikoo', 'mirror');
addBlinkLayer($('#pikoo-end'), 'pikoo', 'mirror');
document.querySelectorAll('.neeli-body').forEach((b) => addBlinkLayer(b, 'neeli'));
{ // the title-screen turtle floats, so its eyelids ride along in their own moving box
  const tb = document.createElement('div');
  tb.className = 'title-turtle-blink';
  $('#cam-title .bg').appendChild(tb);
  addBlinkLayer(tb, 'turtle');
}

// Pikoo's eyes: a moving iris inside each eye white (used for her "shifty" glance)
const PK_EYES = [[544, 279, 110, 97, '#f1eae3', 0], [726, 275, 46, 81, '#f8f5f3', 1]]; // in char_pikoo.png (780x702)
function addPikooEyes(host, mirror) {
  if (!host) return;
  const layer = document.createElement('div');
  layer.className = `pk-eyes${mirror ? ' mirror' : ''}`;
  layer.innerHTML = PK_EYES.map(([x, y, w, h, col, i]) =>
    `<div class="pk-eye" style="left:${(x / 780) * 100}%;top:${(y / 702) * 100}%;width:${(w / 780) * 100}%;height:${(h / 702) * 100}%;--w:${col};--m:url(../assets/images/pikoo_eye${i}_mask.png)"><img src="assets/images/pikoo_eye${i}_pupil.png" alt="" /></div>`
  ).join('');
  host.insertBefore(layer, host.querySelector('.blink-layer'));
}
addPikooEyes($('#pikoo-actor'), false);
addPikooEyes($('#pikoo-shelf'), true);
addPikooEyes($('#pikoo-end'), true);

// Instruction-panel avatar: a twin layer that copies the avatar's box and switches Neeli / Pikoo
const avatarBlink = document.createElement('div');
avatarBlink.id = 'avatar-blink';
$('#avatar').after(avatarBlink);
let avatarKey = '';
function syncAvatarBlink() {
  const av = $('#avatar');
  const key = av.classList.contains('is-pikoo') ? 'pikoo' : 'avatar';
  if (key !== avatarKey) { avatarKey = key; fillBlinkLayer(avatarBlink, key); }
  avatarBlink.className = `${av.className} blink-layer`;
}
new MutationObserver(syncAvatarBlink).observe($('#avatar'), { attributes: true, attributeFilter: ['class', 'src'] });
syncAvatarBlink();

requestAnimationFrame(blinkLoop);
