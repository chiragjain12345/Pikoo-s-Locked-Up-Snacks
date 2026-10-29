/* =========================================================
   Pikoo's Locked Up Snacks — Lock 1: The Pins
   Flow: Title → Story 1 → Story 2 → zoom into lock 1 →
         How to play → 7 compare levels → Lock open
   ========================================================= */

const $ = (sel, root = document) => root.querySelector(sel);
const stage = $('#stage');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------- Stage scaling ---------------- */
function fitStage() {
  const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  stage.style.setProperty('--scale', s);
}
window.addEventListener('resize', fitStage);
fitStage();

/* ---------------- Content (from the requirement sheet) ---------------- */
const SPEAKERS = {
  Narrator:     { color: '#8b4ad8', pitch: 1.0, rate: 0.95 },
  Title:        { color: '#8b4ad8', pitch: 1.35, rate: 0.88 },
  'Mr. Shells': { color: '#d8392b', pitch: 0.75, rate: 0.95 },
  Pikoo:        { color: '#e0559a', pitch: 1.45, rate: 1.05 },
  Neeli:        { color: '#2f7ae0', pitch: 1.2, rate: 0.95 },
};

// Screen 1 — narrator is voice-over only (no box); on-screen text is the title.
const NARRATOR_1 = { id: 's1_narrator', who: 'Narrator', text: 'At the Shellfish Cafe, somebody has locked the snack cupboard... And the café needs to be opened for the day!' };

// Each speaker has their own speech bubble (assets/images/dialogue_*.png).
// `at` = bubble position/width on the 1920x1080 stage; the tail points at the speaker.
const BUBBLES = {
  Neeli:        { cls: 'neeli',  img: 'assets/images/dialogue_neeli.png' },
  Pikoo:        { cls: 'pikoo',  img: 'assets/images/dialogue_pikoo.png', flip: true },
  'Mr. Shells': { cls: 'shells', img: 'assets/images/dialogue_shells.png' },
  Narrator:     { cls: 'narrator' },
};

// Screen 2
const STORY_1 = [
  { id: 's2_shells', who: 'Mr. Shells', text: 'Someone locked away all the snacks. Who was it?', voiceOnly: true, autoNext: true, at: { left: 925, top: 410, width: 540 } },
  // Pikoo swims in slowly from the left and stops beside Mr. Shells, talking to him
  { id: 's2_pikoo', who: 'Pikoo', text: "Wasn't me! …\u2060Probably.", voiceOnly: true, actor: '#pikoo-actor', actorMs: 3000, at: { left: 70, top: 452, width: 460 } },
];

// Screen 3 — Neeli floats to the cupboard and taps the three locks one by one.
// Her bubble shows the on-screen text; the voice-over says the longer line.
const NEELI_3 = {
  id: 's3_neeli',
  who: 'Neeli',
  vo: 'There are three locks... that means we have to solve all three levels to open up the snack shelf and to find out WHO locked the snacks.',
  text: 'Crack all three locks to open the cupboard - and find out who locked it!',
  at: { left: 133, top: 364, width: 560 },
};
const NEELI_HOME = { x: 228, y: 609 }; // where Neeli is painted in the Figma screen 3
const LOCK_Y = [300, 490, 680]; // lock centres on screen 3 (x = 1068)

const HOW_TO = { id: 'howto_pikoo', who: 'Pikoo', text: 'Seven little pins. Tap the bigger number and a pin pops loose!' };
const INSTRUCTION = { id: 'instruction', who: 'Neeli', text: 'Tap the bigger number.' };
// Praise after the child needed wrong tries: no "easy / you got it" lines, just a plain "Good job!"
const RETRY_FB = { id: 'l2_correct', who: 'Neeli', text: 'Good job!' };
const WRONG_1 = { id: 'wrong_1', who: 'Neeli', text: 'Oops! Try Again.', voiceOnly: true, restore: true };
const WRONG_2 = { id: 'wrong_2_hint', who: 'Neeli', text: 'Compare the number of digits first. If the number of digits is the same, compare the digits from the left until they are different.' };
const IDLE = { id: 'idle', who: 'Neeli', text: 'Take your time - tap the one you think is right.' };
const IDLE_DRAG = { id: 'idle_drag', who: 'Neeli', text: 'Take your time - drag the digit shells into the windows.' };

const LEVELS = [
  { nums: ['6,540', '48,210'],     fb: { who: 'Pikoo', text: 'Yayy! First pin loose - Great!' } },
  { nums: ['53,924', '57,282'],    fb: { who: 'Neeli', text: 'Good Job.' } },
  { nums: ['46,180', '46,310'],    fb: { who: 'Pikoo', text: 'Another one loose!' } },
  { nums: ['9,990', '12,040'],     fb: { who: 'Neeli', text: "The big 9 at the front didn't fool you." } },
  { nums: ['89,999', '90,000'],    fb: { who: 'Pikoo', text: 'The numbers are so close - but you got it!' } },
  { nums: ['1,05,789', '1,05,698'], fb: { who: 'Pikoo', text: 'Whoa, a six-digit one - Bravo!' } },
  { nums: ['1,20,467', '1,20,728'], fb: { who: 'Neeli', text: 'Yayy!! The last pin. You did it.' } },
];
const FINAL_PIKOO = { id: 'l7_pikoo', who: 'Pikoo', text: "SEE? Wasn't me!" };

// Pin positions on the lock track (from Figma, stage coordinates)
const PIN_POS = [
  [471.86, 375.72], [622.01, 373.96], [773.47, 375.28], [921.85, 374.84],
  [1071.56, 374.84], [1223.02, 375.72], [1376.69, 373.96],
];
const PIN_W = 93.34, PIN_H = 99.95;
// Sockets in the bottom-right progress panel (relative to the panel)
const PANEL = { x: 1346.3, y: 911 };
const SOCKET_X0 = 40, SOCKET_STEP = 32, SOCKET_Y = 56;

const toNumber = (s) => Number(s.replace(/,/g, ''));

