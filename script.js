
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("high-score");
const overlay = document.getElementById("overlay");
const overlayLabel = document.getElementById("overlay-label");
const overlayTitle = document.getElementById("overlay-title");
const startBtn = document.getElementById("start-btn");
const themeBtn = document.getElementById("theme-btn");

const W = canvas.width;
const H = canvas.height;
const GROUND = 250;

let running = false;
let gameOver = false;
let lastTime = 0;
let score = 0;
let speed = 340;
let spawnTimer = 0;
let groundOffset = 0;
let night = false;
let ducking = false;
let clouds = [];
let obstacles = [];
let particles = [];

const GRAVITY = 2200;
const JUMP_FORCE = -760;

function readBest() {
  try {
    return Number(localStorage.getItem("dino-best")) || 0;
  } catch {
    return 0;
  }
}

let best = readBest();
bestEl.textContent = String(best).padStart(5, "0");

const dino = {
  x: 80,
  y: GROUND - 48,
  w: 42,
  h: 48,
  vy: 0,
  grounded: true,
  runFrame: 0
};

function resetGame() {
  score = 0;
  speed = 340;
  spawnTimer = 0.9;
  groundOffset = 0;
  obstacles = [];
  particles = [];
  ducking = false;

  dino.x = 80;
  dino.y = GROUND - 48;
  dino.w = 42;
  dino.h = 48;
  dino.vy = 0;
  dino.grounded = true;
  dino.runFrame = 0;

  scoreEl.textContent = "00000";
}

function startGame() {
  if (running) return;

  resetGame();
  running = true;
  gameOver = false;
  lastTime = performance.now();
  overlay.classList.add("hidden");
  requestAnimationFrame(loop);
}

function endGame() {
  if (!running) return;

  running = false;
  gameOver = true;

  const finalScore = Math.floor(score);

  if (finalScore > best) {
    best = finalScore;
    try {
      localStorage.setItem("dino-best", String(best));
    } catch {
      // The game can still play if storage is unavailable.
    }
  }

  bestEl.textContent = String(best).padStart(5, "0");
  overlayLabel.textContent = "RUN COMPLETE";
  overlayTitle.textContent = `Score: ${finalScore}`;
  startBtn.textContent = "Run again →";
  overlay.classList.remove("hidden");
  burst(dino.x + 20, dino.y + 20);
  draw();
}

function jump() {
  if (!running) {
    startGame();
    return;
  }

  if (dino.grounded && !ducking) {
    dino.vy = JUMP_FORCE;
    dino.grounded = false;
  }
}

function setDuck(value) {
  ducking = value && running && dino.grounded;
}

// Input controls
document.addEventListener("keydown", event => {
  if (["Space", "ArrowUp", "ArrowDown"].includes(event.code)) {
    event.preventDefault();
  }

  if (event.repeat) return;

  if (event.code === "Space" || event.code === "ArrowUp" ||
      event.code === "KeyW") {
    jump();
  }

  if (event.code === "ArrowDown" || event.code === "KeyS") {
    setDuck(true);
  }

  if (event.code === "Enter" && !running) {
    startGame();
  }
});

document.addEventListener("keyup", event => {
  if (event.code === "ArrowDown" || event.code === "KeyS") {
    setDuck(false);
  }
});

canvas.addEventListener("pointerdown", () => {
  if (!running) startGame();
  else jump();
});

startBtn.addEventListener("click", startGame);

const jumpBtn = document.getElementById("jump-btn");
const duckBtn = document.getElementById("duck-btn");

jumpBtn.addEventListener("pointerdown", event => {
  event.preventDefault();
  jump();
});

duckBtn.addEventListener("pointerdown", event => {
  event.preventDefault();
  setDuck(true);
});

["pointerup", "pointercancel", "lostpointercapture"].forEach(type => {
  duckBtn.addEventListener(type, () => setDuck(false));
});

document.addEventListener("visibilitychange", () => {
  lastTime = performance.now();
});

// Day/night toggle
themeBtn.addEventListener("click", () => {
  night = !night;
  document.body.classList.toggle("night", night);
  themeBtn.textContent = night ? "☀" : "☾";
  draw();
});

// World decorations
function initClouds() {
  clouds = [
    { x: 160, y: 55, w: 45 },
    { x: 470, y: 90, w: 60 },
    { x: 740, y: 42, w: 38 }
  ];
}

