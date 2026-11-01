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