/* ---------------- Audio: optional files, synth/TTS fallback ----------------
   To use recorded audio, put the file in the folder and add its name here:
     assets/audio/sfxs/<name>.mp3  — click, pop, land, wrong, whoosh, sparkle, win
     assets/audio/vos/<id>.mp3     — ids used in the content above, plus
                                     l1_correct … l7_correct, l1_hand … l7_hand
   Anything not listed falls back to synthesized SFX / browser text-to-speech.
------------------------------------------------------------------------------ */
const AUDIO_FILES = {
  sfxs: ['pin pop', 'bulb on'],   // files in assets/audio/sfxs/ (name without .mp3)
  // cut from the per-character recordings (neeli / pikko / mr shell / narrator acfe .mp3)
  vos: [
    'cover_title', 's1_narrator', 's2_shells', 's2_pikoo', 's3_neeli',
    'howto_pikoo', 'instruction', 'wrong_1', 'wrong_2_hint', 'idle', 'idle_drag', 'l1_hand',
    'l1_correct', 'l2_correct', 'l3_correct', 'l4_correct', 'l5_correct', 'l6_correct', 'l7_correct',
    'l1_done_neeli', 'l1_done_pikoo', 'l2_done_neeli', 'l2_done_pikoo',
    'l2_howto_pikoo', 'l2_howto_neeli', 'l2_round1', 'l2_round1_drag', 'l2_round2_drag', 'l2_round3_drag', 'l2_round4_drag', 'l2_round2', 'l2_round3', 'l2_round4', 'l2_hint_big', 'l2_hint_small', 'l2_hint_zero', 'l2_hint_zero4', 'l2_hand',
    'l2_round1_big_ok', 'l2_round2_big_ok', 'l2_round3_big_ok', 'l2_round4_big_ok',
    'l2_round1_correct', 'l2_round2_correct', 'l2_round3_correct', 'l2_round4_correct',
    'l3_howto_neeli', 'l3_tut_1', 'l3_tut_2', 'l3_tut_3', 'l3_tut_4', 'l3_tut_5',
    'l3_instr_asc', 'l3_instr_desc', 'l3_hint_asc', 'l3_hint_desc', 'l3_hand',
    'l3_bulb1_correct', 'l3_bulb2_correct', 'l3_bulb3_correct', 'l3_bulb4_correct',
    'l3_bulb5_correct', 'l3_bulb6_correct', 'l3_bulb7_correct',
    'finale_narrator', 'finale_narrator_2', 'end_neeli_read', 'end_pikoo', 'end_shells', 'end_narrator',
  ],
};

const Sound = {
  on: true,
  ctx: null,
  files: {},       // sfx path -> small pool of HTMLAudioElements, once the file has loaded
  current: null,   // currently playing VO element
  voice: null,
};

// Sound effects: a few reused players per file (not a new player per play — browsers cap
// how many audio players a page may have, and running out silenced the voice-overs)
function probe(path) {
  const a = new Audio();
  a.preload = 'auto';
  a.addEventListener('canplaythrough', () => {
    const pool = [a, new Audio(path), new Audio(path)];
    pool.i = 0;
    Sound.files[path] = pool;
  }, { once: true });
  a.src = path;
}
AUDIO_FILES.sfxs.forEach((n) => probe(`assets/audio/sfxs/${n}.mp3`));

// Voice-overs: ONE player; each line's file is loaded when it is spoken. (Earlier every
// clip had its own preloaded player and was only used once it reported "ready" — some
// never did, and those lines fell back to a silent text-to-speech.)
const VO_IDS = new Set(AUDIO_FILES.vos);
// Same ?v= as this script in index.html, so a new build also re-loads changed voice files
// (without it the browser kept playing old cached clips)
const ASSET_V = (() => { try { return new URL(document.currentScript.src).searchParams.get('v') || ''; } catch (e) { return ''; } })();
const voUrl = (id) => `assets/audio/vos/${id}.mp3${ASSET_V ? `?v=${ASSET_V}` : ''}`;
const voPlayer = new Audio();
voPlayer.preload = 'auto';
// warm the browser cache so lines start without a delay (ignored where fetch can't read files)
AUDIO_FILES.vos.forEach((id) => { try { fetch(voUrl(id)).catch(() => {}); } catch (e) { /* file:// */ } });

function pickVoice() {
  const voices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
  Sound.voice =
    voices.find((v) => /en-IN/i.test(v.lang)) ||
    voices.find((v) => /en-GB/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) || null;
}
if (window.speechSynthesis) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

// audioCtx() and the synthesized sounds (SYNTH) live in js/sound.js

// game sound name → recorded file in assets/audio/sfxs/ (falls back to the synth sound)
const SFX_FILE = { pinpop: 'pin pop', bulbon: 'bulb on' };

function sfx(name) {
  if (!Sound.on) return;
  const pool = Sound.files[`assets/audio/sfxs/${SFX_FILE[name] || name}.mp3`];
  if (pool) {
    const a = pool[pool.i++ % pool.length];
    a.currentTime = 0;
    a.play().catch(() => {});
  } else if (SYNTH[name] && audioCtx()) {
    SYNTH[name]();
  }
}

function stopVoice() {
  if (Sound.current) { Sound.current.pause(); Sound.current = null; }
  if (window.speechSynthesis) speechSynthesis.cancel();
}

function speak(id, who, text, onStart, onEnd) {
  stopVoice();
  if (!Sound.on) return;
  if (VO_IDS.has(id)) {
    const a = voPlayer;
    a.onended = null;
    a.onerror = null;
    a.src = voUrl(id);
    a.onended = onEnd || null;
    // file missing / unreadable: say it with text-to-speech instead
    a.onerror = () => { if (Sound.current === a) { Sound.current = null; speakTTS(who, text, onStart, onEnd); } };
    Sound.current = a;
    a.play().then(() => onStart && onStart()).catch(() => {});
    return;
  }
  speakTTS(who, text, onStart, onEnd);
}

function speakTTS(who, text, onStart, onEnd) {
  if (!window.speechSynthesis) { if (onEnd) setTimeout(onEnd, 300); return; }
  const u = new SpeechSynthesisUtterance(text.replace(/ - /g, ', '));
  const sp = SPEAKERS[who] || {};
  u.pitch = sp.pitch || 1;
  u.rate = sp.rate || 1;
  if (Sound.voice) u.voice = Sound.voice;
  if (onStart) u.onstart = onStart;
  if (onEnd) u.onend = onEnd;
  speechSynthesis.speak(u);
}

function setSound(on) {
  Sound.on = on;
  $('#sound-toggle').textContent = on ? '🔊' : '🔇';
  setMusicOn(on);
  if (!on) stopVoice();
}
$('#sound-toggle').addEventListener('click', (e) => { e.stopPropagation(); setSound(!Sound.on); });


/* ---------------- Inactivity ---------------- */
const IDLE_MS = 15000;        // quiet time (after the voice ends) before the "Take your time" reminder
const IDLE_REPEAT_MS = 30000; // after a reminder, wait longer before the next one
let lastSpeechAt = 0; // when a voice line was last heard playing
(function watchSpeech() {
  if (isSpeaking()) lastSpeechAt = performance.now();
  requestAnimationFrame(watchSpeech);
})();
function isSpeaking() {
  if (Sound.current && !Sound.current.paused && !Sound.current.ended) return true;
  return !!(window.speechSynthesis && speechSynthesis.speaking);
}
const Idle = {
  timer: null,
  ms: 0,
  fn: null,
  arm(ms, fn) { this.ms = ms; this.fn = fn; this.reset(); },
  reset() {
    clearTimeout(this.timer);
    if (!this.fn) return;
    this.since = performance.now();
    const check = () => {
      // the quiet time counts from the later of: the last tap, or the end of the last voice line
      const quiet = performance.now() - Math.max(this.since, lastSpeechAt);
      if (isSpeaking() || quiet < this.ms) { this.timer = setTimeout(check, Math.max(250, this.ms - quiet)); return; }
      const f = this.fn; f && f();
    };
    this.timer = setTimeout(check, this.ms);
  },
  clear() { clearTimeout(this.timer); this.fn = null; },
};
document.addEventListener('pointerdown', () => { audioCtx(); Idle.reset(); });

