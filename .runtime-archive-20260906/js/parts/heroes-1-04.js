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

