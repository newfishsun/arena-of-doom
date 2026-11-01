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