function pulseUntilClicked(btn) {
  Idle.arm(7000, () => btn.classList.add('pulse'));
}

/* ---------------- Decorative bubbles ---------------- */
function fillBubbles(container, count) {
  for (let i = 0; i < count; i++) {
    const b = document.createElement('span');
    const size = 10 + Math.random() * 34;
    b.className = 'bubble';
    b.style.width = b.style.height = `${size}px`;
    b.style.left = `${Math.random() * 100}%`;
    b.style.animationDuration = `${9 + Math.random() * 9}s`;
    b.style.animationDelay = `${-Math.random() * 18}s`;
    container.appendChild(b);
  }
}
document.querySelectorAll('.bubbles').forEach((c) => fillBubbles(c, 14));

function sparkles(x, y, n = 14, spread = 140, parent = stage) {
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    const ang = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const dist = spread * (0.5 + Math.random() * 0.6);
    const size = 0.6 + Math.random() * 1.4;
    parent.appendChild(s);
    s.animate(
      [
        { transform: 'translate(0,0) scale(0.2)', opacity: 1 },
        { transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) scale(${size})`, opacity: 1, offset: 0.6 },
        { transform: `translate(${Math.cos(ang) * dist * 1.2}px, ${Math.sin(ang) * dist * 1.2 + 30}px) scale(0)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.4,1)' }
    ).onfinish = () => s.remove();
  }
}

/* ---------------- Screens ---------------- */
function showScreen(id, instant = false) {
  hideCaption();
  document.querySelectorAll('.screen').forEach((s) => {
    if (instant) s.style.transition = 'none';
    s.classList.toggle('active', s.id === id);
  });
  if (instant) {
    void stage.offsetWidth;
    document.querySelectorAll('.screen').forEach((s) => (s.style.transition = ''));
  }
}

/* ---------------- Caption: voice-only lines as on-screen text ----------------
   Lines that are only spoken (narrator, praise, "Oops!", nudges, how-to intros) also
   appear in Neeli's dialogue box, so they can be read with the sound off. Another
   speaker (Pikoo, Narrator) gets a name tag on the box. */
const CAPTION_AT = {
  'screen-title':  { left: 300, top: 740, width: 700 },             // on the sand
  'screen-reveal': { left: 380, top: 60, width: 640 },              // on the empty wall
  default:         { left: 610, top: 60, width: 700 },
};
const captionEl = document.createElement('div');
captionEl.className = 'speech neeli caption';
captionEl.innerHTML = '<img class="speech-bg" alt="" src="assets/images/dialogue_neeli.png" /><span class="speaker"></span><p class="line"></p>';
stage.appendChild(captionEl);
let captionToken = 0;
let captionTimer = null;

// Show `text` in the caption box; returns a function to call when the voice has finished
function showCaption(who, text) {
  const scr = document.querySelector('.screen.active');
  // never on the game screens: there every line goes in the instruction panel
  if (scr && scr.id === 'screen-game') return () => {};
  const token = ++captionToken;
  const at = CAPTION_AT[scr && scr.id] || CAPTION_AT.default;
  captionEl.className = `speech neeli caption${at.flip ? ' flip' : ''}${who !== 'Neeli' ? ' named' : ''}`;
  Object.assign(captionEl.style, { left: `${at.left}px`, top: `${at.top}px`, width: `${at.width}px` });
  const sp = $('.speaker', captionEl);
  sp.textContent = who;
  sp.style.background = (SPEAKERS[who] || SPEAKERS.Neeli).color;
  fitBubbleText($('.line', captionEl), text);
  void captionEl.offsetWidth;
  captionEl.classList.add('show');
  // stays up for at least its reading time, and until the voice ends
  const readUntil = performance.now() + 1500 + text.length * 50;
  let voiceDone = !Sound.on;
  const tryHide = () => {
    if (token !== captionToken || !voiceDone) return;
    clearTimeout(captionTimer);
    captionTimer = setTimeout(() => { if (token === captionToken) captionEl.classList.remove('show'); },
      Math.max(400, readUntil - performance.now()));
  };
  clearTimeout(captionTimer);
  tryHide();
  setTimeout(() => { voiceDone = true; tryHide(); }, 20000); // safety if no end event ever comes
  return () => { voiceDone = true; tryHide(); };
}
function hideCaption() {
  captionToken++;
  clearTimeout(captionTimer);
  captionEl.classList.remove('show');
}

// Speak a voice-only line and show it as a caption at the same time
function speakCaptioned(id, who, text, captionText, onEnd) {
  const done = showCaption(who, captionText || text);
  speak(id, who, text, null, (...a) => { done(); if (onEnd) onEnd(...a); });
}

/* ---------------- Page flip between story screens ---------------- */
const STORY_PAUSE = 1200; // ms to wait after a scene ends before moving to the next

// Scenes blend into each other like one continuous film: the old scene drifts
// forward and fades while the next one settles in underneath.
// `next` must make the next screen active (it is called right away).
function pageFlip(fromId, next) {
  const from = $(`#${fromId}`);
  from.classList.add('page-out');
  sfx('whoosh');
  next();
  const to = document.querySelector('.screen.active');
  if (to && to !== from) {
    to.classList.add('scene-in');
    setTimeout(() => to.classList.remove('scene-in'), 1500);
  }
  const done = () => from.classList.remove('page-out');
  from.addEventListener('animationend', done, { once: true });
  setTimeout(done, 1600);
}

