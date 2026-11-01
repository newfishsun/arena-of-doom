        class Darrick extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#b5651d' : '#8b4513', 4700);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Darrick)' : 'Enemy Darrick';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.rCD = 0; this.fCD = 0;
                this.baseSpd = 180; this.speed = this.baseSpd; this.agility = 0.65;
                this.revolverBoostTimer = 0; // Q active timer
                this.dashTimer = 0; this.dashDir = new Vector2(0,0);
                this.nextBasicStun = false; // set by E, consumed by next basic hit
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;

                if (this.revolverBoostTimer > 0) {
                    this.revolverBoostTimer -= dt;
                    if (this.revolverBoostTimer <= 0) this.speed = this.baseSpd;
                }

                if (this.dashTimer > 0) {
                    this.dashTimer -= dt;
                    this.x += this.dashDir.x * 900 * dt;
                    this.y += this.dashDir.y * 900 * dt;
                }

                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) { this.input(dt, spd); updateHUD(this); } else this.ai(dt, spd);
            }

            input(dt, spd) {
                // During the dash lock movement — stable unit dash; still allow aiming
                if (this.dashTimer > 0) {
                    this.angle = getMouseAimAngle(this.x, this.y);
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
                if (mouse.down && this.basicCD <= 0) this.basicAttack();
                if (keys.q && this.qCD <= 0) this.revolverBoost();
                if (keys.e && this.eCD <= 0) this.quickDash();
                if (keys.f && this.fCD <= 0) this.chainBlast();
                if (keys.r && this.rCD <= 0) this.useGear();
            }

            basicAttack() {
                this.revealTimer = 0.6;
                this.basicCD = (this.revolverBoostTimer > 0) ? 0.2 : 0.3;

                // Revolver projectile: higher damage and longer range for marksman feel
                let proj = new Projectile(this, this.x + Math.cos(this.angle) * this.radius, this.y + Math.sin(this.angle) * this.radius, this.angle, 1400, 60, 1600, '#ffd700', 4);
                proj.onHit = (target) => {
                    try {
                        // if dash flagged the next basic, apply stun and consume
                        if (this.nextBasicStun) { target.applyStatus('stun', 1.0, this); this.nextBasicStun = false; }

                        // per-attacker hit counter on the target -> 5 hits => 300 true damage
                        if (!target._darrickHits) target._darrickHits = {};
                        let rec = target._darrickHits[this.id] || { count: 0, last: 0 };
                        if (Date.now() - (rec.last || 0) > 5000) rec.count = 0; // reset after 5s of inactivity
                        rec.count++;
                        rec.last = Date.now();
                        target._darrickHits[this.id] = rec;
                        if (rec.count >= 5) {
                            rec.count = 0;
                            // apply true damage (bypass shield) but attribute it to Darrick
                            target.hp -= 300;

                            // credit Darrick for this damage in training trackers
                            if (gameMode === 'training' && this.isPlayer && window.trainingStats) {
                                if (!window.trainingStats.countingStarted) { window.trainingStats.countingStarted = true; window.trainingStats.startTime = Date.now(); }
                                window.trainingStats.totalDamage += 300;
                            }

                            // show damage popup
                            if (typeof damageTexts !== 'undefined') damageTexts.push({ x: target.x, y: target.y - target.radius - 10, text: '-300', color: '#ff00ff', life: 0.9 });

                            if (target.hp <= 0) target.die(this);
                            for (let i = 0; i < 10; i++) particles.push(new Particle(target.x, target.y, '#ff00ff', 4, 0.6, (Math.random()-0.5)*200, (Math.random()-0.5)*200));
                            if (this.isPlayer) addKillMsg('🔪 Revolver Finale!');
                        }
                    } catch (e) { console.warn('Darrick onHit error', e); }
                };

                entities.push(proj);
                for (let i = 0; i < 6; i++) particles.push(new Particle(this.x + Math.cos(this.angle) * this.radius, this.y + Math.sin(this.angle) * this.radius, '#ffd54f', 3, 0.3, Math.cos(this.angle) * (Math.random()*120), Math.sin(this.angle) * (Math.random()*120)));
                screenShake(1.5);
            }

            revolverBoost() {
                this.qCD = 5; this.revolverBoostTimer = 3; this.speed = this.baseSpd * 1.5;
                for (let i = 0; i < 18; i++) particles.push(new Particle(this.x, this.y, '#ffd54f', 3, 0.6, (Math.random()-0.5)*300, (Math.random()-0.5)*300));
                if (this.isPlayer) addKillMsg('🔫 Revolver Boost!');
            }

            quickDash() {
                this.eCD = 4; this.dashTimer = 0.18; this.dashDir = new Vector2(Math.cos(this.angle), Math.sin(this.angle));
                this.nextBasicStun = true;
                for (let i = 0; i < 10; i++) particles.push(new Particle(this.x, this.y, '#fff', 2, 0.45, (Math.random()-0.5)*200, (Math.random()-0.5)*200));
                if (this.isPlayer) addKillMsg('💨 Quick Draw');
            }

            chainBlast() {
                this.fCD = 14;
                const owner = this;
                const baseDist = 120;
                const radius = 120;

                // Lock the chain direction/anchors to the first explosion (use cast-time origin/angle)
                const castAngle = owner.angle;
                const castOriginX = owner.x;
                const castOriginY = owner.y;

                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        // Use cast-time origin + angle so later explosions don't follow player movement/aim
                        let ex = castOriginX + Math.cos(castAngle) * baseDist * (i + 1);
                        let ey = castOriginY + Math.sin(castAngle) * baseDist * (i + 1);

                        // Explosion particles / ring
                        for (let p = 0; p < 28; p++) {
                            let ang = Math.random() * Math.PI * 2;
                            let vel = new Vector2(Math.cos(ang), Math.sin(ang)).mult(280);
                            particles.push(new Particle(ex, ey, i === 4 ? '#ff3333' : '#ff9900', 4, 0.7, vel.x, vel.y));
                        }
                        ringEffects.push({ x: ex, y: ey, r: 20, fade: 1, color: i === 4 ? '#ff3333' : '#ff8800' });

                        for (let e of entities) {
                            if (e === owner || e.dead || !(e instanceof Entity) || e.team === owner.team) continue;
                            let d = Math.sqrt((e.x - ex) ** 2 + (e.y - ey) ** 2);
                            if (d < radius) {
                                let dmg = (i === 4) ? 700 : 350;
                                e.takeDamage(dmg, owner);
                                e.revealTimer = 1.0;
                                if (i < 4) {
                                    // move enemy exactly to the next explosion center (based on cast origin/angle)
                                    let nx = castOriginX + Math.cos(castAngle) * baseDist * (i + 2);
                                    let ny = castOriginY + Math.sin(castAngle) * baseDist * (i + 2);
                                    e.x = nx; e.y = ny;
                                }
                            }
                        }
                        if (owner.isPlayer) screenShake(4);
                    }, i * 100);
                }
                if (this.isPlayer) addKillMsg('💥 Chain Blast!');
            }

            draw(ctx) {
                super.draw(ctx);
                // Cowboy hat emoji above
                ctx.fillStyle = '#fff'; ctx.font = '20px Arial'; ctx.textAlign = 'center';
                ctx.fillText('🤠', this.x - camera.x, this.y - camera.y - this.radius - 18);

                // Q active aura
                if (this.revolverBoostTimer > 0) {
                    ctx.save();
                    ctx.globalAlpha = 0.25 + 0.25 * Math.sin(Date.now() * 0.01);
                    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 12 + (Math.random()*6), 0, Math.PI * 2); ctx.stroke();
                    ctx.restore();
                }
            }

            ai(dt, spd) {
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                this.angle = Math.atan2(dy, dx);
                if (d > 300) { this.x += Math.cos(this.angle) * spd * dt; this.y += Math.sin(this.angle) * spd * dt; }
                else {
                    if (d > 1200 && this.basicCD <= 0) this.basicAttack();
                    else if (d > 300 && this.basicCD <= 0) this.basicAttack();
                    if (this.qCD <= 0 && d < 600) this.revolverBoost();
                    if (this.eCD <= 0 && d < 300) this.quickDash();
                    if (this.rCD <= 0 && d < 600) this.chainBlast();
                }
            }
        }

        window.selectHero = function(h) {
            console.log('➡️ selectHero() called with:', h);
            
            // Check if hero is enabled for selection
            if (window.heroEnabled[h] === false) {
                console.log('   Hero', h, 'is disabled for development');
                return; // Don't select disabled heroes
            }
            
            selectedHeroType=h;
            console.log('   selectedHeroType is now:', selectedHeroType);
            document.querySelectorAll('.hero-card').forEach(c=>c.classList.remove('selected'));
            let c=document.getElementById('card-'+h);
            console.log('   Card element found?', !!c);
            if(c)c.classList.add('selected');
        }

        // Function to update hero card visual states based on enabled flags
        window.updateHeroCardStates = function() {
            document.querySelectorAll('.hero-card').forEach(card => {
                const heroName = card.id.replace('card-', '');
                if (window.heroEnabled[heroName] === false) {
                    card.classList.add('disabled');
                } else {
                    card.classList.remove('disabled');
                }
            });
        }

        window.toggleControlsPanel = function() {
            let panel = document.getElementById('controlsPanel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        }

        window.toggleHeroInfo = function(hero) {
            let card = document.querySelector('#card-' + hero);
            let mode = card.getAttribute('data-desc-mode') || 'simple';
            let descSelector = mode === 'simple' ? '.hero-description.simple' : '.hero-description.advanced';
            let desc = card.querySelector(descSelector);
            if (desc) {
                desc.style.display = desc.style.display === 'none' ? 'block' : 'none';
            }
        }

        window.toggleDescriptionMode = function(hero, event) {
            event.stopPropagation();
            let card = document.querySelector('#card-' + hero);
            let currentMode = card.getAttribute('data-desc-mode') || 'simple';
            let newMode = currentMode === 'simple' ? 'advanced' : 'simple';
            
            card.setAttribute('data-desc-mode', newMode);
            
            // Hide all descriptions
            card.querySelectorAll('.hero-description').forEach(desc => desc.style.display = 'none');
            
            // Show new mode description
            let newDesc = card.querySelector('.hero-description.' + newMode);
            if (newDesc) {
                newDesc.style.display = 'block';
            }
            
            // Update button text to show CURRENT mode
            let btn = card.querySelector('.mode-toggle-btn');
            if (btn) {
                btn.innerText = newMode === 'simple' ? 'Simple' : 'Advanced';
            }
        }

        window.toggleHeroInfo = function(hero) {
            // Skip showing info for secret hero
            if (hero === 'dayum') return;
            
            let card = document.querySelector('#card-' + hero);
            let mode = card.getAttribute('data-desc-mode') || 'simple';
            let descSelector = mode === 'simple' ? '.hero-description.simple' : '.hero-description.advanced';
            let desc = card.querySelector(descSelector);
            if (desc) {
                desc.style.display = desc.style.display === 'none' ? 'block' : 'none';
            }
        }

        window.toggleCorneliusAscend = function(event) {
            if (event) event.stopPropagation();
            let card = document.querySelector('#card-cornelius');
            let baseStats = document.getElementById('cornelius-base-stats');
            let ascendedStats = document.getElementById('cornelius-ascended-stats');
            let titles = document.querySelectorAll('#cornelius-form-title');
            
            if (!baseStats || !ascendedStats) return;
            
            // Toggle stat bar visibility
            if (baseStats.style.display !== 'none') {
                // Switch to ascended
                baseStats.style.display = 'none';
                ascendedStats.style.display = 'block';
                titles.forEach(t => t.innerText = 'ASCENDED FORM - Divine Retribution');
                card.style.borderColor = '#ff0000';
            } else {
                // Switch back to base
                baseStats.style.display = 'block';
                ascendedStats.style.display = 'none';
                titles.forEach(t => t.innerText = 'BASE FORM - Cursed Avenger');
                card.style.borderColor = '';
            }
        }

        window.toggleBrunoAscend = function(event) {
            if (event) event.stopPropagation();
            let card = document.querySelector('#card-bruno');
            let baseStats = document.getElementById('bruno-base-stats');
            let ascendedStats = document.getElementById('bruno-ascended-stats');
            let title = document.getElementById('bruno-form-title');
            if (!baseStats || !ascendedStats) return;
            if (baseStats.style.display !== 'none') {
                baseStats.style.display = 'none';
                ascendedStats.style.display = 'block';
                if (title) title.innerText = 'ASCENDED FORM - Sword of Justice';
                if (card) card.style.borderColor = '#d72626';
            } else {
                baseStats.style.display = 'block';
                ascendedStats.style.display = 'none';
                if (title) title.innerText = 'BASE FORM - Scientific Collar';
                if (card) card.style.borderColor = '';
            }
        }

        window.toggleTwinsMode = function(event) {
            if (event) event.stopPropagation();
            let card = document.querySelector('#card-twins');
            let kenStats = document.getElementById('twins-stats-ken');
            let matthewStats = document.getElementById('twins-stats-matthew');
            let mattenStats = document.getElementById('twins-stats-matten');
            let modeTitle = document.getElementById('twins-mode-title');
            let formInfo = document.getElementById('twins-form-info');
            
            if (!kenStats || !matthewStats || !mattenStats) return;
            
            let currentMode = card.getAttribute('data-twins-mode') || 'ken';
            let nextMode = currentMode === 'ken' ? 'matthew' : currentMode === 'matthew' ? 'matten' : 'ken';
            card.setAttribute('data-twins-mode', nextMode);
            
            kenStats.style.display = 'none';
            matthewStats.style.display = 'none';
            mattenStats.style.display = 'none';
            
            if (nextMode === 'ken') {
                kenStats.style.display = 'block';
                modeTitle.innerText = 'KEN 🏈';
                formInfo.innerText = 'KEN - Aggressive Striker';
                card.style.borderColor = '#FF6B6B';
            } else if (nextMode === 'matthew') {
                matthewStats.style.display = 'block';
                modeTitle.innerText = 'MATTHEW 🛡';
                formInfo.innerText = 'MATTHEW - Defensive Support';
                card.style.borderColor = '#4ECDC4';
            } else if (nextMode === 'matten') {
                mattenStats.style.display = 'block';
                modeTitle.innerText = 'MATTEN 🔗 (FUSED)';
                formInfo.innerText = 'MATTEN - Fusion Combined';
                card.style.borderColor = '#FFD700';
            }
        }

        window.toggleBountyMode = function(event) {
            if (event) event.stopPropagation();
            let card = document.querySelector('#card-bounty');
            let statBars = card.querySelectorAll('.stat-bar-fill');
            
            // Toggle between melee and ranged stats
            let isMelee = card.getAttribute('data-mode') !== 'ranged';
            let newMode = isMelee ? 'ranged' : 'melee';
            card.setAttribute('data-mode', newMode);
            
            if (newMode === 'ranged') {
                // Ranged stats: Survival 50%, Damage 80%, Agility 65%, Speed 70%
                statBars[0].style.width = '50%';
                statBars[1].style.width = '80%';
                statBars[2].style.width = '65%';
                statBars[3].style.width = '70%';
            } else {
                // Melee stats: Survival 80%, Damage 70%, Agility 80%, Speed 60%
                statBars[0].style.width = '80%';
                statBars[1].style.width = '70%';
                statBars[2].style.width = '80%';
                statBars[3].style.width = '60%';
            }
            // Update visible role text
            try {
                let roleP = card.querySelector('p');
                if (roleP) roleP.textContent = (newMode === 'ranged') ? 'Marksman/Assassin (Ranged)' : 'Tank/Assassin (Melee)';
            } catch (err) { /* ignore */ }
        }

        // Initialize hero cards on page load
        window.initializeHeroCards = function() {
            let heroCards = document.querySelectorAll('.hero-card');
            heroCards.forEach(card => {
                // Add data attribute if not exists
                if (!card.getAttribute('data-desc-mode')) {
                    card.setAttribute('data-desc-mode', 'simple');
                }
                
                // Add toggle button if not exists
                if (!card.querySelector('.mode-toggle-btn')) {
                    let statsDiv = card.querySelector('.hero-stats');
                    let heroName = card.id.replace('card-', '');
                    let btn = document.createElement('button');
                    btn.className = 'mode-toggle-btn';
                    btn.innerText = 'Simple';
                    btn.onclick = function(e) { toggleDescriptionMode(heroName, e); };
                    card.insertBefore(btn, statsDiv);
                    
                    // Hide toggle button for secret hero
                    if (heroName === 'dayum') {
                        btn.style.display = 'none';
                    }
                }
                // Ensure bounty card role text reflects current data-mode
                if (card.id === 'card-bounty') {
                    try {
                        let mode = card.getAttribute('data-mode') || 'melee';
                        let roleP = card.querySelector('p');
                        if (roleP) roleP.textContent = (mode === 'ranged') ? 'Marksman/Assassin (Ranged)' : 'Tank/Assassin (Melee)';
                    } catch (err) {}
                }
                
                // Convert single description to dual descriptions if needed
                let desc = card.querySelector('.hero-description:not(.simple):not(.advanced)');
                if (desc) {
                    // Clone for simple mode
                    let simpleDesc = desc.cloneNode(true);
                    simpleDesc.className = 'hero-description simple';
                    simpleDesc.style.display = 'none';
                    
                    // Create advanced mode copy with detailed descriptions
                    let advancedDesc = simpleDesc.cloneNode(true);
                    advancedDesc.className = 'hero-description advanced';
                    advancedDesc.style.display = 'none';
                    
                    // Enhance advanced description with details
                    let heroName = card.id.replace('card-', '');
                    enhanceAdvancedDescription(heroName, advancedDesc);
                    
                    // Replace original
                    desc.replaceWith(simpleDesc);
                    simpleDesc.after(advancedDesc);
                }
            });
            
            // Update hero card states based on enabled flags
            updateHeroCardStates();
        }

        // Enhance descriptions with detailed numbers for advanced mode
        window.enhanceAdvancedDescription = function(heroName, descElement) {
            let detailedDescriptions = getDetailedDescriptions();
            
            if (detailedDescriptions[heroName]) {
                let details = detailedDescriptions[heroName];
                let pElements = descElement.querySelectorAll('p');
                
                // details[0] = backstory, details[1+] = abilities
                pElements.forEach((p, index) => {
                    if (details[index]) {
                        p.innerHTML = details[index];
                    }
                });
            }
        }

        // Comprehensive detailed descriptions for all heroes
        window.getDetailedDescriptions = function() {
            return {
                paul: [
                    'A powerful gunslinger known for his explosive firepower. Paul dominates with devastating shotgun blasts and rocket attacks.',
                    '<strong>Basic - Shotgun Blast:</strong> Fires 6 explosive pellets in spread dealing 150 damage each. <em>(0.15s cooldown)</em>',
                    '<strong>Q - Rocket Barrage:</strong> Launches 8 rockets in wide spread, each dealing 800 damage. <em>(4s cooldown)</em>',
                    '<strong>E - Dash Boost:</strong> Dashes 600 distance dealing 400 damage to path enemies, grants 1.5x speed for 3s. <em>(9s cooldown)</em>',
                    '<strong>F - Ultimate Rocket:</strong> Fires massive rocket dealing 2000 damage in 400 radius on impact. <em>(15s cooldown)</em>'
                ],
                faik: [
                    'A proud Turkish warrior, Faik fights with a steadfast blade and warrior\'s spirit. He is a tanky bruiser who punishes enemies with chained dashes and life-stealing sword energy.',
                    '<strong>Basic - Sword Slash:</strong> Normal sword slash dealing 200 damage. <em>(1.5s cooldown)</em>',
                    '<strong>Q - Triple Short Dash (➡️):</strong> Three short dashes chained by pressing Q again. Dashes 1 and 2 deal 250 damage each; dash 3 deals 400 damage and knocks back. 0.5s window to chain. <em>(7s cooldown)</em>',
                    '<strong>E - Sword Energy (💠):</strong> Releases an energy wave that deals 780 damage to nearby enemies and heals Faik for 40% of damage dealt. <em>(5s cooldown)</em>',
                    '<strong>F - Blood Rage (🩸):</strong> Instantly deals 300 damage to nearby enemies and heals Faik for the damage dealt. For 8s, basic attacks become an energy slash dealing 70 damage (0.2s cd) and heal 50% of damage dealt. <em>(20s cooldown)</em>'
                ],
                noob: [
                    'Noob appeared in this world without explanation. He simply arrived one day with no memory of where he came from, only the feeling that he did not belong. Young Builderman took him in, and Noob learned to blend in while secretly remembering that he is not from this world.',
                    '<strong>Q - Bloxy Cola:</strong> Drinks potion for 2s, grants +650 shield and 1.5x speed for 5s. First 2 basic attacks deal 2.5x damage and stun. <em>(12s cooldown)</em>',
                    '<strong>E - Rocket Jump:</strong> Fires rocket projectile dealing 700 damage. <em>(8s cooldown)</em>',
                    '<strong>F - Laser Beam:</strong> Fires laser in line up to 800 distance dealing 400 damage, reduces 20% defense for 5s. <em>(5s cooldown)</em>'
                ],
                kaiser: [
                    'A noble warrior with imperial powers. Kaiser commands the battlefield with powerful punches and ultimate authority.',
                    '<strong>Q - Imperial Punch:</strong> Fires imperial projectile dealing 1200 damage, heals on hit. <em>(10s cooldown)</em>',
                    '<strong>E - Wind Dash:</strong> Dashes forward 300ms duration, heals 150 HP per enemy hit. Dash cooldown resets on hit. <em>(4s cooldown)</em>',
                    '<strong>F - Emperor\'s Decree:</strong> Empowers all abilities with 2x damage for 2s, applies slowness. <em>(15s cooldown)</em>'
                ],
                tate: [
                    'Tate started with nothing but his fists, fighting through the streets and winning every underground boxing match. Wealth, fame, and Bugattis followed, but survival gave way to ego. Now he is wealthy and egoistic, still skilled but no longer hungry.',
                    '<strong>Q - Shield Bash:</strong> Bashes with shield, adds +600 shield to self, stuns enemies in radius. <em>(7s cooldown)</em>',
                    '<strong>E - Power Punch:</strong> Powerful punch applying knockback and damaging enemies. <em>(6s cooldown)</em>',
                    '<strong>F - Bugatti:</strong> Activates a custom supercar for 5s, granting 2.5x movement speed and +850 shield until crash or duration end. Crash on enemy deals 1200 damage. <em>(25s cooldown)</em>'
                ],
                edgar: [
                    'A stealthy assassin who strikes from the shadows. Edgar uses his blades and demonic powers to eliminate targets silently.',
                    '<strong>Q - Shadow Strike:</strong> Dashes to location dealing 600 damage to path enemies in 200 radius. <em>(8s cooldown)</em>',
                    '<strong>E - Demon Blade:</strong> Summons blades dealing 450 damage to nearby enemies in 250 radius. <em>(8s cooldown)</em>',
                    '<strong>F - Demonic Fury:</strong> Becomes invisible for 6s, deals 1000 damage on next basic attack. Grants 2x attack speed. <em>(25s cooldown)</em>'
                ],
                builderman: [
                    'Builderman has always found purpose in creating structures, machines, and defenses that protect people. He never wanted fame, only to build things that mattered. His quietest memory is of a wanderer who appeared from nowhere, became his friend, and disappeared just as quickly.',
                    '<strong>Q - Sentry Gun:</strong> Deploys sentry auto-attacking nearby enemies at 200 damage per hit. <em>(Instant)</em>',
                    '<strong>E - Overclock:</strong> Overclocks all devices increasing damage output by 150%. <em>(15s cooldown)</em>',
                    '<strong>F - Subspace Tripmine:</strong> Places proximity mine exploding for 600 damage when enemies approach. <em>(8s cooldown)</em>'
                ],
                glace: [
                    'A chilling ice mage who controls the battlefield with frost and blizzards. Glace traps enemies with ice and unleashes devastating cold attacks.',
                    '<strong>Q - Iceberg:</strong> Creates iceberg stunning enemies for 1s, changes basic to Glacier Bow (600 range). <em>(18s cooldown)</em>',
                    '<strong>E - Blizzard:</strong> Rectangular blizzard dealing 300 damage per 0.1s to enemies over 8s. <em>(10s cooldown)</em>',
                    '<strong>F - Ice Shatter:</strong> Breaks iceberg into 30 shards, each dealing 200 damage in 300 radius total. <em>(7s cooldown)</em>'
                ],
                water: [
                    'Wesley is a powerful water mage and tank hybrid who commands aquatic energy. With defensive abilities and crowd control, he protects himself and overwhelms enemies.',
                    '<strong>Basic - Water Shot:</strong> Shoots water projectiles at enemies. <em>(1.15s cooldown)</em>',
                    '<strong>Q - Water Claw:</strong> Claws nearby enemies, applying slowness. <em>(6s cooldown)</em>',
                    '<strong>E - Water Heal:</strong> Heals yourself over time. Enhanced basic attacks (Water Blow) deal heavy damage, apply knockback, and grant a shield. <em>(8s cooldown)</em>',
                    '<strong>F - Water Energy Blast:</strong> Pulls all nearby enemies toward you, constantly stunning them and dealing damage. Takes reduced damage during pull. <em>(12s cooldown)</em>',
                    '<strong>Passive - Special Shield:</strong> Has a passive shield that blocks strong damage or reduces incoming damage on weak attacks.'
                ],
                ash: [
                    'Ash is a master swordsman who can switch between aggressive attacker and defensive tank modes using powerful armor abilities. With high HP, he dominates any battlefield style.',
                    '<strong>Basic:</strong> Sword swing 125 damage, 1s CD (0.6s with armor). +75 dmg with armor',
                    '<strong>Q - Throw Sword:</strong> Spinning projectile 800 dmg, applies 1s Slowness IV, 200 radius splash 320 dmg, returns healing 500. <em>(4s)</em>',
                    '<strong>E - Heavy Swing:</strong> 450 dmg, grants enhanced 600 dmg strike, cannot move, knockback enemies. <em>(5s)</em>',
                    '<strong>F - Special Armor:</strong> 30% dmg buff, 30% dmg reduction, 1.5x speed, +75 basic dmg, enhanced 800 dmg for 40s. <em>(40s)</em>',
                    '<strong>G - Switch Mode:</strong> Toggle to Tank Mode. <em>(10s)</em>'
                ],
                gamb: [
                    'Gamb is a high-stakes gambler who brings randomness to every battle. His abilities are unpredictable, powerful, and risky.',
                    '<strong>Q - Rolling Dice:</strong>1,4,7 for nothing,2,5,8 for one charge of reroll health and 3,6,9 give a charge for E/F(2s cooldown)</em>',
                    '<strong>E - Laser Gun:</strong> Fire a charged laser beam dealing 1250 base damage with random effects,either triple damage,gaining a shield or blows up your health if unlucky!<em>(8s cooldown)</em>',
                    '<strong>F - Lucky Hat:</strong> Wears a lucky hat with a faster speed and minigun with 10x faster cooldown and less range,you either get nothing,defense buff or even gear cooldown recharge!<em>(15s cooldown)</em>',
                    '<strong>G - Reroll Health:</strong> Gamble with your life force! Randomly reroll current health between 2500-8500 max health. Can store up to 3 charges that regenerate over time. High-risk, high-reward survival tool. <em>(1.5s cooldown per charge)</em>'
                ],
                gregory: [
                    'Gregory is a time-warping inventor who cracks open timelines with experimental tech and pure instinct. He can shift between now and the future to pressure enemies, punish mistakes, and vanish before the fight catches up.',
                    '<strong>Basic:</strong> Clock projectile — 150 damage, 1s cooldown.',
                    '<strong>Q:</strong> Time Creation — dash forward with electrical wrap, deal constant nearby damage, and add a direct-hit bonus of 470 damage. <em>(4s cooldown)</em>',
                    '<strong>E:</strong> Step into the Future — push time forward by 3 seconds, deal 580 damage, shock enemies, and reduce enemy ability cooldowns by 2s. <em>(7s cooldown)</em>',
                    '<strong>F:</strong> Time Machine — enter the future timeline, heal 1060 HP, gain 1.6x speed, clear Q/E cooldowns, and unlock future-timeline abilities. <em>(18s cooldown)</em>',
                    '<strong>Future Basic:</strong> Time Flash — 65 damage, 0.3s cooldown.',
                    '<strong>Future Q:</strong> Greatest Invention — pull enemies in with time distortion, slow them, and deal 1200 damage.',
                    '<strong>Future E:</strong> Mark a back-to-the-past location, hit nearby enemies for 400 damage, move backward through time to the mark, deal 1200 damage in the path, then return to the present and deal another 400 damage. <em>(30s cooldown)</em>',
                    '<strong>Stats:</strong> 5300 HP • Time-travel evader / assassin • high mobility • huge burst potential'
                ],
                neo: [
                    'He was born in a <strong>dystopian future timeline</strong>—a world where neon-lit cities towered over crumbling ruins, and corporations ruled with iron fists. His parents were low-level technicians who worked for a mega-corporation that experimented with cybernetic enhancements. When Neo was 12, his parents were killed in a <strong>corporate purge</strong>—a routine cleaning of "redundant assets." Neo survived only because he was small enough to hide in a ventilation shaft. He watched his parents die through a grate, unable to scream, unable to move.',
                    '<strong>Basic - Neon Shot:</strong> Fires small neon energy at enemies. <em>(0.2s cooldown)</em>',
                    '<strong>Q - Neon Burst:</strong> Shoots multiple neon energies in a burst. Cannot change direction during cast. <em>(4s cooldown)</em>',
                    '<strong>E - Sector Burst:</strong> Bursts neon energies in a wide sector. Walk faster, cannot use other abilities. <em>(10s cooldown)</em>',
                    '<strong>F - Neon Hook:</strong> Pulls enemies in range dealing damage, applies stun effect. <em>(13s cooldown)</em>',
                    '<strong>G - Skating:</strong> Grants extreme speed buff. Touching enemies gives shield. <em>(25s cooldown)</em>'
                ],
                chimera: [
                    'Chimera is a mystical mage/fighter who can shift between her base form and a mode that mimics enemies\' abilities. Every damage taken converts to healing.',
                    '<strong>Basic - Stab:</strong> Stab attack with moderate cooldown',
                    '<strong>Q - Tornado:</strong> Forward tornado pulling enemies and dealing damage over time. <em>(11s cooldown)</em>',
                    '<strong>E - Dash:</strong> Two-stage dash hitting enemies on the path and marking them. <em>(4s cooldown)</em>',
                    '<strong>F - Chimera Burst:</strong> Long narrow sector burst with high damage, links enemies, executes low health targets. <em>(20s cooldown)</em>'
                ],
                mamba: [
                    'A deadly fighter inspired by the black mamba snake. Mamba uses basketball skills and helicopter prowess to dominate the arena.',
                    '<strong>Q - Basketball Shot:</strong> Fires basketball projectile 500 damage with 200 knockback distance. <em>(6s cooldown)</em>',
                    '<strong>E - Elbow Strike:</strong> Powerful elbow 400 damage, stuns for 0.8s in 150 radius. <em>(12s cooldown)</em>',
                    '<strong>F - Helicopter Helicopter:</strong> Transforms into helicopter, gains 2x speed, crashes dealing 800 damage. <em>(18s cooldown)</em>'
                ],
                max: [
                    'Max is an F1 racing legend with incredible speed and strength. He dominates the track with aggressive support, healing allies while crushing enemies with legendary driving skills.',
                    '<strong>Basic - Wheel Swing:</strong> Spins wheel dealing 100 damage. Enhanced version places podium flag with stun. <em>(1.15s cooldown)</em>',
                    '<strong>Q - Red Bull Can:</strong> Throws red bull can 300 damage, creates slowing pedal area 150 radius. <em>(6s cooldown)</em>',
                    '<strong>E - Healing Boost:</strong> Heals self and lowest HP teammates 690 HP each. Grants enhanced basic attack. <em>(12s cooldown)</em>',
                    '<strong>F - Car Lift Ultimate:</strong> Lifts F1 car gaining 3.3x speed for 3.3s. Crashes with 750 damage and injury effect. <em>(16.5s cooldown)</em>'
                ],
                racingduo: [
                    'Racing Duo is a legendary racing legend with a split personality: Lewis, the calm and collected champion, and Charles, the chaotic and unpredictable wildcard. They share one body and swap personalities at will, each with unique racing-themed abilities.',
                    '<strong>LEWIS Q:</strong> Gains 25% damage reduction and 25% true damage reduction for 5s. Enhanced basic throws championship 650 damage with ragebaiting (reduces 10% def). <em>(11s cooldown)</em>',
                    '<strong>LEWIS E:</strong> Drives away leaving tires behind that deal damage. Tires travel with slight randomness. <em>(7s cooldown)</em>',
                    '<strong>LEWIS F:</strong> Draw a racing line with the mouse that boosts your speed and damages enemies who stand in it. <em>(31s cooldown)</em>',
                    '<strong>CHARLES Q:</strong> Drives tractor 750 damage + 250 true damage in 300 radius. Q cooldown reduces 2x faster. <em>(8s cooldown)</em>',
                    '<strong>G - Switch Personality:</strong> Switch between Lewis and Charles modes, gaining healing for survivability. <em>(5s cooldown)</em>'
                ],
                kenshi: [
                    'Kenshi is a master samurai swordsman with incredible mobility and precision. He builds passive stacks to unleash devastating two-stage slash attacks, marking enemies for swift execution.',
                    '<strong>Basic - Samurai Slash:</strong> Slash attack, or two-stage enhanced slash if passive stacks available. <em>(0.9s cooldown)</em>',
                    '<strong>Q - Sword Energy:</strong> Launches a large moon-shaped sword energy. <em>(6s cooldown)</em>',
                    '<strong>E - Dash:</strong> Dash in your facing direction, healing and shielding yourself. Recharges passive stacks. <em>(6s cooldown)</em>',
                    '<strong>F - Ranged Rush:</strong> Rush toward the closest enemy, dealing heavy damage, stunning, and marking for injury. <em>(15s cooldown)</em>'
                ],
                benjamin: [
                    'Benjamin is a strong tank warrior with a massive hammer. He excels at protecting his team and dealing area damage with his hammer strikes.',
                    '<strong>Q - Double Swing:</strong> Two rapid hammer swings with lunge, knockback, and healing. Reduces cooldowns per hit. <em>(8s cooldown)</em>',
                    '<strong>E - Ground Slam:</strong> Large radius slam 600 damage with heavy stun in 250 radius. Reduces cooldowns. <em>(12s cooldown)</em>',
                    '<strong>F - Ultimate Shield:</strong> Grants 600 shield, deals 500 area damage, applies slowness for 3s. <em>(35s cooldown)</em>'
                ],
                ren: [
                    'Ren is a card master assassin with incredible precision. He throws deadly playing cards and marks enemies for increased true damage. His passive grants an enhanced attack every few basic attacks.',
                    '<strong>Basic - Card Throw:</strong> Throws a card, every few attacks triggers an enhanced attack that stuns. <em>(0.6s cooldown)</em>',
                    '<strong>Q - Card Barrage:</strong> Throws multiple cards in a spread pattern. <em>(5s cooldown)</em>',
                    '<strong>E - Dash & Stun:</strong> Dash forward, stun enemies in radius, activate healing from damage taken. <em>(10s cooldown)</em>',
                    '<strong>F - Ultimate Card:</strong> Throw a massive card dealing 600 damage with knockback, marking enemies for increased true damage. <em>(18s cooldown)</em>',
                    '<strong>Passive:</strong> Every few basic attacks converts to an enhanced attack dealing heavy damage and stunning.'
                ],
                carlos: [
                    'Carlos is a Brazilian assassin with a passion for football. He uses soccer skills to dodge, stun, and dominate the field.',
                    '<strong>Basic - Link Strike:</strong> Links closest enemy dealing continuous 15 damage every 0.1s for 1s total. Marked enemies also link. <em>(1.2s cooldown)</em>',
                    '<strong>Q - Dribble:</strong> Dribbles forward 600 distance stunning enemies, gains enhanced basic for 6s. <em>(10s cooldown)</em>',
                    '<strong>E - Brazilian Flair:</strong> Performs rapid stutter steps stunning nearby enemies each step, recharges Q. Takes 30% reduced damage. <em>(15s cooldown)</em>',
                    '<strong>F - Football Fever:</strong> Unleashes fireworks dealing random 500-1500 damage. Increased health and damage-based healing. <em>(25s cooldown)</em>',
                    '<strong>Passive:</strong> Successful dribbles empower Carlos\'s next basic attack(s).'
                ],
                austin: [
                    'Austin is a road constructor with incredible power and resilience, but he is tired of building roads for others. He still fights as a fighter, using his strength, roads, and crushing impacts to control the battlefield.',
                    '<strong>Basic - Link Strike:</strong> Links closest enemy dealing continuous damage. Marked enemies link. <em>(1.2s cooldown)</em>',
                    '<strong>Q - Road:</strong> Expanding road 700 true damage to 800 units, grants 1.5x speed. Lasts 8s. <em>(12s cooldown)</em>',
                    '<strong>E - Sector Building:</strong> Builds a sector that marks enemies, causing marked targets to take 4x basic damage for 4s and apply slowness III for 2s. <em>(7.5s cooldown)</em>',
                    '<strong>F - Construction:</strong> Channels a massive construction impact that heals 350+20% max HP, lands with 500 damage and a 1s stun, and lets basic attacks link 4 more enemies. <em>(15s cooldown)</em>'
                ],
                melvin: [
                    'Melvin is a volcanic trapper who uses lava to control the battlefield. He creates lasting lava pedals and traps enemies with volcanic eruptions.',
                    '<strong>Basic - Lava Throw:</strong> Throws lava projectiles that apply burn effects. <em>(1s cooldown)</em>',
                    '<strong>Q - Lava Barrage:</strong> Throws multiple lavas creating melt pedals. Each hit stuns and slows enemies. <em>(10s cooldown)</em>',
                    '<strong>E - Lava Dash:</strong> Dash leaving a lava pedal that stuns nearby enemies. Multiple charges available. <em>(4s per charge)</em>',
                    '<strong>F - Volcanic Trap:</strong> Traps the closest enemy in a volcano, dealing continuous burning damage. <em>(9s cooldown)</em>',
                    '<strong>Passive:</strong> Standing on lava pedals grants continuous healing.'
                ],
                zappa: [
                    'Zappa is a literal god of electricity who grew bored of the divine realm. She descended to the mortal world to experience life, freedom, and fun. She rides her electro bike, doodles her power into existence, and treats combat like a game. She\'s the \'cool girl\' who hangs out with Cyrus, annoys Neo, and drags everyone into chaos—all while wielding the power of a god.',
                    '<strong>Basic - Electro Bolt:</strong> Shoots electro projectiles. <em>(0.8s cooldown)</em>',
                    '<strong>Q - Electro Bike:</strong> Rides an electro bike leaving a trail. Crashing deals heavy electro damage. Multiple charges with brief delays. <em>(14s per charge)</em>',
                    '<strong>E - Doodles:</strong> Places doodles that deal electro damage over time. Standing on them teleports you and grants an enhanced dash. <em>(3s per charge)</em>',
                    '<strong>F - Zap:</strong> Zaps the closest enemy for 750 damage plus an extra 750 electro damage, marking them for increased electro damage taken and applying slowness. <em>(15s cooldown)</em>',
                    '<strong>Passive - Electro:</strong> Electro spreads to nearby enemies, creating linked chains of electrical damage.'
                ],
                cyrus: [
                    'Cyrus is a genius marksman-mage whose technology has become so advanced that he only needs drones to aid him on the battlefield. But Zappa is always dragging him into the outside world, forcing Cyrus to stay alert and defensive while he protects himself with drones and energy weapons.',
                    '<strong>Basic - Energy Pistol:</strong> Rapid-fire pistol shots that scale with the target\'s max HP. Each shot is small but quick. <em>(0.18s cooldown)</em>',
                    '<strong>Q - Energy Cannon:</strong> Fires a blue-cyan laser in front of him, dealing 200 base damage plus 15% of the target\'s max HP and slowing enemies. <em>(5s cooldown)</em>',
                    '<strong>E - Sky Flash:</strong> Fires a flash strike at the exact mouse location within 750 range, dealing 500 damage and stunning for 0.75s. <em>(7s cooldown)</em>',
                    '<strong>F - Drone Deployment:</strong> Deploys a combat drone for 10s. You can shut it down after 3s or let it end naturally. During drone control, you are stun-immune and take 50% damage while gaining 750 shield. <em>(20s cooldown)</em>',
                    '<strong>Passive - Drone Harvest:</strong> Using the drone heals 15% of the damage you deal while in control.'
                ],
                ambrose: [
                    'Ambrose is a dark assassin-mage who combines swift mobility with lethal toxin effects. He teleports in, amplifies his basic attacks briefly, and converts portions of his damage into toxic damage against marked targets.',
                    '<strong>Basic - Dark Energy:</strong> Fires dark energy at enemies. After a successful <strong>Q</strong> teleport, Ambrose gains an enhanced basic for a short time that deals increased damage (melee enhanced claw hits are stronger). <em>(1s / 0.5s cooldown)</em>',
                    '<strong>Q - Dark Self:</strong> Launches a dark self projectile that teleports Ambrose to the hit target and grants enhanced basic. Useful for gap-closing and initiating fights. <em>(10s cooldown)</em>',
                    '<strong>E - Dark Circle:</strong> Creates a dark circle that damages nearby enemies, heals Ambrose for a portion of damage dealt, and applies strong slowness. <em>(5s cooldown)</em>',
                    '<strong>F - Raven Ultimate:</strong> Sends a raven that marks a target and pulls Ambrose toward it with a fixed, fast pull. The pull completes with a short stun on the target. Marked enemies display a raven emoji and are affected by Ambrose\'s toxin interaction (see passive). <em>(22s cooldown)</em>',
                    '<strong>Passive - Toxic Curse:</strong> When Ambrose\'s attacks hit a marked enemy, a portion of that attack (15% of the triggering damage) is converted into toxin damage and applied shortly after the hit as a DOT. Marks persist for a limited time and show the 🐦 emoji on the target.'
                ],
                yun: [
                    'Yun is a swift spear warrior with incredible mobility and combat precision. She dominates through rapid spear attacks and can activate a sky scrapper mode to control the battlefield.',
                    '<strong>Basic - Spear Thrust:</strong> Thrust your spear forward. <em>(1.5s cooldown)</em>',
                    '<strong>Q - Spear Stabs:</strong> Performs rapid continuous spear stabs, healing per hit and slowing enemies. Cannot move during. <em>(10s cooldown)</em>',
                    '<strong>E - Immunity Mode:</strong> Grants temporary immunity and enhances your next basic attack. <em>(6s cooldown)</em>',
                    '<strong>F - Sky Scrapper:</strong> Jumps to a location dealing area damage with knockback. Activates sky scrapper mode granting damage reduction, speed boost, and healing based on damage. <em>(18s cooldown)</em>'
                ],
                lav: [
                    'Lav is a compassionate support mage who spreads love and protection to her allies. She strengthens her team through healing and speed boosts while dealing subtle damage to enemies.',
                    '<strong>Basic - Love Projectile:</strong> Shoots a love projectile at enemies. <em>(1s cooldown)</em>',
                    '<strong>Q - Love Boost:</strong> Grants significant movement speed boost and heals the lowest health teammate and yourself. Basic attacks speed up. <em>(18s cooldown)</em>',
                    '<strong>E - Love Ball:</strong> Shoots a love ball that damages and stuns enemies. <em>(3s cooldown)</em>',
                    '<strong>F - Love Ultimate:</strong> Explodes in an area stunning enemies and healing the lowest health teammate based on their max health. <em>(20s cooldown)</em>',
                    '<strong>Passive - Love Power:</strong> Gain love power stacks from kills, increasing your max health. Max stacks grant substantial survivability boost.'
                ],
                gigi: [
                    'Gigi is a gamer and digital enthusiast who manifests pixel bots to help her team. She dominates through team healing and pixel-powered combats, creating a digital arena where allies gain overwhelming speed advantage.',
                    '<strong>Q - Pixel Bot Summon:</strong> Summons powerful pixel bots. Each bot deals damage and stuns on hit. <em>(8s cooldown)</em>',
                    '<strong>E - Excessive Grinding:</strong> Heals your entire team and reduces Q cooldown. <em>(10s cooldown)</em>',
                    '<strong>F - Pixel Arena:</strong> Arena grants speed boost. Deals 3% max HP true damage to highest health enemy per 0.1s. <em>(26s cooldown)</em>'
                ],
                nos: [
                    'Nos is a powerful tank wielding a trident, capable of enhancing his attacks to deal true damage and creating fields of nightmare.',
                    '<strong>Q - Trident Swing:</strong> Swings trident with windup dealing heavy damage, converting all attacks to true damage for short time. <em>(4s cooldown)</em>',
                    '<strong>E - Life Steal:</strong> Steals health from multiple nearby enemies and gains a shield. <em>(7s cooldown)</em>',
                    '<strong>F - Nightmare Jump:</strong> Jumps to target location with windup, dealing heavy damage and stunning. Creates nightmare field granting true damage. <em>(25s cooldown)</em>'
                ],
                kai: [
                    'Kai is a mystical assassin who harnesses magical energy. Kai uses ink and magic to dash through enemies and heal from combat.',
                    '<strong>Q - Energy Burst:</strong> Releases magical energy damaging nearby enemies and granting extra dashes. <em>(6s cooldown)</em>',
                    '<strong>E - Ink Pen:</strong> Throws an ink pen that damages and marks enemies. Available as multiple charges. <em>(0.5s per charge)</em>',
                    '<strong>F - Dash Sequence:</strong> Initiates rapid dashes through enemies. Trigger a powerful magic storm by hitting enemies multiple times. <em>(Instant)</em>'
                ],
                li: [
                    'Li is a legendary water warrior who commands the flow of combat with exceptional mobility and precision strikes. A master of fluid martial arts, Li dominates through speed and devastating technique.',
                    '<strong>Basic - Punch/Kick Combo:</strong> Alternates between a punch and a dash-kick combo. <em>(Alternates)</em>',
                    '<strong>Q - Water Flow Punch:</strong> Performs continuous rapid water punches, reducing damage taken during the barrage. Cannot move or change direction. Slows enemies. <em>(9s cooldown)</em>',
                    '<strong>E - Dragon Kick:</strong> Forward kick that stuns enemies and grants a shield based on damage dealt. <em>(6s cooldown)</em>',
                    '<strong>F - Water Dragon Form:</strong> Transform into water dragon form, creating a realm that amplifies damage. Basic hits charge your passive ability. <em>(24s cooldown)</em>',
                    '<strong>Passive - Honor of Fighting:</strong> Abilities charge honor. Max charges trigger a powerful Water Dragon ability.'
                ],
                ming: [
                    'Ming is a shadowy assassin who uses mirrors to deceive and strike from unexpected angles.',
                    '<strong>Q - Whirling Slash:</strong> Spin dealing heavy damage scaling with target health. Heals on hit. <em>(5s cooldown)</em>',
                    '<strong>E - Mirror Dash:</strong> Dash dealing damage and healing per hit. Creates mirror form. <em>(4s cooldown)</em>',
                    '<strong>F - Blink To Mirror:</strong> Teleport to mirror dealing damage and gaining shield. <em>(8s cooldown)</em>',
                    '<strong>F - Realm of Mirrors:</strong> Summon a mirror realm that damages enemies inside and grants you significant damage reduction. Recharges Q and E. <em>(Ability)</em>'
                ],
                coolkidd: [
                    'Coolkidd is a kid who got hacks from a dark web, one day his hack suddenly gets stronger and now he can burn others to hell.',
                    '<strong>Q - Fire Pizza:</strong> Throws a pizza that explodes and applies burn effects. <em>(5s cooldown)</em>',
                    '<strong>E - Hack:</strong> Gains extra true damage and speed buff. Next basic throws brick dealing slowness. <em>(11s cooldown)</em>',
                    '<strong>F - Summon Minions:</strong> Summons minions attacking closest enemy, applying burn effect. <em>(22s cooldown)</em>'
                ],
                don: [
                    'Don is a powerful mage with exceptional mobility, mastering the art of arrows and spirit energy to dominate the battlefield.',
                    '<strong>Q - Magic Arrows:</strong> Shoots multiple arrows applying slowness to enemies. <em>(5s cooldown)</em>',
                    '<strong>E - Dash Attack:</strong> Dashes forward attacking with an arrow. Multiple charges available. <em>(4s per charge)</em>',
                    '<strong>F - Spirit Bomb:</strong> Launches homing spirit bomb 800 target damage, 400 others, stuns for 0.5s. <em>(10s cooldown)</em>'
                ],
                fletcher: [
                    'A precision sniper who prioritizes accuracy and long-range dominance. Fletcher excels at eliminating threats from a distance with surgical strikes.',
                    '<strong>Basic - Sniping Shot:</strong> 180 damage, 1.2s cooldown.',
                    '<strong>Q - Radar 📡:</strong> Reveal enemy locations and apply Slowness III for 10s, showing hidden enemies even in bushes. <em>(13s cooldown)</em>',
                    '<strong>E - Pro Sniper 🎯:</strong> Hold E to zoom; release fires a devastating sniper shot (2250 damage) after a 2s delay. 3 charges with 10s charge cooldown. <em>(10s per charge)</em>',
                    '<strong>F - Fortified Shot:</strong> Recharges 1 E charge, grants 450 shield and causes the next E to redirect to the closest enemy within 250 radius. <em>(17s cooldown)</em>'
                ],
                darrick: [
                    'A quick-draw cowboy marksman — long-range revolver shots with a stacking "fifth-shot" true-damage finish and high mobility.',
                    '<strong>Basic - Revolver Shot:</strong> Fires a precise revolver bullet that deals 60 damage. 0.3s base cooldown. (5th hit from Darrick within 5s deals 300 true damage)',
                    '<strong>Q - Revolver Boost 🔫:</strong> Reduces basic cooldown by 0.1s and grants 1.5x movement speed for 3s. <em>(5s cooldown)</em>',
                    '<strong>E - Quick Draw 💨:</strong> Dash forward; your next revolver shot stuns for 1s (single use). <em>(4s cooldown)</em>',
                    '<strong>F - Chain Blast 💥:</strong> Triggers 5 explosions in a line (0.1s apart). First 4 deal 350 damage + knockback to the next explosion location; last deals 700 damage (no knockback). <em>(14s cooldown)</em>'
                ],
                noli: [
                    'A mysterious unknown being wielding void powers. Noli combines melee and magical abilities to dominate the battlefield.',
                    '<strong>Q - Void Form:</strong> Takes 20% less damage and transforms basic attacks into ranged void stars for 3 casts. First cast explodes and pulls enemies, second teleports to explosion, third deals massive damage and marks enemies with hallucination. <em>(10s cooldown)</em>',
                    '<strong>E - Void Rush:</strong> Rushes forward dealing damage and applying hallucination. Hold to continue rushing, can do second rush for massive damage. <em>(13s cooldown)</em>',
                    '<strong>F - Glitched State:</strong> Enters glitched state damaging nearby enemies over time and gaining speed boost. <em>(11s cooldown)</em>'
                ],
                wesley: [
                    'Wesley was the flow master who completed the path before the younger generation rose. He trained Li, and Li carried that discipline forward to teach the next generation, including Kai and Yun.',
                    '<strong>Basic - Water Shot:</strong> Shoots water projectiles at enemies. <em>(1.15s cooldown)</em>',
                    '<strong>Q - Water Claw:</strong> Claws nearby enemies, applying a light slow. <em>(6s cooldown)</em>',
                    '<strong>E - Water Heal:</strong> Heals yourself over time. Nearby enemies take a brief, lighter slow while the heal lasts. Enhanced basic attacks still deal heavy damage and grant a shield. <em>(8s cooldown)</em>',
                    '<strong>F - Water Energy Blast:</strong> Pulls enemies in a forward cone toward you, constantly stunning them and dealing damage. Takes reduced damage during pull. <em>(14s cooldown)</em>',
                    '<strong>Passive - Flow Guardian:</strong> Triggered shield mitigation is stronger and recovers faster, while enhanced basic hits grant a bit less shield than before.'
                ],
                light: [
                    'A being of pure light energy. Light manipulates time and space to outmaneuver and eliminate enemies.',
                    '<strong>Passive - Light Stacks:</strong> Build up to 3 light stacks by using abilities. At 3 stacks, your basic attack becomes a powerful Light Dragon Stab that pierces through enemies. <em>(Passive)</em>',
                    '<strong>Q - Light Circle:</strong> Creates a circle of light that damages enemies and heals you. <em>(4s cooldown)</em>',
                    '<strong>E - Curved Dash:</strong> Dashes in a curved path, damaging enemies along the way. <em>(5s cooldown)</em>',
                    '<strong>F - Rewind:</strong> Rewinds time to a previous position, damaging enemies in the area. <em>(10s cooldown)</em>'
                ],
                acheron: [
                    'A dark entity from the underworld. Acheron manipulates black holes and demonic powers to pull enemies to their doom.',
                    '<strong>Q - Black Hole:</strong> Creates black hole pulling enemies 600 distance toward center, deals 800 damage on arrival. <em>(10s cooldown)</em>',
                    '<strong>E - Nihility Form:</strong> Becomes invisible with 3x speed for 6s, leaves damaging trail 150 damage/hit. Press again for 700 true damage burst. <em>(0.5s / 10s cooldown)</em>',
                    '<strong>F - Underworld Rage:</strong> Rage state 2x damage for 8s with demonic transformations and execute effect on low HP enemies. <em>(28s cooldown)</em>'
                ],
                buster: [
                    'Buster is a versatile tank/fighter who uses hologram technology and defensive shields. He records damage and amplifies it strategically.',
                    '<strong>Basic - Light Shots:</strong> Fires light shots that pierce through enemies, hitting each only once. <em>(1.5s cooldown)</em>',
                    '<strong>Q - Hologram:</strong> Creates a hologram that records damage. Basic attacks speed up while recording. Press Q again to unleash the recorded damage. <em>(8s cooldown)</em>',
                    '<strong>E - Triangle Aura:</strong> Fills with a slowly spinning triangle aura that slows enemies. Damage amplified during aura. <em>(12s cooldown)</em>',
                    '<strong>F - Deflection Shield:</strong> Creates a shield in front that deflects projectiles and pushes enemies away. <em>(15s cooldown)</em>'
                ],
                monza: [
                    'Monza is a ruthless mafia boss who rules Italia with an iron fist. He commands his loyal goons to dominate the battlefield while he eliminates enemies with precision and force.',
                    '<strong>Basic - Sword Swing:</strong> A swift sword swing dealing damage to nearby enemies. <em>(1s cooldown)</em>',
                    '<strong>Q - Boss Command:</strong> Summons two goons around you. Goons target lowest HP enemies within 300 radius with your basic attack power. Goons gain 2x your movement speed and last 10s. You gain a rifle dealing damage. <em>(15s cooldown)</em>',
                    '<strong>E - Gotcha:</strong> Windup 0.5s (cannot move, can change direction). Rush 4x speed (cannot change direction/abilities until hitting enemy or max range). Direct hit deals heavy damage and heal. Circle slash at end deals damage and heals 50%. <em>(10s cooldown)</em>',
                    '<strong>F - Pizza Time:</strong> Grants pizza buff to you and all goons. Reduces basic attack cooldown by 0.25s for 8s. Summons one additional goon. Displays "pizza time 🍕". <em>(17s cooldown)</em>'
                ],
                jimeka: [
                    "Jimeka is a chaotic jester who brings unpredictability to the battlefield. With confusing abilities and random effects, she keeps enemies guessing while dealing massive damage.",
                    "<strong>Basic - Dart Throw:</strong> Throws sharp dart projectiles dealing 150 damage. <em>(0.8s cooldown)</em>",
                    "<strong>Q - Jester's Toss:</strong> Launches 10 projectiles in spread, each dealing 200 damage with circus burst. <em>(6s cooldown)</em>",
                    "<strong>E - Prankster's Play:</strong> Applies self-confusion (shuffles abilities) and banana peel trap stun. <em>(8s cooldown)</em>",
                    "<strong>F - GUESS!:</strong> Random variant: Big Bang (1000 AoE), Shield (500), Lightning (4x300), Speed (2x), Freeze (2s stun), Fireworks (10x150), Punchline (500 true + execute), Heal (400), Swap, Clones (3). <em>(15s cooldown)</em>",
                    "<strong>G - Reroll:</strong> Rerolls F ability variant. <em>(10s cooldown)</em>"
                ]
            };
        }

        // Call on document load
        document.addEventListener('DOMContentLoaded', initializeHeroCards);

        window.toggleRacingDuoMode = function() {
            let lewisStats = document.getElementById('racingduo-lewis-stats');
            let charlesStats = document.getElementById('racingduo-charles-stats');
            let desc = document.getElementById('racingduo-description');
            let title = document.getElementById('racingduo-mode-title');
            let mainTitle = document.getElementById('racingduo-title');
            
            // Close description panel when switching modes
            if (desc) {
                desc.style.display = 'none';
            }
            
            if (lewisStats.style.display === 'none') {
                // Switch to Lewis
                lewisStats.style.display = 'block';
                charlesStats.style.display = 'none';
                title.innerText = 'LEWIS - THE CALM CHAMPION';
                mainTitle.innerText = 'RACING DUO - LEWIS';
                const racingRoleEl = document.getElementById('racingduo-role');
                if (racingRoleEl) racingRoleEl.innerText = 'Fighter/Speedster';
                desc.innerHTML = `
                    <h4>LEWIS - THE CALM CHAMPION</h4>
                    <p><strong>Survival:</strong> 75% | <strong>Damage:</strong> 65% | <strong>Agility:</strong> 45% | <strong>Speed:</strong> 90% | <strong>Difficulty:</strong> 80%</p>
                    <p><strong>Basic - Driving Wheel:</strong> Throws a driving wheel at enemies. <em>(0.8s cooldown)</em></p>
                    <p><strong>Q - Calmed Confidence:</strong> Gains 25% damage reduction and 25% true damage reduction. Enhanced basic throws championship (650 damage) with ragebaiting (10% def reduction). <em>(11s cooldown)</em></p>
                    <p><strong>E - Tire Madness:</strong> Drives away leaving tires (200 damage each, 0.1s interval). Tires travel with randomness. <em>(7s cooldown)</em></p>
                    <p><strong>F - Draw Racing Line:</strong> Draw racing line granting 3x speed and dealing 77 damage + 44 true damage/sec. Line lasts 7s. <em>(31s cooldown)</em></p>
                    <p><strong>G - Switch Personality:</strong> Switch to Charles mode with 5s cooldown. <em>(5s cooldown)</em></p>
                `;
            } else {
                // Switch to Charles
                lewisStats.style.display = 'none';
                charlesStats.style.display = 'block';
                title.innerText = 'CHARLES - THE CHAOTIC WILDCARD';
                mainTitle.innerText = 'RACING DUO - CHARLES';
                const racingRoleEl = document.getElementById('racingduo-role');
                if (racingRoleEl) racingRoleEl.innerText = 'Attacker/Speedster';
                desc.innerHTML = `
                    <h4>CHARLES - THE CHAOTIC WILDCARD</h4>
                    <p><strong>Survival:</strong> 65% | <strong>Damage:</strong> 75% | <strong>Agility:</strong> Dynamic | <strong>Speed:</strong> Dynamic | <strong>Difficulty:</strong> 80%</p>
                    <p><strong>Basic - Driving Wheel:</strong> Throws driving wheel (100 damage) at enemies. <em>(0.8s cooldown)</em></p>
                    <p><strong>Q - Tractor Time:</strong> Drives tractor (0.8x speed) crashing with 750 damage + 250 true damage (300 radius). Q cooldown 2x faster. <em>(8s cooldown)</em></p>
                    <p><strong>E - Box Now Box:</strong> 30% chance Q back with 2.5x speed (5s) OR 70% heal 600 HP with 50% slowness (10s). <em>(12s cooldown)</em></p>
                    <p><strong>F - Banana Leclerc:</strong> Transform shooting 4 bananas (600 speed, 10 radius) each dealing 100 damage with 0.25s stun. Resets Q. <em>(18s cooldown)</em></p>
                    <p><strong>G - Switch Personality:</strong> Switch to Lewis mode granting 2x speed for 3s. <em>(5s cooldown)</em></p>
                `;
            }
        }

        window.toggleAshMode = function() {
            let atkStats = document.getElementById('ash-attacker-stats');
            let tankStats = document.getElementById('ash-tank-stats');
            let desc = document.getElementById('ash-description');
            let title = document.getElementById('ash-mode-title');
            
            if (atkStats.style.display === 'none') {
                // Switch to Attacker
                atkStats.style.display = 'block';
                tankStats.style.display = 'none';
                title.innerText = 'ATTACKER MODE';
                // Close and update description for attacker mode
                desc.style.display = 'none';
                desc.innerHTML = `
                    <h4>ATTACKER MODE</h4>
                    <p><strong>Basic:</strong> Sword swing 125 damage (1s CD, 0.6s with armor). +75 dmg with armor</p>
                    <p><strong>Q - Throw Sword:</strong> Spinning projectile 800 dmg, applies 1s Slowness IV, 200 radius splash 320 dmg, returns healing 500. <em>(4s)</em></p>
                    <p><strong>E - Heavy Swing:</strong> 450 dmg, grants enhanced 600 dmg strike, cannot move, knockback enemies. <em>(5s)</em></p>
                    <p><strong>F - Special Armor:</strong> 30% dmg buff, 30% dmg reduction, 1.5x speed, +75 basic dmg, enhanced 800 dmg for 40s. <em>(40s)</em></p>
                `;
            } else {
                // Switch to Tank
                atkStats.style.display = 'none';
                tankStats.style.display = 'block';
                title.innerText = 'TANK MODE';
                // Close and update description for tank mode
                desc.style.display = 'none';
                desc.innerHTML = `
                    <h4>TANK MODE (25% passive damage reduction)</h4>
                    <p><strong>Basic:</strong> Sword swing 125 damage (1s CD, 0.6s with armor). +75 dmg with armor</p>
                    <p><strong>Q - Forward Stab:</strong> 600 dmg, 1s stun, Speed III (+30%) for 3s, cannot move during stab. <em>(4s)</em></p>
                    <p><strong>E - Sword Stomp:</strong> 950 dmg in radius, 2s slow, injured effect 10s, heals 80% damage dealt. With armor: 1100 dmg. <em>(5s)</em></p>
                    <p><strong>F - Special Armor:</strong> 30% dmg reduction, 30% shield (health lost), 150 radius slow, +75 basic dmg, stomp 1100 dmg. <em>(40s)</em></p>
                `;
            }
        }

        window.toggleChimeraMode = function() {
            let baseStats = document.getElementById('chimera-stats-base');
            let chimeraStats = document.getElementById('chimera-stats-chimera');
            let title = document.getElementById('chimera-mode-title');
            let desc = document.getElementById('heroDesc');
            
            // Close info panel on mode switch
            if (desc) {
                desc.style.display = 'none';
            }
            
            if (baseStats.style.display === 'none') {
                // Switch to Base Mode
                baseStats.style.display = 'block';
                chimeraStats.style.display = 'none';
                title.innerText = 'CHIMERA - BASE MODE';
            } else {
                // Switch to Chimera Mode
                baseStats.style.display = 'none';
                chimeraStats.style.display = 'block';
                title.innerText = 'CHIMERA - CHIMERA MODE';
            }
        }

        window.startGame = function() {
            // Handle Online FFA/duel mode differently
            if(gameMode === 'ffa_online' || gameMode === 'duel_online'){
                // Start online multiplayer session
                if(typeof startFFAMultiplayerSession !== 'undefined'){
                    startFFAMultiplayerSession(selectedHeroType, 'Player');
                    return; // Don't continue with regular game initialization
                }else{
                    alert('Multiplayer module not loaded. Please refresh the page.');
                    return;
                }
            }
            
            // Close ALL hero info panels at game start
            let allDescriptions = document.querySelectorAll('.hero-description');
            allDescriptions.forEach(desc => desc.style.display = 'none');
            
            let desc = document.getElementById('heroDesc');
            if (desc) desc.style.display = 'none';
            
            // Preserve skin modal if it's open - don't auto-close it
            let skinModal = document.getElementById('skinSelectModal');
            let skinModalWasOpen = skinModal && skinModal.style.display === 'block';
            
            document.getElementById('heroSelectScreen').style.display='none';
            document.getElementById('controlsBtn').style.display='none';
            let controlsPanel = document.getElementById('controlsPanel');
            if(controlsPanel) controlsPanel.style.display='none';
            
            // Restore skin modal visibility if it was open before game start
            if(skinModalWasOpen && skinModal) {
                skinModal.style.display = 'block';
                skinModal.style.zIndex = '2001'; // Ensure it's above game elements
            }
            
            document.getElementById('hud').style.display='block';
            let q=document.getElementById('iconQ'),e=document.getElementById('iconE'),f=document.getElementById('iconF'),g=document.getElementById('iconG');
            
            
            // Fix Paul/default hero emoji issues
            let iconQ = document.getElementById('iconQ');
            if(iconQ && (iconQ.innerText === '█' || iconQ.innerText.charCodeAt(0) === 65533)) {
                iconQ.innerText = '🔥';
            }
            let iconF = document.getElementById('iconF');
            if(iconF && iconF.innerText === '💣') {
                iconF.innerText = '💥';
            }
            
            // Create mobile controls after game starts (only for mobile devices)
            if (navigator.maxTouchPoints > 0 || window.innerWidth < 768) {
                createMobileControls();
            }

            resetMatchVisuals();
            window.fallenStatueSpawned = false;
            
            // Spawn bushes (disabled in training mode; reduced on mobile for performance)
            if(gameMode !== 'training') {
                let isMobile = navigator.maxTouchPoints > 0 || window.innerWidth < 768;
                let bushCount = isMobile ? 30 : 100;  // Reduce from 100 to 30 on mobile
                for(let i=0;i<bushCount;i++)bushes.push(new Bush(Math.random()*WORLD_SIZE,Math.random()*WORLD_SIZE,50+Math.random()*80));
            }

            // Spawn player - use if/else (WORKS! dynamic lookup won't work here)
            if(selectedHeroType==='noob')player=new Noob(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='kaiser')player=new Kaiser(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='tate')player=new Tate(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='edgar')player=new Edgar(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='coolkidd')player=new Coolkidd(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='builderman')player=new Builderman(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='mamba')player=new Mamba(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='light')player=new LightHero(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='kai')player=new Kai(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='acheron')player=new Acheron(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='noli')player=new Noli(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='don')player=new Don(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='faik'){if(q)q.innerText='➡️';if(e)e.innerText='💠';if(f)f.innerText='🩸';player=new Faik(WORLD_SIZE/2,WORLD_SIZE/2,true);}            
            else if(selectedHeroType==='darrick'){if(q)q.innerText='🔫';if(e)e.innerText='💨';if(f)f.innerText='💥';player=new Darrick(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='fletcher'){if(q)q.innerText='📡';if(e)e.innerText='🎯';if(f)f.innerText='💥';player=new Fletcher(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='glace')player=new Glace(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='ming')player=new Ming(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='nos')player=new Nos(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='carlos')player=new Carlos(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='buster')player=new Buster(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='ren')player=new Ren(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='melvin')player=new Melvin(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='gamb')player=new Gamb(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='winston'){if(q)q.innerText='💨';if(e)e.innerText='➡️';if(f)f.innerText='🌀';player=new Winston(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='neo')player=new Neo(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='chimera')player=new Chimera(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='li')player=new Li(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='lav')player=new Lav(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='max')player=new Max(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='fred')player=new Fred(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='kenshi')player=new Kenshi(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='gigi')player=new Gigi(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='benjamin')player=new Benjamin(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='zappa')player=new Zappa(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='cyrus')player=new Cyrus(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='austin')player=new Austin(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='ambrose'){if(q)q.innerText='👤';if(e)e.innerText='🌀';if(f)f.innerText='🐦';player=new Ambrose(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='wesley')player=new Wesley(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='ash')player=new Ash(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='yun')player=new Yun(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='racingduo')player=new RacingDuo(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='monza')player=new Monza(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='christian')player=new Christian(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='vival')player=new Vival(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='aurora')player=new Aurora(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='caskrice')player=new Caskrice(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='zeus')player=new Zeus(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='bai')player=new Bai(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='apollo')player=new Apollo(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='lune')player=new Lune(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='bruno'){if(q)q.innerText='🧪';if(e)e.innerText='⚔️';if(f)f.innerText='☄️';if(g)g.innerText='✦';player=new BrunoAlexander(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='bounty')player=new BountyHunter(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='dayum')player=new Dayum(WORLD_SIZE/2,WORLD_SIZE/2,true);
            else if(selectedHeroType==='gregory'){if(q)q.innerText='⏳';if(e)e.innerText='🌀';if(f)f.innerText='🕰️';player=new Gregory(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='amir'){if(q)q.innerText='🍛';if(e)e.innerText='💨';if(f)f.innerText='🚚';player=new Amir(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='steven'){if(q)q.innerText='⚔️';if(e)e.innerText='⚛️';if(f)f.innerText='💫';player=new Steven(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='cornelius'){if(q)q.innerText='⚔';if(e)e.innerText='💨';if(f)f.innerText='🌍';player=new Cornelius(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='twins'){if(q)q.innerText='🏈';if(e)e.innerText='💨';if(f)f.innerText='🔥';player=new Twins(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='guest'){if(q)q.innerText='🛡️';if(e)e.innerText='⚡';if(f)f.innerText='👊';if(g)g.innerText='⚔️';player=new Guest(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='jimeka'){if(q)q.innerText='🎪';if(e)e.innerText='🤡';if(f)f.innerText='❓';if(g)g.innerText='🎲';player=new Jimeka(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else if(selectedHeroType==='trent'){if(q)q.innerText='👊';if(e)e.innerText='🫁';if(f)f.innerText='💥';if(g)g.innerText='🏃';player=new Trent(WORLD_SIZE/2,WORLD_SIZE/2,true);}
            else player=new Paul(WORLD_SIZE/2,WORLD_SIZE/2,true);
            entities.push(player);
            player.gear = selectedGear;
            // Apply selected skin for all heroes, including ones without a predeclared currentSkin property
            player.currentSkin = selectedSkins[selectedHeroType] || 'default';
            if (heroEntranceLines[selectedHeroType]) {
                addKillMsg(`${player.name}: "${heroEntranceLines[selectedHeroType]}"`);
            }
            
            // Entrance sounds for Don Pollo and Real Top G
            if ((selectedHeroType === 'tate' && player.currentSkin === 'Real Top G') ||
                (selectedHeroType === 'don' && player.currentSkin === 'Don Pollo')) {
                let sounds = getSkinSounds(selectedHeroType, player.currentSkin);
                if(sounds && sounds.entrance) {
                    let audio = new Audio(sounds.entrance);
                    audio.volume = 0.8;
                    audio.play().catch(e => console.log('Sound failed:', e));
                }
                if(typeof onlineSocket!=='undefined'&&onlineSocket&&gameMode&&gameMode.includes('online')){
                    onlineSocket.emit('abilitySound',{ability:'entrance',x:player.x,y:player.y,heroType:selectedHeroType,skin:player.currentSkin});
                }
            }

            // Team assignment based on game mode
            if(gameMode === '1v1') {
                // 1v1 mode: register exactly one opposing AI using the selected hero class.
                player.x = 1500;
                player.y = WORLD_SIZE / 2;
                player.team = 1;

                let duelEnemy = new player.constructor(3500, WORLD_SIZE / 2, false);
                duelEnemy.team = 2;
                duelEnemy.name = `1v1 Opponent (${duelEnemy.constructor.name})`;
                duelEnemy.gear = ['speedster', 'rage', 'blink'][Math.floor(Math.random() * 3)];
                if (typeof duelEnemy.ai !== 'function') duelEnemy.ai = Entity.prototype.ai;
                entities.push(duelEnemy);
            } else if(gameMode === 'squad') {
                // Squad mode: 25 teams, 3 players each
                player.team = 0; // Player is on team 0
                
                // Create enemy squad spawn bases - distribute into 4 quadrants
                let enemySquadSpawns = [];
                let quadrantSize = WORLD_SIZE / 2;
                for(let t = 1; t <= 24; t++) {
                    let sx, sy;
                    let quadrant = Math.floor((t - 1) / 6); // 6 teams per quadrant
                    
                    if(quadrant === 0) { // Top-left
                        sx = Math.random() * (quadrantSize * 0.8) + 200;
                        sy = Math.random() * (quadrantSize * 0.8) + 200;
                    } else if(quadrant === 1) { // Top-right
                        sx = Math.random() * (quadrantSize * 0.8) + quadrantSize + 200;
                        sy = Math.random() * (quadrantSize * 0.8) + 200;
                    } else if(quadrant === 2) { // Bottom-left
                        sx = Math.random() * (quadrantSize * 0.8) + 200;
                        sy = Math.random() * (quadrantSize * 0.8) + quadrantSize + 200;
                    } else { // Bottom-right
                        sx = Math.random() * (quadrantSize * 0.8) + quadrantSize + 200;
                        sy = Math.random() * (quadrantSize * 0.8) + quadrantSize + 200;
                    }
                    
                    sx = Math.max(150, Math.min(WORLD_SIZE - 150, sx));
                    sy = Math.max(150, Math.min(WORLD_SIZE - 150, sy));
                    enemySquadSpawns.push({x: sx, y: sy});
                }
                
                // Spawn player's 2 teammates near player (team 0)
                for(let i = 0; i < 2; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 100 + Math.random() * 200; // 100-300 units from player
                    let bx = player.x + Math.cos(angle) * dist;
                    let by = player.y + Math.sin(angle) * dist;
                    
                    bx = Math.max(100, Math.min(WORLD_SIZE - 100, bx));
                    by = Math.max(100, Math.min(WORLD_SIZE - 100, by));
                    
                    let bot, r = Math.random();
                    if(r<0.13)bot=new Paul(bx,by,false);
                    else if(r<0.26)bot=new Noob(bx,by,false);
                    else if(r<0.39)bot=new Kaiser(bx,by,false);
                    else if(r<0.52)bot=new Tate(bx,by,false);
                    else if(r<0.65)bot=new Edgar(bx,by,false);
                    else if(r<0.75)bot=new Builderman(bx,by,false);
                    else if(r<0.80)bot=new Mamba(bx,by,false);
                    else if(r<0.85)bot=new LightHero(bx,by,false);
                    else if(r<0.90)bot=new Kai(bx,by,false);
                    else if(r<0.92)bot=new Noli(bx,by,false);
                    else if(r<0.94)bot=new Don(bx,by,false);
                    else if(r<0.96)bot=new Ming(bx,by,false);
                    else if(r<0.97)bot=new Glace(bx,by,false);
                    else if(r<0.98)bot=new Coolkidd(bx,by,false);
                    else if(r<0.982)bot=new Gamb(bx,by,false);
                    else if(r<0.984)bot=new Buster(bx,by,false);
                    else if(r<0.986)bot=new Ren(bx,by,false);
                    else if(r<0.988)bot=new Melvin(bx,by,false);
                    else if(r<0.990)bot=new Neo(bx,by,false);
                    else if(r<0.992)bot=new Chimera(bx,by,false);
                    else if(r<0.994)bot=new Benjamin(bx,by,false);
                    else if(r<0.996)bot=new Wesley(bx,by,false);
                    else if(r<0.9975)bot=new Zappa(bx,by,false);
                    else if(r<0.9982)bot=new Austin(bx,by,false);
                    else if(r<0.9987)bot=new Ambrose(bx,by,false);
                    else if(r<0.999)bot=new Acheron(bx,by,false);
                    else if(r<0.9993)bot=new Li(bx,by,false);
                    else if(r<0.9996)bot=new Lav(bx,by,false);
                    else if(r<0.9998)bot=new Kenshi(bx,by,false);
                    else if(r<0.99985)bot=new Gigi(bx,by,false);
                    else if(r<0.9999)bot=new RacingDuo(bx,by,false);
                    else if(r<0.99993)bot=new Monza(bx,by,false);
                    else if(r<0.99996)bot=new Vival(bx,by,false);
                    else if(r<0.99998)bot=new Aurora(bx,by,false);
                    else if(r<0.999985)bot=new Bai(bx,by,false);
                    else if(r<0.99999)bot=new Apollo(bx,by,false);
                    else if(r<0.999993)bot=new Fred(bx,by,false);
                    else if(r<0.999996)bot=new Cornelius(bx,by,false);
                    else if(r<0.999998)bot=new Jimeka(bx,by,false);
                    else bot=new Max(bx,by,false);
                    
                    bot.team = 0; // Same team as player
                    bot.name = `Teammate ${i+1}`;
                    bot.gear = ['speedster','rage','blink','bandage','visiongoggles','electrico','execution'][Math.floor(Math.random()*7)];
                    entities.push(bot);
                }
                
                // Spawn 72 bots distributed into 24 enemy teams (3 per team)
                for(let i = 0; i < 72; i++) {
                    let teamNum = Math.floor(i / 3) + 1; // Teams 1-24
                    let squadSpawn = enemySquadSpawns[teamNum - 1];
                    
                    let angle = Math.random() * Math.PI * 2;
                    let dist = Math.random() * 300;
                    let bx = squadSpawn.x + Math.cos(angle) * dist;
                    let by = squadSpawn.y + Math.sin(angle) * dist;
                    
                    bx = Math.max(100, Math.min(WORLD_SIZE - 100, bx));
                    by = Math.max(100, Math.min(WORLD_SIZE - 100, by));
                    
                    let bot, r = Math.random();
                    if(r<0.13)bot=new Paul(bx,by,false);
                    else if(r<0.26)bot=new Noob(bx,by,false);
                    else if(r<0.39)bot=new Kaiser(bx,by,false);
                    else if(r<0.52)bot=new Tate(bx,by,false);
                    else if(r<0.65)bot=new Edgar(bx,by,false);
                    else if(r<0.75)bot=new Builderman(bx,by,false);
                    else if(r<0.80)bot=new Mamba(bx,by,false);
                    else if(r<0.85)bot=new LightHero(bx,by,false);
                    else if(r<0.90)bot=new Kai(bx,by,false);
                    else if(r<0.92)bot=new Noli(bx,by,false);
                    else if(r<0.94)bot=new Don(bx,by,false);
                    else if(r<0.96)bot=new Ming(bx,by,false);
                    else if(r<0.97)bot=new Glace(bx,by,false);
                    else if(r<0.98)bot=new Coolkidd(bx,by,false);
                    else if(r<0.982)bot=new Gamb(bx,by,false);
                    else if(r<0.984)bot=new Buster(bx,by,false);
                    else if(r<0.986)bot=new Ren(bx,by,false);
                    else if(r<0.988)bot=new Melvin(bx,by,false);
                    else if(r<0.990)bot=new Neo(bx,by,false);
                    else if(r<0.992)bot=new Chimera(bx,by,false);
                    else if(r<0.994)bot=new Benjamin(bx,by,false);
                    else if(r<0.996)bot=new Wesley(bx,by,false);
                    else if(r<0.9965)bot=new Zappa(bx,by,false);
                    else if(r<0.9972)bot=new Austin(bx,by,false);
                    else if(r<0.9977)bot=new Ambrose(bx,by,false);
                    else if(r<0.9980)bot=new Li(bx,by,false);
                    else if(r<0.9987)bot=new Lav(bx,by,false);
                    else if(r<0.9992)bot=new Kenshi(bx,by,false);
                    else if(r<0.9996)bot=new Gigi(bx,by,false);
                    else if(r<0.99975)bot=new RacingDuo(bx,by,false);
                    else if(r<0.9999)bot=new Monza(bx,by,false);
                    else if(r<0.99995)bot=new Vival(bx,by,false);
                    else if(r<0.999975)bot=new Aurora(bx,by,false);
                    else if(r<0.99998)bot=new Fred(bx,by,false);
                    else if(r<0.999985)bot=new Cornelius(bx,by,false);
                    else if(r<0.999987)bot=new Jimeka(bx,by,false);
                    else bot=new Max(bx,by,false);
                    
                    bot.team = teamNum;
                    bot.name = `Team ${teamNum} Bot ${(i % 3) + 1}`;
                    bot.gear = ['speedster','rage','blink','bandage','visiongoggles','electrico','execution'][Math.floor(Math.random()*7)];
                    entities.push(bot);
                }
            } else if(gameMode === '5v5') {
                // 5v5 Mode: Team Blue (team 1) vs Team Red (team 2)
                // Compact map layout - tighter battlefield
                
                // Spawn player at left edge (Blue base)
                player.x = 800;
                player.y = 2500;
                player.team = 1;
                
                // Spawn 4 Blue teammates near left edge — sample unique heroes from a larger pool
                const bluePool = [Paul, Noob, Kaiser, Tate, Edgar, Coolkidd, Builderman, Mamba, LightHero, Kai, Acheron, Noli, Don, Glace, Ming, Nos, Buster, Ren, Melvin, Gamb, Winston, Neo, Chimera, Li, Lav, Max, Fred, Kenshi, Gigi, Benjamin, Zappa, Austin, Ambrose, Wesley, Ash, Yun, RacingDuo, Monza, Vival, Aurora, Bai, Apollo, BrunoAlexander, BountyHunter, Amir, Cornelius, Twins, Guest, Jimeka, Trent, Steven, Christian, Lune];
                let blueChoices = bluePool.slice();
                for (let k = blueChoices.length - 1; k > 0; k--) { let j = Math.floor(Math.random() * (k + 1)); [blueChoices[k], blueChoices[j]] = [blueChoices[j], blueChoices[k]]; }
                blueChoices = blueChoices.slice(0, 4);
                // Debug: log & show selected blue team composition
                try{ const blueNames = blueChoices.map(c=>c.name||'Unknown').join(', '); console.log('[5v5 spawn] Blue =>', blueNames); if(typeof showMatchDebug==='function') showMatchDebug('Blue: ' + blueNames, 3000); }catch(_){ }
                // enforce at least one support in blue team (randomly choose among available supports)
                if (!blueChoices.some(Ctor => [Lav, Gigi].includes(Ctor))) {
                    const blueSupports = bluePool.filter(c => [Lav, Gigi].includes(c));
                    if (blueSupports.length > 0) {
                        const supportOption = blueSupports[Math.floor(Math.random() * blueSupports.length)];
                        blueChoices[Math.floor(Math.random() * blueChoices.length)] = supportOption;
                    }
                }
                for(let i = 0; i < 4; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 100 + Math.random() * 150;
                    let tx = 800 + Math.cos(angle) * dist;
                    let ty = 2500 + Math.sin(angle) * dist;
                    tx = Math.max(500, Math.min(1200, tx)); // Keep in blue zone
                    ty = Math.max(1500, Math.min(3500, ty));

                    let Ctor = blueChoices[i] || Paul;
                    let teammate = new Ctor(tx, ty, false);
                    // defensive: route missing AI implementations through shared combat behavior
                    if (typeof teammate.ai !== 'function') teammate.ai = Entity.prototype.ai;
                    teammate.team = 1;
                    teammate.name = `Blue Team ${i+1}`;
                    teammate.gear = ['speedster','rage','blink'][Math.floor(Math.random()*3)];
                    entities.push(teammate);
                }

                // Spawn 5 Red team enemies at RIGHT EDGE (compact opposing side) — different pool for variety
                const redPool = [Paul, Noob, Kaiser, Tate, Edgar, Coolkidd, Builderman, Mamba, LightHero, Kai, Acheron, Noli, Don, Glace, Ming, Nos, Buster, Ren, Melvin, Gamb, Winston, Neo, Chimera, Li, Lav, Max, Fred, Kenshi, Gigi, Benjamin, Zappa, Austin, Ambrose, Wesley, Ash, Yun, RacingDuo, Monza, Vival, Aurora, Bai, Apollo, BrunoAlexander, BountyHunter, Amir, Cornelius, Twins, Guest, Jimeka, Trent, Steven, Christian, Lune];
                let redChoices = redPool.slice();
                for (let k = redChoices.length - 1; k > 0; k--) { let j = Math.floor(Math.random() * (k + 1)); [redChoices[k], redChoices[j]] = [redChoices[j], redChoices[k]]; }
                redChoices = redChoices.slice(0, 5);
                // Debug: log & show selected red team composition
                try{ const redNames = redChoices.map(c=>c.name||'Unknown').join(', '); console.log('[5v5 spawn] Red =>', redNames); if(typeof showMatchDebug==='function') showMatchDebug('Red: ' + redNames, 3000); }catch(_){ }
                // enforce at least one support in red team (randomly choose among available supports)
                if (!redChoices.some(Ctor => [Lav, Vival].includes(Ctor))) {
                    const redSupports = redPool.filter(c => [Lav, Vival].includes(c));
                    if (redSupports.length > 0) {
                        const supportOption = redSupports[Math.floor(Math.random() * redSupports.length)];
                        redChoices[Math.floor(Math.random() * redChoices.length)] = supportOption;
                    }
                }
                for(let i = 0; i < 5; i++) {
                    let angle = Math.random() * Math.PI * 2;
                    let dist = 100 + Math.random() * 150;
                    let tx = 4200 + Math.cos(angle) * dist;
                    let ty = 2500 + Math.sin(angle) * dist;
                    tx = Math.max(3800, Math.min(4500, tx)); // Keep in red zone
                    ty = Math.max(1500, Math.min(3500, ty));

                    let Ctor = redChoices[i] || Paul;
                    let enemy = new Ctor(tx, ty, false);
                    // defensive: route missing AI implementations through shared combat behavior
                    if (typeof enemy.ai !== 'function') enemy.ai = Entity.prototype.ai;
                    enemy.team = 2;
                    enemy.name = `Red Team ${i+1}`;
                    enemy.gear = ['speedster','rage','blink'][Math.floor(Math.random()*3)];
                    entities.push(enemy);
                }
                
                // Initialize 5v5 game state with revive system
                window.gameState5v5 = {
                    blueScore: 0,
                    redScore: 0,
                    gameTimer: 0,
                    maxGameTime: 600, // 10 minutes
                    reviveTimer: 0,
                    reviveDuration: 5, // revive duration in seconds (reduced from 10)
                    isReviving: false,
                    reviveQueue: [] // queue multiple pending revives
                };
                
                // Spawn towers for both teams - EXPANDED LANE LAYOUT
                // Blue team towers (left side) - spread across full height
                const blueTowerPositions = [
                    // Top lane
                    {x: 1000, y: 1200, team: 1},
                    {x: 1700, y: 1200, team: 1},
                    // Middle lane
                    {x: 1000, y: 2500, team: 1},
                    {x: 1700, y: 2500, team: 1},
                    // Bottom lane
                    {x: 1000, y: 3800, team: 1},
                    {x: 1700, y: 3800, team: 1}
                ];
                
                // Red team towers (right side) - spread across full height
                const redTowerPositions = [
                    // Top lane
                    {x: 3300, y: 1200, team: 2},
                    {x: 4000, y: 1200, team: 2},
                    // Middle lane
                    {x: 3300, y: 2500, team: 2},
                    {x: 4000, y: 2500, team: 2},
                    // Bottom lane
                    {x: 3300, y: 3800, team: 2},
                    {x: 4000, y: 3800, team: 2}
                ];
                
                // Create all towers
                blueTowerPositions.forEach(pos => {
                    let tower = new DefenseTower(pos.x, pos.y, pos.team, false);
                    entities.push(tower);
                });
                
                redTowerPositions.forEach(pos => {
                    let tower = new DefenseTower(pos.x, pos.y, pos.team, false);
                    entities.push(tower);
                });
                
                // Spawn main towers at base (closer together)
                let blueMainTower = new MainTower(500, 2500, 1);
                let redMainTower = new MainTower(4500, 2500, 2);
                entities.push(blueMainTower);
                entities.push(redMainTower);
            } else if(gameMode === 'training') {
                // Training mode: smaller map with single dummy
                WORLD_SIZE = 2000; // Smaller map
                player.x = 500;
                player.y = 1000;
                player.team = 1;
                
                // Create training dummy in practice mode (high HP, no attack)
                trainingDummyMode = 'practice';
                trainingDummy = createTrainingDummy('practice');
                entities.push(trainingDummy);
                
                // Initialize training stats
                window.trainingStats = {
                    totalDamage: 0,
                    startTime: null,
                    gameActive: true,
                    countingStarted: false
                };
                
                // Show dummy switch button
                document.getElementById('trainingDummySwitchBox').style.display = 'block';
            } else {
// FFA mode: 49 bots on different teams — use weighted pool to increase variety
                for(let i=0;i<TOTAL_BOTS;i++){
                    let bx,by,d;
                    do{bx=Math.random()*WORLD_SIZE;by=Math.random()*WORLD_SIZE;d=Math.sqrt((bx-player.x)**2+(by-player.y)**2);}while(d<800);

                    // weighted pool (lower Builderman/Mamba weight; add Fred + boost rarer heroes)
                    const ffaPool = [
                        {ctor: Paul, w: 10}, {ctor: Noob, w: 10}, {ctor: Kaiser, w: 9}, {ctor: Tate, w: 9}, {ctor: Edgar, w: 9},
                        {ctor: Builderman, w: 5}, {ctor: Mamba, w: 3}, {ctor: LightHero, w: 4}, {ctor: Kai, w: 5}, {ctor: Noli, w: 3},
                        {ctor: Don, w: 2}, {ctor: Ming, w: 2}, {ctor: Glace, w: 2}, {ctor: Coolkidd, w: 2}, {ctor: Gamb, w: 1},
                        {ctor: Buster, w: 1}, {ctor: Ren, w: 1}, {ctor: Melvin, w: 1}, {ctor: Neo, w: 1}, {ctor: Chimera, w: 1},
                        {ctor: Benjamin, w: 1}, {ctor: Wesley, w: 1}, {ctor: Zappa, w: 0.5}, {ctor: Austin, w: 0.5}, {ctor: Ambrose, w: 0.5},
                        {ctor: Li, w: 0.5}, {ctor: Lav, w: 0.5}, {ctor: Kenshi, w: 0.8}, {ctor: Gigi, w: 1}, {ctor: RacingDuo, w: 0.8},
                        {ctor: Monza, w: 0.6}, {ctor: Vival, w: 0.4}, {ctor: Aurora, w: 0.2}, {ctor: Fred, w: 0.8}, {ctor: Max, w: 0.2}, {ctor: Cornelius, w: 0.5}, {ctor: Jimeka, w: 0.3}
                    ];
                    let totalW = ffaPool.reduce((s,p)=>s+p.w,0);
                    let pick = Math.random()*totalW, botCtor = Paul;
                    for(let entry of ffaPool){ if(pick < entry.w){ botCtor = entry.ctor; break; } pick -= entry.w; }
                    let bot = new botCtor(bx, by, false);
                    
                    bot.name=`Bot ${i+1}`; 
                    if(bot instanceof Tate) bot.color='#5d4037';
                    else if(bot instanceof Edgar) bot.color='#2c3e50';
                    else if(bot instanceof Coolkidd) bot.color='#8b0000';
                    else if(bot instanceof Builderman) bot.color='#d35400';
                    else if(bot instanceof LightHero) bot.color='#f39c12';
                    else if(bot instanceof Ren) bot.color='#c0392b';
                    else if(bot instanceof Kai) bot.color='#9b59b6';
                    else if(bot instanceof Acheron) bot.color='#34495e';
                    else if(bot instanceof Noli) bot.color='#4b0082';
                    else if(bot instanceof Mamba) bot.color='#000';
                    else if(bot instanceof Nos) bot.color='#4B0082';
                    else if(bot instanceof Gamb) bot.color='#8B4513';
                    else if(bot instanceof Buster) bot.color='#1873cc';
                    else if(bot instanceof Neo) bot.color='#00cc00';
                    else if(bot instanceof Chimera) bot.color='#a335ee';
                    else if(bot instanceof Ming) bot.color='#C0C0C0';
                    else if(bot instanceof Glace) bot.color='#4682B4';
                    else bot.color='#e74c3c';
                    
                    entities.push(bot);
                    bot.gear = ['speedster','rage','blink','bandage','visiongoggles','electrico','execution'][Math.floor(Math.random()*7)];
                }
            }
            
            // Spawn 3 Withers at random locations (not in 5v5, training, or 1v1 mode)
            if(gameMode !== '5v5' && gameMode !== 'training' && gameMode !== '1v1') {
                for(let i=0;i<3;i++){
                    let wx,wy;
                    do{wx=Math.random()*WORLD_SIZE;wy=Math.random()*WORLD_SIZE;}while(Math.sqrt((wx-player.x)**2+(wy-player.y)**2)<1200);
                    let wither = new Wither(wx,wy);
                    entities.push(wither);
                }
            }
            
            gameRunning=true; lastTime=performance.now();
        }

        function initializeStatAnimations() {
            // Gamb survival and difficulty animation (10-100-10) - smooth cycle with reverse difficulty
            let gambCounter = 10;
            let gambDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let gambSurvival = document.querySelector('.gambSurvival');
                let gambDifficulty = document.querySelector('.gambDifficulty');
                if (gambSurvival) {
                    gambSurvival.style.setProperty('width', gambCounter + '%', 'important');
                }
                if (gambDifficulty) {
                    // Reverse direction: 100 - gambCounter
                    gambDifficulty.style.setProperty('width', (100 - gambCounter) + '%', 'important');
                }
                gambCounter += gambDir;
                if (gambCounter >= 100) gambDir = -1; // Start decreasing at 100
                if (gambCounter <= 10) gambDir = 1; // Start increasing at 10
            }, 50); // 50ms for smooth continuous animation
            
            // Vival survival animation (40-80-40) - smooth cycle
            let vivalCounter = 40;
            let vivalDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let vivalSurvival = document.querySelector('.vivalSurvival');
                if (vivalSurvival) {
                    vivalSurvival.style.setProperty('width', vivalCounter + '%', 'important');
                }
                vivalCounter += vivalDir;
                if (vivalCounter >= 80) vivalDir = -1; // Start decreasing at 80
                if (vivalCounter <= 40) vivalDir = 1; // Start increasing at 40
            }, 50); // 50ms for smooth continuous animation
            
            // Chimera mode stats animation (20-100-20) - smooth cycle with decrease
            let chimeraCounter = 20;
            let chimeraDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let chimeraStats = document.querySelectorAll('.chimeraStats');
                chimeraStats.forEach(stat => {
                    stat.style.setProperty('width', chimeraCounter + '%', 'important');
                });
                chimeraCounter += chimeraDir;
                if (chimeraCounter >= 100) chimeraDir = -1; // Start decreasing at 100
                if (chimeraCounter <= 20) chimeraDir = 1; // Start increasing at 20
            }, 50); // 50ms for smooth continuous animation
            
            // Kenshi damage stat animation (70%-85% oscillation) - smooth cycle
            let kenshiCounter = 70;
            let kenshiDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let kenshiDamage = document.querySelector('.kenshiDamage');
                if (kenshiDamage) {
                    kenshiDamage.style.setProperty('width', kenshiCounter + '%', 'important');
                }
                kenshiCounter += kenshiDir;
                if (kenshiCounter >= 85) kenshiDir = -1; // Start decreasing at 85
                if (kenshiCounter <= 70) kenshiDir = 1; // Start increasing at 70
            }, 100); // 100ms for smooth continuous animation
            
            // Lav survival stat animation (80%-90% oscillation) - smooth cycle
            let lavCounter = 80;
            let lavDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let lavSurvival = document.querySelector('.lavSurvival');
                if (lavSurvival) {
                    lavSurvival.style.setProperty('width', lavCounter + '%', 'important');
                }
                lavCounter += lavDir;
                if (lavCounter >= 90) lavDir = -1; // Start decreasing at 90
                if (lavCounter <= 80) lavDir = 1; // Start increasing at 80
            }, 100); // 100ms for smooth continuous animation
            
            // RacingDuo Charles dynamic stats (25-100-25) - smooth cycle for Agility and Speed
            let racingDuoCounter = 25;
            let racingDuoDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let agility = document.querySelector('.racingduoAgility');
                let speed = document.querySelector('.racingduoSpeed');
                if (agility) {
                    agility.style.setProperty('width', racingDuoCounter + '%', 'important');
                }
                if (speed) {
                    speed.style.setProperty('width', racingDuoCounter + '%', 'important');
                }
                racingDuoCounter += racingDuoDir;
                if (racingDuoCounter >= 100) racingDuoDir = -1; // Start decreasing at 100
                if (racingDuoCounter <= 25) racingDuoDir = 1; // Start increasing at 25
            }, 50); // 50ms for smooth continuous animation
            
            // Jimeka difficulty animation (45%-85% oscillation) - smooth cycle
            let zeusCounter = 0;
            let zeusDir = 1;
            setInterval(() => {
                let survival = document.querySelector('.zeusSurvival');
                let damage = document.querySelector('.zeusDamage');
                let speed = document.querySelector('.zeusSpeed');
                if (survival) survival.style.setProperty('width', (40 + zeusCounter * 0.1) + '%', 'important');
                if (damage) damage.style.setProperty('width', (85 + zeusCounter * 0.3) + '%', 'important');
                if (speed) speed.style.setProperty('width', (80 + zeusCounter * 0.4) + '%', 'important');
                zeusCounter += zeusDir;
                if (zeusCounter >= 50) zeusDir = -1;
                if (zeusCounter <= 0) zeusDir = 1;
            }, 50);

            // Jimeka difficulty animation (45%-85% oscillation) - smooth cycle
            let jimekaCounter = 45;
            let jimekaDir = 1; // 1 for increasing, -1 for decreasing
            setInterval(() => {
                let jimekaDifficulty = document.querySelector('.jimekaDifficulty');
                if (jimekaDifficulty) {
                    jimekaDifficulty.style.setProperty('width', jimekaCounter + '%', 'important');
                }
                jimekaCounter += jimekaDir;
                if (jimekaCounter >= 85) jimekaDir = -1; // Start decreasing at 85
                if (jimekaCounter <= 45) jimekaDir = 1; // Start increasing at 45
            }, 100); // 100ms for smooth continuous animation

            // Keep related demo cards beside their roster anchors.
            const heroList = document.querySelector('.hero-list-container');
            const coolkiddCard = document.getElementById('card-coolkidd');
            const karenCard = document.getElementById('card-karen');
            const vivalCard = document.getElementById('card-vival');
            const caskriceCard = document.getElementById('card-caskrice');
            if (heroList && coolkiddCard && karenCard) heroList.insertBefore(karenCard, coolkiddCard.nextSibling);
            if (heroList && vivalCard && caskriceCard) heroList.insertBefore(caskriceCard, vivalCard);

            // Caskrice survival animation (15%-90% oscillation)
            let caskriceCounter = 0;
            let caskriceDir = 1;
            setInterval(() => {
                let survival = document.querySelector('.caskriceSurvival');
                if (survival) survival.style.setProperty('width', (15 + caskriceCounter) + '%', 'important');
                caskriceCounter += caskriceDir;
                if (caskriceCounter >= 75) caskriceDir = -1;
                if (caskriceCounter <= 0) caskriceDir = 1;
            }, 50);
        }
        
        // Prevent practice training dummy from attacking or using abilities
        const originalBasicAtk = Entity.prototype.basicAtk;
        Entity.prototype.basicAtk = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalBasicAtk) return originalBasicAtk.call(this);
        };
        
        const originalAbilityQ = Entity.prototype.abilityQ;
        Entity.prototype.abilityQ = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalAbilityQ) return originalAbilityQ.call(this);
        };
        
        const originalAbilityE = Entity.prototype.abilityE;
        Entity.prototype.abilityE = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalAbilityE) return originalAbilityE.call(this);
        };
        
        const originalAbilityF = Entity.prototype.abilityF;
        Entity.prototype.abilityF = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalAbilityF) return originalAbilityF.call(this);
        };
        
        // Override Paul's fire method to prevent practice dummy from attacking
        const originalFire = Paul.prototype.fire;
        Paul.prototype.fire = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalFire) return originalFire.call(this);
        };
        
        const originalSkill1 = Paul.prototype.skill1;
        Paul.prototype.skill1 = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalSkill1) return originalSkill1.call(this);
        };
        
        const originalSkill2 = Paul.prototype.skill2;
        Paul.prototype.skill2 = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalSkill2) return originalSkill2.call(this);
        };
        
        const originalDoUlt = Paul.prototype.doUlt;
        Paul.prototype.doUlt = function() {
            if(this.isTrainingPracticeDummy) return;
            if(originalDoUlt) return originalDoUlt.call(this);
        };
        window.selectGameMode = function(mode){
            if(mode === 'ffa_online'){
                // Initialize FFA multiplayer mode
                if(typeof initializeFFAMultiplayer !== 'undefined'){
                    initializeFFAMultiplayer().then(success => {
                        if(success){
                            gameMode = 'ffa_online';
                            document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (Online FFA)';
                        }else{
                            alert('Failed to connect to multiplayer server. Please try again.');
                            gameMode = 'ffa';
                        }
                    });
                }else{
                    alert('Multiplayer module not loaded. Please refresh the page.');
                    gameMode = 'ffa';
                }
            }else if(mode === '1v1'){
                // Keep 1v1 distinct so startGame registers a real opposing AI.
                gameMode = '1v1';
                document.getElementById('modeTitle').innerText = 'SELECT YOUR HERO (1v1 vs BOT)';
            }else{
                gameMode = mode;
                document.getElementById('modeTitle').innerText = mode === 'squad' ? 'SELECT YOUR HERO (Squad Mode)' : (mode === '5v5' ? 'SELECT YOUR HERO (5v5 Mode)' : (mode === 'training' ? 'SELECT YOUR HERO (Training)' : 'SELECT YOUR HERO'));
            }
        }
        
        window.selectGear = function(g){ selectedGear = g; }
        window.setSelectedGearCard = function(g){
            const gearMeta = {
                speedster:      { emoji: '💨', q: '💨', e: '💨', f: '💨', g: '💨', r: '💨' },
                teleportation:  { emoji: '🌀', q: '🌀', e: '🌀', f: '🌀', g: '🌀', r: '🌀' },
                rage:           { emoji: '😡', q: '😡', e: '😡', f: '😡', g: '😡', r: '😡' },
                blink:          { emoji: '⚡', q: '⚡', e: '⚡', f: '⚡', g: '⚡', r: '⚡' },
                bandage:        { emoji: '🩹', q: '🩹', e: '🩹', f: '🩹', g: '🩹', r: '🩹' },
                visiongoggles:  { emoji: '👓', q: '👓', e: '👓', f: '👓', g: '👓', r: '👓' },
                electrico:      { emoji: '⚡', q: '⚡', e: '⚡', f: '⚡', g: '⚡', r: '⚡' },
                execution:      { emoji: '💀', q: '💀', e: '💀', f: '💀', g: '💀', r: '💀' },
                invincible:     { emoji: '🛡️', q: '🛡️', e: '🛡️', f: '🛡️', g: '🛡️', r: '🛡️' },
                soundblast:     { emoji: '🔊', q: '🔊', e: '🔊', f: '🔊', g: '🔊', r: '🔊' }
            };
            try{
                document.querySelectorAll('.gear-card').forEach(c=>{
                    const is = (c.dataset.gear===g);
                    c.classList.toggle('selected', is);
                    c.setAttribute('aria-pressed', is ? 'true' : 'false');
                });
                if(typeof window.selectGear === 'function') window.selectGear(g);
                // Update hero ability icons based on selected gear
                const meta = gearMeta[g] || { q: '💥', e: '👟', f: '🔥', g: '🌀', r: '💨' };
                const q = document.getElementById('iconQ');
                const e = document.getElementById('iconE');
                const f = document.getElementById('iconF');
                const gIcon = document.getElementById('iconG');
                const r = document.getElementById('iconR');
                if(q) q.innerText = meta.q;
                if(e) e.innerText = meta.e;
                if(f) f.innerText = meta.f;
                if(gIcon) gIcon.innerText = meta.g;
                if(r) r.innerText = meta.r;
            }catch(e){ console.warn('setSelectedGearCard error', e); }
        };
        // initialize selected card (UI) to match default variable
        try{ if(typeof setSelectedGearCard === 'function') setSelectedGearCard(selectedGear || 'speedster'); }catch(_){}
        
        window.createTrainingDummy = function(mode) {
            if(mode === 'practice') {
                let dummy = new Paul(1500, 1000, false);
                dummy.team = 2;
                dummy.name = 'Practice Dummy';
                dummy.maxHp = 1000000;
                dummy.hp = 1000000;
                dummy.baseSpd = 0;
                dummy.speed = 0;
                dummy.dead = false;
                dummy.isTrainingPracticeDummy = true;
                dummy.isTrainingDummy1v1 = false;
                dummy.isTrainingDummy = true;
                return dummy;
            } else if(mode === '1v1') {
                let heroTypes = [
                    {type: Paul, name: 'Paul'}, {type: Noob, name: 'Noob'}, {type: Kaiser, name: 'Kaiser'}, {type: Tate, name: 'Tate'}, {type: Edgar, name: 'Edgar'}, 
                    {type: Coolkidd, name: 'Coolkidd'}, {type: Builderman, name: 'Builderman'}, {type: Mamba, name: 'Mamba'}, {type: LightHero, name: 'Light'}, 
                    {type: Kai, name: 'Kai'}, {type: Acheron, name: 'Acheron'}, {type: Noli, name: 'Noli'}, {type: Don, name: 'Don'}, {type: Faik, name: 'Faik'}, 
                    {type: Darrick, name: 'Darrick'}, {type: Fletcher, name: 'Fletcher'}, {type: Glace, name: 'Glace'}, {type: Ming, name: 'Ming'}, {type: Nos, name: 'Nos'}, 
                    {type: Carlos, name: 'Carlos'}, {type: Buster, name: 'Buster'}, {type: Ren, name: 'Ren'}, {type: Melvin, name: 'Melvin'}, {type: Gamb, name: 'Gamb'}, 
                    {type: Winston, name: 'Winston'}, {type: Neo, name: 'Neo'}, {type: Chimera, name: 'Chimera'}, {type: Li, name: 'Li'}, {type: Lav, name: 'Lav'}, 
                    {type: Max, name: 'Max'}, {type: Fred, name: 'Fred'}, {type: Kenshi, name: 'Kenshi'}, {type: Gigi, name: 'Gigi'}, {type: Benjamin, name: 'Benjamin'}, 
                    {type: Zappa, name: 'Zappa'}, {type: Austin, name: 'Austin'}, {type: Ambrose, name: 'Ambrose'}, {type: Wesley, name: 'Wesley'}, {type: Ash, name: 'Ash'}, 
                    {type: Yun, name: 'Yun'}, {type: RacingDuo, name: 'RacingDuo'}, {type: Monza, name: 'Monza'}, {type: Christian, name: 'Christian'}, {type: Vival, name: 'Vival'}, 
                    {type: Aurora, name: 'Aurora'}, {type: Bai, name: 'Bai'}, {type: Apollo, name: 'Apollo'}, {type: BountyHunter, name: 'Bounty'}, {type: Amir, name: 'Amir'}, 
                    {type: Cornelius, name: 'Cornelius'}, {type: Twins, name: 'Twins'}, {type: Guest, name: 'Guest'}, {type: Jimeka, name: 'Jimeka'}, 
                    {type: Trent, name: 'Trent'}, {type: Steven, name: 'Steven'}, {type: Lune, name: 'Lune'}, {type: BrunoAlexander, name: 'Bruno'}
                ];
                let randomHero = heroTypes[Math.floor(Math.random() * heroTypes.length)];
                let dummy = new randomHero.type(1500, 1000, false);
                dummy.team = 2;
                dummy.name = `1v1 ${randomHero.name}`;
                dummy.baseSpd = 100;
                dummy.speed = 100;
                dummy.dead = false;
                dummy.isTrainingPracticeDummy = false;
                dummy.isTrainingDummy1v1 = true;
                dummy.isTrainingDummy = true;
                // Make dummy look different - change color to red tint
                dummy.originalColor = dummy.color;
                dummy.color = '#FF0000';
                return dummy;
            }
        }
        
        window.switchTrainingDummy = function() {
            if(gameMode !== 'training') return;
            
            // Kill old dummy if it exists
            if(trainingDummy) {
                trainingDummy.dead = true;
                // Also remove from entities to be safe
                let idx = entities.indexOf(trainingDummy);
                if(idx !== -1) entities.splice(idx, 1);
            }
            
            // Switch mode
            trainingDummyMode = trainingDummyMode === 'practice' ? '1v1' : 'practice';
            
            // Create and add new dummy
            trainingDummy = createTrainingDummy(trainingDummyMode);
            if(trainingDummy) {
                entities.push(trainingDummy);
                let modeText = trainingDummyMode === 'practice' ? 'PRACTICE DUMMY (1,000,000 HP)' : '1v1 OPPONENT';
                addKillMsg(`SWITCHED TO: ${modeText}`);
            }
        }
        
        window.resetTrainingCounter = function() {
            if(gameMode !== 'training' || !window.trainingStats) return;
            window.trainingStats.totalDamage = 0;
            window.trainingStats.startTime = null;
            window.trainingStats.countingStarted = false;
            addKillMsg('DAMAGE COUNTER RESET');
        }
        
        window.resetTrainingCooldowns = function() {
            if(gameMode !== 'training' || !player) return;
            player.basicCD = 0;
            player.qCD = 0;
            player.eCD = 0;
            player.fCD = 0;
            player.gCD = 0;
            player.rCD = 0;
            addKillMsg('ALL COOLDOWNS RESET');
        }
        
        // Create mobile control UI with ability buttons
        window.createMobileControls = function() {
            // Check if controls already exist
            if (document.getElementById('mobileControlsContainer')) return;
            
            const isLandscape = window.innerWidth > window.innerHeight;
            const buttonSize = isLandscape ? 45 : 50;
            
            // Create movement joystick
            const joystickContainer = document.createElement('div');
            joystickContainer.id = 'mobileJoystickContainer';
            joystickContainer.style.cssText = `
                position: fixed;
                left: 20px;
                bottom: 20px;
                width: 100px;
                height: 100px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 50%;
                border: 2px solid #555;
                pointer-events: auto;
                z-index: 100;
                touch-action: none;
            `;
            
            const joystickBase = document.createElement('div');
            joystickBase.style.cssText = `
                position: absolute;
                width: 70px;
                height: 70px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                border: 2px solid #777;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
            `;
            
            const joystickThumb = document.createElement('div');
            joystickThumb.style.cssText = `
                position: absolute;
                width: 35px;
                height: 35px;
                background: #00bcd4;
                border-radius: 50%;
                border: 2px solid #0097a7;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                pointer-events: none;
                transition: transform 0.1s;
                box-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
            `;
            
            joystickContainer.appendChild(joystickBase);
            joystickContainer.appendChild(joystickThumb);
            
            let joystickActive = false;
            let joystickCenter = { x: 0, y: 0 };
            let currentTouchId = null;
            
            joystickContainer.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (currentTouchId !== null) return;
                const touch = e.touches[0];
                currentTouchId = touch.identifier;
                joystickActive = true;
                const rect = joystickContainer.getBoundingClientRect();
                joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
                updateJoystick(touch.clientX, touch.clientY);
            });
            
            joystickContainer.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (!joystickActive) return;
                for (let touch of e.touches) {
                    if (touch.identifier === currentTouchId) {
                        updateJoystick(touch.clientX, touch.clientY);
                        break;
                    }
                }
            });
            
            joystickContainer.addEventListener('touchend', (e) => {
                e.preventDefault();
                for (let touch of e.changedTouches) {
                    if (touch.identifier === currentTouchId) {
                        joystickActive = false;
                        currentTouchId = null;
                        resetJoystick();
                        break;
                    }
                }
            });
            
            function updateJoystick(clientX, clientY) {
                const dx = clientX - joystickCenter.x;
                const dy = clientY - joystickCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 30; // Joystick thumb max movement radius
                const clampedDistance = Math.min(distance, maxDistance);
                const angle = Math.atan2(dy, dx);
                
                const thumbX = (clampedDistance / maxDistance) * 17.5 * Math.cos(angle);
                const thumbY = (clampedDistance / maxDistance) * 17.5 * Math.sin(angle);
                
                joystickThumb.style.transform = `translate(-50%, -50%) translate(${thumbX}px, ${thumbY}px)`;
                
                // Update movement keys based on angle
                const deadzone = 10;
                keys.w = keys.s = keys.a = keys.d = false;
                if (clampedDistance > deadzone) {
                    if (angle > -Math.PI/4 && angle < Math.PI/4) keys.d = true; // right
                    else if (angle > Math.PI/4 && angle < 3*Math.PI/4) keys.s = true; // down
                    else if (angle > 3*Math.PI/4 || angle < -3*Math.PI/4) keys.a = true; // left
                    else keys.w = true; // up
                }
            }
            
            function resetJoystick() {
                joystickThumb.style.transform = 'translate(-50%, -50%)';
                keys.w = keys.s = keys.a = keys.d = false;
            }
            
            document.body.appendChild(joystickContainer);
            
            const container = document.createElement('div');
            container.id = 'mobileControlsContainer';
            container.style.cssText = `
                position: fixed;
                ${isLandscape ? 'right: 10px; top: 50%; transform: translateY(-50%); flex-direction: column;' : 'bottom: 20px; right: 20px; flex-direction: row;'}
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                ${isLandscape ? 'justify-content: center;' : 'justify-content: flex-end;'}
                pointer-events: auto;
                z-index: 100;
                ${isLandscape ? 'max-height: 80vh;' : 'max-width: 300px;'}
            `;
            
            const abilityButtons = [
                { key: 'q', label: 'Q', color: '#ff6b6b' },
                { key: 'e', label: 'E', color: '#4ecdc4' },
                { key: 'f', label: 'F', color: '#ffe66d' },
                { key: 'g', label: 'G', color: '#a78bfa' },
                { key: 'r', label: 'R', color: '#95e1d3' }
            ];
            
            abilityButtons.forEach(btn => {
                const button = document.createElement('button');
                button.style.cssText = `
                    width: ${buttonSize}px;
                    height: ${buttonSize}px;
                    border-radius: 8px;
                    border: 2px solid ${btn.color};
                    background: rgba(0, 0, 0, 0.7);
                    color: ${btn.color};
                    font-weight: bold;
                    font-size: ${buttonSize * 0.36}px;
                    cursor: pointer;
                    touch-action: manipulation;
                    box-shadow: 0 0 10px ${btn.color}4d;
                    transition: all 0.1s;
                `;
                button.innerText = btn.label;
                
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    keys[btn.key] = true;
                    button.style.transform = 'scale(0.9)';
                    button.style.boxShadow = `0 0 20px ${btn.color}`;
                });
                
                button.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    keys[btn.key] = false;
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = `0 0 10px ${btn.color}4d`;
                });
                
                // Also support mouse clicks for testing on desktop
                button.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    keys[btn.key] = true;
                    button.style.transform = 'scale(0.9)';
                    button.style.boxShadow = `0 0 20px ${btn.color}`;
                });
                
                button.addEventListener('mouseup', (e) => {
                    e.preventDefault();
                    keys[btn.key] = false;
                    button.style.transform = 'scale(1)';
                    button.style.boxShadow = `0 0 10px ${btn.color}4d`;
                });
                
                container.appendChild(button);
            });
            
            document.body.appendChild(container);
            
            // Hide controls during hero selection
            const originalDisplay = container.style.display;
            const joystickOriginalDisplay = joystickContainer.style.display;
            window.addEventListener('keydown', (e) => {
                if (document.getElementById('heroSelectScreen').style.display !== 'none') {
                    container.style.display = 'none';
                    joystickContainer.style.display = 'none';
                } else {
                    container.style.display = originalDisplay;
                    joystickContainer.style.display = joystickOriginalDisplay;
                }
            });
            
            // Update controls on orientation change
            window.addEventListener('resize', () => {
                const existing = document.getElementById('mobileControlsContainer');
                const joystickExisting = document.getElementById('mobileJoystickContainer');
                if (existing || joystickExisting) {
                    if (existing) existing.remove();
                    if (joystickExisting) joystickExisting.remove();
                    // Only recreate if game has started (heroSelectScreen is hidden)
                    if (document.getElementById('heroSelectScreen').style.display === 'none') {
                        createMobileControls();
                    }
                }
            });
        };

        // VISIBLE EFFECT CLASSES FOR TWINS
        // Expanding energy wave ring effect
        class EnergyWave {
            constructor(x, y, color, maxRadius = 300, duration = 1.5) {
                this.x = x; this.y = y; this.color = color;
                this.maxRadius = maxRadius; this.duration = duration;
                this.radius = 0; this.del = false; this.age = 0;
            }
            update(dt) {
                this.age += dt;
                if (this.age >= this.duration) { this.del = true; return; }
                this.radius = (this.age / this.duration) * this.maxRadius;
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                if (Math.sqrt((screenX)**2 + (screenY)**2) > 2000) return;
                
                let progress = this.age / this.duration;
                let alpha = (1 - progress) * 0.8;
                
                ctx.save();
                try {
                    ctx.strokeStyle = this.color;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = 8 - progress * 6;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Inner glow
                    ctx.strokeStyle = this.color;
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius - 10, 0, Math.PI * 2);
                    ctx.stroke();
                } finally {
                    ctx.restore();
                }
            }
        }

        class EnergyCannonBeam {
            constructor(x, y, angle, length, color1 = '#00E5FF', color2 = '#DFFBFF', duration = 0.45) {
                this.x = x; this.y = y; this.angle = angle;
                this.length = length; this.color1 = color1; this.color2 = color2;
                this.duration = duration; this.age = 0; this.del = false;
                this.width = 24;
            }
            update(dt) {
                this.age += dt;
                if (this.age >= this.duration) this.del = true;
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                let progress = this.age / this.duration;
                let alpha = (1 - progress) * 0.95;
                let currentLength = this.length * (1 - progress * 0.25);

                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.angle);

                let grad = ctx.createLinearGradient(0, -this.width, currentLength, this.width);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.12, this.color2);
                grad.addColorStop(0.5, this.color1);
                grad.addColorStop(1, 'rgba(0,229,255,0)');

                ctx.globalAlpha = alpha;
                ctx.shadowColor = this.color1;
                ctx.shadowBlur = 30;
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, -this.width * 0.7);
                ctx.lineTo(currentLength, -this.width * 0.35);
                ctx.lineTo(currentLength, this.width * 0.35);
                ctx.lineTo(0, this.width * 0.7);
                ctx.closePath();
                ctx.fill();

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = alpha * 0.8;
                ctx.fillRect(0, -this.width * 0.2, currentLength, this.width * 0.4);

                ctx.globalAlpha = alpha * 0.8;
                ctx.strokeStyle = this.color2;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(currentLength, 0);
                ctx.stroke();

                ctx.restore();
            }
        }

        // Directional energy beam
        class EnergyBeam {
            constructor(x, y, angle, length, color, duration = 0.5) {
                this.x = x; this.y = y; this.angle = angle;
                this.length = length; this.color = color;
                this.duration = duration; this.age = 0; this.del = false;
                this.width = 25;
            }
            update(dt) {
                this.age += dt;
                if (this.age >= this.duration) this.del = true;
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                let progress = this.age / this.duration;
                let alpha = (1 - progress) * 0.9;
                let currentLength = this.length * (1 - progress * 0.3);
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.angle);
                
                // Glow gradient
                let grad = ctx.createLinearGradient(0, -this.width/2, currentLength, this.width/2);
                grad.addColorStop(0, this.color);
                grad.addColorStop(0.5, this.color);
                grad.addColorStop(1, 'rgba(255,255,255,0.3)');
                
                ctx.globalAlpha = alpha;
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.moveTo(0, -this.width);
                ctx.quadraticCurveTo(currentLength * 0.5, -this.width * 1.5, currentLength, -this.width * 0.5);
                ctx.lineTo(currentLength, this.width * 0.5);
                ctx.quadraticCurveTo(currentLength * 0.5, this.width * 1.5, 0, this.width);
                ctx.closePath();
                ctx.fill();
                
                // Bright core
                ctx.globalAlpha = alpha * 0.6;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, -this.width * 0.3, currentLength, this.width * 0.6);
                
                ctx.restore();
            }
        }

        // Visible energy blast projectile
        class EnergyBlast {
            constructor(x, y, angle, speed, color, size = 30, duration = 2.5) {
                this.x = x; this.y = y; this.angle = angle;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.color = color; this.size = size;
                this.duration = duration; this.age = 0; this.del = false;
                this.trail = [];
            }
            update(dt) {
                this.age += dt;
                if (this.age >= this.duration) { this.del = true; return; }
                
                this.trail.push({x: this.x, y: this.y, age: 0});
                this.trail.forEach(t => t.age += dt);
                this.trail = this.trail.filter(t => t.age < 0.8);
                
                this.x += this.vx * dt;
                this.y += this.vy * dt;
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // Draw trail
                this.trail.forEach((t, i) => {
                    let trailScreenX = t.x - camera.x;
                    let trailScreenY = t.y - camera.y;
                    let trailAlpha = (1 - t.age / 0.8) * 0.6;
                    let trailSize = this.size * (1 - t.age / 0.8) * 0.7;
                    
                    ctx.save();
                    ctx.fillStyle = this.color;
                    ctx.globalAlpha = trailAlpha;
                    ctx.beginPath();
                    ctx.arc(trailScreenX, trailScreenY, trailSize, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                });
                
                // Main blast
                let progress = this.age / this.duration;
                let alpha = (1 - progress) * 0.9;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // Outer glow
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // Middle ring
                ctx.fillStyle = this.color;
                ctx.globalAlpha = alpha * 0.7;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Core
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = alpha * 0.9;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }

        // Shockwave ring effect
        class ShockwaveRing {
            constructor(x, y, color, maxRadius = 400, duration = 1.2, width = 12) {
                this.x = x; this.y = y; this.color = color;
                this.maxRadius = maxRadius; this.duration = duration;
                this.maxLife = duration; this.life = duration;
                this.radius = 0; this.del = false; this.age = 0; this.width = width;
            }
            update(dt) {
                this.age += dt;
                this.life -= dt;
                if (this.life <= 0) {
                    this.life = 0;
                    this.del = true;
                    return;
                }
                this.radius = ((this.maxLife - this.life) / this.maxLife) * this.maxRadius;
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                if (Math.sqrt((screenX)**2 + (screenY)**2) > 2500) return;
                
                let progress = 1 - (this.life / this.maxLife);
                let alpha = Math.max(0, 1 - progress) * 0.95;
                
                ctx.save();
                ctx.strokeStyle = this.color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = this.width;
                
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.globalAlpha = alpha * 0.5;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenX, screenY, this.radius + this.width / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Dodge indicator effect
        class DodgeIndicator {
            constructor(x, y, color) {
                this.x = x; this.y = y; this.color = color;
                this.duration = 0.8; this.age = 0; this.del = false;
            }
            update(dt) {
                this.age += dt;
                if (this.age >= this.duration) { this.del = true; return; }
            }
            draw(ctx) {
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                let progress = this.age / this.duration;
                let alpha = (1 - progress) * 0.8;
                let size = 30 + progress * 20;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
                ctx.stroke();
                
                // Inner circle
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(screenX, screenY, size * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // END VISIBLE EFFECTS

        // SECRET HERO - DAYUM
        // THE TWINS - Ken/Matthew with Fusion Matten
