        var CANVAS, CTX, MINIMAP_CANVAS, MINIMAP_CTX;
        var shakeIntensity = 0;
        let WORLD_SIZE = 5000;
        const TOTAL_BOTS = 49;
        
        // Training mode dummy variables
        let trainingDummyMode = 'practice'; // 'practice' or '1v1'
        let trainingDummy = null;
        
        var safeZoneRadius = WORLD_SIZE * 0.8;
        var minSafeZone = 600; // Increased min safe zone
        var safeZoneShrinkRate = 15; // Faster shrink

        // Chicken image for Don Pollo spirit bomb
        let chickenImg = new Image();
        chickenImg.src = 'photos/chicken.png';

        // Early stub definitions to prevent "not defined" errors if buttons clicked before script fully loads
        window.selectGameMode = window.selectGameMode || function(mode) { console.log('selectGameMode stub:', mode); };
        window.selectHero = window.selectHero || function(h) { console.log('selectHero stub:', h); };
        window.selectGear = window.selectGear || function(g) { console.log('selectGear stub:', g); };
        window.startGame = window.startGame || function() { console.log('startGame stub'); };

        // Hero enable/disable flags for development testing
        window.heroEnabled = {
            // Set to true to enable heroes for public release
            'exampleHero': false,  // Change to true when ready
            'gregory': true,
            'cyrus': true,
            // Ensure new heroes are enabled by default
            'steven': true,
            // Add more heroes here as needed
        };

        // FUTURE-PROOF HERO LOOKUP: Dynamically find hero classes without hardcoded registry
        // THIS MUST BE DEFINED EARLY - it's called by all game modes!
        function getHeroClass(heroType) {
          console.log('🔍 getHeroClass() called with heroType:', heroType);
          if (!heroType) {
            console.warn('❌ No heroType provided, defaulting to Paul');
            return Paul;
          }
          
          const heroStr = String(heroType).toLowerCase();
          console.log('   Normalized heroStr:', heroStr);
          
          // Try direct conversion: 'zappa' -> window['Zappa']
          let className = heroStr.charAt(0).toUpperCase() + heroStr.slice(1);
          console.log('   Looking for class:', className);
          let HeroClass = window[className];
          console.log('   Found in window?', !!HeroClass, 'Type:', typeof HeroClass);
          
          // Handle special naming cases
          if (!HeroClass) {
            const specialMappings = {
              'light': 'LightHero',      // 'light' card -> LightHero class
              'bounty': 'BountyHunter',  // 'bounty' card -> BountyHunter class
              'caskrice': 'Caskrice',    // 'caskrice' card -> Caskrice class
              'zeus': 'Zeus'             // 'zeus' card -> Zeus class
            };
            
            if (specialMappings[heroStr]) {
              className = specialMappings[heroStr];
              console.log('   Special mapping found, trying:', className);
              HeroClass = window[className];
              console.log('   Found special mapping?', !!HeroClass);
            }
          }
          
          // Validate it's a valid class
          if (HeroClass && typeof HeroClass === 'function') {
            console.log('✅ Returning ' + className);
            return HeroClass;
          }
          
          // Fallback with warning
          console.warn(`⚠️ Hero class '${className}' not found for type '${heroType}', defaulting to Paul`);
          console.log('   Available window keys with "o":', Object.keys(window).filter(k => k.includes('o')).slice(0, 20));
          return Paul;
        }

        // Global error handlers to capture crashes and show them in the UI
        function showGameError(msg, ms = 3500) {
            try {
                const el = document.getElementById('gameErrorBanner');
                if (!el) return console.warn('gameErrorBanner not found:', msg);
                el.innerText = msg;
                el.style.display = 'block';
                el.style.opacity = '1';
                clearTimeout(window._gameErrorTimeout);
                window._gameErrorTimeout = setTimeout(()=>{ el.style.opacity = '0'; setTimeout(()=>{ el.style.display = 'none'; }, 300); }, ms);
            } catch (err) { console.error('showGameError error', err); }
        }
        function showMatchDebug(msg, ms = 3000) {
            try {
                const el = document.getElementById('matchDebugHud');
                if (!el) return console.warn('matchDebugHud not found:', msg);
                el.innerText = msg;
                el.style.display = 'block';
                el.style.opacity = '1';
                clearTimeout(window._matchDebugTimeout);
                window._matchDebugTimeout = setTimeout(()=>{ el.style.opacity = '0'; setTimeout(()=>{ el.style.display = 'none'; }, 300); }, ms);
            } catch (err) { console.error('showMatchDebug error', err); }
        }
        window.addEventListener('error', function(evt) {
            console.error('Global error caught:', evt.error || evt.message || evt);
            try{
                const msg = (evt.error && evt.error.message) ? evt.error.message : (evt.message || String(evt));
                showGameError('Error: ' + msg, 5000);
            } catch (_){ }
            // keep the game running — show a non-blocking banner instead

            // Safety: provide default no-op input/ai handlers so runtime
            // code can call `this.input(dt, spd)` or `this.ai(dt, spd)` without
            // throwing if a subclass forgot to implement them.
            try {
                if (typeof Entity !== 'undefined') {
                    if (typeof Entity.prototype.input !== 'function') {
                        Entity.prototype.input = function(dt, spd) { /* no-op default */ };
                    }
                    if (typeof Entity.prototype.ai !== 'function') {
                        Entity.prototype.ai = function(dt, spd) { /* no-op default */ };
                    }
                }
            } catch (e) { console.warn('failed to install Entity input/ai fallbacks', e); }
        });
        window.addEventListener('unhandledrejection', function(evt){
            console.error('Unhandled rejection:', evt.reason);
            try{
                const msg = (evt.reason && evt.reason.message) ? evt.reason.message : String(evt.reason);
                showGameError('Promise error: ' + msg, 5000);
            } catch (_){ }
            // keep the game running
        });
        
        let keys = { w:false, a:false, s:false, d:false, ' ':false, q:false, e:false, f:false, g:false, r:false };
        let mouse = { x: 0, y: 0, down: false };
        let camera = { x: 0, y: 0, zoom: 1.0 };

        function getMouseWorldPosition() {
            if (!CANVAS) return { x: mouse.x, y: mouse.y };
            const zoom = Math.max(0.0001, camera.zoom || 1);
            return {
                x: camera.x + (mouse.x / zoom),
                y: camera.y + (mouse.y / zoom)
            };
        }

        function updateMouseFromClient(clientX, clientY) {
            if (!CANVAS) {
                mouse.x = clientX;
                mouse.y = clientY;
                return;
            }
            const rect = CANVAS.getBoundingClientRect();
            const scaleX = CANVAS.width / Math.max(1, rect.width);
            const scaleY = CANVAS.height / Math.max(1, rect.height);
            mouse.x = (clientX - rect.left) * scaleX;
            mouse.y = (clientY - rect.top) * scaleY;
        }

        function getMouseAimAngle(originX, originY) {
            const point = getMouseWorldPosition();
            return Math.atan2(point.y - originY, point.x - originX);
        }
        
        let gameRunning = false;
        let gameMode = 'ffa'; // 'ffa' or 'squad'
        let currentMatchmakingMode = 'ffa';
        let currentMatchmakingMaxPlayers = 50;
        let disableHealthCubes = false; // used by duel mode to suppress cubes
        let lastTime = 0;
        let entities = [];
        let particles = [];
        window.projectiles = []; // global projectile list (must be declared before any hero uses it)
        let visualEffects = []; // Array for EnergyWave, EnergyBeam, EnergyBlast, ShockwaveRing
        // Centralized visual effects manager to guarantee consistent lifecycle and rendering
        class VisualsManager {
            constructor(){
                this.effects = [];
                this._staging = [];
                this._debugLog = true; // Enable debug logging for effects
            }
            add(item){
                try{
                    if(!item) return;
                    if(Array.isArray(item)) { for(let it of item) this.add(it); return; }
                    // normalize
                    if (typeof item.life === 'undefined') { item.life = 0.6; item.maxLife = item.maxLife || item.life; }
                    if (typeof item.update !== 'function') item.update = function(dt){ this.life -= dt; };
                    if (typeof item.draw !== 'function') item.draw = function(ctx){};
                    // stage to avoid concurrent modification while iterating
                    this._staging.push(item);
                    if(this._debugLog && Math.random() < 0.1) console.log(`[VisualsManager] Effect added: ${item.constructor.name}, life=${item.life}, total staged=${this._staging.length}`);
                }catch(e){ try{ console.error('VisualsManager.add error', e, item); }catch(_){} }
            }
            update(dt){
                // merge staging
                if(this._staging.length){ 
                    this.effects.push(...this._staging); 
                    if(this._debugLog) console.log(`[VisualsManager] Merged ${this._staging.length} staged effects. Total effects now: ${this.effects.length}`);
                    this._staging.length = 0; 
                }
                for(let i=this.effects.length-1;i>=0;i--){
                    try{ this.effects[i].update(dt); } catch(err){ console.error('visual effect update error', err, this.effects[i]); }
                    try{ if(!this.effects[i] || typeof this.effects[i].life !== 'undefined' && this.effects[i].life <= 0) this.effects.splice(i,1); } catch(_){}
                }
            }
            draw(ctx){
                // draw in stable snapshot to avoid mutation while rendering
                const snapshot = this.effects.slice();
                const MAX_EFFECTS = 220;
                if(snapshot.length > MAX_EFFECTS) snapshot.length = MAX_EFFECTS;
                if(this._debugLog && snapshot.length > 0) console.log(`[VisualsManager] Drawing ${snapshot.length} effects`);
                ctx.save();
                ctx.filter = 'none';
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'transparent';
                ctx.globalAlpha = 1;
                for (let e of snapshot) {
                    try{
                        if(!window.__visualsReady && e && e.color && isLoadingPurpleVisual(e.color)) continue;
                        if(e && typeof e.draw === 'function') {
                            ctx.save();
                            ctx.filter = 'none';
                            ctx.shadowBlur = 0;
                            ctx.shadowColor = 'transparent';
                            ctx.globalAlpha = 1;
                            e.draw(ctx);
                            ctx.restore();
                        }
                    } catch(err){ console.error('visual effect draw error', err, e); }
                }
                ctx.restore();
            }
            clear(){ this.effects.length = 0; this._staging.length = 0; }
        }

        // expose manager and keep `effectsAdd` helper compatible with existing code
        let _visuals = new VisualsManager();
        // keep global effects array reference for any code that reads it
        let effects = _visuals.effects;
        function effectsAdd(item){ _visuals.add(item); }
        let damageTexts = [];
        let moonShapes = [];
        let racingLines = []; // Global array for racing lines
        let ringEffects = []; // Expanding/shockwave ring visual effects
        let bushes = [];
        let player = null;
        window.__visualsReady = false;

        function isLoadingPurpleVisual(color) {
            if (!color || typeof color !== 'string') return false;
            const c = color.toLowerCase();
            return c === '#800080' || c === '#ff00ff' || c === '#da70d6' || c === '#8000ff';
        }

        function resetMatchVisuals() {
            window.__visualsReady = false;
            triggeredHeroInteractions.clear();
            if (window.projectiles) window.projectiles.length = 0;
            if (Array.isArray(visualEffects)) visualEffects.length = 0;
            if (Array.isArray(ringEffects)) ringEffects.length = 0;
            if (Array.isArray(damageTexts)) damageTexts.length = 0;
            if (Array.isArray(moonShapes)) moonShapes.length = 0;
            if (Array.isArray(racingLines)) racingLines.length = 0;
            if (Array.isArray(particles)) particles.length = 0;
            if (Array.isArray(entities)) entities.length = 0;
            if (Array.isArray(bushes)) bushes.length = 0;
            if (_visuals && typeof _visuals.clear === 'function') _visuals.clear();
            if (Array.isArray(effects)) effects.length = 0;
            if (CANVAS) {
                const ctx = CANVAS.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
            }
            setTimeout(() => { window.__visualsReady = true; }, 150);
        }
        let selectedHeroType = 'paul';
        let selectedGear = 'speedster';
        let currentMVP = null;
        let cubeSpawnTimer = 0;
        let isInitialized = false;
        let globalEntityID = 0;
        // Incremental id used for temporary realms
        let nextRealmId = 1;

        class Vector2 {
            constructor(x,y){this.x=x;this.y=y;}
            norm(){let m=Math.sqrt(this.x*this.x+this.y*this.y);return m===0?new Vector2(0,0):new Vector2(this.x/m,this.y/m);}
            mult(n){return new Vector2(this.x*n,this.y*n);}
        }

        class Bush {
            constructor(x,y,r){this.x=x;this.y=y;this.radius=r;}
            draw(ctx){
                if(this.x < camera.x - this.radius || this.x > camera.x + (CANVAS.width / (camera.zoom || 1)) + this.radius || this.y < camera.y - this.radius || this.y > camera.y + (CANVAS.height / (camera.zoom || 1)) + this.radius) return;
                ctx.save();
                ctx.fillStyle='#2e7d32';ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.radius,0,Math.PI*2);ctx.fill();
                ctx.strokeStyle='#1b5e20';ctx.lineWidth=3;ctx.stroke();
                ctx.restore();
            }
            contains(e){return Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<this.radius;}
        }

        class Particle {
            constructor(x,y,c,s,l){this.x=x;this.y=y;this.color=c;this.life=l;this.maxLife=l;let a=Math.random()*Math.PI*2;this.vx=Math.cos(a)*s*Math.random();this.vy=Math.sin(a)*s*Math.random();this.size=Math.random()*3+2;}
            update(dt){this.x+=this.vx;this.y+=this.vy;this.life-=dt;this.size*=0.95;}
            draw(ctx){
                if(!window.__visualsReady && isLoadingPurpleVisual(this.color)) return;
                ctx.save();
                ctx.globalAlpha=Math.max(0,this.life/this.maxLife);
                ctx.fillStyle=this.color;
                if(this.color==='#800080'||this.color==='#DA70D6'){
                    ctx.fillRect(this.x-camera.x-this.size,this.y-camera.y-this.size,this.size*2,this.size*2);
                }else{ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.size,0,Math.PI*2);ctx.fill();}
                ctx.globalAlpha=1.0;
                ctx.restore();
            }
        }

        // simple floating text effect for notifications
        class FloatingText {
            constructor(x,y,text,color,duration=1){
                this.x=x;this.y=y;this.text=text;this.color=color||'#fff';
                this.life=duration;this.maxLife=duration;
            }
            update(dt){this.life-=dt;this.y-=dt*20;}
            draw(ctx){ctx.save();ctx.globalAlpha=Math.max(0,this.life/this.maxLife);ctx.fillStyle=this.color;ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(this.text,this.x-camera.x,this.y-camera.y);ctx.globalAlpha=1.0;ctx.restore();}
        }

        class HealthCube {
            constructor(x,y){this.x=x;this.y=y;this.size=15;this.del=false;this.fo=Math.random()*Math.PI*2;}
            update(dt){
                this.fo+=dt*2;
                for(let e of entities) {
                    if(e.dead||!(e instanceof Entity))continue;
                    if(Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2)<e.radius+this.size){
                        e.hp=Math.min(e.maxHp,e.hp+e.maxHp*0.1);this.del=true;
                        if(e.isPlayer) addKillMsg("Picked up Health Cube (+10% HP)");
                        for(let i=0;i<10;i++) particles.push(new Particle(this.x,this.y,'#0f0',3,0.8));
                    }
                }
            }
            draw(ctx){
                let dy=this.y+Math.sin(this.fo)*5;
                ctx.save();
                ctx.fillStyle='#2ecc71';ctx.strokeStyle='#27ae60';ctx.lineWidth=2;
                ctx.beginPath();ctx.rect(this.x-camera.x-15,dy-camera.y-15,30,30);ctx.fill();ctx.stroke();
                ctx.fillStyle='#fff';ctx.fillRect(this.x-camera.x-2,dy-camera.y-8,4,16);ctx.fillRect(this.x-camera.x-8,dy-camera.y-2,16,4);
                ctx.restore();
            }
        }

        class Slash {
            constructor(x,y,a,r,arc, c="#fff"){this.x=x;this.y=y;this.angle=a;this.radius=r;this.arc=arc;this.life=0.25;this.maxLife=0.25;this.color=c;}
            update(dt){this.life-=dt;}
            draw(ctx){
                if(!window.__visualsReady && isLoadingPurpleVisual(this.color)) return;
                let x = this.x-camera.x, y = this.y-camera.y;
                let a = Math.max(0,this.life/this.maxLife);
                ctx.save();
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 9;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 18;
                ctx.beginPath();ctx.arc(x,y,this.radius,this.angle-this.arc/2,this.angle+this.arc/2);
                ctx.stroke();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#fff7d6';
                ctx.beginPath();ctx.arc(x,y,this.radius*0.8,this.angle-this.arc/2+0.08,this.angle+this.arc/2-0.08);
                ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = a * 0.35;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.arc(x, y, this.radius, this.angle-this.arc/2, this.angle+this.arc/2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        }

        // Single spinning ring effect (less visually noisy than many Slashes)
        class SpinningRing {
            constructor(x,y,r,color,duration=0.6,rotSpeed=8,thickness=6){
                this.x = x; this.y = y; this.radius = r; this.color = color || '#fff';
                this.life = duration; this.maxLife = duration; this.angle = 0; this.rotSpeed = rotSpeed; this.thickness = thickness;
            }
            update(dt){ this.angle += this.rotSpeed * dt; this.life -= dt; }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                ctx.globalAlpha = a;
                let x = this.x - camera.x, y = this.y - camera.y;

                // faint base circle
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = 0.18 * a;
                ctx.lineWidth = Math.max(2, this.thickness - 2);
                ctx.beginPath(); ctx.arc(x, y, this.radius, 0, Math.PI * 2); ctx.stroke();

                // rotating highlight arc
                ctx.globalAlpha = 0.95 * a;
                ctx.lineWidth = this.thickness;
                ctx.beginPath(); ctx.arc(x, y, this.radius, this.angle, this.angle + Math.PI * 0.6); ctx.stroke();

                ctx.globalAlpha = 1.0;
            }
        }

        class RectSlash {
            constructor(x,y,a,l,w,c){this.x=x;this.y=y;this.angle=a;this.len=l;this.wid=w;this.life=0.25;this.maxLife=0.25;this.color=c||'#fff';}
            update(dt){this.life-=dt;}
            draw(ctx){
                if(!window.__visualsReady && isLoadingPurpleVisual(this.color)) return;
                ctx.globalAlpha=Math.max(0,this.life/this.maxLife);ctx.save();
                ctx.translate(this.x-camera.x,this.y-camera.y);ctx.rotate(this.angle);
                ctx.fillStyle=this.color;ctx.strokeStyle='#fff';ctx.lineWidth=2;
                ctx.beginPath();ctx.rect(0,-this.wid/2,this.len,this.wid);ctx.fill();ctx.stroke();
                ctx.restore();ctx.globalAlpha=1.0;
            }
        }

        class CaskriceArcSlash {
            constructor(x,y,angle,radius,arc,color,duration=0.26){
                this.x=x; this.y=y; this.angle=angle; this.radius=radius; this.arc=arc; this.color=color || '#f8d9ff';
                this.life=duration; this.maxLife=duration; this.del=false;
            }
            update(dt){ this.life -= dt; if(this.life <= 0) this.del = true; }
            draw(ctx){
                const alpha = Math.max(0, this.life / this.maxLife);
                const sx = this.x - camera.x; const sy = this.y - camera.y;
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.translate(sx, sy);
                ctx.rotate(this.angle);
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 14;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 28;
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, -this.arc / 2, this.arc / 2);
                ctx.stroke();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#fff8ff';
                ctx.beginPath();
                ctx.arc(0, 0, this.radius * 0.78, -this.arc / 2 + 0.08, this.arc / 2 - 0.08);
                ctx.stroke();
                ctx.restore();
            }
        }

        class CaskriceBeamPulse {
            constructor(x,y,angle,length,color,duration=0.32){
                this.x=x; this.y=y; this.angle=angle; this.length=length; this.color=color || '#ff87d3';
                this.life=duration; this.maxLife=duration; this.del=false;
            }
            update(dt){ this.life -= dt; if(this.life <= 0) this.del = true; }
            draw(ctx){
                const a = Math.max(0, this.life / this.maxLife);
                const sx = this.x - camera.x; const sy = this.y - camera.y;
                ctx.save();
                ctx.translate(sx, sy);
                ctx.rotate(this.angle);
                ctx.globalAlpha = 0.95 * a;
                ctx.shadowColor = this.color; ctx.shadowBlur = 32;
                ctx.strokeStyle = this.color; ctx.lineWidth = 12;
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.length, 0); ctx.stroke();
                ctx.lineWidth = 3; ctx.strokeStyle = '#fff6ff';
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(this.length * 0.85, 0); ctx.stroke();
                ctx.fillStyle = this.color; ctx.globalAlpha = 0.28 * a;
                ctx.beginPath(); ctx.moveTo(-8, -16); ctx.lineTo(this.length, 0); ctx.lineTo(-8, 16); ctx.closePath(); ctx.fill();
                ctx.restore();
            }
        }

        class CaskriceDragonClaw {
            constructor(x,y,angle,color,duration=0.22){
                this.x=x; this.y=y; this.angle=angle; this.color=color || '#d8b4fe';
                this.life=duration; this.maxLife=duration; this.del=false;
            }
            update(dt){ this.life -= dt; if(this.life <= 0) this.del = true; }
            draw(ctx){
                const a = Math.max(0, this.life / this.maxLife);
                const sx = this.x - camera.x; const sy = this.y - camera.y;
                ctx.save();
                ctx.translate(sx, sy); ctx.rotate(this.angle);
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color; ctx.lineWidth = 7; ctx.shadowColor = this.color; ctx.shadowBlur = 24;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(70, -18);
                ctx.lineTo(100, 0);
                ctx.lineTo(70, 18);
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = '#fff4ff'; ctx.globalAlpha = 0.8 * a; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(94, -10); ctx.lineTo(94, 10); ctx.closePath(); ctx.fill();
                ctx.restore();
            }
        }

        class SwordTrail {
            constructor(x,y,angle,length,duration,color){
                this.startX = x; this.startY = y; this.angle = angle; this.length = length;
                this.life = duration; this.maxLife = duration; this.color = color || '#FF6666';
                this.endX = x + Math.cos(angle) * length;
                this.endY = y + Math.sin(angle) * length;
            }
            update(dt){ this.life -= dt; }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                let x1 = this.startX - camera.x, y1 = this.startY - camera.y;
                let x2 = this.endX - camera.x, y2 = this.endY - camera.y;
                
                ctx.globalAlpha = 0.8 * a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 12;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Glow layer
                ctx.globalAlpha = 0.4 * a;
                ctx.lineWidth = 24;
                ctx.strokeStyle = this.color.replace('#', '#') === this.color ? 
                    'rgba(255,102,102,0.3)' : this.color;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                // Core bright line
                ctx.globalAlpha = 1.0 * a;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                
                ctx.globalAlpha = 1.0;
            }
        }

        // === ADVANCED VISUAL EFFECTS FOR CORNELIUS ===
        class WaveShockwave {
            constructor(x,y,maxRadius,duration,color1,color2){
                this.x = x; this.y = y; this.maxRadius = maxRadius; this.life = duration; this.maxLife = duration;
                this.color1 = color1 || '#FF4444'; this.color2 = color2 || '#FF8800';
            }
            update(dt){ this.life -= dt; }
            draw(ctx){
                if(!window.__visualsReady && (isLoadingPurpleVisual(this.color1) || isLoadingPurpleVisual(this.color2))) return;
                let a = Math.max(0, this.life / this.maxLife);
                let progress = 1 - a;
                let currentRadius = this.maxRadius * progress;
                let x = this.x - camera.x, y = this.y - camera.y;
                ctx.save();
                ctx.globalAlpha = 0.9 * a;
                ctx.strokeStyle = this.color2;
                ctx.lineWidth = 12;
                ctx.shadowColor = this.color2;
                ctx.shadowBlur = 24;
                ctx.beginPath(); ctx.arc(x, y, currentRadius, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = this.color1;
                ctx.lineWidth = 7;
                ctx.beginPath(); ctx.arc(x, y, currentRadius * 0.88, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = '#fff7d9';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(x, y, currentRadius * 0.7, 0, Math.PI * 2); ctx.stroke();
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }
        // boxing-style KO effect for Real Top G kills - acts like shockwave with bigger text
        class KOEffect {
            constructor(x,y){
                this.x = x; this.y = y;
                this.life = 1.2; this.maxLife = 1.2;
                this.rings = [{r:0,life:1.2},{r:0,life:0.9}];
            }
            update(dt){
                this.life -= dt;
                let prog = 1 - (this.life / this.maxLife);
                // multiple ring expansion
                this.rings[0].r = prog * 300;
                this.rings[0].life = this.life;
                this.rings[1].r = Math.max(0, (prog - 0.15) * 300);
                this.rings[1].life = Math.max(0, this.life - 0.18);
            }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                let x = this.x - camera.x, y = this.y - camera.y;
                // multiple expanding rings like shockwave - YELLOW
                ctx.globalAlpha = a * 0.8;
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.arc(x, y, this.rings[0].r, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle = '#ffff99';
                ctx.lineWidth = 5;
                ctx.beginPath(); ctx.arc(x, y, this.rings[1].r, 0, Math.PI*2); ctx.stroke();
                // YELLOW K.O. text with shockwave scaling
                let textScale = 1 + (1 - a) * 0.5; // larger scaling
                ctx.globalAlpha = a;
                ctx.font = 'bold ' + Math.floor(88 * textScale) + 'px Arial';
                ctx.fillStyle = 'rgba(255,255,0,'+a+')';
                ctx.strokeStyle = 'rgba(0,0,0,'+a*0.6+')';
                ctx.lineWidth = 4;
                ctx.textAlign = 'center';
                ctx.strokeText('K.O.', x, y + 25);
                ctx.fillText('K.O.', x, y + 25);
                ctx.globalAlpha = 1.0;
            }
        }
        // Enhanced punch projectile with glowing trail
        class GlowProjectile {
            constructor(x,y,angle,speed,linkedProjectile=null){
                this.x = x; this.y = y; this.angle = angle; this.speed = speed;
                this.trail = [];
                this.linkedProjectile = linkedProjectile;
                this.del = false;
                this.dist = 0;
                // if linked, adjust lifetime to match projectile range
                if(this.linkedProjectile){
                    this.maxLife = this.linkedProjectile.range / this.speed;
                    this.life = this.maxLife;
                } else {
                    this.life = 0.5; this.maxLife = 0.5;
                }
            }
            update(dt){
                // Auto-delete if linked projectile is gone or out of range
                if(this.linkedProjectile && this.linkedProjectile.del){
                    this.del = true;
                    return;
                }
                // Stop if linked projectile exceeded its range
                if(this.linkedProjectile && this.linkedProjectile.dist >= this.linkedProjectile.range){
                    this.del = true;
                    return;
                }
                this.life -= dt;
                if(this.life <= 0) this.del = true;
                this.x += Math.cos(this.angle) * this.speed * dt;
                this.y += Math.sin(this.angle) * this.speed * dt;
                this.dist += Math.sqrt((Math.cos(this.angle) * this.speed * dt)**2 + (Math.sin(this.angle) * this.speed * dt)**2);
                // add trail
                if(Math.random() < 0.6) this.trail.push({x:this.x,y:this.y,life:0.3});
                this.trail = this.trail.filter(t => {t.life -= dt; return t.life > 0;});
            }
            draw(ctx){
                if(this.del) return;
                let a = Math.max(0, this.life / this.maxLife);
                // draw trail
                for(let t of this.trail){
                    let ta = (t.life / 0.3) * a * 0.6;
                    ctx.globalAlpha = ta;
                    ctx.fillStyle = '#ff6b35';
                    ctx.beginPath();
                    ctx.arc(t.x - camera.x, t.y - camera.y, 6, 0, Math.PI*2);
                    ctx.fill();
                }
                // main glow
                ctx.globalAlpha = a * 0.8;
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 12, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = a;
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 8, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        // Dish-shaped kill effect for Don Pollo
        class DishBlast {
            constructor(x,y){
                this.x = x; this.y = y;
                this.life = 1.0; this.maxLife = 1.0;
                this.rings = [{r:0,life:1.0},{r:0,life:0.8}];
            }
            update(dt){
                this.life -= dt;
                let prog = 1 - (this.life / this.maxLife);
                this.rings[0].r = prog * 280;
                this.rings[0].life = this.life;
                this.rings[1].r = Math.max(0, (prog - 0.12) * 280);
                this.rings[1].life = Math.max(0, this.life - 0.15);
            }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                let x = this.x - camera.x, y = this.y - camera.y;
                // Dish rings - orange/brown like a plate
                ctx.globalAlpha = a * 0.8;
                ctx.strokeStyle = '#d2691e';
                ctx.lineWidth = 10;
                ctx.beginPath(); ctx.arc(x, y, this.rings[0].r, 0, Math.PI*2); ctx.stroke();
                ctx.strokeStyle = '#cd853f';
                ctx.lineWidth = 6;
                ctx.beginPath(); ctx.arc(x, y, this.rings[1].r, 0, Math.PI*2); ctx.stroke();
                // Plate pattern - concentric circles
                for(let i=1;i<4;i++){
                    let ringR = (this.rings[0].r * i / 4) * (1 - (1-a)*0.3);
                    ctx.globalAlpha = a * 0.4;
                    ctx.strokeStyle = '#cd853f';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(x, y, ringR, 0, Math.PI*2); ctx.stroke();
                }
                // Small shine at plate center (no text)
                ctx.globalAlpha = a;
                ctx.beginPath();
                ctx.fillStyle = 'rgba(255,230,200,' + (0.9 * a) + ')';
                ctx.ellipse(x, y + 8, 14 * (0.8 + 0.2 * a), 8 * (0.8 + 0.2 * a), 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        class RadialBeam {
            constructor(x,y,angle,maxDist,spreadAngle,duration,color){
                this.x = x; this.y = y; this.angle = angle; this.maxDist = maxDist;
                this.spreadAngle = spreadAngle; this.life = duration; this.maxLife = duration;
                this.color = color || '#FFFF00';
            }
            update(dt){ this.life -= dt; }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                let progress = 1 - a;
                let displayDist = this.maxDist * progress;
                let x = this.x - camera.x, y = this.y - camera.y;
                
                // Draw cone beam
                ctx.save();
                ctx.globalAlpha = 0.6 * a;
                ctx.strokeStyle = this.color;
                ctx.fillStyle = this.color.replace('#', 'rgba(').replace(')', ',0.2)');
                ctx.lineWidth = 3;
                
                ctx.beginPath();
                ctx.arc(x, y, displayDist, this.angle - this.spreadAngle/2, this.angle + this.spreadAngle/2);
                ctx.lineTo(x, y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                // Bright edge
                ctx.globalAlpha = 1.0 * a;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, displayDist, this.angle - this.spreadAngle/2, this.angle + this.spreadAngle/2);
                ctx.stroke();
                
                ctx.restore();
                ctx.globalAlpha = 1.0;
            }
        }

        class AuraRing {
            constructor(x,y,radius,duration,color,rotSpeed){
                this.x = x; this.y = y; this.radius = radius; this.life = duration;
                this.maxLife = duration; this.color = color || '#FFD700'; this.angle = 0;
                this.rotSpeed = rotSpeed || 6;
            }
            update(dt){
                this.angle += this.rotSpeed * dt;
                this.life -= dt;
            }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                let x = this.x - camera.x, y = this.y - camera.y;
                ctx.save();
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 5;
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 18;
                ctx.beginPath(); ctx.arc(x, y, this.radius, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = '#fff1c2';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, this.radius * 0.82, 0, Math.PI * 2); ctx.stroke();
                for(let i = 0; i < 12; i++){
                    let ang = this.angle + (Math.PI * 2 * i / 12);
                    let x1 = x + Math.cos(ang) * this.radius;
                    let y1 = y + Math.sin(ang) * this.radius;
                    let x2 = x + Math.cos(ang) * this.radius * 1.24;
                    let y2 = y + Math.sin(ang) * this.radius * 1.24;
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                }
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }

        class ImpactFlash {
            // Constructor supports multiple call signatures:
            // 1) new ImpactFlash(x, y, angle, distance, duration, color)
            // 2) new ImpactFlash(x, y, angle, distance, duration)
            // 3) new ImpactFlash(x, y, color, distance) [legacy]
            constructor(x, y, angleOrColor, distance, duration, color) {
                this.x = x;
                this.y = y;
                this.del = false;

                if (typeof angleOrColor === 'string') {
                    this.color = angleOrColor;
                    this.angle = 0;
                    this.distance = distance || 50;
                    this.life = duration || 0.6;
                } else {
                    this.angle = angleOrColor || 0;
                    this.distance = distance || 50;
                    this.life = duration || 0.6;
                    this.color = color || '#FF0000';
                }

                this.maxLife = this.life;
            }
            update(dt){
                this.life -= dt;
                if (this.life <= 0) this.del = true;
            }
            draw(ctx){
                let a = Math.max(0, this.life / this.maxLife);
                let progress = 1 - a;
                ctx.save();
                ctx.globalAlpha = 0.9 * a;
                ctx.strokeStyle = this.color;
                ctx.fillStyle = this.color;
                ctx.lineWidth = 7;
                ctx.lineCap = 'round';
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 22;
                for(let i = 0; i < 9; i++){
                    let rayAngle = this.angle + (Math.PI * 2 * i / 9) + (Math.random() - 0.5) * 0.25;
                    let endX = this.x + Math.cos(rayAngle) * this.distance * progress - camera.x;
                    let endY = this.y + Math.sin(rayAngle) * this.distance * progress - camera.y;
                    let startX = this.x - camera.x;
                    let startY = this.y - camera.y;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
                ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, 12 + progress * 25, 0, Math.PI * 2); ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();
            }
        }

        // Attached aura that follows an entity while ascended
        class EntityAura {
            constructor(owner, radius=60, duration=8.0, color1='#FFD700', color2='#FFFF00', rotSpeed=6){
                this.owner = owner;
                this.radius = radius;
                this.life = duration;
                this.maxLife = duration;
                this.color1 = color1; this.color2 = color2; this.rotSpeed = rotSpeed;
                this.angle = 0;
            }
            update(dt){
                if(this.owner && this.owner.ascended) {
                    // refresh life while owner remains ascended
                    this.life = Math.min(this.maxLife, this.life + dt*2);
                } else {
                    this.life -= dt;
                }
                this.angle += this.rotSpeed * dt;
            }
            draw(ctx){
                if(!this.owner) return;
                let a = Math.max(0, this.life / this.maxLife);
                let x = this.owner.x - camera.x, y = this.owner.y - camera.y;
                ctx.save();
                ctx.globalAlpha = 0.6 * a;
                ctx.strokeStyle = this.color1;
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(x, y, this.radius, 0, Math.PI*2); ctx.stroke();
                ctx.globalAlpha = 0.35 * a;
                ctx.strokeStyle = this.color2;
                ctx.lineWidth = 1;
                for(let i=0;i<6;i++){
                    let ang = this.angle + (Math.PI*2*i/6);
                    ctx.beginPath(); ctx.moveTo(x + Math.cos(ang)*(this.radius*0.85), y + Math.sin(ang)*(this.radius*0.85)); ctx.lineTo(x + Math.cos(ang)*(this.radius*1.25), y + Math.sin(ang)*(this.radius*1.25)); ctx.stroke();
                }
                ctx.restore();
            }
        }