/* ---------------- Story dialogue (speech bubbles) ---------------- */
function runDialogue(bubble, nextBtn, lines, { lastLabel, onLine, onDone, auto } = {}) {
  const speakerEl = $('.speaker', bubble);
  const lineEl = $('.line', bubble);
  const bgEl = $('.speech-bg', bubble);
  let i = 0;
  let typing = null;
  let waiting = false;
  let full = '';

  const finishTyping = () => {
    clearInterval(typing);
    typing = null;
    lineEl.textContent = full;
  };

  const show = (idx) => {
    const l = lines[idx];
    const look = BUBBLES[l.who];
    const sameLook = bubble.dataset.who === l.who && bubble.classList.contains('show');
    nextBtn.innerHTML = idx === lines.length - 1 && lastLabel ? lastLabel : 'Next &rsaquo;';
    full = l.text;

    const fill = () => {
      if (l.voiceOnly) { bubble.classList.remove('show'); return; } // spoken, no bubble
      const flip = l.flip !== undefined ? l.flip : look.flip;
      bubble.className = `speech ${look.cls}${flip ? ' flip' : ''}`;
      bubble.dataset.who = l.who;
      Object.assign(bubble.style, { left: `${l.at.left}px`, top: `${l.at.top}px`, width: `${l.at.width}px` });
      if (look.img) bgEl.src = look.img;
      speakerEl.textContent = l.who;
      fitBubbleText(lineEl, full);
      lineEl.textContent = '';
      void bubble.offsetWidth;
      bubble.classList.add('show');
      sfx('bubble');
      let c = 0;
      clearInterval(typing);
      typing = setInterval(() => {
        c = nextWordEnd(full, c);
        lineEl.textContent = full.slice(0, c);
        if (c >= full.length) finishTyping();
      }, 110);
    };

    // A character who walks/swims on first: wait for them before speaking
    let delay = 0;
    const actor = l.actor && $(l.actor);
    if (actor && !actor.classList.contains('in')) {
      actor.classList.add('in');
      sfx('swim');
      delay = l.actorMs || 1300;
    }
    const next = lines[idx + 1];
    const say = () => {
      if (l.autoNext && next) {
        // Story keeps flowing: the next speaker enters while this line is
        // finishing, and speaks as soon as this line ends — no Next tap.
        waiting = true;
        nextBtn.classList.add('btn-gone');
        const est = Math.max(full.length * 28 + 600, l.text.length * 70);
        const nextActor = next.actor && $(next.actor);
        let ended = false;
        let arrived = !nextActor;
        const go = () => {
          if (ended && arrived && i === idx) { i++; show(i); }
        };
        speak(l.id, l.who, l.text, null, () => { ended = true; setTimeout(go, 250); });
        setTimeout(() => { ended = true; go(); }, Sound.on ? est * 1.8 : est); // fallback if no end event
        if (nextActor) {
          setTimeout(() => {
            nextActor.classList.add('in');
            sfx('swim');
            setTimeout(() => { arrived = true; go(); }, next.actorMs || 1300);
          }, est * 0.45);
        }
        return;
      }
      if (auto) {
        // Story plays by itself: move on a moment after the line is spoken
        waiting = true;
        nextBtn.classList.add('btn-gone');
        let moved = false;
        const advance = () => {
          if (moved || i !== idx) return;
          moved = true;
          setTimeout(() => {
            i++;
            if (i < lines.length) show(i);
            else { Idle.clear(); onDone && onDone(); }
          }, STORY_PAUSE);
        };
        speak(l.id, l.who, l.text, null, advance);
        setTimeout(advance, Sound.on ? 1500 + l.text.length * 80 : 900 + l.text.length * 45); // fallback
        return;
      }
      waiting = false;
      nextBtn.classList.remove('btn-gone');
      speak(l.id, l.who, l.text);
      pulseUntilClicked(nextBtn);
    };

    if (sameLook && !delay) {
      // Same speaker again: keep the bubble, just swap the text
      clearInterval(typing);
      lineEl.textContent = '';
      fill();
      say();
    } else {
      bubble.classList.remove('show');
      waiting = true;
      setTimeout(() => { fill(); say(); }, Math.max(delay, bubble.dataset.who ? 250 : 0));
    }
    onLine && onLine(l, idx);
  };

  nextBtn.onclick = (e) => {
    e.stopPropagation();
    sfx('click');
    if (waiting) return;
    nextBtn.classList.remove('pulse');
    if (typing) { finishTyping(); pulseUntilClicked(nextBtn); return; }
    i++;
    if (i < lines.length) show(i);
    else {
      nextBtn.onclick = null;
      Idle.clear();
      onDone && onDone();
    }
  };

  delete bubble.dataset.who;
  setTimeout(() => show(0), 900);
}

/* ---------------- Screen 1: Title + narrator ---------------- */
const btnStart = $('#btn-start');
const nextTitle = $('#next-title');

/* ---------------- Cover page ---------------- */
const coverStart = $('#cover-start');
(() => {
  const tw = $('#cover-twinkles');
  const spots = [[360, 120], [1560, 110], [470, 400], [1500, 420], [960, 60], [300, 260], [1640, 280], [1180, 470]];
  spots.forEach(([x, y], i) => {
    const t = document.createElement('i');
    t.textContent = '✦';
    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    t.style.fontSize = `${28 + (i % 3) * 14}px`;
    t.style.animationDelay = `${i * 0.35}s`;
    tw.appendChild(t);
  });
})();
// Title voice-over: a little jingle, then the title is announced with sparkles.
// Browsers block sound until the first tap, so we try on load and again on
// the first tap anywhere on the cover.
const COVER_VO = { id: 'cover_title', who: 'Title', text: "Pikoo's... Locked Up Snacks!" };
let coverVoDone = false;
function announceTitle() {
  if (coverVoDone || !Sound.on || !$('#screen-cover').classList.contains('active')) return;
  const ctx = audioCtx();
  if (!ctx || ctx.state !== 'running') return;
  coverVoDone = true;
  sfx('correct');
  sfx('sparkle');
  $('#screen-cover').classList.add('announce');
  // the whole picture does a happy little bounce while the title is read
  $('#screen-cover .cover-bg').animate(
    [{ scale: 1 }, { scale: 1.03 }, { scale: 1 }, { scale: 1.02 }, { scale: 1 }],
    { duration: 1600, easing: 'ease-in-out', iterations: 2 }
  );
  starBurst(640, 170, 10);
  starBurst(1280, 170, 10);
  setTimeout(() => {
    speak(COVER_VO.id, COVER_VO.who, COVER_VO.text, null, () => $('#screen-cover').classList.remove('announce'));
    starBurst(960, 300, 16);
  }, 650);
  setTimeout(() => $('#screen-cover').classList.remove('announce'), 5000);
}
// No sound before the first tap: the title is read once the cover is tapped
$('#screen-cover').addEventListener('pointerdown', (e) => {
  if (!coverStart.contains(e.target)) setTimeout(announceTitle, 50);
});
// say it again if nobody has tapped Start for a while
setInterval(() => {
  if ($('#screen-cover').classList.contains('active') && coverVoDone) { coverVoDone = false; announceTitle(); }
}, 20000);

coverStart.addEventListener('click', async () => {
  sfx('click');
  coverStart.style.pointerEvents = 'none';
  await irisTransition(() => {
    showScreen('screen-title', true);
    btnStart.click(); // straight into the narrator scene
  });
});

btnStart.addEventListener('click', () => {
  sfx('click');
  btnStart.classList.remove('pulse');
  btnStart.classList.add('btn-gone');
  Idle.clear();
  // Camera pushes in on Mr. Shells and the snack shelf while the narrator speaks
  $('#cam-title').classList.add('focus');
  let shown = false;
  const showNext = () => {
    if (shown) return;
    shown = true;
    setTimeout(() => pageFlip('screen-title', goStory1), STORY_PAUSE);
  };
  speak(NARRATOR_1.id, NARRATOR_1.who, NARRATOR_1.text, null, showNext); // voice only: no box on the title screen
  setTimeout(showNext, 9500); // fallback when sound is off / unsupported
});

