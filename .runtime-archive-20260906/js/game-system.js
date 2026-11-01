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
                this._debugLog = false;
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
                    if (this._staging.length > 600) this._staging.splice(0, this._staging.length - 600);
                    this.effects.push(...this._staging); 
                    if(this._debugLog) console.log(`[VisualsManager] Merged ${this._staging.length} staged effects. Total effects now: ${this.effects.length}`);
                    this._staging.length = 0; 
                }
                for(let i=this.effects.length-1;i>=0;i--){
                    try{ this.effects[i].update(dt); } catch(err){ console.error('visual effect update error', err, this.effects[i]); }
                    try{ if(!this.effects[i] || typeof this.effects[i].life !== 'undefined' && this.effects[i].life <= 0) this.effects.splice(i,1); } catch(_){}
                }
                if (this.effects.length > 600) this.effects.splice(0, this.effects.length - 600);
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
                let currentRadius = Math.max(0, this.maxRadius * progress);
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

        class Projectile {
            constructor(o,x,y,a,s,d,r,c,sz=5,db=false,p=false,ex=false,rec=0,st=0,tr=false,sl=0){
                this.owner=o;this.team=o.team;this.x=x;this.y=y;this.dmg=d;this.range=r;this.color=c;this.size=sz;
                this.debuff=db;this.pierce=p;this.explo=ex;this.recoil=rec;this.stun=st;this.trail=tr;this.slow=sl;
                this.speed = s; this.angle = a;
                this.vx=Math.cos(a)*s;this.vy=Math.sin(a)*s;this.dist=0;this.del=false;this.hit=[];this.invisible=false;
                this.isBrick = false; this.isPizza = false; this.isArrow = false; this.onExplode = null; this.onHit = null; this.maxDistance = 9999; this.target = null; this.isHoming = false;
                this.skipInitialCollisionCheck = false;
                this.safeTime = 0; // seconds to ignore collisions after spawn
                this.explosionHandled = false;
                
                // Broadcast projectile to other online players if player created it
                if(gameMode === 'ffa_online' && o && o.isPlayer && onlineSocket) {
                    onlineSocket.emit('projectileFired', {
                        ownerName: o.name,
                        x: x, y: y,
                        angle: a,
                        speed: s,
                        damage: d,
                        range: r,
                        color: c,
                        size: sz,
                        pierce: p,
                        explode: ex,
                        invisible: !!this.invisible
                    });
                    // Handle server-relayed status/effect updates
                    onlineSocket.on('playerEffect', function(data) {
                        try {
                            console.log('🔔 playerEffect received', data);
                            if (!data || !data.socketId || !data.effect) return;
                            let eff = data.effect;
                            let proxy = entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === data.socketId);
                            if (proxy) {
                                proxy.applyStatus(eff.type, eff.value, null);
                            }
                            const myId = mySocketId || onlineSocket.id;
                            if (data.socketId === myId && player) {
                                player.applyStatus(eff.type, eff.value, null);
                            }
                        } catch (e) { console.warn('playerEffect handler error', e); }
                    });
                }
            }
            handleExplosion(){
                if (this.explosionHandled) return;
                this.explosionHandled = true;
                if (this.onExplode) this.onExplode();
                if (this.explo) this.explode();
            }

            update(dt){
                if (this.isHoming && this.target && !this.target.dead) {
                    let dx = this.target.x - this.x;
                    let dy = this.target.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 0) {
                        let targetAngle = Math.atan2(dy, dx);
                        let angleDiff = targetAngle - this.angle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        this.angle += angleDiff * 0.1;
                        this.vx = Math.cos(this.angle) * this.speed;
                        this.vy = Math.sin(this.angle) * this.speed;
                    }
                }
                if (this.isStormBall) {
                    if (this.explodeTimer > 0) {
                        this.explodeTimer = Math.max(0, this.explodeTimer - dt);
                        for (let i = 0; i < 2; i++) {
                            const ang = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x + Math.cos(ang) * 14, this.y + Math.sin(ang) * 14, '#d9ecff', 3, 0.2, Math.cos(ang) * 20, Math.sin(ang) * 20));
                        }
                        if (this.explodeTimer <= 0) {
                            this.del = true;
                            this.handleExplosion();
                        }
                        return;
                    }
                    if (!this.stoppedAtRange && this.dist >= (this.stormStopDistance || this.range * 0.7)) {
                        this.stoppedAtRange = true;
                        this.explodeTimer = this.explodeDelay || 0.55;
                        this.vx = 0;
                        this.vy = 0;
                        for (let i = 0; i < 14; i++) {
                            const ang = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, '#d9ecff', 5, 0.5, Math.cos(ang) * 120, Math.sin(ang) * 120));
                        }
                        return;
                    }
                }
                this.x+=this.vx*dt;this.y+=this.vy*dt;this.dist+=Math.sqrt(this.vx**2+this.vy**2)*dt;
                if (!this.isStormBall && (this.dist>=this.range || this.dist >= this.maxDistance)) { this.del=true; this.handleExplosion(); }
                if(this.trail) {
                    particles.push(new Particle(this.x, this.y, this.color, 1, 0.3));
                    particles.push(new Particle(this.x, this.y, this.color, 1, 0.3));
                }
                if (this.isProSniper) {
                    // stronger cyan trail + faint white streak for motion
                    particles.push(new Particle(this.x - this.vx * 0.02, this.y - this.vy * 0.02, '#00ffff', 2, 0.35));
                    particles.push(new Particle(this.x - this.vx * 0.04, this.y - this.vy * 0.04, '#ffffff', 0.8, 0.12));
                }
                if (this.isPizza) {
                    // Add fire particles
                    particles.push(new Particle(this.x, this.y, '#ff4500', 2, 0.5));
                }
                // Skip collision check on first frame for projectiles flagged (prevents instant collision)
                if (this.skipInitialCollisionCheck) {
                    this.skipInitialCollisionCheck = false;
                    return;
                }
                // Support a short safe time (seconds) where the projectile cannot collide
                if (this.safeTime && this.safeTime > 0) {
                    this.safeTime = Math.max(0, this.safeTime - dt);
                    if (this.safeTime > 0) return;
                    this.safeTime = 0;
                }
                for(let e of entities){
                    if(e===this.owner||e.dead||!(e instanceof Entity)||this.hit.includes(e))continue;
                    // skip non-targetable entities (realms, zone markers, etc.)
                    if (e.isTargetable === false) continue;
                    if(e.team === this.team) continue; 

                    if(Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<e.radius+this.size){
                        try {
                            const skipDefaultDamage = !!this.damageHandledByOnHit;
                            let dmgToApply = this.dmg;
                            if(this.owner.witherBuff && this.owner.witherBuffTimer > 0) dmgToApply += this.dmg * 0.1;
                            if (skipDefaultDamage) dmgToApply = 0;

                            // If this is a remote projectile that originated from another client,
                            // don't apply local HP changes to the local player — server is authoritative.
                            if (this.isRemote && e === player && gameMode && gameMode.includes('online')) {
                                this.hit.push(e);
                                console.log(`🎯 Remote projectile visually hit local player for ${dmgToApply} damage (server authoritative)`);
                                try { screenShake(4); } catch(_){ }
                                for (let i=0;i<4;i++) particles.push(new Particle(e.x,e.y,'#ff6666',2,0.4));
                            } else {
                                // pass meta so local/training hits from Pro‑Sniper projectiles are detected correctly
                                if (this.isProSniper) console.log(`[Projectile] ProSniper hit owner=${this.owner && this.owner.name} dmgToApply=${dmgToApply}`);
                                // Defensive: some entities may not implement takeDamage (proxies or misc objects)
                                if (!skipDefaultDamage && typeof e.takeDamage === 'function') {
                                    e.takeDamage(dmgToApply, this.owner, { isProSniper: !!this.isProSniper });
                                } else if (!skipDefaultDamage && typeof e.hp === 'number') {
                                    e.hp -= dmgToApply;
                                    if (e.hp <= 0 && typeof e.die === 'function') e.die(this.owner);
                                }
                                this.hit.push(e);
                                console.log(`🎯 Projectile hit ${e.name || 'entity'} for ${dmgToApply} damage`);



                                // Broadcast damage to server for authoritative HP sync
                                if(gameMode && gameMode.includes('online') && onlineSocket) {
                                    try {
                                        if(e === player) {
                                            onlineSocket.emit('playerDamaged', {
                                                socketId: player.socketId || mySocketId || onlineSocket.id,
                                                damageTaken: dmgToApply,
                                                damageDealer: this.owner && this.owner.name ? this.owner.name : 'Player',
                                                attackerSocketId: mySocketId || onlineSocket.id,
                                                isProSniper: !!this.isProSniper
                                            });
                                        } else if(e instanceof OnlinePlayerProxy) {
                                            if (!this.isRemote) {
                                                onlineSocket.emit('playerDamaged', {
                                                    socketId: e.socketId,
                                                    damageTaken: dmgToApply,
                                                    damageDealer: player.name || 'Local Player',
                                                    attackerSocketId: mySocketId || onlineSocket.id,
                                                    isProSniper: !!this.isProSniper
                                                });
                                            }
                                        }
                                    } catch(broadcastErr) {
                                        console.warn('Damage broadcast failed:', broadcastErr);
                                    }
                                }
                            }
                        } catch(hitErr) {
                            console.warn('Projectile hit error:', hitErr);
                        }
                        
                        // Handle Melvin basic attack burn
                        if(this.melvinBasic) {
                            e.applyStatus('burnTimer', Math.max(e.burnTimer || 0, 2), this.owner || this);
                            e.burnDamagePerSec = 50;
                        }
                        
                        // Handle Melvin Q ability - create pedal on hit
                        if(this.melvinQ && this.onHit) {
                            this.onHit(e);
                        }
                        
                        if(this.onHit && !this.melvinQ) this.onHit(e);
                        if(this.isBasketball && this.owner.isPlayer) addKillMsg('DAYUM!');
                        if(this.stun>0) e.applyStatus('stun', this.stun, this.owner || this);
                        if(this.slow>0) e.applyStatus('slow', this.slow, this.owner || this);
                        if(this.isBrick) e.applyStatus('slow', 3, this.owner || this);
                        if(this.debuff && e.debuffImmuneTimer<=0) e.applyStatus('defDebuff', 5.0, this.owner || this);
                        // Handle Neo's hook pull
                        if(this.isPullHook && this.hookCaster) {
                            let dx = e.x - this.hookCaster.x, dy = e.y - this.hookCaster.y, d = Math.sqrt(dx*dx + dy*dy);
                            let pull = Math.min(d, 150);
                            let angle = Math.atan2(dy, dx);
                            e.x -= Math.cos(angle) * pull;
                            e.y -= Math.sin(angle) * pull;
                            // Broadcast pull effect to remote players if this entity is a proxy
                            if (gameMode === 'ffa_online' && e instanceof OnlinePlayerProxy && this.hookCaster && this.hookCaster.isPlayer && typeof onlineSocket !== 'undefined' && onlineSocket) {
                                onlineSocket.emit('playerEffect', {
                                    socketId: e.socketId,
                                    effect: { type: 'pull', value: { dx: -Math.cos(angle) * pull, dy: -Math.sin(angle) * pull } },
                                    attackerSocketId: mySocketId || (onlineSocket && onlineSocket.id) || null
                                });
                            }
                            if(this.blockDuration) e.applyStatus('stun', this.blockDuration, this.hookCaster || this.owner || this);
                        }
                        if(this.recoil!==0&&this.owner&&!this.owner.dead){
                            if(this.recoil>0){this.owner.takeDamage(this.recoil,null);particles.push(new Particle(this.owner.x,this.owner.y,'#f00',2,0.5));}
                            else{this.owner.hp=Math.min(this.owner.maxHp,this.owner.hp-this.recoil);particles.push(new Particle(this.owner.x,this.owner.y,'#0f0',2,0.5));if(this.owner.isPlayer)addKillMsg(`Healed +${-this.recoil}`);}
                        }
                        if(this.owner instanceof Kaiser&&this.pierce)this.owner.qCD=Math.max(0,this.owner.qCD-2);
                        if (this.isStormBall) {
                            this.vx = 0;
                            this.vy = 0;
                            this.stoppedAtRange = true;
                            this.explodeTimer = this.explodeDelay || 0.55;
                            this.hit.push(e);
                            break;
                        }
                        this.handleExplosion();
                        if(this.explo){this.del=true;}else if(!this.pierce)this.del=true;
                        if (this.isProSniper) {
                            for (let i=0;i<12;i++) particles.push(new Particle(this.x,this.y,'#00ffff',4,1.0));
                            try { if (this.owner && this.owner.isPlayer) screenShake(10); } catch(_){ }
                        } else {
                            for(let i=0;i<3;i++)particles.push(new Particle(this.x,this.y,e.color,2,0.5));
                        }
                        if(!this.pierce)break; 
                    }
                }
            }
            explode(){
                for(let i=0;i<20;i++)particles.push(new Particle(this.x,this.y,'#fa0',6,0.8));
                for(let e of entities){
                    if(e===this.owner||e.dead||!(e instanceof Entity))continue;
                    if(e.team === this.team) continue;
                    if(Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<150){
                        let dmgToApply = this.dmg*0.5;
                        if(this.owner.witherBuff && this.owner.witherBuffTimer > 0) dmgToApply += this.dmg * 0.05; // 10% extra true damage on half damage
                        e.takeDamage(dmgToApply,this.owner);e.revealTimer=1.0;
                        if(this.stun>0)e.stunTimer=this.stun;
                    }
                }
                if(this.owner&&this.owner.isPlayer)screenShake(8);
            }
            draw(ctx){
                // invisibility support: allow a special 'ownerOnly' value so projectiles
                // can be visible to their owner but invisible to others (used by Regera).
                if (this.invisible) {
                    if (this.invisible === true) return;
                    if (this.invisible === 'ownerOnly') {
                        // only draw if the owner is the local player
                        if (!(this.owner && this.owner.isPlayer && this.owner === player)) return;
                    }
                }
                // Chicken wing shape for basic attack
                if (this.isChickenWing) {
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.angle);
                    
                    // Wing body - curved teardrop shape pointing forward
                    ctx.fillStyle = '#ff8c00'; // bright orange for fried chicken
                    ctx.beginPath();
                    // Main ellipse body
                    ctx.ellipse(this.size * 0.3, 0, this.size * 1.1, this.size * 0.65, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Wing texture - feather-like lines
                    ctx.strokeStyle = '#ff6600';
                    ctx.lineWidth = Math.max(1, this.size * 0.15);
                    for(let i = -1; i <= 1; i++) {
                        ctx.beginPath();
                        ctx.moveTo(-this.size * 0.4, i * this.size * 0.25);
                        ctx.quadraticCurveTo(0, i * this.size * 0.4, this.size * 0.7, i * this.size * 0.15);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                    return;
                } 
                // Chicken leg shape for Q ability (fireArrows)
                else if (this.isChickenLeg) {
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.angle);
                    
                    // Leg body - segmented cylinder, oriented HORIZONTALLY (pointing forward)
                    ctx.fillStyle = '#cd853f'; // peru/tan for chicken leg
                    
                    // Upper leg segment (thicker) - on x-axis
                    ctx.beginPath();
                    ctx.ellipse(this.size * 0.2, 0, this.size * 0.8, this.size * 0.5, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Lower leg segment (slightly thinner) - continuation
                    ctx.beginPath();
                    ctx.ellipse(this.size * 0.8, 0, this.size * 0.7, this.size * 0.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Joint separation (darker brown line)
                    ctx.strokeStyle = '#8b6914';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.ellipse(this.size * 0.5, 0, this.size * 0.3, this.size * 0.45, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Claw/foot at the end
                    ctx.fillStyle = '#a0522d'; // darker brown
                    for(let i = 0; i < 3; i++) {
                        let clawAngle = (i - 1) * 0.4;
                        ctx.beginPath();
                        ctx.arc(
                            this.size * 1.4 + Math.cos(clawAngle) * this.size * 0.2,
                            Math.sin(clawAngle) * this.size * 0.3,
                            this.size * 0.2,
                            0,
                            Math.PI * 2
                        );
                        ctx.fill();
                    }
                    
                    ctx.restore();
                    return;
                } 
                // Spirit bomb - roasted chicken
                else if (this.isChicken && this.isBomb) {
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    let imageDrawn = false;
                    
                    // Try to draw chicken image first
                    if (chickenImg && chickenImg.complete) {
                        try {
                            ctx.drawImage(chickenImg, x - this.size * 1.2, y - this.size * 1.5, this.size * 2.4, this.size * 3);
                            imageDrawn = true;
                        } catch(e) {
                            console.log('Chicken image draw failed:', e);
                        }
                    }
                    
                    // If image wasn't drawn, draw fallback roasted chicken shape
                    if (!imageDrawn) {
                        ctx.save();
                        ctx.translate(x, y);
                        
                        // Main body (roasted brown)
                        ctx.fillStyle = '#d2691e'; // dark brown for roasted chicken
                        ctx.beginPath();
                        ctx.ellipse(0, 0, this.size * 1.3, this.size * 1.6, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Lighter chest/belly area
                        ctx.fillStyle = '#cd853f'; // lighter brown
                        ctx.beginPath();
                        ctx.ellipse(0, -this.size * 0.3, this.size * 0.9, this.size * 1.0, 0, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Shine/highlight (golden)
                        ctx.fillStyle = '#e8a76f';
                        ctx.beginPath();
                        ctx.arc(-this.size * 0.4, -this.size * 0.8, this.size * 0.35, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Small second shine
                        ctx.fillStyle = 'rgba(232, 167, 111, 0.6)';
                        ctx.beginPath();
                        ctx.arc(this.size * 0.3, this.size * 0.4, this.size * 0.2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        ctx.restore();
                    }
                    return;
                }

                if (this.isSickle) {
                    // draw a crescent / sickle-shaped tracer
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.angle + Math.PI/2);
                    // outer arc (sickle)
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = Math.max(6, this.size * 1.8);
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 2.2, -Math.PI * 0.6, Math.PI * 0.6);
                    ctx.stroke();
                    // inner cut (thin darker arc to imply blade)
                    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
                    ctx.lineWidth = Math.max(2, this.size * 0.9);
                    ctx.beginPath();
                    ctx.arc(this.size * 0.25, 0, this.size * 1.55, -Math.PI * 0.55, Math.PI * 0.55);
                    ctx.stroke();
                    ctx.restore();
                } else if (this.isPizza) {
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    let size = this.size;
                    ctx.moveTo(x, y - size);
                    ctx.lineTo(x - size * 0.866, y + size * 0.5);
                    ctx.lineTo(x + size * 0.866, y + size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                } else if (this.isBrick) {
                    ctx.fillStyle = this.color;
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    let size = this.size * 1.5; // Make it a bit bigger
                    ctx.fillRect(x - size, y - size, size * 2, size * 2);
                } else if (this.isSword) {
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.angle);
                    ctx.fillStyle = '#f7d674';
                    ctx.beginPath();
                    ctx.moveTo(this.size * 1.8, 0);
                    ctx.lineTo(this.size * 0.1, -this.size * 0.5);
                    ctx.lineTo(-this.size * 0.8, -this.size * 0.18);
                    ctx.lineTo(-this.size * 0.8, this.size * 0.18);
                    ctx.lineTo(this.size * 0.1, this.size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#c28818';
                    ctx.fillRect(-this.size * 0.85, -this.size * 0.12, this.size * 0.8, this.size * 0.24);
                    ctx.fillStyle = '#f5f1d0';
                    ctx.fillRect(this.size * 0.1, -this.size * 0.18, this.size * 0.9, this.size * 0.36);
                    ctx.restore();
                } else if (this.isSquare) {
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    let s = this.size || 12;
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.angle || 0);
                    ctx.shadowColor = this.color || '#ff6b6b';
                    ctx.shadowBlur = 18;
                    ctx.fillStyle = this.color || '#ff6b6b';
                    ctx.fillRect(-s, -s, s * 2, s * 2);
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = 'rgba(255,245,220,0.9)';
                    ctx.fillRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
                    ctx.strokeStyle = '#fff4d5';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(-s, -s, s * 2, s * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
                    ctx.restore();
                } else if (this.isArrow) {
                    ctx.save();
                    ctx.translate(this.x - camera.x, this.y - camera.y);
                    ctx.rotate(this.angle);
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.moveTo(this.size, 0);
                    ctx.lineTo(-this.size * 0.5, -this.size * 0.5);
                    ctx.lineTo(0, 0);
                    ctx.lineTo(-this.size * 0.5, this.size * 0.5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                } else if (this.isHexagon) {
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    let size = this.size;
                    for (let i = 0; i < 6; i++) {
                        let angle = (Math.PI / 3) * i;
                        let px = x + size * Math.cos(angle);
                        let py = y + size * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                } else if (this.isTire) {
                    // Draw tire with circular outline
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                } else if (this.color === '#00CED1') {
                    // Aurora's cyan projectile - with glow effect
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    
                    // Outer glow
                    ctx.fillStyle = 'rgba(0, 206, 209, 0.3)';
                    ctx.beginPath();
                    ctx.arc(x, y, this.size * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Middle glow
                    ctx.fillStyle = 'rgba(0, 206, 209, 0.6)';
                    ctx.beginPath();
                    ctx.arc(x, y, this.size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Core
                    ctx.fillStyle = '#00FFF0';
                    ctx.beginPath();
                    ctx.arc(x, y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Bright center
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(x, y, this.size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.isProSniper) {
                    // Pro-sniper tracer (elongated glow + bright core)
                    let x = this.x - camera.x;
                    let y = this.y - camera.y;
                    let len = Math.max(80, this.size * 3);
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(this.angle);

                    // soft outer glow
                    ctx.fillStyle = 'rgba(0,255,204,0.12)';
                    ctx.beginPath();
                    ctx.ellipse(-len*0.25, 0, len*0.9, this.size * 2.2, 0, 0, Math.PI * 2);
                    ctx.fill();

                    // core streak (linear gradient along length)
                    let grad = ctx.createLinearGradient(-len*0.6, 0, len*0.6, 0);
                    grad.addColorStop(0, 'rgba(0,255,255,0)');
                    grad.addColorStop(0.45, '#00ffff');
                    grad.addColorStop(0.9, 'rgba(255,255,255,0.9)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.rect(-len*0.6, -this.size*0.9, len*1.2, this.size*1.8);
                    ctx.fill();

                    // bright core
                    ctx.fillStyle = '#e6ffff';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size*0.95, 0, Math.PI * 2);
                    ctx.fill();

                    // front flare
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.beginPath();
                    ctx.ellipse(len*0.45, 0, this.size*0.6, this.size*0.3, 0, 0, Math.PI*2);
                    ctx.fill();

                    ctx.restore();
                } else {
                    ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.size,0,Math.PI*2);ctx.fill();
                }
            }
        }

        // Wind projectile: ribbon-like projectile with elongated, swooping visual
        class WindProjectile {
            constructor(owner, x, y, angle, speed, range, dmg, color='#aee7ff', width=14) {
                this.owner = owner; this.team = owner.team; this.x = x; this.y = y; this.angle = angle;
                this.speed = speed; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
                this.range = range || 800; this.dmg = dmg || 150; this.color = color; this.width = width;
                this.dist = 0; this.del = false; this.hit = [];
                this.trailTimer = 0;
                this.onHitEnemy = null; // Callback when hitting an enemy (receives enemy)
            }
            update(dt) {
                this.x += this.vx * dt; this.y += this.vy * dt;
                this.dist += this.speed * dt;
                this.trailTimer -= dt;
                if (this.trailTimer <= 0) { particles.push(new Particle(this.x - this.vx*0.02, this.y - this.vy*0.02, this.color, 2, 0.45)); this.trailTimer = 0.03; }

                // collision with entities
                for (let e of entities) {
                    if (e === this.owner || e.dead || !(e instanceof Entity) || this.hit.includes(e)) continue;
                    if (e.team === this.team) continue;
                    // approximate wide hit by distance to centerline
                    let dx = e.x - this.x, dy = e.y - this.y;
                    let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < e.radius + Math.max(6, this.width/2)) {
                        try {
                            if (typeof e.takeDamage === 'function') e.takeDamage(this.dmg, this.owner);
                            else e.hp -= this.dmg;
                        } catch(_){}
                        this.hit.push(e);
                        // Call hit callback if exists (pass enemy)
                        if (typeof this.onHitEnemy === 'function') this.onHitEnemy(e);
                    }
                }

                if (this.dist >= this.range) this.del = true;
            }
            draw(ctx) {
                // draw ribbon: two bezier curves to approximate wind gust
                ctx.save();
                let sx = this.x - camera.x, sy = this.y - camera.y;
                ctx.translate(sx, sy);
                ctx.rotate(this.angle);
                ctx.globalAlpha = 0.85;
                // ribbon gradient
                let g = ctx.createLinearGradient(-this.width*2, 0, this.width*2, 0);
                g.addColorStop(0, 'rgba(255,255,255,0)');
                g.addColorStop(0.3, this.color);
                g.addColorStop(0.7, this.color);
                g.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.moveTo(-this.range*0.02, -this.width/2);
                ctx.bezierCurveTo(this.range*0.06, -this.width*1.2, this.range*0.2, -this.width*0.6, this.range*0.4, -this.width/3);
                ctx.lineTo(this.range*0.4, this.width/3);
                ctx.bezierCurveTo(this.range*0.2, this.width*0.6, this.range*0.06, this.width*1.2, -this.range*0.02, this.width/2);
                ctx.closePath(); ctx.fill();
                ctx.globalAlpha = 1.0; ctx.restore();
            }
        }

        // Bag projectile: circular bag that pierces and can apply on-hit effects to the specific enemy
        class BagProjectile extends WindProjectile {
            constructor(owner, x, y, angle, speed, range, dmg, color='#ffd700', size=10) {
                super(owner, x, y, angle, speed, range, dmg, color, Math.max(8, size));
                this.size = size;
            }
            draw(ctx) {
                let x = this.x - camera.x, y = this.y - camera.y;
                // bag core
                ctx.fillStyle = this.color;
                ctx.beginPath(); ctx.ellipse(x, y, this.size * 1.0, this.size * 0.85, 0, 0, Math.PI*2); ctx.fill();
                // strap
                ctx.strokeStyle = '#8b5a00'; ctx.lineWidth = Math.max(2, this.size*0.2);
                ctx.beginPath(); ctx.moveTo(x - this.size*0.5, y - this.size*0.6); ctx.quadraticCurveTo(x, y - this.size*1.3, x + this.size*0.5, y - this.size*0.6); ctx.stroke();
                // highlights
                ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(x - this.size*0.25, y - this.size*0.1, this.size*0.35, this.size*0.2, -0.4, 0, Math.PI*2); ctx.fill();
            }
        }

        class EnergyBall {
            constructor(owner, x, y, angle) {
                this.owner = owner;
                this.x = x;
                this.y = y;
                this.angle = angle;
                this.speed = 300;
                this.del = false;
                this.distance = 0;
                this.maxDistance = 1000;
                this.hit = false;
                this.damage = 350;
                this.boomTriggered = false;
            }
            triggerMagicalBoom() {
                if (this.boomTriggered) return;
                this.boomTriggered = true;
                for (let e of entities) {
                    if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 140) {
                        e.takeDamage(600, this.owner);
                        if (typeof e.applyStatus === 'function') e.applyStatus('slowness', 1.8, this.owner);
                        if (typeof e.slowTimer === 'number') e.slowTimer = Math.max(e.slowTimer || 0, 1.8);
                    }
                }
                for (let i = 0; i < 24; i++) {
                    let ang = (Math.PI * 2 * i) / 24;
                    let rad = 18 + Math.random() * 30;
                    particles.push(new Particle(this.x + Math.cos(ang) * rad, this.y + Math.sin(ang) * rad, '#9b59b6', 7, 1.1));
                }
                visualEffects.push(new EnergyWave(this.x, this.y, '#9b59b6', 160, 0.9));
            }
            update(dt) {
                if (this.del) return;
                this.x += Math.cos(this.angle) * this.speed * dt;
                this.y += Math.sin(this.angle) * this.speed * dt;
                this.distance += this.speed * dt;
                if (this.distance >= this.maxDistance) {
                    this.explode();
                    this.del = true;
                }
                if (this.owner && Array.isArray(this.owner.inkPens)) {
                    for (let pen of this.owner.inkPens) {
                        if (!pen.del && !pen.boomTriggered && Math.hypot(this.x - pen.x, this.y - pen.y) < 60) {
                            pen.boomTriggered = true;
                            this.triggerMagicalBoom();
                            this.hit = true;
                            return;
                        }
                    }
                }
                for (let e of entities) {
                    if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 20) {
                        e.takeDamage(this.damage, this.owner);
                        this.del = true;
                        this.hit = true;
                        break;
                    }
                }
            }
            explode() {
                if (this.hit || this.boomTriggered) return;
                for (let e of entities) {
                    if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 100) {
                        e.takeDamage(this.damage, this.owner);
                    }
                }
                for (let i = 0; i < 10; i++) particles.push(new Particle(this.x, this.y, '#fa0', 4, 0.8));
            }
            draw(ctx) {
                if (this.del) return;
                ctx.fillStyle = '#fa0';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class InkPen {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.del = false;
                this.timer = 10.0; // longer time
                this.owner = null;
                this.hitEnemies = new Set();
            }
            update(dt) {
                this.timer -= dt;
                if (this.timer <= 0) {
                    this.del = true;
                    return;
                }
                if (this.owner) {
                    let dx = this.owner.x - this.x;
                    let dy = this.owner.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 20) {
                        let speed = 300;
                        this.x += (dx / dist) * speed * dt;
                        this.y += (dy / dist) * speed * dt;
                    } else {
                        this.del = true;
                        return;
                    }
                }
                if (this.owner && Array.isArray(this.owner.energyBalls)) {
                    for (let ball of this.owner.energyBalls) {
                        if (!ball.del && !ball.boomTriggered && Math.hypot(this.x - ball.x, this.y - ball.y) < 60) {
                            ball.boomTriggered = true;
                            ball.triggerMagicalBoom();
                            return;
                        }
                    }
                }
                for (let e of entities) {
                    if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 50 && !this.hitEnemies.has(e)) {
                        this.hitEnemies.add(e);
                        e.takeDamage(600, this.owner);
                        e.slowTimer = 3;
                    }
                }
            }
            draw(ctx) {
                if (this.del) return;
                ctx.fillStyle = '#fff';
                ctx.fillRect(this.x - camera.x - 10, this.y - camera.y - 20, 20, 40);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.strokeRect(this.x - camera.x - 10, this.y - camera.y - 20, 20, 40);
            }
        }

        class Blackhole {
            constructor(owner, x, y) {
                this.owner = owner;
                this.x = x;
                this.y = y;
                this.timer = 3.0;
                this.del = false;
                this.hitEnemies = new Set();
            }
            update(dt) {
                this.timer -= dt;
                if (this.timer <= 0) {
                    this.del = true;
                    return;
                }
                // Continuous pull for all enemies in range
                for (let e of entities) {
                    if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 300) {
                        // pull towards center (very strong continuous pull)
                        let dx = this.x - e.x;
                        let dy = this.y - e.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist > 0) {
                            e.x += (dx / dist) * 150 * dt;
                            e.y += (dy / dist) * 150 * dt;
                            // Broadcast pull effect to remote players if this entity is a proxy
                            if (gameMode === 'ffa_online' && e instanceof OnlinePlayerProxy && this.owner.isPlayer && typeof onlineSocket !== 'undefined' && onlineSocket) {
                                onlineSocket.emit('playerEffect', {
                                    socketId: e.socketId,
                                    effect: { type: 'pull', value: { dx: (dx / dist) * 150, dy: (dy / dist) * 150 } },
                                    attackerSocketId: mySocketId || (onlineSocket && onlineSocket.id) || null
                                });
                            }
                        }
                    }
                }
                let interval = 0.1;
                if (Math.floor((this.timer + dt) / interval) > Math.floor(this.timer / interval)) {
                    for (let e of entities) {
                        if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 300) {
                            e.takeDamage(30, this.owner);
                            if (!this.hitEnemies.has(e)) {
                                this.hitEnemies.add(e);
                                e.defDebuff = 5.0; // 5 seconds of defense debuff
                            }
                        }
                    }
                }
            }
            draw(ctx) {
                if (this.del) return;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 100, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#800';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        class Entity {
            constructor(x,y,r,c,hp){
                this.id = globalEntityID++;
                this.team = this.id;
                this.x=x;this.y=y;this.radius=r;this.color=c;this.maxHp=hp;this.hp=hp;this.shield=0;
                this.dead=false;this.speed=150;this.angle=0;this.isPlayer=false;this.name="Bot";this.kills=0;
                this.deaths=0;this.assists=0;
                this.totalDamage = 0; // total damage dealt by this entity
                this.totalDamageTaken = 0; // total damage taken by this entity
                this.bush=null;this.revealTimer=0;this.dmgMult=1.0;this.defDebuff=0;this.stunTimer=0;
                this.slowTimer=0; this.freezeTimer=0; this.kbx=0; this.kby=0;
                this.damageContributors=new Map();this.lastDamageTime=0;
                this.debuffImmuneTimer = 0; // when >0 incoming debuffs are ignored
                this.injuredTimer = 0; // injured status: takes extra true damage
                this.invulnerableTimer = 0; // when >0 entity takes no damage
                this.resistanceBoostTimer = 0; this.resistanceBoost = 0.20;
                this.damagePenetrationBoostTimer = 0; this.damagePenetrationBoost = 0.20;
                this.isTargetable = true;
                this.enhancedKBTimer = 0; // movement-locked during enhanced knockback (not a stun)
                this.defenseBuffTimer = 0; // when >0 reduce incoming damage
                this.hallucinationTimer = 0; // when >0 causes random movement
                this.stunImmuneTimer = 0; // brief immunity to stun-only debuffs
                this.burnTimer = 0;
                this.lastBurnTick = 0;
                this.burnOwner = null;
                this.attackLockoutTimer = 0; // brief window where the target cannot attack

                // Apollo Q: sun-marked fire DOT
                this.apolloFireTimer = 0;
                this.lastApolloFireTick = 0;
                this.apolloFireOwner = null;

                this.trueDmgBuff = 0;
                this.gear = 'speedster'; this.rCD=0; this.rageTimer=0; this.speedsterTimer=0; this.bandageTimer=0;
                this.witherBuff = false; this.witherBuffTimer = 0; this.witherBuffMaxShield = 0;
                this.teleportWindup = 0; this.teleportTarget = null; this.pendingQTeleportDeferred = false; // defer Q teleport until out of JusticeRealm if scheduled inside one
                // Realm isolation support
                this.inRealm = false;
                this.realmTimer = 0;
                this.realmId = null;
                this.realmReturnPos = null;

                // default for plain Entity instances (e.g. decoys) so the guard doesn't fire
                this.countsAsFFAHero = false;

                const specializedAI = this.ai;
                this.ai = (dt, spd) => {
                    if (typeof specializedAI !== 'function' || specializedAI === this.ai) {
                        return Entity.prototype.ai.call(this, dt, spd);
                    }
                    const beforeX = this.x;
                    const beforeY = this.y;
                    const beforeBasicCD = this.basicCD;
                    const beforeQCD = this.qCD;
                    const beforeECD = this.eCD;
                    const beforeFCD = this.fCD;
                    const beforeGCD = this.gCD;
                    const beforeEntityCount = entities.length;
                    try {
                        specializedAI.call(this, dt, spd);
                    } catch (error) {
                        console.warn(`AI fallback for ${this.constructor.name}:`, error);
                    }
                    const usedAbility = this.basicCD !== beforeBasicCD || this.qCD !== beforeQCD ||
                        this.eCD !== beforeECD || this.fCD !== beforeFCD ||
                        this.gCD !== beforeGCD || entities.length !== beforeEntityCount;
                    if (!usedAbility && !this.dead) Entity.prototype.ai.call(this, dt, spd);
                };

                // Developer guard: every Entity subclass must explicitly set `this.countsAsFFAHero = true|false` in its constructor.
                // If a subclass forgets, warn at runtime (keeps backward-compatible heuristic as fallback).
                setTimeout(() => {
                    if (typeof this.countsAsFFAHero !== 'boolean') {
                        console.warn(`[FFAHeroFlag] '${this.constructor.name}' did not set countsAsFFAHero — add "this.countsAsFFAHero = true|false" to the constructor for future-proofing.`);
                    }
                }, 0);
            }
            applyStatus(type, value, src) {
                // Realm guard: if a source is provided and the source/target are in different realm states, ignore
                if (src && ((!!src.inRealm) !== (!!this.inRealm))) {
                    // allow applyStatus when src is null or both in same realm state only
                    return;
                }
                if (src && src.inRealm && this.inRealm && src.realmId && this.realmId && src.realmId !== this.realmId) {
                    return; // different realms
                }

                // Generic status applier used to broadcast effects in online FFA
                if (type === 'stun') {
                    if (this.stunImmuneTimer > 0) return;
                    // electrico stun buff: ensure electrico stuns are at least 0.4s
                    if (src && src.gear === 'electrico') value = Math.max(Number(value) || 0, 0.4);
                    if (typeof this.stunResistance === 'number' && this.stunResistance > 0) {
                        value = Math.max(0, Number(value) || 0) * (1 - this.stunResistance);
                    }
                    this.stunTimer = Math.max(this.stunTimer || 0, Number(value) || 0);
                } else if (type === 'freeze') {
                    this.freezeTimer = Math.max(this.freezeTimer || 0, Number(value) || 0);
                } else if (type === 'reveal') {
                    this.revealTimer = Math.max(this.revealTimer || 0, Number(value) || 0);
                } else if (type === 'knockback') {
                    // value expected {x: vx, y: vy}
                    if (value && typeof value.x === 'number') this.kbx = (this.kbx || 0) + value.x;
                    if (value && typeof value.y === 'number') this.kby = (this.kby || 0) + value.y;
                } else if (type === 'pull') {
                    // Pull is an immediate position change
                    if (value && typeof value.dx === 'number') this.x += value.dx;
                    if (value && typeof value.dy === 'number') this.y += value.dy;
                } else if (type === 'slow') {
                    this.slowTimer = Math.max(this.slowTimer || 0, Number(value) || 0);
                } else if (type === 'defDebuff') {
                    this.defDebuff = Math.max(this.defDebuff || 0, Number(value) || 0);
                } else if (type === 'injure') {
                    this.injuredTimer = Math.max(this.injuredTimer || 0, Number(value) || 0);
                } else {
                    // Fallback: set property directly if exists
                    try { this[type] = value; } catch(_){}
                }

                // If this is a remote proxy and the source is the local player, notify server
                try {
                    if (gameMode === 'ffa_online' && this instanceof OnlinePlayerProxy && src && src === player && typeof onlineSocket !== 'undefined' && onlineSocket) {
                        onlineSocket.emit('playerEffect', {
                            socketId: this.socketId,
                            effect: { type: type, value: value },
                            attackerSocketId: mySocketId || (onlineSocket && onlineSocket.id) || null
                        });
                    }
                } catch (e) { console.warn('applyStatus emit failed', e); }
            }
            takeDamage(amt, src, meta){
                if(this.dead) return;
                // invincibility window (used by dash)
                if(this.invincibleTimer && this.invincibleTimer > 0) return;
                // Floating ult: immune to damage while floatingTimer active (stuns still allowed)
                if(this.floatingTimer && this.floatingTimer > 0) return;
                // Realm isolation: if either party is in a realm, allow damage only when both are in the SAME realm
                if ((src && src.inRealm) || this.inRealm) {
                    if (!(src && src.inRealm && this.inRealm && src.realmId && this.realmId && src.realmId === this.realmId)) {
                        // Damage attempted from outside the realm or across different realms — ignore
                        return;
                    }
                }
                
                // Track damage in training mode (start counter only; totalDamage updated after final damage calculation)
                if(gameMode === 'training' && src && src.isPlayer && window.trainingStats) {
                    // Start counter on first hit
                    if(!window.trainingStats.countingStarted) {
                        window.trainingStats.countingStarted = true;
                        window.trainingStats.startTime = Date.now();
                    }
                    // NOTE: increment of totalDamage happens after final damage (`d`) is computed so the training display matches what actually hit the target
                }
                
                // Check if Mamba is in helicopter mode - if hit, helicopter disappears
                if(this instanceof Mamba && this.helicopterActive){
                    this.helicopterTimer = 0;
                    this.helicopterActive = false;
                    return; // No damage taken while helicopter active
                }
                // Check invulnerability (only applies during E windup now)
                if(this.invulnerableTimer>0) return;
                
                // Track damage contributors for assists (store amount + timestamp so assist windows work correctly)
                // Record only enemy contributors (we want attackers who damaged this entity)
                if(src && src instanceof Entity && src !== this && src.team !== this.team) {
                    if(!this.damageContributors) this.damageContributors = new Map();
                    const existing = this.damageContributors.get(src) || { amount: 0, time: 0 };
                    existing.amount = (existing.amount || 0) + amt;
                    existing.time = Date.now();
                    this.damageContributors.set(src, existing);
                    this.lastDamageTime = Date.now();
                }
                
                // Factor in attacker multipliers (gear/rage/etc.) and defender multipliers
                let attackerMult = 1.0;
                if (src) {
                    if (typeof src.getDamageMult === 'function') {
                        try { attackerMult *= src.getDamageMult(); } catch (e) { }
                    }
                    if (typeof src.dmgMult === 'number') attackerMult *= src.dmgMult;
                }

                let d = amt * attackerMult * this.dmgMult;

                // Apply defense / realm reductions, but let attacker penetration reduce their effect
                let penetration = src && typeof src.penetration === 'number' ? src.penetration : 0;
                let bonusPenetration = src && src.damagePenetrationBoostTimer > 0 && typeof src.damagePenetrationBoost === 'number' ? src.damagePenetrationBoost : 0;
                let totalPenetration = penetration + bonusPenetration;
                if (this.resistanceBoostTimer > 0) {
                    d *= (1 - this.resistanceBoost);
                }
                if (this.defenseBuffTimer > 0) {
                    let effectiveReduction = 0.20 * Math.max(0, 1 - totalPenetration);
                    d *= (1 - effectiveReduction);
                }
                if (this.inRealm) {
                    let effectiveReduction = 0.25 * Math.max(0, 1 - totalPenetration);
                    d *= (1 - effectiveReduction);
                }
                if (this instanceof Nos && this.inNightmareField) d *= 0.75;

                // Client/training: enforce Pro‑Sniper floor — ensure final damage shown/applied is at least 1500
                if ((meta && meta.isProSniper) || (src && src.isProSniper)) {
                    console.log(`[ProSniper - takeDamage] amt=${amt} src=${src && src.name} srcIsPro=${!!(src && src.isProSniper)} metaIsPro=${!!(meta && meta.isProSniper)} preMult=${amt * this.dmgMult} postMult_beforeFloor=${d}`);
                    d = Math.max(d, 1500);
                    console.log(`[ProSniper - takeDamage] floored_final=${d}`);
                }

                // Update training stats using the post-multiplier final damage so training counters match the popup
                if (gameMode === 'training' && src && src.isPlayer && window.trainingStats) {
                    if(!window.trainingStats.countingStarted) { window.trainingStats.countingStarted = true; window.trainingStats.startTime = Date.now(); }
                    window.trainingStats.totalDamage += Math.ceil(Math.max(d, 0));
                }

                // Track total damage dealt by the attacker (integer, no decimals)
                if (src && src instanceof Entity && src !== this) {
                    src.totalDamage = (src.totalDamage || 0) + Math.ceil(Math.max(d, 0));
                }

                let shieldAbsorbed = 0;
                if(this.shield>0){ 
                    shieldAbsorbed = Math.min(this.shield, d);
                    this.shield -= shieldAbsorbed;
                    d = Math.max(0, d - shieldAbsorbed);
                }
                // Record shield damage as damage taken too so it still counts for defensive metrics
                const damageTakenTotal = Math.ceil(Math.max(Math.max(shieldAbsorbed, 0) + Math.max(d, 0), 0));
                this.totalDamageTaken = (this.totalDamageTaken || 0) + damageTakenTotal;
                this.hp -= d;
                if (src && src.witherBuff && src.witherBuffTimer > 0) {
                    let witherTrue = d * 0.10;
                    this.hp -= witherTrue;
                    this.totalDamageTaken = (this.totalDamageTaken || 0) + Math.ceil(Math.max(witherTrue, 0));
                    if (gameMode === 'training' && src.isPlayer && window.trainingStats) {
                        window.trainingStats.totalDamage += Math.ceil(Math.max(witherTrue, 0));
                    }
                    if (src instanceof Entity) {
                        src.totalDamage = (src.totalDamage || 0) + Math.ceil(Math.max(witherTrue, 0));
                    }
                }
                // Injured: take extra 10% true damage (bypasses shield)
                if(this.injuredTimer>0) {
                    let extraTrue = amt * 0.10;
                    this.hp -= extraTrue;
                    this.totalDamageTaken = (this.totalDamageTaken || 0) + Math.ceil(Math.max(extraTrue, 0));
                    // If in training mode or accounting for attacker totals, include this extra true damage
                    if (gameMode === 'training' && src && src.isPlayer && window.trainingStats) {
                        window.trainingStats.totalDamage += Math.ceil(Math.max(extraTrue, 0));
                    }
                    if (src && src instanceof Entity) {
                        src.totalDamage = (src.totalDamage || 0) + Math.ceil(Math.max(extraTrue, 0));
                    }
                }
                
                // Towers are immovable - prevent knockback from large damage hits
                if(this instanceof DefenseTower || this instanceof MainTower) {
                    this.kbx = 0;
                    this.kby = 0;
                }
                // Restore normal true-damage behavior (allow trueDmgBuff to apply)
                if(src && src.trueDmgBuff) this.hp -= amt * src.trueDmgBuff;
                // Check if attacker is Ren with heal active - Ren heals 40% of damage dealt
                if(src && src instanceof Ren && src.healActive) {
                    src.hp = Math.min(src.maxHp, src.hp + d * 0.4);
                }
                // Invincible gear lock: prevents death while timer active but still allows HP reduction (locks to 1)
                if(this.invincibleLockTimer > 0) {
                    if(this.hp <= 1) { this.hp = 1; return; }
                }
                if(this.hp<=0){ this.hp=0; this.die(src); }
                if(src && d > 200) {
                    let ang = Math.atan2(this.y - src.y, this.x - src.x);
                    this.kbx = Math.cos(ang) * 500;
                    this.kby = Math.sin(ang) * 500;
                }
            }
            die(src){
                console.log(`💀 ${this.name || 'Entity'} is dying! this.isPlayer=${this.isPlayer}, gameMode=${gameMode}`);
                this.dead=true;

                // If a MainTower dies in 5v5, immediately end the match.
                if (gameMode === '5v5' && this instanceof MainTower) {
                    // Determine winning team: opposite of the destroyed main tower
                    const winningTeam = (this.team === 1) ? 2 : 1;
                    const playerWon = (typeof player !== 'undefined' && player.team === winningTeam);
                    // Ensure UI/game loop transitions to end state
                    endGame(playerWon);
                    return; // stop further death processing
                }
                
                // Track death for FFA team modes (not in FFA/FFA_Online)
                let isFFA = gameMode === 'ffa' || gameMode === 'ffa_online';
                if(!isFFA && this instanceof Entity) {
                    this.deaths++;
                }
                
                if(src&&src instanceof Entity&&src!==this) {
                    if (src instanceof Ambrose) {
                        src.fCD = 0;
                    }
                    // Only count kills if victim is a hero/player (has countsAsFFAHero flag)
                    if(this instanceof Entity && (this.countsAsFFAHero === true || (this.isPlayer !== undefined && this instanceof OnlinePlayerProxy))) {
                        if (!(this.noKillCredit && this.noKillCredit === true)) {
                            src.kills++;
                        }
                        // special kill effect for Tate Real Top G
                        if(src instanceof Tate && src.currentSkin==='Real Top G'){
                            effectsAdd(new KOEffect(this.x,this.y));
                        }
                        // special kill effect for Don Pollo
                        if(src instanceof Don && src.currentSkin==='Don Pollo'){
                            effectsAdd(new DishBlast(this.x,this.y));
                            if(src.isPlayer){
                                let sounds = getSkinSounds('don', src.currentSkin);
                                if(sounds && sounds.kill){
                                    let audio = new Audio(sounds.kill);
                                    audio.volume = 0.8;
                                    audio.play().catch(e => console.log('Sound failed:', e));
                                }
                                if(typeof onlineSocket !== 'undefined' && onlineSocket && gameMode && gameMode.includes('online')){
                                    onlineSocket.emit('abilitySound', {ability: 'kill', x: this.x, y: this.y, heroType: 'don', skin: src.currentSkin});
                                }
                            }
                        }

                        // Award assists to teammates who damaged this entity (only in team modes)
                        if(!isFFA && this.damageContributors && this.damageContributors.size > 0) {
                            const ASSIST_WINDOW_MS = 10000; // only recent contributors within 10s count
                            for(let [contributor, dmgObj] of this.damageContributors) {
                                // Support legacy numeric entries and the new {amount,time} shape
                                const dmgAmount = (dmgObj && typeof dmgObj === 'object') ? (dmgObj.amount || 0) : (dmgObj || 0);
                                const dmgTime = (dmgObj && typeof dmgObj === 'object') ? (dmgObj.time || this.lastDamageTime) : this.lastDamageTime;
                                if(contributor !== src && contributor.team === src.team && !contributor.dead && dmgAmount > 0 && (Date.now() - dmgTime) <= ASSIST_WINDOW_MS) {
                                    contributor.assists++;
                                }
                            }
                        }
                    }

                    // Track team kill counts for 5v5 mode
                    if(gameMode === '5v5' && window.gameState5v5) {
                        if(typeof src.team !== 'undefined') {
                            if(src.team === 1) gameState5v5.blueScore++;
                            else if(src.team === 2) gameState5v5.redScore++;
                        }
                    }

                    // Increment love power for Lav on kills (direct or teammate)
                    if(src instanceof Lav) {
                        src.lovePower = Math.min(src.maxLovePower, src.lovePower + 1);
                        src.maxHp = 8000 + (src.lovePower * 100);
                    } else {
                        // Check if there's a Lav on the same team as the killer
                        for(let e of entities) {
                            if(e instanceof Lav && e.team === src.team && !e.dead) {
                                e.lovePower = Math.min(e.maxLovePower, e.lovePower + 1);
                                e.maxHp = 8000 + (e.lovePower * 100);
                                break;
                            }
                        }
                    }
                }
                if(src&&src.isPlayer)addKillMsg(`Eliminated ${this.name}`);
                // Check if Vival has a revive available - require `reviveReady` flag too
                let vivalCanRevive = this instanceof Vival && this.ritualActive && !this.secondLifeTriggered && this.reviveReady;
                if(!vivalCanRevive) {
                    if(this.isPlayer&&gameMode!=='5v5'&&gameMode!=='ffa_online') {
                        console.log(`📍 Calling endGame(false) - not 5v5 and not ffa_online`);
                        endGame(false);
                    }
                    else if(this.isPlayer&&gameMode==='ffa_online') {
                        console.log(`🎮 Calling endGame(false) - ffa_online mode detected`);
                        endGame(false);
                    }
                }
                // Builderman death check
                if(this instanceof Builderman) {
                    for(let m of this.mines) { if(m && !m.dead) m.explode(); }
                    if(this.sentry && !this.sentry.dead) { this.sentry.takeDamage(9999, this); }
                }
                // Hero-specific effect cleanup
                if(this instanceof Paul && this.ult) this.ult = false;
                if(this instanceof LightHero && this.speedBoostTimer > 0) { this.speedBoostTimer = 0; this.speed = this.baseSpd; }
                if(src && src instanceof Noli) src.teleportCharges++;
                for(let i=0;i<15;i++)particles.push(new Particle(this.x,this.y,this.color,5,1.0));
                
                // Handle revive in 5v5 mode for player and teammates — queue multiple revives
                if (gameMode === '5v5') {
                    gameState5v5.reviveQueue = gameState5v5.reviveQueue || [];
                    // push this dead entity to the queue (avoid duplicates)
                    if (!gameState5v5.reviveQueue.includes(this)) {
                        gameState5v5.reviveQueue.push(this);
                        console.log('[5v5 revive] queued:', this.name || this.constructor.name || '<anon>', 'len=', gameState5v5.reviveQueue.length);
                        // do not display revive queue overlay in 5v5 mode (user requested)
                        if (gameMode !== '5v5' && typeof showMatchDebug === 'function') showMatchDebug(`Revive queued: ${this.name || this.constructor.name}\nQueue: ${gameState5v5.reviveQueue.length}`, 3000);
                    }
                    if (!gameState5v5.isReviving) {
                        let next = gameState5v5.reviveQueue.shift();
                        if (next) {
                            console.log('[5v5 revive] starting revive for', next.name || next.constructor.name, 'remainingQueue=', gameState5v5.reviveQueue.length);
                            // do not display revive queue overlay in 5v5 mode (user requested)
                            if (gameMode !== '5v5' && typeof showMatchDebug === 'function') showMatchDebug(`Reviving: ${next.name || next.constructor.name}\nRemaining: ${gameState5v5.reviveQueue.length}`, 3000);
                            gameState5v5.revivedEntity = next;
                            gameState5v5.reviveSpawnX = next.team === 1 ? 800 : 4200;
                            gameState5v5.reviveSpawnY = 2500;
                            gameState5v5.reviveTimer = gameState5v5.reviveDuration;
                            gameState5v5.isReviving = true;
                        }
                    }
                }
                
                checkWinCondition();
            }
            getDamageMult(){ return this.rageTimer>0 ? 1.1 : 1; }
            isVisibleTo(obs){
                // If entity is explicitly non-targetable (e.g., Realms), treat as not visible for targeting
                if (this.isTargetable === false) return false;
                return this.revealTimer>0||!this.bush||obs===this||(obs instanceof Entity&&obs.bush===this.bush);
            }
            updateCommon(dt){
                this.bush=null;for(let b of bushes)if(b.contains(this)){this.bush=b;break;}
                if(this.revealTimer>0)this.revealTimer-=dt;
                if(this.stunTimer>0)this.stunTimer-=dt;
                if(this.slowTimer>0)this.slowTimer-=dt;
                if(this.enhancedKBTimer>0) this.enhancedKBTimer -= dt;
                if(this.freezeTimer>0)this.freezeTimer-=dt;
                if(this.invincibleLockTimer>0) this.invincibleLockTimer -= dt;
                if(this.resistanceBoostTimer>0){this.resistanceBoostTimer -= dt; if(this.resistanceBoostTimer<=0){ this.resistanceBoostTimer=0; }}
                if(this.damagePenetrationBoostTimer>0){this.damagePenetrationBoostTimer -= dt; if(this.damagePenetrationBoostTimer<=0){ this.damagePenetrationBoostTimer=0; }}
                if(this.defDebuff>0){this.defDebuff-=dt;this.dmgMult=1.2;if(Math.random()<0.1)particles.push(new Particle(this.x,this.y,'#f0f',1,0.5));}else this.dmgMult=1.0;
                // Ragebaitting: pull entity toward attacker
                if(this.ragebaittingTimer>0){
                    this.ragebaittingTimer-=dt;
                    if(this.ragebaittingSource && !this.ragebaittingSource.dead){
                        let dx=this.ragebaittingSource.x-this.x;
                        let dy=this.ragebaittingSource.y-this.y;
                        let dist=Math.sqrt(dx*dx+dy*dy);
                        if(dist>0){
                            this.x+=(dx/dist)*this.baseSpd*dt;
                            this.y+=(dy/dist)*this.baseSpd*dt;
                        }
                    }
                }
                if(this.debuffImmuneTimer>0) this.debuffImmuneTimer -= dt;
                if(this.injuredTimer>0) this.injuredTimer -= dt;
                if(this.invulnerableTimer>0) this.invulnerableTimer -= dt;
                if(this.defenseBuffTimer>0) this.defenseBuffTimer -= dt;
                if(this.hallucinationTimer > 0) this.hallucinationTimer -= dt;
                if(this.stunImmuneTimer > 0) this.stunImmuneTimer -= dt;
                if(this.attackLockoutTimer > 0) this.attackLockoutTimer -= dt;
                if(this.burnTimer > 0) {
                    this.burnTimer -= dt;
                    this.lastBurnTick = (this.lastBurnTick || 0) + dt;
                    let burnDmg = this.burnDamagePerSec || 150; // Default 150 per 0.5s = 300/sec, Melvin uses 50/sec
                    let tickRate = 0.5;
                    if(this.lastBurnTick >= tickRate) {
                        let burnAmount = burnDmg * tickRate;
                        this.hp -= burnAmount;
                        
                        // Track burn damage in training mode
                        if(gameMode === 'training' && this.burnOwner && this.burnOwner.isPlayer && window.trainingStats) {
                            if(!window.trainingStats.countingStarted) {
                                window.trainingStats.countingStarted = true;
                                window.trainingStats.startTime = Date.now();
                            }
                            window.trainingStats.totalDamage += burnAmount;
                        }
                        
                        if(this.hp <= 0) this.die(this.burnOwner);
                        this.lastBurnTick -= tickRate;
                    }
                }

                // Apollo sun-mark DOT handling (75 damage per 0.5s for the duration of apolloFireTimer)
                if(this.apolloFireTimer > 0) {
                    this.apolloFireTimer -= dt;
                    this.lastApolloFireTick = (this.lastApolloFireTick || 0) + dt;
                    let tickRate = 0.5;
                    let tickDamage = 75; // 75 damage every 0.5s
                    if(this.lastApolloFireTick >= tickRate) {
                        // Apply DOT damage and attribute to owner when possible
                        if(this.apolloFireOwner && this.apolloFireOwner instanceof Entity) {
                            this.takeDamage(tickDamage, this.apolloFireOwner);
                        } else {
                            this.takeDamage(tickDamage, null);
                        }

                        // Training mode tracking (already handled inside takeDamage when src.isPlayer)

                        // If DOT killed the entity, credit owner (takeDamage handles die attribution)
                        this.lastApolloFireTick -= tickRate;
                    }

                    // Clean-up when timer expires
                        if(this.apolloFireTimer <= 0) {
                            // If the entity is currently inside a JusticeRealm, preserve the sun-mark
                            // for the remainder of the realm (mark should not be removed while JusticeRealm active).
                            if (this.inRealm && this.realm && this.realm.type === 'justice') {
                                // refresh the mark duration to match the remaining realm life so DOT and ownership persist
                                try { this.apolloFireTimer = Math.max(this.apolloFireTimer, this.realm.life || 0.1); } catch(_) { this.apolloFireTimer = 0.1; }
                                this.lastApolloFireTick = 0; // reset tick so DOT continues cleanly
                            } else {
                                // Remove from owner's marked set if present
                                try {
                                    if(this.apolloFireOwner && this.apolloFireOwner.sunMarkedEnemies) {
                                        this.apolloFireOwner.sunMarkedEnemies.delete(this);
                                        // if owner has no more marks, clear their teleport state (do NOT refund cooldowns)
                                        if (this.apolloFireOwner.sunMarkedEnemies.size === 0) {
                                            // Do NOT reset Apollo's queued teleport if Apollo is inside a JusticeRealm — prevents unintended teleport-back edge cases
                                            if (!(this.apolloFireOwner.inRealm && this.apolloFireOwner.realm && this.apolloFireOwner.realm.type === 'justice')) {
                                                this.apolloFireOwner.qTeleported = false;
                                                this.apolloFireOwner.qStage = 0;
                                                this.apolloFireOwner.qStageTimer = 0;
                                            }
                                        }
                                    }
                                } catch (e) {}
                                this.apolloFireOwner = null;
                                this.lastApolloFireTick = 0;
                            }
                        }
                }
                // Moon mark and floating timer handling
                if (this.moonMark && this.moonMark > 0) this.moonMark -= dt;
                if (this.floatingTimer && this.floatingTimer > 0) this.floatingTimer -= dt;
                // Bandage gear healing disabled - was causing unintended healing
                // if(this.bandageTimer>0){ this.hp = Math.min(this.maxHp, this.hp + this.maxHp*0.02*dt); this.bandageTimer-=dt; }
                if(this.bandageTimer>0){ this.bandageTimer-=dt; }
                if(this.witherBuffTimer>0){ this.witherBuffTimer-=dt; if(this.witherBuffTimer<=0){ this.witherBuff=false; this.shield=0; } }

                // Teleport windup
                if(this.teleportWindup > 0) {
                    this.teleportWindup -= dt;
                    // Visual feedback - show windup circle
                    for(let i = 0; i < 2; i++) particles.push(new Particle(this.x, this.y, '#00ffff', 3, 0.3));
                    // Teleport when windup completes
                    if(this.teleportWindup <= 0 && this.teleportTarget) {
                        this.x = this.teleportTarget.x;
                        this.y = this.teleportTarget.y;

                        // If this teleport was scheduled by Apollo Q, DO NOT remove the sun-mark here — leave it for Judgement Cut or natural expiry
                        if (this.pendingQTeleportTarget) {
                            try {
                                // Q teleport explosion damage (apply at landing)
                                for (let e of entities) {
                                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                        if (d < 200) e.takeDamage(350, this);
                                    }
                                }

                                for (let i = 0; i < 30; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(300);
                                    particles.push(new Particle(this.x, this.y, '#FFD700', 4, 0.8, vel.x, vel.y));
                                }
                            } catch(_) {}
                            // clear only the pending pointer; do not clear target's apolloFireTimer/apolloFireOwner
                            this.pendingQTeleportTarget = null;
                        }

                        this.teleportTarget = null;
                        // Teleport burst particles
                        for(let i = 0; i < 25; i++) particles.push(new Particle(this.x, this.y, '#00ffff', 4, 0.5));
                    }
                }

                // Realm timer / isolation cleanup (centralized)
                if (this.inRealm) {
                    if (this.realmTimer > 0) this.realmTimer -= dt;
                    if (this.realmTimer <= 0 || (this.realmTarget && this.realmTarget.dead)) {
                        // Restore position to where each participant started the realm
                        if (this.realmReturnPos) {
                            this.x = this.realmReturnPos.x;
                            this.y = this.realmReturnPos.y;
                        }

                        // If there is a partner, restore and clear them as well (safety)
                        try {
                            if (this.realmTarget && this.realmTarget.inRealm && this.realmTarget.realmId === this.realmId) {
                                if (this.realmTarget.realmReturnPos) {
                                    this.realmTarget.x = this.realmTarget.realmReturnPos.x;
                                    this.realmTarget.y = this.realmTarget.realmReturnPos.y;
                                }
                                this.realmTarget.inRealm = false;
                                this.realmTarget.realmTimer = 0;
                                this.realmTarget.realmId = null;
                                this.realmTarget.realmTarget = null;
                                this.realmTarget.realmReturnPos = null;
                            }
                        } catch (e) {}

                        // Clear realm flags for this entity
                        this.inRealm = false;
                        this.realmTimer = 0;
                        this.realmId = null;
                        this.realmTarget = null;
                        this.realmReturnPos = null;
                    }
                }

                // If a Q-teleport was deferred because Apollo scheduled it while inside a JusticeRealm,
                // start the teleport now that the realm has ended (prevents teleport-back edge cases).
                try {
                    if (this.pendingQTeleportDeferred) {
                        // If the deferred target is invalid/dead, clear the deferred request
                        if (!this.pendingQTeleportTarget || this.pendingQTeleportTarget.dead) {
                            this.pendingQTeleportDeferred = false;
                            this.pendingQTeleportTarget = null;
                        } else if (!this.inRealm) {
                            // start actual teleport windup toward the deferred target
                            this.teleportWindup = Math.max(this.teleportWindup, 0.1);
                            this.teleportTarget = { x: this.pendingQTeleportTarget.x, y: this.pendingQTeleportTarget.y };
                            this.pendingQTeleportDeferred = false;

                            // visual cue for starting deferred teleport
                            for (let i = 0; i < 10; i++) particles.push(new Particle(this.x, this.y, '#FFD700', 3, 0.4, (Math.random()-0.5)*200, (Math.random()-0.5)*200));
                        }
                    }
                } catch(_) {}

                // Physics
                this.x += this.kbx * dt;
                this.y += this.kby * dt;
                this.kbx *= 0.9;
                this.kby *= 0.9;

                this.x=Math.max(20,Math.min(WORLD_SIZE-20,this.x));this.y=Math.max(20,Math.min(WORLD_SIZE-20,this.y));
                // Enforce blueprint traps: if an entity is marked trappedBy a BlueprintZone,
                // keep it inside the blueprint bounds until the zone expires.
                try {
                    if (this.trappedBy) {
                        if (this.trappedBy.del) {
                            this.trappedBy = null;
                        } else {
                            let dx = this.x - this.trappedBy.x;
                            let dy = this.y - this.trappedBy.y;
                            let r = this.trappedBy.radius;
                            // clamp to inside square (leave small epsilon so entity doesn't flicker)
                            let eps = 2;
                            if (Math.abs(dx) > r - eps) this.x = this.trappedBy.x + Math.sign(dx) * (r - eps);
                            if (Math.abs(dy) > r - eps) this.y = this.trappedBy.y + Math.sign(dy) * (r - eps);
                        }
                    }
                } catch (e) {}
            }
            getEffectiveSpeed() {
                let s = this.speed;
                if(this.slowTimer > 0) s *= 0.6; // 40% slow (IV)
                if(this.speedsterTimer > 0) s *= 1.5;
                if(this.witherBuff && this.witherBuffTimer > 0) s *= 1.25; // 25% faster walkspeed
                return s;
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            draw(ctx){
                if(!window.__visualsReady && isLoadingPurpleVisual(this.color)) return;
                if(this.dead)return;
                if(!this.isPlayer&&!this.isVisibleTo(player))return;
                if(this.bush) {
                    const sameBush = !!(player && player.bush === this.bush);
                    const isRevealed = this.revealTimer > 0;
                    if (this.isPlayer) {
                        ctx.globalAlpha = sameBush || isRevealed ? 0.7 : 0.35;
                    } else {
                        ctx.globalAlpha = (sameBush || isRevealed) ? 0.75 : 0.18;
                    }
                }
                if(this.isPlayer&&this.bush)ctx.globalAlpha=0.6;
                if(this.freezeTimer>0 || this.stunTimer>0){ctx.save();ctx.translate(this.x-camera.x,this.y-camera.y-this.radius-10);ctx.fillStyle='#ff0';ctx.font='20px Arial';ctx.textAlign='center';ctx.fillText(this.freezeTimer>0?'🧊':'💫',0,0);ctx.restore();}
                if(this.hallucinationTimer>0){ctx.save();ctx.translate(this.x-camera.x,this.y-camera.y-this.radius-30);ctx.fillStyle='#800080';ctx.font='20px Arial';ctx.textAlign='center';ctx.fillText('🎭',0,0);ctx.restore();}
                if(currentMVP===this){ctx.fillStyle='#fd0';ctx.font='bold 16px Arial';ctx.textAlign='center';ctx.fillText(`MVP (${this.kills})`,this.x-camera.x,this.y-camera.y-50);ctx.textAlign='start';}
                // Moon mark indicator above entity
                try {
                    if (this.moonMark && this.moonMark > 0) {
                        ctx.save();
                        ctx.translate(this.x - camera.x, this.y - camera.y - this.radius - 30);
                        ctx.font = '18px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillStyle = '#dfefff';
                        ctx.fillText('🌙', 0, 0);
                        ctx.restore();
                    }
                } catch (_) {}
                ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.radius,0,Math.PI*2);ctx.fill();
                if(this.dmgMult>1.0){ctx.strokeStyle='#f0f';ctx.lineWidth=4;}else{ctx.strokeStyle='#000';ctx.lineWidth=2;}
                ctx.stroke();ctx.globalAlpha=1.0;
                ctx.beginPath();ctx.moveTo(this.x-camera.x,this.y-camera.y);
                ctx.lineTo((this.x-camera.x)+Math.cos(this.angle)*(this.radius+10),(this.y-camera.y)+Math.sin(this.angle)*(this.radius+10));
                ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
                if(!this.isPlayer){
                    let bx=this.x-camera.x-20,by=this.y-camera.y-35;
                    ctx.fillStyle='red';ctx.fillRect(bx,by,40,5);
                    ctx.fillStyle='#0f0';ctx.fillRect(bx,by,40*(this.hp/this.maxHp),5);
                    if(this.shield>0){ctx.fillStyle='#add8e6';ctx.fillRect(bx,by,40*Math.min(1,this.shield/this.maxHp),5);ctx.strokeRect(bx,by,40,5);}
                    // If hallucinated, obscure health display (only draw away from top HUD)
                    let _screenY = this.y - camera.y;
                    if (this.hallucinationTimer > 0 && _screenY > 60) {
                        ctx.fillStyle = '#800080';
                        ctx.font = '12px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('??', this.x - camera.x, _screenY - 45);
                    }
                }
            }
            // AI Helpers
            handleSafeZone(dt) {
                 // disable entirely during 1v1 modes
                 if (gameMode === '1v1' || gameMode === 'duel_online') return false;
                 if (this.inRealm && this.realm && this.realm.type === 'justice') return false;
                 
                 // Towers are immovable and don't need safe zone handling
                 if (this instanceof DefenseTower || this instanceof MainTower) return false;

                 let distToCenter = Math.sqrt((this.x - WORLD_SIZE/2)**2 + (this.y - WORLD_SIZE/2)**2);
                 if (distToCenter > safeZoneRadius * 0.9) {
                    let ang = Math.atan2(WORLD_SIZE/2 - this.y, WORLD_SIZE/2 - this.x);
                    this.x += Math.cos(ang) * this.speed * dt;
                    this.y += Math.sin(ang) * this.speed * dt;
                    return true;
                 }
                 return false;
            }
            findNearestHealthCube() {
                let nearest = null, minDist = 999999;
                for(let e of entities) {
                    if(e instanceof HealthCube && !e.del) {
                        // Check if cube is within safe zone before considering it
                        let distToSafeZoneCenter = Math.sqrt((e.x - WORLD_SIZE/2)**2 + (e.y - WORLD_SIZE/2)**2);
                        if(distToSafeZoneCenter > safeZoneRadius) continue; // Skip cubes outside safe zone
                        
                        let d = Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2);
                        if(d < minDist) {
                            minDist = d;
                            nearest = e;
                        }
                    }
                }
                return nearest;
            }

            // Compatibility shim: ensure both method names exist so mixed usages don't crash.
            // If a subclass implements one name only, these will forward to it. Otherwise
            // they provide a harmless fallback melee to avoid runtime "is not a function" errors.
            basicAtk() {
                // If a subclass provided basicAttack, call it.
                    const subclassBasicAttack = this.constructor && this.constructor.prototype && Object.prototype.hasOwnProperty.call(this.constructor.prototype, 'basicAttack')
                        ? this.constructor.prototype.basicAttack
                        : null;
                    if (typeof subclassBasicAttack === 'function') {
                        return subclassBasicAttack.call(this);
                }
                // Fallback light basic attack (safe default)
                try {
                    this.revealTimer = Math.max(this.revealTimer || 0, 0.4);
                    this.basicCD = (this.basicCD || 0.8);
                    particles.push(new Slash(this.x, this.y, this.angle, 60, Math.PI/2, '#fff'));
                    for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 80) {
                        e.takeDamage(50, this);
                        e.revealTimer = 0.6;
                    }
                } catch (_) {}
            }
            basicAttack() {
                // If a subclass provided basicAtk, call it.
                const subclassBasicAtk = this.constructor && this.constructor.prototype && Object.prototype.hasOwnProperty.call(this.constructor.prototype, 'basicAtk')
                    ? this.constructor.prototype.basicAtk
                    : null;
                if (typeof subclassBasicAtk === 'function') {
                    return subclassBasicAtk.call(this);
                }
                // Fallback light basic attack (safe default)
                try {
                    this.revealTimer = Math.max(this.revealTimer || 0, 0.4);
                    this.basicCD = (this.basicCD || 0.8);
                    particles.push(new Slash(this.x, this.y, this.angle, 60, Math.PI/2, '#fff'));
                    for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 80) {
                        e.takeDamage(50, this);
                        e.revealTimer = 0.6;
                    }
                } catch (_) {}
            }
        }

        // Provide a default gear implementation so heroes that don't
        // implement `useGear` can still activate selected gears.
        // This mirrors the shared gear behaviors used elsewhere so
        // pressing R will reliably trigger a gear effect for all heroes.
        Entity.prototype.useGear = function() {
            try {
                if (this.rCD > 0) return;
                if (!this.gear) { this.rCD = 60; return; }
                // Common gear set (fallback implementation)
                if (this.gear === 'speedster') { this.speedsterTimer = 5; this.rCD = 45; }
                else if (this.gear === 'rage') { this.rageTimer = 5; this.rCD = 60; }
                else if (this.gear === 'blink') { this.x += Math.cos(this.angle) * 200; this.y += Math.sin(this.angle) * 200; this.rCD = 75; }
                else if (this.gear === 'bandage') { this.bandageTimer = 5; this.rCD = 75; this.hp = Math.min(this.maxHp, this.hp + Math.floor((this.maxHp||0) * 0.25)); }
                else if (this.gear === 'visiongoggles') { this.rCD = 90; }
                else if (this.gear === 'electrico') {
                    this.rCD = 80;
                    for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2) < 250) {
                        e.hp -= 200; e.applyStatus && e.applyStatus('stun', Math.max(e.stunTimer || 0, 0.4), this);
                    }
                }
                else if (this.gear === 'invincible') { this.invincibleLockTimer = 1.5; this.rCD = 80; for (let i = 0; i < 18; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*50, this.y + (Math.random()-0.5)*50, '#fff', 3, 0.35)); }
                else if (this.gear === 'soundblast') { this.rCD = 75; let radius = 300; for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) { let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx+dy*dy); if (d < radius){ let dmg = 350; e.takeDamage(dmg, this); let ang = Math.atan2(e.y - this.y, e.x - this.x); let knockback = 1100; e.kbx = Math.cos(ang) * knockback; e.kby = Math.sin(ang) * knockback; e.revealTimer = 1.0; for (let p = 0; p < 16; p++) particles.push(new Particle(e.x + (Math.random()-0.5)*40, e.y + (Math.random()-0.5)*40, '#ff66ff', 4, 0.4)); } } for (let i = 0; i < 24; i++) { let ang = Math.random() * Math.PI * 2; let vel = new Vector2(Math.cos(ang), Math.sin(ang)).mult(250); particles.push(new Particle(this.x, this.y, '#00e5ff', 4, 0.6, vel.x, vel.y)); } }
                else if (this.gear === 'execution') { this.rCD = 60; let executed = false; for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2) < 100) { if (e.hp < e.maxHp*0.1) { e.hp = 0; e.die && e.die(this); executed = true; } } if (executed) this.rCD = 30; }
                else if (this.gear === 'teleportation') { this.teleportWindup = 2.0; this.rCD = 120; }
            } catch (e) { console.warn('useGear fallback error', e); }
        };

        // Shared fallback AI for heroes without a mode-specific implementation.
        Entity.prototype.ai = function(dt, spd) {
            if (this.dead) return;
            if (typeof this.handleSafeZone === 'function' && this.handleSafeZone(dt)) return;

            let target = null;
            let nearestDistance = Infinity;
            for (let entity of entities) {
                if (entity === this || entity.dead || !(entity instanceof Entity) || entity.team === this.team) continue;
                if (typeof entity.isVisibleTo === 'function' && !entity.isVisibleTo(this)) continue;
                let distance = Math.hypot(entity.x - this.x, entity.y - this.y);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    target = entity;
                }
            }

            if (!target) {
                if (typeof this.wander === 'function') this.wander(dt, spd);
                return;
            }

            this.angle = Math.atan2(target.y - this.y, target.x - this.x);
            if (nearestDistance > 150) {
                let move = new Vector2(Math.cos(this.angle), Math.sin(this.angle)).mult(spd * dt);
                this.x += move.x;
                this.y += move.y;
            }

            const abilityCandidates = [
                ['qCD', ['skill1', 'abilityQ', 'doQ', 'energyBurst', 'lightCircle'], ['qCharges', 'chargePool']],
                ['eCD', ['skill2', 'abilityE', 'doE', 'inkPen', 'curvedDash'], ['eCharges']],
                ['fCD', ['doUlt', 'abilityF', 'doF', 'transform', 'unleash'], ['fCharges']],
                ['gCD', ['abilityG', 'doG', 'abilityG', 'lmsAbility'], ['gCharges']]
            ];
            for (const [cooldown, methods, chargeFields] of abilityCandidates) {
                const hasCharge = chargeFields.some(field => typeof this[field] !== 'undefined');
                const chargeReady = !hasCharge || chargeFields.some(field =>
                    typeof this[field] === 'number' && this[field] > 0
                );
                if ((this[cooldown] || 0) <= 0 && chargeReady) {
                    for (const method of methods) {
                        if (typeof this[method] !== 'function') continue;
                        const beforeCooldown = this[cooldown] || 0;
                        const beforeEntityCount = entities.length;
                        const beforeState = `${this.dashing || false}|${this.transformed || false}|${this.fusionActive || false}|${this.helicopterActive || false}|${this.inNihilityCounter || false}`;
                        try {
                            this[method]();
                            const afterState = `${this.dashing || false}|${this.transformed || false}|${this.fusionActive || false}|${this.helicopterActive || false}|${this.inNihilityCounter || false}`;
                            const abilityWorked = (this[cooldown] || 0) !== beforeCooldown ||
                                entities.length !== beforeEntityCount || beforeState !== afterState;
                            if (abilityWorked) return;
                        } catch (error) {
                            console.warn(`Ability fallback for ${this.constructor.name}.${method}:`, error);
                        }
                    }
                }
            }

            if (nearestDistance <= 220 && (this.basicCD || 0) <= 0) {
                const basicMethod = typeof this.basicAtk === 'function' ? 'basicAtk' :
                    (typeof this.basicAttack === 'function' ? 'basicAttack' : null);
                if (basicMethod) this[basicMethod]();
            }
        };

        // --- HEROES ---

        // MoonOrb: boomerang-style projectile for Lune (outbound -> return)
        class MoonOrb {
            constructor(owner, x, y, angle, speed=1500, range=1000, outDmg=700, returnDmg=800) {
                this.owner = owner; this.team = owner.team; this.x = x; this.y = y; this.angle = angle;
                this.speed = speed; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
                this.dist = 0; this.range = range; this.outDmg = outDmg; this.returnDmg = returnDmg;
                this.phase = 0; // 0 = outbound, 1 = returning
                this.del = false; this.hitOutbound = new Set(); this.hitReturn = new Set(); this.size = 16; this.color = '#cfe9ff';
            }
            update(dt) {
                // move
                this.x += this.vx * dt; this.y += this.vy * dt;
                this.dist += Math.sqrt(this.vx*this.vx + this.vy*this.vy) * dt;

                // collision with entities
                // only deal direct hit damage on outbound phase
                if (this.phase === 0) {
                    for (let e of entities) {
                        if (e === this.owner || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                        if (this.hitOutbound.has(e.id)) continue;
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < e.radius + this.size) {
                            try {
                                let dmg = this.outDmg;
                                e.takeDamage(dmg, this.owner, { projectile: 'MoonOrb', phase: 'outbound' });
                                e.revealTimer = 1.0;
                                e.moonMark = Math.max(e.moonMark || 0, 6.0);
                                e.moonMarkOwner = this.owner;
                                this.hitOutbound.add(e.id);
                                for (let i=0;i<12;i++) particles.push(new Particle(e.x, e.y, '#dfefff', 3, 0.45));
                                if (this.owner && this.owner.isPlayer) screenShake(6);

                                // secondary small knockback-stun circle around hit (smaller than E)
                                let aoeR = 120;
                                for (let t of entities) {
                                    if (t === this.owner || t.dead || !(t instanceof Entity) || t.team === this.team) continue;
                                    let dd = Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2);
                                    if (dd < aoeR) {
                                        // small knockback and stun + 200 damage
                                        let ang2 = Math.atan2(t.y - this.y, t.x - this.x);
                                        let kb = 350;
                                        t.kbx = Math.cos(ang2) * kb;
                                        t.kby = Math.sin(ang2) * kb;
                                        t.takeDamage(200, this.owner, { projectile: 'MoonOrb', phase: 'outbound_aoe' });
                                        t.stunTimer = Math.max(t.stunTimer || 0, 0.5);
                                        t.revealTimer = 1.0;
                                        for (let i=0;i<6;i++) particles.push(new Particle(t.x, t.y, '#fff5e6', 3, 0.45));
                                    }
                                }

                            } catch(_){ }
                        }
                    }
                }

                // When outbound reaches range, spawn a distinct return projectile and delete this outbound orb.
                if (this.phase === 0 && this.dist >= this.range) {
                    try {
                        // copy outbound hits so return can skip them
                        const outboundHits = new Set(this.hitOutbound);
                        const ret = new MoonOrbReturn(this.owner, this.x, this.y, this.speed * 1.3, this.returnDmg, outboundHits);
                        if (typeof window.projectiles !== 'undefined') window.projectiles.push(ret); else entities.push(ret);
                    } catch (e) { console.warn('MoonOrb: failed to spawn return orb', e); }
                    this.del = true;
                    return;
                }
            }
            draw(ctx) {
                ctx.save(); ctx.translate(this.x - camera.x, this.y - camera.y);
                // soft glow
                ctx.beginPath(); ctx.fillStyle = 'rgba(207,233,255,0.25)'; ctx.arc(0,0,this.size*1.6,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0,0,this.size,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
            }
        }

        // Separate MoonOrb return projectile to simplify hit accounting
        class MoonOrbReturn {
            constructor(owner, x, y, speed, returnDmg=750, outboundHits=new Set()) {
                this.owner = owner; this.team = owner.team; this.x = x; this.y = y;
                this.speed = speed; this.vx = 0; this.vy = 0;
                this.returnDmg = returnDmg;
                this.outboundHits = new Set(outboundHits || []);
                this.hitReturn = new Set();
                this.size = 16; this.color = '#cfe9ff'; this.del = false;
            }
            update(dt) {
                if (!this.owner || this.owner.dead) { this.del = true; return; }
                // home towards owner
                let ang = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
                this.vx = Math.cos(ang) * this.speed;
                this.vy = Math.sin(ang) * this.speed;
                this.x += this.vx * dt; this.y += this.vy * dt;

                // collision: hit entities unless already hit by this return
                for (let e of entities) {
                    if (e === this.owner || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                    if (this.hitReturn.has(e.id)) continue;
                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                    if (d < e.radius + this.size) {
                        try {
                            let dmg = this.returnDmg;
                            e.takeDamage(dmg, this.owner, { projectile: 'MoonOrb', phase: 'return' });
                            e.revealTimer = 1.0;
                            e.moonMark = Math.max(e.moonMark || 0, 6.0);
                            e.moonMarkOwner = this.owner;
                            // direct target should only take the return damage (750). Do not apply the extra AoE to the direct hit.
                            this.hitReturn.add(e.id);
                            // secondary small knockback-stun circle around return hit (mirror of outbound)
                            // Center the AoE on the entity's position so nearby enemies are reliably included.
                            let aoeR = 150;
                            for (let t of entities) {
                                if (t === this.owner || t.dead || !(t instanceof Entity) || t.team === this.team) continue;
                                if (t.id === e.id) continue; // skip direct target
                                if (this.hitReturn.has(t.id)) continue;
                                let dd = Math.sqrt((t.x - e.x)**2 + (t.y - e.y)**2);
                                if (dd < aoeR + (t.radius || 0)) {
                                    let ang2 = Math.atan2(t.y - e.y, t.x - e.x);
                                    let kb = 350;
                                    t.kbx = Math.cos(ang2) * kb;
                                    t.kby = Math.sin(ang2) * kb;
                                    t.takeDamage(200, this.owner, { projectile: 'MoonOrb', phase: 'return_aoe' });
                                    t.stunTimer = Math.max(t.stunTimer || 0, 0.5);
                                    t.revealTimer = 1.0;
                                    t.moonMark = Math.max(t.moonMark || 0, 6.0);
                                    t.moonMarkOwner = this.owner;
                                    this.hitReturn.add(t.id);
                                    for (let i=0;i<6;i++) particles.push(new Particle(t.x, t.y, '#fff5e6', 3, 0.45));
                                }
                            }
                            for (let i=0;i<10;i++) particles.push(new Particle(e.x, e.y, '#dfefff', 4, 0.5));
                            if (this.owner && this.owner.isPlayer) screenShake(6);
                        } catch(_){}
                    }
                }

                // expire when returned to owner (and trigger small retraction AOE)
                let dd = Math.sqrt((this.owner.x - this.x)**2 + (this.owner.y - this.y)**2);
                if (dd < (this.owner.radius || 18) + 12) {
                    // small AOE on return
                    let aoeR = 150;
                    for (let t of entities) {
                        if (t === this.owner || t.dead || !(t instanceof Entity) || t.team === this.team) continue;
                        if (this.hitReturn.has(t.id)) continue;
                        let dd2 = Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2);
                        if (dd2 < aoeR + (t.radius || 0)) {
                            let kb = 350;
                            let angOut = Math.atan2(t.y - this.y, t.x - this.x);
                            t.kbx = Math.cos(angOut) * kb;
                            t.kby = Math.sin(angOut) * kb;
                            t.takeDamage(200, this.owner, { projectile: 'MoonOrb', phase: 'retract_aoe' });
                            t.moonMark = Math.max(t.moonMark || 0, 6.0);
                            t.moonMarkOwner = this.owner;
                            this.hitReturn.add(t.id);
                            t.stunTimer = Math.max(t.stunTimer || 0, 0.5);
                            t.revealTimer = 1.0;
                            for (let i=0;i<6;i++) particles.push(new Particle(t.x, t.y, '#fff5e6', 3, 0.45));
                        }
                    }
                    this.del = true;
                    for (let i=0;i<14;i++) particles.push(new Particle(this.x,this.y,'#eef',5,0.6));
                }
            }
            draw(ctx) {
                ctx.save(); ctx.translate(this.x - camera.x, this.y - camera.y);
                ctx.beginPath(); ctx.fillStyle = 'rgba(207,233,255,0.2)'; ctx.arc(0,0,this.size*1.5,0,Math.PI*2); ctx.fill();
                ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(0,0,this.size,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
            }
        }

