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
