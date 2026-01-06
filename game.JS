// =========================
// SPELKOD – MED SPARAT GULD + MOBILKONTROLLER
// =========================

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const heartsContainer = document.getElementById("hearts");
const goldSpan = document.getElementById("goldAmount");
const shopGoldSpan = document.getElementById("shopGoldAmount");

const playBtn = document.getElementById("playBtn");
const buyBlueSwordBtn = document.getElementById("buyBlueSwordBtn");
const buyRedCubeBtn = document.getElementById("buyRedCubeBtn");
const overlay = document.getElementById("overlay");
const restartBtn = document.getElementById("restartBtn");

let keys = {};
let player;
let zombies = [];
let hearts = 10;
let maxHearts = 10;
let gameOver = false;

let gold = 0;
let blueSwordOwned = false;
let redCubeOwned = false;

let redCubeActive = false;
let redCubeTimer = 0;

// =========================
// LADDAR SPARAT GULD
// =========================

if (localStorage.getItem("gold")) {
  gold = parseInt(localStorage.getItem("gold"));
}

// =========================
// SNURRANDE SVÄRD
// =========================

let swordAngle = 0;
let swordRadius = 45;
let swordSize = 18;
let swordDamage = 1;

let swordCooldown = 0;
let swordHitLimit = 2;
let swordHitCount = 0;

// =========================
// SPELARE
// =========================

function resetPlayer() {
  player = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    size: 30,
    speed: 3.2,
    color: "yellow"
  };
}

function spawnZombies() {
  zombies = [];

  for (let i = 0; i < 20; i++) {
    let zx, zy;

    do {
      zx = Math.random() * (canvas.width - 40) + 20;
      zy = Math.random() * (canvas.height / 2);
    } while (Math.abs(zx - player.x) < 120 && Math.abs(zy - player.y) < 120);

    zombies.push({
      x: zx,
      y: zy,
      size: 26,
      color: "green",
      hp: 5
    });
  }
}

function updateHeartsDisplay() {
  heartsContainer.innerHTML = "";
  for (let i = 0; i < maxHearts; i++) {
    const div = document.createElement("div");
    div.classList.add("heart");
    if (i >= hearts) div.classList.add("black");
    heartsContainer.appendChild(div);
  }
}

function resetGame() {
  hearts = 10;
  gameOver = false;
  redCubeActive = false;
  redCubeTimer = 0;

  swordCooldown = 0;
  swordHitCount = 0;

  resetPlayer();
  spawnZombies();
  updateHeartsDisplay();
  overlay.classList.add("hidden");

  goldSpan.textContent = gold;
  shopGoldSpan.textContent = gold;

  if (redCubeOwned) activateRedCube();
}

// =========================
// INPUT
// =========================

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

// =========================
// MOBILKONTROLLER
// =========================

function mobilePress(key) {
  keys[key] = true;
}

function mobileRelease(key) {
  keys[key] = false;
}

document.getElementById("btnUp").addEventListener("touchstart", () => mobilePress("w"));
document.getElementById("btnUp").addEventListener("touchend", () => mobileRelease("w"));

document.getElementById("btnDown").addEventListener("touchstart", () => mobilePress("s"));
document.getElementById("btnDown").addEventListener("touchend", () => mobileRelease("s"));

document.getElementById("btnLeft").addEventListener("touchstart", () => mobilePress("a"));
document.getElementById("btnLeft").addEventListener("touchend", () => mobileRelease("a"));

document.getElementById("btnRight").addEventListener("touchstart", () => mobilePress("d"));
document.getElementById("btnRight").addEventListener("touchend", () => mobileRelease("d"));

document.getElementById("btnAttack").addEventListener("touchstart", () => {
  mobilePress("f");
  attack();
});
document.getElementById("btnAttack").addEventListener("touchend", () => mobileRelease("f"));

// =========================
// SNURRANDE SVÄRD FUNKTION
// =========================