function drawCloud(x, y, w) {
  ctx.save();
  ctx.fillStyle = night ? "#343d36" : "#e4e8dc";
  ctx.beginPath();
  ctx.arc(x, y, w * 0.22, 0, Math.PI * 2);
  ctx.arc(x + w * 0.25, y - 6, w * 0.28, 0, Math.PI * 2);
  ctx.arc(x + w * 0.53, y, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGround() {
  ctx.strokeStyle = night ? "#566052" : "#b5bba9";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, GROUND);
  ctx.lineTo(W, GROUND);
  ctx.stroke();

  ctx.fillStyle = night ? "#596453" : "#a7ad9d";

  for (let i = 0; i < 35; i++) {
    let x = ((i * 83 - groundOffset) % W + W) % W;
    let y = GROUND + 10 + (i % 3) * 9;
    ctx.fillRect(x, y, i % 2 ? 5 : 9, 1.5);
  }
}

function drawDino() {
  const x = dino.x;
  const y = dino.y;
  const color = night ? "#d7e6c8" : "#374b35";

  ctx.save();
  ctx.fillStyle = color;

  if (ducking && dino.grounded) {
    // Low running pose
    ctx.fillRect(x + 3, y + 20, 34, 20);
    ctx.fillRect(x + 27, y + 7, 19, 19);
    ctx.fillRect(x + 39, y + 11, 12, 8);
    ctx.fillRect(x + 8, y + 36, 13, 7);
    ctx.fillRect(x + 29, y + 36, 13, 7);

    ctx.fillStyle = night ? "#20251f" : "#fafbf5";
    ctx.fillRect(x + 38, y + 11, 3, 3);
  } else {
    // Body, neck and head
    ctx.fillRect(x + 5, y + 20, 28, 23);
    ctx.fillRect(x + 20, y + 10, 12, 22);
    ctx.fillRect(x + 18, y + 2, 25, 20);
    ctx.fillRect(x + 36, y + 13, 12, 8);
    ctx.fillRect(x, y + 26, 9, 6);

    // Tiny arms
    ctx.fillRect(x + 27, y + 25, 10, 4);

    // Eye
    ctx.fillStyle = night ? "#20251f" : "#fafbf5";
    ctx.fillRect(x + 34, y + 6, 4, 4);

    // Animated legs
    ctx.fillStyle = color;
    if (!dino.grounded) {
      ctx.fillRect(x + 9, y + 40, 7, 7);
      ctx.fillRect(x + 25, y + 40, 7, 7);
    } else if (Math.floor(dino.runFrame) % 2 === 0) {
      ctx.fillRect(x + 9, y + 40, 7, 9);
      ctx.fillRect(x + 24, y + 40, 7, 5);
    } else {
      ctx.fillRect(x + 9, y + 40, 7, 5);
      ctx.fillRect(x + 24, y + 40, 7, 9);
    }
  }

  ctx.restore();
}

function spawnObstacle() {
  const birdChance = Math.min(0.28, Math.max(0, (speed - 400) / 500));

  if (score > 100 && Math.random() < birdChance) {
    const heights = [GROUND - 42, GROUND - 72, GROUND - 95];
    obstacles.push({
      type: "bird",
      x: W + 20,
      y: heights[Math.floor(Math.random() * heights.length)],
      w: 42,
      h: 24,
      flap: 0
    });
  } else {
    const large = Math.random() > 0.55;
    const count = Math.random() > 0.7 ? 2 : 1;

    obstacles.push({
      type: "cactus",
      x: W + 20,
      y: GROUND - (large ? 46 : 31),
      w: count === 2 ? 38 : 22,
      h: large ? 46 : 31,
      count,
      large
    });
  }
}

function drawCactus(o) {
  ctx.save();
  ctx.fillStyle = night ? "#a7c993" : "#52764c";

  for (let i = 0; i < o.count; i++) {
    const x = o.x + i * 17;
    const h = o.large ? 46 : 31;
    const y = GROUND - h;

    ctx.fillRect(x + 5, y, 10, h);
    ctx.fillRect(x, y + 10, 7, 15);
    ctx.fillRect(x - 1, y + 10, 8, 5);
    ctx.fillRect(x + 13, y + 17, 8, 5);
    ctx.fillRect(x + 16, y + 17, 5, 12);
  }

  ctx.restore();
}

function drawBird(o) {
  const wing = Math.sin(o.flap) > 0 ? -7 : 5;
  ctx.save();
  ctx.fillStyle = night ? "#d7e6c8" : "#53604e";

  ctx.fillRect(o.x + 10, o.y + 8, 22, 9);
  ctx.fillRect(o.x + 28, o.y + 5, 12, 8);
  ctx.fillRect(o.x + 38, o.y + 8, 7, 4);

  // Wings
  ctx.fillRect(o.x + 14, o.y + 7 + wing, 15, 5);
  ctx.fillRect(o.x + 8, o.y + 3 + wing, 9, 6);

  ctx.restore();
}

function rectsOverlap(a, b) {
  // Small inset prevents unfair collisions on transparent-looking edges.
  return (
    a.x + 5 < b.x + b.w - 4 &&
    a.x + a.w - 5 > b.x + 4 &&
    a.y + 4 < b.y + b.h - 3 &&
    a.y + a.h - 3 > b.y + 3
  );
}

function checkCollision(o) {
  const player = {
    x: dino.x + 4,
    y: dino.y + (ducking ? 21 : 4),
    w: ducking ? 43 : 36,
    h: ducking ? 21 : 42
  };

  const obstacle = {
    x: o.x,
    y: o.y,
    w: o.w,
    h: o.h
  };

  return rectsOverlap(player, obstacle);
}

function burst(x, y) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 0.45
    });
  }
}

