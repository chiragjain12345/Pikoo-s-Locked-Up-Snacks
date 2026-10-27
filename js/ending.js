/* =========================================================
   Ending: lock 3 opens → a note reveals who locked the snacks
   → the cafe doors swing open and the crowd walks in.
   Uses helpers from js/game.js and js/lock2.js.
   ========================================================= */

/* ---------------- Content (from the requirement sheet) ---------------- */
const REVEAL = [
  // The note already shows its words, so the bubble only says Neeli's reaction (her voice still reads the note)
  { id: 'end_neeli_read', who: 'Neeli', text: 'It was you, Pikoo!', vo: "'Snacks arranged and locked. - Pikoo.' It was you, Pikoo!", voiceOnly: true, at: { left: 133, top: 352, width: 600 } },
  { id: 'end_pikoo', who: 'Pikoo', text: 'OH. Right! I organised them this morning... and locked them... and forgot. Heh.', voiceOnly: true, flip: false, at: { left: 1380, top: 422, width: 520 } },
  { id: 'end_shells', who: 'Mr. Shells', text: 'The cafe is saved!', flip: true, at: { left: 1130, top: 250, width: 520 } },
];
const HAPPY_VO = { id: 'end_narrator', who: 'Narrator', text: 'Bravo! The cafe can finally open. The doors swing open and we can see a happy crowd of sea-creatures enjoying their favorite snacks!' };
const CROWD = ['🐠', '🐙', '🦀', '🐢', '🐡', '🦑', '🐬', '🦐', '🐟', '🦞', '🐳', '🪼'];

const revealBubble = $('#speech-end');
const happyBubble = $('#speech-happy');

function resetEnding() {
  const ev = $('#end-video');
  if (ev) { ev.pause(); ev.classList.remove('show', 'behind-doors'); ev.currentTime = 0; }
  $('#note').className = 'note';
  $('#pikoo-end').className = 'pikoo-from-right';
  $('#glass-door').className = 'glass-door';
  $('#shelf-open').className = 'shelf-open';
  $('#cam-reveal').className = 'cam';
  $('#doors').className = 'doors';
  $('#open-sign').className = 'open-sign';
  $('#end-banner').className = 'ost end-banner';
  $('#cam-happy').className = 'cam';
  $('#crowd').innerHTML = '';
  revealBubble.classList.remove('show');
  happyBubble.classList.remove('show');
  $('#lock1-sprite').className = 'lock1-sprite';
}

/* ---------------- 1) The reveal ---------------- */
async function goReveal() {
  stopVoice();
  // Transition to the cafe: the last lock is still on the cupboard
  await irisTransition(() => {
    $('#win').classList.remove('show');
    resetShelf(2);
    const lk = $('#lock1-sprite');
    lk.style.top = `${LOCK_Y[2] - 73}px`;
    lk.querySelectorAll('div').forEach((d) => { d.style.backgroundImage = 'url(assets/images/lock3_sprite.png)'; });
    $('#shelf-bg').style.backgroundImage = 'url(assets/images/screen3_story_bg_lock3_open.png)';
    showScreen('screen-shelf', true);
  });
  await wait(400);

  // The last lock opens
  const lk = $('#lock1-sprite');
  lk.classList.add('glow');
  sfx('sparkle');
  await wait(700);
  lk.classList.add('shake');
  await wait(650);
  lk.classList.remove('shake');
  lk.classList.add('open');
  sfx('unlock');
  sparkles(1068, LOCK_Y[2] - 50, 16, 130);
  await wait(800);
  lk.classList.add('fall');
  sfx('whoosh');
  await wait(700);
  confettiBurst();
  sfx('clap');
  sfx('win');
  await wait(1600);

  // Same picture without the lock — swap screens seamlessly, then the door slides open
  resetEnding();
  showScreen('screen-reveal', true);
  await wait(300);
  // The cupboard's glass door slides away, showing the open shelf behind it
  $('#shelf-open').classList.add('show');
  $('#glass-door').classList.add('open');
  sfx('whoosh');
  // As the shelf opens, the note pops out and flutters down — together with the
  // narrator's "The locker clicks open and a note flies down." (voice only)
  const note = $('#note');
  note.classList.add('out');
  const narr = sayLine({ id: 'finale_narrator_2', who: 'Narrator', text: 'The locker clicks open and a note flies down.' });
  await wait(400);
  sparkles(1400, 260, 22, 220);
  sfx('chime');
  await Promise.all([narr, wait(2700)]); // the note has landed (3 s fall)
  // it grows a little in place so it can be read
  note.classList.add('zoom');
  sfx('sparkle');
  await wait(700);

  // Neeli reads it out
  await sayIn(revealBubble, REVEAL[0]);
  note.classList.add('away');

  // Pikoo swims in from the right, a little guilty
  const pk = $('#pikoo-end');
  pk.classList.add('in');
  sfx('swim');
  await wait(3000);
  pk.classList.add('guilty');
  await sayIn(revealBubble, REVEAL[1]);
  pk.classList.remove('guilty');
  revealBubble.classList.remove('show');

  // Camera shifts over to Mr. Shells
  $('#cam-reveal').classList.add('to-shells');
  sfx('whoosh');
  await wait(1500);
  await sayIn(revealBubble, REVEAL[2]);
  sfx('correct');
  starBurst(1700, 560, 14);
  await wait(STORY_PAUSE);
  goHappy();
}

