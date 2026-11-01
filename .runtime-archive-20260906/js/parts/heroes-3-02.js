        class Twins extends Entity {
            constructor(x, y, p) {
                super(x, y, 22, p ? '#FF1493' : '#FF69B4', 6000);
                this.isPlayer = p || false;
                this.name = p ? 'Player (The Twins)' : 'Enemy Twins';
                this.countsAsFFAHero = true;
                
                // Twin state: 'ken', 'matthew', or 'matten' (fused)
                this.twinState = 'ken';
                this.originalState = 'ken';
                this.fusionBar = 0;
                this.maxFusionBar = 100;
                this.fusionActive = false;
                this.fusionTimer = 0;
                this.maxFusionDuration = 20;
                
                // Cooldowns
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                
                // Knockback tracking
                this.knockbackX = 0;
                this.knockbackY = 0;
                this.knockbackDuration = 0;
                
                this.baseSpd = 260;
                this.speed = this.baseSpd;
                this.angle = 0;
                this.damageReduction = 0;
                
                // Gear
                this.gear = 'speedster';
                this.rageTimer = 0;
                this.speedsterTimer = 0;
                this.bandageTimer = 0;
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
                
                // Knockback
                if (this.knockbackDuration > 0) {
                    this.x += this.knockbackX * dt;
                    this.y += this.knockbackY * dt;
                    this.knockbackDuration -= dt;
                }
                
                // Fusion bar charge
                if (!this.fusionActive) {
                    this.fusionBar = Math.min(this.maxFusionBar, this.fusionBar + dt * 2);
                }
                
                // Fusion duration
                if (this.fusionActive) {
                    this.fusionTimer -= dt;
                    if (this.fusionTimer <= 0) {
                        this.quitFusion();
                    }
                }
                
                // Speed boost from tag switch
                if (this.speedsterTimer > 0) {
                    this.speedsterTimer -= dt;
                    if (this.speedsterTimer <= 0) {
                        this.speed = this.fusionActive ? this.baseSpd * 1.3 : this.baseSpd;
                    }
                }
                
                // Gear timers
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                if (this.isPlayer) {
                    this.input(dt, this.speed);
                    if (player === this) updateHUD(this);
                } else this.ai(dt, this.speed);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(this.getEffectiveSpeed() * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) {
                    this.basicKick();
                    this.basicCD = this.fusionActive ? 0.5 : 0.8;
                }
                if (keys.q && this.qCD <= 0) this.abilityQ();
                if (keys.e && this.eCD <= 0) this.abilityE();
                if (keys.f && this.fCD <= 0) this.abilityF();
                if (keys.g && this.gCD <= 0 && !this.fusionActive) this.abilityG();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicKick() {
                const dmg = this.fusionActive ? 140 : 120;
                let color = this.twinState === 'ken' ? '#FF6B6B' : this.twinState === 'matthew' ? '#4ECDC4' : '#FFD700';
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 120) {
                            e.takeDamage(dmg, this);
                            for (let i = 0; i < 8; i++) {
                                particles.push(new Particle(e.x + (Math.random()-0.5)*60, e.y + (Math.random()-0.5)*60, color, 6, 1.2));
                            }
                            // Add energy burst
                            for (let i = 0; i < 5; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                particles.push(new Particle(e.x + Math.cos(angle) * 40, e.y + Math.sin(angle) * 40, color, 4, 1.0));
                            }
                        }
                    }
                }
            }
            
            abilityQ() {
                if (this.twinState === 'ken' || this.fusionActive) {
                    // KEN Q: Football Shot 1000 damage, injure 10s
                    if (this.fusionActive) {
                        // Matten Q: 300 + 200 true damage, stun 0.5s, injure 12s
                        // Add massive golden energy blast and shockwave
                        visualEffects.push(new EnergyBlast(this.x, this.y, this.angle, 1000, '#FFD700', 50, 3.0));
                        visualEffects.push(new ShockwaveRing(this.x, this.y, '#FFD700', 500, 1.5, 20));
                        for (let e of entities) {
                            if (e !== this && !e.dead && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 500) {
                                    e.takeDamage(300, this);
                                    e.takeDamage(200, this, true);
                                    e.applyStatus('stun', 0.5, this);
                                    e.applyStatus('injure', 12, this);
                                    for (let i = 0; i < 8; i++) {
                                        particles.push(new Particle(e.x + Math.cos(i*Math.PI/4)*50, e.y + Math.sin(i*Math.PI/4)*50, '#FFD700', 7, 1.5));
                                    }
                                }
                            }
                        }
                        // Add golden football trail particles
                        for (let i = 0; i < 15; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            let dist = Math.random() * 100;
                            particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, '#FFD700', 6, 2.0));
                        }
                        this.qCD = 2;
                    } else {
                        // Ken Q: Football Shot 1000 damage, injure 10s
                        // Add VISIBLE shockwave effect
                        visualEffects.push(new ShockwaveRing(this.x, this.y, '#FF6B6B', 400, 1.2, 14));
                        // Add VISIBLE energy blast
                        visualEffects.push(new EnergyBlast(this.x, this.y, this.angle, 0, '#FF3333', 40, 0.8));
                        
                        for (let e of entities) {
                            if (e !== this && !e.dead && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 400) {
                                    e.takeDamage(1000, this);
                                    e.applyStatus('injure', 10, this);
                                    for (let i = 0; i < 10; i++) {
                                        particles.push(new Particle(e.x + (Math.random()-0.5)*100, e.y + (Math.random()-0.5)*100, '#FF6B6B', 8, 2));
                                    }
                                }
                            }
                        }
                        // Add visible energy blast effect - expanding shockwave
                        for (let r = 0; r < 400; r += 50) {
                            setTimeout(() => {
                                if (!this.dead) {
                                    for (let i = 0; i < 8; i++) {
                                        let angle = (i / 8) * Math.PI * 2;
                                        let px = this.x + Math.cos(angle) * r;
                                        let py = this.y + Math.sin(angle) * r;
                                        particles.push(new Particle(px, py, '#FF6B6B', 6, 1.5));
                                    }
                                }
                            }, r * 2);
                        }
                        // Add red football trail particles
                        for (let i = 0; i < 12; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            let dist = Math.random() * 80;
                            particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, '#FF6B6B', 6, 2.0));
                        }
                        this.qCD = 7;
                    }
                } else {
                    // MATTHEW Q: Dash & Stun 0.5s
                    let dx = Math.cos(this.angle);
                    let dy = Math.sin(this.angle);
                    
                    // Add VISIBLE energy beam showing movement path
                    visualEffects.push(new EnergyBeam(this.x, this.y, this.angle, 200, '#4ECDC4', 0.6));
                    
                    this.x += dx * 200;
                    this.y += dy * 200;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 150) {
                                e.applyStatus('stun', 0.5, this);
                                for (let i = 0; i < 5; i++) {
                                    particles.push(new Particle(e.x, e.y, '#4ECDC4', 4, 0.6));
                                }
                            }
                        }
                    }
                    // Add dash trail particles
                    for (let i = 0; i < 20; i++) {
                        let trailX = this.x - dx * (i * 10);
                        let trailY = this.y - dy * (i * 10);
                        particles.push(new Particle(trailX, trailY, '#4ECDC4', 4, 1.5));
                    }
                    this.qCD = 2;
                }
            }
            
            abilityE() {
                if (this.twinState === 'ken') {
                    // KEN E: Sprint 2x speed 5s, crash stun
                    // Add VISIBLE energy wave effect
                    visualEffects.push(new EnergyWave(this.x, this.y, '#FF6B6B', 200, 0.8));
                    
                    this.speed = this.baseSpd * 2;
                    this.speedsterTimer = 5;
                    setTimeout(() => {
                        if (this.speed === this.baseSpd * 2) this.speed = this.baseSpd;
                    }, 5000);
                    for (let i = 0; i < 6; i++) {
                        particles.push(new Particle(this.x + (Math.random()-0.5)*80, this.y + (Math.random()-0.5)*80, '#FF6B6B', 6, 1.5));
                    }
                    // Add sprint trail particles - energy burst
                    for (let i = 0; i < 25; i++) {
                        let trailAngle = this.angle + (Math.random() - 0.5) * 0.5;
                        let trailDist = i * 8;
                        particles.push(new Particle(this.x - Math.cos(trailAngle) * trailDist, this.y - Math.sin(trailAngle) * trailDist, '#FF6B6B', 4, 2.5));
                    }
                    // Add energy wave behind
                    for (let i = 0; i < 15; i++) {
                        let waveAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.3;
                        let waveDist = Math.random() * 60;
                        particles.push(new Particle(this.x + Math.cos(waveAngle) * waveDist, this.y + Math.sin(waveAngle) * waveDist, '#FF4444', 5, 1.8));
                    }
                    // Crash detection
                    setTimeout(() => {
                        for (let e of entities) {
                            if (e !== this && !e.dead && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 120) {
                                    e.takeDamage(850, this);
                                    e.applyStatus('stun', 0.5, this);
                                }
                            }
                        }
                    }, 100);
                    this.eCD = 8;
                } else if (this.twinState === 'matthew') {
                    // MATTHEW E: Watch Zone 5s, 350/s, 15% damage reduction
                    // Add VISIBLE zone wave effect and shockwave
                    visualEffects.push(new EnergyWave(this.x, this.y, '#4ECDC4', 200, 1.2));
                    visualEffects.push(new ShockwaveRing(this.x, this.y, '#4ECDC4', 250, 1.0, 12));
                    let zone = {
                        x: this.x,
                        y: this.y,
                        radius: 250,
                        duration: 5,
                        owner: this,
                        update: function(dt) {
                            this.duration -= dt;
                            for (let e of entities) {
                                if (e !== this.owner && !e.dead && e.team !== this.owner.team) {
                                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                    if (d < this.radius) {
                                        e.takeDamage(150 * dt, this.owner);
                                    }
                                }
                            }
                        },
                        draw: function(ctx) {
                            ctx.fillStyle = 'rgba(78, 205, 196, 0.2)';
                            ctx.beginPath();
                            ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI*2);
                            ctx.fill();
                        }
                    };
                    // Add to world zones if available
                    if (!window.worldZones) window.worldZones = [];
                    window.worldZones.push(zone);
                    this.damageReduction = 0.15;
                    setTimeout(() => {
                        this.damageReduction = 0;
                    }, 5000);
                    // Add zone activation particles
                    for (let i = 0; i < 15; i++) {
                        let angle = (i / 15) * Math.PI * 2;
                        particles.push(new Particle(this.x + Math.cos(angle) * 200, this.y + Math.sin(angle) * 200, '#4ECDC4', 5, 2.0));
                    }
                    // Add energy pulse effects
                    for (let pulse = 0; pulse < 3; pulse++) {
                        setTimeout(() => {
                            if (!this.dead) {
                                for (let i = 0; i < 12; i++) {
                                    let angle = (i / 12) * Math.PI * 2;
                                    let radius = 150 + pulse * 30;
                                    particles.push(new Particle(this.x + Math.cos(angle) * radius, this.y + Math.sin(angle) * radius, '#4ECDC4', 4, 1.5));
                                }
                            }
                        }, pulse * 2000);
                    }
                    this.eCD = 8;
                } else {
                    // MATTEN E: Zone with slowness & football kick
                    // Add VISIBLE golden zone wave
                    visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 180, 1.0));
                    
                    let zone = {
                        x: this.x,
                        y: this.y,
                        radius: 250,
                        duration: 5,
                        owner: this,
                        update: function(dt) {
                            this.duration -= dt;
                            for (let e of entities) {
                                if (e !== this.owner && !e.dead && e.team !== this.owner.team) {
                                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                    if (d < this.radius) {
                                        e.takeDamage(80 * dt, this.owner);
                                        e.speed = e.baseSpd * 0.5;
                                    }
                                }
                            }
                        },
                        draw: function(ctx) {
                            ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
                            ctx.beginPath();
                            ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI*2);
                            ctx.fill();
                        }
                    };
                    if (!window.worldZones) window.worldZones = [];
                    window.worldZones.push(zone);
                    // Add fusion zone activation particles
                    for (let i = 0; i < 20; i++) {
                        let angle = (i / 20) * Math.PI * 2;
                        particles.push(new Particle(this.x + Math.cos(angle) * 200, this.y + Math.sin(angle) * 200, '#FFD700', 6, 2.5));
                    }
                    // Add golden energy waves
                    for (let wave = 0; wave < 4; wave++) {
                        setTimeout(() => {
                            if (!this.dead) {
                                for (let i = 0; i < 16; i++) {
                                    let angle = (i / 16) * Math.PI * 2;
                                    let radius = 150 + wave * 25;
                                    particles.push(new Particle(this.x + Math.cos(angle) * radius, this.y + Math.sin(angle) * radius, '#FFD700', 5, 2.0));
                                }
                            }
                        }, wave * 1500);
                    }
                    // Then football kick
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 400) {
                                e.takeDamage(950, this);
                                for (let i = 0; i < 10; i++) {
                                    particles.push(new Particle(e.x + (Math.random()-0.5)*100, e.y + (Math.random()-0.5)*100, '#FFD700', 7, 2));
                                }
                            }
                        }
                    }
                    this.eCD = 8;
                }
            }
            
            abilityF() {
                if (this.twinState === 'ken') {
                    // KEN F: Explosive Kick 1150 damage, knockback
                    // Add VISIBLE kick beam
                    visualEffects.push(new EnergyBeam(this.x, this.y, this.angle, 200, '#FF6B6B', 0.8));
                    // Add VISIBLE shockwave
                    visualEffects.push(new ShockwaveRing(this.x, this.y, '#FF3333', 350, 1.0, 16));
                    
                    let dx = Math.cos(this.angle);
                    let dy = Math.sin(this.angle);
                    this.knockbackX = dx * 300;
                    this.knockbackY = dy * 300;
                    this.knockbackDuration = 0.5;
                    // Add kick direction particles - energy shockwave
                    for (let i = 0; i < 30; i++) {
                        let particleAngle = this.angle + (Math.random() - 0.5) * 0.8;
                        let particleDist = Math.random() * 150;
                        particles.push(new Particle(this.x + Math.cos(particleAngle) * particleDist, this.y + Math.sin(particleAngle) * particleDist, '#FF6B6B', 5, 2.0));
                    }
                    // Add directional energy blast
                    for (let i = 0; i < 20; i++) {
                        let blastAngle = this.angle + (Math.random() - 0.5) * 0.4;
                        let blastDist = 50 + Math.random() * 100;
                        particles.push(new Particle(this.x + Math.cos(blastAngle) * blastDist, this.y + Math.sin(blastAngle) * blastDist, '#FF3333', 7, 2.2));
                    }
                    setTimeout(() => {
                        for (let e of entities) {
                            if (e !== this && !e.dead && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 200) {
                                    e.takeDamage(1150, this);
                                    e.knockbackX = dx * 400;
                                    e.knockbackY = dy * 400;
                                    e.knockbackDuration = 0.3;
                                    for (let i = 0; i < 12; i++) {
                                        particles.push(new Particle(e.x + (Math.random()-0.5)*120, e.y + (Math.random()-0.5)*120, '#FF6B6B', 8, 1.5));
                                    }
                                }
                            }
                        }
                    }, 500);
                    this.fCD = 10;
                } else if (this.twinState === 'matthew') {
                    // MATTHEW F: Kick 1250 damage, 625 shield
                    // Add visible energy beam and shockwave
                    visualEffects.push(new EnergyBeam(this.x, this.y, this.angle, 300, '#4ECDC4', 1.0));
                    visualEffects.push(new ShockwaveRing(this.x, this.y, '#4ECDC4', 350, 1.2, 16));
                    for (let e of entities) {
                        if (e !== this && !e.dead && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 250) {
                                e.takeDamage(1250, this);
                                this.hp = Math.min(this.maxHp, this.hp + 625);
                                for (let i = 0; i < 10; i++) {
                                    particles.push(new Particle(this.x + (Math.random()-0.5)*80, this.y + (Math.random()-0.5)*80, '#4ECDC4', 7, 1.5));
                                }
                                // Add shield gain particles
                                for (let i = 0; i < 15; i++) {
                                    particles.push(new Particle(this.x + (Math.random()-0.5)*60, this.y + (Math.random()-0.5)*60, '#00FF00', 4, 1.0));
                                }
                            }
                        }
                    }
                    this.fCD = 12;
                } else {
                    // MATTEN F: Devastating kick 1150 damage + enhanced basic 1250 damage, 800 shield
                    // Add VISIBLE golden beam
                    visualEffects.push(new EnergyBeam(this.x, this.y, this.angle, 250, '#FFD700', 1.0));
                    // Add VISIBLE massive shockwave
                    visualEffects.push(new ShockwaveRing(this.x, this.y, '#FFD700', 400, 1.3, 18));
                    
                    let dx = Math.cos(this.angle);
                    let dy = Math.sin(this.angle);
                    this.knockbackX = dx * 300;
                    this.knockbackY = dy * 300;
                    this.knockbackDuration = 0.5;
                    // Add massive golden kick particles
                    for (let i = 0; i < 40; i++) {
                        let particleAngle = this.angle + (Math.random() - 0.5) * 1.2;
                        let particleDist = Math.random() * 200;
                        particles.push(new Particle(this.x + Math.cos(particleAngle) * particleDist, this.y + Math.sin(particleAngle) * particleDist, '#FFD700', 6, 2.5));
                    }
                    // Add golden shockwave
                    for (let r = 0; r < 250; r += 40) {
                        setTimeout(() => {
                            if (!this.dead) {
                                for (let i = 0; i < 10; i++) {
                                    let angle = (i / 10) * Math.PI * 2;
                                    let px = this.x + Math.cos(angle) * r;
                                    let py = this.y + Math.sin(angle) * r;
                                    particles.push(new Particle(px, py, '#FFD700', 8, 2.0));
                                }
                            }
                        }, r * 3);
                    }
                    setTimeout(() => {
                        for (let e of entities) {
                            if (e !== this && !e.dead && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 200) {
                                    e.takeDamage(1150, this);
                                    e.knockbackX = dx * 400;
                                    e.knockbackY = dy * 400;
                                    e.knockbackDuration = 0.3;
                                    for (let i = 0; i < 12; i++) {
                                        particles.push(new Particle(e.x + (Math.random()-0.5)*120, e.y + (Math.random()-0.5)*120, '#FFD700', 8, 2));
                                    }
                                }
                            }
                        }
                        // Enhanced basic
                        for (let e of entities) {
                            if (e !== this && !e.dead && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 150) {
                                    e.takeDamage(1250, this);
                                    this.hp = Math.min(this.maxHp, this.hp + 800);
                                }
                            }
                        }
                    }, 500);
                    this.fCD = 12;
                }
            }
            
            abilityG() {
                if (!this.fusionActive && this.fusionBar >= this.maxFusionBar) {
                    // Fusion!
                    this.startFusion();
                } else {
                    // Tag switch
                    if (this.twinState === 'ken') {
                        this.twinState = 'matthew';
                    } else {
                        this.twinState = 'ken';
                    }
                    this.speed = this.baseSpd * 1.5;
                    this.speedsterTimer = 2;
                    this.hp = Math.min(this.maxHp, this.hp + 200);
                    // Charge fusion bar by 20%
                    this.fusionBar = Math.min(this.maxFusionBar, this.fusionBar + this.maxFusionBar * 0.2);
                    // Add tag switch particles
                    for (let i = 0; i < 20; i++) {
                        let angle = (i / 20) * Math.PI * 2;
                        let color = this.twinState === 'ken' ? '#FF6B6B' : '#4ECDC4';
                        particles.push(new Particle(this.x + Math.cos(angle) * 80, this.y + Math.sin(angle) * 80, color, 3, 1.0));
                    }
                    for (let i = 0; i < 5; i++) {
                        particles.push(new Particle(this.x + (Math.random()-0.5)*60, this.y + (Math.random()-0.5)*60, this.twinState === 'ken' ? '#FF6B6B' : '#4ECDC4', 4, 0.6));
                    }
                    this.gCD = 7;
                }
            }
            
            startFusion() {
                this.fusionActive = true;
                this.twinState = 'matten';
                this.fusionTimer = this.maxFusionDuration;
                this.fusionBar = 0;
                this.maxHp = 7500;
                this.hp = Math.min(7500, this.hp + 2500);
                this.speed = this.baseSpd * 1.3;
                this.damageReduction = 0.15;
                this.radius = 25;
                // Immense fusion effect with more particles, bigger size, longer duration
                for (let i = 0; i < 80; i++) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*150, this.y + (Math.random()-0.5)*150, '#FFD700', 8, 2.5));
                }
                // Additional gold spark particles
                for (let i = 0; i < 40; i++) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, '#FFFFFF', 4, 1.8));
                }
                // Flashy visual effects for Matten's arrival
                visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 500, 2.0));
                visualEffects.push(new ShockwaveRing(this.x, this.y, '#FFD700', 600, 1.8, 25));
                for (let i = 0; i < 8; i++) {
                    let angle = (i / 8) * Math.PI * 2;
                    visualEffects.push(new EnergyBeam(this.x, this.y, angle, 300, '#FFD700', 1.5));
                }
                // Screen shake for dramatic effect
                screenShake(15);
                this.gCD = 25;
            }
            
            quitFusion() {
                this.fusionActive = false;
                this.twinState = this.originalState;
                this.maxHp = 6000;
                this.hp = Math.min(6000, this.hp);
                this.radius = 22;
                this.damageReduction = 0;
                this.speed = this.baseSpd;
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*80, this.y + (Math.random()-0.5)*80, this.twinState === 'ken' ? '#FF6B6B' : '#4ECDC4', 7, 1.5));
                }
                this.gCD = 7;
            }
            
            takeDamage(amount, source, isTrue) {
                if (isTrue) {
                    this.hp -= amount;
                } else {
                    let reduction = this.damageReduction || 0;
                    this.hp -= amount * (1 - reduction);
                }
                if (this.hp <= 0) {
                    this.hp = 0;
                    this.die(source);
                }
            }
            
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.speedsterTimer > 0) s *= 1.5;
                if (this.fusionActive) s *= 1.3;
                return s;
            }
            
            getDamageMult() {
                return this.rageTimer > 0 ? 1.15 : 1;
            }
            
            draw(ctx) {
                if (this.dead) return;
                
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // Color based on state
                let color = this.twinState === 'ken' ? '#FF6B6B' : this.twinState === 'matthew' ? '#4ECDC4' : '#FFD700';
                
                // Energy aura effect - pulsing outer ring
                let auraRadius = this.radius + 8 + Math.sin(Date.now() * 0.01) * 4;
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, auraRadius, 0, Math.PI*2);
                ctx.stroke();
                ctx.restore();
                
                // Inner energy field
                ctx.save();
                ctx.globalAlpha = 0.2;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.radius + 5, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.radius, 0, Math.PI*2);
                ctx.fill();
                
                // Border
                ctx.strokeStyle = this.team === 0 ? '#00ff00' : '#ff0000';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Fusion bar indicator
                if (!this.fusionActive && this.fusionBar > 0) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
                    ctx.fillRect(screenX - 30, screenY - this.radius - 15, 60 * (this.fusionBar / this.maxFusionBar), 8);
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(screenX - 30, screenY - this.radius - 15, 60, 8);
                }
                
                // Fusion active indicator
                if (this.fusionActive) {
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 10, 0, Math.PI*2);
                    ctx.fill();
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                
                // Draw aim pointer line with glow
                ctx.save();
                ctx.shadowColor = '#fff';
                ctx.shadowBlur = 5;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + Math.cos(this.angle) * (this.radius + 20), screenY + Math.sin(this.angle) * (this.radius + 20));
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 4;
                ctx.stroke();
                ctx.restore();
            }
            
            ai(dt, spd) {
                let closest = null;
                let closestDist = 9999;
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < closestDist) {
                            closestDist = d;
                            closest = e;
                        }
                    }
                }
                if (closest) {
                    let dx = closest.x - this.x;
                    let dy = closest.y - this.y;
                    let d = Math.sqrt(dx*dx + dy*dy);
                    let m = new Vector2(dx, dy).norm().mult(this.getEffectiveSpeed() * dt);
                    this.x += m.x;
                    this.y += m.y;
                    this.angle = Math.atan2(dy, dx);
                    if (this.basicCD <= 0) { this.basicKick(); this.basicCD = this.fusionActive ? 0.5 : 0.8; }
                    if (Math.random() < 0.05 && this.qCD <= 0) this.abilityQ();
                    if (Math.random() < 0.04 && this.eCD <= 0) this.abilityE();
                    if (Math.random() < 0.03 && this.fCD <= 0) this.abilityF();
                    if (Math.random() < 0.02 && this.fusionBar >= this.maxFusionBar && this.gCD <= 0) this.abilityG();
                    else if (Math.random() < 0.1 && this.gCD <= 0) this.abilityG();
                }
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        // TRENT - Evader
        // A martial artist who achieved a calm mind to dodge every attack. He was once Li's chaotic student, 
        // whose raw talent clashed with his master's disciplined teachings. Through years of meditation and 
        // rigorous training, Trent mastered the art of "flow" - a state of perfect awareness that allows him 
        // to anticipate and evade attacks with supernatural precision. Now, as a wandering warrior, he seeks 
        // to pass on his wisdom while protecting the innocent from chaos.
        // STATS: Survival 60%, Damage 80%, Agility 100%, Speed 65%, Difficulty 60%
        class Trent extends Entity {
            constructor(x, y, p) {
                super(x, y, 22, p ? '#00008B' : '#191970', 5900);
                this.isPlayer = p;
                this.countsAsFFAHero = true;
                this.name = p ? 'Player (Trent)' : 'Enemy Trent';
                
                // Flow system
                this.flowCharges = 1;
                this.maxFlowCharges = 3;
                this.flowChargeTime = 3; // seconds per charge
                this.flowTimers = [0, 0, 0]; // timers for each charge
                
                // Cooldowns
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                
                // Buffs from E ability
                this.deepBreathActive = false;
                this.deepBreathTimer = 0;
                this.flowChargeTimeBuffed = 2; // during deep breath
                
                this.baseSpd = 290;
                this.speed = this.baseSpd;
                this.angle = 0;
                
                // Gear
                this.gear = 'speedster';
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
                
                // Flow charge timers
                for (let i = 0; i < this.maxFlowCharges; i++) {
                    if (this.flowCharges < this.maxFlowCharges && this.flowTimers[i] <= 0) {
                        this.flowTimers[i] = this.deepBreathActive ? this.flowChargeTimeBuffed : this.flowChargeTime;
                    }
                    if (this.flowTimers[i] > 0) {
                        this.flowTimers[i] -= dt;
                        if (this.flowTimers[i] <= 0) {
                            this.flowCharges = Math.min(this.maxFlowCharges, this.flowCharges + 1);
                        }
                    }
                }
                
                // Dash update
                if (this.dashing) {
                    let moveDist = this.dashSpeed * dt;
                    if (this.dashTraveled + moveDist >= this.dashDistance) {
                        moveDist = this.dashDistance - this.dashTraveled;
                        this.dashing = false;
                    }
                    this.x += Math.cos(this.dashDirection) * moveDist;
                    this.y += Math.sin(this.dashDirection) * moveDist;
                    this.dashTraveled += moveDist;
                    // Trail particles
                    particles.push(new Particle(this.x, this.y, '#00008B', 4, 1.0));
                    particles.push(new Particle(this.x + (Math.random()-0.5)*10, this.y + (Math.random()-0.5)*10, '#C0C0C0', 3, 1.2));
                }
                
                // Deep breath buff timer
                if (this.deepBreathActive) {
                    this.deepBreathTimer -= dt;
                    
                    // Additional effects during deep breath (especially first second)
                    if (this.deepBreathTimer > 4) { // First second
                        // Flow state visual effects
                        if (Math.random() < 0.3) {
                            for (let i = 0; i < 3; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                let dist = Math.random() * 60;
                                particles.push(new Particle(this.x + Math.cos(angle)*dist, this.y + Math.sin(angle)*dist, '#C0C0C0', 3, 1.0));
                            }
                        }
                    }
                    
                    if (this.deepBreathTimer <= 0) {
                        this.deepBreathActive = false;
                    }
                }
                
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                if (this.isPlayer) {
                    this.input(dt, this.speed);
                    if (player === this) updateHUD(this);
                } else {
                    this.ai(dt, this.speed);
                }
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--;
                if (keys.s) dy++;
                if (keys.a) dx--;
                if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(this.getEffectiveSpeed() * dt);
                    this.x += m.x;
                    this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) {
                    this.basicPunch();
                    this.basicCD = 0.5;
                }
                if (keys.q && this.qCD <= 0) this.abilityQ();
                if (keys.e && this.eCD <= 0) this.abilityE();
                if (keys.f && this.fCD <= 0) this.abilityF();
                if (keys.g && this.gCD <= 0) this.abilityG();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicPunch() {
                for (let e of entities) {
                    if (e !== this && !e.dead && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 100) {
                            e.takeDamage(100, this);
                            // Enhanced visible effects
                            for (let i = 0; i < 8; i++) {
                                particles.push(new Particle(e.x + (Math.random()-0.5)*60, e.y + (Math.random()-0.5)*60, '#00008B', 6, 1.5));
                                // Silver punch effect
                                particles.push(new Particle(e.x + (Math.random()-0.5)*40, e.y + (Math.random()-0.5)*40, '#C0C0C0', 4, 2.0));
                            }
                            // Impact flash
                            visualEffects.push(new ImpactFlash(e.x, e.y, '#00008B', 50));
                        }
                    }
                }
            }
            
            abilityQ() {
                // Autonomous Punch - barrage of 100 punches, each 12 damage
                // Visual effect: energy waves around Trent
                visualEffects.push(new EnergyWave(this.x, this.y, '#00008B', 150, 1.0));
                for (let i = 0; i < 100; i++) {
                    setTimeout(() => {
                        if (!this.dead) {
                            let target = null;
                            let minDist = Infinity;
                            for (let e of entities) {
                                if (e !== this && !e.dead && e.team !== this.team) {
                                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                    if (d < minDist) {
                                        minDist = d;
                                        target = e;
                                    }
                                }
                            }
                            if (target) {
                                target.takeDamage(10, this);
                                // Enhanced hit effects
                                particles.push(new Particle(target.x + (Math.random()-0.5)*30, target.y + (Math.random()-0.5)*30, '#00008B', 3, 0.8));
                                particles.push(new Particle(target.x + (Math.random()-0.5)*20, target.y + (Math.random()-0.5)*20, '#C0C0C0', 2, 1.2));
                                // Small impact flash
                                if (i % 10 === 0) visualEffects.push(new ImpactFlash(target.x, target.y, '#00008B', 20));
                            }
                        }
                    }, i * 30); // Spread over time
                }
                this.qCD = 3;
            }
            
            abilityE() {
                // Deep Breath - buffs for 5s after 1s breath
                // Energy aura during the 1s breath window
                let breathAura = {
                    x: this.x,
                    y: this.y,
                    duration: 1.0,
                    del: false,
                    update: function(dt) {
                        this.duration -= dt;
                        if (this.duration <= 0) {
                            this.del = true;
                        }
                    },
                    draw: function(ctx) {
                        ctx.strokeStyle = '#C0C0C0';
                        ctx.lineWidth = 2;
                        ctx.globalAlpha = 0.6;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 40, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                };
                visualEffects.push(breathAura);
                
                setTimeout(() => {
                    if (!this.dead) {
                        this.deepBreathActive = true;
                        this.deepBreathTimer = 5;
                        
                        // Create silent martial area
                        let zone = {
                            x: this.x,
                            y: this.y,
                            radius: 160,
                            duration: 5,
                            owner: this,
                            update: function(dt) {
                                this.duration -= dt;
                                // Follow owner
                                this.x = this.owner.x;
                                this.y = this.owner.y;
                                for (let e of entities) {
                                    if (e !== this.owner && !e.dead && e.team !== this.owner.team) {
                                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                        if (d < this.radius) {
                                            e.speed = e.baseSpd * 0.7; // Slow down
                                        }
                                    }
                                }
                                // Add silver particle effects
                                if (Math.random() < 0.2) {
                                    for (let i = 0; i < 5; i++) {
                                        let angle = Math.random() * Math.PI * 2;
                                        let dist = Math.random() * this.radius;
                                        particles.push(new Particle(this.x + Math.cos(angle)*dist, this.y + Math.sin(angle)*dist, '#C0C0C0', 3, 1.0));
                                    }
                                }
                            },
                            draw: function(ctx) {
                                ctx.fillStyle = 'rgba(192, 192, 192, 0.1)';
                                ctx.beginPath();
                                ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI*2);
                                ctx.fill();
                                // Silver border
                                ctx.strokeStyle = '#C0C0C0';
                                ctx.lineWidth = 2;
                                ctx.stroke();
                            }
                        };
                        if (!window.worldZones) window.worldZones = [];
                        window.worldZones.push(zone);
                        
                        // Visual effects
                        for (let i = 0; i < 20; i++) {
                            particles.push(new Particle(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, '#00008B', 5, 1.5));
                        }
                    }
                }, 1000);
                this.eCD = 9;
            }
            
            abilityF() {
                // Chi Punch - wide shooting projectile
                let projectile = {
                    x: this.x,
                    y: this.y,
                    startX: this.x,
                    startY: this.y,
                    maxDistance: 1000,
                    vx: Math.cos(this.angle) * 600,
                    vy: Math.sin(this.angle) * 600,
                    owner: this,
                    damagedEnemies: [],
                    del: false,
                    update: function(dt) {
                        let oldX = this.x;
                        let oldY = this.y;
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        
                        // Check distance traveled
                        let distanceTraveled = Math.sqrt((this.x - this.startX)**2 + (this.y - this.startY)**2);
                        if (distanceTraveled > this.maxDistance) {
                            this.del = true;
                            return;
                        }
                        
                        // Check for hits along the movement path
                        for (let e of entities) {
                            if (e !== this.owner && !e.dead && e.team !== this.owner.team) {
                                // Check collision with current position
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 120) {
                                    // Continuous knockback while in contact - apply force directly
                                    e.x += this.vx * dt * 1.5;
                                    e.y += this.vy * dt * 1.5;
                                    
                                    // Damage only once per enemy
                                    if (!this.damagedEnemies.includes(e)) {
                                        e.takeDamage(1000, this.owner);
                                        this.damagedEnemies.push(e);
                                        // Effects on first hit
                                        for (let i = 0; i < 15; i++) {
                                            particles.push(new Particle(e.x + (Math.random()-0.5)*80, e.y + (Math.random()-0.5)*80, '#00008B', 8, 2.0));
                                            particles.push(new Particle(e.x + (Math.random()-0.5)*60, e.y + (Math.random()-0.5)*60, '#C0C0C0', 6, 2.5));
                                        }
                                        visualEffects.push(new ImpactFlash(e.x, e.y, '#00008B', 80));
                                        // Add intimidating shockwave
                                        for (let i = 0; i < 8; i++) {
                                            let angle = (Math.PI * 2 * i) / 8;
                                            particles.push(new Particle(e.x + Math.cos(angle)*50, e.y + Math.sin(angle)*50, '#FF4500', 4, 1.5, Math.cos(angle)*300, Math.sin(angle)*300));
                                        }
                                    }
                                }
                            }
                        }
                        // Remove if out of bounds
                        if (this.x < 0 || this.x > WORLD_SIZE || this.y < 0 || this.y > WORLD_SIZE) {
                            this.del = true;
                        }
                    },
                    draw: function(ctx) {
                        // Intimidating Chi Punch appearance - lighter silver
                        ctx.fillStyle = '#E8E8E8';
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 45, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Energy core - lighter silver
                        ctx.fillStyle = '#F5F5F5';
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 25, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Outer glow effect
                        ctx.strokeStyle = '#FFFFFF';
                        ctx.lineWidth = 4;
                        ctx.globalAlpha = 0.8;
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                        
                        // Pulsing energy waves
                        let pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                        ctx.strokeStyle = '#E8E8E8';
                        ctx.lineWidth = 2;
                        ctx.globalAlpha = pulse * 0.5;
                        ctx.beginPath();
                        ctx.arc(this.x - camera.x, this.y - camera.y, 60, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.globalAlpha = 1;
                    }
                };
                if (!window.projectiles) window.projectiles = [];
                window.projectiles.push(projectile);
                this.fCD = 7;
            }
            
            abilityG() {
                // Instinct Step - dash forward
                this.dashing = true;
                this.dashDistance = 250;
                this.dashSpeed = 1000; // units per second
                this.dashDirection = this.angle;
                this.dashTraveled = 0;
                // Invulnerable during dash
                this.invulnerableTimer = Math.max(this.invulnerableTimer || 0, 0.5);
                // Visual effects
                visualEffects.push(new EnergyWave(this.x, this.y, '#C0C0C0', 100, 0.5));
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(this.x + (Math.random()-0.5)*50, this.y + (Math.random()-0.5)*50, '#00008B', 4, 1.0));
                }
                this.gCD = 5;
            }
            
            takeDamage(amount, source, isTrue) {
                // Flow dodge
                if (this.flowCharges > 0 && !isTrue) {
                    this.flowCharges--;
                    // Counter attack if deep breath active
                    if (this.deepBreathActive && source) {
                        for (let i = 0; i < 20; i++) {
                            setTimeout(() => {
                                if (!this.dead && !source.dead) {
                                    source.takeDamage(18, this);
                                    if (i === 19) source.applyStatus('stun', 0.5, this);
                                }
                            }, i * 25);
                        }
                    }
                    // Illusion effect - create afterimages moving away from attack
                    let dodgeAngle = Math.atan2(this.y - source.y, this.x - source.x); // Direction away from attacker
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            if (!this.dead) {
                                let distance = 30 + i * 20; // Increasing distance for each afterimage
                                let afterimageX = this.x + Math.cos(dodgeAngle) * distance;
                                let afterimageY = this.y + Math.sin(dodgeAngle) * distance;
                                
                                visualEffects.push({
                                    x: afterimageX,
                                    y: afterimageY,
                                    duration: 0.4,
                                    del: false,
                                    update: function(dt) {
                                        this.duration -= dt;
                                        if (this.duration <= 0) {
                                            this.del = true;
                                        }
                                    },
                                    draw: function(ctx) {
                                        ctx.globalAlpha = this.duration / 0.4 * 0.6;
                                        ctx.fillStyle = '#C0C0C0';
                                        ctx.beginPath();
                                        ctx.arc(this.x - camera.x, this.y - camera.y, 22, 0, Math.PI * 2);
                                        ctx.fill();
                                        ctx.globalAlpha = 1;
                                    }
                                });
                            }
                        }, i * 60);
                    }
                    // Visual dodge effect with silver style
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(this.x + (Math.random()-0.5)*120, this.y + (Math.random()-0.5)*120, '#FFFFFF', 5, 1.2));
                        particles.push(new Particle(this.x + (Math.random()-0.5)*100, this.y + (Math.random()-0.5)*100, '#C0C0C0', 4, 1.8));
                    }
                    // Dodge indicator
                    visualEffects.push(new DodgeIndicator(this.x, this.y, '#C0C0C0'));
                    return; // Dodge successful, no damage
                }
                super.takeDamage(amount, source, isTrue);
            }
            
            ai(dt, spd) {
                // Basic AI logic
                let target = this.findTarget();
                if (target) {
                    let dx = target.x - this.x;
                    let dy = target.y - this.y;
                    this.angle = Math.atan2(dy, dx);
                    let d = Math.sqrt(dx*dx + dy*dy);
                    if (d > 150) {
                        this.x += Math.cos(this.angle) * spd * dt;
                        this.y += Math.sin(this.angle) * spd * dt;
                    }
                    if (this.qCD <= 0) this.abilityQ();
                    if (this.eCD <= 0) this.abilityE();
                    if (this.fCD <= 0) this.abilityF();
                    if (this.gCD <= 0) this.abilityG();
                }
            }
        }

        class Guest extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#8B4513' : '#654321', 7200);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Guest)" : "Enemy Guest";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0;
                this.baseSpd = 280;
                this.speed = this.baseSpd;
                this.angle = 0;
                
                // Q Block ability
                this.qBlocking = false;
                this.qBlockTimer = 0;
                
                // E War Rush ability
                this.eRushing = false;
                this.eRushTimer = 0;
                this.eRushDir = 0;
                
                // F Last Man ability
                this.fActive = false;
                this.fTimer = 0;
                this.fShockwaveTimer = 0;
                
                // G Parry ability (charge system like Christian)
                this.gCharges = 0; this.maxGCharges = 1; this.gChargeTimer = 0;
                this.gParrying = false;
                this.gParryTimer = 0;
                
                // Undescribable Rage buff from F
                this.rageActive = false;
                this.rageTimer = 0;
                
                // Rush shield tracking
                this.rushShield = 0;
                
                // Gear integration
                this.gear = 'speedster'; this.rCD = 0; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
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
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;
                
                // Q Block window
                if (this.qBlocking) {
                    this.qBlockTimer -= dt;
                    if (this.qBlockTimer <= 0) {
                        this.qBlocking = false;
                        this.speed = this.baseSpd; // Reset speed when block ends
                    }
                }
                
                // E War Rush movement
                if (this.eRushing) {
                    this.eRushTimer -= dt;
                    let rushSpeed = 800;
                    let oldX = this.x;
                    let oldY = this.y;
                    this.x += Math.cos(this.eRushDir) * rushSpeed * dt;
                    this.y += Math.sin(this.eRushDir) * rushSpeed * dt;
                    
                    // Check for enemy collision during rush
                    let hitEnemy = false;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 50) { // Collision radius
                                e.takeDamage(900, this); // Damage on hit
                                hitEnemy = true;
                                break;
                            }
                        }
                    }
                    
                    if (hitEnemy || this.eRushTimer <= 0) {
                        this.eRushing = false;
                        this.shield -= this.rushShield;
                        this.rushShield = 0;
                    }
                }
                
                // F Last Man shockwave
                if (this.fActive) {
                    this.fTimer -= dt;
                    this.fShockwaveTimer -= dt;
                    if (this.fShockwaveTimer <= 0) {
                        this.fShockwaveTimer = 0.1;
                        // Create shockwave damage
                        let hitEnemies = [];
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let dx = e.x - this.x;
                                let dy = e.y - this.y;
                                let dist = Math.sqrt(dx*dx + dy*dy);
                                if (dist < 300) {
                                    let angle = Math.atan2(dy, dx);
                                    let angleDiff = Math.abs(angle - this.angle);
                                    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                                    if (angleDiff < Math.PI / 3) { // 60 degree cone
                                        e.takeDamage(80, this);
                                        hitEnemies.push(e);
                                    }
                                }
                            }
                        }
                        // Visual effect
                        for (let i = 0; i < 12; i++) {
                            let a = this.angle + (Math.random() - 0.5) * Math.PI / 3;
                            let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(250 + Math.random() * 150);
                            particles.push(new Particle(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20, '#FFA500', 4, 0.5, vel.x, vel.y));
                        }
                        // Additional shockwave ring
                        particles.push(new WaveShockwave(this.x, this.y, 300, 0.3, '#FFA500', '#FFD700'));
                    }
                    if (this.fTimer <= 0) {
                        this.fActive = false;
                        this.fShockwaveTimer = 0;
                    }
                }
                
                // G Parry windup
                if (this.gParrying) {
                    this.gParryTimer -= dt;
                    if (this.gParryTimer <= 0) {
                        this.gParrying = false;
                        this.doParry();
                    }
                }
                
                // Rage buff effects
                if (this.rageActive) {
                    this.speed = this.baseSpd * 1.5;
                } else {
                    this.speed = this.baseSpd;
                }
                if (this.rageTimer <= 0 && this.rageActive) {
                    this.rageActive = false;
                }
                
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                // Cannot move or change direction during War Rush
                if (!this.eRushing) {
                    let dx = 0, dy = 0;
                    if (keys.w) dy--; if (keys.s) dy++; if (keys.a) dx--; if (keys.d) dx++;
                    if (dx || dy) {
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x; this.y += m.y;
                    }
                    this.angle = getMouseAimAngle(this.x, this.y);
                }
                
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.doBlock();
                if (keys.e && this.eCD <= 0) this.doWarRush();
                if (keys.f && this.fCD <= 0) this.doLastMan();
                if (keys.g && this.gCD <= 0 && this.gCharges > 0) this.startParry();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.4;
                let dmg = 100;
                let hit = false;
                // Rectangular range: 150 length, 80 width
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x;
                        let dy = e.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let angleToEnemy = Math.atan2(dy, dx);
                        let angleDiff = angleToEnemy - this.angle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        // Check if within 40 degrees (half-width) and 150 distance
                        if (Math.abs(angleDiff) < Math.PI / 4.5 && dist < 150) {
                            e.takeDamage(dmg, this);
                            hit = true;
                        }
                    }
                }
                if (this.isPlayer) {
                    // Enhanced effects - always visible
                    for (let i = 0; i < 15; i++) {
                        let a = this.angle + (Math.random() - 0.5) * Math.PI / 2;
                        let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(150 + Math.random() * 100);
                        particles.push(new Particle(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, '#8B4513', 3, 0.5, vel.x, vel.y));
                    }
                    // Sound placeholder - add basic_attack.mp3 to sounds folder
                    // let audio = new Audio('sounds/basic_attack.mp3');
                    // audio.volume = 0.6;
                    // audio.play().catch(e => console.log('Sound failed:', e));
                }
            }
            
            doBlock() {
                this.qCD = 7;
                this.qBlocking = true;
                this.qBlockTimer = 1.0;
                this.speed *= 0.5; // 50% slow
                if (this.isPlayer) {
                    addKillMsg("🛡️ Block Active!");
                    // Enhanced effects
                    for (let i = 0; i < 25; i++) {
                        let a = Math.random() * Math.PI * 2;
                        let dist = 30 + Math.random() * 20;
                        particles.push(new Particle(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, '#FFD700', 2, 0.8));
                    }
                    // Sound placeholder - add block.mp3 to sounds folder
                    // let audio = new Audio('sounds/block.mp3');
                    // audio.volume = 0.7;
                    // audio.play().catch(e => console.log('Sound failed:', e));
                }
            }
            
            doWarRush() {
                this.eCD = 4;
                this.eRushing = true;
                this.eRushTimer = 0.5;
                this.eRushDir = this.angle;
                this.rushShield = Math.floor(this.maxHp * 0.5);
                this.shield += this.rushShield;
                if (this.isPlayer) {
                    addKillMsg("⚡ War Rush!");
                    // Enhanced effects
                    for (let i = 0; i < 20; i++) {
                        let a = this.angle + (Math.random() - 0.5) * Math.PI / 2;
                        let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(300 + Math.random() * 200);
                        particles.push(new Particle(this.x, this.y, '#FFD700', 4, 0.6, vel.x, vel.y));
                    }
                    // Sound placeholder - add war_rush.mp3 to sounds folder
                    // let audio = new Audio('sounds/war_rush.mp3');
                    // audio.volume = 0.8;
                    // audio.play().catch(e => console.log('Sound failed:', e));
                }
            }
            
            doLastMan() {
                this.fCD = 20;
                this.fActive = true;
                this.fTimer = 2.0;
                this.fShockwaveTimer = 0.1;
                // Activate Undescribable Rage
                this.rageActive = true;
                this.rageTimer = 5.0;
                if (this.isPlayer) {
                    addKillMsg("👊 Last Man Standing!");
                    // Enhanced effects
                    for (let i = 0; i < 30; i++) {
                        let a = Math.random() * Math.PI * 2;
                        let dist = 50 + Math.random() * 50;
                        particles.push(new Particle(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, '#FFA500', 5, 0.7));
                    }
                    screenShake(8);
                    // Sound placeholder - add last_man.mp3 to sounds folder
                    // let audio = new Audio('sounds/last_man.mp3');
                    // audio.volume = 0.9;
                    // audio.play().catch(e => console.log('Sound failed:', e));
                }
            }
            
            startParry() {
                if (this.gCharges <= 0 || this.gCD > 0) return;
                this.gCharges--;
                if (this.rageActive) {
                    // During rage, skip windup
                    this.doParry();
                } else {
                    this.gParrying = true;
                    this.gParryTimer = 0.5;
                    if (this.isPlayer) {
                        addKillMsg("⚔️ Parry Windup!");
                        // Enhanced effects
                        for (let i = 0; i < 15; i++) {
                            let a = Math.random() * Math.PI * 2;
                            let dist = 25 + Math.random() * 15;
                            particles.push(new Particle(this.x + Math.cos(a) * dist, this.y + Math.sin(a) * dist, '#FFD700', 3, 0.6));
                        }
                        // Sound placeholder - add parry_windup.mp3 to sounds folder
                        // let audio = new Audio('sounds/parry_windup.mp3');
                        // audio.volume = 0.5;
                        // audio.play().catch(e => console.log('Sound failed:', e));
                    }
                }
            }
            
            doParry() {
                let lungeDist = 150;
                let oldX = this.x;
                let oldY = this.y;
                this.x += Math.cos(this.angle) * lungeDist;
                this.y += Math.sin(this.angle) * lungeDist;
                
                let hitEnemy = null;
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 120) {
                            e.takeDamage(1250, this);
                            e.applyStatus('stun', 1.0, this);
                            hitEnemy = e;
                            break;
                        }
                    }
                }
                
                if (hitEnemy) {
                    this.shield += 360;
                    // Enhanced effects
                    for (let i = 0; i < 25; i++) {
                        particles.push(new Particle(hitEnemy.x + (Math.random()-0.5)*80, hitEnemy.y + (Math.random()-0.5)*80, '#FFD700', 5, 0.8));
                    }
                    screenShake(6);
                    if (this.isPlayer) {
                        addKillMsg("⚔️ Parry Success! +360 Shield");
                        // Sound placeholder - add parry_success.mp3 to sounds folder
                        // let audio = new Audio('sounds/parry_success.mp3');
                        // audio.volume = 0.8;
                        // audio.play().catch(e => console.log('Sound failed:', e));
                    }
                } else {
                    // Return to original position if no hit
                    this.x = oldX;
                    this.y = oldY;
                    if (this.isPlayer) {
                        // Sound for miss placeholder - add parry_miss.mp3 to sounds folder
                        // let audio = new Audio('sounds/parry_miss.mp3');
                        // audio.volume = 0.4;
                        // audio.play().catch(e => console.log('Sound failed:', e));
                    }
                }
            }
            
            takeDamage(dmg, src) {
                if (this.qBlocking) {
                    // Successful block - gain parry charge
                    this.gCharges = Math.min(this.maxGCharges, this.gCharges + 1);
                    this.qBlocking = false;
                    this.speed = this.baseSpd; // Reset speed
                    if (this.isPlayer) addKillMsg("🛡️ Block Success! Gained Parry Charge");
                    return; // No damage taken
                }
                super.takeDamage(dmg, src);
            }
            
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
                if (this.dead) return;
                let target = this.findTarget();
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
                
                if (dist > 200) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                
                if (this.qCD <= 0 && Math.random() < 0.1) this.doBlock();
                if (this.eCD <= 0 && dist < 300 && Math.random() < 0.15) this.doWarRush();
                if (this.fCD <= 0 && dist < 250 && Math.random() < 0.05) this.doLastMan();
                if (this.gCharges > 0 && dist < 150 && Math.random() < 0.2) this.startParry();
                if (this.basicCD <= 0 && dist < 400 && Math.random() < 0.3) this.basicAtk();
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
                    // Show current buffs
                    if (this.qBlocking) {
                        ctx.fillStyle = '#FFD700';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('🛡️ BLOCKING', this.x - camera.x, this.y - camera.y - 70);
                    }
                    if (this.rageActive) {
                        ctx.fillStyle = '#FF4500';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('👊 RAGE', this.x - camera.x, this.y - camera.y - 85);
                    }
                    if (this.eRushing) {
                        ctx.fillStyle = '#FFD700';
                        ctx.font = 'bold 14px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('⚡ RUSHING', this.x - camera.x, this.y - camera.y - 100);
                    }
                }
                
                // Draw block effect with pulsing
                if (this.qBlocking) {
                    ctx.save();
                    let pulse = Math.sin(Date.now() / 200) * 2 + 2;
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 3 + pulse;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 10, 0, Math.PI * 2);
                    ctx.stroke();
                    // Inner glow
                    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 5, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Draw rage effect with enhanced visuals
                if (this.rageActive) {
                    ctx.save();
                    ctx.strokeStyle = '#FF4500';
                    ctx.lineWidth = 3;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 15, 0, Math.PI * 2);
                    ctx.stroke();
                    // Additional inner ring
                    ctx.strokeStyle = '#FFA500';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 20, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Draw rush effect
                if (this.eRushing) {
                    ctx.save();
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 12, 0, Math.PI * 2);
                    ctx.stroke();
                    // Trail particles during rush
                    for (let i = 0; i < 3; i++) {
                        let trailX = this.x - Math.cos(this.eRushDir) * (i + 1) * 20;
                        let trailY = this.y - Math.sin(this.eRushDir) * (i + 1) * 20;
                        particles.push(new Particle(trailX, trailY, '#FFD700', 2, 0.3));
                    }
                    ctx.restore();
                }
                
                // Draw parry windup with enhanced effect
                if (this.gParrying) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 20, 0, Math.PI * 2 * (0.5 - this.gParryTimer) / 0.5);
                    ctx.fill();
                    // Outer ring
                    ctx.strokeStyle = '#FFD700';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 25, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
                
                // Draw shockwave active indicator
                if (this.fActive) {
                    ctx.save();
                    ctx.strokeStyle = '#FFA500';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 300, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }

