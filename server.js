const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Default world size constant used for bot movement bounds
const DEFAULT_WORLD_SIZE = 5000;

app.use(cors());
app.use(express.json());

// Always resolve the newest index.html between project root and public/ (and keep them synced) so localhost:3000 never serves a stale file
function resolveLatestIndexHtml() {
  const pubIndex = path.join(__dirname, 'public', 'index.html');
  const rootIndex = path.join(__dirname, 'index.html');
  const hasPub = fs.existsSync(pubIndex);
  const hasRoot = fs.existsSync(rootIndex);
  if (hasRoot && hasPub) {
    try {
      const rootStat = fs.statSync(rootIndex);
      const pubStat = fs.statSync(pubIndex);
      if (rootStat.mtimeMs >= pubStat.mtimeMs) {
        if (rootStat.size !== pubStat.size || Math.abs(rootStat.mtimeMs - pubStat.mtimeMs) > 500) {
          try { fs.copyFileSync(rootIndex, pubIndex); } catch (_) {}
        }
        return rootIndex;
      } else {
        try { fs.copyFileSync(pubIndex, rootIndex); } catch (_) {}
        return pubIndex;
      }
    } catch (_) {
      return rootIndex;
    }
  }
  if (hasRoot) return rootIndex;
  if (hasPub) return pubIndex;
  return null;
}
resolveLatestIndexHtml();

app.get(['/', '/index.html'], (req, res) => {
  const chosen = resolveLatestIndexHtml();
  if (chosen) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(chosen);
  } else {
    res.status(404).send('index.html not found. Place index.html in the project root or public/ directory.');
  }
});

const staticNoCacheOpts = {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
};
const publicDir = path.join(__dirname, 'public');
app.use(express.static(__dirname, staticNoCacheOpts));
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, staticNoCacheOpts));
}

// Server max HP cap: 69420 for all heroes
const SERVER_MAX_HP = 69420;

// Safety ceiling only - trust client damage calculations (matches offline gameplay)
const MAX_DAMAGE_PER_HIT = 100000;

// Complete 68-hero base HP map (exact match with client hero constructors)
function getHeroBaseHp(heroType) {
  const map = {
    paul: 5000,
    lune: 4900,
    everdawn: 5000,
    bruno: 6200,
    brunoalexander: 6200,
    noob: 6500,
    kaiser: 6000,
    tate: 8500,
    edgar: 4500,
    builderman: 5500,
    light: 6200,
    lighthero: 6200,
    kai: 5800,
    mamba: 7200,
    acheron: 5800,
    ming: 4800,
    nos: 10000,
    glace: 6600,
    carlos: 4700,
    gormo: 6000,
    ian: 5700,
    wesley: 9600,
    gamb: 6000,
    neo: 5000,
    buster: 8300,
    melvin: 6000,
    ren: 5300,
    chimera: 7000,
    li: 6600,
    lav: 8000,
    max: 6900,
    benjamin: 10500,
    kenshi: 6820,
    gigi: 7100,
    yun: 5800,
    racingduo: 6300,
    fred: 5500,
    noli: 6000,
    coolkidd: 6767,
    vival: 5000,
    gregory: 5300,
    cornelius: 6500,
    aurora: 6300,
    bai: 4800,
    apollo: 6800,
    zeus: 5600,
    kujou: 5600,
    bounty: 6400,
    bountyhunter: 6400,
    karen: 5200,
    caskrice: 11000,
    jeffrey: 4800,
    don: 4800,
    monza: 7500,
    christian: 6000,
    faik: 8200,
    fletcher: 4500,
    darrick: 4700,
    twins: 6000,
    trent: 5900,
    cole: 5000,
    rico: 4750,
    mecca: 5200,
  inou: 4500,
  branson: 5400,
    ronald: 7750,
    guest: 7200,
    jimeka: 5600,
    dayum: 69420,
    ash: 7500,
    zappa: 5800,
    cyrus: 5000,
    ambrose: 5400,
    austin: 7000,
    winston: 4300,
    amir: 8700,
    steven: 4800
  };
  if (!heroType) return 5000;
  const key = String(heroType).toLowerCase();
  return map[key] || 5000;
}

const BOT_HERO_TYPES = [
  'paul', 'noob', 'kaiser', 'tate', 'edgar', 'builderman', 'light', 'kai',
  'mamba', 'acheron', 'ming', 'nos', 'glace', 'carlos', 'gormo', 'ian',
  'wesley', 'neo', 'buster', 'melvin', 'ren', 'chimera', 'li', 'lav',
  'max', 'fred', 'benjamin', 'kenshi', 'gigi', 'yun', 'racingduo', 'noli',
  'coolkidd', 'don', 'monza', 'ash', 'zappa', 'cyrus', 'ambrose', 'austin',
  'vival', 'gregory', 'aurora', 'apollo', 'lune', 'everdawn', 'bruno', 'zeus',
  'kujou', 'karen', 'caskrice', 'jeffrey', 'christian', 'bounty', 'jimeka',
  'guest', 'trent', 'cole', 'rico', 'twins', 'faik', 'fletcher', 'darrick', 'winston',
  'amir', 'steven', 'cornelius', 'bai', 'ronald'
];

