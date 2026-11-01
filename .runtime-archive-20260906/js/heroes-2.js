        class RacingDuo extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, '#FF6B35', 6300);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Racing Duo)" : "Enemy Racing Duo";
                
                // Personality system
                this.personality = 'lewis'; // 'lewis' or 'charles'
                this.lewisMode = true;
                this.charlesMode = false;

                // Shared stats
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 260;
                this.speed = 260;

                // Personality switching cooldown
                this.switchCD = 0;

                // Lewis specific
                this.calmedConfidenceActive = false;
                this.calmedConfidenceTimer = 0;
                this.ragebaittingTargets = [];

                // Charles specific
                this.tractorActive = false;
                this.tractorTimer = 0;
                this.bananaLeclerc = false;
                this.bananaLeclercTimer = 0;
                this.totalLineDrawn = [];
                this.drawingLine = false;
                this.lineStartTime = 0;
                this.racingLine = null;
                this.racingLineTimer = 0;
                this.racingLinePoints = [];
                this.racingLineHitThisFrame = {};
                this.racingLineDamageTick = 0; // Track damage tick timer

            }
            

                

            performSwitch() {
                this.switchCD = 5;
                this.switchPersonality();
                if (this.isPlayer) addKillMsg('simply lovely');
            }
            
            switchPersonality() {
                if (this.lewisMode) {
                    // Switching Lewis → Charles: 2x speed boost for 3s
                    this.personality = 'charles';
                    this.lewisMode = false;
                    this.charlesMode = true;
                    this.speedsterTimer = 3;
                } else {
                    // Switching Charles → Lewis: 630 healing
                    this.personality = 'lewis';
                    this.lewisMode = true;
                    this.charlesMode = false;
                    this.hp = Math.min(this.maxHp, this.hp + 630);
                }
            }
            
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.speedsterTimer > 0) s *= 2; // 2x speed boost
                if (this.slowTimer > 0) s *= 0.6;
                return s;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                // Update cooldowns
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) {
                    // 2x faster cooldown reduction during banana leclerc
                    if (this.bananaLeclerc) {
                        this.qCD -= dt * 2;
                    } else {
                        this.qCD -= dt;
                    }
                }
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.switchCD > 0) this.switchCD -= dt;
                
                // Decrement speed boost timer
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                
                // Lewis effects
                if (this.calmedConfidenceActive) {
                    this.calmedConfidenceTimer -= dt;
                    if (this.calmedConfidenceTimer <= 0) {
                        this.calmedConfidenceActive = false;
                    }
                }
                
                // Remove expired ragebaiting
                this.ragebaittingTargets = this.ragebaittingTargets.filter(t => t && !t.dead && t.ragebaittingTimer > 0);
                
                // Charles tractor
                if (this.tractorActive) {
                    this.tractorTimer -= dt;
                    if (this.tractorTimer <= 0) {
                        this.tractorActive = false;
                        this.speed = this.baseSpd;
                    }
                }
                
                // Charles banana leclerc
                if (this.bananaLeclerc) {
                    this.bananaLeclercTimer -= dt;
                    if (this.bananaLeclercTimer <= 0) {
                        this.bananaLeclerc = false;
                    }
                }
                
                // Racing line effect
                if (this.racingLine) {
                    this.racingLineTimer -= dt;
                    this.racingLineDamageTick -= dt;
                    if (this.racingLineTimer <= 0) {
                        // Reset all entity speeds when line expires
                        for (let e of entities) {
                            if (!e.dead && e instanceof Entity && e.speed !== e.baseSpd) {
                                e.speed = e.baseSpd;
                            }
                        }
                        this.racingLine = null;
                        this.racingLinePoints = [];
                        this.racingLineHitThisFrame = {};
                    } else {
                        // Apply effects to entities on the line
                        for (let e of entities) {
                            if (!e.dead && e instanceof Entity) {
                                let onLine = false;
                                for (let i = 0; i < this.racingLine.length - 1; i++) {
                                    let p1 = this.racingLine[i];
                                    let p2 = this.racingLine[i + 1];
                                    let distToLine = this.distanceToLineSegment(e.x, e.y, p1.x, p1.y, p2.x, p2.y);
                                    if (distToLine < 200) {
                                        onLine = true;
                                        if (e.team === this.team) {
                                            e.speed = e.baseSpd * 3;
                                        } else {
                                            // Damage every 0.2 seconds
                                            if (this.racingLineDamageTick <= 0) {
                                                e.takeDamage(77, this);
                                                e.hp -= 44; // True damage
                                                if (e.hp < 0) e.hp = 0;
                                            }
                                            e.speed = e.baseSpd * 0.5;
                                        }
                                        break;
                                    }
                                }
                                
                                // Reset speed if not on line
                                if (!onLine && e.speed !== e.baseSpd) {
                                    e.speed = e.baseSpd;
                                }
                            }
                        }
                        // Reset damage tick every 0.2 seconds
                        if (this.racingLineDamageTick <= 0) {
                            this.racingLineDamageTick = 0.2;
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
                    if (keys.r && this.rCD <= 0) this.useGear();
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
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
                
                if (keys.g && this.switchCD <= 0) this.performSwitch();
                
                if (this.lewisMode) {
                    if (keys.q && this.qCD <= 0) this.calmedConfidence();
                    if (keys.e && this.eCD <= 0) this.tireMadness();
                    if (keys.f) this.drawRacingLine();
                } else {
                    if (keys.q && this.qCD <= 0) this.tractorTime();
                    if (keys.e && this.eCD <= 0) this.boxNowBox();
                    if (keys.f && this.fCD <= 0) this.bananaLeclercMode();
                }
            }
            
            basicAttack() {
                this.revealTimer = 0.5;
                this.basicCD = 0.8;
                
                if (this.bananaLeclerc) {
                    // Shoot 5 bananas with a tighter arc for easier long-range hits
                    for (let i = 0; i < 5; i++) {
                        let angle = this.angle + (i - 2) * 0.18;
                        let proj = new Projectile(this, this.x, this.y, angle, 600, 100, 600, '#FFD700', 10);
                        proj.isBanana = true;
                        proj.maxDistance = 600;
                        entities.push(proj);
                    }
                } else {
                    // Check if Lewis has Calmed Confidence active for enhanced basic
                    if (this.lewisMode && this.calmedConfidenceActive) {
                        // Enhanced basic attack with ragebaiting
                        let proj = new Projectile(this, this.x, this.y, this.angle, 550, 650, 525, '#FFD700', 15);
                        proj.isWheel = true;
                        proj.maxDistance = 525;
                        proj.onHit = (target) => {
                            // Ragebaiting: reduce defense and force walk toward Lewis
                            target.defDebuff = 3; // 10% defense reduction for 3 seconds
                            this.ragebaittingTargets.push(target);
                            target.ragebaittingTimer = 3;
                            target.ragebaittingSource = this; // Store the source (Lewis)
                        };
                        entities.push(proj);
                    } else {
                        // Normal wheel
                        let proj = new Projectile(this, this.x, this.y, this.angle, 550, 100, 525, '#FF6B35', 12);
                        proj.isWheel = true;
                        proj.maxDistance = 525;
                        entities.push(proj);
                    }
                }
            }
            
            calmedConfidence() {
                this.revealTimer = 0.5;
                this.qCD = 11;
                this.calmedConfidenceActive = true;
                this.calmedConfidenceTimer = 5;
                
                // Particles
                for (let i = 0; i < 15; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                    particles.push(new Particle(this.x, this.y, '#FFD700', 3, 0.6, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Calmed Confidence! 🏆');
            }
            
            tireMadness() {
                this.revealTimer = 0.5;
                this.eCD = 7;
                
                // Leave tires in opposite direction, 1 every 0.1s for 0.7s
                let tireCount = 0;
                let tireInterval = setInterval(() => {
                    if (tireCount >= 7) {
                        clearInterval(tireInterval);
                        return;
                    }
                    
                    let reverseAngle = this.angle + Math.PI;
                    let randomAngle = reverseAngle + (Math.random() - 0.5) * 0.6;
                    let proj = new Projectile(this, this.x, this.y, randomAngle, 350, 200, 500, '#666666', 30);
                    proj.isTire = true;
                    proj.maxDistance = 500;
                    entities.push(proj);
                    
                    tireCount++;
                }, 100);
                
                if (this.isPlayer) addKillMsg('Tire Madness! 🛞');
            }
            
            drawRacingLine() {
                // Start drawing on first call
                if (!this.drawingLine && this.fCD <= 0) {
                    this.drawingLine = true;
                    this.lineStartTime = Date.now();
                    this.racingLinePoints = [{x: this.x, y: this.y}];
                }
                
                // Continue drawing while F is held (within 2 second window)
                if (this.drawingLine && Date.now() - this.lineStartTime < 2000) {
                    let currentPoint = getMouseWorldPosition();
                    this.racingLinePoints.push(currentPoint);
                } 
                // Finish drawing when 2 seconds are up or F is released
                else if (this.drawingLine && (Date.now() - this.lineStartTime >= 2000 || !keys.f)) {
                    this.drawingLine = false;
                    if (this.racingLinePoints.length > 1) {
                        this.racingLine = this.racingLinePoints;
                        this.racingLineTimer = 7;
                        this.fCD = 31;
                    }
                    this.revealTimer = 0.5;
                }
            }
            
            tractorTime() {
                this.revealTimer = 0.5;
                this.qCD = 8;
                this.tractorActive = true;
                this.tractorTimer = 1.5; // Duration of tractor movement
                this.speed = this.baseSpd * 0.8;
                
                // Play voice line
                let audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
                audio.volume = 0.3;
                audio.play().catch(() => {});
                
                // Find enemies in radius and damage with explosion
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dist = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (dist < 300) {
                            e.takeDamage(750, this);
                            e.hp -= 250; // True damage
                            if (e.hp < 0) e.hp = 0;
                            // Apply knockback
                            let angle = Math.atan2(e.y - this.y, e.x - this.x);
                            e.x += Math.cos(angle) * 300;
                            e.y += Math.sin(angle) * 300;
                            if (this.isPlayer) addKillMsg('i am stupid');
                        }
                    }
                }
                
                // Explosion particles
                for (let i = 0; i < 30; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(400);
                    particles.push(new Particle(this.x, this.y, '#ff8800', 4, 0.8, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Tractor Time!!! 🚜');
            }
            
            boxNowBox() {
                this.revealTimer = 0.5;
                this.eCD = 12;
                
                let success = Math.random() < 0.3;
                if (success) {
                    // 30% success - get Q back with 2.5x speed
                    this.qCD = 0;
                    this.speed = this.baseSpd * 2.5;
                    
                    // Effect wears off after 5s
                    setTimeout(() => {
                        if (!this.dead) this.speed = this.baseSpd;
                    }, 5000);
                    
                    if (this.isPlayer) addKillMsg('Box Success!');
                } else {
                    // 70% failure - heal 600 but slow 50%
                    this.hp = Math.min(this.maxHp, this.hp + 600);
                    this.speed = this.baseSpd * 0.5;
                    
                    // Heal particles
                    for (let i = 0; i < 20; i++) {
                        let angle = Math.random() * Math.PI * 2;
                        let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(150);
                        particles.push(new Particle(this.x, this.y, '#FF0000', 3, 0.5, vel.x, vel.y));
                    }
                    
                    // Effect wears off after 10s
                    setTimeout(() => {
                        if (!this.dead) this.speed = this.baseSpd;
                    }, 10000);
                    
                    if (this.isPlayer) addKillMsg('NOOOOOOOOO 😭');
                }
            }
            
            bananaLeclercMode() {
                this.revealTimer = 0.5;
                this.fCD = 18;
                this.bananaLeclerc = true;
                this.bananaLeclercTimer = 8;
                this.qCD = 0; // Reset Q ability cooldown
                
                // Particles
                for (let i = 0; i < 25; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(250);
                    particles.push(new Particle(this.x, this.y, '#FFD700', 4, 0.7, vel.x, vel.y));
                }
                
                if (this.isPlayer) addKillMsg('Banana Leclerc! 🍌');
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
                    
                    if (this.lewisMode) {
                        if (this.qCD <= 0 && Math.random() < 0.15) this.calmedConfidence();
                        if (this.eCD <= 0 && Math.random() < 0.12) this.tireMadness();
                        if (this.switchCD <= 0 && Math.random() < 0.08) this.performSwitch();
                    } else {
                        if (this.qCD <= 0 && Math.random() < 0.15) this.tractorTime();
                        if (this.eCD <= 0 && Math.random() < 0.12) this.boxNowBox();
                        if (this.switchCD <= 0 && Math.random() < 0.08) this.performSwitch();
                    }
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
                if (this.dead) return;
                super.draw(ctx);
                
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // Draw based on personality
                if (this.lewisMode) {
                    // Lewis - calm driver (normal size)
                    ctx.fillStyle = '#FFB700';
                    ctx.fillRect(screenX - 16, screenY - 20, 32, 22);
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(screenX - 14, screenY - 18, 28, 16);
                    ctx.fillStyle = '#0000FF';
                    ctx.fillRect(screenX - 8, screenY - 14, 4, 4);
                    ctx.fillRect(screenX + 4, screenY - 14, 4, 4);
                    ctx.fillRect(screenX - 3, screenY - 6, 6, 3);
                    
                    // Lewis label
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('L', screenX, screenY - 28);
                } else {
                    // Charles - chaotic driver (normal size)
                    ctx.fillStyle = '#FF4444';
                    ctx.fillRect(screenX - 16, screenY - 20, 32, 22);
                    ctx.fillStyle = '#FFFF00';
                    ctx.fillRect(screenX - 14, screenY - 18, 28, 16);
                    ctx.fillStyle = '#FF0000';
                    ctx.fillRect(screenX - 8, screenY - 14, 4, 4);
                    ctx.fillRect(screenX + 4, screenY - 14, 4, 4);
                    ctx.fillRect(screenX - 3, screenY - 6, 6, 3);
                    
                    // Charles label
                    ctx.fillStyle = '#FF6B35';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('C', screenX, screenY - 28);
                }
                
                // Calmed confidence glow
                if (this.calmedConfidenceActive) {
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = Math.sin(Date.now() / 200) * 0.5 + 0.5;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 25, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                
                // Tractor glow
                if (this.tractorActive) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
                
                // Banana mode glow
                if (this.bananaLeclerc) {
                    ctx.fillStyle = '#FFD700';
                    ctx.globalAlpha = 0.4;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 30, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                
                // Draw racing line
                if (this.racingLine && this.racingLine.length > 1) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 8;
                    ctx.globalAlpha = Math.max(0, this.racingLineTimer / 7);
                    ctx.beginPath();
                    ctx.moveTo(this.racingLine[0].x - camera.x, this.racingLine[0].y - camera.y);
                    for (let p of this.racingLine) {
                        ctx.lineTo(p.x - camera.x, p.y - camera.y);
                    }
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
                
                // Personality label
                ctx.fillStyle = this.lewisMode ? '#FFD700' : '#FF4444';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.lewisMode ? 'LEWIS' : 'CHARLES', screenX, screenY - 25);
            }
            
            distanceToLineSegment(px, py, x1, y1, x2, y2) {
                let A = px - x1;
                let B = py - y1;
                let C = x2 - x1;
                let D = y2 - y1;
                let dot = A * C + B * D;
                let lenSq = C * C + D * D;
                let param = -1;
                if (lenSq !== 0) param = dot / lenSq;
                let xx, yy;
                if (param < 0) {
                    xx = x1;
                    yy = y1;
                } else if (param > 1) {
                    xx = x2;
                    yy = y2;
                } else {
                    xx = x1 + param * C;
                    yy = y1 + param * D;
                }
                let dx = px - xx;
                let dy = py - yy;
                return Math.sqrt(dx * dx + dy * dy);
            }
        }

            // Fred - new Speedster hero (iShowSpeed tribute)
            class Fred extends Entity {
                constructor(x, y, p) {
                    super(x, y, 16, p ? '#FFD700' : '#f39c12', 5500);
                    this.isPlayer = p; this.countsAsFFAHero = true;
                    this.name = p ? 'Player (Fred)' : 'Enemy Fred';
                    this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                    // Movement / passive
                    this.baseSpd = 300;
                    this.speed = this.baseSpd;
                    this.velocityBar = 0; // 0..1

                    // Basic / kicks
                    this.kickCount = 0;
                    this.kickBuffTimer = 0; // seconds remaining for reduced basic CD

                    // Q - Sui Energy
                    this.suiTimer = 0;
                    this.suiWindTick = 0;

                    // E - Vibrate
                    this.vibrateTimer = 0;
                    this.vibrateTrailTimer = 0;
                    this.vibrateTrails = []; // {x,y,timer}

                    // F - Wally West
                    this.wallyTimer = 0;
                    this.wallyDuration = 6;
                    this.slowedProjectiles = [];
                    this.wallyWeaponBoosted = false; // Track if enhanced basic has been used once
                }

                update(dt) {
                    if (this.dead) return;
                    this.updateCommon(dt);

                    if (this.basicCD > 0) this.basicCD -= dt;
                    if (this.qCD > 0) this.qCD -= dt;
                    if (this.eCD > 0) this.eCD -= dt;
                    if (this.fCD > 0) this.fCD -= dt;
                    if (this.rCD > 0) this.rCD -= dt; // decrement gear cooldown so HUD can animate

                    // Passive: velocity bar (fills when moving, drains when idle)
                    let moving = keys && (keys.w || keys.a || keys.s || keys.d);
                    if (moving) this.velocityBar = Math.min(1, this.velocityBar + 0.25 * dt); else this.velocityBar = Math.max(0, this.velocityBar - 0.5 * dt);
                    this.speed = this.baseSpd + this.velocityBar * (450 - this.baseSpd);

                    // Basic kick buff timer
                    if (this.kickBuffTimer > 0) this.kickBuffTimer = Math.max(0, this.kickBuffTimer - dt);

                    // Q - sui energy active
                    if (this.suiTimer > 0) {
                        this.suiTimer -= dt;
                        this.suiWindTick -= dt;
                        if (this.suiWindTick <= 0) {
                            this.suiWindTick += 0.5;
                            // Wind damage tick to nearby enemies (20% of current walk speed)
                            let dmg = Math.floor(this.getEffectiveSpeed() * 0.2);
                            for (let e of entities) {
                                if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                    let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                                    if (d < 250) e.takeDamage(dmg, this);
                                }
                            }
                            // wind particles
                            for (let i = 0; i < 8; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#FFD700', 3, 0.4, (Math.random()-0.5)*120, (Math.random()-0.5)*120));
                        }
                    }

                    // Vibrate trails
                    if (this.vibrateTimer > 0) {
                        this.vibrateTimer = Math.max(0, this.vibrateTimer - dt);
                        this.vibrateTrailTimer -= dt;
                        if (this.vibrateTrailTimer <= 0) {
                            this.vibrateTrailTimer += 0.2; // E ability: 2x slower trail spawning
                            this.vibrateTrails.push({ x: this.x, y: this.y, timer: 3.0 });
                            // heal Fred slightly per trail
                            this.hp = Math.min(this.maxHp, this.hp + 55);
                            for (let i = 0; i < 6; i++) particles.push(new Particle(this.x, this.y, '#ffd700', 3, 0.6, (Math.random()-0.5)*80, (Math.random()-0.5)*80));
                        }
                    }

                    // Update trails (apply slowness to entities touching trail)
                    for (let i = this.vibrateTrails.length - 1; i >= 0; i--) {
                        let t = this.vibrateTrails[i];
                        t.timer -= dt;
                        if (t.timer <= 0) this.vibrateTrails.splice(i, 1);
                        else {
                            for (let e of entities) {
                                if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                    let d = Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
                                    if (d < 40) {
                                        e.slowTimer = Math.max(e.slowTimer || 0, 3.0);
                                    }
                                }
                            }
                        }
                    }

                    // Wally West ultimate active: slow entities & projectiles in radius
                    if (this.wallyTimer > 0) {
                        this.wallyTimer = Math.max(0, this.wallyTimer - dt);

                        // slow enemies
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                                if (d < 400) e.slowTimer = Math.max(e.slowTimer || 0, 2.5);
                            }
                        }

                        // slow projectiles (temporarily reduce vx/vy and remember originals)
                        for (let ent of entities) {
                            if (ent instanceof Projectile) {
                                let d = Math.sqrt((ent.x - this.x) ** 2 + (ent.y - this.y) ** 2);
                                if (d < 400) {
                                    if (!ent._fredSlowed) {
                                        ent._fredSlowed = true;
                                        ent._fredOrigVx = ent.vx; ent._fredOrigVy = ent.vy;
                                        ent.vx *= 0.2; ent.vy *= 0.2;
                                        this.slowedProjectiles.push(ent);
                                    }
                                } else {
                                    if (ent._fredSlowed) {
                                        ent.vx = ent._fredOrigVx || ent.vx; ent.vy = ent._fredOrigVy || ent.vy; ent._fredSlowed = false;
                                    }
                                }
                            }
                        }

                        // when ultimate ends, restore slowed projectiles
                        if (this.wallyTimer <= 0) {
                            for (let proj of this.slowedProjectiles) {
                                if (proj && proj._fredSlowed) {
                                    proj.vx = proj._fredOrigVx || proj.vx; proj.vy = proj._fredOrigVy || proj.vy; proj._fredSlowed = false;
                                }
                            }
                            this.slowedProjectiles = [];
                        }
                    }

                    // Movement and action handling
                    let spd = this.getEffectiveSpeed();
                    if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
                }

                getEffectiveSpeed() { let s = this.speed; if (this.suiTimer > 0) s *= 3; if (this.wallyTimer > 0) { let wallySpeedBoost = 1.0 + this.velocityBar * 0.5; s *= wallySpeedBoost; } if (this.slowTimer > 0) s *= 0.6; return s; }

                basicAtk() {
                    this.revealTimer = 0.4;
                    // cooldown depends on whether kick buff is active
                    this.basicCD = (this.kickBuffTimer > 0) ? 0.4 : 0.6;
                    
                    // Check if Wally West is active and boost hasn't been used yet
                    if (this.wallyTimer > 0 && !this.wallyWeaponBoosted) {
                        // Enhanced Speed Blow: 150% of current walkspeed damage (min 700)
                        let dmg = Math.max(700, Math.floor(this.getEffectiveSpeed() * 1.5));
                        
                        // Lightbolt burst effect
                        particles.push(new Slash(this.x, this.y, this.angle, 180, Math.PI/2.2, '#00BFFF'));
                        
                        // Create lightbolt particles radiating outward
                        for (let i = 0; i < 12; i++) {
                            let angle = this.angle - Math.PI/4.4 + (i / 12) * Math.PI/2.2;
                            let vx = Math.cos(angle) * 300;
                            let vy = Math.sin(angle) * 300;
                            particles.push(new Particle(this.x + Math.cos(angle) * 80, this.y + Math.sin(angle) * 80, '#00BFFF', 7, 0.6, vx, vy));
                        }
                        
                        // Damage with wider range and angle
                        for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                            if (ad > Math.PI) ad = 2 * Math.PI - ad;
                            if (d < 150 && ad < Math.PI/2.2) e.takeDamage(dmg, this);
                        }
                        
                        this.wallyWeaponBoosted = true; // Mark as used
                        if (this.isPlayer) addKillMsg(`LOOK AT THAT, ${dmg} DAMAGE!`);
                    } else {
                        // Normal kick hit - longer and wider range
                        particles.push(new Slash(this.x, this.y, this.angle, 120, Math.PI/2.5, '#ffd700'));
                        
                        for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                            if (ad > Math.PI) ad = 2 * Math.PI - ad;
                            if (d < 130 && ad < Math.PI/2.5) e.takeDamage(80, this);
                        }
                    }
                    
                    this.kickCount++;
                    if (this.kickCount >= 5) { this.kickBuffTimer = 3.0; this.kickCount = 0; if (this.isPlayer) addKillMsg('🏎️ Speed Kick!'); }
                }

                suiEnergy() {
                    if (this.qCD > 0) return;
                    this.qCD = 8; this.suiTimer = 5; this.suiWindTick = 0.5;
                    // Enhanced Q visuals: Portugal colors (red and green) with varied intensity
                    for (let i = 0; i < 40; i++) {
                        let color = (Math.random() < 0.5) ? '#E74C3C' : '#27AE60'; // Red and Green
                        particles.push(new Particle(this.x, this.y, color, 5, 0.8, (Math.random()-0.5)*400, (Math.random()-0.5)*400));
                    }
                    if (this.isPlayer) addKillMsg('SEWYYYY 🇵🇹');
                }

                vibrate() {
                    if (this.eCD > 0) return; this.eCD = 12; this.vibrateTimer = 7; this.vibrateTrailTimer = 0;
                    if (this.isPlayer) addKillMsg('WHO GON STOP ME?!');
                }

                wallyWest() {
                    if (this.fCD > 0) return;
                    this.fCD = 20; this.wallyTimer = this.wallyDuration;
                    this.wallyWeaponBoosted = false; // Reset enhancement flag for next basic attack
                    // Enhanced F visuals: particles burst outward
                    for (let i = 0; i < 30; i++) {
                        let angle = (i / 30) * Math.PI * 2;
                        let vx = Math.cos(angle) * 250;
                        let vy = Math.sin(angle) * 250;
                        particles.push(new Particle(this.x, this.y, '#00BFFF', 6, 1.0, vx, vy));
                    }
                    if (this.isPlayer) addKillMsg('Stayin\' still, eyes closed.');
                }

                draw(ctx) {
                    super.draw(ctx);
                    // Draw velocity bar near player
                    if (this.isPlayer) {
                        let sx = this.x - camera.x - 30, sy = this.y - camera.y - this.radius - 25;
                        ctx.save();
                        ctx.fillStyle = '#222'; ctx.fillRect(sx, sy, 60, 6);
                        ctx.fillStyle = '#00BCD4'; ctx.fillRect(sx, sy, 60 * this.velocityBar, 6);
                        ctx.strokeStyle = '#000'; ctx.strokeRect(sx, sy, 60, 6);
                        ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText(Math.round(this.baseSpd + this.velocityBar*(450-this.baseSpd)) + ' spd', sx + 30, sy - 6);
                        ctx.restore();
                    }

                    // Draw Wally West ultimate radius (visible speed effect)
                    if (this.wallyTimer > 0) {
                        let screenX = this.x - camera.x, screenY = this.y - camera.y;
                        let progress = this.wallyTimer / this.wallyDuration;
                        
                        ctx.save();
                        // Outer ring with pulsing effect
                        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(Date.now() * 0.005);
                        ctx.strokeStyle = '#00BFFF';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, 400, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Lightning bolts around radius
                        for (let i = 0; i < 8; i++) {
                            let angle = (i / 8) * Math.PI * 2;
                            let x1 = screenX + Math.cos(angle) * 400;
                            let y1 = screenY + Math.sin(angle) * 400;
                            let x2 = screenX + Math.cos(angle) * 420;
                            let y2 = screenY + Math.sin(angle) * 420;
                            
                            ctx.strokeStyle = '#FFD700';
                            ctx.lineWidth = 2;
                            ctx.globalAlpha = 0.6 + 0.4 * Math.sin(Date.now() * 0.008 + i);
                            ctx.beginPath();
                            ctx.moveTo(x1, y1);
                            // Random jitter for lightning effect
                            for (let j = 0; j < 3; j++) {
                                let t = (j + 1) / 3;
                                let px = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
                                let py = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
                                ctx.lineTo(px, py);
                            }
                            ctx.lineTo(x2, y2);
                            ctx.stroke();
                        }
                        
                        // Inner glow
                        ctx.globalAlpha = 0.2;
                        ctx.fillStyle = '#00BFFF';
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, 400, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();
                    }

                    // Draw vibrate trails
                    for (let t of this.vibrateTrails) {
                        let sx = t.x - camera.x, sy = t.y - camera.y;
                        ctx.save(); ctx.globalAlpha = Math.max(0, t.timer / 3.0 * 0.6); ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(sx, sy, 18, 0, Math.PI*2); ctx.fill(); ctx.restore();
                    }
                }

                // Find nearest visible enemy (consistent with other heroes)
                findTarget(){
                    let c = null, md = 99999;
                    for (let e of entities) {
                        if (e === this || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                        if (!e.isVisibleTo(this)) continue;
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < md) { md = d; c = e; }
                    }
                    return c;
                }

                ai(dt,spd){
                    // Simple bot behaviour for Fred so enemy Freds work in FFA / 5v5
                    if(this.handleSafeZone && this.handleSafeZone(dt)) return;
                    let t = this.findTarget();
                    if(!t){ this.wander(dt,spd); return; }
                    let dx = t.x - this.x, dy = t.y - this.y;
                    this.angle = Math.atan2(dy,dx);
                    let d = Math.sqrt(dx*dx + dy*dy);

                    // If far: close quickly (use Q to dash)
                    if(d > 350){
                        if(this.qCD <= 0) this.suiEnergy();
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;

                    // Mid range: approach and occasionally use E/F
                    } else if(d > 140){
                        if(Math.random() < 0.05 && this.eCD <= 0) this.vibrate();
                        if(Math.random() < 0.02 && this.fCD <= 0) this.wallyWest();
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;

                    // Close range: attack
                    } else {
                        if(this.basicCD <= 0) this.basicAtk();
                        if(Math.random() < 0.15 && this.eCD <= 0) this.vibrate();
                        if(Math.random() < 0.10 && this.fCD <= 0) this.wallyWest();
                    }
                }

                input(dt, spd) {
                    // movement
                    let dx = 0, dy = 0;
                    if (keys.w) dy--;
                    if (keys.s) dy++;
                    if (keys.a) dx--;
                    if (keys.d) dx++;
                    if (dx || dy) {
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x; this.y += m.y;
                    }

                    // facing & actions
                    this.angle = getMouseAimAngle(this.x, this.y);
                    if (mouse.down && this.basicCD <= 0) this.basicAtk();
                    if (keys.q && this.qCD <= 0) this.suiEnergy();
                    if (keys.e && this.eCD <= 0) this.vibrate();
                    if (keys.f && this.fCD <= 0) this.wallyWest();
                    if (keys.r && this.rCD <= 0) this.useGear();
                }
            }

        class Noli extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#800080' : '#4b0082', 6000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Noli)" : "Enemy Noli";
                this.currentSkin = 'default';
                this.skinIcon = null;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 180;
                this.speed = this.baseSpd;
                this.numbnessCharge = 0;
            }

            getSkinThemeColors() {
                if (this.currentSkin === 'Numbness') {
                    return {
                        primary: '#dfe4ea',
                        secondary: '#9aa0a8',
                        accent: '#bfc5cc',
                        dark: '#4b5057'
                    };
                }
                return {
                    primary: '#800080',
                    secondary: '#DA70D6',
                    accent: '#800080',
                    dark: '#4b0082'
                };
            }

            // Q
            voidForm = false;
            voidCasts = 0;
            explosionPos = null;
            hallucinatedEnemies = new Set();
            // E
            rushing = false;
            rushCount = 0;
            rushTimer = 0;
            canSecondRush = false;
            secondRushDelay = 0;
            hitDuringRush = false;
            secondRushUsed = false;
            // F
            glitched = false;
            glitchTimer = 0;
            glitchDamageTimer = 0;
            // G
            teleportCharges = 0;
            
            takeDamage(amt, src) {
                if (this.voidForm) amt *= 0.8;
                if (this.glitched) return;
                super.takeDamage(amt, src);
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.secondRushDelay > 0) this.secondRushDelay -= dt;
                if (this.rushTimer > 0) this.rushTimer -= dt;
                if (this.glitched) {
                    this.glitchTimer -= dt;
                    this.glitchDamageTimer -= dt;
                    if (this.glitchDamageTimer <= 0) {
                        this.glitchDamageTimer = 0.5;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 280) {
                                e.takeDamage(125, this); // 250 dmg/s normal
                                if (e.hallucinationTimer > 0) {
                                    e.hp -= 25; // 50 dmg/s true damage extra
                                    if (e.hp <= 0 && !e.dead) {
                                        e.dead = true;
                                        this.kills++;
                                        if (this.isPlayer) addKillMsg(e.name + ' killed!');
                                    }
                                }
                            }
                        }
                    }
                    if (this.glitchTimer <= 0) {
                        this.glitched = false;
                        this.speed = this.baseSpd;
                    }
                }
                if (this.glitched) {
                    const theme = this.getSkinThemeColors();
                    // Glitch particles should respect the selected skin instead of default purple.
                    for (let i = 0; i < 2; i++) {
                        particles.push(new Particle(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, theme.primary, 2, 0.2));
                    }
                }
                if (this.currentSkin === 'Numbness') {
                    if (this.glitched || this.voidForm) {
                        this.numbnessCharge = Math.min(1, this.numbnessCharge + dt * 0.45);
                    } else if (this.rushing) {
                        this.numbnessCharge = Math.min(1, this.numbnessCharge + dt * 0.35);
                    } else {
                        this.numbnessCharge = Math.max(0, this.numbnessCharge - dt * 0.25);
                    }
                } else {
                    this.numbnessCharge = Math.max(0, this.numbnessCharge - dt * 0.5);
                }
                if (this.rushing) {
                    if (this.rushTimer <= 0 || this.hitDuringRush) {
                        this.rushing = false;
                        if (this.rushCount == 1) {
                            if (this.hitDuringRush) {
                                console.log('[Noli] finished rush1 with hit -> canSecondRush true');
                                this.canSecondRush = true;
                                this.eCD = 0.5;
                            } else {
                                this.eCD = 15;
                            }
                        } else if (this.rushCount == 2) {
                            // Finished second rush: enforce longer cooldown and allow future sequences
                            console.log('[Noli] finished rush2 -> applying cooldown and reset secondRushUsed');
                            this.secondRushUsed = false;
                            this.canSecondRush = false;
                        }
                    }
                }
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (this.hallucinationTimer > 0) {
                    dx = (Math.random() - 0.5) * 2;
                    dy = (Math.random() - 0.5) * 2;
                } else {
                    if (keys.w) dy--;
                    if (keys.s) dy++;
                    if (keys.a) dx--;
                    if (keys.d) dx++;
                }
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) {
                    this.basicAttack();
                }
                if (keys.q && this.qCD <= 0) this.voidFormAbility();
                if (keys.e) {
                    console.log('[Noli] input E pressed eCD=', this.eCD, 'canSecondRush=', this.canSecondRush, 'rushing=', this.rushing, 'rushCount=', this.rushCount, 'secondUsed=', this.secondRushUsed);
                    // Only allow starting a rush when eCD is ready. Second-rush requires canSecondRush to be true
                    // and eCD <= 0 (the 0.5s window after a hit is applied via eCD).
                    if (this.eCD <= 0 && !this.rushing) {
                        this.startRush();
                    } else if (this.rushing) {
                        this.continueRush(dt, spd);
                    }
                } else {
                    if (this.rushing) {
                        this.rushing = false;
                        // Handle interruption of rush
                        if (this.rushCount == 1) {
                            this.eCD = 15;
                            this.canSecondRush = false;
                        } else if (this.rushCount == 2) {
                            this.secondRushUsed = false;
                            this.canSecondRush = false;
                            this.eCD = 15;
                        }
                        this.hitDuringRush = false;
                    }
                }
                if (keys.f && this.fCD <= 0) this.glitchedState();
                if (keys.g && this.teleportCharges > 0) this.teleport();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAttack() {
                this.revealTimer = 0.5;
                if (this.voidForm) {
                    this.voidStar();
                } else {
                    this.voidClaw();
                }
            }
            
            voidClaw() {
                const theme = this.getSkinThemeColors();
                particles.push(new Slash(this.x, this.y, this.angle, 160, Math.PI / 1.5, theme.primary));
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 160) {
                        let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                        if (ad > Math.PI) ad = 2 * Math.PI - ad;
                        if (ad < Math.PI / 3) {
                            e.takeDamage(150, this);
                            e.revealTimer = 1.0;
                        }
                    }
                }
                this.basicCD = 1.0;
            }
            
            voidStar() {
                if (this.voidCasts <= 0) {
                    this.voidForm = false;
                    return;
                }
                this.voidCasts--;
                if (this.voidCasts == 2) {
                    // First cast: explode and pull
                    const theme = this.getSkinThemeColors();
                    let proj = new Projectile(this, this.x, this.y, this.angle, 1500, 0, 1000, theme.secondary, 10, false, false, true);
                    proj.onExplode = () => {
                        this.explosionPos = { x: proj.x, y: proj.y };
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((proj.x - e.x)**2 + (proj.y - e.y)**2) < 150) {
                                let dx = proj.x - e.x;
                                let dy = proj.y - e.y;
                                let dist = Math.sqrt(dx*dx + dy*dy);
                                if (dist > 0) {
                                    e.x += (dx / dist) * 200;
                                    e.y += (dy / dist) * 200;
                                }
                                e.takeDamage(800, this);
                                // Apply slow from first cast
                                e.applyStatus('slow', 3.0, this);
                                this.hallucinatedEnemies.add(e);
                                particles.push(new Particle(e.x, e.y, theme.secondary, 8, 1.0));
                                if (this.isPlayer) addKillMsg("Marked!");
                            }
                        }
                    };
                    entities.push(proj);
                    // Void star throw particles
                    for (let i = 0; i < 5; i++) {
                        particles.push(new Particle(this.x, this.y, theme.secondary, 4, 0.6));
                    }
                } else if (this.voidCasts == 1) {
                    // Second cast: teleport
                    if (this.explosionPos) {
                        this.x = this.explosionPos.x;
                        this.y = this.explosionPos.y;
                    } else {
                        // If no explosion position, teleport in direction player is facing
                        let teleportDist = 400;
                        this.x += Math.cos(this.angle) * teleportDist;
                        this.y += Math.sin(this.angle) * teleportDist;
                    }
                    // After teleporting to explosion, slam nearby enemies for 500 damage
                    const theme = this.getSkinThemeColors();
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 300) {
                                e.takeDamage(500, this);
                                e.applyStatus('reveal', 1.0, this);
                                for (let i = 0; i < 6; i++) particles.push(new Particle(e.x, e.y, theme.primary, 6, 0.8));
                            }
                        }
                    }
                } else if (this.voidCasts == 0) {
                    // Third cast: damage marked enemies and apply hallucination to all nearby
                    for (let e of this.hallucinatedEnemies) {
                        if (!e.dead) {
                            e.takeDamage(250, this);
                            e.applyStatus('hallucinationTimer', 10, this);
                        }
                    }
                    // Also apply hallucination to all nearby enemies
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 400) {
                                e.hallucinationTimer = 10;
                            }
                        }
                    }
                    this.hallucinatedEnemies.clear();
                    this.voidForm = false;
                }
                this.basicCD = 1.0;
            }
            
            voidFormAbility() {
                this.voidForm = true;
                this.voidCasts = 3;
                this.explosionPos = null;
                this.hallucinatedEnemies.clear();
                this.qCD = 10;
            }
            
            startRush() {
                console.log('[Noli] startRush called secondUsed=', this.secondRushUsed, 'canSecondRush=', this.canSecondRush, 'eCD=', this.eCD, 'rushing=', this.rushing);
                if (this.secondRushUsed && !this.canSecondRush) return;
                if (this.canSecondRush) {
                    this.rushCount = 2;
                    this.rushTimer = 8;
                    this.hitDuringRush = false;
                    this.canSecondRush = false;
                    this.secondRushUsed = true;
                    this.eCD = 15;
                } else {
                    this.rushCount = 1;
                    this.rushTimer = 10;
                    this.hitDuringRush = false;
                    this.canSecondRush = false;
                    this.secondRushUsed = false;
                    this.eCD = 15;
                }
                this.rushing = true;
                this.secondRushDelay = 0;
            }
            
            continueRush(dt, spd) {
                // Rush forward
                const theme = this.getSkinThemeColors();
                let rushMultiplier = this.rushCount == 1 ? 2.5 : 4;
                this.x += Math.cos(this.angle) * spd * rushMultiplier * dt;
                this.y += Math.sin(this.angle) * spd * rushMultiplier * dt;
                if (this.currentSkin === 'Numbness') {
                    this.numbnessCharge = Math.min(1, this.numbnessCharge + dt * 0.35);
                }
                // Radiant particles during rush
                for (let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x + (Math.random() - 0.5) * 30, this.y + (Math.random() - 0.5) * 30, theme.primary, 3 + Math.random() * 2, 0.4 + Math.random() * 0.3));
                }
                // Check hits
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((this.x - e.x)**2 + (this.y - e.y)**2) < 70) {
                        if (!this.hitDuringRush) {
                            this.hitDuringRush = true;
                            console.log('[Noli] continueRush hit; rushCount=', this.rushCount);
                            let dmg = this.rushCount == 1 ? 100 : 1100;
                            if (e.hallucinationTimer > 0) dmg += 300;
                            e.takeDamage(dmg, this);
                            if (this.rushCount == 1) e.hallucinationTimer = 10;
                            let stun = this.rushCount == 1 ? 0.5 : 1.0;
                            if (this.rushCount == 2 && e.hallucinationTimer > 0) stun += 0.5;
                            e.applyStatus('stun', stun, this);
                            // Heal 500 on hit
                            this.hp = Math.min(this.maxHp, this.hp + 500);
                            // Knockback
                            let dx = e.x - this.x;
                            let dy = e.y - this.y;
                            let dist = Math.sqrt(dx*dx + dy*dy);
                            if (dist > 0) {
                                e.x += (dx / dist) * 150;
                                e.y += (dy / dist) * 150;
                            }
                            if (this.rushCount == 1) {
                                this.canSecondRush = true;
                            }
                        }
                    }
                }
                // If second rush hits, dispel hallucination from all enemies
                if (this.rushCount == 2 && this.hitDuringRush) {
                    for (let e of entities) {
                        if (e.hallucinationTimer > 0) e.hallucinationTimer = 0;
                    }
                }
            }
            
            glitchedState() {
                this.glitched = true;
                this.glitchTimer = 3;
                this.glitchDamageTimer = 0;
                this.speed = this.baseSpd * 2;
                this.fCD = 11;
            }
            
            teleport() {
                const theme = this.getSkinThemeColors();
                this.teleportCharges--;
                this.x = Math.random() * WORLD_SIZE;
                this.y = Math.random() * WORLD_SIZE;
                // Teleport particles
                for (let i = 0; i < 8; i++) {
                    particles.push(new Particle(this.x, this.y, theme.primary, 5, 0.8));
                }
                // Apply hallucination mark to nearby enemies in radius (300)
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 300) {
                            e.hallucinationTimer = 10;
                            this.hallucinatedEnemies.add(e);
                            for (let i = 0; i < 6; i++) particles.push(new Particle(e.x, e.y, theme.primary, 6, 0.8));
                            if (this.isPlayer) addKillMsg("Marked!");
                        }
                    }
                }
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                if (this.hp < this.maxHp * 0.3) {
                    let cube = this.findNearestHealthCube();
                    if (cube) {
                        let dx = cube.x - this.x, dy = cube.y - this.y;
                        this.angle = Math.atan2(dy, dx);
                        let d = Math.sqrt(dx*dx + dy*dy);
                        if (d > 20) {
                            this.x += Math.cos(this.angle) * spd * 1.2 * dt;
                            this.y += Math.sin(this.angle) * spd * 1.2 * dt;
                        }
                        return;
                    }
                }
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                let d = Math.sqrt(dx*dx + dy*dy);
                if (this.hallucinationTimer > 0) {
                    // Random movement
                    this.angle += (Math.random() - 0.5) * 0.5;
                    this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                    this.y += Math.sin(this.angle) * spd * 0.5 * dt;
                } else {
                    if (d > 50) {
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;
                    }
                }
                if (d < 600) {
                    if (this.qCD <= 0) this.voidFormAbility();
                    if (this.eCD <= 0 && !this.rushing) this.startRush();
                    if (this.fCD <= 0) this.glitchedState();
                    if (this.basicCD <= 0) this.basicAttack();
                }
                if (this.rushing) this.continueRush(dt, spd);
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
                const theme = this.getSkinThemeColors();
                if (this.currentSkin === 'Numbness') {
                    if (!drawSkinImage(ctx, this, 'noli', this.currentSkin, '#a0a7af', { filter: 'brightness(0.9) saturate(0.8)', alpha: 0.96 })) {
                        super.draw(ctx);
                    }
                } else {
                    super.draw(ctx);
                }

                if (this.voidForm) {
                    ctx.strokeStyle = this.currentSkin === 'Numbness' ? theme.primary : '#800080';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 15, 0, Math.PI * 2);
                    ctx.stroke();
                }
                if (this.glitched) {
                    ctx.strokeStyle = this.currentSkin === 'Numbness' ? theme.primary : '#800080';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                ctx.beginPath();
                ctx.moveTo(this.x - camera.x, this.y - camera.y);
                ctx.lineTo((this.x - camera.x) + Math.cos(this.angle) * (this.radius + 12), (this.y - camera.y) + Math.sin(this.angle) * (this.radius + 12));
                ctx.strokeStyle = this.currentSkin === 'Numbness' ? '#e5e7eb' : '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                if (this.currentSkin === 'Numbness' && (this.voidForm || this.glitched || this.numbnessCharge > 0.05)) {
                    const px = this.x - camera.x;
                    const py = this.y - camera.y - 70;
                    const barWidth = 140;
                    const barHeight = 22;
                    ctx.save();
                    ctx.fillStyle = 'rgba(10, 10, 12, 0.8)';
                    ctx.fillRect(px - barWidth / 2, py, barWidth, barHeight);
                    ctx.strokeStyle = '#dfe4ea';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px - barWidth / 2, py, barWidth, barHeight);
                    ctx.fillStyle = '#6b7280';
                    ctx.fillRect(px - barWidth / 2 + 4, py + 5, barWidth - 8, 8);
                    ctx.fillStyle = '#f3f4f6';
                    const chargeWidth = (barWidth - 8) * this.numbnessCharge;
                    ctx.fillRect(px - barWidth / 2 + 4, py + 5, chargeWidth, 8);
                    ctx.fillStyle = '#e5e7eb';
                    ctx.font = 'bold 12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('DELETED...', px, py + 18);
                    ctx.restore();
                }
            }
        }

        class Coolkidd extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#b22222' : '#8b0000', 6767);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Coolkidd)" : "Enemy Coolkidd";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0; this.rCD = 0;
                this.baseSpd = 200;
                this.speed = this.baseSpd;
                this.hacked = false;
                this.brickNext = false;
                this.trueDmgBuff = 0;
                this.damageBuffMultiplier = 1; // 20% damage buff from hacked enemies
                this.gActive = false;
                this.gTimer = 0;
                this.gDirection = 0;
                this.hackZones = []; // Array of hack zones
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.hacked) {
                    // Fire particles around Coolkidd
                    if (Math.random() < 0.1) {
                        let angle = Math.random() * Math.PI * 2;
                        let dist = Math.random() * this.radius * 2;
                        let px = this.x + Math.cos(angle) * dist;
                        let py = this.y + Math.sin(angle) * dist;
                        particles.push(new Particle(px, py, '#ff4500', 3, 0.5));
                    }
                }
                
                // Update hack zones - each zone deals damage and has a duration
                this.hackZones = this.hackZones.filter(zone => {
                    zone.timer -= dt;
                    zone.damageTimer -= dt;
                    
                    // Deal damage every 0.1 seconds
                    if (zone.damageTimer <= 0) {
                        zone.damageTimer = 0.1;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 450) {
                                    e.takeDamage(27, this);
                                }
                            }
                        }
                    }
                    
                    return zone.timer > 0; // Keep zone if still active
                });
                
                // G ability mobility
                if (this.gActive) {
                    this.gTimer -= dt;
                    if (this.gTimer <= 0) {
                        this.gActive = false;
                        this.speed = this.baseSpd;
                    }
                }
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.gCD > 0) this.gCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                // Only update angle if not rushing
                if (!this.gActive) {
                    this.angle = getMouseAimAngle(this.x, this.y);
                } else {
                    // Continue moving in rush direction
                    this.x += Math.cos(this.gDirection) * this.speed * dt;
                    this.y += Math.sin(this.gDirection) * this.speed * dt;
                }
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.firePizza();
                if (keys.e && this.eCD <= 0) this.hackNearby();
                if (keys.f && this.fCD <= 0) this.summonMinions();
                if (keys.g && this.gCD <= 0) this.rushMobility();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                if (this.brickNext) {
                    let proj = new Projectile(this, this.x, this.y, this.angle, 600, 600, 500, '#8b4513', 10);
                    proj.isBrick = true;
                    proj.damageBuff = this.damageBuffMultiplier;
                    proj.owner = this;
                    entities.push(proj);
                    this.brickNext = false;
                    this.hacked = false;
                    this.speed = this.baseSpd;
                    this.trueDmgBuff = 0;
                    this.damageBuffMultiplier = 1;
                } else {
                    let proj = new Projectile(this, this.x, this.y, this.angle, 500, 150, 150, '#fff', 7);
                    proj.maxDistance = 250;
                    entities.push(proj);
                }
                this.basicCD = 0.75;
            }
            
            firePizza() {
                this.qCD = 4;
                // Faster projectile speed (700 instead of 500)
                let proj = new Projectile(this, this.x, this.y, this.angle, 700, 500, 400, '#ff4500', 15);
                proj.isPizza = true;
                proj.onHit = (target) => {
                    // Apply burn on direct hit
                    target.burnTimer = Math.max(target.burnTimer || 0, 5);
                    target.burnOwner = this;
                    target.burnDamagePerSec = 150;
                    // Add fire particles on hit
                    for (let i = 0; i < 5; i++) particles.push(new Particle(proj.x, proj.y, '#ff4500', 3, 0.6));
                };
                entities.push(proj);
            }
            
            hackNearby() {
                this.eCD = 11;
                // Create hack zone at current location that lasts 5 seconds
                this.hackZones.push({
                    timer: 5,
                    damageTimer: 0
                });
                
                // Stun nearby enemies in 450 radius
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 450) {
                            e.applyStatus('stun', 1.0, this); // Stun for 1 second
                        }
                    }
                }
                
                // Activate brick state and damage buff
                this.hacked = true;
                this.speed *= 1.2;
                this.brickNext = true;
                this.damageBuffMultiplier = 1.2; // 20% damage increase
                // Add hack effect particles
                for (let i = 0; i < 15; i++) particles.push(new Particle(this.x + (Math.random() - 0.5) * 100, this.y + (Math.random() - 0.5) * 100, '#ff00ff', 3, 0.6));
            }
            
            summonMinions() {
                this.fCD = 16;
                for (let i = 0; i < 2; i++) {
                    let m = new Minion(this.x + (i * 30 - 15), this.y, this);
                    entities.push(m);
                }
            }
            
            rushMobility() {
                this.gCD = 8;
                this.gActive = true;
                this.gTimer = 1.5; // 1.5 second rush duration
                this.gDirection = this.angle; // Lock direction at start of rush
                this.speed = this.baseSpd * 2.5; // 2.5x speed override
                // Add rush particles
                for (let i = 0; i < 20; i++) particles.push(new Particle(this.x + (Math.random() - 0.5) * 150, this.y + (Math.random() - 0.5) * 150, '#ffff00', 3, 0.8));
                if (this.isPlayer) addKillMsg('Rushing!');
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);
                if (d > 50) this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt;
                if (d < 300 && this.qCD <= 0) this.firePizza();
                if (d < 200 && this.eCD <= 0) this.hackNearby();
                if (d < 400 && this.fCD <= 0) this.summonMinions();
                if (d > 400 && this.gCD <= 0) this.rushMobility();
                if (d < 150 && this.basicCD <= 0) this.basicAtk();
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
            
            getEffectiveSpeed() {
                if (this.gActive) return this.speed; // Override speed during rush
                return this.speed;
            }
            
            draw(ctx) {
                super.draw(ctx);
                // Draw hack zones following Coolkidd
                for (let zone of this.hackZones) {
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 450, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 450, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        class Vival extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, '#8B008B', 5000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (🗡️ Vival)" : "Enemy 🗡️ Vival";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0; this.rCD = 0;
                this.baseSpd = 250;
                this.speed = this.baseSpd;
                
                // Passive tracking
                this.lifeDeathHitCount = 0;
                this.reviveReady = false;
                
                // Q ability: Cycle Burst with speed buff
                this.cycleActive = false;
                this.cycleTimer = 0;
                this.cycleBasicDamage = 800;
                this.speedBuffTimer = 0; // 2x speed buff after Q
                
                // E ability: Life and Death hits
                this.lastEnemiesHit = [];
                
                // F ability: Believer
                this.linkedTargets = {};
                
                // G ability: Ritual spawn point
                this.ritualX = x;
                this.ritualY = y;
                this.ritualActive = false;
                this.secondLifeTriggered = false;
                
                // Visual animations
                this.drawTimer = 0;
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
                if (this.speedBuffTimer > 0) this.speedBuffTimer -= dt;
                
                // Update animation timer
                this.drawTimer += dt;
                
                // Cycle burst is one-time only, no timer needed
                
                // Update linked targets from Believer
                for (let targetId in this.linkedTargets) {
                    let link = this.linkedTargets[targetId];
                    link.timer -= dt;
                    if (link.timer <= 0) {
                        delete this.linkedTargets[targetId];
                    } else {
                        // Lifesteal every 0.25s
                        link.damageTimer -= dt;
                        if (link.damageTimer <= 0) {
                            link.damageTimer = 0.25;
                            let target = link.target;
                            if (target && !target.dead) {
                                let lifeStealDamage = Math.floor(target.maxHp * 0.015);
                                
                                // Cap lifesteal damage against non-player targets (except 1v1 training)
                                let isNonPlayerTarget = target.isTrainingDummy || target.name === "Wither Boss" || target.isStatue;
                                let isExcludedFrom1v1 = !target.isTrainingDummy1v1; // 1v1 mode is NOT subject to cap
                                let shouldCapDamage = isNonPlayerTarget && isExcludedFrom1v1;
                                
                                if (shouldCapDamage) {
                                    // Initialize cumulative damage tracker if not present
                                    if (!link.cumulativeDamage) {
                                        link.cumulativeDamage = 0;
                                    }
                                    
                                    // Check if adding damage would exceed 1000 cap
                                    if (link.cumulativeDamage + lifeStealDamage > 1000) {
                                        // Cap to remaining amount
                                        lifeStealDamage = Math.max(0, 1000 - link.cumulativeDamage);
                                    }
                                    
                                    link.cumulativeDamage += lifeStealDamage;
                                    
                                    // Stop applying damage if cap reached
                                    if (link.cumulativeDamage >= 1000) {
                                        target.takeDamage(lifeStealDamage, this);
                                        this.hp = Math.min(this.maxHp, this.hp + lifeStealDamage);
                                        delete this.linkedTargets[targetId];
                                        continue;
                                    }
                                }
                                
                                target.takeDamage(lifeStealDamage, this);
                                this.hp = Math.min(this.maxHp, this.hp + lifeStealDamage);
                                // Lifesteal particles
                                particles.push(new Particle(target.x, target.y, '#FF1493', 2, 0.4));
                            }
                        }
                    }
                }
                
                // Check for second life trigger (5% HP threshold)
                // Require `reviveReady` indicator so second life only occurs when player earned it
                if (!this.secondLifeTriggered && this.reviveReady && this.hp <= this.maxHp * 0.05 && this.gCD <= 0 && this.ritualActive) {
                    this.triggerSecondLife();
                    return;
                }
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } 
                else this.ai(dt, spd);
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
                if (keys.q && this.qCD <= 0) this.cycleBurst();
                if (keys.e && this.eCD <= 0) this.lifeAndDeath();
                if (keys.f && this.fCD <= 0) this.believer();
                if (keys.g && this.gCD <= 0) this.ritual();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                let damage = this.cycleActive ? this.cycleBasicDamage : 100;
                let hitEnemies = 0;
                
                if (this.cycleActive) {
                    // Cycling Torture - AOE attack (one-time enhanced basic)
                    // More deadly visuals: dark trail, larger impact, and screen shake
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 250) {
                                e.takeDamage(damage, this);
                                particles.push(new Particle(e.x, e.y, '#551A8B', 6, 0.7));
                                particles.push(new Particle(e.x + (Math.random()-0.5)*30, e.y + (Math.random()-0.5)*30, '#220022', 5, 0.6));
                                // dark impact flash
                                try { effectsAdd(new ImpactFlash(e.x, e.y, Math.random()*Math.PI*2, 140, 0.6, '#550055')); } catch(_){ }
                                hitEnemies++;
                            }
                        }
                    }
                    // Reduce E cooldown if Cycle Burst hit enemies
                    if (hitEnemies > 0) {
                        this.eCD = Math.max(0, this.eCD - 4);
                        screenShake(8);
                    }
                    // Reset cycle state after one use
                    this.cycleActive = false;
                } else {
                    // Normal dagger stab - single target towards mouse
                    // Make the stab look deadly: thin core trail + dark slash + small gore particles on hit
                    try { effectsAdd(new SwordTrail(this.x, this.y, this.angle, 140, 0.4, '#551A8B')); } catch(_){ }
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y;
                            let rx = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
                            let ry = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
                            if (rx > -e.radius && rx < 120 + e.radius && ry > -30 - e.radius && ry < 30 + e.radius) {
                                e.takeDamage(damage, this);
                                // hit particles
                                for (let j = 0; j < 6; j++) {
                                    particles.push(new Particle(e.x + (Math.random()-0.5)*20, e.y + (Math.random()-0.5)*20, '#8B0000', 3, 0.5));
                                    particles.push(new Particle(e.x + (Math.random()-0.5)*10, e.y + (Math.random()-0.5)*10, '#551A8B', 2, 0.45));
                                }
                                try { effectsAdd(new ImpactFlash(e.x, e.y, Math.random()*Math.PI*2, 90, 0.5, '#330022')); } catch(_){ }
                                screenShake(6);
                            }
                        }
                    }
                }
                this.basicCD = 0.5;

                // broadcast basic attack visual state so remote proxies can replicate the trail
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.vival = this.abilityVisuals.vival || {};
                this.abilityVisuals.vival.basic = { cycle: this.cycleActive, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
            }
            
            cycleBurst() {
                this.qCD = 6;
                // Apply 2x speed buff for 2 seconds
                this.speedBuffTimer = 2.0;
                
                // Dash forward
                let dashDist = 300;
                this.x += Math.cos(this.angle) * dashDist;
                this.y += Math.sin(this.angle) * dashDist;
                
                // Activate cycling torture (one-time enhanced basic attack)
                this.cycleActive = true;
                
                // Enhanced dash particles - trail effect
                for (let i = 0; i < 40; i++) {
                    particles.push(new Particle(this.x + (Math.random() - 0.5) * 180, this.y + (Math.random() - 0.5) * 180, '#330022', 5, 0.9));
                    particles.push(new Particle(this.x + (Math.random() - 0.5) * 180, this.y + (Math.random() - 0.5) * 180, '#551A8B', 4, 0.7));
                }

                // Radial reaper shockwave + aura
                try {
                    effectsAdd(new WaveShockwave(this.x, this.y, 220, 0.9, '#551A8B', '#220022'));
                    effectsAdd(new AuraRing(this.x, this.y, 90, 0.8, '#220022', 10));
                    for (let i = 0; i < 8; i++) effectsAdd(new RadialBeam(this.x, this.y, this.angle + Math.PI * 2 * i / 8, 260, 0.15, 0.6, '#551A8B'));
                } catch(ex) { console.warn('enhanced cycleBurst effects failed', ex); }

                screenShake(14);

                if (this.isPlayer) addKillMsg('💜 Cycle Burst!');
            }
            
            lifeAndDeath() {
                this.eCD = 12;
                this.lastEnemiesHit = [];
                // Stab attack visuals: long thin core + dark blood/gore particles, looks like a deadly reaper strike
                let stabRange = 150;
                try { effectsAdd(new SwordTrail(this.x, this.y, this.angle, stabRange + 40, 0.6, '#551A8B')); } catch(_){ }

                // Subtle shadow aura along the stab
                try { effectsAdd(new WaveShockwave(this.x + Math.cos(this.angle) * (stabRange/2), this.y + Math.sin(this.angle) * (stabRange/2), 120, 0.5, '#220022', '#551A8B')); } catch(_){ }

                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        let rx = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
                        let ry = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
                        if (rx > -e.radius && rx < stabRange + e.radius && ry > -35 - e.radius && ry < 35 + e.radius) {
                            e.takeDamage(1200, this);
                            this.hp = Math.min(this.maxHp, this.hp + 600);
                            this.lastEnemiesHit.push(e);
                            // Deadly hit particles and smear
                            for (let j = 0; j < 10; j++) {
                                particles.push(new Particle(e.x + (Math.random()-0.5)*60, e.y + (Math.random()-0.5)*40, '#550000', 4, 0.7));
                                particles.push(new Particle(e.x + (Math.random()-0.5)*30, e.y + (Math.random()-0.5)*30, '#551A8B', 3, 0.6));
                            }
                            try { effectsAdd(new ImpactFlash(e.x, e.y, Math.random()*Math.PI*2, 140, 0.7, '#440022')); } catch(_){ }
                            screenShake(18);
                        }
                    }
                }

                // Update passive counter
                this.lifeDeathHitCount += this.lastEnemiesHit.length;
                if (this.lifeDeathHitCount >= 3) {
                    this.reviveReady = true;
                    this.lifeDeathHitCount = 0;
                    if (this.isPlayer) addKillMsg('✨ Revive Ready!');
                }
            }
            
            believer() {
                this.fCD = 17;
                // Create projectile that links target
                // Buffed projectile speed and darker, deadlier visuals
                let proj = new Projectile(this, this.x, this.y, this.angle, 1000, 220, 600, '#551A8B', 10);
                proj.onHit = (target) => {
                    if (target && !target.dead) {
                        this.linkedTargets[target.id || Math.random()] = {
                            target: target,
                            timer: 2.5,
                            damageTimer: 0.25
                        };
                        if (this.isPlayer) addKillMsg('❤️ Believer - Linked!');
                    }
                };
                entities.push(proj);
                
                // Enhanced projectile cast particles - heart trail
                for (let i = 0; i < 28; i++) {
                    let angle = this.angle + (Math.random() - 0.5) * 0.25;
                    let dist = 24 + Math.random() * 100;
                    particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, '#551A8B', 4, 0.7));
                    particles.push(new Particle(this.x + Math.cos(angle) * (dist*0.5), this.y + Math.sin(angle) * (dist*0.5), '#220022', 3, 0.6));
                }
                // Add a pulsing dark ring to telegraph cast
                try { effectsAdd(new WaveShockwave(this.x, this.y, 80, 0.8, '#220022', '#551A8B')); } catch(_){ }
                
                if (this.isPlayer) addKillMsg('❤️ Believer!');
            }
            
            takeDamage(dmg, src) {
                if (this.dead) return;
                
                // Check if this damage would trigger second life before applying lethal damage.
                let projectedHp = this.hp - dmg;
                // Require reviveReady so lethal damage only triggers second life if the player earned the revive
                if (!this.secondLifeTriggered && this.reviveReady && projectedHp <= 0 && this.ritualActive) {
                    // Trigger second life instead of dying
                    this.triggerSecondLife();
                    return; // Don't take the lethal damage
                }
                
                // Normal damage
                super.takeDamage(dmg, src);
            }
            
            ritual() {
                this.gCD = 90;
                // Mark current spawn location as ritual point
                this.ritualX = this.x;
                this.ritualY = this.y;
                this.ritualActive = true;
                this.secondLifeTriggered = false;
                
                // Ritual particles
                for (let i = 0; i < 36; i++) {
                    let angle = (Math.PI * 2 * i) / 36;
                    particles.push(new Particle(this.x + Math.cos(angle) * 90, this.y + Math.sin(angle) * 90, '#220022', 4, 0.9));
                    particles.push(new Particle(this.x + Math.cos(angle) * (60 + Math.random()*40), this.y + Math.sin(angle) * (60 + Math.random()*40), '#551A8B', 3, 0.7));
                }

                // Dark ritual shockwave and ring to fit reaper theme
                try {
                    effectsAdd(new WaveShockwave(this.x, this.y, 140, 1.2, '#551A8B', '#220022'));
                    effectsAdd(new AuraRing(this.x, this.y, 110, 1.0, '#220022', 10));
                } catch (ex) { console.warn('ritual effects failed', ex); }

                if (this.isPlayer) addKillMsg('⚡ Ritual Set!');
            }
            
            triggerSecondLife() {
                this.secondLifeTriggered = true;
                this.dead = false; // Resurrect the player
                this.gCD = 90;
                this.reviveReady = false; // Reset revive ready status
                this.lifeDeathHitCount = 0; // Reset hit counter
                
                // Teleport to ritual location
                this.x = this.ritualX;
                this.y = this.ritualY;
                
                // Increase max HP and heal
                this.maxHp = 6000;
                this.hp = Math.floor(this.maxHp * 0.6); // 3600 HP - 60% health on revive
                
                // Respawn particles - more particles for epic effect
                for (let i = 0; i < 50; i++) {
                    particles.push(new Particle(
                        this.x + (Math.random() - 0.5) * 200,
                        this.y + (Math.random() - 0.5) * 200,
                        '#FFD700',
                        4,
                        1.0
                    ));
                    particles.push(new Particle(
                        this.x + (Math.random() - 0.5) * 200,
                        this.y + (Math.random() - 0.5) * 200,
                        '#FF1493',
                        3,
                        0.8
                    ));
                }
                
                if (this.isPlayer) {
                    addKillMsg('🌟 Second Life! 🌟');
                    screenShake(25);
                }
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);
                
                if (d > 50) { this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt; }
                if (d < 300 && this.qCD <= 0) this.cycleBurst();
                if (d < 200 && this.eCD <= 0) this.lifeAndDeath();
                if (d < 500 && this.fCD <= 0) this.believer();
                if (d < 150 && this.basicCD <= 0) this.basicAtk();
                if (!this.ritualActive && this.gCD <= 0) this.ritual();
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
            
            getEffectiveSpeed() {
                let effectiveSpd = this.speed;
                if (this.speedBuffTimer > 0) effectiveSpd *= 1.5; // 1.5x speed during buff
                return effectiveSpd;
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                // Draw ritual point if active with animated glow
                if (this.ritualActive) {
                    let ritualScreenX = this.ritualX - camera.x;
                    let ritualScreenY = this.ritualY - camera.y;
                    
                    ctx.save();
                    
                    // Pulsing glow effect
                    let glowAlpha = 0.7 + Math.sin(this.drawTimer * 4) * 0.3;
                    ctx.globalAlpha = glowAlpha;
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    ctx.arc(ritualScreenX, ritualScreenY, 40, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Outer glowing rings
                    let ringSize = 60 + Math.sin(this.drawTimer * 3) * 10;
                    ctx.strokeStyle = '#FFA500';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.6 + Math.sin(this.drawTimer * 3) * 0.3;
                    ctx.beginPath();
                    ctx.arc(ritualScreenX, ritualScreenY, ringSize, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Second rotating ring
                    let ringSize2 = 50 + Math.cos(this.drawTimer * 2.5) * 8;
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.5 + Math.cos(this.drawTimer * 2.5) * 0.2;
                    ctx.beginPath();
                    ctx.arc(ritualScreenX, ritualScreenY, ringSize2, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Rotating star particles around ritual
                    ctx.globalAlpha = 0.8;
                    for (let i = 0; i < 6; i++) {
                        let angle = (Math.PI * 2 * i / 6) + this.drawTimer * 2;
                        let px = ritualScreenX + Math.cos(angle) * 75;
                        let py = ritualScreenY + Math.sin(angle) * 75;
                        ctx.fillStyle = '#FFFF00';
                        ctx.beginPath();
                        ctx.arc(px, py, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    ctx.restore();
                }
                
                // Draw revive ready indicator (pulsing text/glow)
                if (this.reviveReady && this.isPlayer) {
                    ctx.save();
                    ctx.globalAlpha = 0.8 + Math.sin(this.drawTimer * 5) * 0.2;
                    ctx.fillStyle = '#FF69B4';
                    ctx.font = 'bold 14px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('✨ REVIVE READY ✨', this.x - camera.x, this.y - camera.y - 50);
                    ctx.restore();
                }
                
                // Draw linked targets indicators with glow
                for (let targetId in this.linkedTargets) {
                    let link = this.linkedTargets[targetId];
                    if (link.target && !link.target.dead) {
                        ctx.save();
                        ctx.strokeStyle = '#FF1493';
                        ctx.lineWidth = 2;
                        ctx.globalAlpha = 0.7;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.moveTo(this.x - camera.x, this.y - camera.y);
                        ctx.lineTo(link.target.x - camera.x, link.target.y - camera.y);
                        ctx.stroke();
                        ctx.setLineDash([]);
                        
                        // Glow effect on linked target
                        ctx.strokeStyle = '#FF1493';
                        ctx.lineWidth = 1;
                        ctx.globalAlpha = 0.5 + Math.sin(this.drawTimer * 3) * 0.3;
                        ctx.beginPath();
                        ctx.arc(link.target.x - camera.x, link.target.y - camera.y, link.target.radius + 8, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        ctx.restore();
                    }
                }
                
                // Draw cycle burst indicator with reaper-style effects
                if (this.cycleActive) {
                    try {
                        ctx.save();
                        let sx = this.x - camera.x, sy = this.y - camera.y;
                        // Dark pulsing ring
                        ctx.globalAlpha = 0.85;
                        ctx.strokeStyle = '#551A8B';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 110 + Math.sin(this.drawTimer * 6) * 6, 0, Math.PI * 2);
                        ctx.stroke();

                        // Faint inner ripple
                        ctx.globalAlpha = 0.5;
                        ctx.strokeStyle = '#220022';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 70 + Math.cos(this.drawTimer * 4) * 4, 0, Math.PI * 2);
                        ctx.stroke();

                        // Rotating dark blades
                        ctx.globalAlpha = 0.9;
                        ctx.strokeStyle = '#330011';
                        ctx.lineWidth = 3;
                        for (let i = 0; i < 6; i++) {
                            let angle = (Math.PI * 2 * i / 6) + this.drawTimer * 2.2;
                            let x1 = sx + Math.cos(angle) * 90;
                            let y1 = sy + Math.sin(angle) * 90;
                            let x2 = sx + Math.cos(angle) * 150;
                            let y2 = sy + Math.sin(angle) * 150;
                            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
                        }
                        ctx.restore();
                    } catch (ex) { console.warn('cycleActive draw failed', ex); }
                }
            }
        }

        class Gregory extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#7c3aed' : '#4c1d95', 5300);
                this.isPlayer = !!p;
                this.countsAsFFAHero = true;
                this.name = p ? 'Player (Gregory)' : 'Enemy Gregory';
                this.baseSpd = 250;
                this.speed = this.baseSpd;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0; this.rCD = 0;
                this.futureBasicCD = 0; this.futureQCD = 0; this.futureECD = 0; this.futureFCD = 0;
                this.futureTimeline = false;
                this.futureTimelineTimer = null;
                this.timeMark = null;
                this.returnDash = null;
                this.qDash = null;
                this.futureMark = null;
                this.returnToPresentPoint = null;
                this.timePrediction = null;
                this.lastMoveVector = { x: 0, y: 0 };
                this.shockedTimer = 0;
                this.drawTimer = 0;
                this._qWas = false; this._eWas = false; this._fWas = false; this._rWas = false;
                this.gear = 'speedster';
                this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
            }

            getPredictionPos() {
                const moveLen = Math.hypot(this.lastMoveVector.x || 0, this.lastMoveVector.y || 0);
                const angle = this.angle || 0;
                const baseForecast = this.speed * 3;
                const activePredict = moveLen > 20
                    ? Math.min(820, baseForecast + moveLen * 2.2)
                    : Math.min(360, 220 + this.speed * 1.15);
                const travel = Math.max(activePredict, baseForecast * 0.7);
                return {
                    x: this.x + Math.cos(angle) * travel,
                    y: this.y + Math.sin(angle) * travel
                };
            }

            update(dt) {
                if (this.dead) return;
                const prevX = this.x;
                const prevY = this.y;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.gCD > 0) this.gCD = Math.max(0, this.gCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);
                if (this.futureBasicCD > 0) this.futureBasicCD = Math.max(0, this.futureBasicCD - dt);
                if (this.futureQCD > 0) this.futureQCD = Math.max(0, this.futureQCD - dt);
                if (this.futureECD > 0) this.futureECD = Math.max(0, this.futureECD - dt);
                if (this.futureFCD > 0) this.futureFCD = Math.max(0, this.futureFCD - dt);
                if (this.shockedTimer > 0) this.shockedTimer = Math.max(0, this.shockedTimer - dt);
                this.timePrediction = this.getPredictionPos();

                if (this.qDash) {
                    this.qDash.time = Math.max(0, this.qDash.time - dt);
                    const t = 1 - (this.qDash.time / this.qDash.maxTime);
                    this.x = this.qDash.fromX + (this.qDash.toX - this.qDash.fromX) * t;
                    this.y = this.qDash.fromY + (this.qDash.toY - this.qDash.fromY) * t;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            const dx = this.x - e.x;
                            const dy = this.y - e.y;
                            const dist = Math.hypot(dx, dy);
                            if (dist < 185) {
                                const pull = 520 * dt;
                                const nx = dx / (dist || 1);
                                const ny = dy / (dist || 1);
                                e.x += nx * pull;
                                e.y += ny * pull;
                                const dealt = 110 * dt * 60;
                                e.takeDamage(dealt, this);
                                this.hp = Math.min(this.maxHp, this.hp + dealt * 0.2);
                            }
                        }
                    }
                    if (this.qDash.time <= 0) {
                        this.x = this.qDash.toX;
                        this.y = this.qDash.toY;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                                if (dist < 170) {
                                    e.takeDamage(80, this);
                                    this.hp = Math.min(this.maxHp, this.hp + 16);
                                }
                            }
                        }
                        this.qDash = null;
                    }
                }

                if (this.returnDash) {
                    this.returnDash.time = Math.max(0, this.returnDash.time - dt);
                    const t = 1 - (this.returnDash.time / this.returnDash.maxTime);
                    this.x = this.returnDash.fromX + (this.returnDash.toX - this.returnDash.fromX) * t;
                    this.y = this.returnDash.fromY + (this.returnDash.toY - this.returnDash.fromY) * t;
                    if (this.returnDash.time <= 0) {
                        this.x = this.returnDash.toX;
                        this.y = this.returnDash.toY;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                                if (dist < 170) {
                                    e.takeDamage(1200, this);
                                }
                            }
                        }
                        this.returnDash = null;
                    }
                }

                if (this.futureMark) {
                    this.futureMark.time = Math.max(0, this.futureMark.time - dt);
                    this.futureMark.tick -= dt;
                    if (this.futureMark.tick <= 0) {
                        this.futureMark.tick = 0.1;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                const dist = Math.hypot(e.x - this.futureMark.x, e.y - this.futureMark.y);
                                if (dist < 210) {
                                    e.takeDamage(20, this);
                                }
                            }
                        }
                    }
                    if (this.futureMark.time <= 0) {
                        this.futureMark = null;
                    }
                }

                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    this.lastMoveVector = { x: this.x - prevX, y: this.y - prevY };
                    if (this.isPlayer) updateHUD(this);
                    return;
                }

                const spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
                this.lastMoveVector = { x: this.x - prevX, y: this.y - prevY };
            }

            getEffectiveSpeed() {
                return this.speed * (this.futureTimeline ? 1.6 : 1.0);
            }

            basicAtk() {
                if (this.futureTimeline) {
                    if (this.futureBasicCD > 0) return;
                    this.futureBasicCD = 0.3;
                    const shot = new Projectile(this, this.x + Math.cos(this.angle) * 26, this.y + Math.sin(this.angle) * 26, this.angle, 760, 65, 160, '#d8b4fe', 7);
                    shot.onHit = (target) => {
                        if (target && !target.dead) {
                            target.takeDamage(100, this);
                            for (let i = 0; i < 8; i++) {
                                particles.push(new Particle(target.x + (Math.random() - 0.5) * 18, target.y + (Math.random() - 0.5) * 18, '#d8b4fe', 3, 0.5));
                            }
                        }
                    };
                    entities.push(shot);
                    visualEffects.push(new EnergyWave(this.x, this.y, '#d8b4fe', 90, 0.5));
                    return;
                }

                if (this.basicCD > 0) return;
                this.basicCD = 2;
                const x = this.x + Math.cos(this.angle) * 26;
                const y = this.y + Math.sin(this.angle) * 26;
                const shot = new Projectile(this, x, y, this.angle, 720, 150, 150, '#7dd3fc', 8);
                shot.onHit = (target) => {
                    if (target && !target.dead) {
                        target.takeDamage(150, this);
                        for (let i = 0; i < 9; i++) {
                            particles.push(new Particle(target.x + (Math.random() - 0.5) * 20, target.y + (Math.random() - 0.5) * 20, '#7dd3fc', 3 + Math.random() * 3, 0.6));
                        }
                    }
                };
                entities.push(shot);
                visualEffects.push(new EnergyWave(this.x, this.y, '#7dd3fc', 120, 0.6));
            }

            skill1() {
                if (this.qCD > 0) return;
                this.qCD = 4;
                const startX = this.x;
                const startY = this.y;
                const angle = this.angle || 0;
                const dashTargetX = this.x + Math.cos(angle) * 240;
                const dashTargetY = this.y + Math.sin(angle) * 240;
                this.qDash = {
                    fromX: startX,
                    fromY: startY,
                    toX: dashTargetX,
                    toY: dashTargetY,
                    time: 0.18,
                    maxTime: 0.18
                };
                for (let i = 1; i <= 10; i++) {
                    const t = i / 10;
                    const trailX = startX + (dashTargetX - startX) * t;
                    const trailY = startY + (dashTargetY - startY) * t;
                    particles.push(new Particle(trailX, trailY, '#67e8f9', 4 + Math.random() * 5, 0.35));
                }
                for (let i = 0; i < 20; i++) {
                    const ang = (Math.PI * 2 * i) / 20;
                    const r = 30 + Math.random() * 75;
                    particles.push(new Particle(this.x + Math.cos(ang) * r, this.y + Math.sin(ang) * r, '#67e8f9', 4 + Math.random() * 5, 0.8));
                }
                visualEffects.push({
                    x: this.x,
                    y: this.y,
                    life: 0.5,
                    maxLife: 0.5,
                    color: '#67e8f9',
                    update(dt) { this.life -= dt; },
                    draw(ctx) {
                        const alpha = Math.max(0, this.life / this.maxLife);
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = this.color;
                        ctx.lineWidth = 6;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 65 + (1 - alpha) * 90, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 42 + (1 - alpha) * 60, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            }

            currentTimelineE() {
                if (this.eCD > 0) return;
                this.eCD = 7;
                this.invulnerableTimer = Math.max(this.invulnerableTimer || 0, 0.5);
                const forecast = this.getPredictionPos();
                const prevX = this.x;
                const prevY = this.y;
                const dir = this.angle || 0;
                const target = {
                    x: forecast.x,
                    y: forecast.y
                };
                this.x = target.x;
                this.y = target.y;
                this.timePrediction = target;

                let hitCount = 0;
                const attackRadius = Math.max(200, Math.min(400, 180 + Math.hypot(target.x - prevX, target.y - prevY) * 0.25));
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        const dist = Math.hypot(e.x - this.x, e.y - this.y);
                        if (dist < attackRadius) {
                            hitCount++;
                            e.takeDamage(450, this);
                            e.shockedTimer = 2.2;
                            if (e.qCD > 0) e.qCD = Math.max(0, e.qCD - 2);
                            if (e.eCD > 0) e.eCD = Math.max(0, e.eCD - 2);
                            if (e.fCD > 0) e.fCD = Math.max(0, e.fCD - 2);
                            if (typeof e.applyStatus === 'function') e.applyStatus('slow', 8, this);
                        }
                    }
                }
                visualEffects.push({
                    x: this.x,
                    y: this.y,
                    life: 0.8,
                    maxLife: 0.8,
                    dir,
                    update(dt) { this.life -= dt; },
                    draw(ctx) {
                        const alpha = Math.max(0, this.life / this.maxLife);
                        const r = 40 + (1 - alpha) * 90;
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = '#8b5cf6';
                        ctx.lineWidth = 4;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, r, this.dir - 0.8, this.dir + 0.8);
                        ctx.stroke();
                        ctx.strokeStyle = '#f5d0fe';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, r * 0.7, this.dir - 0.5, this.dir + 0.5);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                visualEffects.push(new ImpactFlash(this.x, this.y, this.angle || 0, 180, 0.6, '#8b5cf6'));
                if (hitCount > 0) {
                    visualEffects.push(new EnergyWave(this.x, this.y, '#67e8f9', 180, 0.9));
                    for (let i = 0; i < 20; i++) {
                        const ang = (Math.PI * 2 * i) / 20;
                        particles.push(new Particle(this.x + Math.cos(ang) * 55, this.y + Math.sin(ang) * 55, '#7dd3fc', 5, 0.8));
                    }
                }
            }

            futureTimelineE() {
                if (this.futureECD > 0) return;
                this.futureECD = 3;
                this.invulnerableTimer = Math.max(this.invulnerableTimer || 0, 0.5);
                const mark = { x: this.x, y: this.y, time: 5, tick: 0.1 };
                this.timeMark = mark;
                this.futureMark = mark;
                this.qCD = 0;
                this.futureQCD = 0;
                visualEffects.push({
                    x: this.x,
                    y: this.y,
                    life: 0.9,
                    maxLife: 0.9,
                    update(dt) { this.life -= dt; },
                    draw(ctx) {
                        const alpha = Math.max(0, this.life / this.maxLife);
                        ctx.save();
                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = '#c084fc';
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 32 + (1 - alpha) * 100, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
                if (this.isPlayer) addKillMsg('⏳ Future mark set');
            }

            doE() {
                if (this.futureTimeline) this.futureTimelineE();
                else this.currentTimelineE();
            }

            doF() {
                if (this.futureTimeline) {
                    if (this.futureFCD > 0) return;
                    this.futureFCD = 25;
                    this.fCD = Math.max(this.fCD, 10);
                    const returnPos = this.returnToPresentPoint || { x: this.x, y: this.y };
                    const target = this.timeMark || returnPos;
                    const dashAngle = Math.atan2(target.y - returnPos.y, target.x - returnPos.x);

                    this.x = target.x;
                    this.y = target.y;
                    this.returnDash = {
                        fromX: target.x,
                        fromY: target.y,
                        toX: returnPos.x,
                        toY: returnPos.y,
                        time: 0.18,
                        maxTime: 0.18
                    };
                    this.futureTimeline = false;
                    this.futureTimelineTimer = null;
                    this.timeMark = null;
                    this.futureMark = null;
                    this.returnToPresentPoint = null;

                    for (let i = 1; i <= 10; i++) {
                        const t = i / 10;
                        particles.push(new Particle(
                            target.x + (returnPos.x - target.x) * t,
                            target.y + (returnPos.y - target.y) * t,
                            '#c084fc', 5 + Math.random() * 4, 0.4
                        ));
                    }
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            const dist = Math.hypot(e.x - target.x, e.y - target.y);
                            if (dist < 180) e.takeDamage(1200, this);
                        }
                    }
                    if (this.isPlayer) addKillMsg('⏳ Returned to the present');
                    visualEffects.push(new ImpactFlash(target.x, target.y, dashAngle, 220, 0.9, '#c084fc'));
                    visualEffects.push(new EnergyWave(this.x, this.y, '#c084fc', 220, 1.2));
                    return;
                }
                if (this.fCD > 0) return;
                this.fCD = 25;
                this.futureFCD = 0;
                this.futureTimeline = true;
                this.futureTimelineTimer = null;
                this.returnToPresentPoint = { x: this.x, y: this.y };
                this.hp = Math.min(this.maxHp, this.hp + 1060);
                this.qCD = 0;
                this.eCD = 0;
                this.futureQCD = 0;
                this.futureECD = 0;
                if (this.isPlayer) addKillMsg('⏳ Future timeline engaged');
                visualEffects.push(new EnergyWave(this.x, this.y, '#c084fc', 220, 1.0));
                for (let i = 0; i < 20; i++) {
                    const ang = (Math.PI * 2 * i) / 20;
                    particles.push(new Particle(this.x + Math.cos(ang) * 30, this.y + Math.sin(ang) * 30, '#a78bfa', 6, 1.0));
                }
            }

            input(dt, spd) {
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    const norm = new Vector2(dx, dy).norm();
                    this.x += norm.x * spd * dt;
                    this.y += norm.y * spd * dt;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && !this._qWas) this.skill1();
                if (keys.e && !this._eWas) this.doE();
                if (keys.f && !this._fWas) this.doF();
                if (keys.r && !this._rWas && typeof this.useGear === 'function') this.useGear();
                this._qWas = !!keys.q; this._eWas = !!keys.e; this._fWas = !!keys.f; this._rWas = !!keys.r;
                if (this.isPlayer) updateHUD(this);
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                const dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                const d = Math.hypot(dx, dy);
                if (d > 220) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                if (this.futureTimeline) {
                    if (this.qCD <= 0 && d < 210) this.skill1();
                    if (this.eCD <= 0 && d < 260) this.doE();
                    if (this.futureFCD <= 0 && d < 300) this.doF();
                } else {
                    if (this.qCD <= 0 && d < 210) this.skill1();
                    if (this.eCD <= 0 && d < 260) this.doE();
                    if (this.fCD <= 0 && d < 300) this.doF();
                }
                if (this.basicCD <= 0 && d < 170) this.basicAtk();
            }

            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }

            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        const d = Math.hypot(e.x - this.x, e.y - this.y);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }

            draw(ctx) {
                super.draw(ctx);
                this.drawTimer += 0.016;
                if (!this.futureTimeline && this.timePrediction) {
                    ctx.save();
                    ctx.strokeStyle = '#67e8f9';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([6, 6]);
                    ctx.beginPath();
                    ctx.arc(this.timePrediction.x - camera.x, this.timePrediction.y - camera.y, this.radius + 12, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                if (this.shockedTimer > 0) {
                    ctx.save();
                    ctx.strokeStyle = '#67e8f9';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 12 + Math.sin(this.drawTimer * 15) * 4, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                if (this.futureTimeline) {
                    ctx.save();
                    ctx.strokeStyle = '#c084fc';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 18 + Math.sin(this.drawTimer * 10) * 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        class Cornelius extends Entity {
            constructor(x, y, p) {
                super(x, y, 24, p ? '#FFD700' : '#D4A017', 6500);
                this.isPlayer = p || false;
                this.name = p ? 'Player (Cornelius)' : 'Enemy Cornelius';
                this.countsAsFFAHero = true;
                
                // Passive bonuses: 20% speed + 20% penetration
                this.speedBonus = 0.20;
                this.penetration = 0.20;
                
                // Ascension system - TWO PART:
                // 1. Bar (0-100) that charges naturally + on hits
                // 2. Charges that accumulate when bar hits 100
                this.ascended = false;
                this.ascensionBar = 0;
                this.maxAscensionBar = 100;
                this.ascensionCharges = 0;
                this.maxAscensionCharges = 1;
                
                // Cooldowns
                this.basicCD = 0;
                this.qCD = 0;
                this.qCharging = false;
                this.qWindup = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                
                this.baseSpd = 260 * 1.20;
                this.speed = this.baseSpd;
                this.angle = 0;

                // Gear properties
                this.gear = 'speedster'; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                // Cooldown decrements
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.gCD > 0) this.gCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                // Windup decrement
                if (this.qCharging) {
                    this.qWindup -= dt;
                    if (this.qWindup <= 0) {
                        this.qCharging = false;
                        this.fireQ();
                        this.qCD = 3;
                    }
                }
                
                // NATURAL PASSIVE BAR CHARGE - slowly fills (much slower, 50 seconds to full bar)
                if (!this.ascended) {
                    this.ascensionBar = Math.min(this.maxAscensionBar, this.ascensionBar + dt * 0.5);
                    
                    // When bar reaches 100, convert to charge
                    if (this.ascensionBar >= this.maxAscensionBar) {
                        this.ascensionBar -= this.maxAscensionBar;
                        this.ascensionCharges = Math.min(this.maxAscensionCharges, this.ascensionCharges + 1);
                    }
                }
                
                // Speed based on ascended form
                if (this.ascended) {
                    this.speed = this.baseSpd * 1.2;
                } else {
                    this.speed = this.baseSpd;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }

                // Ensure ascended aura stays attached while ascended
                try {
                    if (this.ascended) {
                        let hasAura = Array.isArray(effects) && effects.some(e => e && e.constructor && e.constructor.name === 'EntityAura' && e.owner === this);
                        if (!hasAura && Array.isArray(effects)) {
                            effectsAdd(new EntityAura(this, this.radius + 36, 10.0, '#FFD700', '#FFFF00', 8));
                        }
                    }
                } catch (err) { console.error('attach-aura check failed', err); }
            }
            
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.injuredTimer > 0) s *= 0.7;
                return s;
            }
            
            basicAtk() {
                if (this.basicCD > 0) return;
                this.basicCD = this.ascended ? 1 : 2;
                
                // Broadcast ability visual state to other players
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.cornelius = { ability: 'basicAtk', ascended: this.ascended, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
                
                // Higher damage due to 20% penetration passive
                let dmg = this.ascended ? 280 : 320;
                let range = this.ascended ? 150 : 100;
                let swordLength = range * 1.2;
                
                let hitAny = false;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < range) {
                            e.takeDamage(dmg, this);
                            hitAny = true;
                        }
                    }
                }
                // Charge once per ability use (not per enemy)
                if (!this.ascended && hitAny) {
                    this.ascensionBar = Math.min(this.maxAscensionBar, this.ascensionBar + 2.5);
                    if (this.ascensionBar >= this.maxAscensionBar) {
                        this.ascensionBar -= this.maxAscensionBar;
                        this.ascensionCharges = Math.min(this.maxAscensionCharges, this.ascensionCharges + 1);
                    }
                }
                
                // GUARANTEED VISIBLE FALLBACK: Slash + particles (these ALWAYS show)
                let slashColor = this.ascended ? '#FFFF00' : '#FF4444';
                particles.push(new Slash(this.x, this.y, this.angle, range * 1.1, Math.PI / 2, slashColor));
                for (let i = 0; i < 8; i++) {
                    let a = (Math.random() * Math.PI * 2);
                    particles.push(new Particle(this.x + Math.cos(a) * 12, this.y + Math.sin(a) * 12, slashColor, 6, 1.5));
                }
                
                // ALSO try fancy effects (but fallback is there if they fail)
                try {
                    effectsAdd(new SwordTrail(this.x, this.y, this.angle, swordLength, 0.9, slashColor));
                    effectsAdd(new WaveShockwave(this.x, this.y, range + 20, 0.9, this.ascended ? '#FFD700' : '#FF4444', this.ascended ? '#FFFF00' : '#CC0000'));
                } catch(ex) { console.warn('fancy effects failed for basicAtk', ex); }
                
                if (this.isPlayer) addKillMsg('⚔ SLASH!');
            }
            
            fireQ() {
                // Q execution after windup - LUNGE WITH SLASH
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.cornelius = { ability: 'fireQ', ascended: this.ascended, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
                
                // GUARANTEED VISIBLE: explosion particles at start and end
                for (let i = 0; i < 6; i++) {
                    let a = (Math.random() * Math.PI * 2);
                    particles.push(new Particle(this.x + Math.cos(a) * 15, this.y + Math.sin(a) * 15, '#FF6666', 7, 1.8));
                }
                
                if (this.ascended) {
                    // Ascended: Divine Thrust forward with MASSIVE BEAM EFFECT - TRUE DAMAGE
                    let lunge = 180;
                    let trueDmg = 1400;
                    let startX = this.x;
                    let startY = this.y;
                    this.x += Math.cos(this.angle) * lunge;
                    this.y += Math.sin(this.angle) * lunge;
                    let endX = this.x;
                    let endY = this.y;
                    
                    // Guaranteed fallback particles at end location
                    for (let i = 0; i < 8; i++) {
                        let a = (Math.random() * Math.PI * 2);
                        particles.push(new Particle(endX + Math.cos(a) * 15, endY + Math.sin(a) * 15, '#FFFF00', 8, 1.8));
                    }
                    
                    // Try fancy effects
                    try {
                        effectsAdd(new RadialBeam(startX, startY, this.angle, lunge + 80, Math.PI * 0.4, 0.6, '#FFFF00'));
                        for (let i = 0; i < 5; i++) {
                            let progress = i / 5;
                            let trailX = startX + Math.cos(this.angle) * lunge * progress;
                            let trailY = startY + Math.sin(this.angle) * lunge * progress;
                            effectsAdd(new SwordTrail(trailX, trailY, this.angle, 150, 0.5 - i * 0.08, '#FFD700'));
                        }
                        effectsAdd(new WaveShockwave(endX, endY, 250, 0.8, '#FFD700', '#FFFF00'));
                    } catch(ex) { console.warn('fancy effects failed for ascended Q', ex); }
                    
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < 120) {
                                e.takeDamage(trueDmg, this);
                            }
                        }
                    }
                    
                    screenShake(35);
                    if (this.isPlayer) addKillMsg('⚔️ Divine Slash!');
                } else {
                    // Base: Lunge with sword trails - 850 damage
                    let lunge = 150;
                    let startX = this.x;
                    let startY = this.y;
                    this.x += Math.cos(this.angle) * lunge;
                    this.y += Math.sin(this.angle) * lunge;
                    let endX = this.x;
                    let endY = this.y;
                    
                    // Guaranteed fallback particles at end
                    for (let i = 0; i < 6; i++) {
                        let a = (Math.random() * Math.PI * 2);
                        particles.push(new Particle(endX + Math.cos(a) * 12, endY + Math.sin(a) * 12, '#FF6666', 6, 1.8));
                    }
                    
                    // Try fancy effects
                    try {
                        effectsAdd(new RadialBeam(startX, startY, this.angle, lunge + 60, Math.PI * 0.3, 0.45, '#FF6666'));
                        for (let i = 0; i < 4; i++) {
                            let progress = i / 4;
                            let trailX = startX + Math.cos(this.angle) * lunge * progress;
                            let trailY = startY + Math.sin(this.angle) * lunge * progress;
                            effectsAdd(new SwordTrail(trailX, trailY, this.angle, 120, 0.4 - i * 0.08, '#FF4444'));
                        }
                        effectsAdd(new WaveShockwave(endX, endY, 180, 0.6, '#FF4444', '#CC0000'));
                    } catch(ex) { console.warn('fancy effects failed for base Q', ex); }
                    
                    let hitAny = false;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < 80) {
                                e.takeDamage(850, this);
                                hitAny = true;
                            }
                        }
                    }
                    // Charge once per ability use (not per enemy)
                    if (hitAny) {
                        this.ascensionBar = Math.min(this.maxAscensionBar, this.ascensionBar + 4);
                        if (this.ascensionBar >= this.maxAscensionBar) {
                            this.ascensionBar -= this.maxAscensionBar;
                            this.ascensionCharges = Math.min(this.maxAscensionCharges, this.ascensionCharges + 1);
                        }
                    }
                    
                    screenShake(25);
                    if (this.isPlayer) addKillMsg('🗡 Lunge!');
                }
            }
            
            doE() {
                if (this.eCD > 0) return;
                
                // Broadcast ability visual state to other players
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.cornelius = { ability: 'doE', ascended: this.ascended, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
                
                // GUARANTEED VISIBLE: fallback particles first
                let particleColor = this.ascended ? '#FFFF00' : '#00FF00';
                for (let i = 0; i < 10; i++) {
                    let a = (Math.random() * Math.PI * 2);
                    particles.push(new Particle(this.x + Math.cos(a) * 20, this.y + Math.sin(a) * 20, particleColor, 7, 1.8));
                }
                
                if (this.ascended) {
                    // Ascended: Divine Sword Strike with MASSIVE BEAM and wave effects
                    this.eCD = 5;
                    let range = 250;
                    let slashX = this.x + Math.cos(this.angle) * range;
                    let slashY = this.y + Math.sin(this.angle) * range;
                    
                    // More fallback particles at strike point
                    for (let i = 0; i < 12; i++) {
                        let a = (Math.random() * Math.PI * 2);
                        particles.push(new Particle(slashX + Math.cos(a) * 20, slashY + Math.sin(a) * 20, '#FFD700', 8, 1.8));
                    }
                    
                    // Try fancy effects
                    try {
                        effectsAdd(new RadialBeam(this.x, this.y, this.angle, range, Math.PI * 0.5, 0.8, '#FFFF00'));
                        for (let i = 0; i < 3; i++) {
                            effectsAdd(new WaveShockwave(
                                this.x + Math.cos(this.angle) * (range * (i + 1) / 3),
                                this.y + Math.sin(this.angle) * (range * (i + 1) / 3),
                                150 - i * 30,
                                0.6 - i * 0.1,
                                '#FFD700',
                                '#FFFF00'
                            ));
                        }
                        effectsAdd(new WaveShockwave(slashX, slashY, 200, 0.8, '#FFD700', '#FFFF00'));
                    } catch(ex) { console.warn('fancy effects failed for ascended E', ex); }
                    
                    let beforeTotal = this.totalDamage || 0;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - slashX) ** 2 + (e.y - slashY) ** 2);
                            if (d < 150) {
                                e.takeDamage(1000, this);
                                e.stunTimer = 1;
                            }
                        }
                    }
                    // Heal 40% of actual damage dealt by this ability (only in ascended form)
                    let dealt = (this.totalDamage || 0) - beforeTotal;
                    if (dealt > 0) {
                        this.hp = Math.min(this.maxHp, this.hp + dealt * 0.4);
                    }
                    
                    screenShake(40);
                    if (this.isPlayer) addKillMsg('⚡ Divine Sword!');
                } else {
                    // Base: Dash & Heal with trail effects
                    this.eCD = 6;
                    let lunge = 180;
                    let startX = this.x;
                    let startY = this.y;
                    this.x += Math.cos(this.angle) * lunge;
                    this.y += Math.sin(this.angle) * lunge;
                    
                    // More fallback particles at new location
                    for (let i = 0; i < 8; i++) {
                        let a = (Math.random() * Math.PI * 2);
                        particles.push(new Particle(this.x + Math.cos(a) * 15, this.y + Math.sin(a) * 15, '#00FF00', 6, 0.4));
                    }
                    
                    let healAmount = 325;
                    this.hp = Math.min(this.maxHp, this.hp + healAmount);
                    
                    // Try fancy effects
                    try {
                        effectsAdd(new SwordTrail(startX, startY, this.angle, lunge, 0.4, '#00FF00'));
                        effectsAdd(new WaveShockwave(this.x, this.y, 150, 0.5, '#00FF00', '#00DD00'));
                    } catch(ex) { console.warn('fancy effects failed for base E', ex); }
                    
                    if (this.isPlayer) addKillMsg('💨 Dash!');
                }
            }
            
            doF() {
                if (this.fCD > 0) return;
                
                // Broadcast ability visual state to other players
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.cornelius = { ability: 'doF', ascended: this.ascended, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
                
                // GUARANTEED VISIBLE: fallback particles at caster
                for (let i = 0; i < 12; i++) {
                    let a = (Math.random() * Math.PI * 2);
                    particles.push(new Particle(this.x + Math.cos(a) * 20, this.y + Math.sin(a) * 20, '#FF8800', 8, 1.8));
                }
                
                if (this.ascended) {
                    // Ascended: Meteor Storm - 5 METEORS with incredible effects
                    this.fCD = 12;
                    
                    // Try fancy effects
                    try {
                        effectsAdd(new WaveShockwave(this.x, this.y, 200, 0.6, '#FF8800', '#FFFF00'));
                        effectsAdd(new AuraRing(this.x, this.y, 120, 0.6, '#FF8800', 8));
                    } catch(ex) { console.warn('fancy effects failed for ascended F start', ex); }
                    
                    for (let i = 0; i < 5; i++) {
                        let angle = this.angle + (Math.PI * 2 * i / 5);
                        let mX = this.x + Math.cos(angle) * 220;
                        let mY = this.y + Math.sin(angle) * 220;
                        let strikeTime = 1000 + (100 * i);
                        
                        if (!window.meteorIndicators) window.meteorIndicators = [];
                        window.meteorIndicators.push({
                            x: mX,
                            y: mY,
                            time: strikeTime,
                            createdAt: Date.now(),
                            index: i
                        });
                        
                        setTimeout(() => {
                            // Guaranteed fallback particles at meteor strike
                            for (let j = 0; j < 15; j++) {
                                let a = (Math.random() * Math.PI * 2);
                                particles.push(new Particle(mX + Math.cos(a) * 25, mY + Math.sin(a) * 25, '#FF2222', 9, 1.8));
                            }
                            
                            for (let e of entities) {
                                if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                    let d = Math.sqrt((e.x - mX) ** 2 + (e.y - mY) ** 2);
                                    if (d < 150) {
                                        e.takeDamage(1650, this);
                                    }
                                }
                            }
                            
                            // Try fancy effects at impact
                            try {
                                effectsAdd(new WaveShockwave(mX, mY, 280, 1.0, '#FF2222', '#FFAA00'));
                                effectsAdd(new WaveShockwave(mX, mY, 200, 0.8, '#FF8800', '#FFD700'));
                                effectsAdd(new ImpactFlash(mX, mY, Math.random() * Math.PI * 2, 250, 0.6, '#FF8800'));
                            } catch(ex) { console.warn('fancy effects failed for meteor impact', ex); }
                            
                            screenShake(35);
                        }, strikeTime);
                    }
                    
                    if (this.isPlayer) addKillMsg('☄️ Meteor Storm!');
                } else {
                    // Base: Focused Blade Crescendo
                    this.fCD = 12;

                    let strikeRadius = 180;
                    let hitAny = false;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < strikeRadius) {
                                e.takeDamage(1150, this);
                                e.stunTimer = 0.5;
                                hitAny = true;
                            }
                        }
                    }
                    // Charge once per ability use (not per enemy)
                    if (hitAny) {
                        this.ascensionBar = Math.min(this.maxAscensionBar, this.ascensionBar + 4);
                        if (this.ascensionBar >= this.maxAscensionBar) {
                            this.ascensionBar -= this.maxAscensionBar;
                            this.ascensionCharges = Math.min(this.maxAscensionCharges, this.ascensionCharges + 1);
                        }
                    }

                    // Guaranteed fallback particles around caster
                    for (let i = 0; i < 6; i++) {
                        let ang = (Math.PI * 2 * i / 6);
                        let sx = this.x + Math.cos(ang) * 40;
                        let sy = this.y + Math.sin(ang) * 40;
                        for (let j = 0; j < 4; j++) {
                            let a = (Math.random() * Math.PI * 2);
                            particles.push(new Particle(sx + Math.cos(a) * 15, sy + Math.sin(a) * 15, '#FFB84D', 7, 0.5));
                        }
                    }

                    // Try fancy effects
                    try {
                        for (let i = 0; i < 6; i++) {
                            let ang = this.angle + (Math.PI * 2 * i / 6);
                            let sx = this.x + Math.cos(ang) * 40;
                            let sy = this.y + Math.sin(ang) * 40;
                            effectsAdd(new SwordTrail(sx, sy, ang, 220, 0.9, '#FF8C00'));
                            effectsAdd(new ImpactFlash(sx, sy, ang, 260, 0.6, '#FFB84D'));
                        }
                        effectsAdd(new WaveShockwave(this.x, this.y, 220, 0.9, '#FFB84D', '#FFD27A'));
                        effectsAdd(new AuraRing(this.x, this.y, 130, 0.9, '#FF8C00', 6));
                    } catch(ex) { console.warn('fancy effects failed for base F', ex); }

                    screenShake(28);
                    if (this.isPlayer) addKillMsg('🌪️ RENDING CRESCENDO!');
                }
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }

            doG() {
                // Use one charge to ascend with 3s windup
                if (this.ascensionCharges <= 0) return;
                if (this.gCD > 0) return;
                
                // Broadcast ability visual state to other players
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.cornelius = { ability: 'doG', ascended: false, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
                
                this.ascensionCharges--;
                this.gCD = 3;
                this.ascended = true;
                this.maxHp = 7800;
                this.hp = this.maxHp;
                this.color = this.isPlayer ? '#FFD700' : '#D4A017';
                
                // RECHARGE ALL ABILITIES on ascension
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                
                // GUARANTEED VISIBLE: massive fallback particles at caster for ascension
                for (let i = 0; i < 30; i++) {
                    let a = (Math.random() * Math.PI * 2);
                    particles.push(new Particle(this.x + Math.cos(a) * 40, this.y + Math.sin(a) * 40, '#FFD700', 12, 2.0));
                }
                
                // === MAGNIFICENT ASCENSION EFFECT ===
                // Try fancy effects
                try {
                    effectsAdd(new WaveShockwave(this.x, this.y, 350, 1.2, '#FFD700', '#FFFF00'));
                    
                    // Multiple expanding rings
                    for (let i = 0; i < 6; i++) {
                        effectsAdd(new AuraRing(
                            this.x, this.y,
                            40 + i * 50,
                            1.0 - i * 0.1,
                            i % 2 === 0 ? '#FFD700' : '#FFFF00',
                            12 - i * 1.5
                        ));
                    }
                    
                    // Radial beam burst - full circle
                    for (let dir = 0; dir < 12; dir++) {
                        let angle = (Math.PI * 2 * dir / 12);
                        effectsAdd(new RadialBeam(
                            this.x, this.y,
                            angle,
                            300,
                            Math.PI * 0.2,
                            1.0,
                            '#FFFF00'
                        ));
                    }
                    
                    // Impact flashes in all directions
                    for (let dir = 0; dir < 8; dir++) {
                        let angle = (Math.PI * 2 * dir / 8);
                        effectsAdd(new ImpactFlash(this.x, this.y, angle, 300, 0.8, '#FFD700'));
                    }
                    
                    // Divine transformation sword trails
                    for (let i = 0; i < 4; i++) {
                        let angle = (Math.PI * 2 * i / 4);
                        effectsAdd(new SwordTrail(
                            this.x + Math.cos(angle) * 100,
                            this.y + Math.sin(angle) * 100,
                            angle,
                            150,
                            0.9,
                            '#FFFF00'
                        ));
                    }

                    // Persistent ascended aura attached to the hero
                    effectsAdd(new EntityAura(this, this.radius + 36, 10.0, '#FFD700', '#FFFF00', 8));
                    
                } catch(ex) { console.warn('fancy effects failed for ascension', ex); }
                
                screenShake(80);
                if (this.isPlayer) addKillMsg('👑 ASCENDED! 👑');
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys['w']) dy--;
                if (keys['s']) dy++;
                if (keys['a']) dx--;
                if (keys['d']) dx++;
                
                // Move with WASD
                if (dx || dy) {
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    this.x += (dx / dist) * spd * dt;
                    this.y += (dy / dist) * spd * dt;
                }
                
                // Face mouse using world coordinates
                let worldMouseX = mouse.x + camera.x;
                let worldMouseY = mouse.y + camera.y;
                this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
                
                // BASIC ATTACK - mouse click (add immediate feedback for reliability)
                if (mouse.down) {
                    if (this.basicCD <= 0) {
                        try { effectsAdd(new SpinningRing(this.x, this.y, this.radius + 16, this.ascended ? '#FFFF00' : '#FF4444', 0.28, 10, 6)); } catch(_){ }
                        this.basicAtk();
                    } else {
                        try { console.log('basicAtk blocked: CD', this.basicCD.toFixed(2)); } catch(_){ }
                        // HUD already shows cooldowns; avoid duplicate top HUD messages
                    }
                }

                // Q: Windup in BASE form only, INSTANT in ascended form
                if (keys['q']) {
                    if (this.qCD > 0) {
                        try { console.log('Q blocked: CD', this.qCD.toFixed(2)); } catch(_){ }
                        // HUD already shows cooldowns; avoid duplicate top HUD messages
                    } else {
                        if (this.ascended) {
                            // Ascended: No windup, instant fire (visual feedback added)
                            try { effectsAdd(new SpinningRing(this.x, this.y, this.radius + 18, '#FFFF00', 0.35, 12, 8)); } catch(_){ }
                            this.fireQ();
                            this.qCD = 3;
                        } else if (!this.qCharging) {
                            // Base form: Has windup — show immediate charging indicator
                            this.qCharging = true;
                            this.qWindup = 0.4;
                            try { effectsAdd(new SpinningRing(this.x, this.y, this.radius + 18, '#FF4444', 0.45, 10, 6)); } catch(_){ }
                        } else {
                            try { console.log('Q already charging'); } catch(_){ }
                        }
                    }
                }

                if (keys['e']) {
                    if (this.eCD > 0) { try { console.log('E blocked: CD', this.eCD); } catch(_){ } }
                    else { try { effectsAdd(new AuraRing(this.x, this.y, this.radius + 24, 0.6, this.ascended ? '#FFFF00' : '#00FF00', 6)); } catch(_){ } ; this.doE(); }
                }
                if (keys['f']) {
                    if (this.fCD > 0) { try { console.log('F blocked: CD', this.fCD); } catch(_){ } }
                    else { try { effectsAdd(new SpinningRing(this.x, this.y, this.radius + 20, '#FFAA00', 0.5, 8, 6)); } catch(_){ } ; this.doF(); }
                }
                if (keys['g']) {
                    if (this.gCD > 0) { try { console.log('G blocked: CD', this.gCD); } catch(_){ } }
                    else { try { effectsAdd(new SpinningRing(this.x, this.y, this.radius + 28, '#FFD700', 0.6, 6, 8)); } catch(_){ } ; this.doG(); }
                }
                if (keys['r']) {
                    if (this.rCD > 0) { try { console.log('R blocked: CD', this.rCD); } catch(_){ } }
                    else { try { effectsAdd(new SpinningRing(this.x, this.y, this.radius + 20, '#FF9900', 0.45, 8, 6)); } catch(_){ } ; this.useGear(); }
                }


            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);
                
                if (d > 50) { this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt; }
                // BASIC ATTACK when close enough
                if (d < 100 && this.basicCD <= 0) this.basicAtk();
                // Q ability
                if (d < 250 && this.qCD <= 0) {
                    if (this.ascended) {
                        this.fireQ();
                        this.qCD = 3;
                    } else if (!this.qCharging) {
                        this.qCharging = true;
                        this.qWindup = 0.4;
                    }
                }
                if (d < 150 && this.eCD <= 0) this.doE();
                if (d < 300 && this.fCD <= 0) this.doF();
                if (d < 100 && this.basicCD <= 0) this.basicAtk();
                
                if (this.ascensionCharges > 0 && !this.ascended && this.gCD <= 0) this.doG();
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

            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // === ENHANCED BODY RENDERING ===
                ctx.save();
                
                // Main body circle
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Armor plating - segment overlays
                if (this.ascended) {
                    // Ascended: Divine armor with golden segments
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    for (let i = 0; i < 4; i++) {
                        let ang = this.angle + (Math.PI * 2 * i / 4);
                        let x1 = screenX + Math.cos(ang) * this.radius * 0.6;
                        let y1 = screenY + Math.sin(ang) * this.radius * 0.6;
                        let x2 = screenX + Math.cos(ang + 0.4) * this.radius * 1.0;
                        let y2 = screenY + Math.sin(ang + 0.4) * this.radius * 1.0;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                } else {
                    // Base: Red armor segments
                    ctx.strokeStyle = '#AA0000';
                    ctx.lineWidth = 2;
                    for (let i = 0; i < 4; i++) {
                        let ang = this.angle + (Math.PI * 2 * i / 4);
                        let x1 = screenX + Math.cos(ang) * this.radius * 0.5;
                        let y1 = screenY + Math.sin(ang) * this.radius * 0.5;
                        let x2 = screenX + Math.cos(ang) * this.radius * 0.8;
                        let y2 = screenY + Math.sin(ang) * this.radius * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                }
                
                // === WEAPON RENDERING - SWORD ===
                let swordLength = this.radius * 1.8;
                let swordX2 = screenX + Math.cos(this.angle) * swordLength;
                let swordY2 = screenY + Math.sin(this.angle) * swordLength;
                
                // Sword glow
                ctx.strokeStyle = this.ascended ? '#FFFF00' : '#FF6666';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.globalAlpha = 0.4;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(swordX2, swordY2);
                ctx.stroke();
                
                // Sword core
                ctx.strokeStyle = this.ascended ? '#FFD700' : '#DD0000';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.9;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(swordX2, swordY2);
                ctx.stroke();
                
                // Sword highlight
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(swordX2, swordY2);
                ctx.stroke();
                
                // === DYNAMIC AURA EFFECTS ===
                if (this.ascended) {
                    // Divine form: Multi-layer rotating aura
                    ctx.globalAlpha = 0.6;
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 16, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.globalAlpha = 0.4;
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 24, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Rotating energy lines
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = '#FFFF00';
                    ctx.lineWidth = 1;
                    let era = (Date.now() * 0.001) % (Math.PI * 2);
                    for (let i = 0; i < 6; i++) {
                        let ang = era + (Math.PI * 2 * i / 6);
                        let x1 = screenX + Math.cos(ang) * (this.radius + 16);
                        let y1 = screenY + Math.sin(ang) * (this.radius + 16);
                        let x2 = screenX + Math.cos(ang) * (this.radius + 28);
                        let y2 = screenY + Math.sin(ang) * (this.radius + 28);
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                } else {
                    // Base form: Simpler red aura
                    ctx.globalAlpha = 0.4;
                    ctx.strokeStyle = '#FF4444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 12, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    ctx.globalAlpha = 0.25;
                    ctx.strokeStyle = '#DD0000';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 20, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // === ASCENSION CHARGE INDICATOR ===
                ctx.globalAlpha = 1.0;
                if (!this.ascended && this.ascensionCharges > 0) {
                    // Draw charge indicators as spinning triangles
                    for (let c = 0; c < this.ascensionCharges; c++) {
                        let chargeAngle = (Date.now() * 0.003 + (Math.PI * 2 * c / this.maxAscensionCharges)) % (Math.PI * 2);
                        let chargeX = screenX + Math.cos(chargeAngle) * (this.radius + 32);
                        let chargeY = screenY + Math.sin(chargeAngle) * (this.radius + 32);
                        
                        ctx.fillStyle = '#FFD700';
                        ctx.save();
                        ctx.translate(chargeX, chargeY);
                        ctx.rotate(chargeAngle);
                        ctx.beginPath();
                        ctx.moveTo(0, -6);
                        ctx.lineTo(6, 6);
                        ctx.lineTo(-6, 6);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }
                }
                
                // === Q CHARGING VISUAL ===
                if (this.qCharging && this.qWindup > 0) {
                    let chargePercent = 1 - (this.qWindup / 0.4);
                    
                    // Spinning charging ring
                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 18, 0, Math.PI * 2 * chargePercent);
                    ctx.stroke();
                    
                    // Pulsing energy waves
                    let pulse = Math.sin(Date.now() * 0.01) * 3;
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = '#FF4444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 15 + pulse, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.restore();
                
                // === METEOR INDICATORS ===
                if (window.meteorIndicators) {
                    ctx.save();
                    let now = Date.now();
                    for (let i = window.meteorIndicators.length - 1; i >= 0; i--) {
                        let meteor = window.meteorIndicators[i];
                        let elapsed = now - meteor.createdAt;
                        let remaining = Math.max(0, meteor.time - elapsed);
                        
                        if (remaining <= 0) {
                            window.meteorIndicators.splice(i, 1);
                            continue;
                        }
                        
                        // Multi-ring pulsing danger indicator
                        let mX = meteor.x - camera.x;
                        let mY = meteor.y - camera.y;
                        let progress = elapsed / meteor.time;
                        
                        // Outer warning ring - expanding
                        ctx.globalAlpha = 0.7 * (1 - progress);
                        ctx.strokeStyle = '#FF2222';
                        ctx.lineWidth = 5;
                        ctx.beginPath();
                        ctx.arc(mX, mY, 160 + progress * 50, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Core danger zone
                        ctx.globalAlpha = 0.85;
                        ctx.strokeStyle = '#FF6666';
                        ctx.lineWidth = 6;
                        ctx.beginPath();
                        ctx.arc(mX, mY, 180, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Pulsing inner halo
                        let innerPulse = Math.sin(elapsed / 50) * 15;
                        ctx.globalAlpha = 0.6;
                        ctx.strokeStyle = '#FFAA00';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(mX, mY, 90 + innerPulse, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Impact prediction line (toward center if moving)
                        ctx.globalAlpha = 0.4;
                        ctx.strokeStyle = '#FF0000';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([5, 5]);
                        ctx.beginPath();
                        ctx.arc(mX, mY, 200, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }
                    ctx.restore();
                    }

                    // Draw Cornelius-specific healthbar overlay if not player (ensure visible)
                    if (!this.isPlayer) {
                        let bx = this.x - camera.x - 20;
                        let by = this.y - camera.y - 35;
                        ctx.fillStyle = 'red';
                        ctx.fillRect(bx, by, 40, 5);
                        ctx.fillStyle = '#0f0';
                        ctx.fillRect(bx, by, 40 * (this.hp / this.maxHp), 5);
                        if (this.shield > 0) {
                            ctx.fillStyle = '#add8e6';
                            ctx.fillRect(bx, by, 40 * Math.min(1, this.shield / this.maxHp), 5);
                            ctx.strokeRect(bx, by, 40, 5);
                        }
                        // Hallucination obscuring
                        let _screenY = this.y - camera.y;
                        if (this.hallucinationTimer > 0 && _screenY > 60) {
                            ctx.fillStyle = '#800080';
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText('??', this.x - camera.x, _screenY - 45);
                        }
                    }
            }
        }

        class Aurora extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#00CED1' : '#008B8B', 6300);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Aurora)" : "Enemy Aurora";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 280;
                this.speed = this.baseSpd;
                
                // Passive: F charge tracker
                this.fChargeTimer = 0;
                this.fDirectCharge = 0; // Direct F cooldown charging when enemies near
                
                // Northern Light (Q)
                this.northernLights = []; // Array of light zones
                
                // Storm Trap (E)
                this.stormTraps = []; // Array of active traps
                
                // Aurora Freeze (R) - Ultimate
                this.ultimateActive = false;
                this.ultimateTimer = 0;
                this.teamBuffTimer = 0;
                this.damageBuffMultiplier = 1;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                
                // Passive: F cooldown reduces faster by 1s per second when enemies are near
                let enemiesNear = false;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 300) {
                            enemiesNear = true;
                            break;
                        }
                    }
                }
                
                if (this.fCD > 0) {
                    this.fCD -= dt;
                    if (enemiesNear) {
                        this.fCD -= dt; // Extra cooldown reduction when enemies near (double decay)
                    }
                }
                
                if (this.rCD > 0) this.rCD -= dt;
                
                // Update ultimate buff duration
                if (this.ultimateTimer > 0) {
                    this.ultimateTimer -= dt;
                    this.teamBuffTimer -= dt;
                } else {
                    this.ultimateActive = false;
                    this.teamBuffTimer = 0;
                    this.damageBuffMultiplier = 1;
                }
                
                // Update northern lights expiry and deal damage
                this.northernLights = this.northernLights.filter(light => {
                    light.timer -= dt;
                    
                    // Deal damage to enemies in light zone
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            // Check if enemy is in rectangular zone
                            let dx = e.x - light.x;
                            let dy = e.y - light.y;
                            // Rotate to zone's local coordinates
                            let rotated_x = dx * Math.cos(-light.angle) - dy * Math.sin(-light.angle);
                            let rotated_y = dx * Math.sin(-light.angle) + dy * Math.cos(-light.angle);
                            
                            if (Math.abs(rotated_x) < light.width/2 && Math.abs(rotated_y) < light.height/2) {
                                if (!light.damageDealt.has(e)) {
                                    e.takeDamage(700, this);
                                    light.damageDealt.add(e);
                                }
                            }
                        }
                    }
                    
                    return light.timer > 0;
                });
                
                // Update storm traps expiry
                this.stormTraps = this.stormTraps.filter(trap => {
                    trap.timer -= dt;
                    return trap.timer > 0;
                });
                
                // Check trap effects on enemies
                for (let trap of this.stormTraps) {
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - trap.x, dy = e.y - trap.y;
                            let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < 100) {
                                // Keep the stun effect, but do not pull enemies toward the trap center
                                e.stunTimer = Math.max(e.stunTimer || 0, 0.5);

                                // Prevent escape while still inside the trap zone without dragging them inward
                                if (d > 80) {
                                    let moveAngle = Math.atan2(dy, dx);
                                    e.x = trap.x + Math.cos(moveAngle) * 80;
                                    e.y = trap.y + Math.sin(moveAngle) * 80;
                                }
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
                } else {
                    this.ai(dt, spd);
                }
            }
            
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.ultimateTimer > 0) s *= 1.5; // Speed boost from ultimate
                if (this.slowTimer > 0) s *= 0.6;
                return s;
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
                if (keys.q && this.qCD <= 0) this.northernLight();
                if (keys.e && this.eCD <= 0) this.stormTrap();
                if (keys.f && this.fCD <= 0) this.auroraFreeze();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.6;
                
                if (this.ultimateActive) {
                    // Aurora Light Burst - ranged projectile during ultimate
                    entities.push(new Projectile(this, this.x, this.y, this.angle, 600, 65, 500, '#00CED1', 12));
                } else {
                    // Normal Aurora Light - ranged projectile
                    entities.push(new Projectile(this, this.x, this.y, this.angle, 600, 50, 500, '#00CED1', 10));
                }
            }
            
            northernLight() {
                this.qCD = 10;
                // Create AoE rectangular zone
                let width = 450, height = 300;
                this.northernLights.push({
                    x: this.x + Math.cos(this.angle) * 150,
                    y: this.y + Math.sin(this.angle) * 150,
                    angle: this.angle,
                    width: width,
                    height: height,
                    timer: 5,
                    damageDealt: new Set() // Track enemies hit for one-time damage
                });
                
                // Multi-colored aurora particles for northern light creation
                let colors = ['#00FFF0', '#00CED1', '#00BFFF', '#32CD32', '#9370DB'];
                for (let i = 0; i < 60; i++) {
                    let angle = this.angle + (Math.random() - 0.5) * 0.8;
                    let dist = 50 + Math.random() * 150;
                    let color = colors[Math.floor(Math.random() * colors.length)];
                    let vel = new Vector2(Math.cos(angle) * 150 + (Math.random() - 0.5) * 100, 
                                       Math.sin(angle) * 150 + (Math.random() - 0.5) * 100);
                    particles.push(new Particle(
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist,
                        color,
                        4 + Math.random() * 2,
                        1.0 + Math.random() * 0.5,
                        vel.x,
                        vel.y
                    ));
                }
                
                if (this.isPlayer) addKillMsg('❄️ Northern Light!');
            }
            
            stormTrap() {
                this.eCD = 7;
                // Place trap at mouse position (max 300 units away)
                let mouseDist = Math.sqrt(Math.pow(mouse.x - (CANVAS.width/2), 2) + Math.pow(mouse.y - (CANVAS.height/2), 2));
                let maxDist = 300;
                if (mouseDist > maxDist * 3) { // Approximate scaling
                    mouseDist = maxDist * 3;
                }
                
                let trapX = this.x + Math.cos(this.angle) * Math.min(mouseDist / 3, 300);
                let trapY = this.y + Math.sin(this.angle) * Math.min(mouseDist / 3, 300);
                
                this.stormTraps.push({
                    x: trapX,
                    y: trapY,
                    radius: 100,
                    timer: 1.5,
                    damaged: new Set()
                });
                
                // Deal damage to enemies in trap on placement
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - trapX)**2 + (e.y - trapY)**2);
                        if (d < 100) {
                            e.takeDamage(600, this);
                        }
                    }
                }
                
                // Explosive storm placement particles with sound effect
                let stormColors = ['#4169E1', '#1E90FF', '#00BFFF', '#00FFFF'];
                for (let i = 0; i < 50; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(250 + Math.random() * 150);
                    let color = stormColors[Math.floor(Math.random() * stormColors.length)];
                    particles.push(new Particle(trapX, trapY, color, 3 + Math.random() * 2, 0.8 + Math.random() * 0.4, vel.x, vel.y));
                }
                
                // Additional lightning spark particles
                for (let i = 0; i < 30; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = Math.random() * 120;
                    particles.push(new Particle(
                        trapX + Math.cos(angle) * dist,
                        trapY + Math.sin(angle) * dist,
                        '#00FFFF',
                        2,
                        0.6 + Math.random() * 0.3
                    ));
                }
                
                if (this.isPlayer) addKillMsg('🌪️ Storm Trap!');
            }
            
            auroraFreeze() {
                this.fCD = 25;
                this.ultimateActive = true;
                this.ultimateTimer = 7;
                this.teamBuffTimer = 7;
                
                // Grant 500 shield to self and all teammates
                this.shield += 500;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team === this.team) {
                        e.shield += 500;
                    }
                }
                
                // Dash forward - create trailing particles
                let dashDist = 300;
                let startX = this.x;
                let startY = this.y;
                
                // Trail particles during dash
                for (let i = 0; i < 10; i++) {
                    let trailX = startX + Math.cos(this.angle) * (dashDist * (i / 10));
                    let trailY = startY + Math.sin(this.angle) * (dashDist * (i / 10));
                    
                    let iceColors = ['#00FFFF', '#00CED1', '#1E90FF', '#00BFFF'];
                    for (let j = 0; j < 3; j++) {
                        let angle = Math.random() * Math.PI * 2;
                        let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(150 + Math.random() * 100);
                        particles.push(new Particle(
                            trailX,
                            trailY,
                            iceColors[Math.floor(Math.random() * iceColors.length)],
                            2,
                            0.5 + Math.random() * 0.3,
                            vel.x,
                            vel.y
                        ));
                    }
                }
                
                this.x += Math.cos(this.angle) * dashDist;
                this.y += Math.sin(this.angle) * dashDist;
                
                // Freeze and damage enemies in 200 radius
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 200) {
                            e.takeDamage(200, this);
                            e.freezeTimer = Math.max(e.freezeTimer, 1);
                        }
                    }
                }
                
                // Team buff - apply to teamates
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team === this.team) {
                        e.teamBuffTimer = 7;
                        e.damageBuffMultiplier = 1.2;
                    }
                }
                
                // Massive ice explosion particles at landing site
                let iceColors = ['#00FFFF', '#00CED1', '#1E90FF', '#00BFFF', '#9370DB'];
                
                // Fast expanding ice shards
                for (let i = 0; i < 70; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(350 + Math.random() * 200);
                    particles.push(new Particle(this.x, this.y, iceColors[Math.floor(Math.random() * iceColors.length)], 3 + Math.random() * 2, 0.8 + Math.random() * 0.4, vel.x, vel.y));
                }
                
                // Slower aurora glow particles
                for (let i = 0; i < 40; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = Math.random() * 150;
                    particles.push(new Particle(
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist,
                        '#9370DB',
                        2 + Math.random() * 1,
                        1.0 + Math.random() * 0.5
                    ));
                }
                
                if (this.isPlayer) {
                    addKillMsg('✨ Aurora Freeze!');
                    screenShake(15);
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
                
                if (d > 250) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0 && Math.random() < 0.5) this.basicAtk();
                    if (d < 180 && this.qCD <= 0 && Math.random() < 0.2) this.northernLight();
                    if (d < 200 && this.eCD <= 0 && Math.random() < 0.3) this.stormTrap();
                    if (d < 400 && this.fCD <= 0 && Math.random() < 0.15) this.auroraFreeze();
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
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                // Draw northern lights zones with wave effects
                for (let light of this.northernLights) {
                    let sx = light.x - camera.x;
                    let sy = light.y - camera.y;
                    
                    ctx.save();
                    ctx.translate(sx, sy);
                    ctx.rotate(light.angle);
                    
                    // Draw animated gradient waves
                    let wavePhase = this.drawTimer * 4;
                    let fadeAlpha = 0.6 + (light.timer / 5) * 0.4;
                    
                    // Multiple wave layers for aurora effect
                    for (let waveLayer = 0; waveLayer < 3; waveLayer++) {
                        ctx.globalAlpha = fadeAlpha * (0.8 - waveLayer * 0.25);
                        let gradient = ctx.createLinearGradient(-light.width/2, -light.height/2, light.width/2, light.height/2);
                        
                        // Cyan, green, purple gradient like real auroras
                        if (waveLayer === 0) {
                            gradient.addColorStop(0, '#00FFF0');
                            gradient.addColorStop(0.5, '#00CED1');
                            gradient.addColorStop(1, '#00BFFF');
                        } else if (waveLayer === 1) {
                            gradient.addColorStop(0, '#00FF7F');
                            gradient.addColorStop(0.5, '#32CD32');
                            gradient.addColorStop(1, '#00FF7F');
                        } else {
                            gradient.addColorStop(0, '#9370DB');
                            gradient.addColorStop(0.5, '#00CED1');
                            gradient.addColorStop(1, '#9370DB');
                        }
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(-light.width/2, -light.height/2 + Math.sin(wavePhase + waveLayer) * 15, light.width, light.height);
                    }
                    
                    // Glowing edge effect
                    ctx.globalAlpha = 0.5 * fadeAlpha;
                    ctx.strokeStyle = '#00FFF0';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(-light.width/2, -light.height/2, light.width, light.height);
                    
                    ctx.restore();
                }
                
                // Draw storm traps with lightning/storm effect
                for (let trap of this.stormTraps) {
                    let sx = trap.x - camera.x;
                    let sy = trap.y - camera.y;
                    
                    ctx.save();
                    
                    // Outer expanding ring effect
                    let ringExpand = Math.sin(this.drawTimer * 8) * 20;
                    ctx.globalAlpha = 0.4;
                    ctx.strokeStyle = '#1E90FF';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(sx, sy, trap.radius + ringExpand, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Main trap circle with pulsing effect
                    ctx.globalAlpha = 0.5 + Math.sin(this.drawTimer * 3) * 0.25;
                    let gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, trap.radius);
                    gradient.addColorStop(0, '#4169E1');
                    gradient.addColorStop(0.7, '#1E90FF');
                    gradient.addColorStop(1, '#00BFFF');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(sx, sy, trap.radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Lightning bolts inside trap
                    ctx.globalAlpha = 0.6 + Math.sin(this.drawTimer * 15) * 0.4;
                    ctx.strokeStyle = '#00FFFF';
                    ctx.lineWidth = 2;
                    for (let bolt = 0; bolt < 3; bolt++) {
                        let boltAngle = (Math.PI * 2 / 3) * bolt + this.drawTimer * 2;
                        let x1 = sx + Math.cos(boltAngle) * (trap.radius * 0.3);
                        let y1 = sy + Math.sin(boltAngle) * (trap.radius * 0.3);
                        let x2 = sx + Math.cos(boltAngle) * (trap.radius * 0.8);
                        let y2 = sy + Math.sin(boltAngle) * (trap.radius * 0.8);
                        
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        for (let i = 0; i < 3; i++) {
                            let px = x1 + (x2 - x1) * ((i + 1) / 4) + (Math.random() - 0.5) * 20;
                            let py = y1 + (y2 - y1) * ((i + 1) / 4) + (Math.random() - 0.5) * 20;
                            ctx.lineTo(px, py);
                        }
                        ctx.lineTo(x2, y2);
                        ctx.stroke();
                    }
                    
                    // Swirling storm effect
                    ctx.globalAlpha = 0.3;
                    ctx.strokeStyle = '#4169E1';
                    ctx.lineWidth = 1;
                    for (let i = 0; i < 2; i++) {
                        ctx.beginPath();
                        for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
                            let rad = trap.radius * 0.6 + Math.sin(angle * 5 + this.drawTimer * 4) * 15;
                            let x = sx + Math.cos(angle) * rad;
                            let y = sy + Math.sin(angle) * rad;
                            if (angle === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                }
                
                // Draw ultimate buff indicator with aurora glow
                if (this.ultimateTimer > 0) {
                    let sx = this.x - camera.x;
                    let sy = this.y - camera.y;
                    
                    ctx.save();
                    
                    // Pulsing glow rings
                    let pulseSize = 10 + Math.sin(this.drawTimer * 5) * 5;
                    for (let ring = 0; ring < 3; ring++) {
                        ctx.globalAlpha = (0.6 - ring * 0.2) * 0.7;
                        ctx.strokeStyle = ['#00FFF0', '#00CED1', '#1E90FF'][ring];
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(sx, sy, this.radius + 15 + ring * pulseSize, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    // Rotating aurora particles around player
                    for (let i = 0; i < 8; i++) {
                        let angle = (Math.PI * 2 / 8) * i + this.drawTimer * 2;
                        let px = sx + Math.cos(angle) * 50;
                        let py = sy + Math.sin(angle) * 50;
                        ctx.globalAlpha = 0.8;
                        ctx.fillStyle = ['#00FFF0', '#32CD32', '#9370DB'][i % 3];
                        ctx.beginPath();
                        ctx.arc(px, py, 3, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    
                    ctx.restore();
                }
            }
            
            ai(dt, spd) {
                if (this.dead) return;
                
                if (Math.random() < 0.02) {
                    this.angle = Math.random() * Math.PI * 2;
                }
                
                // Q ability - Northern Light
                if (this.qCD <= 0 && Math.random() < 0.015) {
                    this.northernLight();
                }
                
                // E ability - Storm Trap
                if (this.eCD <= 0 && Math.random() < 0.01) {
                    this.stormTrap();
                }
                
                // R ability - Aurora Freeze (less frequent)
                if (this.fCD <= 0 && Math.random() < 0.005) {
                    this.auroraFreeze();
                }
                
                // Basic attack
                if (this.basicCD <= 0 && Math.random() < 0.03) {
                    this.basicAttack();
                }
                
                // Movement toward enemies
                let targetEnemy = null;
                let minDist = Infinity;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < minDist) {
                            minDist = d;
                            targetEnemy = e;
                        }
                    }
                }
                
                if (targetEnemy) {
                    let dx = targetEnemy.x - this.x;
                    let dy = targetEnemy.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 0) {
                        this.angle = Math.atan2(dy, dx);
                        this.vx = Math.cos(this.angle) * spd;
                        this.vy = Math.sin(this.angle) * spd;
                    }
                } else {
                    this.vx = 0;
                    this.vy = 0;
                }
            }
        }

        class Bai extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, p ? '#2C3E50' : '#1C2833', 4800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Bai)" : "Enemy Bai";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 320;
                this.speed = this.baseSpd;
                
                this.basicAttackCount = 0;
                this.hasInkDamage = false;
                this.inkDamageTimer = 0;
                this.inInkZone = false;
                this.inkZoneTimer = 0;

                // Two-stage E: pending marker for dash->zone
                this.pendingInk = null; // {x,y}
                this.pendingInkTimer = 0;

                this.ultimateSlashing = false;
                this.ultimateTimer = 0;
                this.ultimateDamageTimer = 0;
                this.ultRotation = 0;

                // support for Q teleport windup (Apollo)
                this.pendingQTeleportTarget = null;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                
                if (this.hasInkDamage) {
                    this.inkDamageTimer -= dt;
                    if (this.inkDamageTimer <= 0) this.hasInkDamage = false;
                }
                
                if (this.inInkZone) {
                    this.inkZoneTimer -= dt;
                    if (this.inkZoneTimer <= 0) this.inInkZone = false;
                }

                // Pending ink marker expiration (two-stage E)
                if (this.pendingInkTimer > 0) {
                    this.pendingInkTimer -= dt;
                    if (this.pendingInkTimer <= 0) this.pendingInk = null;
                }
                
                if (this.ultimateSlashing) {
                    this.ultimateTimer -= dt;
                    this.ultimateDamageTimer -= dt;
                    if (this.ultimateDamageTimer <= 0) {
                        // faster visual tick for smooth rotation
                        this.ultimateDamageTimer = 0.06;

                        // Damage tick (unchanged)
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 175) e.takeDamage(6500 / 66, this); // exact total = 6500 over ~66 ticks
                            }
                        }

                        // Anime-style rotating ring of slashes (replaces the old central slash blobs)
                        this.ultRotation += 0.6; // rotation speed
                        const blades = 12;
                        const ringR = 175;
                        for (let i = 0; i < blades; i++) {
                            let ang = this.ultRotation + i * (Math.PI * 2 / blades);
                            // thin, glowing streaks placed around the circle and oriented tangentially
                            particles.push(new RectSlash(this.x + Math.cos(ang) * ringR, this.y + Math.sin(ang) * ringR, ang + Math.PI/2, 40, 6, '#FFD97A'));

                            // occasional tangential spark particles for anime flair
                            if (i % 3 === 0) {
                                let sx = this.x + Math.cos(ang) * (ringR - 10);
                                let sy = this.y + Math.sin(ang) * (ringR - 10);
                                let tvx = -Math.sin(ang) * (120 + Math.random() * 60);
                                let tvy = Math.cos(ang) * (120 + Math.random() * 60);
                                particles.push(new Particle(sx, sy, '#FFF6D8', 2, 0.5, tvx, tvy));
                            }
                        }
                    }
                    if (this.ultimateTimer <= 0) this.ultimateSlashing = false;
                    // allow movement during ultimate (20% speed via getEffectiveSpeed), but still update HUD
                    if (this.isPlayer) updateHUD(this);
                    // do NOT return here — input() will be restricted to movement only
                }
                
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
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
            
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.inInkZone) s *= 1.1;
                if (this.ultimateSlashing) s *= 0.2;
                if (this.slowTimer > 0) s *= 0.6;
                return s;
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;

                // movement always allowed (getEffectiveSpeed reduces to 20% during ultimate)
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }

                this.angle = getMouseAimAngle(this.x, this.y);

                // while ultimate-slashing, only movement is allowed (no other abilities)
                if (this.ultimateSlashing) return;

                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.freshIdeas();
                if (keys.e && this.eCD <= 0) this.inkZone();
                if (keys.f && this.fCD <= 0) this.continousInkSlash();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.5;
                this.basicAttackCount++;

                // base damage (with ink bonus)
                let dmg = 80;
                if (this.hasInkDamage) { dmg += dmg * 0.2; this.hasInkDamage = false; }

                // origin of slash moved forward so the attack is in front of Bai
                const forwardOffset = 30;
                const sx = this.x + Math.cos(this.angle) * forwardOffset;
                const sy = this.y + Math.sin(this.angle) * forwardOffset;

                if (this.basicAttackCount >= 4) {
                    // enhanced 4th hit — large forward slash
                    dmg = 300;
                    this.basicAttackCount = 0;
                    const range = 150, arc = Math.PI/2;
                    particles.push(new Slash(sx, sy, this.angle, range, arc, '#34495E'));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - sx)**2 + (e.y - sy)**2);
                            if (d < range) {
                                let ad = Math.abs(Math.atan2(e.y - sy, e.x - sx) - this.angle);
                                if (ad > Math.PI) ad = 2 * Math.PI - ad;
                                if (ad < arc/2) e.takeDamage(dmg, this);
                            }
                        }
                    }
                    this.hasInkDamage = true;
                    this.inkDamageTimer = 3;
                    if (this.isPlayer) addKillMsg('🎨 Enhanced!');
                } else {
                    // normal basic = short forward slash
                    const range = 100, arc = Math.PI/2;
                    particles.push(new Slash(sx, sy, this.angle, range, arc, '#34495E'));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - sx)**2 + (e.y - sy)**2);
                            if (d < range) {
                                let ad = Math.abs(Math.atan2(e.y - sy, e.x - sx) - this.angle);
                                if (ad > Math.PI) ad = 2 * Math.PI - ad;
                                if (ad < arc/2) e.takeDamage(dmg, this);
                            }
                        }
                    }
                }
            }
            
            freshIdeas() {
                this.qCD = 5;
                const slashDist = 220;
                const slashArc = Math.PI/2.5; // wider slashes

                // Origin moved forward so the Q cross appears in front of Bai
                const forwardOffset = 90;
                const sx = this.x + Math.cos(this.angle) * forwardOffset;
                const sy = this.y + Math.sin(this.angle) * forwardOffset;

                // Cross-shaped: 4 perpendicular slashes (relative to current facing)
                const angles = [this.angle, this.angle + Math.PI/2, this.angle + Math.PI, this.angle + 3*Math.PI/2];
                for (let a of angles) particles.push(new Slash(sx, sy, a, slashDist, slashArc, '#2C3E50'));

                // Damage must match the visual cross: check each enemy against any slash angle from sx,sy
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - sx)**2 + (e.y - sy)**2);
                        if (d < slashDist) {
                            let hit = false;
                            for (let a of angles) {
                                let ad = Math.abs(Math.atan2(e.y - sy, e.x - sx) - a);
                                if (ad > Math.PI) ad = 2 * Math.PI - ad;
                                if (ad < slashArc/2) { hit = true; break; }
                            }
                            if (hit) {
                                let dmg = 1000;
                                if (this.hasInkDamage) { dmg += dmg * 0.2; this.hasInkDamage = false; }
                                e.takeDamage(dmg, this);
                            }
                        }
                    }
                }

                for (let i = 0; i < 40; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200 + Math.random() * 100);
                    particles.push(new Particle(this.x, this.y, '#34495E', 3 + Math.random() * 2, 0.6 + Math.random() * 0.3, vel.x, vel.y));
                }
                if (this.isPlayer) addKillMsg('📖 Fresh!');
            }
            
            inkZone() {
                // Two-stage E: first cast places a marker, second cast dashes to it and triggers the zone
                if (!this.pendingInk) {
                    // Place marker at mouse within max range
                    let mouseDist = Math.sqrt(Math.pow(mouse.x - (CANVAS.width/2), 2) + Math.pow(mouse.y - (CANVAS.height/2), 2));
                    let dashDist = Math.min(mouseDist, 500);
                    this.pendingInk = { x: this.x + Math.cos(this.angle) * dashDist, y: this.y + Math.sin(this.angle) * dashDist };
                    this.pendingInkTimer = 4.0; // marker lasts 4s
                    if (this.isPlayer) addKillMsg('✒️ Marker set! (press E again to dash)');
                    return;
                }

                // Execute second cast: dash to pending marker and create ink zone
                this.eCD = 6;
                let startX = this.x;
                let startY = this.y;
                this.x = this.pendingInk.x;
                this.y = this.pendingInk.y;
                this.pendingInk = null;
                this.pendingInkTimer = 0;

                this.inInkZone = true;
                this.inkZoneTimer = 4;

                // Explosion and slow applied immediately at the landing spot
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 150) {
                            e.takeDamage(580, this);
                            e.slowTimer = Math.max(e.slowTimer, 2);
                        }
                    }
                }
                this.hasInkDamage = true;
                this.inkDamageTimer = 3;
                for (let i = 0; i < 20; i++) {
                    let trailX = startX + Math.cos(this.angle) * (Math.min(Math.sqrt(Math.pow(mouse.x - (CANVAS.width/2), 2) + Math.pow(mouse.y - (CANVAS.height/2), 2)), 500) * (i / 20));
                    let trailY = startY + Math.sin(this.angle) * (Math.min(Math.sqrt(Math.pow(mouse.x - (CANVAS.width/2), 2) + Math.pow(mouse.y - (CANVAS.height/2), 2)), 500) * (i / 20));
                    let angle = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(150);
                    particles.push(new Particle(trailX, trailY, '#2C3E50', 2, 0.5, vel.x, vel.y));
                }
                if (this.isPlayer) addKillMsg('✒️ Zone!');
            }
            
            continousInkSlash() {
                this.fCD = 24;
                // don't block or modify gear cooldown while ultimate is active — keep R independent
                this.ultimateSlashing = true;
                this.ultimateTimer = 4;
                this.ultimateDamageTimer = 0;
                if (this.isPlayer) { addKillMsg('🖋️ Slash!'); screenShake(10); }
            }
            
            ai(dt, spd) {
                if (this.dead) return;
                if (Math.random() < 0.02) this.angle = Math.random() * Math.PI * 2;
                if (this.qCD <= 0 && Math.random() < 0.015) this.freshIdeas();
                if (this.eCD <= 0 && Math.random() < 0.01) this.inkZone();
                if (this.fCD <= 0 && Math.random() < 0.008) this.continousInkSlash();
                if (this.basicCD <= 0 && Math.random() < 0.04) this.basicAtk();
                let targetEnemy = null, minDist = Infinity;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < minDist) { minDist = d; targetEnemy = e; }
                    }
                }
                if (targetEnemy) {
                    let dx = targetEnemy.x - this.x, dy = targetEnemy.y - this.y, dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 0) {
                        this.angle = Math.atan2(dy, dx);
                        this.vx = Math.cos(this.angle) * spd;
                        this.vy = Math.sin(this.angle) * spd;
                    }
                } else { this.vx = 0; this.vy = 0; }
            }
            
            draw(ctx) {
                super.draw(ctx);
                if (this.hasInkDamage) {
                    ctx.save();
                    ctx.translate(this.x - camera.x, this.y - camera.y - this.radius - 10);
                    ctx.fillStyle = '#FF6B6B';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('🎨', 0, 0);
                    ctx.restore();
                }
                if (this.inInkZone) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = '#2C3E50';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 120, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 0.6;
                    ctx.strokeStyle = '#34495E';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.restore();
                }

                // Draw pending ink marker for two-stage E
                if (this.pendingInk) {
                    ctx.save();
                    ctx.globalAlpha = 0.25;
                    ctx.fillStyle = '#2C3E50';
                    ctx.beginPath();
                    ctx.arc(this.pendingInk.x - camera.x, this.pendingInk.y - camera.y, 120, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 0.9;
                    ctx.strokeStyle = '#FFB300';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                    ctx.restore();
                }

                if (this.ultimateSlashing) {
                    ctx.save();
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = '#2C3E50';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 175, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

        class Apollo extends Entity {
            constructor(x, y, p) {
                super(x, y, 22, p ? '#FF8C00' : '#FF6B00', 6800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Apollo)" : "Enemy Apollo";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 300;
                this.speed = this.baseSpd;
                this.sunMarkedEnemies = new Set();
                // Q stage state: 0 = ready, 1 = target(s) marked (second-cast available)
                this.qTeleported = false;
                this.qStage = 0;
                this.qStageTimer = 0;
                this.inRealm = false;
                this.realmTimer = 0;
                this.realmTarget = null;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;

                // Q-stage expiry (marks expire after timer)
                if (this.qStageTimer > 0) {
                    this.qStageTimer -= dt;
                    if (this.qStageTimer <= 0) { this.qStage = 0; this.qStageTimer = 0; this.qTeleported = false; }
                }

                // realmTimer and expiration handled centrally in updateCommon()
                
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
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
            
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.inRealm) s *= 1.5;
                if (this.slowTimer > 0) s *= 0.6;
                return s;
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
                if (mouse.down && this.basicCD <= 0) this.firePunch();
                if (keys.q && this.qCD <= 0) this.firePunchEnergy();
                if (keys.e && this.eCD <= 0) this.judgementCut();
                if (keys.f && this.fCD <= 0) this.sunballUltimate();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            firePunch() {
                this.revealTimer = 0.5;
                this.basicCD = 1;

                // Rectangular frontal punch (visual + hit detection) — increased reach & damage
                const punchLen = 180; // forward reach (buffed)
                const punchWid = 60;  // vertical thickness
                particles.push(new RectSlash(this.x, this.y, this.angle, punchLen, punchWid, '#FF8C00'));

                // damage any enemy whose bounding circle intersects the punch rectangle
                for (let e of entities) {
                    if (e === this || e.dead || !(e instanceof Entity) || e.team === this.team) continue;
                    let dx = e.x - this.x, dy = e.y - this.y;
                    // rotate point into attack-local coordinates
                    let rx = dx * Math.cos(-this.angle) - dy * Math.sin(-this.angle);
                    let ry = dx * Math.sin(-this.angle) + dy * Math.cos(-this.angle);
                    if (rx > -e.radius && rx < punchLen + e.radius && ry > -punchWid/2 - e.radius && ry < punchWid/2 + e.radius) {
                        e.takeDamage(200, this); // damage buff
                        e.revealTimer = 0.6;
                        for (let i = 0; i < 6; i++) {
                            let a = Math.random() * Math.PI * 2;
                            let v = new Vector2(Math.cos(a), Math.sin(a)).mult(150);
                            particles.push(new Particle(e.x, e.y, '#FF8C00', 3, 0.4, v.x, v.y));
                        }
                    }
                }
            }
            
            firePunchEnergy() {
                // Two-stage Q managed by qStage (0 = ready, 1 = marked)
                if (this.qStage === 1) {
                    // second cast -> full cooldown and teleport
                    this.qCD = 7;

                    let closestTarget = null, minDist = Infinity;
                    for (let e of this.sunMarkedEnemies) {
                        if (!e.dead) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < minDist) { minDist = d; closestTarget = e; }
                        }
                    }

                    // If there are no valid marked targets, refund Q immediately
                    if (!closestTarget) {
                        this.qCD = 0;
                        this.qStage = 0; this.qStageTimer = 0; this.qTeleported = false;
                        if (this.isPlayer) addKillMsg('Q refunded (no marked target)');
                        return;
                    }

                    // If Apollo is currently inside a JusticeRealm, DEFER the teleport until the realm ends
                    this.qCD = 7; // start full cooldown now
                    this.pendingQTeleportTarget = closestTarget;
                    if (this.inRealm && this.realm && this.realm.type === 'justice') {
                        this.pendingQTeleportDeferred = true; // wait for realm to finish
                        // visual cue for deferred teleport
                        for (let i = 0; i < 8; i++) particles.push(new Particle(this.x, this.y, '#FFD700', 2, 0.6, (Math.random()-0.5)*200, (Math.random()-0.5)*200));

                        // clear local q-stage immediately to prevent double-casts while deferred
                        this.qStage = 0; this.qStageTimer = 0; this.qTeleported = false;
                        return;
                    }

                    // Schedule teleport windup (0.1s) — normal behavior when not in realm
                    this.teleportWindup = 0.1;
                    this.teleportTarget = { x: closestTarget.x, y: closestTarget.y };

                    // small pre-teleport particle cue
                    for (let i = 0; i < 12; i++) particles.push(new Particle(this.x, this.y, '#FFD700', 3, 0.4));

                    // clear local q-stage immediately to prevent double-casts while windup runs
                    this.qStage = 0; this.qStageTimer = 0; this.qTeleported = false;
                    return;
                }

                // First cast: launch marker projectile and allow immediate second-cast
                // Default to 2s cooldown (miss penalty) - will be reset to 0 if we hit
                this.qCD = 2;

                // projectile to apply marks reliably
                let p = new Projectile(this, this.x, this.y, this.angle, 1400, 500, 1200, '#FFD700', 28);
                const apOwner = this;
                let qHitMarked = false;
                p.onHit = function(target) {
                    try {
                        if (target && !target.dead && target instanceof Entity && target.team !== apOwner.team && target.isTargetable !== false) {
                            // remove previous owner's reference if different
                            try { if (target.apolloFireOwner && target.apolloFireOwner !== apOwner && target.apolloFireOwner.sunMarkedEnemies) target.apolloFireOwner.sunMarkedEnemies.delete(target); } catch(_) {}

                            // always (re)apply and refresh mark
                            target.apolloFireTimer = 3;
                            target.apolloFireOwner = apOwner;
                            apOwner.sunMarkedEnemies.add(target);

                            // enable second stage and allow immediate second-press
                            apOwner.qStage = 1;
                            apOwner.qStageTimer = 3;
                            apOwner.qTeleported = true;
                            apOwner.qCD = 0;
                            qHitMarked = true;
                        }
                    } catch (err) { console.warn('Apollo Q onHit', err); }
                };
                entities.push(p);

                // immediate nearby mark (still useful at cast time) — resets cooldown if hit
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isTargetable !== false) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 120) {
                            // transfer mark ownership if needed and refresh timer
                            try {
                                if (e.apolloFireOwner && e.apolloFireOwner !== this && e.apolloFireOwner.sunMarkedEnemies) {
                                    e.apolloFireOwner.sunMarkedEnemies.delete(e);
                                }
                            } catch(_) {}
                            e.apolloFireTimer = 3;
                            e.apolloFireOwner = this;
                            this.sunMarkedEnemies.add(e);

                            // enable second stage and reset cooldown on hit
                            this.qStage = 1;
                            this.qStageTimer = 3;
                            this.qTeleported = true;
                            this.qCD = 0;
                            qHitMarked = true;
                        }
                    }
                }
                if (qHitMarked && !this.dead) {
                    this.hp = Math.min(this.maxHp, this.hp + 200);
                }
                if (this.isPlayer) addKillMsg('☀️ Punch!');
            }
            
            judgementCut() {
                this.eCD = 5;
                for (let e of this.sunMarkedEnemies) {
                    if (!e.dead) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 200) {
                            e.takeDamage(600, this);

                            // Clear the sun-mark on the target and from its owner
                            try {
                                // If the target is inside a JusticeRealm, DO NOT remove the sun-mark (mark persists during realm)
                                if (e.inRealm && e.realm && e.realm.type === 'justice') {
                                    // preserve mark — refresh timer to realm duration to be safe
                                    try { e.apolloFireTimer = Math.max(e.apolloFireTimer || 0, e.realm.life || 0.1); } catch(_) { e.apolloFireTimer = 0.1; }
                                    // keep ownership intact
                                } else {
                                    if (e.apolloFireTimer) {
                                        e.apolloFireTimer = 0;
                                        if (e.apolloFireOwner && e.apolloFireOwner.sunMarkedEnemies) e.apolloFireOwner.sunMarkedEnemies.delete(e);
                                        e.apolloFireOwner = null;
                                        e.lastApolloFireTick = 0;
                                    }
                                    // remove from Apollo's local marked set as before
                                    this.sunMarkedEnemies.delete(e);
                                    // Refund Q cooldown only (no second stage charge)
                                    this.qCD = 0;
                                }
                            } catch(_) {}

                            // keep E cooldown applied on use (do NOT reset to 0)
                            for (let i = 0; i < 20; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                                particles.push(new Particle(e.x, e.y, '#FF6B00', 3, 0.6, vel.x, vel.y));
                            }
                            if (this.isPlayer) addKillMsg('⚡ Cut!');
                            return;
                        }
                    }
                }
                particles.push(new Slash(this.x, this.y, this.angle, 150, Math.PI/4, '#FF6B00'));
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 150) e.takeDamage(600, this);
                    }
                }
                if (this.isPlayer) addKillMsg('⚖️ Justice!');
            }
            
            sunballUltimate() {
                this.fCD = 40;
                // do NOT set gear (R) cooldown here — R remains independent from F

                // find a closest enemy to target the realm on-hit
                let closestEnemy = null, minDist = Infinity;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isTargetable !== false) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < minDist) { minDist = d; closestEnemy = e; }
                    }
                }

                if (!closestEnemy) return;

                // Fire a fast, large sun projectile; realm will be created only on a HIT.
                // Restore original behavior: projectile EXPLODES on impact/expiry (old behavior).
                const rid = nextRealmId++;
                const projSpeed = 2200;
                const projRange = 2000;
                // explo=true -> allow area explosion (old behavior)
                let proj = new Projectile(this, this.x, this.y, this.angle, projSpeed, 0, projRange, '#FFD700', 48, false, false, true);

                const apOwner = this;

                // mark that the projectile has actually hit the intended target
                proj.hitTarget = false;

                // create realm immediately when the projectile hits the intended enemy
                proj.onHit = function(target) {
                    try {
                        if (!target || target.dead) return;
                        if (target === closestEnemy && closestEnemy.team !== apOwner.team) {
                            proj.hitTarget = true;

                            // choose an arena center far from both participants
                            let arenaX = null, arenaY = null;
                            // Prefer an arena location that is very far from both players (feels like a separate island/map).
                            for (let attempt = 0; attempt < 32; attempt++) {
                                // pick candidate near edges/corners to feel remote
                                const cornerPad = 250;
                                const pickCorner = Math.floor(Math.random()*4);
                                let ax = (pickCorner===0 ? cornerPad : WORLD_SIZE - cornerPad) + (Math.random()-0.5)*200;
                                let ay = (pickCorner===1 ? cornerPad : WORLD_SIZE - cornerPad) + (Math.random()-0.5)*200;
                                // bias candidates toward corners but keep them inside WORLD bounds
                                ax = Math.max(100, Math.min(WORLD_SIZE-100, ax));
                                ay = Math.max(100, Math.min(WORLD_SIZE-100, ay));
                                let d1 = Math.hypot(ax - apOwner.x, ay - apOwner.y);
                                let d2 = Math.hypot(ax - closestEnemy.x, ay - closestEnemy.y);
                                // require a larger separation so arena feels distant
                                if (d1 > 1500 && d2 > 1500) { arenaX = ax; arenaY = ay; break; }
                            }
                            // fallback: use a reasonably distant center if a corner candidate wasn't found
                            if (arenaX === null) { arenaX = WORLD_SIZE/2 + (Math.random()-0.5)*1200; arenaY = WORLD_SIZE/2 + (Math.random()-0.5)*1200; }
                            const offset = 120;

                            // teleport participants into the realm (opposite sides) and stop momentum
                            apOwner.realmId = rid; apOwner.inRealm = true; apOwner.realmTimer = 8; apOwner.realmTarget = closestEnemy;
                            apOwner.realmReturnPos = { x: apOwner.x, y: apOwner.y };
                            apOwner.x = arenaX - offset; apOwner.y = arenaY; apOwner.vx = 0; apOwner.vy = 0; apOwner.shield += 1020;

                            closestEnemy.realmId = rid; closestEnemy.inRealm = true; closestEnemy.realmTimer = 8; closestEnemy.realmTarget = apOwner;
                            closestEnemy.realmReturnPos = { x: closestEnemy.x, y: closestEnemy.y };
                            closestEnemy.x = arenaX + offset; closestEnemy.y = arenaY; closestEnemy.vx = 0; closestEnemy.vy = 0;

                            // visual at the remote arena center
                            for (let i = 0; i < 60; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(300);
                                particles.push(new Particle(arenaX, arenaY, '#FFD700', 6, 1, vel.x, vel.y));
                            }

                            // create the JUSTICE realm (distinct from Ming's Realm) and attach the marked target
                            const realm = new JusticeRealm(apOwner, arenaX, arenaY, 8.0, closestEnemy);
                            entities.push(realm);
                            apOwner.realm = realm;
                            closestEnemy.realm = realm;

                            // Ensure the sun-mark persists while the JusticeRealm is active
                            try {
                                if (closestEnemy.apolloFireOwner === apOwner) {
                                    // refresh the mark timer to at least the realm duration
                                    closestEnemy.apolloFireTimer = Math.max(closestEnemy.apolloFireTimer || 0, realm.life || 0.1);
                                    apOwner.sunMarkedEnemies.add(closestEnemy);
                                }
                            } catch(_) {}

                            // FX at the projectile explosion origin for clarity
                            for (let i = 0; i < 20; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(160);
                                particles.push(new Particle(proj.x, proj.y, '#FFD700', 4, 0.6, vel.x, vel.y));
                            }

                            proj.del = true;
                            if (apOwner.isPlayer) addKillMsg('☀️ Realm!');
                        } else {
                            // Hit a different target -> failed realm attempt: apply -30s penalty and mark penalized
                            try { if (apOwner && !apOwner.dead) apOwner.fCD = Math.max(0, (apOwner.fCD || 0) - 30); } catch(_) {}
                            proj.penalized = true;
                            // small hit FX so the player sees the projectile impacted a different target
                            for (let i = 0; i < 8; i++) {
                                let a = Math.random() * Math.PI * 2;
                                particles.push(new Particle(proj.x + Math.cos(a) * 8, proj.y + Math.sin(a) * 8, '#FFD700', 3, 0.4));
                            }
                        }
                    } catch (err) { console.warn('Apollo proj.onHit error', err); }
                };

                proj.onExplode = function() {
                    // if a realm was already created by onHit, just spawn explosion FX and return
                    if (proj.hitTarget) {
                        for (let i = 0; i < 12; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(160);
                            particles.push(new Particle(this.x, this.y, '#FFD700', 4, 0.6, vel.x, vel.y));
                        }
                        return;
                    }

                    // projectile expired by range or otherwise — do NOT create the realm on range expiry
                    // only apply the -30s penalty if we haven't already penalized the owner (e.g. by hitting a wrong target)
                    if (!proj.penalized) {
                        try { if (apOwner && !apOwner.dead) apOwner.fCD = Math.max(0, (apOwner.fCD || 0) - 30); } catch(_) {}
                    }
                    for (let i = 0; i < 20; i++) {
                        let angle = Math.random() * Math.PI * 2;
                        let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                        particles.push(new Particle(this.x, this.y, '#FFD700', 4, 0.6, vel.x, vel.y));
                    }
                };

                entities.push(proj);
                // small muzzle
                for (let i = 0; i < 12; i++) particles.push(new Particle(this.x + Math.cos(this.angle) * 10, this.y + Math.sin(this.angle) * 10, '#FFD700', 4, 0.6));
                if (this.isPlayer) addKillMsg('☀️ Realm Shot!');
            }
            
            ai(dt, spd) {
                if (this.dead) return;
                if (Math.random() < 0.02) this.angle = Math.random() * Math.PI * 2;
                if (this.qCD <= 0 && Math.random() < 0.02) this.firePunchEnergy();
                if (this.eCD <= 0 && Math.random() < 0.015) this.judgementCut();
                if (this.fCD <= 0 && Math.random() < 0.01) this.sunballUltimate();
                if (this.basicCD <= 0 && Math.random() < 0.05) this.firePunch();
                let targetEnemy = null, minDist = Infinity;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < minDist) { minDist = d; targetEnemy = e; }
                    }
                }
                if (targetEnemy) {
                    let dx = targetEnemy.x - this.x, dy = targetEnemy.y - this.y, dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 0) {
                        this.angle = Math.atan2(dy, dx);
                        this.vx = Math.cos(this.angle) * spd;
                        this.vy = Math.sin(this.angle) * spd;
                    }
                } else { this.vx = 0; this.vy = 0; }
            }
            
            draw(ctx) {
                super.draw(ctx);
                if (this.inRealm) {
                    ctx.save();
                    ctx.globalAlpha = 0.2;
                    ctx.fillStyle = '#FFD700';
                    ctx.beginPath();
                    // use the active realm's radius if available so visuals match the actual arena size
                    const visRadius = (this.realm && this.realm.radius) ? this.realm.radius : 500;
                    ctx.arc(this.x - camera.x, this.y - camera.y, visRadius, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

        class Zeus extends Entity {
            constructor(x, y, p) {
                super(x, y, 22, p ? '#d9ecff' : '#6c8bb6', 5600);
                this.isPlayer = p;
                this.countsAsFFAHero = true;
                this.name = p ? 'Player (Zeus)' : 'Enemy Zeus';
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                this.baseSpd = 280;
                this.speed = this.baseSpd;
                this.passiveHitCount = 0;
                this.passiveHitGoal = 5;
                this.kingOfGodsForm = false;
                this.kingOfGodsTimer = 0;
                this.enhancedBasicTimer = 0;
                this.enhancedBasicCharge = 0;
                this.qBasicGrant = 0;
                this.qDashTimer = 0;
                this.qDashDirX = 0;
                this.qDashDirY = 0;
                this.qDashDistance = 0;
                this.qDashSpeed = 0;
                this.flyingTimer = 0;
                this.flyDirection = 0;
                this.flyingTick = 0;
                this.flyingHealTotal = 0;
                this.penetration = 0;
                this.damageReduction = 0;
                this.stunResistance = 0;
            }

            getPassiveRequirement() {
                return this.kingOfGodsForm ? 3 : 5;
            }

            consumeBasicHit() {
                this.passiveHitCount += 1;
                if (this.passiveHitCount >= this.getPassiveRequirement()) {
                    this.passiveHitCount = 0;
                    this.qCD = 0;
                    this.eCD = 0;
                }
            }

            triggerEnhancedBasicBurst(hitX = null, hitY = null) {
                const centerX = hitX ?? (this.x + Math.cos(this.angle) * 140);
                const centerY = hitY ?? (this.y + Math.sin(this.angle) * 140);
                let totalDamage = 0;
                for (let i = 0; i < 4; i++) {
                    const offset = (i - 1.5) * 0.85;
                    const strikeX = centerX + Math.cos(this.angle + offset) * 80;
                    const strikeY = centerY + Math.sin(this.angle + offset) * 80;
                    const startX = strikeX + Math.cos(this.angle + offset) * 18;
                    const startY = strikeY - 220;
                    const endX = strikeX + Math.cos(this.angle + offset) * 120;
                    const endY = strikeY + Math.sin(this.angle + offset) * 120;
                    for (let step = 0; step <= 8; step++) {
                        const t = step / 8;
                        const px = (1 - t) * startX + t * endX;
                        const py = (1 - t) * startY + t * endY;
                        particles.push(new Particle(px, py, '#dfeaff', 4, 0.38));
                        particles.push(new Particle(px, py, '#f4d35e', 3, 0.3));
                    }
                    particles.push(new Particle(endX, endY, '#dfeaff', 6, 0.6));
                    particles.push(new Particle(startX, startY, '#eaf3ff', 5, 0.55));
                }
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        const d = Math.sqrt((e.x - centerX) ** 2 + (e.y - centerY) ** 2);
                        if (d < 180) {
                            const beforeHp = e.hp;
                            e.takeDamage(400, this);
                            e.takeDamage(150, this, { isTrue: true });
                            const dealt = Math.max(0, beforeHp - e.hp);
                            totalDamage += dealt;
                            e.revealTimer = 1.0;
                            e.applyStatus('stun', 0.25, this);
                            for (let i = 0; i < 12; i++) {
                                const ang = Math.random() * Math.PI * 2;
                                particles.push(new Particle(e.x, e.y, '#d9ecff', 4, 0.5, Math.cos(ang) * 180, Math.sin(ang) * 180));
                            }
                        }
                    }
                }
                if (totalDamage > 0) {
                    const heal = totalDamage * 0.25;
                    this.hp = Math.min(this.maxHp, this.hp + heal);
                    for (let i = 0; i < 16; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        particles.push(new Particle(this.x, this.y, '#4ade80', 3, 0.6, Math.cos(ang) * 130, Math.sin(ang) * 130));
                    }
                }
                effectsAdd(new ShockwaveRing(centerX, centerY, '#dfeaff', 220, 0.6, 7));
                effectsAdd(new ShockwaveRing(centerX, centerY, '#f4d35e', 160, 0.45, 6));
            }

            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.3;
                const spawnX = this.x + Math.cos(this.angle) * (this.radius + 18);
                const spawnY = this.y + Math.sin(this.angle) * (this.radius + 18);
                const isEnhanced = this.enhancedBasicTimer > 0 || this.qBasicGrant > 0;
                if (isEnhanced) {
                    this.enhancedBasicTimer = 0;
                    this.qBasicGrant = 0;
                }
                const bolt = new Projectile(this, spawnX, spawnY, this.angle, 860, 0, isEnhanced ? 600 : 520, isEnhanced ? '#f4d35e' : '#d9ecff', isEnhanced ? 10 : 8, false, false, false);
                bolt.isStormBolt = true;
                bolt.pierce = !!isEnhanced;
                bolt.damageHandledByOnHit = true;
                bolt.safeTime = 0.04;
                bolt.onHit = (target) => {
                    if (!(target && !target.dead && target instanceof Entity && target.team !== this.team)) return;
                    const beforeHp = target.hp;
                    if (!isEnhanced) {
                        target.takeDamage(70, this);
                    }
                    const dealt = Math.max(0, beforeHp - target.hp);
                    if (dealt > 0) {
                        this.consumeBasicHit();
                    }
                    target.revealTimer = 0.6;
                    if (isEnhanced) {
                        this.triggerEnhancedBasicBurst(target.x, target.y);
                        target.applyStatus('stun', 0.25, this);
                    }
                    for (let i = 0; i < 7; i++) {
                        const a = Math.random() * Math.PI * 2;
                        particles.push(new Particle(target.x, target.y, isEnhanced ? '#f4d35e' : '#d9ecff', 4, 0.5, Math.cos(a) * 150, Math.sin(a) * 150));
                    }
                };
                entities.push(bolt);
                for (let i = 0; i < 8; i++) {
                    const offset = (i - 3.5) * 0.2;
                    const px = spawnX + Math.cos(this.angle + offset) * 60;
                    const py = spawnY + Math.sin(this.angle + offset) * 60;
                    particles.push(new Particle(px, py, '#dfeaff', 4, 0.45));
                    particles.push(new Particle(px, py, isEnhanced ? '#f4d35e' : '#dfeaff', 3, 0.35));
                }
            }

            divineSwift() {
                this.qCD = 7;
                const prevX = this.x;
                const prevY = this.y;
                const dashDist = 70;
                const dashX = Math.cos(this.angle) * dashDist;
                const dashY = Math.sin(this.angle) * dashDist;
                this.qDashDirX = dashX / Math.max(1, dashDist);
                this.qDashDirY = dashY / Math.max(1, dashDist);
                this.qDashDistance = dashDist;
                this.qDashSpeed = dashDist / 0.18;
                this.qDashTimer = 0.18;
                const shieldCap = Math.min(this.maxHp * 0.35, 180);
                if ((this.shield || 0) <= 0) {
                    this.shield = shieldCap;
                } else {
                    this.shield = Math.min(this.shield, shieldCap);
                }
                this.enhancedBasicCharge = 0;
                this.enhancedBasicTimer = 0;
                this.qBasicGrant = 1;

                for (let i = 0; i < 10; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const px = prevX + Math.cos(ang) * 26;
                    const py = prevY + Math.sin(ang) * 26;
                    particles.push(new Particle(px, py, '#d9ecff', 5, 0.5, Math.cos(ang) * 160, Math.sin(ang) * 160));
                }
                const ringCenterX = this.x + Math.cos(this.angle) * 80;
                const ringCenterY = this.y + Math.sin(this.angle) * 80;
                effectsAdd(new ShockwaveRing(ringCenterX, ringCenterY, '#dfeaff', 180, 0.4, 5));
                effectsAdd(new ShockwaveRing(ringCenterX, ringCenterY, '#f4d35e', 140, 0.32, 4));
                if (this.isPlayer) addKillMsg('⚡ Divine Swift!');
            }

            sphereOfStormness() {
                this.eCD = 6;
                const proj = new Projectile(this, this.x, this.y, this.angle, 760, 0, 1200, '#a7d8ff', 28, false, false, false);
                proj.isStormBall = true;
                proj.isLightningSphere = true;
                proj.pierce = true;
                proj.stormStopDistance = 340;
                proj.explodeDelay = 0.28;
                proj.explodeTimer = 0;
                proj.stoppedAtRange = false;
                proj.onHit = (target) => {
                    if (target && !target.dead && target instanceof Entity && target.team !== this.team) {
                        const dx = proj.x - target.x;
                        const dy = proj.y - target.y;
                        const d = Math.hypot(dx, dy) || 1;
                        const pull = Math.min(90, d * 0.45);
                        target.x += (dx / d) * pull;
                        target.y += (dy / d) * pull;
                        for (let i = 0; i < 8; i++) {
                            const ang = Math.random() * Math.PI * 2;
                            particles.push(new Particle(target.x, target.y, '#d9ecff', 5, 0.5, Math.cos(ang) * 160, Math.sin(ang) * 160));
                        }
                    }
                };
                proj.onExplode = () => {
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            const d = Math.sqrt((e.x - proj.x) ** 2 + (e.y - proj.y) ** 2);
                            if (d < 180) {
                                e.takeDamage(250, this, true);
                                e.stunTimer = Math.max(e.stunTimer || 0, 0.8);
                                e.applyStatus('stun', 0.8, this);
                                const dx = e.x - proj.x;
                                const dy = e.y - proj.y;
                                const dist = Math.hypot(dx, dy) || 1;
                                const pull = Math.min(120, 120 - dist * 0.35);
                                e.x += (dx / dist) * pull;
                                e.y += (dy / dist) * pull;
                            }
                        }
                    }
                    effectsAdd(new ShockwaveRing(proj.x, proj.y, '#dfeaff', 180, 0.72, 18));
                    for (let i = 0; i < 16; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        particles.push(new Particle(proj.x, proj.y, '#d9ecff', 6, 0.8, Math.cos(ang) * 220, Math.sin(ang) * 220));
                    }
                    for (let i = 0; i < 14; i++) {
                        const ang = Math.random() * Math.PI * 2;
                        particles.push(new Particle(proj.x, proj.y, '#f4d35e', 4, 0.5, Math.cos(ang) * 160, Math.sin(ang) * 160));
                    }
                };
                this.enhancedBasicCharge = 1;
                this.enhancedBasicTimer = 5;
                entities.push(proj);
                for (let i = 0; i < 12; i++) {
                    const ang = (Math.PI * 2 * i) / 12;
                    const orbit = 30 + (i % 3) * 12;
                    particles.push(new Particle(this.x + Math.cos(ang) * orbit, this.y + Math.sin(ang) * orbit, '#d9ecff', 5, 0.7, Math.cos(ang) * 180, Math.sin(ang) * 180));
                    particles.push(new Particle(this.x + Math.cos(ang + Math.PI / 2) * orbit, this.y + Math.sin(ang + Math.PI / 2) * orbit, '#f4d35e', 4, 0.5, Math.cos(ang) * 150, Math.sin(ang) * 150));
                }
                effectsAdd(new AuraRing(this.x, this.y, 46, 0.5, '#d9ecff', 12));
                effectsAdd(new ShockwaveRing(this.x, this.y, '#d9ecff', 72, 0.35, 6));
                if (this.isPlayer) addKillMsg('⚡ Sphere of Stormness!');
            }

            stompGround() {
                const radius = 200;
                let totalDamage = 0;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < radius) {
                            const beforeHp = e.hp;
                            e.takeDamage(300, this, true);
                            totalDamage += Math.max(0, beforeHp - e.hp);
                            e.applyStatus('stun', 1.0, this);
                        }
                    }
                }
                if (totalDamage > 0) {
                    this.hp = Math.min(this.maxHp, this.hp + totalDamage);
                }
                this.flyingTimer = 0;
                this.flyingTick = 0;
                this.flyingHealTotal = 0;
                effectsAdd(new ShockwaveRing(this.x, this.y, 28, '#dfeaff', 0.9, 18, 9));
                if (this.isPlayer) addKillMsg('🌩️ Wraith of Olympus!');
            }

            wraithOfOlympus() {
                this.fCD = 48;
                this.flyingTimer = 1.0;
                this.flyDirection = this.angle;
                this.invulnerableTimer = Math.max(this.invulnerableTimer || 0, 1.0);
                this.flyingTick = 0;
                this.flyingHealTotal = 0;
                this.kingOfGodsForm = true;
                this.kingOfGodsTimer = 12;
                this.penetration = 0.2;
                this.damageReduction = 0.2;
                this.stunResistance = 0.2;
                this.enhancedBasicCharge = 0;
                this.enhancedBasicTimer = 0;
                this.passiveHitCount = 0;
                this.passiveHitGoal = 3;

                const baseRadius = 150;
                for (let i = 0; i < 18; i++) {
                    const ang = (Math.PI * 2 * i) / 18;
                    const px = this.x + Math.cos(ang) * baseRadius;
                    const py = this.y + Math.sin(ang) * baseRadius;
                    particles.push(new Particle(px, py, '#dfeaff', 6, 0.75, Math.cos(ang) * 140, Math.sin(ang) * 140));
                    particles.push(new Particle(px, py, '#f4d35e', 4, 0.5, Math.cos(ang + 0.8) * 100, Math.sin(ang + 0.8) * 100));
                }
                for (let i = 0; i < 5; i++) {
                    effectsAdd(new ShockwaveRing(this.x, this.y, '#dfeaff', 200 + i * 80, 0.7 + i * 0.08, 8));
                    effectsAdd(new ShockwaveRing(this.x, this.y, '#f4d35e', 150 + i * 60, 0.55 + i * 0.07, 6));
                }
                for (let i = 0; i < 10; i++) {
                    const ang = (Math.PI * 2 * i) / 10;
                    const px = this.x + Math.cos(ang) * (baseRadius + 30);
                    const py = this.y + Math.sin(ang) * (baseRadius + 30);
                    particles.push(new Particle(px, py, '#eaf3ff', 7, 0.8, Math.cos(ang) * 170, Math.sin(ang) * 170));
                }
                if (this.isPlayer) addKillMsg('⚡ Wraith of Olympus!');
            }

            getEffectiveSpeed() {
                let s = this.speed;
                if (this.kingOfGodsForm) s *= 1.1;
                return s;
            }

            takeDamage(amount, source, meta) {
                if (this.dead) return;
                if (this.kingOfGodsForm) {
                    this.damageReduction = 0.2;
                    this.stunResistance = 0.2;
                } else {
                    this.damageReduction = 0;
                    this.stunResistance = 0;
                }
                const isTrue = meta === true || !!(meta && meta.isTrue);
                const reducedAmount = isTrue ? amount : amount * (1 - this.damageReduction);
                Entity.prototype.takeDamage.call(this, reducedAmount, source, meta);
            }

            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    const m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.divineSwift();
                if (keys.e && this.eCD <= 0) this.sphereOfStormness();
                if (keys.f && this.fCD <= 0) this.wraithOfOlympus();
                if (keys.r && this.rCD <= 0) this.useGear();
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.qDashTimer > 0) {
                    this.qDashTimer = Math.max(0, this.qDashTimer - dt);
                    const moveThisFrame = Math.min(this.qDashSpeed * dt, this.qDashDistance);
                    this.x += this.qDashDirX * moveThisFrame;
                    this.y += this.qDashDirY * moveThisFrame;
                    this.qDashDistance = Math.max(0, this.qDashDistance - moveThisFrame);
                    if (this.qDashTimer <= 0) {
                        this.qDashDistance = 0;
                        this.qDashDirX = 0;
                        this.qDashDirY = 0;
                    }
                }
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.enhancedBasicTimer > 0) this.enhancedBasicTimer -= dt;
                if (this.kingOfGodsForm) {
                    this.kingOfGodsTimer -= dt;
                    this.penetration = 0.2;
                    this.damageReduction = 0.2;
                    this.stunResistance = 0.2;
                    if (this.kingOfGodsTimer <= 0) {
                        this.kingOfGodsForm = false;
                        this.kingOfGodsTimer = 0;
                        this.penetration = 0;
                        this.damageReduction = 0;
                        this.stunResistance = 0;
                    }
                } else {
                    this.penetration = 0;
                    this.damageReduction = 0;
                    this.stunResistance = 0;
                }
                if (this.flyingTimer > 0) {
                    this.flyingTimer -= dt;
                    this.x += Math.cos(this.flyDirection) * 210 * dt;
                    this.y += Math.sin(this.flyDirection) * 210 * dt;
                    this.flyingTick -= dt;
                    if (this.flyingTick <= 0) {
                        this.flyingTick = 0.2;
                        let total = 0;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                                if (d < 200) {
                                    const beforeHp = e.hp;
                                    e.takeDamage(60, this);
                                    const dealt = Math.max(0, beforeHp - e.hp);
                                    total += dealt;
                                    e.revealTimer = 0.5;
                                }
                            }
                        }
                        if (total > 0) {
                            this.flyingHealTotal += total;
                            this.hp = Math.min(this.maxHp, this.hp + total);
                        }
                    }
                    if (this.flyingTimer <= 0) {
                        this.stompGround();
                    }
                }
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                const spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }

            ai(dt, spd) {
                if (this.dead) return;
                let target = this.findTarget();
                if (!target) {
                    if (Math.random() < 0.04) this.angle += (Math.random() - 0.5) * 0.8;
                    this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                    this.y += Math.sin(this.angle) * spd * 0.5 * dt;
                    return;
                }
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.angle = Math.atan2(dy, dx);
                if (dist > 120) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                if (this.basicCD <= 0 && dist < 150) this.basicAtk();
                if (this.qCD <= 0 && dist < 180) this.divineSwift();
                if (this.eCD <= 0 && dist < 300) this.sphereOfStormness();
                if (this.fCD <= 0 && dist < 260) this.wraithOfOlympus();
            }

            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        const d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                        if (d < md) { md = d; c = e; }
                    }
                }
                return c;
            }

            draw(ctx) {
                super.draw(ctx);
                if (this.kingOfGodsForm) {
                    ctx.save();
                    ctx.strokeStyle = '#f4d35e';
                    ctx.lineWidth = 3;
                    ctx.globalAlpha = 0.8;
                    const baseRadius = this.radius + 16;
                    for (let i = 0; i < 18; i++) {
                        const ang = (Math.PI * 2 * i) / 18 + Date.now() * 0.0012;
                        const px = this.x - camera.x + Math.cos(ang) * (baseRadius + Math.sin(Date.now() * 0.01 + i) * 7);
                        const py = this.y - camera.y + Math.sin(ang) * (baseRadius + Math.sin(Date.now() * 0.01 + i) * 7);
                        const innerX = this.x - camera.x + Math.cos(ang) * (baseRadius - 8);
                        const innerY = this.y - camera.y + Math.sin(ang) * (baseRadius - 8);
                        const outerX = this.x - camera.x + Math.cos(ang + 0.2) * (baseRadius + 20);
                        const outerY = this.y - camera.y + Math.sin(ang + 0.2) * (baseRadius + 20);
                        ctx.beginPath();
                        ctx.moveTo(innerX, innerY);
                        ctx.lineTo(px, py);
                        ctx.lineTo(outerX, outerY);
                        ctx.stroke();
                    }
                    for (let i = 0; i < 12; i++) {
                        const ang = (Math.PI * 2 * i) / 12 + Date.now() * 0.002;
                        const inner = baseRadius + 8;
                        const outer = baseRadius + 26;
                        ctx.beginPath();
                        ctx.moveTo(this.x - camera.x + Math.cos(ang) * inner, this.y - camera.y + Math.sin(ang) * inner);
                        ctx.lineTo(this.x - camera.x + Math.cos(ang) * outer, this.y - camera.y + Math.sin(ang) * outer);
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            }
        }

        class BountyHunter extends Entity {
            constructor(x, y, p) {
                super(x, y, 26, '#8B0000', 6400);
                this.isPlayer = p || false;
                this.name = p ? 'Player (BountyHunter)' : 'Enemy BountyHunter';
                this.countsAsFFAHero = true;
                
                // Mode system
                this.mode = 'meet_your_end'; // 'meet_your_end' or 'closed_escape'
                this.modeSwitchCD = 0;
                this.modeSwitchDuration = 2; // reduce cooldown by 2s on switch
                
                // Bounty system
                this.bountyTarget = null;
                this.killStacks = 0;
                this.maxKillStacks = 3;
                
                // Melee mode stats
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 280;
                
                // Ranged mode stats
                this.rifleBasicCD = 0;
                this.preytargetCD = 0;
                this.linkedPrey = null;
                this.preyLinkDuration = 5;
                this.preyLinkTimer = 0;
                this.pullTarget = null; // smooth pull target for sickle
                this.dashTarget = null; // smooth dash target for dashReveal
                
                // Terror effect flag
                this.terrifedTimer = 0;
                
                this.speed = this.baseSpd;
                this.angle = 0;
                
                // Input debounce variables
                this._rWas = false;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                // Update cooldowns
                if (this.mode === 'meet_your_end') {
                    if (this.basicCD > 0) this.basicCD -= dt;
                    if (this.qCD > 0) this.qCD -= dt;
                    if (this.eCD > 0) this.eCD -= dt;
                    if (this.fCD > 0) this.fCD -= dt;
                } else {
                    if (this.rifleBasicCD > 0) this.rifleBasicCD -= dt;
                    if (this.qCD > 0) this.qCD -= dt;
                    if (this.eCD > 0) this.eCD -= dt;
                    if (this.fCD > 0) this.fCD -= dt;
                }
                
                if (this.rCD > 0) this.rCD -= dt;
                if (this.modeSwitchCD > 0) this.modeSwitchCD -= dt;
                
                // Update terrified timer
                if (this.terrifedTimer > 0) this.terrifedTimer -= dt;
                
                // Update prey link timer
                if (this.linkedPrey && (this.linkedPrey.dead || this.preyLinkTimer <= 0)) {
                    this.linkedPrey = null;
                    this.preyLinkTimer = 0;
                } else if (this.linkedPrey && this.preyLinkTimer > 0) {
                    this.preyLinkTimer -= dt;
                }

                // Handle smooth pull toward sickle (if active)
                if (this.pullTarget) {
                    const pt = this.pullTarget;
                    pt.progress = Math.min(1, (pt.progress || 0) + dt / pt.duration);
                    let t = pt.progress;
                    // ease out
                    let ease = t * (2 - t);
                    this.x = pt.startX + (pt.x - pt.startX) * ease;
                    this.y = pt.startY + (pt.y - pt.startY) * ease;
                    if (pt.progress >= 1) {
                        this.pullTarget = null;
                        this.performSickleSwing();
                    }
                }

                // Handle smooth dash movement (dashReveal) if active
                if (this.dashTarget) {
                    const dtar = this.dashTarget;
                    dtar.progress = Math.min(1, (dtar.progress || 0) + dt / dtar.duration);
                    let t2 = dtar.progress;
                    let ease2 = t2 * (2 - t2);
                    this.x = dtar.startX + (dtar.x - dtar.startX) * ease2;
                    this.y = dtar.startY + (dtar.y - dtar.startY) * ease2;

                    // check collision with enemies while dashing
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team && e instanceof Entity) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < 80) {
                                if (typeof e.takeDamage === 'function') e.takeDamage(dtar.hitDmg || 1450, this);
                                e.revealTimer = 3;
                                this.linkedPrey = e;
                                this.preyLinkTimer = 5;
                                this.dashTarget = null;
                                // dash impact visuals
                                for (let i = 0; i < 18; i++) particles.push(new Particle(this.x, this.y, '#FFD700', 5, 0.8));
                                if (this.isPlayer) addKillMsg('💥 Dash Impact!');
                                break;
                            }
                        }
                    }

                    if (dtar.progress >= 1) {
                        // finish dash
                        this.dashTarget = null;
                        // landing particles
                        for (let i = 0; i < 12; i++) particles.push(new Particle(this.x, this.y, '#FFD700', 4, 0.6));
                    }
                }
                
                // Update bounty target
                this.updateBountyTarget();
                
                // Apply kill stack buffs
                this.applyKillStackBuffs();
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else {
                    this.ai(dt, spd);
                }
            }
            
            updateBountyTarget() {
                // Find valid targets (AI heroes or real players, not dead)
                let validTargets = entities.filter(e => 
                    e !== this && !e.dead && 
                    ((e instanceof Entity && e.countsAsFFAHero === true) || 
                     (typeof OnlinePlayerProxy !== 'undefined' && e instanceof OnlinePlayerProxy)) &&
                    e.team !== this.team
                );
                
                // If no current target or current target is dead, pick a new one
                if (!this.bountyTarget || this.bountyTarget.dead || !validTargets.includes(this.bountyTarget)) {
                    if (validTargets.length > 0) {
                        this.bountyTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
                    } else {
                        this.bountyTarget = null;
                    }
                }
            }
            
            applyKillStackBuffs() {
                this.trueDmgBuff = this.killStacks * 0.10;
                if (this.killStacks >= 2) {
                    this.speed = this.baseSpd * 1.25;
                } else {
                    this.speed = this.baseSpd;
                }
            }

            getDamageMult() {
                return 1 + (this.killStacks * 0.10);
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
                
                // Mode switch (G key)
                if (keys.g && this.modeSwitchCD <= 0) {
                    this.switchMode();
                    this.modeSwitchCD = 5;
                }
                
                // Check if terrified (disables abilities)
                if (this.terrifedTimer > 0) {
                    return; // Can't use abilities while terrified
                }
                
                // Mode-specific abilities
                if (this.mode === 'meet_your_end') {
                    if (mouse.down && this.basicCD <= 0) this.meleeBasicAtk();
                    if (keys.q && this.qCD <= 0) this.doubleSlash();
                    if (keys.e && this.eCD <= 0) this.throwSickle();
                    if (keys.f && this.fCD <= 0) this.dominationSector();
                } else {
                    if (mouse.down && this.rifleBasicCD <= 0) this.rifleShot();
                    if (keys.q && this.qCD <= 0) this.insaneRifleShot();
                    if (keys.e && this.eCD <= 0) this.preyTracking();
                    if (keys.f && this.fCD <= 0) this.dashReveal();
                }
                // Gear (R) support
                if (keys.r && this.rCD <= 0 && !this._rWas) { this._rWas = true; if (typeof this.useGear === 'function') this.useGear(); }
                if (!keys.r) this._rWas = false;
            }
            
            switchMode() {
                if (this.mode === 'meet_your_end') {
                    this.mode = 'closed_escape';
                } else {
                    this.mode = 'meet_your_end';
                }
                
                // Reduce all other ability cooldowns by 2s
                this.qCD = Math.max(0, this.qCD - this.modeSwitchDuration);
                this.eCD = Math.max(0, this.eCD - this.modeSwitchDuration);
                this.fCD = Math.max(0, this.fCD - this.modeSwitchDuration);
                
                if (this.isPlayer) {
                    addKillMsg(`🔄 Mode: ${this.mode === 'meet_your_end' ? 'Meet Your End' : 'Closed Escape'}`);
                    // Update hero card role text in the selection UI
                    try {
                        let card = document.getElementById('card-bounty');
                        if (card) {
                            let roleP = card.querySelector('p');
                            if (roleP) roleP.textContent = (this.mode === 'meet_your_end') ? 'Tank/Assassin (Melee)' : 'Marksman/Assassin (Ranged)';
                        }
                    } catch (err) { /* ignore DOM issues in non-browser contexts */ }
                }
            }
            
            // MELEE MODE ABILITIES
            meleeBasicAtk() {
                this.basicCD = 1.5;
                let dmg = this.linkedPrey ? 320 : 250;
                
                // Anti-clockwise circular slash sweep
                let hitEnemies = new Set();
                for (let angle = Math.PI * 2; angle > 0; angle -= Math.PI / 12) {
                    let checkAngle = this.angle + angle;
                    let radius = this.linkedPrey ? 120 : 100;
                    let dx = Math.cos(checkAngle) * radius;
                    let dy = Math.sin(checkAngle) * radius;
                    
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team && !hitEnemies.has(e)) {
                            let d = Math.sqrt((e.x - (this.x + dx))**2 + (e.y - (this.y + dy))**2);
                                if (d < (this.linkedPrey ? 90 : 80)) {
                                    if (typeof e.takeDamage === 'function') e.takeDamage(dmg, this);
                                hitEnemies.add(e);
                                
                                // Enhanced effect for linked prey
                                if (e === this.linkedPrey) {
                                    e.slowTimer = Math.max(e.slowTimer, 1);
                                }
                            }
                        }
                    }
                }

                    // Also apply inner-circle damage to anyone close to the hunter
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team && !hitEnemies.has(e) && e instanceof Entity) {
                            let dcenter = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (dcenter < 110) {
                                if (typeof e.takeDamage === 'function') e.takeDamage(dmg * 0.9, this);
                                hitEnemies.add(e);
                            }
                        }
                    }
                
                // Single premium anti-clockwise spinning ring (less visual noise)
                particles.push(new SpinningRing(this.x, this.y, 70, '#FF4444', 0.9, 10, 8));
                
                // Shockwave blast effect
                for (let i = 0; i < 12; i++) {
                    let a = this.angle - (i / 12) * Math.PI * 2;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(300);
                    particles.push(new Particle(this.x, this.y, '#FF6666', 4, 0.5, vel.x, vel.y));
                }
                
                // Inner rotating particles
                for (let i = 0; i < 18; i++) {
                    let a = this.angle + (1 - i / 18) * Math.PI * 2;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(250);
                    particles.push(new Particle(this.x + Math.cos(a) * 55, this.y + Math.sin(a) * 55, '#FF3333', 6, 0.6, vel.x * 0.5, vel.y * 0.5));
                }
            }
            
            doubleSlash() {
                this.qCD = 5;
                let dmg = 500;
                let stagger = 0.25;
                
                // First clockwise slash
                this.performClockwiseSlash(dmg, 0.3, 400, 0);
                
                // Second clockwise slash after delay
                setTimeout(() => {
                    if (!this.dead) this.performClockwiseSlash(dmg, 0.3, 400, 1);
                }, stagger * 1000);
                
                if (this.isPlayer) addKillMsg('⚡ DOUBLE SLASH!');
            }
            
            performClockwiseSlash(dmg, stunDuration, radius, slashNum) {
                let hitCount = 0;
                let hitEnemies = new Set();
                
                // Single spinning ring visual (less noisy) for clockwise slash (slightly smaller)
                particles.push(new SpinningRing(this.x, this.y, radius + 20, '#FF1111', 0.9, 6 + slashNum * 1.5, 10));
                
                // Clockwise sweep damage
                for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
                    let checkAngle = this.angle + angle + (slashNum * Math.PI / 4);
                    let dx = Math.cos(checkAngle) * (radius + 50);
                    let dy = Math.sin(checkAngle) * (radius + 50);
                    
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team && !hitEnemies.has(e)) {
                            let d = Math.sqrt((e.x - (this.x + dx))**2 + (e.y - (this.y + dy))**2);
                            if (d < 80) {
                                // Guard against non-Entity targets lacking takeDamage
                                if (typeof e.takeDamage === 'function') {
                                    e.takeDamage(dmg, this);
                                    if (typeof e.stunTimer !== 'undefined') e.stunTimer = Math.max(e.stunTimer, stunDuration);
                                } else if (typeof e.hp === 'number') {
                                    e.hp -= dmg; if (e.hp<=0 && typeof e.die === 'function') e.die(this);
                                }
                                hitEnemies.add(e);
                                hitCount++;
                            }
                        }
                    }

                // Also ensure close-range enemies near the hunter are hit (fixes Q missing hits at center)
                const centerHitRadius = Math.min(radius * 0.45, 180);
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team && !hitEnemies.has(e) && e instanceof Entity) {
                        let dcenter = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (dcenter < centerHitRadius) {
                            if (typeof e.takeDamage === 'function') {
                                e.takeDamage(dmg, this);
                                if (stunDuration > 0) e.applyStatus('stun', stunDuration, this);
                            } else if (typeof e.hp === 'number') {
                                e.hp -= dmg; if (e.hp<=0 && typeof e.die === 'function') e.die(this);
                            }
                            hitEnemies.add(e);
                            hitCount++;
                        }
                    }
                }
                }
                
                // Heal 200 per enemy hit
                if (hitCount > 0) {
                    const healPer = 200;
                    const totalHeal = healPer * hitCount;
                    this.hp = Math.min(this.maxHp, this.hp + totalHeal);
                    // Green heal particles flowing upward (scaled modestly by hits)
                    const particleCount = Math.min(18 + hitCount * 4, 60);
                    for (let i = 0; i < particleCount; i++) {
                        let a = (Math.PI * 2 / particleCount) * i;
                        let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(280);
                        particles.push(new Particle(this.x + Math.cos(a) * 50, this.y + Math.sin(a) * 50, '#00FF00', 6, 0.9, vel.x, vel.y));
                    }
                }
                
                // Clockwise visual effect with premium appearance
                for (let i = 0; i < 24; i++) {
                    let a = this.angle + (i / 24) * Math.PI * 2 + (slashNum * Math.PI / 4);
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(420);
                    particles.push(new Particle(this.x + Math.cos(a) * 80, this.y + Math.sin(a) * 80, '#FF1111', 8, 0.8, vel.x * 0.5, vel.y * 0.5));
                }
                
                // Explosive impact effect
                for (let i = 0; i < 16; i++) {
                    let a = Math.random() * Math.PI * 2;
                    let speed = 180 + Math.random() * 220;
                    particles.push(new Particle(this.x, this.y, '#FF4444', 6, 0.7, Math.cos(a) * speed, Math.sin(a) * speed));
                }
            }
            
            throwSickle() {
                this.eCD = 7;
                
                // Create sickle projectile with improved speed, appearance and smooth pull
                let projSpeed = 1200;
                let projRange = 1200;
                let proj = new Projectile(this, this.x, this.y, this.angle, projSpeed, 430, projRange, '#C41E3A', 20);
                proj.isSickle = true;
                proj.maxDistance = projRange;
                proj.trail = true;
                proj.pierce = false;
                
                // Callback when projectile reaches max distance or explodes: set smooth pull target
                const bountyRef = this;
                proj.onExplode = () => {
                    let dx = proj.x - bountyRef.x;
                    let dy = proj.y - bountyRef.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 6) {
                        bountyRef.pullTarget = { x: proj.x, y: proj.y, startX: bountyRef.x, startY: bountyRef.y, progress: 0, duration: Math.min(0.6, Math.max(0.18, dist / 900)) };
                    } else {
                        // fallback: immediate swing if already very close
                        bountyRef.performSickleSwing();
                    }
                };

                // If projectile hits an enemy, pull to that enemy instead of exploding in place
                proj.onHit = (target) => {
                    try {
                        if (target && !target.dead) {
                            let dx = target.x - bountyRef.x;
                            let dy = target.y - bountyRef.y;
                            let dist = Math.sqrt(dx*dx + dy*dy);
                            bountyRef.pullTarget = { x: target.x, y: target.y, startX: bountyRef.x, startY: bountyRef.y, progress: 0, duration: Math.min(0.6, Math.max(0.14, dist / 900)) };
                            // remove projectile visually
                            proj.del = true;
                        }
                    } catch (err) { console.warn('sickle onHit error', err); }
                };

                entities.push(proj);

                // Sickle-shaped throw visual (single spinning ring + small slash)
                particles.push(new SpinningRing(this.x + Math.cos(this.angle) * 30, this.y + Math.sin(this.angle) * 30, 40, '#C41E3A', 0.6, 10, 6));
                particles.push(new RectSlash(this.x + Math.cos(this.angle) * 18, this.y + Math.sin(this.angle) * 18, this.angle, 100, 14, '#C41E3A'));

                // Muzzle burst (smaller, less intrusive)
                for (let i = 0; i < 6; i++) {
                    let a = this.angle + (Math.random() - 0.5) * Math.PI / 6;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(240 + Math.random() * 120);
                    particles.push(new Particle(this.x + Math.cos(this.angle) * 18, this.y + Math.sin(this.angle) * 18, '#C41E3A', 3, 0.45, vel.x, vel.y));
                }

                if (this.isPlayer) addKillMsg('🔗 Sickle Throw!');
            }
            
            performSickleSwing() {
                let dmg = 770;
                // Terrified effect duration
                let terrorDuration = 2;

                // Circular swing centered on current position
                particles.push(new SpinningRing(this.x, this.y, 150, '#FF1744', 0.9, 10, 10));
                
                let hitCount = 0;
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team && e instanceof Entity) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 150) {
                            if (typeof e.takeDamage === 'function') {
                                e.takeDamage(dmg, this);
                            } else if (typeof e.hp === 'number') {
                                e.hp -= dmg; if (e.hp<=0 && typeof e.die === 'function') e.die(this);
                            }
                            hitCount++;

                            // Apply terrified effect
                            if (!e.terrifedTimer) e.terrifedTimer = 0;
                            e.terrifedTimer = Math.max(e.terrifedTimer, terrorDuration);
                        }
                    }
                }

                // Impact particles
                for (let i = 0; i < 20 + hitCount * 4; i++) {
                    let a = Math.random() * Math.PI * 2;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(160 + Math.random() * 220);
                    particles.push(new Particle(this.x + Math.cos(a) * 60, this.y + Math.sin(a) * 60, '#FF1744', 6, 0.8, vel.x, vel.y));
                }
            }
            
            dominationSector() {
                this.fCD = 12;
                let dmg = 460;
                let defReduction = 0.20;
                let slowDuration = 3;
                let visionDuration = 5;
                
                // Large sector attack
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team) {
                        let dx = e.x - this.x;
                        let dy = e.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        
                        // 120 degree sector
                        if (dist < 400) {
                            let angle = Math.atan2(dy, dx);
                            let angleDiff = Math.abs(angle - this.angle);
                            if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                            
                            if (angleDiff < Math.PI / 3) {
                                e.takeDamage(dmg, this, true);
                                e.defDebuff = Math.max(e.defDebuff, defReduction);
                                e.slowTimer = Math.max(e.slowTimer, slowDuration);
                            }
                        }
                    }
                }
                
                // Grant vision
                this.revealTimer = visionDuration;
                
                // Enhanced visual effect - more dramatic sector lines and particles
                for (let i = 0; i < 40; i++) {
                    let a = this.angle + (Math.random() - 0.5) * Math.PI / 1.3;
                    let dist = Math.random() * 400;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(250);
                    particles.push(new Particle(this.x + Math.cos(a) * dist * 0.7, this.y + Math.sin(a) * dist * 0.7, '#FFD700', 6, 0.9, vel.x, vel.y));
                }
                if (this.isPlayer) addKillMsg('⚖️ Domination Sector!');
            }
            
            // RANGED MODE ABILITIES
            rifleShot() {
                this.rifleBasicCD = 0.9;
                let dmg = 180;
                
                // Check if prey is linked for enhanced attack
                if (this.linkedPrey && !this.linkedPrey.dead) {
                    dmg = 320;
                }
                
                let proj = new Projectile(this, this.x, this.y, this.angle, 1400, dmg, 1000, this.linkedPrey && !this.linkedPrey.dead ? '#FFFF00' : '#FFD700', dmg === 320 ? 18 : 15);
                proj.isRifle = true;
                proj.onHit = (target) => {
                    if (dmg === 320) {
                        target.slowTimer = Math.max(target.slowTimer, 0.5);
                    }
                };
                entities.push(proj);
                
                // Enhanced muzzle flash - much more intense
                let particleCount = dmg === 320 ? 20 : 14;
                for (let i = 0; i < particleCount; i++) {
                    let a = this.angle + (Math.random() - 0.5) * Math.PI / 3.5;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(500);
                    particles.push(new Particle(this.x + Math.cos(this.angle) * 22, this.y + Math.sin(this.angle) * 22, dmg === 320 ? '#FFFF00' : '#FFD700', dmg === 320 ? 5 : 4, 0.5, vel.x, vel.y));
                }
                
                // Tracer line effect
                for (let i = 0; i < 4; i++) {
                    particles.push(new Particle(this.x + Math.cos(this.angle) * (i * 10), this.y + Math.sin(this.angle) * (i * 10), dmg === 320 ? '#FFFF00' : '#FFD700', 3, 0.3));
                }
            }
            
            insaneRifleShot() {
                this.qCD = 5;
                let dmg = 1200;
                
                let proj = new Projectile(this, this.x, this.y, this.angle, 1600, dmg, 1200, '#FF0000', 22);
                proj.isInsaneShot = true;
                proj.onHit = (target) => {
                    // Massive screen shake
                    window.cameraShake = { intensity: 28, duration: 0.7 };
                    target.slowTimer = Math.max(target.slowTimer, 3);
                    
                    // Massive explosion effect
                    for (let i = 0; i < 30; i++) {
                        let a = Math.random() * Math.PI * 2;
                        let speed = 230 + Math.random() * 320;
                        particles.push(new Particle(target.x, target.y, '#FF4444', 9, 1.3, Math.cos(a) * speed, Math.sin(a) * speed));
                    }
                };
                entities.push(proj);
                
                // Devastating muzzle flash
                for (let i = 0; i < 22; i++) {
                    let a = this.angle + (Math.random() - 0.5) * Math.PI / 2.5;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(600);
                    particles.push(new Particle(this.x + Math.cos(this.angle) * 28, this.y + Math.sin(this.angle) * 28, '#FF6666', 6, 0.7, vel.x, vel.y));
                }
                
                // Bright bolt tracer
                for (let i = 0; i < 6; i++) {
                    particles.push(new Particle(this.x + Math.cos(this.angle) * (i * 8), this.y + Math.sin(this.angle) * (i * 8), '#FFFF00', 4, 0.4));
                }
                
                if (this.isPlayer) addKillMsg('💥 INSANE SHOT!');
            }
            
            preyTracking() {
                // Find lowest health enemy that's hero AI or online player only
                let lowestHp = null;
                let minHealth = Infinity;
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team) {
                        // Must be hero AI (countsAsFFAHero) or online player
                        let isValidTarget = (e.countsAsFFAHero === true) || (typeof OnlinePlayerProxy !== 'undefined' && e instanceof OnlinePlayerProxy);
                        
                        if (isValidTarget) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 1500 && e.hp < minHealth) {
                                minHealth = e.hp;
                                lowestHp = e;
                            }
                        }
                    }
                }
                
                if (lowestHp) {
                    this.linkedPrey = lowestHp;
                    this.preyLinkTimer = 5;
                    this.eCD = 8;
                    if (this.isPlayer) addKillMsg('🎯 Prey Locked!');
                } else {
                    // No prey found
                    this.eCD = 4;
                    if (this.isPlayer) addKillMsg('❌ No Prey Found');
                }
            }
            
            dashReveal() {
                this.fCD = 14;
                
                // Find lowest health enemy to prioritize linking on hit
                let lowestHp = null;
                let minHealth = Infinity;
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team) {
                        if (e.hp < minHealth) { minHealth = e.hp; lowestHp = e; }
                    }
                }

                // Prepare a smooth dash target instead of instant teleport
                let dashDist = 300;
                let targetX = this.x + Math.cos(this.angle) * dashDist;
                let targetY = this.y + Math.sin(this.angle) * dashDist;
                this.dashTarget = { x: targetX, y: targetY, startX: this.x, startY: this.y, progress: 0, duration: 0.22, hitDmg: 1450 };

                // Store potential prey to link upon hit (will be set on collision)
                if (lowestHp) {
                    this._dashIntendedPrey = lowestHp;
                } else {
                    this._dashIntendedPrey = null;
                }

                // initial visual burst
                for (let i = 0; i < 10; i++) {
                    let a = this.angle + (Math.random() - 0.5) * Math.PI / 3;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(220 + Math.random() * 120);
                    particles.push(new Particle(this.x + Math.cos(this.angle) * 6, this.y + Math.sin(this.angle) * 6, '#FFD700', 4, 0.5, vel.x, vel.y));
                }

                if (this.isPlayer) addKillMsg('💨 Dash Reveal!');
            }
            
            die(src) {
                // Bounty-specific kill stack handling (do this before standard death flow)
                if (src && src instanceof BountyHunter) {
                    src.killStacks = Math.min(src.maxKillStacks, src.killStacks + 1);
                    if (src.killStacks === 3) {
                        src.hp = Math.min(src.maxHp, src.hp + 1280);
                    }
                }

                // Defer to generic entity death handler to ensure endGame, 5v5 revive, scoring, and other
                // centralized cleanup logic execute properly.
                super.die(src);
            }
            
            ai(dt, spd) {
                if (this.dead) return;
                
                let target = this.bountyTarget || this.findTarget();
                if (!target) {
                    if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                    this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                    this.y += Math.sin(this.angle) * spd * 0.5 * dt;
                    return;
                }
                
                let dx = target.x - this.x;
                let dy = target.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                this.angle = Math.atan2(dy, dx);
                
                if (this.mode === 'meet_your_end') {
                    if (dist > 150) {
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;
                    } else {
                        if (this.basicCD <= 0 && Math.random() < 0.3) this.meleeBasicAtk();
                        if (this.qCD <= 0 && Math.random() < 0.15) this.doubleSlash();
                        if (dist < 300 && this.eCD <= 0 && Math.random() < 0.1) this.throwSickle();
                    }
                } else {
                    if (dist > 300) {
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;
                    } else {
                        if (this.rifleBasicCD <= 0 && Math.random() < 0.4) this.rifleShot();
                        if (this.qCD <= 0 && Math.random() < 0.2) this.insaneRifleShot();
                    }
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
            
            draw(ctx) {
                super.draw(ctx);
                
                if (this.isPlayer) {
                    ctx.save();
                    ctx.fillStyle = this.mode === 'meet_your_end' ? '#8B0000' : '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.mode === 'meet_your_end' ? '🔪 Melee' : '🔫 Ranged', this.x - camera.x, this.y - camera.y - 80);
                    ctx.restore();
                }
                
                // Draw bounty target marker
                if (this.bountyTarget && !this.bountyTarget.dead) {
                    ctx.save();
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.bountyTarget.x - camera.x, this.bountyTarget.y - camera.y, 40, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Draw linked prey visual indicator with RED marker
                if (this.linkedPrey && !this.linkedPrey.dead) {
                    ctx.save();
                    
                    // Draw pulsing red line from BountyHunter to linked prey
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([6, 4]);
                    ctx.beginPath();
                    ctx.moveTo(this.x - camera.x, this.y - camera.y);
                    ctx.lineTo(this.linkedPrey.x - camera.x, this.linkedPrey.y - camera.y);
                    ctx.stroke();
                    
                    // Draw strong red circle around linked prey
                    ctx.strokeStyle = '#FF0000';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(this.linkedPrey.x - camera.x, this.linkedPrey.y - camera.y, 55, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Pulsing secondary circle
                    let pulse = Math.sin(Date.now() / 250) * 4 + 4;
                    ctx.strokeStyle = '#FF4444';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.linkedPrey.x - camera.x, this.linkedPrey.y - camera.y, 55 + pulse, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Draw PREY label in red
                    ctx.fillStyle = '#FF0000';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('PREY', this.linkedPrey.x - camera.x, this.linkedPrey.y - camera.y - 75);
                    
                    ctx.restore();
                }
            }
        }

        class Caskrice extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#596773' : '#2f3b44', 11000);
                this.isPlayer = p;
                this.countsAsFFAHero = true;
                this.name = p ? 'Player (Caskrice)' : 'Enemy Caskrice';
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                this.baseSpd = 260;
                this.speed = this.baseSpd;
                this.deathDragon = null;
                this.deathLaserTimer = 0;
                this.deathLaserDirection = 0;
                this.deathLaserLength = 0;
                this.deathLaserTick = 0;
                this.deathBeamTimer = 0;
                this.deathBeamPulse = 0;
                this.basicCount = 0;
                this.currentSkin = 'default';
                this.dragonClawFlash = 0;
            }

            getSelfDamageMultiplier() {
                return this.deathDragon ? 0.3 : 1;
            }

            applySelfDamage(amount) {
                const actual = Math.max(0, amount * this.getSelfDamageMultiplier());
                if (actual <= 0) return 0;
                this.hp = Math.max(1, this.hp - actual);
                return actual;
            }

            healIfBloodDebt(damageDone, multiplier = 1) {
                if (this.hp <= this.maxHp * 0.5) {
                    const healAmount = Math.max(0, damageDone * multiplier);
                    if (healAmount > 0) {
                        this.hp = Math.min(this.maxHp, this.hp + healAmount);
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
                            particles.push(new Particle(
                                this.x + Math.cos(angle) * (18 + Math.random() * 22),
                                this.y + Math.sin(angle) * (18 + Math.random() * 22),
                                '#a7f3d0',
                                3 + Math.random() * 2,
                                0.7 + Math.random() * 0.4,
                                Math.cos(angle) * 30,
                                Math.sin(angle) * 30
                            ));
                        }
                    }
                }
            }

            explodeDeathDragon() {
                if (!this.deathDragon) return;
                const centerX = this.deathDragon.x;
                const centerY = this.deathDragon.y;
                const blastRange = 220;
                const blastDamage = 1300;
                let totalDamageDealt = 0;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - centerX) ** 2 + (e.y - centerY) ** 2);
                        if (d < blastRange) {
                            const beforeHp = e.hp;
                            e.takeDamage(blastDamage, this);
                            const dealt = Math.max(0, beforeHp - e.hp);
                            totalDamageDealt += dealt;
                            this.healIfBloodDebt(dealt, 1.5);
                        }
                    }
                }
                particles.push(new Slash(centerX, centerY, 0, blastRange, Math.PI * 2, '#b17cff'));
                for (let i = 0; i < 26; i++) {
                    const ang = Math.random() * Math.PI * 2;
                    const radius = 30 + Math.random() * 160;
                    particles.push(new Particle(
                        centerX + Math.cos(ang) * radius,
                        centerY + Math.sin(ang) * radius,
                        i % 2 === 0 ? '#d6b3ff' : '#88f7ff',
                        4 + Math.random() * 3,
                        0.9 + Math.random() * 0.5,
                        Math.cos(ang) * (120 + Math.random() * 80),
                        Math.sin(ang) * (120 + Math.random() * 80)
                    ));
                }
                effectsAdd(new ShockwaveRing(centerX, centerY, 30, '#d6b3ff', 0.9, 18, 7));
                this.deathDragon = null;
                if (this.isPlayer) addKillMsg('🐉 Death Dragon Exploded!');
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

                if (this.deathLaserTimer > 0) {
                    this.deathLaserTimer -= dt;
                    this.deathBeamTimer = Math.max(this.deathBeamTimer, this.deathLaserTimer);
                    this.stunImmuneTimer = Math.max(this.stunImmuneTimer, 0.15);
                    this.deathLaserTick += dt;
                    this.deathBeamPulse -= dt;
                    if (this.deathBeamPulse <= 0) {
                        this.deathBeamPulse = 0.12;
                        const pulseDist = 65 + Math.random() * 60;
                        const pulseX = this.x + Math.cos(this.deathLaserDirection) * pulseDist;
                        const pulseY = this.y + Math.sin(this.deathLaserDirection) * pulseDist;
                        visualEffects.push(new EnergyBeam(pulseX, pulseY, this.deathLaserDirection, 200 + Math.random() * 80, '#ffb0dc', 0.14));
                        visualEffects.push(new SpinningRing(pulseX + Math.cos(this.deathLaserDirection) * 110, pulseY + Math.sin(this.deathLaserDirection) * 110, 16 + Math.random() * 12, '#ffd7f3', 0.18, 10 + Math.random() * 6, 4));
                    }
                    let targetDir = this.deathLaserDirection;
                    let reach = this.deathLaserLength;
                    if (this.deathLaserTick >= 0.12) {
                        this.deathLaserTick = 0;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let dx = e.x - this.x;
                                let dy = e.y - this.y;
                                let dist = Math.sqrt(dx * dx + dy * dy);
                                if (dist > 0 && dist < reach) {
                                    let ang = Math.atan2(dy, dx);
                                    let diff = Math.abs(Math.atan2(Math.sin(ang - targetDir), Math.cos(ang - targetDir)));
                                    if (diff < 0.08) {
                                        const beforeHp = e.hp;
                                        e.takeDamage(160, this);
                                        const dealt = Math.max(0, beforeHp - e.hp);
                                        this.healIfBloodDebt(dealt);
                                        particles.push(new Particle(e.x, e.y, '#ff4db8', 2 + Math.random() * 2, 0.3, (Math.random()-0.5)*60, (Math.random()-0.5)*60));
                                    }
                                }
                            }
                        }
                    }
                    if (this.deathLaserTimer <= 0) {
                        this.deathLaserTimer = 0;
                        this.deathLaserLength = 0;
                        this.deathBeamTimer = 0;
                        this.deathBeamPulse = 0;
                    }
                }

                if (this.deathDragon) {
                    this.deathDragon.cooldown -= dt;
                    if (this.deathDragon.target && !this.deathDragon.target.dead) {
                        let dx = this.deathDragon.target.x - this.deathDragon.x;
                        let dy = this.deathDragon.target.y - this.deathDragon.y;
                        let d = Math.sqrt(dx * dx + dy * dy);
                        if (d > 0) {
                            this.deathDragon.x += (dx / d) * 180 * dt;
                            this.deathDragon.y += (dy / d) * 180 * dt;
                        }
                    } else {
                        this.deathDragon.target = this.findTarget();
                    }
                    if (this.deathDragon.cooldown <= 0) {
                        this.deathDragon.cooldown = 0.8;
                        const target = this.deathDragon.target || this.findTarget();
                        if (target) {
                            let d = Math.sqrt((target.x - this.deathDragon.x) ** 2 + (target.y - this.deathDragon.y) ** 2);
                            if (d < 150) {
                                const ang = Math.atan2(target.y - this.deathDragon.y, target.x - this.deathDragon.x);
                                visualEffects.push(new CaskriceDragonClaw(this.deathDragon.x + Math.cos(ang) * 28, this.deathDragon.y + Math.sin(ang) * 28, ang, '#d8b4fe', 0.22));
                                const beforeHp = target.hp;
                                target.takeDamage(300, this);
                                const dealt = Math.max(0, beforeHp - target.hp);
                                this.healIfBloodDebt(dealt);
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
                } else {
                    this.ai(dt, spd);
                }
            }

            getEffectiveSpeed() {
                let beamSpeedFactor = this.deathBeamTimer > 0 ? 0.5 : 1;
                return this.speed * (this.deathDragon ? 1.1 : 1) * beamSpeedFactor;
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
                if (keys.q && this.qCD <= 0) this.scytheSwing();
                if (keys.e && this.eCD <= 0) this.executionStrike();
                if (keys.f && this.fCD <= 0) this.deathBlast();
                if (keys.g && this.gCD <= 0) this.deathDragonAbility();
                if (keys.r && this.rCD <= 0) this.useGear();
            }

            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.8;
                let damage = 150;
                const slashX = this.x + Math.cos(this.angle) * 26;
                const slashY = this.y + Math.sin(this.angle) * 26;
                visualEffects.push(new CaskriceArcSlash(slashX, slashY, this.angle, 88, 1.25, '#d6d8ff', 0.22));
                let proj = new Projectile(this, this.x, this.y, this.angle, 700, damage, 450, '#7a8ea2', 12);
                proj.isScythe = true;
                entities.push(proj);
            }

            scytheSwing() {
                this.qCD = 6;
                this.applySelfDamage(1000);
                const dashDist = 150;
                this.x += Math.cos(this.angle) * dashDist;
                this.y += Math.sin(this.angle) * dashDist;
                const slashX = this.x + Math.cos(this.angle) * 15;
                const slashY = this.y + Math.sin(this.angle) * 15;
                visualEffects.push(new CaskriceArcSlash(slashX, slashY, this.angle, 170, 1.45, '#e8e9ff', 0.28));
                visualEffects.push(new CaskriceBeamPulse(slashX, slashY, this.angle, 110, '#d8d9ff', 0.18));
                particles.push(new Particle(this.x, this.y, '#dfe7ee', 12, 0.5, Math.cos(this.angle) * 80, Math.sin(this.angle) * 80));
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x;
                        let dy = e.y - this.y;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        let ang = Math.atan2(dy, dx);
                        let diff = Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle)));
                        if (dist < 180 && diff < 0.9) {
                            const beforeHp = e.hp;
                            e.takeDamage(950, this);
                            const dealt = Math.max(0, beforeHp - e.hp);
                            this.healIfBloodDebt(dealt);
                            e.stunTimer = Math.max(e.stunTimer || 0, 1.2);
                        }
                    }
                }
                if (this.isPlayer) addKillMsg('🗡️ Scythe Swing!');
            }

            executionStrike() {
                this.eCD = 8;
                let hpLoss = this.hp * 0.2;
                this.applySelfDamage(hpLoss);
                let damage = 850;
                let executionRange = 260;
                let hitTargets = [];
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x;
                        let dy = e.y - this.y;
                        let dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < executionRange) {
                            const beforeHp = e.hp;
                            e.takeDamage(damage, this);
                            const dealt = Math.max(0, beforeHp - e.hp);
                            this.healIfBloodDebt(dealt);
                            hitTargets.push(e);
                            if (e.hp <= 0) {
                                e.dead = true;
                            }
                            if (e.hp > 0 && e.hp <= e.maxHp * 0.1) {
                                e.hp = 0;
                                e.dead = true;
                            }
                        }
                    }
                }
                if (hitTargets.length > 0) {
                    const slashX = this.x + Math.cos(this.angle) * 70;
                    const slashY = this.y + Math.sin(this.angle) * 70;
                    particles.push(new Slash(slashX, slashY, this.angle, executionRange * 0.7, Math.PI * 0.72, '#ff7aa8'));
                    visualEffects.push(new EnergyWave(slashX, slashY, '#ff9ac9', 140, 0.5));
                    visualEffects.push(new SpinningRing(slashX + Math.cos(this.angle) * 80, slashY + Math.sin(this.angle) * 80, 32, '#ffd9ed', 0.3, 12, 4));
                }
                if (this.isPlayer) addKillMsg('💀 Execution Strike!');
            }

            deathBlast() {
                this.fCD = 15;
                this.deathLaserTimer = 2.8;
                this.deathBeamTimer = 2.8;
                this.deathLaserDirection = this.angle;
                this.deathLaserLength = 980;
                this.deathBeamPulse = 0.06;
                this.applySelfDamage(this.maxHp * 0.2);
                const beamStartX = this.x + Math.cos(this.angle) * 34;
                const beamStartY = this.y + Math.sin(this.angle) * 34;
                visualEffects.push(new CaskriceBeamPulse(beamStartX, beamStartY, this.angle, 300, '#ff70d7', 0.24));
                visualEffects.push(new CaskriceArcSlash(beamStartX + Math.cos(this.angle) * 150, beamStartY + Math.sin(this.angle) * 150, this.angle, 58, 1.7, '#ffb1e8', 0.28));
                if (this.isPlayer) addKillMsg('☠️ Death Blast!');
            }

            deathDragonAbility() {
                this.gCD = 30;
                if (this.deathDragon) {
                    this.explodeDeathDragon();
                    return;
                }

                let dragX = this.x + Math.cos(this.angle) * 120;
                let dragY = this.y + Math.sin(this.angle) * 120;
                this.applySelfDamage(this.maxHp * 0.2);
                this.deathDragon = {
                    x: dragX,
                    y: dragY,
                    cooldown: 0.8,
                    target: this.findTarget(),
                    pulse: 0
                };
                particles.push(new Slash(this.x, this.y, this.angle, 180, Math.PI * 0.52, '#9d7af9'));
                visualEffects.push(new SpinningRing(dragX, dragY, 26, '#d8b4fe', 0.5, 8, 4));
                visualEffects.push(new EnergyWave(dragX, dragY, '#d8b4fe', 120, 0.6));
                if (this.isPlayer) addKillMsg('🐉 Death Dragon Summoned!');
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

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }

                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx * dx + dy * dy);

                if (d > 150) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }

                if (this.basicCD <= 0 && d < 250) this.basicAtk();
                if (this.qCD <= 0 && d < 180) this.scytheSwing();
                if (this.eCD <= 0 && d < 220) this.executionStrike();
                if (this.fCD <= 0 && d < 500) this.deathBlast();
                if (this.gCD <= 0 && !this.deathDragon && d < 350) this.deathDragonAbility();
            }

            wander(dt, spd) {
                if (Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }

            draw(ctx) {
                ctx.save();
                ctx.shadowColor = '#8b5cf6';
                ctx.shadowBlur = 18;
                ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                super.draw(ctx);
                if (this.deathDragon) {
                    const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.2;
                    const dragonX = this.deathDragon.x - camera.x;
                    const dragonY = this.deathDragon.y - camera.y;
                    const baseX = this.x - camera.x;
                    const baseY = this.y - camera.y;
                    ctx.save();
                    ctx.strokeStyle = '#c4b5fd';
                    ctx.fillStyle = 'rgba(157, 125, 255, 0.18)';
                    ctx.lineWidth = 3.8;
                    ctx.shadowColor = '#a78bfa';
                    ctx.shadowBlur = 30;
                    ctx.beginPath();
                    ctx.arc(dragonX, dragonY, 28 * pulse, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(dragonX, dragonY, 44 * pulse, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(136,247,255,0.8)';
                    ctx.lineWidth = 2.2;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(baseX, baseY);
                    ctx.lineTo(dragonX, dragonY);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(dragonX, dragonY);
                    ctx.lineTo(dragonX + 32, dragonY - 26);
                    ctx.lineTo(dragonX + 52, dragonY + 8);
                    ctx.lineTo(dragonX + 30, dragonY + 22);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
                if (this.deathLaserTimer > 0) {
                    ctx.save();
                    const startX = this.x - camera.x;
                    const startY = this.y - camera.y;
                    const endX = startX + Math.cos(this.deathLaserDirection) * this.deathLaserLength;
                    const endY = startY + Math.sin(this.deathLaserDirection) * this.deathLaserLength;
                    const pulse = 0.5 + Math.sin(Date.now() * 0.025) * 0.5;
                    const beamGrad = ctx.createLinearGradient(startX, startY, endX, endY);
                    beamGrad.addColorStop(0, 'rgba(255, 118, 214, 0)');
                    beamGrad.addColorStop(0.18, 'rgba(255, 184, 239, 0.95)');
                    beamGrad.addColorStop(0.5, 'rgba(255, 113, 214, 1)');
                    beamGrad.addColorStop(1, 'rgba(255, 234, 249, 0)');

                    ctx.strokeStyle = beamGrad;
                    ctx.lineWidth = 16;
                    ctx.shadowColor = '#ff7ae0';
                    ctx.shadowBlur = 36;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    ctx.lineWidth = 7;
                    ctx.shadowBlur = 18;
                    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(startX + Math.cos(this.deathLaserDirection) * (this.deathLaserLength * 0.72), startY + Math.sin(this.deathLaserDirection) * (this.deathLaserLength * 0.72));
                    ctx.stroke();

                    for (let i = 0; i < 8; i++) {
                        const t = i / 7;
                        const bx = startX + (endX - startX) * t;
                        const by = startY + (endY - startY) * t;
                        const r = 14 + pulse * 16 + i * 1.4;
                        ctx.beginPath();
                        ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 215, 245, 0.85)' : 'rgba(255, 137, 221, 0.9)';
                        ctx.arc(bx, by, r * 0.7, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    ctx.restore();
                }
            }
        }

        class Don extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#0000cc' : '#00008b', 4800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Don)" : "Enemy Don";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;
                this.baseSpd = 280;
                this.speed = this.baseSpd;
                this.basicCount = 0;
                this.eCharges = 2;
                this.eChargeCD = 0;
                this.fCharging = false;
                this.fWindup = 0;
                this.eCharging = false;
                this.eWindup = 0;
                // Gear defaults (ensure R checks and HUD work)
                this.gear = 'speedster';
                this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
                this.teleportWindup = 0; this.teleportTarget = null; this.invincibleLockTimer = 0;
                this.currentSkin = 'default';
                this.skinIcon = null;
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
                if (this.invincibleLockTimer > 0) this.invincibleLockTimer -= dt;
                if (this.eChargeCD > 0) this.eChargeCD -= dt;
                if (this.eChargeCD <= 0 && this.eCharges < 2) {
                    this.eCharges++;
                    if (this.eCharges < 2) this.eChargeCD = 4;
                }
                if (this.fCharging) {
                    this.fWindup -= dt;
                    if (this.fWindup <= 0) {
                        this.fCharging = false;
                        this.spiritBomb();
                        this.fCD = 10;
                        this.shield -= 960;
                    }
                }
                if (this.eCharging) {
                    this.eWindup -= dt;
                    if (this.eWindup <= 0) {
                        this.eCharging = false;
                        this.dashAttack();
                    }
                }
                // Handle teleportation gear windup
                if (this.teleportWindup > 0) {
                    this.teleportWindup -= dt;
                    if (this.teleportWindup <= 0 && this.teleportTarget) {
                        this.x = this.teleportTarget.x;
                        this.y = this.teleportTarget.y;
                        this.teleportTarget = null;
                    }
                }
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.fireArrows();
                if (keys.e && this.eCD <= 0 && this.eCharges > 0 && !this.eCharging) {
                    this.eCharging = true;
                    this.eWindup = 0.25;
                }
                if (keys.f && this.fCD <= 0 && !this.fCharging) {
                    let targetForF = this.findTarget();
                    if (targetForF) {
                        let dd = Math.sqrt((targetForF.x - this.x)**2 + (targetForF.y - this.y)**2);
                        if (dd <= 300) {
                            this.fCharging = true;
                            this.fWindup = 1.5;
                            this.shield += 960;
                            if(this.isPlayer){
                                let sounds = getSkinSounds('don', this.currentSkin);
                                if(sounds && sounds.f){
                                    let audio = new Audio(sounds.f);
                                    audio.volume = 0.8;
                                    audio.play().catch(e => console.log('Sound failed:', e));
                                }
                                if(typeof onlineSocket !== 'undefined' && onlineSocket && gameMode && gameMode.includes('online')){
                                    onlineSocket.emit('abilitySound', {ability: 'f', x: this.x, y: this.y, heroType: 'don', skin: this.currentSkin});
                                }
                            }
                        } else {
                            // silently ignore - no HUD message
                        }
                    } else {
                        // silently ignore - no HUD message
                    }
                }
                // Gear activation (R)
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 1.0;
                if (this.basicCount < 3) {
                    // Hexagon throw or chicken wing for Don Pollo
                    let color = (this.currentSkin === 'Don Pollo') ? '#d2691e' : '#0000cc';
                    let proj = new Projectile(this, this.x, this.y, this.angle, 500, 120, 350, color, 12);
                    proj.isHexagon = true;
                    proj.isChickenWing = (this.currentSkin === 'Don Pollo');
                    proj.maxDistance = 350;
                    proj.onHit = (target) => {
                        target.slowTimer = Math.max(target.slowTimer, 0.6);
                    };
                    entities.push(proj);
                    this.basicCount++;
                } else {
                    // Enhanced arrow or chicken leg for Don Pollo
                    let color = (this.currentSkin === 'Don Pollo') ? '#cd853f' : '#ff0000';
                    let proj = new Projectile(this, this.x, this.y, this.angle, 600, 600, 600, color, 30);
                    proj.isArrow = true;
                    proj.isChickenLeg = (this.currentSkin === 'Don Pollo');
                    proj.maxDistance = 600;
                    entities.push(proj);
                    this.basicCount = 0;
                }
            }
            
            fireArrows() {
                this.qCD = 5;
                if(this.isPlayer){
                    let sounds = getSkinSounds('don', this.currentSkin);
                    if(sounds && sounds.q){
                        let audio = new Audio(sounds.q);
                        audio.volume = 0.8;
                        audio.play().catch(e => console.log('Sound failed:', e));
                    }
                    if(typeof onlineSocket !== 'undefined' && onlineSocket && gameMode && gameMode.includes('online')){
                        onlineSocket.emit('abilitySound', {ability: 'q', x: this.x, y: this.y, heroType: 'don', skin: this.currentSkin});
                    }
                }
                for (let i = 0; i < 3; i++) {
                    let angle = this.angle + (i - 1) * 0.3;
                    let color = (this.currentSkin === 'Don Pollo') ? '#cd853f' : '#0000cc';
                    let proj = new Projectile(this, this.x, this.y, angle, 500, 500, 500, color, 24);
                    proj.isArrow = true;
                    proj.isChickenLeg = (this.currentSkin === 'Don Pollo');
                    proj.onHit = (target) => {
                        target.slowTimer = Math.max(target.slowTimer, 0.6);
                    };
                    entities.push(proj);
                }
            }
            
            dashAttack() {
                if (this.eCharges <= 0 || this.eCD > 0) return;
                this.eCharges--;
                if (this.eCharges == 1) this.eChargeCD = 4;
                this.eCD = 0.5;
                let dashDist = 200;
                this.x += Math.cos(this.angle) * dashDist;
                this.y += Math.sin(this.angle) * dashDist;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 100) {
                        e.takeDamage(250, this);
                    }
                }
                let dashColor = (this.currentSkin === 'Don Pollo') ? '#cd853f' : '#ff0000';
                let proj = new Projectile(this, this.x, this.y, this.angle, 500, 400, 500, dashColor, 30);
                proj.isArrow = true;
                proj.isChickenLeg = (this.currentSkin === 'Don Pollo');
                entities.push(proj);
                // Use brown particles for Don Pollo dash
                let dashParticleColor = (this.currentSkin === 'Don Pollo') ? '#8b6f47' : '#0000cc';
                for (let i = 0; i < 10; i++) particles.push(new Particle(this.x, this.y, dashParticleColor, 4, 0.5));
                this.hp = Math.min(this.maxHp, this.hp + 240);
                if (this.isPlayer) addKillMsg("Dash Heal +240 HP");
            }
            
            spiritBomb() {
                this.fCD = 10;
                
                let target = this.findTarget();
                if (!target) return;
                // Bigger bomb: slower speed, longer range to prevent instant explosion
                let bomb = new Projectile(this, this.x + Math.cos(this.angle) * (this.radius + 12), this.y + Math.sin(this.angle) * (this.radius + 12), this.angle, 300, 1500, 0, '#ffff00', 40, false, false, true);
                bomb.target = target;
                bomb.isHoming = true;
                bomb.isChicken = (this.currentSkin === 'Don Pollo');
                bomb.isBomb = true;
                bomb.skipInitialCollisionCheck = true;
                bomb.safeTime = 0.35; // avoid instant explosion on spawn
                bomb.onExplode = () => {
                    let killed = false;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - bomb.x)**2 + (e.y - bomb.y)**2) < 250) {
                            let beforeHp = e.hp;
                            if (e === bomb.target) {
                                e.takeDamage(800, this);
                            } else {
                                e.takeDamage(400, this);
                                e.applyStatus('stun', 0.5, this);
                            }
                            if (e.hp <= 0 && beforeHp > 0) killed = true;
                        }
                    }
                    // Only reset Don's fCD if the spirit bomb killed at least one enemy
                    if (killed) this.fCD = 0;
                };
                entities.push(bomb);
            }
            
            ai(dt, spd) {
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 50) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                if (d < 400 && this.qCD <= 0) this.fireArrows();
                if (d < 200 && this.eCD <= 0 && this.eCharges > 0) this.dashAttack();
                if (d < 300 && this.fCD <= 0) this.spiritBomb();
                if (d < 150 && this.basicCD <= 0) this.basicAtk();
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
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            draw(ctx) {
                if(this.currentSkin !== 'default'){
                    if(!drawSkinImage(ctx, this, 'don', this.currentSkin, '#d2691e', { filter: 'brightness(0.9) saturate(0.85)', alpha: 0.98 })) {
                        super.draw(ctx);
                    }
                } else {
                    super.draw(ctx);
                }
                
                // Draw aim pointer line like Tate
                ctx.beginPath();
                ctx.moveTo(this.x - camera.x, this.y - camera.y);
                ctx.lineTo((this.x - camera.x) + Math.cos(this.angle) * (this.radius + 10), (this.y - camera.y) + Math.sin(this.angle) * (this.radius + 10));
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Show windup animation for F (spirit bomb) - BROWN ONLY FOR DON POLLO
                if (this.fCharging) {
                    if(this.currentSkin === 'Don Pollo'){
                        ctx.strokeStyle = '#a0705f';
                        ctx.fillStyle = 'rgba(160,112,95,0.3)';
                    } else {
                        ctx.strokeStyle = '#ffff00';
                        ctx.fillStyle = 'rgba(255,255,0,0.3)';
                    }
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    let windupProgress = (1.5 - this.fWindup) / 1.5;
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 15 + windupProgress * 15, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 15, 0, Math.PI * 2 * windupProgress);
                    ctx.fill();
                }
                // Show windup animation for E (dash) - BROWN ONLY FOR DON POLLO
                if (this.eCharging) {
                    if(this.currentSkin === 'Don Pollo'){
                        ctx.strokeStyle = '#8b6f47';
                        ctx.fillStyle = 'rgba(139,111,71,0.2)';
                    } else {
                        ctx.strokeStyle = '#0000cc';
                        ctx.fillStyle = 'rgba(0,0,255,0.2)';
                    }
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI * 2 * ((0.5 - this.eWindup) / 0.5));
                    ctx.fill();
                }
            }
        }

        class Monza extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#1a1a1a' : '#0d0d0d', 7500);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Monza)" : "Enemy Monza";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 200;
                this.speed = this.baseSpd;
                // Q ability state
                this.qActive = false;
                this.qTimer = 0;
                this.qGoons = [];
                this.hasRifle = false;
                this.rifleCD = 0;
                // E ability state
                this.eWindup = 0;
                this.eWinding = false;
                this.eRushing = false;
                this.eRushTimer = 0;
                this.eRushDir = 0;
                // F ability state - Pizza buff
                this.pizzaBuff = false;
                this.pizzaTimer = 0;
                this.basicCDReduction = 0;
            }
            
            takeDamage(amt, src) {
                super.takeDamage(amt, src);
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                
                // Update Q ability
                if (this.qActive) {
                    this.qTimer -= dt;
                    if (this.qTimer <= 0) {
                        this.qActive = false;
                        this.hasRifle = false;
                        // Mark all goons as dead for despawn
                        for (let g of this.qGoons) {
                            g.dead = true;
                        }
                        this.qGoons = [];
                    } else {
                        // Filter out dead goons
                        this.qGoons = this.qGoons.filter(g => !g.dead);
                    }
                }
                
                // Update pizza buff
                if (this.pizzaBuff) {
                    this.pizzaTimer -= dt;
                    if (this.pizzaTimer <= 0) {
                        this.pizzaBuff = false;
                        this.basicCDReduction = 0;
                    }
                }
                
                // Update E ability windup
                if (this.eWinding) {
                    this.eWindup -= dt;
                    if (this.eWindup <= 0) {
                        this.eRushing = true;
                        this.eRushTimer = 2.0; // Max rush duration (can be interrupted by hit)
                        this.eWinding = false;
                        this.eRushDir = this.angle;
                        this.eHitTarget = false;
                    }
                }
                
                // Update E rushing - check for collisions with enemies
                if (this.eRushing) {
                    this.eRushTimer -= dt;
                    
                    // Check for hits during rush
                    if (!this.eHitTarget) {
                        for (let e of entities) {
                            if (e !== this && !e.dead) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                // Hit any entity that isn't self or on same team (including dummies, bosses, etc)
                                let isEnemy = (e instanceof Entity && e.team !== this.team) || 
                                              (e.isDummy) || 
                                              (e.isBoss) || 
                                              (e instanceof DefenseTower) ||
                                              (e instanceof MainTower);
                                if (isEnemy && d < 80) {
                                    // Hit detected - stop rush immediately and execute circle swing
                                    this.eHitTarget = true;
                                    this.eRushing = false;
                                    this.executeGotchaCircleSwing();
                                    this.eCD = 10;
                                    break;
                                }
                            }
                        }
                    }
                    
                    // End rush if timer runs out or max distance reached
                    if (this.eRushTimer <= 0) {
                        if (!this.eHitTarget) {
                            // Reached max range without hitting - execute circle swing anyway
                            this.executeGotchaCircleSwing();
                        }
                        this.eRushing = false;
                        this.eCD = 10;
                    }
                }
                
                // Update rifle cooldown
                if (this.hasRifle && this.rifleCD > 0) {
                    this.rifleCD -= dt;
                }
                
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (!this.eWinding && !this.eRushing) { // Can't move during windup or rush
                    if (keys.w) dy--;
                    if (keys.s) dy++;
                    if (keys.a) dx--;
                    if (keys.d) dx++;
                }
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                
                if (!this.eRushing) { // Can change direction unless rushing
                    this.angle = getMouseAimAngle(this.x, this.y);
                } else {
                    // During rush, move in locked direction at 4x speed
                    this.x += Math.cos(this.eRushDir) * 4 * spd * dt;
                    this.y += Math.sin(this.eRushDir) * 4 * spd * dt;
                }
                
                if (mouse.down && this.basicCD <= 0 && !this.eRushing) { // Can't attack during rush
                    if (this.hasRifle) {
                        this.fireRifle();
                    } else {
                        this.basicAttack();
                    }
                }
                if (keys.q && this.qCD <= 0 && !this.eRushing) this.bossCommand();
                if (keys.e && this.eCD <= 0 && !this.eWinding && !this.eRushing) this.startGotchaWindup();
                if (keys.f && this.fCD <= 0 && !this.eRushing) this.pizzaTime();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAttack() {
                this.revealTimer = 0.5;
                let actualCD = 1.0 - this.basicCDReduction;
                let dmg = 130;
                
                // Sword swing effect
                particles.push(new Slash(this.x, this.y, this.angle, 150, Math.PI / 1.5, '#c0c0c0'));
                
                // Damage nearby enemies
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 150) {
                        let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                        if (ad > Math.PI) ad = 2 * Math.PI - ad;
                        if (ad < Math.PI / 3) {
                            e.takeDamage(dmg, this);
                        }
                    }
                }
                this.basicCD = actualCD;
            }
            
            fireRifle() {
                if (this.rifleCD > 0) return;
                this.revealTimer = 0.5;
                let proj = new Projectile(this, this.x, this.y, this.angle, 800, 22, 400, '#ffff00', 5);
                proj.isRifle = true;
                entities.push(proj);
                this.rifleCD = 0.1;
                this.basicCD = 0.05;
            }
            
            bossCommand() {
                this.qCD = 15;
                this.qActive = true;
                this.qTimer = 10;
                this.hasRifle = true;
                this.rifleCD = 0;
                
                // Spawn 2 goons
                for (let i = 0; i < 2; i++) {
                    let angle = (i === 0 ? -Math.PI / 4 : Math.PI / 4);
                    let gx = this.x + Math.cos(this.angle + angle) * 100;
                    let gy = this.y + Math.sin(this.angle + angle) * 100;
                    let goon = new Goon(gx, gy, this);
                    entities.push(goon);
                    this.qGoons.push(goon);
                }
                
                if (this.isPlayer) addKillMsg("Boss summoned 2 goons!");
            }
            
            startGotchaWindup() {
                this.eWinding = true;
                this.eWindup = 0.5;
            }
            
            executeGotchaCircleSwing() {
                // Execute circle swing with 500 damage + 50% heal in 250 radius
                let swingRadius = 250;
                
                // Create visible circle swing effect
                particles.push(new Slash(this.x, this.y, this.angle, swingRadius, Math.PI * 2, '#ff6600'));
                
                // Damage and heal for all enemies in radius
                let enemiesHit = 0;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < swingRadius) {
                            e.takeDamage(500, this);
                            enemiesHit++;
                        }
                    }
                }
                
                // Heal Monza for 300 per enemy hit, minimum 200
                let healAmount = Math.max(200, enemiesHit * 300);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                
                if (this.isPlayer) addKillMsg(`Gotcha! Healed ${Math.floor(healAmount)} HP`);
            }
            
            pizzaTime() {
                this.fCD = 17;
                this.pizzaBuff = true;
                this.pizzaTimer = 8;
                this.basicCDReduction = 0.25; // Reduce basic CD by 0.25s
                
                // Apply to all goons
                for (let g of this.qGoons) {
                    g.pizzaBuff = true;
                    g.pizzaTimer = 8;
                    g.basicCDReduction = 0.25;
                }
                
                // Always spawn extra goon
                let angle = Math.PI;
                let gx = this.x + Math.cos(this.angle + angle) * 100;
                let gy = this.y + Math.sin(this.angle + angle) * 100;
                let goon = new Goon(gx, gy, this);
                goon.pizzaBuff = true;
                goon.pizzaTimer = 8;
                goon.basicCDReduction = 0.25;
                entities.push(goon);
                this.qGoons.push(goon);
                
                if (this.isPlayer) addKillMsg("pizza time 🍕");
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                if (this.hp < this.maxHp * 0.3) {
                    let cube = this.findNearestHealthCube();
                    if (cube) {
                        let dx = cube.x - this.x, dy = cube.y - this.y;
                        this.angle = Math.atan2(dy, dx);
                        let d = Math.sqrt(dx*dx + dy*dy);
                        if (d > 20) {
                            this.x += Math.cos(this.angle) * spd * 1.2 * dt;
                            this.y += Math.sin(this.angle) * spd * 1.2 * dt;
                        }
                        return;
                    }
                }
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
                let d = Math.sqrt(dx*dx + dy*dy);
                
                if (d > 50) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                
                if (d < 600 && this.qCD <= 0) this.bossCommand();
                if (d < 400 && this.fCD <= 0) this.pizzaTime();
                if (d < 300 && this.eCD <= 0 && !this.eWinding && !this.eRushing) this.startGotchaWindup();
                
                if (this.hasRifle && this.basicCD <= 0 && this.rifleCD <= 0) this.fireRifle();
                else if (this.basicCD <= 0) this.basicAttack();
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
                
                // Draw E windup animation (like Mamba)
                if (this.eWinding) {
                    ctx.strokeStyle = '#ff6600';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    let windupProgress = (0.5 - this.eWindup) / 0.5;
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10 + windupProgress * 15, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(255,102,0,0.2)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI * 2 * windupProgress);
                    ctx.fill();
                }
                
                // Draw E rushing animation
                if (this.eRushing) {
                    ctx.strokeStyle = '#ff4400';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 30, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    
                    // Draw circle swing range indicator
                    ctx.strokeStyle = 'rgba(255, 102, 0, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 250, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                // Draw pizza buff indicator
                if (this.pizzaBuff) {
                    ctx.fillStyle = '#ffff00';
                    ctx.font = '16px Arial';
                    ctx.fillText('🍕', this.x - camera.x - 8, this.y - camera.y - this.radius - 15);
                }
            }
        }

        // Goon class for Monza's Q ability
        class Goon extends Entity {
            constructor(x, y, monza) {
                super(x, y, 12, '#8b4513', 999999); this.countsAsFFAHero = false;
                this.isGoon = true;
                this.monza = monza;
                this.team = monza.team; // Same team as Monza so they don't attack each other
                this.basicCD = 0;
                this.baseSpd = monza.baseSpd * 3; // 3x Monza's speed (faster walking)
                this.speed = this.baseSpd;
                this.pizzaBuff = false;
                this.pizzaTimer = 0;
                this.basicCDReduction = 0;
                this.currentTarget = null;
            }
            
            update(dt) {
                // Check if Monza is dead or goon has been dead for too long
                if (this.monza.dead) { 
                    this.dead = true;
                    return; 
                }
                
                if (this.dead) return;
                
                // Hide goon 0.1 seconds before despawn (at 9.9 seconds remaining)
                if (this.monza.qActive && this.monza.qTimer < 0.1) {
                    this.dead = true;
                    return;
                }
                
                // Update pizza buff
                if (this.pizzaBuff) {
                    this.pizzaTimer -= dt;
                    if (this.pizzaTimer <= 0) {
                        this.pizzaBuff = false;
                        this.basicCDReduction = 0;
                    }
                }
                
                if (this.basicCD > 0) this.basicCD -= dt;
                let spd = this.getEffectiveSpeed();
                this.ai(dt, spd);
            }
            
            ai(dt, spd) {
                // Find closest target within 300 radius, prioritize lowest HP
                let target = null;
                let lowestHP = Infinity;
                let searchRadius = 300;
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && !e.isGoon) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < searchRadius && e.hp < lowestHP) {
                            lowestHP = e.hp;
                            target = e;
                        }
                    }
                }
                
                // If target found, attack it; otherwise follow Monza
                if (target) {
                    this.currentTarget = target;
                    let dx = target.x - this.x, dy = target.y - this.y;
                    let d = Math.sqrt(dx*dx + dy*dy);
                    if (d > 0) {
                        this.angle = Math.atan2(dy, dx);
                        if (d > 80) {
                            // Move toward target
                            this.x += Math.cos(this.angle) * spd * dt;
                            this.y += Math.sin(this.angle) * spd * dt;
                        } else if (d < 80 && this.basicCD <= 0) {
                            // Attack when in range
                            particles.push(new Slash(this.x, this.y, this.angle, 120, Math.PI / 1.5, '#c0c0c0'));
                            // Damage enemies in attack radius
                            for (let e of entities) {
                                if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && !e.isGoon && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 120) {
                                    let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                                    if (ad > Math.PI) ad = 2 * Math.PI - ad;
                                    if (ad < Math.PI / 3) {
                                        e.takeDamage(130, this.monza);
                                    }
                                }
                            }
                            let actualCD = 1.0 - this.basicCDReduction;
                            this.basicCD = actualCD;
                        }
                    }
                } else {
                    // No target found - follow Monza
                    this.currentTarget = null;
                    let dx = this.monza.x - this.x, dy = this.monza.y - this.y;
                    let d = Math.sqrt(dx*dx + dy*dy);
                    
                    if (d > 100) {
                        // Move toward Monza
                        this.angle = Math.atan2(dy, dx);
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;
                    } else {
                        // Stay near Monza
                        if (Math.random() < 0.02) {
                            this.angle += (Math.random() - 0.5) * 0.5;
                        }
                    }
                }
            }
            
            draw(ctx) {
                if (this.dead) return; // Don't draw if dead
                
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Draw pizza indicator
                if (this.pizzaBuff) {
                    ctx.fillStyle = '#ffff00';
                    ctx.font = '12px Arial';
                    ctx.fillText('🍕', this.x - camera.x - 6, this.y - camera.y - this.radius - 10);
                }
            }
        }

        // FLETCHER - new marksman hero
        
        // CHRISTIAN - reckless driver / hybrid hero
        class CarEffect {
            constructor(owner, type) {
                this.owner = owner;
                this.type = type;
                this.timer = 5;
                this.orbitOffset = Math.random() * Math.PI * 2;
                this.contactTimers = new Map(); // per-enemy contact timers
            }
            update(dt) {
                this.timer -= dt;
                let damage = this.type === 0 ? 400 : 150;
                let cooldown = 1.0; // one second cooldown between hits on same target
                let cx, cy, radiusExtra;
                if (this.type === 0) {
                    cx = this.owner.x; cy = this.owner.y;
                    radiusExtra = this.owner.radius + 5;
                } else {
                    let orbitRadius = 80;
                    let orbitAngle = (Date.now() / 1000) * 1.8 + this.orbitOffset;
                    cx = this.owner.x + Math.cos(orbitAngle) * orbitRadius;
                    cy = this.owner.y + Math.sin(orbitAngle) * orbitRadius;
                    radiusExtra = 20;
                }
                // decrement per-entity cooldowns
                for (let [e, cd] of this.contactTimers.entries()) {
                    cd -= dt;
                    if (cd <= 0) this.contactTimers.delete(e);
                    else this.contactTimers.set(e, cd);
                }
                for (let e of entities) {
                    if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team) {
                        let dx = e.x - cx, dy = e.y - cy;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < e.radius + radiusExtra) {
                            if (!this.contactTimers.has(e)) {
                                e.takeDamage(damage, this.owner);
                                if (this.type === 0) e.stunTimer = Math.max(e.stunTimer, 0.3);
                                this.contactTimers.set(e, cooldown);
                            }
                        }
                    }
                }
                if (this.type === 1) {
                    // Regera invis
                    if (this.timer > 0) this.owner.invisTimer = this.timer;
                } else if (this.type === 2) {
                    // Gemera rapid-fire
                    // handled in fireBasic
                } else if (this.type === 3) {
                    // Agera RS slow aura
                    for (let e of entities) {
                        if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team) {
                            let dx = e.x - this.owner.x, dy = e.y - this.owner.y;
                            if (Math.sqrt(dx*dx + dy*dy) < 250) {
                                e.slowTimer = Math.max(e.slowTimer, 2);
                            }
                        }
                    }
                }
            }
            draw(ctx) {
                if(!this.owner) return;
                const names = ['Jesko Absolut','Koenigsegg Regera','Koenigsegg Gemera','Koenigsegg Agera RS'];
                const colors = ['#000000','#FF0000','#FFFF00','#FFFFFF'];
                const buffs = ['4x Speed Boost!','Total Invisibility','0.3s Attack Speed','250 Slow Aura'];
                
                let x = this.owner.x - camera.x;
                let y = this.owner.y - camera.y;
                
                // Calculate orbit position (cars circle around the player).
                // Use a time-based orbit so cars rotate independently of the player's aim.
                let orbitRadius = 80; // larger radius so it's visible
                let orbitAngle = (Date.now() / 1000) * 1.8 + this.orbitOffset; // time-based rotation
                let carOrbitX = x + Math.cos(orbitAngle) * orbitRadius;
                let carOrbitY = y + Math.sin(orbitAngle) * orbitRadius;
                
                ctx.save();
                
                // Draw the actual car model (distinct silhouettes per type)
                ctx.translate(carOrbitX, carOrbitY);
                ctx.rotate(orbitAngle + Math.PI/2);
                if (this.type === 0) {
                    // Absolut: low, long hypercar body
                    ctx.fillStyle = colors[this.type];
                    ctx.beginPath();
                    ctx.moveTo(-30, -2);
                    ctx.bezierCurveTo(-20, -8, -5, -9, 0, -9);
                    ctx.bezierCurveTo(5, -9, 20, -8, 30, -2);
                    ctx.lineTo(28, 6);
                    ctx.lineTo(2, 8);
                    ctx.lineTo(-2, 8);
                    ctx.lineTo(-28, 6);
                    ctx.closePath(); ctx.fill();
                    // cockpit
                    ctx.fillStyle = '#444'; ctx.fillRect(-12, -6, 24, 5);
                    // spoiler rear
                    ctx.fillStyle = '#222'; ctx.fillRect(-26, 6, 52, 3);
                } else if (this.type === 1) {
                    // Regera: muscular wedge, wide hips
                    ctx.fillStyle = colors[this.type];
                    ctx.beginPath();
                    ctx.moveTo(-24, 0);
                    ctx.bezierCurveTo(-14, -9, -2, -10, 0, -10);
                    ctx.bezierCurveTo(2, -10, 14, -9, 24, 0);
                    ctx.lineTo(26, 8);
                    ctx.lineTo(-26, 8);
                    ctx.closePath(); ctx.fill();
                    // windshield
                    ctx.fillStyle = '#444'; ctx.fillRect(-14, -8, 28, 5);
                    // diffuser rear
                    ctx.fillStyle = '#222'; ctx.fillRect(-24, 7, 48, 4);
                } else if (this.type === 2) {
                    // Gemera: boxy four-door, compact
                    ctx.fillStyle = colors[this.type];
                    ctx.fillRect(-22, -10, 44, 20);
                    ctx.fillStyle = '#444'; ctx.fillRect(-16, -8, 16, 7); ctx.fillRect(0, -8, 16, 7);
                    ctx.fillStyle = '#222'; ctx.fillRect(-20, 8, 40, 4);
                } else {
                    // Agera RS: sharp diamond apex, sleek
                    ctx.fillStyle = colors[this.type];
                    ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(0, -11); ctx.lineTo(28, 0); ctx.lineTo(0, 11); ctx.closePath(); ctx.fill();
                    // cockpit flat
                    ctx.fillStyle = '#444'; ctx.fillRect(-14, -6, 28, 5);
                    // rear wing
                    ctx.fillStyle = '#222'; ctx.fillRect(-20, 8, 40, 3);
                }
                    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-16, 8, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(16, 8, 4, 0, Math.PI*2); ctx.fill();
                ctx.restore();

                // Draw car name and buff text above each circling car (fade near end)
                let nameAlpha = Math.min(1, this.timer / 1.5);
                ctx.globalAlpha = nameAlpha;
                ctx.fillStyle = colors[this.type]; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
                ctx.fillText(names[this.type] || '', carOrbitX, carOrbitY - 45);
                ctx.font = 'bold 12px Arial'; ctx.fillText(buffs[this.type] || '', carOrbitX, carOrbitY - 60);
                // nitro trail behind circling Absolut
                if (this.type === 0) {
                    let backAngle = orbitAngle + Math.PI;
                    let px = this.owner.x + Math.cos(backAngle) * (orbitRadius - 20);
                    let py = this.owner.y + Math.sin(backAngle) * (orbitRadius - 20);
                    particles.push(new Particle(px + (Math.random()-0.5)*8, py + (Math.random()-0.5)*8, '#00ccff', 2, 0.4));
                }
                ctx.globalAlpha = 1.0;
            }
        }

        class CC850Minion extends Entity {
            constructor(owner, x, y, angle) {
                // bigger radius to feel like a vehicle
                super(x, y, 25, '#C0C0C0', 3000);
                this.owner = owner;
                this.angle = angle;
                this.speed = owner.baseSpd * 5; // five times Christian's walk speed
                this.dmg = 850;
                this.hp = 850;
                this.maxHp = 850;
                this.lifespan = 8; // seconds
                this.target = null;
            }
            findTarget() {
                let best = null, bestD = 1e9;
                for (let e of entities) {
                    if (!e || e === this || e === this.owner || e.dead || !(e instanceof Entity)) continue;
                    if (e.team === this.owner.team) continue;
                    let d = (e.x - this.x)**2 + (e.y - this.y)**2;
                    if (d < bestD) { bestD = d; best = e; }
                }
                return best;
            }
            takeDamage(v, src) {
                this.hp -= v;
                if (this.hp <= 0) this.die(src);
            }
            die(src) {
                // explosion particles
                for (let i=0;i<40;i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#fa0', 8, 1.0));
                // screen shake if player-owned
                if (this.owner && this.owner.isPlayer) screenShake(12);
                // ability-block stun to nearby enemies
                let abilityBlockDuration = 1.0;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.owner.team) {
                        let dx = e.x - this.x, dy = e.y - this.y;
                        if (Math.sqrt(dx*dx + dy*dy) < 100) {
                            e.applyStatus('stun', abilityBlockDuration, this.owner);
                        }
                    }
                }
                this.del = true;
            }
            update(dt) {
                this.lifespan -= dt;
                if (this.lifespan <= 0) { this.del = true; return; }
                // nitro trail for CC850
                let back = this.angle + Math.PI;
                let px = this.x + Math.cos(back) * 18;
                let py = this.y + Math.sin(back) * 18;
                particles.push(new Particle(px + (Math.random()-0.5)*6, py + (Math.random()-0.5)*6, '#00ccff', 2, 0.4));
                if (!this.target || this.target.dead) this.target = this.findTarget();
                if (this.target) {
                    let dx = this.target.x - this.x, dy = this.target.y - this.y;
                    this.angle = Math.atan2(dy, dx);
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 8) {
                        this.x += Math.cos(this.angle) * this.speed * dt;
                        this.y += Math.sin(this.angle) * this.speed * dt;
                    }
                    if (dist < this.target.radius + this.radius) {
                        if (typeof this.target.takeDamage === 'function') this.target.takeDamage(this.dmg, this.owner);
                        else if (typeof this.target.hp === 'number') { this.target.hp -= this.dmg; if (this.target.hp <= 0 && typeof this.target.die === 'function') this.target.die(this.owner); }
                        this.die(this.owner);
                    }
                } else {
                    // no target: dash forward
                    this.x += Math.cos(this.angle) * this.speed * dt;
                    this.y += Math.sin(this.angle) * this.speed * dt;
                }
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.angle);
                // hypercar body with pointed nose and spoiler
                ctx.fillStyle = '#C0C0C0';
                ctx.beginPath();
                ctx.moveTo(-24,0);
                ctx.quadraticCurveTo(-12,-10,-2,-12);
                ctx.lineTo(2,-12);
                ctx.quadraticCurveTo(12,-10,24,0);
                ctx.lineTo(20,8);
                ctx.lineTo(-20,8);
                ctx.closePath();
                ctx.fill();
                // roof windows
                ctx.fillStyle = '#444';
                ctx.fillRect(-12,-8,24,6);
                // wheels
                ctx.fillStyle = '#333';
                ctx.beginPath(); ctx.arc(-16, 8, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(16, 8, 4, 0, Math.PI*2); ctx.fill();
                // HP bar
                if (this.maxHp) {
                    let pct = Math.max(0, Math.min(1, this.hp / this.maxHp));
                    ctx.fillStyle = '#000'; ctx.fillRect(-20, -14, 40, 4);
                    ctx.fillStyle = '#0f0'; ctx.fillRect(-20, -14, 40 * pct, 4);
                }
                ctx.restore();
            }
        }

        class BlueprintZone {
            constructor(x, y, radius, duration, owner) {
                this.x = x; this.y = y; this.radius = radius; this.life = duration; this.owner = owner;
                this.activated = false; // whether owner entered once
            }
            update(dt) {
                this.life -= dt;
                if (this.life <= 0) {
                    // restore owner penetration if modified
                    if (this.owner && this.owner.penetrationBackup !== undefined) {
                        this.owner.penetration = this.owner.penetrationBackup;
                        delete this.owner.penetrationBackup;
                    }
                    // clear trapped flag from any entities still held by this zone
                    try {
                        for (let e of entities) {
                            if (e && e.trappedBy === this) {
                                e.trappedBy = null;
                            }
                        }
                    } catch (e) {}
                    this.del = true;
                    return;
                }
                if (this.owner) {
                    let dx = this.owner.x - this.x, dy = this.owner.y - this.y;
                    if (Math.sqrt(dx*dx + dy*dy) < this.radius) {
                        if (!this.activated) {
                            // grant one Q charge and shield
                            this.owner.qCharges = Math.min(this.owner.maxQCharges, this.owner.qCharges + 1);
                            this.owner.shield += 900;
                            this.activated = true;
                        }
                        if (this.owner.penetrationBackup === undefined) {
                            this.owner.penetrationBackup = this.owner.penetration;
                        }
                        this.owner.penetration = 1;
                    } else if (this.owner.penetrationBackup !== undefined) {
                        this.owner.penetration = this.owner.penetrationBackup;
                        delete this.owner.penetrationBackup;
                    }
                }
                // trap enemies that enter the blueprint area so they cannot escape
                try {
                    for (let e of entities) {
                        if (!e || e.dead) continue;
                        if (!(e instanceof Entity)) continue;
                        // only trap enemies (not the owner and not same team)
                        if (this.owner && e === this.owner) continue;
                        if (this.owner && e.team === this.owner.team) continue;
                        let dx = e.x - this.x, dy = e.y - this.y;
                        // use square bounds (blueprint is drawn as a square)
                        if (Math.abs(dx) <= this.radius && Math.abs(dy) <= this.radius) {
                            // mark entity as trapped by this zone
                            if (e.trappedBy !== this) {
                                e.trappedBy = this;
                                // brief reveal so player can see trapped targets
                                try { e.revealTimer = Math.max(e.revealTimer || 0, 0.5); } catch(_) {}
                            }
                        }
                    }
                } catch (e) {}
            }
            draw(ctx) {
                // Draw a squared blueprint area with subtle grid lines
                let cx = this.x - camera.x, cy = this.y - camera.y;
                let s = this.radius * 2;
                let half = s / 2;
                ctx.save();
                ctx.translate(cx, cy);
                // outer frame
                ctx.strokeStyle = 'rgba(0,255,255,0.9)';
                ctx.lineWidth = 4;
                ctx.strokeRect(-half, -half, s, s);
                // inner grid lines
                ctx.strokeStyle = 'rgba(0,200,200,0.35)';
                ctx.lineWidth = 1;
                let step = Math.max(20, Math.floor(this.radius / 4));
                for (let gx = -half + step; gx < half; gx += step) {
                    ctx.beginPath(); ctx.moveTo(gx, -half); ctx.lineTo(gx, half); ctx.stroke();
                }
                for (let gy = -half + step; gy < half; gy += step) {
                    ctx.beginPath(); ctx.moveTo(-half, gy); ctx.lineTo(half, gy); ctx.stroke();
                }
                // corner blueprint marks
                ctx.strokeStyle = 'rgba(0,255,255,0.9)'; ctx.lineWidth = 3;
                let mark = 12;
                // top-left
                ctx.beginPath(); ctx.moveTo(-half, -half + mark); ctx.lineTo(-half, -half); ctx.lineTo(-half + mark, -half); ctx.stroke();
                // top-right
                ctx.beginPath(); ctx.moveTo(half, -half + mark); ctx.lineTo(half, -half); ctx.lineTo(half - mark, -half); ctx.stroke();
                // bottom-left
                ctx.beginPath(); ctx.moveTo(-half, half - mark); ctx.lineTo(-half, half); ctx.lineTo(-half + mark, half); ctx.stroke();
                // bottom-right
                ctx.beginPath(); ctx.moveTo(half, half - mark); ctx.lineTo(half, half); ctx.lineTo(half - mark, half); ctx.stroke();
                ctx.restore();
            }
        }

        // CHRISTIAN - reckless summoner / speedster hero
        class Christian extends Entity {
            constructor(x, y, p) {
                super(x, y, 24, p ? '#FFAA00' : '#DD8800', 6000);  // yellow/red hybrid for Christian
                this.isPlayer = p;
                this.countsAsFFAHero = true;
                this.name = p ? 'Player (Christian)' : 'Enemy Christian';
                this.currentSkin = 'default';
                this.skinIcon = null;
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0;
                this.qCharges = 4; this.maxQCharges = 4; this.qChargeTimer = 0;
                this.gCharges = 0; this.maxGCharges = 1; this.gChargeTimer = 0;
                this.baseSpd = 280; this.speed = this.baseSpd;
                this.angle = 0;
                this.activeCar = null;
                this.carEffects = []; // track all recently summoned cars for orbit visuals
                this.ageraSlowTimer = 0;
                this.invisTimer = 0;
                // nitro particle timer for Absolut player model
                this.nitroTimer = 0;
                // E dash state
                this.dashing = false; this.dashTimer = 0; this.dashDuration = 0.4; this.dashDir = 0;
                // gear integration
                this.gear = 'speedster'; this.rCD = 0; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
            }
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.gCD > 0) this.gCD -= dt;
                // qBlock is removed (instant multi-Q allowed)
                if (this.invisTimer > 0) this.invisTimer -= dt;
                if (this.ageraSlowTimer > 0) this.ageraSlowTimer -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;
                // apply speed buff ONLY when Absolut active, then reset
                // determine if any Absolut car still active (not necessarily the last one)
                // buff only while assigned Absolut effect is still alive
                let absolutActive = this.activeAbsolut && this.activeAbsolut.timer > 0;
                if (absolutActive) {
                    this.speed = this.baseSpd * 4;
                } else {
                    this.speed = this.baseSpd;
                }
                // E dash movement
                if (this.dashing) {
                    this.dashTimer -= dt;
                    let moveAmount = 400 * (dt / this.dashDuration);
                    this.x += Math.cos(this.dashDir) * moveAmount;
                    this.y += Math.sin(this.dashDir) * moveAmount;
                    if (this.dashTimer <= 0) this.dashing = false;
                }
                // nitro particles behind Absolut player
                if (this.nitroTimer > 0) this.nitroTimer -= dt;
                if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
                if (absolutActive && this.nitroTimer <= 0) {
                    // spawn a small blue flame behind
                    let back = this.angle + Math.PI;
                    let px = this.x + Math.cos(back) * 20;
                    let py = this.y + Math.sin(back) * 20;
                    particles.push(new Particle(px + (Math.random()-0.5)*6, py + (Math.random()-0.5)*6, '#00ccff', 2, 0.4));
                    this.nitroTimer = 0.05;
                }
                // tick all summoned cars and remove expired ones
                for (let i = this.carEffects.length - 1; i >= 0; i--) {
                    let c = this.carEffects[i];
                    c.update(dt);
                    if (c.timer <= 0) {
                        // clear reference if the Absolut we cared about died
                        if (c === this.activeAbsolut) this.activeAbsolut = null;
                        this.carEffects.splice(i, 1);
                    }
                }
                this.activeCar = this.carEffects[this.carEffects.length - 1] || null;
                if (this.qCharges < this.maxQCharges) {
                    this.qChargeTimer += dt;
                    if (this.qChargeTimer >= 5) {
                        this.qChargeTimer -= 5;
                        this.qCharges = Math.min(this.maxQCharges, this.qCharges + 1);
                    }
                }
                if (this.isPlayer) {
                    let spd = this.getEffectiveSpeed();
                    this.input(dt, spd);
                    updateHUD(this);
                }
            }
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--; if (keys.s) dy++; if (keys.a) dx--; if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x; this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) { this.fireBasic(); }
                if (keys.q && this.qCharges > 0) this.useQ();
                if (keys.e && this.eCD <= 0) this.useE();
                if (keys.r && this.rCD <= 0) this.useGear();
                if (keys.f && this.fCD <= 0) this.useF();
                if (keys.g && this.gCD <= 0 && this.gCharges > 0) this.useG();
            }
            fireBasic() {
                if(this.isPlayer){
                    let sounds=getSkinSounds('christian',this.currentSkin);
                    if(sounds&&sounds.basic){let audio=new Audio(sounds.basic);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}
                    if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                        onlineSocket.emit('abilitySound',{ability:'basic',x:this.x,y:this.y,heroType:'christian',skin:this.currentSkin});
                    }
                }
                let proj = new Projectile(this, this.x, this.y, this.angle, 1200, 100, 1200, '#ffffff', 6, false, true, false, 0, 0, false, 0);
                // If player has Regera invis, make this projectile visible to owner only
                if (this.invisTimer > 0) proj.invisible = 'ownerOnly';
                entities.push(proj);
                // reduce basic cooldown if any Gemera car is active
                let gemeraActive = this.carEffects.some(c => c.type === 2);
                this.basicCD = gemeraActive ? 0.3 : 0.5;
                // network visual
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.christian = { ability: 'basic', x: this.x, y: this.y, timestamp: Date.now() };
            }
            useQ() {
                if (this.qCharges <= 0) return;
                if(this.isPlayer){
                    let sounds=getSkinSounds('christian',this.currentSkin);
                    if(sounds&&sounds.q){let audio=new Audio(sounds.q);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}
                    if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                        onlineSocket.emit('abilitySound',{ability:'q',x:this.x,y:this.y,heroType:'christian',skin:this.currentSkin});
                    }
                }
                this.qCharges--;
                // choose a car type that isn't currently active to avoid duplicates
                const allTypes = [0,1,2,3];
                let availableTypes = allTypes.filter(t => !this.carEffects.some(c => c.type === t));
                if (availableTypes.length === 0) {
                    // if all four cars are already present, then fallback to any type
                    availableTypes = allTypes;
                }
                let type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                let newCar = new CarEffect(this, type);
                this.carEffects.push(newCar);
                this.activeCar = newCar;
                if (type === 0) {
                    // remember this specific Absolut instance for buff duration
                    this.activeAbsolut = newCar;
                }
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.christian = { ability: 'useQ', carType: type, x: this.x, y: this.y, timestamp: Date.now() };
                // floating text for summoned car (Absolut and others)
                particles.push(new FloatingText(this.x, this.y - this.radius - 20, ['Jesko Absolut','Koenigsegg Regera','Koenigsegg Gemera','Koenigsegg Agera RS'][type] || '', '#fff', 1.5));
            }
            useE() {
                if(this.isPlayer){
                    let sounds=getSkinSounds('christian',this.currentSkin);
                    if(sounds&&sounds.e){let audio=new Audio(sounds.e);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}
                    if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                        onlineSocket.emit('abilitySound',{ability:'e',x:this.x,y:this.y,heroType:'christian',skin:this.currentSkin});
                    }
                }
                this.eCD = 5;
                this.hp = Math.min(this.maxHp, this.hp + 200);
                // start smooth dash instead of instant teleport
                this.dashing = true;
                this.dashTimer = this.dashDuration;
                this.dashDir = this.angle;
                this.invincibleTimer = this.dashDuration; // invulnerable during dash
                if (this.isPlayer) screenShake(5);
                // slow Q recharge rather than speed it
                this.qChargeTimer += 1;
                // dash particle trail
                for(let i = 0; i < 5; i++) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*30, this.y + (Math.random()-0.5)*30, '#0f0', 2, 0.3));
                }
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.christian = { ability: 'useE', x: this.x, y: this.y, timestamp: Date.now() };
            }
            useF() {
                if(this.isPlayer){
                    let sounds=getSkinSounds('christian',this.currentSkin);
                    if(sounds&&sounds.f){let audio=new Audio(sounds.f);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}
                    if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                        onlineSocket.emit('abilitySound',{ability:'f',x:this.x,y:this.y,heroType:'christian',skin:this.currentSkin});
                    }
                }
                this.fCD = 8;
                let minion = new CC850Minion(this, this.x, this.y, this.angle);
                entities.push(minion);
                this.gCharges = Math.min(this.maxGCharges, this.gCharges + 1);
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.christian = { ability: 'useF', x: this.x, y: this.y, timestamp: Date.now() };
            }
            useG() {
                if (this.gCharges <= 0 || this.gCD > 0) return;
                if(this.isPlayer){
                    let sounds=getSkinSounds('christian',this.currentSkin);
                    if(sounds&&sounds.g){let audio=new Audio(sounds.g);audio.volume=0.4;audio.play().catch(e=>console.log('Sound failed:',e));}
                    if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                        onlineSocket.emit('abilitySound',{ability:'g',x:this.x,y:this.y,heroType:'christian',skin:this.currentSkin});
                    }
                }
                this.gCharges--;
                let zone = new BlueprintZone(this.x + Math.cos(this.angle) * 100, this.y + Math.sin(this.angle) * 100, 250, 3, this);
                entities.push(zone);
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.christian = { ability: 'useG', x: this.x, y: this.y, timestamp: Date.now() };
            }
            getDamageMult() { return this.rageTimer > 0 ? 1.1 : 1; }
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.slowTimer > 0) s *= 0.6;
                if (this.speedsterTimer > 0) s *= 1.5;
                return s;
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            ai(dt, spd) {
                if(this.dead) return;
                if(this.handleSafeZone && this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                this.angle = Math.atan2(dy, dx);
                // Movement towards target if not too close
                if(d > 200) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                // Attack conditions
                if(this.basicCD <= 0 && d < 600) this.fireBasic();
                if(this.qCharges > 0 && this.qBlock <= 0 && Math.random() < 0.02) this.useQ();
                if(this.eCD <= 0 && d < 400) this.useE();
                if(this.fCD <= 0 && d < 800) this.useF();
                if(this.rCD <= 0 && Math.random() < 0.01) this.useGear();
                if(this.gCharges > 0 && d < 300) this.useG();
            }
            draw(ctx) {
                if(this.currentSkin !== 'default') {
                    if(drawSkinImage(ctx, this, 'christian', this.currentSkin, '#facc15', { filter: 'brightness(0.9) saturate(0.9)', alpha: 0.96 })) {
                        ctx.shadowBlur = 0;
                    } else {
                        // if Jesko Absolut effect is active, transform player appearance
                        let absolutActiveDraw = this.activeAbsolut && this.activeAbsolut.timer > 0;
                        if (absolutActiveDraw) {
                            let x = this.x - camera.x;
                            let y = this.y - camera.y;
                            ctx.save();
                            ctx.translate(x, y);
                            ctx.rotate(this.angle);
                            ctx.fillStyle = '#000000';
                            ctx.beginPath();
                            ctx.moveTo(-30, -2);
                            ctx.bezierCurveTo(-20, -8, -5, -9, 0, -9);
                            ctx.bezierCurveTo(5, -9, 20, -8, 30, -2);
                            ctx.lineTo(28, 6);
                            ctx.lineTo(2, 8);
                            ctx.lineTo(-2, 8);
                            ctx.lineTo(-28, 6);
                            ctx.closePath();
                            ctx.fill();
                            ctx.fillStyle = '#444';
                            ctx.fillRect(-12, -6, 24, 5);
                            ctx.fillStyle = '#222';
                            ctx.fillRect(-26, 6, 52, 3);
                            ctx.fillStyle = '#222';
                            ctx.beginPath(); ctx.arc(-16, 8, 4, 0, Math.PI*2); ctx.fill();
                            ctx.beginPath(); ctx.arc(16, 8, 4, 0, Math.PI*2); ctx.fill();
                            ctx.restore();
                        } else {
                            super.draw(ctx);
                        }
                    }
                } else {
                    // if Jesko Absolut effect is active, transform player appearance
                    let absolutActiveDraw = this.activeAbsolut && this.activeAbsolut.timer > 0;
                    if (absolutActiveDraw) {
                        let x = this.x - camera.x;
                        let y = this.y - camera.y;
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(this.angle);
                        ctx.fillStyle = '#000000';
                        ctx.beginPath();
                        ctx.moveTo(-30, -2);
                        ctx.bezierCurveTo(-20, -8, -5, -9, 0, -9);
                        ctx.bezierCurveTo(5, -9, 20, -8, 30, -2);
                        ctx.lineTo(28, 6);
                        ctx.lineTo(2, 8);
                        ctx.lineTo(-2, 8);
                        ctx.lineTo(-28, 6);
                        ctx.closePath();
                        ctx.fill();
                        ctx.fillStyle = '#444';
                        ctx.fillRect(-12, -6, 24, 5);
                        ctx.fillStyle = '#222';
                        ctx.fillRect(-26, 6, 52, 3);
                        ctx.fillStyle = '#222';
                        ctx.beginPath(); ctx.arc(-16, 8, 4, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(16, 8, 4, 0, Math.PI*2); ctx.fill();
                        ctx.restore();
                    } else {
                        super.draw(ctx);
                    }
                }
                ctx.beginPath();
                ctx.moveTo(this.x - camera.x, this.y - camera.y);
                ctx.lineTo((this.x - camera.x) + Math.cos(this.angle) * (this.radius + 10), (this.y - camera.y) + Math.sin(this.angle) * (this.radius + 10));
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
                // draw any summoned cars circling around
                if (this.carEffects && this.carEffects.length > 0) {
                    for (let car of this.carEffects) {
                        car.draw(ctx);
                    }
                }
            }
        }
        class Faik extends Entity {
            constructor(x, y, p) {
                super(x, y, 22, p ? '#8B0000' : '#4B0000', 8200);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Faik)' : 'Enemy Faik';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 250; this.speed = this.baseSpd;

                // Q dash state (3-stage short dash)
                this.qStage = 0; // 0 = ready, 1/2/3 = dash stage
                this.qWindow = 0; // 0.5s to press next dash
                this.qDashing = false; this.qDashTimer = 0; this.qDashDir = 0;
                this.qHitSet = new Set();

                // E ability
                this.eCD = 0; // sword energy

                // F ultimate - Blood Rage
                this.fActive = false; this.fTimer = 0; this.enhancedTimer = 0;
                this.speedBoostTimer = 0; // Speed buff timer for Blood Rage

                // Gear properties
                this.gear = 'speedster'; this.rCD = 0; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;

                // Tracking for HUD visuals
                this.abilityVisuals = this.abilityVisuals || {};
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;

                // Dash window timer (allow chaining)
                if (this.qWindow > 0) {
                    this.qWindow -= dt;
                    if (this.qWindow <= 0 && this.qStage > 0 && !this.qDashing) {
                        // sequence expired
                        this.qStage = 0;
                        this.qCD = 7.0;
                        this.qWindow = 0;
                        this.qHitSet.clear();
                    }
                }

                // Handle dash movement
                if (this.qDashing) {
                    this.qDashTimer -= dt;
                    let dashSpeed = 1200; // fast short dash
                    this.x += Math.cos(this.qDashDir) * dashSpeed * dt;
                    this.y += Math.sin(this.qDashDir) * dashSpeed * dt;

                    // Damage enemies during dash (only once per dash)
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && !this.qHitSet.has(e)) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 100) {
                                let dmg = (this.qStage < 3) ? 250 : 400;
                                e.takeDamage(dmg, this);
                                this.qHitSet.add(e);
                                // On third dash apply knockback
                                if (this.qStage === 3) {
                                    e.x += Math.cos(this.qDashDir) * 120;
                                    e.y += Math.sin(this.qDashDir) * 120;
                                }
                            }
                        }
                    }

                    if (this.qDashTimer <= 0) {
                        this.qDashing = false;
                        this.qDashTimer = 0;
                        // open 1.2s window to chain next dash
                        if (this.qStage > 0 && this.qStage < 3) {
                            this.qWindow = 2.5;
                        } else if (this.qStage === 3) {
                            // finished full combo
                            this.qStage = 0;
                            this.qCD = 7.0;
                            this.qWindow = 0;
                            this.qHitSet.clear();
                        }
                    }
                }

                // Blood rage timer
                if (this.fActive) {
                    this.fTimer -= dt;
                    this.enhancedTimer = Math.max(0, this.fTimer);
                    if (this.fTimer <= 0) {
                        this.fActive = false;
                        this.enhancedTimer = 0;
                    }
                }

                // Speed boost timer (for Blood Rage)
                if (this.speedBoostTimer > 0) {
                    this.speedBoostTimer -= dt;
                    if (this.speedBoostTimer <= 0) {
                        this.speed = this.baseSpd;
                    } else {
                        this.speed = this.baseSpd * 1.5;
                    }
                }

                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }

            input(dt, spd) {
                let dx = 0, dy = 0;
                if (!this.qDashing) {
                    if (keys.w) dy--;
                    if (keys.s) dy++;
                    if (keys.a) dx--;
                    if (keys.d) dx++;
                }
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x; this.y += m.y;
                }

                if (!this.qDashing) this.angle = getMouseAimAngle(this.x, this.y);

                // R - gear
                if (keys.r && this.rCD <= 0) this.useGear();

                // E - sword energy (prioritize)
                if (keys.e && this.eCD <= 0) {
                    this.doE();
                    return;
                }

                // F - blood rage
                if (keys.f && this.fCD <= 0) this.doF();

                // Q - three-stage dash
                if (keys.q) {
                    if (this.qStage === 0 && this.qCD <= 0 && !this.qDashing) {
                        this._performDash(1);
                    } else if ((this.qStage === 1 || this.qStage === 2) && this.qWindow > 0 && !this.qDashing) {
                        this._performDash(this.qStage + 1);
                    }
                }

                // Basic attack - enhanced during blood rage, normal otherwise
                if (mouse.down && this.basicCD <= 0 && !this.qDashing) {
                    this.basicAttack();
                }
            }

            basicAttack() {
                this.revealTimer = 0.5;
                if (this.fActive) {
                    // enhanced basic during blood rage
                    this.basicCD = 0.2;
                    let dmg = 70;
                    // Visual particles for enhanced basic attack
                    particles.push(new SwordTrail(this.x, this.y, this.angle, 250, 0.35, '#FF4444'));
                    for (let i = 0; i < 10; i++) {
                        let angle = this.angle + (Math.random() - 0.5) * 0.6;
                        particles.push(new Particle(this.x + Math.cos(angle) * 170, this.y + Math.sin(angle) * 170, '#FF0000', 5, 0.4));
                    }
                    let damageDealt = 0;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 250) {
                                e.takeDamage(dmg, this);
                                damageDealt += dmg;
                            }
                        }
                    }
                    // heal 50% of damage dealt while blood rage active
                    let heal = damageDealt * 0.5;
                    this.hp = Math.min(this.maxHp, this.hp + heal);
                } else {
                    this.basicCD = 1.5;
                    let dmg = 200;
                    particles.push(new Slash(this.x, this.y, this.angle, 150, Math.PI/1.5, '#c0c0c0'));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 150) e.takeDamage(dmg, this);
                        }
                    }
                }

                // broadcast ability visual for basic attack (so remote clients can show effects)
                this.abilityVisuals = this.abilityVisuals || {};
                this.abilityVisuals.faik = this.abilityVisuals.faik || {};
                this.abilityVisuals.faik.basic = { enhanced: this.fActive, x: this.x, y: this.y, angle: this.angle, timestamp: Date.now() };
            }

            _performDash(stage) {
                this.qStage = stage;
                this.qDashing = true;
                this.qDashTimer = 0.18;
                this.qDashDir = this.angle;
                this.qHitSet = new Set();
                // visual particles for dash
                for (let i = 0; i < 12; i++) {
                    let angle = this.qDashDir + (Math.random() - 0.5) * Math.PI / 3;
                    particles.push(new Particle(this.x, this.y, '#FF6666', 4, 0.4, Math.cos(angle) * 150, Math.sin(angle) * 150));
                }
                this.abilityVisuals.faik = this.abilityVisuals.faik || {};
                this.abilityVisuals.faik.dash = { stage: stage, timer: 0.25, x: this.x, y: this.y };
            }

            doE() {
                // Sword energy: deals 700 damage, heal 40% of damage dealt
                this.revealTimer = 1.0;
                let totalDamage = 0;
                const R = 220;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < R) {
                            e.takeDamage(700, this);
                            e.applyStatus('stun', 0.5, this); // 0.5s stun
                            totalDamage += 700;
                        }
                    }
                }
                let heal = totalDamage * 0.4;
                this.hp = Math.min(this.maxHp, this.hp + heal);
                this.eCD = 5.0;
                // visual particles - sword energy burst
                particles.push(new SpinningRing(this.x, this.y, 220, '#FFD700', 0.6, 12, 8));
                for (let i = 0; i < 20; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle) * 120, this.y + Math.sin(angle) * 120, '#FFD700', 5, 0.5));
                }
                this.abilityVisuals.faik = this.abilityVisuals.faik || {};
                this.abilityVisuals.faik.e = { x: this.x, y: this.y, timer: 0.6 };
            }

            doF() {
                // Blood Rage: deals 300 to nearby enemies and heals 100% of damage dealt by this activation
                const R = 200;
                let damageDealt = 0;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < R) {
                            e.takeDamage(300, this);
                            damageDealt += 300;
                        }
                    }
                }
                // Heal 100% of damage dealt by the rage activation
                this.hp = Math.min(this.maxHp, this.hp + damageDealt);
                // Activate enhanced basic attack for duration
                this.fActive = true; this.fTimer = 8.0; this.enhancedTimer = 8.0;
                this.speedBoostTimer = 8.0; // Speed buff for 8 seconds (1.5x)
                this.speed = this.baseSpd * 1.5; // Apply speed boost immediately
                this.fCD = 22.0;
                // visual particles - blood rage aura burst
                particles.push(new WaveShockwave(this.x, this.y, 250, 0.6, '#FF0000', '#8B0000'));
                for (let i = 0; i < 25; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 80 + Math.random() * 100;
                    particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, '#FF4444', 5, 0.6));
                }
                this.abilityVisuals.faik = this.abilityVisuals.faik || {};
                this.abilityVisuals.faik.f = { x: this.x, y: this.y, timer: 8.0 };
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random()-0.5)*0.2;
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 180) { this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt; }
                if (d < 140 && this.basicCD <= 0) this.basicAttack();
                if (d < 300 && this.qCD <= 0 && this.qStage === 0) this._performDash(1);
                if (d < 220 && this.eCD <= 0) this.doE();
                if (d < 120 && this.fCD <= 0) this.doF();
            }

            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }
        class Fletcher extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#228B22' : '#2e8b57', 4500);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Fletcher)' : 'Enemy Fletcher';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0;
                this.baseSpd = 260; this.speed = this.baseSpd;

                // E (Pro Sniper) charges
                this.eCharges = 3;
                this.maxECharges = 3;
                this.eChargeCD = 0;
                this.eCharging = false; // holding E (zoom)

                // Ultimate redirect flag (next E will redirect if true)
                this.ultRedirect = false;

                // Camera zoom helper used while holding E
                this.cameraZoomTimer = 0;
                // Temporary movement buff timer applied by Q (radar). 1.5x base speed while >0
                this.speedBoostTimer = 0;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;

                // regenerate E charges
                if (this.eChargeCD > 0) this.eChargeCD -= dt;
                if (this.eChargeCD <= 0 && this.eCharges < this.maxECharges) {
                    this.eCharges++;
                    if (this.eCharges < this.maxECharges) this.eChargeCD = 10;
                }

                if (this.cameraZoomTimer > 0) this.cameraZoomTimer -= dt;

                // Handle temporary speed boost granted by Q (radar)
                if (this.speedBoostTimer > 0) {
                    this.speedBoostTimer -= dt;
                    if (this.speedBoostTimer > 0) {
                        this.speed = this.baseSpd * 1.5; // +50% walkspeed
                    } else {
                        this.speed = this.baseSpd;
                        this.speedBoostTimer = 0;
                    }
                } else {
                    this.speed = this.baseSpd;
                }

                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                    this.x += m.x; this.y += m.y;
                }

                this.angle = getMouseAimAngle(this.x, this.y);

                if (mouse.down && this.basicCD <= 0) this.basicAtk();

                // Q - Radar
                if (keys.q && this.qCD <= 0) this.doQ();

                // E - Hold to zoom, release to fire (charge-based)
                // enforce short post-use lock (this.eCD) so player can't immediately consume multiple charges
                if (keys.e && this.eCharges > 0 && !this.eCharging && this.eCD <= 0) {
                    this.eCharging = true;
                    this.cameraZoomTimer = 0.8; // visible zoom while holding
                }
                // on release -> fire sniper
                if (!keys.e && this.eCharging) {
                    this.eCharging = false;
                    this.cameraZoomTimer = 0;
                    this.fireE();
                }

                // F - Ultimate (F key)
                if (keys.f && this.fCD <= 0) this.doF();
            }

            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 1.2;
                // slightly larger basic projectile for better sniper feel
                let proj = new Projectile(this, this.x, this.y, this.angle, 1400, 180, 1200, '#88ccff', 8);
                entities.push(proj);
            }

            doQ() {
                this.qCD = 13.0;
                this.revealTimer = 1.0;
                const R = 1200;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                    if (d < R) {
                        // use applyStatus so online proxies receive the reveal/slow
                        e.applyStatus('reveal', 10, this);
                        e.applyStatus('slow', 3.0, this); // Slowness III for 3s
                    }
                }

                // Radar visual ping (abilityVisuals consumed by renderer)
                this.abilityVisuals = this.abilityVisuals || {};
                // add sweep + pulses so renderer can animate a true radar sweep
                this.abilityVisuals.fletcher = { radarPing: { x: this.x, y: this.y, radius: R, timer: 1.0, sweep: 0, pulses: 3 } };

                // Grant Fletcher a short movement buff so radar can be used for solo cap / escape
                this.speedBoostTimer = 3.0; // 3 seconds
                this.speed = this.baseSpd * 1.5; // immediate apply (+50%)
                // small visual to show self-buff
                this.abilityVisuals.fletcher.speed = { timer: 3.0 };

                for (let i=0;i<12;i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#FFD700', 4, 0.6));
                if (this.isPlayer) addKillMsg('Radar — +50% speed for 3s');
            }

            fireE() {
                // consume a charge
                if (this.eCharges <= 0) return;
                this.eCharges--;
                if (this.eCharges < this.maxECharges) this.eChargeCD = 10;

                // immediate use-lock so player must wait 2s before using next charge
                this.eCD = Math.max(this.eCD || 0, 2.0);

                // capture aiming angle at release
                const aimAngle = this.angle;
                const caster = this;



                // if ultimate flagged, redirect to closest enemy within 250
                let redirectedTarget = null;
                if (this.ultRedirect) {
                    let best = null, md = 99999;
                    for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 250 && d < md) { md = d; best = e; }
                    }
                    if (best) redirectedTarget = best;
                }

                // FIRE IMMEDIATELY on release (no delayed impact)
                if (redirectedTarget && !redirectedTarget.dead) {
                    // redirected E should deal full 1500 damage (match projectile)
                    redirectedTarget.takeDamage(1500, caster, { isProSniper: true });
                    redirectedTarget.revealTimer = 1.0;
                    for (let i=0;i<6;i++) particles.push(new Particle(redirectedTarget.x + (Math.random()-0.5)*20, redirectedTarget.y + (Math.random()-0.5)*20, '#00ffff', 5, 0.6));
                    if (caster.isPlayer) screenShake(12);

                    // If online, notify server and mark this as a Pro Sniper hit so server enforces Pro‑Sniper rule (client hit = 1500)
                    try {
                        if (gameMode && gameMode.includes('online') && typeof onlineSocket !== 'undefined' && onlineSocket && caster.isPlayer) {
                            if (redirectedTarget === player) {
                                onlineSocket.emit('playerDamaged', {
                                    socketId: player.socketId || mySocketId || onlineSocket.id,
                                    damageTaken: 1500,
                                    damageDealer: caster.name || 'Fletcher',
                                    attackerSocketId: mySocketId || onlineSocket.id,
                                    isProSniper: true
                                });
                            } else if (redirectedTarget instanceof OnlinePlayerProxy) {
                                onlineSocket.emit('playerDamaged', {
                                    socketId: redirectedTarget.socketId,
                                    damageTaken: 1500,
                                    damageDealer: caster.name || 'Fletcher',
                                    attackerSocketId: mySocketId || onlineSocket.id,
                                    isProSniper: true
                                });
                            }
                        }
                    } catch (err) { console.warn('Damage broadcast failed:', err); }
                } else {
                    // immediate, high-visibility sniper projectile (bigger + impact particles)
                    // projectile damage set to 1500 (actual); UI description shows 2250
                    let proj = new Projectile(caster, caster.x + Math.cos(aimAngle)*30, caster.y + Math.sin(aimAngle)*30, aimAngle, 3000, 1500, 2000, '#00ffff', 30, false, false, true);
                    // mark for special visuals/effects
                    proj.isProSniper = true;
                    proj.trail = true;
                    proj.onHit = (target) => {
                        target.revealTimer = 1.0;
                        for (let i=0;i<8;i++) particles.push(new Particle(target.x + (Math.random()-0.5)*30, target.y + (Math.random()-0.5)*30, '#00ffff', 5, 0.8));
                        // additional cyan burst + stronger feel
                        for (let i=0;i<12;i++) particles.push(new Particle(target.x + (Math.random()-0.5)*40, target.y + (Math.random()-0.5)*40, '#00ffff', 6, 1.0));
                        if (caster.isPlayer) screenShake(10);
                    };
                    entities.push(proj);
                    if (caster.isPlayer) screenShake(12);
                }

                // reset ultimate redirect after use
                this.ultRedirect = false;
            }

            doF() {
                this.fCD = 17.0;
                this.shield += 450;
                this.eCharges = Math.min(this.maxECharges, this.eCharges + 1);
                this.ultRedirect = true; // next E will redirect if enemy in 150 radius
                for (let i=0;i<12;i++) particles.push(new Particle(this.x + (Math.random()-0.5)*30, this.y + (Math.random()-0.5)*30, '#00ffcc', 4, 0.6));
                if (this.isPlayer) addKillMsg('Fortified Shot ready');
            }

            ai(dt, spd) {
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx) + (Math.random()-0.5)*0.05;
                let d = Math.sqrt(dx*dx + dy*dy);

                // keep medium/long range
                if (d > 900) { this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt; }
                else {
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.eCharges > 0 && Math.random() < 0.07) { this.eCharging = true; this.fireE(); }
                    if (this.qCD <= 0 && Math.random() < 0.03) this.doQ();
                    if (this.fCD <= 0 && this.eCharges < this.maxECharges && Math.random() < 0.02) this.doF();
                }
            }
        }

        // DARRICK - new marksman hero