function updateParticles(dt) {
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }

  particles = particles.filter(p => p.life > 0);
}

function drawParticles() {
  ctx.fillStyle = night ? "#c4e8ad" : "#66865c";

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 0.45);
    ctx.fillRect(p.x, p.y, 4, 4);
  }

  ctx.globalAlpha = 1;
}

function drawBackground() {
  ctx.fillStyle = night ? "#1e251f" : "#fafbf5";
  ctx.fillRect(0, 0, W, H);

  if (night) {
    ctx.fillStyle = "#c8d6ae";

    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + 31) % W;
      const y = (i * 47 + 17) % 135;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.beginPath();
    ctx.arc(790, 55, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1e251f";
    ctx.beginPath();
    ctx.arc(798, 48, 17, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const c of clouds) {
    drawCloud(c.x, c.y, c.w);
  }

  drawGround();
}

function draw() {
  drawBackground();

  for (const o of obstacles) {
    if (o.type === "cactus") drawCactus(o);
    else drawBird(o);
  }

  drawDino();
  drawParticles();
}

function update(dt) {
  if (!running) return;

  // Gradually increase the game speed.
  speed = Math.min(780, speed + dt * 5);
  score += dt * 10;
  scoreEl.textContent = String(Math.floor(score)).padStart(5, "0");

  groundOffset = (groundOffset + speed * dt) % W;

  for (const c of clouds) {
    c.x -= speed * 0.10 * dt;

    if (c.x < -80) {
      c.x = W + 30;
      c.y = 35 + Math.random() * 75;
    }
  }

  if (ducking && dino.grounded) {
    dino.h = 28;
    dino.y = GROUND - 28;
  } else {
    dino.h = 48;
    if (dino.grounded) dino.y = GROUND - 48;
  }

  // Jump physics
  if (!dino.grounded) {
    dino.vy += GRAVITY * dt;
    dino.y += dino.vy * dt;

    if (dino.y >= GROUND - 48) {
      dino.y = GROUND - 48;
      dino.vy = 0;
      dino.grounded = true;
    }
  }

  if (dino.grounded && !ducking) {
    dino.runFrame += dt * speed * 0.035;
  }

  // Spawn obstacles with a variable gap.
  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnObstacle();
    const difficulty = Math.min(0.45, (speed - 340) / 1000);
    spawnTimer = 0.9 + Math.random() * 0.65 - difficulty;
    spawnTimer = Math.max(0.48, spawnTimer);
  }

  for (const o of obstacles) {
    o.x -= speed * dt;

    if (o.type === "bird") {
      o.flap += dt * 12;
    }

    if (checkCollision(o)) {
      endGame();
      return;
    }
  }

  obstacles = obstacles.filter(o => o.x + o.w > -10);
  updateParticles(dt);
}

function loop(timestamp) {
  if (!running) return;

  // Clamp delta time to avoid physics jumps after tab switching.
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;

  update(dt);
  draw();

  if (running) requestAnimationFrame(loop);
}

// Initial screen
initClouds();
draw();

