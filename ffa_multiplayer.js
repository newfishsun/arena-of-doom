/**
 * FFA Multiplayer Mode Handler
 * Bridges MultiplayerManager with index.html's online game system (OnlinePlayerProxy, initializeOnlineFFAGame, etc.)
 */

class FFAMultiplayer {
  constructor(gameInstance) {
    this.game = gameInstance || (typeof window !== 'undefined' ? window : {});
    this.multiplayer = null;
    this.isInQueue = false;
    this.isInGame = false;
    this.currentRoomId = null;
    this.remotePlayerMap = {};
    this.gameStartTime = null;
    this.gameEnded = false;
    this.lastUpdateTime = 0;
    this.localKills = 0;
    this.localDeaths = 0;
  }

  /**
   * Initialize and connect to server
   */
  async connect(serverUrl) {
    try {
      if (typeof window !== 'undefined' && typeof window.initializeOnlineFFA === 'function') {
        window.initializeOnlineFFA();
      }
      this.multiplayer = new MultiplayerManager(this.game);
      await this.multiplayer.connect(serverUrl);
      console.log('✓ Connected to multiplayer server');
      return true;
    } catch (error) {
      console.error('✗ Failed to connect:', error);
      this.showError('Connection failed: ' + error.message);
      return false;
    }
  }

  /**
   * Join FFA matchmaking queue
   */
  async joinFFAQueue(heroType, playerName = 'Player', gameMode = 'ffa', maxPlayers = 50) {
    if (typeof window !== 'undefined' && typeof window.startOnlineFFA === 'function' && gameMode === 'ffa') {
      window.startOnlineFFA();
      return true;
    }

    if (!this.multiplayer || !this.multiplayer.isConnected) {
      const ok = await this.connect();
      if (!ok) return false;
    }

    this.isInQueue = true;
    if (typeof window !== 'undefined' && typeof window.showQueueUI === 'function') {
      window.showQueueUI();
    } else {
      this.showQueueUI();
    }

    const resolvedHero = heroType || (typeof selectedHeroType !== 'undefined' ? selectedHeroType : 'paul');
    const resolvedSkin = (typeof selectedSkins !== 'undefined' && selectedSkins[resolvedHero]) ? selectedSkins[resolvedHero] : 'default';
    this.multiplayer.socket.emit('joinMatchmaking', {
      gameMode: gameMode,
      heroType: resolvedHero,
      currentSkin: resolvedSkin,
      playerName: playerName || 'Player',
      maxPlayers: maxPlayers
    });

    this.multiplayer.socket.off('queueStatus');
    this.multiplayer.socket.on('queueStatus', (data) => {
      this.updateQueueStatus(data);
    });

    this.multiplayer.socket.once('matchFound', (data) => {
      if (typeof window !== 'undefined' && typeof window.onMatchFound === 'function') {
        window.onMatchFound(data);
      } else {
        this.onMatchFound(data);
      }
    });

    return true;
  }

  cancelQueue() {
    if (typeof window !== 'undefined' && typeof window.cancelQueue === 'function') {
      window.cancelQueue();
    }
    if (this.multiplayer && this.multiplayer.socket) {
      this.multiplayer.socket.emit('leaveQueue');
    }
    this.isInQueue = false;
    this.hideQueueUI();
  }