function createServerSeededRng(seedVal) {
  let s = Math.abs(Math.floor(Number(seedVal) || 123456789)) % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateGlobalRoomMapLayout(mode, worldSize, selectedMap, mapSeed) {
  const rand = createServerSeededRng(mapSeed);
  const mapName = ['classic', 'sakura', 'farmland', 'port'].includes(selectedMap) ? selectedMap : 'classic';
  const FARM = { x: worldSize / 2, y: worldSize / 2, width: 640, height: 460 };
  const convenienceStores = [];
  const mapWalls = [];
  const bushes = [];

  if (mapName === 'sakura') {
    let attempts = 0;
    while (convenienceStores.length < 5 && attempts++ < 200) {
      const sx = Math.round(300 + rand() * (worldSize - 600));
      const sy = Math.round(300 + rand() * (worldSize - 600));
      if (Math.hypot(sx - worldSize / 2, sy - worldSize / 2) < 500) continue;
      if (convenienceStores.some(st => Math.hypot(sx - st.x, sy - st.y) < 500)) continue;
      convenienceStores.push({ x: sx, y: sy, width: 290, height: 210 });
    }
  }

  const overlapsWall = (cx, cy, w, h, pad = 36) => {
    const hw = (w || 0) * 0.5, hh = (h || 0) * 0.5;
    return mapWalls.some(wall =>
      Math.abs(cx - wall.x) < (wall.width * 0.5 + hw + pad) &&
      Math.abs(cy - wall.y) < (wall.height * 0.5 + hh + pad)
    );
  };

  if (mode === '5v5') {
    const stableSpecs = [
      { x: 2100, y: 1850, width: 250, height: 46 },
      { x: 2900, y: 1850, width: 250, height: 46 },
      { x: 2100, y: 3150, width: 250, height: 46 },
      { x: 2900, y: 3150, width: 250, height: 46 },
      { x: 2500, y: 780,  width: 48,  height: 230 },
      { x: 2500, y: 1850, width: 48,  height: 210 },
      { x: 2500, y: 3150, width: 48,  height: 210 },
      { x: 2500, y: 4220, width: 48,  height: 230 },
      { x: 1350, y: 1850, width: 46,  height: 210 },
      { x: 3650, y: 1850, width: 46,  height: 210 },
      { x: 1350, y: 3150, width: 46,  height: 210 },
      { x: 3650, y: 3150, width: 46,  height: 210 }
    ];
    for (const sp of stableSpecs) {
      if (mapName === 'farmland' &&
          Math.abs(sp.x - FARM.x) < (FARM.width / 2 + sp.width / 2 + 80) &&
          Math.abs(sp.y - FARM.y) < (FARM.height / 2 + sp.height / 2 + 80)) continue;
      if (mapName === 'sakura' && convenienceStores.some(st =>
          Math.abs(sp.x - st.x) < (st.width / 2 + sp.width / 2 + 80) &&
          Math.abs(sp.y - st.y) < (st.height / 2 + sp.height / 2 + 80))) continue;
      mapWalls.push(sp);
    }
  } else if (mapName !== 'port' && ['classic', 'sakura', 'farmland'].includes(mapName)) {
    const targetCount = worldSize <= 2200 ? 6 : 16;
    let attempts = 0;
    while (mapWalls.length < targetCount && attempts++ < 800) {
      const horiz = rand() < 0.5;
      const w = horiz ? (180 + Math.floor(rand() * 90)) : 46;
      const h = horiz ? 46 : (180 + Math.floor(rand() * 90));
      const pad = 260;
      const wx = Math.round(pad + rand() * Math.max(200, worldSize - pad * 2));
      const wy = Math.round(pad + rand() * Math.max(200, worldSize - pad * 2));
      if (Math.hypot(wx - worldSize / 2, wy - worldSize / 2) < 340) continue;
      if (worldSize <= 2200 && (Math.hypot(wx - 500, wy - 1000) < 220 || Math.hypot(wx - 1500, wy - 1000) < 220)) continue;
      if (mapName === 'farmland' &&
          Math.abs(wx - FARM.x) < (FARM.width / 2 + w / 2 + 110) &&
          Math.abs(wy - FARM.y) < (FARM.height / 2 + h / 2 + 110)) continue;
      if (mapName === 'sakura' && convenienceStores.some(st =>
          Math.abs(wx - st.x) < (st.width / 2 + w / 2 + 110) &&
          Math.abs(wy - st.y) < (st.height / 2 + h / 2 + 110))) continue;
      if (overlapsWall(wx, wy, w, h, 150)) continue;
      mapWalls.push({ x: wx, y: wy, width: w, height: h });
    }
  }

  const bushTarget = (mode === 'duel') ? 18 : (mapName === 'port' ? 75 : 90);
  for (let i = 0, att = 0; i < bushTarget && att < 2500; i++) {
    att++;
    const padEdge = mapName === 'port' ? 180 : 40;
    const bx = Math.round(padEdge + rand() * Math.max(100, worldSize - padEdge * 2));
    const by = Math.round(padEdge + rngBush(rand) * Math.max(100, worldSize - padEdge * 2));
    const br = Math.round(50 + rand() * 80);
    const bSeed = Number((rand() * 1000).toFixed(4));
    const cargoHoriz = Math.cos(bSeed * 7.3) >= 0;
    const cw = cargoHoriz ? br * 2.15 : br * 1.35;
    const ch = cargoHoriz ? br * 1.35 : br * 2.15;
    const nearFarmhouse = mapName === 'farmland' && Math.abs(bx - FARM.x) < FARM.width / 2 + 80 && Math.abs(by - FARM.y) < FARM.height / 2 + 80;
    const underSakuraMart = mapName === 'sakura' && convenienceStores.some(st => Math.abs(bx - st.x) < st.width / 2 + 90 && Math.abs(by - st.y) < st.height / 2 + 90);
    const hitWall = overlapsWall(bx, by, cw, ch, 42);
    const overlappingCargo = mapName === 'port' && (
      Math.hypot(bx - worldSize / 2, by - worldSize / 2) < 220 ||
      hitWall ||
      bushes.some(b => Math.abs(bx - b.x) < ((b.cw || 180) * 0.5 + br * 1.15 + 36) && Math.abs(by - b.y) < ((b.ch || 180) * 0.5 + br * 1.15 + 36))
    );
    if (nearFarmhouse || underSakuraMart || hitWall || overlappingCargo) {
      i--;
      continue;
    }
    bushes.push({ x: bx, y: by, r: br, seed: bSeed, cw: Math.round(cw), ch: Math.round(ch) });
  }

  return {
    selectedMap: mapName,
    mapSeed,
    convenienceStores,
    mapWalls,
    bushes
  };
}
function rngBush(r) { return r(); }

// Game Room Class
class GameRoom {
  constructor(roomId, maxPlayers = 4, mode = 'ffa', selectedMap = 'classic', mapSeed = null) {
    this.id = roomId;
    this.maxPlayers = maxPlayers;
    this.mode = mode;
    this.worldSize = (mode === 'duel' || mode === 'duel_online' || mode === '1v1') ? 2000 : DEFAULT_WORLD_SIZE;
    this.mapSeed = mapSeed || (Date.now() % 1000000);
    this.selectedMap = selectedMap || 'classic';
    this.mapLayout = generateGlobalRoomMapLayout(this.mode, this.worldSize, this.selectedMap, this.mapSeed);
    this.players = new Map(); // socketId -> player data
    this.gameRunning = false;
    this.createdAt = Date.now();
    this.combatReadyAt = Date.now() + 5000;
    this.gameLoopInterval = null;
    this.lastDamageTimestamps = new Map();
    this.recentProjectileIds = new Map();
    this.lastBroadcastTime = Date.now();
    this.lastBroadcastPositions = new Map();
    this.victoryDeclared = false;
  }

  addPlayer(socketId, playerData) {
    const baseHp = getHeroBaseHp(playerData && playerData.heroType);
    const actualMaxHp = Math.min(baseHp, SERVER_MAX_HP);
    const isMecca = String((playerData && playerData.heroType) || '').toLowerCase() === 'mecca';
    const initShield = isMecca ? 1000 : 0;
    const isBot = !!playerData.isBot;
    const assignedIndex = typeof playerData.assignedIndex === 'number' ? playerData.assignedIndex : this.players.size;
    const team = typeof playerData.team === 'number'
      ? playerData.team
      : (this.mode === '5v5' ? ((assignedIndex % 2 === 0) ? 1 : 2) : (100 + assignedIndex));

    this.players.set(socketId, {
      socketId,
      name: playerData.name || 'Player',
      heroType: playerData.heroType || 'paul',
      x: typeof playerData.x === 'number' ? playerData.x : 500,
      y: typeof playerData.y === 'number' ? playerData.y : 500,
      hp: actualMaxHp,
      maxHp: actualMaxHp,
      lastClientReportedHp: actualMaxHp,
      shield: initShield,
      maxShield: initShield,
      lastClientReportedShield: initShield,
      speedMult: 1,
      dmgMult: 1,
      kills: 0,
      deaths: 0,
      assists: 0,
      totalDamage: 0,
      totalDamageTaken: 0,
      damageContributors: new Map(),
      team: team,
      lastUpdate: Date.now(),
      entities: [],
      slashes: [],
      particles: [],
      abilityVisuals: {},
      angle: 0,
      currentSkin: playerData.currentSkin || 'default',
      isBot: isBot,
      vx: 0,
      vy: 0,
      nextDirTime: 0,
      lastAttackTime: 0,
      stunUntil: 0,
      slowUntil: 0
    });
    console.log(`✅ ${playerData.name}${isBot ? ' (BOT)' : ''} added to room ${this.id} (heroType=${playerData.heroType}, maxHp=${actualMaxHp}, team=${team})`);
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    this.lastBroadcastPositions.delete(socketId);
    console.log(`❌ Player removed from room ${this.id}. Remaining: ${this.players.size}`);
  }

  getPlayerCount() {
    return this.players.size;
  }

  startGameLoop() {
    if (this.gameRunning) return;
    this.gameRunning = true;
    this.lastBroadcastTime = Date.now();
    console.log(`🎮 Game loop started for room ${this.id}`);

    // Broadcast game state at 60 Hz (~16ms) for ultra-smooth 180Hz client interpolation
    this.gameLoopInterval = setInterval(() => {
      this.broadcastGameState();
    }, 16);
  }

  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    this.gameRunning = false;
    console.log(`⏹️ Game loop stopped for room ${this.id}`);
  }

  getContainingBush(x, y) {
    if (!this.mapLayout || !Array.isArray(this.mapLayout.bushes)) return null;
    const isPort = this.selectedMap === 'port';
    for (let i = 0; i < this.mapLayout.bushes.length; i++) {
      const b = this.mapLayout.bushes[i];
      if (!b) continue;
      if (isPort) {
        const cw = b.cw || (b.r * 2.15);
        const ch = b.ch || (b.r * 1.35);
        if (Math.abs(x - b.x) <= cw * 0.5 && Math.abs(y - b.y) <= ch * 0.5) return b;
      } else {
        if (Math.hypot(x - b.x, y - b.y) < (b.r || 90)) return b;
      }
    }
    return null;
  }

  // Bot AI updater called before each broadcast when room has bots
  updateBots() {
    const now = Date.now();
    const dt = Math.min(0.15, Math.max(0.01, (now - (this.lastBroadcastTime || now)) / 1000));
    this.lastBroadcastTime = now;

    // Wait until match countdown finishes before bots move or attack
    if (now < (this.combatReadyAt || 0)) return;

    for (let p of this.players.values()) {
      if (!p.isBot || p.hp <= 0) continue;
      if (p.stunUntil && now < p.stunUntil) {
        p.slashes = [];
        continue;
      }
      // Ronald Ankle Break on server bots: move opposite Ronald's direction and cannot attack!
      if (p.ankleBreakUntil && now < p.ankleBreakUntil) {
        const abDir = typeof p.ankleBreakDir === 'number' ? p.ankleBreakDir : ((p.angle || 0) + Math.PI);
        p.angle = abDir;
        p.x = Math.max(60, Math.min(this.worldSize - 60, p.x + Math.cos(abDir) * 195 * dt));
        p.y = Math.max(60, Math.min(this.worldSize - 60, p.y + Math.sin(abDir) * 195 * dt));
        p.slashes = [];
        continue;
      }
      const botBush = this.getContainingBush(p.x, p.y);

      // Find nearest living VISIBLE opponent (bots cannot see players hidden in bushes unless in the same bush or revealed!)
      let closest = null;
      let cd = Infinity;
      for (let q of this.players.values()) {
        if (q.socketId === p.socketId || q.hp <= 0) continue;
        if (this.mode === '5v5' && q.team === p.team) continue;
        const targetBush = this.getContainingBush(q.x, q.y);
        const targetReportedHidden = !!(q.isConcealedInBush);
        const isRevealed = !!(q.revealUntil && now < q.revealUntil);
        if ((targetBush || targetReportedHidden) && !isRevealed) {
          const sameServerBush = !!(botBush && targetBush && botBush === targetBush);
          const sameReportedBush = !!(typeof q.bushX === 'number' && typeof q.bushY === 'number' && Math.hypot(p.x - q.bushX, p.y - q.bushY) <= (q.bushR || 95));
          if (!sameServerBush && !sameReportedBush) {
            continue;
          }
        }
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < cd) {
          cd = d;
          closest = q;
        }
      }

      const slowFactor = (p.slowUntil && now < p.slowUntil) ? 0.6 : 1.0;
      const moveSpd = 215 * slowFactor;

      // Human-like reaction delay when acquiring/switching targets & drifting marginal aim error
      if (!p.nextErrorUpdateAt || now >= p.nextErrorUpdateAt) {
        p.nextErrorUpdateAt = now + 300 + Math.random() * 380;
        p.aimError = (Math.random() - 0.5) * 0.22;
        p.moveJitter = (Math.random() - 0.5) * 0.24;
      }
      if (closest && p.lastTargetId !== closest.socketId) {
        p.lastTargetId = closest.socketId;
        p.reactionUntil = now + 170 + Math.random() * 120;
      }

      if (closest && cd < 1400) {
        const exactAngle = Math.atan2(closest.y - p.y, closest.x - p.x);
        const desiredAngle = exactAngle + (p.aimError || 0);
        const curAngle = typeof p.angle === 'number' ? p.angle : desiredAngle;
        const angleDiff = Math.atan2(Math.sin(desiredAngle - curAngle), Math.cos(desiredAngle - curAngle));
        const maxTurn = Math.max(0.04, 7.2 * dt);
        p.angle = curAngle + Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

        p.strafeDir = p.strafeDir || (Math.random() < 0.5 ? 1 : -1);
        if (Math.random() < 0.03) p.strafeDir *= -1;
        const moveAngle = p.angle + (p.moveJitter || 0) * 0.35;

        if (cd > 190) {
          p.vx = Math.cos(moveAngle) * moveSpd;
          p.vy = Math.sin(moveAngle) * moveSpd;
        } else if (cd < 90) {
          p.vx = -Math.cos(moveAngle) * (moveSpd * 0.65);
          p.vy = -Math.sin(moveAngle) * (moveSpd * 0.65);
        } else {
          const strafeAng = moveAngle + (Math.PI / 2) * p.strafeDir;
          p.vx = Math.cos(strafeAng) * (moveSpd * 0.78);
          p.vy = Math.sin(strafeAng) * (moveSpd * 0.78);
        }
      } else if (!p.nextDirTime || now >= p.nextDirTime) {
        const randAng = Math.random() * Math.PI * 2;
        p.vx = Math.cos(randAng) * (moveSpd * 0.75);
        p.vy = Math.sin(randAng) * (moveSpd * 0.75);
        p.angle = randAng;
        p.nextDirTime = now + 1200 + Math.random() * 1800;
      }

      const botPushDamp = (p.lastPushedAt && (now - p.lastPushedAt) < 280) ? 0.15 : 1.0;
      p.x += p.vx * botPushDamp * dt;
      p.y += p.vy * botPushDamp * dt;
      if (Math.hypot(p.kbVx || 0, p.kbVy || 0) > 5) {
        p.x += (p.kbVx || 0) * dt;
        p.y += (p.kbVy || 0) * dt;
        p.kbVx = (p.kbVx || 0) * Math.pow(0.12, dt);
        p.kbVy = (p.kbVy || 0) * Math.pow(0.12, dt);
        if (Math.hypot(p.kbVx, p.kbVy) <= 5) { p.kbVx = 0; p.kbVy = 0; }
      }

      // Stay within world bounds
      const pad = 60;
      if (p.x < pad) { p.x = pad; p.vx *= -1; }
      if (p.x > this.worldSize - pad) { p.x = this.worldSize - pad; p.vx *= -1; }
      if (p.y < pad) { p.y = pad; p.vy *= -1; }
      if (p.y > this.worldSize - pad) { p.y = this.worldSize - pad; p.vy *= -1; }

      // Attack nearest target after human reaction delay & cadence (~0.85s-1.0s when in range)
      const attackInterval = p.nextAttackDelay || 880;
      if (closest && cd < 245 && now >= (p.reactionUntil || 0) && (!p.lastAttackTime || (now - p.lastAttackTime) >= attackInterval)) {
        p.nextAttackDelay = 820 + Math.floor(Math.random() * 180);
        p.lastAttackTime = now;
        const dmg = Math.floor(140 + Math.random() * 110);
        const prevHp = closest.hp;
        closest.hp = Math.max(0, closest.hp - dmg);
        const actualDealt = Math.max(0, prevHp - closest.hp);
        closest.lastClientReportedHp = closest.hp;
        closest.lastDamagedAt = now;
        p.totalDamage = (p.totalDamage || 0) + actualDealt;
        closest.totalDamageTaken = (closest.totalDamageTaken || 0) + actualDealt;
        if (!closest.damageContributors) closest.damageContributors = new Map();
        const prevContrib = closest.damageContributors.get(p.socketId) || { amount: 0, time: 0 };
        prevContrib.amount = (prevContrib.amount || 0) + actualDealt;
        prevContrib.time = now;
        closest.damageContributors.set(p.socketId, prevContrib);

        if (closest.hp <= 0 && prevHp > 0) {
          p.kills = (p.kills || 0) + 1;
          if (this.mode !== 'ffa') {
            closest.deaths = (closest.deaths || 0) + 1;
          }
          if (closest.damageContributors && closest.damageContributors.size > 0) {
            for (const [contribId, cObj] of closest.damageContributors) {
              if (contribId === p.socketId || contribId === closest.socketId) continue;
              const cPlayer = this.players.get(contribId);
              if (cPlayer && cPlayer.hp > 0 && cObj && cObj.amount > 0 && (now - (cObj.time || 0)) <= 10000) {
                if (this.mode === 'ffa' || cPlayer.team === p.team) {
                  cPlayer.assists = (cPlayer.assists || 0) + 1;
                }
              }
            }
            closest.damageContributors.clear();
          }
        }

        p.slashes = [{
          type: 'slash',
          x: p.x + Math.cos(p.angle) * 35,
          y: p.y + Math.sin(p.angle) * 35,
          angle: p.angle,
          range: 95,
          width: 1.3,
          color: '#ff6b6b'
        }];

        io.to(this.id).emit('playerHealthUpdated', {
          socketId: closest.socketId,
          hp: closest.hp,
          maxHp: closest.maxHp,
          shield: closest.shield || 0,
          attacker: p.name,
          attackerSocketId: p.socketId,
          attackerKills: p.kills || 0,
          attackerTotalDamage: p.totalDamage || 0,
          victimDeaths: closest.deaths || 0,
          victimTotalDamageTaken: closest.totalDamageTaken || 0,
          damageApplied: actualDealt,
          damageToShield: 0,
          damageToHp: actualDealt,
          computedDamage: dmg,
          clamped: false,
          trueDamage: false
        });

        if (closest.hp <= 0 && prevHp > 0) {
          this.checkVictoryAfterDeath(closest);
        }
      } else {
        p.slashes = [];
      }
    }
  }

  checkVictoryAfterDeath(victim) {
    if (this.victoryDeclared || this.mode === 'training') return;
    const remainingPlayers = Array.from(this.players.values());
    const aliveNow = remainingPlayers.filter(p => p.hp > 0);
    if (this.mode === '5v5') {
      const blueAlive = aliveNow.filter(p => p.team === 1).length;
      const redAlive = aliveNow.filter(p => p.team === 2).length;
      if (blueAlive === 0 || redAlive === 0) {
        this.victoryDeclared = true;
        const winningTeam = blueAlive > 0 ? 1 : 2;
        const winner = aliveNow[0] || victim;
        io.to(this.id).emit('playerVictory', {
          winnerId: winner ? winner.socketId : null,
          winnerName: winningTeam === 1 ? 'Blue Team' : 'Red Team',
          winningTeam
        });
      }
      return;
    }

    if (aliveNow.length === 1 && (!victim || victim.hp <= 0)) {
      this.victoryDeclared = true;
      const winner = aliveNow[0];
      console.log(`🏆 ONE SURVIVOR in room ${this.id}: ${winner.name} (${winner.socketId}) - declaring victory!`);
      io.to(this.id).emit('playerVictory', {
        winnerId: winner.socketId,
        winnerName: winner.name
      });
      io.to(this.id).emit('gameOver', {
        winnerId: winner.socketId,
        winnerSocketId: winner.socketId,
        winnerName: winner.name,
        winnerHero: winner.heroType,
        kills: remainingPlayers
          .map(p => ({ name: p.name, kills: p.kills || 0, heroType: p.heroType }))
          .sort((a, b) => b.kills - a.kills)
      });
    }
  }

  broadcastGameState() {
    this.updateBots();
    const playersArray = Array.from(this.players.values()).map(p => {
      const safeEntities = Array.isArray(p.entities) ? p.entities : [];
      const safeSlashes = Array.isArray(p.slashes) ? p.slashes : [];
      const safeParticles = Array.isArray(p.particles) ? p.particles : [];

      const lastPos = this.lastBroadcastPositions.get(p.socketId);
      const currentPos = { x: p.x, y: p.y };
      const hasMoved = !lastPos || Math.hypot(currentPos.x - lastPos.x, currentPos.y - lastPos.y) > 0.5;
      this.lastBroadcastPositions.set(p.socketId, { ...currentPos });

      // Clear one-shot particles and fxBatch after broadcasting so they don't duplicate on subsequent ticks
      p.particles = [];
      let avOut = p.abilityVisuals;
      if (avOut && typeof avOut === 'object' && avOut.fxBatch) {
        avOut = Object.assign({}, avOut);
        delete p.abilityVisuals.fxBatch;
      }

      return {
        socketId: p.socketId,
        name: p.name,
        heroType: p.heroType,
        color: p.color || null,
        team: p.team,
        x: p.x,
        y: p.y,
        hp: p.hp,
        maxHp: p.maxHp,
        shield: p.shield,
        maxShield: p.maxShield,
        speedMult: p.speedMult || 1,
        dmgMult: p.dmgMult || 1,
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        assists: p.assists || 0,
        totalDamage: Math.ceil(p.totalDamage || 0),
        totalDamageTaken: Math.ceil(p.totalDamageTaken || 0),
        lastUpdate: p.lastUpdate,
        entities: safeEntities,
        slashes: safeSlashes,
        particles: safeParticles,
        abilityVisuals: avOut,
        angle: p.angle,
        currentSkin: p.currentSkin || 'default',
        isBot: !!p.isBot,
        positionChanged: hasMoved
      };
    });

    const alivePlayers = playersArray.filter(p => p.hp > 0);
    const aliveCount = alivePlayers.length;

    io.to(this.id).emit('gameStateUpdate', {
      players: playersArray,
      timestamp: Date.now(),
      aliveCount: aliveCount
    });
  }

  updatePlayerPosition(socketId, data) {
    if (!this.players.has(socketId) || !data) return;
    const player = this.players.get(socketId);
    const now = Date.now();
    const recentlyPushed = player.lastPushedAt && (now - player.lastPushedAt) < 280;
    if (data.pushAck === true) {
      if (typeof data.x === 'number' && Number.isFinite(data.x)) player.x = data.x;
      if (typeof data.y === 'number' && Number.isFinite(data.y)) player.y = data.y;
      player.lastPushedAt = 0;
    } else if (!recentlyPushed) {
      if (typeof data.x === 'number' && Number.isFinite(data.x)) player.x = data.x;
      if (typeof data.y === 'number' && Number.isFinite(data.y)) player.y = data.y;
    }
    player.lastUpdate = now;

    if (typeof data.heroType === 'string' && data.heroType && String(data.heroType).toLowerCase() !== 'dayum') {
      const prevHero = player.heroType;
      player.heroType = data.heroType;
      if (this.mode === 'training' && prevHero !== data.heroType) {
        const newBaseHp = getHeroBaseHp(data.heroType);
        player.maxHp = Math.min(SERVER_MAX_HP, newBaseHp);
        player.hp = player.maxHp;
        player.lastClientReportedHp = player.maxHp;
      }
    }
    if (typeof data.color === 'string' && data.color) {
      player.color = data.color;
    }
    if (typeof data.currentSkin === 'string') {
      player.currentSkin = data.currentSkin;
    }
    if (typeof data.maxHp === 'number' && Number.isFinite(data.maxHp) && data.maxHp >= 100) {
      const prevMax = player.maxHp;
      player.maxHp = Math.min(SERVER_MAX_HP, Math.round(data.maxHp));
      // If hero just initialized with higher base maxHp and hasn't taken damage yet, sync initial HP
      if (player.hp === prevMax && !player.lastDamagedAt) {
        player.hp = player.maxHp;
        player.lastClientReportedHp = player.maxHp;
      }
    }
    // Authoritative HP is managed by playerDamaged, playerHeal, vivalRevive, and requestRespawn.
    // Never infer heals from periodic playerUpdate packets (which can arrive with stale pre-damage HP while playerHealthUpdated is in flight).
    if (typeof data.hp === 'number' && Number.isFinite(data.hp) && player.hp > 0) {
      player.lastClientReportedHp = Math.min(player.maxHp, Math.max(0, Math.round(data.hp)));
    }
    if (Array.isArray(data.entities)) {
      player.entities = data.entities.slice(0, 220);
    }
    if (Array.isArray(data.slashes)) {
      player.slashes = data.slashes.slice(0, 32);
    }
    if (Array.isArray(data.particles)) {
      player.particles = data.particles.slice(0, 80);
    }
    if (typeof data.shield === 'number' && Number.isFinite(data.shield)) {
      const reportedShield = Math.max(0, Math.floor(data.shield));
      const prevReportedShield = typeof player.lastClientReportedShield === 'number' ? player.lastClientReportedShield : (player.shield || 0);
      const recentlyDamaged = player.lastDamagedAt && (Date.now() - player.lastDamagedAt) < 450;
      if (reportedShield > prevReportedShield) {
        const shieldGain = reportedShield - prevReportedShield;
        player.shield = Math.max(0, (player.shield || 0) + shieldGain);
      } else if (!recentlyDamaged || reportedShield <= (player.shield || 0)) {
        player.shield = reportedShield;
      }
      player.lastClientReportedShield = reportedShield;
    }
    if (typeof data.maxShield === 'number' && Number.isFinite(data.maxShield)) {
      player.maxShield = Math.max(0, Math.floor(data.maxShield));
    }
    if (typeof data.speedMult === 'number' && Number.isFinite(data.speedMult)) {
      player.speedMult = Math.max(0.1, Math.min(10, data.speedMult));
    }
    if (typeof data.dmgMult === 'number' && Number.isFinite(data.dmgMult)) {
      player.dmgMult = Math.max(0.1, Math.min(10, data.dmgMult));
    }
    if (typeof data.kills === 'number' && Number.isFinite(data.kills)) {
      player.kills = Math.max(player.kills || 0, Math.floor(data.kills));
    }
    if (typeof data.deaths === 'number' && Number.isFinite(data.deaths)) {
      player.deaths = Math.max(player.deaths || 0, Math.floor(data.deaths));
    }
    if (typeof data.assists === 'number' && Number.isFinite(data.assists)) {
      player.assists = Math.max(player.assists || 0, Math.floor(data.assists));
    }
    if (typeof data.totalDamage === 'number' && Number.isFinite(data.totalDamage)) {
      player.totalDamage = Math.max(player.totalDamage || 0, Math.ceil(data.totalDamage));
    }
    if (typeof data.totalDamageTaken === 'number' && Number.isFinite(data.totalDamageTaken)) {
      player.totalDamageTaken = Math.max(player.totalDamageTaken || 0, Math.ceil(data.totalDamageTaken));
    }
    if (data.abilityVisuals && typeof data.abilityVisuals === 'object') {
      player.abilityVisuals = data.abilityVisuals;
      const ds = data.abilityVisuals.drawState;
      if (ds && typeof ds === 'object') {
        if (typeof ds.ritualActive === 'boolean') player.vivalRitualActive = ds.ritualActive;
        if (typeof ds.reviveReady === 'boolean') player.vivalReviveReady = ds.reviveReady;
        if (typeof ds.secondLifeTriggered === 'boolean') player.vivalSecondLifeTriggered = ds.secondLifeTriggered;
        if (typeof ds.ritualX === 'number' && Number.isFinite(ds.ritualX)) player.vivalRitualX = ds.ritualX;
        if (typeof ds.ritualY === 'number' && Number.isFinite(ds.ritualY)) player.vivalRitualY = ds.ritualY;
        if (typeof ds.hasMechArmor === 'boolean') player.hasMechArmor = ds.hasMechArmor;
        if (typeof ds.yellowShield === 'number' && Number.isFinite(ds.yellowShield)) {
          player.yellowShield = Math.max(0, Math.floor(ds.yellowShield));
        }
      }
    }
    if (typeof data.angle === 'number' && Number.isFinite(data.angle)) {
      player.angle = data.angle;
    }
    if (typeof data.inBush === 'boolean') player.inBush = data.inBush;
    if (typeof data.isConcealedInBush === 'boolean') player.isConcealedInBush = data.isConcealedInBush;
    if (typeof data.bushX === 'number') player.bushX = data.bushX;
    if (typeof data.bushY === 'number') player.bushY = data.bushY;
    if (typeof data.bushR === 'number') player.bushR = data.bushR;
    if (typeof data.revealTimer === 'number' && data.revealTimer > 0) {
      player.revealUntil = Math.max(player.revealUntil || 0, Date.now() + data.revealTimer * 1000);
    }

    if (!player.entities) player.entities = [];
    if (!player.slashes) player.slashes = [];
    if (!player.particles) player.particles = [];
  }

  validateKill(attackerSocketId, victimSocketId) {
    if (!this.players.has(attackerSocketId) || !this.players.has(victimSocketId)) {
      return false;
    }
    const attacker = this.players.get(attackerSocketId);
    const victim = this.players.get(victimSocketId);
    const dist = Math.hypot(attacker.x - victim.x, attacker.y - victim.y);

    if (dist < 1500 && victim.hp > 0) {
      attacker.kills++;
      victim.hp = 0;
      victim.lastClientReportedHp = 0;
      console.log(`⚔️ ${attacker.name} killed ${victim.name} in room ${this.id}`);
      return true;
    }
    return false;
  }
}