function updateSword() {
  swordAngle += 0.12;

  if (swordCooldown > 0) {
    swordCooldown--;
    if (swordCooldown === 0) swordHitCount = 0;
  }

  const swordX = player.x + player.size / 2 + Math.cos(swordAngle) * swordRadius;
  const swordY = player.y + player.size / 2 + Math.sin(swordAngle) * swordRadius;

  ctx.fillStyle = "silver";
  ctx.beginPath();
  ctx.arc(swordX, swordY, swordSize, 0, Math.PI * 2);
  ctx.fill();

  zombies.forEach((z, i) => {
    if (swordHitCount >= swordHitLimit) return;

    const dx = swordX - (z.x + z.size / 2);
    const dy = swordY - (z.y + z.size / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < swordSize + z.size / 2) {
      if (swordCooldown === 0) {
        z.hp -= swordDamage;
        swordHitCount++;

        if (z.hp <= 0) {
          gold++;
          localStorage.setItem("gold", gold);
          goldSpan.textContent = gold;
          shopGoldSpan.textContent = gold;
          zombies.splice(i, 1);
        }

        if (swordHitCount >= swordHitLimit) {
          swordCooldown = 120;
        }
      }
    }
  });
}

// =========================
// UPDATE LOOP
// =========================

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#303030";
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  if (!gameOver) {
    let moveX = 0, moveY = 0;

    if (keys["a"]) moveX = -1;
    if (keys["d"]) moveX = 1;
    if (keys["w"]) moveY = -1;
    if (keys["s"]) moveY = 1;

    player.x += moveX * player.speed;
    player.y += moveY * player.speed;

    if (player.y + player.size > canvas.height - 40)
      player.y = canvas.height - 40 - player.size;

    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));

    zombies.forEach((z) => {
      const dx = player.x - z.x;
      const dy = player.y - z.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const speed = 1.2;

      z.x += (dx / dist) * speed;
      z.y += (dy / dist) * speed;

      if (dist < player.size) {
        hearts--;
        updateHeartsDisplay();
        if (hearts <= 0) {
          gameOver = true;
          overlay.classList.remove("hidden");
        }
      }
    });
  }

  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.size, player.size);

  updateSword();

  zombies.forEach((z) => {
    ctx.fillStyle = z.color;
    ctx.fillRect(z.x, z.y, z.size, z.size);

    const hpWidth = (z.hp / 5) * z.size;
    ctx.fillStyle = "red";
    ctx.fillRect(z.x, z.y - 6, z.size, 4);
    ctx.fillStyle = "lime";
    ctx.fillRect(z.x, z.y - 6, hpWidth, 4);
  });

  requestAnimationFrame(update);
}

// =========================
// SHOP
// =========================

playBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);

buyBlueSwordBtn.addEventListener("click", () => {
  if (!blueSwordOwned && gold >= 100) {
    gold -= 100;
    localStorage.setItem("gold", gold);
    blueSwordOwned = true;
    buyBlueSwordBtn.textContent = "Köpt!";
    buyBlueSwordBtn.disabled = true;
    goldSpan.textContent = gold;
    shopGoldSpan.textContent = gold;
  }
});

buyRedCubeBtn.addEventListener("click", () => {
  if (!redCubeOwned && gold >= 1000) {
    gold -= 1000;
    localStorage.setItem("gold", gold);
    redCubeOwned = true;
    buyRedCubeBtn.textContent = "Köpt!";
    buyRedCubeBtn.disabled = true;
    goldSpan.textContent = gold;
    shopGoldSpan.textContent = gold;
    activateRedCube();
  }
});

function activateRedCube() {
  redCubeActive = true;
  redCubeTimer = 60 * 6;
  player.speed = 4.5;
}

// =========================
// STARTA SPELET
// =========================

goldSpan.textContent = gold;
shopGoldSpan.textContent = gold;

resetGame();
update();