  showQueueUI() {
    let modal = document.getElementById('matchmakingModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'matchmakingModal';
      modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%);border:3px solid #00bcd4;padding:40px;border-radius:15px;z-index:1000;text-align:center;color:white;font-family:Arial,sans-serif;';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div style="text-align: center; color: white;">
        <h2>🎮 Finding Match...</h2>
        <p id="queuePos">Position in queue: <span>1</span></p>
        <div id="queueStatsDisplay" style="margin-top: 20px; font-size: 14px; color: #88ffff;">
          <div>Players searching: <span id="ffaQueueSize">1</span></div>
        </div>
        <button onclick="if(window.ffaMultiplayer) ffaMultiplayer.cancelQueue(); else if(window.cancelQueue) cancelQueue();"
          style="margin-top: 20px; padding: 10px 20px; background: #ff3333; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
          Cancel
        </button>
      </div>
    `;
  }

  hideQueueUI() {
    const modal = document.getElementById('matchmakingModal');
    if (modal) modal.style.display = 'none';
  }

  updateQueueStatus(data) {
    if (typeof window !== 'undefined' && typeof window.updateQueueUI === 'function') {
      window.updateQueueUI(data);
    }
    const posSpan = document.querySelector('#queuePos span');
    const sizeSpan = document.getElementById('ffaQueueSize');
    const pos = data.position || data.queuePosition || 1;
    const size = data.queueSize || pos;
    if (posSpan) posSpan.textContent = pos;
    if (sizeSpan) sizeSpan.textContent = size;
  }

  onMatchFound(data) {
    if (typeof window !== 'undefined' && typeof window.onMatchFound === 'function') {
      window.onMatchFound(data);
      return;
    }
    this.currentRoomId = data.roomId;
    this.gameStartTime = Date.now();
    this.isInQueue = false;
    this.isInGame = true;
    this.gameEnded = false;
    this.hideQueueUI();
    this.startFFAGame(data);
  }

  startFFAGame(matchData) {
    const assignedIndex = (typeof matchData.assignedIndex !== 'undefined') ? matchData.assignedIndex : 0;
    const spawnData = matchData.spawnPositions
      ? (matchData.spawnPositions[assignedIndex] || matchData.spawnPositions[0])
      : { x: 500, y: 500 };

    if (matchData.mapSeed && typeof window !== 'undefined') {
      window.currentMapSeed = matchData.mapSeed;
    }

    if (typeof window !== 'undefined' && typeof window.initializeOnlineFFAGame === 'function') {
      window.initializeOnlineFFAGame(spawnData);
    }

    if (this.multiplayer && this.multiplayer.socket) {
      this.multiplayer.socket.emit('readyForMatch', {
        roomId: this.currentRoomId || matchData.roomId
      });
    }
  }

  showError(message) {
    let modal = document.getElementById('matchmakingModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'matchmakingModal';
      modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a3e;border:3px solid #e74c3c;padding:30px;border-radius:12px;z-index:1000;text-align:center;color:white;';
      document.body.appendChild(modal);
    }
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div style="text-align: center; color: #ff6b6b;">
        <h2>❌ Error</h2>
        <p>${message}</p>
        <button onclick="if(window.ffaMultiplayer) ffaMultiplayer.cancelQueue();"
          style="margin-top: 20px; padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
  }

  disconnect() {
    if (this.multiplayer) {
      this.multiplayer.disconnect();
    }
    this.isInGame = false;
    this.isInQueue = false;
  }
}

let ffaMultiplayer = null;

async function initializeFFAMultiplayer() {
  if (!ffaMultiplayer) {
    ffaMultiplayer = new FFAMultiplayer(typeof window !== 'undefined' ? window : {});
  }
  const connected = await ffaMultiplayer.connect();
  if (!connected) {
    console.error('Failed to initialize multiplayer');
    return false;
  }
  return true;
}

async function startFFAMultiplayerSession(heroType, playerName) {
  if (typeof window !== 'undefined' && typeof window.startOnlineFFA === 'function') {
    window.startOnlineFFA();
    return;
  }
  if (!ffaMultiplayer) {
    const initialized = await initializeFFAMultiplayer();
    if (!initialized) return;
  }
  await ffaMultiplayer.joinFFAQueue(heroType, playerName);
}

if (typeof window !== 'undefined') {
  window.FFAMultiplayer = FFAMultiplayer;
  window.initializeFFAMultiplayer = initializeFFAMultiplayer;
  window.startFFAMultiplayerSession = startFFAMultiplayerSession;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FFAMultiplayer, initializeFFAMultiplayer, startFFAMultiplayerSession };
}