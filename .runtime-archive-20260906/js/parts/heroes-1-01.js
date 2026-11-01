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
