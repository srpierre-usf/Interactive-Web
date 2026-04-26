// HOW IT WORKS:
// A random country is picked each page load from LANGUAGES.
// The correct word + 5 distractors are scattered in the dashed box.
// The player drags a word onto the grey line to answer.
// Correct = green flash + next button activates.
// Wrong   = red shake, word returns to box.

// Language data
const LANGUAGES = [
  { country: 'English',  word: 'Hello',   image: 'images/Interactive-Web_Tiny-Person_ENGLISH.png'  },
  { country: 'French',   word: 'Salut',   image: 'images/Interactive-Web_Tiny-Person_FRENCH.png'   },
  { country: 'Danish',   word: 'Hej',     image: 'images/Interactive-Web_Tiny-Person_DANISH.png'   },
  { country: 'German',   word: 'Hallo',   image: 'images/Interactive-Web_Tiny-Person_GERMAN.png'   },
  { country: 'Greek',    word: 'Gia Sou', image: 'images/Interactive-Web_Tiny-Person_GREEK.png'    },
  { country: 'Tagalog',  word: 'Hoy',     image: 'images/Interactive-Web_Tiny-Person_TAGALOG.png'  },
];

// Pick a random language each load
// (avoids repeating the same one as previous page if stored)
const prevCountry = sessionStorage.getItem('lastCountry') || '';
let pool = LANGUAGES.filter(l => l.country !== prevCountry);
const chosen = pool[Math.floor(Math.random() * pool.length)];
sessionStorage.setItem('lastCountry', chosen.country);

// Update the mascot image
document.getElementById('mascot-img').src = chosen.image;
document.getElementById('mascot-img').alt  = chosen.country + ' character';

// Build word list: correct + all others shuffled
function buildWords() {
  const allWords = LANGUAGES.map(l => l.word);
  // shuffle
  for (let i = allWords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
  }
  return allWords; // always contains the correct answer somewhere
}

// State
let words        = [];
let dragging     = null;   // { index, offsetX, offsetY }
let droppedIndex = -1;     // which word is on the line (-1 = none)
let answered     = false;
let shakeWord    = -1;     // index of word currently shaking
let shakeTimer   = 0;

const LINE_ZONE = { x: 0, y: 0, w: 0, h: 0 }; // set in setup

// p5 setup
function setup() {
  const cnv = createCanvas(windowWidth, windowHeight * 0.55);
  cnv.parent('p5-canvas');

  textFont('Space Grotesk');
  buildWordObjects();
  updateLineZone();
}

function buildWordObjects() {
  const raw = buildWords();

  // Box occupies right ~55% of canvas, vertically centred
  const boxX = width * 0.32;
  const boxY = height * 0.08;
  const boxW = width * 0.40;
  const boxH = height * 0.75;

  // Scatter words in a loose grid inside the box
  const cols = 2;
  const cellW = boxW / cols;
  const cellH = boxH / Math.ceil(raw.length / cols);

  words = raw.map((w, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jitterX = (Math.random() - 0.5) * cellW * 0.3;
    const jitterY = (Math.random() - 0.5) * cellH * 0.3;
    return {
      text:     w,
      x:        boxX + col * cellW + cellW * 0.25 + jitterX,
      y:        boxY + row * cellH + cellH * 0.5  + jitterY,
      homeX:    0,   // set after
      homeY:    0,
      onLine:   false,
    };
  });

  // Store home positions
  words.forEach(w => { w.homeX = w.x; w.homeY = w.y; });
}

function updateLineZone() {
  const lineEl = document.getElementById('answer-line');
  if (!lineEl) return;
  const r   = lineEl.getBoundingClientRect();
  const off = windowHeight * 0.45;
  LINE_ZONE.x = r.left;
  LINE_ZONE.y = r.top - off;
  LINE_ZONE.w = r.width;
  LINE_ZONE.h = 60;
}

