const socket = io();
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const minimap = document.getElementById("minimap");
const mctx = minimap.getContext("2d");

const startScreen = document.getElementById("startScreen");
const shipSelect = document.getElementById("shipSelect");
const nicknameInput = document.getElementById("nicknameInput");
const playButton = document.getElementById("playButton");
const hud = document.getElementById("hud");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatChannel = document.getElementById("chatChannel");
const upgradePanel = document.getElementById("upgradePanel");
const selectedShipPreview = document.getElementById("selectedShipPreview");
const connectionStatus = document.getElementById("connectionStatus");
const debugPanel = document.getElementById("debugPanel");
const mobileControls = document.getElementById("mobileControls");
const portraitHint = document.getElementById("portraitHint");
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");
const allianceList = document.getElementById("allianceList");
const controlModeSelect = document.getElementById("controlModeSelect");
const settingsButton = document.getElementById("settingsButton");
const hudSettings = document.getElementById("hudSettings");
const touchToggle = document.getElementById("touchToggle");
const chatToggle = document.getElementById("chatToggle");
const minimapSizeSelect = document.getElementById("minimapSizeSelect");
const hudScaleSelect = document.getElementById("hudScaleSelect");

const upgradeBaseCosts = { hp: 300, speed: 350, turn: 250, damage: 500, reload: 600, boost: 400 };
const upgradeLabels = { hp: "HP", speed: "Speed", turn: "Turn", damage: "Damage", reload: "Reload", boost: "Boost" };

const shipDefinitions = {
  Dinghy: { price: 0, hp: 100, speed: 175, turn: "high", damage: 18, fireRate: "2.5s", cooldownMs: 2500, boost: "good", weapon: "quick cannon", description: "Starter ship", accent: "#7bd65b", shape: "dinghy" },
  Scout: { price: 500, hp: 80, speed: 225, turn: "very high", damage: 8, fireRate: "2.2s", cooldownMs: 2200, boost: "very good", weapon: "salvo cannon", description: "Fast collector", accent: "#44b7f2", shape: "needle" },
  Gunboat: { price: 1500, hp: 150, speed: 160, turn: "medium", damage: 34, fireRate: "3.0s", cooldownMs: 3000, boost: "medium", weapon: "standard cannon", description: "Balanced ship", accent: "#f0ad32", shape: "patrol" },
  Cannoner: { price: 3500, hp: 190, speed: 120, turn: "slow", damage: 70, fireRate: "3.8s", cooldownMs: 3800, boost: "weak", weapon: "heavy single shot", description: "Heavy single shot", accent: "#e34f42", shape: "artillery" },
  Heavy: { price: 7500, hp: 280, speed: 95, turn: "very slow", damage: 45, fireRate: "3.5s", cooldownMs: 3500, boost: "weak", weapon: "double cannon", description: "Tank ship", accent: "#9d62d8", shape: "tank" },
  Skimmer: { price: 11000, hp: 95, speed: 235, turn: "very high", damage: 16, fireRate: "2.4s", cooldownMs: 2400, boost: "very good", weapon: "skimmer salvo", description: "Hit-and-run", accent: "#33d6c5", shape: "needle" },
  "Patrol MK2": { price: 15000, hp: 170, speed: 168, turn: "medium", damage: 38, fireRate: "2.9s", cooldownMs: 2900, boost: "medium", weapon: "patrol cannon", description: "Improved standard boat", accent: "#6fc3ff", shape: "patrol" },
  Raider: { price: 21000, hp: 160, speed: 190, turn: "high", damage: 30, fireRate: "2.6s", cooldownMs: 2600, boost: "good", weapon: "raider twins", description: "Aggressive hunter", accent: "#ff8b3d", shape: "raider" },
  "Twin Scout": { price: 28000, hp: 135, speed: 210, turn: "high", damage: 18, fireRate: "2.4s", cooldownMs: 2400, boost: "good", weapon: "wide twin salvo", description: "Fast double shots", accent: "#4dd2ff", shape: "catamaran" },
  "Iron Patrol": { price: 36000, hp: 230, speed: 145, turn: "medium-low", damage: 42, fireRate: "3.1s", cooldownMs: 3100, boost: "medium", weapon: "iron cannon", description: "Armored all-rounder", accent: "#aeb8bd", shape: "armored" },
  "Storm Cutter": { price: 46000, hp: 170, speed: 205, turn: "very high", damage: 36, fireRate: "2.8s", cooldownMs: 2800, boost: "good", weapon: "cutter cannon", description: "Very agile", accent: "#28dca1", shape: "cutter" },
  Barracuda: { price: 58000, hp: 180, speed: 215, turn: "high", damage: 48, fireRate: "3.2s", cooldownMs: 3200, boost: "good", weapon: "hunter cannon", description: "Fast hunter", accent: "#2bd2a2", shape: "needle" },
  Breaker: { price: 72000, hp: 280, speed: 118, turn: "slow", damage: 62, fireRate: "3.4s", cooldownMs: 3400, boost: "weak", weapon: "breaker cannon", description: "Heavy close fighter", accent: "#ffb14a", shape: "breaker" },
  Longshot: { price: 90000, hp: 210, speed: 140, turn: "medium-low", damage: 78, fireRate: "4.1s", cooldownMs: 4100, boost: "weak", weapon: "long-range cannon", description: "High range artillery", accent: "#ffe066", shape: "artillery" },
  Guardian: { price: 115000, hp: 360, speed: 105, turn: "slow", damage: 45, fireRate: "3.2s", cooldownMs: 3200, boost: "weak", weapon: "defense twins", description: "Defensive heavyweight", accent: "#78e08f", shape: "tank" },
  Trident: { price: 145000, hp: 300, speed: 128, turn: "medium-low", damage: 34, fireRate: "3.3s", cooldownMs: 3300, boost: "medium", weapon: "triple cannon", description: "Three cannons", accent: "#64c7ff", shape: "trident" },
  Viper: { price: 180000, hp: 220, speed: 230, turn: "very high", damage: 52, fireRate: "3.0s", cooldownMs: 3000, boost: "excellent", weapon: "viper lance", description: "Fast elite hunter", accent: "#c8ff4d", shape: "needle" },
  Hammerhead: { price: 225000, hp: 420, speed: 95, turn: "very slow", damage: 95, fireRate: "4.3s", cooldownMs: 4300, boost: "weak", weapon: "front cannon", description: "Heavy frontal assault", accent: "#ff6f4a", shape: "hammer" },
  Tempest: { price: 280000, hp: 330, speed: 150, turn: "medium", damage: 38, fireRate: "2.5s", cooldownMs: 2500, boost: "medium", weapon: "tempest salvo", description: "Fast salvos", accent: "#b56cff", shape: "trident" },
  Fortress: { price: 350000, hp: 560, speed: 72, turn: "very slow", damage: 62, fireRate: "3.9s", cooldownMs: 3900, boost: "weak", weapon: "fortress guns", description: "Extreme defense", accent: "#b7c2c8", shape: "fortress" },
  Phantom: { price: 430000, hp: 260, speed: 240, turn: "excellent", damage: 50, fireRate: "2.8s", cooldownMs: 2800, boost: "excellent", weapon: "phantom cannon", description: "Very fast and agile", accent: "#d2f5ff", shape: "cutter" },
  Leviathan: { price: 530000, hp: 650, speed: 66, turn: "very slow", damage: 105, fireRate: "4.6s", cooldownMs: 4600, boost: "weak", weapon: "leviathan gun", description: "Huge endgame tank", accent: "#88939d", shape: "fortress" },
  Reaper: { price: 650000, hp: 420, speed: 125, turn: "slow", damage: 125, fireRate: "5.0s", cooldownMs: 5000, boost: "weak", weapon: "reaper cannon", description: "Extreme damage", accent: "#ff4f86", shape: "hammer" },
  Monarch: { price: 800000, hp: 520, speed: 145, turn: "medium", damage: 90, fireRate: "3.8s", cooldownMs: 3800, boost: "medium", weapon: "royal broadside", description: "Endgame all-rounder", accent: "#ffd45a", shape: "royal" },
  "Harbor King": { price: 1000000, hp: 700, speed: 88, turn: "slow", damage: 115, fireRate: "4.3s", cooldownMs: 4300, boost: "weak", weapon: "king cannons", description: "Strongest heavy ship", accent: "#f5fbff", shape: "royal" }
};

