/* =========================================================
   Character in the instruction panel (all 3 locks): the updated
   Neeli / Pikoo artwork, sitting in the gold circle.
   - blinks automatically (eyelid layer, js/blink.js)
   - talking: gentle nodding while the voice plays
   - happy (right answer): a happy bounce
   - sad (wrong answer): droops and tilts for a moment
   ========================================================= */
const AV_CHARS = {
  // Neeli = the blue whale (neeli updated) talk + blink sprite sheet (8 frames, 463x291 each)
  Neeli: { strip: 'assets/images/neeli_talk_blink_strip.png', frames: 8, fw: 463, fh: 291, left: 130, top: 102, width: 250, clip: 'circle(110px at 138px 73px)' },
  Pikoo: { src: 'assets/images/char_pikoo.png', key: 'pikoo', mirror: false, left: 150, top: 70, width: 236 },
};
Object.values(AV_CHARS).forEach((c) => { const i = new Image(); i.src = c.src || c.strip; });
const NEELI_TALK = [0, 1, 2, 1, 3, 2, 1, 0]; // top row: mouth moving
const NEELI_BLINK = [5, 6, 6, 6, 5];
const NEELI_SAD_STRIP = 'assets/images/neeli_sad_blink_strip.png'; // wrong answer (same 463x291 cells)
const NEELI_SAD = [0, 1, 2, 1, 1, 3, 3, 5, 6, 5, 3]; // droop, sad mouth, sad blink
const NEELI_SAD_TALK = [1, 2, 1, 2, 3, 2, 1]; // still sad, mouth moving (a long hint keeps this face)
const NEELI_HAPPY_STRIP = 'assets/images/neeli_happy_anim_strip.png'; // right answer (6 frames, 463x291 cells)
const NEELI_HAPPY = [0, 1, 2, 3, 4, 5];
// Each sheet keeps its own layer (switched by opacity), so changing mood never repaints an
// undecoded image — swapping background-image used to flash an empty circle on wrong answers.
// A sheet is only shown once decoded; until then the previous sheet's frame stays up.
const NEELI_SHEETS = {
  [AV_CHARS.Neeli.strip]: { n: 8 },
  [NEELI_SAD_STRIP]: { n: 8 },
  [NEELI_HAPPY_STRIP]: { n: 6 },
};
Object.entries(NEELI_SHEETS).forEach(([src, s]) => {
  s.img = new Image();          // kept referenced so the decoded image stays in memory
  s.img.src = src;
  const ready = () => { s.ready = true; };
  (s.img.decode ? s.img.decode() : Promise.reject()).then(ready, () => s.img.addEventListener('load', ready, { once: true }));
});

const avatarImg = $('#avatar');
const sprite = document.createElement('div');
sprite.id = 'avatar-sprite';
sprite.className = 'avatar-sprite av2';
sprite.innerHTML = '<div class="av-inner"><img class="av-img" alt="" /><div class="av-frames"></div><div class="blink-layer av-blink"></div></div>';
avatarImg.after(sprite);
// soft underwater backdrop inside the gold circle, behind the character
const avDisc = document.createElement('div');
avDisc.className = 'av-disc';
avDisc.innerHTML = '<i></i><i></i><i></i>';
sprite.before(avDisc);
const avInner = $('.av-inner', sprite);
const avImg = $('.av-img', sprite);
const avBlink = $('.av-blink', sprite);
const avFrames = $('.av-frames', sprite);
// the old twin blink layer is not needed any more
const oldBlink = $('#avatar-blink');
if (oldBlink) {
  oldBlink.querySelectorAll('.blink-char').forEach((c) => {
    const i = blinkChars.findIndex((x) => x.el === c);
    if (i !== -1) blinkChars.splice(i, 1);
  });
  oldBlink.remove();
}

const av = { who: '', mood: 'talk', moodUntil: 0, talkingUntil: 0 };

function showChar(who) {
  if (av.who === who) return;
  av.who = who;
  const c = AV_CHARS[who];
  Object.assign(sprite.style, { left: `${c.left}px`, top: `${c.top}px`, width: `${c.width}px`, height: 'auto', clipPath: c.clip || 'none' });
  avInner.classList.toggle('mirror', !!c.mirror);
  if (c.strip) {
    // sprite-sheet character: frames blink by themselves
    avImg.style.display = 'none';
    avFrames.style.display = 'block';
    avFrames.style.aspectRatio = `${c.fw} / ${c.fh}`;
    fillBlinkLayer(avBlink, 'none');
  } else {
    avImg.style.display = '';
    avFrames.style.display = 'none';
    avImg.src = c.src;
    fillBlinkLayer(avBlink, c.key);
  }
}
showChar('Neeli');

function setMood(mood, ms) {
  av.mood = mood;
  av.moodStart = performance.now();
  av.moodUntil = av.moodStart + ms;
}