nextTitle.addEventListener('click', () => {
  sfx('click');
  nextTitle.classList.remove('pulse');
  nextTitle.classList.add('btn-gone');
  Idle.clear();
  goStory1();
});

/* ---------------- Screen 2: Story 1 ---------------- */
function goStory1() {
  stopVoice();
  $('#pikoo-actor').classList.remove('in');
  showScreen('screen-story1', true);
  setTimeout(() => {
    runDialogue($('#speech-story1'), $('#next-story1'), STORY_1, {
      auto: true,
      onDone: () => pageFlip('screen-story1', goStory2),
    });
  }, 900);
}

/* ---------------- Screen 3: Story 2 ---------------- */
function setRings(list) {
  document.querySelectorAll('.lock-ring').forEach((r, idx) => {
    const n = Number(r.dataset.lock);
    const on = list.includes(n);
    if (on && !r.classList.contains('show')) {
      setTimeout(() => { r.classList.add('show'); sfx('sparkle'); }, idx * 220);
    } else if (!on) {
      r.classList.remove('show');
    }
  });
}

// Neeli's float-and-tap tour; returns its length in ms
function neeliTour(actor) {
  const sc = 0.62;
  const noseX = 690 * sc; // tip of her head (char_neeli.png, mirrored, 706px wide)
  const noseY = 100 * sc;
  const lockEdge = 1012;
  const tf = (x, y, k, r) => `translate(${x}px, ${y}px) scale(${k}) rotate(${r}deg)`;
  const near = (ly) => tf(lockEdge - 70 - noseX, ly - noseY, sc, -3);
  const touch = (ly) => tf(lockEdge - noseX + 6, ly - noseY, sc, 2);
  const home = tf(NEELI_HOME.x, NEELI_HOME.y, 1, 0);
  const T = 5600;
  const frames = [
    [0, home], [1400, near(LOCK_Y[0])], [1700, touch(LOCK_Y[0])], [2000, near(LOCK_Y[0])],
    [2600, near(LOCK_Y[1])], [2900, touch(LOCK_Y[1])], [3200, near(LOCK_Y[1])],
    [3800, near(LOCK_Y[2])], [4100, touch(LOCK_Y[2])], [4400, near(LOCK_Y[2])],
    [T, home],
  ];
  actor.animate(frames.map(([t, transform]) => ({ transform, offset: t / T, easing: 'ease-in-out' })), { duration: T });
  [1700, 2900, 4100].forEach((t, k) => setTimeout(() => tapLock(k + 1), t));
  return T;
}

function tapLock(n) {
  const y = LOCK_Y[n - 1];
  $(`.lock-ring[data-lock="${n}"]`).classList.add('show');
  const r = document.createElement('div');
  r.className = 'tap-ripple';
  r.style.left = '1068px';
  r.style.top = `${y}px`;
  $('#zoom-wrap').appendChild(r);
  setTimeout(() => r.remove(), 800);
  sparkles(1068, y, 10, 90);
  sfx('pop');
}

// Shrink a bubble's text (if needed) so the full line fits inside the bubble's text area.
// Measured with the complete line before it is typed in, so it never grows past the edges.
// Bubbles type in whole words, so half-typed punctuation like "me! ." never shows
function nextWordEnd(text, c) {
  let i = c;
  while (i < text.length && text[i] === ' ') i++;
  while (i < text.length && text[i] !== ' ') i++;
  return i;
}

function fitBubbleText(lineEl, text) {
  lineEl.style.fontSize = '';
  lineEl.textContent = text;
  const img = lineEl.parentElement.querySelector('.speech-bg');
  if (img && !img.complete) img.decode?.().catch(() => {});
  let size = parseFloat(getComputedStyle(lineEl).fontSize);
  const range = document.createRange();
  const tooBig = () => {
    range.selectNodeContents(lineEl);
    const t = range.getBoundingClientRect();
    const b = lineEl.getBoundingClientRect();
    return t.height > b.height + 1 || t.width > b.width + 1;
  };
  let guard = 0;
  while (guard++ < 30 && size > 18 && tooBig()) {
    size -= 1;
    lineEl.style.fontSize = `${size}px`;
  }
}

function showBubble(bubble, l) {
  const look = BUBBLES[l.who];
  bubble.className = `speech ${look.cls}`;
  Object.assign(bubble.style, { left: `${l.at.left}px`, top: `${l.at.top}px`, width: `${l.at.width}px` });
  $('.speech-bg', bubble).src = look.img;
  const lineEl = $('.line', bubble);
  fitBubbleText(lineEl, l.text);
  lineEl.textContent = '';
  void bubble.offsetWidth;
  bubble.classList.add('show');
  sfx('bubble');
  let c = 0;
  const t = setInterval(() => {
    c = nextWordEnd(l.text, c);
    lineEl.textContent = l.text.slice(0, c);
    if (c >= l.text.length) clearInterval(t);
  }, 110);
}

function goStory2() {
  $('#speech-story1').classList.remove('show');
  const bubble = $('#speech-story2');
  const nextBtn = $('#next-story2');
  const actor = $('#neeli-actor');
  bubble.classList.remove('show');
  nextBtn.classList.add('btn-gone');
  setRings([]);
  actor.getAnimations().forEach((a) => a.cancel());
  showScreen('screen-story2', true);

  setTimeout(() => {
    let voDone = false;
    let tourDone = false;
    let going = false; // the voice-end event and the fallback timer can both fire — only go once
    const ready = () => {
      if (!voDone || !tourDone || going) return;
      going = true;
      // Story done: 2 s after Neeli finishes, zoom into the first lock by itself
      setTimeout(zoomToFirstLock, 2000);
    };
    speak(NEELI_3.id, NEELI_3.who, NEELI_3.vo, null, () => { voDone = true; ready(); });
    // fallback if no end event: never cut her off — wait until nothing is speaking
    const fallback = () => { if (voDone) return; if (isSpeaking()) { setTimeout(fallback, 250); return; } voDone = true; ready(); };
    setTimeout(fallback, Sound.on ? 11000 : 6500);
    const T = neeliTour(actor);
    setTimeout(() => { showBubble(bubble, NEELI_3); tourDone = true; ready(); }, T);
  }, 700);

  nextBtn.onclick = (e) => {
    e.stopPropagation();
    sfx('click');
    nextBtn.classList.remove('pulse');
    nextBtn.onclick = null;
    Idle.clear();
    zoomToFirstLock();
  };
}

