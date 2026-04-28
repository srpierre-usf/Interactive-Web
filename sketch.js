const instructionText =
  "Each round you will see a character holding their country flag. " +
  "Drag the correct word from the box below onto the line to say " +
  "hello in their language. Three rounds, three languages. Good luck!" +
  "\n" +
  "\n" +
  " Click & Drag this text box to practice.";

let box = { x:0, y:0, w:0, h:0, dragging:false, offsetX:0, offsetY:0 };

function setup() {
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('p5-canvas');
  box.w = width  * 0.335;
  box.h = height * 0.30;
  box.x = width  * 0.111;
  box.y = height * 0.20;
  textFont('Space Grotesk');
}

function draw() {
  clear();
  noStroke();
  fill(208, 208, 208);
  rect(box.x, box.y, box.w, box.h);

  cursor(isOverBox() ? (box.dragging ? 'grabbing' : 'grab') : ARROW);

  fill(29, 158, 62);
  textSize(constrain(width * 0.022, 18, 28));
  textLeading(constrain(width * 0.038, 28, 44));
  textAlign(LEFT, CENTER);
  const pad = box.w * 0.07;
  text(instructionText, box.x + pad, box.y + pad, box.w - pad * 2, box.h - pad * 2);
}

function mousePressed()  { if (isOverBox()) { box.dragging=true;  box.offsetX=mouseX-box.x; box.offsetY=mouseY-box.y; } }
function mouseDragged()  { if (box.dragging) { box.x=mouseX-box.offsetX; box.y=mouseY-box.offsetY; } }
function mouseReleased() { box.dragging=false; }
function touchStarted()  { if (isOverBox()) { box.dragging=true;  box.offsetX=touches[0].x-box.x; box.offsetY=touches[0].y-box.y; } return false; }
function touchMoved()    { if (box.dragging) { box.x=touches[0].x-box.offsetX; box.y=touches[0].y-box.offsetY; } return false; }
function touchEnded()    { box.dragging=false; }
function windowResized() { resizeCanvas(windowWidth, windowHeight); box.w=width*0.46; box.h=height*0.55; }
function isOverBox()     { return mouseX>box.x && mouseX<box.x+box.w && mouseY>box.y && mouseY<box.y+box.h; }
