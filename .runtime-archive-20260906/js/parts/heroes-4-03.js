        class Ambrose extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#2C1B47' : '#1a0d2e', 5400);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Ambrose)" : "Enemy Ambrose";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 250;
                this.speed = 250;
                
                // Q ability: Dark self teleport
                this.enhancedBasicActive = false;
                this.enhancedBasicTimer = 0;
                
                // F ability: Raven pull
                this.ravensActive = [];
                this.ravenPullActive = false;
                this.ravenPullSpeed = 0;
                this.ravenPullDirection = 0;
                this.ravenPullTimer = 0;
                this.ravenPullTarget = null;
                
                // Toxin marked enemies
                this.markedEnemies = new Map(); // enemy -> timer
                this.toxinTimer = 0;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                // Track enhanced basic
                if (this.enhancedBasicActive) {
                    this.enhancedBasicTimer -= dt;
                    if (this.enhancedBasicTimer <= 0) {
                        this.enhancedBasicActive = false;
                    }
                }
                
                // Raven pull movement
                if (this.ravenPullActive) {
                    this.ravenPullTimer -= dt;
                    if (this.ravenPullTimer > 0 && this.ravenPullTarget && !this.ravenPullTarget.dead) {
                        // Recalculate direction toward target every frame
                        let dx = this.ravenPullTarget.x - this.x;
                        let dy = this.ravenPullTarget.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist > 0) {
                            let dirX = dx / dist;
                            let dirY = dy / dist;
                            this.x += dirX * this.ravenPullSpeed * dt;
                            this.y += dirY * this.ravenPullSpeed * dt;
                        }
                        // Check if reached target
                        if (dist < 50) {
                            this.ravenPullActive = false;
                            // Stun target for 1.5s after pull completes
                                this.ravenPullTarget.applyStatus('stun', 1.5, this);
                        }
                    } else {
                        this.ravenPullActive = false;
                    }
                }
                
                // Update marked enemy timers (for emoji display) - clean up expired marks
                let marksToDelete = [];
                for (let [e, data] of this.markedEnemies) {
                    if (typeof data === 'object') {
                        data.timer -= dt;
                        if (data.timer <= 0 || e.dead) {
                            marksToDelete.push(e);
                        }
                    }
                }
                // Delete expired marks
                for (let e of marksToDelete) {
                    this.markedEnemies.delete(e);
                }
                
                if (this.stunTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            
            input(dt, spd) {
                // Cannot control during raven pull
                if (this.ravenPullActive) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
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
                if (keys.q && this.qCD <= 0) this.darkSelf();
                if (keys.e && this.eCD <= 0) this.darkCircle();
                if (keys.f && this.fCD <= 0) this.ravenUltimate();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = this.enhancedBasicActive ? 0.5 : 1.0;
                
                if (this.enhancedBasicActive) {
                    // Enhanced dark claw - melee attack
                    let hitTarget = false;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 120) {
                                let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                                if (ad > Math.PI) ad = 2 * Math.PI - ad;
                                if (ad < 0.4) {
                                    let baseDmg = 200;
                                    e.takeDamage(baseDmg, this);
                                    // Apply 15% toxin damage after 0.1s
                                    let toxinDmg = baseDmg * 0.15;
                                    setTimeout(() => {
                                        if (!e.dead) e.takeDamage(toxinDmg, this);
                                    }, 100);
                                    hitTarget = true;
                                    // Dark claw slash effect
                                    for (let i = 0; i < 8; i++) {
                                        let angle = this.angle + (i - 3.5) * 0.15;
                                        particles.push(new Particle(e.x + Math.cos(angle)*50, e.y + Math.sin(angle)*50, '#6a2e6e', 4, 0.5));
                                    }
                                    e.revealTimer = 1.0;
                                }
                            }
                        }
                    }
                    // Draw visible slash effect at Ambrose's attack angle
                    if (hitTarget) {
                        for (let i = 0; i < 6; i++) {
                            let offsetAngle = this.angle + (Math.random() - 0.5) * 0.5;
                            let dist = 60 + Math.random() * 30;
                            particles.push(new Particle(this.x + Math.cos(offsetAngle)*dist, this.y + Math.sin(offsetAngle)*dist, '#a855f7', 5, 0.4));
                        }
                    } else {
                        // Show claw slash even if it misses
                        for (let i = 0; i < 5; i++) {
                            let offsetAngle = this.angle + (i - 2) * 0.2;
                            let dist = 80 + Math.random() * 20;
                            particles.push(new Particle(this.x + Math.cos(offsetAngle)*dist, this.y + Math.sin(offsetAngle)*dist, '#4a0e4e', 4, 0.3));
                        }
                    }
                    if (this.isPlayer) addKillMsg('Dark Claw!');
                } else {
                    // Basic dark energy ball
                    let proj = new Projectile(this, this.x, this.y, this.angle + (Math.random()-0.5)*0.15, 450, 150, 300, '#4a0e4e', 6);
                    proj.maxDistance = 300;
                    proj.onHit = (target) => {
                        // Apply 15% toxin damage after 0.1s
                        let baseDmg = 150;
                        let toxinDmg = baseDmg * 0.15;
                        setTimeout(() => {
                            if (!target.dead) target.takeDamage(toxinDmg, this);
                        }, 100);
                        // Dark particles on hit
                        for (let i = 0; i < 3; i++) {
                            particles.push(new Particle(proj.x + (Math.random()-0.5)*20, proj.y + (Math.random()-0.5)*20, '#6a2e6e', 2, 0.3));
                        }
                    };
                    entities.push(proj);
                }
            }
            
            darkSelf() {
                this.qCD = 10;
                this.revealTimer = 1.0;
                
                // Throw dark self projectile (size of player)
                let proj = new Projectile(this, this.x, this.y, this.angle, 1000, 700, 600, '#2C1B47', 20);
                proj.maxDistance = 600;
                
                proj.onHit = (target) => {
                    // Teleport Ambrose to target
                    this.x = target.x;
                    this.y = target.y;
                    
                    // Unlock enhanced basic for 5s
                    this.enhancedBasicActive = true;
                    this.enhancedBasicTimer = 5;
                    
                    // Dark particles
                    for (let i = 0; i < 12; i++) {
                        let angle = (i / 12) * Math.PI * 2;
                        particles.push(new Particle(this.x + Math.cos(angle)*80, this.y + Math.sin(angle)*80, '#4a0e4e', 4, 0.5));
                    }
                    
                    if (this.isPlayer) addKillMsg('Dark Self Teleport! Enhanced Basic Active!');
                };
                
                entities.push(proj);
                
                // Launch particles
                for (let i = 0; i < 8; i++) {
                    let angle = (i / 8) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*40, this.y + Math.sin(angle)*40, '#2C1B47', 3, 0.4));
                }
            }
            
            darkCircle() {
                this.eCD = 5;
                this.revealTimer = 1.0;
                
                let totalDmg = 0;
                
                // Deal damage to nearby enemies
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 300) {
                            let baseDmg = 750;
                            e.takeDamage(baseDmg, this);
                            totalDmg += baseDmg;
                            // Apply 15% toxin damage after 0.1s
                            let toxinDmg = baseDmg * 0.15;
                            setTimeout(() => {
                                if (!e.dead) e.takeDamage(toxinDmg, this);
                            }, 100);
                            
                            // Apply slowness
                            e.slowTimer = Math.max(e.slowTimer, 3);
                            e.slowMultiplier = 0.4;
                            
                            e.revealTimer = 1.0;
                        }
                    }
                }

                // E also grants enhanced basic attacks for 3s
                this.enhancedBasicActive = true;
                this.enhancedBasicTimer = 3;
                
                // Heal Ambrose 60% of damage dealt
                let healAmount = totalDmg * 0.6;
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                
                // Dark circle particles
                for (let i = 0; i < 15; i++) {
                    let angle = (i / 15) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*250, this.y + Math.sin(angle)*250, '#4a0e4e', 5, 0.6));
                }
                
                if (this.isPlayer) addKillMsg(`Dark Circle! Enhanced Basic + Healed +${Math.floor(healAmount)}`);
            }
            
            ravenUltimate() {
                this.fCD = 22;
                this.revealTimer = 1.5;
                
                // Find closest enemy
                let closest = null;
                let minDist = 10000;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < minDist) {
                            minDist = d;
                            closest = e;
                        }
                    }
                }
                
                if (closest) {
                    // Mark the target for 10s (for emoji display) and apply 15% toxin damage after 0.1s
                    this.markedEnemies.set(closest, {timer: 10, toxinDmg: 0});
                    let toxinDmg = 150 * 0.15;
                    setTimeout(() => {
                        if (!closest.dead) closest.takeDamage(toxinDmg, this);
                    }, 100);
                    
                    // Start raven pull with fixed 5x speed
                    this.ravenPullActive = true;
                    this.ravenPullTimer = 1.5;
                    // Fixed pull speed: 1250 (5x base speed of 250)
                    this.ravenPullSpeed = 1250;
                    let dx = closest.x - this.x, dy = closest.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    this.ravenPullDirection = dist > 0 ? Math.atan2(dy, dx) : 0;
                    this.ravenPullTarget = closest;
                    
                    // Gain stun immunity during pull
                    this.stunImmune = true;
                    setTimeout(() => { this.stunImmune = false; }, 1500);
                    
                    // Raven particles
                    for (let i = 0; i < 20; i++) {
                        let angle = (i / 20) * Math.PI * 2;
                        particles.push(new Particle(this.x + Math.cos(angle)*100, this.y + Math.sin(angle)*100, '#1a0d2e', 5, 0.7));
                    }
                    
                    if (this.isPlayer) addKillMsg('Raven Ultimate! 5x Speed Pull!');
                } else {
                    if (this.isPlayer) addKillMsg('No targets found!');
                }
            }
            
            takeDamage(amt, src) {
                // Check if marked - take 15% more toxic damage
                if (src && src instanceof Ambrose && src.markedEnemies.has(this)) {
                    amt *= 1.15; // 15% more damage when marked
                }
                super.takeDamage(amt, src);
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                if (this.ravenPullActive) return;
                
                let t = this.findTarget();
                if (!t) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if (d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.qCD <= 0 && Math.random() < 0.1) this.darkSelf();
                    if (this.eCD <= 0 && Math.random() < 0.12) this.darkCircle();
                    if (this.fCD <= 0 && Math.random() < 0.05) this.ravenUltimate();
                }
            }
            
            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < md) {
                            md = d;
                            c = e;
                        }
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
                super.draw(ctx);
                
                // Draw raven emoji on marked enemies (only if mark is still active)
                for (let [e, data] of this.markedEnemies) {
                    if (!e.dead && typeof data === 'object' && data.timer > 0.01) {
                        ctx.save();
                        ctx.font = 'bold 26px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - e.radius - 15;
                        ctx.fillText('🐦', screenX, screenY);
                        ctx.restore();
                    }
                }
                
                // Draw enhanced basic indicator
                if (this.enhancedBasicActive) {
                    ctx.strokeStyle = '#4a0e4e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 8, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            
            getDamageMult() { return 1; }
            getEffectiveSpeed() { 
                // Boost speed 2.3x when enhanced basic is active
                if (this.enhancedBasicActive) {
                    return this.speed * 2.3;
                }
                return this.speed; 
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Austin extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, '#FF6B35', 7000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Austin)" : "Enemy Austin";
                
                // Cooldowns
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                
                // Stats: 75% damage multiplier, 65% armor
                this.damageMultiplier = 0.75;
                this.armor = 0.65;
                
                // Base stats
                this.speed = 200;
                this.baseSpd = 200;
                
                // Q ability: Road creation
                this.roads = [];
                
                // E ability: Sector building
                this.markedEnemies = new Map();
                
                // F ability: Construction
                this.isJumping = false;
                this.jumpTimer = 0;
                this.hpBeforeJump = 0;
                this.hpLostBeforeJump = 0;
                this.ultimateMode = false;
                
                // Basic attack linking
                this.linkedTargets = [];
                
                // G ability: Power stance
                this.powerStance = false;
                this.powerStanceTimer = 0;
                this.gKeyPressed = false;
                this.currentTarget = null;
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
                
                // Update power stance timer
                if (this.powerStance) {
                    this.powerStanceTimer -= dt;
                    if (this.powerStanceTimer <= 0) {
                        this.powerStance = false;
                    }
                }
                
                // Update jump
                if (this.isJumping) {
                    this.jumpTimer -= dt;
                    if (this.jumpTimer <= 0) {
                        this.isJumping = false;
                        this.landJump();
                    }
                }
                
                // Update road expansion
                for (let road of this.roads) {
                    if (road.expanding) {
                        road.length += 360 * dt;
                        if (road.length >= 800) {
                            road.expanding = false;
                        }
                    }
                    road.timer -= dt;
                }
                this.roads = this.roads.filter(r => r.timer > 0);
                
                // Check if on road for speed boost
                let onRoad = false;
                for (let road of this.roads) {
                    if (this.isOnRoad(road)) {
                        this.speed = this.baseSpd * 2.5;
                        onRoad = true;
                        break;
                    }
                }
                if (!onRoad) {
                    this.speed = this.baseSpd;
                }
                
                // Update marked enemies
                for (let [e, data] of this.markedEnemies) {
                    data.timer -= dt;
                    if (data.timer <= 0) {
                        this.markedEnemies.delete(e);
                    }
                }
                
                // Check for stun or freeze
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
                
                this.ultimateMode = false;
            }
            
            isOnRoad(road) {
                let dx = Math.cos(road.angle);
                let dy = Math.sin(road.angle);
                let distToRoad = Math.abs((this.x - road.x) * dy - (this.y - road.y) * dx);
                let distAlongRoad = Math.abs((this.x - road.x) * dx + (this.y - road.y) * dy);
                return distToRoad < 50 && distAlongRoad < road.length;
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
                if (keys.q && this.qCD <= 0) this.createRoad();
                if (keys.e && this.eCD <= 0) this.sectorBuilding();
                if (keys.f && this.fCD <= 0) this.construction();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                
                // Link limit for unmarked enemies
                let unmarkedLinkLimit = 1;
                if (this.isJumping) unmarkedLinkLimit = 3;
                
                // Collect enemies in range
                let markedEnemies = [];
                let unmarkedEnemies = [];
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < 250) {
                            if (this.markedEnemies.has(e)) {
                                markedEnemies.push(e);
                            } else {
                                unmarkedEnemies.push(e);
                            }
                        }
                    }
                }
                
                // Sort unmarked by distance
                unmarkedEnemies.sort((a, b) => {
                    let aDist = Math.sqrt((a.x-this.x)**2 + (a.y-this.y)**2);
                    let bDist = Math.sqrt((b.x-this.x)**2 + (b.y-this.y)**2);
                    return aDist - bDist;
                });
                
                // Always link all marked enemies, plus limited unmarked
                let linkedEnemies = [...markedEnemies, ...unmarkedEnemies.slice(0, unmarkedLinkLimit)];
                this.linkedTargets = linkedEnemies;
                
                this.basicCD = 1.2;
                
                for (let linkedEnemy of linkedEnemies) {
                    for (let i = 0; i < 10; i++) {
                        setTimeout(() => {
                            if (!linkedEnemy.dead) {
                                let dmg = 15 * this.damageMultiplier;
                                if (this.markedEnemies.has(linkedEnemy)) {
                                    dmg *= 4;
                                }
                                linkedEnemy.takeDamage(dmg, this);
                            }
                        }, i * 100);
                    }
                }
            }
            
            createRoad() {
                this.qCD = 12;
                let road = {
                    x: this.x,
                    y: this.y,
                    angle: this.angle,
                    length: 0,
                    expanding: true,
                    timer: 8,
                    width: 100,
                    damaged: new Set()
                };
                
                this.dealRoadDamage(road);
                this.roads.push(road);
                
                if (this.isPlayer) addKillMsg('Road Created!');
            }
            
            dealRoadDamage(road) {
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = Math.cos(road.angle);
                        let dy = Math.sin(road.angle);
                        let distToRoad = Math.abs((e.x - road.x) * dy - (e.y - road.y) * dx);
                        let distAlongRoad = Math.abs((e.x - road.x) * dx + (e.y - road.y) * dy);
                        
                        if (distToRoad < road.width / 2 && distAlongRoad < 100) {
                            e.takeDamage(700, this);
                            road.damaged.add(e);
                        }
                    }
                }
            }
            
            sectorBuilding() {
                this.eCD = 7.5;
                let slashRange = 400;
                let slashAngle = Math.PI / 2;
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        let angle = Math.atan2(e.y-this.y, e.x-this.x);
                        let angleDiff = Math.abs(angle - this.angle);
                        
                        if (d < slashRange && angleDiff < slashAngle / 2) {
                            e.takeDamage(200, this);
                            this.markedEnemies.set(e, { timer: 4 });
                            e.slowTimer = 2;
                            e.slowLevel = 3;
                        }
                    }
                }
                
                for (let i = 0; i < 20; i++) {
                    let angle = this.angle + (Math.random() - 0.5) * Math.PI / 2;
                    particles.push(new Particle(
                        this.x + Math.cos(angle) * 100,
                        this.y + Math.sin(angle) * 100,
                        '#FFD700', 5, 0.8
                    ));
                }
                
                if (this.isPlayer) addKillMsg('Sector Building!');
            }

            sectorSlash() {
                this.sectorBuilding();
            }
            
            construction() {
                this.fCD = 20;
                this.isJumping = true;
                this.jumpTimer = 1;
                this.hpLostBeforeJump = this.maxHp - this.hp;
                this.hpBeforeJump = this.hp;
                this.ultimateMode = true;
                
                if (this.isPlayer) addKillMsg('Construction!');
            }

            jumpStomp() {
                this.construction();
            }
            
            landJump() {
                let healAmount = 350 + (this.hpLostBeforeJump * 0.25);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < 450) {
                            e.takeDamage(750, this);
                            this.markedEnemies.set(e, { timer: 4 });
                            e.applyStatus('stun', 1, this);
                        }
                    }
                }
                
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(
                        this.x + (Math.random()-0.5)*100,
                        this.y + (Math.random()-0.5)*100,
                        '#FF6B35', 6, 1
                    ));
                }
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                // Draw links to all linked enemies
                if (this.linkedTargets && this.linkedTargets.length > 0) {
                    for (let linkedEnemy of this.linkedTargets) {
                        if (!linkedEnemy.dead) {
                            ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(this.x - camera.x, this.y - camera.y);
                            ctx.lineTo(linkedEnemy.x - camera.x, linkedEnemy.y - camera.y);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    }
                }
                
                for (let road of this.roads) {
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
                
                for (let [e] of this.markedEnemies) {
                    if (!e.dead) {
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - 40;
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('👻', screenX, screenY);
                    }
                }
                
                if (this.isJumping) {
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
            
            getDamageMult() {
                return this.damageMultiplier;
            }
            
            takeDamage(dmg, source) {
                let actualDamage = dmg * (1 - this.armor);
                super.takeDamage(actualDamage, source);
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            ai(dt, spd) {
                let target = this.currentTarget;
                let targetDist = Infinity;

                if (target && target instanceof Entity && !target.dead && target.team !== this.team && target.isVisibleTo(this)) {
                    targetDist = Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
                    if (targetDist > 1000) {
                        target = null;
                        targetDist = Infinity;
                    }
                } else {
                    target = null;
                }

                if (!target) {
                    target = this.findTarget();
                    if (target) {
                        targetDist = Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
                    }
                } else {
                    let nearestEnemy = this.findTarget();
                    if (nearestEnemy && nearestEnemy !== target) {
                        let nearestDist = Math.sqrt((nearestEnemy.x - this.x) ** 2 + (nearestEnemy.y - this.y) ** 2);
                        if (nearestDist < targetDist - 180 || targetDist > 900) {
                            target = nearestEnemy;
                            targetDist = nearestDist;
                        }
                    }
                }

                this.currentTarget = target;

                if (target) {
                    let dx = target.x - this.x;
                    let dy = target.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        let moveX = (dx / dist) * spd * dt;
                        let moveY = (dy / dist) * spd * dt;
                        this.x += moveX;
                        this.y += moveY;
                    }

                    if (targetDist < 250 && this.basicCD <= 0) {
                        this.basicAtk();
                    }

                    if (Math.random() < 0.02 && this.qCD <= 0) this.createRoad();
                    if (Math.random() < 0.03 && this.eCD <= 0) this.sectorBuilding();
                    if (Math.random() < 0.01 && this.fCD <= 0) this.construction();

                    this.angle = Math.atan2(dy, dx);
                } else {
                    if (Math.random() < 0.1) {
                        this.angle = Math.random() * Math.PI * 2;
                    }
                    let moveX = Math.cos(this.angle) * spd * dt;
                    let moveY = Math.sin(this.angle) * spd * dt;
                    this.x += moveX;
                    this.y += moveY;
                }
                
                this.x = Math.max(20, Math.min(WORLD_SIZE - 20, this.x));
                this.y = Math.max(20, Math.min(WORLD_SIZE - 20, this.y));
                
                if (Math.random() < 0.01 && this.rCD <= 0) this.useGear();
            }
        }

        function init() {
            if(isInitialized)return; isInitialized=true;
            CANVAS=document.getElementById('gameCanvas');if(!CANVAS)return;CTX=CANVAS.getContext('2d');
            MINIMAP_CANVAS=document.getElementById('minimapCanvas');if(MINIMAP_CANVAS)MINIMAP_CTX=MINIMAP_CANVAS.getContext('2d');
            if(MINIMAP_CANVAS) {
                MINIMAP_CANVAS.addEventListener('click', function(e) {
                    if (!player) return;
                    let rect = MINIMAP_CANVAS.getBoundingClientRect();
                    let localX = e.clientX - rect.left;
                    let localY = e.clientY - rect.top;
                    let scale = 150 / WORLD_SIZE;
                    let targetX = (localX - 75) / scale + player.x;
                    let targetY = (localY - 75) / scale + player.y;
                    
                    // Noli teleport
                    if(player instanceof Noli && player.teleportCharges > 0) {
                        player.x = Math.max(20, Math.min(WORLD_SIZE - 20, targetX));
                        player.y = Math.max(20, Math.min(WORLD_SIZE - 20, targetY));
                        player.teleportCharges--;
                        for (let i = 0; i < 8; i++) {
                            particles.push(new Particle(player.x, player.y, '#800080', 5, 0.8));
                        }
                    }
                    // Teleportation gear
                    else if(player.gear === 'teleportation' && player.teleportWindup <= 0 && player.rCD <= 0) {
                        player.teleportTarget = {
                            x: Math.max(20, Math.min(WORLD_SIZE - 20, targetX)),
                            y: Math.max(20, Math.min(WORLD_SIZE - 20, targetY))
                        };
                        player.useGear();
                    }
                });
            }
            
            function rs(){if(CANVAS){CANVAS.width=window.innerWidth;CANVAS.height=window.innerHeight;}}
            window.addEventListener('resize',rs); rs();
            
            // Set camera zoom for mobile devices
            const isMobile = window.innerWidth <= 768 || window.innerHeight <= 500 || 'ontouchstart' in window;
            if (isMobile) {
                camera.zoom = 1.5; // Zoom in for better mobile gameplay
            }

            window.addEventListener('keydown',e=>{if(keys.hasOwnProperty(e.key.toLowerCase()))keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='l'&&typeof gameMode!=='undefined'&&gameMode==='training')switchTrainingDummy();if(e.key.toLowerCase()==='p'&&typeof gameMode!=='undefined'&&gameMode==='training')resetTrainingCounter();if(e.key.toLowerCase()==='o'&&typeof gameMode!=='undefined'&&gameMode==='training')resetTrainingCooldowns();if(e.key===' ')showLeaderboard();});
            window.addEventListener('keyup',e=>{if(keys.hasOwnProperty(e.key.toLowerCase()))keys[e.key.toLowerCase()]=false;if(e.key===' ')hideLeaderboard();});
            window.addEventListener('mousemove', e => { updateMouseFromClient(e.clientX, e.clientY); });
            window.addEventListener('mousedown', () => mouse.down = true);
            window.addEventListener('mouseup', () => mouse.down = false);
            
            // Mobile touch support (alongside existing mouse input, doesn't replace it)
            window.addEventListener('touchmove', e => {
                if (e.touches.length > 0) {
                    updateMouseFromClient(e.touches[0].clientX, e.touches[0].clientY);
                }
                e.preventDefault();
            }, { passive: false });
            
            window.addEventListener('touchstart', e => {
                if (e.touches.length > 0) {
                    updateMouseFromClient(e.touches[0].clientX, e.touches[0].clientY);
                    mouse.down = true;
                }
                e.preventDefault();
            }, { passive: false });
            
            window.addEventListener('touchend', e => {
                mouse.down = false;
                e.preventDefault();
            }, { passive: false });
            
            loop(0);
        }

        // Winston hero: speedster/mage
        class Winston extends Entity {
            constructor(x, y, p) {
                super(x, y, 16, p ? '#66ccff' : '#5599cc', 4300);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Winston)' : 'Enemy Winston';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                // Stats & movement
                this.baseSpd = 350; this.speed = this.baseSpd;

                // Passive wind buildup
                this.windCharge = 0; // 0..1
                this.windActive = false;
                this.windRadius = 140;

                // Ability timers
                this.hurricaneTimer = 0; this.hurricaneTick = 0;
                this.dashTimer = 0; this.dashDuration = 3;
                // short burst dash used by E
                this.dashBurst = 0; this.dashBurstVx = 0; this.dashBurstVy = 0;

                // Internal flags
                this.pendingQSeq = 0;
                this._qWas = false;
                this._eWas = false;
                this._fWas = false;
                this._rWas = false;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);

                // Passive: requires sustained movement to generate wind
                let moving = false;
                if (this.isPlayer) moving = keys && (keys.w || keys.a || keys.s || keys.d);
                else { moving = Math.abs(this.vx||0) + Math.abs(this.vy||0) > 0.01; }

                if (moving) {
                    this.windCharge = Math.min(1, this.windCharge + 0.6 * dt);
                } else {
                    // Wind disappears immediately when stopping
                    if (this.windActive) this.windActive = false;
                    this.windCharge = Math.max(0, this.windCharge - 1.0 * dt);
                }

                // Activate wind when fully charged and moving
                if (this.windCharge >= 1 && moving) this.windActive = true;

                // Passive wind effects
                if (this.windActive) {
                    // Push enemies away and slow projectiles
                    for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                        if (d < this.windRadius && d > 1) {
                            let push = 120; // px/s push
                            e.x += (dx / d) * push * dt;
                            e.y += (dy / d) * push * dt;
                            // small reveal and slow
                            e.revealTimer = Math.max(e.revealTimer || 0, 0.4);
                            e.slowTimer = Math.max(e.slowTimer || 0, 0.3);
                        }
                    }
                    // Slow projectiles (best-effort: particles with vx/vy)
                    for (let p of particles) {
                        if (p && typeof p.vx === 'number' && typeof p.vy === 'number') {
                            let dx = p.x - this.x, dy = p.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < this.windRadius) { p.vx *= 0.96; p.vy *= 0.96; }
                        }
                    }
                }

                // Hurricane ticking
                if (this.hurricaneTimer > 0) {
                    this.hurricaneTimer = Math.max(0, this.hurricaneTimer - dt);
                    this.hurricaneTick -= dt;
                    if (this.hurricaneTick <= 0) {
                        this.hurricaneTick += 1.0; // damage each second
                        let dmg = Math.floor(this.speed * 1.2);
                        for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < 320) { e.takeDamage(dmg, this); e.stunTimer = Math.max(e.stunTimer || 0, 0.25); }
                        }
                    }
                } else if (this.hurricaneTimer === 0 && this.shield > 0) {
                    // Remove shield when hurricane ends
                    this.shield = 0;
                }

                // Dash buff timer
                if (this.dashTimer > 0) {
                    this.dashTimer = Math.max(0, this.dashTimer - dt);
                    this.speed = 400;
                } else this.speed = this.baseSpd;

                // Dash burst movement (E)
                if (this.dashBurst > 0) {
                    let moveX = this.dashBurstVx * dt;
                    let moveY = this.dashBurstVy * dt;
                    this.x += moveX; this.y += moveY;
                    this.dashBurst = Math.max(0, this.dashBurst - dt);
                    // spawn small particles while dashing
                    if (Math.random() < 0.4) particles.push(new Particle(this.x - this.vx*0.02, this.y - this.vy*0.02, '#bfefff', 2, 0.35));
                }

                // Hurricane visual - damage only, no projectile spawning
                if (this.hurricaneTimer > 0) {
                    // extra particles for denser hurricane
                    if (Math.random() < 0.6) particles.push(new Particle(this.x + (Math.random()-0.5)*320, this.y + (Math.random()-0.5)*320, '#9fe1ff', 3, 0.9));
                }

                // Input handling
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    if (keys.r && this.rCD <= 0) this.useGear();
                    updateHUD(this);
                } else this.ai(dt, spd);
            }

            basicAtk() {
                if (this.basicCD > 0) return; this.basicCD = 0.6;
                this.revealTimer = 0.5;
                // Wind projectile basic attack
                let dmg = 90;
                let wx = this.x + Math.cos(this.angle) * (this.radius + 6);
                let wy = this.y + Math.sin(this.angle) * (this.radius + 6);
                let w = new WindProjectile(this, wx, wy, this.angle, 700, 600, dmg, '#bfefff', 18);
                if (typeof window.projectiles !== 'undefined') window.projectiles.push(w); else entities.push(w);
                for (let i = 0; i < 8; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#bfefff', 3, 0.5, (Math.random()-0.5)*120, (Math.random()-0.5)*120));
            }

            // Q: 3 running wind attacks with healing on hit
            skill1() {
                if (this.qCD > 0) return; this.qCD = 4; this.revealTimer = 0.5; let self = this;
                // spawn 3 wind ribbon projectiles in quick succession
                for (let i = 0; i < 3; i++) setTimeout(() => {
                    if (self.dead) return;
                    let baseAngle = self.angle;
                    let spread = 0.18; // radians
                    let ang = baseAngle + (i - 1) * spread;
                    let speed = 900;
                    let dmg = Math.floor(self.speed * 1.5);
                    let wx = self.x + Math.cos(ang) * (self.radius + 6);
                    let wy = self.y + Math.sin(ang) * (self.radius + 6);
                    let w = new WindProjectile(self, wx, wy, ang, speed, 700, dmg, '#aee7ff', 28);
                    // Add healing callback on hit
                    w.onHitEnemy = () => {
                        self.hp = Math.min(self.maxHp, self.hp + 200);
                        if (self.isPlayer) addKillMsg('Q Heal +200');
                    };
                    // Add to projectiles array instead of entities so update/cleanup occurs correctly
                    if (typeof window.projectiles !== 'undefined') window.projectiles.push(w); else entities.push(w);
                    particles.push(new Particle(self.x, self.y, '#cfefff', 3, 0.6));
                }, i * 120);
            }

            // E: swift dash that buffs base speed for 2.5s and heals
            doDash() {
                if (this.eCD > 0) return; this.eCD = 7; this.dashTimer = this.dashDuration;
                this.revealTimer = 0.5;
                // short burst forward movement
                this.dashBurst = 0.22; // seconds of burst
                let dashSpeed = 1200; // px/s burst speed
                this.dashBurstVx = Math.cos(this.angle) * dashSpeed;
                this.dashBurstVy = Math.sin(this.angle) * dashSpeed;
                // Heal on dash
                this.hp = Math.min(this.maxHp, this.hp + 200);
                if (this.isPlayer) addKillMsg('E Dash Heal +200');
                for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, '#88ddff', 4, 0.6, (Math.random()-0.5)*200, (Math.random()-0.5)*200));
            }

            // F: Hurricane
            doUlt() {
                if (this.fCD > 0) return; this.fCD = 18; this.hurricaneTimer = 6; this.hurricaneTick = 1.0;
                this.revealTimer = 0.5;
                // Grant shield on ultimate
                this.shield = 860;
                // make the hurricane feel windy: spawn lots of swirling particles and small wind bolts
                this._ultSpawnTimer = 0;
                for (let i = 0; i < 40; i++) particles.push(new Particle(this.x, this.y, '#7fd6ff', 6, 1.4, (Math.random()-0.5)*420, (Math.random()-0.5)*420));
            }

            input(dt, spd) {
                // Block input when stunned or frozen
                if ((this.stunTimer && this.stunTimer > 0) || (this.freezeTimer && this.freezeTimer > 0)) { this.vx = 0; this.vy = 0; return; }

                // Movement (WASD)
                let mx = (mouse.x || 0) + (camera.x || 0);
                let my = (mouse.y || 0) + (camera.y || 0);
                let moveX = 0, moveY = 0;
                if (keys.w) moveY -= 1;
                if (keys.s) moveY += 1;
                if (keys.a) moveX -= 1;
                if (keys.d) moveX += 1;
                if (moveX !== 0 || moveY !== 0) {
                    let m = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
                    // set velocity magnitude
                    this.vx = (moveX / m) * spd;
                    this.vy = (moveY / m) * spd;
                    // apply movement immediately (engine expects position updates per-frame)
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                } else { this.vx = 0; this.vy = 0; }

                // Face cursor
                this.angle = Math.atan2(my - this.y, mx - this.x);

                // Basic attack (mouse)
                if (mouse.down && this.basicCD <= 0) this.basicAtk();

                // Q (skill1)
                if (keys.q && this.qCD <= 0 && !this._qWas) { this._qWas = true; this.skill1(); }
                if (!keys.q) this._qWas = false;

                // E (dash)
                if (keys.e && this.eCD <= 0 && !this._eWas) { this._eWas = true; this.doDash(); }
                if (!keys.e) this._eWas = false;

                // F (ultimate)
                if (keys.f && this.fCD <= 0 && !this._fWas) { this._fWas = true; this.doUlt(); }
                if (!keys.f) this._fWas = false;

                // R (gear) - update() also guards rCD, but keep local debounce
                if (keys.r && this.rCD <= 0 && !this._rWas) { this._rWas = true; if (typeof this.useGear === 'function') this.useGear(); }
                if (!keys.r) this._rWas = false;
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 200) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.qCD <= 0) this.skill1();
                    if (this.eCD <= 0 && d < 150) this.doDash();
                    if (this.fCD <= 0 && this.hp < this.maxHp * 0.3) this.doUlt();
                }
            }

            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                    let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                    if (d < md) { md = d; c = e; }
                }
                return c;
            }

            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random()-0.5)*1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }

            draw(ctx) {
                super.draw(ctx);
                // Draw wind charge bar above head (player only)
                if (this.isPlayer) {
                    let sx = this.x - camera.x - 30, sy = this.y - camera.y - this.radius - 26;
                    ctx.save();
                    ctx.fillStyle = '#222'; ctx.fillRect(sx, sy, 60, 6);
                    ctx.fillStyle = '#8be9ff'; ctx.fillRect(sx, sy, 60 * this.windCharge, 6);
                    ctx.strokeStyle = '#000'; ctx.strokeRect(sx, sy, 60, 6);
                    ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText(this.windActive ? 'Wind' : 'Charge', sx + 30, sy - 6);
                    ctx.restore();
                }

                // Draw hurricane visuals when active
                if (this.hurricaneTimer > 0) {
                    let screenX = this.x - camera.x, screenY = this.y - camera.y;
                    let prog = this.hurricaneTimer / 6;
                    ctx.save();
                    ctx.globalAlpha = 0.25 + 0.3 * Math.sin(Date.now() * 0.006);
                    ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 6;
                    ctx.beginPath(); ctx.arc(screenX, screenY, 320, 0, Math.PI*2); ctx.stroke();
                    // rotating spiral
                    ctx.beginPath();
                    for (let a = 0; a < 10; a++) {
                        let angle = (Date.now()*0.002 + a) % (Math.PI*2);
                        let rx = screenX + Math.cos(angle) * (80 + a*12);
                        let ry = screenY + Math.sin(angle) * (80 + a*12);
                        ctx.lineTo(rx, ry);
                    }
                    ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // Amir: Indian Delivery Driver with Truck
        class Amir extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, p ? '#ff6b35' : '#cc5428', 8700);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Amir)' : 'Enemy Amir';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                // Stats & movement
                this.baseSpd = 300; this.speed = this.baseSpd;

                // Passive: Damage Shield Bar (like Fred/Winston)
                this.damageShield = 0; // shields equal to 10% of damage taken
                this.shieldBar = 0; // visual bar 0..1
                
                // Passive movement-based charging
                // Increased gain so bar charges noticeably while moving; convert to real shield at cap
                // Nerfed: reduce movement-based charge to slow bar accumulation
                this.passiveMoveGain = 180; // shield points per second gained while moving (reduced from 300)
                this.damageShieldDecayRate = 25; // points per second decay when not actively charging
                // Truck state
                this.truckActive = false; this.truckTimer = 0; this.truckCooldown = 0;
                this.truckSpeedMult = 3;
                this.lastCrashTick = 0; this.crashTickInterval = 0.5;
                this.canExplodeTruck = false; this.truckExplodeDelay = 1.5;

                // Speed buff from Q
                this.speedBuffTimer = 0;
                
                // Gear integration
                this.gear = 'speedster'; this.rCD = 0; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
                
                // Input debounce variables
                this._qWas = false;
                this._eWas = false;
                this._fWas = false;
                this._rWas = false;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);

                // Speed buff timer
                if (this.speedBuffTimer > 0) this.speedBuffTimer -= dt;
                
                // Gear timers
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;

                // Truck logic
                if (this.truckActive && this.truckTimer > 0) {
                    this.truckTimer -= dt;
                    this.speed = this.baseSpd * this.truckSpeedMult;

                    // Crash damage every 0.5s
                    this.lastCrashTick -= dt;
                    if (this.lastCrashTick <= 0) {
                        this.lastCrashTick = this.crashTickInterval;
                            let crashDmg = Math.floor(this.baseSpd * 0.6);
                        for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < 150) {
                                e.takeDamage(crashDmg, this);
                                // Apply knockback via status so physics/servers handle movement consistently
                                if (typeof e.applyStatus === 'function') e.applyStatus('knockback', { x: (dx / d) * 300, y: (dy / d) * 300 }, this);
                                else { e.x += (dx / d) * 100; e.y += (dy / d) * 100; }
                            }
                        }
                    }

                    // Can explode after minimum delay
                    if (this.truckTimer <= 8 - this.truckExplodeDelay) this.canExplodeTruck = true;

                    // Auto-explode when time runs out
                    if (this.truckTimer <= 0) this.explodeTruck();
                } else if (this.truckTimer <= 0 && this.truckActive) {
                    this.truckActive = false;
                    this.speed = this.baseSpd + (this.speedBuffTimer > 0 ? 50 : 0);
                }

                // Update base speed calculation
                if (this.speedBuffTimer <= 0) {
                    this.speed = this.truckActive ? this.baseSpd * this.truckSpeedMult : this.baseSpd;
                }

                // Movement-based passive charging and shield decay
                // Gain shield-like resource while moving, decay when idle. When resource reaches cap, convert to actual `shield`.
                let shieldCap = this.maxHp * 0.1;
                let isMoving = (this.vx && this.vx !== 0) || (this.vy && this.vy !== 0);
                // Fallback movement check when vx/vy are not set; compare position drift
                if (!isMoving && typeof this.prevX === 'number' && typeof this.prevY === 'number') {
                    isMoving = Math.hypot(this.x - this.prevX, this.y - this.prevY) > 0.001;
                }
                this.prevX = this.x; this.prevY = this.y;

                if (isMoving) {
                    this.damageShield = Math.min(this.damageShield + this.passiveMoveGain * dt, shieldCap);
                } else {
                    this.damageShield = Math.max(0, this.damageShield - dt * this.damageShieldDecayRate);
                }

                if (this.damageShield >= shieldCap) {
                    this.shield = Math.max(this.shield || 0, Math.floor(shieldCap));
                    this.damageShield = 0;
                    if (this.isPlayer) addKillMsg('Delivery Resilience: Shield ready!');
                    for (let i = 0; i < 12; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#ffcc00', 3 + Math.random()*3, 0.6));
                }

                // Show correspondent bar (charge or actual shield) above Amir.
                let chargeFraction = Math.min(1, this.damageShield / shieldCap);
                let activeShieldFraction = this.shield ? Math.min(1, this.shield / shieldCap) : 0;
                this.shieldBar = Math.max(chargeFraction, activeShieldFraction);

                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    if (keys.r && this.rCD <= 0) this.useGear();
                    updateHUD(this);
                } else this.ai(dt, spd);
            }

            basicAtk() {
                if (this.basicCD > 0) return; this.basicCD = 1.5;
                // Tool swing attack
                let range = 140; let dmg = 220;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < range) {
                        let ang = Math.atan2(dy, dx); let diff = Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle)));
                        if (diff < Math.PI/3) { e.takeDamage(dmg, this); e.x += (dx/d) * 40; e.y += (dy/d) * 40; }
                    }
                }
                // Improved visual: forward arc particles and bigger impact puffs
                for (let i = 0; i < 12; i++) {
                    let ang = this.angle + (Math.random() - 0.5) * (Math.PI / 2);
                    let dist = 30 + Math.random() * 120;
                    let px = this.x + Math.cos(ang) * dist;
                    let py = this.y + Math.sin(ang) * dist;
                    particles.push(new Particle(px + (Math.random()-0.5)*8, py + (Math.random()-0.5)*8, '#ff9a3d', 4 + Math.random() * 5, 0.5 + Math.random() * 0.5));
                }
                // strong central hit flash
                particles.push(new Particle(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, '#ffd27a', 14, 0.35));
                if (this.isPlayer) screenShake(6);
            }

            // Q: 2 Dolla Tip - throw bag
            skill1() {
                if (this.qCD > 0) return; this.qCD = 7;
                let speed = 850;
                let dmg = Math.floor(this.getEffectiveSpeed() * 2.8); // scale with current effective speed
                let wx = this.x + Math.cos(this.angle) * (this.radius + 6);
                let wy = this.y + Math.sin(this.angle) * (this.radius + 6);
                // larger bag, non-piercing: set to remove on first hit via callback
                let w = new BagProjectile(this, wx, wy, this.angle, speed, 700, dmg, '#ffd700', 20);
                // onHit receives the enemy hit; apply stun and speed buff and stop projectile
                w.onHitEnemy = (enemy) => {
                    if (!enemy || enemy.dead) return;
                    let stunAmount = Math.max(0.1, dmg * 0.001);
                    try { if (typeof enemy.applyStatus === 'function') enemy.applyStatus('stun', stunAmount, this); else enemy.stunTimer = Math.max(enemy.stunTimer || 0, stunAmount); } catch(_) {}
                    // Buff Amir speed +50 for 3s
                    this.speedBuffTimer = 3;
                    this.speed = Math.max(this.speed, this.baseSpd + 50);
                    // visual hit burst
                    for (let i = 0; i < 8; i++) particles.push(new Particle(enemy.x + (Math.random()-0.5)*30, enemy.y + (Math.random()-0.5)*30, '#fff2b8', 5 + Math.random()*6, 0.45));
                    if (this.isPlayer) addKillMsg('Your food is ready sir! +50 Spd');
                    // stop the bag from piercing further
                    try { w.del = true; } catch(_) {}
                };
                if (typeof window.projectiles !== 'undefined') window.projectiles.push(w); else entities.push(w);
                for (let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y, '#ffd700', 4, 0.6));
            }

            // E: Stunt - dash to mouse location with knockback
            doStunt() {
                if (this.eCD > 0) return; this.eCD = 6;
                let mx = (mouse.x || 0) + (camera.x || 0);
                let my = (mouse.y || 0) + (camera.y || 0);
                let dx = mx - this.x, dy = my - this.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 500) { dx = (dx/d) * 500; dy = (dy/d) * 500; }
                this.x += dx; this.y += dy;

                // Knockback enemies in 200 radius
                let dmg = Math.floor(this.getEffectiveSpeed() * 2.5); // scale with current effective speed
                let totalDamage = 0;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let edx = e.x - this.x, edy = e.y - this.y; let ed = Math.sqrt(edx*edx + edy*edy);
                    if (ed < 200) {
                        e.takeDamage(dmg, this);
                        e.x += (edx/ed) * 120; e.y += (edy/ed) * 120; // knockback
                        totalDamage += dmg;
                        for (let i = 0; i < 4; i++) particles.push(new Particle(e.x, e.y, '#ff6b35', 3, 0.4));
                    }
                }
                // Heal 50% of damage dealt
                this.hp = Math.min(this.maxHp, this.hp + Math.floor(totalDamage * 0.5));
                if (this.isPlayer && totalDamage > 0) addKillMsg('Stunt Heal +' + Math.floor(totalDamage * 0.5));
                for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, '#ff9a3d', 4, 0.6));
            }

            // F: Truck - speed boost with crash damage
            explodeTruck() {
                this.truckActive = false;
                this.truckTimer = 0;
                this.canExplodeTruck = false;
                this.speed = this.baseSpd + (this.speedBuffTimer > 0 ? 50 : 0);

                // Explosion: 200% speed damage + 1s stun
                let expDmg = Math.floor(this.baseSpd * 2.0);
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < 300) {
                        e.takeDamage(expDmg, this);
                        e.applyStatus('stun', 1.0, this);
                        if (typeof e.applyStatus === 'function') e.applyStatus('knockback', { x: (dx / d) * 450, y: (dy / d) * 450 }, this);
                        else { e.x += (dx/d) * 150; e.y += (dy/d) * 150; }
                    }
                }
                for (let i = 0; i < 30; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*200, this.y + (Math.random()-0.5)*200, '#ff6b35', 5, 0.8));
            }

            doTruck() {
                if (this.fCD > 0) return;
                if (this.truckActive) {
                    // Can explode if enough time has passed
                    if (this.canExplodeTruck) {
                        this.explodeTruck();
                        this.fCD = 22;
                    }
                } else {
                    // Activate truck
                    this.truckActive = true;
                    this.truckTimer = 8;
                    this.lastCrashTick = 0;
                    this.canExplodeTruck = false;
                    for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, '#ff9a3d', 5, 0.8));
                }
            }

            input(dt, spd) {
                if ((this.stunTimer && this.stunTimer > 0) || (this.freezeTimer && this.freezeTimer > 0)) { this.vx = 0; this.vy = 0; return; }

                let mx = (mouse.x || 0) + (camera.x || 0);
                let my = (mouse.y || 0) + (camera.y || 0);
                let moveX = 0, moveY = 0;
                if (keys.w) moveY -= 1;
                if (keys.s) moveY += 1;
                if (keys.a) moveX -= 1;
                if (keys.d) moveX += 1;
                if (moveX !== 0 || moveY !== 0) {
                    let m = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
                    this.vx = (moveX / m) * spd;
                    this.vy = (moveY / m) * spd;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                } else { this.vx = 0; this.vy = 0; }

                this.angle = Math.atan2(my - this.y, mx - this.x);

                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0 && !this._qWas) { this._qWas = true; this.skill1(); }
                if (!keys.q) this._qWas = false;
                if (keys.e && this.eCD <= 0 && !this._eWas) { this._eWas = true; this.doStunt(); }
                if (!keys.e) this._eWas = false;
                if (keys.f && this.fCD <= 0 && !this._fWas) { this._fWas = true; this.doTruck(); }
                if (!keys.f) this._fWas = false;
                if (keys.r && this.rCD <= 0 && !this._rWas) { this._rWas = true; if (typeof this.useGear === 'function') this.useGear(); }
                if (!keys.r) this._rWas = false;
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); this.vx = 0; this.vy = 0; return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 250) {
                    let vx = Math.cos(this.angle) * spd;
                    let vy = Math.sin(this.angle) * spd;
                    this.x += vx * dt;
                    this.y += vy * dt;
                    this.vx = vx;
                    this.vy = vy;
                } else {
                    this.vx = 0;
                    this.vy = 0;
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.qCD <= 0) this.skill1();
                    if (this.eCD <= 0 && Math.random() < 0.3) this.doStunt();
                }
            }

            findTarget() { let c = null, md = 9999; for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) { let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2); if (d < md) { md = d; c = e; } } return c; }
            wander(dt, spd) { if (Math.random() < 0.05) this.angle += (Math.random()-0.5)*1; this.x += Math.cos(this.angle) * spd * 0.5 * dt; this.y += Math.sin(this.angle) * spd * 0.5 * dt; }

            takeDamage(dmg, attacker) {
                if (this.dead) return;
                // Only charge passive on positive damage values (ignore heals/zero and non-damage events)
                // Increased conversion: more charge gained per damage taken so shield readies faster.
                if (typeof dmg === 'number' && dmg > 0) {
                    this.damageShield = Math.min(this.damageShield + dmg * 0.3, this.maxHp * 0.1);
                }
                super.takeDamage(dmg, attacker);
            }

            draw(ctx) {
                super.draw(ctx);

                // Draw damage shield bar
                if (this.shieldBar > 0) {
                    let sx = this.x - camera.x - 35, sy = this.y - camera.y - this.radius - 32;
                    ctx.save();
                    ctx.fillStyle = '#222';
                    ctx.fillRect(sx, sy, 70, 6);
                    ctx.fillStyle = '#ffcc00';
                    ctx.fillRect(sx, sy, 70 * this.shieldBar, 6);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(sx, sy, 70, 6);
                    ctx.restore();
                }

                // Draw truck visuals when active
                if (this.truckActive && this.truckTimer > 0) {
                    let screenX = this.x - camera.x, screenY = this.y - camera.y;
                    ctx.save();
                    // Main truck shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.25)';
                    ctx.beginPath(); ctx.ellipse(screenX, screenY + 28, 58, 18, 0, 0, Math.PI*2); ctx.fill();

                    // Truck body (cab + cargo)
                    ctx.fillStyle = '#ff6b35';
                    ctx.strokeStyle = '#b34724'; ctx.lineWidth = 3;
                    // cargo box
                    ctx.beginPath(); ctx.rect(screenX - 56, screenY - 36, 96, 56); ctx.fill(); ctx.stroke();
                    // cab
                    ctx.beginPath(); ctx.rect(screenX + 26, screenY - 16, 34, 34); ctx.fill(); ctx.stroke();

                    // windows
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(screenX + 30, screenY - 8, 20, 16);

                    // cargo stripes / decal
                    ctx.strokeStyle = 'rgba(255,220,160,0.9)'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(screenX - 46, screenY - 10); ctx.lineTo(screenX + 20, screenY - 10); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(screenX - 46, screenY + 8); ctx.lineTo(screenX + 20, screenY + 8); ctx.stroke();

                    // Grill / headlights
                    ctx.fillStyle = '#333'; ctx.fillRect(screenX + 52, screenY + 2, 10, 8);
                    ctx.fillStyle = '#fff7b2'; ctx.beginPath(); ctx.arc(screenX + 62, screenY + 6, 4, 0, Math.PI*2); ctx.fill();

                    // Truck wheels (bigger)
                    ctx.fillStyle = '#222';
                    ctx.beginPath(); ctx.arc(screenX - 28, screenY + 28, 12, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(screenX + 28, screenY + 28, 12, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(screenX - 28, screenY + 28, 6, 0, Math.PI*2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(screenX + 28, screenY + 28, 6, 0, Math.PI*2); ctx.stroke();

                    // Speed indicator badge
                    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
                    ctx.fillText('🚚 x' + this.truckSpeedMult, screenX, screenY - 20);
                    ctx.restore();
                }
            }

            getEffectiveSpeed() { let s = this.speed; if(this.speedsterTimer > 0) s *= 1.5; return s; }
            input(dt, spd) {
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                if (keys.q && !this._qWas) this.skill1();
                if (keys.e && !this._eWas) this.doStunt();
                if (keys.f && !this._fWas) this.doTruck();
                if (keys.r && !this._rWas) this.useGear();
                this._qWas = keys.q;
                this._eWas = keys.e;
                this._fWas = keys.f;
                this._rWas = keys.r;
                if (this.isPlayer) updateHUD(this);
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Steven extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#8B008B' : '#660066', 4800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Steven)' : 'Enemy Steven';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                // Stats & movement
                this.baseSpd = 225; this.speed = this.baseSpd;

                // Passive: Skill Points System
                this.skillPoints = 8;
                this.maxSkillPoints = 8;
                this.skillPointTimer = 0;
                this.skillPointRechargeTime = 3.0; // 3 seconds per point
                
                // Quantum shot tracking
                this.quantumSpeedBuffTimer = 0;
                this.fWindupSlowTimer = 0;
                
                // Magnitude break state
                this.magnitudeBreakActive = false;
                
                // Gear integration
                this.gear = 'speedster'; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
                
                // Input debounce variables
                this._qWas = false;
                this._eWas = false;
                this._fWas = false;
                this._rWas = false;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);

                // Skill point recharge
                if (this.skillPoints < this.maxSkillPoints) {
                    this.skillPointTimer += dt;
                    if (this.skillPointTimer >= this.skillPointRechargeTime) {
                        this.skillPoints = Math.min(this.maxSkillPoints, this.skillPoints + 1);
                        this.skillPointTimer = 0;
                        if (this.isPlayer) addKillMsg('Skill Point Recharged');
                    }
                }

                // Quantum speed buff timer
                if (this.quantumSpeedBuffTimer > 0) {
                    this.quantumSpeedBuffTimer -= dt;
                    if (this.quantumSpeedBuffTimer <= 0) {
                        this.speed = this.baseSpd;
                    }
                }
                if (this.fWindupSlowTimer > 0) {
                    this.fWindupSlowTimer = Math.max(0, this.fWindupSlowTimer - dt);
                    if (this.fWindupSlowTimer <= 0) {
                        this.speed = this.baseSpd;
                    }
                }

                // Gear timers
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;

                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
            }

            basicAtk() {
                if (this.basicCD > 0) return; this.basicCD = 1.0;
                // Blade slash attack
                let range = 120; let dmg = 160;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < range) {
                        let ang = Math.atan2(dy, dx); let diff = Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle)));
                        if (diff < Math.PI/4) { // 45 degree arc
                            e.takeDamage(dmg, this);
                            e.x += (dx/d) * 30; e.y += (dy/d) * 30; // small knockback
                        }
                    }
                }
                // Visual effects
                for (let i = 0; i < 8; i++) {
                    let ang = this.angle + (Math.random() - 0.5) * (Math.PI / 2);
                    let dist = 20 + Math.random() * 100;
                    let px = this.x + Math.cos(ang) * dist;
                    let py = this.y + Math.sin(ang) * dist;
                    particles.push(new Particle(px + (Math.random()-0.5)*6, py + (Math.random()-0.5)*6, '#8B008B', 3 + Math.random() * 4, 0.4 + Math.random() * 0.3));
                }
                // Blade flash
                particles.push(new Particle(this.x + Math.cos(this.angle) * 50, this.y + Math.sin(this.angle) * 50, '#FFFFFF', 12, 0.25));
                if (this.isPlayer) {
                    screenShake(4);
                    visualEffects.push(new EnergyWave(this.x, this.y, '#8B008B', 140, 0.4));
                }
            }

            // Q: Crossing Blades (5s)
            skill1() {
                if (this.qCD > 0) return; this.qCD = 5;

                let owner = this;
                let baseAngle = this.angle;

                const createBlade = (startAngle) => {
                    return {
                        x: owner.x + Math.cos(startAngle) * 25,
                        y: owner.y + Math.sin(startAngle) * 25,
                        angle: startAngle,
                        speed: 450,
                        distance: 0,
                        maxDistance: 2000, // longer travel so teleport stays useful
                        damage: 320,
                        owner: owner,
                        penetration: owner.magnitudeBreakActive ? 1 : 0,
                        turnRate: Math.PI * 0.5, // slower turning for a longer curved path
                        other: null,
                        hitEnemies: new Set(),
                        collided: false,
                        collisionTimer: 0,
                        del: false,
                        update: function(dt) {
                            if (this.collided) {
                                // Keep flying after colliding so the blades travel their full range.
                                // The collision effect is already spawned when they first touch.
                                // Once collided we no longer need to curve toward each other.
                                this.other = null;
                            }

                            // Curve toward the other blade for crossing paths (only if still paired)
                            if (this.other) {
                                let desired = Math.atan2(this.other.y - this.y, this.other.x - this.x);
                                let diff = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
                                let maxTurn = this.turnRate * dt;
                                if (Math.abs(diff) > maxTurn) diff = Math.sign(diff) * maxTurn;
                                this.angle += diff;
                            }

                            this.x += Math.cos(this.angle) * this.speed * dt;
                            this.y += Math.sin(this.angle) * this.speed * dt;
                            this.distance += this.speed * dt;

                            // Blade collision (they slam into each other when crossing paths)
                            if (this.other && !this.other.collided && this.distance > 30 && this.other.distance > 30) {
                                let d = Math.hypot(this.other.x - this.x, this.other.y - this.y);
                                if (d < 25) {
                                    for (let i = 0; i < 15; i++) {
                                        particles.push(new Particle((this.x + this.other.x) / 2 + (Math.random() - 0.5) * 30,
                                                                   (this.y + this.other.y) / 2 + (Math.random() - 0.5) * 30,
                                                                   '#8B008B', 5, 0.8));
                                    }
                                    this.collided = true;
                                    this.other.collided = true;
                                }
                            }

                            // Hit detection
                            for (let e of entities) {
                                if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && !this.hitEnemies.has(e)) {
                                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                                    if (d < 40) {
                                        this.hitEnemies.add(e);
                                        // Apply defense penetration if magnitude break is active
                                        let prevPen = this.owner.penetration || 0;
                                        if (this.owner.magnitudeBreakActive) this.owner.penetration = 1;
                                        e.takeDamage(this.damage, this.owner);
                                        if (this.owner.magnitudeBreakActive) this.owner.penetration = prevPen;

                                        e.applyStatus('slowness', 1.5, this.owner);
                                        this.owner.skillPoints = Math.min(this.owner.maxSkillPoints, (this.owner.skillPoints || 0) + 1);

                                        // Teleport to first hit point if magnitude break is active
                                        if (this.owner.magnitudeBreakActive) {
                                            this.owner.x = this.x;
                                            this.owner.y = this.y;
                                            this.owner.magnitudeBreakActive = false;
                                            this.owner.invulnerableTimer = 1.0;
                                            for (let i = 0; i < 12; i++) {
                                                particles.push(new Particle(this.owner.x + (Math.random() - 0.5) * 60, this.owner.y + (Math.random() - 0.5) * 60, '#FFD700', 6, 1));
                                            }
                                            if (this.owner.isPlayer) addKillMsg('Magnitude Break: Teleported!');
                                        }

                                        // Visual hit
                                        for (let i = 0; i < 6; i++) {
                                            particles.push(new Particle(e.x + (Math.random() - 0.5) * 40, e.y + (Math.random() - 0.5) * 40, '#8B008B', 4, 0.6));
                                        }
                                    }
                                }
                            }

                            if (this.distance >= this.maxDistance) this.del = true;
                        },
                        draw: function(ctx) {
                            let screenX = this.x - camera.x, screenY = this.y - camera.y;
                            ctx.save();
                            ctx.translate(screenX, screenY);
                            ctx.rotate(this.angle);
                            // Blade shape
                            ctx.fillStyle = '#8B008B';
                            ctx.fillRect(-20, -3, 40, 6);
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(-15, -1, 30, 2);
                            ctx.restore();
                        }
                    };
                };

                // Position blades so they start slightly spread and then curve inward for a longer cross range
                // (keeps the launch direction consistent while still giving a wider path)
                let blade1Angle = baseAngle + Math.PI / 4; // 45° spread
                let blade2Angle = baseAngle - Math.PI / 4; // -45° spread

                let blade1 = createBlade(blade1Angle);
                let blade2 = createBlade(blade2Angle);
                blade1.other = blade2;
                blade2.other = blade1;

                // Blades start at player position
                blade1.x = this.x;
                blade1.y = this.y;
                blade2.x = this.x;
                blade2.y = this.y;

                if (typeof projectiles !== 'undefined') {
                    projectiles.push(blade1);
                    projectiles.push(blade2);
                } else {
                    entities.push(blade1);
                    entities.push(blade2);
                }

                // Cast effect
                for (let i = 0; i < 12; i++) {
                    particles.push(new Particle(this.x, this.y, '#8B008B', 5, 0.8));
                }

                // If magnitude break was active but not used, clear it after a short window
                if (this.magnitudeBreakActive) {
                    setTimeout(() => { this.magnitudeBreakActive = false; }, 4000);
                }
            }

            // E: Quantum Shot (12s)
            doQuantumShot() {
                if (this.eCD > 0) return;

                // Spend skill points to empower the shot
                let isEnhanced = false;
                if (this.skillPoints >= 2) {
                    this.skillPoints -= 2;
                    isEnhanced = true;
                    if (this.isPlayer) addKillMsg('Spent 2 Skill Points: Enhanced Quantum!');
                }

                this.eCD = 12;

                // Enhanced windup phase (0.4s) with quantum effects
                let windupTime = 0.4;
                let windupParticles = 0;
                let windupInterval = setInterval(() => {
                    if (this.dead) { clearInterval(windupInterval); return; }
                    
                    // Quantum energy gathering
                    for (let i = 0; i < 12; i++) {
                        let angle = (Math.PI * 2 * i / 12) + (windupParticles * 0.15);
                        let dist = 20 + windupParticles * 3;
                        particles.push(new Particle(
                            this.x + Math.cos(angle) * dist,
                            this.y + Math.sin(angle) * dist,
                            isEnhanced ? '#00FFFF' : '#8B008B', 4, 0.8
                        ));
                    }
                    
                    // Pulsing quantum waves
                    if (windupParticles % 2 === 0) {
                        visualEffects.push(new EnergyWave(this.x, this.y, isEnhanced ? '#00FFFF' : '#8B008B', 40 + windupParticles * 8, 0.4));
                    }
                    
                    // Quantum field distortion
                    if (windupParticles % 4 === 0) {
                        for (let i = 0; i < 6; i++) {
                            let randAngle = Math.random() * Math.PI * 2;
                            let randDist = Math.random() * 60;
                            particles.push(new Particle(
                                this.x + Math.cos(randAngle) * randDist,
                                this.y + Math.sin(randAngle) * randDist,
                                isEnhanced ? '#00FFFF' : '#8B008B', 2, 1.2
                            ));
                        }
                    }
                    
                    windupParticles++;
                }, 40);

                setTimeout(() => {
                    clearInterval(windupInterval);
                    if (this.dead) return;

                    let damage = isEnhanced ? 1000 : 900;
                    let healAmount = 450;

                    // Create quantum arrow projectile with enhanced effects
                    let arrow = {
                        x: this.x + Math.cos(this.angle) * 25,
                        y: this.y + Math.sin(this.angle) * 25,
                        angle: this.angle,
                        speed: 1400, // faster arrow
                        distance: 0,
                        maxDistance: 1300,
                        damage: damage,
                        healAmount: healAmount,
                        owner: this,
                        isEnhanced: isEnhanced,
                        hitEnemies: [],
                        del: false,
                        trailParticles: 0,
                        update: function(dt) {
                            this.x += Math.cos(this.angle) * this.speed * dt;
                            this.y += Math.sin(this.angle) * this.speed * dt;
                            this.distance += this.speed * dt;

                            // Quantum trail effect
                            this.trailParticles += dt * 20;
                            while (this.trailParticles >= 1) {
                                particles.push(new Particle(
                                    this.x + (Math.random() - 0.5) * 20,
                                    this.y + (Math.random() - 0.5) * 20,
                                    this.isEnhanced ? '#00FFFF' : '#8B008B', 3, 0.6
                                ));
                                this.trailParticles--;
                            }

                            // Hit detection
                            for (let e of entities) {
                                if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && !this.hitEnemies.includes(e)) {
                                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                    if (d < 45) {
                                        e.takeDamage(this.damage, this.owner);
                                        this.hitEnemies.push(e);

                                        // Enhanced effects
                                        if (this.isEnhanced) {
                                            // Speed boost for owner
                                            this.owner.quantumSpeedBuffTimer = 1.0;
                                            this.owner.speed = this.owner.baseSpd * 2;
                                            if (this.owner.isPlayer) addKillMsg('Quantum Surge! 2x Speed');
                                        }

                                        // Heal owner
                                        this.owner.hp = Math.min(this.owner.maxHp, this.owner.hp + this.healAmount);
                                        if (this.owner.isPlayer) addKillMsg('Quantum Energy +' + this.healAmount + ' HP');

                                        // Enhanced quantum explosion
                                        for (let i = 0; i < 25; i++) {
                                            particles.push(new Particle(e.x + (Math.random()-0.5)*80, e.y + (Math.random()-0.5)*80, 
                                                this.isEnhanced ? '#00FFFF' : '#8B008B', 8, 1.2));
                                        }
                                        visualEffects.push(new ImpactFlash(e.x, e.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 80));
                                        visualEffects.push(new EnergyWave(e.x, e.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 120, 0.8));

                                        // Quantum field expansion
                                        for (let i = 0; i < 16; i++) {
                                            let angle = (i / 16) * Math.PI * 2;
                                            let dist = 40;
                                            particles.push(new Particle(
                                                e.x + Math.cos(angle) * dist,
                                                e.y + Math.sin(angle) * dist,
                                                this.isEnhanced ? '#00FFFF' : '#8B008B', 5, 1.0
                                            ));
                                        }

                                        // If enhanced and hit enemy, instantly recharge
                                        if (this.isEnhanced && this.hitEnemies.length > 0) {
                                            this.owner.eCD = 0;
                                            if (this.owner.isPlayer) addKillMsg('Quantum Shot Recharged!');
                                        }

                                        // Explosion on hit and stop moving
                                        this.explode();
                                        this.del = true;
                                        break;
                                    }
                                }
                            }

                            if (this.distance >= this.maxDistance) {
                                this.explode();
                                this.del = true;
                            }
                        },
                        explode: function() {
                            // Enhanced quantum explosion effect
                            for (let i = 0; i < 30; i++) {
                                let angle = (i / 30) * Math.PI * 2;
                                let dist = Math.random() * 100;
                                particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, 
                                    this.isEnhanced ? '#00FFFF' : '#8B008B', 5, 1.5));
                            }
                            visualEffects.push(new EnergyWave(this.x, this.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 150, 1.0));
                            
                            // Quantum field rings
                            for (let ring = 0; ring < 3; ring++) {
                                setTimeout(() => {
                                    if (this.owner && !this.owner.dead) {
                                        visualEffects.push(new EnergyWave(this.x, this.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 50 + ring * 30, 0.6));
                                    }
                                }, ring * 100);
                            }
                        },
                        draw: function(ctx) {
                            let screenX = this.x - camera.x, screenY = this.y - camera.y;
                            ctx.save();
                            ctx.translate(screenX, screenY);
                            ctx.rotate(this.angle);

                            // Enhanced arrow shaft with glow
                            ctx.shadowColor = this.isEnhanced ? '#00FFFF' : '#8B008B';
                            ctx.shadowBlur = 15;
                            ctx.fillStyle = this.isEnhanced ? '#00FFFF' : '#8B008B';
                            ctx.fillRect(-25, -2, 50, 4);

                            // Arrow head
                            ctx.beginPath();
                            ctx.moveTo(25, 0);
                            ctx.lineTo(15, -8);
                            ctx.lineTo(15, 8);
                            ctx.closePath();
                            ctx.fill();

                            // Quantum energy field
                            ctx.shadowBlur = 0;
                            ctx.fillStyle = this.isEnhanced ? 'rgba(0, 255, 255, 0.5)' : 'rgba(139, 0, 139, 0.5)';
                            ctx.fillRect(-30, -8, 60, 16);

                            // Inner energy core
                            ctx.fillStyle = this.isEnhanced ? 'rgba(0, 255, 255, 0.8)' : 'rgba(139, 0, 139, 0.8)';
                            ctx.fillRect(-20, -3, 40, 6);

                            ctx.restore();
                        }
                    };

                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(arrow);
                    } else {
                        entities.push(arrow);
                    }

                    // Enhanced cast effect
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(this.x, this.y, isEnhanced ? '#00FFFF' : '#8B008B', 7, 1.0));
                    }
                    visualEffects.push(new EnergyWave(this.x, this.y, isEnhanced ? '#00FFFF' : '#8B008B', 120, 0.6));

                }, windupTime * 1000); // 0.4s delay
            }

            // F: Magnitude Break (24s)
            doMagnitudeBreak() {
                if (this.fCD > 0) return; this.fCD = 24;
                
                this.fWindupSlowTimer = 0.6;
                this.speed = this.baseSpd;
                
                // Enhanced windup phase (0.6s) with magnitude buildup
                let windupTime = 0.6;
                let windupParticles = 0;
                let windupInterval = setInterval(() => {
                    if (this.dead) { clearInterval(windupInterval); return; }
                    
                    // Magnitude energy gathering - golden energy spheres
                    for (let i = 0; i < 16; i++) {
                        let angle = (Math.PI * 2 * i / 16) + (windupParticles * 0.1);
                        let dist = 25 + windupParticles * 4;
                        particles.push(new Particle(
                            this.x + Math.cos(angle) * dist,
                            this.y + Math.sin(angle) * dist,
                            '#FFD700', 5, 1.2
                        ));
                    }
                    
                    // Pulsing magnitude waves
                    if (windupParticles % 3 === 0) {
                        visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 60 + windupParticles * 10, 0.5));
                    }
                    
                    // Golden shockwaves
                    if (windupParticles % 5 === 0) {
                        for (let i = 0; i < 8; i++) {
                            let randAngle = Math.random() * Math.PI * 2;
                            let randDist = Math.random() * 80;
                            particles.push(new Particle(
                                this.x + Math.cos(randAngle) * randDist,
                                this.y + Math.sin(randAngle) * randDist,
                                '#FFD700', 3, 1.5
                            ));
                        }
                    }
                    
                    windupParticles++;
                }, 40);

                setTimeout(() => {
                    clearInterval(windupInterval);
                    if (this.dead) return;
                    
                    // Clear all immobilizing effects
                    this.stunTimer = 0;
                    this.freezeTimer = 0;
                    // Clear any other immobilizing effects here
                    
                    this.magnitudeBreakActive = true;
                    
                    // Q ability gets 100% defense penetration and teleport
                    // This will be applied when Q is next used
                    
                    // Enhanced magnitude break visual effect
                    for (let i = 0; i < 35; i++) {
                        particles.push(new Particle(this.x + (Math.random()-0.5)*120, this.y + (Math.random()-0.5)*120, '#FFD700', 10, 2.0));
                    }
                    visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 200, 1.2));
                    
                    // Magnitude field expansion - multiple rings
                    for (let ring = 0; ring < 4; ring++) {
                        setTimeout(() => {
                            if (this && !this.dead) {
                                visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 80 + ring * 40, 0.8));
                            }
                        }, ring * 150);
                    }
                    
                    // Golden energy pillars
                    for (let i = 0; i < 12; i++) {
                        let angle = (i / 12) * Math.PI * 2;
                        let dist = 100;
                        for (let j = 0; j < 8; j++) {
                            setTimeout(() => {
                                if (this && !this.dead) {
                                    particles.push(new Particle(
                                        this.x + Math.cos(angle) * dist,
                                        this.y + Math.sin(angle) * dist,
                                        '#FFD700', 6, 1.0
                                    ));
                                }
                            }, j * 50);
                        }
                    }
                    
                    if (this.isPlayer) addKillMsg('Magnitude Break! Effects cleared, Q enhanced');
                }, windupTime * 1000);
            }

            input(dt, spd) {
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                if (keys.q && !this._qWas) this.skill1();
                if (keys.e && !this._eWas) this.doQuantumShot();
                if (keys.f && !this._fWas) this.doMagnitudeBreak();
                if (keys.r && !this._rWas) this.useGear();
                this._qWas = keys.q;
                this._eWas = keys.e;
                this._fWas = keys.f;
                this._rWas = keys.r;
                if (this.isPlayer) updateHUD(this);
            }

            getEffectiveSpeed() { 
                let s = this.speed; 
                if (this.fWindupSlowTimer > 0) s *= 0.75;
                if (this.speedsterTimer > 0) s *= 1.5; 
                return s; 
            }
            
            getDamageMult() {
                return this.rageTimer > 0 ? 1.15 : 1;
            }

            draw(ctx) {
                super.draw(ctx);
                
                // Draw skill point indicator
                if (this.isPlayer) {
                    let barX = 20, barY = CANVAS.height - 60;
                    let barWidth = 200, barHeight = 20;
                    
                    // Background
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Skill points
                    ctx.fillStyle = '#FFD700';
                    let pointWidth = barWidth / this.maxSkillPoints;
                    for (let i = 0; i < this.skillPoints; i++) {
                        ctx.fillRect(barX + i * pointWidth + 2, barY + 2, pointWidth - 4, barHeight - 4);
                    }
                    
                    // Border
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(barX, barY, barWidth, barHeight);
                    
                    // Label
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('SKILL POINTS', barX + barWidth/2, barY - 5);
                }
            }

            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        // Master list of ALL heroes - single source of truth for hero system
        // This is defined HERE after all hero classes are fully defined (line 20383+ for Austin)
        // This makes the system future-proof: add a hero here and it works everywhere
        // FUTURE-PROOF HERO LOOKUP: Dynamically find hero classes without hardcoded registry
        // This works for ANY new hero added - just define the class and use it!
        if(document.readyState==='complete'||document.readyState==='interactive'){init();initializeStatAnimations();}else document.addEventListener('DOMContentLoaded',()=>{init();initializeStatAnimations();});

        // Online FFA functionality
