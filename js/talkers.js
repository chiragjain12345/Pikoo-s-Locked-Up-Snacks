/* =========================================================
   Story characters that talk with sprite sheets:
   - Pikoo (yellow fish): talk + blink frames (fish_talk_blink_strip.png)
   - Mr. Shells on story screen 2: only his mouth area is swapped with the
     crab talk frames (crab_mouth_strip.png), so the painted crab stays as is.
   Mouths move only while that character's voice line is playing.
   ========================================================= */
const talkUntil = { Pikoo: 0, 'Mr. Shells': 0, Neeli: 0 };

// Track who is speaking (wraps speak() from js/game.js)
const _speakT = speak;
speak = function (id, who, text, onStart, onEnd) {
  if (who in talkUntil) {
    talkUntil[who] = performance.now() + (Sound.on ? 1500 + text.length * 90 : 700 + text.length * 45);
    const end = onEnd;
    onEnd = (...a) => { talkUntil[who] = 0; if (end) end(...a); };
  }
  return _speakT(id, who, text, onStart, onEnd);
};

/* ---------------- Pikoo ---------------- */
const PK_TALK = [0, 1, 2, 1, 3, 2, 1, 0];
const PK_BLINK = [5, 6, 6, 5];
const pikooSprites = [];
['#pikoo-actor', '#pikoo-shelf', '#pikoo-end'].forEach((sel) => {
  const host = $(sel);
  if (!host) return;
  // remove the old still picture, its eyelids and moving-eye layers
  host.querySelectorAll('.blink-char').forEach((c) => {
    const i = blinkChars.findIndex((b) => b.el === c);
    if (i !== -1) blinkChars.splice(i, 1);
  });
  host.querySelectorAll('img, .blink-layer, .pk-eyes').forEach((n) => n.remove());
  const d = document.createElement('div');
  d.className = 'pk-sprite';
  host.prepend(d);
  pikooSprites.push({ d, f: -1, next: performance.now() + 1500 + Math.random() * 2500, blinkAt: -1 });
});

/* ---------------- Neeli in the story (whale talk + blink sheet) ---------------- */
const NL_TALK = [0, 1, 2, 1, 3, 2, 1, 0];
const NL_BLINK = [5, 6, 6, 6, 5];
const storyNeeliSprites = [];
document.querySelectorAll('.neeli-body').forEach((body) => {
  body.querySelectorAll('.blink-char').forEach((c) => {
    const i = blinkChars.findIndex((b) => b.el === c);
    if (i !== -1) blinkChars.splice(i, 1);
  });
  body.querySelectorAll('img, .blink-layer').forEach((n) => n.remove());
  const d = document.createElement('div');
  d.className = 'nl-sprite';
  body.appendChild(d);
  storyNeeliSprites.push({ d, f: -1, next: performance.now() + 1200 + Math.random() * 2500, blinkAt: -1 });
});

/* ---------------- Mr. Shells (story screen 2) ---------------- */
const CRAB_TALK = [1, 2, 3, 2, 1, 3, 2, 1];
const CRAB_FRONT_TALK = [0, 1, 3, 2, 3, 1, 0, 3, 2, 1]; // front view: closed → half → open
const crabMouth = document.createElement('div');
crabMouth.className = 'crab-mouth';
Object.assign(crabMouth.style, { left: '749.8px', top: '731px', width: '122px', height: '73px' });
$('#screen-story1 > .bg').appendChild(crabMouth);
// Reveal screen ("The cafe is saved!"): front-facing Mr. Shells, frames cut from that picture
const crabMouthEnd = document.createElement('div');
crabMouthEnd.className = 'crab-mouth crab-mouth-front';
Object.assign(crabMouthEnd.style, { left: '1800px', top: '730px', width: '98px', height: '52px' });
$('#cam-reveal').appendChild(crabMouthEnd);

function talkLoop(now) {
  const pkTalking = now < talkUntil.Pikoo;
  pikooSprites.forEach((s) => {
    let f = 0;
    if (pkTalking) { f = PK_TALK[Math.floor(now / 110) % PK_TALK.length]; s.blinkAt = -1; }
    else {
      if (s.blinkAt < 0 && now > s.next) s.blinkAt = now;
      if (s.blinkAt >= 0) {
        const k = Math.floor((now - s.blinkAt) / 70);
        if (k < PK_BLINK.length) f = PK_BLINK[k];
        else { s.blinkAt = -1; s.next = now + 2200 + Math.random() * 3200; }
      }
    }
    if (s.f !== f) { s.f = f; s.d.style.backgroundPosition = `${(f / 7) * 100}% 0`; }
  });
  const nlTalking = now < talkUntil.Neeli;
  storyNeeliSprites.forEach((s) => {
    let f = 0;
    if (nlTalking) { f = NL_TALK[Math.floor(now / 110) % NL_TALK.length]; s.blinkAt = -1; }
    else {
      if (s.blinkAt < 0 && now > s.next) s.blinkAt = now;
      if (s.blinkAt >= 0) {
        const k = Math.floor((now - s.blinkAt) / 90);
        if (k < NL_BLINK.length) f = NL_BLINK[k];
        else { s.blinkAt = -1; s.next = now + 1800 + Math.random() * 2600; }
      }
    }
    if (s.f !== f) { s.f = f; s.d.style.backgroundPosition = `${(f / 7) * 100}% 0`; }
  });
  const crabTalking = now < talkUntil['Mr. Shells'];
  [crabMouth, crabMouthEnd].forEach((m) => {
    m.style.display = crabTalking ? 'block' : 'none';
    if (crabTalking) {
      const seq = m === crabMouthEnd ? CRAB_FRONT_TALK : CRAB_TALK;
      const f = seq[Math.floor(now / 120) % seq.length];
      m.style.backgroundPosition = `${(f / 3) * 100}% 0`;
    }
  });
  requestAnimationFrame(talkLoop);
}
requestAnimationFrame(talkLoop);