/* ---------------- Zoom into lock 1 + transition ---------------- */
let zoomingToLock = false;
async function zoomToFirstLock() {
  if (zoomingToLock) return; // never start Lock 1 twice
  zoomingToLock = true;
  setTimeout(() => { zoomingToLock = false; }, 6000);
  stopVoice();
  $('#speech-story2').classList.remove('show');
  $('#next-story2').classList.add('btn-gone');
  setRings([1]);
  sfx('sparkle');
  sparkles(1068, 300, 18, 160);
  await wait(650);

  const zw = $('#zoom-wrap');
  sfx('whoosh');
  zw.classList.add('zooming');
  await wait(1450);

  await irisTransition(() => {
    showScreen('screen-game', true);
    zw.classList.remove('zooming');
    setRings([]);
    startGame(true);
  });
}

// Golden iris burst + rising bubbles; `swap` runs while the screen is covered
async function irisTransition(swap) {
  const tr = $('#transition');
  const tb = $('.trans-bubbles', tr);
  tb.innerHTML = '';
  for (let i = 0; i < 46; i++) {
    const b = document.createElement('span');
    const size = 24 + Math.random() * 80;
    b.className = 'bubble';
    b.style.width = b.style.height = `${size}px`;
    b.style.left = `${Math.random() * 100}%`;
    b.style.animationDelay = `${Math.random() * 0.5}s`;
    tb.appendChild(b);
  }
  tr.classList.remove('close');
  tr.classList.add('open');
  sfx('splash');
  await wait(800);
  swap();
  tr.classList.remove('open');
  tr.classList.add('close');
  await wait(1400);
  tr.classList.remove('close');
  tb.innerHTML = '';
}

/* ---------------- Game ---------------- */
const game = $('#screen-game');
const choiceA = $('#choice-a');
const choiceB = $('#choice-b');
const btnBegin = $('#btn-begin');
const instructionEl = $('#instruction-text');
const chipEl = $('#speaker-chip');
const avatarEl = $('#avatar');
const pinsEl = $('#pins');
const socketsEl = $('#sockets');
const progressText = $('#progress-text');
const handEl = $('#hand');
const board = $('#board');

const state = { level: 0, attempts: 0, busy: true, phase: 'howto', order: [], pins: [], sockets: [] };

// Which lock the game screen is showing (1 = The Pins, 2 = The Code)
let currentLock = 1;
function setMode(n) {
  currentLock = n;
  game.classList.toggle('mode-lock2', n === 2);
  game.classList.toggle('mode-lock3', n === 3);
  // Lock 2 uses its own locker artwork (assets/images/lock2_board.png)
  $('.lock-board').src = n === 2 ? 'assets/images/lock2_board.png?v=2' : 'assets/images/lock_board.png';
  $('.level-panel span').textContent = ['Lock 1 - The Pins', 'Lock 2 - The Code', 'Lock 3 - The Shell-Lights'][n - 1];
}

/* ---------------- Question stays readable ----------------
   The idle reminder is a separate little tag under the panel, so the
   question never disappears. Tapping the panel re-shows and re-reads it. */
let currentQuestion = null; // { line, voId }
function setQuestion(line, voId = line.id) { currentQuestion = { line, voId }; }

const nudgeEl = document.createElement('div');
nudgeEl.className = 'nudge-tag';
$('#top-panel').appendChild(nudgeEl);
let nudgeTimer = null;
function showNudge(line) {
  // idle reminder: spoken, and shown in the instruction panel until the question comes back
  lastInstrText = line.text;
  sayInPanel(Object.assign({ restore: true }, line), line.id);
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(() => nudgeEl.classList.remove('show'), 4500);
}

$('#top-panel').addEventListener('click', () => {
  if (!currentQuestion || !game.classList.contains('active')) return;
  sfx('click');
  nudgeEl.classList.remove('show');
  setInstruction(currentQuestion.line, currentQuestion.voId);
});

// Feedback line: resolves only after its voice has fully finished (or a reading-time fallback)
function sayFeedback(line, voId = line.id) {
  line = Object.assign({}, line, { voiceOnly: true }); // correct-answer feedback: voice-over only
  return new Promise((res) => {
    let done = false;
    const fin = () => { if (!done) { done = true; setTimeout(res, 500); } };
    setInstruction(line, voId, fin);
    // fallback for when no 'end' event arrives: after the reading time, wait until nothing is speaking
    const poll = () => { if (done) return; if (!isSpeaking()) fin(); else setTimeout(poll, 200); };
    setTimeout(poll, Sound.on ? 1500 + line.text.length * 75 : 1500 + line.text.length * 50); // sound off: time to read the caption
    setTimeout(fin, 20000); // hard safety
  });
}

let lastInstrText = ''; // last line said in the panel (shown or voice-only)

// Put text in the panel without speaking it
function showPanelText(text, who = 'Neeli') {
  chipEl.textContent = who;
  chipEl.style.background = SPEAKERS[who].color;
  instructionEl.textContent = text;
  $('#top-panel').classList.toggle('empty', !text); // no text: hide the bar until there is some
  if (text) $('#top-panel').classList.remove('slide-away');
  instructionEl.classList.toggle('long', text.length > 60);
  instructionEl.style.fontSize = '';
  let fs = parseFloat(getComputedStyle(instructionEl).fontSize);
  while (fs > 22 && (instructionEl.scrollHeight > instructionEl.clientHeight + 1 || instructionEl.scrollWidth > instructionEl.clientWidth + 1)) {
    fs -= 1;
    instructionEl.style.fontSize = `${fs}px`;
  }
}

function setInstruction(line, voId = line.id, onEnd) {
  lastInstrText = line.text;
  // Lines that are voice-over only (not orange in the dialogue sheet): speak, but keep the panel text
  if (line.voiceOnly) {
    if (line._intro) lockPlay(true); // still can't play while the intro is being read
    avatarEl.classList.remove('talk');
    void avatarEl.offsetWidth;
    avatarEl.classList.add('talk');
    if (line.noCaption) { speak(voId, line.who, line.vo || line.text, null, onEnd); return; }
    // spoken AND shown in the instruction panel (readable with the sound off)
    sayInPanel(line, voId, onEnd);
    return;
  }
  const isPikoo = line.who === 'Pikoo';
  avatarEl.src = isPikoo ? 'assets/images/pikoo.png' : 'assets/images/neeli_avatar.png';
  avatarEl.classList.toggle('is-pikoo', isPikoo);
  chipEl.textContent = line.who;
  chipEl.style.background = SPEAKERS[line.who].color;
  instructionEl.textContent = line.text;
  $('#top-panel').classList.toggle('empty', !line.text);
  if (line.text) $('#top-panel').classList.remove('slide-away');
  instructionEl.classList.toggle('long', line.text.length > 60);
  // shrink the text a little if it would spill out of the panel
  instructionEl.style.fontSize = '';
  let fs = parseFloat(getComputedStyle(instructionEl).fontSize);
  while (fs > 22 && (instructionEl.scrollHeight > instructionEl.clientHeight + 1 || instructionEl.scrollWidth > instructionEl.clientWidth + 1)) {
    fs -= 1;
    instructionEl.style.fontSize = `${fs}px`;
  }
  instructionEl.classList.remove('swap');
  void instructionEl.offsetWidth;
  instructionEl.classList.add('swap');
  avatarEl.classList.remove('talk');
  void avatarEl.offsetWidth;
  avatarEl.classList.add('talk');
  // While the question (or its intro) is being read, the level can't be played yet
  const isPrompt = line._intro || (currentQuestion && line.text === currentQuestion.line.text);
  if (isPrompt) lockPlay(true);
  let ended = false;
  const done = (...a) => {
    if (ended) return;
    ended = true;
    if (isPrompt && !line._intro) lockPlay(false);
    if (onEnd) onEnd(...a);
  };
  speak(voId, line.who, line.text, null, done);
  if (isPrompt && !line._intro) {
    // fallback if no voice / no end event: unlock after the line's reading time
    setTimeout(() => { if (!ended && !isSpeaking()) done(); }, Sound.on ? 1500 + line.text.length * 75 : 300);
    setTimeout(() => { if (!ended) done(); }, 15000);
  }
}