let progress = loadProgress();
let selectedShip = progress.selectedShip;
let state = null;
let staticWorld = {};
let minimapState = null;
let myId = null;
let joined = false;
let camera = { x: 0, y: 0 };
let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
let lastShotVisual = 0;
let minimapVisible = true;
let debugVisible = false;
let pingMs = 0;
let socketStatus = "Connecting";
let serverStats = {};
let netUpdates = 0;
let netRate = 0;
let lastPayloadKb = 0;
let controlMode = localStorage.getItem("battleHarborControlMode") || (matchMedia("(pointer: coarse)").matches ? "touch" : "keyboard");
let hudSettingsState = JSON.parse(localStorage.getItem("battleHarborHudSettings") || "{}");
let zoomMode = localStorage.getItem("battleHarborZoomMode") || "normal";
const zoomScales = { close: 1.14, normal: 1, wide: 0.84 };
const renderEntities = new Map();
let frameCount = 0;
let fps = 0;
let lastPerfSample = performance.now();
let lastFrameTime = performance.now();
const keys = {};
const touchInput = { up: false, down: false, left: false, right: false, shoot: false, boost: false, active: false, angle: null };
let alliancePlayers = [];

function loadProgress() {
  const fallback = { nickname: "", securedPoints: 0, level: 1, xp: 0, unlockedShips: ["Dinghy"], selectedShip: "Dinghy", shipUpgrades: defaultShipUpgrades() };
  try {
    const saved = { ...fallback, ...JSON.parse(localStorage.getItem("battleHarborProgress") || "{}") };
    saved.securedPoints = Math.max(0, Math.floor(Number(saved.securedPoints) || 0));
    saved.level = Math.max(1, Math.floor(Number(saved.level) || 1));
    saved.xp = Math.max(0, Math.floor(Number(saved.xp) || 0));
    saved.unlockedShips = Array.isArray(saved.unlockedShips) ? saved.unlockedShips.filter((name) => shipDefinitions[name]) : ["Dinghy"];
    if (!saved.unlockedShips.includes("Dinghy")) saved.unlockedShips.unshift("Dinghy");
    if (!shipDefinitions[saved.selectedShip] || !saved.unlockedShips.includes(saved.selectedShip)) saved.selectedShip = "Dinghy";
    saved.shipUpgrades = normalizeShipUpgrades(saved.shipUpgrades);
    return saved;
  } catch {
    return fallback;
  }
}

function defaultShipUpgrades() {
  const result = {};
  for (const name of Object.keys(shipDefinitions)) result[name] = { hp: 0, speed: 0, turn: 0, damage: 0, reload: 0, boost: 0 };
  return result;
}

function normalizeShipUpgrades(source = {}) {
  const result = defaultShipUpgrades();
  for (const ship of Object.keys(result)) {
    for (const key of Object.keys(result[ship])) {
      result[ship][key] = Math.max(0, Math.min(5, Math.floor(Number(source?.[ship]?.[key]) || 0)));
    }
  }
  return result;
}

function saveProgress() {
  progress.nickname = nicknameInput.value.trim() || progress.nickname || "Captain";
  localStorage.setItem("battleHarborProgress", JSON.stringify(progress));
}

function saveHudSettings() {
  localStorage.setItem("battleHarborHudSettings", JSON.stringify(hudSettingsState));
}

function applyHudSettings() {
  document.body.classList.toggle("chat-collapsed", hudSettingsState.chatOpen === false);
  document.body.classList.toggle("minimap-small", hudSettingsState.minimapSize === "small");
  document.body.classList.toggle("hud-small", hudSettingsState.hudScale === "small");
  document.body.classList.toggle("hud-large", hudSettingsState.hudScale === "large");
  chatToggle.checked = hudSettingsState.chatOpen !== false;
  minimapSizeSelect.value = hudSettingsState.minimapSize || "normal";
  hudScaleSelect.value = hudSettingsState.hudScale || "normal";
}

function applyControlMode() {
  document.body.classList.remove("control-keyboard", "control-touch", "control-hybrid");
  document.body.classList.add(`control-${controlMode}`);
  controlModeSelect.value = controlMode;
  touchToggle.checked = controlMode !== "keyboard";
  localStorage.setItem("battleHarborControlMode", controlMode);
  updateMobileVisibility();
}

function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function renderShipCards() {
  shipSelect.innerHTML = "";
  const selected = shipDefinitions[selectedShip] || shipDefinitions.Dinghy;
  const selectedOwned = progress.unlockedShips.includes(selectedShip);
  selectedShipPreview.innerHTML = `<div>
      <strong>${selectedShip}</strong>
      <span>${selected.description} | ${selected.weapon}</span>
    </div>
    <div class="preview-stats">
      <span>HP ${selected.hp}</span><span>Speed ${selected.speed}</span><span>Damage ${selected.damage}</span><span>Reload ${selected.fireRate}</span><span>Boost ${selected.boost}</span>
    </div>
    <div>${selectedOwned ? "Owned" : `Price ${selected.price.toLocaleString()} secured points`}</div>`;
  Object.entries(shipDefinitions).forEach(([name, ship]) => {
    const owned = progress.unlockedShips.includes(name);
    const affordable = progress.securedPoints >= ship.price;
    const selectable = owned || affordable;
    const card = document.createElement("div");
    card.className = `ship-card ${selectedShip === name ? "selected" : ""} ${selectable ? "" : "locked"}`;
    card.innerHTML = `<h3>${name}</h3>
      <p>${ship.description}</p>
      <p>HP ${ship.hp} | Speed ${ship.speed} | Damage ${ship.damage}</p>
      <p>Reload ${ship.fireRate} | Boost ${ship.boost}</p>
      <p>${ship.weapon}</p>
      <button ${selectable ? "" : "disabled"}>${owned ? "Select" : ship.price ? `Buy ${ship.price.toLocaleString()}` : "Free"}</button>`;
    card.addEventListener("click", () => {
      if (!progress.unlockedShips.includes(name) && progress.securedPoints < ship.price) return;
      if (!progress.unlockedShips.includes(name) && !joined) {
        progress.securedPoints -= ship.price;
        progress.unlockedShips.push(name);
      }
      selectedShip = name;
      progress.selectedShip = name;
      saveProgress();
      renderShipCards();
      renderUpgradePanel();
      if (joined) socket.emit("buyShip", name);
    });
    shipSelect.appendChild(card);
  });
  renderUpgradePanel();
}

function renderUpgradePanel() {
  const upgrades = progress.shipUpgrades?.[selectedShip] || defaultShipUpgrades()[selectedShip];
  const owned = progress.unlockedShips.includes(selectedShip);
  upgradePanel.innerHTML = `<h2>${selectedShip} Upgrades</h2><div class="upgrade-grid"></div>`;
  const grid = upgradePanel.querySelector(".upgrade-grid");
  for (const [key, label] of Object.entries(upgradeLabels)) {
    const level = upgrades[key] || 0;
    const maxed = level >= 5;
    const cost = upgradeBaseCosts[key] * (level + 1);
    const canBuy = owned && !maxed && progress.securedPoints >= cost;
    const row = document.createElement("div");
    row.className = "upgrade-row";
    row.innerHTML = `<div><strong>${label}</strong><span>Level ${level}/5</span></div><button ${canBuy ? "" : "disabled"}>${maxed ? "MAX" : `${cost} pts`}</button>`;
    row.querySelector("button").addEventListener("click", () => buyUpgrade(selectedShip, key, cost));
    grid.appendChild(row);
  }
}

function buyUpgrade(shipName, upgradeType, cost) {
  const current = progress.shipUpgrades[shipName][upgradeType] || 0;
  if (!progress.unlockedShips.includes(shipName) || current >= 5 || progress.securedPoints < cost) return;
  if (joined) {
    socket.emit("buyUpgrade", { shipName, upgradeType });
    return;
  }
  progress.securedPoints -= cost;
  progress.shipUpgrades[shipName][upgradeType] = current + 1;
  saveProgress();
  renderShipCards();
  if (joined) socket.emit("buyUpgrade", { shipName, upgradeType });
}

function me() {
  return state?.players.find((p) => p.id === myId);
}

function ingestEntity(entity) {
  const existing = renderEntities.get(entity.id);
  if (!existing) {
    renderEntities.set(entity.id, { x: entity.x, y: entity.y, angle: entity.angle || 0 });
    entity.renderX = entity.x;
    entity.renderY = entity.y;
    entity.renderAngle = entity.angle || 0;
    return entity;
  }
  entity.serverX = entity.x;
  entity.serverY = entity.y;
  entity.serverAngle = entity.angle || 0;
  entity.renderX = existing.x;
  entity.renderY = existing.y;
  entity.renderAngle = existing.angle;
  return entity;
}

function ingestState(nextState) {
  const seen = new Set();
  nextState.players = (nextState.players || []).map((entity) => {
    seen.add(entity.id);
    return ingestEntity(entity);
  });
  nextState.bots = (nextState.bots || []).map((entity) => {
    seen.add(entity.id);
    return ingestEntity(entity);
  });
  for (const id of renderEntities.keys()) {
    if (!seen.has(id)) renderEntities.delete(id);
  }
  return nextState;
}

function smoothAngle(current, target, amount) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * amount;
}

function smoothEntities(dt) {
  if (!state) return;
  const amount = Math.min(1, dt * 12);
  for (const collection of [state.players || [], state.bots || []]) {
    for (const entity of collection) {
      const render = renderEntities.get(entity.id);
      if (!render) continue;
      const targetX = entity.serverX ?? entity.x;
      const targetY = entity.serverY ?? entity.y;
      const targetAngle = entity.serverAngle ?? entity.angle ?? 0;
      const correction = entity.id === myId ? Math.min(1, dt * 7) : amount;
      render.x += (targetX - render.x) * correction;
      render.y += (targetY - render.y) * correction;
      render.angle = smoothAngle(render.angle, targetAngle, amount);
      entity.renderX = render.x;
      entity.renderY = render.y;
      entity.renderAngle = render.angle;
    }
  }
}

function worldToScreen(x, y) {
  const scale = zoomScales[zoomMode] || 1;
  return { x: (x - camera.x) * scale + innerWidth / 2, y: (y - camera.y) * scale + innerHeight / 2 };
}

function isNearCamera(x, y, radius = 120) {
  const scale = zoomScales[zoomMode] || 1;
  return x > camera.x - innerWidth / (2 * scale) - radius &&
    x < camera.x + innerWidth / (2 * scale) + radius &&
    y > camera.y - innerHeight / (2 * scale) - radius &&
    y < camera.y + innerHeight / (2 * scale) + radius;
}

function drawWater() {
  const mine = me();
  const zone = mine ? nearestZoneColor(mine.x, mine.y) : "#0b5f91";
  const gradient = ctx.createLinearGradient(0, 0, innerWidth, innerHeight);
  gradient.addColorStop(0, zone);
  gradient.addColorStop(0.55, "#083f63");
  gradient.addColorStop(1, "#062f50");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.strokeStyle = "rgba(190,230,255,0.13)";
  ctx.lineWidth = 1;
  const startX = -((camera.x - innerWidth / 2) % 120);
  const startY = -((camera.y - innerHeight / 2) % 90);
  for (let y = startY - 90; y < innerHeight + 90; y += 90) {
    ctx.beginPath();
    for (let x = startX - 120; x < innerWidth + 120; x += 30) {
      const wy = y + Math.sin((x + performance.now() / 35) / 55) * 5;
      if (x === startX - 120) ctx.moveTo(x, wy);
      else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  for (let x = startX - 240; x < innerWidth + 240; x += 240) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 120, innerHeight);
    ctx.stroke();
  }
}

function nearestZoneColor(x, y) {
  const d = Math.hypot(x - 10000, y - 10000);
  if (d < 1400) return "#0b6e91";
  if (d < 4300) return "#0b679a";
  if (x < 11000 && y > 8400) return "#0a557f";
  if (x > 11600 || y < 7000) return "#0a4369";
  return "#0a4e78";
}

function drawWorld() {
  if (!state) return;
  const safe = worldToScreen(state.safeZone.x, state.safeZone.y);
  ctx.fillStyle = "rgba(84, 216, 183, 0.12)";
  ctx.strokeStyle = "rgba(84, 216, 183, 0.72)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(safe.x, safe.y, state.safeZone.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawHarbor(safe);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "16px Segoe UI";
  ctx.fillText("HARBOR - LOOT SECURE", safe.x - 92, safe.y - state.safeZone.radius - 12);

  for (const object of state.mapObjects || state.obstacles) {
    if (!isNearCamera(object.x, object.y, object.r + 80)) continue;
    drawMapObject(object);
  }
}

