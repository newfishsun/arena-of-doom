        let onlineSocket = null;
        let mySocketId = null; // Track our own socket ID
        let isInQueue = false;

        // Classic scripts share lexical bindings, but class declarations are not
        // window properties. Publish the loaded hero constructors for getHeroClass
        // and online hero lookup, which intentionally use window[name].
        const loadedHeroClassNames = [
          'Paul', 'Lune', 'BrunoAlexander', 'Noob', 'Kaiser', 'Tate', 'Edgar',
          'Builderman', 'LightHero', 'Kai', 'Mamba', 'Acheron', 'Ming', 'Nos',
          'Glace', 'Carlos', 'Wesley', 'Gamb', 'Neo', 'Buster', 'Melvin', 'Ren',
          'Chimera', 'Li', 'Lav', 'Max', 'Benjamin', 'Kenshi', 'Gigi', 'Yun',
          'RacingDuo', 'Fred', 'Noli', 'Coolkidd', 'Vival', 'Gregory', 'Cornelius',
          'Aurora', 'Bai', 'Apollo', 'Zeus', 'BountyHunter', 'Caskrice', 'Don',
          'Monza', 'Christian', 'Faik', 'Fletcher', 'Darrick', 'Twins', 'Trent',
          'Guest', 'Jimeka', 'Dayum', 'Ash', 'Zappa', 'Cyrus', 'Ambrose', 'Austin',
          'Winston', 'Amir', 'Steven'
        ];
        for (const className of loadedHeroClassNames) {
          try {
            const HeroClass = eval(className);
            if (typeof HeroClass === 'function') window[className] = HeroClass;
          } catch (_) {}
        }

        function initializeOnlineFFA() {
          console.log('🔵 initializeOnlineFFA() called');
          
          if (!onlineSocket) {
            onlineSocket = io();
            console.log('   Creating new Socket.IO connection...');
            
            onlineSocket.on('connect', () => {
              mySocketId = onlineSocket.id;
              console.log(`✅ Connected! Socket ID: ${mySocketId}`);
              console.log(`   Type: ${typeof mySocketId}`);
              console.log(`   Length: ${mySocketId ? mySocketId.length : 'undefined'}`);
            });
            
            onlineSocket.on('disconnect', () => {
              console.log('❌ Socket disconnected');
              mySocketId = null;
            });
          }
          
          // If already connected, capture ID immediately
          if (onlineSocket.connected) {
            mySocketId = onlineSocket.id;
            console.log(`✅ Already connected. Socket ID: ${mySocketId}`);
            console.log(`   Type: ${typeof mySocketId}`);
          }
        }

                // Map hero types to representative colors so remote players render using their chosen hero color
                // We provide an explicit map for common heroes and fall back to instantiating the class
                // so new heroes automatically pick up the right shade.
                function getHeroColor(heroType) {
                    const map = {
                        paul: '#3498db',
                        noob: '#f1c40f',
                        kaiser: '#8e44ad',
                        tate: '#5d4037',
                        edgar: '#2c3e50',
                        builderman: '#f39c12',
                        light: '#fff700',
                        kai: '#8e44ad',
                        mamba: '#000000',
                        acheron: '#34495e',
                        ming: '#C0C0C0',
                        nos: '#800080',
                        glace: '#4682B4',
                        carlos: '#27ae60',
                        wesley: '#e67e22',
                        gamb: '#8B4513',
                        neo: '#00cc00',
                        buster: '#1873cc',
                        melvin: '#9b59b6',
                        ren: '#e74c3c',
                        chimera: '#a335ee',
                        li: '#f39c12',
                        lav: '#e91e63',
                        max: '#2196F3',
                        benjamin: '#4CAF50',
                        kenshi: '#FF5722',
                        gigi: '#9C27B0',
                        yun: '#795548',
                        racingduo: '#FF9800',
                        noli: '#4b0082',
                        coolkidd: '#8b0000',
                        don: '#8B4513',
                        monza: '#9b59b6',
                        dayum: '#FFD700',
                        ash: '#C0504D',
                        zappa: '#00BCD4',
                        ambrose: '#FFC107',
                        austin: '#8BC34A',
                        vival: '#E91E63',
                        aurora: '#9C27B0',
                        apollo: '#FF5722',
                        christian: '#000000',
                        bounty: '#FFD700',
                        jimeka: '#f1c40f',
                        guest: '#f1c40f',
                        trent: '#3498db',
                        twins: '#f1c40f',
                        faik: '#8B0000',
                        fletcher: '#f1c40f',
                        darrick: '#f1c40f',
                        winston: '#f1c40f',
                        amir: '#f1c40f',
                        steven: '#8B008B',
                        cornelius: '#f1c40f',
                        bai: '#f1c40f',
                        bountyhunter: '#f1c40f',
                        default: '#ff6b6b'
                    };
                    if (!heroType) return map.default;
                    const key = heroType.toLowerCase();
                    if (map[key]) return map[key];
                    // try to instantiate class to grab its color property
                    try {
                        const className = key.charAt(0).toUpperCase() + key.slice(1);
                        const ctor = window[className];
                        if (typeof ctor === 'function') {
                            const tmp = new ctor(0, 0, false);
                            if (tmp && tmp.color) return tmp.color;
                        }
                    } catch (_){ }
                    return map.default;
                }

        // Determine radius for a hero type by creating a temporary instance (fallback 25)
        function getHeroRadius(heroType) {
            if (!heroType) return 25;
            try {
                const key = heroType.toLowerCase();
                const className = key.charAt(0).toUpperCase() + key.slice(1);
                const ctor = window[className];
                if (typeof ctor === 'function') {
                    const tmp = new ctor(0, 0, false);
                    if (tmp && typeof tmp.radius === 'number') return tmp.radius;
                }
            } catch (_){ }
            // manual overrides for a few known small/large heroes
            const manual = { faik: 22 };
            return manual[heroType.toLowerCase()] || 25;
        }

        function startOnlineFFA() {
          console.log('🌐 Starting Online FFA...');
          currentMatchmakingMode = 'ffa';
          currentMatchmakingMaxPlayers = 50;
          gameMode = 'ffa_online';
          document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (Online FFA)';
          console.log('   mySocketId before connect check:', mySocketId);
          console.log('   onlineSocket connected?', onlineSocket && onlineSocket.connected);
          if (!onlineSocket) {
            initializeOnlineFFA();
          }
          if (!onlineSocket.connected) {
            console.log('⏳ Socket not connected yet, waiting...');
            onlineSocket.once('connect', () => {
              console.log('✅ Socket connected! Now joining queue');
              console.log('   mySocketId:', mySocketId);
              joinQueue();
            });
          } else {
            console.log('✅ Socket already connected, joining queue immediately');
            joinQueue();
          }
        }

        function startOnlineDuel() {
          console.log('🌐 Starting Online 1v1 Duel...');
          currentMatchmakingMode = 'duel';
          currentMatchmakingMaxPlayers = 2;
          gameMode = 'duel_online';
          document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (Online 1v1)';
          if (!onlineSocket) {
            initializeOnlineFFA(); // reuse connection setup
          }
          if (!onlineSocket.connected) {
            onlineSocket.once('connect', () => {
              joinQueue();
            });
          } else {
            joinQueue();
          }
        }

        function joinQueue() {
          console.log('📤 Emitting joinMatchmaking for mode', currentMatchmakingMode);
          console.log('   mySocketId:', mySocketId);
          isInQueue = true;
          showQueueUI();
          // Emit join queue event
          const payload = {
              playerName: 'Player',
              heroType: selectedHeroType || 'paul',
              gameMode: currentMatchmakingMode,
              maxPlayers: currentMatchmakingMaxPlayers
          };
          if (currentMatchmakingMode === 'duel') {
              payload.minPlayers = 2;
          }
          onlineSocket.emit('joinMatchmaking', payload);


          // Listen for queue status
          onlineSocket.on('queueStatus', (data) => {
            console.log('📊 Queue status:', data);
            updateQueueUI(data);
          });

          // Listen for match found
          onlineSocket.once('matchFound', (data) => {
            console.log('✅ Match found!', data);
            onMatchFound(data);
          });
        }

        const funnyMessages = [
          '🔍 Searching for worthy opponents...',
          '⚔️ Preparing the battlefield...',
          '😤 Gathering champions...',
          '🎯 Waking up warriors...',
          '💪 Power levels rising...',
          '🌪️ Incoming portal...',
          '🔮 Consulting the ancients...',
          '🎪 Arena always want chaos',
          '⏰ Time to get crush everyone',
          '🚀 Launching Battle Mode...',
          '🎭 Summoning warriors...',
          '🌟 Gathering the legends...',
          '🔥 Wanna eat a fire pizza?',
          '❄️ As chill as Glace...',
          '🎵 Queue music intensifies...',
          '🎲 Lets go gambling,Aw dang it...',
          '🏆 Getting ready to dominate...',
          '👹 Monsters inside me...its burning!',
          '⚽ Lets play football... WORLD CUPPPPP! ',
          '💀 Waiting til death...',
          "😡WHEN WILL THIS MATCH BEGIN😡😡",
          "▶︎ •၊၊||၊|။||||။‌‌‌‌‌၊|• 0:10",
          '¯\_(ツ)_/¯',
          '💤 imagine sleeping...'
        ];

        let queueStartTime = 0;
        let queueUpdateTimer = null;

        function showQueueUI() {
          let modal = document.getElementById('matchmakingModal');
          if (!modal) {
            modal = document.createElement('div');
            modal.id = 'matchmakingModal';
            modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg, #0a0e27 0%, #1a1a3e 100%);border:3px solid #00bcd4;padding:40px;border-radius:15px;z-index:1000;text-align:center;color:white;box-shadow:0 0 30px rgba(0,188,212,0.7), inset 0 0 20px rgba(0,188,212,0.1);font-family:Arial,sans-serif;';
            document.body.appendChild(modal);
          }
          modal.style.display = 'block';
          queueStartTime = Date.now();
          
          const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
          
          modal.innerHTML = `
            <h1 style="font-size:32px;margin-bottom:10px;text-shadow:0 0 10px #00bcd4;">🎮 MATCHMAKING 🎮</h1>
            <p id="funnyMessage" style="font-size:18px;color:#00bcd4;margin:15px 0;font-weight:bold;min-height:25px;">${randomMessage}</p>
            
            <div id="queueVisual" style="margin:20px 0;font-size:24px;">
              <span style="display:inline-block;animation:bounce 0.6s infinite;">●</span>
              <span style="display:inline-block;animation:bounce 0.6s 0.1s infinite;">●</span>
              <span style="display:inline-block;animation:bounce 0.6s 0.2s infinite;">●</span>
            </div>
            
            <p id="queuePosition" style="font-size:16px;margin:10px 0;">Queue Position: <span style="color:#00ff00;font-weight:bold;">1</span></p>
            <p id="queueWait" style="font-size:16px;margin:10px 0;">Time in queue: <span style="color:#ffff00;font-weight:bold;">0</span>s</p>
            <p id="queuePlayers" style="font-size:14px;margin:10px 0;color:#88ffff;">Players searching: <span id="playerCount">1</span></p>
            
            <button onclick="cancelQueue()" style="margin-top:25px;padding:12px 30px;background:linear-gradient(135deg, #ff3333, #dd0000);color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 0 10px rgba(255,51,51,0.5);transition:all 0.3s;">⚡ Cancel & Rage Quit</button>
          `;

          // Add animation style
          if (!document.getElementById('queueAnimationStyle')) {
            const style = document.createElement('style');
            style.id = 'queueAnimationStyle';
            style.textContent = `
              @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
              }
            `;
            document.head.appendChild(style);
          }

          // Update queue timer
          if (queueUpdateTimer) clearInterval(queueUpdateTimer);
          queueUpdateTimer = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - queueStartTime) / 1000);
            const waitSpan = document.querySelector('#queueWait span');
            if (waitSpan) waitSpan.textContent = elapsedSeconds;

            // Change message every 3 seconds
            if (elapsedSeconds % 3 === 0 && elapsedSeconds > 0) {
              const newMsg = document.getElementById('funnyMessage');
              if (newMsg) {
                const msg = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
                newMsg.style.opacity = '0.5';
                setTimeout(() => {
                  newMsg.textContent = msg;
                  newMsg.style.transition = 'opacity 0.3s';
                  newMsg.style.opacity = '1';
                }, 100);
              }
            }
          }, 1000);
        }

        function updateQueueUI(data) {
          let pos = document.querySelector('#queuePosition span');
          let playerCount = document.getElementById('playerCount');
          if (pos) pos.textContent = data.queueSize;
          if (playerCount) playerCount.textContent = data.queueSize;
        }

        function cancelQueue() {
          isInQueue = false;
          if (onlineSocket) {
            onlineSocket.emit('leaveQueue');
          }
          let modal = document.getElementById('matchmakingModal');
          if (modal) modal.style.display = 'none';
          if (queueUpdateTimer) clearInterval(queueUpdateTimer);
        }

        function initializeOnlineFFAGame(playerData) {
          // Reset all game state for new match
          resetMatchVisuals();
          // adjust map size for duel mode
          if (gameMode === 'duel_online') {
              WORLD_SIZE = 2000;
              console.log('📏 Duel mode: world size set to', WORLD_SIZE);
              safeZoneRadius = 0; // no safe zone in 1v1 online
          } else {
              WORLD_SIZE = 5000;
              // disable safe zone for all online matches (FFA/5v5 as well) to prevent red tint/crash
              if (gameMode.includes('online')) {
                  safeZoneRadius = 0;
              } else {
                  safeZoneRadius = WORLD_SIZE * 0.8;
              }
          }
          window.dayumBombs = [];
          window.onlinePlayers = {}; // Store other online players
          window.remoteProjectiles = {}; // Store remote projectiles
          window.onlineEntities = {}; // Store remote entities
          
          // Initialize minimap canvas context
          MINIMAP_CANVAS = document.getElementById('minimapCanvas');
          if (MINIMAP_CANVAS) {
            MINIMAP_CTX = MINIMAP_CANVAS.getContext('2d');
            console.log('✅ Minimap canvas initialized for online FFA');
          } else {
            console.warn('⚠️ Minimap canvas not found');
          }
          
          try {
            const heroType = selectedHeroType || 'paul';
            console.log('🦸 Creating online hero:', heroType);
            
            // Use if/else (WORKS! Avoids scope issues with class lookup)
            if(heroType==='noob')player=new Noob(playerData.x,playerData.y,true);
            else if(heroType==='kaiser')player=new Kaiser(playerData.x,playerData.y,true);
            else if(heroType==='tate')player=new Tate(playerData.x,playerData.y,true);
            else if(heroType==='christian')player=new Christian(playerData.x,playerData.y,true);
            else if(heroType==='edgar')player=new Edgar(playerData.x,playerData.y,true);
            else if(heroType==='coolkidd')player=new Coolkidd(playerData.x,playerData.y,true);
            else if(heroType==='builderman')player=new Builderman(playerData.x,playerData.y,true);
            else if(heroType==='mamba')player=new Mamba(playerData.x,playerData.y,true);
            else if(heroType==='light')player=new LightHero(playerData.x,playerData.y,true);
            else if(heroType==='kai')player=new Kai(playerData.x,playerData.y,true);
            else if(heroType==='acheron')player=new Acheron(playerData.x,playerData.y,true);
            else if(heroType==='noli')player=new Noli(playerData.x,playerData.y,true);
            else if(heroType==='don')player=new Don(playerData.x,playerData.y,true);
            else if(heroType==='faik')player=new Faik(playerData.x,playerData.y,true);
            else if(heroType==='darrick')player=new Darrick(playerData.x,playerData.y,true);
            else if(heroType==='fletcher')player=new Fletcher(playerData.x,playerData.y,true);
            else if(heroType==='glace')player=new Glace(playerData.x,playerData.y,true);
            else if(heroType==='ming')player=new Ming(playerData.x,playerData.y,true);
            else if(heroType==='nos')player=new Nos(playerData.x,playerData.y,true);
            else if(heroType==='carlos')player=new Carlos(playerData.x,playerData.y,true);
            else if(heroType==='buster')player=new Buster(playerData.x,playerData.y,true);
            else if(heroType==='ren')player=new Ren(playerData.x,playerData.y,true);
            else if(heroType==='melvin')player=new Melvin(playerData.x,playerData.y,true);
            else if(heroType==='gamb')player=new Gamb(playerData.x,playerData.y,true);
            else if(heroType==='neo')player=new Neo(playerData.x,playerData.y,true);
            else if(heroType==='chimera')player=new Chimera(playerData.x,playerData.y,true);
            else if(heroType==='li')player=new Li(playerData.x,playerData.y,true);
            else if(heroType==='lav')player=new Lav(playerData.x,playerData.y,true);
            else if(heroType==='max')player=new Max(playerData.x,playerData.y,true);
            else if(heroType==='fred')player=new Fred(playerData.x,playerData.y,true);
            else if(heroType==='kenshi')player=new Kenshi(playerData.x,playerData.y,true);
            else if(heroType==='gigi')player=new Gigi(playerData.x,playerData.y,true);
            else if(heroType==='benjamin')player=new Benjamin(playerData.x,playerData.y,true);
            else if(heroType==='zappa')player=new Zappa(playerData.x,playerData.y,true);
            else if(heroType==='cyrus')player=new Cyrus(playerData.x,playerData.y,true);
            else if(heroType==='austin')player=new Austin(playerData.x,playerData.y,true);
            else if(heroType==='ambrose')player=new Ambrose(playerData.x,playerData.y,true);
            else if(heroType==='wesley')player=new Wesley(playerData.x,playerData.y,true);
            else if(heroType==='ash')player=new Ash(playerData.x,playerData.y,true);
            else if(heroType==='yun')player=new Yun(playerData.x,playerData.y,true);
            else if(heroType==='racingduo')player=new RacingDuo(playerData.x,playerData.y,true);
            else if(heroType==='monza')player=new Monza(playerData.x,playerData.y,true);
            else if(heroType==='vival')player=new Vival(playerData.x,playerData.y,true);
            else if(heroType==='everdawn')player=new Everdawn(playerData.x,playerData.y,true);
            else if(heroType==='aurora')player=new Aurora(playerData.x,playerData.y,true);
            else if(heroType==='bai')player=new Bai(playerData.x,playerData.y,true);
            else if(heroType==='apollo')player=new Apollo(playerData.x,playerData.y,true);
            else if(heroType==='bruno'){if(q)q.innerText='🧪';if(e)e.innerText='⚔️';if(f)f.innerText='☄️';if(g)g.innerText='✦';player=new BrunoAlexander(playerData.x,playerData.y,true);}
            else if(heroType==='bounty')player=new BountyHunter(playerData.x,playerData.y,true);
            else if(heroType==='dayum')player=new Dayum(playerData.x,playerData.y,true);
            else if(heroType==='winston')player=new Winston(playerData.x,playerData.y,true);
            else if(heroType==='amir')player=new Amir(playerData.x,playerData.y,true);
            else if(heroType==='steven')player=new Steven(playerData.x,playerData.y,true);
            else if(heroType==='cornelius')player=new Cornelius(playerData.x,playerData.y,true);
            else if(heroType==='trent')player=new Trent(playerData.x,playerData.y,true);
            else if(heroType==='guest')player=new Guest(playerData.x,playerData.y,true);
            else if(heroType==='jimeka')player=new Jimeka(playerData.x,playerData.y,true);
            else if(heroType==='twins')player=new Twins(playerData.x,playerData.y,true);
            else player=new Paul(playerData.x,playerData.y,true);
            
            // Set socketId for damage reporting and team for collision detection
            player.socketId = onlineSocket.id;
            player.team = parseInt(onlineSocket.id.charCodeAt(0)) + parseInt(onlineSocket.id.charCodeAt(1)) * 256;
            mySocketId = onlineSocket.id;
            console.log(`✅ Player created with socketId: ${player.socketId}, team: ${player.team}`);
            
            player.name = 'Player';
            player.gear = selectedGear || 'speedster';
            // Apply selected skin for all heroes, including nodes created without a currentSkin field yet.
            player.currentSkin = selectedSkins[selectedHeroType] || 'default';
            // In online FFA, use socket ID as team so each player is distinct and collisions work
            if (gameMode === 'ffa_online' && mySocketId) {
              player.team = parseInt(mySocketId.charCodeAt(0)) + parseInt(mySocketId.charCodeAt(1)) * 256;
            } else {
              player.team = 0; // Local modes use team 0
            }
            
            // Entrance sounds for Don Pollo and Real Top G
            if ((selectedHeroType === 'tate' && player.currentSkin === 'Real Top G') ||
                (selectedHeroType === 'don' && player.currentSkin === 'Don Pollo')) {
                let sounds = getSkinSounds(selectedHeroType, player.currentSkin);
                if(sounds && sounds.entrance) {
                    let audio = new Audio(sounds.entrance);
                    audio.volume = 0.8;
                    audio.play().catch(e => console.log('Sound failed:', e));
                }
            }
            
            entities.push(player);
            
                        // Spawn bushes to make map visible (deterministic when mapSeed provided)
                        let rng = Math.random;
                        if (window.currentMapSeed) {
                            // Simple LCG seeded RNG
                            (function(){
                                let s = Number(window.currentMapSeed) % 2147483647;
                                if (s <= 0) s += 2147483646;
                                rng = function(){ s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
                            })();
                        }
                        // do not spawn bushes in any online match – avoid extreme clustering
                        // (all online map types should remain clear)
                        // nothing here
            
            console.log('✅ Player created:', player.constructor.name, 'at', playerData.x, playerData.y);
            if(bushes.length>0) console.log('Bushes spawned:', bushes.length);
            
            // Show HUD, hide selection
            // Preserve skin modal if it's open - don't auto-close it
            let skinModal = document.getElementById('skinSelectModal');
            let skinModalWasOpen = skinModal && skinModal.style.display === 'block';
            
            document.getElementById('heroSelectScreen').style.display = 'none';
            document.getElementById('controlsBtn').style.display='none';
            let controlsPanel = document.getElementById('controlsPanel');
            if(controlsPanel) controlsPanel.style.display='none';
            
            // Restore skin modal visibility if it was open before game start
            if(skinModalWasOpen && skinModal) {
                skinModal.style.display = 'block';
                skinModal.style.zIndex = '2001'; // Ensure it's above game elements
            }
            
            document.getElementById('hud').style.display = 'block';
            
            // Ensure canvas is visible
            if (CANVAS) {
              CANVAS.style.display = 'block';
              console.log('Canvas visible');
            }
            
            // Setup camera
            camera.x = player.x - CANVAS.width / 2;
            camera.y = player.y - CANVAS.height / 2;
            
            // Disable safe zone in offline 1v1 as well
            if (gameMode === '1v1') safeZoneRadius = 0;
            
            // Start the game loop
            gameRunning = true;
            lastTime = performance.now();
            
            // Start broadcasting player position and HUD updates
            startPlayerPositionSync();
            setupOnlineListeners();
            
            // Initial HUD update to show correct abilities
            updateHUD(player);
            
            console.log('✅ Online FFA Game Started!');
            console.log(`   Hero: ${player.constructor.name}`);
            console.log(`   Minimap: ${MINIMAP_CTX ? 'Ready' : 'Not available'}`);
            console.log(`   Q ability loaded: Yes`);
            console.log(`   E ability loaded: Yes`);
          } catch (error) {
            console.error('❌ Error initializing online FFA:', error);
            gameRunning = false;
          }
        }

        function onMatchFound(data) {
          if (queueUpdateTimer) clearInterval(queueUpdateTimer);
          // set gameMode based on server info
          if (data && data.mode) {
              if (data.mode === 'ffa') gameMode = 'ffa_online';
              else if (data.mode === '5v5') gameMode = '5v5_online';
              else if (data.mode === 'duel') gameMode = 'duel_online';
              else gameMode = data.mode;
          }
          // if duel mode disable health cubes and shrink world
          if (gameMode === 'duel_online') {
              disableHealthCubes = true;
          }
          let modal = document.getElementById('matchmakingModal');
          if (modal) {
             const botText = data.hasBots ? '🤖 Some bots needed filler!' : '⚔️ Real warriors assembled!';
            modal.innerHTML = `
              <h1 style="font-size:40px;margin-bottom:20px;text-shadow:0 0 10px #00ff00;color:#00ff00;">🎉 MATCH FOUND! 🎉</h1>
              <p style="font-size:18px;color:#ffff00;margin-bottom:20px;">${botText}</p>
              <p style="font-size:14px;color:#88ffff;margin-bottom:30px;"><span id="playerCountFound">${data.playerCount || 1}</span> Warriors entering the arena...</p>
              
              <div style="margin:30px 0;font-size:60px;font-weight:bold;text-shadow:0 0 15px #00bcd4;letter-spacing:5px;">
                <span id="countdown" style="color:#00bcd4;">10</span>
              </div>
              
              <p style="font-size:16px;color:#ff9900;margin-top:20px;animation:pulse 1s infinite;">⚡ GET READY TO DESTROY ⚡</p>
            `;
            modal.style.display = 'block';
          }

                    // If server indicates this match isn't full yet, wait for it to become ready
                    const required = data.maxPlayers || 50;
                    if (data.playerCount && data.playerCount < required) {
                        const infoSpan = document.getElementById('playerCountFound');
                        if (infoSpan) infoSpan.textContent = `${data.playerCount} / ${required}`;

                        // Update UI as queueStatus/matchProgress events arrive
                        const progressHandler = (update) => {
                            if (update && typeof update.playerCount !== 'undefined') {
                                const pc = update.playerCount;
                                if (infoSpan) infoSpan.textContent = `${pc} / ${required}`;
                                // If match is now full, proceed to start countdown
                                if (pc >= required) {
                                    onlineSocket.off('matchProgress', progressHandler);
                                    onlineSocket.off('queueStatus', progressHandler);
                                    // ask server to emit final matchFound/matchReady; fallback to immediate start countdown
                                    runStartCountdown(data, 10);
                                }
                            }
                        };

                        onlineSocket.on('matchProgress', progressHandler);
                        onlineSocket.on('queueStatus', progressHandler);

                        // Also listen for explicit server 'matchReady' event
                        onlineSocket.once('matchReady', (readyData) => {
                            onlineSocket.off('matchProgress', progressHandler);
                            onlineSocket.off('queueStatus', progressHandler);
                            runStartCountdown(readyData || data, 10);
                        });
                    } else {
                        // Already full — run normal countdown
                        runStartCountdown(data, 10);
                    }
        }

                function runStartCountdown(data, seconds) {
                    let modal = document.getElementById('matchmakingModal');
                    let count = seconds;
                    if (!modal) return;
                    // ensure gameMode remains the same once countdown finishes
                    if (data && data.mode) {
                        if (data.mode === 'ffa') gameMode = 'ffa_online';
                        else if (data.mode === '5v5') gameMode = '5v5_online';
                        else if (data.mode === 'duel') gameMode = 'duel_online';
                        else gameMode = data.mode;
                    }
                    const timer = setInterval(() => {
                        count--;
                        const cd = document.getElementById('countdown');
                        if (cd) {
                            cd.textContent = count <= 0 ? '🎮' : String(count);
                            if (count <= 3) cd.style.color = '#ff3333';
                        }
                        if (count <= 0) {
                            clearInterval(timer);
                            if (modal) modal.style.display = 'none';

                            const assignedIndex = (typeof data.assignedIndex !== 'undefined') ? data.assignedIndex : 0;
                            const spawnData = data.spawnPositions ? (data.spawnPositions[assignedIndex] || data.spawnPositions[0]) : { x: 500, y: 500 };
                            if (data.mapSeed) window.currentMapSeed = data.mapSeed;
                            initializeOnlineFFAGame(spawnData);
                            onlineSocket.on('gameStart', () => console.log('⚔️ Battle start!'));
                        }
                    }, 1000);
                }

        // Provide a safe fallback so calling `takeDamage` on non-Entity objects
        // doesn't throw `is not a function`. Entity instances still use their
        // own implementation (on Entity.prototype), so this only handles
        // objects that lack a `takeDamage` method (e.g., plain objects).
        try {
            if (typeof Object.prototype.takeDamage === 'undefined') {
                Object.prototype.takeDamage = function(amt, src, meta) {
                    try {
                        if (this == null) return;
                        // If this is an Entity (or subclass) call the real implementation
                        if (typeof Entity !== 'undefined' && this instanceof Entity) {
                            return Entity.prototype.takeDamage.call(this, amt, src, meta);
                        }
                        // If object merely has HP, apply raw subtraction
                        if (typeof this.hp === 'number') {
                            this.hp -= (amt || 0);
                            if (this.hp <= 0 && typeof this.die === 'function') this.die(src);
                        }
                        // otherwise silently ignore
                    } catch (e) { console.warn('fallback takeDamage failed', e); }
                };
            }
        } catch (e) { console.warn('failed to install takeDamage fallback', e); }

        // Position syncing for online FFA - broadcast player state
        let positionSyncInterval = null;
        let lastGameStateLog = 0; // Throttle logging
        
        // Proxy entity to represent remote online players so projectiles and collisions work
        class OnlinePlayerProxy extends Entity {
            constructor(socketId, name, x, y, maxHp) {
                super(x || 0, y || 0, 25, '#ff6b6b', maxHp || 5000);
                this.socketId = socketId;
                this.name = name || 'Player';
                this.isPlayer = false; // remote
                this.serverX = this.x;
                this.serverY = this.y;
                this.prevServerX = this.x;
                this.prevServerY = this.y;
                this.prevServerTs = Date.now();
                this.lastServerUpdate = Date.now();
                this.vx = 0;
                this.vy = 0;
                this.countsAsFFAHero = false;
                
                // Ability visual state storage
                this.abilityVisuals = {};
                this.heroType = null;
                this.angle = 0;
                
                // Multipliers for online sync
                this.speedMult = 1;
                this.dmgMult = 1;
                
                // Particle storage for remote visuals
                this.remoteParticles = [];
                
                // Skin system
                this.currentSkin = 'default';
                this.skinIcon = null;
            }

            takeDamage(amt, src) {
                if (this.dead) return;
                let d = amt * this.dmgMult;
                if (this.shield > 0) { if (this.shield >= d) { this.shield -= d; d = 0; } else { d -= this.shield; this.shield = 0; } }
                this.hp -= d;
                // Track total damage for the attacker (ensure online proxy damage counts same as offline)
                if (src && src instanceof Entity && src !== this) {
                    src.totalDamage = (src.totalDamage || 0) + Math.ceil(Math.max(d, 0));
                }
                // Also count damage taken on proxies/objects that use this implementation
                this.totalDamageTaken = (this.totalDamageTaken || 0) + Math.ceil(Math.max(d, 0));
                if (this.hp <= 0) { this.hp = 0; this.die(src); }

                // If this proxy was hit by the local player, inform the server so it can apply authoritative damage
                    try {
                        if (gameMode && gameMode.includes('online') && typeof onlineSocket !== 'undefined' && onlineSocket && src && src.isPlayer && src === player) {
                            onlineSocket.emit('playerDamaged', {
                                socketId: this.socketId,
                                damageTaken: d,
                                damageDealer: src.name || 'Local Player',
                                attackerSocketId: mySocketId || onlineSocket.id,
                                isProSniper: !!(src && src.isProSniper)
                            });
                        }
                } catch (e) {
                    console.warn('Failed to broadcast proxy damage to server', e);
                }
            }

            applyServerState(data) {
                if (!data) return;
                // store previous server pos for velocity estimation
                this.prevServerX = this.serverX;
                this.prevServerY = this.serverY;
                this.prevServerTs = this.lastServerUpdate || Date.now();

                this.serverX = (typeof data.x === 'number') ? data.x : this.serverX;
                this.serverY = (typeof data.y === 'number') ? data.y : this.serverY;
                this.hp = (typeof data.hp !== 'undefined') ? data.hp : this.hp;
                this.maxHp = (typeof data.maxHp !== 'undefined') ? data.maxHp : this.maxHp;
                this.shield = (typeof data.shield !== 'undefined') ? data.shield : this.shield;
                this.maxShield = (typeof data.maxShield !== 'undefined') ? data.maxShield : this.maxShield;
                this.speedMult = (typeof data.speedMult === 'number') ? data.speedMult : this.speedMult || 1;
                this.dmgMult = (typeof data.dmgMult === 'number') ? data.dmgMult : this.dmgMult || 1;
                this.name = data.name || this.name;
                // Apply hero type but DON'T override color - colors are team-based in online play
                if (data.heroType) {
                    this.heroType = data.heroType;
                    // update color so online proxies reflect chosen hero
                    this.color = getHeroColor(this.heroType) || this.color;
                    // adjust collision radius to match the real hero
                    this.radius = getHeroRadius(this.heroType) || this.radius;
                }
                // Apply skin
                if (data.currentSkin) this.currentSkin = data.currentSkin;
                // this.color = getHeroColor(this.heroType);  // ❌ DON'T override team color except when we want hero colors
                this.lastServerUpdate = Date.now();

                // Store incoming particles (or spawn special effects)
                if (data.particles && Array.isArray(data.particles)) {
                    // Create visual particle objects from broadcast data
                    for (let pData of data.particles) {
                        if (pData.type === 'swordTrail') {
                            try {
                                effectsAdd(new SwordTrail(
                                    pData.x || 0,
                                    pData.y || 0,
                                    pData.angle || 0,
                                    pData.length || 0,
                                    pData.duration || 0.5,
                                    pData.color || '#fff'
                                ));
                            } catch(_) {}
                            continue;
                        }
                        let p = {
                            x: pData.x || 0,
                            y: pData.y || 0,
                            color: pData.color || '#fff',
                            size: pData.size || 2,
                            lifetime: pData.lifetime || 0.5,
                            maxLifetime: pData.lifetime || 0.5,
                            vx: pData.vx || 0,
                            vy: pData.vy || 0
                        };
                        this.remoteParticles.push(p);
                    }
                      const maxRemoteParticles = 240;
                      if (this.remoteParticles.length > maxRemoteParticles) {
                        this.remoteParticles.splice(0, this.remoteParticles.length - maxRemoteParticles);
                      }
                }
                
                // --- ability visuals handling (was accidentally removed previously) ---
                if (data.abilityVisuals && typeof data.abilityVisuals === 'object') {
                    try {
                        // ensure we have a container for tracking last timestamps
                        if (!this._lastAbilityTs) this._lastAbilityTs = {};
                        // iterate through hero-specific keys
                        for (let heroKey in data.abilityVisuals) {
                            const av = data.abilityVisuals[heroKey];
                            if (!av || !av.timestamp) continue;
                            // dedupe based on timestamp
                            if (this._lastAbilityTs[heroKey] === av.timestamp) continue;
                            this._lastAbilityTs[heroKey] = av.timestamp;

                            // spawn effects depending on hero and ability
                            if (heroKey === 'cornelius') {
                                switch (av.ability) {
                                    case 'basicAtk':
                                        try {
                                            effectsAdd(new SwordTrail(av.x, av.y, av.angle, av.ascended ? 180 : 120, 0.9, av.ascended ? '#FFFF00' : '#FF4444'));
                                            effectsAdd(new WaveShockwave(av.x, av.y, (av.ascended ? 150 : 100) + 20, 0.9, av.ascended ? '#FFD700' : '#FF4444', av.ascended ? '#FFFF00' : '#CC0000'));
                                        } catch(_) {}
                                        break;
                                    case 'fireQ':
                                        try {
                                            effectsAdd(new RadialBeam(av.x, av.y, av.angle, av.ascended ? 180 : 150, Math.PI * (av.ascended ? 0.4 : 0.3), av.ascended ? 0.6 : 0.45, av.ascended ? '#FFFF00' : '#FF6666'));
                                            if (av.ascended) {
                                                effectsAdd(new WaveShockwave(av.x, av.y, av.ascended ? 250 : 180, 0.8, av.ascended ? '#FFD700' : '#FF4444', av.ascended ? '#FFFF00' : '#CC0000'));
                                            }
                                        } catch(_) {}
                                        break;
                                    case 'doE':
                                        try {
                                            effectsAdd(new WaveShockwave(av.x, av.y, av.ascended ? 200 : 150, av.ascended ? 0.6 : 0.5, av.ascended ? '#FFD700' : '#00FF00', av.ascended ? '#FFFF00' : '#00DD00'));
                                            if (av.ascended) effectsAdd(new AuraRing(av.x, av.y, 90, 1.0, '#FFD700', 8));
                                        } catch(_) {}
                                        break;
                                    case 'doF':
                                        try {
                                            if (av.ascended) {
                                                effectsAdd(new WaveShockwave(av.x, av.y, 200, 0.6, '#FF8800', '#FFFF00'));
                                                effectsAdd(new AuraRing(av.x, av.y, 120, 0.6, '#FF8800', 8));
                                            } else {
                                                effectsAdd(new WaveShockwave(av.x, av.y, 220, 0.9, '#FFB84D', '#FFD27A'));
                                                effectsAdd(new AuraRing(av.x, av.y, 130, 0.9, '#FF8C00', 6));
                                            }
                                        } catch(_) {}
                                        break;
                                    case 'doG':
                                        try {
                                            effectsAdd(new WaveShockwave(av.x, av.y, 350, 1.2, '#FFD700', '#FFFF00'));
                                        } catch(_) {}
                                        break;
                                }
                            } else if (heroKey === 'faik' && av.basic) {
                                try {
                                    effectsAdd(new SwordTrail(av.basic.x, av.basic.y, av.basic.angle, 250, 0.35, '#FF4444'));
                                } catch(_) {}
                            } else if (heroKey === 'vival' && av.basic) {
                                try {
                                    effectsAdd(new SwordTrail(av.basic.x, av.basic.y, av.basic.angle, 140, 0.4, '#551A8B'));
                                } catch(_) {}
                            } else if (heroKey === 'christian') {
                                try {
                                    switch(av.ability) {
                                        case 'basic':
                                            effectsAdd(new WaveShockwave(av.x, av.y, 50, 0.5, '#ffffff', '#cccccc'));
                                            break;
                                        case 'useQ':
                                            try {
                                                let col1='#00ffff', col2='#00ffff';
                                                switch(av.carType) {
                                                    case 0: col1='#ff0000'; col2='#ff5555'; break; // Jesko
                                                    case 1: col1='#ffffff'; col2='#aaaaaa'; break; // Regera
                                                    case 2: col1='#00ff00'; col2='#55ff55'; break; // Gemera
                                                    case 3: col1='#0000ff'; col2='#5555ff'; break; // Agera
                                                }
                                                effectsAdd(new WaveShockwave(av.x, av.y, 80, 0.5, col1, col2));
                                            } catch(_) {}
                                            break;
                                        case 'useE':
                                            effectsAdd(new WaveShockwave(av.x, av.y, 120, 0.6, '#00ff00', '#00ffff'));
                                            break;
                                        case 'useF':
                                            effectsAdd(new WaveShockwave(av.x, av.y, 150, 0.7, '#ff00ff', '#ff00ff'));
                                            break;
                                        case 'useG':
                                            effectsAdd(new WaveShockwave(av.x, av.y, 200, 1, '#00ffff', '#00ff00'));
                                            break;
                                    }
                                } catch(_) {}
                            }
                        }
                    } catch(err) { console.warn('abilityVisuals spawn error', err); }
                }
                // ---------------------------------------------------------

                // compute velocity estimate
                let dt = (this.lastServerUpdate - this.prevServerTs) / 1000;
                if (dt > 0) {
                    this.vx = (this.serverX - this.prevServerX) / dt;
                    this.vy = (this.serverY - this.prevServerY) / dt;
                }
            }

            update(dt) {
                // Update misc timers
                if(this.stunTimer>0) this.stunTimer = Math.max(0, this.stunTimer - dt);
                if(this.freezeTimer>0) this.freezeTimer = Math.max(0, this.freezeTimer - dt);
                
                // If frozen or stunned, don't move or update position
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    return;
                }
                
                // Predict target based on estimated velocity and half-round-trip
                const now = Date.now();
                const age = Math.max(0, (now - this.lastServerUpdate) / 1000);
                const predictX = this.serverX + this.vx * age;
                const predictY = this.serverY + this.vy * age;

                // If discrepancy is huge, snap to predicted to avoid long trailing
                const dxTotal = predictX - this.x;
                const dyTotal = predictY - this.y;
                const dist = Math.sqrt(dxTotal*dxTotal + dyTotal*dyTotal);
                if (dist > 300) {
                    this.x = predictX;
                    this.y = predictY;
                } else {
                    // Smoothly move towards predicted target with stronger lerp
                    const lerpFactor = Math.min(1, 6 * dt);
                    this.x += dxTotal * lerpFactor;
                    this.y += dyTotal * lerpFactor;
                }

                // Update angle to face movement direction
                let dx = this.vx, dy = this.vy;
                if (Math.abs(dx) + Math.abs(dy) > 0.001) this.angle = Math.atan2(dy, dx);

                // Update remote particles
                for (let p of this.remoteParticles) {
                    p.lifetime -= dt;
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                }
                // Remove dead particles
                this.remoteParticles = this.remoteParticles.filter(p => p.lifetime > 0);

                // Tick down any abilityVisual timers for Faik (and others if added later)
                if (this.abilityVisuals) {
                    const fv = this.abilityVisuals.faik;
                    if (fv) {
                        if (fv.dash && typeof fv.dash.timer === 'number') fv.dash.timer = Math.max(0, fv.dash.timer - dt);
                        if (fv.e && typeof fv.e.timer === 'number') fv.e.timer = Math.max(0, fv.e.timer - dt);
                        if (fv.f && typeof fv.f.timer === 'number') fv.f.timer = Math.max(0, fv.f.timer - dt);
                    }
                }

                // Death handling
                if(this.hp <= 0 && !this.dead) this.die(null);
            }
            
            draw(ctx) {
                // Draw base entity
                super.draw(ctx);
                
                // Render remote particles (do this regardless of ability visuals)
                if (this.remoteParticles && Array.isArray(this.remoteParticles)) {
                    for (let p of this.remoteParticles) {
                        // Fade out particles as they approach end of life
                        let alpha = p.lifetime / p.maxLifetime;
                        ctx.fillStyle = p.color;
                        ctx.globalAlpha = alpha;
                        ctx.beginPath();
                        ctx.arc(p.x - camera.x, p.y - camera.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.globalAlpha = 1;
                    }
                }
                
                // Render skin icon if non-default (e.g., Tate's Real Top G skin)
                if (this.currentSkin && this.currentSkin !== 'default') {
                    let icon = getSkinIcon(this.heroType, this.currentSkin);
                    if (icon) {
                        if (!this.skinIcon) {
                            let img = new Image();
                            img.src = icon;
                            this.skinIcon = img;
                        }
                        if (this.skinIcon && this.skinIcon.complete) {
                            ctx.save();
                            ctx.globalAlpha = 0.8;
                            ctx.drawImage(this.skinIcon, this.x - camera.x - 20, this.y - camera.y - 30, 40, 40);
                            ctx.restore();
                        }
                    }
                }
                
                if (!this.abilityVisuals) return;
                
                // Austin ability visuals
                if (this.abilityVisuals.austin) {
                    const austin = this.abilityVisuals.austin;
                    
                    // Draw roads
                    if (austin.roads && Array.isArray(austin.roads)) {
                        for (let road of austin.roads) {
                            ctx.save();
                            ctx.globalAlpha = 0.7;
                            
                            // Road main fill
                            ctx.fillStyle = '#FF6B35';
                            ctx.translate(road.x - camera.x, road.y - camera.y);
                            ctx.rotate(road.angle);
                            ctx.fillRect(0, -50, road.length, 100);
                            
                            // Road border
                            ctx.strokeStyle = '#FF8C00';
                            ctx.lineWidth = 3;
                            ctx.strokeRect(0, -50, road.length, 100);
                            
                            ctx.restore();
                        }
                    }
                    
                    // Draw linked targets
                    if (austin.linkedTargets && Array.isArray(austin.linkedTargets)) {
                        for (let target of austin.linkedTargets) {
                            ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(this.x - camera.x, this.y - camera.y);
                            ctx.lineTo(target.x - camera.x, target.y - camera.y);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    }
                    
                    // Draw marked enemies indicator
                    if (austin.markedEnemies && Array.isArray(austin.markedEnemies)) {
                        for (let enemy of austin.markedEnemies) {
                            let screenX = enemy.x - camera.x;
                            let screenY = enemy.y - camera.y - 40;
                            ctx.font = '20px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('👻', screenX, screenY);
                        }
                    }
                    
                    // Draw jumping state
                    if (austin.isJumping) {
                        // Outer ring
                        ctx.strokeStyle = '#FF6B35';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 150, 0, Math.PI*2);
                        ctx.stroke();
                        
                        // Inner ring
                        ctx.strokeStyle = '#FF8C00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 100, 0, Math.PI*2);
                        ctx.stroke();
                        
                        // Impact radius (semi-transparent)
                        ctx.fillStyle = 'rgba(255, 107, 53, 0.2)';
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 600, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
                
                // Kenshi ability visuals (moon shapes)
                if (this.abilityVisuals.kenshi && this.abilityVisuals.kenshi.moonShapes) {
                    for (let moon of this.abilityVisuals.kenshi.moonShapes) {
                        ctx.fillStyle = '#FFF8DC';
                        ctx.beginPath();
                        ctx.arc(moon.x - camera.x, moon.y - camera.y, moon.radius, 0, Math.PI*2);
                        ctx.fill();
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                // Faik ability visuals (dash, sword energy and rage aura)
                if (this.abilityVisuals.faik) {
                    const f = this.abilityVisuals.faik;
                    // dash indicator: small ring that quickly fades
                    if (f.dash && f.dash.timer > 0) {
                        ctx.save();
                        ctx.strokeStyle = '#FF6666';
                        ctx.lineWidth = 3;
                        ctx.globalAlpha = f.dash.timer / 0.25;
                        ctx.beginPath();
                        ctx.arc(f.x - camera.x, f.y - camera.y, 40 + (0.25 - f.dash.timer) * 200, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                    // sword energy burst
                    if (f.e && f.e.timer > 0) {
                        ctx.save();
                        ctx.globalAlpha = f.e.timer / 0.6;
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(f.e.x - camera.x, f.e.y - camera.y, 220 * (1 - f.e.timer / 0.6), 0, Math.PI*2);
                        ctx.stroke();
                        ctx.restore();
                    }
                    // blood rage aura (shockwave)
                    if (f.f && f.f.timer > 0) {
                        ctx.save();
                        ctx.globalAlpha = f.f.timer / 8;
                        ctx.strokeStyle = '#FF0000';
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(f.f.x - camera.x, f.f.y - camera.y, 250 * (1 - f.f.timer / 8), 0, Math.PI*2);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
                
                // Builderman base visuals
                if (this.abilityVisuals.builderman && this.abilityVisuals.builderman.hasBase) {
                    const base = this.abilityVisuals.builderman;
                    ctx.save();
                    
                    // Base structure
                    ctx.fillStyle = '#8B7355';
                    ctx.fillRect(base.baseX - camera.x - 40, base.baseY - camera.y - 40, 80, 80);
                    ctx.strokeStyle = '#654321';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(base.baseX - camera.x - 40, base.baseY - camera.y - 40, 80, 80);
                    
                    // Health bar
                    let hpPercent = (base.baseHp / base.baseMaxHp) * 80;
                    ctx.fillStyle = hpPercent > 50 ? '#00ff00' : hpPercent > 25 ? '#ffff00' : '#ff0000';
                    ctx.fillRect(base.baseX - camera.x - 40, base.baseY - camera.y + 50, hpPercent, 8);
                    
                    ctx.restore();
                }
                
                // Chimera mode indicator
                if (this.abilityVisuals.chimera) {
                    const chimera = this.abilityVisuals.chimera;
                    ctx.save();

                    // Mode indicator
                    let modeColor = '#ffff00';
                    if (chimera.chimeraMode === 'damage') modeColor = '#ff0000';
                    else if (chimera.chimeraMode === 'tank') modeColor = '#0000ff';

                    ctx.fillStyle = modeColor;
                    ctx.font = '14px Arial';

                    ctx.textAlign = 'center';
                    ctx.fillText(chimera.chimeraMode, this.x - camera.x, this.y - camera.y - 35);

                    ctx.restore();
                }

                // Fletcher radar ping visual (sweeping pulses + blips)
                if (this.abilityVisuals.fletcher && this.abilityVisuals.fletcher.radarPing) {
                    const rp = this.abilityVisuals.fletcher.radarPing;
                    // animate timer & sweep (loop runs in main loop so dt is available)
                    rp.timer = Math.max(0, (rp.timer || 1) - (typeof dt !== 'undefined' ? dt : 0));
                    rp.sweep = (rp.sweep || 0) + (typeof dt !== 'undefined' ? dt * 2.5 : 0);
                    const alpha = Math.max(0, Math.min(1, rp.timer || 0));
                    const centerX = rp.x - camera.x, centerY = rp.y - camera.y;

                    // concentric expanding rings (3 pulses)
                    for (let i = 0; i < (rp.pulses || 3); i++) {
                        let offset = i * 0.18;
                        let prog = (1 - rp.timer) - offset;
                        if (prog <= 0 || prog > 1) continue;
                        let rr = prog * rp.radius;
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(0,255,204,${0.6 * (1 - prog) * alpha})`;
                        ctx.lineWidth = 2 + (1 - prog) * 2;
                        ctx.arc(centerX, centerY, rr, 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    // sweeping sonar wedge
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.arc(centerX, centerY, rp.radius * Math.max(0.2, 1 - rp.timer), rp.sweep - 0.06, rp.sweep + 0.06);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(0,255,204,${0.08 * alpha})`;
                    ctx.fill();
                    ctx.restore();

                    // subtle full-ring (faded)
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0,255,204,${0.12 * alpha})`;
                    ctx.lineWidth = 1;
                    ctx.arc(centerX, centerY, rp.radius * Math.max(0.2, 1 - rp.timer), 0, Math.PI * 2);
                    ctx.stroke();

                    // blips for revealed enemies inside radius
                    for (let e of entities) {
                        if (!(e instanceof Entity) || e.dead) continue;
                        let d = Math.sqrt((e.x - rp.x)*(e.x - rp.x) + (e.y - rp.y)*(e.y - rp.y));
                        if (d <= rp.radius) {
                            let bx = e.x - camera.x, by = e.y - camera.y;
                            ctx.beginPath();
                            ctx.fillStyle = `rgba(0,255,204,${0.9 * alpha})`;
                            ctx.arc(bx, by, 4, 0, Math.PI*2);
                            ctx.fill();
                            ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
                            ctx.font = '10px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('•', bx, by + 2);
                        }
                    }

                    // remove ping when finished
                    if (rp.timer <= 0) delete this.abilityVisuals.fletcher.radarPing;
                }
                
                // Ambrose visual enhancements
                if (this.abilityVisuals.ambrose && this.abilityVisuals.ambrose.enhancedBasicActive) {
                    ctx.strokeStyle = '#4a0e4e';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 60, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                
                // Vival ability visuals
                if (this.abilityVisuals.vival) {
                    const vival = this.abilityVisuals.vival;
                    
                    // Draw ritual location
                    if (vival.ritualActive) {
                        ctx.save();
                        ctx.globalAlpha = 0.6;
                        ctx.fillStyle = '#FFD700';
                        ctx.beginPath();
                        ctx.arc(vival.ritualX - camera.x, vival.ritualY - camera.y, 40, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.strokeStyle = '#FFA500';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(vival.ritualX - camera.x, vival.ritualY - camera.y, 50, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                    
                    // Draw cycle burst indicator
                    if (vival.cycleActive) {
                        ctx.strokeStyle = '#FF00FF';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 100, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    // Show revive ready indicator
                    if (vival.reviveReady) {
                        ctx.save();
                        ctx.fillStyle = '#FFD700';
                        ctx.font = 'bold 16px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('✨ Ready!', this.x - camera.x, this.y - camera.y - 50);
                        ctx.restore();
                    }
                    
                    // Show linked target count
                    if (vival.linkedTargetCount > 0) {
                        ctx.save();
                        ctx.fillStyle = '#FF1493';
                        ctx.font = '14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText(`❤️ x${vival.linkedTargetCount}`, this.x - camera.x, this.y - camera.y - 35);
                        ctx.restore();
                    }
                }
            }
        }
        
        function startPlayerPositionSync() {
          // Broadcast player position every 100ms
          if (positionSyncInterval) clearInterval(positionSyncInterval);
          
          // Store player's socket ID for damage reporting
          if(!player.socketId) player.socketId = onlineSocket.id;
          
                    positionSyncInterval = setInterval(() => {
                        if (!player || !gameRunning || !(gameMode && gameMode.includes('online'))) return;
            
            // Update HUD for online FFA game
            updateHUD(player);
            updateMinimap(); // Update minimap as well
            
            // Collect all entities to broadcast
            let entitiesToBroadcast = [];
            for(let e of entities) {
              // Broadcast projectiles from player (but not remote projectiles)
              if(e instanceof Projectile && e.owner === player && !e.isRemote) {
                entitiesToBroadcast.push({
                  type: 'projectile',
                  remoteId: `${onlineSocket.id}-${e.x}-${e.y}`,
                  x: e.x, y: e.y,
                  angle: e.angle,
                  speed: e.speed,
                  damage: e.dmg,
                  range: e.range,
                  color: e.color,
                  size: e.size,
                  pierce: e.pierce,
                  explode: e.explo,
                  distTraveled: e.dist
                });
              }
              // Broadcast Sentries from player
              if(e instanceof Sentry && e.owner === player) {
                // Calculate target angle if targeting
                let targetAngle = 0;
                let target = e.findTarget();
                if(target) {
                  targetAngle = Math.atan2(target.y - e.y, target.x - e.x);
                }
                entitiesToBroadcast.push({
                  type: 'sentry',
                  x: e.x, y: e.y,
                  hp: e.hp,
                  maxHp: e.maxHp,
                  team: e.team,
                  targetAngle: targetAngle,
                  built: e.built
                });
              }
              // Broadcast Tripmines from player
              if(e instanceof Tripmine && e.owner === player) {
                entitiesToBroadcast.push({
                  type: 'tripmine',
                  x: e.x, y: e.y,
                  team: e.team,
                  detectionRange: 100,
                  active: e.active
                });
              }
                            // Broadcast summoned minions (PixelBot, Goon, Minion) owned by player
                            try {
                                if ((typeof PixelBot !== 'undefined' && e instanceof PixelBot && e.owner === player) ||
                                        (typeof Goon !== 'undefined' && e instanceof Goon && e.monza === player) ||
                                        (typeof Minion !== 'undefined' && e instanceof Minion && e.owner === player) ||
                                        (typeof CC850Minion !== 'undefined' && e instanceof CC850Minion && e.owner === player)) {
                                    entitiesToBroadcast.push({
                                        type: 'minion',
                                        subType: e.constructor && e.constructor.name ? e.constructor.name : 'minion',
                                        x: e.x,
                                        y: e.y,
                                        angle: e.angle || 0,
                                        hp: e.hp || 0,
                                        maxHp: e.maxHp || 0
                                    });
                                }
                            } catch (_) {}
            }
            
            // Collect only a bounded recent window of transient effects for broadcasting.
            let slashesToBroadcast = [];
            let particlesToBroadcast = [];
            const broadcastParticles = particles.slice(-120);
            for(let p of broadcastParticles) {
              if(p instanceof Slash) {
                slashesToBroadcast.push({
                  type: 'slash',
                  x: p.x, y: p.y,
                  angle: p.angle,
                  range: p.range,
                  width: p.width,
                  color: p.color || '#fff'
                });
              } else if (p && p.constructor && p.constructor.name === 'SwordTrail') {
                // special-case trail effect: we want remote clients to draw the same fancy trail
                particlesToBroadcast.push({
                  type: 'swordTrail',
                  x: p.x, y: p.y,
                  angle: p.angle,
                  length: p.len || p.length || 0,
                  duration: p.life || p.maxLife || 0.5,
                  color: p.color || '#fff'
                });
              } else if(p instanceof Particle) {
                // Broadcast regular particles (explosions, impacts, trails, etc.)
                particlesToBroadcast.push({
                  type: 'particle',
                  x: p.x, y: p.y,
                  color: p.color || '#fff',
                  size: p.size || p.radius || 2,
                  lifetime: p.lifetime || 0.5,
                  vx: p.vx || 0,
                  vy: p.vy || 0
                });
              }
            }
            
            // Collect hero-specific ability visual states
            // start with whatever the local entity has stored (copy to avoid mutation)
            let abilityVisuals = player.abilityVisuals ? JSON.parse(JSON.stringify(player.abilityVisuals)) : {};
            
            // Austin ability visuals (still need to compute some transient state)
            if(player instanceof Austin) {
              abilityVisuals.austin = abilityVisuals.austin || {};
              Object.assign(abilityVisuals.austin, {
                isJumping: player.isJumping || false,
                jumpTimer: player.jumpTimer || 0,
                roads: (player.roads || []).map(r => ({
                  x: r.x, y: r.y, angle: r.angle, length: r.length,
                  expanding: r.expanding, width: r.width
                })),
                markedEnemies: Array.from(player.markedEnemies.keys() || []).map(e => ({
                  x: e.x, y: e.y, id: e.id || Math.random()
                })),
                linkedTargets: (player.linkedTargets || []).map(e => ({
                  x: e.x, y: e.y, id: e.id || Math.random()
                }))
              });
            }
            
            // Builderman ability visuals
            if(player instanceof Builderman) {
              abilityVisuals.builderman = abilityVisuals.builderman || {};
              Object.assign(abilityVisuals.builderman, {
                hasBase: player.hasBase || false,
                baseX: player.baseX || 0,
                baseY: player.baseY || 0,
                baseHp: player.baseHp || 0,
                baseMaxHp: player.baseMaxHp || 0
              });
            }
            
            // Kaiser ability visuals
            if(player instanceof Kaiser) {
              abilityVisuals.kaiser = abilityVisuals.kaiser || {};
              Object.assign(abilityVisuals.kaiser, {
                chainLength: player.chainLength || 0,
                isChaining: player.isChaining || false
              });
            }
            
            // Chimera ability visuals
            if(player instanceof Chimera) {
              abilityVisuals.chimera = abilityVisuals.chimera || {};
              Object.assign(abilityVisuals.chimera, {
                chimeraMode: player.chimeraMode || 'balance',
                chimeraEnergy: player.chimeraEnergy || 0,
                maxChimeraEnergy: player.maxChimeraEnergy || 100
              });
            }
            
            // Ambrose ability visuals
            if(player instanceof Ambrose) {
              abilityVisuals.ambrose = abilityVisuals.ambrose || {};
              Object.assign(abilityVisuals.ambrose, {
                enhancedBasicActive: player.enhancedBasicActive || false,
                ravenPullTarget: player.ravenPullTarget ? { x: player.ravenPullTarget.x, y: player.ravenPullTarget.y } : null,
                isBeingPulled: player.isBeingPulled || false
              });
            }
            
            // Kenshi ability visuals
            if(player instanceof Kenshi) {
              abilityVisuals.kenshi = abilityVisuals.kenshi || {};
              Object.assign(abilityVisuals.kenshi, {
                moonShapes: (player.moonShapes || []).map(m => ({
                  x: m.x, y: m.y, angle: m.angle, radius: m.radius || 8
                }))
              });
            }
            
            // Vival ability visuals
            if(player instanceof Vival) {
              abilityVisuals.vival = abilityVisuals.vival || {};
              Object.assign(abilityVisuals.vival, {
                cycleActive: player.cycleActive || false,
                ritualActive: player.ritualActive || false,
                ritualX: player.ritualX || player.x,
                ritualY: player.ritualY || player.y,
                lifeDeathHitCount: player.lifeDeathHitCount || 0,
                reviveReady: player.reviveReady || false,
                linkedTargetCount: Object.keys(player.linkedTargets || {}).length || 0
              });
            }
            
            // Log entity broadcasting once every 2 seconds
            if(!window.lastEntityBroadcastLog || Date.now() - window.lastEntityBroadcastLog > 2000) {
                if(entitiesToBroadcast.length > 0 || slashesToBroadcast.length > 0 || particlesToBroadcast.length > 0 || Object.keys(abilityVisuals).length > 0) {
                    console.log(`📤 Broadcasting ${entitiesToBroadcast.length} entities + ${slashesToBroadcast.length} slashes + ${particlesToBroadcast.length} particles + ${Object.keys(abilityVisuals).length} ability visuals`, abilityVisuals);
                }
                window.lastEntityBroadcastLog = Date.now();
            }
            
            onlineSocket.emit('playerUpdate', {
              socketId: onlineSocket.id,
              x: player.x,
              y: player.y,
              heroType: selectedHeroType,
              hp: player.hp,
              maxHp: player.maxHp,
                            shield: player.shield || 0,
                            maxShield: player.maxShield || 0,
              speedMult: player.speedMult || 1,
              dmgMult: player.dmgMult || 1,
              name: 'Player',
              entities: entitiesToBroadcast.slice(-160),
              slashes: slashesToBroadcast.slice(-24),
              particles: particlesToBroadcast.slice(-120),
              abilityVisuals: abilityVisuals,
              angle: player.angle || 0,
              currentSkin: player.currentSkin || 'default'
            });
          }, 50);
        }
        
        function stopPlayerPositionSync() {
          if (positionSyncInterval) {
            clearInterval(positionSyncInterval);
            positionSyncInterval = null;
          }
        }

        function setupOnlineListeners() {
          onlineSocket.on('gameStateUpdate', function(data) {
            // list of ids we received to help prune proxies
            let serverIds = [];
            if (!window.onlinePlayers) window.onlinePlayers = {};
            let myId = mySocketId || onlineSocket.id;
            if (!myId) return;
            
            window.onlinePlayers = {};
            window.onlineEntities = window.onlineEntities || {};
            
            for (let pd of data.players) {
              let isOwn = (pd.socketId === myId) || (player && pd.x === player.x && pd.y === player.y);
              if (isOwn) {
                // if we're in a 5v5 match, keep our team in sync with parity logic used for proxies
                if (gameMode === '5v5_online') {
                  const myIndex = data.players.findIndex(p => p.socketId === pd.socketId);
                  if (myIndex !== -1) {
                    player.team = (myIndex % 2 === 0) ? 1 : 2;
                  }
                }
              } else {
                window.onlinePlayers[pd.socketId] = pd;
                
                let allEnt = [];
                if (pd.entities) {
                  if (Array.isArray(pd.entities)) allEnt = allEnt.concat(pd.entities);
                  else console.warn(`⚠️⚠️ CRITICAL: entities not array:`, typeof pd.entities);
                }
                if (pd.slashes) {
                  if (Array.isArray(pd.slashes)) allEnt = allEnt.concat(pd.slashes);
                  else console.warn(`⚠️⚠️ CRITICAL: slashes not array:`, typeof pd.slashes);
                }
                // Ensure we always set an array, never a function
                window.onlineEntities[pd.socketId] = allEnt || [];
              }
            }
            
            // Track alive count
            const aliveCount = data.players.filter(p => p.hp > 0).length;
            for (let pd of data.players) {
              if (pd.socketId === myId) continue;
              serverIds.push(pd.socketId);
              let prox = entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === pd.socketId);
              if (!prox) {
                prox = new OnlinePlayerProxy(pd.socketId, pd.name || 'Player', pd.x || 0, pd.y || 0, pd.maxHp);
                // Assign team index for collision logic; color decided later
                const playerIndex = data.players.findIndex(p => p.socketId === pd.socketId);
                prox.team = (playerIndex % 2 === 0) ? 1 : 2;
                entities.push(prox);
              }
              // Set heroType FIRST before applying color
              if (pd.heroType) {
                prox.heroType = pd.heroType;
              }
              prox.applyServerState(pd);
              // Now apply color based on heroType that was just set
              if (gameMode === '5v5_online') {
                  prox.color = prox.team === 1 ? '#3498db' : '#e74c3c';
              } else {
                  // Use hero color for all other online modes
                  if (prox.heroType) {
                      prox.color = getHeroColor(prox.heroType);
                  } else {
                      prox.color = '#ff6b6b'; // fallback default
                  }
              }
              
              // Apply ability visual data if present
              if (pd.abilityVisuals) {
                prox.abilityVisuals = pd.abilityVisuals;

                // spawn immediate effects for any new ability events we haven't seen yet
                // track last timestamps to avoid duplicates
                if (!prox._lastAbilityTs) prox._lastAbilityTs = {};
                for (let hero in pd.abilityVisuals) {
                  const hv = pd.abilityVisuals[hero];
                  if (!hv) continue;
                  // Cornelius event handling
                  if (hero === 'cornelius' && hv.ability) {
                    const key = 'cornelius:' + hv.ability;
                    if (hv.timestamp && (!prox._lastAbilityTs[key] || hv.timestamp > prox._lastAbilityTs[key])) {
                      prox._lastAbilityTs[key] = hv.timestamp;
                      try {
                        switch(hv.ability) {
                          case 'basicAtk':
                            effectsAdd(new SwordTrail(hv.x, hv.y, hv.angle,
                              hv.ascended ? 180 : 120,
                              0.9,
                              hv.ascended ? '#FFD700' : '#FF4444'));
                            effectsAdd(new WaveShockwave(hv.x, hv.y,
                              hv.ascended ? 170 : 120,
                              0.9,
                              hv.ascended ? '#FFD700' : '#FF4444',
                              hv.ascended ? '#FFFF00' : '#CC0000'));
                            break;
                          case 'fireQ':
                            // simple radial beam to indicate lunge
                            effectsAdd(new RadialBeam(hv.x, hv.y, hv.angle, 200, Math.PI*0.3, 0.6, '#FFAAAA'));
                            break;
                          case 'doE':
                            effectsAdd(new AuraRing(hv.x, hv.y, 90, 0.8, '#00FF00', 6));
                            break;
                          case 'doF':
                            effectsAdd(new WaveShockwave(hv.x, hv.y, 120, 0.8, '#00FF00', '#00FFAA'));
                            break;
                          case 'doG':
                            effectsAdd(new SpinningRing(hv.x, hv.y, 80, '#FFFFFF', 0.5, 8, 4));
                            break;
                        }
                      } catch(e) { console.warn('remote cornelius visual spawn failed for', hv.ability, e); }
                    }
                  }
                  // Faik basic attack visuals
                  if (hero === 'faik' && hv.basic && hv.timestamp) {
                    const key = 'faik:basic';
                    if (!prox._lastAbilityTs[key] || hv.timestamp > prox._lastAbilityTs[key]) {
                      prox._lastAbilityTs[key] = hv.timestamp;
                      try {
                        if (hv.enhanced) {
                          effectsAdd(new SwordTrail(hv.x, hv.y, hv.angle, 250, 0.35, '#FF4444'));
                        } else {
                          effectsAdd(new WaveShockwave(hv.x, hv.y, 120, 0.6, '#c0c0c0', '#ffffff'));
                        }
                      } catch(e) { console.warn('remote faik basic visual spawn failed', e); }
                    }
                  }
                  // Vival basic attack visuals
                  if (hero === 'vival' && hv.basic && hv.timestamp) {
                    const key = 'vival:basic';
                    if (!prox._lastAbilityTs[key] || hv.timestamp > prox._lastAbilityTs[key]) {
                      prox._lastAbilityTs[key] = hv.timestamp;
                      try {
                        effectsAdd(new SwordTrail(hv.x, hv.y, hv.angle,
                          hv.cycle ? 250 : 140,
                          0.4,
                          '#551A8B'));
                      } catch(e) { console.warn('remote vival basic visual spawn failed', e); }
                    }
                  }
                }
              }
            }
            
            for (let i = entities.length - 1; i >= 0; i--) {
              let e = entities[i];
              if (e instanceof OnlinePlayerProxy && !serverIds.includes(e.socketId)) entities.splice(i, 1);
            }
            
            let ac = document.getElementById('aliveCounter');
            // store latest authoritative alive count so HUD can use it during the main loop
            window.latestServerAliveCount = data.aliveCount;
            if (ac) ac.innerText = `Alive: ${data.aliveCount}`;
          });
          
          // Apply authoritative health updates from server
          onlineSocket.on('playerHealthUpdated', function(data) {
            try {
              console.log('🔔 playerHealthUpdated received', data);
              console.log(`   Current player state: hp=${player?.hp}, maxHp=${player?.maxHp}, dead=${player?.dead}, gameMode=${gameMode}`);
              // Update remote proxy if present
              let proxy = entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === data.socketId);
              if (proxy) {
                proxy.hp = data.hp;
                if (typeof data.shield === 'number') proxy.shield = data.shield;
              }
              // If this health update is for me, reconcile instead of overwriting
              const myId = mySocketId || onlineSocket.id;
              if (data.socketId === myId) {
                if (player && !player.dead) {
                  const currentHp = Number.isFinite(player.hp) ? player.hp : 0;
                  const serverHp = (typeof data.hp === 'number' && Number.isFinite(data.hp)) ? data.hp : currentHp;
                  const serverMaxHp = (typeof data.maxHp === 'number' && Number.isFinite(data.maxHp)) ? data.maxHp : (player.maxHp || currentHp);
                  
                  // Update maxHp from server if different
                  if (serverMaxHp !== player.maxHp) {
                    console.log(`Updating player maxHp: ${player.maxHp} -> ${serverMaxHp}`);
                    player.maxHp = serverMaxHp;
                  }
                  
                  // Clamp serverHp
                  const clampedServerHp = Math.max(0, Math.min(serverHp, player.maxHp || serverHp));
                  const delta = currentHp - clampedServerHp;
                  console.log('   Reconcile: currentHp=', currentHp, 'serverHp=', serverHp, 'clamped=', clampedServerHp, 'delta=', delta);

                  if (delta > 0 && Number.isFinite(delta) && delta > 0) {
                    // Apply authoritative HP from server directly to avoid double-applying local damage
                    // But keep lightweight visual feedback (particles/shake) so player feels the hit.
                    
                    // Apply server value directly (authoritative) to avoid re-applying damage side-effects
                    player.hp = clampedServerHp;
                    if (typeof data.shield === 'number') player.shield = data.shield;

                    // Minimal hit feedback without running full local damage side-effects (only once per update)
                    if (shakeIntensity < 3) {  // Only apply shake if not already shaking heavily
                      try {
                        screenShake(6);
                      } catch(_){}
                    }
                    for (let i = 0; i < 8; i++) particles.push(new Particle(player.x, player.y, '#ff4444', 3, 0.6));
                    player.injuredTimer = Math.max(player.injuredTimer || 0, 0.6);
                    player.revealTimer = Math.max(player.revealTimer || 0, 0.8);
                  } else if (delta < 0) {
                    // Server says we have more HP (healed) — update directly but clamp
                    player.hp = clampedServerHp;
                  } else if (delta === 0) {
                    // HP already in sync, just ensure it's set
                    player.hp = clampedServerHp;
                  }
                  
                  // CHECK FOR DEATH - ALWAYS, regardless of delta
                  // This ensures defeat screen triggers even if delta wasn't > 0
                  console.log(`🔍 Death check: clampedServerHp=${clampedServerHp}, player.dead=${player?.dead}, gameMode=${gameMode}`);
                  if (clampedServerHp <= 0) {
                    console.log(`⚠️ PLAYER HP IS 0! clampedServerHp=${clampedServerHp}`);
                    if (!player.dead) {
                      console.log(`💀 Calling player.die() - player is not already dead`);
                      const safeAttacker = {
                        name: (data.attacker || 'Remote'),
                        isPlayer: false,
                        trueDmgBuff: 0,
                        destroyersEnergy: 0
                      };
                      try { 
                        console.log(`🎯 About to call die() with gameMode=${gameMode}, this.isPlayer=${player?.isPlayer}`);
                        player.die(safeAttacker); 
                        console.log(`✅ die() completed successfully`);
                      } catch (e) { 
                        console.error('❌ Error calling die():', e); 
                        player.dead = true; 
                      }
                    } else {
                      console.log(`⚠️ Player already dead, skipping die() call`);
                    }
                  }
                }
              }

              // Display floating damage number if server reported an applied damage amount
              try {
                if (typeof data.damageApplied === 'number' && data.damageApplied > 0) {
                  // Find proxy or local player position
                  let px = null, py = null;
                  let proxy2 = entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === data.socketId);
                  if (proxy2) { px = proxy2.x; py = proxy2.y; }
                  else if (player && data.socketId === myId) { px = player.x; py = player.y; }
                  if (px !== null && py !== null) {
                    damageTexts.push({ x: px, y: py - 30, text: `-${data.damageApplied}`, color: '#ff4444', life: 0.9 });
                  }
                }
              } catch(_) {}
            } catch (err) {
              console.warn('playerHealthUpdated handling error', err);
            }
          });

          // Listen for when another player achieves victory
          onlineSocket.on('playerVictory', function(data) {
            try {
              const winnerId = data.winnerId;
              const winnerName = data.winnerName || 'Player';
              const myId = mySocketId || onlineSocket.id;

              // If this victory is for another player, show defeat screen for everyone else
              if (winnerId !== myId && gameRunning) {
                console.log(`🏆 ${winnerName} achieved VICTORY!`);
                endGame(false);  // Show defeat screen for this player
              }
            } catch (err) {
              console.warn('playerVictory handling error', err);
            }
          });

          // Listen for remote ability sounds (Tate skins with custom audio)
          onlineSocket.on('abilitySound', function(data) {
            try {
              if (!player || !data) return;
              
              // Calculate distance from local player to sound origin
              const dist = Math.sqrt(Math.pow(player.x - data.x, 2) + Math.pow(player.y - data.y, 2));
              
              // Play sound if within 500 units (proximity-based)
              if (dist < 500) {
                let sounds = getSkinSounds(data.heroType, data.skin);
                if (sounds && sounds[data.ability]) {
                  try {
                    let audio = new Audio(sounds[data.ability]);
                    audio.volume = 0.3; // Slightly quieter than local sounds
                    audio.play().catch(e => console.log('Remote sound failed:', e));
                  } catch(e) {
                    console.log('Error playing remote sound:', e);
                  }
                }
              }
            } catch (err) {
              console.warn('abilitySound handling error', err);
            }
          });
        }

        // --- Online 5v5 (client-side) ---
        function initializeOnline5v5() {
            // Reuse socket from online FFA initializer
            initializeOnlineFFA();
            console.log('🔵 initializeOnline5v5() called');
        }

        function startOnline5v5() {
            console.log('🌐 Starting Online 5v5...');
            if (!onlineSocket) initializeOnline5v5();

            if (!onlineSocket.connected) {
                onlineSocket.once('connect', () => {
                    console.log('✅ Socket connected! Now joining 5v5 queue');
                    join5v5Queue();
                });
            } else {
                join5v5Queue();
            }
        }

        function join5v5Queue() {
            isInQueue = true;
            showQueueUI();
            // Ask server for 5v5 match (maxPlayers:10)
            onlineSocket.emit('joinMatchmaking', {
                playerName: 'Player',
                heroType: selectedHeroType || 'paul',
                gameMode: '5v5',
                maxPlayers: 10
            });

            onlineSocket.on('queueStatus', (data) => {
                updateQueueUI(data);
            });

            onlineSocket.once('matchFound', (data) => {
                console.log('✅ 5v5 match found', data);
                on5v5MatchFound(data);
            });
        }

        function on5v5MatchFound(data) {
            if (queueUpdateTimer) clearInterval(queueUpdateTimer);
            let modal = document.getElementById('matchmakingModal');
            if (modal) {
                modal.innerHTML = `
                    <h1 style="font-size:40px;margin-bottom:20px;text-shadow:0 0 10px #00ff00;color:#00ff00;">🎉 5V5 MATCH FOUND! 🎉</h1>
                    <p style="font-size:16px;color:#88ffff;margin-bottom:30px;">Teams assembled. Preparing spawn...</p>
                    <p style="font-size:14px;color:#88ffff;margin-bottom:10px;" id="matchPlayersFound">${data.playerCount || 1} / ${data.maxPlayers || 10} players</p>
                    <div style="margin:30px 0;font-size:60px;font-weight:bold;text-shadow:0 0 15px #00bcd4;letter-spacing:5px;">
                        <span id="countdown">10</span>
                    </div>
                `;
                modal.style.display = 'block';
            }

            const required = data.maxPlayers || 10;
            if (data.playerCount && data.playerCount < required) {
                const infoEl = document.getElementById('matchPlayersFound');
                if (infoEl) infoEl.textContent = `${data.playerCount} / ${required} players`;

                const progressHandler = (update) => {
                    if (update && typeof update.playerCount !== 'undefined') {
                        if (infoEl) infoEl.textContent = `${update.playerCount} / ${required} players`;
                        if (update.playerCount >= required) {
                            onlineSocket.off('matchProgress', progressHandler);
                            onlineSocket.off('queueStatus', progressHandler);
                            run5v5StartCountdown(data, 10);
                        }
                    }
                };

                onlineSocket.on('matchProgress', progressHandler);
                onlineSocket.on('queueStatus', progressHandler);
                onlineSocket.once('matchReady', (d) => { onlineSocket.off('matchProgress', progressHandler); onlineSocket.off('queueStatus', progressHandler); run5v5StartCountdown(d || data, 10); });
            } else {
                run5v5StartCountdown(data, 10);
            }
        }

        function run5v5StartCountdown(data, seconds) {
            let modal = document.getElementById('matchmakingModal');
            let count = seconds;
            if (!modal) return;
            const timer = setInterval(() => {
                count--;
                const cd = document.getElementById('countdown');
                if (cd) cd.textContent = count <= 0 ? '🎮' : String(count);
                if (count <= 0) {
                    clearInterval(timer);
                    if (modal) modal.style.display = 'none';
                    const assignedIndex = (typeof data.assignedIndex !== 'undefined') ? data.assignedIndex : 0;
                    const spawnData = data.spawnPositions ? (data.spawnPositions[assignedIndex] || data.spawnPositions[0]) : { x: 500, y: 500, team: 1 };
                    if (data.mapSeed) window.currentMapSeed = data.mapSeed;
                    initializeOnline5v5Game(spawnData, data);
                    onlineSocket.on('gameStart', () => console.log('⚔️ 5v5 Battle start!'));
                }
            }, 1000);
        }

        function initializeOnline5v5Game(playerData, matchMeta) {
            try {
                // Basic reset like FFA
                resetMatchVisuals();
                safeZoneRadius = WORLD_SIZE * 0.8;
                window.onlinePlayers = {};
                window.remoteProjectiles = {};
                window.onlineEntities = {};

                const heroType = selectedHeroType || 'paul';
                // Spawn local player - use if/else (WORKS!)
                if(heroType==='noob')player=new Noob(playerData.x,playerData.y,true);
                else if(heroType==='kaiser')player=new Kaiser(playerData.x,playerData.y,true);
                else if(heroType==='tate')player=new Tate(playerData.x,playerData.y,true);
                else if(heroType==='christian')player=new Christian(playerData.x,playerData.y,true);
                else if(heroType==='edgar')player=new Edgar(playerData.x,playerData.y,true);
                else if(heroType==='coolkidd')player=new Coolkidd(playerData.x,playerData.y,true);
                else if(heroType==='builderman')player=new Builderman(playerData.x,playerData.y,true);
                else if(heroType==='mamba')player=new Mamba(playerData.x,playerData.y,true);
                else if(heroType==='light')player=new LightHero(playerData.x,playerData.y,true);
                else if(heroType==='kai')player=new Kai(playerData.x,playerData.y,true);
                else if(heroType==='acheron')player=new Acheron(playerData.x,playerData.y,true);
                else if(heroType==='noli')player=new Noli(playerData.x,playerData.y,true);
                else if(heroType==='don')player=new Don(playerData.x,playerData.y,true);
                else if(heroType==='faik')player=new Faik(playerData.x,playerData.y,true);
                else if(heroType==='darrick')player=new Darrick(playerData.x,playerData.y,true);
                else if(heroType==='fletcher')player=new Fletcher(playerData.x,playerData.y,true);
                else if(heroType==='glace')player=new Glace(playerData.x,playerData.y,true);
                else if(heroType==='ming')player=new Ming(playerData.x,playerData.y,true);
                else if(heroType==='nos')player=new Nos(playerData.x,playerData.y,true);
                else if(heroType==='carlos')player=new Carlos(playerData.x,playerData.y,true);
                else if(heroType==='buster')player=new Buster(playerData.x,playerData.y,true);
                else if(heroType==='ren')player=new Ren(playerData.x,playerData.y,true);
                else if(heroType==='melvin')player=new Melvin(playerData.x,playerData.y,true);
                else if(heroType==='gamb')player=new Gamb(playerData.x,playerData.y,true);
                else if(heroType==='neo')player=new Neo(playerData.x,playerData.y,true);
                else if(heroType==='chimera')player=new Chimera(playerData.x,playerData.y,true);
                else if(heroType==='li')player=new Li(playerData.x,playerData.y,true);
                else if(heroType==='lav')player=new Lav(playerData.x,playerData.y,true);
                else if(heroType==='max')player=new Max(playerData.x,playerData.y,true);
                else if(heroType==='fred')player=new Fred(playerData.x,playerData.y,true);
                else if(heroType==='kenshi')player=new Kenshi(playerData.x,playerData.y,true);
                else if(heroType==='gigi')player=new Gigi(playerData.x,playerData.y,true);
                else if(heroType==='benjamin')player=new Benjamin(playerData.x,playerData.y,true);
                else if(heroType==='zappa')player=new Zappa(playerData.x,playerData.y,true);
                else if(heroType==='cyrus')player=new Cyrus(playerData.x,playerData.y,true);
                else if(heroType==='austin')player=new Austin(playerData.x,playerData.y,true);
                else if(heroType==='ambrose')player=new Ambrose(playerData.x,playerData.y,true);
                else if(heroType==='wesley')player=new Wesley(playerData.x,playerData.y,true);
                else if(heroType==='ash')player=new Ash(playerData.x,playerData.y,true);
                else if(heroType==='yun')player=new Yun(playerData.x,playerData.y,true);
                else if(heroType==='racingduo')player=new RacingDuo(playerData.x,playerData.y,true);
                else if(heroType==='monza')player=new Monza(playerData.x,playerData.y,true);
                else if(heroType==='vival')player=new Vival(playerData.x,playerData.y,true);
                else if(heroType==='everdawn')player=new Everdawn(playerData.x,playerData.y,true);
                else if(heroType==='aurora')player=new Aurora(playerData.x,playerData.y,true);
                else if(heroType==='bai')player=new Bai(playerData.x,playerData.y,true);
                else if(heroType==='apollo')player=new Apollo(playerData.x,playerData.y,true);
                else if(heroType==='bounty')player=new BountyHunter(playerData.x,playerData.y,true);
                else if(heroType==='dayum')player=new Dayum(playerData.x,playerData.y,true);
                else if(heroType==='gregory')player=new Gregory(playerData.x,playerData.y,true);
                else if(heroType==='winston')player=new Winston(playerData.x,playerData.y,true);
                else if(heroType==='amir')player=new Amir(playerData.x,playerData.y,true);
                else if(heroType==='steven')player=new Steven(playerData.x,playerData.y,true);
                else if(heroType==='cornelius')player=new Cornelius(playerData.x,playerData.y,true);
                else if(heroType==='trent')player=new Trent(playerData.x,playerData.y,true);
                else if(heroType==='guest')player=new Guest(playerData.x,playerData.y,true);
                else if(heroType==='jimeka')player=new Jimeka(playerData.x,playerData.y,true);
                else if(heroType==='twins')player=new Twins(playerData.x,playerData.y,true);
                else player=new Paul(playerData.x,playerData.y,true);

                player.socketId = onlineSocket.id;
                mySocketId = onlineSocket.id;
                // assign team from server if provided, otherwise by assignedIndex heuristic
                player.team = (typeof playerData.team !== 'undefined') ? playerData.team : ((matchMeta && typeof matchMeta.assignedIndex === 'number' && matchMeta.assignedIndex < 5) ? 1 : 2);
                player.name = 'Player';
                player.gear = selectedGear || 'speedster';
                // Apply selected skin for all heroes, even when their constructor did not define currentSkin yet.
                player.currentSkin = selectedSkins[selectedHeroType] || 'default';
                
                // Entrance sounds for Don Pollo and Real Top G
                if ((selectedHeroType === 'tate' && player.currentSkin === 'Real Top G') ||
                    (selectedHeroType === 'don' && player.currentSkin === 'Don Pollo')) {
                    let sounds = getSkinSounds(selectedHeroType, player.currentSkin);
                    if(sounds && sounds.entrance) {
                        let audio = new Audio(sounds.entrance);
                        audio.volume = 0.8;
                        audio.play().catch(e => console.log('Sound failed:', e));
                    }
                    if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                        onlineSocket.emit('abilitySound',{ability:'entrance',x:player.x,y:player.y,heroType:selectedHeroType,skin:player.currentSkin});
                    }
                }
                
                entities.push(player);

                // set initial gameState5v5 object for client usage
                window.gameState5v5 = window.gameState5v5 || {};
                window.gameState5v5.blueScore = 0;
                window.gameState5v5.redScore = 0;
                window.gameState5v5.reviveQueue = [];
                window.gameState5v5.reviveDuration = 6;
                window.gameState5v5.isReviving = false;

                // spawn some bushes deterministically if seed provided
                let rng = Math.random;
                if (window.currentMapSeed) {
                    (function(){ let s = Number(window.currentMapSeed) % 2147483647; if (s <= 0) s += 2147483646; rng = function(){ s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; })();
                }
                for(let i=0;i<100;i++) bushes.push(new Bush(rng()*WORLD_SIZE, rng()*WORLD_SIZE, 50 + rng()*80));

                // Preserve skin modal if it's open - don't auto-close it
                let skinModal = document.getElementById('skinSelectModal');
                let skinModalWasOpen = skinModal && skinModal.style.display === 'block';

                document.getElementById('heroSelectScreen').style.display = 'none';
                document.getElementById('controlsBtn').style.display='none';
                let controlsPanel = document.getElementById('controlsPanel');
                if(controlsPanel) controlsPanel.style.display='none';
                
                // Restore skin modal visibility if it was open before game start
                if(skinModalWasOpen && skinModal) {
                    skinModal.style.display = 'block';
                    skinModal.style.zIndex = '2001'; // Ensure it's above game elements
                }
                
                document.getElementById('hud').style.display = 'block';

                if (CANVAS) CANVAS.style.display = 'block';
                camera.x = player.x - CANVAS.width / 2; camera.y = player.y - CANVAS.height / 2;
                gameRunning = true; lastTime = performance.now();

                startPlayerPositionSync();
                setupOnlineListeners();
                updateHUD(player);

                console.log('✅ Online 5v5 Game Started! Team:', player.team);
            } catch (err) {
                console.error('Failed to init online 5v5 game', err);
                gameRunning = false;
            }
        }

        // 1v1 offline vs bot mode
        function start1v1() {
            console.log('⚔️ Starting 1v1 vs Bot...');
            
            // Save original WORLD_SIZE and restore it when switching modes
            if (!window.savedWorldSize) {
                window.savedWorldSize = WORLD_SIZE;
            }
            WORLD_SIZE = 2000; // Compact map for true man fighting
            
            // Close hero select screen
            document.getElementById('heroSelectScreen').style.display = 'none';
            document.getElementById('hud').style.display = 'block';
            
            resetMatchVisuals();
            
            // 1v1 should be clear - no bushes to clutter the arena
            // (previously spawned 30 bushes, now removed)
            
            // Spawn player at bottom left  
            if (selectedHeroType === 'noob') player = new Noob(750, 750, true);
            else if (selectedHeroType === 'kaiser') player = new Kaiser(750, 750, true);
            else if (selectedHeroType === 'tate') player = new Tate(750, 750, true);
            else if (selectedHeroType === 'edgar') player = new Edgar(750, 750, true);
            else if (selectedHeroType === 'coolkidd') player = new Coolkidd(750, 750, true);
            else if (selectedHeroType === 'builderman') player = new Builderman(750, 750, true);
            else if (selectedHeroType === 'mamba') player = new Mamba(750, 750, true);
            else if (selectedHeroType === 'light') player = new LightHero(750, 750, true);
            else if (selectedHeroType === 'kai') player = new Kai(750, 750, true);
            else if (selectedHeroType === 'acheron') player = new Acheron(750, 750, true);
            else if (selectedHeroType === 'noli') player = new Noli(750, 750, true);
            else if (selectedHeroType === 'don') player = new Don(750, 750, true);
            else if (selectedHeroType === 'faik') player = new Faik(750, 750, true);
            else if (selectedHeroType === 'darrick') player = new Darrick(750, 750, true);
            else if (selectedHeroType === 'fletcher') player = new Fletcher(750, 750, true);
            else if (selectedHeroType === 'glace') player = new Glace(750, 750, true);
            else if (selectedHeroType === 'ming') player = new Ming(750, 750, true);
            else if (selectedHeroType === 'nos') player = new Nos(750, 750, true);
            else if (selectedHeroType === 'carlos') player = new Carlos(750, 750, true);
            else if (selectedHeroType === 'buster') player = new Buster(750, 750, true);
            else if (selectedHeroType === 'ren') player = new Ren(750, 750, true);
            else if (selectedHeroType === 'melvin') player = new Melvin(750, 750, true);
            else if (selectedHeroType === 'gamb') player = new Gamb(750, 750, true);
            else if (selectedHeroType === 'winston') player = new Winston(750, 750, true);
            else if (selectedHeroType === 'neo') player = new Neo(750, 750, true);
            else if (selectedHeroType === 'chimera') player = new Chimera(750, 750, true);
            else if (selectedHeroType === 'li') player = new Li(750, 750, true);
            else if (selectedHeroType === 'lav') player = new Lav(750, 750, true);
            else if (selectedHeroType === 'max') player = new Max(750, 750, true);
            else if (selectedHeroType === 'fred') player = new Fred(750, 750, true);
            else if (selectedHeroType === 'kenshi') player = new Kenshi(750, 750, true);
            else if (selectedHeroType === 'gigi') player = new Gigi(750, 750, true);
            else if (selectedHeroType === 'benjamin') player = new Benjamin(750, 750, true);
            else if (selectedHeroType === 'zappa') player = new Zappa(750, 750, true);
            else if (selectedHeroType === 'austin') player = new Austin(750, 750, true);
            else if (selectedHeroType === 'ambrose') player = new Ambrose(750, 750, true);
            else if (selectedHeroType === 'wesley') player = new Wesley(750, 750, true);
            else if (selectedHeroType === 'ash') player = new Ash(750, 750, true);
            else if (selectedHeroType === 'yun') player = new Yun(750, 750, true);
            else if (selectedHeroType === 'racingduo') player = new RacingDuo(750, 750, true);
            else if (selectedHeroType === 'monza') player = new Monza(750, 750, true);
            else if (selectedHeroType === 'christian') player = new Christian(750, 750, true);
            else if (selectedHeroType === 'vival') player = new Vival(750, 750, true);
            else if (selectedHeroType === 'aurora') player = new Aurora(750, 750, true);
            else if (selectedHeroType === 'bai') player = new Bai(750, 750, true);
            else if (selectedHeroType === 'apollo') player = new Apollo(750, 750, true);
            else if (selectedHeroType === 'lune') player = new Lune(750, 750, true);
            else if (selectedHeroType === 'bruno') { if (q) q.innerText = '🧪'; if (e) e.innerText = '⚔️'; if (f) f.innerText = '☄️'; if (g) g.innerText = '✦'; player = new BrunoAlexander(750, 750, true); }
            else if (selectedHeroType === 'bounty') player = new BountyHunter(750, 750, true);
            else if (selectedHeroType === 'dayum') player = new Dayum(750, 750, true);
            else if (selectedHeroType === 'gregory') player = new Gregory(750, 750, true);
            else if (selectedHeroType === 'amir') player = new Amir(750, 750, true);
            else if (selectedHeroType === 'steven') player = new Steven(750, 750, true);
            else if (selectedHeroType === 'cornelius') player = new Cornelius(750, 750, true);
            else if (selectedHeroType === 'trent') player = new Trent(750, 750, true);
            else if (selectedHeroType === 'guest') player = new Guest(750, 750, true);
            else if (selectedHeroType === 'jimeka') player = new Jimeka(750, 750, true);
            else if (selectedHeroType === 'twins') player = new Twins(750, 750, true);
            else player = new Paul(750, 750, true);
            
            entities.push(player);
            player.gear = selectedGear;
            
            // Apply selected skin for all heroes, even if the class did not predeclare currentSkin.
            player.currentSkin = selectedSkins[selectedHeroType] || 'default';
            
            // Play entrance sound for Don Pollo
            if ((selectedHeroType === 'tate' && player.currentSkin === 'Real Top G') ||
                (selectedHeroType === 'don' && player.currentSkin === 'Don Pollo')) {
                let sounds = getSkinSounds(selectedHeroType, player.currentSkin);
                if (sounds && sounds.entrance) {
                    let audio = new Audio(sounds.entrance);
                    audio.volume = 0.8;
                    audio.play().catch(e => console.log('Sound failed:', e));
                }
            }
            
            player.team = 1;
            
            // Spawn 1 random enemy bot at top-right corner
            let botHero = window.pickWeightedBotHero();
            let bot = new botHero(WORLD_SIZE - 750, WORLD_SIZE - 750, false);
            bot.team = 2;
            bot.name = 'Opponent';
            bot.gear = ['speedster', 'rage', 'blink', 'bandage', 'visiongoggles', 'electrico', 'invincible', 'execution', 'soundblast', 'teleportation'][Math.floor(Math.random() * 10)];
            entities.push(bot);
            
            // Setup HUD and camera
            document.getElementById('hud').style.display = 'block';
            camera.x = player.x - CANVAS.width / 2;
            camera.y = player.y - CANVAS.height / 2;
            gameRunning = true;
            lastTime = performance.now();
            updateHUD(player);
            
            console.log('⚔️ 1v1 Match Started! Your hero:', selectedHeroType, 'vs:', botHero.name || 'Bot');
        }

        // Handle selectGameMode for online FFA
        const originalSelectGameMode = window.selectGameMode;
        window.selectGameMode = function(mode) {
                    if (mode === 'ffa_online') {
                        initializeOnlineFFA();
                        gameMode = 'ffa_online';
                        document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (Online FFA)';
                    } else if (mode === '5v5_online') {
                        // Online 5v5 uses same socket system but requests 5v5 matchmaking
                        initializeOnline5v5();
                        gameMode = '5v5_online';
                        document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (Online 5v5)';
                    } else if (mode === 'duel_online') {
                        // 1v1 duel mode (online)
                        initializeOnlineFFA();
                        gameMode = 'duel_online';
                        document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (Online 1v1)';
                    } else if (mode === '1v1') {
                        // 1v1 offline mode (vs bot)
                        gameMode = '1v1';
                        document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (1v1 vs Bot)';
                    } else {
                        if (originalSelectGameMode) originalSelectGameMode(mode);
                    }
        };

        // Handle startGame for online FFA/duel
        const originalStartGame = window.startGame;
        window.startGame = function() {
                    if (gameMode === 'ffa_online') {
                        startOnlineFFA();
                    } else if (gameMode === '5v5_online') {
                        startOnline5v5();
                    } else if (gameMode === 'duel_online') {
                        startOnlineDuel();
                    } else if (gameMode === '1v1') {
                        start1v1();
                    } else {
                        if (originalStartGame) originalStartGame();
                    }
        };
