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

