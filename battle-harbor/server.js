const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const WORLD_SIZE = 20000;
const TICK_RATE = 30;
const STATE_SEND_RATE = 12;
const MINIMAP_SEND_RATE = 1;
const VIEW_DISTANCE = 2800;
const VIEW_DISTANCE_SQ = VIEW_DISTANCE * VIEW_DISTANCE;
const SAFE_ZONE = { x: 10000, y: 10000, radius: 620 };
const MAX_BOTS_PER_PLAYER = 4;
const BASE_BOT_TARGET = 45;
const BOTS_PER_PLAYER_ONLINE = 3;
const MAX_TOTAL_BOTS = 60;
const SPAWN_PROTECTION_MS = 5000;
const HEAL_DELAY_MS = 5000;
const HEAL_RATE_PER_SECOND = 0.05;
const ITEM_LIMITS = { repair: 10, boost: 12 };
const BOOST_RECHARGE_AMOUNT = 50;
const DEFAULT_BOOST_MAX = 100;
const DEFAULT_BOOST_DRAIN = 25;
const BOOST_REGEN_DELAY_MS = 8000;
const BOOST_REGEN_PER_SECOND = 3;
const UPGRADE_MAX_LEVEL = 5;
const UPGRADE_BASE_COSTS = { hp: 300, speed: 350, turn: 250, damage: 500, reload: 600, boost: 400 };

app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    players: players.size,
    bots: bots.size,
    uptime: Math.round(process.uptime())
  });
});

const ships = {
  Dinghy: { price: 0, hp: 100, speed: 175, acceleration: 220, reverseSpeed: 55, friction: 0.965, turn: 4.5, damage: 18, fireRate: 2500, shots: 1, spread: 0, projectileSpeed: 520, range: 820, size: 54, boostMultiplier: 1.7, weapon: "quick cannon", description: "Starter ship, very simple" },
  Scout: { price: 500, hp: 80, speed: 225, acceleration: 285, reverseSpeed: 65, friction: 0.97, turn: 5.4, damage: 8, fireRate: 2200, shots: 2, spread: 0.1, projectileSpeed: 570, range: 780, size: 48, boostMultiplier: 1.8, weapon: "salvo cannon", description: "Very fast, but weak" },
  Gunboat: { price: 1500, hp: 150, speed: 160, acceleration: 185, reverseSpeed: 48, friction: 0.958, turn: 3.3, damage: 34, fireRate: 3000, shots: 1, spread: 0, projectileSpeed: 520, range: 880, size: 63, boostMultiplier: 1.55, weapon: "standard cannon", description: "Balanced ship" },
  Cannoner: { price: 3500, hp: 190, speed: 120, acceleration: 140, reverseSpeed: 36, friction: 0.952, turn: 2.25, damage: 70, fireRate: 3800, shots: 1, spread: 0, projectileSpeed: 500, range: 960, size: 72, boostMultiplier: 1.35, weapon: "heavy single shot", description: "High damage, slow handling" },
  Heavy: { price: 7500, hp: 280, speed: 95, acceleration: 118, reverseSpeed: 30, friction: 0.948, turn: 1.8, damage: 45, fireRate: 3500, shots: 2, spread: 0.14, projectileSpeed: 490, range: 900, size: 87, boostMultiplier: 1.25, weapon: "double cannon", description: "High HP and damage, slow" },
  Skimmer: { price: 11000, hp: 95, speed: 235, acceleration: 300, reverseSpeed: 72, friction: 0.972, turn: 5.8, damage: 16, fireRate: 2400, shots: 2, spread: 0.08, projectileSpeed: 590, range: 790, size: 50, boostMultiplier: 1.85, weapon: "skimmer salvo", description: "Fast hit-and-run ship" },
  "Patrol MK2": { price: 15000, hp: 170, speed: 168, acceleration: 200, reverseSpeed: 52, friction: 0.96, turn: 3.6, damage: 38, fireRate: 2900, shots: 1, spread: 0, projectileSpeed: 535, range: 890, size: 66, boostMultiplier: 1.55, weapon: "patrol cannon", description: "Improved standard boat" },
  Raider: { price: 21000, hp: 160, speed: 190, acceleration: 225, reverseSpeed: 58, friction: 0.964, turn: 4.2, damage: 30, fireRate: 2600, shots: 2, spread: 0.1, projectileSpeed: 550, range: 860, size: 62, boostMultiplier: 1.65, weapon: "raider twins", description: "Aggressive hunter" },
  "Twin Scout": { price: 28000, hp: 135, speed: 210, acceleration: 255, reverseSpeed: 62, friction: 0.968, turn: 4.9, damage: 18, fireRate: 2400, shots: 2, spread: 0.16, projectileSpeed: 570, range: 830, size: 58, boostMultiplier: 1.75, weapon: "wide twin salvo", description: "Fast double shots" },
  "Iron Patrol": { price: 36000, hp: 230, speed: 145, acceleration: 170, reverseSpeed: 44, friction: 0.956, turn: 3, damage: 42, fireRate: 3100, shots: 1, spread: 0, projectileSpeed: 525, range: 910, size: 76, boostMultiplier: 1.4, weapon: "iron cannon", description: "Armored all-rounder" },
  "Storm Cutter": { price: 46000, hp: 170, speed: 205, acceleration: 245, reverseSpeed: 65, friction: 0.969, turn: 5.8, damage: 36, fireRate: 2800, shots: 1, spread: 0, projectileSpeed: 590, range: 900, size: 61, boostMultiplier: 1.7, weapon: "cutter cannon", description: "Extremely agile" },
  Barracuda: { price: 58000, hp: 180, speed: 215, acceleration: 255, reverseSpeed: 66, friction: 0.968, turn: 4.7, damage: 48, fireRate: 3200, shots: 1, spread: 0, projectileSpeed: 600, range: 930, size: 64, boostMultiplier: 1.75, weapon: "hunter cannon", description: "Fast high-damage hunter" },
  Breaker: { price: 72000, hp: 280, speed: 118, acceleration: 145, reverseSpeed: 36, friction: 0.952, turn: 2.4, damage: 62, fireRate: 3400, shots: 1, spread: 0, projectileSpeed: 520, range: 880, size: 82, boostMultiplier: 1.3, weapon: "breaker cannon", description: "Heavy close fighter" },
  Longshot: { price: 90000, hp: 210, speed: 140, acceleration: 160, reverseSpeed: 43, friction: 0.954, turn: 2.9, damage: 78, fireRate: 4100, shots: 1, spread: 0, projectileSpeed: 620, range: 1250, size: 75, boostMultiplier: 1.35, weapon: "long-range cannon", description: "High range artillery" },
  Guardian: { price: 115000, hp: 360, speed: 105, acceleration: 130, reverseSpeed: 34, friction: 0.95, turn: 2.2, damage: 45, fireRate: 3200, shots: 2, spread: 0.12, projectileSpeed: 510, range: 930, size: 90, boostMultiplier: 1.25, weapon: "defense twins", description: "Defensive heavyweight" },
  Trident: { price: 145000, hp: 300, speed: 128, acceleration: 150, reverseSpeed: 40, friction: 0.953, turn: 2.7, damage: 34, fireRate: 3300, shots: 3, spread: 0.18, projectileSpeed: 525, range: 920, size: 84, boostMultiplier: 1.35, weapon: "triple cannon", description: "Three cannons" },
  Viper: { price: 180000, hp: 220, speed: 230, acceleration: 280, reverseSpeed: 72, friction: 0.97, turn: 5.5, damage: 52, fireRate: 3000, shots: 1, spread: 0, projectileSpeed: 620, range: 950, size: 66, boostMultiplier: 1.9, weapon: "viper lance", description: "Fast elite hunter" },
  Hammerhead: { price: 225000, hp: 420, speed: 95, acceleration: 118, reverseSpeed: 30, friction: 0.948, turn: 1.95, damage: 95, fireRate: 4300, shots: 1, spread: 0, projectileSpeed: 540, range: 940, size: 96, boostMultiplier: 1.2, weapon: "front cannon", description: "Heavy frontal assault" },
  Tempest: { price: 280000, hp: 330, speed: 150, acceleration: 180, reverseSpeed: 46, friction: 0.958, turn: 3.3, damage: 38, fireRate: 2500, shots: 3, spread: 0.2, projectileSpeed: 555, range: 910, size: 82, boostMultiplier: 1.45, weapon: "tempest salvo", description: "Fast salvos" },
  Fortress: { price: 350000, hp: 560, speed: 72, acceleration: 95, reverseSpeed: 24, friction: 0.944, turn: 1.45, damage: 62, fireRate: 3900, shots: 2, spread: 0.12, projectileSpeed: 505, range: 930, size: 108, boostMultiplier: 1.15, weapon: "fortress guns", description: "Extremely defensive" },
  Phantom: { price: 430000, hp: 260, speed: 240, acceleration: 290, reverseSpeed: 75, friction: 0.972, turn: 6, damage: 50, fireRate: 2800, shots: 1, spread: 0, projectileSpeed: 640, range: 960, size: 67, boostMultiplier: 1.95, weapon: "phantom cannon", description: "Very fast and agile" },
  Leviathan: { price: 530000, hp: 650, speed: 66, acceleration: 86, reverseSpeed: 22, friction: 0.942, turn: 1.25, damage: 105, fireRate: 4600, shots: 1, spread: 0, projectileSpeed: 520, range: 1000, size: 118, boostMultiplier: 1.1, weapon: "leviathan gun", description: "Huge endgame tank" },
  Reaper: { price: 650000, hp: 420, speed: 125, acceleration: 145, reverseSpeed: 38, friction: 0.952, turn: 2.5, damage: 125, fireRate: 5000, shots: 1, spread: 0, projectileSpeed: 590, range: 1120, size: 92, boostMultiplier: 1.25, weapon: "reaper cannon", description: "Extreme damage" },
  Monarch: { price: 800000, hp: 520, speed: 145, acceleration: 165, reverseSpeed: 43, friction: 0.955, turn: 2.8, damage: 90, fireRate: 3800, shots: 2, spread: 0.13, projectileSpeed: 570, range: 980, size: 102, boostMultiplier: 1.35, weapon: "royal broadside", description: "Endgame all-rounder" },
  "Harbor King": { price: 1000000, hp: 700, speed: 88, acceleration: 105, reverseSpeed: 28, friction: 0.945, turn: 1.65, damage: 115, fireRate: 4300, shots: 2, spread: 0.15, projectileSpeed: 545, range: 1010, size: 120, boostMultiplier: 1.1, weapon: "king cannons", description: "Strongest ship, balanced by weight" }
};

const botTiers = [
  { minLevel: 1, maxLevel: 5, role: "ScoutBot", name: "ScoutBot Dinghy", hp: 72, speed: 112, damage: 9, fireRate: 2500, loot: 55, xp: 40, size: 46, ship: "Dinghy", preferredRange: 360, orbit: 0.55, threat: 1 },
  { minLevel: 4, maxLevel: 10, role: "RaiderBot", name: "RaiderBot Patrol", hp: 120, speed: 102, damage: 14, fireRate: 2800, loot: 110, xp: 70, size: 54, ship: "Scout", preferredRange: 330, orbit: 0.25, threat: 2 },
  { minLevel: 9, maxLevel: 18, role: "GunnerBot", name: "GunnerBot Iron", hp: 175, speed: 84, damage: 22, fireRate: 3000, loot: 190, xp: 115, size: 64, ship: "Gunboat", preferredRange: 590, orbit: 0.1, threat: 3 },
  { minLevel: 14, maxLevel: 26, role: "TankBot", name: "TankBot Heavy", hp: 300, speed: 66, damage: 34, fireRate: 3600, loot: 310, xp: 170, size: 78, ship: "Heavy", preferredRange: 430, orbit: 0.05, threat: 4 },
  { minLevel: 20, maxLevel: 999, role: "EliteBot", name: "EliteBot Monarch", hp: 390, speed: 92, damage: 44, fireRate: 3100, loot: 520, xp: 260, size: 84, ship: "Monarch", preferredRange: 620, orbit: 0.35, threat: 5 }
];

const mapObjects = [
  { type: "island", x: 7600, y: 8600, r: 520, collision: true },
  { type: "island", x: 11850, y: 9200, r: 430, collision: true },
  { type: "island", x: 8700, y: 12350, r: 470, collision: true },
  { type: "island", x: 13200, y: 12700, r: 610, collision: true },
  { type: "rock", x: 5500, y: 4700, r: 230, collision: true },
  { type: "rock", x: 14600, y: 4700, r: 280, collision: true },
  { type: "rock", x: 5200, y: 15100, r: 260, collision: true },
  { type: "rock", x: 15600, y: 15700, r: 330, collision: true },
  { type: "rock", x: 10300, y: 5900, r: 190, collision: true },
  { type: "rock", x: 11100, y: 14500, r: 210, collision: true },
  { type: "stone", x: 3700, y: 9000, r: 95, collision: true },
  { type: "stone", x: 4100, y: 9300, r: 70, collision: true },
  { type: "stone", x: 16400, y: 10600, r: 95, collision: true },
  { type: "stone", x: 16780, y: 10880, r: 80, collision: true },
  { type: "wreck", x: 6200, y: 12800, r: 150, collision: false },
  { type: "wreck", x: 14150, y: 7300, r: 170, collision: false },
  { type: "buoy", x: 9500, y: 9450, r: 28, collision: false },
  { type: "buoy", x: 10500, y: 9450, r: 28, collision: false },
  { type: "crate", x: 9400, y: 10500, r: 34, collision: false },
  { type: "crate", x: 10600, y: 10550, r: 34, collision: false }
];
const obstacles = mapObjects.filter((object) => object.collision);

const blockedWords = ["badword", "insultword", "slurword", "threatword", "adultword"];
const players = new Map();
const bots = new Map();
const projectiles = new Map();
const lootCrates = new Map();
const mapItems = new Map();
let nextBotId = 1;
let nextProjectileId = 1;
let nextCrateId = 1;
let nextItemId = 1;
let nextAllianceId = 1;
let lastBotPopulationCheck = 0;
const worldEffects = [];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distanceSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function nearViewer(entity, viewer, rangeSq = VIEW_DISTANCE_SQ) {
  return !viewer || entity.id === viewer.id || distanceSq(entity, viewer) <= rangeSq;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function angleTo(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function wrapAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function xpNeeded(level) {
  return 100 + level * 75;
}

function zoneAt(x, y) {
  if (Math.hypot(x - SAFE_ZONE.x, y - SAFE_ZONE.y) <= SAFE_ZONE.radius) return "Harbor";
  const d = Math.hypot(x - SAFE_ZONE.x, y - SAFE_ZONE.y);
  if (d < 4200) return "Coast";
  if (x < WORLD_SIZE * 0.55 && y > WORLD_SIZE * 0.42) return "Wreck Field";
  if (x > WORLD_SIZE * 0.58 || y < WORLD_SIZE * 0.35) return "Storm Zone";
  return "Deep Water";
}

function isSafe(entity) {
  return distance(entity, SAFE_ZONE) <= SAFE_ZONE.radius;
}

function getBotTier(level) {
  return botTiers.find((tier) => level >= tier.minLevel && level <= tier.maxLevel) || botTiers[0];
}

function getBotTierForZone(zone) {
  const roll = Math.random();
  if (zone === "Coast") return roll < 0.72 ? botTiers[0] : botTiers[1];
  if (zone === "Wreck Field") return roll < 0.45 ? botTiers[1] : roll < 0.82 ? botTiers[2] : botTiers[3];
  if (zone === "Storm Zone") return roll < 0.35 ? botTiers[2] : roll < 0.82 ? botTiers[3] : botTiers[4];
  return roll < 0.5 ? botTiers[1] : roll < 0.85 ? botTiers[2] : botTiers[4];
}

function sanitizeName(name) {
  const clean = String(name || "Captain").replace(/[^\w -]/g, "").trim().slice(0, 16);
  return clean || "Captain";
}

function sanitizeProgress(progress = {}) {
  const level = clamp(Number(progress.level) || 1, 1, 99);
  const xp = clamp(Number(progress.xp) || 0, 0, 999999);
  const securedPoints = clamp(Number(progress.securedPoints) || 0, 0, 9999999);
  const unlockedShips = Array.isArray(progress.unlockedShips) ? progress.unlockedShips.filter((name) => ships[name]) : ["Dinghy"];
  if (!unlockedShips.includes("Dinghy")) unlockedShips.push("Dinghy");
  let selectedShip = ships[progress.selectedShip] ? progress.selectedShip : "Dinghy";
  if (!unlockedShips.includes(selectedShip)) selectedShip = "Dinghy";
  return { level, xp, securedPoints, unlockedShips, selectedShip, shipUpgrades: sanitizeShipUpgrades(progress.shipUpgrades) };
}

function blankUpgradeSet() {
  return { hp: 0, speed: 0, turn: 0, damage: 0, reload: 0, boost: 0 };
}

function sanitizeShipUpgrades(shipUpgrades = {}) {
  const result = {};
  for (const shipName of Object.keys(ships)) {
    result[shipName] = blankUpgradeSet();
    const source = shipUpgrades?.[shipName] || {};
    for (const key of Object.keys(result[shipName])) {
      result[shipName][key] = clamp(Math.floor(Number(source[key]) || 0), 0, UPGRADE_MAX_LEVEL);
    }
  }
  return result;
}

function upgradeCost(type, currentLevel) {
  return UPGRADE_BASE_COSTS[type] * (currentLevel + 1);
}

function getShipConfig(shipName, shipUpgrades = {}) {
  const base = ships[shipName] || ships.Dinghy;
  const upgrades = shipUpgrades[shipName] || blankUpgradeSet();
  const heavySpeedFactor = shipName === "Heavy" ? 0.55 : shipName === "Cannoner" ? 0.7 : 1;
  const boostLevel = upgrades.boost || 0;
  return {
    ...base,
    hp: Math.round(base.hp * (1 + upgrades.hp * 0.08)),
    speed: base.speed * (1 + upgrades.speed * 0.05 * heavySpeedFactor),
    acceleration: base.acceleration * (1 + upgrades.speed * 0.05 * heavySpeedFactor),
    reverseSpeed: base.reverseSpeed * (1 + upgrades.speed * 0.035 * heavySpeedFactor),
    turn: base.turn * (1 + upgrades.turn * 0.06),
    damage: Math.round(base.damage * (1 + upgrades.damage * 0.07)),
    fireRate: Math.max(1500, Math.round(base.fireRate * (1 - upgrades.reload * 0.05))),
    boostMax: DEFAULT_BOOST_MAX * (1 + boostLevel * 0.1),
    boostDrainPerSecond: DEFAULT_BOOST_DRAIN * (1 - boostLevel * 0.04),
    boostMultiplier: base.boostMultiplier
  };
}

function chatAllowed(player, text) {
  const now = Date.now();
  const message = String(text || "").trim();
  if (!message || message.length > 120) return false;
  if (now - player.lastChatAt < 1000) return false;
  if (/(.)\1{8,}/i.test(message)) return false;
  const lower = message.toLowerCase();
  if (blockedWords.some((word) => lower.includes(word))) return false;
  player.lastChatAt = now;
  return message;
}

function harborPoint() {
  const a = Math.random() * Math.PI * 2;
  const r = Math.random() * 180;
  return { x: SAFE_ZONE.x + Math.cos(a) * r, y: SAFE_ZONE.y + Math.sin(a) * r };
}

function spawnZonesForLevel(level) {
  if (level <= 5) return ["Coast"];
  if (level <= 15) return ["Coast", "Wreck Field"];
  return ["Wreck Field", "Storm Zone", "Coast"];
}

function randomPointForZone(zone) {
  if (zone === "Coast") {
    const a = Math.random() * Math.PI * 2;
    const r = 1700 + Math.random() * 2500;
    return { x: SAFE_ZONE.x + Math.cos(a) * r, y: SAFE_ZONE.y + Math.sin(a) * r };
  }
  if (zone === "Wreck Field") {
    return { x: 2500 + Math.random() * 8500, y: 8800 + Math.random() * 8200 };
  }
  if (zone === "Storm Zone") {
    const side = Math.random() < 0.55;
    return side
      ? { x: 11800 + Math.random() * 6200, y: 5200 + Math.random() * 9800 }
      : { x: 4000 + Math.random() * 9000, y: 1500 + Math.random() * 5000 };
  }
  return randomWorldPoint();
}

function isValidPlayerSpawn(x, y, level, relaxed = false) {
  const margin = relaxed ? 500 : 700;
  if (x < margin || y < margin || x > WORLD_SIZE - margin || y > WORLD_SIZE - margin) return false;
  if (Math.hypot(x - SAFE_ZONE.x, y - SAFE_ZONE.y) < 1200) return false;
  const zone = zoneAt(x, y);
  if (zone === "Harbor") return false;
  if (zone === "Storm Zone" && level < 16) return false;
  if (!relaxed && !spawnZonesForLevel(level).includes(zone)) return false;
  if (obstacles.some((o) => Math.hypot(x - o.x, y - o.y) < o.r + 300)) return false;
  if ([...players.values()].some((p) => Math.hypot(x - p.x, y - p.y) < 700)) return false;
  if ([...bots.values()].some((b) => Math.hypot(x - b.x, y - b.y) < 500)) return false;
  return true;
}

function findValidSpawnPoint(playerLevel) {
  const zones = spawnZonesForLevel(playerLevel);
  for (let i = 0; i < 120; i++) {
    const zone = zones[Math.floor(Math.random() * zones.length)];
    const point = randomPointForZone(zone);
    if (isValidPlayerSpawn(point.x, point.y, playerLevel)) return point;
  }
  for (let i = 0; i < 80; i++) {
    const point = randomPointForZone("Coast");
    if (isValidPlayerSpawn(point.x, point.y, playerLevel, true)) return point;
  }
  return { x: SAFE_ZONE.x + 2100, y: SAFE_ZONE.y + 400 };
}

function validSpawn(x, y) {
  if (Math.hypot(x - SAFE_ZONE.x, y - SAFE_ZONE.y) < SAFE_ZONE.radius + 500) return false;
  return !obstacles.some((o) => Math.hypot(x - o.x, y - o.y) < o.r + 140);
}

function spawnBotNear(player) {
  if (bots.size >= MAX_TOTAL_BOTS) return;
  const tier = getBotTier(player.level);
  for (let i = 0; i < 20; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1200 + Math.random() * 2200;
    const x = clamp(player.x + Math.cos(a) * r, 120, WORLD_SIZE - 120);
    const y = clamp(player.y + Math.sin(a) * r, 120, WORLD_SIZE - 120);
    if (!validSpawn(x, y)) continue;
    const id = `bot-${nextBotId++}`;
    bots.set(id, {
      id, type: "bot", name: tier.name, ship: tier.ship, level: Math.max(1, player.level), x, y,
      angle: Math.random() * Math.PI * 2, vx: 0, vy: 0, hp: tier.hp, maxHp: tier.hp, speed: tier.speed,
      damage: tier.damage, loot: tier.loot, xp: tier.xp, size: tier.size, lastShot: 0,
      targetId: null, spawnX: x, spawnY: y, damageLog: new Map(), nextTargetAt: 0,
      patrolAngle: Math.random() * Math.PI * 2
    });
    return;
  }
}

function spawnBotAt(point, tier) {
  const id = `bot-${nextBotId++}`;
  bots.set(id, {
    id, type: "bot", name: tier.name, ship: tier.ship, level: tier.minLevel, x: point.x, y: point.y,
    angle: Math.random() * Math.PI * 2, vx: 0, vy: 0, hp: tier.hp, maxHp: tier.hp, speed: tier.speed,
    damage: tier.damage, fireRate: tier.fireRate, loot: tier.loot, xp: tier.xp, size: tier.size, lastShot: 0,
    role: tier.role, preferredRange: tier.preferredRange, orbit: tier.orbit, threat: tier.threat,
    targetId: null, spawnX: point.x, spawnY: point.y, damageLog: new Map(), nextTargetAt: 0,
    patrolAngle: Math.random() * Math.PI * 2, orbitDirection: Math.random() < 0.5 ? -1 : 1
  });
}

function maintainBots() {
  const activePlayers = [...players.values()];
  if (!activePlayers.length) return;
  for (const player of activePlayers) {
    const nearby = [...bots.values()].filter((bot) => distance(bot, player) < 2200).length;
    const dynamicLimit = Math.min(MAX_TOTAL_BOTS, activePlayers.length * MAX_BOTS_PER_PLAYER + 8);
    if (nearby < 3 && bots.size < dynamicLimit) {
      spawnBotNear(player);
    }
  }
}

function desiredBotCount() {
  const online = players.size;
  if (!online) return 0;
  return Math.min(MAX_TOTAL_BOTS, BASE_BOT_TARGET + Math.max(0, online - 1) * BOTS_PER_PLAYER_ONLINE);
}

function botZoneTarget(zone, target) {
  const weights = { Coast: 0.35, "Wreck Field": 0.35, "Storm Zone": 0.25, "Deep Water": 0.05 };
  return Math.round(target * (weights[zone] || 0));
}

function validBotSpawn(point) {
  if (point.x < 500 || point.y < 500 || point.x > WORLD_SIZE - 500 || point.y > WORLD_SIZE - 500) return false;
  if (Math.hypot(point.x - SAFE_ZONE.x, point.y - SAFE_ZONE.y) < SAFE_ZONE.radius + 500) return false;
  if (obstacles.some((o) => Math.hypot(point.x - o.x, point.y - o.y) < o.r + 300)) return false;
  if ([...players.values()].some((p) => Math.hypot(point.x - p.x, point.y - p.y) < 700)) return false;
  if ([...lootCrates.values()].some((c) => Math.hypot(point.x - c.x, point.y - c.y) < 120)) return false;
  if ([...mapItems.values()].some((i) => Math.hypot(point.x - i.x, point.y - i.y) < 120)) return false;
  return zoneAt(point.x, point.y) !== "Harbor";
}

function findBotSpawnPoint(zone) {
  for (let i = 0; i < 80; i++) {
    const point = randomPointForZone(zone);
    if (validBotSpawn(point)) return point;
  }
  return null;
}

function maintainBotPopulation(force = false) {
  const now = Date.now();
  if (!force && now - lastBotPopulationCheck < 3500) return;
  lastBotPopulationCheck = now;
  const target = desiredBotCount();
  if (!target) {
    bots.clear();
    return;
  }
  if (bots.size > target) {
    const removable = [...bots.values()].filter((bot) => [...players.values()].every((player) => distance(bot, player) > 2200));
    while (bots.size > target && removable.length) {
      bots.delete(removable.pop().id);
    }
  }
  const zones = ["Coast", "Wreck Field", "Storm Zone", "Deep Water"];
  const counts = Object.fromEntries(zones.map((zone) => [zone, 0]));
  for (const bot of bots.values()) {
    const zone = zoneAt(bot.x, bot.y);
    if (counts[zone] !== undefined) counts[zone]++;
  }
  let guard = 0;
  while (bots.size < target && guard++ < 80) {
    const zone = zones.find((candidate) => counts[candidate] < botZoneTarget(candidate, target)) || zones[Math.floor(Math.random() * zones.length)];
    const point = findBotSpawnPoint(zone);
    if (!point) continue;
    spawnBotAt(point, getBotTierForZone(zone));
    counts[zone]++;
  }
}

function randomWorldPoint() {
  for (let i = 0; i < 60; i++) {
    const x = 900 + Math.random() * (WORLD_SIZE - 1800);
    const y = 900 + Math.random() * (WORLD_SIZE - 1800);
    if (validSpawn(x, y)) return { x, y };
  }
  return { x: SAFE_ZONE.x + 1800, y: SAFE_ZONE.y };
}

function spawnItem(type) {
  const point = randomWorldPoint();
  const id = `item-${nextItemId++}`;
  mapItems.set(id, { id, type, x: point.x, y: point.y, r: 42, expiresAt: Date.now() + 180000 });
}

function maintainItems() {
  const counts = { repair: 0, boost: 0 };
  for (const item of mapItems.values()) counts[item.type]++;
  while (counts.repair < ITEM_LIMITS.repair) {
    spawnItem("repair");
    counts.repair++;
  }
  while (counts.boost < ITEM_LIMITS.boost) {
    spawnItem("boost");
    counts.boost++;
  }
}

function applyObstaclePush(entity, oldX, oldY) {
  for (const obstacle of obstacles) {
    const min = obstacle.r + entity.size;
    if (Math.hypot(entity.x - obstacle.x, entity.y - obstacle.y) < min) {
      entity.x = oldX;
      entity.y = oldY;
      entity.vx = -(entity.vx || 0) * 0.18;
      entity.vy = -(entity.vy || 0) * 0.18;
      entity.angle += 0.2;
      break;
    }
  }
}

function speedOf(entity) {
  return Math.hypot(entity.vx || 0, entity.vy || 0);
}

function updateBoatPhysics(entity, controls, config, dt) {
  const oldX = entity.x;
  const oldY = entity.y;
  const movingFactor = clamp(speedOf(entity) / Math.max(60, config.speed), 0.35, 1);
  entity.angle = wrapAngle(entity.angle + controls.turn * config.turn * movingFactor * dt);

  if (controls.throttle > 0) {
    entity.vx += Math.cos(entity.angle) * config.acceleration * controls.throttle * dt;
    entity.vy += Math.sin(entity.angle) * config.acceleration * controls.throttle * dt;
  } else if (controls.throttle < 0) {
    entity.vx += Math.cos(entity.angle + Math.PI) * config.acceleration * 0.55 * Math.abs(controls.throttle) * dt;
    entity.vy += Math.sin(entity.angle + Math.PI) * config.acceleration * 0.55 * Math.abs(controls.throttle) * dt;
  }

  const maxSpeed = controls.throttle < 0 ? config.reverseSpeed : config.speed;
  const currentSpeed = speedOf(entity);
  if (currentSpeed > maxSpeed) {
    entity.vx = (entity.vx / currentSpeed) * maxSpeed;
    entity.vy = (entity.vy / currentSpeed) * maxSpeed;
  }

  const friction = Math.pow(config.friction, dt * 60);
  entity.vx *= friction;
  entity.vy *= friction;
  if (Math.abs(entity.vx) < 0.02) entity.vx = 0;
  if (Math.abs(entity.vy) < 0.02) entity.vy = 0;

  entity.x = clamp(entity.x + entity.vx * dt, 35, WORLD_SIZE - 35);
  entity.y = clamp(entity.y + entity.vy * dt, 35, WORLD_SIZE - 35);
  applyObstaclePush(entity, oldX, oldY);
}

function canDamage(attacker, target) {
  if (!attacker || !target || attacker.id === target.id) return false;
  const now = Date.now();
  if (attacker.type === "player" && attacker.spawnProtectedUntil > now) return false;
  if (target.type === "player" && target.spawnProtectedUntil > now) return false;
  if (attacker.allianceId && target.allianceId && attacker.allianceId === target.allianceId) return false;
  return true;
}

function addWorldEffect(type, x, y, size = 1) {
  worldEffects.push({ id: `fx-${Date.now()}-${Math.random()}`, type, x, y, size, createdAt: Date.now() });
}

function fireProjectile(owner, now) {
  if (owner.type === "player" && owner.spawnProtectedUntil > now) return;
  const config = owner.type === "player" ? getShipConfig(owner.ship, owner.shipUpgrades) : null;
  const fireRate = config ? config.fireRate : owner.fireRate || 3000;
  if (now - owner.lastShot < fireRate) return;
  owner.lastShot = now;
  const shots = config ? config.shots : 1;
  const spread = config ? config.spread : 0;
  for (let i = 0; i < shots; i++) {
    const offset = shots === 1 ? 0 : (i - (shots - 1) / 2) * spread;
    const angle = owner.aimAngle ?? owner.angle;
    const id = `p-${nextProjectileId++}`;
    projectiles.set(id, {
      id, ownerId: owner.id, x: owner.x + Math.cos(angle + offset) * (owner.size + 18),
      y: owner.y + Math.sin(angle + offset) * (owner.size + 18), vx: Math.cos(angle + offset), vy: Math.sin(angle + offset),
      speed: config ? config.projectileSpeed : 450, damage: config ? config.damage : owner.damage,
      range: config ? config.range : 620, traveled: 0, createdAt: now, maxLifetime: 3500
    });
  }
}

function getEntityById(id) {
  return players.get(id) || bots.get(id) || null;
}

function chooseBotTarget(bot, now) {
  if (now < bot.nextTargetAt) {
    const current = getEntityById(bot.targetId);
    if (current && current.hp > 0 && distance(bot, current) < 1250 && canDamage(bot, current)) return current;
  }
  bot.nextTargetAt = now + 1400 + Math.random() * 2600;
  const targetLoad = new Map();
  for (const other of bots.values()) {
    if (other.id !== bot.id && other.targetId) targetLoad.set(other.targetId, (targetLoad.get(other.targetId) || 0) + 1);
  }
  const candidates = [];
  for (const player of players.values()) {
    const d = distance(bot, player);
    if (d < 1150 && canDamage(bot, player)) {
      const loadPenalty = 1 + (targetLoad.get(player.id) || 0) * 0.55;
      candidates.push({ entity: player, score: d * loadPenalty * (0.7 + Math.random() * 0.65) });
    }
  }
  for (const other of bots.values()) {
    if (other.id === bot.id) continue;
    const d = distance(bot, other);
    if (d < 820 && canDamage(bot, other)) candidates.push({ entity: other, score: d * (1.15 + Math.random() * 1.4) });
  }
  candidates.sort((a, b) => a.score - b.score);
  const picked = candidates[Math.floor(Math.random() * Math.min(3, candidates.length))];
  bot.targetId = picked ? picked.entity.id : null;
  return picked?.entity || null;
}

function awardLoot(target, killerId) {
  const total = target.type === "bot" ? target.loot : Math.floor(target.temporaryLoot * 0.5);
  if (target.type === "player" && total > 0) {
    const crateId = `crate-${nextCrateId++}`;
    lootCrates.set(crateId, { id: crateId, x: target.x, y: target.y, value: total, expiresAt: Date.now() + 60000 });
  }
  if (total <= 0) return;
  const damageEntries = [...target.damageLog.entries()].filter(([id]) => players.has(id));
  const damageTotal = damageEntries.reduce((sum, [, value]) => sum + value, 0) || 1;
  for (const [id, damage] of damageEntries) {
    const player = players.get(id);
    if (!player) continue;
    const assist = Math.floor(total * 0.4 * (damage / damageTotal));
    const kill = id === killerId ? Math.floor(total * 0.6) : 0;
    player.temporaryLoot += assist + kill;
    player.xp += Math.floor((target.xp || 60) * (id === killerId ? 1 : 0.35));
    while (player.xp >= xpNeeded(player.level)) {
      player.xp -= xpNeeded(player.level);
      player.level += 1;
      io.to(player.id).emit("system", `Level up! You reached level ${player.level}.`);
    }
  }
}

function destroyPlayer(player) {
  player.temporaryLoot = 0;
  player.exitingUntil = 0;
  player.exitCooldownUntil = Date.now() + 30000;
  const spawn = findValidSpawnPoint(player.level);
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.hp = player.maxHp;
  player.spawnProtectedUntil = Date.now() + SPAWN_PROTECTION_MS;
  player.lastDamageAt = Date.now();
  player.boostEnergy = Math.min(player.boostEnergy, player.boostMax);
  player.boosting = false;
  player.damageLog.clear();
  io.to(player.id).emit("system", "Exit failed. Loot lost.");
}

function applyDamage(target, amount, attackerId) {
  const attacker = players.get(attackerId) || bots.get(attackerId);
  if (!target || target.hp <= 0) return;
  if (!canDamage(attacker, target)) return;
  target.hp -= amount;
  target.lastHitAt = Date.now();
  addWorldEffect("hit", target.x, target.y, Math.max(0.7, target.size / 70));
  target.damageLog.set(attackerId, (target.damageLog.get(attackerId) || 0) + amount);
  if (attacker.type === "player") attacker.combatUntil = Date.now() + 10000;
  if (target.type === "player") {
    target.combatUntil = Date.now() + 10000;
    target.lastDamageAt = Date.now();
    target.healing = false;
  }
  if (target.hp > 0) return;
  awardLoot(target, attackerId);
  addWorldEffect("explosion", target.x, target.y, Math.max(1, target.size / 55));
  if (target.type === "bot") {
    bots.delete(target.id);
    setTimeout(() => maintainBotPopulation(true), 5000 + Math.random() * 7000);
  } else {
    destroyPlayer(target);
  }
}

function updateHealing(player, dt, now) {
  if (player.hp >= player.maxHp || player.lastDamageAt + HEAL_DELAY_MS > now) {
    player.healing = false;
    return;
  }
  player.healing = true;
  player.hp = Math.min(player.maxHp, player.hp + player.maxHp * HEAL_RATE_PER_SECOND * dt);
}

function collectItems(player, now) {
  for (const item of mapItems.values()) {
    if (distance(player, item) > player.size + item.r) continue;
    if (item.type === "repair") {
      player.hp = player.maxHp;
      io.to(player.id).emit("system", "Full Repair Kit used.");
    } else if (item.type === "boost") {
      player.boostEnergy = Math.min(player.boostMax, player.boostEnergy + BOOST_RECHARGE_AMOUNT);
      io.to(player.id).emit("system", "Boost recharged.");
    }
    mapItems.delete(item.id);
  }
}

function updateBoost(player, wantsBoost, config, dt, now) {
  const protectedNow = player.spawnProtectedUntil > now;
  if (protectedNow || !wantsBoost || player.boostEnergy <= 0) {
    player.boosting = false;
  } else {
    player.boosting = true;
    player.lastBoostAt = now;
    player.boostEnergy = Math.max(0, player.boostEnergy - player.boostDrainPerSecond * dt);
    if (player.boostEnergy <= 0) player.boosting = false;
  }
  if (!player.boosting && now - player.lastBoostAt > BOOST_REGEN_DELAY_MS && player.boostEnergy < config.boostMax) {
    player.boostEnergy = Math.min(config.boostMax, player.boostEnergy + BOOST_REGEN_PER_SECOND * dt);
  }
}

function secureLoot(player, reason) {
  if (player.temporaryLoot <= 0) return;
  player.securedPoints += player.temporaryLoot;
  player.temporaryLoot = 0;
  io.to(player.id).emit("progress", {
    securedPoints: player.securedPoints,
    level: player.level,
    xp: player.xp,
    unlockedShips: player.unlockedShips,
    shipUpgrades: player.shipUpgrades,
    selectedShip: player.ship
  });
  io.to(player.id).emit("system", reason || "Loot secured.");
}

function updatePlayers(dt, now) {
  for (const player of players.values()) {
    const input = player.input;
    const baseConfig = getShipConfig(player.ship, player.shipUpgrades);
    player.boostMax = baseConfig.boostMax;
    player.boostDrainPerSecond = baseConfig.boostDrainPerSecond;
    player.boostMultiplier = baseConfig.boostMultiplier;
    player.boostEnergy = Math.min(player.boostEnergy, player.boostMax);
    updateBoost(player, !!input.boost, baseConfig, dt, now);
    const boosted = player.boosting;
    const config = boosted ? {
      ...baseConfig,
      speed: baseConfig.speed * baseConfig.boostMultiplier,
      acceleration: baseConfig.acceleration * baseConfig.boostMultiplier
    } : baseConfig;
    const throttle = input.up ? 1 : input.down ? -1 : 0;
    const turn = input.left ? -1 : input.right ? 1 : 0;
    updateBoatPhysics(player, { throttle, turn }, config, dt);
    player.aimAngle = input.aimAngle ?? player.angle;
    if (input.shoot) fireProjectile(player, now);
    if (isSafe(player)) secureLoot(player, "Loot secured in Harbor.");
    updateHealing(player, dt, now);
    if (player.exitingUntil && now >= player.exitingUntil) {
      secureLoot(player, "Exit complete. Loot secured.");
      const spawn = harborPoint();
      player.x = spawn.x;
      player.y = spawn.y;
      player.vx = 0;
      player.vy = 0;
      player.exitingUntil = 0;
      player.exitCooldownUntil = now + 30000;
      player.spawnProtectedUntil = now + SPAWN_PROTECTION_MS;
    }
    for (const crate of lootCrates.values()) {
      if (distance(player, crate) < player.size + 22) {
        player.temporaryLoot += crate.value;
        lootCrates.delete(crate.id);
        io.to(player.id).emit("system", `Picked up ${crate.value} loot.`);
      }
    }
    collectItems(player, now);
  }
}

function updateBots(dt, now) {
  for (const bot of bots.values()) {
    const config = {
      speed: bot.speed,
      acceleration: bot.speed * (bot.role === "ScoutBot" ? 2.1 : 1.75),
      reverseSpeed: bot.speed * 0.35,
      friction: 0.968,
      turn: bot.role === "ScoutBot" ? 3.8 : bot.role === "TankBot" ? 1.85 : bot.role === "EliteBot" ? 3.05 : 2.75
    };
    const target = chooseBotTarget(bot, now);
    if (target && distance(bot, { x: bot.spawnX, y: bot.spawnY }) < 1700) {
      const targetAngle = angleTo(bot, target);
      const d = distance(bot, target);
      let desiredAngle = targetAngle;
      if (d < (bot.preferredRange || 360) + 120) {
        desiredAngle = targetAngle + Math.PI * 0.82;
      } else if (bot.orbit && d < (bot.preferredRange || 360) + 280) {
        desiredAngle = targetAngle + bot.orbitDirection * Math.PI * bot.orbit;
      }
      for (const obstacle of obstacles) {
        const avoidDistance = obstacle.r + bot.size + 180;
        if (Math.hypot(bot.x - obstacle.x, bot.y - obstacle.y) < avoidDistance) {
          desiredAngle = angleTo(obstacle, bot) + bot.orbitDirection * 0.55;
          break;
        }
      }
      if (isSafe(bot)) desiredAngle = angleTo(SAFE_ZONE, bot);
      const turnDelta = wrapAngle(desiredAngle - bot.angle);
      const turn = clamp(turnDelta * 1.65, -1, 1);
      const targetRange = bot.preferredRange || 360;
      const throttle = d > targetRange + 130 ? 1 : d < targetRange - 110 ? -0.38 : 0.45;
      updateBoatPhysics(bot, { throttle, turn }, config, dt);
      const aimAngle = targetAngle + (Math.random() - 0.5) * (bot.role === "EliteBot" ? 0.08 : 0.16);
      if (d < 760 && Math.abs(wrapAngle(targetAngle - bot.angle)) < 0.72) {
        bot.aimAngle = aimAngle;
        fireProjectile(bot, now);
      }
    } else {
      bot.targetId = null;
      bot.patrolAngle += Math.sin(now / 900 + bot.x) * 0.025 + (Math.random() - 0.5) * 0.015;
      const patrolTurn = clamp(wrapAngle(bot.patrolAngle - bot.angle), -0.55, 0.55);
      updateBoatPhysics(bot, { throttle: 0.45, turn: patrolTurn }, config, dt);
      if (isSafe(bot)) {
        bot.patrolAngle = angleTo(SAFE_ZONE, bot);
      }
    }
  }
}

function updateProjectiles(dt, now) {
  for (const projectile of projectiles.values()) {
    projectile.x += projectile.vx * projectile.speed * dt;
    projectile.y += projectile.vy * projectile.speed * dt;
    projectile.traveled += projectile.speed * dt;
    if (projectile.traveled > projectile.range || now - projectile.createdAt > projectile.maxLifetime || projectile.x < 0 || projectile.y < 0 || projectile.x > WORLD_SIZE || projectile.y > WORLD_SIZE) {
      projectiles.delete(projectile.id);
      continue;
    }
    if (obstacles.some((o) => distanceSq(projectile, o) < o.r * o.r)) {
      projectiles.delete(projectile.id);
      continue;
    }
    const targets = [...players.values(), ...bots.values()];
    for (const target of targets) {
      if (target.id === projectile.ownerId) continue;
      const hitRadius = target.size + 6;
      if (distanceSq(projectile, target) < hitRadius * hitRadius) {
        applyDamage(target, projectile.damage, projectile.ownerId);
        projectiles.delete(projectile.id);
        break;
      }
    }
  }
}

function cleanup() {
  const now = Date.now();
  for (const crate of lootCrates.values()) {
    if (crate.expiresAt < now) lootCrates.delete(crate.id);
  }
  for (const item of mapItems.values()) {
    if (item.expiresAt < now) mapItems.delete(item.id);
  }
  while (worldEffects.length && now - worldEffects[0].createdAt > 1400) worldEffects.shift();
}

function zoneCountsSnapshot() {
  const zoneCounts = { Harbor: 0, Coast: 0, "Wreck Field": 0, "Storm Zone": 0, "Deep Water": 0 };
  for (const player of players.values()) zoneCounts[zoneAt(player.x, player.y)]++;
  return zoneCounts;
}

function serializePlayer(p, now) {
  const config = getShipConfig(p.ship, p.shipUpgrades);
  return {
    id: p.id, name: p.name, level: p.level, x: round1(p.x), y: round1(p.y), angle: round2(p.angle),
    hp: Math.ceil(p.hp), maxHp: Math.ceil(p.maxHp), ship: p.ship, size: p.size,
    temporaryLoot: p.temporaryLoot, securedPoints: p.securedPoints, speed: Math.round(speedOf(p)),
    xp: p.xp, allianceId: p.allianceId,
    reloadRemaining: round2(Math.max(0, (config.fireRate - (now - p.lastShot)) / config.fireRate)),
    reloadMs: Math.max(0, Math.round(config.fireRate - (now - p.lastShot))),
    spawnProtected: p.spawnProtectedUntil > now,
    spawnProtectionRemaining: Math.max(0, Math.ceil((p.spawnProtectedUntil - now) / 1000)),
    hitFlash: p.lastHitAt && now - p.lastHitAt < 180,
    healing: !!p.healing,
    boostEnergy: Math.round(p.boostEnergy),
    boostMax: Math.round(p.boostMax),
    boosting: !!p.boosting,
    exiting: p.exitingUntil > now,
    exitRemaining: Math.max(0, Math.ceil((p.exitingUntil - now) / 1000))
  };
}

function serializeBot(b, now) {
  return {
    id: b.id, name: b.name, ship: b.ship, level: b.level, role: b.role, threat: b.threat,
    x: round1(b.x), y: round1(b.y), angle: round2(b.angle), hp: Math.ceil(b.hp), maxHp: Math.ceil(b.maxHp),
    size: b.size, speed: Math.round(speedOf(b)), targetId: b.targetId,
    hitFlash: b.lastHitAt && now - b.lastHitAt < 180
  };
}

function compactState(viewer) {
  const now = Date.now();
  return {
    worldSize: WORLD_SIZE,
    safeZone: SAFE_ZONE,
    zoneCounts: zoneCountsSnapshot(),
    players: [...players.values()].filter((p) => nearViewer(p, viewer)).map((p) => serializePlayer(p, now)),
    bots: [...bots.values()]
      .filter((b) => nearViewer(b, viewer))
      .map((b) => serializeBot(b, now)),
    botCount: bots.size,
    botTarget: desiredBotCount(),
    projectiles: [...projectiles.values()].filter((p) => nearViewer(p, viewer)).map((p) => ({ id: p.id, x: round1(p.x), y: round1(p.y) })),
    effects: worldEffects.filter((fx) => nearViewer(fx, viewer)).map((fx) => ({ id: fx.id, type: fx.type, x: round1(fx.x), y: round1(fx.y), size: fx.size, age: now - fx.createdAt })),
    lootCrates: [...lootCrates.values()].filter((c) => nearViewer(c, viewer)).map((c) => ({ id: c.id, x: round1(c.x), y: round1(c.y), value: c.value })),
    mapItems: [...mapItems.values()].filter((i) => nearViewer(i, viewer)).map((i) => ({ id: i.id, type: i.type, x: round1(i.x), y: round1(i.y), r: i.r }))
  };
}

function compactMinimap(viewer) {
  const points = [{ id: "harbor", type: "harbor", x: SAFE_ZONE.x, y: SAFE_ZONE.y }];
  for (const player of players.values()) {
    const ally = viewer && player.id !== viewer.id && player.allianceId && player.allianceId === viewer.allianceId;
    points.push({ id: player.id, type: player.id === viewer?.id ? "self" : ally ? "ally" : "player", x: Math.round(player.x), y: Math.round(player.y), angle: round2(player.angle) });
  }
  for (const bot of bots.values()) {
    points.push({ id: bot.id, type: (bot.threat || 1) >= 4 ? "eliteBot" : "bot", x: Math.round(bot.x), y: Math.round(bot.y) });
  }
  return { worldSize: WORLD_SIZE, points };
}

function compactStats() {
  return {
    players: players.size,
    bots: bots.size,
    botTarget: desiredBotCount(),
    projectiles: projectiles.size,
    loot: lootCrates.size,
    items: mapItems.size,
    stateHz: STATE_SEND_RATE,
    minimapHz: MINIMAP_SEND_RATE
  };
}

io.on("connection", (socket) => {
  socket.on("join", (payload = {}) => {
    if (players.has(socket.id)) players.delete(socket.id);
    const progress = sanitizeProgress(payload.progress);
    const ship = ships[payload.ship] && progress.unlockedShips.includes(payload.ship) ? payload.ship : progress.selectedShip;
    const config = getShipConfig(ship, progress.shipUpgrades);
    const spawn = findValidSpawnPoint(progress.level);
    const player = {
      id: socket.id, type: "player", name: sanitizeName(payload.nickname), x: spawn.x, y: spawn.y,
      angle: -Math.PI / 2, aimAngle: -Math.PI / 2, vx: 0, vy: 0, hp: config.hp, maxHp: config.hp, size: config.size,
      ship, level: progress.level, xp: progress.xp, securedPoints: progress.securedPoints,
      unlockedShips: progress.unlockedShips, shipUpgrades: progress.shipUpgrades, temporaryLoot: 0, input: {}, lastShot: 0,
      lastChatAt: 0, allianceId: null, combatUntil: 0, exitingUntil: 0, exitCooldownUntil: 0,
      spawnProtectedUntil: Date.now() + SPAWN_PROTECTION_MS, lastDamageAt: Date.now(),
      healing: false, boostEnergy: config.boostMax, boostMax: config.boostMax, boostDrainPerSecond: config.boostDrainPerSecond,
      boostMultiplier: config.boostMultiplier, boosting: false, lastBoostAt: 0, damageLog: new Map()
    };
    players.set(socket.id, player);
    socket.emit("joined", { id: socket.id, ships, worldSize: WORLD_SIZE, safeZone: SAFE_ZONE, obstacles, mapObjects });
    io.emit("chat", { channel: "system", name: "System", text: `${player.name} joined.` });
    maintainBotPopulation(true);
  });

  socket.on("pingCheck", (sentAt) => {
    socket.emit("pingPong", sentAt);
  });

  socket.on("input", (input = {}) => {
    const player = players.get(socket.id);
    if (!player) return;
    player.input = {
      up: !!input.up, down: !!input.down, left: !!input.left, right: !!input.right,
      shoot: !!input.shoot, boost: !!input.boost, aimAngle: Number.isFinite(input.aimAngle) ? input.aimAngle : player.aimAngle
    };
  });

  socket.on("chat", ({ channel, text } = {}) => {
    const player = players.get(socket.id);
    if (!player) return;
    const clean = chatAllowed(player, text);
    if (!clean) {
      socket.emit("system", "Message blocked by chat filter.");
      return;
    }
    if (channel === "alliance" && player.allianceId) {
      for (const member of players.values()) {
        if (member.allianceId === player.allianceId) io.to(member.id).emit("chat", { channel: "Alliance", name: player.name, text: clean });
      }
    } else {
      io.emit("chat", { channel: "Global", name: player.name, text: clean });
    }
  });

  socket.on("startExit", () => {
    const player = players.get(socket.id);
    const now = Date.now();
    if (!player || isSafe(player) || player.exitingUntil || now < player.exitCooldownUntil) return;
    player.exitingUntil = now + 90000;
    socket.emit("system", "Exit started. Survive 90 seconds.");
  });

  socket.on("allyNearest", () => {
    const player = players.get(socket.id);
    if (!player || player.combatUntil > Date.now()) return socket.emit("system", "You cannot ally while in combat.");
    const members = player.allianceId ? [...players.values()].filter((p) => p.allianceId === player.allianceId).length : 1;
    if (members >= 3) return socket.emit("system", "Alliance is already full.");
    let nearest = null;
    let nearestDistance = 501;
    for (const other of players.values()) {
      if (other.id === player.id || other.combatUntil > Date.now()) continue;
      const d = distance(player, other);
      if (d < nearestDistance) {
        nearest = other;
        nearestDistance = d;
      }
    }
    if (!nearest) return socket.emit("system", "No nearby player found.");
    const allianceId = player.allianceId || nearest.allianceId || `ally-${nextAllianceId++}`;
    player.allianceId = allianceId;
    nearest.allianceId = allianceId;
    io.to(player.id).emit("system", `Alliance formed with ${nearest.name}.`);
    io.to(nearest.id).emit("system", `Alliance formed with ${player.name}.`);
  });

  socket.on("leaveAlliance", () => {
    const player = players.get(socket.id);
    if (!player) return;
    player.allianceId = null;
    socket.emit("system", "You left the alliance.");
  });

  socket.on("backToLobby", () => {
    const player = players.get(socket.id);
    if (!player) return;
    player.temporaryLoot = 0;
    socket.emit("progress", {
      securedPoints: player.securedPoints,
      level: player.level,
      xp: player.xp,
      unlockedShips: player.unlockedShips,
      shipUpgrades: player.shipUpgrades,
      selectedShip: player.ship
    });
    io.emit("chat", { channel: "system", name: "System", text: `${player.name} returned to lobby.` });
    players.delete(socket.id);
    socket.emit("lobbyLeft");
  });

  socket.on("buyShip", (shipName) => {
    const player = players.get(socket.id);
    if (!player || !ships[shipName]) return;
    if (player.unlockedShips.includes(shipName)) {
      player.ship = shipName;
    } else if (player.securedPoints >= ships[shipName].price) {
      player.securedPoints -= ships[shipName].price;
      player.unlockedShips.push(shipName);
      player.ship = shipName;
    } else {
      return socket.emit("system", "Not enough secured points.");
    }
    const config = getShipConfig(player.ship, player.shipUpgrades);
    player.maxHp = config.hp;
    player.hp = config.hp;
    player.size = config.size;
    player.vx = 0;
    player.vy = 0;
    player.boostMax = config.boostMax;
    player.boostDrainPerSecond = config.boostDrainPerSecond;
    player.boostEnergy = Math.min(player.boostEnergy, player.boostMax);
    socket.emit("progress", { securedPoints: player.securedPoints, level: player.level, xp: player.xp, unlockedShips: player.unlockedShips, shipUpgrades: player.shipUpgrades, selectedShip: player.ship });
  });

  socket.on("buyUpgrade", ({ shipName, upgradeType } = {}) => {
    const player = players.get(socket.id);
    if (!player || !ships[shipName] || !UPGRADE_BASE_COSTS[upgradeType]) return;
    if (!player.unlockedShips.includes(shipName)) return socket.emit("system", "Buy the ship first.");
    const currentLevel = player.shipUpgrades?.[shipName]?.[upgradeType] || 0;
    if (currentLevel >= UPGRADE_MAX_LEVEL) return socket.emit("system", "Upgrade already maxed.");
    const cost = upgradeCost(upgradeType, currentLevel);
    if (player.securedPoints < cost) return socket.emit("system", "Not enough secured points.");
    player.securedPoints -= cost;
    player.shipUpgrades[shipName][upgradeType] = currentLevel + 1;
    if (player.ship === shipName) {
      const config = getShipConfig(player.ship, player.shipUpgrades);
      const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
      player.maxHp = config.hp;
      player.hp = Math.min(config.hp, Math.max(player.hp, config.hp * hpRatio));
      player.boostMax = config.boostMax;
      player.boostDrainPerSecond = config.boostDrainPerSecond;
      player.boostEnergy = Math.min(player.boostEnergy, player.boostMax);
    }
    socket.emit("progress", { securedPoints: player.securedPoints, level: player.level, xp: player.xp, unlockedShips: player.unlockedShips, shipUpgrades: player.shipUpgrades, selectedShip: player.ship });
  });

  socket.on("disconnect", () => {
    const player = players.get(socket.id);
    if (player) io.emit("chat", { channel: "system", name: "System", text: `${player.name} left.` });
    players.delete(socket.id);
  });
});

setInterval(() => {
  const now = Date.now();
  const dt = 1 / TICK_RATE;
  maintainBotPopulation();
  maintainItems();
  updatePlayers(dt, now);
  updateBots(dt, now);
  updateProjectiles(dt, now);
  cleanup();
}, 1000 / TICK_RATE);

setInterval(() => {
  for (const socket of io.sockets.sockets.values()) {
    const player = players.get(socket.id);
    if (player) socket.emit("state", compactState(player));
  }
}, 1000 / STATE_SEND_RATE);

setInterval(() => {
  for (const socket of io.sockets.sockets.values()) {
    const player = players.get(socket.id);
    if (player) socket.emit("minimap", compactMinimap(player));
  }
}, 1000 / MINIMAP_SEND_RATE);

setInterval(() => {
  io.emit("serverStats", compactStats());
}, 1000);

function lanUrls(port) {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => `http://${entry.address}:${port}`);
}

server.listen(PORT, HOST, () => {
  console.log(`Battle Harbor running at http://localhost:${PORT}`);
  for (const url of lanUrls(PORT)) console.log(`LAN: ${url}`);
});