// Matchmaking queues keyed by gameMode
let queues = new Map();
let gameRooms = new Map();
let matchmakingTimers = {};
let playerActivityModes = new Map();

function countQueueForBaseMode(baseMode) {
  let total = 0;
  for (let [qKey, arr] of queues.entries()) {
    if (!Array.isArray(arr)) continue;
    if (qKey === baseMode || qKey.startsWith(baseMode + "_")) {
      total += arr.length;
    }
  }
  return total;
}

function getModePopulationStats() {
  const modes = {
    ffa_online: { playing: 0, inQueue: countQueueForBaseMode('ffa'), activeRooms: 0 },
    '5v5_online': { playing: 0, inQueue: countQueueForBaseMode('5v5'), activeRooms: 0 },
    duel_online: { playing: 0, inQueue: countQueueForBaseMode('duel'), activeRooms: 0 },
    ffa: { playing: 0, inQueue: 0, activeRooms: 0 },
    squad: { playing: 0, inQueue: 0, activeRooms: 0 },
    '5v5': { playing: 0, inQueue: 0, activeRooms: 0 },
    '1v1': { playing: 0, inQueue: 0, activeRooms: 0 },
    training: { playing: 0, inQueue: 0, activeRooms: 0 }
  };

  for (let [, room] of gameRooms) {
    if (!room) continue;
    const humanCount = Array.from(room.players.values()).filter(p => !p.isBot && p.hp > 0).length;
    if (humanCount <= 0) continue;
    const key = room.mode === '5v5' ? '5v5_online' : (room.mode === 'duel' ? 'duel_online' : 'ffa_online');
    if (modes[key]) {
      modes[key].playing += humanCount;
      modes[key].activeRooms += 1;
    }
  }

  for (let [, act] of playerActivityModes) {
    if (!act || act.status !== 'playing') continue;
    if (act.mode && modes[act.mode] && !String(act.mode).includes('online')) {
      modes[act.mode].playing += 1;
    }
  }

  return {
    timestamp: Date.now(),
    modes
  };
}

