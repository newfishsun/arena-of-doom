        class Zappa extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, p ? '#FFD700' : '#FFA500', 5800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Zappa)" : "Enemy Zappa";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.eCharges = 2;
                this.eChargeCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 280;
                this.speed = 280;
                
                // Q ability: Electro bike
                this.bikeActive = false;
                this.bikeTimer = 0;
                this.bikeDir = 0;
                this.bikeDuration = 4;
                
                // E ability: Doodles
                this.doodles = [];
                this.doodleStandTimer = 0;
                this.standingOnDoodle = null;
                this.doodlePlaceCD = 0; // 1s cooldown between placements
                
                // Enhanced dash from doodle teleport
                this.isDashing = false;
                this.canUseDash = false; // Flag to use dash with M1 after teleport
                this.canUseDashTimer = 0; // 3s window to use the dash
                this.dashDirection = 0;
                this.dashDistance = 0;
                this.dashSpeed = 0;
                
                // Electro effect tracking
                this.electroEnemies = new Map(); // enemy -> {timer, source}
                
                // F ability: Zap and mark
                this.zappedTargets = new Map(); // enemy -> {timer, slowStack}

                if (this.isPlayer) addKillMsg('Buckle up, mortals!');
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.qChargeCD > 0) this.qChargeCD -= dt;
                if (this.doodlePlaceCD > 0) this.doodlePlaceCD -= dt;
                if (this.eChargeCD > 0) this.eChargeCD -= dt;
                if (this.canUseDashTimer > 0) {
                    this.canUseDashTimer -= dt;
                    if (this.canUseDashTimer <= 0) this.canUseDash = false;
                }
                
                // Regenerate E charges
                if (this.eChargeCD <= 0 && this.eCharges < 2) {
                    this.eCharges++;
                    if (this.eCharges < 2) this.eChargeCD = 3;
                }
                
                // Bike active
                if (this.bikeActive) {
                    this.bikeTimer -= dt;
                    this.speed = this.baseSpd * 3;
                    // Update direction if player is controlling (can change direction)
                    if (this.isPlayer) {
                        this.bikeDir = this.angle;
                    }
                    this.x += Math.cos(this.bikeDir) * this.speed * dt;
                    this.y += Math.sin(this.bikeDir) * this.speed * dt;
                    
                    // Leave lightning trail
                    for (let i = 0; i < 4; i++) {
                        let offsetX = Math.cos(this.bikeDir + Math.PI) * 20 + (Math.random()-0.5)*30;
                        let offsetY = Math.sin(this.bikeDir + Math.PI) * 20 + (Math.random()-0.5)*30;
                        // Bright cyan/blue lightning particles
                        let particleColor = Math.random() > 0.5 ? '#00FFFF' : '#0099FF';
                        particles.push(new Particle(this.x + offsetX, this.y + offsetY, particleColor, 6, 0.6));
                    }
                    
                    // Check collisions with enemies
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            if (d < this.radius + e.radius + 20) {
                                e.takeDamage(600, this);
                                this.applyElectro(e, 600);
                                // Apply knockback
                                let dx = e.x - this.x;
                                let dy = e.y - this.y;
                                let dist = Math.sqrt(dx*dx + dy*dy);
                                if (dist > 0) {
                                    e.x += (dx / dist) * 200;
                                    e.y += (dy / dist) * 200;
                                }
                                this.bikeActive = false;
                                this.speed = this.baseSpd; // Reset speed on crash
                            }
                        }
                    }
                    
                    if (this.bikeTimer <= 0) {
                        this.bikeActive = false;
                        this.speed = this.baseSpd; // Reset to base speed
                        // Final lightning burst
                        for (let i = 0; i < 6; i++) {
                            let angle = (i / 6) * Math.PI * 2;
                            particles.push(new Particle(this.x + Math.cos(angle) * 40, this.y + Math.sin(angle) * 40, '#00FFFF', 5, 0.7));
                        }
                    }
                }
                
                // Handle enhanced dash from doodle teleport
                if (this.isDashing) {
                    this.performEnhancedDash();
                }
                
                // Update doodles
                this.doodles = this.doodles.filter(d => {
                    d.timer -= dt;
                    d.damageTimer -= dt;
                    
                    if (d.damageTimer <= 0) {
                        d.damageTimer = 1;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let dist = Math.sqrt((e.x-d.x)**2 + (e.y-d.y)**2);
                                if (dist < 80) {
                                    e.takeDamage(250, this);
                                    this.applyElectro(e, 250);
                                }
                            }
                        }
                    }
                    
                    return d.timer > 0;
                });
                
                // Check if standing on doodle
                if (this.doodles.length > 0) {
                    let onDoodle = null;
                    for (let d of this.doodles) {
                        let d_dist = Math.sqrt((d.x-this.x)**2 + (d.y-this.y)**2);
                        if (d_dist < 60) {
                            onDoodle = d;
                            break;
                        }
                    }
                    
                    if (onDoodle) {
                        this.doodleStandTimer += dt;
                        this.standingOnDoodle = onDoodle;
                        if (this.doodleStandTimer >= 0.5) {
                            // Teleport to other doodle
                            let otherDoodle = null;
                            for (let d of this.doodles) {
                                if (d !== onDoodle) {
                                    otherDoodle = d;
                                    break;
                                }
                            }
                            if (otherDoodle) {
                                this.x = otherDoodle.x;
                                this.y = otherDoodle.y;
                                // Mark that dash is ready to use with M1 for 3 seconds
                                this.canUseDash = true;
                                this.canUseDashTimer = 3; // 3 second window
                                this.shield += 29; // Gain shield on teleport
                                this.doodleStandTimer = 0;
                            }
                        }
                    } else {
                        this.doodleStandTimer = 0;
                        this.standingOnDoodle = null;
                        // Don't clear canUseDash here - let the timer handle it
                    }
                }
                
                // Update electro effects
                for (let [e, data] of this.electroEnemies) {
                    data.timer -= dt;
                    if (data.timer <= 0) {
                        this.electroEnemies.delete(e);
                    } else {
                        // Pass electro to nearby enemies
                        this.passElectro(e, data.source);
                    }
                }
                
                // Update zapped targets (marked)
                for (let [e, data] of this.zappedTargets) {
                    data.timer -= dt;
                    if (data.timer <= 0) {
                        this.zappedTargets.delete(e);
                    }
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
            
            applyElectro(target, dmg) {
                if (!this.electroEnemies.has(target)) {
                    this.electroEnemies.set(target, { timer: 1.0, source: this });
                } else {
                    let data = this.electroEnemies.get(target);
                    data.timer = 1.0;
                }
            }

            hasTeammateOfType(typeName) {
                return entities.some(entity =>
                    entity !== this && !entity.dead && entity.team === this.team &&
                    entity.constructor && entity.constructor.name === typeName
                );
            }
            
            passElectro(target, source) {
                // Find nearby enemies to pass electro to
                for (let e of entities) {
                    if (e !== target && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-target.x)**2 + (e.y-target.y)**2);
                        if (d < 250 && !this.electroEnemies.has(e)) {
                            let dmg = 250 * 0.5; // 50% damage pass
                            e.takeDamage(dmg, source);
                            this.applyElectro(e, dmg);
                            
                            // Draw electro link
                            if (e !== this && source === this) {
                                particles.push(new Particle((target.x+e.x)/2, (target.y+e.y)/2, '#FFD700', 4, 0.5));
                            }
                        }
                    }
                }
            }
            
            performEnhancedDash() {
                // Enhanced dash attack during doodle teleportation
                if (!this.isDashing) return;
                this.dashDistance -= this.dashSpeed * 0.016; // ~60fps
                this.x += Math.cos(this.dashDirection) * this.dashSpeed * 0.016;
                this.y += Math.sin(this.dashDirection) * this.dashSpeed * 0.016;
                
                // Create lightning trail
                for (let i = 0; i < 2; i++) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*30, this.y + (Math.random()-0.5)*30, '#00C8FF', 3, 0.4));
                }
                
                // Damage enemies in the path
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < this.radius + e.radius + 30) {
                            e.takeDamage(200, this);
                            this.applyElectro(e, 200);
                        }
                    }
                }
                
                if (this.dashDistance <= 0) {
                    this.isDashing = false;
                    // Final burst of particles
                    for (let i = 0; i < 12; i++) {
                        particles.push(new Particle(this.x + (Math.random()-0.5)*50, this.y + (Math.random()-0.5)*50, '#00C8FF', 4, 0.6));
                    }
                }
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    if (!this.bikeActive && !this.isDashing) {
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x;
                        this.y += m.y;
                    }
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                
                // M1 for basic attack or enhanced dash
                if (mouse.down) {
                    if (this.canUseDash) {
                        // Trigger enhanced dash
                        this.dashDirection = this.angle;
                        this.dashDistance = 500;
                        this.dashSpeed = 1500;
                        this.isDashing = true;
                        this.canUseDash = false;
                        this.canUseDashTimer = 0; // Clear timer when dash is used
                    } else if (this.basicCD <= 0) {
                        this.basicAtk();
                    }
                }
                if (keys.q && this.qCD <= 0 && !this.bikeActive) this.startBike();
                if (keys.e && this.eCD <= 0 && this.eCharges > 0) this.placeDoodle();
                if (keys.f && this.fCD <= 0) this.zapEnemy();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.8;
                let dmg = 80;
                let proj = new Projectile(this, this.x, this.y, this.angle + (Math.random()-0.5)*0.1, 600, dmg, 350, '#FFD700', 4);
                proj.maxDistance = 350;
                proj.onHit = (target) => {
                    this.applyElectro(target, dmg);
                };
                entities.push(proj);
                if (this.isPlayer) addKillMsg('Zap! You\'re done.');
            }
            
            startBike() {
                this.bikeActive = true;
                this.bikeTimer = this.bikeDuration;
                this.bikeDir = this.angle;
                this.qCD = 7; // 7s cooldown
                if (this.isPlayer) {
                    addKillMsg(this.hasTeammateOfType('Cyrus') ? 'Get on the bike, nerd!' : 'Vroom vroom, losers!');
                }
            }
            
            placeDoodle() {
                if (this.eCharges <= 0 || this.doodlePlaceCD > 0) return;
                if (this.doodles.length >= 2) {
                    // Remove oldest doodle
                    this.doodles.shift();
                }
                this.eCharges--;
                if (this.eCharges === 1) this.eChargeCD = 3;
                this.eCD = 0;
                this.doodlePlaceCD = 1; // 1s delay before next placement
                
                // Place doodle at current position
                let doodle = {
                    x: this.x + Math.cos(this.angle) * 60,
                    y: this.y + Math.sin(this.angle) * 60,
                    timer: 20,
                    damageTimer: 0,
                    createTime: Date.now()
                };
                this.doodles.push(doodle);
                
                if (this.isPlayer) addKillMsg('Let me just... doodle this.');
            }
            
            zapEnemy() {
                this.fCD = 15;
                this.revealTimer = 0.5;
                if (this.isPlayer) addKillMsg(this.hasTeammateOfType('Neo') ? "You're so serious. I love it." : 'God mode. On.');
                
                // Find closest enemy that has electro effect from Zappa
                let closest = null;
                let minDist = 10000;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        // Check if target has electro effect applied by Zappa
                        if (this.electroEnemies.has(e)) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            if (d < minDist) {
                                minDist = d;
                                closest = e;
                            }
                        }
                    }
                }
                
                if (closest) {
                    // Apply separate hits so training totals include the extra electro damage.
                    const zapDamage = 750;
                    const electroDamage = 750;
                    closest.takeDamage(zapDamage, this);
                    closest.takeDamage(electroDamage, this);
                    this.applyElectro(closest, zapDamage + electroDamage);
                    
                    // Mark the target
                    this.zappedTargets.set(closest, { timer: 6, slowStack: 3 });
                    
                    // Apply slowness
                    closest.slowTimer = Math.max(closest.slowTimer, 6);
                    closest.slowMultiplier = 0.4; // Slowness III
                    
                    // Particles
                    for (let i = 0; i < 20; i++) {
                        let angle = (i / 20) * Math.PI * 2;
                        particles.push(new Particle(closest.x + Math.cos(angle)*100, closest.y + Math.sin(angle)*100, '#FFD700', 4, 0.6));
                    }
                    
                    if (this.isPlayer) addKillMsg(`${this.hasTeammateOfType('Neo') ? "You're so serious. I love it." : 'Zap! You\'re done.'} (+${zapDamage + electroDamage} damage)`);
                } else {
                    if (this.isPlayer) addKillMsg('No electro targets! Build electro first.');
                }
            }
            
            takeDamage(dmg, attacker) {
                // Check if there's a zapped target that's the attacker - 20% more electro damage
                if (attacker && this.zappedTargets.has(attacker)) {
                    dmg *= 1.2; // 20% more damage to zapped targets
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
                
                if (d > 300) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.fCD <= 0) this.zapEnemy();
                    if (this.qCD <= 0 && this.qCharges > 0 && Math.random() < 0.1) this.startBike();
                    if (this.eCD <= 0 && this.eCharges > 0 && Math.random() < 0.1) this.placeDoodle();
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
                
                // Draw doodles - lightning particle effect
                for (let d of this.doodles) {
                    let screenX = d.x - camera.x;
                    let screenY = d.y - camera.y;
                    
                    // Pulsing lightning core
                    let pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
                    
                    // Inner bright core
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 8, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Main lightning body
                    ctx.fillStyle = `rgba(100, 200, 255, ${0.9 + pulse * 0.1})`;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 25, 0, Math.PI*2);
                    ctx.fill();
                    
                    // Electric outer halo
                    ctx.strokeStyle = `rgba(100, 200, 255, ${0.5 + pulse * 0.3})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 30 + pulse * 10, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Spiky lightning rays
                    for (let i = 0; i < 8; i++) {
                        let angle = (i / 8) * Math.PI * 2;
                        let rayLength = 35 + Math.sin(Date.now() / 150 + i) * 15;
                        let x2 = screenX + Math.cos(angle) * rayLength;
                        let y2 = screenY + Math.sin(angle) * rayLength;
                        ctx.strokeStyle = `rgba(100, 200, 255, ${0.7 + pulse * 0.2})`;
                        ctx.lineWidth = 2 + pulse;
                        ctx.beginPath();
                        ctx.moveTo(screenX, screenY);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    
                    // Bright flash outline
                    ctx.strokeStyle = `rgba(255, 255, 150, ${0.4 * pulse})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 25, 0, Math.PI*2);
                    ctx.stroke();
                }
                
                // Draw electro markers on affected enemies
                for (let [e] of this.electroEnemies) {
                    if (!e.dead) {
                        ctx.font = '24px Arial';
                        ctx.textAlign = 'center';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - 50;
                        ctx.fillText('⚡', screenX, screenY);
                    }
                }
                
                // Draw thunderbolt on zapped targets (marked)
                for (let [e] of this.zappedTargets) {
                    if (!e.dead) {
                        ctx.font = '28px Arial';
                        ctx.textAlign = 'center';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - 50;
                        ctx.fillText('⚡', screenX, screenY);
                    }
                }
                
                // Draw fire emoji on enemies with burn damage
                for (let e of entities) {
                    if (!e.dead && e.burnTimer && e.burnTimer > 0) {
                        ctx.font = '26px Arial';
                        ctx.textAlign = 'center';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - 30;
                        ctx.fillText('🔥', screenX, screenY);
                    }
                }
                
                // Draw bike effect
                if (this.bikeActive) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 15, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            
            getDamageMult() {
                return 1;
            }
            
            getEffectiveSpeed() {
                if (this.bikeActive) return this.baseSpd * 3;
                return this.speed;
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Cyrus extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, p ? '#00E5FF' : '#1a8fbc', 5000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Cyrus)' : 'Enemy Cyrus';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.baseSpd = 260; this.speed = this.baseSpd;
                this.droneActive = false; this.droneTimer = 0; this.droneAttackTimer = 0;
                this.drone = null; this.droneCooldown = 0; this.droneStunImmuneTimer = 0;
                this.droneUseKeyPressed = false; this.droneShutdownKeyPressed = false;
                this.droneMoveCooldown = 0;
                this.abilityBaseGlow = '#00E5FF';
                this.lastDroneBattery = 0;
            }

            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.rCD > 0) this.rCD -= dt;
                if(this.droneCooldown > 0) this.droneCooldown -= dt;
                if(this.droneStunImmuneTimer > 0) this.droneStunImmuneTimer -= dt;

                if(this.droneActive && this.drone) {
                    this.droneTimer -= dt;
                    this.angle = this.drone.angle;
                    this.x = this.droneSpawnX;
                    this.y = this.droneSpawnY;
                    if(this.droneAttackTimer > 0) this.droneAttackTimer -= dt;
                    if(this.droneAttackTimer <= 0) this.droneAutoAttack();
                    if (this.droneTimer <= 0 || this.drone.dead || this.drone.hp <= 0) {
                        this.shutdownDrone();
                    }
                    if(this.isPlayer) {
                        let spd = this.getEffectiveSpeed();
                        this.input(dt, spd);
                        updateHUD(this);
                    }
                    return;
                }

                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }

                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) { this.input(dt, spd); updateHUD(this); } else { this.ai(dt, spd); }
            }

            input(dt, spd) {
                if(this.droneActive && this.drone) {
                    let driftX = 0, driftY = 0;
                    if (keys.w) driftY--;
                    if (keys.s) driftY++;
                    if (keys.a) driftX--;
                    if (keys.d) driftX++;

                    const maxSpeed = 440;
                    const desiredX = driftX;
                    const desiredY = driftY;
                    const mag = Math.hypot(desiredX, desiredY) || 1;
                    const targetVx = (desiredX / mag) * maxSpeed;
                    const targetVy = (desiredY / mag) * maxSpeed;

                    this.drone.vx = (this.drone.vx || 0) + (targetVx - (this.drone.vx || 0)) * 0.18;
                    this.drone.vy = (this.drone.vy || 0) + (targetVy - (this.drone.vy || 0)) * 0.18;

                    const currentSpeed = Math.hypot(this.drone.vx, this.drone.vy);
                    if (currentSpeed > maxSpeed) {
                        const scale = maxSpeed / currentSpeed;
                        this.drone.vx *= scale;
                        this.drone.vy *= scale;
                    }

                    if (driftX || driftY) {
                        this.drone.x += this.drone.vx * dt;
                        this.drone.y += this.drone.vy * dt;
                        this.drone.angle = Math.atan2(this.drone.vy, this.drone.vx);
                    } else {
                        this.drone.vx *= 0.88;
                        this.drone.vy *= 0.88;
                        this.drone.x += this.drone.vx * dt;
                        this.drone.y += this.drone.vy * dt;
                    }

                    if (keys.f && !this.droneUseKeyPressed && !this.droneShutdownKeyPressed && this.droneTimer >= 3) {
                        this.droneShutdownKeyPressed = true;
                        this.shutdownDrone();
                    }
                    if (!keys.f) {
                        this.droneUseKeyPressed = false;
                        this.droneShutdownKeyPressed = false;
                    }
                    if(mouse.down && this.droneAttackTimer <= 0) this.droneAutoAttack();
                    return;
                }

                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x; this.y += m.y;
                }

                this.angle = getMouseAimAngle(this.x, this.y);
                if(mouse.down && this.basicCD <= 0) this.basicAtk();
                if(keys.q && this.qCD <= 0) this.doQ();
                if(keys.e && this.eCD <= 0) this.doE();
                if (!this.droneActive && keys.f && !this.droneUseKeyPressed && this.fCD <= 0 && this.droneCooldown <= 0) {
                    this.droneUseKeyPressed = true;
                    this.droneShutdownKeyPressed = false;
                    this.doUltimate();
                }
                if (!keys.f) {
                    this.droneUseKeyPressed = false;
                    this.droneShutdownKeyPressed = false;
                }
                if(keys.r && this.rCD <= 0) this.useGear();
            }

            ai(dt, spd) {
                if(this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t){ this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y; this.angle = Math.atan2(dy, dx); let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 250){ this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt; }
                else {
                    if(this.basicCD <= 0) this.basicAtk();
                    if(this.qCD <= 0 && Math.random() < 0.15) this.doQ();
                    if(this.eCD <= 0 && Math.random() < 0.12) this.doE();
                    if(this.fCD <= 0 && Math.random() < 0.05) this.doUltimate();
                }
            }

            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if(d < md){ md = d; c = e; }
                    }
                }
                return c;
            }

            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }

            basicAtk() {
                this.revealTimer = 0.2; this.basicCD = 0.28;
                let shot = new Projectile(this, this.x + Math.cos(this.angle) * (this.radius + 8), this.y + Math.sin(this.angle) * (this.radius + 8), this.angle + (Math.random() - 0.5) * 0.15, 860, 70, 360, '#8BE9FF', 4);
                shot.maxDistance = 360;
                entities.push(shot);
            }

            doQ() {
                this.qCD = 4;
                this.revealTimer = 0.8;
                const muzzleX = this.x + Math.cos(this.angle) * (this.radius + 16);
                const muzzleY = this.y + Math.sin(this.angle) * (this.radius + 16);
                this.cannonFlash = 0.18;
                visualEffects.push(new EnergyCannonBeam(muzzleX, muzzleY, this.angle, 950, '#00E5FF', '#DFFBFF', 0.45));
                visualEffects.push(new WaveShockwave(muzzleX + Math.cos(this.angle) * 90, muzzleY + Math.sin(this.angle) * 90, 140, 0.22, '#7CF8FF', '#00B6FF'));
                for (let i = 0; i < 18; i++) {
                    const ang = (Math.PI * 2 * i) / 18;
                    const outward = 14 + i * 0.8;
                    particles.push(new Particle(
                        muzzleX + Math.cos(this.angle + ang * 0.2) * outward,
                        muzzleY + Math.sin(this.angle + ang * 0.2) * outward,
                        '#9AF8FF', 4.5, 0.8
                    ));
                }

                const maxLen = 900;
                let bestTarget = null;
                let bestHitDist = Infinity;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        const dx = e.x - muzzleX;
                        const dy = e.y - muzzleY;
                        const dot = dx * Math.cos(this.angle) + dy * Math.sin(this.angle);
                        const perp = Math.abs(dx * Math.sin(this.angle) - dy * Math.cos(this.angle));
                        if (dot >= 0 && dot <= maxLen && perp <= e.radius + 16) {
                            if (dot < bestHitDist) {
                                bestHitDist = dot;
                                bestTarget = e;
                            }
                        }
                    }
                }

                if (bestTarget && typeof bestTarget.takeDamage === 'function') {
                    const dmg = 220 + bestTarget.maxHp * 0.18;
                    bestTarget.takeDamage(dmg, this);
                    bestTarget.slowTimer = Math.max(bestTarget.slowTimer || 0, 1.2);
                    bestTarget.revealTimer = Math.max(bestTarget.revealTimer || 0, 1.4);
                    for (let i = 0; i < 12; i++) {
                        const spread = (Math.PI * 2 * i) / 12;
                        particles.push(new Particle(bestTarget.x + Math.cos(spread) * 18, bestTarget.y + Math.sin(spread) * 18, '#9AF8FF', 6, 0.8));
                    }
                }
            }

            doE() {
                this.eCD = 7;
                let target = getMouseWorldPosition();
                if (!target) target = { x: this.x + Math.cos(this.angle) * 200, y: this.y + Math.sin(this.angle) * 200 };
                let dx = target.x - this.x;
                let dy = target.y - this.y;
                let dist = Math.hypot(dx, dy) || 1;
                let limit = 750;
                if (dist > limit) {
                    let scale = limit / dist;
                    target.x = this.x + dx * scale;
                    target.y = this.y + dy * scale;
                }

                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.hypot(e.x - target.x, e.y - target.y);
                        if (d < 150) {
                            e.takeDamage(500, this);
                            e.stunTimer = Math.max(e.stunTimer || 0, 0.75);
                            e.revealTimer = 1.0;
                        }
                    }
                }

                let effect = new WaveShockwave(target.x, target.y, 150, 0.45, '#00E5FF', '#D8F7FF');
                effectsAdd(effect);
                for (let i = 0; i < 18; i++) {
                    let ang = (Math.PI * 2 * i) / 18;
                    particles.push(new Particle(target.x + Math.cos(ang) * 30, target.y + Math.sin(ang) * 30, '#00E5FF', 4, 0.8));
                }
                if (this.isPlayer) addKillMsg('Sky Flash!');
            }

            doUltimate() {
                if (this.droneActive || this.droneCooldown > 0) return;
                this.fCD = 20;
                this.droneActive = true;
                this.droneTimer = 10;
                this.droneAttackTimer = 0;
                const drone = new Entity(this.x, this.y, 22, '#00E5FF', 5000);
                drone.owner = this;
                drone.team = this.team;
                drone.name = 'Cyrus Drone';
                drone.isDrone = true;
                drone.isTargetable = true;
                drone.radius = 22;
                drone.maxHp = 5000;
                drone.hp = 5000;
                drone.shield = 0;
                drone.vx = 0;
                drone.vy = 0;
                drone.visionRadius = 620;
                this.drone = drone;
                this.droneSpawnX = this.x;
                this.droneSpawnY = this.y;
                this.revealTimer = 1.0;
                if (this.isPlayer) addKillMsg('Drone deployed!');
            }

            shutdownDrone() {
                if (!this.droneActive || !this.drone) return;
                this.droneActive = false;
                this.droneCooldown = 20;
                this.droneStunImmuneTimer = 20;
                this.drone = null;
                this.droneSpawnX = null;
                this.droneSpawnY = null;
                this.revealTimer = 0.5;
                if (this.isPlayer) addKillMsg('Drone shutdown!');
            }

            droneAutoAttack() {
                if (!this.drone || !this.droneActive) return;
                this.droneAttackTimer = 0.45;
                const targets = [];
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.hypot(e.x - this.drone.x, e.y - this.drone.y);
                        if(d < 300){ targets.push({ e, d }); }
                    }
                }
                if(!targets.length) return;
                targets.sort((a, b) => a.d - b.d);
                const targetCount = Math.min(targets.length, 3);

                for (let i = 0; i < targetCount; i++) {
                    const { e: target, d } = targets[i];
                    const roll = Math.random();
                    let dmg = 0;
                    if (roll < 0.34) {
                        dmg = 90 + Math.random() * 35;
                    } else if (roll < 0.67) {
                        dmg = target.maxHp * (0.04 + Math.random() * 0.03);
                    } else {
                        dmg = target.maxHp * (0.045 + Math.random() * 0.04);
                    }
                    dmg *= 0.9;

                    target.takeDamage(dmg, this);

                    if (this.drone && this.drone.hp < this.drone.maxHp) {
                        this.drone.hp = Math.min(this.drone.maxHp, this.drone.hp + dmg * 0.12);
                    }

                    if (target.hp <= 0 && !target.dead) {
                        const killOwner = this.owner || this;
                        target.die && target.die(killOwner);
                        if (killOwner instanceof Entity) {
                            killOwner.kills = (killOwner.kills || 0) + 1;
                        }
                    }

                    if (d < 300) {
                        this.drone.angle = Math.atan2(target.y - this.drone.y, target.x - this.drone.x);
                    }
                }

                for (let i = 0; i < 10; i++) {
                    const ang = (Math.PI * 2 * i) / 10;
                    particles.push(new Particle(this.drone.x + Math.cos(ang) * 24, this.drone.y + Math.sin(ang) * 24, '#00E5FF', 3, 0.55));
                }
            }

            takeDamage(dmg, attacker) {
                super.takeDamage(dmg, attacker);
            }

            getEffectiveSpeed() {
                if (this.droneActive) return this.baseSpd * 1.7;
                return this.speed;
            }

            draw(ctx) {
                super.draw(ctx);
            }

            drawDroneRing(ctx) {
                if (this.drone && this.droneActive) {
                    const x = this.drone.x - camera.x;
                    const y = this.drone.y - camera.y;
                    ctx.save();
                    ctx.strokeStyle = '#7CF8FF';
                    ctx.shadowColor = '#00E5FF';
                    ctx.shadowBlur = 20;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, this.drone.radius + 18, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(x, y, this.drone.radius + 8, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = '#00E5FF';
                    ctx.fillRect(x - 18, y - 40, 36, 5);
                    ctx.fillStyle = '#00ff88';
                    ctx.fillRect(x - 18, y - 40, 36 * Math.min(1, this.drone.hp / this.drone.maxHp), 5);
                    ctx.restore();
                }
            }
        }