// Voice-only line shown in the instruction panel while it is said. With `restore`, the
// question comes back once the line has been heard and read (Oops!, nudges, the hand);
// praise and intros simply stay until the next line replaces them.
let panelFlash = 0;
function sayInPanel(line, voId, onEnd) {
  const token = ++panelFlash;
  showPanelText(line.text);
  instructionEl.classList.remove('swap');
  void instructionEl.offsetWidth;
  instructionEl.classList.add('swap');
  const readUntil = performance.now() + 1500 + line.text.length * 50;
  const restore = () => {
    if (!line.restore) return;
    setTimeout(() => {
      if (token !== panelFlash || lastInstrText !== line.text || !currentQuestion) return;
      showPanelText(currentQuestion.line.text, currentQuestion.line.who);
      instructionEl.classList.remove('swap');
      void instructionEl.offsetWidth;
      instructionEl.classList.add('swap');
    }, Math.max(300, readUntil - performance.now()));
  };
  speak(voId, line.who, line.vo || line.text, null, (...a) => { restore(); if (onEnd) onEnd(...a); });
  if (!Sound.on) restore();
}

// Lock all level input (pins, shells, cards, Enter) until the voice-over is done
function lockPlay(on) { game.classList.toggle('vo-lock', on); }

// How-to line(s) play first while the round is already on screen; then the
// round's own instruction follows — unless the child has already answered.
function playIntro(lines, after, afterVoId) {
  const list = Array.isArray(lines) ? lines : [lines];
  let k = 0;
  const step = () => {
    if (k > 0 && lastInstrText !== list[k - 1].text) return; // feedback took over
    if (k === list.length) { setInstruction(after, afterVoId); return; }
    const l = Object.assign({ _intro: true }, list[k++]);
    let done = false;
    const next = () => { if (!done) { done = true; setTimeout(step, 250); } };
    setInstruction(l, l.id, next);
    setTimeout(next, Sound.on ? 1800 + l.text.length * 80 : 1200 + l.text.length * 55);
  };
  // voice-only intro: the task prompt is already on screen while the intro is read
  if (list[0].voiceOnly && after) showPanelText(after.text, after.who);
  step();
}

function buildPins() {
  pinsEl.innerHTML = '';
  state.pins = PIN_POS.map(([x, y], i) => {
    const img = document.createElement('img');
    img.src = 'assets/images/pin.png';
    img.className = 'pin drop';
    img.alt = '';
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.animationDelay = `${0.9 + i * 0.09}s`;
    pinsEl.appendChild(img);
    return img;
  });
}

function buildSockets(count = LEVELS.length) {
  socketsEl.innerHTML = '';
  // 8 sockets (lock 2) sit a little closer together so they still fit before the text
  const step = count > 7 ? 27.5 : SOCKET_STEP;
  socketsEl.classList.toggle('eight', count > 7);
  state.sockets = Array.from({ length: count }, (_, i) => {
    const s = document.createElement('div');
    s.className = 'socket';
    s.style.left = `${SOCKET_X0 + step * i}px`;
    s.style.top = `${SOCKET_Y}px`;
    socketsEl.appendChild(s);
    return s;
  });
}

function setProgress(n) {
  progressText.textContent = `${n} / 7 pins released`;
  progressText.classList.remove('bump');
  void progressText.offsetWidth;
  progressText.classList.add('bump');
}

function startGame(withEntrance) {
  setMode(1);
  state.level = 0;
  state.attempts = 0;
  state.busy = true;
  state.phase = 'howto';
  buildPins();
  buildSockets();
  progressText.textContent = '0 / 7 pins released';
  [choiceA, choiceB].forEach((c) => { c.className = 'choice hidden'; });
  hideHand();
  $('#win').classList.remove('show');
  board.classList.remove('unlocked', 'shine');

  if (withEntrance) {
    game.classList.remove('enter');
    void game.offsetWidth;
    game.classList.add('enter');
    setTimeout(() => game.classList.remove('enter'), 1600);
  }

  btnBegin.classList.add('hidden');
  // No Next button: the first numbers appear right away under the how-to line
  setTimeout(() => {
    state.phase = 'play';
    loadLevel(0, HOW_TO); // intro (on screen + voice), then the task prompt
  }, withEntrance ? 1000 : 300);
}

btnBegin.addEventListener('click', () => {
  sfx('click');
  btnBegin.classList.remove('pulse');
  btnBegin.classList.add('hidden');
  if (currentLock === 2) { lock2Begin(); return; } // js/lock2.js
  if (currentLock === 3) { lock3Begin(); return; } // js/lock3.js
  state.phase = 'play';
  loadLevel(0);
});

function loadLevel(i, intro) {
  state.level = i;
  state.attempts = 0;
  const L = LEVELS[i];
  // Keep level 1 as in the design; shuffle sides afterwards so the answer
  // is not always on the same side.
  state.order = i === 0 || Math.random() < 0.5 ? [...L.nums] : [L.nums[1], L.nums[0]];
  const big = toNumber(state.order[0]) > toNumber(state.order[1]) ? 0 : 1;
  state.correct = big;

  const first = choiceA.classList.contains('hidden');
  [choiceA, choiceB].forEach((c, idx) => {
    c.classList.remove('right', 'wrong', 'idle', 'locked');
    if (first) {
      $('.num', c).textContent = state.order[idx];
      setTimeout(() => c.classList.remove('hidden'), idx * 140);
    } else {
      c.classList.remove('flip');
      void c.offsetWidth;
      c.classList.add('flip');
      setTimeout(() => { $('.num', c).textContent = state.order[idx]; }, 270);
    }
  });

  state.pins.forEach((p, idx) => p.classList.toggle('next', idx === i));
  setQuestion(INSTRUCTION);
  if (intro) playIntro(intro, INSTRUCTION);
  else setInstruction(INSTRUCTION);
  state.busy = false;
  armGameIdle();
}

