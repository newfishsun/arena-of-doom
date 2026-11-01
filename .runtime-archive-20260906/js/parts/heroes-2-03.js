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