function broadcastModeStats() {
  try {
    io.emit('modeStatsUpdate', getModePopulationStats());
  } catch (_) {}
}

app.get('/api/mode-stats', (req, res) => {
  res.json(getModePopulationStats());
});

function findPlayerRoom(socketId) {
  for (let [roomId, room] of gameRooms) {
    if (room.players.has(socketId)) {
      return { roomId, room };
    }
  }
  return { roomId: null, room: null };
}

io.on('connection', (socket) => {
  console.log('✅ Player connected:', socket.id);
  socket.emit('modeStatsUpdate', getModePopulationStats());

  socket.on('requestModeStats', () => {
    socket.emit('modeStatsUpdate', getModePopulationStats());
  });

  socket.on('playerActivityMode', (data) => {
    if (data && data.mode) {
      playerActivityModes.set(socket.id, {
        mode: String(data.mode),
        status: data.status || 'menu',
        updatedAt: Date.now()
      });
      broadcastModeStats();
    }
  });

  // Player joins matchmaking queue
  socket.on('joinMatchmaking', (data) => {
    if (data && String(data.heroType || '').toLowerCase() === 'dayum') {
      socket.emit('heroLocked', { heroType: 'dayum', message: 'HERO LOCKED!!!' });
      return;
    }
    const rawMode = (data && data.gameMode) ? String(data.gameMode) : 'ffa';
    const strippedMode = rawMode.replace('_online', '');
    const modeParts = strippedMode.split('_');
    const baseMode = (data && data.baseMode) ? String(data.baseMode).replace('_online', '') : (modeParts[0] || 'ffa');
    const rawMap = (data && data.selectedMap) ? String(data.selectedMap) : (modeParts[1] || 'classic');
    const chosenMap = ['classic', 'sakura', 'farmland', 'port'].includes(rawMap) ? rawMap : 'classic';
    const queueKey = `${baseMode}_${chosenMap}`;
    const defaultMax = baseMode === '5v5' ? 10 : (baseMode === 'duel' ? 2 : 4);
    const requestedMax = Number(data && data.maxPlayers) || defaultMax;
    const maxPlayers = Math.max(2, Math.min(50, requestedMax));

    // Remove this socket from any other map/mode queue before joining the chosen map lobby
    for (let [otherKey, otherQ] of queues.entries()) {
      if (otherKey !== queueKey && Array.isArray(otherQ)) {
        const filtered = otherQ.filter(p => p.socketId !== socket.id);
        if (filtered.length !== otherQ.length) {
          queues.set(otherKey, filtered);
          if (filtered.length === 0 && matchmakingTimers[otherKey] && matchmakingTimers[otherKey].timeoutId) {
            clearTimeout(matchmakingTimers[otherKey].timeoutId);
            matchmakingTimers[otherKey].timeoutId = null;
          }
        }
      }
    }

    if (!queues.has(queueKey)) queues.set(queueKey, []);
    const q = queues.get(queueKey);

    // Prevent duplicate queue entries from the same socket
    const existingIdx = q.findIndex(p => p.socketId === socket.id);
    if (existingIdx !== -1) q.splice(existingIdx, 1);

    console.log(`🔵 ${data.playerName || 'Player'} joined map-separated queue: queueKey=${queueKey} (mode=${baseMode}, map=${chosenMap}) maxPlayers=${maxPlayers}`);

    q.push({
      socketId: socket.id,
      socket: socket,
      playerName: (data && data.playerName) || 'Player',
      heroType: (data && data.heroType) || 'paul',
      currentSkin: (data && data.currentSkin) || 'default',
      selectedMap: chosenMap,
      joinedAt: Date.now(),
      maxPlayers: maxPlayers,
      mode: baseMode,
      queueKey: queueKey
    });

    const playerPosition = q.findIndex(p => p.socketId === socket.id) + 1;

    socket.emit('queueStatus', {
      position: playerPosition,
      queuePosition: playerPosition,
      queueSize: q.length,
      estimatedWaitTime: 8,
      gameMode: baseMode,
      selectedMap: chosenMap,
      message: `Queue position: ${playerPosition}`
    });
    broadcastModeStats();

    q.forEach((p, idx) => {
      try {
        p.socket.emit('queueUpdated', {
          position: idx + 1,
          queuePosition: idx + 1,
          queueSize: q.length,
          gameMode: baseMode,
          selectedMap: chosenMap
        });
      } catch (_) {}
    });

    try {
      if (matchmakingTimers[queueKey] && typeof matchmakingTimers[queueKey].fillListener === 'function') {
        matchmakingTimers[queueKey].fillListener();
      }
    } catch (_) {}

    const targetToStart = baseMode === 'duel' ? 2 : (baseMode === '5v5' ? 10 : Math.min(maxPlayers, 4));
    if (q.length >= targetToStart) {
      console.log(`✅ Queue for '${queueKey}' reached ${q.length}/${targetToStart} — creating match...`);
      if (matchmakingTimers[queueKey] && matchmakingTimers[queueKey].timeoutId) {
        clearTimeout(matchmakingTimers[queueKey].timeoutId);
        matchmakingTimers[queueKey].timeoutId = null;
      }
      createMatch(queueKey, false, maxPlayers, true);
    } else {
      if (!matchmakingTimers[queueKey] || !matchmakingTimers[queueKey].timeoutId) {
        if (!matchmakingTimers[queueKey]) matchmakingTimers[queueKey] = {};
        const autoStartWaitMs = (baseMode === 'ffa' || baseMode === '5v5') ? 30000 : 8000;
        console.log(`⏳ Queue for '${queueKey}' has ${q.length} player(s); starting ${autoStartWaitMs / 1000}s auto-start timer`);
        matchmakingTimers[queueKey].timeoutId = setTimeout(() => {
          const currentQ = queues.get(queueKey) || [];
          if (currentQ.length > 0) {
            const matchCap = baseMode === 'duel' ? 2 : (baseMode === '5v5' ? 10 : Math.min(maxPlayers, 6));
            const needBots = currentQ.length < matchCap;
            console.log(`⏱️ Auto-starting '${queueKey}' match with ${currentQ.length} human player(s) after ${autoStartWaitMs / 1000}s (fillWithBots=${needBots}, matchCap=${matchCap})`);
            createMatch(queueKey, needBots, matchCap, true);
          }
          if (matchmakingTimers[queueKey]) matchmakingTimers[queueKey].timeoutId = null;
        }, autoStartWaitMs);
      }
    }
  });

  // Legacy/direct room join support (used by MultiplayerManager.joinGame and Training Lab fallback)
  socket.on('joinGame', (data) => {
    const roomId = (data && data.roomId) || `ffa-${Date.now()}`;
    const isTrainingRoom = String(roomId).startsWith('training-') || (data && data.gameMode === 'training');
    const mode = isTrainingRoom ? 'training' : ((data && data.gameMode) || 'ffa').replace('_online', '');
    let existingRoom = gameRooms.get(roomId);
    if (isTrainingRoom && existingRoom && existingRoom.players.has(socket.id)) {
      // Already registered by createTrainingInviteRoom / joinTrainingInviteRoom
      return;
    }
    if (isTrainingRoom) {
      leaveAllExistingRoomsForSocket(socket);
    }
    let room = gameRooms.get(roomId);
    if (!room) {
      room = new GameRoom(roomId, isTrainingRoom ? 4 : 10, mode);
      if (isTrainingRoom) {
        room.worldSize = 2000;
        room.inviteCode = (data && data.inviteCode) || String(roomId).replace(/^training-/, '');
        room.friendlyFire = !!(data && data.friendlyFire);
      }
      room.combatReadyAt = Date.now();
      gameRooms.set(roomId, room);
    }
    if (isTrainingRoom && room.getPlayerCount() >= 4 && !room.players.has(socket.id)) {
      return;
    }
    socket.join(roomId);
    const idx = room.getPlayerCount();
    const spawnX = isTrainingRoom ? (500 + (idx % 4) * 140) : (500 + (idx % 5) * 800);
    const spawnY = isTrainingRoom ? 1000 : (500 + Math.floor(idx / 5) * 800);
    room.addPlayer(socket.id, {
      name: (data && data.playerName) || 'Player',
      heroType: (data && data.heroType) || 'paul',
      currentSkin: (data && data.currentSkin) || 'default',
      x: spawnX,
      y: spawnY,
      team: isTrainingRoom ? (room.friendlyFire ? (idx + 1) : 1) : undefined,
      assignedIndex: idx
    });
    if (!room.gameRunning) room.startGameLoop();
    room.broadcastGameState();

    const playersMap = {};
    for (let [sid, p] of room.players) {
      playersMap[sid] = p;
    }
    socket.emit('gameState', { roomId, players: playersMap });
    io.to(roomId).emit('playerJoined', {
      playerId: socket.id,
      playerName: (data && data.playerName) || 'Player',
      playerCount: room.getPlayerCount(),
      players: playersMap
    });
    if (isTrainingRoom) {
      io.to(roomId).emit('trainingRoomState', {
        inviteCode: room.inviteCode || String(roomId).replace(/^training-/, ''),
        playerCount: room.getPlayerCount(),
        maxPlayers: 4,
        friendlyFire: !!room.friendlyFire
      });
    }
  });


  // --- Training Lab 8-Digit Invite Code Rooms (Max 4 Players) & Friendly Fire ---
  socket.on('checkTrainingInviteRoom', (data, cb) => {
    const code = data && data.inviteCode ? String(data.inviteCode).trim() : '';
    const roomId = `training-${code}`;
    const room = gameRooms.get(roomId);
    if (room && room.getPlayerCount() >= 4 && !room.players.has(socket.id)) {
      if (typeof cb === 'function') cb({ ok: false, reason: '⚠️ Training room is full (4 / 4 players)!' });
      return;
    }
    if (typeof cb === 'function') cb({ ok: true, playerCount: room ? room.getPlayerCount() : 0 });
  });

  function leaveAllExistingRoomsForSocket(sock) {
    for (let [rId, rObj] of gameRooms) {
      if (rObj.players.has(sock.id)) {
        rObj.removePlayer(sock.id);
        try { sock.leave(rId); } catch (_) {}
        if (rObj.getPlayerCount() === 0) {
          rObj.stopGameLoop();
          gameRooms.delete(rId);
        } else if (rObj.mode === 'training') {
          io.to(rId).emit('trainingRoomState', {
            inviteCode: rObj.inviteCode || '',
            playerCount: rObj.getPlayerCount(),
            maxPlayers: 4,
            friendlyFire: !!rObj.friendlyFire
          });
        }
      }
    }
  }

  socket.on('createTrainingInviteRoom', (data) => {
    leaveAllExistingRoomsForSocket(socket);
    const code = (data && data.inviteCode && /^[0-9]{8}$/.test(String(data.inviteCode)))
      ? String(data.inviteCode)
      : String(Math.floor(10000000 + Math.random() * 90000000));
    const roomId = `training-${code}`;
    let room = gameRooms.get(roomId);
    if (!room) {
      room = new GameRoom(roomId, 4, 'training');
      room.worldSize = 2000;
      room.inviteCode = code;
      room.friendlyFire = !!(data && data.friendlyFire);
      room.combatReadyAt = Date.now();
      gameRooms.set(roomId, room);
    }
    socket.join(roomId);
    const idx = room.getPlayerCount();
    room.addPlayer(socket.id, {
      name: (data && data.playerName) || 'Player',
      heroType: (data && data.heroType) || 'paul',
      currentSkin: (data && data.currentSkin) || 'default',
      x: 500 + (idx % 4) * 140,
      y: 1000,
      team: room.friendlyFire ? (idx + 1) : 1,
      assignedIndex: idx
    });
    if (!room.gameRunning) room.startGameLoop();
    room.broadcastGameState();
    io.to(roomId).emit('trainingRoomState', {
      inviteCode: code,
      playerCount: room.getPlayerCount(),
      maxPlayers: 4,
      friendlyFire: !!room.friendlyFire
    });
  });

  socket.on('joinTrainingInviteRoom', (data) => {
    const code = data && data.inviteCode ? String(data.inviteCode).trim() : '';
    if (!/^[0-9]{8}$/.test(code)) return;
    leaveAllExistingRoomsForSocket(socket);
    const roomId = `training-${code}`;
    let room = gameRooms.get(roomId);
    if (!room) {
      room = new GameRoom(roomId, 4, 'training');
      room.worldSize = 2000;
      room.inviteCode = code;
      room.friendlyFire = false;
      room.combatReadyAt = Date.now();
      gameRooms.set(roomId, room);
    }
    if (room.getPlayerCount() >= 4 && !room.players.has(socket.id)) {
      socket.emit('trainingRoomState', {
        inviteCode: code,
        playerCount: room.getPlayerCount(),
        maxPlayers: 4,
        friendlyFire: !!room.friendlyFire,
        error: 'Room is full (4/4)'
      });
      return;
    }
    socket.join(roomId);
    const idx = room.getPlayerCount();
    room.addPlayer(socket.id, {
      name: (data && data.playerName) || `Friend ${idx + 1}`,
      heroType: (data && data.heroType) || 'paul',
      currentSkin: (data && data.currentSkin) || 'default',
      x: 500 + (idx % 4) * 140,
      y: 1000,
      team: room.friendlyFire ? (idx + 1) : 1,
      assignedIndex: idx
    });
    if (!room.gameRunning) room.startGameLoop();
    room.broadcastGameState();
    io.to(roomId).emit('trainingRoomState', {
      inviteCode: code,
      playerCount: room.getPlayerCount(),
      maxPlayers: 4,
      friendlyFire: !!room.friendlyFire
    });
  });

  socket.on('setTrainingFriendlyFire', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (!room || room.mode !== 'training') return;
    room.friendlyFire = !!(data && data.friendlyFire);
    let idx = 0;
    for (let [, p] of room.players) {
      idx++;
      p.team = room.friendlyFire ? idx : 1;
    }
    io.to(roomId).emit('trainingRoomState', {
      inviteCode: room.inviteCode || (data && data.inviteCode) || '',
      playerCount: room.getPlayerCount(),
      maxPlayers: 4,
      friendlyFire: !!room.friendlyFire
    });
  });

  socket.on('readyForMatch', (data) => {
    const { room } = findPlayerRoom(socket.id);
    if (room) {
      room.combatReadyAt = Math.min(room.combatReadyAt || Date.now(), Date.now());
      if (!room.gameRunning) {
        room.startGameLoop();
      }
    }
  });

  // Player leaves queue
  socket.on('leaveQueue', () => {
    for (let [mode, q] of queues) {
      const before = q.length;
      queues.set(mode, q.filter(p => p.socketId !== socket.id));
      const after = queues.get(mode).length;
      if (after !== before) console.log(`❌ Player left ${mode} queue. New size: ${after}`);

      if (after === 0 && matchmakingTimers[mode] && matchmakingTimers[mode].timeoutId) {
        clearTimeout(matchmakingTimers[mode].timeoutId);
        matchmakingTimers[mode].timeoutId = null;
      }
      try {
        if (matchmakingTimers[mode] && typeof matchmakingTimers[mode].fillListener === 'function') {
          matchmakingTimers[mode].fillListener();
        }
      } catch (_) {}
    }
    broadcastModeStats();
  });

  // Player position & state update
  socket.on('playerUpdate', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (room) {
      room.updatePlayerPosition(socket.id, data);
      const pAfter = room.players.get(socket.id);
      const nonProjEntities = Array.isArray(data.entities)
        ? data.entities.filter(e => e && e.type !== 'projectile')
        : undefined;
      socket.to(roomId).emit('playerMoved', {
        playerId: socket.id,
        x: pAfter ? pAfter.x : data.x,
        y: pAfter ? pAfter.y : data.y,
        angle: data.angle || 0,
        color: data.color || null,
        heroType: data.heroType || null,
        currentSkin: data.currentSkin || null,
        entities: nonProjEntities
      });
    }
  });

  // Relay projectileFired events immediately for low-latency visuals
  socket.on('projectileFired', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (room && data) {
      socket.to(roomId).emit('projectileFired', {
        ...data,
        ownerSocketId: socket.id
      });
    }
  });

  // Allow players in matchmaking queue or pre-match countdown to update their selected heroType and currentSkin
  socket.on('playerQueueUpdate', (data) => {
    if (data && String(data.heroType || '').toLowerCase() === 'dayum') {
      socket.emit('heroLocked', { heroType: 'dayum', message: 'HERO LOCKED!!!' });
      return;
    }
    if (!data) return;
    for (const [, q] of queues.entries()) {
      const entry = q.find(p => p.socketId === socket.id);
      if (entry) {
        if (data.heroType) entry.heroType = data.heroType;
        if (data.currentSkin) entry.currentSkin = data.currentSkin;
      }
    }
    const { room } = findPlayerRoom(socket.id);
    if (room && room.players.has(socket.id)) {
      const rp = room.players.get(socket.id);
      if (data.heroType && (room.mode === 'training' || !room.gameRunning || !rp.lastDamagedAt)) {
        rp.heroType = data.heroType;
        const baseHp = getHeroBaseHp(data.heroType);
        rp.maxHp = baseHp;
        if (room.mode === 'training' || (!room.gameRunning && !rp.lastDamagedAt)) {
          rp.hp = baseHp;
          rp.lastClientReportedHp = baseHp;
        }
      }
      if (data.currentSkin) rp.currentSkin = data.currentSkin;
    }
  });

  // Relay generic player actions
  socket.on('playerAction', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (room && data) {
      socket.to(roomId).emit('playerAction', {
        playerId: socket.id,
        action: data.action,
        actionData: data.actionData || {}
      });
    }
  });

  // Handle Vival Second Life ritual revive in online mode
  socket.on('vivalRevive', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    player.vivalSecondLifeTriggered = true;
    player.vivalRitualActive = false;
    player.maxHp = 6000;
    player.hp = 3600;
    player.lastClientReportedHp = 3600;
    if (data && typeof data.x === 'number' && Number.isFinite(data.x)) player.x = data.x;
    else if (typeof player.vivalRitualX === 'number') player.x = player.vivalRitualX;
    if (data && typeof data.y === 'number' && Number.isFinite(data.y)) player.y = data.y;
    else if (typeof player.vivalRitualY === 'number') player.y = player.vivalRitualY;
    io.to(roomId).emit('playerHealthUpdated', {
      socketId: socket.id,
      hp: player.hp,
      maxHp: player.maxHp,
      shield: player.shield || 0,
      x: player.x,
      y: player.y,
      vivalRevived: true,
      damageApplied: 0
    });
  });

  // Handle healing reports from clients
  socket.on('playerHeal', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (!room || !data) return;
    const player = room.players.get(socket.id);
    if (!player || player.hp <= 0) return;
    const healAmount = Math.min(player.maxHp, Math.max(0, Math.round(Number(data.amount) || 0)));
    if (healAmount <= 0) return;
    player.hp = Math.min(player.maxHp, player.hp + healAmount);
    player.lastClientReportedHp = player.hp;
    io.to(roomId).emit('playerHealed', {
      playerId: socket.id,
      socketId: socket.id,
      hp: player.hp,
      maxHp: player.maxHp,
      shield: player.shield || 0
    });
  });

  // Handle leaderboard requests
  socket.on('requestLeaderboard', () => {
    const { room } = findPlayerRoom(socket.id);
    if (!room) return;
    const leaderboard = Array.from(room.players.values())
      .map(p => ({
        playerId: p.socketId,
        socketId: p.socketId,
        name: p.name,
        heroType: p.heroType,
        kills: p.kills || 0,
        deaths: p.deaths || 0,
        assists: p.assists || 0,
        totalDamage: Math.ceil(p.totalDamage || 0),
        damageTaken: Math.ceil(p.totalDamageTaken || 0),
        totalDamageTaken: Math.ceil(p.totalDamageTaken || 0),
        hp: p.hp,
        maxHp: p.maxHp,
        alive: p.hp > 0
      }))
      .sort((a, b) => (b.kills - a.kills) || ((b.totalDamage || 0) - (a.totalDamage || 0)));
    socket.emit('leaderboard', leaderboard);
  });

  // Handle respawn requests (for 5v5 or custom respawn modes)
  socket.on('requestRespawn', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    const isMecca = String(player.heroType || '').toLowerCase() === 'mecca';
    if (data && typeof data.maxHp === 'number' && data.maxHp >= 100) {
      player.maxHp = Math.min(SERVER_MAX_HP, Math.round(data.maxHp));
    }
    player.hp = player.maxHp;
    player.lastClientReportedHp = player.maxHp;
    if (isMecca) {
      const meccaShield = (data && data.ascended) || player.maxHp >= 6000 ? 1200 : 1000;
      player.shield = meccaShield;
      player.maxShield = meccaShield;
      player.lastClientReportedShield = meccaShield;
    } else {
      player.shield = 0;
      player.lastClientReportedShield = 0;
    }
    player.x = player.team === 1 ? 800 : (player.team === 2 ? 4200 : 500 + Math.random() * (room.worldSize - 1000));
    player.y = room.mode === '5v5' ? 2500 : 500 + Math.random() * (room.worldSize - 1000);
    io.to(roomId).emit('playerRespawned', {
      playerId: socket.id,
      socketId: socket.id,
      hp: player.hp,
      maxHp: player.maxHp,
      shield: player.shield,
      maxShield: player.maxShield,
      x: player.x,
      y: player.y
    });
  });

  // Handle damage taken by remote player
  socket.on('playerDamaged', (data) => {
    const { roomId, room: playerRoom } = findPlayerRoom(socket.id);
    if (!playerRoom || !data || !data.socketId) return;

    const victim = playerRoom.players.get(data.socketId);
    const attacker = playerRoom.players.get(socket.id);
    if (!victim || !attacker) return;
    if (data.socketId === socket.id) return;
    if (victim.hp <= 0) return;

    const distance = Math.hypot(attacker.x - victim.x, attacker.y - victim.y);
    const MAX_ATTACK_RANGE = 5000;
    if (distance > MAX_ATTACK_RANGE) return;

    const nowTs = Date.now();
    if (!playerRoom.lastDamageTimestamps) playerRoom.lastDamageTimestamps = new Map();
    let victimMap = playerRoom.lastDamageTimestamps.get(data.socketId);
    if (!victimMap) victimMap = new Map();
    const attackerId = data.attackerSocketId || socket.id;

    // Projectile dedupe
    const projId = data.projectileId || data.remoteId || null;
    if (!playerRoom.recentProjectileIds) playerRoom.recentProjectileIds = new Map();
    if (projId) {
      const seenAt = playerRoom.recentProjectileIds.get(projId);
      const PROJ_TTL = 200;
      if (seenAt && (nowTs - seenAt) < PROJ_TTL) return;
      playerRoom.recentProjectileIds.set(projId, nowTs);
      for (let [k, t] of playerRoom.recentProjectileIds) {
        if (nowTs - t > PROJ_TTL) playerRoom.recentProjectileIds.delete(k);
      }
    }

    let rawDamage = Number(data.damageTaken) || 0;
    if (rawDamage <= 0) return;
    if (rawDamage > MAX_DAMAGE_PER_HIT) rawDamage = MAX_DAMAGE_PER_HIT;

    const isProSniper = !!data.isProSniper || (data.ability === 'pro_sniper');
    const prevHp = victim.hp || 0;
    const prevShield = victim.shield || 0;

    let computed = Math.max(1, Math.floor(rawDamage));
    if (isProSniper && computed <= 2250) {
      computed = 2250;
    }

    const clampedByGlobal = Math.min(computed, MAX_DAMAGE_PER_HIT);
    const trueDamage = !!data.trueDamage;
    const rawTrueAmt = (typeof data.trueDamageAmount === 'number' && Number.isFinite(data.trueDamageAmount))
      ? Math.min(clampedByGlobal, Math.max(0, Math.floor(data.trueDamageAmount)))
      : (trueDamage ? clampedByGlobal : 0);

    let damageToShield = 0;
    let damageToHp = 0;

    const victimIsMecca = String(victim.heroType || '').toLowerCase() === 'mecca';
    const victimHasYellowShield = victimIsMecca || !!victim.hasMechArmor || ((victim.yellowShield || 0) > 0);
    if (victimHasYellowShield && prevShield > 0) {
      let curYellow = (typeof victim.yellowShield === 'number' && victim.yellowShield > 0)
        ? Math.min(prevShield, victim.yellowShield)
        : prevShield;
      let curWhite = Math.max(0, prevShield - curYellow);
      let remTrue = Math.max(0, Math.min(clampedByGlobal, trueDamage ? clampedByGlobal : rawTrueAmt));
      let remNormal = Math.max(0, clampedByGlobal - remTrue);

      // 1. Yellow Shield absorbs hits first (blocks both True Damage and Normal Damage)
      const absTrueByY = Math.min(curYellow, remTrue);
      curYellow -= absTrueByY;
      remTrue -= absTrueByY;
      const absNormByY = Math.min(curYellow, remNormal);
      curYellow -= absNormByY;
      remNormal -= absNormByY;

      // 2. White Shield absorbs remaining Normal Damage next (does not block True Damage)
      const absNormByW = Math.min(curWhite, remNormal);
      curWhite -= absNormByW;
      remNormal -= absNormByW;

      victim.yellowShield = Math.max(0, curYellow);
      damageToShield = (absTrueByY + absNormByY + absNormByW);
      damageToHp = Math.min(prevHp, Math.max(0, remNormal + remTrue));
    } else if (trueDamage || rawTrueAmt >= clampedByGlobal) {
      damageToHp = Math.min(clampedByGlobal, prevHp);
    } else if (rawTrueAmt > 0) {
      const normalPart = Math.max(0, clampedByGlobal - rawTrueAmt);
      damageToShield = Math.min(prevShield, normalPart);
      const normalOverflowToHp = Math.max(0, normalPart - damageToShield);
      damageToHp = Math.min(prevHp, normalOverflowToHp + rawTrueAmt);
    } else {
      if (prevShield >= clampedByGlobal) {
        damageToShield = clampedByGlobal;
      } else {
        damageToShield = prevShield;
        damageToHp = Math.min(prevHp, clampedByGlobal - prevShield);
      }
    }

    const computedApplied = damageToShield + damageToHp;
    const wasClamped = computed !== computedApplied;

    victim.shield = Math.max(0, prevShield - damageToShield);
    victim.lastClientReportedShield = victim.shield;
    victim.hp = Math.max(0, prevHp - damageToHp);
    victim.lastClientReportedHp = victim.hp;
    victim.lastDamagedAt = nowTs;
    victimMap.set(attackerId, nowTs);
    playerRoom.lastDamageTimestamps.set(data.socketId, victimMap);
    const attackerSocketId = data.attackerSocketId || socket.id;
    const isLocalBotHit = !!data.attackerIsLocalBot;
    const actualAttacker = isLocalBotHit ? null : (playerRoom.players.get(attackerSocketId) || attacker);

    victim.totalDamageTaken = (victim.totalDamageTaken || 0) + computedApplied;
    if (actualAttacker && actualAttacker !== victim) {
      actualAttacker.totalDamage = (actualAttacker.totalDamage || 0) + computedApplied;
      if (!victim.damageContributors) victim.damageContributors = new Map();
      const prevC = victim.damageContributors.get(actualAttacker.socketId) || { amount: 0, time: 0 };
      prevC.amount = (prevC.amount || 0) + computedApplied;
      prevC.time = nowTs;
      victim.damageContributors.set(actualAttacker.socketId, prevC);
    }

    // Check if victim is Vival with active Ritual Second Life (requires 3 E hits -> vivalReviveReady) before declaring death!
    let vivalRevivedNow = false;
    if (victim.hp <= 0 && String(victim.heroType || '').toLowerCase() === 'vival' && victim.vivalRitualActive && victim.vivalReviveReady && !victim.vivalSecondLifeTriggered) {
      vivalRevivedNow = true;
      victim.vivalSecondLifeTriggered = true;
      victim.vivalRitualActive = false;
      victim.vivalReviveReady = false;
      victim.maxHp = 6000;
      victim.hp = 3600;
      victim.lastClientReportedHp = 3600;
      if (typeof victim.vivalRitualX === 'number') victim.x = victim.vivalRitualX;
      if (typeof victim.vivalRitualY === 'number') victim.y = victim.vivalRitualY;
    }

    if (victim.hp <= 0 && prevHp > 0 && !vivalRevivedNow) {
      if (actualAttacker && actualAttacker !== victim) {
        actualAttacker.kills = (actualAttacker.kills || 0) + 1;
      }
      if (playerRoom.mode !== 'ffa') {
        victim.deaths = (victim.deaths || 0) + 1;
      }
      if (victim.damageContributors && victim.damageContributors.size > 0) {
        for (const [contribId, cObj] of victim.damageContributors) {
          if ((actualAttacker && contribId === actualAttacker.socketId) || contribId === victim.socketId) continue;
          const cPlayer = playerRoom.players.get(contribId);
          if (cPlayer && cPlayer.hp > 0 && cObj && cObj.amount > 0 && (nowTs - (cObj.time || 0)) <= 10000) {
            if (playerRoom.mode === 'ffa' || !actualAttacker || cPlayer.team === actualAttacker.team) {
              cPlayer.assists = (cPlayer.assists || 0) + 1;
            }
          }
        }
        victim.damageContributors.clear();
      }
    }

    if (victim.shield <= 0 || (typeof victim.yellowShield === 'number' && victim.yellowShield <= 0)) {
      victim.yellowShield = 0;
      victim.hasMechArmor = false;
    }
    const mechArmorBrokenNow = !!(victimHasYellowShield && prevShield > 0 && !victim.hasMechArmor);
    io.to(roomId).emit('playerHealthUpdated', {
      socketId: data.socketId,
      hp: victim.hp,
      maxHp: victim.maxHp,
      shield: victim.shield,
      mechArmorBroken: mechArmorBrokenNow,
      x: vivalRevivedNow ? victim.x : undefined,
      y: vivalRevivedNow ? victim.y : undefined,
      vivalRevived: vivalRevivedNow,
      attacker: data.damageDealer || (actualAttacker && actualAttacker.name) || attacker.name || null,
      attackerSocketId: attackerSocketId,
      attackerIsLocalBot: isLocalBotHit,
      attackerBotName: data.attackerBotName || undefined,
      attackerKills: actualAttacker ? (actualAttacker.kills || 0) : undefined,
      attackerTotalDamage: actualAttacker ? Math.ceil(actualAttacker.totalDamage || 0) : undefined,
      victimDeaths: victim.deaths || 0,
      victimTotalDamageTaken: Math.ceil(victim.totalDamageTaken || 0),
      damageApplied: computedApplied,
      damageToShield: damageToShield,
      damageToHp: damageToHp,
      computedDamage: computed,
      clamped: wasClamped,
      trueDamage: trueDamage
    });

    if (victim.hp <= 0 && prevHp > 0 && !vivalRevivedNow) {
      if (playerRoom.mode === 'training') {
        victim.hp = victim.maxHp;
        victim.lastClientReportedHp = victim.maxHp;
        io.to(roomId).emit('playerRespawned', {
          playerId: victim.socketId,
          socketId: victim.socketId,
          hp: victim.hp,
          maxHp: victim.maxHp,
          shield: victim.shield || 0,
          maxShield: victim.maxShield || 0,
          x: victim.x,
          y: victim.y
        });
      } else {
        playerRoom.checkVictoryAfterDeath(victim);
      }
    }
  });

  // Handle status/effect application (also applies stun/slow/knockback to server bots!)
  socket.on('playerEffect', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (!room || !data || !data.socketId || !data.effect || !data.effect.type) return;
    const victim = room.players.get(data.socketId);
    if (!victim) return;

    const eff = data.effect;
    const now = Date.now();
    let displaced = false;
    if (eff.type === 'push' && eff.value) {
      if (typeof eff.value.x === 'number' && typeof eff.value.y === 'number' && Math.hypot(eff.value.x - victim.x, eff.value.y - victim.y) < 950) {
        victim.x = Math.max(40, Math.min(room.worldSize - 40, eff.value.x));
        victim.y = Math.max(40, Math.min(room.worldSize - 40, eff.value.y));
        displaced = true;
      } else if (typeof eff.value.dx === 'number' && typeof eff.value.dy === 'number' && (Math.abs(eff.value.dx) > 0 || Math.abs(eff.value.dy) > 0)) {
        victim.x = Math.max(40, Math.min(room.worldSize - 40, victim.x + eff.value.dx));
        victim.y = Math.max(40, Math.min(room.worldSize - 40, victim.y + eff.value.dy));
        displaced = true;
      }
      victim.lastPushedAt = now;
    } else if (eff.type === 'pull' && eff.value) {
      if (typeof eff.value.x === 'number' && typeof eff.value.y === 'number' && Math.hypot(eff.value.x - victim.x, eff.value.y - victim.y) < 950) {
        victim.x = Math.max(40, Math.min(room.worldSize - 40, eff.value.x));
        victim.y = Math.max(40, Math.min(room.worldSize - 40, eff.value.y));
      } else {
        if (typeof eff.value.dx === 'number') victim.x = Math.max(40, Math.min(room.worldSize - 40, victim.x + eff.value.dx));
        if (typeof eff.value.dy === 'number') victim.y = Math.max(40, Math.min(room.worldSize - 40, victim.y + eff.value.dy));
      }
      victim.lastPushedAt = now;
      displaced = true;
    } else if (eff.type === 'knockback' && eff.value) {
      const kx = Number(eff.value.x) || 0;
      const ky = Number(eff.value.y) || 0;
      victim.x = Math.max(40, Math.min(room.worldSize - 40, victim.x + kx * 0.165));
      victim.y = Math.max(40, Math.min(room.worldSize - 40, victim.y + ky * 0.165));
      if (victim.isBot) {
        victim.kbVx = (victim.kbVx || 0) + kx * 0.65;
        victim.kbVy = (victim.kbVy || 0) + ky * 0.65;
      }
      victim.lastPushedAt = now;
      displaced = true;
    }
    if (displaced) {
      io.to(roomId).emit('playerMoved', {
        playerId: victim.socketId,
        x: victim.x,
        y: victim.y,
        angle: victim.angle || 0,
        color: victim.color || null,
        heroType: victim.heroType || null,
        currentSkin: victim.currentSkin || null,
        forcedPush: true
      });
    }
    if (eff.type === 'heal') {
      const healAmt = Math.min(victim.maxHp, Math.max(0, Math.round(Number(eff.value) || 0)));
      if (healAmt > 0 && victim.hp > 0) {
        victim.hp = Math.min(victim.maxHp, victim.hp + healAmt);
        victim.lastClientReportedHp = victim.hp;
      }
    }
    if (victim.isBot) {
      if (eff.type === 'stun' || eff.type === 'freeze' || eff.type === 'fightingTimer' || eff.type === 'movementLockdownTimer') {
        const durMs = Math.max(0, (Number(eff.value) || 0) * 1000);
        victim.stunUntil = Math.max(victim.stunUntil || 0, now + durMs);
      } else if (eff.type === 'ankleBreak') {
        const durSec = (eff.value && typeof eff.value === 'object') ? (Number(eff.value.duration) || 0.5) : (Number(eff.value) || 0.5);
        const dirVal = (eff.value && typeof eff.value === 'object' && typeof eff.value.dir === 'number') ? eff.value.dir : ((victim.angle || 0) + Math.PI);
        victim.ankleBreakUntil = Math.max(victim.ankleBreakUntil || 0, now + Math.min(3000, durSec * 1000));
        victim.ankleBreakDir = dirVal;
      } else if (eff.type === 'slow' || eff.type === 'bransonSlow') {
        const durMs = Math.max(0, (Number(eff.value) || 0) * 1000);
        victim.slowUntil = Math.max(victim.slowUntil || 0, now + durMs);
      }
    }

    const attackerSocketId = data.attackerSocketId || socket.id;
    io.to(roomId).emit('playerEffect', {
      socketId: data.socketId,
      effect: data.effect,
      attackerSocketId: attackerSocketId
    });
  });

  // Handle kill claim from client
  socket.on('playerKilled', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (room && data && room.validateKill(socket.id, data.victimSocketId)) {
      io.to(roomId).emit('killNotification', {
        killer: room.players.get(socket.id)?.name || 'Player',
        victim: room.players.get(data.victimSocketId)?.name || 'Player'
      });
    }
  });

  // Relay ability sounds to room
  socket.on('abilitySound', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (room && data) {
      io.to(roomId).emit('abilitySound', {
        ability: data.ability,
        x: data.x,
        y: data.y,
        heroType: data.heroType,
        skin: data.skin
      });
    }
  });

  // Handle player victory broadcast
  socket.on('playerVictory', (data) => {
    const { roomId, room } = findPlayerRoom(socket.id);
    if (room) {
      const winner = room.players.get(socket.id);
      io.to(roomId).emit('playerVictory', {
        winnerId: socket.id,
        winnerName: winner ? winner.name : 'Player'
      });
      console.log(`🏆 Victory broadcast in room ${roomId}: ${winner ? winner.name : socket.id} won!`);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ Player disconnected:', socket.id);

    for (let [mode, q] of queues) {
      queues.set(mode, q.filter(p => p.socketId !== socket.id));
      if (queues.get(mode).length === 0 && matchmakingTimers[mode] && matchmakingTimers[mode].timeoutId) {
        clearTimeout(matchmakingTimers[mode].timeoutId);
        matchmakingTimers[mode].timeoutId = null;
      }
    }

    for (let [roomId, room] of gameRooms) {
      if (room.players.has(socket.id)) {
        const departing = room.players.get(socket.id);
        room.removePlayer(socket.id);

        io.to(roomId).emit('playerLeft', {
          playerId: socket.id,
          playerName: departing ? departing.name : 'Player',
          playerCount: room.getPlayerCount()
        });

        const remaining = Array.from(room.players.values());
        const humanRemaining = remaining.filter(p => !p.isBot);
        const aliveNow = remaining.filter(p => p.hp > 0);

        if (humanRemaining.length === 0 || room.getPlayerCount() === 0) {
          room.stopGameLoop();
          gameRooms.delete(roomId);
          console.log(`🗑️ Deleted room ${roomId} (no human players remaining)`);
        } else if (room.mode === 'training') {
          io.to(roomId).emit('trainingRoomState', {
            inviteCode: room.inviteCode || String(roomId).replace(/^training-/, ''),
            playerCount: room.getPlayerCount(),
            maxPlayers: 4,
            friendlyFire: !!room.friendlyFire
          });
        } else if (aliveNow.length === 1) {
          const winner = aliveNow[0];
          console.log(`🏆 Winner in room ${roomId} due to disconnect: ${winner.name} (${winner.socketId})`);
          io.to(roomId).emit('playerVictory', { winnerId: winner.socketId, winnerName: winner.name });
          io.to(roomId).emit('gameOver', { winnerSocketId: winner.socketId, winnerId: winner.socketId, winnerName: winner.name });
          room.stopGameLoop();
        }
        break;
      }
    }
    playerActivityModes.delete(socket.id);
    broadcastModeStats();
  });
});