function armGameIdle(ms = IDLE_MS) {
  Idle.arm(ms, () => {
    if (state.busy || state.phase !== 'play') return;
    showNudge(IDLE);
    [choiceA, choiceB].forEach((c) => c.classList.add('idle'));
    armGameIdle(IDLE_REPEAT_MS);
  });
}

[choiceA, choiceB].forEach((c, idx) => {
  c.addEventListener('click', () => {
    if (state.busy || state.phase !== 'play') return;
    [choiceA, choiceB].forEach((x) => x.classList.remove('idle'));
    if (idx === state.correct) onCorrect(c);
    else onWrong(c);
  });
});

function onWrong(el) {
  state.attempts++;
  sfx('wrong');
  el.classList.remove('wrong');
  void el.offsetWidth;
  el.classList.add('wrong');
  setTimeout(() => el.classList.remove('wrong'), 750);

  if (state.attempts === 1) {
    setInstruction(WRONG_1);
  } else if (state.attempts === 2) {
    setInstruction(WRONG_2);
    state.busy = true;
    setTimeout(openHint, 800);
  } else {
    const answer = state.order[state.correct];
    setInstruction(
      { who: 'Neeli', text: `Hey… The bigger one is ${answer} - tap this one.`, voiceOnly: true, restore: true },
      'l1_hand'
    );
    showHand(state.correct === 0 ? choiceA : choiceB);
  }
  armGameIdle();
}

async function onCorrect(el) {
  state.busy = true;
  Idle.clear();
  hideHand();
  [choiceA, choiceB].forEach((c) => c.classList.add('locked'));
  el.classList.add('right');
  sfx('correct');
  const c = stageCenter(el);
  starBurst(c.x, c.y, 12);
  const i = state.level;
  const fbDone = state.attempts > 0 ? sayFeedback(RETRY_FB) : sayFeedback(LEVELS[i].fb, `l${i + 1}_correct`);

  await popPin(i);
  setProgress(i + 1);
  await Promise.all([fbDone, wait(1400)]);

  if (i < LEVELS.length - 1) {
    loadLevel(i + 1);
  } else {
    finale();
  }
}

/* Pin pops off the lock track and falls into its socket in the
   bottom-right panel. */
function popPin(i) {
  return new Promise((resolve) => {
    const pin = state.pins[i];
    pin.classList.remove('next', 'drop');
    pin.classList.add('flying');
    sfx('pinpop');
    const [px, py] = PIN_POS[i];
    const sx = px + PIN_W / 2;
    const sy = py + PIN_H / 2;
    const tx = PANEL.x + SOCKET_X0 + SOCKET_STEP * i;
    const ty = PANEL.y + SOCKET_Y - 16; // centre of the landed pin (see .socket-pin)
    const dx = tx - sx;
    const dy = ty - sy;
    const endScale = 58 / PIN_W;

    sparkles(sx, sy - 10, 12, 110);

    const anim = pin.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', easing: 'cubic-bezier(.2,.9,.4,1)' },
        { transform: 'translate(0,-150px) scale(1.3) rotate(-25deg)', offset: 0.22, easing: 'cubic-bezier(.5,0,.8,.6)' },
        { transform: `translate(${dx * 0.55}px, ${-60 + dy * 0.25}px) scale(1) rotate(200deg)`, offset: 0.55, easing: 'cubic-bezier(.4,0,1,1)' },
        { transform: `translate(${dx}px, ${dy - 26}px) scale(${endScale * 1.15}) rotate(360deg)`, offset: 0.88, easing: 'ease-out' },
        { transform: `translate(${dx}px, ${dy}px) scale(${endScale}) rotate(360deg)` },
      ],
      { duration: 1350, fill: 'forwards' }
    );

    anim.onfinish = () => {
      pin.style.visibility = 'hidden';
      anim.cancel();
      const socket = state.sockets[i];
      const landed = document.createElement('img');
      landed.src = 'assets/images/pin.png';
      landed.className = 'socket-pin land';
      landed.alt = '';
      socket.appendChild(landed);
      socket.classList.add('lit');
      sfx('land');
      sparkles(tx, PANEL.y + SOCKET_Y, 10, 60);
      resolve();
    };
  });
}

function showHand(target) {
  const x = parseFloat(target.style.left) + 290;
  const y = parseFloat(target.style.top) + 140;
  handEl.style.left = `${x}px`;
  handEl.style.top = `${y}px`;
  handEl.classList.add('show');
}
function hideHand() { handEl.classList.remove('show'); }

/* ---------------- Hint screen ---------------- */
function openHint() {
  const rows = $('#hint-rows');
  const verdict = $('#hint-verdict');
  $('.hint-line').style.display = '';
  $('.hint-line').textContent = WRONG_2.text;
  rows.innerHTML = '';
  verdict.textContent = '';
  const digits = state.order.map((n) => n.replace(/,/g, ''));
  const maxLen = Math.max(...digits.map((d) => d.length));
  const rowEls = digits.map((d) => {
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

  const tiles = rowEls.map((r) => [...r.querySelectorAll('.digit:not(.ghost)')]);
  tiles.flat().forEach((t, k) => setTimeout(() => t.classList.add('in'), 300 + k * 60));
  const revealAt = 300 + tiles.flat().length * 60 + 400;

  setTimeout(() => {
    if (digits[0].length !== digits[1].length) {
      const longer = digits[0].length > digits[1].length ? 0 : 1;
      rowEls[longer].classList.add('longer');
      verdict.textContent = 'Different number of the digits - more digits means a bigger number!';
    } else {
      let k = 0;
      while (k < digits[0].length && digits[0][k] === digits[1][k]) k++;
      tiles.forEach((row) => row.forEach((t, idx) => {
        if (idx < k) t.classList.add('same');
        if (idx === k) t.classList.add('focus');
      }));
      verdict.textContent = 'Both the numbers have the same length. Look at the first digits from the left that are different. Which one is bigger?';
    }
  }, revealAt);
}

$('#btn-hint-ok').addEventListener('click', () => {
  sfx('click');
  $('#hint').classList.remove('show');
  if (currentLock === 2) { lock2HintClosed(); return; } // js/lock2.js
  if (currentLock === 3) { lock3HintClosed(); return; } // js/lock3.js
  state.busy = false;
  armGameIdle();
});

/* ---------------- Lock open ---------------- */
async function finale() {
  state.phase = 'done';
  state.pins.forEach((p) => p.classList.remove('next'));
  await wait(200);
  lockComplete(1); // straight to the celebration (no extra "SEE? Wasn't me!" screen) // celebration → shelf → lock 2 (js/lock2.js)
}

function throwConfetti() {
  confettiBurst(); // js/fx.js
}
