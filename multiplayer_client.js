/**
 * Multiplayer Manager for Hero Game
 * Handles client-side Socket.IO networking with server.js
 * Compatible with both standalone usage and the built-in onlineSocket system in index.html
 */

class MultiplayerManager {
  constructor(gameInstance) {
    this.socket = null;
    this.game = gameInstance || (typeof window !== 'undefined' ? window : {});
    this.playerId = null;
    this.roomId = null;
    this.otherPlayers = {};
    this.isConnected = false;
    this.serverUrl = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'http://localhost:3000';
  }

  /**
   * Connect to the multiplayer server (reuses window.onlineSocket if already created)
   */
  connect(customUrl) {
    if (customUrl) this.serverUrl = customUrl;
    return new Promise((resolve, reject) => {
      try {
        if (typeof window !== 'undefined' && window.onlineSocket) {
          this.socket = window.onlineSocket;
          if (this.socket.connected) {
            this.playerId = this.socket.id;
            window.mySocketId = this.socket.id;
            this.isConnected = true;
            this.setupEventListeners();
            resolve(this.socket.id);
            return;
          }
          this.socket.once('connect', () => {
            this.playerId = this.socket.id;
            window.mySocketId = this.socket.id;
            this.isConnected = true;
            this.setupEventListeners();
            resolve(this.socket.id);
          });
          return;
        }

        if (typeof io === 'undefined') {
          reject(new Error('Socket.IO client library is not loaded'));
          return;
        }

        this.socket = io(this.serverUrl, {
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5
        });

        if (typeof window !== 'undefined') {
          window.onlineSocket = this.socket;
        }

        this.socket.on('connect', () => {
          console.log('Connected to server:', this.socket.id);
          this.playerId = this.socket.id;
          if (typeof window !== 'undefined') window.mySocketId = this.socket.id;
          this.isConnected = true;
          this.setupEventListeners();
          resolve(this.socket.id);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
        });

        this.socket.on('error', (error) => {
          console.error('Socket error:', error);
        });

        this.socket.on('disconnect', () => {
          console.log('Disconnected from server');
          this.isConnected = false;
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Join a game room directly or via matchmaking
   */
  joinGame(roomId, heroType, playerName, gameMode = 'ffa') {
    if (!this.isConnected || !this.socket) {
      console.error('Not connected to server');
      return;
    }

    this.roomId = roomId;
    this.socket.emit('joinGame', {
      roomId: roomId,
      heroType: heroType || 'paul',
      playerName: playerName || 'Player',
      gameMode: gameMode
    });
  }

  /**
   * Setup all socket event listeners
   */
  setupEventListeners() {
    if (!this.socket || this.socket._mpManagerBound) return;
    this.socket._mpManagerBound = true;

    this.socket.on('gameState', (state) => {
      if (!state || !state.players) return;
      for (let playerId in state.players) {
        if (playerId !== this.playerId) {
          this.otherPlayers[playerId] = {
            ...state.players[playerId],
            isRemote: true
          };
        }
      }
    });

    this.socket.on('playerJoined', (data) => {
      if (!data) return;
      if (data.players) {
        for (let playerId in data.players) {
          if (playerId !== this.playerId && !this.otherPlayers[playerId]) {
            this.otherPlayers[playerId] = {
              ...data.players[playerId],
              isRemote: true
            };
          }
        }
      }
      if (this.game && typeof this.game.showNotification === 'function') {
        this.game.showNotification(`${data.playerName || 'Player'} joined! (${data.playerCount || 1} players)`);
      }
    });

    this.socket.on('gameStateUpdate', (state) => {
      if (!state || !Array.isArray(state.players)) return;
      const activeIds = new Set();
      for (let p of state.players) {
        if (p.socketId === this.playerId) continue;
        activeIds.add(p.socketId);
        this.otherPlayers[p.socketId] = this.otherPlayers[p.socketId] || {};
        const dest = this.otherPlayers[p.socketId];
        dest.socketId = p.socketId;
        dest.x = p.x;
        dest.y = p.y;
        dest.angle = p.angle;
        dest.hp = p.hp;
        dest.maxHp = p.maxHp;
        dest.shield = p.shield;
        dest.maxShield = p.maxShield;
        dest.name = p.name;
        dest.heroType = p.heroType;
        dest.currentSkin = p.currentSkin || 'default';
        dest.speedMult = p.speedMult || 1;
        dest.dmgMult = p.dmgMult || 1;
        dest.entities = p.entities || [];
        dest.slashes = p.slashes || [];
        dest.particles = p.particles || [];
        dest.abilityVisuals = p.abilityVisuals || {};
        dest.dead = (p.hp <= 0);
        dest.isRemote = true;
        dest.lastUpdate = state.timestamp || Date.now();
      }
      for (let id in this.otherPlayers) {
        if (!activeIds.has(id)) delete this.otherPlayers[id];
      }
    });

    this.socket.on('playerAction', (data) => {
      if (data && this.otherPlayers[data.playerId] && this.game && typeof this.game.handleRemoteAction === 'function') {
        this.game.handleRemoteAction(data);
      }
    });

    this.socket.on('playerHealthUpdated', (data) => {
      if (!data || !data.socketId) return;
      if (data.socketId !== this.playerId) {
        const p = this.otherPlayers[data.socketId] || (this.otherPlayers[data.socketId] = {});
        p.hp = data.hp;
        p.maxHp = data.maxHp;
        p.shield = data.shield;
        p.dead = (data.hp <= 0);
      }
    });

    this.socket.on('playerHealed', (data) => {
      const targetId = data && (data.socketId || data.playerId);
      if (targetId && this.otherPlayers[targetId]) {
        this.otherPlayers[targetId].hp = data.hp;
      }
    });

    this.socket.on('safeZoneUpdate', (data) => {
      if (data && this.game && typeof this.game.updateSafeZone === 'function') {
        this.game.updateSafeZone(data.x, data.y, data.radius);
      }
    });

    this.socket.on('leaderboard', (leaderboard) => {
      if (this.game && typeof this.game.updateLeaderboard === 'function') {
        this.game.updateLeaderboard(leaderboard);
      }
    });

    this.socket.on('playerRespawned', (data) => {
      const targetId = data && (data.socketId || data.playerId);
      if (targetId && this.otherPlayers[targetId]) {
        this.otherPlayers[targetId].dead = false;
        this.otherPlayers[targetId].hp = data.hp;
        this.otherPlayers[targetId].x = data.x;
        this.otherPlayers[targetId].y = data.y;
      }
    });

    this.socket.on('playerLeft', (data) => {
      if (!data) return;
      delete this.otherPlayers[data.playerId];
      if (this.game && typeof this.game.showNotification === 'function') {
        this.game.showNotification(`${data.playerName || 'Player'} left (${data.playerCount || 0} players remaining)`);
      }
    });

    this.socket.on('gameOver', (data) => {
      if (this.game && typeof this.game.endGame === 'function') {
        const myId = this.playerId || (this.socket && this.socket.id);
        const winnerId = data && (data.winnerSocketId || data.winnerId);
        this.game.endGame(winnerId === myId);
      }
    });

    this.socket.on('modeStatsUpdate', (stats) => {
      if (typeof window !== 'undefined' && typeof window.renderGameModeBoard === 'function') {
        window.renderGameModeBoard(stats);
      }
    });
  }

  /**
   * Send player position and combat state update to server
   */
  sendPlayerUpdate(x, y, angle, velocity = 0, isMoving = false, extra = {}) {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('playerUpdate', {
      roomId: this.roomId,
      socketId: this.playerId || this.socket.id,
      x: x,
      y: y,
      angle: angle,
      velocity: velocity,
      isMoving: isMoving,
      ...extra
    });
  }

  /**
   * Send player action/ability usage
   */
  sendPlayerAction(action, actionData = {}) {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('playerAction', {
      roomId: this.roomId,
      action: action,
      actionData: actionData
    });
  }

  /**
   * Report damage dealt to a remote target
   */
  reportDamage(damage, targetOrAttacker = null, source = 'basic') {
    if (!this.isConnected || !this.socket) return;
    const dmgVal = Number(damage);
    if (!Number.isFinite(dmgVal) || dmgVal <= 0) return;

    const victimSocketId = typeof targetOrAttacker === 'string'
      ? targetOrAttacker
      : (targetOrAttacker && (targetOrAttacker.victimSocketId || targetOrAttacker.socketId)) || null;

    if (!victimSocketId) return;

    this._burstQueue = this._burstQueue || {};
    const entry = this._burstQueue[victimSocketId] || {
      damageTaken: 0,
      damageDealer: (targetOrAttacker && targetOrAttacker.name) || 'Player',
      trueDamage: false,
      isProSniper: false,
      source: source,
      timer: null,
      lastEmitMs: 0
    };
    entry.damageTaken += dmgVal;
    if (targetOrAttacker && targetOrAttacker.trueDamage) entry.trueDamage = true;
    if (targetOrAttacker && targetOrAttacker.isProSniper) entry.isProSniper = true;
    this._burstQueue[victimSocketId] = entry;

    const flush = () => {
      const queued = this._burstQueue[victimSocketId];
      if (!queued) return;
      if (queued.timer) {
        clearTimeout(queued.timer);
        queued.timer = null;
      }
      const total = Math.round(queued.damageTaken);
      queued.damageTaken = 0;
      queued.lastEmitMs = Date.now();
      if (total <= 0 || !this.socket) return;
      this.socket.emit('playerDamaged', {
        roomId: this.roomId,
        socketId: victimSocketId,
        damageTaken: total,
        damageDealer: queued.damageDealer,
        attackerSocketId: this.playerId || this.socket.id,
        trueDamage: queued.trueDamage,
        isProSniper: queued.isProSniper,
        source: queued.source
      });
    };

    if (!entry.timer && (Date.now() - (entry.lastEmitMs || 0)) >= 12) {
      flush();
    } else if (!entry.timer) {
      entry.timer = setTimeout(flush, 12);
    }
  }

  /**
   * Report healing
   */
  reportHealing(amount) {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('playerHeal', {
      roomId: this.roomId,
      amount: amount
    });
  }

  /**
   * Request leaderboard update
   */
  requestLeaderboard() {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('requestLeaderboard', {
      roomId: this.roomId
    });
  }

  /**
   * Request respawn after death
   */
  requestRespawn() {
    if (!this.isConnected || !this.socket) return;

    this.socket.emit('requestRespawn', {
      roomId: this.roomId
    });
  }

  getRemotePlayers() {
    return Object.values(this.otherPlayers);
  }

  getRemotePlayer(playerId) {
    return this.otherPlayers[playerId];
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

if (typeof window !== 'undefined') {
  window.MultiplayerManager = MultiplayerManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiplayerManager;
}