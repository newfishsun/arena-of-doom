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