function drawHarbor(safe) {
  ctx.save();
  ctx.translate(safe.x, safe.y);
  ctx.strokeStyle = "rgba(230, 205, 140, 0.78)";
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(0, 0, state.safeZone.radius * 0.72, Math.PI * 0.12, Math.PI * 0.88);
  ctx.stroke();
  ctx.strokeStyle = "rgba(90, 70, 45, 0.9)";
  ctx.lineWidth = 10;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-220, i * 70);
    ctx.lineTo(220, i * 70);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255, 219, 116, 0.18)";
  ctx.beginPath();
  ctx.arc(0, 0, state.safeZone.radius * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMapObject(object) {
  const p = worldToScreen(object.x, object.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  if (object.type === "island") {
    ctx.fillStyle = "#d8bd77";
    ctx.beginPath();
    ctx.arc(0, 0, object.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4c9a58";
    ctx.beginPath();
    ctx.arc(-object.r * 0.08, -object.r * 0.04, object.r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#60717a";
    for (let i = 0; i < 5; i++) {
      const a = i * 1.26;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * object.r * 0.36, Math.sin(a) * object.r * 0.28, object.r * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (object.type === "rock" || object.type === "stone") {
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(12, 16, object.r * 0.9, object.r * 0.55, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = object.type === "rock" ? "#6f828a" : "#81929a";
    ctx.strokeStyle = "#b6c4c9";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-object.r * 0.65, -object.r * 0.2);
    ctx.lineTo(-object.r * 0.2, -object.r * 0.72);
    ctx.lineTo(object.r * 0.55, -object.r * 0.38);
    ctx.lineTo(object.r * 0.72, object.r * 0.24);
    ctx.lineTo(object.r * 0.12, object.r * 0.68);
    ctx.lineTo(-object.r * 0.55, object.r * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (object.type === "wreck") {
    ctx.rotate(0.65);
    ctx.fillStyle = "#26313a";
    ctx.fillRect(-object.r * 0.7, -18, object.r * 1.4, 36);
    ctx.fillStyle = "#47515a";
    ctx.fillRect(-object.r * 0.2, -34, object.r * 0.35, 68);
  } else if (object.type === "buoy") {
    ctx.fillStyle = "#f4f0d2";
    ctx.beginPath();
    ctx.arc(0, 0, object.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d94d4d";
    ctx.fillRect(-object.r, -6, object.r * 2, 12);
  } else if (object.type === "crate") {
    ctx.fillStyle = "#b47a32";
    ctx.fillRect(-object.r, -object.r, object.r * 2, object.r * 2);
    ctx.strokeStyle = "#f0c06b";
    ctx.strokeRect(-object.r, -object.r, object.r * 2, object.r * 2);
  }
  ctx.restore();
}

function drawShip(entity, kind) {
  const drawX = entity.renderX ?? entity.x;
  const drawY = entity.renderY ?? entity.y;
  const drawAngle = entity.renderAngle ?? entity.angle;
  const p = worldToScreen(drawX, drawY);
  if (p.x < -entity.size * 2 || p.y < -entity.size * 2 || p.x > innerWidth + entity.size * 2 || p.y > innerHeight + entity.size * 2) return;
  const mine = entity.id === myId;
  const mineEntity = me();
  const ally = mineEntity && entity.allianceId && entity.allianceId === mineEntity.allianceId && !mine;
  const accent = shipDefinitions[entity.ship]?.accent || "#46a8ff";
  const statusColor = kind === "bot" ? "#c34d55" : ally ? "#56d686" : mine ? "#46a8ff" : "#ff9c57";
  const bigBot = kind === "bot" && (entity.botClass === "large" || entity.botClass === "elite" || entity.size >= 92);
  const eliteBot = kind === "bot" && (entity.botClass === "elite" || entity.threat >= 5);
  if (bigBot) {
    ctx.fillStyle = eliteBot ? "rgba(255, 88, 44, 0.18)" : "rgba(255, 180, 72, 0.12)";
    ctx.beginPath();
    ctx.ellipse(p.x + 5, p.y + 10, entity.size * 1.75, entity.size * 1.05, drawAngle, 0, Math.PI * 2);
    ctx.fill();
  }
  if (eliteBot) {
    ctx.strokeStyle = "rgba(255, 74, 42, 0.88)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, entity.size * 1.68, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (entity.spawnProtected) {
    ctx.strokeStyle = `rgba(130, 215, 255, ${0.45 + Math.sin(performance.now() / 120) * 0.2})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, entity.size * 1.65, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (entity.healing) {
    ctx.fillStyle = "rgba(86, 214, 134, 0.18)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, entity.size * 1.45, 0, Math.PI * 2);
    ctx.fill();
  }
  if ((entity.speed || 0) > 8) {
    ctx.strokeStyle = entity.boosting ? "rgba(68,215,242,0.55)" : "rgba(210,240,255,0.24)";
    ctx.lineWidth = entity.boosting ? 4 : bigBot ? 3 : 2;
    const wake = entity.boosting ? entity.size * 1.9 : bigBot ? entity.size * 1.65 : entity.size * 1.35;
    ctx.beginPath();
    ctx.moveTo(p.x - Math.cos(drawAngle) * entity.size * 0.7, p.y - Math.sin(drawAngle) * entity.size * 0.7);
    ctx.lineTo(p.x - Math.cos(drawAngle) * wake + Math.sin(drawAngle) * 12, p.y - Math.sin(drawAngle) * wake - Math.cos(drawAngle) * 12);
    ctx.moveTo(p.x - Math.cos(drawAngle) * entity.size * 0.7, p.y - Math.sin(drawAngle) * entity.size * 0.7);
    ctx.lineTo(p.x - Math.cos(drawAngle) * wake - Math.sin(drawAngle) * 12, p.y - Math.sin(drawAngle) * wake + Math.cos(drawAngle) * 12);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(drawAngle);
  drawShipBody(entity.ship || "Dinghy", entity.size, accent, statusColor, kind === "bot");
  if (entity.hitFlash) {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.beginPath();
    ctx.ellipse(0, 0, entity.size * 1.25, entity.size * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  ctx.restore();

  const tag = kind === "bot" ? "[BOT]" : ally ? "[ALLY]" : mine ? "[PLAYER]" : "[ENEMY]";
  ctx.font = "12px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillStyle = ally ? "#56d686" : kind === "bot" ? "#d0d3d7" : mine ? "#9ed1ff" : "#ffbd8a";
  const labelY = p.y - entity.size * 1.55 - 30;
  ctx.fillText(`${tag} ${entity.name} L${entity.level}`, p.x, labelY);
  const barWidth = bigBot ? 112 : 84;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(p.x - barWidth / 2, labelY + 8, barWidth, bigBot ? 10 : 8);
  ctx.fillStyle = entity.hp / entity.maxHp > 0.35 ? "#56d686" : "#ff716d";
  ctx.fillRect(p.x - barWidth / 2, labelY + 8, barWidth * Math.max(0, entity.hp / entity.maxHp), bigBot ? 10 : 8);
  if (entity.exiting) {
    ctx.fillStyle = "#ffd45a";
    ctx.fillText("EXITING", p.x, p.y + entity.size * 1.25 + 28);
  } else if (entity.spawnProtected) {
    ctx.fillStyle = "#9ed1ff";
    ctx.fillText(`PROTECTED ${entity.spawnProtectionRemaining}s`, p.x, p.y + entity.size * 1.25 + 28);
  } else if (entity.healing) {
    ctx.fillStyle = "#56d686";
    ctx.fillText("HEALING", p.x, p.y + entity.size * 1.25 + 28);
  }
}

function drawShipBody(ship, size, accent, statusColor, isBot) {
  const def = shipDefinitions[ship] || shipDefinitions.Dinghy;
  const shape = def.shape || "patrol";
  const armor = Math.max(0, Math.min(5, Math.floor(def.hp / 125)));
  const cannons = shape === "trident" ? 3 : shape === "catamaran" || shape === "tank" || shape === "fortress" || shape === "royal" ? 2 : 1;
  const slender = shape === "needle" || shape === "cutter";
  const heavyVisual = size >= 92;
  const eliteVisual = isBot && size >= 118;
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(-2, 5, size * (heavyVisual ? 1.45 : 1.22), size * (slender ? 0.56 : heavyVisual ? 0.96 : 0.78), 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2c3941";
  ctx.strokeStyle = statusColor;
  ctx.lineWidth = heavyVisual ? 5 : 3;

  if (shape === "needle" || ship === "Scout") {
    ctx.beginPath();
    ctx.moveTo(size * 1.45, 0);
    ctx.quadraticCurveTo(size * 0.25, -size * 0.55, -size * 1.2, -size * 0.34);
    ctx.lineTo(-size * 1.45, 0);
    ctx.quadraticCurveTo(size * 0.25, size * 0.55, size * 1.45, 0);
    ctx.fill();
    ctx.stroke();
    drawDeck(accent, -size * 0.1, 0, size * 1.3, size * 0.32);
    drawCannon(size * 0.38, 0, size * 0.9, 5);
  } else if (shape === "catamaran") {
    roundedHull(size * 1.2, size * 0.42, size * 0.38);
    ctx.translate(0, size * 0.52);
    roundedHull(size * 1.2, size * 0.42, size * 0.38);
    ctx.translate(0, -size * 0.52);
    drawDeck(accent, -size * 0.1, 0, size * 1.35, size * 0.38);
    drawCannon(size * 0.25, -size * 0.34, size * 0.86, 5);
    drawCannon(size * 0.25, size * 0.34, size * 0.86, 5);
  } else if (shape === "patrol" || ship === "Gunboat") {
    roundedHull(size * 1.35, size * 0.82, size * 0.42);
    drawDeck(accent, -size * 0.1, 0, size * 1.5, size * 0.45);
    drawCabin(-size * 0.2, 0, size * 0.72, size * 0.48);
    drawCannon(size * 0.28, 0, size * 1.05, 7);
  } else if (shape === "artillery" || ship === "Cannoner") {
    roundedHull(size * 1.45, size * 0.92, size * 0.32);
    drawDeck(accent, -size * 0.15, 0, size * 1.35, size * 0.42);
    drawCabin(-size * 0.35, 0, size * 0.85, size * 0.55);
    drawArmorPlates(size);
    drawCannon(size * 0.18, 0, size * 1.35, 12);
  } else if (shape === "tank" || ship === "Heavy") {
    roundedHull(size * 1.5, size * 1.05, size * 0.26);
    drawDeck(accent, -size * 0.22, 0, size * 1.35, size * 0.5);
    drawCabin(-size * 0.38, 0, size * 0.9, size * 0.62);
    drawArmorPlates(size);
    drawCannon(size * 0.15, -size * 0.28, size * 1.1, 9);
    drawCannon(size * 0.15, size * 0.28, size * 1.1, 9);
  } else if (shape === "raider" || shape === "cutter") {
    roundedHull(size * 1.38, size * 0.68, size * 0.46);
    drawDeck(accent, -size * 0.08, 0, size * 1.25, size * 0.34);
    drawCabin(-size * 0.3, 0, size * 0.58, size * 0.36);
    drawCannon(size * 0.26, 0, size * 0.95, 6);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.75, -size * 0.5);
    ctx.lineTo(size * 0.5, -size * 0.32);
    ctx.moveTo(-size * 0.75, size * 0.5);
    ctx.lineTo(size * 0.5, size * 0.32);
    ctx.stroke();
  } else if (shape === "breaker" || shape === "hammer") {
    roundedHull(size * 1.56, size * 0.96, size * 0.18);
    drawDeck(accent, -size * 0.18, 0, size * 1.1, size * 0.46);
    drawCabin(-size * 0.44, 0, size * 0.84, size * 0.54);
    drawArmorPlates(size);
    drawCannon(size * 0.08, 0, size * 1.3, 11);
  } else if (shape === "trident") {
    roundedHull(size * 1.42, size * 0.92, size * 0.34);
    drawDeck(accent, -size * 0.14, 0, size * 1.25, size * 0.44);
    drawCabin(-size * 0.34, 0, size * 0.75, size * 0.5);
    drawCannon(size * 0.2, -size * 0.34, size * 0.95, 7);
    drawCannon(size * 0.3, 0, size * 1.08, 7);
    drawCannon(size * 0.2, size * 0.34, size * 0.95, 7);
  } else if (shape === "fortress" || shape === "royal") {
    roundedHull(size * 1.62, size * 1.12, size * 0.2);
    drawDeck(accent, -size * 0.22, 0, size * 1.3, size * 0.56);
    drawCabin(-size * 0.46, 0, size * 0.95, size * 0.68);
    drawArmorPlates(size);
    drawCannon(size * 0.08, -size * 0.32, size * 1.18, 10);
    drawCannon(size * 0.08, size * 0.32, size * 1.18, 10);
    if (shape === "royal") {
      ctx.fillStyle = accent;
      ctx.fillRect(-size * 0.28, -size * 0.08, size * 0.35, size * 0.16);
    }
  } else {
    roundedHull(size * 1.18, size * 0.72, size * 0.42);
    drawDeck("#8b6a42", -size * 0.1, 0, size * 1.2, size * 0.5);
    drawCabin(-size * 0.16, 0, size * 0.5, size * 0.36);
    drawCannon(size * 0.22, 0, size * 0.82, 6);
  }
  if (armor > 1 && shape !== "needle") drawArmorPlates(size * (0.7 + armor * 0.06));
  if (heavyVisual) {
    drawArmorPlates(size * 1.18);
    drawCannon(size * -0.1, -size * 0.5, size * 0.75, 7);
    drawCannon(size * -0.1, size * 0.5, size * 0.75, 7);
  }
  if (eliteVisual) {
    drawCannon(size * -0.35, -size * 0.75, size * 0.7, 8);
    drawCannon(size * -0.35, size * 0.75, size * 0.7, 8);
    ctx.strokeStyle = "#ff6b35";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.05, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (cannons > 2) {
    ctx.fillStyle = accent;
    ctx.fillRect(-size * 0.1, -size * 0.08, size * 0.22, size * 0.16);
  }

  ctx.fillStyle = isBot ? "#d26a6a" : accent;
  ctx.beginPath();
  ctx.moveTo(size * 1.28, 0);
  ctx.lineTo(size * 0.84, -size * 0.16);
  ctx.lineTo(size * 0.84, size * 0.16);
  ctx.closePath();
  ctx.fill();
}

function drawDeck(color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 6);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawArmorPlates(size) {
  ctx.strokeStyle = "rgba(220,230,235,0.38)";
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.strokeRect(-size * 0.62 + i * size * 0.28, -size * 0.5, size * 0.2, size);
  }
}

function roundedHull(length, width, bow) {
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.quadraticCurveTo(length * 0.35, -width, -length * 0.75, -width * 0.78);
  ctx.quadraticCurveTo(-length, 0, -length * 0.75, width * 0.78);
  ctx.quadraticCurveTo(length * 0.35, width, length, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.moveTo(length * 0.75, 0);
  ctx.lineTo(-length * bow, 0);
  ctx.stroke();
}

function drawCabin(x, y, width, height) {
  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 4);
  ctx.fill();
  ctx.stroke();
}

function drawCannon(x, y, length, width) {
  ctx.strokeStyle = "#1f2830";
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + length, y);
  ctx.stroke();
  ctx.fillStyle = "#1f2830";
  ctx.beginPath();
  ctx.arc(x, y, width * 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawObjects() {
  for (const item of state.mapItems || []) {
    if (!isNearCamera(item.x, item.y, 100)) continue;
    drawItem(item);
  }
  for (const crate of state.lootCrates) {
    if (!isNearCamera(crate.x, crate.y, 80)) continue;
    const p = worldToScreen(crate.x, crate.y);
    ctx.fillStyle = "#ffd45a";
    ctx.shadowColor = "rgba(255,212,90,0.65)";
    ctx.shadowBlur = 14;
    ctx.fillRect(p.x - 16, p.y - 16, 32, 32);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#805f00";
    ctx.strokeRect(p.x - 16, p.y - 16, 32, 32);
  }
  for (const projectile of state.projectiles) {
    if (!isNearCamera(projectile.x, projectile.y, 30)) continue;
    const p = worldToScreen(projectile.x, projectile.y);
    ctx.fillStyle = "#ffd45a";
    ctx.shadowColor = "rgba(255, 175, 40, 0.8)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  for (const fx of state.effects || []) {
    if (!isNearCamera(fx.x, fx.y, 130)) continue;
    const p = worldToScreen(fx.x, fx.y);
    const life = Math.max(0, 1 - (fx.age || 0) / (fx.type === "explosion" ? 900 : 420));
    const radius = (fx.type === "explosion" ? 56 : 24) * (fx.size || 1) * (1.15 - life * 0.3);
    const gradient = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, radius);
    gradient.addColorStop(0, `rgba(255,245,180,${0.85 * life})`);
    gradient.addColorStop(0.35, `rgba(255,119,54,${0.62 * life})`);
    gradient.addColorStop(1, "rgba(255,70,30,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const bot of state.bots) drawShip(bot, "bot");
  for (const player of state.players) drawShip(player, "player");
}

function drawItem(item) {
  const p = worldToScreen(item.x, item.y);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.shadowBlur = 16;
  if (item.type === "repair") {
    ctx.shadowColor = "rgba(86,214,134,0.85)";
    ctx.fillStyle = "#1c8f58";
    ctx.fillRect(-20, -20, 40, 40);
    ctx.fillStyle = "#dfffe9";
    ctx.fillRect(-5, -15, 10, 30);
    ctx.fillRect(-15, -5, 30, 10);
  } else {
    ctx.shadowColor = "rgba(68,183,242,0.85)";
    ctx.fillStyle = "#176aaf";
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dff5ff";
    ctx.beginPath();
    ctx.moveTo(4, -18);
    ctx.lineTo(-10, 2);
    ctx.lineTo(2, 2);
    ctx.lineTo(-4, 18);
    ctx.lineTo(14, -5);
    ctx.lineTo(2, -5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawMinimap() {
  if (!state || !minimapVisible) return;
  const w = minimap.width;
  const mini = minimapState;
  const scale = w / (mini?.worldSize || state.worldSize);
  mctx.clearRect(0, 0, w, w);
  mctx.fillStyle = "#061827";
  mctx.fillRect(0, 0, w, w);
  for (const object of state.mapObjects || state.obstacles || []) {
    const x = object.x * scale;
    const y = object.y * scale;
    const r = Math.max(1.2, object.r * scale);
    mctx.fillStyle = object.type === "island" ? "rgba(216,189,119,0.82)" : object.type === "rock" || object.type === "stone" ? "rgba(150,166,174,0.72)" : "rgba(110,125,135,0.38)";
    mctx.beginPath();
    mctx.arc(x, y, r, 0, Math.PI * 2);
    mctx.fill();
  }
  mctx.fillStyle = "rgba(86,214,134,0.18)";
  mctx.beginPath();
  mctx.arc(state.safeZone.x * scale, state.safeZone.y * scale, state.safeZone.radius * scale, 0, Math.PI * 2);
  mctx.fill();
  mctx.fillStyle = "#9fffe0";
  mctx.font = "12px Segoe UI";
  mctx.fillText("H", state.safeZone.x * scale - 4, state.safeZone.y * scale + 4);
  for (const point of mini?.points || []) {
    if (point.type === "harbor") continue;
    if (point.type === "bot" || point.type === "eliteBot") {
      const radius = point.sizeClass === "elite" ? 4.4 : point.sizeClass === "large" ? 3.5 : point.sizeClass === "medium" ? 2.4 : 1.5;
      mctx.fillStyle = point.sizeClass === "elite" ? "#ff3f2f" : point.sizeClass === "large" ? "#ff9b38" : point.sizeClass === "medium" ? "#ff7f38" : "#ff4f4f";
      mctx.beginPath();
      mctx.arc(point.x * scale, point.y * scale, radius, 0, Math.PI * 2);
      mctx.fill();
      if (point.sizeClass === "elite") {
        mctx.strokeStyle = "#ffd45a";
        mctx.lineWidth = 1;
        mctx.stroke();
      }
    } else {
      mctx.fillStyle = point.type === "self" ? "#f5fbff" : point.type === "ally" ? "#56d686" : "#46a8ff";
      mctx.beginPath();
      if (point.type === "self") {
        mctx.arc(point.x * scale, point.y * scale, 3.5, 0, Math.PI * 2);
      } else {
        mctx.arc(point.x * scale, point.y * scale, point.type === "ally" ? 3 : 2.5, 0, Math.PI * 2);
      }
      mctx.fill();
    }
  }
  for (const crate of state.lootCrates || []) {
    mctx.fillStyle = "#ffd45a";
    mctx.fillRect(crate.x * scale - 1, crate.y * scale - 1, 2, 2);
  }
  for (const item of state.mapItems || []) {
    mctx.fillStyle = item.type === "repair" ? "#56d686" : "#44b7f2";
    mctx.fillRect(item.x * scale - 1, item.y * scale - 1, 2, 2);
  }
  mctx.fillStyle = "rgba(245,251,255,0.72)";
  mctx.font = "9px Segoe UI";
  mctx.fillText("N", w / 2 - 3, 10);
  mctx.fillText("S", w / 2 - 3, w - 6);
  mctx.fillText("W", 6, w / 2 + 3);
  mctx.fillText("E", w - 12, w / 2 + 3);
  mctx.fillText("P", 8, w - 24);
  mctx.fillStyle = "#56d686";
  mctx.fillText("A", 24, w - 24);
  mctx.fillStyle = "#ff4f4f";
  mctx.fillText("B", 40, w - 24);
}

function directionToNearest() {
  const mine = me();
  if (!mine) return "Nearest player: none";
  let best = null;
  let bestD = Infinity;
  for (const p of state.players) {
    if (p.id === myId) continue;
    const d = Math.hypot(p.x - mine.x, p.y - mine.y);
    if (d < bestD) {
      best = p;
      bestD = d;
    }
  }
  if (!best) return "Nearest player: none";
  const a = Math.atan2(best.y - mine.y, best.x - mine.x);
  const dirs = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
  return `Nearest player: ${dirs[Math.round(a / (Math.PI / 4) + 8) % 8]}`;
}

function directionFromTo(from, to) {
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  const dirs = ["E", "SE", "S", "SW", "W", "NW", "N", "NE"];
  return dirs[Math.round(a / (Math.PI / 4) + 8) % 8];
}

function updateHud() {
  const mine = me();
  if (!mine) return;
  progress.securedPoints = mine.securedPoints;
  progress.level = mine.level;
  document.getElementById("hudName").textContent = mine.name;
  document.getElementById("hudShip").textContent = mine.ship;
  connectionStatus.textContent = `${socketStatus}${pingMs ? ` | ${pingMs}ms` : ""}`;
  document.getElementById("hpBar").style.width = `${100 * mine.hp / mine.maxHp}%`;
  const boostPercent = mine.boostMax ? Math.max(0, Math.min(100, 100 * mine.boostEnergy / mine.boostMax)) : 0;
  const boostBar = document.getElementById("boostBar");
  boostBar.style.width = `${boostPercent}%`;
  boostBar.parentElement.classList.toggle("active", !!mine.boosting);
  progress.xp = mine.xp ?? progress.xp;
  document.getElementById("xpBar").style.width = `${100 * progress.xp / (100 + progress.level * 75)}%`;
  document.getElementById("levelText").textContent = `Level ${mine.level} | XP ${progress.xp} | Speed ${mine.speed || 0}`;
  document.getElementById("tempLoot").textContent = mine.temporaryLoot;
  document.getElementById("securedPoints").textContent = progress.securedPoints;
  const reloadReady = 1 - (mine.reloadRemaining || 0);
  const reloadText = reloadReady >= 1 ? "READY" : `Reload: ${(mine.reloadMs / 1000).toFixed(1)}s`;
  document.getElementById("weaponText").textContent = `${shipDefinitions[mine.ship]?.weapon || "Cannon"} | ${reloadText}`;
  document.getElementById("boostText").textContent = boostPercent <= 0 ? "BOOST EMPTY" : `BOOST ${Math.round(mine.boostEnergy)}/${Math.round(mine.boostMax)}`;
  document.getElementById("reloadBar").style.width = `${Math.round(reloadReady * 100)}%`;
  document.getElementById("exitStatus").textContent = mine.exiting ? `EXITING: ${mine.exitRemaining}s` : "";
  const effects = [];
  if (mine.spawnProtected) effects.push(`Spawn protection: ${mine.spawnProtectionRemaining}s`);
  if (mine.healing) effects.push("Healing");
  if (mine.boosting) effects.push("Boosting");
  if (boostPercent <= 0) effects.push("BOOST EMPTY");
  document.getElementById("effectStatus").textContent = effects.join(" | ");
  document.getElementById("zoneInfo").innerHTML = Object.entries(state.zoneCounts).map(([zone, count]) => `${zone}: ${count}`).join("<br>");
  document.getElementById("nearestInfo").textContent = directionToNearest();
  document.getElementById("harborInfo").textContent = `Harbor: ${directionFromTo(mine, state.safeZone)}`;
  document.getElementById("botInfo").textContent = `Bots online: ${state.botCount || state.bots.length} / ${state.botTarget || state.bots.length}`;
  document.getElementById("allianceStatus").textContent = mine.allianceId ? "Alliance active" : "No alliance";
  renderAllianceList();
  document.querySelector(".map-panel").classList.toggle("hidden", !minimapVisible);
  debugPanel.classList.toggle("hidden", !debugVisible);
  if (debugVisible) {
    const visibleObjects = (state.players?.length || 0) + (state.bots?.length || 0) + (state.projectiles?.length || 0) + (state.lootCrates?.length || 0) + (state.mapItems?.length || 0);
    debugPanel.textContent = [
      `FPS: ${fps}`,
      `Ping: ${pingMs || "--"}ms`,
      `Visible objects: ${visibleObjects}`,
      `Players: ${serverStats.players ?? state.players.length}`,
      `Bots: ${serverStats.bots ?? state.botCount} / ${serverStats.botTarget ?? state.botTarget}`,
      `Visible bots: ${state.bots?.length || 0}`,
      `Projectiles: ${serverStats.projectiles ?? state.projectiles.length}`,
      `Visible projectiles: ${state.projectiles?.length || 0}`,
      `Net updates/s: ${netRate}`,
      `Last payload: ${lastPayloadKb.toFixed(2)} KB`,
      `Server tick: ${serverStats.avgTickMs ?? "--"} ms`,
      `Full AI: ${serverStats.fullAiBots ?? "--"}`,
      `Medium AI: ${serverStats.mediumAiBots ?? "--"}`,
      `Sleep AI: ${serverStats.sleepBots ?? "--"}`,
      `Control: ${controlMode}`,
      `State payload: ${serverStats.statePayloadKb ?? "--"} KB`,
      `Minimap payload: ${serverStats.minimapPayloadKb ?? "--"} KB`,
      `State Hz: ${serverStats.stateHz ?? "--"}`,
      `Minimap Hz: ${serverStats.minimapHz ?? "--"}`,
      `Socket: ${socketStatus}`
    ].join("\n");
  }
}

function renderAllianceList() {
  if (!allianceList) return;
  if (!joined || !alliancePlayers.length) {
    allianceList.innerHTML = "";
    return;
  }
  allianceList.innerHTML = "";
  for (const player of alliancePlayers) {
    const row = document.createElement("div");
    row.className = `alliance-row ${player.allied ? "allied" : ""}`;
    const status = player.allied ? "Allied" : player.pending ? "Pending" : player.inCombat ? "Combat" : "Invite";
    row.innerHTML = `<div><strong>${player.name}</strong><small>Lv ${player.level} | ${player.distance}m | ${status}</small></div>`;
    const button = document.createElement("button");
    button.textContent = player.allied ? "Ally" : player.pending ? "Wait" : "Invite";
    button.disabled = player.allied || player.pending || player.inCombat;
    button.addEventListener("click", () => socket.emit("inviteAlliance", player.id));
    row.appendChild(button);
    allianceList.appendChild(row);
  }
}

function gameLoop() {
  frameCount++;
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  if (now - lastPerfSample >= 1000) {
    fps = frameCount;
    netRate = netUpdates;
    frameCount = 0;
    netUpdates = 0;
    lastPerfSample = now;
  }
  smoothEntities(dt);
  const mine = me();
  if (mine) {
    const targetX = mine.renderX ?? mine.x;
    const targetY = mine.renderY ?? mine.y;
    camera.x += (targetX - camera.x) * Math.min(1, dt * 8);
    camera.y += (targetY - camera.y) * Math.min(1, dt * 8);
  }
  drawWater();
  if (state) {
    drawWorld();
    drawObjects();
    drawMinimap();
    updateHud();
  }
  requestAnimationFrame(gameLoop);
}

function sendInput() {
  if (!joined || document.activeElement === chatInput) return;
  const mine = me();
  const angle = touchInput.angle ?? Math.atan2(mouse.y - innerHeight / 2, mouse.x - innerWidth / 2);
  const shoot = !!(keys[" "] || keys.mouse || touchInput.shoot);
  if (shoot) lastShotVisual = performance.now();
  socket.emit("input", {
    up: !!(keys.w || keys.arrowup || touchInput.up),
    down: !!(keys.s || keys.arrowdown || touchInput.down),
    left: !!(keys.a || keys.arrowleft || touchInput.left),
    right: !!(keys.d || keys.arrowright || touchInput.right),
    shoot,
    boost: !!(keys.shift || touchInput.boost),
    aimAngle: Number.isFinite(angle) ? angle : mine?.angle || 0
  });
}

function addChat({ channel, name, text }) {
  const line = document.createElement("div");
  line.textContent = `[${channel}] ${name}: ${text}`;
  chatMessages.appendChild(line);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

playButton.addEventListener("click", () => {
  if (joined) return;
  progress.nickname = nicknameInput.value.trim() || "Captain";
  progress.selectedShip = selectedShip;
  saveProgress();
  socket.emit("join", { nickname: progress.nickname, ship: selectedShip, progress });
  startScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  joined = true;
  updateMobileVisibility();
});

document.getElementById("exitButton").addEventListener("click", () => socket.emit("startExit"));
document.getElementById("backLobbyButton").addEventListener("click", () => {
  const mine = me();
  if (mine?.temporaryLoot > 0 && !confirm("You will lose your temporary loot. Go back to lobby?")) return;
  socket.emit("backToLobby");
});
document.getElementById("allyButton").addEventListener("click", () => socket.emit("allyNearest"));
document.getElementById("leaveAllyButton").addEventListener("click", () => socket.emit("leaveAlliance"));
settingsButton.addEventListener("click", () => hudSettings.classList.toggle("hidden"));
controlModeSelect.addEventListener("change", () => {
  controlMode = controlModeSelect.value;
  applyControlMode();
});
touchToggle.addEventListener("change", () => {
  controlMode = touchToggle.checked ? (matchMedia("(pointer: coarse)").matches ? "touch" : "hybrid") : "keyboard";
  applyControlMode();
});
chatToggle.addEventListener("change", () => {
  hudSettingsState.chatOpen = chatToggle.checked;
  saveHudSettings();
  applyHudSettings();
});
minimapSizeSelect.addEventListener("change", () => {
  hudSettingsState.minimapSize = minimapSizeSelect.value;
  saveHudSettings();
  applyHudSettings();
});
hudScaleSelect.addEventListener("change", () => {
  hudSettingsState.hudScale = hudScaleSelect.value;
  saveHudSettings();
  applyHudSettings();
});

chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && chatInput.value.trim()) {
    socket.emit("chat", { channel: chatChannel.value, text: chatInput.value });
    chatInput.value = "";
  }
  if (event.key === "Escape") chatInput.blur();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && document.activeElement !== chatInput) {
    event.preventDefault();
    chatInput.focus();
    return;
  }
  if (document.activeElement === chatInput) return;
  const key = event.key.toLowerCase();
  if (event.key === "F3") {
    event.preventDefault();
    debugVisible = !debugVisible;
    return;
  }
  if (key === "z") {
    const modes = ["close", "normal", "wide"];
    zoomMode = modes[(modes.indexOf(zoomMode) + 1) % modes.length];
    localStorage.setItem("battleHarborZoomMode", zoomMode);
    return;
  }
  keys[key] = true;
  if (key === "e") socket.emit("startExit");
  if (key === "m") minimapVisible = !minimapVisible;
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

canvas.addEventListener("mousedown", () => {
  keys.mouse = true;
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  if (event.deltaY > 0) zoomMode = "wide";
  else zoomMode = zoomMode === "wide" ? "normal" : "close";
  localStorage.setItem("battleHarborZoomMode", zoomMode);
}, { passive: false });

window.addEventListener("mouseup", () => {
  keys.mouse = false;
});

function updateMobileVisibility() {
  const showTouch = joined && controlMode !== "keyboard";
  mobileControls.classList.toggle("hidden", !showTouch);
  portraitHint.classList.toggle("hidden", !showTouch || innerWidth > innerHeight || controlMode === "keyboard");
}

function resetJoystick() {
  touchInput.up = false;
  touchInput.down = false;
  touchInput.left = false;
  touchInput.right = false;
  touchInput.active = false;
  touchInput.angle = null;
  joystickKnob.style.transform = "translate(0px, 0px)";
}

function handleJoystick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  const length = Math.min(48, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx);
  const nx = Math.cos(angle) * length;
  const ny = Math.sin(angle) * length;
  joystickKnob.style.transform = `translate(${nx}px, ${ny}px)`;
  touchInput.active = true;
  touchInput.up = ny < -18;
  touchInput.down = ny > 22;
  touchInput.left = nx < -18;
  touchInput.right = nx > 18;
  touchInput.angle = Math.atan2(ny, nx);
}

joystick.addEventListener("pointerdown", (event) => {
  joystick.setPointerCapture(event.pointerId);
  handleJoystick(event.clientX, event.clientY);
});

joystick.addEventListener("pointermove", (event) => {
  if (touchInput.active) handleJoystick(event.clientX, event.clientY);
});

joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);

function bindTouchButton(id, key, onTap) {
  const button = document.getElementById(id);
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (key) touchInput[key] = true;
    if (onTap) onTap();
  });
  button.addEventListener("pointerup", () => {
    if (key) touchInput[key] = false;
  });
  button.addEventListener("pointercancel", () => {
    if (key) touchInput[key] = false;
  });
}

bindTouchButton("touchShoot", "shoot");
bindTouchButton("touchBoost", "boost");
bindTouchButton("touchExit", null, () => socket.emit("startExit"));
bindTouchButton("touchMap", null, () => {
  minimapVisible = !minimapVisible;
});

window.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

socket.on("connect", () => {
  socketStatus = "Connected";
});

socket.io.on("reconnect_attempt", () => {
  socketStatus = "Reconnecting...";
});

socket.io.on("reconnect", () => {
  socketStatus = "Connected";
  if (joined) {
    socket.emit("join", { nickname: progress.nickname, ship: selectedShip, progress });
  }
});

socket.on("disconnect", () => {
  socketStatus = "Disconnected";
});

socket.on("connect_error", () => {
  socketStatus = "Connection error";
});

socket.on("joined", ({ id, worldSize, safeZone, obstacles, mapObjects }) => {
  myId = id;
  staticWorld = { worldSize, safeZone, obstacles, mapObjects };
});

socket.on("state", (nextState) => {
  netUpdates++;
  lastPayloadKb = new Blob([JSON.stringify(nextState)]).size / 1024;
  state = { ...staticWorld, ...ingestState(nextState) };
  const mine = me();
  if (mine) {
    progress.securedPoints = mine.securedPoints;
    progress.level = mine.level;
    saveProgress();
  }
});

socket.on("minimap", (nextMinimap) => {
  minimapState = nextMinimap;
});

socket.on("serverStats", (stats) => {
  serverStats = stats;
});

socket.on("allianceList", (players) => {
  alliancePlayers = Array.isArray(players) ? players : [];
  renderAllianceList();
});

socket.on("allianceInvite", (invite) => {
  const line = document.createElement("div");
  line.innerHTML = `[Alliance] System: ${invite.fromName} invited you.`;
  const actions = document.createElement("div");
  actions.className = "invite-actions";
  const accept = document.createElement("button");
  accept.textContent = "Accept";
  accept.addEventListener("click", () => socket.emit("respondAllianceInvite", { inviteId: invite.id, accept: true }));
  const decline = document.createElement("button");
  decline.textContent = "Decline";
  decline.addEventListener("click", () => socket.emit("respondAllianceInvite", { inviteId: invite.id, accept: false }));
  actions.append(accept, decline);
  line.appendChild(actions);
  chatMessages.appendChild(line);
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on("pingPong", (sentAt) => {
  pingMs = Math.max(0, Math.round(performance.now() - sentAt));
});

socket.on("progress", (nextProgress) => {
  progress = { ...progress, ...nextProgress };
  progress.shipUpgrades = normalizeShipUpgrades(progress.shipUpgrades);
  selectedShip = progress.selectedShip;
  saveProgress();
  renderShipCards();
});

socket.on("chat", addChat);
socket.on("system", (text) => addChat({ channel: "System", name: "System", text }));
socket.on("lobbyLeft", () => {
  joined = false;
  myId = null;
  state = null;
  minimapState = null;
  renderEntities.clear();
  keys.mouse = false;
  startScreen.classList.remove("hidden");
  hud.classList.add("hidden");
  updateMobileVisibility();
  renderShipCards();
});

setInterval(sendInput, 1000 / 30);
setInterval(() => {
  if (socket.connected) socket.emit("pingCheck", performance.now());
}, 2000);
window.addEventListener("resize", () => {
  resize();
  updateMobileVisibility();
});
nicknameInput.value = progress.nickname || "";
applyHudSettings();
applyControlMode();
renderShipCards();
resize();
updateMobileVisibility();
gameLoop();
