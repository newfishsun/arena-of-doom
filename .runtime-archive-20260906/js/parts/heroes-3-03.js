        class Jimeka extends Entity {
            constructor(x, y, p) {
                super(x, y, 25, p ? '#FF1493' : '#8B008B', 5600);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Jimeka)" : "Enemy Jimeka";
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.gCD = 0;
                this.baseSpd = 250;
                this.speed = this.baseSpd;
                this.angle = 0;
                
                // F ability variants
                this.fVariants = [
                    { emoji: '💥', name: 'Big Bang', effect: 'bigBang' },
                    { emoji: '🛡️', name: 'Jester\'s Shield', effect: 'shield' },
                    { emoji: '⚡', name: 'Lightning Rod', effect: 'lightning' },
                    { emoji: '💨', name: 'Speed Circus', effect: 'speed' },
                    { emoji: '🧊', name: 'Freeze Frame', effect: 'freeze' },
                    { emoji: '🔥', name: 'Fireworks', effect: 'fireworks' },
                    { emoji: '💀', name: 'Punchline', effect: 'execute' },
                    { emoji: '💚', name: 'Healing Joke', effect: 'heal' },
                    { emoji: '🔄', name: 'Misfortune', effect: 'swap' },
                    { emoji: '👥', name: 'Clone Prank', effect: 'clones' }
                ];
                this.currentFVariant = this.fVariants[Math.floor(Math.random() * this.fVariants.length)];
                
                // Banana peel trap
                this.bananaPeels = [];
                this.dashDist = 0;
                
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
 if (this.dashDist > 0) {
                    let move = Math.min(600 * dt, this.dashDist);
                    this.x += Math.cos(this.angle) * move;
                    this.y += Math.sin(this.angle) * move;
                    this.dashDist -= move;
                    // damage enemies once when touched during dash
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < this.radius + 5 && !this.gDashDamaged.has(e)) {
                                e.takeDamage(250, this);
                                this.gDashDamaged.add(e);
                            }
                        }
                    }
                    // Particles during dash
                    particles.push(new Particle(
                        this.x, this.y, '#FFD700', 3, 0.5,
                        Math.cos(this.angle + Math.PI) * 200,
                        Math.sin(this.angle + Math.PI) * 200
                    ));
                }
                
                // Update banana peels
                for (let i = this.bananaPeels.length - 1; i >= 0; i--) {
                    let peel = this.bananaPeels[i];
                    peel.timer -= dt;
                    if (peel.timer <= 0) {
                        this.bananaPeels.splice(i, 1);
                        continue;
                    }
                    // Check for enemies slipping
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - peel.x)**2 + (e.y - peel.y)**2);
                            if (d < 80 && !peel.triggered) {
                                e.stunTimer = Math.max(e.stunTimer, 0.5);
                                e.takeDamage(800, this);
                                peel.triggered = true;
                                // Visual effect
                                for (let j = 0; j < 10; j++) {
                                    particles.push(new Particle(peel.x, peel.y, '#FFFF00', 2, 0.5));
                                }
                            }
                        }
                    }
                }
                
                if (this.stunTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }
            
            input(dt, spd) {
                let dx = 0, dy = 0;
                if (keys.w) dy--; if (keys.s) dy++; if (keys.a) dx--; if (keys.d) dx++;
                if (dx || dy) {
                    let m = new Vector2(dx, dy).norm().mult(spd * dt);
                    this.x += m.x; this.y += m.y;
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                
                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0) this.doJestersToss();
                if (keys.e && this.eCD <= 0) this.doPrankstersPlay();
                if (keys.f && this.fCD <= 0) this.doGuess();
                if (keys.g && this.gCD <= 0) this.doReroll();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = 0.5;
                let dmg = 150;
                // Create sharp dart projectile with proper constructor: (owner, x, y, angle, speed, damage, range, color, size)
                let proj = new Projectile(this, this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20, this.angle, 800, dmg, 600, '#FF1493', 6);
                proj.trail = true; // Add trailing particles
                proj.dartProjectile = true; // Mark as dart for custom drawing
                entities.push(proj);
                
                // Enhanced visual effect: Pink starburst with trail
                for (let i = 0; i < 12; i++) {
                    let a = this.angle + (i - 6) * Math.PI / 36;
                    let vel = new Vector2(Math.cos(a), Math.sin(a)).mult(300 + Math.random() * 150);
                    particles.push(new Particle(this.x + Math.cos(this.angle) * 25, this.y + Math.sin(this.angle) * 25, '#FFB6C1', 3, 0.6, vel.x, vel.y));
                }
                if (this.isPlayer) screenShake(2);
            }
            
            doJestersToss() {
                this.qCD = 4;
                if (this.isPlayer) {
                    addKillMsg("🎪 Jester's Toss! (10 darts)");
                    screenShake(8);
                }
                
                // Launch 10 projectiles in spread pattern with circus colors
                for (let i = 0; i < 10; i++) {
                    let spreadAngle = this.angle + (i - 4.5) * Math.PI / 36;
                    // Proper Projectile: (owner, x, y, angle, speed, damage, range, color, size)
                    let proj = new Projectile(this, this.x + Math.cos(spreadAngle) * 30, this.y + Math.sin(spreadAngle) * 30, spreadAngle, 850, 200, 650, '#FF1493', 7);
                    proj.trail = true;
                    proj.dartProjectile = true;
                    entities.push(proj);
                }
                
                // Enhanced visual: Massive circus explosion burst
                let colors = ['#FF1493', '#FFD700', '#00BFFF', '#32CD32', '#FF4500'];
                for (let i = 0; i < 40; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let speed = Math.random() * 400 + 150;
                    let color = colors[Math.floor(Math.random() * colors.length)];
                    particles.push(new Particle(this.x, this.y, color, 4, 1.2, Math.cos(angle) * speed, Math.sin(angle) * speed));
                }
            }
            
            doPrankstersPlay() {
                this.eCD = 8;
                // Apply confusion (slowness) to nearby enemies
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 300) {
                            e.slowTimer = Math.max(e.slowTimer, 2.0);
                            e.slowMultiplier = 0.4;
                        }
                    }
                }
                
                // Place banana peel trap
                this.bananaPeels.push({
                    x: this.x + Math.cos(this.angle) * 120,
                    y: this.y + Math.sin(this.angle) * 120,
                    timer: 4.0,
                    triggered: false
                });
                

                
                if (this.isPlayer) {
                    addKillMsg("🤡 Prankster's Play! (Slow + Trap)");
                    screenShake(6);
                }
                
                // Enhanced visual: Chaotic clown party with confetti burst
                let partyColors = ['#FF1493', '#FFD700', '#00BFFF', '#32CD32', '#FF69B4', '#FF4500', '#9932CC'];
                for (let i = 0; i < 35; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let speed = Math.random() * 350 + 100;
                    let color = partyColors[Math.floor(Math.random() * partyColors.length)];
                    let dist = Math.random() * 80;
                    particles.push(new Particle(
                        this.x + Math.cos(angle) * dist, 
                        this.y + Math.sin(angle) * dist, 
                        color, 3, 1.4, 
                        Math.cos(angle) * speed, 
                        Math.sin(angle) * speed
                    ));
                }
            }
            
            doGuess() {
                this.fCD = 10;
                let variant = this.currentFVariant;
                if (this.isPlayer) {
                    addKillMsg(`${variant.emoji} ${variant.name}!`);
                }
                
                // Execute the effect
                switch (variant.effect) {
                    case 'bigBang':
                        // Big Bang: 1000 AoE damage, slow 1.5s in 400 radius
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 400) {
                                    e.takeDamage(1000, this);
                                    e.slowTimer = Math.max(e.slowTimer, 1.5);
                                }
                            }
                        }
                        if (this.isPlayer) addKillMsg('💥 BIG BANG!');
                        screenShake(12);
                        
                        // Custom explosion effects: shockwaves and radial beams
                        try {
                            effectsAdd(new WaveShockwave(this.x, this.y, 400, 1.2, '#FF4500', '#FFD700'));
                            for (let i = 0; i < 8; i++) {
                                let angle = (Math.PI * 2 * i) / 8;
                                effectsAdd(new RadialBeam(this.x, this.y, angle, 400, Math.PI / 4, 1.0, '#FF4500'));
                                effectsAdd(new ImpactFlash(this.x, this.y, angle, 400, 0.8, '#FFD700'));
                            }
                            effectsAdd(new AuraRing(this.x, this.y, 200, 1.5, '#FF6600', -8));
                        } catch(ex) {
                            console.warn('Big Bang effects failed', ex);
                        }
                        
                        // Enhanced particles
                        for (let i = 0; i < 40; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            let speed = Math.random() * 450 + 200;
                            particles.push(new Particle(this.x, this.y, '#FF4500', 7, 1.8, Math.cos(angle) * speed, Math.sin(angle) * speed));
                        }
                        break;
                    case 'shield':
                        // Jester's Shield: 500 shield to all allies +500 extra to self
                        for (let e of entities) {
                            if (!e.dead && e instanceof Entity && e.team === this.team) {
                                e.shield += 500;
                                if (e === this) e.shield += 500; // Extra for self
                            }
                        }
                        if (this.isPlayer) addKillMsg('🛡️ SHIELD UP!');
                        screenShake(5);
                        
                        // Custom shield effects: protective aura and beams
                        try {
                            effectsAdd(new AuraRing(this.x, this.y, 80, 3.0, '#00FF00', 6));
                            for (let i = 0; i < 12; i++) {
                                let angle = (Math.PI * 2 * i) / 12;
                                effectsAdd(new RadialBeam(this.x, this.y, angle, 100, Math.PI / 6, 3.0, '#90EE90'));
                            }
                            effectsAdd(new EntityAura(this, this.radius + 30, 3.0, '#00FF00', '#90EE90', 4));
                        } catch(ex) {
                            console.warn('Shield effects failed', ex);
                        }
                        
                        // Enhanced shield particles
                        for (let i = 0; i < 25; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, '#00FF00', 4, 1.2, Math.cos(angle) * 150, Math.sin(angle) * 150));
                        }
                        break;
                    case 'lightning':
                        // Lightning Rod: 4 directional rods, each deals 300 damage in aiming direction with 60° width, 500 range
                        let lightningWidth = Math.PI / 3; // 60 degrees
                        for (let rod = 0; rod < 4; rod++) {
                            let rodAngle = this.angle + (Math.PI * 2 * rod) / 4;
                            for (let e of entities) {
                                if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                    let dx = e.x - this.x;
                                    let dy = e.y - this.y;
                                    let dist = Math.sqrt(dx*dx + dy*dy);
                                    if (dist < 500 && dist > 0) {
                                        let enemyAngle = Math.atan2(dy, dx);
                                        let angleDiff = Math.abs(enemyAngle - rodAngle);
                                        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                                        if (angleDiff < lightningWidth / 2) {
                                            e.takeDamage(1200, this);
                                        }
                                    }
                                }
                            }
                        }
                        if (this.isPlayer) addKillMsg('⚡ LIGHTNING STRIKE!');
                        screenShake(10);
                        
                        // Custom lightning effects: directional beams instead of radial burst
                        try {
                            for (let bolt = 0; bolt < 4; bolt++) {
                                let boltAngle = this.angle + (Math.PI * 2 * bolt) / 4;
                                // Lightning beam effect
                                effectsAdd(new RadialBeam(this.x, this.y, boltAngle, 500, Math.PI / 3, 0.8, '#00FFFF'));
                                // Impact flash at end of beam
                                effectsAdd(new ImpactFlash(this.x, this.y, boltAngle, 500, 0.6, '#FFFFFF'));
                                // Sword trail for lightning trail effect
                                effectsAdd(new SwordTrail(this.x, this.y, boltAngle, 500, 0.7, '#87CEEB'));
                            }
                            
                            // Electric field particles along the beams
                            for (let bolt = 0; bolt < 4; bolt++) {
                                let boltAngle = this.angle + (Math.PI * 2 * bolt) / 4;
                                for (let i = 0; i < 20; i++) {
                                    let progress = i / 20;
                                    let dist = progress * 500;
                                    let spread = (Math.random() - 0.5) * 50 * progress;
                                    let particleAngle = boltAngle + spread / dist;
                                    let px = this.x + Math.cos(particleAngle) * dist;
                                    let py = this.y + Math.sin(particleAngle) * dist;
                                    particles.push(new Particle(px, py, '#FFFF00', 3, 0.8 + Math.random() * 0.4));
                                }
                            }
                        } catch(ex) {
                            console.warn('Lightning effects failed', ex);
                            // Fallback to simple particles
                            for (let bolt = 0; bolt < 4; bolt++) {
                                let boltAngle = (Math.PI * 2 * bolt) / 4;
                                for (let i = 0; i < 30; i++) {
                                    let angle = boltAngle + (Math.random() - 0.5) * 0.5;
                                    let speed = Math.random() * 500 + 300;
                                    particles.push(new Particle(
                                        this.x, this.y, 
                                        i % 2 === 0 ? '#FFFF00' : '#87CEEB', 5, 1.0,
                                        Math.cos(angle) * speed,
                                        Math.sin(angle) * speed
                                    ));
                                }
                            }
                        }
                        break;
                    case 'speed':
                        // Speed Circus: 3x speed to all allies for 5s
                        for (let e of entities) {
                            if (!e.dead && e instanceof Entity && e.team === this.team) {
                                e.speed *= 3;
                                e.speedBoostTimer = 5.0;
                                setTimeout(() => { if (!e.dead) e.speed /= 3; }, 5000);
                            }
                        }
                        if (this.isPlayer) addKillMsg('💨 SPEED CIRCUS!');
                        screenShake(7);
                        
                        // Custom speed effects: energy aura and trails
                        try {
                            effectsAdd(new AuraRing(this.x, this.y, 70, 5.0, '#00BFFF', 10));
                            for (let i = 0; i < 8; i++) {
                                let angle = (Math.PI * 2 * i) / 8;
                                effectsAdd(new SwordTrail(this.x, this.y, angle, 120, 5.0, '#87CEEB'));
                            }
                        } catch(ex) {
                            console.warn('Speed effects failed', ex);
                        }
                        
                        // Enhanced speed particles
                        for (let i = 0; i < 25; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, '#00BFFF', 4, 1.4, Math.cos(angle) * 400, Math.sin(angle) * 400));
                        }
                        break;
                    case 'freeze':
                        // Freeze Frame: Freeze all enemies for 2s in 350 radius
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 350) {
                                    e.stunTimer = Math.max(e.stunTimer, 2.0);
                                }
                            }
                        }
                        if (this.isPlayer) addKillMsg('🧊 FREEZE FRAME!');
                        screenShake(8);
                        
                        // Custom freeze effects: ice shockwave and aura
                        try {
                            effectsAdd(new WaveShockwave(this.x, this.y, 350, 1.0, '#87CEEB', '#B0E0E6'));
                            effectsAdd(new AuraRing(this.x, this.y, 120, 2.0, '#87CEEB', -4));
                            for (let i = 0; i < 6; i++) {
                                let angle = (Math.PI * 2 * i) / 6;
                                effectsAdd(new RadialBeam(this.x, this.y, angle, 350, Math.PI / 3, 1.5, '#B0E0E6'));
                            }
                        } catch(ex) {
                            console.warn('Freeze effects failed', ex);
                        }
                        
                        // Enhanced ice particles
                        for (let i = 0; i < 30; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, '#87CEEB', 5, 1.5, Math.cos(angle) * 350, Math.sin(angle) * 350));
                        }
                        break;
                    case 'fireworks':
                        // Fireworks: 10x150 damage to random targets in 250 radius
                        let targets = [];
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 250) targets.push(e);
                            }
                        }
                        for (let i = 0; i < 10 && targets.length > 0; i++) {
                            let target = targets[Math.floor(Math.random() * targets.length)];
                            target.takeDamage(150, this);
                        }
                        if (this.isPlayer) addKillMsg('🔥 FIREWORKS EXTRAVAGANZA!');
                        screenShake(9);
                        
                        // Custom fireworks effects: multiple impact flashes and beams
                        try {
                            let fireworkColors = ['#FF6347', '#FFD700', '#32CD32', '#00BFFF', '#FF1493', '#FF4500', '#9932CC'];
                            for (let burst = 0; burst < 8; burst++) {
                                let burstAngle = (Math.PI * 2 * burst) / 8;
                                effectsAdd(new ImpactFlash(this.x, this.y, burstAngle, 250, 1.0, fireworkColors[burst % fireworkColors.length]));
                                effectsAdd(new RadialBeam(this.x, this.y, burstAngle, 250, Math.PI / 4, 1.2, fireworkColors[burst % fireworkColors.length]));
                            }
                        } catch(ex) {
                            console.warn('Fireworks effects failed', ex);
                        }
                        
                        // Enhanced firework particles
                        let fireworkColors = ['#FF6347', '#FFD700', '#32CD32', '#00BFFF', '#FF1493', '#FF4500', '#9932CC'];
                        for (let burst = 0; burst < 8; burst++) {
                            let burstAngle = (Math.PI * 2 * burst) / 8;
                            for (let i = 0; i < 10; i++) {
                                let angle = burstAngle + (Math.random() - 0.5) * 0.8;
                                let speed = Math.random() * 400 + 200;
                                let color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
                                particles.push(new Particle(this.x, this.y, color, 5, 1.3, Math.cos(angle) * speed, Math.sin(angle) * speed));
                            }
                        }
                        break;
                    case 'execute':
                        // Punchline: Deal 500 true damage to all enemies in 300 range, execute if below 15%
                        let executedCount = 0;
                        for (let e of entities) {
                            if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if (d < 300) {
                                    e.takeDamage(500, this, true); // True damage
                                    if (e.hp / e.maxHp <= 0.15) {
                                        e.takeDamage(e.hp + 1000, this); // Execute
                                        executedCount++;
                                    }
                                }
                            }
                        }
                        if (this.isPlayer) addKillMsg(`💀 PUNCHLINE!${executedCount > 0 ? ' (EXECUTED!)' : ''}`);
                        screenShake(11);
                        
                        // Custom execute effects: dark shockwave and aura
                        try {
                            effectsAdd(new WaveShockwave(this.x, this.y, 300, 1.5, '#8B0000', '#000000'));
                            effectsAdd(new AuraRing(this.x, this.y, 150, 2.0, '#FF0000', -6));
                            for (let i = 0; i < 8; i++) {
                                let angle = (Math.PI * 2 * i) / 8;
                                effectsAdd(new RadialBeam(this.x, this.y, angle, 300, Math.PI / 4, 1.8, '#8B0000'));
                            }
                        } catch(ex) {
                            console.warn('Execute effects failed', ex);
                        }
                        
                        // Enhanced dark particles
                        for (let i = 0; i < 35; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, Math.random() < 0.5 ? '#8B0000' : '#000000', 6, 1.6, Math.cos(angle) * 450, Math.sin(angle) * 450));
                        }
                        break;
                    case 'heal':
                        // Healing Joke: 400 heal to all allies +400 extra to self
                        for (let e of entities) {
                            if (!e.dead && e instanceof Entity && e.team === this.team) {
                                e.hp = Math.min(e.maxHp, e.hp + 400);
                                if (e === this) e.hp = Math.min(e.maxHp, e.hp + 400); // Extra for self
                            }
                        }
                        if (this.isPlayer) addKillMsg('💚 HEALING LAUGHTER!');
                        screenShake(6);
                        
                        // Custom healing effects: golden aura and beams
                        try {
                            effectsAdd(new AuraRing(this.x, this.y, 100, 3.0, '#FFD700', 8));
                            for (let i = 0; i < 10; i++) {
                                let angle = (Math.PI * 2 * i) / 10;
                                effectsAdd(new RadialBeam(this.x, this.y, angle, 120, Math.PI / 5, 3.0, '#32CD32'));
                            }
                        } catch(ex) {
                            console.warn('Heal effects failed', ex);
                        }
                        
                        // Enhanced healing particles
                        for (let i = 0; i < 30; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, '#32CD32', 5, 1.4, Math.cos(angle) * 300, Math.sin(angle) * 300));
                        }
                        break;
                    case 'swap':
                        // Misfortune: Swap with closest enemy + 400 damage
                        let closest = null, minDist = 400;
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
                            closest.takeDamage(400, this);
                            let tempX = this.x, tempY = this.y;
                            this.x = closest.x; this.y = closest.y;
                            closest.x = tempX; closest.y = tempY;
                            if (this.isPlayer) addKillMsg('🔄 POSITIONS SWAPPED! (400 dmg)');
                            screenShake(8);
                            
                            // Custom swap effects: teleport flashes and trails
                            try {
                                effectsAdd(new ImpactFlash(tempX, tempY, this.angle, 50, 0.8, '#9932CC'));
                                effectsAdd(new ImpactFlash(this.x, this.y, this.angle + Math.PI, 50, 0.8, '#8B00FF'));
                                effectsAdd(new SwordTrail(tempX, tempY, this.angle, 400, 1.0, '#9932CC'));
                            } catch(ex) {
                                console.warn('Swap effects failed', ex);
                            }
                            
                            // Enhanced teleport particles
                            for (let i = 0; i < 25; i++) {
                                let angle = Math.random() * Math.PI * 2;
                                particles.push(new Particle(tempX, tempY, '#9932CC', 5, 1.2, Math.cos(angle) * 350, Math.sin(angle) * 350));
                                particles.push(new Particle(this.x, this.y, '#8B00FF', 5, 1.2, Math.cos(angle) * 350, Math.sin(angle) * 350));
                            }
                        }
                        break;
                    case 'clones':
                        // Clone Prank: 3 decoys (10s duration)
                        for (let i = 0; i < 3; i++) {
                            let angle = (Math.PI * 2 * i) / 3;
                            let decoyX = this.x + Math.cos(angle) * 100;
                            let decoyY = this.y + Math.sin(angle) * 100;
                            // Create temporary decoy entity
                            let decoy = new Entity(decoyX, decoyY, 20, this.color, 1);
                            decoy.team = this.team;
                            decoy.isDecoy = true;
                            entities.push(decoy);
                            setTimeout(() => {
                                if (decoy && !decoy.dead) {
                                    decoy.dead = true;
                                    entities.splice(entities.indexOf(decoy), 1);
                                }
                            }, 10000);
                        }
                        if (this.isPlayer) addKillMsg('👥 CLONES APPEAR!');
                        screenShake(7);
                        
                        // simple particle ring to indicate clones
                        for (let i = 0; i < 20; i++) {
                            let angle = Math.random() * Math.PI * 2;
                            particles.push(new Particle(this.x, this.y, '#FFD700', 4, 1.0, Math.cos(angle) * 200, Math.sin(angle) * 200));
                        }
                        break;
                }
                
                // Randomize the variant after using F
                this.currentFVariant = this.fVariants[Math.floor(Math.random() * this.fVariants.length)];
            }
            
            doReroll() {
                this.gCD = 10;
                
                // Start dash
                
                this.dashDist = 200;
                this.gDashDamaged = new Set();
                
                // Reroll F variant
                this.currentFVariant = this.fVariants[Math.floor(Math.random() * this.fVariants.length)];
                if (this.isPlayer) {
                    addKillMsg(`🎲 Rerolled to ${this.currentFVariant.emoji} ${this.currentFVariant.name}!`);
                    screenShake(4);
                }
                
                // Enhanced visual: Spinning dice wheel of fortune
                for (let i = 0; i < 30; i++) {
                    let angle = (Math.PI * 2 * i) / 30;
                    let radius = 40 + Math.sin(Date.now() / 100 + i) * 10;
                    particles.push(new Particle(
                        this.x + Math.cos(angle) * radius, 
                        this.y + Math.sin(angle) * radius, 
                        '#FFD700', 4, 1.0
                    ));
                }
                // Bright flash
                for (let i = 0; i < 15; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let speed = Math.random() * 250 + 150;
                    particles.push(new Particle(this.x, this.y, '#FFFFFF', 3, 0.8, Math.cos(angle) * speed, Math.sin(angle) * speed));
                }
            }
            
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            getEffectiveSpeed() {
                let spd = this.speed;
                if (this.speedsterTimer > 0) spd *= 1.5;
                if (this.rageTimer > 0) spd *= 1.1;
                return spd;
            }
            
            ai(dt, spd) {
                let target = this.findTarget();
                if (!target) {
                    this.wander(dt, spd);
                    return;
                }
                
                let dx = target.x - this.x;
                let dy = target.y - this.y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                
                this.angle = Math.atan2(dy, dx);
                
                if (dist > 300) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                
                if (this.qCD <= 0 && dist < 550 && Math.random() < 0.1) this.doJestersToss();
                if (this.eCD <= 0 && dist < 250 && Math.random() < 0.15) this.doPrankstersPlay();
                if (this.fCD <= 0 && dist < 400 && Math.random() < 0.05) this.doGuess();
                if (this.gCD <= 0 && Math.random() < 0.08) this.doReroll();
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
            
            wander(dt, spd) {
                if (Math.random() < 0.02) {
                    this.angle = Math.random() * Math.PI * 2;
                }
                this.x += Math.cos(this.angle) * spd * dt * 0.5;
                this.y += Math.sin(this.angle) * spd * dt * 0.5;
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                if (this.isPlayer) {
                    // Show current F variant
                    ctx.fillStyle = '#FFD700';
                    ctx.font = 'bold 16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.currentFVariant.emoji, this.x - camera.x, this.y - camera.y - 85);
                }
                
                // Draw banana peels
                for (let peel of this.bananaPeels) {
                    ctx.save();
                    let x = peel.x - camera.x;
                    let y = peel.y - camera.y;
                    // Simple circle with brown outline
                    ctx.fillStyle = '#FFFF00';
                    ctx.strokeStyle = '#8B4513';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(x, y, 15, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
                
                
                // Draw custom projectiles for Jimeka (sharp darts)
                for (let proj of projectiles) {
                    if (proj.owner === this && proj.damage === 150) { // Basic attack
                        ctx.save();
                        ctx.translate(proj.x - camera.x, proj.y - camera.y);
                        ctx.rotate(proj.angle);
                        // Sharp dart shape
                        ctx.fillStyle = '#FF1493';
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(-5, -15); // Point
                        ctx.lineTo(0, -10);
                        ctx.lineTo(5, -15);
                        ctx.closePath();
                        ctx.fill();
                        // Metallic shine
                        ctx.strokeStyle = '#FFF';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.lineTo(0, -15);
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
        }

        class Dayum extends Entity {
            constructor(x, y, p) {
                super(x, y, 30, '#000', 69420);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (DAYUM)" : "Enemy DAYUM";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.baseSpd = 350;
                this.speed = 350;
                this.maxHp = 69420;
                this.hp = 69420;
                this.speedActive = false;
                this.speedTimer = 0;
            }

            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.basicCD > 0) this.basicCD -= dt;
                if(this.qCD > 0) this.qCD -= dt;
                if(this.eCD > 0) this.eCD -= dt;
                if(this.fCD > 0) this.fCD -= dt;
                if(this.gCD > 0) this.gCD -= dt;
                
                // Handle speed boost
                if(this.speedActive) {
                    this.speedTimer -= dt;
                    if(this.speedTimer <= 0) {
                        this.speedActive = false;
                        this.speed = this.baseSpd;
                    }
                }
                
                if(this.stunTimer > 0 || this.freezeTimer > 0) {
                    if(this.isPlayer) updateHUD(this);
                    return;
                }
                let spd = this.getEffectiveSpeed();
                if(this.isPlayer) {
                    this.input(dt, spd);
                    if(keys.r && this.rCD <= 0) this.useGear();
                    updateHUD(this);
                } else this.ai(dt, spd);
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
                if(mouse.down && this.basicCD <= 0) { this.fireAK47(); this.basicCD = 0.1; }
                if(keys.q && this.qCD <= 0) this.bombaclat();
                if(keys.e && this.eCD <= 0) this.fahhhhhh();
                if(keys.f && this.fCD <= 0) this.ultimateTrueDamage();
                if(keys.g && this.gCD <= 0) this.speedBoost();
            }

            fireAK47() {
                this.revealTimer = 0.3;
                for(let i = 0; i < 3; i++) {
                    entities.push(new Projectile(this, this.x, this.y, this.angle + (Math.random() - 0.5) * 0.3, 1000, 1000, 600, '#222'));
                }
            }

            bombaclat() {
                this.revealTimer = 0.6;
                let bomb = {
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(this.angle) * 600,
                    vy: Math.sin(this.angle) * 600,
                    maxDist: 800,
                    dist: 0,
                    radius: 15,
                    owner: this,
                    shouldExplode: false,
                    update(dt) {
                        this.x += this.vx * dt;
                        this.y += this.vy * dt;
                        this.vy += 300 * dt; // gravity
                        this.dist = Math.sqrt((this.x - this.owner.x)**2 + (this.y - this.owner.y)**2);
                        
                        // Check if touching enemy in 200 radius
                        for(let e of entities) {
                            if(e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team) {
                                let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                if(d < 200) {
                                    this.shouldExplode = true;
                                    break;
                                }
                            }
                        }
                    },
                    draw(ctx, camX, camY) {
                        ctx.save();
                        ctx.translate(this.x - camX, this.y - camY);
                        
                        // Grenade body (dark gray/black sphere)
                        ctx.fillStyle = '#1a1a1a';
                        ctx.beginPath();
                        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Grenade highlight
                        ctx.fillStyle = '#444';
                        ctx.beginPath();
                        ctx.arc(-this.radius/3, -this.radius/3, this.radius/3, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Fuse
                        ctx.strokeStyle = '#FFD700';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, -this.radius);
                        ctx.lineTo(Math.cos(performance.now() * 0.005) * 5, -this.radius - 8);
                        ctx.stroke();
                        
                        ctx.restore();
                    },
                    explode() {
                        for(let e of entities) {
                            if(e !== this.owner && !e.dead && e instanceof Entity && Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2) < 300) {
                                e.takeDamage(99999, this.owner);
                            }
                        }
                        for(let i = 0; i < 20; i++) {
                            particles.push(new Particle(this.x, this.y, '#FF0000', 5, 0.8));
                        }
                    }
                };
                window.dayumBombs = window.dayumBombs || [];
                window.dayumBombs.push(bomb);
                this.qCD = 5;
            }

            fahhhhhh() {
                this.revealTimer = 0.5;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < 300) {
                            e.takeDamage(500, this);
                            e.applyStatus('stun', 5, this);
                        }
                    }
                }
                for(let i = 0; i < 30; i++) {
                    particles.push(new Particle(this.x + Math.random() * 200 - 100, this.y + Math.random() * 200 - 100, '#0FF', 3, 0.6));
                }
                this.eCD = 5;
            }

            ultimateTrueDamage() {
                this.revealTimer = 1;
                screenShake(20);
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < 1000) {
                            let trueDamage = this.maxHp;
                            e.takeDamage(trueDamage, this);
                        }
                    }
                }
                for(let i = 0; i < 50; i++) {
                    particles.push(new Particle(this.x + Math.random() * 400 - 200, this.y + Math.random() * 400 - 200, '#FFD700', 8, 1));
                }
                this.fCD = 10;
            }

            speedBoost() {
                this.speedActive = true;
                this.speedTimer = 3;
                this.speed = this.baseSpd * 10;
                for(let i = 0; i < 15; i++) {
                    particles.push(new Particle(this.x, this.y, '#FFA500', 2, 0.4));
                }
                this.gCD = 15;
            }

            ai(dt, spd) {
                if(this.handleSafeZone && this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if(!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if(d > 220) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                }
                if(this.basicCD <= 0 && d < 220) this.fireAK47();
                if(this.qCD <= 0 && d < 650) this.bombaclat();
                if(this.eCD <= 0 && d < 340) this.fahhhhhh();
                if(this.fCD <= 0 && d < 700) this.ultimateTrueDamage();
                if(this.gCD <= 0 && this.hp < this.maxHp * 0.55) this.speedBoost();
            }

            findTarget() {
                let c = null, md = 9999;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < md) { md = d; c = e; }
                    }
                }
                return c;
            }

            wander(dt, spd) {
                if(Math.random() < 0.05) this.angle += (Math.random() - 0.5) * 1;
                this.x += Math.cos(this.angle) * spd * 0.5 * dt;
                this.y += Math.sin(this.angle) * spd * 0.5 * dt;
            }

            draw(ctx) {
                super.draw(ctx);
            }
        }

        // DEFENSE TOWER CLASS - 5v5 Mode
        class DefenseTower extends Entity {
            constructor(x, y, team, isMain) {
                super(x, y, 50, team === 1 ? '#4A90E2' : '#FF6B6B', 10000);
                this.team = team;
                this.isMain = isMain;
                this.isPlayer = false;
                this.name = team === 1 ? 'Blue Tower' : 'Red Tower';
                this.attackCD = 0;
                this.attackRange = 350;
                this.attackDamage = 200;
                this.speed = 0; // Towers don't move
                this.countsAsFFAHero = false;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.attackCD > 0) this.attackCD -= dt;
                
                // Attack nearby enemies
                if (this.attackCD <= 0) {
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < this.attackRange) {
                                e.takeDamage(this.attackDamage, this);
                                this.attackCD = 2;
                                break;
                            }
                        }
                    }
                }
            }
            
            draw(ctx) {
                // Draw tower base (bigger)
                ctx.fillStyle = this.team === 1 ? '#4A90E2' : '#FF6B6B';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 50, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw tower top (antenna)
                ctx.fillStyle = this.team === 1 ? '#2E5C8A' : '#CC3333';
                ctx.fillRect(this.x - camera.x - 4, this.y - camera.y - 35, 8, 30);
                
                // Tower health bar (red background)
                ctx.fillStyle = '#3a0000';
                ctx.fillRect(this.x - camera.x - 25, this.y - camera.y - 60, 50, 4);
                
                // Tower health bar (green fill)
                ctx.fillStyle = '#0f0';
                ctx.fillRect(this.x - camera.x - 25, this.y - camera.y - 60, (this.hp / this.maxHp) * 50, 4);
            }
        }
        
        // MAIN TOWER CLASS - Final objective in 5v5
        class MainTower extends Entity {
            constructor(x, y, team) {
                super(x, y, 60, team === 1 ? '#00BFFF' : '#FF4444', 20000);
                this.team = team;
                this.isMain = true;
                this.isPlayer = false;
                this.name = team === 1 ? 'Blue Base' : 'Red Base';
                this.attackCD = 0;
                this.attackRange = 400;
                this.attackDamage = 250;
                this.speed = 0; // Towers don't move
                this.countsAsFFAHero = false;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.attackCD > 0) this.attackCD -= dt;
                
                // Attack nearby enemies
                if (this.attackCD <= 0) {
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x) ** 2 + (e.y - this.y) ** 2);
                            if (d < this.attackRange) {
                                e.takeDamage(this.attackDamage, this);
                                this.attackCD = 1.5;
                                break;
                            }
                        }
                    }
                }
            }
            
            draw(ctx) {
                // Draw main tower base (large circle)
                ctx.fillStyle = this.team === 1 ? '#00BFFF' : '#FF4444';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 60, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw tower core (brighter center)
                ctx.fillStyle = this.team === 1 ? '#00ffff' : '#ff6666';
                ctx.beginPath();
                ctx.arc(this.x - camera.x, this.y - camera.y, 40, 0, Math.PI * 2);
                ctx.fill();
                
                // Tower health bar (larger)
                ctx.fillStyle = '#3a0000';
                ctx.fillRect(this.x - camera.x - 50, this.y - camera.y - 70, 100, 5);
                ctx.fillStyle = '#0f0';
                ctx.fillRect(this.x - camera.x - 50, this.y - camera.y - 70, (this.hp / this.maxHp) * 100, 5);
                
                // HP text
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(Math.ceil(this.hp), this.x - camera.x, this.y - camera.y + 10);
            }
        }