Object.entries(NEELI_SHEETS).forEach(([src, s]) => {
  s.el = document.createElement('div');
  s.el.className = 'av-sheet';
  s.el.style.backgroundImage = `url(${src})`;
  s.el.style.backgroundSize = `${s.n * 100}% 100%`;
  avFrames.appendChild(s.el);
});
let avSheet = null; // sheet currently on screen

let nbNext = 0, nbStart = -1;
function neeliFrame(now, talking, sad, happy) {
  const want = NEELI_SHEETS[happy ? NEELI_HAPPY_STRIP : sad ? NEELI_SAD_STRIP : AV_CHARS.Neeli.strip];
  if (!want.ready && avSheet) return; // not decoded yet: keep the current frame rather than go blank
  if (avSheet !== want) {
    if (avSheet) avSheet.el.classList.remove('on');
    want.el.classList.add('on');
    avSheet = want;
    want.f = null;
  }
  let f = 0;
  if (happy) {
    f = NEELI_HAPPY[Math.floor((now - av.moodStart) / 140) % NEELI_HAPPY.length];
  } else if (sad) {
    const k = Math.floor((now - av.moodStart) / 200);
    if (k < NEELI_SAD.length) f = NEELI_SAD[k];
    else f = now < av.talkingUntil ? NEELI_SAD_TALK[Math.floor(now / 140) % NEELI_SAD_TALK.length] : NEELI_SAD[NEELI_SAD.length - 1];
  } else
  if (talking) { f = NEELI_TALK[Math.floor(now / 110) % NEELI_TALK.length]; nbStart = -1; }
  else {
    if (nbStart < 0 && now > nbNext) nbStart = now;
    if (nbStart >= 0) {
      const k = Math.floor((now - nbStart) / 90);
      if (k < NEELI_BLINK.length) f = NEELI_BLINK[k];
      else { nbStart = -1; nbNext = now + 1800 + Math.random() * 2600; }
    }
  }
  if (want.f !== f) {
    want.f = f;
    want.el.style.backgroundPosition = `${(f / (want.n - 1)) * 100}% 0`;
  }
}

function avatarLoop(now) {
  // a wrong answer keeps the sad face until its line (Oops / hint / nudge) has been spoken — never a smile mid-correction
  const moodOn = now < av.moodUntil || (av.mood === 'sad' && av.holdSad && now < av.talkingUntil);
  if (av.who === 'Neeli') neeliFrame(now, !moodOn && now < av.talkingUntil, moodOn && av.mood === 'sad', moodOn && av.mood === 'happy');
  const state = moodOn ? av.mood : (now < av.talkingUntil ? 'talking' : 'idle');
  if (sprite.dataset.state !== state) {
    sprite.dataset.state = state;
    sprite.classList.remove('st-talking', 'st-happy', 'st-sad', 'st-idle');
    sprite.classList.add(`st-${state}`);
  }
  requestAnimationFrame(avatarLoop);
}
requestAnimationFrame(avatarLoop);

/* ---------------- Hooks into the game ---------------- */
// Every instruction: switch speaker and move the mouth while the voice plays
const _setInstruction = setInstruction;
setInstruction = function (line, voId, onEnd) {
  // Every line in the instruction panel is Neeli's (shown and voiced as Neeli)
  if (line.who !== 'Neeli' && line.who !== 'Narrator') line = Object.assign({}, line, { who: 'Neeli', speaker: line.who });
  showChar('Neeli');
  // only the line a wrong answer triggers keeps the sad face; any other line (praise, repeat) talks normally
  av.holdSad = av.wrongLine;
  av.wrongLine = false;
  const est = 1000 + line.text.length * 65;
  av.talkingUntil = performance.now() + (Sound.on ? est + 4000 : est); // upper bound; trimmed when the voice ends
  return _setInstruction(line, voId, (...a) => {
    av.talkingUntil = 0;
    if (onEnd) onEnd(...a);
  });
};

// Right answer → happy Neeli; wrong answer → sad Neeli (same in all 3 locks)
function wrapMood(name, mood, ms) {
  const fn = window[name];
  if (typeof fn !== 'function') return;
  window[name] = function (...args) {
    setMood(mood, ms);
    if (mood === 'sad') av.wrongLine = true; // the Oops / hint / nudge said next keeps the sad face
    try { return fn.apply(this, args); } finally { av.wrongLine = false; }
  };
}
wrapMood('onCorrect', 'happy', 2800);   // lock 1
wrapMood('codeRight', 'happy', 2800);   // lock 2
// lock 3: happy Neeli is set inside setDone(), once the whole row is arranged
wrapMood('onWrong', 'sad', 2400);       // lock 1
wrapMood('lock2Wrong', 'sad', 2400);    // lock 2
wrapMood('wrongCard', 'sad', 2400);     // lock 3