// Create match from map-separated queue
function createMatch(queueKey = 'ffa_classic', fillWithBots = false, maxPlayers = 4, forceStart = false) {
  console.log('\n=== CREATING MATCH ===');
  const q = queues.get(queueKey) || [];
  const keyParts = String(queueKey || 'ffa').split('_');
  const mode = (q[0] && q[0].mode) || keyParts[0] || 'ffa';
  const mapFromKey = ['classic', 'sakura', 'farmland', 'port'].includes(keyParts[1]) ? keyParts[1] : null;
  console.log(`Queue size for '${queueKey}' (mode=${mode}):`, q.length);

  if (q.length === 0 && !fillWithBots) {
    console.log('❌ Queue is empty for', queueKey, 'cannot create match!');
    return;
  }

  const chosenMap = mapFromKey || (q[0] && q[0].selectedMap) || 'classic';
  // Filter only players who selected the same map so different maps never mix
  const matchingPlayers = [];
  const remainingPlayers = [];
  for (const p of q) {
    const pMap = (p && p.selectedMap) || chosenMap;
    if (pMap === chosenMap && matchingPlayers.length < maxPlayers) {
      matchingPlayers.push(p);
    } else {
      remainingPlayers.push(p);
    }
  }
  queues.set(queueKey, remainingPlayers);
  const players = matchingPlayers;
  const roomId = `${mode}-${chosenMap}-${Date.now()}`;

  let botsAdded = 0;
  if (fillWithBots) {
    const targetBotFill = mode === 'duel' ? 2 : (mode === '5v5' ? 10 : Math.min(maxPlayers, 4));
    while (players.length < targetBotFill) {
      const botHero = BOT_HERO_TYPES[Math.floor(Math.random() * BOT_HERO_TYPES.length)];
      players.push({
        socketId: `bot-${mode}-${Date.now()}-${botsAdded}`,
        socket: null,
        playerName: `Bot ${botsAdded + 1} (${botHero.charAt(0).toUpperCase() + botHero.slice(1)})`,
        heroType: botHero,
        selectedMap: chosenMap,
        joinedAt: Date.now(),
        maxPlayers: targetBotFill,
        mode: mode,
        isBot: true
      });
      botsAdded++;
    }
    if (botsAdded > 0) {
      console.log(`🤖 Added ${botsAdded} bots to match ${roomId}`);
    }
  }

  const effectiveMaxPlayers = Math.max(players.length, maxPlayers);
  const roomSeed = Date.now() % 1000000;
  const room = new GameRoom(roomId, effectiveMaxPlayers, mode, chosenMap, roomSeed);
  room.combatReadyAt = Date.now() + 5500;
  gameRooms.set(roomId, room);

  // Create well-spaced spawn positions inside world bounds
  const spawns = [];
  const totalSlots = Math.max(effectiveMaxPlayers, players.length, 2);
  if (mode === 'duel') {
    spawns.push({ x: 500, y: 1000, team: 1 });
    spawns.push({ x: 1500, y: 1000, team: 2 });
  } else if (mode === '5v5') {
    for (let i = 0; i < totalSlots; i++) {
      const isBlue = (i % 2 === 0);
      spawns.push({
        x: isBlue ? 800 : 4200,
        y: 1500 + Math.floor(i / 2) * 450,
        team: isBlue ? 1 : 2
      });
    }
  } else {
    for (let i = 0; i < totalSlots; i++) {
      const angle = (i / Math.max(4, players.length)) * Math.PI * 2;
      const dist = 950;
      spawns.push({
        x: Math.round(2500 + Math.cos(angle) * dist),
        y: Math.round(2500 + Math.sin(angle) * dist)
      });
    }
  }

  const mapSeed = room.mapSeed;
  const mapLayout = room.mapLayout;

  // Add players to room
  players.forEach((player, index) => {
    if (player.socket) {
      try { player.socket.join(roomId); } catch (_) {}
    }
    const spawnPos = spawns[index] || { x: 500 + (index % 5) * 800, y: 500 + Math.floor(index / 5) * 800 };

    room.addPlayer(player.socketId, {
      name: player.playerName,
      heroType: player.heroType,
      currentSkin: player.currentSkin,
      x: spawnPos.x,
      y: spawnPos.y,
      team: spawnPos.team,
      isBot: !!player.isBot,
      assignedIndex: index
    });

    if (player.socket) {
      try {
        player.socket.emit('matchFound', {
          roomId: roomId,
          countdown: 5,
          playerCount: players.length,
          maxPlayers: forceStart ? players.length : effectiveMaxPlayers,
          hasBots: botsAdded > 0,
          spawnPositions: spawns,
          assignedIndex: index,
          mapSeed: mapSeed,
          mapLayout: mapLayout,
          players: players.map(p => ({
            id: p.socketId,
            socketId: p.socketId,
            name: p.playerName,
            heroType: p.heroType,
            isBot: !!p.isBot
          })),
          message: botsAdded > 0 ? '🤖 Match ready (with AI bots)!' : '⚔️ Match found!',
          mode: mode
        });
      } catch (e) {
        console.warn('emit matchFound failed', e);
      }
    }
  });

  console.log(`📊 Room ${roomId} created with ${room.getPlayerCount()} players (forceStart=${forceStart})`);
  console.log('=== MATCH CREATED ===\n');
  broadcastModeStats();

  if (room.getPlayerCount() >= effectiveMaxPlayers || forceStart) {
    let idx = 0;
    for (let [socketId, pData] of room.players) {
      if (!pData.isBot) {
        try {
          io.to(socketId).emit('matchReady', {
            roomId,
            countdown: 5,
            playerCount: room.getPlayerCount(),
            maxPlayers: room.getPlayerCount(),
            mapSeed,
            mapLayout,
            spawnPositions: spawns,
            assignedIndex: idx,
            mode: mode
          });
        } catch (e) {
          console.warn('emit matchReady failed to', socketId, e);
        }
      }
      idx++;
    }

    io.to(roomId).emit('matchReadyBroadcast', {
      roomId,
      playerCount: room.getPlayerCount(),
      maxPlayers: room.getPlayerCount()
    });

    setTimeout(() => {
      if (gameRooms.has(roomId)) {
        room.startGameLoop();
        io.to(roomId).emit('gameStart', { roomId: roomId, message: 'Battle Start!' });
      }
    }, 5000);

    setTimeout(() => {
      if (gameRooms.has(roomId)) {
        room.stopGameLoop();
        gameRooms.delete(roomId);
        console.log(`🗑️ Deleted room ${roomId} after 30m timeout`);
      }
    }, 30 * 60 * 1000);
  }
}

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket on ws://localhost:${PORT}`);
    console.log(`🎮 Open http://localhost:${PORT} in your browser to play!\n`);
  });
}

module.exports = { app, server, io, getHeroBaseHp };