// Draw 
function draw() {
  clear();

  // Dashed box 
  const boxX = width * 0.32;
  const boxY = height * 0.08;
  const boxW = width * 0.40;
  const boxH = height * 0.75;

  stroke('#00a9ce');
  strokeWeight(5);
  noFill();
  drawingContext.setLineDash([10, 8]);
  rect(boxX, boxY, boxW, boxH);
  drawingContext.setLineDash([]);

  //Words
  noStroke();
  words.forEach((w, i) => {
    if (w.onLine) return; // drawn via HTML

    let sz = constrain(width * 0.028, 22, 34);
    textSize(sz);

    // shake animation
    let xOff = 0;
    if (shakeWord === i && shakeTimer > 0) {
      xOff = sin(shakeTimer * 0.6) * 10;
      shakeTimer -= 1;
      if (shakeTimer <= 0) shakeWord = -1;
    }

    // highlight word being dragged
    const isDragging = dragging && dragging.index === i;
    fill(isDragging ? '#00a9ce' : '#1d9e3e');

    if (isDragging) {
      // draw at mouse position
      text(w.text, mouseX + dragging.offsetX, mouseY + dragging.offsetY);
    } else {
      text(w.text, w.x + xOff, w.y);
    }
  });
}

// ── Interaction ────────────────────────────────────────────────────
function mousePressed() {
  if (answered) return;
  updateLineZone();

  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (w.onLine) continue;
    textSize(constrain(width * 0.032, 18, 38));
    const tw = textWidth(w.text);
    const th = textSize();
    if (
      mouseX > w.x - tw / 2 - 8 && mouseX < w.x + tw / 2 + 8 &&
      mouseY > w.y - th        && mouseY < w.y + 6
    ) {
      // if another word is on the line, return it home first
      if (droppedIndex !== -1) {
        words[droppedIndex].onLine = false;
        words[droppedIndex].x = words[droppedIndex].homeX;
        words[droppedIndex].y = words[droppedIndex].homeY;
        setDroppedWordHTML('');
        droppedIndex = -1;
      }
      dragging = { index: i, offsetX: 0, offsetY: 0 };
      break;
    }
  }
}

function mouseReleased() {
  if (!dragging) return;
  updateLineZone();

  const i = dragging.index;
  const w = words[i];

  // Check if dropped onto line zone
  if (
    mouseX > LINE_ZONE.x &&
    mouseX < LINE_ZONE.x + LINE_ZONE.w &&
    mouseY > LINE_ZONE.y - 30 &&
    mouseY < LINE_ZONE.y + LINE_ZONE.h
  ) {
    // Place on line
    w.onLine    = true;
    droppedIndex = i;
    setDroppedWordHTML(w.text);
    dragging = null;
    checkAnswer(w.text);
  } else {
    // Return to home
    dragging = null;
  }
}

function touchStarted() {
  mouseX = touches[0].x;
  mouseY = touches[0].y - windowHeight * 0.45;
  mousePressed();
  return false;
}

function touchEnded() {
  mouseX = touches[0] ? touches[0].x : mouseX;
  mouseY = touches[0] ? touches[0].y - windowHeight * 0.45 : mouseY;
  mouseReleased();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight * 0.55);
  buildWordObjects();
  updateLineZone();
}

// ── Helpers ────────────────────────────────────────────────────────
function setDroppedWordHTML(text) {
  const lineEl = document.getElementById('answer-line');
  // remove old
  const old = lineEl.querySelector('.dropped-word');
  if (old) old.remove();
  if (!text) return;
  const span = document.createElement('span');
  span.className = 'dropped-word';
  span.textContent = text;
  lineEl.appendChild(span);
}

function checkAnswer(text) {
  if (text === chosen.word) {
    // Correct!
    answered = true;
    showFeedback(true);
    document.getElementById('btn-next').classList.add('ready');
    // auto-advance after 1.4s
    setTimeout(() => {
      const next = window.NEXT_PAGE || 'completion.html';
      location.href = next;
    }, 1400);
  } else {
    // Wrong — shake and return after delay
    shakeWord  = droppedIndex;
    shakeTimer = 30;
    showFeedback(false);
    setTimeout(() => {
      if (droppedIndex !== -1) {
        words[droppedIndex].onLine = false;
        words[droppedIndex].x = words[droppedIndex].homeX;
        words[droppedIndex].y = words[droppedIndex].homeY;
        setDroppedWordHTML('');
        droppedIndex = -1;
      }
      hideFeedback();
    }, 900);
  }
}

function showFeedback(correct) {
  let el = document.querySelector('.feedback');
  if (!el) {
    el = document.createElement('div');
    el.className = 'feedback';
    document.body.appendChild(el);
  }
  el.textContent = correct ? '✓ Correct!' : '✗ Try again';
  el.className   = 'feedback ' + (correct ? 'correct' : 'wrong');
  requestAnimationFrame(() => el.classList.add('show'));
}

function hideFeedback() {
  const el = document.querySelector('.feedback');
  if (el) el.classList.remove('show');
}