async function sayIn(bubble, l) {
  bubble.classList.remove('show');
  await wait(200);
  if (!l.voiceOnly) { // voiceOnly: spoken, no bubble
    showStoryBubble(bubble, l);
    if (l.flip === true) bubble.classList.add('flip');
  }
  await sayLine(l);
  await wait(250);
}

/* ---------------- 2) Happy ending: the cafe opens ---------------- */
async function goHappy() {
  stopVoice();
  await irisTransition(() => {
    resetEnding();
    showScreen('screen-happy', true);
    // the final video sits right behind the closed cafe doors
    const v = $('#end-video');
    v.currentTime = 0;
    v.classList.add('show', 'behind-doors');
  });
  await wait(600);

  // The doors swing open and the video starts playing straight away
  $('#doors').classList.add('open');
  sfx('unlock');
  sfx('whoosh');
  await playEndVideo(); // the game ends on the cafe video (no Play again button)
}

// Final video (assets/videos/last screen video.mp4) fades in over the open cafe and plays once
function playEndVideo() {
  const v = $('#end-video');
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setMusicOn(Sound.on);
      resolve();
    };
    stopVoice();
    setMusicOn(false);                 // let the video's own sound play
    v.currentTime = 0;
    v.muted = !Sound.on;
    v.classList.add('show');
    v.onended = finish;
    v.onerror = finish;
    v.play().catch(() => { v.muted = true; v.play().catch(finish); });
    setTimeout(() => { if (v.paused && v.currentTime === 0) finish(); }, 4000); // never get stuck
  });
}

// Small life in the finished cafe picture: hearts float up from the happy
// customers, stars twinkle on the cupcakes, bubbles rise from the diners.
const HEART_SPOTS = [[230, 600], [482, 650], [1102, 590], [1320, 680], [1584, 560], [1791, 720], [880, 520]];
const TWINKLE_SPOTS = [[821, 396], [878, 396], [932, 396], [818, 503], [941, 503], [360, 720], [1520, 755], [1555, 755], [1000, 575]];
function walkCrowd() {
  const fx = $('#happy-fx');
  fx.innerHTML = '';
  TWINKLE_SPOTS.forEach(([x, y], i) => {
    const t = document.createElement('i');
    t.className = 'hf-twinkle';
    t.textContent = '✦';
    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    t.style.animationDelay = `${(i * 0.37) % 2}s`;
    fx.appendChild(t);
  });
  const spawn = () => {
    if (!$('#screen-happy').classList.contains('active')) return;
    const [x, y] = HEART_SPOTS[Math.floor(Math.random() * HEART_SPOTS.length)];
    const h = document.createElement('i');
    const heart = Math.random() < 0.6;
    h.className = heart ? 'hf-heart' : 'hf-bubble';
    if (heart) h.textContent = ['💖', '💛', '💜', '💙'][Math.floor(Math.random() * 4)];
    h.style.left = `${x + (Math.random() * 60 - 30)}px`;
    h.style.top = `${y}px`;
    fx.appendChild(h);
    h.addEventListener('animationend', () => h.remove());
    setTimeout(spawn, 380 + Math.random() * 420);
  };
  spawn();
}

