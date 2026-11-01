        class Paul extends Entity {
            constructor(x,y,p){super(x,y,20,p?'#3498db':'#e74c3c',5000);this.isPlayer=p;this.countsAsFFAHero = true;this.name=p?"Player (Paul)":"Enemy Paul";this.basicCD=0;this.qCD=0;this.eCD=0;this.fCD=0;this.baseSpd=200;this.speed=200;this.ult=false;this.ultT=0;this.sprT=0;this.sd=1;this.st=0;}
            update(dt){if(this.dead)return;this.updateCommon(dt);if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.fCD>0)this.fCD-=dt;if(this.rCD>0)this.rCD-=dt;if(this.sprT>0){this.sprT-=dt;if(this.sprT<=0)this.speed=this.baseSpd;}if(this.ult){this.ultT-=dt;if(this.ultT<=0)this.ult=false;if(Math.random()<0.2)particles.push(new Particle(this.x,this.y,'#f1c40f',1,0.3));}if(this.stunTimer>0 || this.freezeTimer>0){if(this.isPlayer)updateHUD(this);return;}let spd=this.getEffectiveSpeed();if(this.isPlayer){this.input(dt,spd); if(keys.r && this.rCD<=0) this.useGear(); updateHUD(this);}else this.ai(dt,spd);}
            input(dt,spd){let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}this.angle=getMouseAimAngle(this.x, this.y);if(mouse.down&&this.basicCD<=0){this.fire();this.basicCD=0.15;}if(keys.q&&this.qCD<=0)this.skill1();if(keys.e&&this.eCD<=0)this.skill2();if(keys.f&&this.fCD<=0)this.doUlt();}
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                if(this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if(!t || Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) >= 200) {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        return;
                    }
                }
                let t=this.findTarget();if(!t){this.wander(dt,spd);return;}let dx=t.x-this.x,dy=t.y-this.y;this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.05;let d=Math.sqrt(dx*dx+dy*dy);this.st-=dt;if(this.st<=0){this.sd*=-1;this.st=0.5+Math.random();}let mx=0,my=0;if(d>400){mx+=Math.cos(this.angle);my+=Math.sin(this.angle);}else if(d<150){mx-=Math.cos(this.angle);my-=Math.sin(this.angle);}if(d<600){mx-=Math.sin(this.angle)*this.sd*0.8;my+=Math.cos(this.angle)*this.sd*0.8;}let l=Math.sqrt(mx*mx+my*my);if(l>0){let moveSpeed = spd * 0.9 * (0.8 + Math.random() * 0.4);this.x+=(mx/l)*moveSpeed*dt;this.y+=(my/l)*moveSpeed*dt;}if(d<600){if(this.fCD<=0&&this.hp<2000)this.doUlt();if(this.qCD<=0&&d<250)this.skill1();if(this.eCD<=0&&d>450)this.skill2();if(this.basicCD<=0){this.fire();this.basicCD=0.5+Math.random()*0.5;}}}
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            fire(){this.revealTimer=0.5;entities.push(new Projectile(this,this.x,this.y,this.angle,800,30,800,'#ff0',8));}
            skill1(){this.revealTimer=1.0;let n=this.ult?12:8;for(let i=0;i<n;i++)entities.push(new Projectile(this,this.x,this.y,this.angle-0.25+Math.random()*0.5,900,140,350,'#fa0',3));this.x-=Math.cos(this.angle)*10;this.y-=Math.sin(this.angle)*10;this.qCD=4.0;if(this.isPlayer)screenShake(5);}
            skill2(){this.speed=500;this.sprT=3.0;this.eCD=9.0;for(let i=0;i<10;i++)particles.push(new Particle(this.x,this.y,'#fff',3,1));}
            doUlt(){this.ult=true;this.ultT=10.0;this.fCD=15.0;this.qCD=0;if(this.isPlayer)screenShake(15);}
            draw(ctx){if(this.ult){ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+5,0,Math.PI*2);ctx.strokeStyle='#f1c40f';ctx.lineWidth=3;ctx.stroke();}super.draw(ctx);}
            getDamageMult(){ return this.rageTimer>0 ? 1.1 : 1; }
            getEffectiveSpeed(){ if(this.enhancedKBTimer>0) return 0; let s = this.speed; if(this.speedsterTimer>0) s*=1.5; return s; }
        }

        // Lune: new moon-mage hero
        class Lune extends Entity {
            constructor(x,y,p){
                super(x,y,18,p?'#9ec9ff':'#6b87a8',4900);
                this.isPlayer = p; this.countsAsFFAHero = true; this.name = p?"Player (Lune)":"Enemy Lune";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.baseSpd = 200; this.speed = this.baseSpd;
                this.basicHitStacks = new Map();
                this.isDashingUlt = false; this.ultChargeT = 0; this.floatingTimer = 0;
            }
            update(dt){
                if(this.dead) return; this.updateCommon(dt);
                if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.fCD>0)this.fCD-=dt;if(this.rCD>0)this.rCD-=dt;
                if(this.stunTimer>0 || this.freezeTimer>0){ if(this.isPlayer) updateHUD(this); return; }
                // handle dashing ultimate movement
                if(this.isDashingUlt){
                    let dashSpd = 1200;
                    this.x += Math.cos(this.angle) * dashSpd * dt;
                    this.y += Math.sin(this.angle) * dashSpd * dt;
                    this.ultChargeT -= dt;
                    this._ultHitEnemies = this._ultHitEnemies || new Set();
                    for (let e of entities) {
                        if(e === this || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if (d < 60 && !this._ultHitEnemies.has(e)) {
                            this._ultHitEnemies.add(e);
                            let dmg = 600;
                            let hadMark = (e.moonMark && e.moonMark > 0);
                            if (hadMark) { dmg += 100; this._ultHitMoon = true; }
                            e.takeDamage(dmg, this);
                            // remove moon mark on hit
                            if (hadMark) { e.moonMark = 0; e.moonMarkOwner = null; for (let p=0;p<10;p++) particles.push(new Particle(e.x,e.y,'#ffeedd',3,0.5)); }
                            this._ultHitAny = true;
                            this.hp = Math.min(this.maxHp, this.hp + 200); // heal on hit
                            e.revealTimer = 1.0;
                            for (let i=0;i<8;i++) particles.push(new Particle(e.x,e.y,'#dfefff',4,0.6));
                        }
                    }
                    if(this.ultChargeT<=0) {
                        this.isDashingUlt = false;
                        // finalize cooldown based on whether any moon-marked enemy was hit
                        if(this._ultHitMoon) this.fCD = 0; else this.fCD = 15.0;
                        if(this.isPlayer) screenShake(12);
                    }
                    if(this.isPlayer) updateHUD(this);
                    return;
                }

                let spd=this.getEffectiveSpeed(); if(this.isPlayer){ this.input(dt,spd); updateHUD(this); } else this.ai(dt,spd);
            }
            input(dt,spd){
                let dx=0,dy=0; if(keys.w)dy--; if(keys.s)dy++; if(keys.a)dx--; if(keys.d)dx++;
                // If floating (pre-ult float), allow faster travel so float feels mobile
                let moveSpeed = spd;
                if (this.floatingTimer && this.floatingTimer > 0) moveSpeed *= 1.6;
                if(dx||dy){ let m=new Vector2(dx,dy).norm().mult(moveSpeed*dt); this.x+=m.x; this.y+=m.y; }
                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD<=0) this.basicAtk();
                if(keys.q && this.qCD<=0) this.abilityQ();
                if(keys.e && this.eCD<=0) this.abilityE();
                if(keys.f && this.fCD<=0) this.abilityF();
                if(keys.r && this.rCD<=0) this.useGear();
            }
            ai(dt,spd){ if(this.handleSafeZone(dt)) return; let t=this.findTarget(); if(!t){ this.wander(dt,spd); return; } let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx); if(Math.random()<0.25 && this.qCD<=0) this.abilityQ(); if(Math.random()<0.15 && this.eCD<=0) this.abilityE(); if(Math.random()<0.05 && this.fCD<=0) this.abilityF(); let move = new Vector2(Math.cos(this.angle), Math.sin(this.angle)).mult(spd*dt); this.x+=move.x; this.y+=move.y; }
            basicAtk(){ this.revealTimer=0.4; this.basicCD=0.6; let speed=700; let proj=new Projectile(this,this.x+Math.cos(this.angle)*(this.radius+6),this.y+Math.sin(this.angle)*(this.radius+6),this.angle,speed,110,900,'#aee7ff',6,false,false,false,0,0,false,0); proj.onHit = (enemy)=>{ try{ let prev = this.basicHitStacks.get(enemy) || 0; prev++; if(prev>=3){ enemy.moonMark = Math.max(enemy.moonMark||0,6.0); enemy.moonMarkOwner = this; this.basicHitStacks.set(enemy,0); for(let i=0;i<6;i++) particles.push(new Particle(enemy.x,enemy.y,'#dfefff',3,0.4)); } else { this.basicHitStacks.set(enemy, prev); } }catch(_){} }; projectiles.push(proj); }
            abilityQ(){ this.qCD=5.0; let orb = new MoonOrb(this,this.x+Math.cos(this.angle)*(this.radius+8),this.y+Math.sin(this.angle)*(this.radius+8),this.angle,1500,1000,700,750); projectiles.push(orb); this.revealTimer=1.0; for(let i=0;i<20;i++) particles.push(new Particle(this.x,this.y,'#cfe6ff',4,0.6)); if(this.isPlayer) screenShake(12); }
            abilityE(){
                this.eCD=6.0; let knockback = 500;
                ringEffects.push({ x: this.x, y: this.y, life: 1.1, duration: 1.1, maxRadius: 260, color: '#dfefff' });
                for(let i=0;i<40;i++){ let a=Math.random()*Math.PI*2; let s=220+Math.random()*260; let px = this.x + Math.cos(a)*18; let py = this.y + Math.sin(a)*18; particles.push(new Particle(px, py, '#dfefff', 4, 0.9, Math.cos(a)*s, Math.sin(a)*s)); }
                for(let i=0;i<14;i++){ let a=(Math.PI*2*i)/14; particles.push(new Particle(this.x + Math.cos(a)*80, this.y + Math.sin(a)*80, '#f7f2ff', 3, 1.0)); }
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){ let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2); if(d<220){ e.takeDamage(450,this); let ang=Math.atan2(e.y-this.y,e.x-this.x); e.kbx = Math.cos(ang) * 900; e.kby = Math.sin(ang) * 900; e.moonMark = Math.max(e.moonMark||0,6.0); e.moonMarkOwner = this; e.revealTimer = 1.0; e.slowTimer = Math.max(e.slowTimer || 0, 2.0); e.enhancedKBTimer = Math.max(e.enhancedKBTimer || 0, 0.9); for(let i=0;i<12;i++)particles.push(new Particle(e.x,e.y,'#dfefff',4,0.6)); } }
                if(this.isPlayer) screenShake(14);
            }
            abilityF(){ // ultimate: float + dash
                this.fCD = 15.0;
                this.floatingTimer = 1.2; this.isDashingUlt = true; this.ultChargeT = 0.6; this.hp = Math.min(this.maxHp, this.hp + 100); this.revealTimer = 1.0; if(this.isPlayer) screenShake(12);
                ringEffects.push({ x: this.x, y: this.y, life: 1.3, duration: 1.3, maxRadius: 350, color: '#dfefff' });
                for(let i=0;i<28;i++){ let a=Math.random()*Math.PI*2; let dist=30 + Math.random()*80; particles.push(new Particle(this.x + Math.cos(a)*dist, this.y + Math.sin(a)*dist, '#dfefff', 4, 1.1, Math.cos(a)*180, Math.sin(a)*180)); }
                for(let i=0;i<9;i++){ let a=(Math.PI*2*i)/9; particles.push(new Particle(this.x + Math.cos(a)*140, this.y + Math.sin(a)*140, '#f3f6ff', 3, 1.2)); }
                this._ultHitMoon = false; this._ultHitAny = false; this._ultHitEnemies = new Set();
            }
        }

        class BrunoAlexander extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#f2efe7' : '#b8b2a6', 6200);
                this.isPlayer = p;
                this.countsAsFFAHero = true;
                this.name = p ? 'Player (Bruno-Alexander)' : 'Enemy Bruno-Alexander';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0; this.rCD = 0;
                this.baseSpd = 210;
                this.speed = this.baseSpd;
                this.form = 'collar';
                this.ascended = false;
                this.eHitCount = 0;
                this.fUseCount = 0;
                this.qHoldTimer = 0;
                this.qHoldMax = 4;
                this.gChargeTimer = 0;
                this.chargeHoldBonus = false;
                this.basicSpeedBonus = false;
                this.basicSpeedTimer = 0;
                this.abilityHealTimer = 0;
                this.lastFrameQ = false;
                this.qBoostTriggered = false;
                this.gCharges = 0;
                this.maxGCharges = 0;
                this.swingTimer = 0;
            }
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.gCD > 0) this.gCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.basicSpeedTimer > 0) this.basicSpeedTimer -= dt;
                if (this.abilityHealTimer > 0) this.abilityHealTimer -= dt;
                if (this.swingTimer > 0) this.swingTimer -= dt;
                if (this.ascended && this.form === 'justice' && this.qHoldTimer > 0 && this.isPlayer && keys.q) {
                    this.qHoldTimer = Math.max(0, this.qHoldTimer - dt);
                    this.speed = this.baseSpd * 1.6;
                    this.basicSpeedBonus = true;
                    this.basicSpeedTimer = Math.max(this.basicSpeedTimer, 3.0);
                    this.hp = Math.min(this.maxHp, this.hp + 90 * dt * 2);
                    if (this.abilityHealTimer <= 0) {
                        this.abilityHealTimer = 0.5;
                        this.hp = Math.min(this.maxHp, this.hp + 90);
                    }
                    if (!this.qBoostTriggered && this.qHoldTimer <= 2.0) {
                        this.qBoostTriggered = true;
                    }
                } else {
                    this.qHoldTimer = Math.max(0, this.qHoldTimer - dt);
                    if (this.qHoldTimer <= 0) {
                        this.qBoostTriggered = false;
                        this.basicSpeedBonus = false;
                        this.speed = this.baseSpd;
                    }
                }
                if (this.ascended && this.form === 'justice' && this.basicSpeedBonus && this.basicSpeedTimer <= 0) {
                    this.basicSpeedBonus = false;
                    this.qCD = Math.max(this.qCD, 10);
                }
                const eReady = this.eHitCount >= 10;
                const fReady = this.fUseCount >= 3;
                if (!this.ascended && eReady && fReady) {
                    this.ascend();
                }
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (this.ascended && this.form === 'justice') {
                    if (mouse.down && this.basicCD <= 0) this.basicAtk();
                    if (keys.q && this.qCD <= 0) {
                        this.abilityQ();
                    }
                    if (keys.e && this.eCD <= 0) {
                        this.abilityE();
                    }
                    if (keys.f && this.fCD <= 0) {
                        this.abilityF();
                    }
                    if (keys.g && this.gCD <= 0) {
                        this.abilityG();
                    }
                } else {
                    if (mouse.down && this.basicCD <= 0) this.basicAtk();
                    if (keys.q && this.qCD <= 0) this.abilityQ();
                    if (keys.e && this.eCD <= 0) this.abilityE();
                    if (keys.f && this.fCD <= 0) this.abilityF();
                    if (keys.g && this.gCD <= 0) this.abilityG();
                }
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);
                if (this.ascended && this.form === 'justice') {
                    if (this.qCD <= 0 && d < 260) this.abilityQ();
                    if (this.eCD <= 0 && d < 180) this.abilityE();
                    if (this.fCD <= 0 && d < 210) this.abilityF();
                    if (this.gCD <= 0 && d < 500) this.abilityG();
                    else if (this.basicCD <= 0 && d < 90) this.basicAtk();
                } else {
                    if (this.qCD <= 0 && d < 250) this.abilityQ();
                    if (this.eCD <= 0 && d < 500) this.abilityE();
                    if (this.fCD <= 0 && d < 500) this.abilityF();
                    if (this.gCD <= 0 && d < 500) this.abilityG();
                    if (this.basicCD <= 0 && d < 110) this.basicAtk();
                }
                let move = new Vector2(Math.cos(this.angle), Math.sin(this.angle)).mult(spd * dt * 0.85);
                this.x += move.x;
                this.y += move.y;
            }
            basicAtk() {
                let justiceForm = this.ascended && this.form === 'justice';
                this.basicCD = justiceForm ? (this.basicSpeedBonus ? 0.12 : 0.2) : 2.0;
                if (!justiceForm) {
                    const baseDamage = 200;
                    let proj = new Projectile(this, this.x + Math.cos(this.angle) * (this.radius + 14), this.y + Math.sin(this.angle) * (this.radius + 14), this.angle, 800, 900, baseDamage, '#f2efe7', 14, false, false, false);
                    proj.dmg = baseDamage;
                    proj.range = 900;
                    proj.maxDistance = 900;
                    proj.isSword = true;
                    proj.isArrow = false;
                    proj.isSquare = false;
                    proj.safeTime = 0.02;
                    entities.push(proj);
                    this.revealTimer = 0.25;
                    return;
                }
                let damage = 90;
                let range = 140;
                let arc = Math.PI / 1.5;
                this.revealTimer = 0.35;
                this.swingTimer = 0.25;
                let hitAny = false;
                particles.push(new Slash(this.x, this.y, this.angle, range, arc, '#FFD166'));
                particles.push(new RectSlash(this.x + Math.cos(this.angle) * 28, this.y + Math.sin(this.angle) * 28, this.angle, range * 0.9, 18, '#FFD166'));
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x; let dy = e.y - this.y;
                        let d = Math.sqrt(dx * dx + dy * dy);
                        let ang = Math.atan2(dy, dx);
                        let offset = Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle)));
                        if (d < range + e.radius && offset < arc / 2) {
                            e.takeDamage(damage, this);
                            e.slowTimer = Math.max(e.slowTimer || 0, 0.8);
                            e.defDebuff = Math.max(e.defDebuff || 0, 2.0);
                            hitAny = true;
                        }
                    }
                }
                effectsAdd(new WaveShockwave(this.x + Math.cos(this.angle) * 55, this.y + Math.sin(this.angle) * 55, 120, 0.32, '#FFD166', '#FFF4B8'));
            }
            abilityQ() {
                if (this.ascended && this.form === 'justice') {
                    if (this.qCD > 0) return;
                    this.qCD = 11;
                    this.qHoldTimer = 4;
                    this.qBoostTriggered = false;
                    this.speed = this.baseSpd * 2.4;
                    this.qHoldMax = 4;
                    this.chargeHoldBonus = true;
                    this.basicSpeedBonus = true;
                    this.basicSpeedTimer = 3.0;
                    this.hp = Math.min(this.maxHp, this.hp + 70);
                    return;
                }
                this.qCD = 5;
                let dashDist = 180;
                this.x += Math.cos(this.angle) * dashDist;
                this.y += Math.sin(this.angle) * dashDist;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < 110) {
                            e.takeDamage(260, this);
                            e.slowTimer = Math.max(e.slowTimer || 0, 0.6);
                        }
                    }
                }
                this.revealTimer = 0.7;
            }
            abilityE() {
                if (this.ascended && this.form === 'justice') {
                    this.eCD = 6;
                    this.swingTimer = 0.35;
                    let swingCount = 2;
                    let firstDamage = 360;
                    let secondDamage = 360;
                    for (let i = 0; i < swingCount; i++) {
                        let offset = (i === 0 ? -0.42 : 0.42);
                        let startX = this.x + Math.cos(this.angle + offset) * 52;
                        let startY = this.y + Math.sin(this.angle + offset) * 52;
                        particles.push(new Slash(startX, startY, this.angle + offset, 180, Math.PI / 1.5, '#FFE27A'));
                        let swingHits = 0;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - startX) ** 2 + (e.y - startY) ** 2);
                                if (d < 120) {
                                    e.takeDamage((i === 0 ? firstDamage : secondDamage), this);
                                    e.slowTimer = Math.max(e.slowTimer || 0, 3.0);
                                    e.defDebuff = Math.max(e.defDebuff || 0, 3.0);
                                    swingHits += 1;
                                }
                            }
                        }
                        this.eHitCount += swingHits;
                    }
                    effectsAdd(new WaveShockwave(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, 180, 0.7, '#FFD166', '#FFF4B8'));
                    return;
                }
                this.eCD = 3;
                const eDamage = 700;
                let proj = new Projectile(this, this.x + Math.cos(this.angle) * (this.radius + 12), this.y + Math.sin(this.angle) * (this.radius + 12), this.angle, 760, 1000, eDamage, '#f7f3d3', 18, false, true, false);
                proj.dmg = eDamage;
                proj.pierce = true;
                proj.isSword = true;
                proj.isArrow = false;
                proj.isSquare = false;
                proj.onHit = (target) => {
                    if (target && typeof target.takeDamage === 'function') {
                        target.slowTimer = Math.max(target.slowTimer || 0, 3.0);
                    }
                    this.eHitCount = Math.min(10, this.eHitCount + 1);
                };
                entities.push(proj);
                this.revealTimer = 1.0;
            }
            abilityF() {
                if (this.ascended && this.form === 'justice') {
                    this.fCD = 12;
                    let radius = 260;
                    let circleCenterX = this.x + Math.cos(this.angle) * 80;
                    let circleCenterY = this.y + Math.sin(this.angle) * 80;
                    let totalDamage = 0;
                    let initialHitCount = 0;
                    let burst = () => {
                        let burstDamage = 0;
                        let burstHitCount = 0;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - circleCenterX) ** 2 + (e.y - circleCenterY) ** 2);
                                if (d < radius + e.radius) {
                                    e.takeDamage(720, this);
                                    burstDamage += 720;
                                    burstHitCount += 1;
                                    e.applyStatus('stun', 1.0, this);
                                    e.slowTimer = Math.max(e.slowTimer || 0, 3.0);
                                }
                            }
                        }
                        this.fUseCount += burstHitCount;
                        totalDamage += burstDamage;
                        if (totalDamage > 0) {
                            this.hp = Math.min(this.maxHp, this.hp + totalDamage * 0.6);
                        }
                        effectsAdd(new WaveShockwave(circleCenterX, circleCenterY, radius + 35, 0.8, '#ff8a5b', '#ff3d3d'));
                        effectsAdd(new AuraRing(circleCenterX, circleCenterY, 110, 0.5, '#ffd166', 10));
                        effectsAdd(new ImpactFlash(circleCenterX, circleCenterY, Math.random() * Math.PI * 2, 180, 0.6, '#ffdac1'));
                    };
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - circleCenterX) ** 2 + (e.y - circleCenterY) ** 2);
                            if (d < radius + e.radius) {
                                e.takeDamage(200, this);
                                totalDamage += 200;
                                initialHitCount += 1;
                                e.applyStatus('stun', 0.35, this);
                                e.slowTimer = Math.max(e.slowTimer || 0, 2.0);
                            }
                        }
                    }
                    this.fUseCount += initialHitCount;
                    this.swingTimer = 0.3;
                    particles.push(new Slash(circleCenterX, circleCenterY, this.angle, radius + 10, Math.PI / 1.5, '#FFD166'));
                    setTimeout(burst, 650);
                    return;
                }
                this.fCD = 15;
                const worldMouse = getMouseWorldPosition();
                const targetX = Math.min(WORLD_SIZE - 60, Math.max(60, worldMouse.x));
                const targetY = Math.min(WORLD_SIZE - 60, Math.max(60, worldMouse.y));
                const spawnX = targetX;
                const spawnY = targetY - 500;
                const cube = new Projectile(this, spawnX, spawnY, Math.PI / 2, 500, 800, 0, '#f8b195', 34, false, false, false);
                cube.isSquare = true;
                cube.isFallingSquare = true;
                cube.maxDistance = 800;
                cube.safeTime = 0.02;
                cube.dropDelay = 0.09;
                cube.target = { x: targetX, y: targetY };
                cube.baseSize = 34;
                cube.onExplode = () => {
                    let hitCount = 0;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - targetX) ** 2 + (e.y - targetY) ** 2);
                            if (d < 220) {
                                e.takeDamage(800, this);
                                e.injuredTimer = Math.max(e.injuredTimer || 0, 6.0);
                                hitCount += 1;
                            }
                        }
                    }
                    if (hitCount > 0) this.fUseCount += hitCount;
                    for (let i = 0; i < 28; i++) {
                        const ang = (Math.PI * 2 * i) / 28;
                        const r = 18 + (i / 28) * 52;
                        particles.push(new Particle(targetX + Math.cos(ang) * r, targetY + Math.sin(ang) * r, '#ffb38a', 11, 1.1));
                    }
                    effectsAdd(new WaveShockwave(targetX, targetY, 300, 1.1, '#ffb38a', '#ff4b4b'));
                    effectsAdd(new AuraRing(targetX, targetY, 150, 0.7, '#ffd9a8', 18));
                    effectsAdd(new ImpactFlash(targetX, targetY, Math.random() * Math.PI * 2, 250, 0.9, '#fff1ba'));
                    effectsAdd(new WaveShockwave(targetX, targetY, 90, 0.45, '#ffd9a8', '#ffffff'));
                };
                cube.update = function(dt) {
                    if (this.dropDelay > 0) {
                        this.dropDelay -= dt;
                        this.y += 80 * dt;
                        return;
                    }
                    this.y += 820 * dt;
                    this.size = Math.max(6, this.size - 42 * dt);
                    this.angle = (this.angle || 0) + dt * 3.2;
                    if (this.y >= this.target.y + 18) {
                        this.del = true;
                        this.handleExplosion();
                    }
                };
                cube.isHoming = false;
                cube.x = spawnX;
                cube.y = spawnY;
                cube.target = { x: targetX, y: targetY };
                cube.vx = 0;
                cube.vy = 0;
                effectsAdd(new WaveShockwave(targetX, targetY - 140, 120, 0.5, '#f8b195', '#ffe0b2'));
                entities.push(cube);
                if (this.isPlayer) addKillMsg('Attempt Zero!');
            }
            abilityG() {
                if (!this.ascended || this.form !== 'justice') return;
                if (this.gCD > 0) return;
                this.gCD = 20;
                const worldMouse = getMouseWorldPosition();
                const targetX = Math.min(WORLD_SIZE - 60, Math.max(60, worldMouse.x));
                const targetY = Math.min(WORLD_SIZE - 60, Math.max(60, worldMouse.y));
                const spawnX = targetX;
                const spawnY = targetY - 540;
                const cube = new Projectile(this, spawnX, spawnY, Math.PI / 2, 0, 630, 1200, '#ff7b54', 32, false, false, false);
                cube.isSquare = true;
                cube.isFallingSquare = true;
                cube.maxDistance = 1500;
                cube.safeTime = 0.04;
                cube.dropDelay = 0.12;
                cube.target = { x: targetX, y: targetY };
                cube.baseSize = 32;
                cube.onExplode = () => {
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - targetX) ** 2 + (e.y - targetY) ** 2);
                            if (d < 220) {
                                e.takeDamage(630, this);
                                e.slowTimer = Math.max(e.slowTimer || 0, 2.8);
                                e.injuredTimer = Math.max(e.injuredTimer || 0, 6.0);
                            }
                        }
                    }
                    effectsAdd(new WaveShockwave(targetX, targetY, 220, 1.0, '#ff9b6a', '#d72626'));
                    effectsAdd(new AuraRing(targetX, targetY, 120, 0.6, '#ffd166', 16));
                    effectsAdd(new ImpactFlash(targetX, targetY, Math.random() * Math.PI * 2, 200, 0.8, '#fff0c2'));
                };
                cube.update = function(dt) {
                    if (this.dropDelay > 0) {
                        this.dropDelay -= dt;
                        this.y += 110 * dt;
                        this.angle = (this.angle || 0) + dt * 2.6;
                        return;
                    }
                    this.y += 980 * dt;
                    this.size = Math.max(8, this.size - 58 * dt);
                    this.angle = (this.angle || 0) + dt * 4.5;
                    if (this.y >= this.target.y + 18) {
                        this.del = true;
                        this.handleExplosion();
                    }
                };
                cube.vx = 0;
                cube.vy = 0;
                particles.push(new Slash(this.x, this.y, this.angle, 260, Math.PI / 1.2, '#FFD166'));
                effectsAdd(new WaveShockwave(targetX, targetY - 180, 120, 0.4, '#ff9b6a', '#ffd9a8'));
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < 260) {
                            e.takeDamage(200, this);
                            e.applyStatus('stun', 0.35, this);
                            e.slowTimer = Math.max(e.slowTimer || 0, 1.8);
                        }
                    }
                }
                entities.push(cube);
            }
            ascend() {
                this.ascended = true;
                this.form = 'justice';
                this.baseSpd = 250;
                this.speed = this.baseSpd;
                this.maxHp = 6800;
                this.hp = Math.min(this.maxHp, this.hp + 3400);
                this.shield = Math.min(this.maxHp * 0.5, this.shield + 900);
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
            }
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            draw(ctx) {
                super.draw(ctx);
                if (this.ascended && this.form === 'justice') {
                    ctx.strokeStyle = '#d72626';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 12, 0, Math.PI * 2);
                    ctx.stroke();
                    if (this.swingTimer > 0) {
                        ctx.strokeStyle = '#ffd166';
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 18 + (this.swingTimer * 30), this.angle - 1.1, this.angle + 1.1);
                        ctx.stroke();
                    }
                }
            }
        }

        class Noob extends Entity {
            constructor(x,y,p){super(x,y,25,p?'#f1c40f':'#d4ac0d',6500);this.isPlayer=p;this.countsAsFFAHero = true;this.name=p?"Player (Noob)":"Enemy Noob";this.basicCD=0;this.qCD=0;this.eCD=0;this.fCD=0;this.baseSpd=260;this.speed=260;this.drink=false;this.drinkT=0;this.buff=false;this.buffT=0;this.sd=1;this.st=0;this.firstAttacksAfterDrink=0;}
            update(dt){if(this.dead)return;this.updateCommon(dt);if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.fCD>0)this.fCD-=dt;if(this.rCD>0)this.rCD-=dt;if(this.drink){this.drinkT-=dt;if(this.drinkT<=0){this.drink=false;this.buff=true;this.shield+=700;this.buffT=5.0;this.firstAttacksAfterDrink=2;if(this.isPlayer)addKillMsg("Bloxy Power!");}else this.speed=this.baseSpd*0.75;}else if(this.buff){this.buffT-=dt;this.speed=this.baseSpd*1.5;if(this.buffT<=0){this.buff=false;this.speed=this.baseSpd;}}else this.speed=this.baseSpd;if(this.stunTimer>0 || this.freezeTimer>0){if(this.isPlayer)updateHUD(this);return;}let spd=this.getEffectiveSpeed();if(this.isPlayer){this.input(dt,spd);updateHUD(this);}else this.ai(dt,spd);}
            input(dt,spd){let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}this.angle=getMouseAimAngle(this.x, this.y);if(this.drink)return;if(mouse.down&&this.basicCD<=0)this.sword();if(keys.q&&this.qCD<=0)this.doDrink();if(keys.e&&this.eCD<=0)this.rocket();if(keys.f&&this.fCD<=0)this.laser();if(keys.r&&this.rCD<=0)this.useGear();}
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                if(this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if(!t || Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) >= 200) {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        return;
                    }
                }
                let t=this.findTarget();if(!t){this.wander(dt,spd);return;}let dx=t.x-this.x,dy=t.y-this.y;this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;let d=Math.sqrt(dx*dx+dy*dy);let mx=0,my=0;this.st-=dt;if(this.st<=0){this.sd*=-1;this.st=0.5+Math.random()*1.5;}let dd=80;if((this.eCD<=0||this.fCD<=0)&&this.hp>1500)dd=450;if(d>dd){mx+=Math.cos(this.angle);my+=Math.sin(this.angle);}else if(d<dd-50){mx-=Math.cos(this.angle);my-=Math.sin(this.angle);}if(d<800){mx-=Math.sin(this.angle)*this.sd*0.8;my+=Math.cos(this.angle)*this.sd*0.8;}let l=Math.sqrt(mx*mx+my*my);if(l>0){let moveSpeed = spd * 0.9 * (0.8 + Math.random() * 0.4);this.x+=(mx/l)*moveSpeed*dt;this.y+=(my/l)*moveSpeed*dt;}if(!this.drink){if(this.fCD<=0&&d<800)this.laser();else if(this.eCD<=0&&d<600)this.rocket();else if(this.basicCD<=0&&d<160)this.sword();else if(this.qCD<=0&&(d>400||this.hp<this.maxHp*0.5))this.doDrink();}}
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            sword(){this.revealTimer=0.5;particles.push(new Slash(this.x,this.y,this.angle,160,Math.PI/1.5));for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<160){let ad=Math.abs(Math.atan2(e.y-this.y,e.x-this.x)-this.angle);if(ad>Math.PI)ad=2*Math.PI-ad;if(ad<Math.PI/3){let dmg=150;if(this.firstAttacksAfterDrink>0){dmg*=2.5;e.stunTimer=Math.max(e.stunTimer,1.0);this.firstAttacksAfterDrink--;}e.takeDamage(dmg,this);e.revealTimer=1.0;}}this.basicCD=this.buff?0.4:0.8;}
            doDrink(){this.drink=true;this.drinkT=2.0;this.qCD=11.0;if(this.isPlayer)addKillMsg("Drinking Cola...");}
            rocket(){this.revealTimer=1.0;this.eCD=7.0;entities.push(new Projectile(this,this.x,this.y,this.angle,500,700,1000,'#f40',10,false,false,true));this.x-=Math.cos(this.angle)*15;this.y-=Math.sin(this.angle)*15;}
            laser(){this.revealTimer=1.0;this.fCD=5.0;for(let i=0;i<20;i++)particles.push(new Particle(this.x + Math.cos(this.angle)*i*40, this.y + Math.sin(this.angle)*i*40, '#ff0000', 3, 0.5));for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team){let dx=e.x-this.x,dy=e.y-this.y,d=Math.sqrt(dx*dx+dy*dy);if(d<800){let ad=Math.abs(Math.atan2(dy,dx)-this.angle);if(ad>Math.PI)ad=2*Math.PI-ad;if(ad<0.1){e.takeDamage(400,this);e.defDebuff=5.0;e.revealTimer=1.0;}}}if(this.isPlayer)screenShake(10);}
            draw(ctx){if(this.drink){ctx.fillStyle='#fff';ctx.font='12px Arial';ctx.fillText("Drinking...",this.x-camera.x-20,this.y-camera.y-40);}if(this.buff){ctx.strokeStyle='#0f0';ctx.lineWidth=4;ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+8,0,Math.PI*2);ctx.stroke();}super.draw(ctx);}
        }

        class Kaiser extends Entity {
            constructor(x,y,p){super(x,y,22,p?'#8e44ad':'#6c3483',6000);this.isPlayer=p;this.countsAsFFAHero = true;this.name=p?"Player (Kaiser)":"Enemy Kaiser";this.basicCD=0;this.qCD=0;this.eCD=0;this.fCD=0;this.gCD=0;this.baseSpd=220;this.speed=220;this.dash=false;this.dashT=0;this.dd=new Vector2(0,0);this.dh=[];this.emp=false;this.sd=1;this.st=0;this.speedBoostTimer=0;}
            update(dt){if(this.dead)return;this.updateCommon(dt);if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.fCD>0)this.fCD-=dt;if(this.gCD>0)this.gCD-=dt;if(this.rCD>0)this.rCD-=dt;if(this.speedBoostTimer>0){this.speedBoostTimer-=dt;if(this.speedBoostTimer<=0)this.speed=this.baseSpd;}if(this.dash){this.dashT-=dt;this.x+=this.dd.x*1000*dt;this.y+=this.dd.y*1000*dt;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&!this.dh.includes(e)){if(Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<this.radius+e.radius+10){this.dh.push(e);this.qCD=Math.max(0,this.qCD-5);let h=this.emp?250:150;this.hp=Math.min(this.maxHp,this.hp+h);if(this.isPlayer)addKillMsg(`Dash Heal +${h}`);particles.push(new Particle(this.x,this.y,'#0f0',3,0.5));}}if(this.dashT<=0)this.dash=false;if(this.isPlayer)updateHUD(this);}if(this.stunTimer>0 || this.freezeTimer>0){if(this.isPlayer)updateHUD(this);return;}let spd=this.getEffectiveSpeed();if(this.isPlayer){this.input(dt,spd);updateHUD(this);}else this.ai(dt,spd);}
            input(dt,spd){if(this.dash)return;let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}this.angle=getMouseAimAngle(this.x, this.y);if(mouse.down&&this.basicCD<=0)this.kick();if(keys.q&&this.qCD<=0)this.impact();if(keys.e&&this.eCD<=0)this.doDash();if(keys.f&&this.fCD<=0)this.doEmp();if(keys.g&&this.gCD<=0&&this.canLMS())this.lmsAbility();if(keys.r&&this.rCD<=0)this.useGear();}
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                if(this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if(!t || Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) >= 200) {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        return;
                    }
                }
                if(this.dash)return;let t=this.findTarget();if(!t){this.wander(dt,spd);return;}let dx=t.x-this.x,dy=t.y-this.y;this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;let d=Math.sqrt(dx*dx+dy*dy);let mx=0,my=0;this.st-=dt;if(this.st<=0){this.sd*=-1;this.st=0.3+Math.random();}if(d>60){mx+=Math.cos(this.angle);my+=Math.sin(this.angle);}else if(d<40){mx-=Math.cos(this.angle);my-=Math.sin(this.angle);}if(d>100&&d<600){mx-=Math.sin(this.angle)*this.sd*0.6;my+=Math.cos(this.angle)*this.sd*0.6;}let l=Math.sqrt(mx*mx+my*my);if(l>0){let moveSpeed = spd * 1.0 * (0.8 + Math.random() * 0.4);this.x+=(mx/l)*moveSpeed*dt;this.y+=(my/l)*moveSpeed*dt;}if(this.fCD<=0&&d<250)this.doEmp();else if(this.qCD<=0&&d<900)this.impact();else if(this.eCD<=0&&d>150&&d<550)this.doDash();else if(this.basicCD<=0&&d<180)this.kick();}
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            kick(){this.revealTimer=0.5;this.basicCD=0.5;particles.push(new RectSlash(this.x,this.y,this.angle,180,60));for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team){let dx=e.x-this.x,dy=e.y-this.y;let rx=dx*Math.cos(-this.angle)-dy*Math.sin(-this.angle);let ry=dx*Math.sin(-this.angle)+dy*Math.cos(-this.angle);if(rx>-e.radius&&rx<180+e.radius&&ry>-30-e.radius&&ry<30+e.radius){e.takeDamage(100,this);e.revealTimer=1.0;particles.push(new Particle(e.x,e.y,'#fff',3,0.3));}}}
            impact(){this.revealTimer=1.0;this.qCD=10.0;let h=this.emp?-250:-150;entities.push(new Projectile(this,this.x,this.y,this.angle,1500,1200,1000,'#8e44ad',15,false,true,false,h));if(this.isPlayer)screenShake(5);}
            doDash(){this.eCD=4.0;this.dash=true;this.dashT=0.3;this.dh=[];this.dd=new Vector2(Math.cos(this.angle),Math.sin(this.angle));for(let i=0;i<5;i++)particles.push(new Particle(this.x,this.y,'#fff',3,0.5));}
            doEmp(){this.fCD=15.0;this.emp=true;this.qCD=Math.max(0,this.qCD-5);this.eCD=Math.max(0,this.eCD-2);for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<300){e.takeDamage(500,this);e.revealTimer=1.0;}for(let i=0;i<30;i++)particles.push(new Particle(this.x,this.y,'#fd0',8,1.5));if(this.isPlayer)screenShake(15);setTimeout(()=>this.emp=false,2000);}
            canLMS() {
                let kaiCount = 0, kaiserCount = 0, otherCount = 0;
                for (let e of entities) {
                    if (!e.dead && e instanceof Entity && !e.isPlayer && !(e instanceof Sentry) && !(e instanceof Tripmine)) {
                        if (e instanceof Kai) kaiCount++;
                        else if (e instanceof Kaiser) kaiserCount++;
                        else otherCount++;
                    }
                }
                return kaiCount > 0 && kaiserCount > 0 && otherCount === 0; // Only Kai and Kaiser remaining
            }
            lmsAbility() {
                this.speed = this.baseSpd * 2;
                this.speedBoostTimer = 10;
                this.qCD = 0;
                this.gCD = 30;
                if(this.isPlayer)addKillMsg('LMS Activated!');
            }
            draw(ctx){if(this.emp){ctx.save();ctx.translate(this.x-camera.x,this.y-camera.y-this.radius-15);ctx.fillStyle='#fd0';ctx.beginPath();ctx.moveTo(-15,0);ctx.lineTo(-15,-15);ctx.lineTo(-5,-5);ctx.lineTo(0,-20);ctx.lineTo(5,-5);ctx.lineTo(15,-15);ctx.lineTo(15,0);ctx.fill();ctx.restore();}super.draw(ctx);}
        }

        class Tate extends Entity {
            constructor(x,y,p){super(x,y,22,p?'#5d4037':'#3e2723',8500);this.isPlayer=p;this.countsAsFFAHero = true;this.name=p?"Player (Tate)":"Enemy Tate";this.basicCD=0;this.qCD=0;this.eCD=0;this.fCD=0;this.baseSpd=300;this.speed=300;this.punch=false;this.pT=0;this.pC=0;this.drive=false;this.dT=0;this.empKick=false;this.sd=1;this.st=0;this.bugattiShield=false;this.currentSkin='default';this.skinIcon=null;}
            update(dt){
                if(this.dead)return;this.updateCommon(dt);if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.fCD>0)this.fCD-=dt;if(this.rCD>0)this.rCD-=dt;
                if(this.punch){this.pT-=dt;if(this.pT<=0){this.pT=0.1;this.pC--;this.firePunch();if(this.pC<=0)this.punch=false;}}
                if(this.drive){
                    this.speed=this.baseSpd*2.5;
                    // nitro trail for Real Top G skin
                    if(this.currentSkin==='Real Top G'){
                        for(let i=0;i<2;i++){
                            let a = this.angle + Math.PI + (Math.random()-0.5)*0.4;
                            let dist = 25 + Math.random()*15;
                            particles.push(new Particle(this.x + Math.cos(a)*dist, this.y + Math.sin(a)*dist,'#ff6b35',4,0.25));
                        }
                    }
                    this.dT-=dt;if(this.dT<=0)this.endDrive();
                    for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2)<50){this.explodeCar();this.endDrive();break;}
                    if(this.x<=50||this.x>=WORLD_SIZE-50||this.y<=50||this.y>=WORLD_SIZE-50){this.explodeCar();this.endDrive();}
                }else this.speed=this.baseSpd;
                if((this.stunTimer>0 || this.freezeTimer>0)&&!this.drive){if(this.isPlayer)updateHUD(this);return;}let spd=this.getEffectiveSpeed();
                if(this.isPlayer){this.input(dt,spd);updateHUD(this);}else this.ai(dt,spd);
            }
            input(dt,spd){let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;if(this.drive)this.angle=Math.atan2(dy,dx);}if(!this.drive)this.angle=getMouseAimAngle(this.x, this.y);if(!this.drive){if(mouse.down&&this.basicCD<=0)this.basicAtk();if(keys.q&&this.qCD<=0)this.doKick();if(keys.e&&this.eCD<=0)this.doFlurry();if(keys.f&&this.fCD<=0)this.doBugatti();if(keys.r&&this.rCD<=0)this.useGear();}}
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                if(this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if(!t || Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) >= 200) {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        return;
                    }
                }
                if(this.drive){let t=this.findTarget();if(t){let dx=t.x-this.x,dy=t.y-this.y;this.angle=Math.atan2(dy,dx);this.x+=Math.cos(this.angle)*this.speed*dt;this.y+=Math.sin(this.angle)*this.speed*dt;}return;}
                let t=this.findTarget();if(!t)return;let dx=t.x-this.x,dy=t.y-this.y;this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;let d=Math.sqrt(dx*dx+dy*dy);
                let mx=0,my=0;this.st-=dt;if(this.st<=0){this.sd*=-1;this.st=0.5+Math.random()*1.5;}if(d>50){mx+=Math.cos(this.angle);my+=Math.sin(this.angle);}else if(d<30){mx-=Math.cos(this.angle);my-=Math.sin(this.angle);}if(d>100){mx-=Math.sin(this.angle)*this.sd*0.5;my+=Math.cos(this.angle)*this.sd*0.5;}let l=Math.sqrt(mx*mx+my*my);if(l>0){let moveSpeed = spd * 0.95 * (0.8 + Math.random() * 0.4);this.x+=(mx/l)*moveSpeed*dt;this.y+=(my/l)*moveSpeed*dt;}
                if(this.fCD<=0&&d>300)this.doBugatti();else if(this.eCD<=0&&d<200)this.doFlurry();else if(this.qCD<=0&&d<100)this.doKick();else if(this.basicCD<=0&&d<100)this.basicAtk();
            }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            basicAtk(){
                this.basicCD=0.7;this.revealTimer=0.5;
                if(this.currentSkin==='Real Top G'){
                    // Activation burst - spinning rings
                    for(let i=0;i<12;i++){
                        particles.push(new Particle(this.x+Math.cos(this.angle+i*Math.PI/6)*40,this.y+Math.sin(this.angle+i*Math.PI/6)*40,'#ff6b35',5,0.7));
                    }
                    // Center flash
                    for(let i=0;i<8;i++)particles.push(new Particle(this.x,this.y,'#ffaa00',6,0.5));
                }
                if(this.empKick){
                    this.empKick=false;
                    // ENHANCED basic attack - mega kick projectile with glow
                    if(this.currentSkin==='Real Top G'){
                        let proj = new Projectile(this,this.x,this.y,this.angle,900,500,350,'#ffff00',45,false,false,false,0,0.5,true);
                        entities.push(proj);
                        // Add glow effect linked to projectile
                        let glow = new GlowProjectile(this.x,this.y,this.angle,900,proj);
                        effects.push(glow);
                        // Extra yellow vortex effect
                        for(let i=0;i<35;i++){
                            let a = Math.random()*Math.PI*2;
                            let r = 20+Math.random()*40;
                            particles.push(new Particle(this.x+Math.cos(a)*r,this.y+Math.sin(a)*r,'#ffff00',6,1.0));
                        }
                        // Activation ring burst
                        for(let i=0;i<16;i++){
                            particles.push(new Particle(this.x+Math.cos(this.angle+i*Math.PI/8)*50,this.y+Math.sin(this.angle+i*Math.PI/8)*50,'#ffff99',7,0.9));
                        }
                        if(this.isPlayer)addKillMsg("MEGA KICK!");
                        screenShake(5);
                    } else {
                        entities.push(new Projectile(this,this.x,this.y,this.angle,900,500,350,'#00ffff',40,false,false,false,0,0.5,true));
                    }
                }else{
                    if(this.currentSkin==='Real Top G'){
                        // Enhanced punch pair with glow trails linked to projectiles
                        let p1 = new Projectile(this,this.x,this.y,this.angle-0.2,600,70,80,'#ff6b35',14);
                // Gear activation (R)
                if (keys.r && this.rCD <= 0) this.useGear();
                        let p2 = new Projectile(this,this.x,this.y,this.angle+0.2,600,70,80,'#ff6b35',14);
                        entities.push(p1,p2);
                        let glow1=new GlowProjectile(this.x,this.y,this.angle-0.2,600,p1);
                        let glow2=new GlowProjectile(this.x,this.y,this.angle+0.2,600,p2);
                        effects.push(glow1,glow2);
                    } else {
                        entities.push(new Projectile(this,this.x,this.y,this.angle-0.2,600,70,80,'#ffd700',12));
                        entities.push(new Projectile(this,this.x,this.y,this.angle+0.2,600,70,80,'#ffd700',12));
                    }
                }
            }
            doKick(){
                    this.qCD=7.0;this.shield+=600;this.empKick=true;
                    if(this.isPlayer){addKillMsg("Shielded");let sounds=getSkinSounds('tate',this.currentSkin);if(sounds&&sounds.q){let audio=new Audio(sounds.q);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){onlineSocket.emit('abilitySound',{ability:'q',x:this.x,y:this.y,heroType:'tate',skin:this.currentSkin});}}
                    if(this.currentSkin==='Real Top G'){
                        // Shield activation vortex effect
                        for(let i=0;i<24;i++){
                            let ang = i * Math.PI / 12;
                            particles.push(new Particle(this.x+Math.cos(ang)*60,this.y+Math.sin(ang)*60,'#ff6b35',5,0.8));
                        }
                        // Shield glow pulses
                        for(let i=0;i<15;i++)particles.push(new Particle(this.x,this.y,'#ffaa00',6,0.6));
                        // Shield ring outline
                        for(let r=40;r<=80;r+=20){
                            for(let i=0;i<8;i++){
                                particles.push(new Particle(this.x+Math.cos(i*Math.PI/4)*r,this.y+Math.sin(i*Math.PI/4)*r,'#ff6b35',4,0.7));
                            }
                        }
                        screenShake(3);
                    } else {
                        for(let i=0;i<10;i++)particles.push(new Particle(this.x,this.y,'#0ff',3,0.5));
                    }
                }
            doFlurry(){
                    this.eCD=6.0;this.punch=true;this.pC=25;this.pT=0;
                    if(this.isPlayer){let sounds=getSkinSounds('tate',this.currentSkin);if(sounds&&sounds.e){let audio=new Audio(sounds.e);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){onlineSocket.emit('abilitySound',{ability:'e',x:this.x,y:this.y,heroType:'tate',skin:this.currentSkin});}}
                    if(this.currentSkin==='Real Top G'){
                        // Spiral combo startup effect
                        for(let i=0;i<25;i++){
                            let ang = this.angle + i*0.3;
                            let r = 30+i*3;
                            particles.push(new Particle(this.x+Math.cos(ang)*r,this.y+Math.sin(ang)*r,'#ff6b35',5,0.8));
                        }
                        // Forward burst
                        for(let i=0;i<20;i++){
                            let offset = (Math.random()-0.5)*0.4;
                            particles.push(new Particle(this.x+Math.cos(this.angle+offset)*40,this.y+Math.sin(this.angle+offset)*40,'#ffaa00',6,0.7));
                        }
                        // Directional vortex
                        for(let i=0;i<12;i++){
                            particles.push(new Particle(this.x+Math.cos(this.angle+i*Math.PI/6)*50,this.y+Math.sin(this.angle+i*Math.PI/6)*50,'#ff6b35',4,0.9));
                        }
                        screenShake(4);
                    }
                }
            doBugatti(){
                    this.fCD=25.0;this.drive=true;this.dT=5.0;this.shield+=850;this.bugattiShield=true;
                    if(this.isPlayer){
                        addKillMsg("BUGATTI TIME");
                        let sounds=getSkinSounds('tate',this.currentSkin);
                        if(sounds&&sounds.f){let audio=new Audio(sounds.f);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}
                        if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){onlineSocket.emit('abilitySound',{ability:'f',x:this.x,y:this.y,heroType:'tate',skin:this.currentSkin});}
                    }
                    if(this.currentSkin==='Real Top G'){
                        // big orange explosion
                        for(let i=0;i<60;i++){
                            let a=Math.random()*Math.PI*2;
                            let r=30+Math.random()*150;
                            particles.push(new Particle(this.x+Math.cos(a)*r,this.y+Math.sin(a)*r,'#ff6b35',6,0.9));
                        }
                        // pure orange shockwave
                        effectsAdd(new WaveShockwave(this.x,this.y,400,0.9,'#ff6b35','#ff6b35'));
                        // additional ring burst
                        for(let i=0;i<30;i++){
                            let a=Math.random()*Math.PI*2;
                            let r=100+Math.random()*100;
                            particles.push(new Particle(this.x+Math.cos(a)*r,this.y+Math.sin(a)*r,'#ff6b35',5,0.7));
                        }
                        screenShake(12);
                    }
                }
            endDrive(){
                if(this.bugattiShield){
                    this.shield = Math.max(0, this.shield - 850);
                    this.bugattiShield = false;
                }
                this.drive=false;
            }
            explodeCar(){
                    if(this.currentSkin==='Real Top G'){
                        for(let i=0;i<60;i++)particles.push(new Particle(this.x,this.y,'#ff6b35',10,1.2));
                        effectsAdd(new WaveShockwave(this.x,this.y,300,1.0,'#ff6b35','#ff6b35'));
                    } else {
                        for(let i=0;i<30;i++)particles.push(new Particle(this.x,this.y,'#f40',8,1.0));
                    }
                    for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2)<200){e.takeDamage(800,this);e.stunTimer=1.0;e.revealTimer=1.0;}
                    if(this.isPlayer)screenShake(20);
                }
            firePunch(){
                if(this.currentSkin==='Real Top G'){
                    let a=this.angle+(Math.random()-0.5)*0.5;
                    let proj = new Projectile(this,this.x,this.y,a,700,38,220,'#ff6700',11);
                    entities.push(proj);
                    let glow=new GlowProjectile(this.x,this.y,a,700,proj);
                    effects.push(glow);
                } else {
                    let a=this.angle+(Math.random()-0.5)*0.5;
                    entities.push(new Projectile(this,this.x,this.y,a,700,35,200,'#ff6d00',10));
                }
            }
            draw(ctx){
                if(this.drive){
                    ctx.save();
                    ctx.translate(this.x-camera.x,this.y-camera.y);
                    ctx.rotate(this.angle);
                    // car color based on skin
                    if(this.currentSkin==='Real Top G'){
                        ctx.fillStyle='#ff6b35';  // Andrew Tate Bugatti orange
                    } else {
                        ctx.fillStyle='#b71c1c';   // default red
                    }
                    ctx.fillRect(-20,-10,40,20);
                    // Add bright orange outline for Real Top G
                    if(this.currentSkin==='Real Top G'){
                        ctx.strokeStyle='#ffaa00';
                        ctx.lineWidth=2;
                        ctx.strokeRect(-20,-10,40,20);
                    }
                    ctx.fillStyle='#000';
                    ctx.fillRect(10,-10,5,20);
                    ctx.fillRect(-15,-12,8,4);
                    ctx.fillRect(15,-12,8,4);
                    ctx.fillRect(-15,8,8,4);
                    ctx.fillRect(15,8,8,4);
                    ctx.restore();
                }
                else{
                    if(this.currentSkin!=='default'){
                        if(!drawSkinImage(ctx, this, 'tate', this.currentSkin, '#ff6b35', { filter: 'brightness(0.9) saturate(0.85)', alpha: 0.98 })) {
                            super.draw(ctx);
                        }
                    } else {
                        super.draw(ctx);
                    }
                    // draw default aiming line (same length as other heroes)
                    ctx.beginPath();
                    ctx.moveTo(this.x-camera.x,this.y-camera.y);
                    ctx.lineTo((this.x-camera.x)+Math.cos(this.angle)*(this.radius+10),(this.y-camera.y)+Math.sin(this.angle)*(this.radius+10));
                    ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();
                }
                if(this.empKick){ctx.strokeStyle='#00ffff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+5,0,Math.PI*2);ctx.stroke();}
            }
        }

        class Edgar extends Entity {
            constructor(x,y,p){super(x,y,18,p?'#2c3e50':'#1a252f',4500);this.isPlayer=p;this.countsAsFFAHero = true;this.name=p?"Player (Edgar)":"Enemy Edgar";this.basicCD=0;this.qCD=0;this.eCD=0;this.fCD=0;this.baseSpd=240;this.speed=240;this.empStab=false;this.swingCount=0;this.swingT=0;this.swinging=false;this.chargingUlt=false;this.ultChargeT=0;this.isDashingUlt=false;this.sd=1;this.st=0;this.regenT=0;}
            update(dt){
                if(this.dead)return;this.updateCommon(dt);if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.fCD>0)this.fCD-=dt;if(this.rCD>0)this.rCD-=dt;if(this.stunTimer>0 || this.freezeTimer>0 || this.freezeTimer>0){if(this.isPlayer)updateHUD(this);return;}
                if(this.regenT>0){this.regenT-=dt;this.hp=Math.min(this.maxHp, this.hp + 150*dt);}
                if(this.swinging){this.swingT-=dt;if(this.swingT<=0){this.swingT=0.1;this.doSwing(this.swingCount);this.swingCount++;if(this.swingCount>=5)this.swinging=false;}}
                if(this.isDashingUlt){this.x+=Math.cos(this.angle)*800*dt;this.y+=Math.sin(this.angle)*800*dt;this.ultChargeT-=dt;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2)<60){e.takeDamage(900,this);this.hp=Math.min(this.maxHp, this.hp+450);e.takeDamage(0,this);this.isDashingUlt=false;if(this.isPlayer)screenShake(10);break;}if(this.ultChargeT<=0)this.isDashingUlt=false;}
                let spd=this.getEffectiveSpeed();if(this.isPlayer){this.input(dt,spd);updateHUD(this);}else this.ai(dt,spd);
            }
            input(dt,spd){if(this.isDashingUlt)return;if(keys.f&&this.fCD<=0){this.chargingUlt=true;this.speed=this.baseSpd*0.5;}else if(this.chargingUlt){this.chargingUlt=false;this.isDashingUlt=true;this.ultChargeT=1.5;this.fCD=25.0;}else this.speed=this.baseSpd;let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}this.angle=getMouseAimAngle(this.x, this.y);if(this.chargingUlt)return;if(mouse.down&&this.basicCD<=0)this.stab();if(keys.q&&this.qCD<=0)this.shadowDash();if(keys.e&&this.eCD<=0)this.knifeSwing();if(keys.r&&this.rCD<=0)this.useGear();}
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                if(this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if(!t || Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) >= 200) {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        return;
                    }
                }
                let t=this.findTarget();if(!t){this.wander(dt,spd);return;}
                let dx=t.x-this.x,dy=t.y-this.y;this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;let d=Math.sqrt(dx*dx+dy*dy);
                this.st-=dt;if(this.st<=0){this.sd*=-1;this.st=0.5+Math.random()*1.5;}
                let mx=0,my=0;
                if(d>50){mx+=Math.cos(this.angle);my+=Math.sin(this.angle);}else if(d<30){mx-=Math.cos(this.angle);my-=Math.sin(this.angle);}
                if(d>100&&d<500){mx-=Math.sin(this.angle)*this.sd*0.7;my+=Math.cos(this.angle)*this.sd*0.7;}
                let l=Math.sqrt(mx*mx+my*my);if(l>0){let moveSpeed = spd * 1.0 * (0.8 + Math.random() * 0.4);this.x+=(mx/l)*moveSpeed*dt;this.y+=(my/l)*moveSpeed*dt;}
                if(this.fCD<=0 && this.hp<1000 && d>200) { this.chargingUlt=true; setTimeout(()=>{this.chargingUlt=false; this.isDashingUlt=true; this.ultChargeT=1.5; this.fCD=25.0;}, 500); }
                else if(d<100&&this.basicCD<=0)this.stab();
                else if(d<200&&this.qCD<=0)this.shadowDash();
                else if(d<150&&this.eCD<=0)this.knifeSwing();
            }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            stab(){
                this.basicCD=0.25;
                if(this.empStab){this.empStab=false;entities.push(new Projectile(this,this.x,this.y,this.angle,800,700,200,'#8e44ad',10,false,false,false,-420,0,false,3));}
                else{entities.push(new Projectile(this,this.x,this.y,this.angle,800,100,150,'#fff',5,false,false,false,0,0,true));} 
            }
            shadowDash(){this.qCD=8.0;this.x+=Math.cos(this.angle)*150;this.y+=Math.sin(this.angle)*150;this.empStab=true;this.regenT=3.0;for(let i=0;i<5;i++)particles.push(new Particle(this.x,this.y,'#2c3e50',4,0.5));} 
            knifeSwing(){this.eCD=8.0;this.swinging=true;this.swingCount=0;this.swingT=0;}
            doSwing(c){let dmg=c==4?500:200;let st=c==4?0.5:0;let r=120;let arc=Math.PI/2;particles.push(new Slash(this.x,this.y,this.angle,r,arc,c==4?'#ff0000':'#e74c3c'));for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<r){let ad=Math.abs(Math.atan2(e.y-this.y,e.x-this.x)-this.angle);if(ad>Math.PI)ad=2*Math.PI-ad;if(ad<arc/2){e.takeDamage(dmg,this);if(st>0)e.applyStatus('stun', st, this);}}}
            draw(ctx){
                if(this.chargingUlt){ctx.save();ctx.translate(this.x-camera.x,this.y-camera.y);ctx.strokeStyle='#f00';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);ctx.stroke();ctx.restore();}
                super.draw(ctx);if(this.empStab){ctx.strokeStyle='#8e44ad';ctx.lineWidth=3;ctx.beginPath();ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+5,0,Math.PI*2);ctx.stroke();}
            }
        }

        class Sentry extends Entity {
            constructor(o,x,y){
                super(x,y,15,'#bdc3c7',3000);this.owner=o;this.built=false;this.buildT=3.0;this.shootT=0;this.team=o.team; this.countsAsFFAHero = false;
            }
            update(dt){
                if(this.dead)return;
                if(this.buildT>0){this.buildT-=dt;if(this.buildT<=0)this.built=true;}
                else{
                    this.shootT-=dt;
                    if(this.shootT<=0){
                        let t=this.findTarget();
                        if(t){
                            // Faster fire rate and projectile speed while owner's overclock is active
                            let fireInterval = (this.owner && this.owner.overclock) ? 0.3 : 0.5;
                            let projSpeed = (this.owner && this.owner.overclock) ? 1600 : 1200;
                            this.shootT = fireInterval;
                            let ang=Math.atan2(t.y-this.y,t.x-this.x);
                            // Sentry projectiles ignore the Sentry itself by spawn offset
                            entities.push(new Projectile(this.owner,this.x + Math.cos(ang)*25,this.y + Math.sin(ang)*25,ang,projSpeed,20,600,'#f1c40f',4,false,false,false,0,0,false,2));
                        }
                    }
                }
            }
            findTarget(){
                let closest = null;
                let minD = 600; // Range
                for (let e of entities) {
                    if (e.dead || !(e instanceof Entity)) continue;
                    if (e.team === this.team) continue; // Friendly
                    
                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                    if (d < minD) {
                        minD = d;
                        closest = e;
                    }
                }
                return closest;
            }
            draw(ctx){
                if(this.dead)return;
                let cx=this.x-camera.x,cy=this.y-camera.y;
                if(this.buildT>0){
                    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.arc(cx,cy,this.radius,0,Math.PI*2);ctx.fill();
                    ctx.fillStyle='#0f0';ctx.fillRect(cx-15,cy-25,30*(1-this.buildT/3),5);
                }else{
                    ctx.fillStyle=this.owner.name && this.owner.name.includes('Chimera')?'#9b59b6':'#7f8c8d';ctx.beginPath();ctx.rect(cx-10,cy-10,20,20);ctx.fill();
                    ctx.fillStyle='#f39c12';ctx.beginPath();ctx.arc(cx,cy-5,8,0,Math.PI*2);ctx.fill();
                    let bx=cx-15,by=cy-30;
                    ctx.fillStyle='red';ctx.fillRect(bx,by,30,4);
                    ctx.fillStyle='#0f0';ctx.fillRect(bx,by,30*(this.hp/3000),4);
                }
            }
        }

           class Tripmine extends Entity {
               constructor(o,x,y){super(x,y,10,'#8e44ad',100);this.owner=o;this.active=true;this.hp=100;this.armTime=1.5;this.team=o.team; this.countsAsFFAHero = false; this.invincibleTimer = 0.6;} 
             update(dt){
                 if(this.dead)return;
                 if(this.invincibleTimer > 0) this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
                 if(this.armTime>0){this.armTime-=dt;return;}
                 for(let e of entities){
                     if(e.dead || !(e instanceof Entity)) continue;
                     if(e.team === this.team) continue; // Don't explode on friends
                     if(Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2)<100) {
                         this.explode(); break;
                     }
                 }
             }
             explode(){
                 this.active=false; this.invincibleTimer = 0;
                 this.dead=true;
                 for(let i=0;i<20;i++)particles.push(new Particle(this.x,this.y,'#8e44ad',6,0.8));
                 for(let e of entities){
                     if(e.dead || !(e instanceof Entity)) continue;
                     if(e.team === this.team) continue;
                     if(Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2)<200) {
                         e.takeDamage(1000,this.owner); e.applyStatus('stun', 1.0, this.owner);
                     }
                 }
                 if(this.owner.isPlayer)screenShake(10);
             }
             draw(ctx){
                 if(!this.active)return;
                 let cx=this.x-camera.x, cy=this.y-camera.y;
                 ctx.fillStyle='rgba(142, 68, 173, 0.4)'; // Transparent purple
                 ctx.beginPath();ctx.arc(cx,cy,10,0,Math.PI*2);ctx.fill();
                 if(this.armTime<=0){ctx.strokeStyle='#8e44ad';ctx.lineWidth=2;ctx.stroke();}
             }
        }

        class Builderman extends Entity {
            constructor(x,y,p){super(x,y,20,p?'#f39c12':'#d35400',5500);this.isPlayer=p;this.countsAsFFAHero = true;this.name=p?"Player (Builderman)":"Enemy Builder";
                this.currentSkin = 'default'; this.skinIcon = null;
                this.basicCD=0;this.qCD=0;this.eCD=0;this.fCD=0;this.baseSpd=200;this.speed=200;
                this.sentry=null; this.overclock=false; this.ocTime=0; this.sd=1; this.st=0;
                this.mines=[];
                // Ultimate charge system: up to 2 charges, 0.5s minimum delay between uses when charges remain
                this.fCharges = 2;
                this.maxFCharges = 2;
                this._fChargeTimer = 0; // time until next charge when not full
                this._lastFUseTimer = 0; // short inter-use lock (0.5s)
            }
            update(dt){
                if(this.dead)return;this.updateCommon(dt);
                if(this.basicCD>0)this.basicCD-=dt;if(this.qCD>0)this.qCD-=dt;if(this.eCD>0)this.eCD-=dt;if(this.rCD>0)this.rCD-=dt;
                // Ultimate charge timers
                if (this._lastFUseTimer > 0) this._lastFUseTimer = Math.max(0, this._lastFUseTimer - dt);
                if (this.fCharges < this.maxFCharges) {
                    if (this._fChargeTimer > 0) {
                        this._fChargeTimer = Math.max(0, this._fChargeTimer - dt);
                        this.fCD = this._fChargeTimer;
                    }
                    if (this._fChargeTimer <= 0) {
                        this.fCharges = Math.min(this.maxFCharges, this.fCharges + 1);
                        if (this.fCharges < this.maxFCharges) this._fChargeTimer = 8.0; else this._fChargeTimer = 0;
                        this.fCD = Math.max(0, this._fChargeTimer);
                    }
                } else {
                    this._fChargeTimer = 0; this.fCD = 0;
                }
                if(this.stunTimer>0){if(this.isPlayer)updateHUD(this);return;}
                if(this.sentry && this.sentry.dead) { this.sentry=null; this.qCD=2.0; }
                if(this.overclock) {
                    this.ocTime-=dt; this.speed=this.baseSpd*1.5;
                    if(this.ocTime<=0) { this.overclock=false; this.speed=this.baseSpd; }
                }
                
                // Mine Cleanup
                this.mines = this.mines.filter(m => !m.dead);

                let spd=this.getEffectiveSpeed();
                if(this.isPlayer){this.input(dt,spd);updateHUD(this);}else this.ai(dt,spd);
            }
            input(dt,spd){
                let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;
                if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}
                this.angle=getMouseAimAngle(this.x, this.y);
                if(mouse.down&&this.basicCD<=0) this.attack();
                if(keys.q&&this.qCD<=0&&!this.sentry) this.buildSentry();
                if(keys.e&&this.eCD<=0) this.doOverclock();
                // Use fCharges and a small inter-use timer instead of raw fCD
                if(keys.f && this.fCharges > 0 && this._lastFUseTimer <= 0) this.placeMine();
                if(keys.r&&this.rCD<=0) this.useGear();
            }
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                if(this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if(!t || Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) >= 200) {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        return;
                    }
                }
                let t=this.findTarget();
                let dx=0,dy=0;
                
                // Advanced AI: Kiting & Trapping
                this.st-=dt;if(this.st<=0){this.sd*=-1;this.st=0.5+Math.random()*1.5;}
                
                if(t) {
                     dx=t.x-this.x; dy=t.y-this.y; this.angle=Math.atan2(dy,dx);
                     let d=Math.sqrt(dx*dx+dy*dy);
                     let mx=0,my=0;
                     
                     // If we have ranged mode or a sentry, KITE aggressively
                     if(this.overclock || this.sentry) {
                         if(d < 300) { // Too close, run away
                             mx-=Math.cos(this.angle); my-=Math.sin(this.angle);
                         } else if (d > 500) { // Too far, get closer
                             mx+=Math.cos(this.angle); my+=Math.sin(this.angle);
                         } else { // Sweet spot, strafe
                             mx-=Math.sin(this.angle)*this.sd*0.8;
                             my+=Math.cos(this.angle)*this.sd*0.8;
                         }
                     } else {
                         // Melee mode, close in but carefully
                         if(d > 60) { mx+=Math.cos(this.angle); my+=Math.sin(this.angle); }
                         if(d < 400) { // Strafe on approach
                             mx-=Math.sin(this.angle)*this.sd*0.5;
                             my+=Math.cos(this.angle)*this.sd*0.5;
                         }
                     }
                     
                     let l=Math.sqrt(mx*mx+my*my);if(l>0){this.x+=(mx/l)*spd*dt;this.y+=(my/l)*spd*dt;}
                     
                     if(this.basicCD<=0 && ((this.overclock && d<500) || (!this.overclock && d<120))) this.attack();
                } else {
                    if(Math.random()<0.02)this.angle+=(Math.random()-0.5)*2;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;
                }

                if(!this.sentry && this.qCD<=0 && Math.random()<0.02) this.buildSentry();
                if(!this.overclock && this.eCD<=0 && t && Math.sqrt((t.x-this.x)**2+(t.y-this.y)**2)<500) this.doOverclock();
                if(this.fCharges>0 && this._lastFUseTimer<=0 && Math.random()<0.01) this.placeMine();
            }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            
            attack() {
                if(this.overclock) {
                    this.basicCD=0.1;
                    entities.push(new Projectile(this,this.x,this.y,this.angle,900,40,500,'#f39c12',6));
                } else {
                    this.basicCD=1.5;
                    particles.push(new Slash(this.x,this.y,this.angle,120,Math.PI,'#f39c12'));
                    for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<120){
                        let ad=Math.abs(Math.atan2(e.y-this.y,e.x-this.x)-this.angle);if(ad>Math.PI)ad=2*Math.PI-ad;
                        if(ad<Math.PI/2){e.takeDamage(200,this);}
                    }
                }
            }
            buildSentry() {
                this.sentry = new Sentry(this, this.x, this.y);
                entities.push(this.sentry);
            }
            doOverclock() {
                this.eCD=15.0; this.overclock=true; this.ocTime=5.0;
                for(let i=0;i<10;i++)particles.push(new Particle(this.x,this.y,'#f39c12',3,0.5));
            }
            placeMine() {
                // consume a charge
                if (this.fCharges <= 0) return;
                // enforce short inter-use delay (0.5s) between successive placements
                if (this._lastFUseTimer > 0) return;
                this.fCharges--;
                this._lastFUseTimer = 0.5;
                // start per-charge recharge if not full
                if (this._fChargeTimer <= 0 && this.fCharges < this.maxFCharges) {
                    this._fChargeTimer = 8.0;
                    this.fCD = this._fChargeTimer;
                }
                if(this.mines.length >= 2) {
                     let oldMine = this.mines.shift();
                     if(oldMine && !oldMine.dead) oldMine.explode();
                }
                let m = new Tripmine(this, this.x, this.y);
                this.mines.push(m);
                entities.push(m);
            }
            draw(ctx){
                if (this.currentSkin === 'Goblin Builderman') {
                    ctx.save();
                    ctx.translate(this.x - camera.x, this.y - camera.y);
                    ctx.rotate(this.angle);

                    ctx.beginPath();
                    ctx.fillStyle = '#39d98a';
                    ctx.arc(0, 0, 14, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.fillStyle = '#10b981';
                    ctx.arc(0, -12, 9, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.fillStyle = '#d1fae5';
                    ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
                    ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.strokeStyle = '#d1fae5';
                    ctx.lineWidth = 2;
                    ctx.arc(0, 2, 4, 0.2, Math.PI - 0.2);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.fillStyle = '#a7f3d0';
                    ctx.arc(18, 4, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    return;
                }
                super.draw(ctx);
                ctx.save(); ctx.translate(this.x-camera.x, this.y-camera.y); ctx.rotate(this.angle);
                ctx.fillStyle='#f1c40f'; ctx.fillRect(-10,-10,20,20); // Hat
                if(this.overclock) {
                     ctx.fillStyle='#e67e22'; ctx.beginPath(); ctx.arc(15, 5, 8, 0, Math.PI*2); ctx.fill(); // Arm Cannon
                }
                ctx.restore();
            }
        }

        // LightHero (Renamed from Light)
        class LightHero extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#f1c40f' : '#f39c12', 6200);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Light)" : "Enemy Light";
                this.currentSkin = 'default'; this.skinIcon = null;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 250; 
                this.speed = this.baseSpd;
                this.stacks = 0;
                this.stackCooldownReset = false; // Flag to track if cooldowns already reset at 3 stacks
                this.tempCDResetTimer = 0;
                this.chargeResetLockTimer = 0;
                this.lastUsedAbility = null;
                this.pendingDragonStab = false;
                this.history = []; // Array of saved positions for rewind indicator / reverse travel
                this.rewindHistory = [];
                this.rewindAnchor = null;
                this.rewindClock = 0;
                this.qKeyPressed = false;
                this.eKeyPressed = false;
                this.fKeyPressed = false;
                this.dashing = false; this.dashT = 0; 
                this.startDashAngle = 0;
                this.empowered = false;
                this.st=0; this.sd=1;
                this.hitEnemies = new Set();
                this.speedBoostTimer = 0;
            }
            
            getRGBLightColor() {
                if (this.currentSkin !== 'RGB Light') return '#f1c40f';
                const hue = (performance.now() * 0.06) % 360;
                return `hsl(${hue}, 92%, 62%)`;
            }

            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                
                this.history.push({x:this.x, y:this.y});
                if(this.history.length > 120) this.history.shift(); 
                this.rewindClock += dt;
                if (this.isPlayer || this.team === 0) {
                    this.rewindHistory.push({ x: this.x, y: this.y, t: this.rewindClock });
                    if (this.rewindHistory.length > 180) this.rewindHistory.shift();
                }
                
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                if(this.tempCDResetTimer > 0) {
                    this.tempCDResetTimer -= dt;
                    if(this.tempCDResetTimer <= 0) this.stackCooldownReset = false;
                }
                if(this.chargeResetLockTimer > 0) this.chargeResetLockTimer -= dt;
                if(this.speedBoostTimer > 0) {
                    this.speedBoostTimer -= dt;
                    this.speed = this.baseSpd * 1.5;
                } else {
                    this.speed = this.baseSpd;
                }
                if(this.stunTimer > 0) { if(this.isPlayer) updateHUD(this); return; }

                if(this.dashing) {
                    this.dashT -= dt;
                    // Curved Dash Logic: Aggressively steer towards mouse/target
                    let targetAngle;
                    if (this.isPlayer) {
                         targetAngle = getMouseAimAngle(this.x, this.y);
                    } else {
                         // AI Logic for dash direction (towards current facing)
                         targetAngle = this.angle; 
                    }
                    
                    // Smoothly rotate current angle towards target angle
                    let diff = targetAngle - this.angle;
                    while (diff <= -Math.PI) diff += Math.PI*2;
                    while (diff > Math.PI) diff -= Math.PI*2;
                    
                    this.angle += diff * 15 * dt; // Increased turn speed for better curve
                    
                    this.x += Math.cos(this.angle) * 800 * dt;
                    this.y += Math.sin(this.angle) * 800 * dt;
                    
                    for(let e of entities) {
                        if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2) < 50 && !this.hitEnemies.has(e)) {
                             this.hitEnemies.add(e);
                             let dmg = this.empowered ? 500 * 1.15 : 500;
                             e.takeDamage(dmg, this);
                             this.hp = Math.min(this.maxHp, this.hp + dmg); // 100% Lifesteal logic assumed from prompt
                             if(this.isPlayer) addKillMsg(`Dash Hit +${Math.ceil(dmg)} HP`);
                        }
                    }
                    
                    if(this.dashT <= 0) this.dashing = false;
                }

                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            resetThreeStackCooldowns() {
                const keys = ['q', 'e', 'f'];
                for (const key of keys) {
                    const cdProp = key + 'CD';
                    this[cdProp] = Math.max(0, (this[cdProp] || 0) - 2);
                }
            }

            applyLightCooldownRefund(abilityKey = this.lastUsedAbility || 'q') {
                // Keep the Light stack passive unchanged, but reduce the refunded cooldowns
                // to a much smaller value so the stack doesn't become a full cooldown reset.
                const refund = 0.75;
                const keys = ['q', 'e', 'f'];
                for (const key of keys) {
                    const cdProp = key + 'CD';
                    const reduction = key === abilityKey ? refund : Math.min(refund, 0.5);
                    this[cdProp] = Math.max(0, (this[cdProp] || 0) - reduction);
                }
            }

            recordAbilityCharge(abilityKey = this.lastUsedAbility || 'q') {
                // Keep the full 3-charge state alive until the next actual ability use.
                // The passive stack logic remains unchanged; only the cooldown refund is reduced.
                this.stacks = Math.min(3, (this.stacks || 0) + 1);
                if (this.stacks >= 3) {
                    this.pendingDragonStab = true;
                    this.stacks = 3;
                    this.chargeResetLockTimer = 0.5;
                    this.stackCooldownReset = true;
                    this.tempCDResetTimer = 0.5;

                    this.applyLightCooldownRefund(abilityKey);

                    if(this.isPlayer) addKillMsg(`LIGHT RECHARGE: ${abilityKey.toUpperCase()}`);
                    for(let i=0; i<10; i++) particles.push(new Particle(this.x, this.y, '#fff', 5, 0.5));
                    return true;
                }
                return false;
            }

            addStack() {
                this.recordAbilityCharge();
            }
            
            useAbility() {
                if(this.stacks < 3) {
                    this.addStack();
                }
                // Note: Abilities don't consume stacks, only Basic Attack consumes full stacks
            }

            input(dt, spd) {
                if(this.dashing) return;
                let dx=0,dy=0;if(keys.w)dy--;if(keys.s)dy++;if(keys.a)dx--;if(keys.d)dx++;
                if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}
                this.angle=getMouseAimAngle(this.x, this.y);
                
                if(this.chargeResetLockTimer > 0) {
                    if(mouse.down && this.basicCD <= 0) this.basicAtk();
                    if(!keys.q) this.qKeyPressed = false;
                    if(!keys.e) this.eKeyPressed = false;
                    if(!keys.f) this.fKeyPressed = false;
                    return;
                }
                
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(keys.q && this.qCD <= 0 && !this.qKeyPressed) { this.qKeyPressed = true; this.lightCircle(); }
                if(keys.e && this.eCD <= 0 && !this.eKeyPressed) { this.eKeyPressed = true; this.curvedDash(); }
                if(keys.f && this.fCD <= 0 && !this.fKeyPressed) { this.fKeyPressed = true; this.rewind(); }
                if(!keys.q) this.qKeyPressed = false;
                if(!keys.e) this.eKeyPressed = false;
                if(!keys.f) this.fKeyPressed = false;
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            
            ai(dt, spd) {
                // Don't attack or move if this is a practice training dummy
                if(this.isTrainingPracticeDummy) { 
                    // Stay completely still - no movement at all
                    return; 
                }
                
                if(this.handleSafeZone(dt)) return;
                if(this.dashing) return;
                let t=this.findTarget();
                let cube = this.findNearestHealthCube();
                let cubeInVision = cube && Math.sqrt((cube.x - this.x)**2 + (cube.y - this.y)**2) < 800;
                
                // Pursue cube if found in vision and health is not critical
                if(cubeInVision && this.hp < this.maxHp * 0.7) {
                    let dx = cube.x - this.x, dy = cube.y - this.y;
                    this.angle = Math.atan2(dy, dx);
                    let d = Math.sqrt(dx*dx + dy*dy);
                    if (d > 20) {
                        let moveSpeed = spd * 1.2;
                        this.x += Math.cos(this.angle) * moveSpeed * dt;
                        this.y += Math.sin(this.angle) * moveSpeed * dt;
                    }
                    // Still attack if enemy is very close
                    if(t && Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) < 200 && this.basicCD <= 0) {
                        if(this.magicBurst) { this.magicBurst(); this.basicCD = 1.5; }
                        else if(this.basicAtk) { this.basicAtk(); this.basicCD = 0.8; }
                    }
                    return;
                }
                
                if(this.hp < this.maxHp * 0.3) {
                    if (cube) {
                        let dx = cube.x - this.x, dy = cube.y - this.y;
                        this.angle = Math.atan2(dy, dx);
                        let d = Math.sqrt(dx*dx + dy*dy);
                        if (d > 20) {
                            let moveSpeed = spd * 1.2;
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                    } else {
                        this.angle += (Math.random() - 0.5) * 0.3;
                        let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                        this.x += Math.cos(this.angle) * moveSpeed * dt;
                        this.y += Math.sin(this.angle) * moveSpeed * dt;
                    }
                    return;
                }
                if(!t) { this.wander(dt,spd); return; }
                
                let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx);
                let d=Math.sqrt(dx*dx+dy*dy);
                
                if(d > 50) { this.x+=Math.cos(this.angle)*spd*dt; this.y+=Math.sin(this.angle)*spd*dt; }
                
                if(d < 200 && this.qCD <= 0 && this.lightCircle) this.lightCircle();
                if(d > 200 && d < 400 && this.eCD <= 0 && this.curvedDash) this.curvedDash();
                if(this.hp < 2000 && this.fCD <= 0 && this.rewind) this.rewind();
                if(d < 100 && this.basicCD <= 0) { if(this.magicBurst) { this.magicBurst(); this.basicCD = 1.5; } else if(this.basicAtk) { this.basicAtk(); this.basicCD = 0.8; } }
            }

            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.02)this.angle+=(Math.random()-0.5)*2;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}

            basicAtk() {
                const empoweredStab = this.pendingDragonStab || this.stacks >= 3;
                const lightColor = this.getRGBLightColor();
                if(empoweredStab) {
                     // Empowered: Light Dragon Front Stab
                     this.basicCD = 0.5;
                     this.pendingDragonStab = false;
                     this.stacks = 0; // Reset stacks after consuming to allow building again
                     this.stackCooldownReset = false; // Allow cooldown reset to happen again next cycle
                     this.tempCDResetTimer = 0;
                     this.empowered = false; // Reset state if any
                     
                     // Visual: Big Slash or Projectile? "Front Stab" implies a thrust.
                     // Using a large, fast projectile that pierces
                     const stabRange = 260;
                     let hitCount = 0;
                     for(let e of entities) {
                         if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2) < stabRange) {
                             let ad=Math.abs(Math.atan2(e.y-this.y,e.x-this.x)-this.angle);if(ad>Math.PI)ad=2*Math.PI-ad;
                             if(ad < Math.PI/2.2) {
                                 e.takeDamage(650, this);
                                 this.hp = Math.min(this.maxHp, this.hp + 325);
                                 hitCount++;
                             }
                         }
                     }
                     if(hitCount > 0) {
                         if(this.isPlayer) addKillMsg(`LIGHT DRAGON STAB +${hitCount * 325} HP`);
                     }
                     effectsAdd(new ImpactFlash(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, lightColor, 30, 0.35));
                     entities.push(new Projectile(this, this.x, this.y, this.angle, 1000, 800, 260, lightColor, 20, false, true, false, 0, 0, true, 5.0)); // Slow IV (40%)
                     if(this.isPlayer) addKillMsg("LIGHT DRAGON STAB!");
                } else {
                     // Normal: Slash (Updated from projectile)
                     this.basicCD = 0.5;
                     particles.push(new Slash(this.x, this.y, this.angle, 120, Math.PI/1.5, lightColor));
                     for(let e of entities) {
                         if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2) < 120) {
                             let ad=Math.abs(Math.atan2(e.y-this.y,e.x-this.x)-this.angle);if(ad>Math.PI)ad=2*Math.PI-ad;
                             if(ad < Math.PI/3) e.takeDamage(100, this);
                         }
                     }
                }
            }
            
            lightCircle() {
                const usedAbility = 'q';
                const lightColor = this.getRGBLightColor();
                this.lastUsedAbility = usedAbility;
                const recharged = this.recordAbilityCharge(usedAbility);
                if (!recharged) this.qCD = 4.0;
                this.speedBoostTimer = 3.0;
                particles.push(new Slash(this.x, this.y, this.angle, 150, Math.PI*2, lightColor)); 
                let hit = false;
                for(let e of entities) {
                    if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2) < 150) {
                        e.takeDamage(this.empowered ? 750 * 1.15 : 750, this);
                        hit = true;
                    }
                }
                if(hit) { this.hp = Math.min(this.maxHp, this.hp + 500); if(this.isPlayer) addKillMsg("Hit! +500 HP"); } 
                else { this.hp = Math.min(this.maxHp, this.hp + 150); if(this.isPlayer) addKillMsg("Miss +150 HP"); }
                if (this.stacks >= 3) this.stacks = 0;
            }
            
            curvedDash() {
                const usedAbility = 'e';
                const lightColor = this.getRGBLightColor();
                this.lastUsedAbility = usedAbility;
                const recharged = this.recordAbilityCharge(usedAbility);
                if (!recharged) this.eCD = 5.0;
                this.dashing = true;
                this.dashT = 0.35;
                this.startDashAngle = this.angle;
                this.hitEnemies.clear();
                if (this.stacks >= 3) this.stacks = 0;
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, lightColor, 4, 0.6));
                }
            }
            
            rewind() {
                const usedAbility = 'f';
                const rewindColor = this.getRGBLightColor();
                this.lastUsedAbility = usedAbility;
                const recharged = this.recordAbilityCharge(usedAbility);
                if (!recharged) this.fCD = 10.0;

                const anchorTime = this.rewindAnchor ? this.rewindAnchor.t : this.rewindClock;
                const targetTime = Math.max(0, anchorTime - 2.0);
                let target = null;

                for (let i = this.rewindHistory.length - 1; i >= 0; i--) {
                    const spot = this.rewindHistory[i];
                    if (spot.t <= targetTime) {
                        target = spot;
                        break;
                    }
                }

                if (!target && this.rewindHistory.length > 0) {
                    target = this.rewindHistory[0];
                }

                if (target) {
                    this.x = target.x;
                    this.y = target.y;
                    this.rewindAnchor = { x: this.x, y: this.y, t: this.rewindClock };
                    let dmg = 800;
                    for(let i=0; i<20; i++) particles.push(new Particle(this.x, this.y, rewindColor, 6, 0.8));
                    for(let e of entities) {
                         if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((this.x-e.x)**2+(this.y-e.y)**2) < 200) {
                             e.takeDamage(dmg, this);
                             e.attackLockoutTimer = Math.max(e.attackLockoutTimer || 0, 0.35);
                             e.stunTimer = Math.max(e.stunTimer || 0, 0.25);
                         }
                    }
                    if(this.isPlayer) screenShake(10);
                }

                if (this.stacks >= 3) this.stacks = 0;
            }
            
            draw(ctx) {
                const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.12;
                const hueBase = this.currentSkin === 'RGB Light' ? (performance.now() * 0.06) % 360 : 45;
                const auraColor = this.currentSkin === 'RGB Light' ? `hsl(${hueBase}, 92%, 62%)` : (this.stacks >= 3 ? '#fff' : this.stacks >= 2 ? '#ffd166' : '#f1c40f');

                if (this.currentSkin === 'RGB Light') {
                    const prevColor = this.color;
                    this.color = auraColor;
                    super.draw(ctx);
                    this.color = prevColor;

                    ctx.save();
                    ctx.translate(this.x - camera.x, this.y - camera.y);
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.lineWidth = 2 - i * 0.5;
                        ctx.strokeStyle = i === 0 ? `hsla(${(hueBase + 30) % 360}, 95%, 70%, 0.7)` : i === 1 ? `hsla(${(hueBase + 90) % 360}, 95%, 68%, 0.55)` : `hsla(${(hueBase + 160) % 360}, 90%, 65%, 0.35)`;
                        ctx.arc(0, 0, this.radius + 10 + i * 8 + (this.stacks * 2), 0, Math.PI * 2);
                        ctx.stroke();
                    }

                    ctx.beginPath();
                    ctx.fillStyle = `hsla(${(hueBase + 120) % 360}, 90%, 70%, 0.22)`;
                    ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.fillStyle = auraColor;
                    ctx.globalAlpha = 0.35 + this.stacks * 0.08;
                    ctx.arc(0, 0, this.radius + 12 + this.stacks * 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    if(this.isPlayer && this.history.length >= 120) {
                        let oldPos = this.history[0];
                        ctx.save();
                        const rewindColor = `hsla(${(hueBase + 210) % 360}, 95%, 70%, 0.45)`;
                        ctx.fillStyle = rewindColor;
                        ctx.beginPath();
                        ctx.arc(oldPos.x - camera.x, oldPos.y - camera.y, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = `hsla(${(hueBase + 260) % 360}, 95%, 75%, 0.7)`;
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    }

                    if(this.stacks > 0) {
                         ctx.save(); ctx.translate(this.x-camera.x, this.y-camera.y);
                         ctx.fillStyle = auraColor;
                         for(let i=0; i<this.stacks; i++) {
                             ctx.beginPath(); ctx.arc(0, -this.radius - 10 - (i*5), 3, 0, Math.PI*2); ctx.fill();
                         }
                         ctx.restore();
                    }
                    return;
                }

                ctx.save();
                ctx.translate(this.x - camera.x, this.y - camera.y);

                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.lineWidth = 2 - i * 0.5;
                    ctx.strokeStyle = i === 0 ? 'rgba(255, 255, 255, 0.55)' : i === 1 ? 'rgba(255, 209, 102, 0.5)' : 'rgba(241, 196, 15, 0.35)';
                    ctx.arc(0, 0, this.radius + 10 + i * 8 + (this.stacks * 2), 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
                ctx.arc(0, 0, this.radius * pulse, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = auraColor;
                ctx.globalAlpha = 0.25 + this.stacks * 0.08;
                ctx.arc(0, 0, this.radius + 12 + this.stacks * 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                if(this.isPlayer && this.history.length >= 120) {
                    let oldPos = this.history[0];
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 235, 59, 0.3)';
                    ctx.beginPath();
                    ctx.arc(oldPos.x - camera.x, oldPos.y - camera.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }
                
                if(this.stacks > 0) {
                     ctx.save(); ctx.translate(this.x-camera.x, this.y-camera.y);
                     ctx.fillStyle = this.stacks === 3 ? '#fff' : '#f1c40f';
                     for(let i=0; i<this.stacks; i++) {
                         ctx.beginPath(); ctx.arc(0, -this.radius - 10 - (i*5), 3, 0, Math.PI*2); ctx.fill();
                     }
                     ctx.restore();
                }
                super.draw(ctx);
            }
        }

        // Kai
        class Kai extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#8e44ad' : '#9b59b6', 7800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Kai)" : "Enemy Kai";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0; this.rCD = 0;
                this.baseSpd = 180;
                this.speed = this.baseSpd;
                this.energyBalls = [];
                this.inkPens = [];
                this.dashCount = 0;
                this.dashTimer = 0;
                this.circleTimer = 0;
                this.passiveDashes = 0;
                this.speedBoostTimer = 0;
                this.dashWindowTimer = 0;
                this.dashing = false;
                this.eCharges = 2;
                this.dashHits = new Set();
                this.touchHits = new Set();
                this.refillTimer = 0;
                this.chargeCD = 0;
                this.basicAttackDashUsed = false;
                this.dashSequenceEnded = true;
                this.dashSequenceActive = false; // Must manually trigger F to start new sequence
                this.circleEndTimer = 0; // Anti-cheat: tracks time since passive circle ended
                this.postCircleSequence = false; // Track if next sequence is after circle passive
                this.circleDelayTimer = 0; // Delay before circle passive starts
                this.autoDashIntervalTimer = 0;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.gCD > 0) this.gCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.refillTimer > 0) {
                    this.refillTimer -= dt;
                    if (this.refillTimer <= 0) {
                        this.eCharges = Math.min(2, this.eCharges + 1);
                        if (this.eCharges < 2) this.refillTimer = 7;
                    }
                }
                if (this.chargeCD > 0) this.chargeCD -= dt;
                if (this.circleEndTimer > 0) { 
                    this.circleEndTimer -= dt; 
                    if(this.circleEndTimer <= 0) this.dashSequenceActive = false; // Unlock dash after 3 seconds
                }
                if (this.speedBoostTimer > 0) {
                    this.speedBoostTimer -= dt;
                    if (this.speedBoostTimer <= 0) this.speed = this.baseSpd;
                }
                if (this.dashWindowTimer > 0) {
                    this.speed = this.baseSpd * 1.5;
                } else if (this.speedBoostTimer <= 0) {
                    this.speed = this.baseSpd;
                }
                if (this.circleDelayTimer > 0) {
                    this.circleDelayTimer -= dt;
                    if (this.circleDelayTimer <= 0) {
                        // Start the circle passive after delay, but don't stop the current dash
                        this.circleTimer = 2;
                        // Keep dashing active - only stop dash window
                        this.dashWindowTimer = 0; // Stop the dash window
                    }
                }
                if (this.circleTimer > 0) {
                    this.circleTimer -= dt;
                    if(this.circleTimer <= 0) { 
                        this.dashSequenceEnded = true;
                        this.dashSequenceActive = true; // Lock out new dash for 3 seconds
                        this.circleEndTimer = 3; // Start 3-second anti-cheat timer
                        this.postCircleSequence = false; // Reset post-circle flag when circle ends
                    }
                    let interval = 0.1;
                    if (Math.floor((this.circleTimer + dt) / interval) > Math.floor(this.circleTimer / interval)) {
                        let hitCount = 0;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 200) {
                                e.takeDamage(150, this);
                                hitCount++;
                                // Extra particles on hit
                                for (let i = 0; i < 4; i++) particles.push(new Particle(e.x, e.y, '#8e44ad', 3, 0.6));
                            }
                        }
                        // Heal 50 HP when hitting enemies
                        if (hitCount > 0) {
                            let healAmount = 50;
                            this.hp = Math.min(this.maxHp, this.hp + healAmount);
                            // Healing particles
                            for (let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y, '#0f0', 2, 0.5));
                        }
                        // Passive circle particles
                        for (let i = 0; i < 8; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            let dist = 150 + Math.random() * 50;
                            let px = this.x + Math.cos(angle) * dist;
                            let py = this.y + Math.sin(angle) * dist;
                            particles.push(new Particle(px, py, '#8e44ad', 2 + Math.random(), 0.5));
                        }
                    }
                }
                this.energyBalls = this.energyBalls.filter(ball => {
                    ball.update(dt);
                    return !ball.del;
                });
                this.inkPens = this.inkPens.filter(pen => {
                    pen.update(dt);
                    return !pen.del;
                });
                if (this.dashWindowTimer > 0) {
                    this.dashWindowTimer -= dt;
                    if (this.autoDashIntervalTimer > 0) this.autoDashIntervalTimer -= dt;
                    if (this.dashSequenceActive) {
                        let autoDashClose = false;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 220) {
                                autoDashClose = true;
                                break;
                            }
                        }
                        if (autoDashClose && this.dashCount < 5 && this.autoDashIntervalTimer <= 0) {
                            this.doExtraDash();
                            this.autoDashIntervalTimer = 0.6;
                        }
                        if (!autoDashClose) this.autoDashIntervalTimer = 0;
                    }
                    for (let ball of this.energyBalls) {
                        if (!ball.del && Math.sqrt((this.x - ball.x)**2 + (this.y - ball.y)**2) < 30) {
                            ball.del = true;
                            this.doExtraDash();
                        }
                    }
                    for (let pen of this.inkPens) {
                        if (!pen.del && Math.sqrt((this.x - pen.x)**2 + (this.y - pen.y)**2) < 30) {
                            pen.del = true;
                            this.doExtraDash();
                        }
                    }
                    if ((this.dashWindowTimer <= 0 || (this.dashWindowTimer > 0 && this.dashCount >= 5)) && !this.dashSequenceEnded) {
                        this.dashSequenceEnded = true;
                        this.dashSequenceActive = false; // Must press F again to start new sequence
                        if (this.dashWindowTimer > 0 && this.dashCount >= 5) {
                            this.circleDelayTimer = 0.1; // 0.1s delay before circle starts
                            this.postCircleSequence = true; // Next sequence will be limited to 1 dash
                        }
                        this.dashWindowTimer = 0;
                        this.basicAttackDashUsed = false; // Reset so basic attack goes back to normal
                        this.fCD = 20;
                        this.passiveDashes = 0;
                        this.dashCount = 0;
                    }
                }
                if (this.dashWindowTimer <= 0 && this.dashSequenceActive && !this.dashSequenceEnded) {
                    this.dashSequenceEnded = true;
                    this.dashSequenceActive = false;
                    this.fCD = 20;
                    this.dashCount = 0;
                }
                if (this.dashing) {
                    this.dashTimer -= dt;
                    this.x += Math.cos(this.angle) * 600 * dt;
                    this.y += Math.sin(this.angle) * 600 * dt;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 40 && !this.dashHits.has(e)) {
                            this.dashHits.add(e);
                            e.takeDamage(450, this);
                            // Only trigger extra dash if we haven't reached max
                            if (this.dashCount < 5) {
                                this.doExtraDash();
                            }
                        }
                    }
                    if (this.dashTimer <= 0) {
                        this.dashing = false;
                    }
                }
                if (this.dashWindowTimer > 0 && this.circleTimer <= 0 && this.dashSequenceActive) {
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 40 && !this.touchHits.has(e)) {
                            this.touchHits.add(e);
                            this.doExtraDash();
                            this.passiveDashes++;
                        }
                    }
                }
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            dashAgain() {
                this.dashTimer = 0.5;
            }
            
            doExtraDash() {
                if (!this.dashSequenceActive) return;
                this.dashing = true;
                this.dashTimer = 0.5;
                this.dashCount++;
                this.dashWindowTimer = 3;
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                // Reset dash flag when basic attack cooldown is ready
                if (this.basicCD <= 0) {
                    this.basicAttackDashUsed = false;
                }
                if (mouse.down && this.basicCD <= 0 && this.dashWindowTimer <= 0 && !this.dashSequenceActive) {
                    this.magicBurst();
                    this.basicCD = 1.5;
                }
                if (keys.q && this.qCD <= 0) this.energyBurst();
                if (keys.e && this.eCD <= 0 && this.chargeCD <= 0) this.inkPen();
                if (keys.f && this.fCD <= 0) { 
                    // Anti-cheat: if trying to dash within 3 sec after passive circle, force magicburst instead
                    if (this.circleEndTimer > 0) { 
                        this.magicBurst(); 
                        this.basicCD = 1.5;
                        addKillMsg("Wait 3s after passive!");
                    } else if (this.dashWindowTimer <= 0 && !this.dashSequenceActive) { 
                        this.dashSequenceActive = true; 
                        this.startDash(); 
                    }
                }
                if (keys.g && this.gCD <= 0 && this.canLMS()) this.lmsAbility();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            magicBurst() {
                this.revealTimer = 0.5;
                let ball = new EnergyBall(this, this.x, this.y, this.angle);
                ball.speed = 1500;
                ball.damage = 200;
                this.energyBalls.push(ball);
                entities.push(ball);
                // Only trigger one dash per F press during dash window
                if (this.dashWindowTimer > 0 && !this.basicAttackDashUsed) {
                    this.basicAttackDashUsed = true;
                    this.doExtraDash();
                }
            }
            
            energyBurst() {
                this.qCD = 6;
                let ball = new EnergyBall(this, this.x, this.y, this.angle);
                ball.speed = 700;
                ball.maxDistance = 700;
                ball.damage = 800;
                this.energyBalls.push(ball);
                entities.push(ball);
            }
            
            inkPen() {
                if (this.eCharges <= 0) return;
                this.eCharges--;
                if (this.eCharges == 1) this.refillTimer = 7;
                this.chargeCD = 0.5;
                let sameAngle = this.angle;
                let farX = this.x + Math.cos(sameAngle) * 500;
                let farY = this.y + Math.sin(sameAngle) * 500;
                let pen = new InkPen(farX, farY);
                pen.owner = this;
                this.inkPens.push(pen);
                entities.push(pen);
                // Add ink trail particles from player to destination
                for (let i = 0; i < 15; i++) {
                    let t = i / 15;
                    let trailX = this.x + (farX - this.x) * t;
                    let trailY = this.y + (farY - this.y) * t;
                    particles.push(new Particle(trailX, trailY, '#4a235a', 3 + Math.random() * 2, 0.4 + Math.random() * 0.3));
                }
            }
            
            startDash() {
                this.fCD = 20;
                this.dashWindowTimer = 3;
                this.dashCount = 0;
                this.dashSequenceEnded = false;
                this.touchHits.clear();
                this.dashHits.clear();
                this.postCircleSequence = false; // Reset the post-circle flag
                this.doExtraDash();
            }
            
            canLMS() {
                let kaiCount = 0, kaiserCount = 0, otherCount = 0;
                for (let e of entities) {
                    if (!e.dead && e instanceof Entity && !e.isPlayer && !(e instanceof Sentry) && !(e instanceof Tripmine)) {
                        if (e instanceof Kai) kaiCount++;
                        else if (e instanceof Kaiser) kaiserCount++;
                        else otherCount++;
                    }
                }
                return kaiCount > 0 && kaiserCount > 0 && otherCount === 0; // Only Kai and Kaiser remaining
            }
            
            lmsAbility() {
                this.speed = this.baseSpd * 2;
                this.speedBoostTimer = 10;
                this.fCD = 0;
                this.gCD = 30;
                if(this.isPlayer)addKillMsg('LMS Activated!');
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                if (this.hp < this.maxHp * 0.3) {
                    let t = this.findTarget();
                    if (t && Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) < 200) {
                        let dx = t.x - this.x, dy = t.y - this.y;
                        this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                        let d = Math.sqrt(dx*dx + dy*dy);
                        if (d > 50) {
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                        if (d < 100 && this.basicCD <= 0) { this.magicBurst(); this.basicCD = 1.5; }
                    } else {
                        let cube = this.findNearestHealthCube();
                        if (cube) {
                            let dx = cube.x - this.x, dy = cube.y - this.y;
                            this.angle = Math.atan2(dy, dx);
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d > 20) {
                                let moveSpeed = spd * 1.2;
                                this.x += Math.cos(this.angle) * moveSpeed * dt;
                                this.y += Math.sin(this.angle) * moveSpeed * dt;
                            }
                        } else {
                            this.angle += (Math.random() - 0.5) * 0.3;
                            let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                    }
                    return;
                }
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                let d = Math.sqrt(dx*dx + dy*dy);
                
                // Use ultimate to get closer if far away
                if (d > 400 && this.fCD <= 0 && this.dashWindowTimer <= 0 && !this.dashSequenceActive && this.circleEndTimer <= 0) {
                    this.dashSequenceActive = true;
                    this.startDash();
                }
                
                // When no dash available, attack from far away instead of closing in
                if (this.dashWindowTimer <= 0) {
                    // Stay at range and use Q/E abilities
                    if (d < 100 && d > 50) {
                        // Back away a bit
                        this.x -= Math.cos(this.angle) * spd * 0.5 * dt;
                        this.y -= Math.sin(this.angle) * spd * 0.5 * dt;
                    } else if (d > 300) {
                        // Move closer but keep distance
                        let moveSpeed = spd * 0.6;
                        this.x += Math.cos(this.angle) * moveSpeed * dt;
                        this.y += Math.sin(this.angle) * moveSpeed * dt;
                    }
                    // Prioritize ranged attacks
                    if (this.qCD <= 0) this.energyBurst();
                    if (this.eCD <= 0 && d < 400) this.inkPen();
                } else {
                    // Normal behavior when dashes are available - move in closer
                    if (d > 50) {
                        let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                        this.x += Math.cos(this.angle) * moveSpeed * dt;
                        this.y += Math.sin(this.angle) * moveSpeed * dt;
                    }
                    if (d < 600) {
                        if (this.qCD <= 0) this.energyBurst();
                        if (this.eCD <= 0) this.inkPen();
                        // Anti-cheat: if trying to dash within 3 sec after passive circle, use magicburst instead
                        if (this.fCD <= 0) {
                            if (this.circleEndTimer > 0) {
                                // Within 3 sec cooldown - use basic attack instead
                                if (this.basicCD <= 0 && d < 200) { this.magicBurst(); this.basicCD = 1.5; }
                            } else if (this.dashWindowTimer <= 0 && !this.dashSequenceActive) {
                                this.dashSequenceActive = true; 
                                this.startDash();
                            }
                        }
                    }
                }
                
                // Basic attack only during dash window
                if (this.basicCD <= 0 && this.dashWindowTimer > 0 && d < 100) { this.magicBurst(); this.basicCD = 1.5; }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                super.draw(ctx);

                // Reaper cloak / scythe overlay to make Vival look deadly
                try {
                    let screenX = this.x - camera.x;
                    let screenY = this.y - camera.y;
                    ctx.save();
                    // Cloak: dark translucent cape behind the hero
                    ctx.globalAlpha = 0.6;
                    let grad = ctx.createRadialGradient(screenX, screenY - this.radius*0.3, 10, screenX, screenY + this.radius*0.8, this.radius*3);
                    grad.addColorStop(0, 'rgba(34,0,34,0.6)');
                    grad.addColorStop(1, 'rgba(0,0,0,0.0)');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.moveTo(screenX - this.radius*1.6, screenY - this.radius*0.2);
                    ctx.quadraticCurveTo(screenX, screenY + this.radius*2.8, screenX + this.radius*1.6, screenY - this.radius*0.2);
                    ctx.lineTo(screenX - this.radius*0.6, screenY + this.radius*0.8);
                    ctx.closePath();
                    ctx.fill();

                    // Scythe arc - subtle, rotating
                    ctx.globalAlpha = 0.7;
                    ctx.strokeStyle = '#551A8B';
                    ctx.lineWidth = 4;
                    let era = (Date.now() * 0.001 + this.drawTimer) % (Math.PI * 2);
                    ctx.beginPath();
                    ctx.arc(screenX + Math.cos(era) * (this.radius + 18), screenY + Math.sin(era) * (this.radius + 18), this.radius + 22, era - 1.2, era + 1.2);
                    ctx.stroke();

                    // Hanging blade line
                    ctx.globalAlpha = 0.85;
                    ctx.strokeStyle = '#110011';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(screenX + Math.cos(era+0.5) * (this.radius + 18), screenY + Math.sin(era+0.5) * (this.radius + 18));
                    ctx.lineTo(screenX + Math.cos(era+0.5) * (this.radius + 60), screenY + Math.sin(era+0.5) * (this.radius + 60));
                    ctx.stroke();
                    ctx.restore();
                } catch (ex) { console.warn('vival reaper visuals failed', ex); }
                if (this.circleTimer > 0) {
                    ctx.strokeStyle = '#9b59b6';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 200, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        class Mamba extends Entity {
            constructor(x,y,p){
                super(x,y,20,p?'#000':'#8b0000',7200);
                this.isPlayer=p; this.countsAsFFAHero = true; this.name=p?"Player (Mamba)":"Enemy Mamba";
                this.basicCD=0; this.qCD=0; this.eCD=0; this.fCD=0; this.rCD=0;
                this.baseSpd=320; this.speed=this.baseSpd;
                this.basicEnhancedTimer=0;
                this.qCharging=false; this.qWindup=0;
                this.eCharging=false; this.eWindup=0;
                this.cameraZoomTimer=0;
                this.facingDirection=1;
                this.helicopterActive=false;
            }

            update(dt){
                if(this.dead) return;
                this.updateCommon(dt);
                this.facingDirection = Math.cos(this.angle) > 0 ? 1 : -1;
                if(this.basicCD>0) this.basicCD-=dt;
                if(this.qCD>0) this.qCD-=dt;
                if(this.eCD>0) this.eCD-=dt;
                if(this.fCD>0) this.fCD-=dt;
                if(this.rCD>0) this.rCD-=dt;
                if(this.basicEnhancedTimer>0) this.basicEnhancedTimer-=dt;
                if(this.cameraZoomTimer>0) this.cameraZoomTimer-=dt;
                if(this.helicopterTimer>0){ 
                    this.helicopterTimer-=dt; 
                    if(this.helicopterTimer<=0) this.helicopterActive=false;
                    // Check for hits during helicopter flight
                    if(this.helicopterActive){
                        for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                            let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                            if(d<250){
                                // Helicopter hits enemy - explode immediately
                                this.helicopterTimer = 0;
                                this.helicopterActive = false;
                                e.takeDamage(200,this);
                                for(let i=0;i<50;i++) particles.push(new Particle(this.x,this.y,'#ff0000',10,1.2));
                                for(let i=0;i<10;i++) particles.push(new Particle(e.x,e.y,'#ff0000',8,1.0));
                                break;
                            }
                        }
                    }
                }



                if(this.qCharging){ this.qWindup -= dt; if(this.qWindup<=0){ this.qCharging=false; this.fireQ(); this.qCD=6; }}
                if(this.eCharging){ this.eWindup -= dt; if(this.eWindup<=0){ this.eCharging=false; this.fireE(); this.eCD=12; this.invulnerableTimer=0; }}

                let spd=this.getEffectiveSpeed();
                if(this.isPlayer){ this.input(dt,spd); updateHUD(this); } else this.ai(dt,spd);
            }

            input(dt,spd){
                let dx=0,dy=0; if(keys.w)dy--; if(keys.s)dy++; if(keys.a)dx--; if(keys.d)dx++;
                if(dx||dy){let m=new Vector2(dx,dy).norm().mult(spd*dt);this.x+=m.x;this.y+=m.y;}
                this.angle=getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD<=0) this.basicAtk();
                if(keys.q && this.qCD<=0 && !this.qCharging){ this.qCharging=true; this.qWindup=0.8; this.shield+=360; this.debuffImmuneTimer=3; this.cameraZoomTimer=0.8; this.revealTimer=0.5; }
                if(keys.e && this.eCD<=0 && !this.eCharging){ this.eCharging=true; this.eWindup=0.5; this.invulnerableTimer=0.5; this.revealTimer=0.5; }
                if(keys.f && this.fCD<=0) this.doUlt();
                if(keys.r && this.rCD<=0) this.useGear();
            }

            basicAtk(){
                this.revealTimer=0.5; this.basicCD=0.8;
                particles.push(new Slash(this.x,this.y,this.angle,100,Math.PI/1.5,'#ff8c00'));
                if(this.basicEnhancedTimer>0){
                    // enhanced true damage basic: hit nearest in front
                    let target=null,md=99999;
                    for(let e of entities){ if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                        let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2); if(d<200){
                            let ang=Math.abs(Math.atan2(e.y-this.y,e.x-this.x)-this.angle); if(ang>Math.PI) ang=2*Math.PI-ang; if(ang<Math.PI/3 && d<md){ md=d; target=e; }
                        }
                    }}
                    if(target){
                        target.takeDamage(400, this, true);
                        target.revealTimer=1.0;
                        for(let i=0;i<8;i++) particles.push(new Particle(target.x,target.y,'#fff',5,0.8));
                    }
                } else {
                    for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<80){ e.takeDamage(120,this); e.revealTimer=0.6; for(let i=0;i<3;i++) particles.push(new Particle(e.x,e.y,'#ff8c00',3,0.5)); }
                }
            }

            fireQ(){
                // Kobe shot projectile with visual effect
                for(let i=0;i<15;i++) particles.push(new Particle(this.x,this.y,'#ff8c00',4,0.6));
                // Basketball projectile
                let proj = new Projectile(this,this.x + Math.cos(this.angle)*30,this.y + Math.sin(this.angle)*30,this.angle,1400,1000,2000,'#ff8c00',10,false,false,false,0,0,false,0);
                proj.isBasketball = true;
                entities.push(proj);
                // Longer step back for momentum effect
                this.x -= Math.cos(this.angle)*300; this.y -= Math.sin(this.angle)*300;
                for(let i=0;i<25;i++) particles.push(new Particle(this.x,this.y,'#ffa500',5,0.7));
            }

            fireE(){
                // Strong elbow: area damage, stun, injured
                // Visual effect at center
                for(let i=0;i<20;i++) particles.push(new Particle(this.x,this.y,'#ff4500',6,0.8));
                particles.push(new Slash(this.x,this.y,this.angle,140,Math.PI/2,'#ff0000'));
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                    if(d<140){ e.takeDamage(750,this); e.applyStatus('stun', 0.5, this); e.injuredTimer=24; e.revealTimer=1.0; for(let i=0;i<5;i++) particles.push(new Particle(e.x,e.y,'#ff0000',5,0.6)); }
                }
            }

            getEffectiveSpeed(){
                if(this.enhancedKBTimer>0) return 0;
                let s = this.speed;
                if(this.helicopterActive) s *= 1.3;
                return s;
            }

            doUlt(){
                this.fCD=18; this.helicopterTimer = 10; this.helicopterActive=true;
                // Helicopter crash animation
                for(let i=0;i<40;i++) particles.push(new Particle(this.x,this.y,'#ff6b00',10,1.5));
                for(let i=0;i<20;i++) particles.push(new Particle(this.x + (Math.random()-0.5)*100,this.y + (Math.random()-0.5)*100,'#ffa500',6,1.0));
                // Crash wave damage and check for hits
                let hitEnemy = false;
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){ 
                    let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                    if(d<250){ e.takeDamage(800,this); e.revealTimer=1.5; hitEnemy=true; for(let i=0;i<8;i++) particles.push(new Particle(e.x,e.y,'#ff0000',7,0.9)); }
                }
                // If helicopter hits, it explodes immediately
                if(hitEnemy){ this.helicopterTimer = 0; this.helicopterActive = false; for(let i=0;i<50;i++) particles.push(new Particle(this.x,this.y,'#ff0000',10,1.2)); }
                this.basicEnhancedTimer = 8; this.defenseBuffTimer = 8;
            }

            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;
                let t=this.findTarget();
                let cube=this.findNearestHealthCube(); let cubeInVision = cube && Math.sqrt((cube.x - this.x)**2 + (cube.y - this.y)**2) < 800;
                if(cubeInVision && this.hp < this.maxHp * 0.7){ let dx=cube.x-this.x, dy=cube.y-this.y; this.angle=Math.atan2(dy,dx); let d=Math.sqrt(dx*dx+dy*dy); if(d>20){ this.x+=Math.cos(this.angle)*spd*1.2*dt; this.y+=Math.sin(this.angle)*spd*1.2*dt; } if(t && Math.sqrt((t.x-this.x)**2+(t.y-this.y)**2)<150 && this.basicCD<=0) this.basicAtk(); return; }
                if(this.hp < this.maxHp * 0.3){ if(cube){ let dx=cube.x-this.x, dy=cube.y-this.y; this.angle=Math.atan2(dy,dx); let d=Math.sqrt(dx*dx+dy*dy); if(d>20){ this.x+=Math.cos(this.angle)*spd*1.2*dt; this.y+=Math.sin(this.angle)*spd*1.2*dt; } } else { this.angle+=(Math.random()-0.5)*0.3; this.x+=Math.cos(this.angle)*spd*(0.8+Math.random()*0.4)*dt; this.y+=Math.sin(this.angle)*spd*(0.8+Math.random()*0.4)*dt; } return; }
                if(!t){ this.wander(dt,spd); return; }
                let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx)+(Math.random()-0.5)*0.15; let d=Math.sqrt(dx*dx+dy*dy);
                if(d>50) { this.x+=Math.cos(this.angle)*spd*(0.8+Math.random()*0.4)*dt; this.y+=Math.sin(this.angle)*spd*(0.8+Math.random()*0.4)*dt; }
                if(d<200 && this.qCD<=0 && !this.qCharging) { this.qCharging=true; this.qWindup=0.8; this.shield+=360; this.debuffImmuneTimer=3; this.revealTimer=0.5; }
                if(d<120 && this.basicCD<=0) this.basicAtk();
                if(d<220 && this.eCD<=0 && !this.eCharging){ this.eCharging=true; this.eWindup=0.5; this.invulnerableTimer=0.5; this.revealTimer=0.5; }
                if(d<250 && this.fCD<=0 && !this.helicopterActive) this.doUlt();
            }

            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            draw(ctx){
                super.draw(ctx);
                // Helicopter visual during ultimate
                if(this.helicopterTimer && this.helicopterTimer > 0){
                    ctx.save();
                    ctx.translate(this.x-camera.x, this.y-camera.y-30);
                    // Helicopter body
                    ctx.fillStyle='#333';
                    ctx.fillRect(-20,-10,40,15);
                    // Windshield
                    ctx.fillStyle='#00bcd4';
                    ctx.beginPath();
                    ctx.arc(-8,0,5,0,Math.PI*2);
                    ctx.fill();
                    // Rotating blades
                    ctx.strokeStyle='#555';
                    ctx.lineWidth=2;
                    ctx.beginPath();
                    let bladeAngle = (performance.now() * 0.01) % (Math.PI*2);
                    ctx.moveTo(0,-25);
                    ctx.lineTo(Math.cos(bladeAngle+Math.PI)*40, Math.sin(bladeAngle+Math.PI)*40-25);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(0,-25);
                    ctx.lineTo(Math.cos(bladeAngle)*40, Math.sin(bladeAngle)*40-25);
                    ctx.stroke();
                    // Side rotor
                    ctx.beginPath();
                    ctx.arc(25, 5, 8, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.restore();
                    this.helicopterTimer -= 0.016;
                }
                // Show windup animation for Q
                if(this.qCharging){
                    ctx.strokeStyle='#ff8c00';
                    ctx.lineWidth=2;
                    ctx.beginPath();
                    let windupProgress = (0.8 - this.qWindup) / 0.8;
                    ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+10+windupProgress*10,0,Math.PI*2);
                    ctx.stroke();
                    ctx.fillStyle='rgba(255,140,0,0.3)';
                    ctx.beginPath();
                    ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+10,0,Math.PI*2*windupProgress);
                    ctx.fill();
                }
                // Show windup animation for E
                if(this.eCharging){
                    ctx.strokeStyle='#ff0000';
                    ctx.lineWidth=3;
                    ctx.beginPath();
                    ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+5,0,Math.PI*2);
                    ctx.stroke();
                    ctx.fillStyle='rgba(255,0,0,0.2)';
                    ctx.beginPath();
                    ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+5,0,Math.PI*2*((0.5-this.eWindup)/0.5));
                    ctx.fill();
                }
                if(this.basicEnhancedTimer>0){
                    ctx.strokeStyle='#ff0000';
                    ctx.lineWidth=3;
                    ctx.beginPath();
                    ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+8,0,Math.PI*2);
                    ctx.stroke();
                }
            }
        }

        class Acheron extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#2c3e50' : '#34495e', 5800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Acheron)" : "Enemy Acheron";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0; this.rCD = 0;
                this.baseSpd = 220;
                this.speed = this.baseSpd;
                this.markedEnemies = [];
                this.markTimer = 0;
                this.transformed = false;
                this.transformTimer = 0;
                this.basicCount = 0;
                this.totalDamage = 0;
                this.originalBasicCD = 0.6;
                this.transformBasicCD = 0.3;
                // Nihility form properties
                this.nihilityForm = null;
                this.inNihilityCounter = false;
                this.nihilityTimer = 0;
                this.invisibility = false;
                this.trailTimer = 0;
                this.trailDamageTimer = 0;
                this.trailPath = [];
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.markTimer > 0) {
                    this.markTimer -= dt;
                    if (this.markTimer <= 0) {
                        this.markedEnemies = [];
                    }
                }
                // Handle nihility counter
                if (this.inNihilityCounter) {
                    this.nihilityTimer -= dt;
                    this.trailTimer -= dt;
                    this.trailDamageTimer -= dt;
                    
                    // Add to trail path
                    if (Math.random() < 0.3) {
                        this.trailPath.push({ x: this.x, y: this.y, time: 0.5 });
                    }
                    
                    // Deal damage along trail
                    if (this.trailDamageTimer <= 0) {
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2);
                                if (d < 80) {
                                    e.takeDamage(250, this);
                                    for (let i = 0; i < 3; i++) particles.push(new Particle(e.x, e.y, '#0ff', 3, 0.5));
                                }
                            }
                        }
                        this.trailDamageTimer = 0.5;
                    }
                    
                    // Update trail path
                    this.trailPath = this.trailPath.filter(p => {
                        p.time -= dt;
                        return p.time > 0;
                    });
                    
                    if (this.nihilityTimer <= 0) {
                        this.inNihilityCounter = false;
                        this.invisibility = false;
                        this.eCD = 10;
                        this.trailPath = [];
                    }
                }
                if (this.transformed) {
                    this.transformTimer -= dt;
                    if (this.transformTimer <= 0) {
                        this.transformed = false;
                        this.basicCD = this.originalBasicCD;
                    }
                }
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                // Apply speed boost during nihility counter
                if (this.inNihilityCounter) spd *= 3;
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) {
                    this.slash();
                    this.basicCD = this.transformed ? this.transformBasicCD : this.originalBasicCD;
                    if (this.transformed) {
                        this.basicCount++;
                        if (this.basicCount >= 13) {
                            this.unleashCircle();
                            this.basicCount = 0;
                        }
                    }
                }
                if (keys.q && this.qCD <= 0) this.summonBlackhole();
                if (keys.e && this.eCD <= 0) this.nihilityform();
                if (keys.f && this.fCD <= 0) this.transform();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            slash() {
                this.revealTimer = 0.5;
                let dmg = this.transformed ? 120 * 1.5 : 120;
                if (this.transformed) this.totalDamage += dmg;
                
                if (this.transformed) {
                    // Enhanced transformed attack with dynamic curved slash
                    let slashLength = 220;
                    let slashArc = Math.PI * 0.8;
                    particles.push(new Slash(this.x, this.y, this.angle, slashLength, slashArc, '#f00'));
                    
                    // Create explosive wave effect
                    for (let wave = 0; wave < 3; wave++) {
                        setTimeout(() => {
                            for (let i = 0; i < 20; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                let speed = 5 + wave * 2;
                                particles.push(new Particle(
                                    this.x + Math.cos(this.angle) * 50,
                                    this.y + Math.sin(this.angle) * 50,
                                    '#f00',
                                    speed,
                                    0.3 + Math.random() * 0.2
                                ));
                            }
                        }, wave * 30);
                    }
                    
                    // Bright impact particles along slash
                    for (let i = 0; i < 20; i++) {
                        let dist = Math.random() * slashLength;
                        let angleOffset = (Math.random() - 0.5) * slashArc;
                        let px = this.x + Math.cos(this.angle + angleOffset) * dist;
                        let py = this.y + Math.sin(this.angle + angleOffset) * dist;
                        particles.push(new Particle(px, py, '#fff', 6 + Math.random() * 3, 0.6 + Math.random() * 0.3));
                    }
                    
                    // Golden energy streaks
                    for (let i = 0; i < 10; i++) {
                        let dist = Math.random() * slashLength;
                        let angleOffset = (Math.random() - 0.5) * slashArc;
                        let px = this.x + Math.cos(this.angle + angleOffset) * dist;
                        let py = this.y + Math.sin(this.angle + angleOffset) * dist;
                        particles.push(new Particle(px, py, '#ff0', 4, 0.8));
                    }
                } else {
                    particles.push(new Slash(this.x, this.y, this.angle, 160, Math.PI / 1.5, '#fff'));
                }
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let rx = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
                        let ry = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
                        if (rx > -e.radius && rx < (this.transformed ? 200 : 160) + e.radius && ry > -(this.transformed ? 30 : 30) - e.radius && ry < (this.transformed ? 30 : 30) + e.radius) {
                            let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                            if (ad > Math.PI) ad = 2 * Math.PI - ad;
                            if (ad < Math.PI / 3) {
                                e.takeDamage(dmg, this);
                                this.revealTimer = 1.0;
                                if (this.transformed) {
                                    for (let i = 0; i < 8; i++) particles.push(new Particle(e.x, e.y, '#f00', 5, 0.7));
                                    for (let i = 0; i < 3; i++) particles.push(new Particle(e.x, e.y, '#ff0', 3, 0.8));
                                }
                            }
                        }
                    }
                }
            }
            
            summonBlackhole() {
                this.qCD = 10;
                let bh = new Blackhole(this, this.x, this.y);
                entities.push(bh);
                // Sound effect: deep rumble for black hole
                try {
                    if (window.AudioContext || window.webkitAudioContext) {
                        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                        const oscillator = audioCtx.createOscillator();
                        const gainNode = audioCtx.createGain();
                        oscillator.connect(gainNode);
                        gainNode.connect(audioCtx.destination);
                        oscillator.frequency.setValueAtTime(80, audioCtx.currentTime); // Low frequency rumble
                        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                        oscillator.start(audioCtx.currentTime);
                        oscillator.stop(audioCtx.currentTime + 0.5);
                    }
                } catch (e) {
                    // Fallback: no sound if AudioContext not supported
                }
            }
            
            nihilityform() {
                if (this.inNihilityCounter) {
                    // Return to nihility form and deal true damage
                    if (this.nihilityForm) {
                        let returnX = this.nihilityForm.x;
                        let returnY = this.nihilityForm.y;
                        this.x = returnX;
                        this.y = returnY;
                        // Deal 500 true damage (ignores shield and defense)
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 300) {
                                e.hp -= 500; // True damage
                                if (e.hp <= 0) { e.hp = 0; e.die(this); }
                                for (let i = 0; i < 10; i++) particles.push(new Particle(e.x, e.y, '#0ff', 6, 1));
                            }
                        }
                        for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, '#0ff', 8, 1.5));
                        screenShake(10);
                    }
                    this.inNihilityCounter = false;
                    this.invisibility = false;
                    this.nihilityForm = null;
                    this.eCD = 10; // 10s cooldown
                    this.trailPath = [];
                } else {
                    // Create nihility form
                    this.nihilityForm = { x: this.x, y: this.y };
                    this.inNihilityCounter = true;
                    this.invisibility = true;
                    this.nihilityTimer = 5;
                    this.trailTimer = 5;
                    this.trailDamageTimer = 0;
                    this.trailPath = [];
                    this.eCD = 0.5; // 0.5s delay before next press
                    for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, '#0ff', 5, 1));
                    // Speed boost visualization
                    for (let i = 0; i < 8; i++) particles.push(new Particle(this.x, this.y, '#fff', 3, 0.8));
                }
            }
            
            teleportToMarked() {
                if (this.markedEnemies.length === 0) return;
                let closest = null, minDist = 9999;
                for (let e of this.markedEnemies) {
                    if (!e.dead) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < minDist) {
                            minDist = d;
                            closest = e;
                        }
                    }
                }
                if (closest) {
                    this.x = closest.x;
                    this.y = closest.y;
                    closest.takeDamage(600, this);
                    for (let i = 0; i < 10; i++) particles.push(new Particle(this.x, this.y, '#ff0', 5, 1));
                }
                this.markedEnemies = [];
                this.markTimer = 0;
            }
            
            transform() {
                this.fCD = 28;
                this.transformed = true;
                this.transformTimer = 13;
                this.basicCount = 0;
                this.totalDamage = 0;
                this.basicCD = this.transformBasicCD;
                for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, '#f00', 6, 1.5));
            }
            
            unleashCircle() {
                let circleDmg = this.totalDamage * 0.5;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 300) {
                        e.takeDamage(circleDmg, this);
                    }
                }
                // Enhanced ultimate particles
                for (let i = 0; i < 50; i++) {
                    let angle = (i / 50) * Math.PI * 2;
                    let dist = Math.random() * 300;
                    let px = this.x + Math.cos(angle) * dist;
                    let py = this.y + Math.sin(angle) * dist;
                    particles.push(new Particle(px, py, '#f00', 6 + Math.random() * 4, 2 + Math.random()));
                }
                for (let i = 0; i < 30; i++) {
                    particles.push(new Particle(this.x, this.y, '#ff0', 8 + Math.random() * 4, 2.5));
                }
                for (let i = 0; i < 20; i++) {
                    particles.push(new Particle(this.x, this.y, '#fff', 5 + Math.random() * 3, 1.5));
                }
                screenShake(15);
                // End transformation immediately after circle
                this.transformed = false;
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                let cube = this.findNearestHealthCube();
                let cubeInVision = cube && Math.sqrt((cube.x - this.x)**2 + (cube.y - this.y)**2) < 800;
                
                // Pursue cube if found in vision and health is not critical
                if(cubeInVision && this.hp < this.maxHp * 0.7) {
                    let dx = cube.x - this.x, dy = cube.y - this.y;
                    this.angle = Math.atan2(dy, dx);
                    let d = Math.sqrt(dx*dx + dy*dy);
                    if (d > 20) {
                        let moveSpeed = spd * 1.2;
                        this.x += Math.cos(this.angle) * moveSpeed * dt;
                        this.y += Math.sin(this.angle) * moveSpeed * dt;
                    }
                    // Still attack if enemy is very close
                    if(t && Math.sqrt((t.x - this.x)**2 + (t.y - this.y)**2) < 150 && this.basicCD <= 0) {
                        this.slash();
                        this.basicCD = this.transformed ? this.transformBasicCD : this.originalBasicCD;
                    }
                    return;
                }
                
                if (this.hp < this.maxHp * 0.3) {
                    let cube = this.findNearestHealthCube();
                    if (cube) {
                        let dx = cube.x - this.x, dy = cube.y - this.y;
                        this.angle = Math.atan2(dy, dx);
                        let d = Math.sqrt(dx*dx + dy*dy);
                        if (d > 20) {
                            let moveSpeed = spd * 1.2;
                            this.x += Math.cos(this.angle) * moveSpeed * dt;
                            this.y += Math.sin(this.angle) * moveSpeed * dt;
                        }
                    } else {
                        this.angle += (Math.random() - 0.5) * 0.3;
                        let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                        this.x += Math.cos(this.angle) * moveSpeed * dt;
                        this.y += Math.sin(this.angle) * moveSpeed * dt;
                    }
                    return;
                }
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 50) {
                    let moveSpeed = spd * (0.8 + Math.random() * 0.4);
                    this.x += Math.cos(this.angle) * moveSpeed * dt;
                    this.y += Math.sin(this.angle) * moveSpeed * dt;
                }
                if (d < 600) {
                    if (this.qCD <= 0) this.summonBlackhole();
                    if (this.eCD <= 0) this.nihilityform();
                    if (this.fCD <= 0) this.transform();
                    if (this.basicCD <= 0) { this.slash(); this.basicCD = this.transformed ? this.transformBasicCD : this.originalBasicCD; }
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                if (this.invisibility) {
                    ctx.globalAlpha = 0.3;
                }
                super.draw(ctx);
                
                // Draw nihility form
                if (this.nihilityForm) {
                    ctx.fillStyle = '#0ff';
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(this.nihilityForm.x - camera.x, this.nihilityForm.y - camera.y, this.radius + 20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#0ff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Draw trail
                for (let p of this.trailPath) {
                    let alpha = p.time / 0.5;
                    ctx.globalAlpha = alpha * 0.4;
                    ctx.fillStyle = '#0ff';
                    ctx.beginPath();
                    ctx.arc(p.x - camera.x, p.y - camera.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                if (this.transformed) {
                    ctx.globalAlpha = 1.0;
                    ctx.strokeStyle = '#f00';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI * 2);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1.0;
            }
        }

        // MirrorForm: lightweight mirror that follows owner's movement deltas (mirrors movement)
        class MirrorForm {
            constructor(owner,x,y,dur){
                this.owner = owner; this.x = x; this.y = y; this.life = dur; this.radius = 18; this.prevOwnerX = owner.x; this.prevOwnerY = owner.y; this.expired = false;
            }
            update(dt){
                this.life -= dt; if(this.life<=0){ this.expired = true; return; }
                // Mirror the owner's movement delta (inverse) so mirror moves oppositely
                let dx = this.owner.x - this.prevOwnerX;
                let dy = this.owner.y - this.prevOwnerY;
                this.x -= dx; this.y -= dy;
                this.prevOwnerX = this.owner.x; this.prevOwnerY = this.owner.y;
            }
            draw(ctx){ if(this.expired) return; ctx.save(); ctx.translate(this.x-camera.x,this.y-camera.y); const shattered = this.owner && this.owner.currentSkin === 'Shattered Persona'; const bold = this.owner && this.owner.currentSkin === 'Bold CEO'; ctx.fillStyle = shattered ? '#ff3b30' : (bold ? '#f4c542' : '#88f'); ctx.beginPath(); ctx.arc(0,0,this.radius,0,Math.PI*2); ctx.fill(); ctx.strokeStyle = shattered ? '#1a0000' : (bold ? '#fff2b7' : '#fff'); ctx.lineWidth = 2; ctx.stroke(); if (shattered) {
                ctx.strokeStyle = '#ffe7e1'; ctx.lineWidth = 2;
                ctx.beginPath();
                // Crisp, sharp cracks with reduced density for a cleaner shattered look
                ctx.moveTo(-12, -12); ctx.lineTo(-4, -4); ctx.lineTo(-10, 2); ctx.lineTo(-2, 10); ctx.lineTo(-8, 18);
                ctx.moveTo(10, -16); ctx.lineTo(1, -7); ctx.lineTo(12, -1); ctx.lineTo(3, 8); ctx.lineTo(11, 17);
                ctx.moveTo(-16, 2); ctx.lineTo(-8, -2); ctx.lineTo(-14, 12); ctx.lineTo(-4, 16);
                ctx.moveTo(16, -6); ctx.lineTo(7, -10); ctx.lineTo(15, 3); ctx.lineTo(6, 9);
                ctx.moveTo(-2, -18); ctx.lineTo(4, -9); ctx.lineTo(-1, 0); ctx.lineTo(7, 7); ctx.lineTo(0, 16);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-10, -16); ctx.lineTo(-2, -7); ctx.lineTo(-9, 6); ctx.lineTo(-1, 13);
                ctx.moveTo(11, -14); ctx.lineTo(3, -5); ctx.lineTo(10, 7); ctx.lineTo(2, 14);
                ctx.moveTo(-3, -12); ctx.lineTo(5, -2); ctx.lineTo(-2, 10);
                ctx.stroke();
            }
            ctx.restore(); }
        }

        // Realm: area that deals damage per second and grants owner damage reduction while inside
        class Realm extends Entity {
            constructor(owner,x,y,dur){
                super(x,y,0,'#aaf',1);
                this.owner = owner; this.countsAsFFAHero = false; this.life = dur; this.radius = 300; this.tick=0; this.isTargetable = false;
            }
            update(dt){
                this.life -= dt; if(this.life<=0){ this.del=true; if(this.owner) this.owner.inRealm=false; return; }
                this.tick += dt; if(this.tick>=1.0){ this.tick -= 1.0; for(let e of entities) if(e!==this.owner && !e.dead && e instanceof Entity && e.team!==this.owner.team){ let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2); if(d < this.radius) e.takeDamage(200, this.owner); } }
                // set owner.inRealm flag if owner is inside
                if(this.owner){ let dd = Math.sqrt((this.owner.x - this.x)**2 + (this.owner.y - this.y)**2); this.owner.inRealm = dd < this.radius; }
            }

            // Realms are non-damageable / non-interactable — override to ignore incoming damage
            takeDamage(amt, src) { return; }

            draw(ctx){ if(this.del) return; ctx.save(); ctx.translate(this.x-camera.x,this.y-camera.y); const isShattered = this.owner && this.owner.currentSkin === 'Shattered Persona'; const isBold = this.owner && this.owner.currentSkin === 'Bold CEO'; ctx.strokeStyle = isShattered ? 'rgba(255,59,48,0.8)' : (isBold ? 'rgba(244,197,66,0.8)' : 'rgba(170,200,255,0.6)'); ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,this.radius,0,Math.PI*2); ctx.stroke(); if (isShattered) {
                ctx.strokeStyle = 'rgba(255,240,240,0.9)'; ctx.lineWidth = 2;
                ctx.beginPath();
                // Balanced shattered-glass crack network: enough to feel broken, not overpacked
                ctx.moveTo(-120, -68); ctx.lineTo(-64, -22); ctx.lineTo(-96, 16); ctx.lineTo(-38, 46); ctx.lineTo(-82, 104);
                ctx.moveTo(110, -84); ctx.lineTo(52, -30); ctx.lineTo(96, 12); ctx.lineTo(42, 52); ctx.lineTo(98, 110);
                ctx.moveTo(-18, -118); ctx.lineTo(-2, -58); ctx.lineTo(-34, -12); ctx.lineTo(0, 28); ctx.lineTo(-20, 96);
                ctx.moveTo(-130, 22); ctx.lineTo(-90, -8); ctx.lineTo(-136, 88);
                ctx.moveTo(128, 18); ctx.lineTo(88, -12); ctx.lineTo(136, 84);
                ctx.moveTo(-96, -118); ctx.lineTo(-58, -82); ctx.lineTo(-76, -24); ctx.lineTo(-42, 10); ctx.lineTo(-68, 62);
                ctx.moveTo(94, -118); ctx.lineTo(56, -82); ctx.lineTo(72, -22); ctx.lineTo(38, 12); ctx.lineTo(66, 64);
                ctx.stroke();
            }
            ctx.restore(); }
        }

        // JusticeRealm: distinct from Ming's Realm — used by Apollo's Sunball ultimate
        class JusticeRealm extends Realm {
            constructor(owner, x, y, dur, target) {
                super(owner, x, y, dur);
                this.radius = 600; // larger arena radius so it feels like a distant island
                this.target = target;   // the marked enemy that takes extra DPS
                this.tick = 0;
                this.type = 'justice';
            }

            update(dt) {
                this.life -= dt; if (this.life <= 0) { this.del = true; if (this.owner) this.owner.inRealm = false; return; }
                this.tick += dt;

                // apply 100 DPS to the specific target while inside the realm (every 1s)
                if (this.tick >= 1.0) {
                    this.tick -= 1.0;
                    try {
                        if (this.target && !this.target.dead) {
                            let d = Math.hypot(this.target.x - this.x, this.target.y - this.y);
                            if (d < this.radius) this.target.takeDamage(100, this.owner);
                        }
                    } catch (err) { /* safe-guard */ }
                }

                // If the marked target dies, end the JusticeRealm immediately and restore owner/cleanup
                if (this.target && this.target.dead) {
                    this.del = true;
                    try {
                        if (this.owner) {
                            if (this.owner.realmReturnPos) {
                                this.owner.x = this.owner.realmReturnPos.x;
                                this.owner.y = this.owner.realmReturnPos.y;
                            }
                            this.owner.inRealm = false;
                            this.owner.realmTimer = 0;
                            this.owner.realmId = null;
                            this.owner.realmTarget = null;
                            this.owner.realmReturnPos = null;
                            this.owner.realm = null;
                        }
                        if (this.target) {
                            this.target.inRealm = false;
                            this.target.realmTimer = 0;
                            this.target.realmId = null;
                            this.target.realmTarget = null;
                            this.target.realmReturnPos = null;
                            this.target.realm = null;
                        }
                    } catch (_) {}
                    return;
                }

                // maintain owner.inRealm flag and enforce boundary (prevent escape)
                if (this.owner) {
                    let dd = Math.hypot(this.owner.x - this.x, this.owner.y - this.y);
                    this.owner.inRealm = dd < this.radius;
                    // Clamp owner inside realm boundary
                    if (dd >= this.radius) {
                        let angle = Math.atan2(this.owner.y - this.y, this.owner.x - this.x);
                        this.owner.x = this.x + Math.cos(angle) * (this.radius - 50);
                        this.owner.y = this.y + Math.sin(angle) * (this.radius - 50);
                        this.owner.inRealm = true;
                    }
                }

                // enforce boundary for target (prevent escape)
                if (this.target && !this.target.dead) {
                    let dt_target = Math.hypot(this.target.x - this.x, this.target.y - this.y);
                    if (dt_target >= this.radius) {
                        let angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                        this.target.x = this.x + Math.cos(angle) * (this.radius - 50);
                        this.target.y = this.y + Math.sin(angle) * (this.radius - 50);
                        this.target.inRealm = true;
                    }
                }
            }

            draw(ctx) {
                if (this.del) return;
                ctx.save();
                ctx.globalAlpha = 0.25;
                ctx.fillStyle = '#FFF6D8';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 0.95;
                ctx.strokeStyle = '#FFD97A'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
        }

        class Ming extends Entity {
            constructor(x,y,p){
                super(x,y,18,p?'#C0C0C0':'#b0b0b0',4800);
                this.isPlayer=p; this.countsAsFFAHero = true; this.name=p?"Player (Ming)":"Enemy Ming";
                this.currentSkin='default'; this.skinIcon=null;
                this.basicCD=0; this.qCD=0; this.eCD=0; this.fCD=0; this.gCD=0; this.rCD=0;
                this.baseSpd=340; this.speed=this.baseSpd;
                this.gCharges=4; this.maxGCharges=4; this.gChargeTimer=0; // seconds until next charge
                this.mirror=null; this.mirrorTimer=0; this.realm=null; this.realmTimer=0;
                this.prevX=this.x; this.prevY=this.y;
                this.gDelay=0; this.dashing=false; this.dashTargetX=0; this.dashTargetY=0; this.dashSpeed=1200; this.hitEnemies=new Set();
            }
            update(dt){ if(this.dead) return; this.updateCommon(dt);
                if(this.basicCD>0) this.basicCD-=dt; if(this.qCD>0) this.qCD-=dt; if(this.eCD>0) this.eCD-=dt; if(this.fCD>0) this.fCD-=dt; if(this.rCD>0) this.rCD-=dt;
                // G charge regen
                if(this.gCharges < this.maxGCharges){ this.gChargeTimer -= dt; if(this.gChargeTimer <= 0){ this.gCharges = Math.min(this.maxGCharges, this.gCharges+1); if(this.gCharges < this.maxGCharges) this.gChargeTimer = 3; }}
                if(this.gDelay>0) this.gDelay-=dt;
                // mirror/realm timers cleanup
                if(this.mirror && this.mirror.expired) this.mirror=null;
                if(this.realm && this.realm.del) this.realm=null;
                // movement lock if stunned/frozen
                if(this.stunTimer>0 || this.freezeTimer>0){ if(this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                this.prevX = this.x; this.prevY = this.y;
                if(this.isPlayer){ this.input(dt,spd); updateHUD(this); } else this.ai(dt,spd);
                if(this.dashing){
                    let dx = this.dashTargetX - this.x;
                    let dy = this.dashTargetY - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist < 5){
                        this.x = this.dashTargetX;
                        this.y = this.dashTargetY;
                        this.dashing = false;
                        this.hp = Math.min(this.maxHp, this.hp + 200);
                        this.hitEnemies.clear();
                    } else {
                        let nx = dx / dist;
                        let ny = dy / dist;
                        this.x += nx * this.dashSpeed * dt;
                        this.y += ny * this.dashSpeed * dt;
                        for(let e of entities){
                            if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team){
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if(d < 60){
                                    if(!this.hitEnemies.has(e)){
                                        this.hitEnemies.add(e);
                                        const dashDmg = 400;
                                        e.hp -= dashDmg; 
                                        this.totalDamage = (this.totalDamage || 0) + dashDmg;
                                        if(gameMode === 'training' && this.isPlayer && window.trainingStats) {
                                            window.trainingStats.totalDamage += dashDmg;
                                        }
                                        if(!e.damageContributors) e.damageContributors = new Map();
                                        const existing = e.damageContributors.get(this) || { amount: 0, time: 0 };
                                        existing.amount = (existing.amount || 0) + dashDmg;
                                        existing.time = Date.now();
                                        e.damageContributors.set(this, existing);
                                        e.lastDamageTime = Date.now();
                                        if(e.hp <= 0) e.die(this);
                                        for(let k=0; k<6; k++) particles.push(new Particle(e.x, e.y, '#fff', 5, 0.6));
                                    }
                                }
                            }
                        }
                    }
                }
            }
            input(dt,spd){ if(this.dashing) return; let dx=0,dy=0; if(keys.w)dy--; if(keys.s)dy++; if(keys.a)dx--; if(keys.d)dx++; if(dx||dy){ let m=new Vector2(dx,dy).norm().mult(spd*dt); this.x+=m.x; this.y+=m.y; }
                this.angle=getMouseAimAngle(this.x, this.y); if(mouse.down && this.basicCD<=0) this.basicAtk();
                if(keys.q && this.qCD<=0) this.doQ(); if(keys.e && this.eCD<=0) this.doE(); if(keys.f && this.fCD<=0) this.doUlt(); if(keys.g && this.gCharges>0 && this.gDelay<=0) this.doG(); if(keys.r && this.rCD<=0) this.useGear(); }
            basicAtk(){ 
                this.revealTimer=0.4; this.basicCD=0.5; 
                const slashColor = this.currentSkin === 'Shattered Persona' ? '#1b1b1b' : '#fff';
                const impactColor = this.currentSkin === 'Shattered Persona' ? '#ff3b30' : '#fff';
                particles.push(new Slash(this.x,this.y,this.angle,80,Math.PI/2,slashColor)); 
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team && Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2)<80){ e.takeDamage(90,this); e.revealTimer=0.6; particles.push(new Particle(e.x,e.y,impactColor,5,0.5)); } 
            }
            doQ(){
                this.qCD = 5; // spin
                const ringColor = this.currentSkin === 'Shattered Persona' ? '#1a1a1a' : '#cfefff';
                const shardColor = this.currentSkin === 'Shattered Persona' ? '#ff3b30' : '#fff';
                // Visual: big glass-shatter slash and radial shards
                particles.push(new Slash(this.x,this.y,this.angle,160,Math.PI*2,ringColor));
                for(let i=0;i<28;i++){
                    let a = Math.random()*Math.PI*2;
                    let sp = 6 + Math.random()*10;
                    let life = 0.8 + Math.random()*0.8;
                    let px = this.x + Math.cos(a)*8;
                    let py = this.y + Math.sin(a)*8;
                    particles.push(new Particle(px,py,ringColor,sp,life));
                    if(Math.random()<0.25) particles.push(new Particle(px,py,shardColor,sp*0.6,life*0.8));
                }
                let hit=false;
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                    if(d<140){
                        e.takeDamage(680,this);
                        // additional true damage = 3% of target max HP
                        let t = Math.floor(e.maxHp * 0.03);
                        e.hp -= t;
                        this.totalDamage = (this.totalDamage || 0) + t;
                        if(gameMode === 'training' && this.isPlayer && window.trainingStats) {
                            window.trainingStats.totalDamage += t;
                        }
                        if(!e.damageContributors) e.damageContributors = new Map();
                        const existing = e.damageContributors.get(this) || { amount: 0, time: 0 };
                        existing.amount = (existing.amount || 0) + t;
                        existing.time = Date.now();
                        e.damageContributors.set(this, existing);
                        e.lastDamageTime = Date.now();
                        if(e.hp<=0) e.die(this);
                        hit=true;
                        for(let i=0;i<10;i++) particles.push(new Particle(e.x,e.y,'#bfefff',6,0.7));
                    }
                }
                if(hit){ this.hp = Math.min(this.maxHp, this.hp + 480); if(this.isPlayer) addKillMsg('Ming healed +480'); }
            }
            doE(){ // dash + create mirror for 5s; don't create mirror if realm exists
                if(this.realm) { /* if realm active, do dash but no mirror creation */ }
                this.eCD=4; // dash
                let dist=300; let oldX = this.x, oldY = this.y; this.x += Math.cos(this.angle)*dist; this.y += Math.sin(this.angle)*dist; let hitAny=false;
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){ let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2); if(d<90){ e.takeDamage(220,this); hitAny=true; for(let i=0;i<6;i++) particles.push(new Particle(e.x,e.y,'#aff',4,0.6)); }}
                // heal 220 and extra 220 if hit enemies
                this.hp = Math.min(this.maxHp, this.hp + 220); if(hitAny) this.hp = Math.min(this.maxHp, this.hp + 220);
                this.gCharges = Math.min(this.maxGCharges, this.gCharges + 1);
                if(!this.realm){ if(this.mirror) { this.mirror.expired=true; this.mirror=null; } this.mirror = new MirrorForm(this,oldX,oldY,5.0); }
            }
            doG(){ if(!this.mirror || this.gCharges<=0 || this.gDelay>0) return; this.gCharges--; if(this.gCharges < this.maxGCharges) this.gChargeTimer=3; this.gDelay=0.3;
                this.dashing=true; this.dashTargetX=this.mirror.x; this.dashTargetY=this.mirror.y; this.hitEnemies.clear();
            }
            doUlt(){ // form mirror and create realm for 8s; destroy old mirror
                this.fCD=15; if(this.mirror){ this.mirror.expired=true; this.mirror=null; }
                // spawn mirror at current pos (lightweight, not part of entities)
                this.mirror = new MirrorForm(this,this.x,this.y,8.0);
                // create realm
                if(this.realm){ this.realm.del=true; this.realm=null; }
                this.realm = new Realm(this,this.mirror.x,this.mirror.y,8.0); entities.push(this.realm);
                // recharge Q and E
                this.qCD = 0; this.eCD = 0;
                this.gCharges = Math.min(this.maxGCharges, this.gCharges + 2);
            }
            ai(dt,spd){ if(this.handleSafeZone(dt)) return; let t=this.findTarget(); if(!t){ this.wander(dt,spd); return;} let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx); let d=Math.sqrt(dx*dx+dy*dy); if(d>200) { this.x += Math.cos(this.angle)*spd*dt; this.y += Math.sin(this.angle)*spd*dt; } else { if(this.basicCD<=0) this.basicAtk(); if(this.qCD<=0) this.doQ(); }
            }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            draw(ctx){
                if(this.currentSkin !== 'default'){
                    if(!drawSkinImage(ctx, this, 'ming', this.currentSkin, '#ff3b30', { filter: 'brightness(0.9) saturate(0.8)', alpha: 0.94 })) {
                        super.draw(ctx);
                    }
                } else {
                    super.draw(ctx);
                }
                ctx.beginPath();
                ctx.moveTo(this.x - camera.x, this.y - camera.y);
                ctx.lineTo((this.x - camera.x) + Math.cos(this.angle) * (this.radius + 10), (this.y - camera.y) + Math.sin(this.angle) * (this.radius + 10));
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        class Nos extends Entity {
            constructor(x,y,p){
                super(x,y,25,p?'#800080':'#4B0082',10000);
                this.isPlayer=p; this.countsAsFFAHero = true; this.name=p?"Player (Nos)":"Enemy Nos";
                this.basicCD=0; this.qCD=0; this.eCD=0; this.fCD=0;
                this.baseSpd=200; this.speed=this.baseSpd;
                this.enhancedTimer=0; this.windupQ=0; this.windupF=0; this.shieldTimer=0;
                this.nightmareField=null; this.inNightmareField = false;
            }
            update(dt){ if(this.dead) return; this.updateCommon(dt);
                if(this.basicCD>0) this.basicCD-=dt; if(this.qCD>0) this.qCD-=dt; if(this.eCD>0) this.eCD-=dt; if(this.fCD>0) this.fCD-=dt; if(this.rCD>0) this.rCD-=dt;
                if(this.enhancedTimer>0) this.enhancedTimer-=dt;
                if(this.shieldTimer>0) this.shieldTimer-=dt;
                if(this.windupQ>0){ this.windupQ-=dt; if(this.windupQ<=0){ this.doQDamage(); this.enhancedTimer=8; } }
                if(this.windupF>0){ this.windupF-=dt; if(this.windupF<=0){ this.doFJump(); } }
                if(this.windupF >0){ this.shield = Math.max(this.shield, 1000); this.debuffImmuneTimer = 0.1; }
                // nightmare field check
                if(this.nightmareField && !this.nightmareField.del){
                    let d = Math.sqrt((this.x - this.nightmareField.x)**2 + (this.y - this.nightmareField.y)**2);
                    if(d <= this.nightmareField.radius) this.enhancedTimer = 5;
                    this.inNightmareField = d <= this.nightmareField.radius;
                } else this.inNightmareField = false;
                let spd = this.getEffectiveSpeed();
                if(this.stunTimer>0 || this.freezeTimer>0){ if(this.isPlayer) updateHUD(this); return; }
                if(this.isPlayer){ this.input(dt,spd); if(keys.r && this.rCD<=0) this.useGear(); updateHUD(this); } else this.ai(dt,spd);
            }
            input(dt,spd){ let dx=0,dy=0; if(keys.w)dy--; if(keys.s)dy++; if(keys.a)dx--; if(keys.d)dx++; if(dx||dy){ let m=new Vector2(dx,dy).norm().mult(spd*dt); this.x+=m.x; this.y+=m.y; }
                this.angle=getMouseAimAngle(this.x, this.y); if(mouse.down && this.basicCD<=0) this.basicAtk();
                if(keys.q && this.qCD<=0) this.doQ(); if(keys.e && this.eCD<=0) this.doE(); if(keys.f && this.fCD<=0) this.doF(); }
            basicAtk(){ this.revealTimer=0.4; this.basicCD=1.5; 
                let length=120, width=40;
                particles.push(new Slash(this.x,this.y,this.angle,length,width,'#800080'));
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let dx = e.x - this.x, dy = e.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    let angleDiff = Math.abs(Math.atan2(dy,dx) - this.angle);
                    if(angleDiff > Math.PI) angleDiff = 2*Math.PI - angleDiff;
                    if(dist <= length && angleDiff <= width/2 / dist){ // rectangular
                        if(this.enhancedTimer>0){ 
                            e.hp -= 180;
                            this.totalDamage = (this.totalDamage || 0) + 180;
                            if(gameMode === 'training' && this.isPlayer && window.trainingStats) {
                                window.trainingStats.totalDamage += 180;
                            }
                            // Track damage contributors for leaderboard
                            if(!e.damageContributors) e.damageContributors = new Map();
                            const existing = e.damageContributors.get(this) || { amount: 0, time: 0 };
                            existing.amount = (existing.amount || 0) + 180;
                            existing.time = Date.now();
                            e.damageContributors.set(this, existing);
                            e.lastDamageTime = Date.now();
                            if(e.hp<=0) e.die(this); 
                        } else e.takeDamage(180 * this.getDamageMult(),this);
                        e.revealTimer=0.6;
                    }
                }
            }
            doQ(){ this.windupQ=0.5; this.qCD=4; }
            doQDamage(){
                const qDmg = Math.floor(this.maxHp * 0.1);
                let fx = this.x + Math.cos(this.angle)*10, fy = this.y + Math.sin(this.angle)*10;
                particles.push(new Slash(fx,fy,this.angle,200,Math.PI,'#800080'));
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let d=Math.sqrt((e.x-fx)**2+(e.y-fy)**2);
                    if(d<180){
                        if(this.enhancedTimer>0){ 
                            e.hp -= qDmg;
                            this.totalDamage = (this.totalDamage || 0) + qDmg;
                            if(gameMode === 'training' && this.isPlayer && window.trainingStats) {
                                window.trainingStats.totalDamage += qDmg;
                            }
                            // Track damage contributors for leaderboard
                            if(!e.damageContributors) e.damageContributors = new Map();
                            const existing = e.damageContributors.get(this) || { amount: 0, time: 0 };
                            existing.amount = (existing.amount || 0) + qDmg;
                            existing.time = Date.now();
                            e.damageContributors.set(this, existing);
                            e.lastDamageTime = Date.now();
                            if(e.hp<=0) e.die(this); 
                        } else e.takeDamage(qDmg * this.getDamageMult(),this);
                        for(let i=0;i<10;i++) particles.push(new Particle(e.x,e.y,'#800080',6,0.7));
                    }
                }
            }
            doE(){ this.eCD=6; let enemiesInRange = [];
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                    if(d<200) enemiesInRange.push(e);
                }
                let hitCount = Math.min(enemiesInRange.length, 3);
                let totalHeal = 0;
                let totalShield = 0;
                for(let i=0; i<hitCount; i++){
                    let e = enemiesInRange[i];
                    totalHeal += 150;
                    totalShield += 150;
                    e.slowTimer = Math.max(e.slowTimer, 2);
                    for(let j=0;j<8;j++) particles.push(new Particle(e.x,e.y,'#800080',5,0.6));
                }
                if(totalHeal > 0) this.hp = Math.min(this.maxHp, this.hp + totalHeal);
                if(totalShield > 0) this.shield = Math.min(this.maxHp, (this.shield || 0) + totalShield);
                // Show radius
                for(let i=0;i<20;i++) particles.push(new Particle(this.x + Math.cos(i*0.3)*200, this.y + Math.sin(i*0.3)*200, '#800080', 2, 1.0));
            }
            doF(){ this.windupF=0.75; this.fCD=25; }
            doFJump(){
                let dx = mouse.x - CANVAS.width/2;
                let dy = mouse.y - CANVAS.height/2;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if(dist > 850){ dx *= 850/dist; dy *= 850/dist; }
                let tx = this.x + dx, ty = this.y + dy;
                this.x = tx; this.y = ty;
                let hit=false;
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                    if(d<500){
                        const realmDmg = 800;
                        e.hp -= realmDmg;
                        this.totalDamage = (this.totalDamage || 0) + realmDmg;
                        if(gameMode === 'training' && this.isPlayer && window.trainingStats) {
                            window.trainingStats.totalDamage += realmDmg;
                        }
                        // Track damage contributors for leaderboard assist/kill tracking
                        if(!e.damageContributors) e.damageContributors = new Map();
                        const existing = e.damageContributors.get(this) || { amount: 0, time: 0 };
                        existing.amount = (existing.amount || 0) + realmDmg;
                        existing.time = Date.now();
                        e.damageContributors.set(this, existing);
                        e.lastDamageTime = Date.now();
                        if(e.hp <= 0 && !e.dead) {
                            e.dead = true;
                            this.kills++;
                            if(this.isPlayer) addKillMsg(e.name + ' killed!');
                            e.die(this);
                        }
                        e.applyStatus('stun', 1.0, this);
                        hit=true;
                        for(let i=0;i<12;i++) particles.push(new Particle(e.x,e.y,'#800080',7,0.8));
                    }
                }
                // create nightmare field
                if(this.nightmareField){ this.nightmareField.del=true; }
                this.nightmareField = new NightmareField(this.x, this.y);
                entities.push(this.nightmareField);
            }
            ai(dt,spd){ if(this.handleSafeZone(dt)) return; let t=this.findTarget(); if(!t){ this.wander(dt,spd); return;} let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx); let d=Math.sqrt(dx*dx+dy*dy); if(d>250) { this.x += Math.cos(this.angle)*spd*dt; this.y += Math.sin(this.angle)*spd*dt; } else { if(this.basicCD<=0) this.basicAtk(); if(this.qCD<=0) this.doQ(); if(this.eCD<=0) this.doE(); }
            }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            draw(ctx){ super.draw(ctx); if(this.windupQ>0){ let prog = (0.5 - this.windupQ)/0.5; ctx.strokeStyle='#800080'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+10,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(128,0,128,0.3)'; ctx.beginPath(); ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+10,0,Math.PI*2*prog); ctx.fill(); } if(this.windupF>0){ let prog = (1 - this.windupF)/1; ctx.strokeStyle='#800080'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+15,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(128,0,128,0.3)'; ctx.beginPath(); ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+15,0,Math.PI*2*prog); ctx.fill(); } }
            getDamageMult(){ return this.rageTimer>0 ? 1.1 : 1; }
            getEffectiveSpeed(){ if(this.enhancedKBTimer>0) return 0; let s = this.speed; if(this.speedsterTimer>0) s*=1.5; if(this.inNightmareField) s*=1.1; return s; }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class NightmareField extends Entity {
            constructor(x,y){
                super(x,y,0,'#800080',1); this.countsAsFFAHero = false; // dummy hp
                this.radius=500; this.del=false; this.life=10;
            }
            update(dt){
                this.life -= dt; if(this.life <= 0) this.del = true;
            }
            draw(ctx){
                ctx.save(); ctx.translate(this.x-camera.x,this.y-camera.y);
                ctx.strokeStyle='#800080'; ctx.lineWidth=3; ctx.setLineDash([10,10]); ctx.beginPath(); ctx.arc(0,0,this.radius,0,Math.PI*2); ctx.stroke(); ctx.restore();
            }
        }

        class Glace extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#87CEEB' : '#4682B4', 6600);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Glace)" : "Enemy Glace";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.baseSpd = 200; // Speed 5, assuming base is 200 or something, adjust
                this.speed = this.baseSpd;
                this.icebergActive = false;
                this.icebergTimer = 0;
                this.icebergX = 0;
                this.icebergY = 0;
                this.arrowCount = 0;
                this.st = 0;
                this.sd = 1;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.icebergActive) {
                    this.icebergTimer -= dt;
                    if (this.icebergTimer <= 0) {
                        this.icebergActive = false;
                    } else {
                        // Apply slip to enemies in radius
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - this.icebergX)**2 + (e.y - this.icebergY)**2) < 400) {
                                e.slowTimer = Math.max(e.slowTimer, 1.0); // Slippery effect
                            }
                        }
                        // Spawn ice particles
                        for (let i = 0; i < 3; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            let dist = Math.random() * 300;
                            let px = this.icebergX + Math.cos(angle) * dist;
                            let py = this.icebergY + Math.sin(angle) * dist;
                            particles.push(new Particle(px, py, '#87CEEB', 4, 1.0));
                        }
                    }
                }
                let spd = this.getEffectiveSpeed();
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }

            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.createIceberg();
                if (keys.e && this.eCD <= 0) this.summonBlizzard();
                if (keys.f && this.fCD <= 0) {
                    if (this.icebergActive) this.breakIceberg();
                    else this.icedAir();
                }
                if (keys.r && this.rCD <= 0) this.useGear();
            }

            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = this.icebergActive ? 0.5 : 0.75;
                let dmg = this.icebergActive ? 100 : 80;
                let size = this.icebergActive ? 10 : 8;
                let enhanced = false;
                if (this.icebergActive) {
                    this.arrowCount++;
                    if (this.arrowCount >= 3) {
                        dmg = 250;
                        size = 15;
                        enhanced = true;
                        this.arrowCount = 0;
                    }
                }
                let proj = new Projectile(this, this.x, this.y, this.angle, 800, dmg, 1000, '#87CEEB', size);
                proj.isArrow = true;
                if (enhanced) {
                    proj.onHit = (target) => {
                        target.freezeTimer = Math.max(target.freezeTimer, 0.8);
                        if (this.isPlayer) addKillMsg("Frozen 🧊");
                    };
                }
                entities.push(proj);
            }

            createIceberg() {
                this.qCD = 18;
                this.icebergActive = true;
                this.icebergTimer = 10;
                this.icebergX = this.x + Math.cos(this.angle) * 300;
                this.icebergY = this.y + Math.sin(this.angle) * 300;
                for (let i = 0; i < 20; i++) particles.push(new Particle(this.icebergX, this.icebergY, '#87CEEB', 10, 1.0));
            }

            summonBlizzard() {
                this.eCD = 10;
                let blizzard = new Blizzard(this, this.x, this.y, this.angle);
                entities.push(blizzard);
            }

            breakIceberg() {
                this.fCD = 7;
                this.icebergActive = false;
                for (let i = 0; i < 30; i++) {
                    let angle = (i / 30) * Math.PI * 2;
                    let proj = new Projectile(this, this.icebergX, this.icebergY, angle, 2000, 250, 1500, '#87CEEB', 5);
                    proj.onHit = (target) => {
                        target.freezeTimer = Math.max(target.freezeTimer, 0.8);
                    };
                    entities.push(proj);
                }
                for (let i = 0; i < 50; i++) particles.push(new Particle(this.icebergX, this.icebergY, '#87CEEB', 8, 1.5));
            }

            icedAir() {
                this.fCD = 7;
                const range = 520;
                const halfWidth = Math.PI / 7;
                const knockback = 900;
                for (let e of entities) {
                    if (e === this || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    const distance = Math.hypot(dx, dy);
                    if (distance > range) continue;
                    const targetAngle = Math.atan2(dy, dx);
                    const difference = Math.abs(Math.atan2(Math.sin(targetAngle - this.angle), Math.cos(targetAngle - this.angle)));
                    if (difference > halfWidth) continue;
                    e.takeDamage(300, this);
                    e.freezeTimer = Math.max(e.freezeTimer || 0, 1);
                    e.kbx = (e.kbx || 0) + Math.cos(this.angle) * knockback;
                    e.kby = (e.kby || 0) + Math.sin(this.angle) * knockback;
                }
                for (let i = 0; i < 28; i++) {
                    const distance = Math.random() * range;
                    const spread = (Math.random() - 0.5) * halfWidth * 2;
                    particles.push(new Particle(
                        this.x + Math.cos(this.angle + spread) * distance,
                        this.y + Math.sin(this.angle + spread) * distance,
                        '#dff8ff', 5, 0.8,
                        Math.cos(this.angle + spread) * 180,
                        Math.sin(this.angle + spread) * 180
                    ));
                }
                if (this.isPlayer) addKillMsg('Iced Air!');
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                let d = Math.sqrt(dx*dx + dy*dy);
                
                // Strafe like Builderman
                this.st -= dt; if (this.st <= 0) { this.sd *= -1; this.st = 0.5 + Math.random() * 1.5; }
                
                let mx = 0, my = 0;
                if (d > 400) { mx += Math.cos(this.angle); my += Math.sin(this.angle); } // approach if far
                if (d < 400) { mx -= Math.cos(this.angle); my -= Math.sin(this.angle); } // kite if close
                if (d < 600) { // strafe
                    mx -= Math.sin(this.angle) * this.sd * 0.5;
                    my += Math.cos(this.angle) * this.sd * 0.5;
                }
                let l = Math.sqrt(mx*mx + my*my); if (l > 0) { this.x += (mx/l) * spd * dt; this.y += (my/l) * spd * dt; }
                
                if (d < 600 && this.qCD <= 0 && !this.icebergActive) this.createIceberg();
                if (d < 600 && this.eCD <= 0) this.summonBlizzard();
                if (this.fCD <= 0 && d < 600) {
                    if (this.icebergActive) this.breakIceberg();
                    else this.icedAir();
                }
                if (this.icebergActive && d > 200 && d < 600 && this.basicCD <= 0) this.basicAtk();
            }

            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }

            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }

            draw(ctx) {
                super.draw(ctx);
            }
        }

        class Carlos extends Entity {
            constructor(x,y,p){
                super(x,y,20,p?'#009c3b':'#ffdf00',4700);
                this.isPlayer=p; this.countsAsFFAHero = true; this.name=p?"Player (Carlos)":"Enemy Carlos";
                this.currentSkin = 'default';
                this.skinIcon = null;
                this.basicCD=0; this.qCD=0; this.eCD=0; this.fCD=0;
                this.baseSpd=250; this.speed=250;
                this.enhancedBasic = false;
                this.stutterSteps = 0;
                this.stutterDelay = 0;
                this.speedBuffTimer = 0;
                this.dodgeTimer = 0;
                this.stunCounter = 0;
                this.ultHpTimer = 0;
                this.visionGogglesTimer = 0;
                this.electricoTimer = 0;
                this.dmgMult = 1.0;
            }
            update(dt){ if(this.dead) return; this.updateCommon(dt);
                if(this.basicCD>0) this.basicCD-=dt; if(this.qCD>0) this.qCD-=dt; if(this.eCD>0) this.eCD-=dt; if(this.fCD>0) this.fCD-=dt; if(this.rCD>0) this.rCD-=dt;
                if(this.stutterSteps>0){
                    if(this.stutterDelay <= 0){
                        this.stutterSteps--;
                        // do stutter step
                        let stepDist = 50;
                        this.x += Math.cos(this.angle) * stepDist;
                        this.y += Math.sin(this.angle) * stepDist;
                        this.angle += (Math.random()-0.5)*0.5; // random direction change
                        // Stutter step effects
                        for(let i=0;i<8;i++) particles.push(new Particle(this.x,this.y,'#009c3b',4,0.7));
                        for(let i=0;i<5;i++) particles.push(new Particle(this.x,this.y,'#ffdf00',3,0.5));
                        for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                            let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                            if(d<200){
                                e.takeDamage(140 * this.getDamageMult(),this);
                                    e.applyStatus('stun', 0.15, this);
                                this.stunCounter++;
                                this.qCD = Math.max(0, this.qCD - 1); // recharge 1s of Q
                            }
                        }
                        this.dmgMult = 0.5; // 50% less damage during stutter
                        this.stutterDelay = 0.03;
                    } else {
                        this.stutterDelay -= dt;
                    }
                } else this.dmgMult = 1.0;
                if(this.speedBuffTimer>0) this.speedBuffTimer -= dt;
                if(this.dodgeTimer>0) this.dodgeTimer -= dt;
                if(this.ultHpTimer>0){ this.ultHpTimer-=dt; if(this.ultHpTimer<=0){ this.maxHp=4700; this.hp = Math.floor((this.hp / 6200) * 4700); } }
                if(this.visionGogglesTimer>0) this.visionGogglesTimer -= dt;
                if(this.electricoTimer>0) this.electricoTimer -= dt;
                if(this.stunCounter >= 12){
                    this.qCD = 0;
                    this.eCD = 0;
                    this.stunCounter -= 12;
                }
                let spd = this.getEffectiveSpeed();
                if(this.speedBuffTimer>0) spd *= 2.5;
                if(this.stunTimer>0 || this.freezeTimer>0){ if(this.isPlayer) updateHUD(this); return; }
                if(this.isPlayer){ this.input(dt,spd); if(keys.r && this.rCD<=0) this.useGear(); updateHUD(this); } else this.ai(dt,spd);
            }
            input(dt,spd){ let dx=0,dy=0; if(keys.w)dy--; if(keys.s)dy++; if(keys.a)dx--; if(keys.d)dx++; if(dx||dy){ let m=new Vector2(dx,dy).norm().mult(spd*dt); this.x+=m.x; this.y+=m.y; }
                this.angle=getMouseAimAngle(this.x, this.y); if(mouse.down && this.basicCD<=0) this.basicAtk();
                if(keys.q && this.qCD<=0) this.doQ(); if(keys.e && this.eCD<=0) this.doE(); if(keys.f && this.fCD<=0) this.doF();
            }
            basicAtk(){
                this.revealTimer=0.5;
                this.basicCD = 0.4;
                if(this.enhancedBasic){
                    this.enhancedBasic = false;
                    // Enhanced powershot: larger radius and 640 damage
                    let dmg = 640;
                    let length=200, width=80;
                    particles.push(new Slash(this.x,this.y,this.angle,length,width,'#ffdf00'));
                    for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let angleDiff = Math.abs(Math.atan2(dy,dx) - this.angle);
                        if(angleDiff > Math.PI) angleDiff = 2*Math.PI - angleDiff;
                        if(dist <= length && angleDiff <= width/2 / dist){
                            e.takeDamage(dmg * this.getDamageMult(),this);
                            e.revealTimer=1.0;
                        }
                    }
                    if(this.isPlayer) addKillMsg('Enhanced Powershot!');
                } else {
                    // Normal basic attack
                    let dmg = 80;
                    let length=120, width=40;
                    particles.push(new Slash(this.x,this.y,this.angle,length,width,'#009c3b'));
                    for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let angleDiff = Math.abs(Math.atan2(dy,dx) - this.angle);
                        if(angleDiff > Math.PI) angleDiff = 2*Math.PI - angleDiff;
                        if(dist <= length && angleDiff <= width/2 / dist){
                            e.takeDamage(dmg * this.getDamageMult(),this);
                            e.revealTimer=1.0;
                        }
                    }
                }
            }
            doQ(){
                this.qCD=10;
                // Check for enemies in 100 radius
                let hasEnemies = false;
                for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                    let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                    if(d<100) hasEnemies = true;
                }
                if(hasEnemies){
                    let dist=250;
                    let oldX = this.x, oldY = this.y;
                    this.dodgeTimer = 0.5; // 0.5s invincibility during dash
                    // Dash animation over 0.2 seconds
                    let steps = 5;
                    let stepDist = dist / steps;
                    for(let i = 0; i < steps; i++){
                        this.x += Math.cos(this.angle)*stepDist;
                        this.y += Math.sin(this.angle)*stepDist;
                    }
                    // Always set enhanced basic on successful dribble
                    this.enhancedBasic = true;
                    // Dribble effects
                    for(let i=0;i<15;i++) particles.push(new Particle(this.x,this.y,'#009c3b',3,0.8));
                    for(let i=0;i<10;i++) particles.push(new Particle(this.x,this.y,'#ffdf00',2,0.6));
                    this.shield += 470;
                }
                this.speedBuffTimer = 0.5; // 0.5s speed x2.5 always on use
            }
            doE(){
                this.eCD=15;
                this.stutterSteps=12;
            }
            doF(){
                this.fCD=20;
                for(let i=0;i<5;i++){
                    let angle = Math.random()*Math.PI*2;
                    let dist = Math.random()*200 + 50;
                    let fx = this.x + Math.cos(angle)*dist;
                    let fy = this.y + Math.sin(angle)*dist;
                    entities.push(new Firework(fx,fy,this));
                }
                this.maxHp=6200;
                this.ultHpTimer=10;
                this.hp = Math.floor((this.hp / 4700) * 6200);
            }
            ai(dt,spd){ if(this.handleSafeZone(dt)) return; let t=this.findTarget(); if(!t){ this.wander(dt,spd); return;} let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx); let d=Math.sqrt(dx*dx+dy*dy); if(d>200) { this.x += Math.cos(this.angle)*spd*dt; this.y += Math.sin(this.angle)*spd*dt; } else { if(this.basicCD<=0) this.basicAtk(); if(this.qCD<=0) this.doQ(); if(this.eCD<=0) this.doE(); if(this.fCD<=0) this.doF(); } }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            draw(ctx){ 
                const renderSkinImage = (img, borderColor) => {
                    if (!img || !img.complete || !img.naturalWidth) return false;
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.filter = 'brightness(0.93) saturate(0.9)';
                    ctx.globalAlpha = 0.98;
                    ctx.drawImage(img, this.x - camera.x - this.radius, this.y - camera.y - this.radius, this.radius * 2, this.radius * 2);
                    ctx.restore();
                    ctx.strokeStyle = borderColor;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    return true;
                };

                if(this.currentSkin === 'Roberto Carlos'){
                    super.draw(ctx);
                    const icon = getSkinIcon('carlos', this.currentSkin);
                    if (icon) {
                        if (!this.skinIcon || this.skinIcon.src !== icon) {
                            const img = new Image();
                            img.decoding = 'async';
                            img.onload = () => { this.skinIcon = img; };
                            img.onerror = () => { this.skinIcon = null; };
                            img.src = icon;
                            this.skinIcon = img;
                        }
                        if (this.skinIcon && this.skinIcon.complete && this.skinIcon.naturalWidth) {
                            renderSkinImage(this.skinIcon, '#009c3b');
                        }
                    }
                } else if(this.currentSkin !== 'default'){
                    const icon = getSkinIcon('carlos', this.currentSkin);
                    if (icon) {
                        if (!this.skinIcon || this.skinIcon.src !== icon) {
                            const img = new Image();
                            img.decoding = 'async';
                            img.onload = () => { this.skinIcon = img; };
                            img.onerror = () => { this.skinIcon = null; };
                            img.src = icon;
                            this.skinIcon = img;
                        }
                        if (this.skinIcon && this.skinIcon.complete && this.skinIcon.naturalWidth) {
                            renderSkinImage(this.skinIcon, '#16a34a');
                        } else {
                            super.draw(ctx);
                        }
                    } else {
                        super.draw(ctx);
                    }
                } else {
                    super.draw(ctx);
                }
                if(this.stutterSteps > 0){
                    ctx.fillStyle = '#fff';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.stutterSteps, this.x - camera.x, this.y - camera.y - 50);
                }
                if(this.enhancedBasic) {
                    ctx.strokeStyle = '#ffdf00';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 12, 0, Math.PI*2);
                    ctx.stroke();
                }
                ctx.beginPath();
                ctx.moveTo(this.x - camera.x, this.y - camera.y);
                ctx.lineTo((this.x - camera.x) + Math.cos(this.angle) * (this.radius + 10), (this.y - camera.y) + Math.sin(this.angle) * (this.radius + 10));
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            getDamageMult(){ return this.rageTimer>0 ? 1.1 : 1; }
            getEffectiveSpeed(){ if(this.enhancedKBTimer>0) return 0; let s = this.speed; if(this.speedsterTimer>0) s*=1.5; return s; }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            takeDamage(dmg, attacker){ if(this.dodgeTimer > 0) return; super.takeDamage(dmg, attacker); }
        }

        class Wesley extends Entity {
            constructor(x,y,p){
                super(x,y,22,'#4A90E2',9600);
                this.isPlayer=p; this.countsAsFFAHero = true; this.name=p?"Player (Wesley)":"Enemy Wesley";
                this.basicCD=0; this.qCD=0; this.eCD=0; this.fCD=0; this.rCD=0;
                this.baseSpd=210; this.speed=210;
                this.revealTimer = 0;
                // Passive shield
                this.specialShield = true;
                this.shieldCD = 0;
                // E ability state
                this.healing = false;
                this.healTimer = 0;
                this.enhancedBasicAttacks = 0; // Water blow attacks after heal
                // F ability state
                this.pulling = false;
                this.pullTimer = 0;
                this.pulledEnemies = [];
                this.currentTarget = null;
            }
            update(dt){
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD>0) this.basicCD-=dt;
                if(this.qCD>0) this.qCD-=dt;
                if(this.eCD>0) this.eCD-=dt;
                if(this.fCD>0) this.fCD-=dt;
                if(this.rCD>0) this.rCD-=dt;
                if(this.shieldCD>0) this.shieldCD-=dt;
                if(this.revealTimer>0) this.revealTimer-=dt;
                
                // E heal state - 960 HP total over 3s (320 per second / 32 per 0.1s)
                if(this.healing && this.healTimer > 0) {
                    this.healTimer -= dt;
                    this.hp = Math.min(this.maxHp, this.hp + 320 * dt); // 960 HP total over 3s (320 per second)
                    // Apply a lighter slow to nearby enemies in healing radius
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            if(d < 200) { // Healing radius = 200 units (visual shows 200 radius)
                                e.slowTimer = Math.max(e.slowTimer, 0.6); // Weaker slow than before
                            }
                        }
                    }
                    for(let i = 0; i < 3; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*50, this.y + (Math.random()-0.5)*50, '#4A90E2', 4, 0.5));
                } else if(this.healing && this.healTimer <= 0) {
                    this.healing = false;
                }
                
                // F pull state - continuous pulling with improved visuals
                if(this.pulling && this.pullTimer > 0) {
                    this.pullTimer -= dt;
                    // Pull enemies toward Wesley and keep them stunned
                    for(let e of this.pulledEnemies) {
                        if(!e.dead && e instanceof Entity) {
                            let dx = this.x - e.x;
                            let dy = this.y - e.y;
                            let dist = Math.sqrt(dx*dx + dy*dy);
                            if(dist > 0) {
                                e.x += (dx/dist) * 150 * dt; // Pull speed - increased
                                e.y += (dy/dist) * 150 * dt;
                            }
                            e.applyStatus('stun', this.pullTimer, this); // Keep stunned entire pull duration (FFA-aware)
                            // Improve water pull particles on enemies
                            for(let i = 0; i < 3; i++) {
                                particles.push(new Particle(e.x + (Math.random()-0.5)*40, e.y + (Math.random()-0.5)*40, '#2980B9', 5, 0.4));
                            }
                        }
                    }
                    // Deal 100 damage per 0.25s
                    if(Math.floor(this.pullTimer * 4) !== Math.floor((this.pullTimer+dt) * 4)) {
                        for(let e of this.pulledEnemies) {
                            if(!e.dead && e instanceof Entity) {
                                e.takeDamage(100, this);
                            }
                        }
                    }
                } else if(this.pulling && this.pullTimer <= 0) {
                    this.pulling = false;
                    this.pulledEnemies = [];
                }
                
                // Restore shield passive after cooldown
                if(this.shieldCD <= 0 && !this.specialShield) {
                    this.specialShield = true;
                }
                
                if(this.stunTimer>0 || this.freezeTimer>0){ if(this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer){ this.input(dt,spd); updateHUD(this); } else this.ai(dt,spd);
            }
            takeDamage(amt, src){
                if(this.dead) return;
                
                // Apply special shield passive
                if(this.specialShield) {
                    if(amt > 500) {
                        amt -= 550; // Slightly stronger passive mitigation
                    } else {
                        amt *= 0.12; // 88% less (12% remaining)
                    }
                    this.specialShield = false;
                    this.shieldCD = 12;
                }
                
                // 25% less damage during pull
                if(this.pulling) {
                    amt *= 0.75;
                }
                
                super.takeDamage(amt, src);
            }
            input(dt,spd){
                let dx=0,dy=0;
                // Can move at 20% speed during ultimate
                if(keys.w)dy--;
                if(keys.s)dy++;
                if(keys.a)dx--;
                if(keys.d)dx++;
                if(dx||dy){
                    // Reduce speed to 20% while pulling ultimate
                    let moveSpd = this.pulling ? spd * 0.2 : spd;
                    let m=new Vector2(dx,dy).norm().mult(moveSpd*dt);
                    this.x+=m.x;
                    this.y+=m.y;
                }
                // Only update angle if not pulling (lock direction during ultimate)
                if(!this.pulling) this.angle=getMouseAimAngle(this.x, this.y);
                if(mouse.down&&this.basicCD<=0) this.basicAttack();
                if(keys.q&&this.qCD<=0) this.waterClaw();
                if(keys.e&&this.eCD<=0) this.startHeal();
                if(keys.f&&this.fCD<=0&&!this.pulling) this.waterBlast(); // Cannot use F while pulling
                if(keys.r && this.rCD<=0) this.useGear();
            }
            basicAttack(){
                this.revealTimer=0.5;
                
                // Enhanced water blow if available
                if(this.enhancedBasicAttacks > 0) {
                    this.basicCD = 0.8;
                    // Fire ranged water projectile with enhanced damage
                    let proj = new Projectile(this, this.x, this.y, this.angle, 1000, 480, 400, '#4A90E2', 8);
                    proj.onHit = (target) => {
                        this.shield = Math.min(this.maxHp, this.shield + 270); // Slightly less shield from enhanced basic hits
                    };
                    entities.push(proj);
                    this.enhancedBasicAttacks--;
                    if(this.isPlayer) addKillMsg('Water Blow!');
                } else {
                    // Normal basic attack - ranged water projectile
                    this.basicCD = 1.15;
                    let proj = new Projectile(this, this.x, this.y, this.angle, 1000, 150, 500, '#4A90E2', 5);
                    entities.push(proj);
                }
            }
            waterClaw(){
                this.revealTimer=0.5;
                this.qCD = 6;
                
                // Water claw damage to nearby enemies
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < 200) {
                            e.takeDamage(800, this);
                            e.slowTimer = 3.0; // Slowness II
                            e.revealTimer = 1.0;
                            // Large visible water claw effect
                            for(let i = 0; i < 15; i++) {
                                particles.push(new Particle(e.x, e.y, '#4A90E2', 8, 0.8));
                            }
                        }
                    }
                }
                // Add visual claw effect at Wesley's location
                for(let i = 0; i < 20; i++) {
                    let angle = (Math.PI * 2 / 20) * i;
                    let dist = 150;
                    particles.push(new Particle(this.x + Math.cos(angle)*dist, this.y + Math.sin(angle)*dist, '#2980B9', 7, 0.7));
                }
                if(this.isPlayer) addKillMsg('Water Claw!');
            }
            startHeal(){
                this.healing = true;
                this.healTimer = 3.0;
                this.eCD = 8;
                this.enhancedBasicAttacks = 2; // Grant 2 enhanced water blow attacks immediately
                if(this.isPlayer) addKillMsg('Wesley Healing! 2x Water Blow ready!');
            }
            waterBlast(){
                this.revealTimer=0.5;
                this.pulling = true;
                this.pullTimer = 2.5;
                this.pulledEnemies = [];
                this.fCD = 14;
                
                // Find all enemies in FORWARD direction cone only (45 degree cone, reduced range)
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x;
                        let dy = e.y - this.y;
                        let d = Math.sqrt(dx*dx + dy*dy);
                        if(d < 350) { // Reduced from 500 to 350
                            // Check if in forward direction cone (90 degrees = PI/2)
                            let angleToE = Math.atan2(dy, dx);
                            let angleDiff = angleToE - this.angle;
                            // Normalize angle difference to -PI to PI
                            while(angleDiff > Math.PI) angleDiff -= Math.PI*2;
                            while(angleDiff < -Math.PI) angleDiff += Math.PI*2;
                            // Check if within 45 degree cone forward
                            if(Math.abs(angleDiff) < Math.PI/4) {
                                this.pulledEnemies.push(e);
                                e.revealTimer = 1.0;
                            }
                        }
                    }
                }
                
                if(this.isPlayer) addKillMsg('Water Blast!');
            }
            ai(dt,spd){
                if(this.handleSafeZone(dt)) return;

                let t = this.currentTarget;
                let tDist = Infinity;

                if(t && t instanceof Entity && !t.dead && t.team !== this.team && t.isVisibleTo(this)) {
                    tDist = Math.sqrt((t.x-this.x)**2 + (t.y-this.y)**2);
                    if(tDist > 1000) t = null;
                } else {
                    t = null;
                }

                if(!t){
                    t = this.findTarget();
                    if(t) tDist = Math.sqrt((t.x-this.x)**2 + (t.y-this.y)**2);
                } else {
                    let nearest = this.findTarget();
                    if(nearest && nearest !== t){
                        let nearestDist = Math.sqrt((nearest.x-this.x)**2 + (nearest.y-this.y)**2);
                        if(nearestDist < tDist - 180 || tDist > 900) {
                            t = nearest;
                            tDist = nearestDist;
                        }
                    }
                }

                this.currentTarget = t;

                if(!t){ this.wander(dt,spd); return; }
                let dx = t.x-this.x, dy = t.y-this.y;
                this.angle = Math.atan2(dy,dx);
                let d = Math.sqrt(dx*dx+dy*dy);
                if(d > 300) {
                    this.x += Math.cos(this.angle)*spd*dt;
                    this.y += Math.sin(this.angle)*spd*dt;
                } else {
                    if(this.basicCD<=0) this.basicAttack();
                    if(this.qCD<=0 && d < 200) this.waterClaw();
                    if(this.eCD<=0 && this.hp < this.maxHp*0.5) this.startHeal();
                    if(this.fCD<=0 && d < 500) this.waterBlast();
                }
            }
            findTarget(){
                let c=null,md=9999;
                for(let e of entities)
                    if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){
                        let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d<md){md=d;c=e;}
                    }
                return c;
            }
            wander(dt,spd){
                if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;
                this.x+=Math.cos(this.angle)*spd*0.5*dt;
                this.y+=Math.sin(this.angle)*spd*0.5*dt;
            }
            draw(ctx){
                super.draw(ctx);
                // Show special shield status
                if(this.specialShield) {
                    ctx.strokeStyle = '#4A90E2';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 8, 0, Math.PI*2);
                    ctx.stroke();
                }
                // Show healing aura - bigger and more visible
                if(this.healing) {
                    ctx.fillStyle = 'rgba(74, 144, 226, 0.35)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 200, 0, Math.PI*2);
                    ctx.fill();
                    // Add border for visibility
                    ctx.strokeStyle = '#4A90E2';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                // Show enhanced basic attacks ready
                if(this.enhancedBasicAttacks > 0) {
                    ctx.fillStyle = '#00ff00';
                    ctx.font = 'bold 12px Arial';
                    ctx.fillText(`⚡x${this.enhancedBasicAttacks}`, this.x - camera.x - 15, this.y - camera.y - 40);
                }
                // Show FORWARD pull cone effect - matches 350 unit range
                if(this.pulling) {
                    ctx.strokeStyle = '#1e90ff';
                    ctx.lineWidth = 3;
                    ctx.fillStyle = 'rgba(30, 144, 255, 0.2)';
                    // Draw forward cone in direction of angle - 350 units to match actual range
                    ctx.beginPath();
                    ctx.moveTo(this.x - camera.x, this.y - camera.y);
                    let coneLength = 350; // Matches actual pull range
                    let coneAngle = Math.PI/4; // 45 degree cone
                    let x1 = this.x + Math.cos(this.angle - coneAngle) * coneLength;
                    let y1 = this.y + Math.sin(this.angle - coneAngle) * coneLength;
                    let x2 = this.x + Math.cos(this.angle + coneAngle) * coneLength;
                    let y2 = this.y + Math.sin(this.angle + coneAngle) * coneLength;
                    ctx.lineTo(x1 - camera.x, y1 - camera.y);
                    ctx.arc(this.x - camera.x, this.y - camera.y, coneLength, this.angle - coneAngle, this.angle + coneAngle);
                    ctx.lineTo(x2 - camera.x, y2 - camera.y);
                    ctx.fill();
                    ctx.stroke();
                }
            }
            getEffectiveSpeed(){ if(this.enhancedKBTimer>0) return 0; let s = this.speed; if(this.slowTimer > 0) s *= 0.6; return s; }
        }

        class Gamb extends Entity {
            constructor(x,y,p){
                let hp = Math.floor(Math.random() * 2001) + 3000; // 3000-5000
                super(x,y,20,p?'#8B4513':'#D2691E',hp);
                this.isPlayer=p; this.countsAsFFAHero = true; this.name=p?"Player (Gamb)":"Enemy Gamb";
                this.basicCD=0; this.qCD=0; this.eCD=0; this.fCD=0; this.gCD=0;
                this.baseSpd=220; this.speed=220;
                this.gCharges=0; this.maxGCharges=3;
                this.eCharges=0; this.maxECharges=3;
                this.chargePool = 0;
                this.eWindup=0; this.eWinupChoice=0;
                this.fBuff=0; this.fChoice=0;
                this.luckHatTimer=0;
                this.dodgeChance=0.01;
                this.gambDamageTakenTimer = 0;
            }
            syncChargePool(){ this.eCharges = this.chargePool; this.gCharges = this.chargePool; }
            update(dt){ if(this.dead) return; this.updateCommon(dt);
                if(this.basicCD>0) this.basicCD-=dt; if(this.qCD>0) this.qCD-=dt; if(this.eCD>0) this.eCD-=dt; if(this.fCD>0) this.fCD-=dt; if(this.gCD>0) this.gCD-=dt; if(this.rCD>0) this.rCD-=dt;
                if(this.eWindup>0){ this.eWindup-=dt; if(this.eWindup<=0){ this.fireGun(); } }
                if(this.luckHatTimer>0) this.luckHatTimer -= dt;
                if(this.gambDamageTakenTimer>0){ this.gambDamageTakenTimer -= dt; }
                let spd = this.getEffectiveSpeed();
                if(this.luckHatTimer>0 && (this.fChoice===2 || this.fChoice===3)) spd *= 2; // 2x speed (always there in lucky hat)
                if(this.stunTimer>0 || this.freezeTimer>0){ if(this.isPlayer) updateHUD(this); return; }
                if(this.isPlayer){ this.input(dt,spd); if(keys.r && this.rCD<=0) this.useGear(); updateHUD(this); } else this.ai(dt,spd);
            }
            input(dt,spd){ let dx=0,dy=0; if(keys.w)dy--; if(keys.s)dy++; if(keys.a)dx--; if(keys.d)dx++; if(dx||dy){ let m=new Vector2(dx,dy).norm().mult(spd*dt); this.x+=m.x; this.y+=m.y; }
                this.angle=getMouseAimAngle(this.x, this.y); if(mouse.down&&this.basicCD<=0) this.basicAtk();
                if(keys.q&&this.qCD<=0) this.doQ(); if(keys.e&&this.eCD<=0) this.doE(); if(keys.f&&this.fCD<=0&&this.chargePool>=2) this.doF(); if(keys.g&&this.gCD<=0&&this.chargePool>0) this.doG();
            }
            basicAtk(){
                this.revealTimer=0.5;
                // Minigun mode: 10x faster; normal mode: 0.25s; BasicCD buff: 10x faster with damage reduction
                let isBuffed = this.luckHatTimer > 0 && this.fChoice === 2;
                let isBasicCD = this.luckHatTimer > 0 && this.fChoice === 3;
                this.basicCD = (isBuffed || isBasicCD) ? 0.025 : 0.25; // 10x faster (0.025s), normal 0.25s
                let range = isBasicCD ? 200 : (isBuffed ? 250 : 400); // BasicCD buff 200, minigun 250, normal 400
                let dmg = isBasicCD ? 35 : (isBuffed ? 30 : 50); // BasicCD buff damage 35, minigun 30, normal 50
                let proj = new Projectile(this, this.x, this.y, this.angle+(Math.random()-0.5)*0.15, 1200, dmg, range, '#FFD700', isBuffed ? 2 : 4);
                proj.maxDistance = range;
                proj.onHit=(e)=>{ this.shield += Math.floor(Math.random()*5)+2; };
                entities.push(proj);
            }
            doQ(){
                this.qCD=3;
                const heads = Math.random() < 0.5;
                if(heads) {
                    this.chargePool = Math.min(this.maxGCharges, this.chargePool + 1);
                    this.syncChargePool();
                    if(this.isPlayer) addKillMsg('Coin flip: Heads! +1 charge');
                } else {
                    this.gambDamageTakenTimer = 10;
                    if(this.isPlayer) addKillMsg('Coin flip: Tails! +10% damage taken for 10s');
                }
                for(let i=0;i<10;i++) particles.push(new Particle(this.x,this.y,'#FFD700',4,0.5));
            }
            doE(){
                if(this.chargePool<=0) return;
                this.eCD=8;
                this.eWindup=1.0;
                
                let r = Math.random();
                let outcome = 0;
                if(r<0.25) outcome=1;
                else if(r<0.5) outcome=2;
                else if(r<0.75) outcome=3;
                else outcome=4;
                
                this.eWinupChoice = outcome;
                this.chargePool = Math.max(0, this.chargePool - 1);
                this.syncChargePool();
            }
            fireGun(){
                let outcome = this.eWinupChoice;
                
                // Fire laser beam
                let dmg = outcome===4 ? 1250*3 : 1250;
                for(let i=0;i<20;i++) particles.push(new Particle(this.x + Math.cos(this.angle)*i*40, this.y + Math.sin(this.angle)*i*40, '#00FF00', 3, 0.5));
                
                for(let e of entities) if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team){
                    let dx=e.x-this.x,dy=e.y-this.y,d=Math.sqrt(dx*dx+dy*dy);
                    if(d<800){
                        let ad=Math.abs(Math.atan2(dy,dx)-this.angle);
                        if(ad>Math.PI)ad=2*Math.PI-ad;
                        if(ad<0.2){ e.takeDamage(dmg,this); e.revealTimer=1.0; }
                    }
                }
                
                // Apply outcome effect
                if(outcome===1){ this.shield+=625; if(this.isPlayer) addKillMsg('Lucky! +625 Shield'); }
                else if(outcome===2){ this.hp -= 1000; if(this.isPlayer) addKillMsg('Unlucky! -1000 HP'); }
                else if(outcome===3){ if(this.isPlayer) addKillMsg('Nothing happens...'); }
                else if(outcome===4){ if(this.isPlayer) addKillMsg('Triple Damage Laser!'); }
            }
            doF(){
                if(this.chargePool < 2) return;
                this.fCD=12; this.luckHatTimer=8;
                this.fChoice = 3;
                if(this.isPlayer) addKillMsg('Hat: 10x Attack Speed + 2x Speed!');
                this.chargePool = Math.max(0, this.chargePool - 2);
                this.syncChargePool();
            }
            doG(){
                if(this.chargePool<=0) return;
                this.gCD=8;
                const chargesUsed = this.chargePool;
                const minHp = 2500 + (chargesUsed - 1) * 500;
                const maxHp = 8500;
                const newMaxHp = Math.floor(Math.random() * (maxHp - minHp + 1)) + minHp;
                const hpPercentage = this.hp / this.maxHp;
                this.maxHp = newMaxHp;
                this.hp = Math.floor(newMaxHp * hpPercentage);
                if(this.isPlayer) addKillMsg(`Rerolled HP: ${newMaxHp} (used ${chargesUsed} charges)`);
                this.chargePool = 0;
                this.syncChargePool();
            }
            takeDamage(dmg, attacker){
                if(this.gambDamageTakenTimer > 0) dmg *= 1.1;
                if(Math.random()<this.dodgeChance){ if(this.isPlayer) addKillMsg('Dodged!'); return; }
                super.takeDamage(dmg, attacker);
            }
            ai(dt,spd){ if(this.handleSafeZone(dt)) return; let t=this.findTarget(); if(!t){ this.wander(dt,spd); return;} let dx=t.x-this.x, dy=t.y-this.y; this.angle=Math.atan2(dy,dx); let d=Math.sqrt(dx*dx+dy*dy); if(d>250) { this.x += Math.cos(this.angle)*spd*dt; this.y += Math.sin(this.angle)*spd*dt; } else { if(this.basicCD<=0) this.basicAtk(); if(this.qCD<=0) this.doQ(); if(Math.random()<0.1 && this.eCD<=0 && this.eCharges>0) this.doE(); if(Math.random()<0.05 && this.fCD<=0 && this.eCharges>0) this.doF(); if(this.gCD<=0 && this.hp<this.maxHp*0.3 && this.gCharges>0) this.doG(); } }
            findTarget(){let c=null,md=9999;for(let e of entities)if(e!==this&&!e.dead&&e instanceof Entity&&e.team!==this.team&&e.isVisibleTo(this)){let d=Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);if(d<md){md=d;c=e;}}return c;}
            wander(dt,spd){if(Math.random()<0.05)this.angle+=(Math.random()-0.5)*1;this.x+=Math.cos(this.angle)*spd*0.5*dt;this.y+=Math.sin(this.angle)*spd*0.5*dt;}
            draw(ctx){ super.draw(ctx); if(this.eWindup>0){ let prog = (1-this.eWindup)/1; ctx.strokeStyle='#00FF00'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+10,0,Math.PI*2); ctx.stroke(); ctx.fillStyle='rgba(0,255,0,0.3)'; ctx.beginPath(); ctx.arc(this.x-camera.x,this.y-camera.y,this.radius+10,0,Math.PI*2*prog); ctx.fill(); } }
            getDamageMult(){ return 1; }
            getEffectiveSpeed(){ if(this.enhancedKBTimer>0) return 0; return this.speed; }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Neo extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#00ff00' : '#00cc00', 5000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Neo)" : "Enemy Neo";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.baseSpd = 280;
                this.speed = 280;
                
                // Neon Burst (Q) - directional lock
                this.qActive = false;
                this.qProjectilesLeft = 0;
                this.qTimer = 0;
                this.qFireTimer = 0;
                this.qLockedDir = 0;
                
                // Sector Burst (E) - movement buff, ability lockout
                this.eActive = false;
                this.eTimer = 0;
                this.eAbilityLocked = false;
                this.eSpeedMult = 1;
                
                // Neon Hook (F) - pulling and ability block
                this.hookActive = false;
                this.hookRange = 600;
                
                // Skating (G) - speed buff and shield on contact
                this.skatingActive = false;
                this.skatingTimer = 0;
                this.skatingSpeedMult = 3;
            }
            
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.gCD > 0) this.gCD -= dt;
                
                // Update Q (Neon Burst) active state
                if(this.qActive) {
                    this.qTimer -= dt;
                    this.qFireTimer -= dt;
                    if(this.qTimer > 0) {
                        // Fire projectiles at 0.1s intervals
                        if(this.qFireTimer <= 0 && this.qProjectilesLeft > 0) {
                            let angle = this.qLockedDir;
                            let proj = new Projectile(this, this.x, this.y, angle, 800, 85, 1200, '#00ff00', 8);
                            proj.maxDistance = 1200;
                            entities.push(proj);
                            this.qProjectilesLeft--;
                            this.qFireTimer = 0.1; // Fire next projectile after 0.1s
                        }
                    } else {
                        this.qActive = false;
                    }
                }
                
                // Update E (Sector Burst) active state
                if(this.eActive) {
                    this.eTimer -= dt;
                    if(this.eTimer > 0) {
                        // Deal damage in sector around Neo
                        for(let e of entities) {
                            if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                                if(d < 300) {
                                    let ad = Math.atan2(dy, dx);
                                    let da = Math.abs(ad - this.angle);
                                    if(da > Math.PI) da = 2*Math.PI - da;
                                    if(da < Math.PI/2) {
                                        e.takeDamage(10, this);
                                    }
                                }
                            }
                        }
                        // Add particles
                        for(let i = 0; i < 5; i++) {
                            particles.push(new Particle(this.x + Math.cos(this.angle + (Math.random()-0.5)*1.5)*100, 
                                                       this.y + Math.sin(this.angle + (Math.random()-0.5)*1.5)*100, '#00ff00', 3, 0.2));
                        }
                    } else {
                        this.eActive = false;
                        this.eAbilityLocked = false;
                        this.speed = this.baseSpd;
                    }
                }
                
                // Update Skating (G)
                if(this.skatingActive) {
                    this.skatingTimer -= dt;
                    // Check for enemy collisions and give shield
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                            if(d < 50) {
                                this.shield += 2;
                            }
                        }
                    }
                    if(this.skatingTimer <= 0) {
                        this.skatingActive = false;
                        this.speed = this.baseSpd;
                    }
                }
                
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                // Only update angle if not using Q or E abilities
                if(!this.qActive && !this.eActive) {
                    this.angle = getMouseAimAngle(this.x, this.y);
                }
                
                if(mouse.down && this.basicCD <= 0 && !this.eAbilityLocked) this.basicAtk();
                if(keys.q && this.qCD <= 0 && !this.qActive && !this.eAbilityLocked) this.doQ();
                if(keys.e && this.eCD <= 0 && !this.eActive) this.doE();
                if(keys.f && this.fCD <= 0 && !this.eAbilityLocked) this.doF();
                if(keys.g && this.gCD <= 0 && !this.skatingActive) this.doG();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.2;
                let proj = new Projectile(this, this.x, this.y, this.angle + (Math.random()-0.5)*0.1, 700, 30, 400, '#00ff00', 3);
                proj.maxDistance = 400;
                entities.push(proj);
            }
            
            doQ() {
                this.qCD = 4;
                this.qActive = true;
                this.qTimer = 2.0; // 20 projectiles * 0.1s = 2.0s duration
                this.qProjectilesLeft = 20;
                this.qFireTimer = 0; // Start firing immediately
                this.qLockedDir = this.angle;
                this.revealTimer = 0.5;
                if(this.isPlayer) addKillMsg('Neon Burst!');
            }
            
            doE() {
                this.eCD = 12;
                this.eActive = true;
                this.eTimer = 2;
                this.eAbilityLocked = true;
                this.eSpeedMult = 2;
                this.speed = this.baseSpd * 2;
                this.revealTimer = 0.5;
                if(this.isPlayer) addKillMsg('Sector Burst! 2x Speed!');
            }
            
            doF() {
                this.fCD = 13;
                let projectileDamage = 250;
                let hookWidth = 400;
                let hookLength = 1000;
                let abilityBlockDuration = 2;
                
                // Create wide rectangle attack in front of Neo
                let rectX = this.x + Math.cos(this.angle) * (hookLength / 2);
                let rectY = this.y + Math.sin(this.angle) * (hookLength / 2);
                
                // Check all entities in rectangle
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        // Check if entity is within the rectangle
                        let dx = e.x - this.x;
                        let dy = e.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        
                        // Forward distance check
                        let forwardDist = Math.cos(this.angle) * dx + Math.sin(this.angle) * dy;
                        // Perpendicular distance check
                        let perpDist = Math.abs(-Math.sin(this.angle) * dx + Math.cos(this.angle) * dy);
                        
                        if(forwardDist >= 0 && forwardDist <= hookLength && perpDist <= hookWidth / 2) {
                            e.takeDamage(projectileDamage, this);
                            // Pull enemy towards Neo
                            let pull = Math.min(dist, 150);
                            let angle = Math.atan2(dy, dx);
                            e.x -= Math.cos(angle) * pull;
                            e.y -= Math.sin(angle) * pull;
                            // Block abilities
                            e.applyStatus('stun', abilityBlockDuration, this);
                            e.revealTimer = 1.0;
                        }
                    }
                }
                
                // Add visual effect
                for(let i = 0; i < 30; i++) {
                    particles.push(new Particle(this.x + Math.cos(this.angle + (Math.random()-0.5)*1)*300, 
                                               this.y + Math.sin(this.angle + (Math.random()-0.5)*1)*300, '#00ff00', 5, 0.6));
                }
                
                this.revealTimer = 0.5;
                if(this.isPlayer) addKillMsg('Neon Hook!');
            }
            
            doG() {
                this.gCD = 25;
                this.skatingActive = true;
                this.skatingTimer = 8;
                this.speed = this.baseSpd * this.skatingSpeedMult;
                this.revealTimer = 0.5;
                if(this.isPlayer) addKillMsg('Skating! 3x Speed!');
                
                // Check for collisions and add shield
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                        if(d < 50) {
                            this.shield += 100;
                        }
                    }
                }
            }
            
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if(d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0 && !this.eAbilityLocked) this.basicAtk();
                    if(this.qCD <= 0 && !this.qActive && Math.random() < 0.1 && !this.eAbilityLocked) this.doQ();
                    if(this.eCD <= 0 && !this.eActive && Math.random() < 0.05) this.doE();
                    if(this.fCD <= 0 && Math.random() < 0.08 && !this.eAbilityLocked) this.doF();
                    if(this.gCD <= 0 && Math.random() < 0.1 && !this.skatingActive) this.doG();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < md) {
                            md = d;
                            c = e;
                        }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                super.draw(ctx);
                if(this.eActive) {
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 200, this.angle - Math.PI/4, this.angle + Math.PI/4);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
            
            getDamageMult() {
                return 1;
            }
            
            getEffectiveSpeed() {
                if(this.skatingActive) return this.baseSpd * this.skatingSpeedMult;
                if(this.eActive) return this.baseSpd * 2;
                return this.speed;
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Buster extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#1e90ff' : '#1873cc', 8300);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Buster)" : "Enemy Buster";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.baseSpd = 240;
                this.speed = 240;
                
                // Hologram (Q) - records damage and speeds up attacks
                this.hologramActive = false;
                this.hologramTimer = 0;
                this.recordedDamage = 0;
                this.basicSpeedMult = 1;
                this.preHologramHp = 0;
                
                // Triangle Aura (E) - damage amplification and slow
                this.auraActive = false;
                this.auraTimer = 0;
                this.damageAmp = 1;
                this.auraX = 0;
                this.auraY = 0;
                
                // Shield (F) - deflection
                this.shieldActive = false;
                this.shieldTimer = 0;
                this.shieldEntities = new Set();
                this.reflectedDamage = 0;
                
                // Ultimate damage reduction
                this.damageReductionActive = false;
                this.damageReductionTimer = 0;
                
                // Taunt mechanic
                this.tauntedEnemies = new Set();
            }
            
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                
                // Update Hologram
                if(this.hologramActive) {
                    this.hologramTimer -= dt;
                    // Apply taunt to nearby enemies - force them to attack hologram
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                            if(d < 400) {
                                this.tauntedEnemies.add(e);
                            }
                        }
                    }
                    if(this.hologramTimer <= 0) {
                        // Hologram ended, auto-restore health and deal damage
                        let dmg = this.recordedDamage;
                        this.recordedDamage = 0;
                        this.hologramActive = false;
                        this.basicSpeedMult = 1;
                        this.tauntedEnemies.clear();
                        this.hp = this.preHologramHp; // Restore to pre-hologram health
                        
                        // Auto deal damage to nearby enemies
                        for(let e of entities) {
                            if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                                if(d < 500) {
                                    e.takeDamage(dmg, this);
                                    e.revealTimer = 1.0;
                                }
                            }
                        }
                        if(this.isPlayer) addKillMsg(`Hologram Ended! Auto Damage: ${dmg}!`);
                    }
                } else {
                    this.tauntedEnemies.clear();
                }
                
                // Update Aura - follow Buster
                if(this.auraActive) {
                    this.auraTimer -= dt;
                    // Aura follows Buster's position
                    this.auraX = this.x;
                    this.auraY = this.y;
                    if(this.auraTimer <= 0) {
                        this.auraActive = false;
                        this.damageAmp = 1;
                    }
                    // Deal 80 damage per second to enemies in aura and slow them
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.auraX, dy = e.y - this.auraY, d = Math.sqrt(dx*dx + dy*dy);
                            if(d < 250) {
                                e.takeDamage(80 * dt, this);
                                e.slowTimer = Math.max(e.slowTimer, 0.1);
                            }
                        }
                    }
                }
                
                // Update damage reduction from ultimate
                if(this.damageReductionActive) {
                    this.damageReductionTimer -= dt;
                    if(this.damageReductionTimer <= 0) {
                        this.damageReductionActive = false;
                        this.reflectedDamage = 0;
                    }
                }
                
                // Update Shield
                if(this.shieldActive) {
                    this.shieldTimer -= dt;
                    if(this.shieldTimer <= 0) {
                        this.shieldActive = false;
                        this.shieldEntities.clear();
                        this.reflectedDamage = 0;
                    }
                }
                
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                this.angle = getMouseAimAngle(this.x, this.y);
                
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(keys.q && this.qCD <= 0) this.doQ();
                if(keys.e && this.eCD <= 0) this.doE();
                if(keys.f && this.fCD <= 0) this.doF();
                if(keys.g && this.gCD <= 0) this.doG();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 1.5;
                let dmg = 50 * this.damageAmp;
                let hitEnemies = new Set();
                
                // Fire 5 light shots
                for(let i = 0; i < 5; i++) {
                    let angle = this.angle + (i - 2) * 0.2;
                    let proj = new Projectile(this, this.x, this.y, angle, 600, dmg, 300, '#87CEEB', 6);
                    proj.pierce = true;
                    proj.hitEnemies = hitEnemies;
                    proj.maxDistance = 300;
                    // If E aura is active, add true damage
                    if(this.auraActive) {
                        proj.trueDamage = 40;
                        // Only record damage if aura is active
                        if(this.hologramActive) {
                            this.recordedDamage += dmg + 40;
                        }
                    } else {
                        // Only record basic attack damage without aura
                        if(this.hologramActive) {
                            this.recordedDamage += dmg;
                        }
                    }
                    entities.push(proj);
                }
                
                // Reduce Q/E/F cooldowns by 0.5s per hit
                this.qCD = Math.max(0, this.qCD - 0.5);
                this.eCD = Math.max(0, this.eCD - 0.5);
                this.fCD = Math.max(0, this.fCD - 0.5);
            }
            
            doQ() {
                if(this.hologramActive) {
                    // Just deactivate, G key will trigger damage burst
                    this.hologramActive = false;
                    this.basicSpeedMult = 1;
                } else {
                    // Activate hologram
                    this.qCD = 8;
                    this.preHologramHp = this.hp;
                    this.hologramActive = true;
                    this.hologramTimer = 7;
                    this.recordedDamage = 0;
                    this.basicSpeedMult = 2;
                    if(this.isPlayer) addKillMsg('Hologram Activated!');
                }
            }
            
            doE() {
                this.eCD = 12;
                this.auraActive = true;
                this.auraTimer = 5;
                this.damageAmp = 1.5;
                this.revealTimer = 0.5;
                
                // Dash forward
                this.x += Math.cos(this.angle) * 250;
                this.y += Math.sin(this.angle) * 250;
                
                // Initialize aura position at current location
                this.auraX = this.x;
                this.auraY = this.y;
                
                // Add triangle aura particles
                for(let i = 0; i < 12; i++) {
                    let angle = (i / 12) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*150, this.y + Math.sin(angle)*150, '#87CEEB', 5, 0.3));
                }
                
                if(this.isPlayer) addKillMsg('Triangle Aura! 80 dmg/sec!');
            }
            
            doF() {
                this.fCD = 15;
                this.shieldActive = true;
                this.shieldTimer = 3;
                this.damageReductionActive = true;
                this.damageReductionTimer = 3;
                
                // Push away enemies in front
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let ad = Math.atan2(dy, dx);
                        let da = Math.abs(ad - this.angle);
                        if(da > Math.PI) da = 2*Math.PI - da;
                        
                        if(da < Math.PI/3 && dist < 300) {
                            let push = 200;
                            e.x += Math.cos(ad) * push;
                            e.y += Math.sin(ad) * push;
                            e.revealTimer = 1.0;
                        }
                    }
                }
                
                // Add shield particles
                for(let i = 0; i < 20; i++) {
                    particles.push(new Particle(this.x + Math.cos(this.angle + (Math.random()-0.5)*1)*200, 
                                               this.y + Math.sin(this.angle + (Math.random()-0.5)*1)*200, '#1e90ff', 6, 0.5));
                }
                
                this.revealTimer = 0.5;
                if(this.isPlayer) addKillMsg('Deflection Shield! 30% Damage Reduction!');
            }
            
            doG() {
                if(this.hologramActive) {
                    // Trigger recorded damage burst
                    let dmg = this.recordedDamage;
                    this.recordedDamage = 0;
                    this.hologramActive = false;
                    this.basicSpeedMult = 1;
                    this.hp = this.preHologramHp; // Restore health
                    
                    // Deal recorded damage to nearby enemies
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                            if(d < 500) {
                                e.takeDamage(dmg, this);
                                e.revealTimer = 1.0;
                            }
                        }
                    }
                    if(this.isPlayer) addKillMsg(`Recorded Damage Burst: ${dmg}!`);
                }
            }
            
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if(d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAtk();
                    if(this.qCD <= 0 && Math.random() < 0.1) this.doQ();
                    if(this.eCD <= 0 && Math.random() < 0.05) this.doE();
                    if(this.fCD <= 0 && Math.random() < 0.08) this.doF();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < md) {
                            md = d;
                            c = e;
                        }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            takeDamage(dmg, attacker) {
                // Apply 30% damage reduction when ultimate is active
                if(this.damageReductionActive) {
                    let reducedDmg = dmg * 0.7; // 30% reduction = 70% damage taken
                    let reflectionDmg = dmg * 0.5; // Reflect 50% of the blocked damage
                    this.reflectedDamage += reflectionDmg;
                    // Reflect damage back to attacker
                    if(attacker && !attacker.dead) {
                        attacker.takeDamage(reflectionDmg, this);
                    }
                    dmg = reducedDmg;
                }
                super.takeDamage(dmg, attacker);
            }
            
            getDamageMult() {
                return 1;
            }
            
            getEffectiveSpeed() {
                let s = this.speed;
                if(this.basicSpeedMult > 1) s *= this.basicSpeedMult;
                return s;
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            draw(ctx) {
                super.draw(ctx);
                if(this.hologramActive) {
                    ctx.strokeStyle = '#87CEEB';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 15, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                if(this.auraActive) {
                    // Draw rotating triangle aura at moving position
                    ctx.strokeStyle = '#87CEEB';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.7;
                    let screenX = this.auraX - camera.x;
                    let screenY = this.auraY - camera.y;
                    let radius = 150;
                    
                    // Draw 3 triangles rotating
                    for(let t = 0; t < 3; t++) {
                        ctx.beginPath();
                        let angle = (this.auraTimer * 3) + (t * Math.PI * 2 / 3);
                        for(let i = 0; i < 3; i++) {
                            let x = screenX + Math.cos(angle + (i * Math.PI * 2 / 3)) * radius;
                            let y = screenY + Math.sin(angle + (i * Math.PI * 2 / 3)) * radius;
                            if(i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                    ctx.globalAlpha = 1;
                }
                if(this.shieldActive) {
                    // Draw deflection shield in front
                    ctx.fillStyle = '#1e90ff';
                    ctx.globalAlpha = 0.4;
                    let screenX = this.x - camera.x;
                    let screenY = this.y - camera.y;
                    let shieldWidth = 100;
                    let shieldHeight = 180;
                    
                    // Rotate shield to face direction, positioned more in front
                    ctx.save();
                    ctx.translate(screenX, screenY);
                    ctx.rotate(this.angle);
                    ctx.fillRect(50, -shieldHeight/2, shieldWidth, shieldHeight);
                    ctx.restore();
                    
                    ctx.strokeStyle = '#1e90ff';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.8;
                    ctx.save();
                    ctx.translate(screenX, screenY);
                    ctx.rotate(this.angle);
                    ctx.strokeRect(0, -shieldHeight/2, shieldWidth, shieldHeight);
                    ctx.restore();
                    ctx.globalAlpha = 1;
                }
            }
            
            getDamageMult() {
                return 1;
            }
            
            getEffectiveSpeed() {
                return this.speed;
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class MeltLavaPedal extends Entity {
            constructor(x, y, owner = null) {
                super(x, y, 75, '#ff6b1a', 1); this.countsAsFFAHero = false;
                this.createTime = Date.now();
                this.damageCD = 0;
                this.owner = owner; // Store owner reference to exclude from damage
            }
            update(dt) {
                let elapsed = (Date.now() - this.createTime) / 1000;
                if(elapsed >= 5) {
                    this.dead = true;
                    return;
                }
                this.damageCD -= dt;
                // Deal damage every 0.1s to nearby enemies (exclude owner)
                if(this.damageCD <= 0) {
                    this.damageCD = 0.1;
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.owner?.team && e !== this.owner) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if(d < 60) {
                                e.takeDamage(35, this.owner || null);
                            }
                        }
                    }
                }
            }
            draw(ctx) {
                ctx.fillStyle = '#ff6b1a';
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 75, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        class Melvin extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#ff6b1a' : '#cc5500', 6000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Melvin)" : "Enemy Melvin";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 220;
                this.speed = this.baseSpd;
                this.pedals = [];
                
                // E ability - 2 charges with shared cooldown (Don's system)
                this.eCharges = 2;
                this.eChargeCD = 0;
                
                // F ability - trap
                this.trapActive = false;
                this.trapTimer = 0;
                this.trappedEnemy = null;
                this.meltdownDamage = 0;
                this.trappedEnemyX = 0;
                this.trappedEnemyY = 0;
                this.terrifedTimer = 0;
                
                // Q ability - continuous shooting
                this.qActive = false;
                this.qTimer = 0;
                this.qFireRate = 0.15; // Shoot every 0.15s
            }
            
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                
                // Regenerate charges (Don's system)
                if(this.eChargeCD > 0) this.eChargeCD -= dt;
                if(this.eChargeCD <= 0 && this.eCharges < 2) {
                    this.eCharges++;
                    if(this.eCharges < 2) this.eChargeCD = 4;
                }

                if(this.trapActive && (this.stunTimer > 0 || this.freezeTimer > 0 || this.terrifedTimer > 0)) {
                    this.trapActive = false;
                    this.trapTimer = 0;
                    this.trappedEnemy = null;
                    this.revealTimer = 0.4;
                }
                
                // Update trap - deal instant damage when trap ends and force enemy position
                if(this.trapActive && this.trappedEnemy && !this.trappedEnemy.dead) {
                    this.trapTimer -= dt;
                    // Force trapped enemy back to trap location (disable movement)
                    this.trappedEnemy.x = this.trappedEnemyX;
                    this.trappedEnemy.y = this.trappedEnemyY;
                    if(this.trapTimer <= 0) {
                        // Deal total meltdown damage instantly (1200 total)
                        this.trappedEnemy.takeDamage(1200, this);
                        this.trapActive = false;
                        this.trappedEnemy = null;
                    }
                } else if(this.trapActive) {
                    this.trapActive = false;
                    this.trappedEnemy = null;
                }
                
                // Update Q - continuous lava shooting
                if(this.qActive) {
                    this.qTimer += dt;
                    // Fire every 0.15 seconds
                    let fireInterval = Math.floor(this.qTimer / this.qFireRate);
                    let lastFireInterval = Math.floor((this.qTimer - dt) / this.qFireRate);
                    if(fireInterval > lastFireInterval) {
                        // Shoot one lava with slight spread
                        let spreadAngle = (Math.random() - 0.5) * 0.4; // Random spread ±0.2 radians
                        let angle = this.angle + spreadAngle;
                        let proj = new Projectile(this, this.x, this.y, angle, 500, 0, 350, '#ff6b1a', 12);
                        proj.maxDistance = 350;
                        proj.melvinQ = true;
                        proj.onHit = (target) => {
                            this.pedals.push({x: target.x, y: target.y, createTime: Date.now(), damageCD: 0});
                            target.slowTimer = Math.max(target.slowTimer, 0.5);
                        };
                        entities.push(proj);
                    }
                    // Stop after 1.5 seconds
                    if(this.qTimer >= 1.5) {
                        this.qActive = false;
                        this.qTimer = 0;
                    }
                }
                
                // Update pedals - remove expired ones and deal damage
                let now = Date.now();
                this.pedals = this.pedals.filter(p => (now - p.createTime) < 5000);
                
                // Find closest pedal for healing (only 1 pedal heals at a time)
                let closestPedal = null;
                let closestDist = 90;
                for(let p of this.pedals) {
                    let d = Math.sqrt((p.x - this.x)**2 + (p.y - this.y)**2);
                    if(d < closestDist) {
                        closestDist = d;
                        closestPedal = p;
                    }
                }
                
                for(let p of this.pedals) {
                    p.damageCD -= dt;
                    if(p.damageCD <= 0) {
                        p.damageCD = 0.1;
                        for(let e of entities) {
                            if(!e.dead && e instanceof Entity && e.team !== this.team && e !== this) {
                                let d = Math.sqrt((e.x - p.x)**2 + (e.y - p.y)**2);
                                if(d < 60) {
                                    e.takeDamage(35, this);
                                }
                            }
                        }
                    }
                }
                
                // Heal Melvin from closest pedal only (15 health per 0.1s)
                if(closestPedal) {
                    if(!this.healTimer) this.healTimer = 0;
                    this.healTimer += dt;
                    if(this.healTimer >= 0.1) {
                        this.hp = Math.min(this.hp + 15, this.maxHp);
                        this.healTimer = 0;
                    }
                }
                
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                this.angle = getMouseAimAngle(this.x, this.y);
                
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(keys.q && this.qCD <= 0 && !this.qActive) this.doQ();
                if(keys.e && this.eCD <= 0 && this.eCharges > 0) this.doE();
                if(keys.f && this.fCD <= 0) this.doF();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.4;
                this.basicCD = 1;
                
                // Throw small lava that applies burn to HIT enemies only
                let proj = new Projectile(this, this.x, this.y, this.angle, 500, 50, 350, '#ff6b1a', 5);
                proj.maxDistance = 350;
                proj.melvinBasic = true; // Mark as basic for burn application
                entities.push(proj);
            }
            
            doQ() {
                if(this.qActive) return; // Prevent restarting while already active
                this.qCD = 10;
                this.qActive = true;
                this.qTimer = 0;
                // Will fire continuously for ~1.5 seconds
            }
            
            doE() {
                if (this.eCharges <= 0 || this.eCD > 0) return;
                this.eCharges--;
                if(this.eCharges == 1) this.eChargeCD = 4;
                this.eCD = 0.5;
                
                // Dash forward 200 units and leave lava pedal
                this.x += Math.cos(this.angle) * 200;
                this.y += Math.sin(this.angle) * 200;
                
                this.pedals.push({x: this.x, y: this.y, createTime: Date.now(), damageCD: 0});
                
                // Stun nearby enemies 0.5s
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < 250) {
                            e.applyStatus('stun', 0.5, this);
                        }
                    }
                }
                
                this.revealTimer = 0.4;
            }
            
            doF() {
                this.fCD = 15;
                
                // Find closest enemy within 750 range (excluding self)
                let closest = null, closestDist = 750;
                for(let e of entities) {
                    // Prevent self-trapping: check both by reference AND team
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && !(e instanceof Melvin && e.isPlayer === this.isPlayer)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < closestDist) {
                            closest = e;
                            closestDist = d;
                        }
                    }
                }
                
                if(closest) {
                    this.trapActive = true;
                    this.trapTimer = 2;
                    this.trappedEnemy = closest;
                    this.trappedEnemyX = closest.x;
                    this.trappedEnemyY = closest.y;
                    // Deal 500 base damage immediately
                    closest.takeDamage(500, this);
                    this.meltdownDamage = 0;
                    this.revealTimer = 0.5;
                    if(this.isPlayer) addKillMsg('Trapped ' + closest.name + '! Meltdown damage incoming!');
                }
            }
            
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if(d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAtk();
                    if(this.qCD <= 0 && Math.random() < 0.1) this.doQ();
                    if(this.eCharges > 0 && this.eCD <= 0 && Math.random() < 0.05) this.doE();
                    if(this.fCD <= 0 && Math.random() < 0.08) this.doF();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < md) {
                            md = d;
                            c = e;
                        }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            getDamageMult() {
                return 1;
            }
            
            getEffectiveSpeed() {
                return this.speed;
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                // Draw lava pedals
                for(let p of this.pedals) {
                    ctx.fillStyle = '#ff6b1a';
                    ctx.globalAlpha = 0.6;
                    ctx.beginPath();
                    ctx.arc(p.x - camera.x, p.y - camera.y, 75, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                
                if(this.trapActive && this.trappedEnemy && !this.trappedEnemy.dead) {
                    // Draw link line to trapped enemy
                    ctx.strokeStyle = '#ff6b1a';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.7;
                    ctx.beginPath();
                    ctx.moveTo(this.x - camera.x, this.y - camera.y);
                    ctx.lineTo(this.trappedEnemy.x - camera.x, this.trappedEnemy.y - camera.y);
                    ctx.stroke();
                    // Draw ring around self
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 30, 0, Math.PI * 2);
                    ctx.stroke();
                    // Draw ring around trapped enemy
                    ctx.beginPath();
                    ctx.arc(this.trappedEnemy.x - camera.x, this.trappedEnemy.y - camera.y, this.trappedEnemy.radius + 30, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }
        }

        class Ren extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#e74c3c' : '#c0392b', 5300);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Ren)" : "Enemy Ren";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.baseSpd = 260;
                this.speed = this.baseSpd;
                
                // Passive: 5 basic attacks convert to one enhanced attack
                this.basicAttackCount = 0;
                
                // Mark from ultimate
                this.markedEnemies = [];
                this.markTimer = 0;
                
                // Heal effect tracking
                this.healActive = false;
                this.healTimer = 0;
                this.healDuration = 5;
                this.damageIncoming = 0;
            }
            
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                
                // Track mark timer
                if(this.markTimer > 0) {
                    this.markTimer -= dt;
                    if(this.markTimer <= 0) {
                        this.markedEnemies = [];
                    }
                }
                
                // Track heal active state
                if(this.healActive) {
                    this.healTimer -= dt;
                    if(this.healTimer <= 0) {
                        this.healActive = false;
                        this.damageIncoming = 0;
                    }
                }
                
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                this.angle = getMouseAimAngle(this.x, this.y);
                
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(keys.q && this.qCD <= 0) this.doQ();
                if(keys.e && this.eCD <= 0) this.doE();
                if(keys.f && this.fCD <= 0) this.doF();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.6;
                this.basicAttackCount++;
                
                let dmg = 80;
                let proj = new Projectile(this, this.x, this.y, this.angle + (Math.random()-0.5)*0.1, 600, dmg, 400, '#e74c3c', 4);
                proj.maxDistance = 400;
                entities.push(proj);
                
                // Check if 5 attacks reached - trigger enhanced attack
                if(this.basicAttackCount >= 5) {
                    this.basicAttackCount = 0;
                    // Trigger enhanced attack
                    this.doEnhancedAttack();
                }
            }
            
            doEnhancedAttack() {
                this.revealTimer = 0.5;
                let dmg = 400;
                let proj = new Projectile(this, this.x, this.y, this.angle, 700, dmg, 500, '#fff000', 8);
                proj.maxDistance = 500;
                entities.push(proj);
                
                // Stun nearby enemies hit
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                        if(d < 500) {
                            let ad = Math.atan2(dy, dx);
                            let da = Math.abs(ad - this.angle);
                            if(da > Math.PI) da = 2*Math.PI - da;
                            if(da < 0.3) {
                                e.applyStatus('stun', 0.5, this);
                                e.revealTimer = 1.0;
                            }
                        }
                    }
                }
                
                if(this.isPlayer) addKillMsg('Enhanced Card Attack! Stun!');
            }
            
            doQ() {
                this.qCD = 5;
                this.revealTimer = 0.5;
                
                // Throw 10 cards in spread pattern
                for(let i = 0; i < 10; i++) {
                    let angle = this.angle + (i - 4.5) * 0.12;
                    let proj = new Projectile(this, this.x, this.y, angle, 650, 280, 500, '#e74c3c', 5);
                    proj.maxDistance = 500;
                    entities.push(proj);
                }
                
                if(this.isPlayer) addKillMsg('Card Barrage! 10 Cards!');
            }
            
            doE() {
                this.eCD = 10;
                this.revealTimer = 0.5;
                
                // Dash forward
                let dashDist = 200;
                this.x += Math.cos(this.angle) * dashDist;
                this.y += Math.sin(this.angle) * dashDist;
                
                // Stun enemies in radius
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y, d = Math.sqrt(dx*dx + dy*dy);
                        if(d < 300) {
                            e.applyStatus('stun', 0.5, this);
                            e.revealTimer = 1.0;
                        }
                    }
                }
                
                // Activate 5-second heal
                this.healActive = true;
                this.healTimer = 5;
                this.damageIncoming = 0;
                
                // Add dash effect particles
                for(let i = 0; i < 15; i++) {
                    particles.push(new Particle(this.x, this.y, '#e74c3c', 4, 0.6));
                }
                
                if(this.isPlayer) addKillMsg('Dash + Stun! 40% Heal Active!');
            }
            
            doF() {
                this.fCD = 18;
                this.revealTimer = 0.5;
                
                // Throw massive card that knocks back and marks
                let proj = new Projectile(this, this.x, this.y, this.angle, 700, 600, 800, '#fff000', 15);
                proj.maxDistance = 800;
                
                // Mark enemies hit by ultimate
                proj.onHit = (target) => {
                    if(!this.markedEnemies.includes(target)) {
                        this.markedEnemies.push(target);
                    }
                    this.markTimer = 10;
                    // Apply knockback
                    let dx = target.x - this.x, dy = target.y - this.y;
                    let d = Math.sqrt(dx*dx + dy*dy);
                    if(d > 0) {
                        target.x += (dx/d) * 200;
                        target.y += (dy/d) * 200;
                    }
                    target.revealTimer = 1.0;
                };
                
                entities.push(proj);
                
                // Add ultimate particles
                for(let i = 0; i < 20; i++) {
                    let angle = (i / 20) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*150, this.y + Math.sin(angle)*150, '#fff000', 6, 0.8));
                }
                
                if(this.isPlayer) addKillMsg('Ultimate Card! Knockback + Mark! 20% True Damage!');
            }
            
            takeDamage(dmg, attacker) {
                // Apply 20% more damage to marked enemies when attacked by Ren
                if(attacker && attacker instanceof Ren && attacker.markedEnemies.includes(this)) {
                    dmg *= 1.2; // 20% more damage to marked enemies
                }
                
                super.takeDamage(dmg, attacker);
            }
            
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if(d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAtk();
                    if(this.qCD <= 0 && Math.random() < 0.1) this.doQ();
                    if(this.eCD <= 0 && Math.random() < 0.08) this.doE();
                    if(this.fCD <= 0 && Math.random() < 0.05) this.doF();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < md) {
                            md = d;
                            c = e;
                        }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                // Draw magic hat on marked enemies
                for(let e of this.markedEnemies) {
                    if(!e.dead) {
                        ctx.save();
                        ctx.font = 'bold 28px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - e.radius - 15;
                        ctx.fillText('🎩', screenX, screenY);
                        ctx.restore();
                    }
                }
            }
            
            getDamageMult() {
                return 1;
            }
            
            getEffectiveSpeed() {
                return this.speed;
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Chimera extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#a335ee' : '#6b1fa8', 7000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Chimera)" : "Enemy Chimera";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0;
                this.baseSpd = 240;
                this.speed = this.baseSpd;
                // Chimera mode
                this.chimeraMode = false;
                this.gKeyPressed = false;
                this.qKeyPressed = false;
                this.eKeyPressed = false;
                this.copiedQFunc = null;
                this.copiedEFunc = null;
                this.copiedEnemyRef = null;
                this.copiedEnemyName = null;
                this.copiedQCooldown = 0;
                this.copiedECooldown = 0;
                // Copied buffs
                this.drinkBuff = false;
                this.drinkTimer = 0;
                this.enhancedBasic = false;
                this.enhancedBasicTimer = 0;
                this.speedBuff = false;
                this.speedBuffTimer = 0;
                this.damageBuff = false;
                this.damageBuffTimer = 0;
                this.empMode = false;
                this.empTimer = 0;
                // Tornado (Q)
                this.tornadoActive = false;
                this.tornadoX = 0; this.tornadoY = 0;
                this.tornadoVelX = 0; this.tornadoVelY = 0;
                this.tornadoTimer = 0;
                this.tornadoDuration = 4;
                // Dash (E)
                this.dashing = false;
                this.dashT = 0;
                this.dashDir = 0;
                this.dashHitEnemies = new Set();
                // Subject mark
                this.markedEnemies = new Map(); // enemy -> timestamp
                // Heal conversion
                this.damageIncoming = 0;
                this.healCooldown = 0;
                // Chimera burst link
                this.linkedEnemies = new Set();
                this.linkTimer = 0;
                this.basicAttackCounter = 0; // count basic attacks for enhanced ranged proc
            }
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.gCD > 0) this.gCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                if(this.healCooldown > 0) this.healCooldown -= dt;
                // Tornado update
                if(this.tornadoActive) {
                    this.tornadoTimer -= dt;
                    // Move tornado away from Chimera
                    this.tornadoX += this.tornadoVelX * dt;
                    this.tornadoY += this.tornadoVelY * dt;
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = this.tornadoX - e.x, dy = this.tornadoY - e.y;
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if(d < 150) {
                                // Damage and pull effect
                                e.takeDamage(Math.ceil(45 * dt * 10), this); // 45 damage per 0.1s = 450 per second
                                let pullForce = 400; // Strong pull towards tornado
                                e.x += (dx/d) * pullForce * dt;
                                e.y += (dy/d) * pullForce * dt;
                                for(let i = 0; i < 2; i++) particles.push(new Particle(e.x, e.y, '#a335ee', 2, 0.3));
                            }
                        }
                    }
                    if(this.tornadoTimer <= 0) this.tornadoActive = false;
                }
                // Dash update
                if(this.dashing) {
                    this.dashT -= dt;
                    this.x += Math.cos(this.dashDir) * 1200 * dt;
                    this.y += Math.sin(this.dashDir) * 1200 * dt;
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2) < 50 && !this.dashHitEnemies.has(e)) {
                            e.takeDamage(300, this);
                            this.dashHitEnemies.add(e);
                            this.markedEnemies.set(e, 3); // Mark for 3 seconds
                            for(let i = 0; i < 5; i++) particles.push(new Particle(e.x, e.y, '#a335ee', 3, 0.5));
                        }
                    }
                    if(this.dashT <= 0) {
                        this.dashing = false;
                        this.dashHitEnemies.clear();
                    }
                }
                // Support other heroes' dash state naming (this.dash + this.dd vector + this.dh array)
                if(this.dash) {
                    // Some copied dashes set `this.dash` and use `this.dd` vector and `this.dh` array for hit tracking
                    this.dashT -= dt;
                    if(this.dd) {
                        this.x += (this.dd.x || 0) * 1000 * dt;
                        this.y += (this.dd.y || 0) * 1000 * dt;
                    }
                    this.dh = this.dh || [];
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && !this.dh.includes(e)) {
                            if(Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2) < (this.radius + (e.radius||0) + 10)) {
                                this.dh.push(e);
                                try { e.takeDamage(300, this); } catch(_){}
                                for(let i = 0; i < 5; i++) particles.push(new Particle(e.x, e.y, '#a335ee', 3, 0.5));
                            }
                        }
                    }
                    if(this.dashT <= 0) {
                        this.dash = false;
                        this.dh = [];
                    }
                }
                // Link update
                for(let e of this.linkedEnemies) {
                    if(e.dead) this.linkedEnemies.delete(e);
                    // Check for execute during link duration
                    else if(e.hp < e.maxHp * 0.07) {
                        e.hp = 0;
                        e.die(this);
                        this.linkedEnemies.delete(e);
                    }
                }
                if(this.linkedEnemies.size > 0) {
                    this.linkTimer -= dt;
                    if(this.linkTimer <= 0) this.linkedEnemies.clear();
                }
                // Update marked enemies
                for(let [e, timer] of this.markedEnemies) {
                    let newTimer = timer - dt;
                    if(newTimer <= 0) this.markedEnemies.delete(e);
                    else this.markedEnemies.set(e, newTimer);
                }
                if(this.stunTimer > 0) { if(this.isPlayer) updateHUD(this); return; }
                // Update copied buffs
                if(this.drinkBuff) {
                    this.drinkTimer -= dt;
                    if(this.drinkTimer <= 0) this.drinkBuff = false;
                }
                if(this.enhancedBasic) {
                    this.enhancedBasicTimer -= dt;
                    if(this.enhancedBasicTimer <= 0) this.enhancedBasic = false;
                }
                if(this.speedBuff) {
                    this.speedBuffTimer -= dt;
                    if(this.speedBuffTimer <= 0) this.speedBuff = false;
                }
                if(this.damageBuff) {
                    this.damageBuffTimer -= dt;
                    if(this.damageBuffTimer <= 0) this.damageBuff = false;
                }
                if(this.empMode) {
                    this.empTimer -= dt;
                    if(this.empTimer <= 0) this.empMode = false;
                }
                let spd = this.getEffectiveSpeed();
                if(this.drinkBuff) spd *= 1.5; // Speed boost from drink buff
                if(this.speedBuff) spd *= 1.5; // Speed boost from other buffs
                if(this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            input(dt, spd) {
                if(this.dashing) return;
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx||dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd*dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(this.chimeraMode) {
                    // Live update check: if enemy ref is dead or doesn't exist, auto-refresh
                    if(!this.copiedEnemyRef || this.copiedEnemyRef.dead) {
                        this.refreshCopiedAbilities();
                    }
                    
                    if(keys.q && this.qCD <= 0 && this.copiedQFunc && !this.qKeyPressed) {
                        this.copiedQFunc();
                        this.qCD = this.copiedQCooldown;
                        this.qKeyPressed = true;
                        // Apply buffs based on copied ability used
                        this.applyBuffsFromCopiedAbility('q');
                        if(this.isPlayer) {
                            addKillMsg(`Used copied Q from ${this.copiedEnemyName}!`);
                        }
                    }
                    if(!keys.q) this.qKeyPressed = false;
                    if(keys.e && this.eCD <= 0 && this.copiedEFunc && !this.eKeyPressed) {
                        this.copiedEFunc();
                        this.eCD = this.copiedECooldown;
                        this.eKeyPressed = true;
                        // Apply buffs based on copied ability used
                        this.applyBuffsFromCopiedAbility('e');
                        if(this.isPlayer) {
                            addKillMsg(`Used copied E from ${this.copiedEnemyName}!`);
                        }
                    }
                    if(!keys.e) this.eKeyPressed = false;
                } else {
                    if(keys.q && this.qCD <= 0) this.doTornado();
                    if(keys.e && this.eCD <= 0) this.doDash();
                }
                if(keys.f && this.fCD <= 0) this.chimmeraBurst();
                if(keys.g && this.gCD <= 0 && !this.gKeyPressed) {
                    this.toggleChimeraMode();
                    this.gKeyPressed = true;
                }
                if(!keys.g) this.gKeyPressed = false;
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.65;
                particles.push(new Slash(this.x, this.y, this.angle, 140, Math.PI/2, '#a335ee'));
                let baseDamage = 120;
                let dmg = baseDamage;
                if(this.enhancedBasic) dmg = baseDamage * 3; // 300% damage when enhanced
                if(this.damageBuff) dmg = baseDamage * 1.3; // 130% damage from damage buff
                if(this.enhancedBasic && this.damageBuff) dmg = baseDamage * 3.9; // Stack both buffs
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2) < 140) {
                        let ad = Math.abs(Math.atan2(e.y-this.y, e.x-this.x) - this.angle);
                        if(ad > Math.PI) ad = 2*Math.PI - ad;
                        if(ad < Math.PI/3) {
                            e.takeDamage(dmg, this);
                            this.damageIncoming += dmg * 0.25; // Heal based on damage dealt
                        }
                    }
                }
                // track basic attacks and fire enhanced ranged attack every 3 hits
                this.basicAttackCounter = (this.basicAttackCounter || 0) + 1;
                if (this.basicAttackCounter >= 3) {
                    this.basicAttackCounter = 0;
                    // spawn a ranged enhanced attack that deals 520 damage and slows 1s
                    let px = this.x + Math.cos(this.angle) * (this.radius + 8);
                    let py = this.y + Math.sin(this.angle) * (this.radius + 8);
                    let enhancedProj = new Projectile(this, px, py, this.angle, 900, 520, 900, '#ff88ff', 8, false, false, false, 0, 0, false, 1);
                    enhancedProj.onHit = (enemy) => { try { for(let i=0;i<6;i++) particles.push(new Particle(enemy.x, enemy.y, '#ffb3ff', 3, 0.5)); } catch(_){} };
                    entities.push(enhancedProj);
                    if (this.isPlayer) addKillMsg('Chimera enhanced shot!');
                }
            }
            doTornado() {
                this.qCD = 11;
                this.tornadoActive = true;
                this.tornadoTimer = 4;
                this.tornadoX = this.x + Math.cos(this.angle) * 300;
                this.tornadoY = this.y + Math.sin(this.angle) * 300;
                // Set velocity to move away from Chimera
                this.tornadoVelX = Math.cos(this.angle) * 200;
                this.tornadoVelY = Math.sin(this.angle) * 200;
                for(let i = 0; i < 20; i++) particles.push(new Particle(this.tornadoX + (Math.random()-0.5)*100, this.tornadoY + (Math.random()-0.5)*100, '#a335ee', 4, 1));
            }
            doDash() {
                this.eCD = 4;
                this.dashing = true;
                this.dashT = 0.25;
                this.dashDir = this.angle - Math.PI/4; // 45 degrees left
                this.dashHitEnemies.clear();
                for(let i = 0; i < 10; i++) particles.push(new Particle(this.x, this.y, '#a335ee', 3, 0.5));
                // Schedule second dash
                setTimeout(()=>{
                    if(!this.dead) {
                        this.dashDir = this.dashDir + Math.PI/2; // 90 degrees right from first
                        this.dashT = 0.25;
                        this.dashing = true;
                        this.dashHitEnemies.clear();
                    }
                }, 100);
            }
            chimmeraBurst() {
                this.fCD = 13;
                this.linkTimer = 7;
                // Long narrow sector
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let d = Math.sqrt(dx*dx + dy*dy);
                        let ad = Math.abs(Math.atan2(dy, dx) - this.angle);
                        while(ad > Math.PI) ad = 2*Math.PI - ad;
                        if(d < 800 && ad < Math.PI/12) { // Very narrow sector
                            e.takeDamage(1500, this);
                            this.linkedEnemies.add(e);
                            // Check for instant execute
                            if(e.hp < e.maxHp * 0.07) {
                                e.hp = 0;
                                e.die(this);
                            }
                        }
                    }
                }
                for(let i = 0; i < 40; i++) particles.push(new Particle(this.x + Math.cos(this.angle)*i*30, this.y + Math.sin(this.angle)*i*30, '#ff00ff', 5, 1));
            }
            
            applyBuffsFromCopiedAbility(abilityKey) {
                if(!this.copiedEnemyRef) return;
                const enemy = this.copiedEnemyRef;
                
                // Get the copied ability method names dynamically
                let copiedAbilityName = null;
                if(abilityKey === 'q') {
                    copiedAbilityName = this.findAbilityByPosition(enemy, 'q');
                } else if(abilityKey === 'e') {
                    copiedAbilityName = this.findAbilityByPosition(enemy, 'e');
                }
                
                if(!copiedAbilityName) return;
                
                // Apply buffs based on known ability buff interactions
                // Q abilities with buffs
                if(copiedAbilityName === 'doDrink') {
                    this.drinkBuff = true;
                    this.drinkTimer = 5.0;
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 5.0;
                } else if(copiedAbilityName === 'energyBurst') {
                    this.damageBuff = true;
                    this.damageBuffTimer = 6.0;
                } else if(copiedAbilityName === 'doubleSwing') {
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 8.0;
                } else if(copiedAbilityName === 'voidFormAbility') {
                    this.damageBuff = true;
                    this.damageBuffTimer = 10.0;
                } else if(copiedAbilityName === 'lightCircle') {
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 4.0;
                } else if(copiedAbilityName === 'buildSentry') {
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 5.0;
                }
                // E abilities with buffs
                else if(copiedAbilityName === 'doOverclock') {
                    this.speedBuff = true;
                    this.speedBuffTimer = 5.0;
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 5.0;
                } else if(copiedAbilityName === 'groundSlam') {
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 6.0;
                } else if(copiedAbilityName === 'doFlurry') {
                    this.enhancedBasic = true;
                    this.enhancedBasicTimer = 5.0;
                } else if(copiedAbilityName === 'curvedDash') {
                    this.speedBuff = true;
                    this.speedBuffTimer = 5.0;
                } else if(copiedAbilityName === 'rocket') {
                    this.damageBuff = true;
                    this.damageBuffTimer = 8.0;
                } else if(copiedAbilityName === 'laser') {
                    this.damageBuff = true;
                    this.damageBuffTimer = 5.0;
                } else if(copiedAbilityName === 'inkPen') {
                    this.speedBuff = true;
                    this.speedBuffTimer = 2.0;
                }
            }
            
            takeDamage(amt, src) {
                super.takeDamage(amt, src);
                // Passive: 100 damage taken = 25 healing
                this.damageIncoming += amt;
                if(this.healCooldown <= 0 && this.damageIncoming >= 100) {
                    let healAmt = Math.floor(this.damageIncoming / 100) * 25;
                    this.hp = Math.min(this.maxHp, this.hp + healAmt);
                    this.damageIncoming = 0;
                    this.healCooldown = 4;
                }
            }
            toggleChimeraMode() {
                this.chimeraMode = !this.chimeraMode;
                this.gCD = 3;
                
                // When switching to chimera mode, copy abilities from nearby enemies (only once)
                if(this.chimeraMode) {
                    let nearestEnemy = null;
                    let minDist = 10000;
                    for(let e of entities) {
                        if(e === this || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                        // Prefer explicit hero flag or online proxy
                        let isExplicitHero = (e.countsAsFFAHero === true) || (typeof OnlinePlayerProxy !== 'undefined' && e instanceof OnlinePlayerProxy);
                        // If not explicitly non-hero, allow copying if the entity appears to have usable abilities
                        let isExplicitNonHero = (e.countsAsFFAHero === false);
                        let hasDetectableAbilities = false;
                        try { hasDetectableAbilities = !!this.findAbilityByPosition(e, 'q') || !!this.findAbilityByPosition(e, 'e'); } catch(_) { hasDetectableAbilities = false; }
                        if(isExplicitHero || (!isExplicitNonHero && hasDetectableAbilities)) {
                            let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                            if(d < minDist) { minDist = d; nearestEnemy = e; }
                        }
                    }
                    if(nearestEnemy) {
                        this.copiedEnemyRef = nearestEnemy;
                        this.copiedEnemyName = nearestEnemy.name || nearestEnemy.constructor.name;
                        
                        // Dynamically find Q ability (handle Chimera-to-Chimera copying)
                        this.copiedQFunc = null;
                        this.copiedQCooldown = 0;
                        let qAbility = null;
                        if(nearestEnemy instanceof Chimera && nearestEnemy.chimeraMode && nearestEnemy.copiedQFunc) {
                            // Copying from another Chimera in chimera mode - copy their copied ability
                            qAbility = 'copiedQFunc';
                            this.copiedQCooldown = nearestEnemy.copiedQCooldown || 8.0;
                        } else {
                            qAbility = this.findAbilityByPosition(nearestEnemy, 'q');
                            if(qAbility) {
                                this.copiedQCooldown = this.getAbilityCooldown(qAbility);
                            }
                        }
                        
                        if(qAbility) {
                            // Create wrapper that executes ability with proper context swapping
                            this.copiedQFunc = () => {
                                this.executeWrappedAbility(nearestEnemy, qAbility);
                            };
                        }
                        
                        // Dynamically find E ability (handle Chimera-to-Chimera copying)
                        this.copiedEFunc = null;
                        this.copiedECooldown = 0;
                        let eAbility = null;
                        if(nearestEnemy instanceof Chimera && nearestEnemy.chimeraMode && nearestEnemy.copiedEFunc) {
                            // Copying from another Chimera in chimera mode - copy their copied ability
                            eAbility = 'copiedEFunc';
                            this.copiedECooldown = nearestEnemy.copiedECooldown || 8.0;
                        } else {
                            eAbility = this.findAbilityByPosition(nearestEnemy, 'e');
                            if(eAbility) {
                                this.copiedECooldown = this.getAbilityCooldown(eAbility);
                            }
                        }
                        
                        if(eAbility) {
                            // Create wrapper that executes ability with proper context swapping
                            this.copiedEFunc = () => {
                                this.executeWrappedAbility(nearestEnemy, eAbility);
                            };
                        }
                        
                        // Reset all buffs - do NOT apply buffs on copy, they will be applied when abilities are used
                        this.drinkBuff = false;
                        this.enhancedBasic = false;
                        this.speedBuff = false;
                        this.damageBuff = false;
                        this.empMode = false;
                        // LightHero: rewind/spiral abilities enhance basic
                        if(nearestEnemy.lightCircle && typeof nearestEnemy.lightCircle === 'function') {
                            this.enhancedBasic = true;
                            this.enhancedBasicTimer = 4.0;
                        }
                        // Edgar: shadowForm gives enhanced basic
                        if(nearestEnemy.shadowForm && typeof nearestEnemy.shadowForm === 'function') {
                            this.enhancedBasic = true;
                            this.enhancedBasicTimer = 6.0;
                        }
                        // Glace: icebergActive gives slow + enhanced basic
                        if(nearestEnemy.basicAtk && nearestEnemy.icebergActive) {
                            this.damageBuff = true;
                            this.damageBuffTimer = 5.0;
                        }
                        
                        // Create visual feedback with particles
                        if(this.copiedQFunc || this.copiedEFunc) {
                            for(let i = 0; i < 30; i++) {
                                particles.push(new Particle(this.x, this.y, '#ff00ff', 5, 0.8));
                            }
                        }
                    }
                } else {
                    // When switching back to base mode, clear copied abilities
                    this.copiedQFunc = null;
                    this.copiedEFunc = null;
                    this.copiedEnemyName = null;
                    this.copiedEnemyRef = null;
                    if(this.isPlayer) {
                        addKillMsg(`Switched back to base mode!`);
                    }
                    this.copiedEnemyRef = null;
                }
            }
            
            executeWrappedAbility(enemy, abilityName) {
                // This method ensures the ability executes at Chimera's position with Chimera's direction
                const savedState = {};
                const chimera = this;
                
                // We avoid mutating the source enemy's positional/state properties
                // to prevent teleporting/moving the copied bot. Instead we call
                // the enemy's ability function with Chimera as `this`, so spawned
                // projectiles and effects are created from Chimera's context.
                
                // If abilityName is a function reference, call it directly with Chimera context
                try {
                    if(typeof abilityName === 'function') {
                        abilityName.call(this);
                        return;
                    }

                    // If enemy is Chimera and has copied abilities, try to call them
                    if(enemy instanceof Chimera && enemy.chimeraMode && (abilityName === 'copiedQFunc' || abilityName === 'copiedEFunc')) {
                        if(abilityName === 'copiedQFunc' && typeof enemy.copiedQFunc === 'function') {
                            enemy.copiedQFunc.call(this);
                            return;
                        } else if(abilityName === 'copiedEFunc' && typeof enemy.copiedEFunc === 'function') {
                            enemy.copiedEFunc.call(this);
                            return;
                        }
                    }

                    // Execute the ability with Chimera's context so it's executed as Chimera's ability
                    if(enemy && typeof enemy[abilityName] === 'function') {
                        enemy[abilityName].call(this);
                        return;
                    }
                } catch(e) {
                    console.error(`Error executing copied ability ${abilityName}:`, e);
                }
                
                // Transfer kills back to Chimera
                this.kills = enemy.kills;
                
                // No restoration needed since we did not mutate the enemy object
            }
            
            findAbilityByPosition(enemy, abilityType) {
                if(!enemy || !(enemy instanceof Entity)) return null;

                const qAbilities = ['doQ', 'impact', 'skill1', 'abilityQ', 'shadowDash', 'doKick', 'lightCircle', 'doDrink', 'sword', 'fireArrows', 'summonBlackhole', 'buildSentry', 'energyBurst', 'doubleSwing', 'voidFormAbility', 'doTornado', 'doDash', 'chargeSlam', 'createRoad', 'chargingSpin', 'knockBack', 'spinAttack', 'dashStrike', 'chargeAttack', 'throwSpear', 'rushAttack', 'jumpKick', 'spinSlash', 'thrustAttack', 'fireBlast', 'iceShot', 'lightningStrike', 'startBike', 'ability1', 'doDrink', 'doEmp', 'applyKick', 'shadowForm'];
                const eAbilities = ['doE', 'doDash', 'skill2', 'abilityE', 'knifeSwing', 'doFlurry', 'curvedDash', 'rocket', 'dashAttack', 'laser', 'nihilityform', 'doOverclock', 'inkPen', 'groundSlam', 'doG', 'sectorSlash', 'sectorBuilding', 'areaBlast', 'spinAttack', 'chargeShot', 'pullAttack', 'pushBack', 'whirlwind', 'sweepAttack', 'stabAttack', 'shockWave', 'fireWave', 'iceBlast', 'teleportStrike', 'placeDoodle', 'ability2', 'doEmp', 'doOverclock', 'startHeal', 'groundSlam'];

                const orderedNames = abilityType === 'q' ? qAbilities : eAbilities;
                for(let name of orderedNames) {
                    if(typeof enemy[name] === 'function') return name;
                }

                const exclusions = ['constructor', 'update', 'draw', 'input', 'ai', 'takeDamage', 'die', 'basicAtk', 'basicAttack', 'wander', 'findTarget', 'updateCommon', 'isVisibleTo', 'getEffectiveSpeed', 'useGear', 'handleSafeZone', 'applyBuffsFromCopiedAbility', 'getDamageMult', 'toggleChimeraMode', 'findAbilityByPosition', 'getAbilityCooldown', 'executeWrappedAbility', 'refreshCopiedAbilities', 'applySlowness', 'findNearestHealthCube', 'applyStatus'];
                const cooldownProp = abilityType === 'q' ? 'qCD' : 'eCD';

                const methods = [];
                const considered = new Set();
                const pushMethod = (key) => {
                    if(!key || exclusions.includes(key) || key.startsWith('_') || considered.has(key)) return;
                    considered.add(key);
                    let fn = enemy[key];
                    if(typeof fn === 'function') methods.push({ key, fn });
                };

                for(let key in enemy) pushMethod(key);
                let proto = Object.getPrototypeOf(enemy);
                while(proto && proto !== Object.prototype) {
                    for(let key of Object.getOwnPropertyNames(proto)) pushMethod(key);
                    proto = Object.getPrototypeOf(proto);
                }

                const parseMethodCalls = (fn) => {
                    try {
                        const src = fn.toString();
                        const patterns = [
                            /(if\s*\([^\)]*keys\.(q|e)[^\)]*\)\s*\.?\s*([A-Za-z_$][\w$]*)\s*\()/gi,
                            /(if\s*\([^\)]*(this\.(q|e)cd|qCD|eCD)[^\)]*\)\s*\.?\s*([A-Za-z_$][\w$]*)\s*\()/gi,
                            /(?:this\.|\b)([A-Za-z_$][\w$]*)\s*\(\s*\);?/g
                        ];

                        const found = new Set();
                        for(let pat of patterns) {
                            let m;
                            while((m = pat.exec(src)) !== null) {
                                let name = m[2] || m[4] || m[1];
                                if(name && !name.startsWith('if') && name !== 'Math' && name !== 'setTimeout' && name !== 'setInterval') found.add(name);
                            }
                        }
                        return Array.from(found);
                    } catch(_) {
                        return [];
                    }
                };

                let bestMatch = null;
                let bestScore = -Infinity;
                for(let {key, fn} of methods) {
                    const src = fn.toString();
                    const lower = src.toLowerCase();
                    const calls = parseMethodCalls(fn);
                    let score = 0;

                    if(lower.includes(cooldownProp)) score += 70;
                    if(lower.includes('keys.q') && abilityType === 'q') score += 50;
                    if(lower.includes('keys.e') && abilityType === 'e') score += 50;
                    if(lower.includes('this.qcd') && abilityType === 'q') score += 80;
                    if(lower.includes('this.ecd') && abilityType === 'e') score += 80;
                    if(lower.includes('projectile')) score += 18;
                    if(lower.includes('particles.push')) score += 12;
                    if(lower.includes('takeDamage')) score += 12;
                    if(lower.includes('this.angle')) score += 8;
                    if(calls.length) score += Math.min(calls.length * 8, 24);
                    if(key.includes('basic') || key.includes('fire') || key.includes('sword') || key.includes('stab') || key.includes('kick')) score -= 40;

                    if(score > bestScore) {
                        bestScore = score;
                        bestMatch = key;
                    }
                }

                if(bestMatch && bestScore > 0) return bestMatch;

                for(let name of orderedNames) {
                    if(typeof enemy[name] === 'function') return name;
                }
                return null;
            }
            
            getAbilityCooldown(abilityName) {
                const cooldownMap = {
                    'doQ': 5, 'impact': 10.0, 'skill1': 4.0, 'shadowDash': 8.0, 'doKick': 7.0, 'lightCircle': 4.0, 'doDrink': 12.0, 'sword': 6.0, 'fireArrows': 3.0, 'summonBlackhole': 10, 'buildSentry': 15.0, 'energyBurst': 6.0, 'doubleSwing': 8.0, 'voidFormAbility': 10.0, 'doTornado': 11.0,
                    'doE': 5, 'doDash': 4.0, 'skill2': 9.0, 'knifeSwing': 6.0, 'doFlurry': 6.0, 'curvedDash': 5, 'rocket': 8.0, 'dashAttack': 4.0, 'laser': 5.0, 'nihilityform': 15, 'doOverclock': 15.0, 'inkPen': 2.0, 'groundSlam': 12.0,
                    'doG': 12, 'doF': 15, 'doUlt': 20, 'sectorSlash': 7.5, 'sectorBuilding': 7.5, 'createRoad': 12, 'jumpKick': 10, 'spinAttack': 6, 'chargeAttack': 8, 'areaBlast': 9, 'pullAttack': 8, 'pushBack': 7, 'whirlwind': 10, 'sweepAttack': 5, 'teleportStrike': 9
                };
                return cooldownMap[abilityName] || 8.0;
            }
            
            refreshCopiedAbilities() {
                // Auto-refresh abilities when enemy dies or goes out of scope
                // Find a new nearby enemy to copy from - this checks every frame for new heroes
                let nearestEnemy = null;
                let minDist = 10000;
                for(let e of entities) {
                    if(e === this || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                    let isExplicitHero = (e.countsAsFFAHero === true) || (typeof OnlinePlayerProxy !== 'undefined' && e instanceof OnlinePlayerProxy);
                    let isExplicitNonHero = (e.countsAsFFAHero === false);
                    let hasDetectableAbilities = false;
                    try { hasDetectableAbilities = !!this.findAbilityByPosition(e, 'q') || !!this.findAbilityByPosition(e, 'e'); } catch(_) { hasDetectableAbilities = false; }
                    if(isExplicitHero || (!isExplicitNonHero && hasDetectableAbilities)) {
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d < minDist && d < 1200) { // Look within 1200 units for new heroes
                            minDist = d; 
                            nearestEnemy = e; 
                        }
                    }
                }
                if(nearestEnemy && (!this.copiedEnemyRef || this.copiedEnemyRef.dead || !this.copiedQFunc || !this.copiedEFunc)) {
                    // Copy from new hero or refresh abilities
                    this.copiedEnemyRef = nearestEnemy;
                    this.copiedEnemyName = nearestEnemy.name || nearestEnemy.constructor.name;
                    
                    // Dynamically find Q ability
                    let qAbility = null;
                    if(nearestEnemy instanceof Chimera && nearestEnemy.chimeraMode && nearestEnemy.copiedQFunc) {
                        // If copying from another Chimera in chimera mode with copied abilities
                        qAbility = 'copiedQFunc';
                        this.copiedQCooldown = nearestEnemy.copiedQCooldown || 8.0;
                    } else {
                        qAbility = this.findAbilityByPosition(nearestEnemy, 'q');
                        if(qAbility) {
                            this.copiedQCooldown = this.getAbilityCooldown(qAbility);
                        }
                    }
                    
                    if(qAbility) {
                        // Create wrapper that executes ability with proper context swapping
                        this.copiedQFunc = () => {
                            this.executeWrappedAbility(nearestEnemy, qAbility);
                        };
                    } else {
                        this.copiedQFunc = null;
                    }
                    
                    // Dynamically find E ability
                    let eAbility = null;
                    if(nearestEnemy instanceof Chimera && nearestEnemy.chimeraMode && nearestEnemy.copiedEFunc) {
                        // If copying from another Chimera in chimera mode with copied abilities
                        eAbility = 'copiedEFunc';
                        this.copiedECooldown = nearestEnemy.copiedECooldown || 8.0;
                    } else {
                        eAbility = this.findAbilityByPosition(nearestEnemy, 'e');
                        if(eAbility) {
                            this.copiedECooldown = this.getAbilityCooldown(eAbility);
                        }
                    }
                    
                    if(eAbility) {
                        // Create wrapper that executes ability with proper context swapping
                        this.copiedEFunc = () => {
                            this.executeWrappedAbility(nearestEnemy, eAbility);
                        };
                    } else {
                        this.copiedEFunc = null;
                    }
                } else if(!nearestEnemy) {
                    // No enemies in range, clear copied abilities
                    this.copiedQFunc = null;
                    this.copiedEFunc = null;
                    this.copiedEnemyRef = null;
                    this.copiedEnemyName = null;
                }
            }
            
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAtk();
                    if(this.chimeraMode && this.copiedQFunc && this.copiedEFunc) {
                        if(d < 400 && this.qCD <= 0) {
                            this.copiedQFunc();
                            this.qCD = this.copiedQCooldown;
                        }
                        if(d < 200 && this.eCD <= 0) {
                            this.copiedEFunc();
                            this.eCD = this.copiedECooldown;
                        }
                    } else {
                        if(d < 400 && this.qCD <= 0) this.doTornado();
                        if(d < 200 && this.eCD <= 0) this.doDash();
                    }
                    if(d < 600 && this.fCD <= 0) this.chimmeraBurst();
                }
            }
            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            draw(ctx) {
                super.draw(ctx);
                if(this.tornadoActive) {
                    ctx.strokeStyle = '#a335ee';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.tornadoX - camera.x, this.tornadoY - camera.y, 150, 0, Math.PI*2);
                    ctx.stroke();
                }
                // Draw ultimate links
                if(this.linkedEnemies.size > 0) {
                    ctx.strokeStyle = '#ff00ff';
                    ctx.lineWidth = 2;
                    for(let e of this.linkedEnemies) {
                        ctx.beginPath();
                        ctx.moveTo(this.x - camera.x, this.y - camera.y);
                        ctx.lineTo(e.x - camera.x, e.y - camera.y);
                        ctx.stroke();
                    }
                }
                // Draw magic hat on marked enemies
                for(let [e] of this.markedEnemies) {
                    if(!e.dead) {
                        ctx.font = '30px Arial';
                        ctx.textAlign = 'center';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - 60;
                        ctx.fillText('🎩', screenX, screenY);
                    }
                }
                if(this.chimeraMode) {
                    ctx.strokeStyle = '#ff00ff';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
        }

        class Li extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, p ? '#1E90FF' : '#4169E1', 6600);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Li)" : "Enemy Li";
                this.baseSpd = 240;
                this.speed = this.baseSpd;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.attackPhase = 'punch'; // punch or kick
                this.punchCount = 0;
                this.waterPunching = false;
                this.waterPunchCount = 0;
                this.waterPunchTimer = 0;
                this.waterDamageReduction = 0; // 50% during water punch
                this.dragonForm = false;
                this.dragonFormTimer = 0;
                this.dragonRealmRadius = 200;
                this.honorCharges = 0;
                this.maxHonorCharges = 5;
                this.gCharged = false; // Unused now, passive auto-triggers
            }
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.gCD > 0) this.gCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                if(this.waterPunching) {
                    this.waterPunchTimer -= dt;
                    this.waterPunchCount--;
                    if(this.waterPunchCount <= 0 || this.waterPunchTimer <= 0) {
                        this.waterPunching = false;
                        this.waterDamageReduction = 0;
                    }
                }
                if(this.dragonForm) {
                    this.dragonFormTimer -= dt;
                    if(this.dragonFormTimer <= 0) this.dragonForm = false;
                }
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            input(dt, spd) {
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    if(!this.waterPunching) {
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x;
                        this.y += m.y;
                    }
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD <= 0) this.basicAttack();
                if(keys.q && this.qCD <= 0) this.waterFlowPunch();
                if(keys.e && this.eCD <= 0) this.dragonKick();
                if(keys.f && this.fCD <= 0) this.waterDragonForm();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            basicAttack() {
                this.revealTimer = 0.5;
                if(this.attackPhase === 'punch') {
                    // Punch: 150 damage, melee
                    this.basicCD = 0.6;
                    // Triple slash effect for punch
                    particles.push(new Slash(this.x, this.y, this.angle, 140, Math.PI/2.2, '#1E90FF'));
                    particles.push(new Slash(this.x, this.y, this.angle + 0.15, 120, Math.PI/2.5, '#00BFFF'));
                    particles.push(new Slash(this.x, this.y, this.angle - 0.15, 100, Math.PI/3, '#4169E1'));
                    // Punch impact explosion - 15 particles
                    for(let i = 0; i < 15; i++) {
                        let angle = this.angle + (Math.random() - 0.5) * 1.2;
                        particles.push(new Particle(this.x + Math.cos(this.angle)*80, this.y + Math.sin(this.angle)*80, i % 2 === 0 ? '#1E90FF' : '#00BFFF', 3, 0.5, Math.cos(angle)*180, Math.sin(angle)*180));
                    }
                    // Punch shockwave ring
                    for(let i = 0; i < 12; i++) {
                        let angle = (Math.PI * 2 * i) / 12;
                        particles.push(new Particle(this.x + Math.cos(this.angle)*80, this.y + Math.sin(this.angle)*80, '#87CEEB', 2, 0.4, Math.cos(angle)*120, Math.sin(angle)*120));
                    }
                    let hitEnemy = false;
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            if(d < 130) {
                                e.takeDamage(150, this);
                                hitEnemy = true;
                                // Hit impact particles on enemy
                                for(let i = 0; i < 12; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(e.x, e.y, '#1E90FF', 4, 0.5, Math.cos(angle)*200, Math.sin(angle)*200));
                                }
                            }
                        }
                    }
                    // Charge passive only if in water dragon form AND hit an enemy
                    if(this.dragonForm && hitEnemy) {
                        this.honorCharges++;
                        if(this.honorCharges >= this.maxHonorCharges) {
                            this.honorCharges = 0;
                            this.honorAbility();
                        }
                    }
                    this.attackPhase = 'kick';
                } else {
                    // Kick: 100 damage, dash 80 units forward with visual trail
                    this.basicCD = 0.6;
                    let moveX = Math.cos(this.angle) * 80;
                    let moveY = Math.sin(this.angle) * 80;
                    // Spiral trail particles during dash
                    for(let i = 0; i < 12; i++) {
                        let trailAngle = this.angle + (Math.PI * 2 * i) / 12;
                        particles.push(new Particle(this.x + (moveX * i/12) + Math.cos(trailAngle)*30, this.y + (moveY * i/12) + Math.sin(trailAngle)*30, '#4169E1', 2, 0.4, Math.cos(trailAngle)*80, Math.sin(trailAngle)*80));
                    }
                    this.x += moveX;
                    this.y += moveY;
                    // Dual slash effect at kick location
                    particles.push(new Slash(this.x - moveX, this.y - moveY, this.angle, 160, Math.PI/1.8, '#00BFFF'));
                    particles.push(new Slash(this.x - moveX, this.y - moveY, this.angle + 0.2, 140, Math.PI/2.2, '#4169E1'));
                    // Kick impact explosion - 18 particles
                    for(let i = 0; i < 18; i++) {
                        let angle = Math.random() * Math.PI * 2;
                        particles.push(new Particle(this.x, this.y, i % 3 === 0 ? '#1E90FF' : (i % 3 === 1 ? '#00BFFF' : '#4169E1'), 4, 0.6, Math.cos(angle)*200, Math.sin(angle)*200));
                    }
                    // Kick shockwave ring
                    for(let i = 0; i < 16; i++) {
                        let angle = (Math.PI * 2 * i) / 16;
                        particles.push(new Particle(this.x, this.y, '#87CEEB', 2, 0.5, Math.cos(angle)*140, Math.sin(angle)*140));
                    }
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - (this.x - moveX))**2 + (e.y - (this.y - moveY))**2);
                            if(d < 160) {
                                e.takeDamage(100, this);
                                // Hit impact particles on enemy
                                for(let i = 0; i < 15; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(e.x, e.y, '#00BFFF', 4, 0.6, Math.cos(angle)*220, Math.sin(angle)*220));
                                }
                            }
                        }
                    }
                    // Charge passive if in water dragon form
                    if(this.dragonForm) {
                        this.honorCharges++;
                        if(this.honorCharges >= this.maxHonorCharges) {
                            this.honorCharges = 0;
                            this.honorAbility();
                        }
                    }
                    this.attackPhase = 'punch';
                    // Passive only charges in waterDragonForm
                }
            }
            waterFlowPunch() {
                this.revealTimer = 0.5;
                this.qCD = 9;
                if(this.isPlayer) addKillMsg('Water Flow Punch!');
                this.waterPunching = true;
                this.waterPunchTimer = 1.5; // 1.5 seconds total
                this.waterPunchCount = 30; // 30 punches over 1.5s = 50ms per punch
                this.waterDamageReduction = 0.5; // Take 50% less damage
                // Charge passive on Q ability use
                this.honorCharges++;
                if(this.honorCharges >= this.maxHonorCharges) {
                    this.honorCharges = 0;
                    this.honorAbility();
                }
                if(this.isPlayer) addKillMsg('Water Flow Punch!');
                let punchInterval = setInterval(() => {
                    if(!this.waterPunching) {
                        clearInterval(punchInterval);
                        return;
                    }
                    // Create massive water punch effect
                    let punchX = this.x + Math.cos(this.angle) * 80;
                    let punchY = this.y + Math.sin(this.angle) * 80;
                    // Triple water slashes
                    particles.push(new Slash(punchX, punchY, this.angle, 160, Math.PI/2.2, '#00BFFF'));
                    particles.push(new Slash(punchX, punchY, this.angle + 0.25, 140, Math.PI/2.5, '#1E90FF'));
                    particles.push(new Slash(punchX, punchY, this.angle - 0.25, 120, Math.PI/3, '#4169E1'));
                    // Water burst explosion - 12 particles per punch
                    for(let i = 0; i < 12; i++) {
                        let angle = this.angle + (Math.random() - 0.5) * 1.4;
                        particles.push(new Particle(punchX, punchY, '#00BFFF', 3, 0.5, Math.cos(angle)*200, Math.sin(angle)*200));
                    }
                    // Water spray wave - 10 particles
                    for(let i = 0; i < 10; i++) {
                        let sprayAngle = this.angle - Math.PI/4 + (i * Math.PI/5) + (Math.random() - 0.5) * 0.3;
                        particles.push(new Particle(punchX, punchY, '#87CEEB', 2, 0.4, Math.cos(sprayAngle)*250, Math.sin(sprayAngle)*250));
                    }
                    // Additional shimmer particles
                    for(let i = 0; i < 8; i++) {
                        let shimmerAngle = Math.random() * Math.PI * 2;
                        particles.push(new Particle(punchX, punchY, '#E0F6FF', 2, 0.3, Math.cos(shimmerAngle)*150, Math.sin(shimmerAngle)*150));
                    }
                    // Hit enemies with wider radius
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-punchX)**2 + (e.y-punchY)**2);
                            if(d < 160) {
                                e.takeDamage(70, this);
                                e.slowTimer = Math.max(e.slowTimer, 0.5);
                                e.slowMultiplier = 0.6;
                                // Enemy hit impact
                                for(let j = 0; j < 10; j++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(e.x, e.y, '#00BFFF', 3, 0.4, Math.cos(angle)*180, Math.sin(angle)*180));
                                }
                            }
                        }
                    }
                }, 50); // 50ms interval = 30 punches in 1.5s
                // Q ability does not charge passive
                // Only basic attacks charge passive
            }
            dragonKick() {
                this.revealTimer = 0.5;
                this.eCD = 6;
                // Forward kick: 700 damage, 1s stun
                let dx = Math.cos(this.angle) * 150;
                let dy = Math.sin(this.angle) * 150;
                // Triple mega dragon slashes
                particles.push(new Slash(this.x + dx/2, this.y + dy/2, this.angle, 180, Math.PI/1.6, '#FFD700'));
                particles.push(new Slash(this.x + dx/2, this.y + dy/2, this.angle + 0.25, 160, Math.PI/1.9, '#FFA500'));
                particles.push(new Slash(this.x + dx/2, this.y + dy/2, this.angle - 0.25, 140, Math.PI/2.2, '#FF8C00'));
                // Dragon burst explosion - 20 particles
                for(let i = 0; i < 20; i++) {
                    let angle = this.angle + (Math.random() - 0.5) * 1.2;
                    particles.push(new Particle(this.x + dx/2, this.y + dy/2, i % 2 === 0 ? '#FFD700' : '#FFA500', 5, 0.8, Math.cos(angle)*250, Math.sin(angle)*250));
                }
                // Dragon flame ring - 16 particles
                for(let i = 0; i < 16; i++) {
                    let angle = (Math.PI * 2 * i) / 16;
                    particles.push(new Particle(this.x + dx/2, this.y + dy/2, '#FF6347', 3, 0.6, Math.cos(angle)*200, Math.sin(angle)*200));
                }
                // Bonus shockwave
                for(let i = 0; i < 12; i++) {
                    let angle = (Math.PI * 2 * i) / 12;
                    particles.push(new Particle(this.x + dx/2, this.y + dy/2, '#FFFF00', 2, 0.5, Math.cos(angle)*180, Math.sin(angle)*180));
                }
                let damageDealt = 0;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-(this.x+dx/2))**2 + (e.y-(this.y+dy/2))**2);
                        if(d < 180) {
                            e.takeDamage(1000, this);
                            e.applyStatus('stun', 1, this);
                            damageDealt += 700;
                            // Hit impact particles
                            for(let i = 0; i < 18; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                particles.push(new Particle(e.x, e.y, '#FFD700', 4, 0.6, Math.cos(angle)*220, Math.sin(angle)*220));
                            }
                        }
                    }
                }
                // 50% damage dealt as shield
                this.shield += damageDealt * 0.5;
                // Charge passive on E ability use
                this.honorCharges++;
                if(this.honorCharges >= this.maxHonorCharges) {
                    this.honorCharges = 0;
                    this.honorAbility();
                }
            }
            waterDragonForm() {
                this.revealTimer = 0.5;
                this.fCD = 30; // 30 second cooldown
                this.dragonForm = true;
                this.dragonFormTimer = 15;
                if(this.isPlayer) addKillMsg('Water Dragon Form!');
                // Charge passive in water dragon form
                this.honorCharges++;
                if(this.honorCharges >= this.maxHonorCharges) {
                    this.honorCharges = 0;
                    this.honorAbility(); // Auto-trigger passive
                }
                // Create massive realm effect with water and dragon visuals
                for(let i = 0; i < 35; i++) {
                    let angle = (Math.PI * 2 * i) / 35;
                    let x = this.x + Math.cos(angle) * this.dragonRealmRadius;
                    let y = this.y + Math.sin(angle) * this.dragonRealmRadius;
                    // Alternate water and dragon colors
                    let color = i % 2 === 0 ? '#00BFFF' : '#1E90FF';
                    particles.push(new Particle(x, y, color, 4, 1.2, Math.cos(angle)*100, Math.sin(angle)*100));
                }
                // Central burst
                for(let i = 0; i < 20; i++) {
                    let angle = (Math.PI * 2 * i) / 20;
                    particles.push(new Particle(this.x, this.y, '#4169E1', 3, 0.8, Math.cos(angle)*150, Math.sin(angle)*150));
                }
            }
            honorAbility() {
                this.revealTimer = 1;
                this.gCD = 0; // No cooldown on passive
                // Passive auto-triggers after 5 F ability uses
                // Circle explosion with water particles
                for(let i = 0; i < 60; i++) {
                    let angle = (Math.PI * 2 * i) / 60;
                    particles.push(new Particle(this.x, this.y, i % 2 === 0 ? '#00BFFF' : '#87CEEB', 4, 0.8, Math.cos(angle)*250, Math.sin(angle)*250));
                }
                // Heal self
                this.hp = Math.min(this.maxHp, this.hp + 400);
                if(this.isPlayer) addKillMsg('Honor Ability - Water Dragon!');
                // Damage enemies
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < 300) {
                            e.takeDamage(800, this);
                        }
                    }
                }
            }
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 300) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAttack();
                    if(this.qCD <= 0 && d < 200 && Math.random() < 0.1) this.waterFlowPunch();
                    if(this.eCD <= 0 && d < 300 && Math.random() < 0.15) this.dragonKick();
                    if(this.fCD <= 0 && Math.random() < 0.05) this.waterDragonForm();
                    if(this.gCharged && Math.random() < 0.2) this.honorAbility();
                }
            }
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            findTarget() {
                let closest = null, minDist = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < minDist) { minDist = d; closest = e; }
                    }
                }
                return closest;
            }
            draw(ctx) {
                super.draw(ctx);
                if(this.dragonForm) {
                    // Draw dragon realm
                    ctx.fillStyle = 'rgba(30, 144, 255, 0.1)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.dragonRealmRadius, 0, Math.PI*2);
                    ctx.fill();
                    ctx.strokeStyle = '#1E90FF';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                if(this.waterPunching) {
                    ctx.fillStyle = 'rgba(0, 191, 255, 0.3)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 60, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            takeDamage(dmg, attacker) {
                if(this.waterPunching) dmg *= (1 - this.waterDamageReduction);
                if(this.dragonForm) dmg *= 1.2; // Enemy does 20% more damage
                super.takeDamage(dmg, attacker);
            }
            getDamageMult() {
                if(this.dragonForm) return 1.2; // Deal 20% more damage in dragon form
                return 1;
            }
            getEffectiveSpeed() {
                let s = this.speed;
                if(this.slowTimer > 0) s *= 0.6;
                return s;
            }
        }

        class Lav extends Entity {
            constructor(x, y, p) {
                super(x, y, 16, p ? '#FF69B4' : '#FF1493', 8000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Lav)" : "Enemy Lav";
                this.baseSpd = 240;
                this.speed = this.baseSpd;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.lovePower = 0;
                this.maxLovePower = 10;
                this.loveBoostActive = false;
                this.loveBoostTimer = 0;
            }
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                if(this.loveBoostActive) {
                    this.loveBoostTimer -= dt;
                    if(this.loveBoostTimer <= 0) {
                        this.loveBoostActive = false;
                        this.speed = this.baseSpd;
                        this.basicCD = 1; // Reset to normal cooldown
                    }
                }
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            input(dt, spd) {
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD <= 0) this.basicAttack();
                if(keys.q && this.qCD <= 0) this.loveBoost();
                if(keys.e && this.eCD <= 0) this.loveBall();
                if(keys.f && this.fCD <= 0) this.loveUltimate();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            basicAttack() {
                this.revealTimer = 0.5;
                this.basicCD = this.loveBoostActive ? 0.4 : 1.0;
                // Shoot love projectile
                let pX = this.x + Math.cos(this.angle) * 60;
                let pY = this.y + Math.sin(this.angle) * 60;
                particles.push(new Slash(pX, pY, this.angle, 100, Math.PI/2.5, '#FF69B4'));
                for(let i = 0; i < 8; i++) {
                    let angle = this.angle + (Math.random() - 0.5) * 0.8;
                    particles.push(new Particle(pX, pY, '#FF69B4', 2, 0.3, Math.cos(angle)*150, Math.sin(angle)*150));
                }
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-pX)**2 + (e.y-pY)**2);
                        if(d < 100) {
                            e.takeDamage(70, this);
                            for(let i = 0; i < 6; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                particles.push(new Particle(e.x, e.y, '#FF69B4', 3, 0.4, Math.cos(angle)*180, Math.sin(angle)*180));
                            }
                        }
                    }
                }
            }
            loveBoost() {
                this.revealTimer = 0.5;
                this.qCD = 14;
                this.loveBoostActive = true;
                this.loveBoostTimer = 10;
                this.speed = this.baseSpd * 1.5;
                if(this.isPlayer) addKillMsg('Love Boost!');
                // Heal lowest health teammate
                let lowestTeammate = null;
                let lowestHP = Infinity;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team === this.team) {
                        if(e.hp < lowestHP) {
                            lowestHP = e.hp;
                            lowestTeammate = e;
                        }
                    }
                }
                if(lowestTeammate) lowestTeammate.hp = Math.min(lowestTeammate.maxHp, lowestTeammate.hp + 1000);
                this.hp = Math.min(this.maxHp, this.hp + 400);
                // Boost effect particles
                for(let i = 0; i < 20; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(this.x, this.y, '#FFB6C1', 3, 0.5, Math.cos(angle)*200, Math.sin(angle)*200));
                }
            }
            loveBall() {
                this.revealTimer = 0.5;
                this.eCD = 3;
                if(this.isPlayer) addKillMsg('Love Ball!');
                // Shoot love ball projectile - bigger size with explosion
                let proj = new Projectile(this, this.x, this.y, this.angle, 600, 250, 350, '#FF69B4', 15, false, false, true, 0, 1.0);
                // Add custom explosion callback
                proj.onExplode = () => {
                    // Explosion particles
                    for(let i = 0; i < 30; i++) {
                        let angle = (Math.PI * 2 * i) / 30;
                        particles.push(new Particle(proj.x, proj.y, i % 2 === 0 ? '#FF69B4' : '#FFB6C1', 5, 0.8, Math.cos(angle)*300, Math.sin(angle)*300));
                    }
                    // Stun all enemies in radius
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - proj.x)**2 + (e.y - proj.y)**2);
                            if(d < 200) { // 200 unit radius
                                e.applyStatus('stun', 1.0, this);
                                // Hit particles
                                for(let i = 0; i < 12; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(e.x, e.y, '#FF1493', 3, 0.5, Math.cos(angle)*250, Math.sin(angle)*250));
                                }
                            }
                        }
                    }
                };
                entities.push(proj);
                // Initial burst effect
                for(let i = 0; i < 8; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(this.x, this.y, '#FFB6C1', 2, 0.3, Math.cos(angle)*150, Math.sin(angle)*150));
                }
            }
            loveUltimate() {
                this.revealTimer = 0.5;
                this.fCD = 16;
                // Ultimate explosion
                for(let i = 0; i < 40; i++) {
                    let angle = (Math.PI * 2 * i) / 40;
                    particles.push(new Particle(this.x, this.y, i % 2 === 0 ? '#FF69B4' : '#FFB6C1', 4, 0.8, Math.cos(angle)*280, Math.sin(angle)*280));
                }
                if(this.isPlayer) addKillMsg('Love Ultimate!');
                // Heal lowest teammate by 10% of their max HP
                let lowestTeammate = null;
                let lowestHP = Infinity;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team === this.team) {
                        if(e.hp < lowestHP) {
                            lowestHP = e.hp;
                            lowestTeammate = e;
                        }
                    }
                }
                if(lowestTeammate) lowestTeammate.hp = Math.min(lowestTeammate.maxHp, lowestTeammate.hp + (lowestTeammate.maxHp * 0.1));
                this.hp = Math.min(this.maxHp, this.hp + 400);
                // Damage enemies
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < 280) {
                            e.takeDamage(600, this);
                            e.applyStatus('stun', 1, this);
                            for(let i = 0; i < 15; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                particles.push(new Particle(e.x, e.y, '#FF1493', 3, 0.6, Math.cos(angle)*250, Math.sin(angle)*250));
                            }
                        }
                    }
                }
            }
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 300) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAttack();
                    if(this.qCD <= 0 && Math.random() < 0.05) this.loveBoost();
                    if(this.eCD <= 0 && d < 200 && Math.random() < 0.1) this.loveBall();
                    if(this.fCD <= 0 && Math.random() < 0.05) this.loveUltimate();
                }
            }
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            findTarget() {
                let closest = null, minDist = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < minDist) { minDist = d; closest = e; }
                    }
                }
                return closest;
            }
            draw(ctx) {
                super.draw(ctx);
            }
            takeDamage(dmg, attacker) {
                super.takeDamage(dmg, attacker);
            }
            getDamageMult() {
                return 1;
            }
            getEffectiveSpeed() {
                let s = this.speed;
                if(this.slowTimer > 0) s *= 0.6;
                return s;
            }
            onDeath(killer) {
                super.onDeath(killer);
            }
        }

        class Max extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#FF0000' : '#CC0000', 6900);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Max)" : "Enemy Max";
                this.baseSpd = 280;
                this.speed = this.baseSpd;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0; this.gCD = 0;
                this.enhancedAttackActive = false;
                this.carLiftActive = false;
                this.carLiftTimer = 0;
                this.carLiftSpeed = 3.3;
                this.podiumFlags = [];
                this.slowPedals = [];
                this.corneringActive = false;
                this.corneringTimer = 0;
                this.corneringTickTimer = 0;
                this.corneringHitsLeft = 0;
            }
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                if(this.gCD > 0) this.gCD -= dt;
                
                if(this.corneringActive) {
                    this.corneringTimer -= dt;
                    this.corneringTickTimer -= dt;
                    this.speed = this.baseSpd * 2.4;
                    if(this.corneringTimer <= 0) {
                        this.corneringActive = false;
                        this.speed = this.baseSpd;
                    } else if(this.corneringTickTimer <= 0 && this.corneringHitsLeft > 0) {
                        this.corneringTickTimer = 0.2;
                        this.corneringHitsLeft--;
                        let burstDir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
                        for(let e of entities) {
                            if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if(d < 220) {
                                    e.takeDamage(333, this);
                                    e.x += burstDir.x * 220;
                                    e.y += burstDir.y * 220;
                                    e.applyStatus('stun', 0.2, this);
                                    for(let i = 0; i < 8; i++) {
                                        let angle = Math.random() * Math.PI * 2;
                                        particles.push(new Particle(e.x, e.y, '#FF4500', 3, 0.5, Math.cos(angle)*220, Math.sin(angle)*220));
                                    }
                                }
                            }
                        }
                    }
                } else if(!this.carLiftActive) {
                    this.speed = this.baseSpd;
                }
                
                // Handle car lift
                if(this.carLiftActive) {
                    this.carLiftTimer -= dt;
                    if(this.carLiftTimer <= 0) {
                        this.carLiftActive = false;
                        this.speed = this.baseSpd;
                    }
                }
                
                // Remove expired flags
                this.podiumFlags = this.podiumFlags.filter(f => f.lifetime > 0);
                for(let f of this.podiumFlags) {
                    f.lifetime -= dt;
                    if(!f.stunCD) f.stunCD = 0;
                    f.stunCD -= dt;
                    // Deal damage and stun to enemies in flag radius
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - f.x)**2 + (e.y - f.y)**2);
                            if(d < 120) {
                                e.takeDamage(50 * dt, this);
                                if(f.stunCD <= 0) {
                                    e.applyStatus('stun', 0.2, this);
                                    f.stunCD = 1.0;
                                }
                            }
                        }
                    }
                }
                
                // Remove expired slow pedals
                let now = Date.now();
                this.slowPedals = this.slowPedals.filter(p => (now - p.createTime) < 3000);
                for(let p of this.slowPedals) {
                    // Slow enemies in pedal radius
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - p.x)**2 + (e.y - p.y)**2);
                            if(d < p.radius) {
                                e.slowTimer = Math.max(e.slowTimer, 0.15);
                                e.slowMultiplier = 0.4;
                            }
                        }
                    }
                }
                
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            input(dt, spd) {
                if(this.carLiftActive) {
                    // During car lift, allow direction control with WASD
                    let dx = 0, dy = 0;
                    if(keys.w) dy--;
                    if(keys.s) dy++;
                    if(keys.a) dx--;
                    if(keys.d) dx++;
                    if(dx || dy) {
                        this.angle = Math.atan2(dy, dx);
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x;
                        this.y += m.y;
                    }
                    // Check for enemy collisions
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if(d < 50) {
                                // Explosion on hit
                                this.carLiftActive = false;
                                this.speed = this.baseSpd;
                                screenShake(20);
                                for(let i = 0; i < 40; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(this.x, this.y, '#FF4500', 5, 1.0, Math.cos(angle)*300, Math.sin(angle)*300));
                                }
                                // Damage and injure all enemies in radius
                                for(let enemy of entities) {
                                    if(enemy !== this && !enemy.dead && enemy instanceof Entity && enemy.team !== this.team) {
                                        let ed = Math.sqrt((enemy.x - this.x)**2 + (enemy.y - this.y)**2);
                                        if(ed < 250) {
                                            enemy.takeDamage(660, this);
                                            enemy.injuredTimer = 16.5;
                                        }
                                    }
                                }
                                if(this.isPlayer) addKillMsg('Car Crash!');
                                break;
                            }
                        }
                    }
                    return;
                }
                
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD <= 0) this.basicAttack();
                if(keys.q && this.qCD <= 0) this.redBullCan();
                if(keys.e && this.eCD <= 0) this.healBoost();
                if(keys.f && this.fCD <= 0) this.carLift();
                if(keys.g && this.gCD <= 0) this.aggressiveCornering();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            basicAttack() {
                this.revealTimer = 0.5;
                if(!this.enhancedAttackActive) {
                    this.basicCD = 1.15;
                    particles.push(new Slash(this.x, this.y, this.angle, 150, Math.PI/2, '#FF0000'));
                    for(let i = 0; i < 10; i++) {
                        let angle = this.angle + (Math.random() - 0.5) * 0.6;
                        particles.push(new Particle(this.x + Math.cos(this.angle)*70, this.y + Math.sin(this.angle)*70, '#FF4500', 3, 0.4, Math.cos(angle)*180, Math.sin(angle)*180));
                    }
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if(d < 130) {
                                e.takeDamage(150, this);
                                for(let i = 0; i < 8; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(e.x, e.y, '#FF0000', 3, 0.3, Math.cos(angle)*180, Math.sin(angle)*180));
                                }
                            }
                        }
                    }
                } else {
                    // Enhanced: place podium flag
                    this.basicCD = 1.15;
                    this.enhancedAttackActive = false;
                    let fX = this.x + Math.cos(this.angle) * 100;
                    let fY = this.y + Math.sin(this.angle) * 100;
                    this.podiumFlags.push({x: fX, y: fY, lifetime: 10});
                    // Flag explosion particles
                    for(let i = 0; i < 25; i++) {
                        let angle = (Math.PI * 2 * i) / 25;
                        particles.push(new Particle(fX, fY, i % 2 === 0 ? '#FFD700' : '#FFA500', 4, 0.8, Math.cos(angle)*220, Math.sin(angle)*220));
                    }
                    // Damage and stun enemies at flag location
                    for(let e of entities) {
                        if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - fX)**2 + (e.y - fY)**2);
                            if(d < 130) {
                                e.takeDamage(500, this);
                                e.applyStatus('stun', 0.75, this);
                                for(let i = 0; i < 12; i++) {
                                    let angle = Math.random() * Math.PI * 2;
                                    particles.push(new Particle(e.x, e.y, '#FFD700', 3, 0.5, Math.cos(angle)*250, Math.sin(angle)*250));
                                }
                            }
                        }
                    }
                }
            }
            redBullCan() {
                this.revealTimer = 0.5;
                this.qCD = 5;
                if(this.isPlayer) addKillMsg('Red Bull Can!');
                // Max Q: direct hit is capped at 750; the burst falls off to a 250 minimum, but the direct hit and burst cannot stack on the same target.
                let maxRef = this;
                const directHitTargets = new Set();
                let proj = new Projectile(this, this.x, this.y, this.angle, 1000, 0, 750, '#0066FF', 10, false, false, true, 0, 0);

                let applyMaxCanExplosion = () => {
                    const blastRadius = 220;
                    const centerX = proj.x;
                    const centerY = proj.y;
                    for(let e of entities) {
                        if(e !== maxRef && !e.dead && e instanceof Entity && e.team !== maxRef.team) {
                            let d = Math.sqrt((e.x - centerX)**2 + (e.y - centerY)**2);
                            if(d < blastRadius && !directHitTargets.has(e)) {
                                let damage = 750 * (1 - d / blastRadius);
                                damage = Math.max(250, damage);
                                e.takeDamage(damage, maxRef);
                                e.revealTimer = 1.0;
                            }
                        }
                    }
                    maxRef.slowPedals.push({x: centerX, y: centerY, createTime: Date.now(), radius: 150});
                    for(let i = 0; i < 30; i++) {
                        let angle = Math.random() * Math.PI * 2;
                        let speed = 120 + Math.random() * 180;
                        particles.push(new Particle(centerX, centerY, '#0066FF', 4, 0.8, Math.cos(angle)*speed, Math.sin(angle)*speed));
                    }
                };

                proj.onExplode = applyMaxCanExplosion;
                proj.onHit = (target) => {
                    if (target && !target.dead && target instanceof Entity && directHitTargets.has(target) === false) {
                        directHitTargets.add(target);
                        target.takeDamage(750, maxRef);
                        target.revealTimer = 1.0;
                    }
                    if (target && !target.dead && target instanceof Entity) {
                        const centerX = proj.x;
                        const centerY = proj.y;
                        let d = Math.sqrt((target.x - centerX)**2 + (target.y - centerY)**2);
                        if (d < 220) {
                            // this direct hit already used the 750 cap; the burst is intentionally skipped for this target
                            return;
                        }
                    }
                };
                
                entities.push(proj);
                for(let i = 0; i < 8; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(this.x, this.y, '#0066FF', 2, 0.3, Math.cos(angle)*150, Math.sin(angle)*150));
                }
            }
            healBoost() {
                this.revealTimer = 0.5;
                this.eCD = 10;
                if(this.isPlayer) addKillMsg('Heal Boost!');
                this.enhancedAttackActive = true;
                this.hp = Math.min(this.maxHp, this.hp + 690);
                // Heal teammates
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team === this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < 300) {
                            e.hp = Math.min(e.maxHp, e.hp + 690);
                        }
                    }
                }
                // Healing aura particles
                for(let i = 0; i < 25; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(this.x, this.y, '#FFD700', 3, 0.6, Math.cos(angle)*200, Math.sin(angle)*200));
                }
            }
            carLift() {
                this.revealTimer = 0.5;
                this.fCD = 16.5;
                if(this.isPlayer) addKillMsg('Car Lift!');
                this.carLiftActive = true;
                this.carLiftTimer = 3.3;
                this.speed = this.baseSpd * this.carLiftSpeed;
                // Car lift effect
                for(let i = 0; i < 35; i++) {
                    let angle = (Math.PI * 2 * i) / 35;
                    particles.push(new Particle(this.x, this.y, i % 2 === 0 ? '#FF0000' : '#FFD700', 5, 1.5, Math.cos(angle)*250, Math.sin(angle)*250));
                }
            }
            aggressiveCornering() {
                this.revealTimer = 0.5;
                this.gCD = 9.9;
                this.corneringActive = true;
                this.corneringTimer = 0.75;
                this.corneringTickTimer = 0;
                this.corneringHitsLeft = 3;
                this.speed = this.baseSpd * 2.4;
                let burstDir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
                this.x += burstDir.x * 90;
                this.y += burstDir.y * 90;
                for(let i = 0; i < 24; i++) {
                    let angle = (Math.PI * 2 * i) / 24;
                    particles.push(new Particle(this.x, this.y, i % 2 === 0 ? '#FF4500' : '#FFD700', 4, 0.8, Math.cos(angle)*260, Math.sin(angle)*260));
                }
                if(this.isPlayer) addKillMsg('Aggressive Cornering!');
            }
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 300) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAttack();
                    if(this.qCD <= 0 && Math.random() < 0.08) this.redBullCan();
                    if(this.eCD <= 0 && Math.random() < 0.06) this.healBoost();
                    if(this.fCD <= 0 && Math.random() < 0.03) this.carLift();
                    if(this.gCD <= 0 && Math.random() < 0.03) this.aggressiveCornering();
                }
            }
            findTarget() {
                let closest = null, minDist = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < minDist) { minDist = d; closest = e; }
                    }
                }
                return closest;
            }
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            draw(ctx) {
                super.draw(ctx);
                
                // Draw slow pedals
                for(let p of this.slowPedals) {
                    ctx.fillStyle = 'rgba(0, 102, 255, 0.6)';
                    ctx.beginPath();
                    ctx.arc(p.x - camera.x, p.y - camera.y, p.radius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#0066FF';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                
                // Draw F1 car on head
                ctx.save();
                ctx.translate(this.x - camera.x, this.y - camera.y - 30);
                ctx.rotate(this.angle);
                // Car body
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(-8, -4, 16, 8);
                // Spoiler
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(7, -5, 3, 10);
                // Wheels
                ctx.fillStyle = '#000';
                ctx.fillRect(-6, -5, 3, 2);
                ctx.fillRect(3, -5, 3, 2);
                ctx.fillRect(-6, 3, 3, 2);
                ctx.fillRect(3, 3, 3, 2);
                ctx.restore();
                
                // Draw podium flags
                for(let flag of this.podiumFlags) {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(flag.x - camera.x - 6, flag.y - camera.y - 12, 12, 24);
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(flag.x - camera.x + 6, flag.y - camera.y - 10, 12, 12);
                }
            }
        }

        class Benjamin extends Entity {
            constructor(x, y, p) {
                super(x, y, 24, p ? '#cd7f32' : '#8b4513', 10500);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Benjamin)" : "Enemy Benjamin";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.baseSpd = 180;
                this.speed = this.baseSpd;
                // Q ability: Two-swing hammer
                this.swinging = false;
                this.swingCount = 0;
                this.swingT = 0;
                this.swingDelay = 0.3;
                this.lungsForward = 300;
                // F ability: Shield field
                this.shieldActive = false;
                this.shieldTimer = 0;
                this.fieldTimer = 0;
                this.fieldRadius = 300;
                this.fieldDamage = 50;
                this.fieldDt = 0;
            }
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                // Q ability swing state
                if(this.swinging) {
                    this.swingT -= dt;
                    if(this.swingT <= 0) {
                        this.swingCount++;
                        if(this.swingCount >= 2) {
                            this.swinging = false;
                            this.swingCount = 0;
                        } else {
                            this.swingT = this.swingDelay;
                            this.performSwing();
                        }
                    }
                }
                // Shield active
                if(this.shieldActive) {
                    this.shieldTimer -= dt;
                    if(this.shieldTimer <= 0) {
                        this.shieldActive = false;
                        this.shield = 0;
                    } else {
                        // Field damage
                        this.fieldDt -= dt;
                        if(this.fieldDt <= 0) {
                            this.fieldDt = 1.0;
                            for(let e of entities) {
                                if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                    let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                                    if(d < this.fieldRadius) {
                                        e.takeDamage(this.fieldDamage, this);
                                        e.slowTimer = Math.max(e.slowTimer, 5);
                                        e.slowMultiplier = 0.5; // 50% slow = slowness II
                                    }
                                }
                            }
                        }
                    }
                }
                if(this.stunTimer > 0 || this.freezeTimer > 0) { if(this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if(this.swinging) spd = 0; // Can't move while swinging
                if(this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            input(dt, spd) {
                if(this.swinging) return; // Can't move during swing
                let dx = 0, dy = 0;
                if(keys.w) dy--;
                if(keys.s) dy++;
                if(keys.a) dx--;
                if(keys.d) dx++;
                if(dx||dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd*dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(keys.q && this.qCD <= 0) this.doubleSwing();
                if(keys.e && this.eCD <= 0) this.groundSlam();
                if(keys.f && this.fCD <= 0) this.ultimateShield();
                if(keys.r && this.rCD <= 0) this.useGear();
            }
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 2.0;
                // Semi-circle hammer attack
                particles.push(new Slash(this.x, this.y, this.angle, 160, Math.PI, '#8b4513'));
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let d = Math.sqrt(dx*dx + dy*dy);
                        let ad = Math.abs(Math.atan2(dy, dx) - this.angle);
                        if(ad > Math.PI) ad = 2*Math.PI - ad;
                        if(d < 160 && ad < Math.PI/2) {
                            e.takeDamage(250, this);
                            // Knockback
                            let kb = 400;
                            e.x += (dx/d) * kb * 0.016;
                            e.y += (dy/d) * kb * 0.016;
                            for(let i = 0; i < 5; i++) particles.push(new Particle(e.x, e.y, '#cd7f32', 3, 0.5));
                        }
                    }
                }
            }
            performSwing() {
                // Perform one swing of the hammer
                particles.push(new Slash(this.x, this.y, this.angle, 160, Math.PI, '#8b4513'));
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let d = Math.sqrt(dx*dx + dy*dy);
                        let ad = Math.abs(Math.atan2(dy, dx) - this.angle);
                        if(ad > Math.PI) ad = 2*Math.PI - ad;
                        if(d < 160 && ad < Math.PI/2) {
                            e.takeDamage(400, this);
                            // Knockback to continue combo
                            let kb = 500;
                            e.x += (dx/d) * kb * 0.016;
                            e.y += (dy/d) * kb * 0.016;
                            e.applyStatus('stun', 0.1, this);
                            // Reduce cooldowns
                            this.qCD = Math.max(0, this.qCD - 1);
                            this.eCD = Math.max(0, this.eCD - 1);
                            this.fCD = Math.max(0, this.fCD - 1);
                            // Heal: 100 + 4% hp lost
                            let hpLost = this.maxHp - this.hp;
                            let healAmt = 100 + Math.floor(hpLost * 0.04);
                            this.hp = Math.min(this.maxHp, this.hp + healAmt);
                            for(let i = 0; i < 8; i++) particles.push(new Particle(e.x, e.y, '#cd7f32', 4, 0.6));
                        }
                    }
                }
                // Lunge forward each swing
                this.x += Math.cos(this.angle) * this.lungsForward * 0.016;
                this.y += Math.sin(this.angle) * this.lungsForward * 0.016;
            }
            doubleSwing() {
                if(this.swinging) return;
                this.qCD = 8.0;
                this.swinging = true;
                this.swingCount = 0;
                this.swingT = this.swingDelay;
                this.performSwing();
            }
            groundSlam() {
                this.revealTimer = 0.5;
                this.eCD = 12.0;
                particles.push(new Slash(this.x, this.y, this.angle, 200, Math.PI*2, '#8b4513'));
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d < 200) {
                            e.takeDamage(600, this);
                            e.applyStatus('stun', 1.25, this);
                            // Reduce cooldowns
                            this.qCD = Math.max(0, this.qCD - 1);
                            this.eCD = Math.max(0, this.eCD - 1);
                            this.fCD = Math.max(0, this.fCD - 1);
                            for(let i = 0; i < 12; i++) particles.push(new Particle(e.x, e.y, '#cd7f32', 5, 0.8));
                        }
                    }
                }
            }
            ultimateShield() {
                this.revealTimer = 0.5;
                this.fCD = 14.0;
                screenShake(10);
                // Give shield
                let shieldAmt = Math.floor(this.maxHp * 0.25);
                this.shield = shieldAmt;
                this.shieldActive = true;
                this.shieldTimer = 5.0;
                this.fieldTimer = 5.0;
                this.fieldDt = 0;
                // Instant damage in radius
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d < this.fieldRadius) {
                            e.takeDamage(500, this);
                            e.slowTimer = 5;
                            e.slowMultiplier = 0.5;
                            for(let i = 0; i < 10; i++) particles.push(new Particle(e.x, e.y, '#8b4513', 6, 0.9));
                        }
                    }
                }
                // Shield/field visual
                for(let i = 0; i < 30; i++) {
                    let ang = (i/30) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(ang)*this.fieldRadius, this.y + Math.sin(ang)*this.fieldRadius, '#cd7f32', 4, 1));
                }
            }
            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                if(this.swinging) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 200) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if(this.basicCD <= 0) this.basicAtk();
                    if(this.eCD <= 0 && d < 200) this.groundSlam();
                    if(this.qCD <= 0 && d < 300) this.doubleSwing();
                    if(this.fCD <= 0 && this.hp < this.maxHp * 0.4) this.ultimateShield();
                }
            }
            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            draw(ctx) {
                super.draw(ctx);
                if(this.shieldActive) {
                    ctx.strokeStyle = '#cd7f32';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.fieldRadius, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(205, 127, 50, 0.1)';
                    ctx.fill();
                }
            }
        }

        class Kenshi extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, '#8B4513', 6820);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Kenshi)" : "Enemy Kenshi";
                this.currentSkin = 'default';
                this.skinIcon = null;
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 260;
                this.speed = 260;
                this.passiveStacks = 0;
                this.maxPassiveStacks = 3;
                this.dashTimer = 0;
                this.dashing = false;
                this.markedTarget = null;
                this.stunImmuneTimer = 0;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                if (this.dashing) {
                    this.dashTimer -= dt;
                    if (this.dashTimer <= 0) this.dashing = false;
                }
                if (this.stunImmuneTimer > 0) this.stunImmuneTimer -= dt;
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (!this.dashing) {
                    if (keys.w) dy--;
                    if (keys.s) dy++;
                    if (keys.a) dx--;
                    if (keys.d) dx++;
                    if (dx || dy) {
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x;
                        this.y += m.y;
                    }
                }
                
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAttack();
                if (keys.q && this.qCD <= 0) this.swordEnergy();
                if (keys.e && this.eCD <= 0) this.dashAbility();
                if (keys.f && this.fCD <= 0) this.rangedRush();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAttack() {
                this.revealTimer = 0.5;
                this.basicCD = 0.9;
                
                if (this.passiveStacks > 0) {
                    // Two-stage special attack (180 dmg each)
                    this.performSpecialSlash(1); // First stage
                    setTimeout(() => this.performSpecialSlash(2), 200); // Second stage at 200ms
                    this.passiveStacks--;
                    if (this.isPlayer) addKillMsg(`Special Slash! (${this.passiveStacks} stacks left)`);
                } else {
                    // Regular slash (110 dmg)
                    particles.push(new Slash(this.x, this.y, this.angle, 100, Math.PI/2, '#C0A080'));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            let angle = Math.atan2(e.y-this.y, e.x-this.x);
                            let angleDiff = Math.abs(this.angle - angle);
                            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                            if (d < 110 && angleDiff < Math.PI/2.5) {
                                e.takeDamage(110, this);
                            }
                        }
                    }
                }
            }
            
            performSpecialSlash(stage) {
                const isStarArmy = this.currentSkin === 'Star Army';
                let color = isStarArmy ? '#67e8f9' : (stage === 1 ? '#FFD700' : '#FF6347');
                particles.push(new Slash(this.x, this.y, this.angle, 140, Math.PI/1.5, color));
                
                // Deal 220 damage per stage for the enhanced basic attack
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        let angle = Math.atan2(e.y-this.y, e.x-this.x);
                        let angleDiff = Math.abs(this.angle - angle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (d < 130 && angleDiff < Math.PI/2) {
                            e.takeDamage(220, this);
                            for(let i=0;i<8;i++) particles.push(new Particle(e.x, e.y, color, 3, 0.4));
                        }
                    }
                }
            }
            
            swordEnergy() {
                this.revealTimer = 0.5;
                this.qCD = 6;
                
                // Charge passive stack
                if (this.passiveStacks < this.maxPassiveStacks) {
                    this.passiveStacks++;
                }
                
                const isStarArmy = this.currentSkin === 'Star Army';
                const trailColor = isStarArmy ? '#67e8f9' : '#FFD700';
                // Create moon-shaped sword energy (not projectile)
                let moonEnergy = {
                    x: this.x,
                    y: this.y,
                    angle: this.angle,
                    speed: 600,
                    lifetime: 1.2,
                    damage: 870,
                    radius: 50,
                    team: this.team,
                    stun: 0.5,
                    owner: this,
                    hitEnemies: []
                };
                
                moonShapes.push(moonEnergy);
                
                // Visual effect
                for(let i=0;i<20;i++) {
                    let angle = this.angle + (Math.random() - 0.5) * Math.PI / 3;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(400);
                    particles.push(new Particle(this.x, this.y, trailColor, 3, 0.6, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Sword Energy! ⚔️');
            }
            
            dashAbility() {
                this.revealTimer = 0.5;
                this.eCD = 6;
                
                // Charge passive stack
                if (this.passiveStacks < this.maxPassiveStacks) {
                    this.passiveStacks++;
                }
                
                this.dashing = true;
                this.dashTimer = 0.4;
                this.stunImmuneTimer = 0.5;
                
                let dashDist = 300;
                let dx = Math.cos(this.angle) * dashDist;
                let dy = Math.sin(this.angle) * dashDist;
                this.x += dx;
                this.y += dy;
                
                // Dash particles
                for(let i=0;i<15;i++) {
                    let angle = this.angle + (Math.random() - 0.5) * Math.PI;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                    particles.push(new Particle(this.x, this.y, this.currentSkin === 'Star Army' ? '#67e8f9' : '#87CEEB', 2, 0.5, vel.x, vel.y));
                }
                
                // Heal and shield at dash location
                this.hp = Math.min(this.maxHp, this.hp + 341);
                this.shield = Math.min(this.maxHp * 0.5, this.shield + 341);
                
                if (this.isPlayer) addKillMsg('Dash! 💨');
            }
            
            rangedRush() {
                this.revealTimer = 0.5;
                this.fCD = 15;
                
                // Charge passive stack
                if (this.passiveStacks < this.maxPassiveStacks) {
                    this.passiveStacks++;
                }
                
                const isStarArmy = this.currentSkin === 'Star Army';
                const rushColor = isStarArmy ? '#67e8f9' : '#FF1493';
                // Find closest enemy in 500 range
                let closestEnemy = null;
                let closestDist = 500;
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < closestDist) {
                            closestDist = d;
                            closestEnemy = e;
                        }
                    }
                }
                
                if (closestEnemy) {
                    // Rush toward enemy
                    let dx = closestEnemy.x - this.x;
                    let dy = closestEnemy.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist > 0) {
                        // Rush toward the enemy
                        let rushDist = Math.min(400, dist);
                        this.x += (dx / dist) * rushDist;
                        this.y += (dy / dist) * rushDist;
                        
                        // Knock back the enemy
                        let knockDist = 250;
                        closestEnemy.x += (dx / dist) * knockDist;
                        closestEnemy.y += (dy / dist) * knockDist;
                        
                        // Damage, injured, and stun
                        closestEnemy.takeDamage(1000, this);
                        closestEnemy.injuredTimer = 8;
                        closestEnemy.applyStatus('stun', 1, this);
                        
                        // Mark target
                        this.markedTarget = closestEnemy;
                        
                        // Rush particles
                        for(let i=0;i<25;i++) {
                            let angle = this.angle + (Math.random() - 0.5) * Math.PI / 2;
                            let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(300);
                            particles.push(new Particle(this.x, this.y, rushColor, 4, 0.7, vel.x, vel.y));
                        }
                        
                        if (this.isPlayer) addKillMsg('Ranged Rush! ⚔️');
                    }
                }
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if (d > 350) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0 && Math.random() < 0.5) this.basicAttack();
                    if (this.qCD <= 0 && Math.random() < 0.2) this.swordEnergy();
                    if (this.eCD <= 0 && Math.random() < 0.15 && d > 200) this.dashAbility();
                    if (this.fCD <= 0 && Math.random() < 0.1) this.rangedRush();
                }
                
                // Recharge passive stacks over time
                if (Math.random() < 0.05 && this.passiveStacks < this.maxPassiveStacks) {
                    this.passiveStacks++;
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                if(this.dead)return;
                super.draw(ctx);
                
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                const isStarArmy = this.currentSkin === 'Star Army';
                const bladeColor = isStarArmy ? '#67e8f9' : '#C0A080';
                const guardColor = isStarArmy ? '#22d3ee' : '#FFD700';
                const linkColor = isStarArmy ? '#67e8f9' : '#FF1493';
                
                // Draw katana sword
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.angle);
                
                // Blade
                ctx.fillStyle = bladeColor;
                ctx.fillRect(5, -3, 35, 6);
                // Guard
                ctx.fillStyle = guardColor;
                ctx.fillRect(3, -8, 4, 16);
                // Handle
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(0, -2, 3, 4);
                if (isStarArmy) {
                    ctx.shadowColor = '#67e8f9'; ctx.shadowBlur = 14; ctx.fillStyle = '#dffcff'; ctx.fillRect(8, -1, 28, 2);
                }
                
                ctx.restore();
                
                // Passive stacks indicator
                ctx.fillStyle = isStarArmy ? '#67e8f9' : '#FFD700';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`▲ ${this.passiveStacks}/${this.maxPassiveStacks}`, screenX, screenY - 35);
                
                // Marked target indicator
                if (this.markedTarget && !this.markedTarget.dead) {
                    ctx.strokeStyle = linkColor;
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.lineTo(this.markedTarget.x - camera.x, this.markedTarget.y - camera.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        }

        class Gigi extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, '#6A5ACD', 7100);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Gigi)" : "Enemy Gigi";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 240;
                this.speed = 240;
                this.pixelBots = [];
                this.arenaActive = false;
                this.arenaTimer = 0;
                this.pixelResource = 0;
                this.maxPixelResource = 3;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                // Arena effect
                if (this.arenaActive) {
                    this.arenaTimer -= dt;
                    if (this.arenaTimer <= 0) {
                        this.arenaActive = false;
                    }
                    
                    // Apply true damage to highest HP enemy inside arena every second
                    let damageInterval = 1.0;
                    if (!this.lastArenaApply) this.lastArenaApply = 0;
                    this.lastArenaApply -= dt;
                    
                    if (this.lastArenaApply <= 0) {
                        let highestHPEnemy = null;
                        let highestHP = 0;
                        let arenaRadius = 300;
                        
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let dist = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                // Only damage enemies inside arena
                                if (dist <= arenaRadius && e.hp > highestHP) {
                                    highestHP = e.hp;
                                    highestHPEnemy = e;
                                }
                            }
                        }
                        
                        if (highestHPEnemy) {
                            let trueDamage = highestHPEnemy.maxHp * 0.025; // 2.5% max HP true damage
                            highestHPEnemy.hp -= trueDamage;
                            if (highestHPEnemy.hp < 0) highestHPEnemy.hp = 0;
                            
                            // Damage particle
                            particles.push(new Particle(highestHPEnemy.x, highestHPEnemy.y, '#00D9FF', 3, 0.5));
                        }
                        
                        this.lastArenaApply = damageInterval;
                    }
                    
                    // Speed boost in arena
                    this.speed = this.baseSpd * 2;
                } else {
                    this.speed = this.baseSpd;
                }
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAttack();
                if (keys.q && this.qCD <= 0) this.summonPixelBots();
                if (keys.e && this.eCD <= 0) this.excessiveGrinding();
                if (keys.f && this.fCD <= 0) this.pixelArena();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAttack() {
                this.revealTimer = 0.5;
                this.basicCD = 0.6;
                
                // Pixel throw projectile
                let proj = new Projectile(this, this.x, this.y, this.angle, 600, 60, 300, '#00FF00', 3);
                proj.maxDistance = 300;
                entities.push(proj);
            }
            
            summonPixelBots() {
                this.revealTimer = 0.5;
                this.qCD = 8;
                
                // Summon 3 pixel bots
                for (let i = 0; i < 3; i++) {
                    let angle = (i / 3) * Math.PI * 2;
                    let summonDist = 50;
                    let bx = this.x + Math.cos(angle) * summonDist;
                    let by = this.y + Math.sin(angle) * summonDist;
                    
                    let bot = new PixelBot(bx, by, this);
                    this.pixelBots.push(bot);
                    entities.push(bot);
                    
                    // Summon particles
                    for (let j = 0; j < 8; j++) {
                        let pAngle = Math.random() * Math.PI * 2;
                        let vel = new Vector2(Math.cos(pAngle), Math.sin(pAngle)).mult(150);
                        particles.push(new Particle(bx, by, '#9B59B6', 2, 0.4, vel.x, vel.y));
                    }
                }
                
                if (this.isPlayer) addKillMsg('Pixel Bots Summoned! 👾');
            }
            
            excessiveGrinding() {
                this.revealTimer = 0.5;
                this.eCD = 10;
                
                // Heal all teammates by 420
                let healed = 0;
                for (let e of entities) {
                    if (e instanceof Entity && !e.dead && e.team === this.team) {
                        let oldHP = e.hp;
                        e.hp = Math.min(e.maxHp, e.hp + 420);
                        healed += (e.hp - oldHP);
                        
                        // Heal particles
                        for (let i = 0; i < 5; i++) {
                            particles.push(new Particle(e.x, e.y, '#00D9FF', 2, 0.5));
                        }
                    }
                }
                
                // Reduce Q cooldown by 4 seconds
                this.qCD = Math.max(0, this.qCD - 4);
                
                if (this.isPlayer) addKillMsg(`Team Healed +${Math.ceil(healed)}!`);
            }
            
            pixelArena() {
                this.revealTimer = 0.5;
                this.fCD = 26;
                this.arenaActive = true;
                this.arenaTimer = 10;
                this.lastArenaApply = 0;
                
                // Arena particles
                for (let i = 0; i < 30; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 150 + Math.random() * 50;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(100);
                    particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, '#00D9FF', 3, 0.8, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Pixel Arena Activated! 🎮');
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if (d > 300) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0 && Math.random() < 0.4) this.basicAttack();
                    if (this.qCD <= 0 && Math.random() < 0.15) this.summonPixelBots();
                    if (this.eCD <= 0 && Math.random() < 0.1 && this.hp < this.maxHp * 0.6) this.excessiveGrinding();
                    if (this.fCD <= 0 && Math.random() < 0.08) this.pixelArena();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                if(this.dead)return;
                super.draw(ctx);
                
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // Draw pixel gamer character
                ctx.fillStyle = '#6A5ACD';
                // Head
                ctx.fillRect(screenX - 6, screenY - 12, 12, 10);
                // Body
                ctx.fillRect(screenX - 8, screenY - 2, 16, 10);
                // Arms
                ctx.fillRect(screenX - 12, screenY - 4, 4, 6);
                ctx.fillRect(screenX + 8, screenY - 4, 4, 6);
                
                // Eyes (white pixels)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(screenX - 4, screenY - 10, 2, 2);
                ctx.fillRect(screenX + 2, screenY - 10, 2, 2);
                
                // Arena ring indicator
                if (this.arenaActive) {
                    ctx.strokeStyle = '#00D9FF';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 300, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Arena timer
                    ctx.fillStyle = '#00D9FF';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.ceil(this.arenaTimer)}s`, screenX, screenY - 30);
                }
            }
        }

        class Yun extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, '#FFB300', 5800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Yun)" : "Enemy Yun";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 275;
                this.speed = 275;
                this.stabbing = false;
                this.stabTimer = 0;
                this.immuneTimer = 0;
                this.enhancedBasicActive = false;
                this.skyscraperActive = false;
                this.skyscraperTimer = 0;
                this.totalDamageDealtInScraper = 0;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.immuneTimer > 0) this.immuneTimer -= dt;
                
                if (this.skyscraperActive) {
                    this.skyscraperTimer -= dt;
                    if (this.skyscraperTimer <= 0) {
                        this.skyscraperActive = false;
                        // Heal based on 50% of damage dealt
                        this.hp = Math.min(this.maxHp, this.hp + this.totalDamageDealtInScraper * 0.5);
                        this.totalDamageDealtInScraper = 0;
                    }
                    
                    // Deal 50 damage per second in 200 radius
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < 200) {
                                e.takeDamage(50 * dt, this);
                                this.totalDamageDealtInScraper += 50 * dt;
                            }
                        }
                    }
                }
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let moveSpeed = this.stabbing ? spd * 0.35 : spd;
                    let m = new Vector2(dx, dy).norm().mult(moveSpeed * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAttack();
                if (keys.q && this.qCD <= 0) this.spearStabs();
                if (keys.e && this.eCD <= 0) this.immunityMode();
                if (keys.f && this.fCD <= 0) this.ultimateJump();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAttack() {
                this.revealTimer = 0.5;
                this.basicCD = 1.5;
                
                if (this.enhancedBasicActive) {
                    // Dash briefly before the enhanced strike so it behaves like a burst-in attack
                    this.x += Math.cos(this.angle) * 120;
                    this.y += Math.sin(this.angle) * 120;
                    particles.push(new Slash(this.x, this.y, this.angle, 140, Math.PI/2, '#FF6B6B'));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            let angle = Math.atan2(e.y-this.y, e.x-this.x);
                            let angleDiff = Math.abs(this.angle - angle);
                            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                            if (d < 160 && angleDiff < Math.PI/2.5) {
                                e.takeDamage(600, this);
                                if (this.skyscraperActive) this.totalDamageDealtInScraper += 600;
                            }
                        }
                    }
                    this.enhancedBasicActive = false;
                } else {
                    // Regular spear attack: 200 damage
                    particles.push(new Slash(this.x, this.y, this.angle, 100, Math.PI/2, '#FFB300'));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            let angle = Math.atan2(e.y-this.y, e.x-this.x);
                            let angleDiff = Math.abs(this.angle - angle);
                            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                            if (d < 100 && angleDiff < Math.PI/2.5) {
                                e.takeDamage(200, this);
                                if (this.skyscraperActive) this.totalDamageDealtInScraper += 200;
                            }
                        }
                    }
                }
            }
            
            spearStabs() {
                this.revealTimer = 0.5;
                this.qCD = 10;
                this.stabbing = true;
                this.stabTimer = 0;
                let stabCount = 0;
                const maxStabs = 50;
                const stabInterval = 0.05;
                
                const stabLoop = setInterval(() => {
                    if (!this.stabbing || stabCount >= maxStabs) {
                        clearInterval(stabLoop);
                        this.stabbing = false;
                        return;
                    }
                    
                    // Visual effect for each stab (longer reach)
                    particles.push(new Slash(this.x, this.y, this.angle, 220, Math.PI/3, '#FFD700'));
                    
                    // Deal damage to nearby enemies
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            let angle = Math.atan2(e.y-this.y, e.x-this.x);
                            let angleDiff = Math.abs(this.angle - angle);
                            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                            if (d < 220 && angleDiff < Math.PI/2) {
                                e.takeDamage(50, this);
                                e.slowTimer = Math.max(e.slowTimer, 0.3); // Slow enemies
                                if (this.skyscraperActive) this.totalDamageDealtInScraper += 50;
                            }
                        }
                    }
                    
                    // Heal Yun slightly less to keep sustain in check without a heavy nerf
                    this.hp = Math.min(this.maxHp, this.hp + 20);
                    
                    stabCount++;
                }, stabInterval * 1000);
                
                if (this.isPlayer) addKillMsg('Spear Stabs!');
            }
            
            immunityMode() {
                this.revealTimer = 0.5;
                this.eCD = 6;
                this.immuneTimer = 1;
                this.enhancedBasicActive = true;
                // brief forward burst before the enhanced basic can hit
                this.x += Math.cos(this.angle) * 40;
                this.y += Math.sin(this.angle) * 40;
                
                // Visual indicator
                for(let i=0;i<20;i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                    particles.push(new Particle(this.x, this.y, '#00FF00', 3, 1, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Immunity Mode!');
            }
            
            ultimateJump() {
                this.revealTimer = 0.5;
                this.fCD = 18;
                
                // Determine jump direction (to mouse or up to 350 radius)
                let dx = mouse.x - (CANVAS.width/2);
                let dy = mouse.y - (CANVAS.height/2);
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                // Jump up to 350 units toward mouse; if mouse within 350, jump exactly to it
                let maxJump = 350;
                if (dist > 0) {
                    if (dist <= maxJump) {
                        // Move exactly to mouse offset (mouse coords are relative to screen center)
                        this.x += dx;
                        this.y += dy;
                    } else {
                        let direction = new Vector2(dx, dy).norm();
                        this.x += direction.x * maxJump;
                        this.y += direction.y * maxJump;
                    }
                    this.angle = Math.atan2(dy, dx);
                }
                
                // Damage in 300 radius
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < 300) {
                            e.takeDamage(800, this);
                            
                            // Knockback
                            let knockAngle = Math.atan2(e.y - this.y, e.x - this.x);
                            let knockDist = 200;
                            e.x += Math.cos(knockAngle) * knockDist;
                            e.y += Math.sin(knockAngle) * knockDist;
                        }
                    }
                }
                
                // Strong, distinct explosion visuals for Yun ultimate
                for (let i = 0; i < 48; i++) {
                    let a = (i / 48) * Math.PI * 2;
                    let speed = 300 + Math.random() * 400;
                    let vx = Math.cos(a) * speed * (0.8 + Math.random() * 0.8);
                    let vy = Math.sin(a) * speed * (0.8 + Math.random() * 0.8);
                    let col = (i % 3 === 0) ? '#FF4500' : (i % 3 === 1 ? '#FFD700' : '#FFFFFF');
                    particles.push(new Particle(this.x, this.y, col, 6, 0.9, vx, vy));
                }
                // Add a bright shockwave slash (large radius) to emphasize impact
                particles.push(new Slash(this.x, this.y, 0, 420, Math.PI * 2, '#FFFFFF'));

                // Add a ring effect for the ultimate impact
                ringEffects.push({ x: this.x, y: this.y, life: 0.9, duration: 0.9, maxRadius: 420, color: '#FFFFFF' });

                // Activate skyscraper mode
                this.skyscraperActive = true;
                this.skyscraperTimer = 10;
                this.totalDamageDealtInScraper = 0;
                this.speed = this.baseSpd * 1.4; // 40% speed boost
                // tiny sustain nerf: heal from skyscraper only slightly less
                if (this.skyscraperActive) {
                    this.hp = Math.min(this.maxHp, this.hp + 30);
                }
                
                // Jump particles
                for(let i=0;i<30;i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(400);
                    particles.push(new Particle(this.x, this.y, '#FF4500', 4, 0.8, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Sky Scrapper!');
            }
            
            takeDamage(dmg, attacker) {
                if (this.immuneTimer > 0) {
                    // Immune to damage
                    return;
                }
                
                // Apply 20% damage reduction in skyscraper mode
                if (this.skyscraperActive) {
                    dmg *= 0.8;
                }
                
                super.takeDamage(dmg, attacker);
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                // Reduce speed while stabbing
                let effectiveSpd = this.stabbing ? spd * 0 : spd;
                
                if (d > 350) {
                    this.x += Math.cos(this.angle) * effectiveSpd * dt;
                    this.y += Math.sin(this.angle) * effectiveSpd * dt;
                } else {
                    if (this.basicCD <= 0 && Math.random() < 0.4) this.basicAttack();
                    if (this.qCD <= 0 && Math.random() < 0.2 && !this.stabbing) this.spearStabs();
                    if (this.eCD <= 0 && Math.random() < 0.15) this.immunityMode();
                    if (this.fCD <= 0 && Math.random() < 0.08) this.ultimateJump();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                if(this.dead)return;
                super.draw(ctx);
                
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // Draw spear
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.angle);
                
                // Spear shaft
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(5, -2, 40, 4);
                // Spear head
                ctx.fillStyle = '#FFB300';
                ctx.beginPath();
                ctx.moveTo(45, 0);
                ctx.lineTo(48, -8);
                ctx.lineTo(42, 0);
                ctx.lineTo(48, 8);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                
                // Immunity indicator
                if (this.immuneTimer > 0) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Skyscraper mode indicator
                if (this.skyscraperActive) {
                    ctx.strokeStyle = '#FF4500';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 200, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Pulsing glow effect for skyscraper aura (distinct from Gigi)
                    let pulsePhase = (Date.now() / 500) % 1;
                    let pulseOpacity = 0.2 + Math.sin(pulsePhase * Math.PI * 2) * 0.2;
                    ctx.save();
                    ctx.globalAlpha = pulseOpacity;
                    ctx.fillStyle = '#FF4500';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 200 + Math.sin(pulsePhase * Math.PI * 2) * 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    
                    // Skyscraper timer
                    ctx.fillStyle = '#FF4500';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${Math.ceil(this.skyscraperTimer)}s`, screenX, screenY - 30);
                }
            }
        }

        class Wither extends Entity {
            constructor(x, y) {
                super(x, y, 25, '#1a1a1a', 25000);
                this.team = 99; // Neutral team
                this.name = "Wither Boss";
                this.baseSpd = 80; // Slow movement speed
                this.speed = 80;
                this.isPlayer = false;
                this.attackTimer = 0;
                this.attackCooldown = 10;
                this.countsAsFFAHero = false;
            }
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                // Attack timer
                if (this.attackTimer > 0) {
                    this.attackTimer -= dt;
                } else {
                    this.attack();
                    this.attackTimer = this.attackCooldown;
                }
                
                // Movement - find nearest enemy and move towards them
                let target = this.findTarget();
                if (target) {
                    let dx = target.x - this.x;
                    let dy = target.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        this.x += (dx / dist) * this.speed * dt;
                        this.y += (dy / dist) * this.speed * dt;
                        this.angle = Math.atan2(dy, dx);
                    }
                }
                
                // Keep in bounds
                this.x = Math.max(20, Math.min(WORLD_SIZE - 20, this.x));
                this.y = Math.max(20, Math.min(WORLD_SIZE - 20, this.y));
            }
            findTarget() {
                let closest = null;
                let closestDist = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < closestDist) {
                            closestDist = d;
                            closest = e;
                        }
                    }
                }
                return closest;
            }
            attack() {
                // Deal 800 damage in 300 radius
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < 300) {
                            e.takeDamage(800, this);
                        }
                    }
                }
                // Visual effect
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(this.x + (Math.random() - 0.5) * 300, this.y + (Math.random() - 0.5) * 300, '#1a1a1a', 4, 0.5));
                }
            }
            draw(ctx) {
                super.draw(ctx);
                // Blue dot indicator
                ctx.fillStyle = '#0000FF';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            takeDamage(dmg, attacker) {
                super.takeDamage(dmg, attacker);
                if (this.dead && attacker) {
                    // Apply Wither buff to killer
                    attacker.witherBuffTimer = 20;
                    attacker.witherBuffMaxShield = Math.floor(attacker.maxHp * 0.15);
                    attacker.witherBuff = true;
                    attacker.shield = attacker.witherBuffMaxShield;
                    if (attacker.isPlayer) addKillMsg('WITHER DEFEATED! +20s Buff!');
                }
            }
        }

        class FallenStatue extends Entity {
            constructor(x, y) {
                super(x, y, 30, '#2a1a4a', 9000);
                this.team = 99; // Neutral team
                this.name = "Fallen Statue";
                this.baseSpd = 0;
                this.speed = 0;
                this.isPlayer = false;
                this.isStatue = true;
                this.countsAsFFAHero = false;
            }
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                // Statues don't move or attack, just exist
            }
            attack() {
                // Does nothing
            }
            draw(ctx) {
                super.draw(ctx);
                // Dark purple outline indicator
                ctx.strokeStyle = '#4a2a6a';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 5, 0, Math.PI * 2);
                ctx.stroke();
            }
            takeDamage(dmg, attacker) {
                super.takeDamage(dmg, attacker);
                if (this.dead && attacker) {
                    const teamToIgnore = attacker && attacker.team !== undefined ? attacker.team : null;
                    for (let e of entities) {
                        if (e instanceof Entity && !e.dead && e !== this && e !== attacker && (teamToIgnore === null || e.team !== teamToIgnore)) {
                            e.applyStatus('stun', 3, attacker);
                            e.applyStatus('reveal', 10, attacker);
                        }
                    }
                    attacker.resistanceBoostTimer = 30;
                    attacker.damagePenetrationBoostTimer = 30;
                    attacker.damagePenetrationBoost = 0.20;
                    attacker.resistanceBoost = 0.20;
                    if (attacker.isPlayer) addKillMsg('FALLEN STATUE DEFEATED! +20% resistance and +20% penetration for 30s!');
                }
            }
        }

        class Firework extends Entity {
            constructor(x,y,owner){
                super(x,y,0,'#009c3b',1);
                this.owner = owner;
                this.team = owner.team;
                this.timer=1.0;
                this.hasExploded = false;
                this.countsAsFFAHero = false;
            }
            update(dt){
                if(this.owner && !this.owner.dead){
                    let dx = this.owner.x - this.x;
                    let dy = this.owner.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if(dist > 20){
                        this.x += (dx/dist) * 300 * dt;
                        this.y += (dy/dist) * 300 * dt;
                    }
                }
                this.timer-=dt;
                if(this.timer<=0 && !this.hasExploded){
                    for(let e of entities) if(e!==this && !e.dead && e instanceof Entity && e.team!==this.team){
                        let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2);
                        if(d<250){
                            e.takeDamage(300,this.owner);
                            e.slowTimer = Math.max(e.slowTimer, 3.0); // slowness III for 3s
                        }
                    }
                    for(let i=0;i<20;i++) particles.push(new Particle(this.x,this.y,'#ffdf00',8,1.0));
                    this.hasExploded = true;
                    this.dead=true;
                }
            }
            draw(ctx){
                if(this.timer>0){
                    ctx.fillStyle='#009c3b';
                    ctx.beginPath();
                    ctx.arc(this.x-camera.x,this.y-camera.y,10,0,Math.PI*2);
                    ctx.fill();
                }
            }
        }

        class Blizzard extends Entity {
            constructor(owner, x, y, angle) {
                super(x, y, 0, '#ffffff', 1);
                this.owner = owner;
                this.team = owner.team;
                this.angle = angle;
                this.timer = 3;
                this.damageTimer = 0;
                this.length = 3000;
                this.width = 400;
                this.countsAsFFAHero = false;
            }

            update(dt) {
                this.timer -= dt;
                this.damageTimer -= dt;
                if (this.timer <= 0) {
                    this.del = true;
                    return;
                }
                if (this.damageTimer <= 0) {
                    this.damageTimer = 0.3;
                    // Damage enemies in rectangle
                    for (let e of entities) {
                        if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y;
                            let localX = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
                            let localY = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
                            if (localX >= 0 && localX <= this.length && Math.abs(localY) <= this.width / 2) {
                                e.takeDamage(150, this.owner);
                            }
                        }
                    }
                }
                // Snow particles
                for (let i = 0; i < 5; i++) {
                    let px = this.x + Math.random() * this.length * Math.cos(this.angle);
                    let py = this.y + Math.random() * this.length * Math.sin(this.angle);
                    particles.push(new Particle(px, py, '#ffffff', 2, 0.5));
                }
            }

            draw(ctx) {
                // Optional: draw blizzard area
            }
        }

        class Minion extends Entity {
            constructor(x, y, owner) {
                super(x, y, 8, '#ff4500', 250);
                this.owner = owner;
                this.team = owner.team;
                this.speed = owner.baseSpd * 4.5;
                this.hasAttacked = false;
                this.countsAsFFAHero = false;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.hasAttacked) { this.dead = true; return; }
                // Add fire particles
                particles.push(new Particle(this.x, this.y, '#ff4500', 2, 0.3));
                let t = this.findTarget();
                if (!t) return;
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);
                if (d > 10) {
                    this.x += Math.cos(this.angle) * this.speed * dt;
                    this.y += Math.sin(this.angle) * this.speed * dt;
                } else {
                    t.takeDamage(200, this.owner);
                    t.burnTimer += 5;
                    t.burnOwner = this.owner;
                    this.hasAttacked = true;
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            draw(ctx) {
                super.draw(ctx);
            }
        }

        class PixelBot extends Entity {
            constructor(x, y, owner) {
                super(x, y, 10, '#6A5ACD', 500);
                this.owner = owner;
                this.team = owner.team;
                this.speed = 300;
                this.lifetime = 30; // 30 seconds lifetime
                this.hasAttacked = false;
                this.hidden = false;
                this.countsAsFFAHero = false;
            }
            
            update(dt) {
                if (this.dead) {
                    this.hidden = true;
                    if (this.owner && this.owner.pixelBots) {
                        let idx = this.owner.pixelBots.indexOf(this);
                        if (idx !== -1) this.owner.pixelBots.splice(idx, 1);
                    }
                    return;
                }
                this.updateCommon(dt);
                
                this.lifetime -= dt;
                if (this.lifetime <= 0) {
                    this.dead = true;
                    this.hidden = true;
                    if (this.owner && this.owner.pixelBots) {
                        let idx = this.owner.pixelBots.indexOf(this);
                        if (idx !== -1) this.owner.pixelBots.splice(idx, 1);
                    }
                    return;
                }
                
                if (this.hasAttacked) return;
                
                // Pixel bot particles
                if (Math.random() < 0.3) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*10, this.y + (Math.random()-0.5)*10, '#9B59B6', 1, 0.4));
                }
                
                let t = this.findTarget();
                if (!t) return;
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);
                
                if (d > 20) {
                    this.x += Math.cos(this.angle) * this.speed * dt;
                    this.y += Math.sin(this.angle) * this.speed * dt;
                } else {
                    // Deal 250 damage and stun for 0.5s
                    t.takeDamage(250, this.owner);
                    t.applyStatus('stun', 0.5, this.owner);
                    
                    // Hit particles
                    for(let i=0;i<12;i++) {
                        let angle = Math.random() * Math.PI * 2;
                        let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(150);
                        particles.push(new Particle(t.x, t.y, '#00D9FF', 2, 0.5, vel.x, vel.y));
                    }
                    
                    this.hasAttacked = true;
                    this.dead = true;
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }
            
            draw(ctx) {
                if (this.hidden) return;
                super.draw(ctx);
                
                // Draw pixel art bot
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                ctx.fillStyle = '#6A5ACD';
                ctx.fillRect(screenX - 8, screenY - 8, 16, 16);
                ctx.fillStyle = '#00D9FF';
                ctx.fillRect(screenX - 6, screenY - 6, 12, 12);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(screenX - 3, screenY - 3, 3, 3);
                ctx.fillRect(screenX + 1, screenY - 3, 3, 3);
            }
        }

