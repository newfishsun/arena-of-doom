        function screenShake(amt){shakeIntensity=amt;}
        function addKillMsg(msg){let f=document.getElementById('killFeed');if(f){let d=document.createElement('div');d.innerText=msg;f.appendChild(d);setTimeout(()=>{if(f.contains(d))f.removeChild(d);},3000);}}

        const heroInteractionLines = [
            ['apollo','bruno','ally','You seek justice. I respect that.'], ['apollo','light','ally','You watch over them. I judge them. We are not the same.'], ['apollo','zappa','ally','Your father still watches you.'], ['apollo','zeus','ally','You retired. I never will.'], ['apollo','bounty','enemy','You cannot escape justice forever.'], ['apollo','karen','enemy','You twist minds. I will untwist them.'], ['apollo','caskrice','enemy','Death is not a tool. It is a door.'],
            ['tate','trent','ally','Still slow, I see.'], ['tate','max','ally','Nice car. Too slow.'], ['tate','christian','ally','Your cars are fast. But I have a Bugatti.'], ['tate','racingduo','ally','F1? Cute.'], ['tate','trent','enemy','I beat you once. I will beat you again.'], ['tate','noob','enemy','You wander. I win.'], ['tate','bounty','enemy','I do not need contracts. I have money.'],
            ['darrick','fletcher','ally','Nice shot.'], ['darrick','bounty','ally','I learned from you. I did not become you.'], ['darrick','everdawn','ally','You can escape him. I believe it.'], ['darrick','paul','ally','Another gunslinger. Respect.'], ['darrick','bounty','enemy','You taught me everything. I chose differently.'], ['darrick','everdawn','enemy','You are still trapped. I am sorry.'], ['darrick','karen','enemy','You control minds. I control my aim.'],
            ['builderman','noob','ally','Still wandering, I see.'], ['builderman','austin','ally','Building rush tactic. Interesting.'], ['builderman','benjamin','ally','You are tall. Useful for construction.'], ['builderman','noob','enemy','You left. I stayed.'], ['builderman','austin','enemy','No copycat allowed.'],
            ['fred','benjamin','ally','Not even 2x is enough, bro.'], ['fred','light','ally','Get your rainbow self out of here!'], ['fred','gigi','ally','You are the gamer girl, right?'], ['fred','coolkidd','ally','You cheated. I streamed it.'], ['fred','light','enemy','Too colorful, man.'], ['fred','benjamin','enemy','You are too slow, bro.'], ['fred','racingduo','enemy','F1? I am faster on foot.'],
            ['light','apollo','ally','You judge. I observe.'], ['light','zappa','ally','Your father still watches you.'], ['light','gregory','ally','You touched godhood. I was born with it.'], ['light','fred','enemy','Poor rainbow...'], ['light','karen','enemy','You twist minds. I bend light.'],
            ['zappa','cyrus','ally','Get on the bike, nerd!'], ['zappa','neo','ally','You are so serious. I love it.'], ['zappa','zeus','ally','Old man.'], ['zappa','light','ally','You are not the only god here.'], ['zappa','gregory','ally','Time traveler? Cute. I am a god.'], ['zappa','gigi','ally','You touched time? I am time.'], ['zappa','apollo','ally','You judge. I doodle. We are different.'], ['zappa','zeus','enemy','Still watching me, Dad?'], ['zappa','karen','enemy','You control minds? I control chaos.'], ['zappa','bounty','enemy','You collect souls? Boring.'], ['zappa','caskrice','enemy','You command death? I make it look good.'], ['zappa','light','enemy','You are too serious. Lighten up!'], ['zappa','neo','enemy','I will fix your chaos later.'],
            ['neo','zappa','ally','You are going to do something chaotic, are you not?'], ['neo','cyrus','ally','She dragged you here too.'], ['neo','gregory','ally','Your time machine is unstable.'], ['neo','zappa','enemy','I will fix your chaos later.'], ['neo','karen','enemy','You control minds. I have seen worse.'],
            ['jeffrey','gigi','ally','You are a gamer. I solve crimes. We are both smart.'], ['jeffrey','coolkidd','ally','You bombed a casino? I would have solved that case.'], ['jeffrey','monza','ally','I am a detective. I have seen your file.'], ['jeffrey','karen','enemy','You teach? I investigate.'], ['jeffrey','bounty','enemy','I have been tracking you for years.'],
            ['coolkidd','monza','ally','Just put the pizza here. I will eat it later.'], ['coolkidd','gigi','ally','You won that game. I will win the next.'], ['coolkidd','fred','ally','Did you stream that?'], ['coolkidd','karen','enemy','You are the worst teacher ever.'], ['coolkidd','monza','enemy','I am not hungry.'],
            ['monza','coolkidd','ally','Son, I brought you a fresh idea.'], ['monza','gamb','ally','You babysat him. He bombed a casino.'], ['monza','bounty','ally','I do not make contracts. I make demands.'], ['monza','coolkidd','enemy','You still do not know, do you?'], ['monza','bounty','enemy','You are not welcome in my city.'],
            ['gamb','coolkidd','ally','Remember that time I brought you to the casino?'], ['gamb','ren','ally','I will beat you this time.'], ['gamb','monza','ally','I got your son into trouble. Sorry. Not sorry.'], ['gamb','ren','enemy','You always win. It is annoying.'], ['gamb','bounty','enemy','You do not gamble. You just take.'],
            ['ren','gamb','ally','You said that last time.'], ['ren','bounty','ally','I play for precision. You play for profit.'], ['ren','gamb','enemy','You never learn.'], ['ren','bounty','enemy','Your contract does not scare me.'],
            ['karen','coolkidd','ally','Ah... my favorite student. So much wasted potential.'], ['karen','bounty','ally','You use contracts. I use minds. We are both efficient.'], ['karen','caskrice','ally','You control death. I control life. We balance each other.'], ['karen','coolkidd','enemy','You were never going to succeed.'], ['karen','jeffrey','enemy','A mouse detective? How quaint.'], ['karen','gigi','enemy','You beat Coolkidd? Impressive. But you still serve me.'],
            ['caskrice','vival','ally','You cheat death. I command it.'], ['caskrice','karen','ally','You control minds. I control death. We are not the same.'], ['caskrice','bounty','ally','You collect souls. I summon them.'], ['caskrice','vival','enemy','You cannot cheat death forever.'], ['caskrice','bounty','enemy','You take lives. I give them purpose.'],
            ['vival','caskrice','ally','You command death. I defy it.'], ['vival','everdawn','ally','You are trapped by a contract. I can help.'], ['vival','apollo','ally','You judge. I balance.'], ['vival','caskrice','enemy','Death is not yours to command.'], ['vival','bounty','enemy','You collect souls. I free them.'],
            ['everdawn','darrick','ally','You escaped him. Help me do the same.'], ['everdawn','bounty','ally','You used me. Now I use you.'], ['everdawn','vival','ally','You control death. I am still alive. Help me.'], ['everdawn','bounty','enemy','The contract ends today.'], ['everdawn','karen','enemy','You control minds. I know what that is like.'],
            ['zeus','zappa','ally','...Zappa.'], ['zeus','apollo','ally','You judge. I rule. Or I used to.'], ['zeus','light','ally','You watch over them. I tried to.'], ['zeus','caskrice','ally','You command death. I survived it.'], ['zeus','bounty','ally','You collect souls. I have collected thrones.'], ['zeus','zappa','enemy','Still disrespectful, I see.'], ['zeus','bounty','enemy','You think you are powerful? I have crushed gods.'],
            ['kai','kai','ally','You finally came back, faithfully.'], ['kai','faik','ally','I admire your bravery. Work as my general.'], ['kai','li','ally',"Show me you're worthy as Kaito's master."], ['kai','nos','enemy','Nightmares meant nothing on royalty.'], ['kai','kai','enemy',"Kaito, let's have a family talk."],
            ['ming','light','ally','We can work as companions.'], ['ming','nos','ally','Nightmare is reflection itself, right?'], ['ming','noli','ally','If you are nothingness, can you see yourself?'], ['ming','chimera','enemy','Not even a mirror can identify you.'], ['ming','jimeka','enemy','Clown yourself for entertainment in your shattered persona, huh?'],
            ['amir','monza','ally','Your pizza is there, sir.'], ['amir','fred','ally','OMG, my son loves your stream!'], ['amir','christian','ally','Me need free Koenigsegg as tip, sir.'],
            ['coolkidd','amir','ally',"Just don't call me when I'm eating the pizza."],
            ['amir','coolkidd','ally',"Well, I can't tip you 'cause I don't have that so-called cash."],
            ['chimera','noli','ally','You are already in my territory of nothing!'],
            ['coolkidd','noli','enemy',"This is your last chance. Stop calling me 'cause you lost the game and tried to hack."],
            ['gigi','coolkidd','enemy',"Can't believe you won the kid with me as his teammate in a video game. I'm impressed."],
            ['gamb','noli','enemy','I may feel nothing, but you keep urging me to gamble.'],
            ['noli','zeus','ally','You rule storms. I am nothing. We are not the same.'],
            ['noli','light','ally','You are light. I am void. You cannot see me.'],
            ['noli','apollo','ally','You judge. I cannot be judged. I am nothing.'],
            ['noli','zappa','ally','You are chaos. I am emptiness. We are opposites.'],
            ['li','trent','ally','You have surpassed me. That is the highest honor a master can receive.'],
            ['li','kai','ally','You carry your father\'s name. Now carry your own.'],
            ['li','yun','ally','You are young. But your potential is endless. Do not waste it.'],
            ['li','bai','ally','We walk different paths. But we respect each other\'s journey.'],
            ['li','kaiser','ally','Your son is worthy. You raised him well.'],
            ['li','bounty','enemy','You have no honor. You are not worthy of a warrior\'s death.'],
            ['li','caskrice','enemy','You command death. I embrace life. We are opposites.'],
            ['li','karen','enemy','You control minds. I free them.'],
            ['li','zeus','enemy','You are a king of gods. I am a king of warriors. We are not the same.'],
            ['li','cornelius','enemy','You seek vengeance. I seek balance. We are not enemies—but we are not allies.'],
            ['li','ming','enemy','You reflect the world. I shape it. We are different.'],
            ['li','noli','enemy','You are nothing. I am everything. Yet we both exist.'],
            ['li','chimera','enemy','You copy others. I teach them. We are opposites.'],
            ['kenshi','bai','ally','Your ink is sharp. But my blade is sharper.'],
            ['kenshi','bai','enemy','Let us settle this. Poetry or steel. Which will prevail?'],
            ['bai','kenshi','ally','Your blade is precise. But my ink tells stories.'],
            ['bai','kenshi','enemy','Steel fades. Ink is eternal. Let me show you.'],
            ['kujou','kenshi','ally','Uncle... I\'ll make you proud. Someday.'],
            ['kujou','yun','ally','You bought me ice cream once. I still remember. ...Not that I care.'],
            ['kujou','gigi','ally',"You're good at games. I'm just... here."],
            ['kujou','coolkidd','ally','I don\'t need to win. I just like playing. ...Stop looking at me like that.'],
            ['kujou','coolkidd','enemy','You\'re too competitive. Chill out. ...Please?'],
            ['kujou','karen','enemy',"You're a teacher? My uncle taught me better. ...And he didn't charge me."]
        ];
        const heroEntranceLines = {
            noli: 'I feel nothing. I am nothing. The void is all.',
            kujou: "I'm not here to make friends. I'm here to fight."
        };
        const heroAbilityVoiceLines = {
            kujou: {
                q: "I'm not done yet.",
                e: 'Missed me.',
                ultimate: "This ends now. ...I'm not asking."
            }
        };
        let triggeredHeroInteractions = new Set();
        function getInteractionHeroKey(entity) {
            if (!entity || !(entity instanceof Entity)) return null;
            if (entity instanceof LightHero) return 'light';
            if (entity instanceof BountyHunter) return 'bounty';
            if (entity instanceof BrunoAlexander) return 'bruno';
            if (entity instanceof RacingDuo) return 'racingduo';
            if (entity instanceof Jimeka) return 'jimeka';
            if (entity instanceof Gregory) return 'gregory';
            return entity.constructor && entity.constructor.name ? entity.constructor.name.toLowerCase() : null;
        }
        function checkHeroInteractions() {
            if (!player || player.dead) return;
            const playerKey = getInteractionHeroKey(player);
            if (!playerKey) return;
            for (const entity of entities) {
                if (entity === player || entity.dead || !(entity instanceof Entity) || entity instanceof Sentry || entity instanceof Tripmine) continue;
                const otherKey = getInteractionHeroKey(entity);
                if (!otherKey) continue;
                const distance = Math.hypot(entity.x - player.x, entity.y - player.y);
                if (distance > 700) continue;
                const relation = entity.team === player.team ? 'ally' : 'enemy';
                const pairKey = `${playerKey}:${otherKey}:${relation}`;
                if (triggeredHeroInteractions.has(pairKey)) continue;
                const line = heroInteractionLines.find(entry =>
                    entry[0] === playerKey && entry[1] === otherKey && entry[2] === relation
                );
                if (!line) continue;
                if ((playerKey === 'light' && otherKey === 'fred') || (playerKey === 'fred' && otherKey === 'light')) {
                    if (!(player instanceof LightHero && player.currentSkin === 'RGB Light')) continue;
                }
                triggeredHeroInteractions.add(pairKey);
                addKillMsg(`${player.name}: "${line[3]}"`);
                break;
            }
        }
        
        // Leaderboard functions
        let leaderboardVisible = false;
        function showLeaderboard() {
            leaderboardVisible = true;
            let panel = document.getElementById('leaderboardPanel');
            if(panel) {
                panel.style.display = 'flex';
                panel.style.pointerEvents = 'auto';
                updateLeaderboardDisplay();
            }
        }
        
        function hideLeaderboard() {
            leaderboardVisible = false;
            let panel = document.getElementById('leaderboardPanel');
            if(panel) {
                panel.style.display = 'none';
                panel.style.pointerEvents = 'none';
            }
        }
        
        function updateLeaderboardDisplay() {
            let content = document.getElementById('leaderboardContent');
            if(!content) return;
            
            let isFFA = gameMode === 'ffa' || gameMode === 'ffa_online';
            let stats = [];
            
            // Collect all alive and dead entities that are heroes
            for(let e of entities) {
                if(e instanceof Entity && e.countsAsFFAHero !== false) {  // Include if not explicitly false
                    let kda = isFFA ? e.kills : Math.max(1, e.deaths);
                    let ratio = isFFA ? e.kills : ((e.kills + (e.assists || 0) / 2) / kda).toFixed(2);
                    stats.push({
                        name: e.name || 'Unknown',
                        kills: e.kills,
                        deaths: e.deaths || 0,
                        assists: e.assists || 0,
                        totalDamage: Math.ceil(e.totalDamage || 0),
                        damageTaken: Math.ceil(e.totalDamageTaken || 0),
                        ratio: ratio,
                        isPlayer: e.isPlayer,
                        entity: e
                    });
                }
            }
            
            // Sort by kills first, then by KDA ratio
            stats.sort((a, b) => {
                if(b.kills !== a.kills) return b.kills - a.kills;
                return parseFloat(b.ratio) - parseFloat(a.ratio);
            });
            
            // Generate HTML for leaderboard entries
            let html = '';
            for(let i = 0; i < stats.length; i++) {
                let s = stats[i];
                let entryClass = s.isPlayer ? 'leaderboard-entry local-player' : 'leaderboard-entry';
                if(isFFA) entryClass += ' ffa-mode';
                
                if(isFFA) {
                    html += `<div class="${entryClass}">
                        <div class="rank">#${i+1}</div>
                        <div class="name">${s.name}</div>
                        <div class="stat kills"><span class="leaderboard-stat kills">${s.kills}</span></div>
                        <div class="stat damage"><span class="leaderboard-stat damage">${s.totalDamage}</span></div>
                        <div class="stat damageTaken"><span class="leaderboard-stat damage">${s.damageTaken}</span></div>
                        <div class="stat assists"><span class="leaderboard-stat assists">${s.assists}</span></div>
                    </div>`;
                } else {
                    html += `<div class="${entryClass}">
                        <div class="rank">#${i+1}</div>
                        <div class="name">${s.name}</div>
                        <div class="stat kills"><span class="leaderboard-stat kills">${s.kills}</span></div>
                        <div class="stat deaths"><span class="leaderboard-stat deaths">${s.deaths}</span></div>
                        <div class="stat assists"><span class="leaderboard-stat assists">${s.assists}</span></div>
                        <div class="stat damage"><span class="leaderboard-stat damage">${s.totalDamage}</span></div>
                        <div class="stat damageTaken"><span class="leaderboard-stat damage">${s.damageTaken}</span></div>
                        <div class="stat kda"><span class="leaderboard-stat kda">${s.ratio}</span></div>
                    </div>`;
                }
            }
            
            content.innerHTML = html;
        }
        
        // ASH HERO - DUAL MODE ATTACKER/TANK
        class Ash extends Entity {
            constructor(x, y, p) {
                super(x, y, 19, '#C0504D', 7500);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Ash)" : "Enemy Ash";
                this.mode = 'attacker';
                this.modeCD = 0;
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 280;
                this.speed = 280;
                this.swinging = false;
                this.swingTimer = 0;
                this.inStab = false;
                this.stabTimer = 0;
                this.inStomp = false;
                this.stompTimer = 0;
                this.hasArmor = false;
                this.armorTimer = 0;
                this.armorDmgReduction = 0;
                this.dmgMult = 1;
            }
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                if (this.modeCD > 0) this.modeCD -= dt;
                if (this.hasArmor) {
                    this.armorTimer -= dt;
                    if (this.armorTimer <= 0) this.hasArmor = false;
                }
                if (this.swinging) {
                    this.swingTimer -= dt;
                    this.nextSwingTime -= dt;
                    // Execute swing every 0.3 seconds (up to 2 swings) for smooth enhanced attacks
                    if (this.nextSwingTime <= 0 && this.swingCount < 2) {
                        this.performSwing();
                        this.swingCount++;
                        this.nextSwingTime = 0.3;
                    }
                    if (this.swingTimer <= 0) this.swinging = false;
                }
                if (this.inStab) {
                    this.stabTimer -= dt;
                    if (this.stabTimer <= 0) this.inStab = false;
                }
                if (this.inStomp) {
                    this.stompTimer -= dt;
                    if (this.stompTimer <= 0) this.inStomp = false;
                }
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
            }
            input(dt, spd) {
                let dx = 0, dy = 0;
                // Allow movement during swing (attacker mode E ability), but not during stab/stomp
                if (!this.inStab && !(this.inStomp && this.mode === 'tank')) {
                    if (keys.w) dy--;
                    if (keys.s) dy++;
                    if (keys.a) dx--;
                    if (keys.d) dx++;
                    if (dx || dy) {
                        let m = new Vector2(dx, dy).norm().mult(spd * dt);
                        this.x += m.x;
                        this.y += m.y;
                    }
                }
                this.angle = getMouseAimAngle(this.x, this.y);
                if (mouse.down && this.basicCD <= 0) this.basicAttack();
                if (keys.q && this.qCD <= 0) {
                    if (this.mode === 'attacker') this.throwSword();
                    else this.forwardStab();
                }
                if (keys.e && this.eCD <= 0) {
                    if (this.mode === 'attacker') this.heavySwing();
                    else this.swordStomp();
                }
                if (keys.f && this.fCD <= 0) this.specialArmor();
                if (keys.g && this.modeCD <= 0) this.switchMode();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            basicAttack() {
                this.revealTimer = 0.5;
                this.basicCD = this.hasArmor ? 0.6 : 1.0;
                let dmg = 125 + (this.hasArmor ? 75 : 0);
                
                // Create visual slash effect (bigger)
                particles.push(new Slash(this.x, this.y, this.angle, 120, Math.PI/2, '#C0504D'));
                
                // Hit enemies in arc in front of hero
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        let angle = Math.atan2(e.y-this.y, e.x-this.x);
                        let angleDiff = Math.abs(this.angle - angle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (d < 130 && angleDiff < Math.PI/2.5) {
                            e.takeDamage(dmg, this);
                        }
                    }
                }
            }
            throwSword() {
                this.revealTimer = 0.5;
                this.qCD = 4;
                let proj = new Projectile(this, this.x, this.y, this.angle, 800, 800, 400, '#FFD700', 12);
                proj.isSword = true;
                proj.maxDistance = 400;
                proj.onHit = (target) => {
                    target.takeDamage(800, this);
                    target.slowTimer = Math.max(target.slowTimer, 1);
                    target.slowMultiplier = 0.25;
                    for (let e of entities) {
                        if (e !== this && e !== target && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-target.x)**2 + (e.y-target.y)**2);
                            if (d < 200) e.takeDamage(320, this);
                        }
                    }
                    this.hp = Math.min(this.maxHp, this.hp + 500);
                };
                entities.push(proj);
                if (this.isPlayer) addKillMsg('Throwing Sword!');
            }
            heavySwing() {
                this.revealTimer = 0.5;
                this.eCD = 5;
                this.swinging = true;
                this.swingTimer = 0.6; // 2 enhanced attacks at 0.3s each
                this.swingCount = 0; // Track number of swings
                this.nextSwingTime = 0; // Time until next swing
                this.swingSpeedBoost = 1.8; // Speed multiplier during swing for smooth movement
                if (this.isPlayer) addKillMsg('Enhanced Strike! ⚔️');
            }
            
            performSwing() {
                // Enhanced basic attack - strike that stuns
                // Create visual slash arc - LARGER and more vibrant for enhanced attack
                particles.push(new Slash(this.x, this.y, this.angle, 200, Math.PI/0.9, this.mode === 'attacker' ? '#FFD700' : '#87CEEB'));
                // Add extra burst effect around the slash
                for(let i=0;i<15;i++) {
                    let angle = this.angle + (Math.random() - 0.5) * Math.PI;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                    particles.push(new Particle(this.x + Math.cos(this.angle)*80, this.y + Math.sin(this.angle)*80, this.mode === 'attacker' ? '#FFD700' : '#87CEEB', 2, 0.4, vel.x, vel.y));
                }
                
                // Deal enhanced damage to enemies in arc
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        let angle = Math.atan2(e.y-this.y, e.x-this.x);
                        let angleDiff = Math.abs(this.angle - angle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (d < 200 && angleDiff < Math.PI/2) {
                            // Enhanced basic attack: 600 damage + stun
                            e.takeDamage(600, this);
                            e.applyStatus('stun', 0.25, this);
                            
                            // If Ash is in armor mode, apply additional true damage
                            if (this.hasArmor) {
                                e.hp -= 200; // True damage bypasses defense
                            }
                            
                            // Knockback particles
                            for(let i=0;i<10;i++) particles.push(new Particle(e.x, e.y, this.mode === 'attacker' ? '#FFD700' : '#87CEEB', 4, 0.6));
                        }
                    }
                }
            }
            forwardStab() {
                this.revealTimer = 0.5;
                this.qCD = 4;
                this.inStab = true;
                this.stabTimer = 0.5;
                
                // Create visible stab effect - large forward slash
                particles.push(new Slash(this.x, this.y, this.angle, 150, Math.PI/3, '#4A7BA7'));
                
                // Add stab burst particles
                for(let i=0;i<20;i++) {
                    let angle = this.angle + (Math.random() - 0.5) * Math.PI / 2;
                    let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(250);
                    particles.push(new Particle(this.x + Math.cos(this.angle)*100, this.y + Math.sin(this.angle)*100, '#4A7BA7', 3, 0.5, vel.x, vel.y));
                }
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        let angle = Math.atan2(e.y-this.y, e.x-this.x);
                        let angleDiff = Math.abs(this.angle - angle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (d < 120 && angleDiff < Math.PI/4) {
                            e.takeDamage(600, this);
                            e.applyStatus('stun', 1, this);
                            
                            // Hit particles
                            for(let j=0;j<10;j++) particles.push(new Particle(e.x, e.y, '#4A7BA7', 4, 0.6));
                        }
                    }
                }
                this.speedBoostTimer = 3;
                this.speedMultiplier = 1.3;
                if (this.isPlayer) addKillMsg('Forward Stab!');
            }
            swordStomp() {
                this.revealTimer = 0.5;
                this.eCD = 5;
                this.inStomp = true;
                this.stompTimer = 0.6;
                let damage = this.hasArmor ? 1100 : 950;
                let radius = this.hasArmor ? 200 : 150;
                let totalDamage = 0;
                
                // Create stomp effect particle burst
                for(let i=0;i<12;i++) {
                    particles.push(new Particle(this.x + Math.cos(i*Math.PI/6)*radius*0.7, this.y + Math.sin(i*Math.PI/6)*radius*0.7, '#4A7BA7', 4, 0.6));
                }
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < radius) {
                            e.takeDamage(damage, this);
                            e.slowTimer = Math.max(e.slowTimer, 2);
                            e.slowMultiplier = 0.5;
                            e.injuredTimer = 10;
                            totalDamage += damage;
                            // Knockback effect
                            let angle = Math.atan2(e.y-this.y, e.x-this.x);
                            e.kbx += Math.cos(angle) * 300;
                            e.kby += Math.sin(angle) * 300;
                        }
                    }
                }
                this.hp = Math.min(this.maxHp, this.hp + totalDamage * 0.8);
                if (this.isPlayer) addKillMsg('Sword Stomp! 💥');
            }
            specialArmor() {
                this.revealTimer = 0.5;
                this.fCD = 40;
                this.hasArmor = true;
                this.armorTimer = 10;
                this.armorDmgReduction = 0.3;
                this.dmgMult = this.mode === 'attacker' ? 1.3 : 1;
                // Armor activation particles
                for(let i=0;i<20;i++) {
                    let angle = Math.random() * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*30, this.y + Math.sin(angle)*30, this.mode === 'attacker' ? '#FFD700' : '#00BFFF', 5, 0.8));
                }
                if (this.isPlayer) addKillMsg(`Special Armor! 🛡️`);
            }
            switchMode() {
                this.modeCD = 10;
                let oldMode = this.mode;
                this.mode = this.mode === 'attacker' ? 'tank' : 'attacker';
                
                if (oldMode === 'tank' && this.mode === 'attacker') {
                    // Tank to attacker: recharge E by 2s
                    this.eCD = Math.max(0, this.eCD - 2);
                } else if (oldMode === 'attacker' && this.mode === 'tank') {
                    // Attacker to tank: heal 150 HP per nearby enemy up to 5
                    let nearbyEnemies = 0;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                            if (d < 300) { // 300 radius for nearby
                                nearbyEnemies++;
                                if (nearbyEnemies <= 5) {
                                    this.hp = Math.min(this.maxHp, this.hp + 150);
                                }
                            }
                        }
                    }
                }
                
                if (this.isPlayer) addKillMsg(`Switched to ${this.mode} mode!`);
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
                    if (this.basicCD <= 0) this.basicAttack();
                    if (this.mode === 'attacker') {
                        if (this.qCD <= 0 && Math.random() < 0.1) this.throwSword();
                        if (this.eCD <= 0 && Math.random() < 0.1) this.heavySwing();
                    } else {
                        if (this.qCD <= 0 && Math.random() < 0.1) this.forwardStab();
                        if (this.eCD <= 0 && Math.random() < 0.1) this.swordStomp();
                    }
                    if (this.fCD <= 0 && this.hp < this.maxHp * 0.4) this.specialArmor();
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
            takeDamage(amt, src) {
                if (this.dead) return;
                if (this.mode === 'tank') amt *= 0.75;
                if (this.hasArmor) amt *= (1 - this.armorDmgReduction);
                super.takeDamage(amt, src);
            }
            getEffectiveSpeed() {
                let s = this.speed;
                if (this.speedBoostTimer > 0) s *= 1.3;
                if (this.hasArmor && this.mode === 'attacker') s *= 1.5;
                if (this.slowTimer > 0) s *= 0.6;
                return s;
            }
            draw(ctx) {
                if(this.dead)return;
                super.draw(ctx);
                
                // Get screen position
                let screenX = this.x - camera.x;
                let screenY = this.y - camera.y;
                
                // Draw sword held by hero
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.angle);
                
                if (this.mode === 'attacker') {
                    // Attacker mode - gold sword
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(10, -4, 25, 8);
                    ctx.fillStyle = '#FF6B35';
                    ctx.fillRect(10, -6, 5, 12);
                } else {
                    // Tank mode - blue shield + sword
                    ctx.fillStyle = '#00BFFF';
                    ctx.beginPath();
                    ctx.arc(-10, 0, 10, 0, Math.PI*2);
                    ctx.fill();
                    ctx.fillStyle = '#4A7BA7';
                    ctx.fillRect(5, -4, 20, 8);
                }
                
                ctx.restore();
                
                // Mode indicator above head
                ctx.fillStyle = this.mode === 'attacker' ? '#FF6B35' : '#4A7BA7';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(this.mode === 'attacker' ? '⚔️ ATK' : '🛡️ TANK', screenX, screenY - 40);
                
                // Armor active indicator - simpler pulsing glow
                if (this.hasArmor) {
                    // Simple glow based on armor timer (no Date.now() calls)
                    let pulseAmount = 0.5 + Math.abs(this.armorTimer % 1 - 0.5) * 0.4; // Ranges from 0.5 to 0.9
                    ctx.strokeStyle = this.mode === 'attacker' ? `rgba(255, 215, 0, ${pulseAmount})` : `rgba(100, 200, 255, ${pulseAmount})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 12, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Inner armor ring
                    ctx.strokeStyle = this.mode === 'attacker' ? 'rgba(255, 107, 53, 0.5)' : 'rgba(74, 123, 167, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, this.radius + 6, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Armor timer text
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 10px Arial';
                    ctx.fillText(`${Math.ceil(this.armorTimer)}s`, screenX, screenY + this.radius + 18);
                }
                
                // Mode cooldown indicator
                if (this.modeCD > 0) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(screenX - 15, screenY + this.radius + 5, 30, 4);
                    ctx.fillStyle = '#FF6B35';
                    ctx.fillRect(screenX - 15, screenY + this.radius + 5, (1 - this.modeCD/10) * 30, 4);
                }
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }
        
        // Return true for in‑game "hero" bots that should count toward FFA alive checks.
        // Prefer explicit `countsAsFFAHero` when present; fallback to legacy heuristic for compatibility.
        function isCountedAsHero(e) {
            if (!(e instanceof Entity) || e.dead || e.isPlayer) return false;
            if (typeof e.countsAsFFAHero === 'boolean') return e.countsAsFFAHero;
            // Backward-compat heuristic (used only when subclass hasn't declared the flag)
            return (typeof e.kills === 'number' && typeof e.baseSpd === 'number' && e.team !== 99 && !e.isStatue && !(e instanceof Sentry) && !(e instanceof Tripmine) && !e.isTrainingDummy);
        }

        function checkWinCondition(){
            if(player.dead) return;
            
            if(gameMode === 'squad'){
                // Count unique alive teams (excluding player's team 0)
                let aliveTeams = new Set();
                for(let e of entities){
                    if(e instanceof Entity && !e.dead && !e.isPlayer && !(e instanceof Sentry) && !(e instanceof Tripmine) && e.team !== undefined){
                        aliveTeams.add(e.team);
                    }
                }
                // Player wins if all enemy teams eliminated
                if(aliveTeams.size === 0) endGame(true);
            } else if(gameMode === '5v5') {
                // 5v5 Mode: Check if all enemies on red team (team 2) are eliminated
                let redAlive = entities.filter(e => e instanceof Entity && !e.dead && e.team === 2).length;
                if(redAlive === 0) endGame(true);
            } else {
                // FFA mode - player wins when all bots eliminated (only count actual heroes)
                let a = entities.filter(isCountedAsHero).length;
                if(a === 0) endGame(true);
            }
        }
        function endGame(vic){
            gameRunning=false;
            let s=document.getElementById('gameOverScreen');
            s.style.display='flex';
            let t=document.getElementById('goTitle'),sub=document.getElementById('goSub');
            if(vic){
                t.innerText="VICTORY";
                t.style.color="#00bcd4";
                sub.innerText="Champion!";
                // Broadcast victory to all other players in online FFA
                if(gameMode === 'ffa_online' && onlineSocket) {
                    onlineSocket.emit('playerVictory', {
                        winnerId: onlineSocket.id,
                        winnerName: player?.name || 'Player'
                    });
                }
            } else {
                t.innerText="DEFEAT";
                t.style.color="#e74c3c";
                sub.innerText="Try again.";
            }
        }
        
        function setHeroAbilityIcons(p) {
            // Set hero-specific emoji icons for Q, E, F abilities
            let q = document.getElementById('iconQ');
            let e = document.getElementById('iconE');
            let f = document.getElementById('iconF');
            let g = document.getElementById('iconG');
            
            // Default icons
            if (q) q.innerText = '💥';
            if (e) e.innerText = '💨';
            if (f) f.innerText = '💥';
            
            // Hero-specific icons - COMPLETE LIST
            if(p instanceof Paul) {
                if(q) q.innerText = '🔥';
                if(e) e.innerText = '👟';
                if(f) f.innerText = '💣';
            } else if(p instanceof Noob) {
                if(q) q.innerText = '🥤';
                if(e) e.innerText = '🚀';
                if(f) f.innerText = '🔫';
            } else if(p instanceof Kaiser) {
                if(q) q.innerText = '👊';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '👑';
            } else if(p instanceof Tate) {
                if(q) q.innerText = '🛡️';
                if(e) e.innerText = '🥊';
                if(f) f.innerText = '🏎️';
            } else if(p instanceof Edgar) {
                if(q) q.innerText = '⚔️';
                if(e) e.innerText = '🔪';
                if(f) f.innerText = '👿';
            } else if(p instanceof Builderman) {
                if(q) q.innerText = '🏗️';
                if(e) e.innerText = '🦾';
                if(f) f.innerText = '💣';
            } else if(p instanceof Mamba) {
                if(q) q.innerText = '🏀';
                if(e) e.innerText = '👊';
                if(f) f.innerText = '🚁';
            } else if(p instanceof LightHero) {
                if(q) q.innerText = '🔆';
                if(e) e.innerText = '💫';
                if(f) f.innerText = '⏪';
            } else if(p instanceof Kai) {
                if(q) q.innerText = '⚡';
                if(e) e.innerText = '🖊️';
                if(f) f.innerText = '💨';
            } else if(p instanceof Acheron) {
                if(q) q.innerText = '🕳️';
                if(e) e.innerText = '⚔️';
                if(f) f.innerText = '🔴';
            } else if(p instanceof Noli) {
                if(q) q.innerText = '🌌';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '🌀';
            } else if(p instanceof Don) {
                if(q) q.innerText = '🏹';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '☄️';
            } else if(p instanceof Fletcher) {
                if(q) q.innerText = '📡';
                if(e) e.innerText = '🎯';
                if(f) f.innerText = '🛡️';
            } else if(p instanceof Darrick) {
                if(q) q.innerText = '🔫';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '💥';
            } else if(p instanceof Glace) {
                if(q) q.innerText = '🧊';
                if(e) e.innerText = '❄️';
                if(f) f.innerText = '💎';
            } else if(p instanceof Ming) {
                if(q) q.innerText = '🌀';
                if(e) e.innerText = '⚡';
                if(f) f.innerText = '🪞';
            } else if(p instanceof Nos) {
                if(q) q.innerText = '🔱';
                if(e) e.innerText = '🩸';
                if(f) f.innerText = '👹';
            } else if(p instanceof Carlos) {
                if(q) q.innerText = '⚽';
                if(e) e.innerText = '💃';
                if(f) f.innerText = '🎆';
            } else if(p instanceof Gamb) {
                if(q) q.innerText = '🎲';
                if(e) e.innerText = '🔫';
                if(f) f.innerText = '🎩';
            } else if(p instanceof Buster) {
                if(q) q.innerText = '🟦';
                if(e) e.innerText = '🔺';
                if(f) f.innerText = '🛡️';
            } else if(p instanceof Neo) {
                if(q) q.innerText = '⚡';
                if(e) e.innerText = '💥';
                if(f) f.innerText = '🪝';
            } else if(p instanceof Fred) {
                if(q) q.innerText = '⚡';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '🏎️';
            } else if(p instanceof Chimera) {
                if(q) q.innerText = '🌪️';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '✨';
            } else if(p instanceof Benjamin) {
                if(q) q.innerText = '🔨';
                if(e) e.innerText = '⚒️';
                if(f) f.innerText = '🛡️';
            } else if(p instanceof Ren) {
                if(q) q.innerText = '🃏';
                if(e) e.innerText = '🏃';
                if(f) f.innerText = '🌟';
            } else if(p instanceof Melvin) {
                if(q) q.innerText = '🌋';
                if(e) e.innerText = '🏃';
                if(f) f.innerText = '🔥';
            } else if(p instanceof Zappa) {
                if(q) q.innerText = '🚲';
                if(e) e.innerText = '🎯';
                if(f) f.innerText = '⚡';
            } else if(p instanceof Cyrus) {
                if(q) q.innerText = '🔫';
                if(e) e.innerText = '⚡';
                if(f) f.innerText = '🤖';
            } else if(p instanceof Austin) {
                if(q) q.innerText = '🛣️';
                if(e) e.innerText = '⚔️';
                if(f) f.innerText = '💪';
            } else if(p instanceof Ambrose) {
                if(q) q.innerText = '👤';
                if(e) e.innerText = '🌀';
                if(f) f.innerText = '🐦';
            } else if(p instanceof Wesley) {
                if(q) q.innerText = '💧';
                if(e) e.innerText = '🌊';
                if(f) f.innerText = '🌀';
            } else if(p instanceof Li) {
                if(q) q.innerText = '💧';
                if(e) e.innerText = '🥋';
                if(f) f.innerText = '🌊';
            } else if(p instanceof Lav) {
                if(q) q.innerText = '💕';
                if(e) e.innerText = '💖';
                if(f) f.innerText = '💗';
            } else if(p instanceof Kenshi) {
                if(q) q.innerText = '🌙';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '⚔️';
            } else if(p instanceof Gigi) {
                if(q) q.innerText = '👾';
                if(e) e.innerText = '⚙️';
                if(f) f.innerText = '🎮';
            } else if(p instanceof Ash) {
                if(q) q.innerText = '🗡️';
                if(e) e.innerText = '⚒️';
                if(f) f.innerText = '🛡️';
            } else if(p instanceof Yun) {
                if(q) q.innerText = '🌪️';
                if(e) e.innerText = '💚';
                if(f) f.innerText = '⚡';
            } else if(p instanceof Gregory) {
                if(q) q.innerText = '⚡';
                if(e) e.innerText = '⏳';
                if(f) f.innerText = '🕰️';
            } else if(p instanceof Max) {
                if(q) q.innerText = '🥤';
                if(e) e.innerText = '⚕️';
                if(f) f.innerText = '🏎️';
                if(g) g.innerText = '🏁';
            } else if(p instanceof RacingDuo) {
                if(q) q.innerText = '🏎️';
                if(e) e.innerText = '🛞';
                if(f) f.innerText = '🎯';
            } else if(p instanceof Monza) {
                if(q) q.innerText = '👥';
                if(e) e.innerText = '💨';
                if(f) f.innerText = '🍕';
            } else if(p instanceof Faik) {
                if(q) q.innerText = '➡️';
                if(e) e.innerText = '💠';
                if(f) f.innerText = '🩸';
            } else if(p instanceof Dayum) {
                if(q) q.innerText = '🔥';
                if(e) e.innerText = '💥';
                if(f) f.innerText = '⚡';
            } else if(p instanceof Vival) {
                if(q) q.innerText = '💜';
                if(e) e.innerText = '⚔️';
                if(f) f.innerText = '❤️';
            } else if (typeof Everdawn !== 'undefined' && p instanceof Everdawn) {
                if(q) q.innerText = '✨';
                if(e) e.innerText = '🪞';
                if(f) f.innerText = '🔓';
                if(g) g.innerText = '🔗';
            } else if(p instanceof Coolkidd) {
                if(q) q.innerText = '🍕';
                if(e) e.innerText = '👾';
                if(f) f.innerText = '🔥';
            } else if (p instanceof Bai) {
                if(q) q.innerText = '📖';
                if(e) e.innerText = '✒️';
                if(f) f.innerText = '🖋️';
            } else if (p instanceof Apollo) {
                if(q) q.innerText = '☀️';
                if(e) e.innerText = '⚔️';
                if(f) f.innerText = '☀️';
            } else if (p instanceof Aurora) {
                    if(q) q.innerText = '❄️';
                    if(e) e.innerText = '🌨️';
                    if(f) f.innerText = '✨';
            } else if (p instanceof Caskrice) {
                    if(q) q.innerText = '🗡️';
                    if(e) e.innerText = '💀';
                    if(f) f.innerText = '☠️';
                    if(g) g.innerText = '🐉';
            } else if (p instanceof Zeus) {
                    if(q) q.innerText = '⚡';
                    if(e) e.innerText = '🌩️';
                    if(f) f.innerText = '👑';
            } else if (p instanceof BountyHunter) {
                    if(q) q.innerText = '☠️';
                    if(e) e.innerText = '😰';
                    if(f) f.innerText = '😈';
            } else if (p instanceof Winston) {
                    if(q) q.innerText = '💨';
                    if(e) e.innerText = '➡️';
                    if(f) f.innerText = '🌀';
            } else if (p instanceof Steven) {
                    if(q) q.innerText = '⚔️';
                    if(e) e.innerText = '🔮';
                    if(f) f.innerText = '🌌';
            } else if (p instanceof Amir) {
                    if(q) q.innerText = '🍛';
                    if(e) e.innerText = '💨';
                    if(f) f.innerText = '🚚';
            } else if (p instanceof Christian) {
                    if(q) q.innerText = '🚗';
                    if(e) e.innerText = '💨';
                    if(f) f.innerText = '💥';
                    if(g) g.innerText = '📐';
            } else if (p instanceof Cornelius) {
                    if(q) q.innerText = '🗡';
                    if(e) e.innerText = '⚡';
                    if(f) f.innerText = '🌍';
            } else if (p instanceof Twins) {
                    if(q) q.innerText = '🏈';
                    if(e) e.innerText = '💨';
                    if(f) f.innerText = '👊';
            } else if (p instanceof Guest) {
                    if(q) q.innerText = '🛡️';
                    if(e) e.innerText = '⚡';
                    if(f) f.innerText = '👊';
            } else if (p instanceof Jimeka) {
                    if(q) q.innerText = '🎪';
                    if(e) e.innerText = '🤡';
                    if(f) f.innerText = p.currentFVariant ? p.currentFVariant.emoji : '❓';
            } else if (p instanceof Trent) {
                    if(q) q.innerText = '👊';
                    if(e) e.innerText = '🫁';
                    if(f) f.innerText = '💥';
                    if(g) g.innerText = '🏃';
            } else if (p instanceof Lune) {
                if(q) q.innerText = '🌙';
                if(e) e.innerText = '🌕';
                if(f) f.innerText = '☾';
            } else if (p instanceof BrunoAlexander) {
                if(q) q.innerText = '⚡';
                if(e) e.innerText = '🗡';
                if(f) f.innerText = '⬢';
                if(g) g.innerText = p.ascended ? '👑' : '⚔️';
            }
        }

        function updateHUD(p) {
            // First, set hero-specific icons for Q, E, F abilities
            setHeroAbilityIcons(p);
            // hide qCharge by default
            let qElem = document.getElementById('qCharge'); if(qElem) qElem.style.display='none';
            
            let hpb=document.getElementById('hpBarFill'),sb=document.getElementById('shieldBarFill'),eb=document.getElementById('enhancedBarFill'),hpt=document.getElementById('hpText');
            if(hpb)hpb.style.width=(p.hp/p.maxHp)*100+'%';
            if(sb){if(p.shield>0){sb.style.width=Math.min(100,(p.shield/p.maxHp)*100)+'%';sb.style.left=(p.hp/p.maxHp)*100+'%';}else{sb.style.width='0%';}}
            if(eb){if(p.enhancedTimer>0){eb.style.width=(p.enhancedTimer/5)*100+'%';eb.style.left=(p.hp/p.maxHp)*100+'%';}else{eb.style.width='0%';}}
            if(hpt)hpt.innerText=`${Math.ceil(p.hp)} / ${p.maxHp}`;
            let c1,c2,c3,m1,m2,m3,c4,m4;
            // Map cooldowns for HUD
            if(p instanceof Paul){c1=p.qCD;m1=4;c2=p.eCD;m2=9;c3=p.fCD;m3=15;c4=0;m4=1;}
            else if(p instanceof Darrick){ c1 = p.qCD; m1 = 5; c2 = p.eCD; m2 = 4; c3 = p.fCD; m3 = 14; c4 = 0; m4 = 1; }
            else if(p instanceof Noob){c1=p.qCD;m1=12;c2=p.eCD;m2=8;c3=p.fCD;m3=5;c4=0;m4=1;}
            else if(p instanceof Kaiser){c1=p.qCD;m1=10;c2=p.eCD;m2=4;c3=p.fCD;m3=15;c4=p.gCD;m4=30;}
            else if(p instanceof Tate){c1=p.qCD;m1=7;c2=p.eCD;m2=6;c3=p.fCD;m3=25;c4=0;m4=1;}
            else if(p instanceof Coolkidd){c1=p.qCD;m1=4;c2=p.eCD;m2=11;c3=p.fCD;m3=16;c4=p.gCD;m4=8;}
            else if(p instanceof Edgar){c1=p.qCD;m1=8;c2=p.eCD;m2=8;c3=p.fCD;m3=25;c4=0;m4=1;}
            else if(p instanceof Builderman){c1=p.sentry?2:p.qCD;m1=2;c2=p.eCD;m2=15;c3=p.fCD;m3=8;c4=0;m4=1;} 
            else if(p instanceof LightHero){c1=p.qCD;m1=4;c2=p.eCD;m2=5;c3=p.fCD;m3=10;c4=0;m4=1;}
            else if(p instanceof Kai){c1=p.qCD;m1=6;c2=p.eCD;m2=7;c3=p.fCD;m3=20;c4=p.gCD;m4=30;}
            else if(p instanceof Acheron){c1=p.qCD;m1=10;c2=p.eCD;m2=10;c3=p.fCD;m3=28;c4=0;m4=1;}
            else if(p instanceof Mamba){c1=p.qCD;m1=6;c2=p.eCD;m2=12;c3=p.fCD;m3=18;c4=0;m4=1;}
            else if(p instanceof Ming){
                c1 = p.qCD; m1 = 5;
                c2 = p.eCD; m2 = 4;
                c3 = p.fCD; m3 = 15;
                if (p.gCharges >= p.maxGCharges) { c4 = 0; m4 = 3; } else { c4 = p.gChargeTimer; m4 = 3; }
            }
            else if(p instanceof Don){c1=p.qCD;m1=5;c2=p.eCD;m2=0.5;c3=p.fCD;m3=10;c4=0;m4=1;}
            else if(p instanceof Fletcher){c1=p.qCD;m1=13;c2=p.eCD;m2=2;c3=p.fCD;m3=17;c4=0;m4=1;}
            else if(p instanceof Noli){c1=p.qCD;m1=20;c2=p.eCD;m2=15;c3=p.fCD;m3=11;c4=0;m4=1;}
            else if(p instanceof Glace){c1=p.qCD;m1=18;c2=p.eCD;m2=10;c3=p.fCD;m3=7;c4=0;m4=1;}
            else if(p instanceof Nos){c1=p.qCD;m1=4;c2=p.eCD;m2=7;c3=p.fCD;m3=25;c4=0;m4=1;}
            else if(p instanceof Carlos){c1=p.qCD;m1=10;c2=p.eCD;m2=15;c3=p.fCD;m3=25;c4=0;m4=1;}
            else if(p instanceof Buster){c1=p.qCD;m1=8;c2=p.eCD;m2=12;c3=p.fCD;m3=15;c4=p.gCD;m4=0.5;}
            else if(p instanceof Ren){c1=p.qCD;m1=7;c2=p.eCD;m2=12;c3=p.fCD;m3=20;c4=0;m4=1;}
            else if(p instanceof Gamb){c1=p.qCD;m1=3;c2=p.eCD;m2=8;c3=p.fCD;m3=12;c4=p.gCD;m4=8;}
            else if(p instanceof Wesley){c1=p.qCD;m1=6;c2=p.eCD;m2=8;c3=p.fCD;m3=14;c4=0;m4=1;}
            else if(p instanceof Chimera){c1=p.qCD;m1=11;c2=p.eCD;m2=4;c3=p.fCD;m3=13;c4=p.gCD;m4=3;}
            else if(p instanceof Benjamin){c1=p.qCD;m1=8;c2=p.eCD;m2=12;c3=p.fCD;m3=14;c4=0;m4=1;}
            else if(p instanceof Melvin){c1=p.qCD;m1=10;c2=p.eCD;m2=4;c3=p.fCD;m3=15;c4=0;m4=1;}
            else if(p instanceof Zappa){c1=p.qCD;m1=14;c2=p.eCD;m2=3;c3=p.fCD;m3=15;c4=0;m4=1;}
            else if(p instanceof Cyrus){c1=p.qCD;m1=5;c2=p.eCD;m2=7;c3=p.droneActive?0:(p.droneCooldown || 0);m3=30;c4=0;m4=1;}
            else if(p instanceof Austin){c1=p.qCD;m1=12;c2=p.eCD;m2=7.5;c3=p.fCD;m3=20;c4=0;m4=1;}
            else if(p instanceof Ambrose){c1=p.qCD;m1=10;c2=p.eCD;m2=5;c3=p.fCD;m3=22;c4=0;m4=1;}
            else if(p instanceof Ash){c1=p.qCD;m1=4;c2=p.eCD;m2=5;c3=p.fCD;m3=40;c4=0;m4=1;}
            else if(p instanceof Neo){c1=p.qCD;m1=4;c2=p.eCD;m2=12;c3=p.fCD;m3=13;c4=p.gCD;m4=25;}
            else if(p instanceof Li){c1=p.qCD;m1=9;c2=p.eCD;m2=6;c3=p.fCD;m3=24;c4=0;m4=1;}
            else if(p instanceof Lav){c1=p.qCD;m1=16;c2=p.eCD;m2=3;c3=p.fCD;m3=18;c4=0;m4=1;}
            else if(p instanceof Max){c1=p.qCD;m1=6;c2=p.eCD;m2=12;c3=p.fCD;m3=16.5;c4=p.gCD;m4=9.9;}
            else if(p instanceof Kenshi){c1=p.qCD;m1=6;c2=p.eCD;m2=6;c3=p.fCD;m3=15;c4=0;m4=1;}
            else if(p instanceof Gigi){c1=p.qCD;m1=8;c2=p.eCD;m2=10;c3=p.fCD;m3=26;c4=0;m4=1;}
            else if(p instanceof Yun){ c1 = p.qCD; m1 = 10; c2 = p.eCD; m2 = 6; c3 = p.fCD; m3 = 18; c4 = 0; m4 = 1; }
            else if(p instanceof Gregory){
                c1 = p.qCD; m1 = 4;
                c2 = p.futureTimeline ? (p.futureECD ?? 0) : p.eCD; m2 = p.futureTimeline ? 3 : 7;
                c3 = p.futureTimeline ? (p.futureFCD ?? 0) : p.fCD; m3 = 25;
                c4 = 0; m4 = 1;
            }
            else if(p instanceof RacingDuo){c1=p.qCD;m1=11;c2=p.eCD;m2=12;c3=p.fCD;m3=31;c4=p.switchCD;m4=5;}
            else if(p instanceof Monza){c1=p.qCD;m1=15;c2=p.eCD;m2=10;c3=p.fCD;m3=17;c4=0;m4=1;}
            else if(p instanceof Faik){c1=p.qCD;m1=7;c2=p.eCD;m2=5;c3=p.fCD;m3=22;c4=0;m4=1;}
            else if(p instanceof Vival){c1=p.qCD;m1=6;c2=p.eCD;m2=12;c3=p.fCD;m3=17;c4=p.gCD;m4=90;}
            else if(typeof Everdawn !== 'undefined' && p instanceof Everdawn){c1=p.qCD;m1=10;c2=p.eCD;m2=8;c3=p.fCD;m3=60;c4=p.gCD;m4=20;}
            else if(p instanceof Bai){ c1 = p.qCD; m1 = 5; c2 = p.eCD; m2 = 6; c3 = p.fCD; m3 = 24; c4 = p.rCD; m4 = 24; }
            else if(p instanceof Apollo){ c1 = p.qCD; m1 = 7; c2 = p.eCD; m2 = 5; c3 = p.fCD; m3 = 40; c4 = p.rCD; m4 = 40; }
            else if(p instanceof Lune){ c1 = p.qCD; m1 = 5; c2 = p.eCD; m2 = 6; c3 = p.fCD; m3 = 15; c4 = 0; m4 = 1; }
            else if(p instanceof BrunoAlexander){ c1 = p.qCD; m1 = 11; c2 = p.eCD; m2 = 6; c3 = p.fCD; m3 = 18; c4 = p.gCD; m4 = 20; }
            else if(p instanceof Zeus){ c1 = p.qCD; m1 = 7; c2 = p.eCD; m2 = 5; c3 = p.fCD; m3 = 48; c4 = 0; m4 = 1; }
            else if(p instanceof BountyHunter){ c1 = p.mode === 'meet_your_end' ? p.qCD : p.qCD; m1 = 5; c2 = p.eCD; m2 = 7; c3 = p.fCD; m3 = 12; c4 = p.modeSwitchCD; m4 = 5; }
            else if(p instanceof Aurora) {c1=p.qCD;m1=10;c2=p.eCD;m2=7;c3=p.fCD;m3=25;c4=0;m4=1;}
            else if(p instanceof Caskrice){c1=p.qCD;m1=6;c2=p.eCD;m2=8;c3=p.fCD;m3=15;c4=p.gCD;m4=30;}
            else if(p instanceof Fred){c1=p.qCD;m1=8;c2=p.eCD;m2=12;c3=p.fCD;m3=20;c4=0;m4=1;}
            else if(p instanceof Winston){c1=p.qCD;m1=4;c2=p.eCD;m2=7;c3=p.fCD;m3=18;c4=0;m4=1;}
            else if(p instanceof Steven){c1=p.qCD;m1=5;c2=p.eCD;m2=12;c3=p.fCD;m3=24;c4=0;m4=1;}
            else if(p instanceof Amir){c1=p.qCD;m1=7;c2=p.eCD;m2=6;c3=p.fCD;m3=22;c4=0;m4=1;}
            else if(p instanceof Christian){
                // Q uses charge timer (5s per stack)
                if(p.qCharges >= p.maxQCharges) { c1 = 0; m1 = 5; } else { c1 = p.qChargeTimer; m1 = 5; }
                c2 = p.eCD; m2 = 8;
                c3 = p.fCD; m3 = 12;
                if(p.gCharges >= p.maxGCharges) { c4 = 0; m4 = 3; } else { c4 = p.gChargeTimer || 0; m4 = 3; }
            }
            else if(p instanceof Cornelius){c1=p.qCD;m1=3;c2=p.eCD;m2=6;c3=p.fCD;m3=12;c4=p.gCD;m4=3;}
            else if(p instanceof Dayum){c1=p.qCD;m1=5;c2=p.eCD;m2=5;c3=p.fCD;m3=10;c4=p.gCD;m4=15;}
            else if(p instanceof Twins){c1=p.qCD;m1=7;c2=p.eCD;m2=8;c3=p.fCD;m3=12;c4=p.gCD;m4=25;}
            else if(p instanceof Jimeka){c1=p.qCD;m1=6;c2=p.eCD;m2=8;c3=p.fCD;m3=15;c4=p.gCD;m4=10;}
            else if(p instanceof Trent){c1=p.qCD;m1=3;c2=p.eCD;m2=9;c3=p.fCD;m3=7;c4=p.gCD;m4=5;c5=p.rCD;m5=45;}
            else if(p instanceof Guest){c1=p.qCD;m1=7;c2=p.eCD;m2=4;c3=p.fCD;m3=20;c4=0;m4=1;}
            else{c1=0;m1=1;c2=0;m2=1;c3=0;m3=1;c4=0;m4=1;}
            if(p instanceof Melvin) {
                document.getElementById('eCharge').style.display = 'block';
                document.getElementById('eCharge').innerText = p.eCharges;
                document.getElementById('gCharge').style.display = 'none';
            } else if(p instanceof Zappa) {
                document.getElementById('eCharge').style.display = 'block';
                document.getElementById('eCharge').innerText = p.eCharges;
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.qCharges;
            } else if(p instanceof Kai) {
                document.getElementById('eCharge').style.display = 'block';
                document.getElementById('eCharge').innerText = p.eCharges;
                document.getElementById('gCharge').style.display = 'none';
            } else if(p instanceof Gamb) {
                document.getElementById('eCharge').style.display = 'block';
                document.getElementById('eCharge').innerText = p.eCharges;
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.gCharges;
            } else if(p instanceof Noli) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.teleportCharges;
            } else if(p instanceof Ming) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.gCharges;
            } else if(p instanceof Li) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'none'; // Hide G charge
                // Passive auto-triggers, no UI needed
            } else if(p instanceof Lav) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'none';
                // Love power shown via passive bar
            } else if(p instanceof Kaiser) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'none';
            } else if(p instanceof Don) {
                document.getElementById('eCharge').style.display = 'block';
                document.getElementById('eCharge').innerText = p.eCharges;
                document.getElementById('gCharge').style.display = 'none';
            } else if(p instanceof Fletcher) {
                document.getElementById('eCharge').style.display = 'block';
                document.getElementById('eCharge').innerText = p.eCharges;
                document.getElementById('gCharge').style.display = 'none';
            } else if(p instanceof Cornelius) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.ascensionCharges;
            } else if(p instanceof BrunoAlexander) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'none';
            } else if(p instanceof Christian) {
                document.getElementById('eCharge').style.display = 'none';
                let qEl = document.getElementById('qCharge');
                if(qEl){ qEl.style.display='block'; qEl.innerText = p.qCharges; }
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.gCharges;
            } else if(p instanceof Guest) {
                document.getElementById('eCharge').style.display = 'none';
                document.getElementById('gCharge').style.display = 'block';
                document.getElementById('gCharge').innerText = p.gCharges;
            } 
            // Restore charge counters for heroes that actually track charge counts.
            // Keep Builderman's F-ult numeric display special-cased, but don't blanket-hide every charge HUD.
            let eChargeEl = document.getElementById('eCharge');
            let gChargeEl = document.getElementById('gCharge');
            let ultChargeEl = document.getElementById('ultCharge');
            if (eChargeEl) eChargeEl.style.display = 'none';
            if (gChargeEl) gChargeEl.style.display = 'none';
            if (ultChargeEl) ultChargeEl.style.display = 'none';

            if (p instanceof Builderman) {
                if (eChargeEl) eChargeEl.style.display = 'none';
                if (gChargeEl) gChargeEl.style.display = 'none';
                if (ultChargeEl) { ultChargeEl.style.display = 'block'; ultChargeEl.innerText = p.fCharges; }
            } else {
                if (typeof p.eCharges === 'number') {
                    if (eChargeEl) {
                        eChargeEl.style.display = 'block';
                        eChargeEl.innerText = p.eCharges;
                    }
                }
                if (typeof p.gCharges === 'number') {
                    if (gChargeEl) {
                        gChargeEl.style.display = 'block';
                        gChargeEl.innerText = p.gCharges;
                    }
                }
                if (typeof p.teleportCharges === 'number' && gChargeEl) {
                    gChargeEl.style.display = 'block';
                    gChargeEl.innerText = p.teleportCharges;
                }
                if (typeof p.ascensionCharges === 'number' && gChargeEl) {
                    gChargeEl.style.display = 'block';
                    gChargeEl.innerText = p.ascensionCharges;
                }
                if (typeof p.qCharges === 'number' && !p instanceof Builderman && qElem) {
                    qElem.style.display = 'block';
                    qElem.innerText = p.qCharges;
                }
            }

            // Set G key icon and visibility
            if(p instanceof Christian) {
                document.getElementById('skill4Box').style.display = 'flex';
                document.getElementById('iconG').innerText = '🚘';
            } else if(p instanceof BrunoAlexander) {
                document.getElementById('skill4Box').style.display = 'flex';
                document.getElementById('iconG').innerText = p.ascended ? '👑' : '⚔️';
            } else if(p instanceof Caskrice) {
                document.getElementById('skill4Box').style.display = 'flex';
                document.getElementById('iconG').innerText = '🐉';
            } else if(p instanceof Jimeka || p instanceof Buster || p instanceof Noli || p instanceof Kai || p instanceof Kaiser || p instanceof Ming || p instanceof Gamb || p instanceof Neo || p instanceof Chimera || p instanceof Ash || p instanceof RacingDuo || p instanceof Vival || (typeof Everdawn !== 'undefined' && p instanceof Everdawn) || p instanceof Dayum || p instanceof BountyHunter || p instanceof Cornelius || p instanceof Twins || p instanceof Guest || p instanceof Trent || p instanceof Max) {
                document.getElementById('skill4Box').style.display = 'flex';
                if(p instanceof Buster) {
                    document.getElementById('iconG').innerText = '💡';
                } else if(p instanceof Kai || p instanceof Kaiser) {
                    let hasOtherHeroes = false;
                    for (let e of entities) {
                        if (e instanceof Entity && !(e instanceof Kai) && !(e instanceof Kaiser) && !e.dead) {
                            hasOtherHeroes = true;
                            break;
                        }
                    }
                    if (hasOtherHeroes) {
                        document.getElementById('iconG').innerText = 'LMS';
                    } else {
                        document.getElementById('iconG').innerText = '';
                    }
                } else if (p instanceof Ming) {
                    document.getElementById('iconG').innerText = '↔️';
                } else if (p instanceof Gamb) {
                    document.getElementById('iconG').innerText = '♻️';
                } else if (p instanceof Neo) {
                    document.getElementById('iconG').innerText = '⛸️';
                } else if (p instanceof Chimera) {
                    document.getElementById('iconG').innerText = p.chimeraMode ? '👹' : '🐉';
                } else if (p instanceof Ash) {
                    document.getElementById('iconG').innerText = p.mode === 'attacker' ? '⚔️' : '🛡️';
                } else if (p instanceof RacingDuo) {
                    document.getElementById('iconG').innerText = p.lewisMode ? '🚗' : '🏎️';
                } else if (p instanceof BountyHunter) {
                    document.getElementById('iconG').innerText = p.mode === 'meet_your_end' ? '🔪' : '🔫';
                } else if (p instanceof Dayum) {
                    document.getElementById('iconG').innerText = '⚡';
                } else if (p instanceof Vival) {
                    document.getElementById('iconG').innerText = '😇';
                } else if (typeof Everdawn !== 'undefined' && p instanceof Everdawn) {
                    document.getElementById('iconG').innerText = '🔗';
                } else if (p instanceof Cornelius) {
                    let gIcon = document.getElementById('iconG');
                    if (gIcon) gIcon.innerText = p.ascended ? '👑' : '⚡';
                } else if (p instanceof Twins) {
                    document.getElementById('iconG').innerText = p.fusionActive ? '🔥' : '🔄';
                } else if (p instanceof Guest) {
                    document.getElementById('iconG').innerText = '⚔️';
                } else if (p instanceof Max) {
                    document.getElementById('iconG').innerText = '🏁';
                } else if (p instanceof Jimeka) {
                    document.getElementById('iconG').innerText = '🎲';
                } else if (p instanceof Trent) {
                    document.getElementById('iconG').innerText = '🏃';
                } else {
                    document.getElementById('iconG').innerText = '🌀';
                }
            } else {
                document.getElementById('skill4Box').style.display = 'none';
            }

            // Update Q and E icons for Chimera based on copied abilities
            if(p instanceof Chimera) {
                if(p.chimeraMode && p.copiedQFunc && p.copiedEFunc) {
                    // Both abilities copied - show stars
                    let q = document.getElementById('iconQ');
                    let e = document.getElementById('iconE');
                    if(q) q.innerText = '⭐';
                    if(e) e.innerText = '⭐';
                } else if(p.chimeraMode && p.copiedQFunc) {
                    // Only Q copied
                    let q = document.getElementById('iconQ');
                    if(q) q.innerText = '⭐';
                } else if(p.chimeraMode && p.copiedEFunc) {
                    // Only E copied
                    let e = document.getElementById('iconE');
                    if(e) e.innerText = '⭐';
                } else {
                    // Not in chimera mode or no abilities copied - reset to default
                    let q = document.getElementById('iconQ');
                    let e = document.getElementById('iconE');
                    if(q) q.innerText = '🌪️';
                    if(e) e.innerText = '💨';
                }
                
                // Show what enemy was copied with their name
                if(p.chimeraMode && p.copiedEnemyName) {
                    let copiedLabel = document.getElementById('gCharge');
                    if(copiedLabel) {
                        let heroName = p.copiedEnemyName.replace('Player (', '').replace('Enemy ', '').replace(')', '').substring(0, 10);
                        copiedLabel.innerText = '⭐' + heroName;
                    }
                } else if(p instanceof Chimera && !p.chimeraMode) {
                    let copiedLabel = document.getElementById('gCharge');
                    if(copiedLabel) copiedLabel.innerText = '';
                }
            }

            // Ensure Yun's Q/E icons when player is Yun
            if (p instanceof Yun) {
                let qIcon = document.getElementById('iconQ');
                let eIcon = document.getElementById('iconE');
                if (qIcon) qIcon.innerText = '🌪️';
                if (eIcon) eIcon.innerText = '💚';
            }

            let s1=document.getElementById('skill1CD'),b1=document.getElementById('skill1Box'),t1=document.getElementById('skill1Timer');
            if(s1){s1.style.height=((c1/m1)*100)+'%';b1.className=c1<=0?'ability-box ready':'ability-box';if(c1>0){t1.style.display='block';t1.innerText=c1.toFixed(1);}else t1.style.display='none';}
            let s2=document.getElementById('skill2CD'),b2=document.getElementById('skill2Box'),t2=document.getElementById('skill2Timer');
            if(s2){s2.style.height=((c2/m2)*100)+'%';b2.className=c2<=0?'ability-box ready':'ability-box';if(c2>0){t2.style.display='block';t2.innerText=c2.toFixed(1);}else t2.style.display='none';}
            let s3=document.getElementById('ultCD'),b3=document.getElementById('ultBox'),t3=document.getElementById('ultTimer');
            if(s3){s3.style.height=((c3/m3)*100)+'%';b3.className=c3<=0?'ability-box ready':'ability-box';if(c3>0){t3.style.display='block';t3.innerText=c3.toFixed(1);}else t3.style.display='none';}
            let s4=document.getElementById('skill4CD'),b4=document.getElementById('skill4Box'),t4=document.getElementById('skill4Timer');
            if(s4){s4.style.height=((c4/m4)*100)+'%';b4.className=c4<=0?'ability-box ready':'ability-box';if(c4>0){t4.style.display='block';t4.innerText=c4.toFixed(1);}else t4.style.display='none';}
            let sR=document.getElementById('skillRCD'),bR=document.getElementById('skillRBox'),tR=document.getElementById('skillRTimer');
            if(sR){sR.style.height=((p.rCD/120)*100)+'%';bR.className=p.rCD<=0?'ability-box ready':'ability-box';if(p.rCD>0){tR.style.display='block';tR.innerText=p.rCD.toFixed(1);}else tR.style.display='none';}
            
            // Update passive bar for Li and other hero-specific bars
            let passiveBar = document.getElementById('passiveBarFill');
            let passiveBarCornelius = document.getElementById('passiveBarFillCornelius');
            let passiveBarLi = document.getElementById('passiveBarFillLi');

            // hide all first
            if(passiveBar) passiveBar.style.display = 'none';
            if(passiveBarCornelius) passiveBarCornelius.style.display = 'none';
            if(passiveBarLi) passiveBarLi.style.display = 'none';

            if(p instanceof Li) {
                if(passiveBarLi) {
                    passiveBarLi.style.display = 'block';
                    passiveBarLi.style.width = (p.honorCharges / p.maxHonorCharges) * 100 + '%';
                }
            } else if(p instanceof Cornelius) {
                if(passiveBarCornelius) {
                    if (p.ascended) {
                        passiveBarCornelius.style.display = 'none';
                    } else {
                        passiveBarCornelius.style.display = 'block';
                        passiveBarCornelius.style.background = '#FFD700';
                        passiveBarCornelius.style.backgroundColor = '#FFD700';
                        passiveBarCornelius.style.width = (p.ascensionBar / p.maxAscensionBar) * 100 + '%';
                    }
                }
            } else if(p instanceof Lav) {
                if(passiveBar) {
                    passiveBar.style.display = 'block';
                    passiveBar.style.width = (p.lovePower / p.maxLovePower) * 100 + '%';
                }
            } else if(p instanceof BountyHunter) {
                if(passiveBar) {
                    passiveBar.style.display = 'block';
                    passiveBar.style.width = (p.killStacks / p.maxKillStacks) * 100 + '%';
                }
            } else {
                // non-passive-bar heroes: nothing shown
            }
            
            let ac=document.getElementById('aliveCounter'); 
            if(ac) {
                if(gameMode === '5v5') {
                    ac.style.display = 'none';
                } else {
                    ac.style.display = 'block';
                    if (gameMode === 'ffa_online') {
                        // Prefer authoritative server value when available; fallback to counting proxies + heroes
                        if (typeof window.latestServerAliveCount === 'number') {
                            ac.innerText = `Alive: ${window.latestServerAliveCount}`;
                        } else {
                            const proxyAlive = entities.filter(e => typeof OnlinePlayerProxy !== 'undefined' && e instanceof OnlinePlayerProxy && !e.dead).length;
                            const heroAlive = entities.filter(isCountedAsHero).length;
                            ac.innerText = `Alive: ${proxyAlive + heroAlive}`;
                        }
                    } else {
                        ac.innerText = `Alive: ${entities.filter(isCountedAsHero).length}`;
                    }
                }
            }
            
            updateMinimap();
            
            // Update leaderboard display if visible
            if(leaderboardVisible) updateLeaderboardDisplay();
            
            // Draw terrified markers and bounty target indicators
            if(CTX) {
                for (let e of entities) {
                    if (e && !e.dead && e.terrifedTimer && e.terrifedTimer > 0) {
                        // Draw scared emoji above terrified entity
                        CTX.save();
                        CTX.font = 'bold 24px Arial';
                        CTX.textAlign = 'center';
                        CTX.fillText('😨', e.x - camera.x, e.y - camera.y - 70);
                        CTX.restore();
                    }
                    
                    // Draw bounty target indicator if this is the player and entity is bounty target
                    if (player && player instanceof BountyHunter && player.bountyTarget === e && !e.dead) {
                        CTX.save();
                        CTX.strokeStyle = '#FFD700';
                        CTX.lineWidth = 3;
                        CTX.beginPath();
                        CTX.arc(e.x - camera.x, e.y - camera.y, e.radius + 30, 0, Math.PI * 2);
                        CTX.stroke();
                        CTX.restore();
                    }
                }
            }
            
            // Draw teammate HUD in squad mode
            if(gameMode === 'squad' && CTX) {
                drawTeammateHUD(CTX);
            }
            
            // Draw 5v5 team score
            if(gameMode === '5v5' && CTX && window.gameState5v5) {
                CTX.fillStyle = '#fff';
                CTX.font = 'bold 24px Arial';
                CTX.textAlign = 'center';
                CTX.fillText(`BLUE: ${gameState5v5.blueScore} | RED: ${gameState5v5.redScore}`, CANVAS.width / 2, 40);
                
                // Display revive countdown if player is reviving
                if(gameState5v5.isReviving && player.dead) {
                    CTX.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    CTX.font = 'bold 48px Arial';
                    CTX.textAlign = 'center';
                    CTX.fillText(`REVIVING IN ${Math.ceil(gameState5v5.reviveTimer)}s`, CANVAS.width / 2, CANVAS.height / 2);
                    
                    // Progress bar
                    let barWidth = 300;
                    let barHeight = 20;
                    let barX = (CANVAS.width - barWidth) / 2;
                    let barY = CANVAS.height / 2 + 50;
                    let progress = (gameState5v5.reviveDuration - gameState5v5.reviveTimer) / gameState5v5.reviveDuration; progress = Math.max(0, Math.min(1, progress));
                    
                    // Background
                    CTX.fillStyle = 'rgba(100, 100, 100, 0.8)';
                    CTX.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Progress fill
                    CTX.fillStyle = '#00ff00';
                    CTX.fillRect(barX, barY, barWidth * progress, barHeight);
                    
                    // Border
                    CTX.strokeStyle = '#fff';
                    CTX.lineWidth = 2;
                    CTX.strokeRect(barX, barY, barWidth, barHeight);
                } else if(player.dead) {
                    // Player is dead - waiting to revive
                    CTX.fillStyle = 'rgba(255, 255, 255, 0.9)';
                    CTX.font = 'bold 48px Arial';
                    CTX.textAlign = 'center';
                    CTX.fillText(`YOU ARE DEAD`, CANVAS.width / 2, CANVAS.height / 2);
                }
            }

            // Training Mode Display
            if(gameMode === 'training' && window.trainingStats) {
                let statsDisplay = document.getElementById('trainingStatsDisplay');
                if(statsDisplay) {
                    statsDisplay.style.display = 'block';
                    let elapsed = window.trainingStats.startTime ? Math.floor((Date.now() - window.trainingStats.startTime) / 1000) : 0;
                    let totalDamage = Math.ceil(window.trainingStats.totalDamage);
                    let dps = elapsed > 0 ? (totalDamage / elapsed).toFixed(1) : 0;
                    let modeDisplay = trainingDummyMode === 'practice' ? 'PRACTICE' : '1v1';
                    
                    document.getElementById('trainingMode').innerText = `MODE: ${modeDisplay}`;
                    document.getElementById('trainingDamage').innerText = `DAMAGE: ${totalDamage}`;
                    document.getElementById('trainingDPS').innerText = `DPS: ${dps}`;
                    document.getElementById('trainingTime').innerText = `TIME: ${elapsed}s`;
                }
            } else {
                let statsDisplay = document.getElementById('trainingStatsDisplay');
                if(statsDisplay) statsDisplay.style.display = 'none';
            }
            
            // Also draw on canvas for backup
            if(gameMode === 'training' && CTX && window.trainingStats) {
                CTX.fillStyle = '#fff';
                CTX.font = 'bold 24px Arial';
                CTX.textAlign = 'left';
                let elapsed = window.trainingStats.startTime ? Math.floor((Date.now() - window.trainingStats.startTime) / 1000) : 0;
                let totalDamage = Math.ceil(window.trainingStats.totalDamage);
                let dps = elapsed > 0 ? (totalDamage / elapsed).toFixed(1) : 0;
                
                // Display mode
                let modeDisplay = trainingDummyMode === 'practice' ? 'PRACTICE' : '1v1';
                CTX.fillText(`MODE: ${modeDisplay}`, 20, 20);
                CTX.fillText(`DAMAGE: ${totalDamage}`, 20, 50);
                CTX.fillText(`DPS: ${dps}`, 20, 80);
                CTX.fillText(`TIME: ${elapsed}s`, 20, 110);
            }
        }

        function updateMinimap(){
            if(!MINIMAP_CTX || !player) return;
            MINIMAP_CTX.fillStyle='#000';MINIMAP_CTX.fillRect(0,0,150,150);
            let s=150/WORLD_SIZE;
            
            // Draw Safe Zone on Minimap (only if radius positive)
            if (safeZoneRadius > 0) {
                MINIMAP_CTX.beginPath();
                MINIMAP_CTX.arc((WORLD_SIZE/2)*s, (WORLD_SIZE/2)*s, safeZoneRadius*s, 0, Math.PI*2);
                MINIMAP_CTX.strokeStyle = '#0f0';
                MINIMAP_CTX.stroke();
            }

            if(gameMode !== '1v1' && gameMode !== 'duel_online'){
                MINIMAP_CTX.fillStyle='#1b5e20';bushes.forEach(b=>{MINIMAP_CTX.beginPath();MINIMAP_CTX.arc(b.x*s,b.y*s,b.radius*s,0,Math.PI*2);MINIMAP_CTX.fill();});
            }
            
            entities.forEach(e=>{
                if(!(e instanceof Entity)) return;
                if(e instanceof Sentry || e instanceof Tripmine || e instanceof EnergyBall || e instanceof InkPen) return; // Don't show deployables on minimap
                if(e.dead||(typeof e.isVisibleTo==='function'&&!e.isVisibleTo(player)))return;
                
                if(e instanceof Wither){ 
                    MINIMAP_CTX.fillStyle='#0000FF'; 
                    MINIMAP_CTX.beginPath(); 
                    MINIMAP_CTX.arc(e.x*s,e.y*s,3,0,Math.PI*2); 
                    MINIMAP_CTX.fill(); 
                }
                else if(e instanceof FallenStatue){ 
                    MINIMAP_CTX.fillStyle='#4a2a6a'; 
                    MINIMAP_CTX.beginPath(); 
                    MINIMAP_CTX.arc(e.x*s,e.y*s,3,0,Math.PI*2); 
                    MINIMAP_CTX.fill(); 
                }
                else {
                    // Minimap colors based on game mode and entity type
                    if (e instanceof OnlinePlayerProxy) {
                        // online proxy: use hero color if known
                        MINIMAP_CTX.fillStyle = getHeroColor(e.heroType);
                    } else if(e.isPlayer) {
                        MINIMAP_CTX.fillStyle='#0f0'; // Player is green
                    } else if(gameMode === 'squad' && e.team === player.team) {
                        MINIMAP_CTX.fillStyle='#0f0'; // Teammates are green in squad
                    } else if(gameMode === '5v5') {
                        // 5v5: Blue team vs Red team
                        if(e.team === 1) MINIMAP_CTX.fillStyle='#00bfff'; // Blue team
                        else MINIMAP_CTX.fillStyle='#ff6b6b'; // Red team
                    } else if(gameMode === 'ffa_online' || gameMode === 'duel_online') {
                        // Online games: show opponents as hero colors
                        MINIMAP_CTX.fillStyle = getHeroColor(e.heroType);
                    } else {
                        MINIMAP_CTX.fillStyle='#f00'; // All enemies are red in FFA/Squad
                    }
                    
                    MINIMAP_CTX.beginPath();
                    MINIMAP_CTX.arc(e.x*s,e.y*s,e.isPlayer?3:2,0,Math.PI*2);
                    MINIMAP_CTX.fill();
                }
            });
            
            // Draw online players on minimap (for ffa_online mode)
            if((gameMode === 'ffa_online' || gameMode === 'duel_online') && window.onlinePlayers) {
                for(let socketId in window.onlinePlayers) {
                    // If a proxy entity exists for this socket, the proxy will be drawn by entities loop
                    if (entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === socketId)) continue;
                    let otherPlayer = window.onlinePlayers[socketId];
                    if(otherPlayer && otherPlayer.x && otherPlayer.y) {
                        let color = '#f00';
                        if(otherPlayer.heroType) {
                            color = getHeroColor(otherPlayer.heroType);
                        }
                        MINIMAP_CTX.fillStyle=color;
                        MINIMAP_CTX.beginPath();
                        MINIMAP_CTX.arc(otherPlayer.x*s, otherPlayer.y*s, 3, 0, Math.PI*2);
                        MINIMAP_CTX.fill();
                        console.log(`📍 Minimap: Drew player at (${otherPlayer.x}, ${otherPlayer.y}) with color ${color}`);
                    }
                }
            }

            // Draw Fletcher radar ping on minimap (if active)
            if (player && player.abilityVisuals && player.abilityVisuals.fletcher && player.abilityVisuals.fletcher.radarPing) {
                const rp = player.abilityVisuals.fletcher.radarPing;
                const prog = Math.max(0, 1 - (rp.timer || 1));
                MINIMAP_CTX.strokeStyle = `rgba(0,255,204,${0.6 * (rp.timer || 1)})`;
                MINIMAP_CTX.lineWidth = 2;
                MINIMAP_CTX.beginPath();
                MINIMAP_CTX.arc(rp.x * s, rp.y * s, rp.radius * s * prog, 0, Math.PI * 2);
                MINIMAP_CTX.stroke();

                // blips inside radar
                for (let e of entities) {
                    if (!(e instanceof Entity) || e.dead) continue;
                    const d = Math.sqrt((e.x - rp.x) ** 2 + (e.y - rp.y) ** 2);
                    if (d <= rp.radius) {
                        MINIMAP_CTX.fillStyle = 'rgba(0,255,204,0.9)';
                        MINIMAP_CTX.beginPath();
                        MINIMAP_CTX.arc(e.x * s, e.y * s, 2, 0, Math.PI * 2);
                        MINIMAP_CTX.fill();
                    }
                }
            }
            
            MINIMAP_CTX.strokeStyle='#fff';MINIMAP_CTX.lineWidth=1;MINIMAP_CTX.strokeRect(camera.x*s, camera.y*s, (CANVAS.width / (camera.zoom || 1)) * s, (CANVAS.height / (camera.zoom || 1)) * s);
        }

        function drawTeammateHUD(ctx) {
            // Only show in squad mode
            if(gameMode !== 'squad' || !player) return;
            
            // Find all alive teammates (excluding player)
            let teammates = [];
            for(let e of entities) {
                if(e instanceof Entity && e.team === player.team && e !== player && !e.dead) {
                    teammates.push(e);
                }
            }
            
            if(teammates.length === 0) return;
            
            // Draw teammate status bars at top left
            let startY = 20;
            let boxWidth = 180;
            let boxHeight = 35;
            let spacing = 40;
            
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.textAlign = 'left';
            
            for(let i = 0; i < teammates.length && i < 2; i++) {
                let t = teammates[i];
                let y = startY + (i * spacing);
                
                // Background box
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(10, y, boxWidth, boxHeight);
                
                // Border
                ctx.strokeStyle = '#0f0';
                ctx.lineWidth = 2;
                ctx.strokeRect(10, y, boxWidth, boxHeight);
                
                // Teammate name
                ctx.fillStyle = '#0f0';
                ctx.fillText(t.name || 'Teammate ' + (i+1), 15, y + 15);
                
                // Health bar
                let hpPercent = Math.max(0, t.hp / t.maxHp);
                ctx.fillStyle = hpPercent > 0.5 ? '#0f0' : hpPercent > 0.25 ? '#ff0' : '#f00';
                ctx.fillRect(15, y + 18, (boxWidth - 25) * hpPercent, 8);
                
                // Health bar outline
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.strokeRect(15, y + 18, boxWidth - 25, 8);
                
                // Health text
                ctx.fillStyle = '#fff';
                ctx.font = '10px Arial';
                ctx.fillText(`${Math.ceil(t.hp)}/${t.maxHp}`, 18, y + 32);
            }
        }
        
        function loop(timestamp) {
            requestAnimationFrame(loop);
            let dt=(timestamp-lastTime)/1000; lastTime=timestamp;
            
            // Always render, but only update game state if gameRunning
            if(!gameRunning) {
                // Render the final frame for post-game screen but skip all updates
                if(CTX){
                    const viewW = CANVAS.width / (camera.zoom || 1);
                    const viewH = CANVAS.height / (camera.zoom || 1);
                    CTX.save();
                    CTX.scale(camera.zoom || 1, camera.zoom || 1);
                    CTX.fillStyle='#1a1a1a';CTX.fillRect(0,0,viewW,viewH);
                    CTX.strokeStyle='#222';CTX.lineWidth=1;
                    let gs=100,sx=Math.floor(camera.x/gs)*gs,sy=Math.floor(camera.y/gs)*gs;
                    const viewW_local = CANVAS.width / (camera.zoom || 1);
                    const viewH_local = CANVAS.height / (camera.zoom || 1);
                    CTX.beginPath();for(let x=sx;x<camera.x+viewW_local+gs;x+=gs){CTX.moveTo(x-camera.x,0);CTX.lineTo(x-camera.x,viewH_local);}for(let y=sy;y<camera.y+viewH_local+gs;y+=gs){CTX.moveTo(0,y-camera.y);CTX.lineTo(viewW_local,y-camera.y);}CTX.stroke();
                    bushes.forEach(b=>b.draw(CTX));
                    CTX.strokeStyle='#f00';CTX.lineWidth=5;CTX.strokeRect(-camera.x,-camera.y,WORLD_SIZE,WORLD_SIZE);
                    // outline skins blue/red in 5v5 online
                    if(gameMode === '5v5_online') {
                        entities.forEach(e => {
                            if(e && e.skinIcon && e.skinIcon.complete) {
                                let col = (e.team === 1) ? '#00bfff' : '#ff6b6b';
                                CTX.save();
                                CTX.strokeStyle = col;
                                CTX.lineWidth = 4;
                                CTX.beginPath();
                                CTX.arc(e.x - camera.x, e.y - camera.y, (e.radius||20)+4, 0, Math.PI*2);
                                CTX.stroke();
                                CTX.restore();
                            }
                        });
                    }
                    entities.sort((a,b)=>((a instanceof HealthCube)?-9999:(a.y||0))-((b instanceof HealthCube)?-9999:(b.y||0)));
                    entities.forEach(e=>{if(e.x>=camera.x-100&&e.x<=camera.x+viewW_local+100&&e.y>=camera.y-100&&e.y<=camera.y+viewH_local+100)e.draw(CTX);});
                    if (player instanceof Cyrus && player.droneActive && player.drone) player.drawDroneRing(CTX);

                    // Draw Apollo sun-mark emoji on marked enemies (global rendering)
                    for (let e of entities) {
                        if (!e.dead && e.apolloFireTimer && e.apolloFireTimer > 0) {
                            CTX.font = '26px Arial';
                            CTX.textAlign = 'center';
                            let screenX = e.x - camera.x;
                            let screenY = e.y - camera.y - 30;
                            CTX.fillText('☀️', screenX, screenY);
                        }
                    }

                    // Draw minimap if enabled
                    if(document.getElementById('minimapCanvas')) updateMinimap();
                }
                return;
            }
            try {
                // Training mode safety: ensure dummy exists
                if(gameMode === 'training') {
                    // Check if dummy is missing or dead - need to recreate
                    let dummyMissing = !trainingDummy || trainingDummy.dead || !entities.includes(trainingDummy);
                    
                    if(dummyMissing) {
                        // Recreate based on current mode
                        trainingDummy = createTrainingDummy(trainingDummyMode);
                        if(trainingDummy && !entities.includes(trainingDummy)) {
                            entities.push(trainingDummy);
                        }
                    }
                }
                
                // Health cubes only spawn in offline BR modes (no 1v1 or online matches or training)
                if(gameMode !== '1v1' && gameMode !== 'duel_online' && gameMode !== 'training' && !gameMode.includes('online')) {
                    cubeSpawnTimer += dt;
                    if(cubeSpawnTimer > 5) {
                        cubeSpawnTimer = 0;
                        entities.push(new HealthCube(Math.random() * WORLD_SIZE, Math.random() * WORLD_SIZE));
                    }
                }
                let mk=-1;currentMVP=null;for(let e of entities)if(e instanceof Entity&&!e.dead&&e.kills>mk&&e.kills>0){mk=e.kills;currentMVP=e;}
                
                // Handle 5v5 revive system
                if(gameMode === '5v5' && window.gameState5v5) {
                    // Revive logic for player and teammates (supports a revive queue)
                    if(gameState5v5.isReviving) {
                        gameState5v5.reviveTimer -= dt;
                        if(gameState5v5.reviveTimer <= 0) {
                            // Complete current revive
                            if(gameState5v5.revivedEntity && gameState5v5.revivedEntity.dead) {
                                gameState5v5.revivedEntity.dead = false;
                                gameState5v5.revivedEntity.hp = gameState5v5.revivedEntity.maxHp;
                                gameState5v5.revivedEntity.x = gameState5v5.reviveSpawnX;
                                gameState5v5.revivedEntity.y = gameState5v5.reviveSpawnY;
                            }

                            // If there are more queued revives, start the next one
                            if(gameState5v5.reviveQueue && gameState5v5.reviveQueue.length > 0) {
                                let next = gameState5v5.reviveQueue.shift();
                                if(next) {
                                    gameState5v5.revivedEntity = next;
                                    gameState5v5.reviveSpawnX = next.team === 1 ? 800 : 4200;
                                    gameState5v5.reviveSpawnY = 2500;
                                    gameState5v5.reviveTimer = gameState5v5.reviveDuration;
                                    gameState5v5.isReviving = true;
                                } else {
                                    gameState5v5.isReviving = false;
                                    gameState5v5.reviveTimer = 0;
                                    gameState5v5.revivedEntity = null;
                                }
                            } else {
                                gameState5v5.isReviving = false;
                                gameState5v5.reviveTimer = 0;
                                gameState5v5.revivedEntity = null;
                            }
                        }
                    }
                }
                
                // Check if Fallen Statue should spawn (less than 10 players remaining and no statue exists) - NOT in 5v5, training, online FFA, or any 1v1 mode
                if(gameMode !== '5v5' && gameMode !== 'training' && gameMode !== 'ffa_online' && gameMode !== 'duel_online' && gameMode !== '1v1') {
                    let alivePlayerCount = entities.filter(isCountedAsHero).length;
                    let statueExists = entities.some(e => e instanceof FallenStatue && !e.dead);
                    if(alivePlayerCount < 10 && !statueExists && !window.fallenStatueSpawned) {
                        let statue = new FallenStatue(WORLD_SIZE/2, WORLD_SIZE/2);
                        entities.push(statue);
                        window.fallenStatueSpawned = true;
                        addKillMsg('FALLEN STATUE APPEARED!');
                    }
                }
                
                // Update Dayum bombs
                if(window.dayumBombs) {
                    window.dayumBombs = window.dayumBombs.filter(b => {
                        b.update(dt);
                        if(b.shouldExplode || b.dist >= b.maxDist) {
                            b.explode();
                            return false;
                        }
                        return true;
                    });
                }
                entities=entities.filter(e=>{if((e instanceof Projectile || e instanceof WindProjectile)&&e.del)return false;if(e instanceof HealthCube&&e.del)return false;if(e instanceof EnergyBall&&e.del)return false;if(e instanceof InkPen&&e.del)return false;if(e instanceof Blackhole&&e.del)return false;if((e instanceof DefenseTower||e instanceof MainTower)&&e.dead)return false;return true;});
                
                // Create actual Projectile objects from remote entity broadcasts for collision detection
                if(gameMode === 'ffa_online' && window.onlineEntities) {
                    window.remoteProjectiles = window.remoteProjectiles || {};
                    for(let socketId in window.onlineEntities) {
                        let entitiesData = window.onlineEntities[socketId];
                        if(!Array.isArray(entitiesData)) continue;
                        
                        let socketProjects = window.remoteProjectiles[socketId] = window.remoteProjectiles[socketId] || [];
                        
                        for(let entityData of entitiesData) {
                            if(!entityData || entityData.type !== 'projectile') continue;
                            
                            // Check if this projectile already exists in our list
                            let existingProj = socketProjects.find(p => p.remoteId === entityData.remoteId || (p.x === entityData.x && p.y === entityData.y && Math.abs(p.dist - (entityData.distTraveled || 0)) < 5));
                            
                            if(!existingProj) {
                                // Find the owner proxy
                                let ownerProxy = entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === socketId);
                                if(!ownerProxy) continue;
                                
                                // Create a proxy projectile that doesn't broadcast (to avoid loops)
                                let projOwner = { team: ownerProxy.team, name: ownerProxy.name, isPlayer: true, dmgMult: 1 };
                                let proj = new Projectile(
                                    projOwner,
                                    entityData.x, entityData.y,
                                    entityData.angle,
                                    entityData.speed,
                                    entityData.damage,
                                    entityData.range,
                                    entityData.color,
                                    entityData.size,
                                    false, entityData.pierce, entityData.explode
                                );
                                proj.remoteId = `${socketId}-${entityData.x}-${entityData.y}`;
                                proj.isRemote = true; // Mark as remote so we don't broadcast it again
                                // Safely handle damage broadcast on hit
                                proj.originalTakeDamage = proj.owner.takeDamage;
                                entities.push(proj);
                                socketProjects.push(proj);
                            }
                        }
                        
                        // Clean up old projectiles
                        window.remoteProjectiles[socketId] = socketProjects.filter(p => !p.del);
                    }
                }
                // don't shrink safe zone in modes where it shouldn't exist
                if(gameMode !== '5v5' && gameMode !== 'training' && gameMode !== 'ffa_online' && gameMode !== '1v1' && gameMode !== 'duel_online') {
                    safeZoneRadius -= safeZoneShrinkRate * dt;
                    if(safeZoneRadius < minSafeZone) safeZoneRadius = minSafeZone;
                }

                entities.forEach(e=>{
                    try {
                        if (e && typeof e.update === 'function') e.update(dt);
                    } catch (err) {
                        try {
                            console.error('Entity.update threw for entity:', e && (e.constructor ? e.constructor.name : typeof e), 'isPlayer:', e && e.isPlayer, 'error:', err);
                            console.error(err && err.stack ? err.stack : String(err));
                        } catch(_){}
                        // Continue; avoid crashing the whole loop for one bad entity
                    }
                    // If entity is Ming and has a mirror, update mirror (mirror is lightweight object)
                    try { if(e instanceof Ming && e.mirror) e.mirror.update(dt); } catch(_){ }
                    if(e instanceof Entity && !e.dead) {
                        let distToCenter = Math.sqrt((e.x - WORLD_SIZE/2)**2 + (e.y - WORLD_SIZE/2)**2);
                        // Entities inside JusticeRealm are immune to safe-zone damage
                        if((gameMode !== '1v1' && gameMode !== 'duel_online' && !gameMode.includes('online')) && distToCenter > safeZoneRadius && !(e.inRealm && e.realm && e.realm.type === 'justice')) {
                            e.takeDamage(e.maxHp * 0.20 * dt, null); // 20% max HP dmg
                        }
                    }
                });

                checkHeroInteractions();

                // Remove entities marked for deletion
                for(let i=entities.length-1;i>=0;i--){if(entities[i] && entities[i].del)entities.splice(i,1);}
                for(let i=particles.length-1;i>=0;i--){try{particles[i].update(dt);}catch(err){console.error('particle.update error',err);}if(particles[i].life<=0)particles.splice(i,1);}
                // Update visual effects (beams, waves, blasts)
                for(let i=visualEffects.length-1;i>=0;i--){try{visualEffects[i].update(dt);}catch(err){console.error('visualEffect.update error',err);}if(visualEffects[i].del)visualEffects.splice(i,1);}
                // Keep failed or unusually spammy effects from retaining memory forever.
                if (visualEffects.length > 600) visualEffects.splice(0, visualEffects.length - 600);
                // Update projectiles (Trent's F ability)
                if(window.projectiles) {
                    for(let i=window.projectiles.length-1;i>=0;i--){try{window.projectiles[i].update(dt);}catch(err){console.error('projectile.update error',err);}if(window.projectiles[i].del)window.projectiles.splice(i,1);}
                    if (window.projectiles.length > 400) window.projectiles.splice(0, window.projectiles.length - 400);
                }
                // Update world zones (Twins zone damage)
                if(window.worldZones) {
                    for(let i=window.worldZones.length-1;i>=0;i--){
                        try{window.worldZones[i].update(dt);}catch(err){console.error('worldZone.update error',err);}
                        if(window.worldZones[i].duration <= 0) window.worldZones.splice(i,1);
                    }
                    if (window.worldZones.length > 100) window.worldZones.splice(0, window.worldZones.length - 100);
                }
                if (Array.isArray(ringEffects)) {
                    ringEffects = ringEffects.filter(r => r && r.life > 0);
                    if (ringEffects.length > 400) ringEffects.splice(0, ringEffects.length - 400);
                }
                // Update visuals via the centralized manager
                try{ if(_visuals && typeof _visuals.update === 'function') _visuals.update(dt); } catch(err){ console.error('VisualsManager.update error', err); }
                // Prevent runaway particle count which can freeze the browser (lower limit for mobile)
                let maxParticles = (navigator.maxTouchPoints > 0 || window.innerWidth < 768) ? 400 : 1200;
                if(particles.length > maxParticles) particles.length = maxParticles;
                if (player && !player.dead) {
                    let cameraTarget = player;
                    if (player instanceof Cyrus && player.droneActive && player.drone) {
                        cameraTarget = player.drone;
                    }
                    let tx = cameraTarget.x - (CANVAS.width / (camera.zoom || 1)) / 2, ty = cameraTarget.y - (CANVAS.height / (camera.zoom || 1)) / 2;
                    // Default viewport scale (camera.zoom is applied to canvas drawing)
                    // restored baseline so default visuals match pre-change appearance
                    let zoomScale = (player instanceof Cyrus && player.droneActive) ? 1.15 : 1.0;

                    const droneOverlay = document.getElementById('droneViewOverlay');
                    if (droneOverlay) {
                        if (player instanceof Cyrus && player.droneActive && player.drone) {
                            droneOverlay.style.display = 'block';
                            droneOverlay.style.opacity = '1';
                        } else {
                            droneOverlay.style.display = 'none';
                            droneOverlay.style.opacity = '0';
                        }
                    }

                    if ((player.cameraZoomTimer && player.cameraZoomTimer > 0) || (player instanceof Fletcher && player.eCharging)) {
                        // If Fletcher is holding E treat as a persistent zoom; otherwise use cameraZoomTimer progress
                        const progress = (player instanceof Fletcher && player.eCharging) ? 1 : (0.8 - player.cameraZoomTimer) / 0.8;

                        if (player instanceof Fletcher) {
                            // Fletcher: mild FOV change (kept subtle so player/characters don't look tiny)
                            // reduced intensity: baseline 1.0 -> ~0.85 at max
                            zoomScale = 1.0 - (0.15 * progress); // 1.0 -> ~0.85 (slightly wider)
                            camera.zoom = zoomScale;

                            const viewW = CANVAS.width / camera.zoom;
                            const viewH = CANVAS.height / camera.zoom;

                            // Anchor player to center immediately (no smoothing) so it feels like FOV change
                            camera.x = Math.max(0, Math.min(WORLD_SIZE - viewW, player.x - viewW / 2));
                            camera.y = Math.max(0, Math.min(WORLD_SIZE - viewH, player.y - viewH / 2));
                        } else {
                            // Default: mild zoom-in for ability windups (kept proportional to baseline)
                            zoomScale = 1.0 + (0.25 * progress);
                            let faceDir = (player.facingDirection !== undefined) ? player.facingDirection : 1;
                            let zoomOffsetX = (CANVAS.width / zoomScale / 2) * 0.4 * faceDir;
                            tx = cameraTarget.x - (CANVAS.width / zoomScale) / 2 + zoomOffsetX;
                            ty = cameraTarget.y - (CANVAS.height / zoomScale) / 2;

                            camera.zoom = zoomScale;
                            const viewW = CANVAS.width / camera.zoom;
                            const viewH = CANVAS.height / camera.zoom;

                            camera.x += (tx - camera.x) * 0.1;
                            camera.y += (ty - camera.y) * 0.1;

                            camera.x = Math.max(0, Math.min(WORLD_SIZE - viewW, camera.x));
                            camera.y = Math.max(0, Math.min(WORLD_SIZE - viewH, camera.y));
                        }
                    } else {
                        // No temporary zoom — normal centered smoothing
                        camera.zoom = zoomScale;
                        const viewW = CANVAS.width / camera.zoom;
                        const viewH = CANVAS.height / camera.zoom;
                        camera.x += (tx - camera.x) * 0.1;
                        camera.y += (ty - camera.y) * 0.1;
                        camera.x = Math.max(0, Math.min(WORLD_SIZE - viewW, camera.x));
                        camera.y = Math.max(0, Math.min(WORLD_SIZE - viewH, camera.y));
                    }

                    // Apply screen shake after positioning
                    let sx = 0, sy = 0;
                    if (shakeIntensity > 0) { sx = (Math.random() - 0.5) * shakeIntensity; sy = (Math.random() - 0.5) * shakeIntensity; shakeIntensity *= 0.9; if (shakeIntensity < 0.5) shakeIntensity = 0; }
                    camera.x += sx; camera.y += sy;

                    // Screen Red Tint if outside zone
                    let distToCenter = Math.sqrt((player.x - WORLD_SIZE/2)**2 + (player.y - WORLD_SIZE/2)**2);
                    let warning = document.getElementById('safeZoneWarning');
                    if((distToCenter > safeZoneRadius) && !gameMode.includes('online') && gameMode !== '1v1' && gameMode !== 'duel_online') warning.style.display = 'block';
                    else warning.style.display = 'none';
                }

                if(CTX){
                    // World render: apply camera FOV scaling so player remains centered when zooming
                    const viewW = CANVAS.width / (camera.zoom || 1);
                    const viewH = CANVAS.height / (camera.zoom || 1);
                    CTX.save();
                    CTX.scale(camera.zoom || 1, camera.zoom || 1);

                    CTX.fillStyle = '#1a1a1a';
                    CTX.fillRect(0, 0, viewW, viewH);

                    CTX.strokeStyle = '#222';CTX.lineWidth = 1;
                    let gs = 100, sx = Math.floor(camera.x / gs) * gs, sy = Math.floor(camera.y / gs) * gs;
                    CTX.beginPath();
                    for (let x = sx; x < camera.x + viewW + gs; x += gs) { CTX.moveTo(x - camera.x, 0); CTX.lineTo(x - camera.x, viewH); }
                    for (let y = sy; y < camera.y + viewH + gs; y += gs) { CTX.moveTo(0, y - camera.y); CTX.lineTo(viewW, y - camera.y); }
                    CTX.stroke();

                    bushes.forEach(b => b.draw(CTX));
                    
                    // Draw Dayum bombs
                    if(window.dayumBombs) {
                        for(let bomb of window.dayumBombs) {
                            bomb.draw(CTX, camera.x, camera.y);
                        }
                    }
                    
                    // Draw Safe Zone
                    CTX.strokeStyle = '#0f0'; CTX.lineWidth = 5;
                    CTX.beginPath(); 
                    CTX.arc(WORLD_SIZE/2 - camera.x, WORLD_SIZE/2 - camera.y, safeZoneRadius, 0, Math.PI*2);
                    CTX.stroke();

                    CTX.strokeStyle='#f00';CTX.lineWidth=5;CTX.strokeRect(-camera.x,-camera.y,WORLD_SIZE,WORLD_SIZE);
                    entities.sort((a,b)=>((a instanceof HealthCube)?-9999:(a.y||0))-((b instanceof HealthCube)?-9999:(b.y||0)));
                    entities.forEach(e=>{if(e.x>=camera.x-100&&e.x<=camera.x+viewW+100&&e.y>=camera.y-100&&e.y<=camera.y+viewH+100)e.draw(CTX);});
                    if (player instanceof Cyrus && player.droneActive && player.drone) player.drawDroneRing(CTX);

                    // Draw world zones (Twins zone visuals)
                    if(window.worldZones) {
                        for(let zone of window.worldZones){
                            try{ if(typeof zone.draw === 'function') zone.draw(CTX); }catch(err){console.error('worldZone.draw error',err);}
                        }
                    }

                    // Draw Apollo sun-mark emoji on marked enemies (in-play rendering)
                    for (let e of entities) {
                        if (!e.dead && e.apolloFireTimer && e.apolloFireTimer > 0) {
                            CTX.font = '26px Arial';
                            CTX.textAlign = 'center';
                            let screenX = e.x - camera.x;
                            let screenY = e.y - camera.y - 30;
                            CTX.fillText('☀️', screenX, screenY);
                        }
                    }
                    
                    // Draw other online players
                    if(window.onlinePlayers && gameMode === 'ffa_online') {
                        let onlinePlayerCount = Object.keys(window.onlinePlayers).length;
                        // Only throttle this log, don't spam
                        if(onlinePlayerCount > 0 && Math.random() < 0.01) { // Log 1% of frames
                            console.log(`🎨 Drawing ${onlinePlayerCount} online players on canvas`);
                        }
                        
                        for(let socketId in window.onlinePlayers) {
                            let otherPlayer = window.onlinePlayers[socketId];
                            // If we already have a proxy entity for this socket, skip drawing here to avoid duplicates
                            if (entities.find(e => e instanceof OnlinePlayerProxy && e.socketId === socketId)) continue;
                            if(!otherPlayer || !otherPlayer.x || !otherPlayer.y) continue;
                            
                            let screenX = otherPlayer.x - camera.x;
                            let screenY = otherPlayer.y - camera.y;
                            
                            // Only draw if visible
                            if (otherPlayer.x >= camera.x - 100 && otherPlayer.x <= camera.x + (CANVAS.width / (camera.zoom || 1)) + 100 && 
                                otherPlayer.y >= camera.y - 100 && otherPlayer.y <= camera.y + (CANVAS.height / (camera.zoom || 1)) + 100) {
                                // Draw player circle
                                CTX.fillStyle = '#00bcd4';
                                CTX.beginPath();
                                CTX.arc(screenX, screenY, 25, 0, Math.PI * 2);
                                CTX.fill();
                                
                                // Draw player name
                                CTX.fillStyle = '#fff';
                                CTX.font = 'bold 12px Arial';
                                CTX.textAlign = 'center';
                                CTX.fillText(otherPlayer.name || 'Player', screenX, screenY - 35);
                                
                                // Draw health bar
                                let hpPercent = otherPlayer.hp / otherPlayer.maxHp;
                                CTX.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
                                CTX.fillRect(screenX - 25, screenY + 30, 50 * hpPercent, 4);
                                
                                // Health bar outline
                                CTX.strokeStyle = '#fff';
                                CTX.lineWidth = 1;
                                CTX.strokeRect(screenX - 25, screenY + 30, 50, 4);
                                
                            }
                        }
                    }
                    
                    // Draw entities from other online players (projectiles, sentries, tripmines)
                    if(window.onlineEntities && gameMode === 'ffa_online') {
                        
                        for(let socketId in window.onlineEntities) {
                            let entitiesData = window.onlineEntities[socketId];
                            if(!Array.isArray(entitiesData)) {
                                console.warn(`⚠️ Entities for ${socketId} is not an array:`, entitiesData);
                                continue;
                            }
                            
                            for(let entityData of entitiesData) {
                                if(!entityData || !entityData.type) continue;
                                
                                let screenX = entityData.x - camera.x;
                                let screenY = entityData.y - camera.y;
                                
                                // Only draw if visible in world coordinates against the zoomed view
                                if (entityData.x < camera.x - 100 || entityData.x > camera.x + (CANVAS.width / (camera.zoom || 1)) + 100 || 
                                    entityData.y < camera.y - 100 || entityData.y > camera.y + (CANVAS.height / (camera.zoom || 1)) + 100) continue;
                                
                                try {
                                    if(entityData.type === 'projectile') {
                                        // Draw projectile
                                        CTX.save();
                                        CTX.translate(screenX, screenY);
                                        CTX.rotate(entityData.angle);
                                        
                                        CTX.fillStyle = entityData.color || '#ffff00';
                                        CTX.beginPath();
                                        CTX.arc(0, 0, entityData.size || 4, 0, Math.PI * 2);
                                        CTX.fill();
                                        
                                        // Draw projectile trail
                                        CTX.strokeStyle = entityData.color || '#ffff00';
                                        CTX.lineWidth = 2;
                                        CTX.beginPath();
                                        CTX.moveTo(0, 0);
                                        CTX.lineTo(-10, 0);
                                        CTX.stroke();
                                        
                                        CTX.restore();
                                    }
                                    else if(entityData.type === 'sentry') {
                                        // Draw sentry (turret)
                                        // Use different color based on team
                                        let sentryColor = entityData.team === 1 ? '#FF6B6B' : '#4CAF50';
                                        
                                        // Draw main body
                                        CTX.fillStyle = sentryColor;
                                        CTX.beginPath();
                                        CTX.rect(screenX - 10, screenY - 10, 20, 20);
                                        CTX.fill();
                                        
                                        // Draw detection turret
                                        CTX.fillStyle = '#f39c12';
                                        CTX.beginPath();
                                        CTX.arc(screenX, screenY - 5, 8, 0, Math.PI * 2);
                                        CTX.fill();
                                        
                                        // Sentry barrel pointing at angle
                                        if(entityData.targetAngle !== undefined) {
                                            CTX.save();
                                            CTX.translate(screenX, screenY);
                                            CTX.rotate(entityData.targetAngle);
                                            CTX.fillStyle = '#333';
                                            CTX.fillRect(0, -3, 20, 6);
                                            CTX.restore();
                                        }
                                        
                                        // HP bar
                                        let hpPercent = entityData.hp / entityData.maxHp;
                                        CTX.fillStyle = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
                                        CTX.fillRect(screenX - 15, screenY + 15, 30 * hpPercent, 4);
                                        CTX.strokeStyle = '#fff';
                                        CTX.lineWidth = 1;
                                        CTX.strokeRect(screenX - 15, screenY + 15, 30, 4);
                                        
                                        // Show build progress if still building
                                        if(!entityData.built) {
                                            CTX.fillStyle = 'rgba(255, 255, 255, 0.5)';
                                            CTX.beginPath();
                                            CTX.rect(screenX - 10, screenY - 10, 20, 20);
                                            CTX.fill();
                                            CTX.fillStyle = '#0f0';
                                            CTX.fillRect(screenX - 15, screenY - 25, 30 * (1 - (entityData.buildTime || 0) / 3), 5);
                                        }
                                    }
                                    else if(entityData.type === 'tripmine') {
                                        // Only draw active tripmines
                                        if(entityData.active !== false) {
                                            // Draw tripmine
                                            CTX.fillStyle = '#FF00FF';
                                            CTX.beginPath();
                                            CTX.arc(screenX, screenY, 8, 0, Math.PI * 2);
                                            CTX.fill();
                                            
                                            // Draw detection radius as dashed circle
                                            CTX.strokeStyle = 'rgba(255, 0, 255, 0.5)';
                                            CTX.lineWidth = 1;
                                            CTX.setLineDash([5, 5]);
                                            CTX.beginPath();
                                            CTX.arc(screenX, screenY, entityData.detectionRange || 100, 0, Math.PI * 2);
                                            CTX.stroke();
                                            CTX.setLineDash([]);
                                        }
                                    }
                                    else if(entityData.type === 'minion') {
                                        // Draw remote minions (pixel bots, goons, etc.)
                                        let color = '#ff4500';
                                        if(entityData.subType && entityData.subType.toLowerCase().includes('pixel')) color = '#9B59B6';
                                        if(entityData.subType && entityData.subType.toLowerCase().includes('goon')) color = '#8B4513';
                                        CTX.fillStyle = color;
                                        CTX.beginPath();
                                        CTX.arc(screenX, screenY, 8, 0, Math.PI * 2);
                                        CTX.fill();
                                        // small HP bar
                                        let hpPct = entityData.maxHp ? (entityData.hp / entityData.maxHp) : 1;
                                        CTX.fillStyle = hpPct > 0.5 ? '#00ff00' : hpPct > 0.25 ? '#ffff00' : '#ff0000';
                                        CTX.fillRect(screenX - 10, screenY + 12, 20 * hpPct, 3);
                                        CTX.strokeStyle = '#fff'; CTX.lineWidth = 1; CTX.strokeRect(screenX - 10, screenY + 12, 20, 3);
                                    }
                                    else if(entityData.type === 'slash') {
                                        // Draw slash attacks from other players
                                        CTX.save();
                                        CTX.translate(screenX, screenY);
                                        CTX.rotate(entityData.angle);
                                        CTX.strokeStyle = entityData.color || '#fff';
                                        CTX.lineWidth = 8;
                                        CTX.lineCap = 'round';
                                        CTX.beginPath();
                                        CTX.moveTo(-entityData.range/2, -entityData.width/2);
                                        CTX.lineTo(entityData.range/2, entityData.width/2);
                                        CTX.stroke();
                                        CTX.restore();
                                    }
                                } catch(err) {
                                    // Silently skip rendering errors
                                }
                            }
                        }
                    }
                    
                    // Draw lightweight mirrors for Ming instances (not part of entities)
                    for(let e of entities){ try { if(e instanceof Ming && e.mirror && !e.mirror.expired) e.mirror.draw(CTX); } catch(_){} }
                    
                    // Update and draw moon shapes (Kenshi's sword energy)
                    moonShapes = moonShapes.filter(m => m.lifetime > 0);
                    for(let m of moonShapes) {
                        m.lifetime -= dt;
                        // Move the moon shape forward
                        m.x += Math.cos(m.angle) * m.speed * dt;
                        m.y += Math.sin(m.angle) * m.speed * dt;
                        
                        // Check collision with enemies - pierce through with one-time damage per enemy
                        for(let e of entities) {
                            if(e instanceof Entity && !e.dead && e.team !== m.team && Math.sqrt((e.x - m.x)**2 + (e.y - m.y)**2) < e.radius + m.radius) {
                                // Only hit each enemy once
                                if(!m.hitEnemies.includes(e.id)) {
                                    const source = m.owner || this;
                                    e.takeDamage(m.damage, source);
                                    if(source && typeof source.totalDamage === 'number') source.totalDamage += m.damage;
                                    if(m.stun) e.applyStatus('stun', m.stun, source || this);
                                    m.hitEnemies.push(e.id);
                                    
                                    // Explosion particles
                                    for(let i=0;i<15;i++) {
                                        let angle = Math.random() * Math.PI * 2;
                                        let vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(200);
                                        particles.push(new Particle(m.x, m.y, '#FFD700', 3, 0.5, vel.x, vel.y));
                                    }
                                }
                            }
                        }
                        
                        // Draw moon shape as wide half-circle crescent
                        let screenX = m.x - camera.x;
                        let screenY = m.y - camera.y;
                        
                        // Draw wide half-circle crescent pointing away (like a smile)
                        CTX.save();
                        CTX.translate(screenX, screenY);
                        CTX.rotate(m.angle);
                        CTX.fillStyle = '#FFFFFF';
                        CTX.beginPath();
                        // Outer arc (larger radius for wide appearance)
                        CTX.arc(0, 0, m.radius * 1.5, -Math.PI/3, Math.PI/3, false);
                        // Inner arc (smaller radius to create crescent)
                        CTX.arc(0, 0, m.radius * 0.7, Math.PI/3, -Math.PI/3, true);
                        CTX.closePath();
                        CTX.fill();
                        CTX.restore();
                    }
                    
                    // Draw floating damage texts
                    for (let i = damageTexts.length - 1; i >= 0; i--) {
                        const dtxt = damageTexts[i];
                        dtxt.y -= dt * 40; // float up
                        dtxt.life -= dt;
                        CTX.fillStyle = dtxt.color || '#fff';
                        CTX.font = 'bold 16px Arial';
                        CTX.textAlign = 'center';
                        CTX.fillText(dtxt.text, dtxt.x - camera.x, dtxt.y - camera.y);
                        if (dtxt.life <= 0) damageTexts.splice(i, 1);
                    }

                    // DRAW PARTICLES FIRST (guaranteed visible)
                    const drawParticles = particles.slice(-500);
                    CTX.save();
                    CTX.filter = 'none';
                    CTX.shadowBlur = 0;
                    CTX.shadowColor = 'transparent';
                    CTX.globalAlpha = 1;
                    drawParticles.forEach(p => { try { p.draw(CTX); } catch(err) { console.error('particle.draw error', err, p); } });
                    CTX.restore();
                    
                    // Draw visual effects (beams, waves, blasts)
                    const drawVisualEffects = visualEffects.slice(0, 220);
                    CTX.save();
                    CTX.filter = 'none';
                    CTX.shadowBlur = 0;
                    CTX.shadowColor = 'transparent';
                    CTX.globalAlpha = 1;
                    drawVisualEffects.forEach(v => { try { v.draw(CTX); } catch(err) { console.error('visualEffect.draw error', err, v); } });
                    CTX.restore();
                    // Draw projectiles (Trent's F ability)
                    if(window.projectiles) {
                        const drawProjectiles = window.projectiles.slice(0, 220);
                        CTX.save();
                        CTX.filter = 'none';
                        CTX.shadowBlur = 0;
                        CTX.shadowColor = 'transparent';
                        CTX.globalAlpha = 1;
                        drawProjectiles.forEach(p => { try { p.draw(CTX); } catch(err) { console.error('projectile.draw error', err, p); } });
                        CTX.restore();
                    }
                    
                    // Draw visuals via manager (fancy effects as bonus)
                    try{ if(_visuals && typeof _visuals.draw === 'function') _visuals.draw(CTX); } catch(err){ console.error('VisualsManager.draw error', err); }
                    
                    // Draw ring effects (expanding shockwaves)
                    ringEffects = ringEffects.filter(r => r.life > 0);
                    const drawRingEffects = ringEffects.slice(0, 220);
                    CTX.save();
                    CTX.filter = 'none';
                    CTX.shadowBlur = 0;
                    CTX.shadowColor = 'transparent';
                    CTX.globalAlpha = 1;
                    for (let r of drawRingEffects) {
                        let screenX = r.x - camera.x;
                        let screenY = r.y - camera.y;
                        let progress = 1 - (r.life / r.duration);
                        let currentRadius = r.maxRadius * progress;
                        CTX.save();
                        CTX.globalAlpha = Math.max(0, r.life / r.duration);
                        CTX.strokeStyle = r.color;
                        CTX.lineWidth = Math.max(2, 12 * (1 - progress));
                        CTX.beginPath();
                        CTX.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
                        CTX.stroke();
                        CTX.restore();
                        r.life -= dt;
                    }
                    CTX.restore();
                    
                    // Update and draw racing lines
                    racingLines = racingLines.filter(r => r.duration > 0);
                    for (let r of racingLines) {
                        r.duration -= dt;
                        // Draw racing line
                        if (r.points && r.points.length > 1) {
                            CTX.strokeStyle = '#00FF00';
                            CTX.lineWidth = 8;
                            CTX.globalAlpha = Math.max(0, r.duration / r.maxDuration);
                            CTX.beginPath();
                            CTX.moveTo(r.points[0].x - camera.x, r.points[0].y - camera.y);
                            for (let p of r.points) {
                                CTX.lineTo(p.x - camera.x, p.y - camera.y);
                            }
                            CTX.stroke();
                            CTX.globalAlpha = 1;
                        }
                    }
                    
                    // Draw hologram damage numbers on enemies' heads (only if Buster is player)
                    if (player && player instanceof Buster && player.hologramActive) {
                        for (let e of entities) {
                            if (e !== player && !e.dead && e instanceof Entity && e.team !== player.team) {
                                let screenX = e.x - camera.x;
                                let screenY = e.y - camera.y - e.radius - 30;
                                CTX.fillStyle = '#ffff00';
                                CTX.font = 'bold 14px Arial';
                                CTX.textAlign = 'center';
                                CTX.fillText(`+${Math.floor(player.recordedDamage)}`, screenX, screenY);
                            }
                        }
                    }

                    // restore canvas transform so HUD/UI draws at screen resolution
                    CTX.restore();
                }
            } catch(e){
                console.error('Game loop error:', e);
                try{
                    const msg = (e && e.message) ? e.message : String(e);
                    showGameError('Game error: ' + msg, 5000);
                } catch (_){ }
                // Continue game instead of stopping - this prevents the black screen
                // gameRunning = false;
            }
        }
        
        // MINION CLASS - 5v5 Mode AI minions
        // 5V5 LANE MINION CLASS - Spawned in 5v5 mode
        class LaneMinion extends Entity {
            constructor(x, y, team, laneType) {
                super(x, y, 8, team === 1 ? '#4A90E2' : '#FF6B6B', 100);
                this.team = team;
                this.laneType = laneType; // 'top', 'mid', 'bot'
                this.isPlayer = false;
                this.name = team === 1 ? 'Blue Minion' : 'Red Minion';
                this.baseSpd = 100;
                this.speed = 100;
                this.attackCD = 0;
                this.targetEnemy = null;
                this.countsAsFFAHero = false;
            }
            
            update(dt) {
                if(this.dead) return;
                this.updateCommon(dt);
                if(this.attackCD > 0) this.attackCD -= dt;
                
                // Find closest enemy in range
                let closest = null;
                let closestDist = 200;
                for(let e of entities) {
                    if(e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if(d < closestDist) {
                            closestDist = d;
                            closest = e;
                        }
                    }
                }
                
                // Attack or move toward target
                if(closest) {
                    let d = Math.sqrt((closest.x - this.x)**2 + (closest.y - this.y)**2);
                    if(d < 50 && this.attackCD <= 0) {
                        closest.takeDamage(20, this);
                        this.attackCD = 1;
                    } else {
                        // Move toward enemy
                        this.angle = Math.atan2(closest.y - this.y, closest.x - this.x);
                        this.x += Math.cos(this.angle) * this.speed * dt;
                        this.y += Math.sin(this.angle) * this.speed * dt;
                    }
                } else {
                    // Move down lane toward enemy base
                    let targetX = this.team === 1 ? 4400 : 600;
                    let targetY = this.laneType === 'top' ? 1000 : this.laneType === 'mid' ? 2500 : 4000;
                    
                    this.angle = Math.atan2(targetY - this.y, targetX - this.x);
                    this.x += Math.cos(this.angle) * this.speed * dt;
                    this.y += Math.sin(this.angle) * this.speed * dt;
                }
            }
            
            draw(ctx) {
                ctx.fillStyle = this.team === 1 ? '#4A90E2' : '#FF6B6B';
                ctx.fillRect(this.x - camera.x - 6, this.y - camera.y - 6, 12, 12);
                
                // HP bar
                ctx.fillStyle = '#f00';
                ctx.fillRect(this.x - camera.x - 6, this.y - camera.y - 12, 12, 2);
                ctx.fillStyle = '#0f0';
                ctx.fillRect(this.x - camera.x - 6, this.y - camera.y - 12, (this.hp / this.maxHp) * 12, 2);
            }
        }

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

        class Ambrose extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#2C1B47' : '#1a0d2e', 5400);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Ambrose)" : "Enemy Ambrose";
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.rCD = 0;
                this.baseSpd = 250;
                this.speed = 250;
                
                // Q ability: Dark self teleport
                this.enhancedBasicActive = false;
                this.enhancedBasicTimer = 0;
                
                // F ability: Raven pull
                this.ravensActive = [];
                this.ravenPullActive = false;
                this.ravenPullSpeed = 0;
                this.ravenPullDirection = 0;
                this.ravenPullTimer = 0;
                this.ravenPullTarget = null;
                
                // Toxin marked enemies
                this.markedEnemies = new Map(); // enemy -> timer
                this.toxinTimer = 0;
            }
            
            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);
                if (this.basicCD > 0) this.basicCD -= dt;
                if (this.qCD > 0) this.qCD -= dt;
                if (this.eCD > 0) this.eCD -= dt;
                if (this.fCD > 0) this.fCD -= dt;
                if (this.rCD > 0) this.rCD -= dt;
                
                // Track enhanced basic
                if (this.enhancedBasicActive) {
                    this.enhancedBasicTimer -= dt;
                    if (this.enhancedBasicTimer <= 0) {
                        this.enhancedBasicActive = false;
                    }
                }
                
                // Raven pull movement
                if (this.ravenPullActive) {
                    this.ravenPullTimer -= dt;
                    if (this.ravenPullTimer > 0 && this.ravenPullTarget && !this.ravenPullTarget.dead) {
                        // Recalculate direction toward target every frame
                        let dx = this.ravenPullTarget.x - this.x;
                        let dy = this.ravenPullTarget.y - this.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist > 0) {
                            let dirX = dx / dist;
                            let dirY = dy / dist;
                            this.x += dirX * this.ravenPullSpeed * dt;
                            this.y += dirY * this.ravenPullSpeed * dt;
                        }
                        // Check if reached target
                        if (dist < 50) {
                            this.ravenPullActive = false;
                            // Stun target for 1.5s after pull completes
                                this.ravenPullTarget.applyStatus('stun', 1.5, this);
                        }
                    } else {
                        this.ravenPullActive = false;
                    }
                }
                
                // Update marked enemy timers (for emoji display) - clean up expired marks
                let marksToDelete = [];
                for (let [e, data] of this.markedEnemies) {
                    if (typeof data === 'object') {
                        data.timer -= dt;
                        if (data.timer <= 0 || e.dead) {
                            marksToDelete.push(e);
                        }
                    }
                }
                // Delete expired marks
                for (let e of marksToDelete) {
                    this.markedEnemies.delete(e);
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
            
            input(dt, spd) {
                // Cannot control during raven pull
                if (this.ravenPullActive) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
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
                if (keys.q && this.qCD <= 0) this.darkSelf();
                if (keys.e && this.eCD <= 0) this.darkCircle();
                if (keys.f && this.fCD <= 0) this.ravenUltimate();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                this.basicCD = this.enhancedBasicActive ? 0.5 : 1.0;
                
                if (this.enhancedBasicActive) {
                    // Enhanced dark claw - melee attack
                    let hitTarget = false;
                    for (let e of entities) {
                        if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                            if (d < 120) {
                                let ad = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.angle);
                                if (ad > Math.PI) ad = 2 * Math.PI - ad;
                                if (ad < 0.4) {
                                    let baseDmg = 200;
                                    e.takeDamage(baseDmg, this);
                                    // Apply 15% toxin damage after 0.1s
                                    let toxinDmg = baseDmg * 0.15;
                                    setTimeout(() => {
                                        if (!e.dead) e.takeDamage(toxinDmg, this);
                                    }, 100);
                                    hitTarget = true;
                                    // Dark claw slash effect
                                    for (let i = 0; i < 8; i++) {
                                        let angle = this.angle + (i - 3.5) * 0.15;
                                        particles.push(new Particle(e.x + Math.cos(angle)*50, e.y + Math.sin(angle)*50, '#6a2e6e', 4, 0.5));
                                    }
                                    e.revealTimer = 1.0;
                                }
                            }
                        }
                    }
                    // Draw visible slash effect at Ambrose's attack angle
                    if (hitTarget) {
                        for (let i = 0; i < 6; i++) {
                            let offsetAngle = this.angle + (Math.random() - 0.5) * 0.5;
                            let dist = 60 + Math.random() * 30;
                            particles.push(new Particle(this.x + Math.cos(offsetAngle)*dist, this.y + Math.sin(offsetAngle)*dist, '#a855f7', 5, 0.4));
                        }
                    } else {
                        // Show claw slash even if it misses
                        for (let i = 0; i < 5; i++) {
                            let offsetAngle = this.angle + (i - 2) * 0.2;
                            let dist = 80 + Math.random() * 20;
                            particles.push(new Particle(this.x + Math.cos(offsetAngle)*dist, this.y + Math.sin(offsetAngle)*dist, '#4a0e4e', 4, 0.3));
                        }
                    }
                    if (this.isPlayer) addKillMsg('Dark Claw!');
                } else {
                    // Basic dark energy ball
                    let proj = new Projectile(this, this.x, this.y, this.angle + (Math.random()-0.5)*0.15, 450, 150, 300, '#4a0e4e', 6);
                    proj.maxDistance = 300;
                    proj.onHit = (target) => {
                        // Apply 15% toxin damage after 0.1s
                        let baseDmg = 150;
                        let toxinDmg = baseDmg * 0.15;
                        setTimeout(() => {
                            if (!target.dead) target.takeDamage(toxinDmg, this);
                        }, 100);
                        // Dark particles on hit
                        for (let i = 0; i < 3; i++) {
                            particles.push(new Particle(proj.x + (Math.random()-0.5)*20, proj.y + (Math.random()-0.5)*20, '#6a2e6e', 2, 0.3));
                        }
                    };
                    entities.push(proj);
                }
            }
            
            darkSelf() {
                this.qCD = 10;
                this.revealTimer = 1.0;
                
                // Throw dark self projectile (size of player)
                let proj = new Projectile(this, this.x, this.y, this.angle, 1000, 700, 600, '#2C1B47', 20);
                proj.maxDistance = 600;
                
                proj.onHit = (target) => {
                    // Teleport Ambrose to target
                    this.x = target.x;
                    this.y = target.y;
                    
                    // Unlock enhanced basic for 5s
                    this.enhancedBasicActive = true;
                    this.enhancedBasicTimer = 5;
                    
                    // Dark particles
                    for (let i = 0; i < 12; i++) {
                        let angle = (i / 12) * Math.PI * 2;
                        particles.push(new Particle(this.x + Math.cos(angle)*80, this.y + Math.sin(angle)*80, '#4a0e4e', 4, 0.5));
                    }
                    
                    if (this.isPlayer) addKillMsg('Dark Self Teleport! Enhanced Basic Active!');
                };
                
                entities.push(proj);
                
                // Launch particles
                for (let i = 0; i < 8; i++) {
                    let angle = (i / 8) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*40, this.y + Math.sin(angle)*40, '#2C1B47', 3, 0.4));
                }
            }
            
            darkCircle() {
                this.eCD = 5;
                this.revealTimer = 1.0;
                
                let totalDmg = 0;
                
                // Deal damage to nearby enemies
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                        if (d < 300) {
                            let baseDmg = 750;
                            e.takeDamage(baseDmg, this);
                            totalDmg += baseDmg;
                            // Apply 15% toxin damage after 0.1s
                            let toxinDmg = baseDmg * 0.15;
                            setTimeout(() => {
                                if (!e.dead) e.takeDamage(toxinDmg, this);
                            }, 100);
                            
                            // Apply slowness
                            e.slowTimer = Math.max(e.slowTimer, 3);
                            e.slowMultiplier = 0.4;
                            
                            e.revealTimer = 1.0;
                        }
                    }
                }

                // E also grants enhanced basic attacks for 3s
                this.enhancedBasicActive = true;
                this.enhancedBasicTimer = 3;
                
                // Heal Ambrose 60% of damage dealt
                let healAmount = totalDmg * 0.6;
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                
                // Dark circle particles
                for (let i = 0; i < 15; i++) {
                    let angle = (i / 15) * Math.PI * 2;
                    particles.push(new Particle(this.x + Math.cos(angle)*250, this.y + Math.sin(angle)*250, '#4a0e4e', 5, 0.6));
                }
                
                if (this.isPlayer) addKillMsg(`Dark Circle! Enhanced Basic + Healed +${Math.floor(healAmount)}`);
            }
            
            ravenUltimate() {
                this.fCD = 22;
                this.revealTimer = 1.5;
                
                // Find closest enemy
                let closest = null;
                let minDist = 10000;
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
                    // Mark the target for 10s (for emoji display) and apply 15% toxin damage after 0.1s
                    this.markedEnemies.set(closest, {timer: 10, toxinDmg: 0});
                    let toxinDmg = 150 * 0.15;
                    setTimeout(() => {
                        if (!closest.dead) closest.takeDamage(toxinDmg, this);
                    }, 100);
                    
                    // Start raven pull with fixed 5x speed
                    this.ravenPullActive = true;
                    this.ravenPullTimer = 1.5;
                    // Fixed pull speed: 1250 (5x base speed of 250)
                    this.ravenPullSpeed = 1250;
                    let dx = closest.x - this.x, dy = closest.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    this.ravenPullDirection = dist > 0 ? Math.atan2(dy, dx) : 0;
                    this.ravenPullTarget = closest;
                    
                    // Gain stun immunity during pull
                    this.stunImmune = true;
                    setTimeout(() => { this.stunImmune = false; }, 1500);
                    
                    // Raven particles
                    for (let i = 0; i < 20; i++) {
                        let angle = (i / 20) * Math.PI * 2;
                        particles.push(new Particle(this.x + Math.cos(angle)*100, this.y + Math.sin(angle)*100, '#1a0d2e', 5, 0.7));
                    }
                    
                    if (this.isPlayer) addKillMsg('Raven Ultimate! 5x Speed Pull!');
                } else {
                    if (this.isPlayer) addKillMsg('No targets found!');
                }
            }
            
            takeDamage(amt, src) {
                // Check if marked - take 15% more toxic damage
                if (src && src instanceof Ambrose && src.markedEnemies.has(this)) {
                    amt *= 1.15; // 15% more damage when marked
                }
                super.takeDamage(amt, src);
            }
            
            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                if (this.ravenPullActive) return;
                
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
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.qCD <= 0 && Math.random() < 0.1) this.darkSelf();
                    if (this.eCD <= 0 && Math.random() < 0.12) this.darkCircle();
                    if (this.fCD <= 0 && Math.random() < 0.05) this.ravenUltimate();
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
                
                // Draw raven emoji on marked enemies (only if mark is still active)
                for (let [e, data] of this.markedEnemies) {
                    if (!e.dead && typeof data === 'object' && data.timer > 0.01) {
                        ctx.save();
                        ctx.font = 'bold 26px Arial';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'bottom';
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - e.radius - 15;
                        ctx.fillText('🐦', screenX, screenY);
                        ctx.restore();
                    }
                }
                
                // Draw enhanced basic indicator
                if (this.enhancedBasicActive) {
                    ctx.strokeStyle = '#4a0e4e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius + 8, 0, Math.PI*2);
                    ctx.stroke();
                }
            }
            
            getDamageMult() { return 1; }
            getEffectiveSpeed() { 
                // Boost speed 2.3x when enhanced basic is active
                if (this.enhancedBasicActive) {
                    return this.speed * 2.3;
                }
                return this.speed; 
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Austin extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, '#FF6B35', 7000);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? "Player (Austin)" : "Enemy Austin";
                
                // Cooldowns
                this.basicCD = 0;
                this.qCD = 0;
                this.eCD = 0;
                this.fCD = 0;
                this.gCD = 0;
                this.rCD = 0;
                
                // Stats: 75% damage multiplier, 65% armor
                this.damageMultiplier = 0.75;
                this.armor = 0.65;
                
                // Base stats
                this.speed = 200;
                this.baseSpd = 200;
                
                // Q ability: Road creation
                this.roads = [];
                
                // E ability: Sector building
                this.markedEnemies = new Map();
                
                // F ability: Construction
                this.isJumping = false;
                this.jumpTimer = 0;
                this.hpBeforeJump = 0;
                this.hpLostBeforeJump = 0;
                this.ultimateMode = false;
                
                // Basic attack linking
                this.linkedTargets = [];
                
                // G ability: Power stance
                this.powerStance = false;
                this.powerStanceTimer = 0;
                this.gKeyPressed = false;
                this.currentTarget = null;
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
                
                // Update power stance timer
                if (this.powerStance) {
                    this.powerStanceTimer -= dt;
                    if (this.powerStanceTimer <= 0) {
                        this.powerStance = false;
                    }
                }
                
                // Update jump
                if (this.isJumping) {
                    this.jumpTimer -= dt;
                    if (this.jumpTimer <= 0) {
                        this.isJumping = false;
                        this.landJump();
                    }
                }
                
                // Update road expansion
                for (let road of this.roads) {
                    if (road.expanding) {
                        road.length += 360 * dt;
                        if (road.length >= 800) {
                            road.expanding = false;
                        }
                    }
                    road.timer -= dt;
                }
                this.roads = this.roads.filter(r => r.timer > 0);
                
                // Check if on road for speed boost
                let onRoad = false;
                for (let road of this.roads) {
                    if (this.isOnRoad(road)) {
                        this.speed = this.baseSpd * 2.5;
                        onRoad = true;
                        break;
                    }
                }
                if (!onRoad) {
                    this.speed = this.baseSpd;
                }
                
                // Update marked enemies
                for (let [e, data] of this.markedEnemies) {
                    data.timer -= dt;
                    if (data.timer <= 0) {
                        this.markedEnemies.delete(e);
                    }
                }
                
                // Check for stun or freeze
                if (this.stunTimer > 0 || this.freezeTimer > 0) {
                    if (this.isPlayer) updateHUD(this);
                    return;
                }
                
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
                
                this.ultimateMode = false;
            }
            
            isOnRoad(road) {
                let dx = Math.cos(road.angle);
                let dy = Math.sin(road.angle);
                let distToRoad = Math.abs((this.x - road.x) * dy - (this.y - road.y) * dx);
                let distAlongRoad = Math.abs((this.x - road.x) * dx + (this.y - road.y) * dy);
                return distToRoad < 50 && distAlongRoad < road.length;
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
                if (keys.q && this.qCD <= 0) this.createRoad();
                if (keys.e && this.eCD <= 0) this.sectorBuilding();
                if (keys.f && this.fCD <= 0) this.construction();
                if (keys.r && this.rCD <= 0) this.useGear();
            }
            
            basicAtk() {
                this.revealTimer = 0.5;
                
                // Link limit for unmarked enemies
                let unmarkedLinkLimit = 1;
                if (this.isJumping) unmarkedLinkLimit = 3;
                
                // Collect enemies in range
                let markedEnemies = [];
                let unmarkedEnemies = [];
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < 250) {
                            if (this.markedEnemies.has(e)) {
                                markedEnemies.push(e);
                            } else {
                                unmarkedEnemies.push(e);
                            }
                        }
                    }
                }
                
                // Sort unmarked by distance
                unmarkedEnemies.sort((a, b) => {
                    let aDist = Math.sqrt((a.x-this.x)**2 + (a.y-this.y)**2);
                    let bDist = Math.sqrt((b.x-this.x)**2 + (b.y-this.y)**2);
                    return aDist - bDist;
                });
                
                // Always link all marked enemies, plus limited unmarked
                let linkedEnemies = [...markedEnemies, ...unmarkedEnemies.slice(0, unmarkedLinkLimit)];
                this.linkedTargets = linkedEnemies;
                
                this.basicCD = 1.2;
                
                for (let linkedEnemy of linkedEnemies) {
                    for (let i = 0; i < 10; i++) {
                        setTimeout(() => {
                            if (!linkedEnemy.dead) {
                                let dmg = 15 * this.damageMultiplier;
                                if (this.markedEnemies.has(linkedEnemy)) {
                                    dmg *= 4;
                                }
                                linkedEnemy.takeDamage(dmg, this);
                            }
                        }, i * 100);
                    }
                }
            }
            
            createRoad() {
                this.qCD = 12;
                let road = {
                    x: this.x,
                    y: this.y,
                    angle: this.angle,
                    length: 0,
                    expanding: true,
                    timer: 8,
                    width: 100,
                    damaged: new Set()
                };
                
                this.dealRoadDamage(road);
                this.roads.push(road);
                
                if (this.isPlayer) addKillMsg('Road Created!');
            }
            
            dealRoadDamage(road) {
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = Math.cos(road.angle);
                        let dy = Math.sin(road.angle);
                        let distToRoad = Math.abs((e.x - road.x) * dy - (e.y - road.y) * dx);
                        let distAlongRoad = Math.abs((e.x - road.x) * dx + (e.y - road.y) * dy);
                        
                        if (distToRoad < road.width / 2 && distAlongRoad < 100) {
                            e.takeDamage(700, this);
                            road.damaged.add(e);
                        }
                    }
                }
            }
            
            sectorBuilding() {
                this.eCD = 7.5;
                let slashRange = 400;
                let slashAngle = Math.PI / 2;
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        let angle = Math.atan2(e.y-this.y, e.x-this.x);
                        let angleDiff = Math.abs(angle - this.angle);
                        
                        if (d < slashRange && angleDiff < slashAngle / 2) {
                            e.takeDamage(200, this);
                            this.markedEnemies.set(e, { timer: 4 });
                            e.slowTimer = 2;
                            e.slowLevel = 3;
                        }
                    }
                }
                
                for (let i = 0; i < 20; i++) {
                    let angle = this.angle + (Math.random() - 0.5) * Math.PI / 2;
                    particles.push(new Particle(
                        this.x + Math.cos(angle) * 100,
                        this.y + Math.sin(angle) * 100,
                        '#FFD700', 5, 0.8
                    ));
                }
                
                if (this.isPlayer) addKillMsg('Sector Building!');
            }

            sectorSlash() {
                this.sectorBuilding();
            }
            
            construction() {
                this.fCD = 20;
                this.isJumping = true;
                this.jumpTimer = 1;
                this.hpLostBeforeJump = this.maxHp - this.hp;
                this.hpBeforeJump = this.hp;
                this.ultimateMode = true;
                
                if (this.isPlayer) addKillMsg('Construction!');
            }

            jumpStomp() {
                this.construction();
            }
            
            landJump() {
                let healAmount = 350 + (this.hpLostBeforeJump * 0.25);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                
                for (let e of entities) {
                    if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                        if (d < 450) {
                            e.takeDamage(750, this);
                            this.markedEnemies.set(e, { timer: 4 });
                            e.applyStatus('stun', 1, this);
                        }
                    }
                }
                
                for (let i = 0; i < 15; i++) {
                    particles.push(new Particle(
                        this.x + (Math.random()-0.5)*100,
                        this.y + (Math.random()-0.5)*100,
                        '#FF6B35', 6, 1
                    ));
                }
            }
            
            draw(ctx) {
                super.draw(ctx);
                
                // Draw links to all linked enemies
                if (this.linkedTargets && this.linkedTargets.length > 0) {
                    for (let linkedEnemy of this.linkedTargets) {
                        if (!linkedEnemy.dead) {
                            ctx.strokeStyle = 'rgba(255, 107, 53, 0.5)';
                            ctx.lineWidth = 2;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.moveTo(this.x - camera.x, this.y - camera.y);
                            ctx.lineTo(linkedEnemy.x - camera.x, linkedEnemy.y - camera.y);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                    }
                }
                
                for (let road of this.roads) {
                    ctx.save();
                    ctx.globalAlpha = 0.7;
                    
                    // Road main fill
                    ctx.fillStyle = '#FF6B35';
                    ctx.translate(road.x - camera.x, road.y - camera.y);
                    ctx.rotate(road.angle);
                    ctx.fillRect(0, -50, road.length, 100);
                    
                    // Road border
                    ctx.strokeStyle = '#FF8C00';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(0, -50, road.length, 100);
                    
                    ctx.restore();
                }
                
                for (let [e] of this.markedEnemies) {
                    if (!e.dead) {
                        let screenX = e.x - camera.x;
                        let screenY = e.y - camera.y - 40;
                        ctx.font = '20px Arial';
                        ctx.textAlign = 'center';
                        ctx.fillText('👻', screenX, screenY);
                    }
                }
                
                if (this.isJumping) {
                    // Outer ring
                    ctx.strokeStyle = '#FF6B35';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 150, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Inner ring
                    ctx.strokeStyle = '#FF8C00';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 100, 0, Math.PI*2);
                    ctx.stroke();
                    
                    // Impact radius (semi-transparent)
                    ctx.fillStyle = 'rgba(255, 107, 53, 0.2)';
                    ctx.beginPath();
                    ctx.arc(this.x - camera.x, this.y - camera.y, 600, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            
            getDamageMult() {
                return this.damageMultiplier;
            }
            
            takeDamage(dmg, source) {
                let actualDamage = dmg * (1 - this.armor);
                super.takeDamage(actualDamage, source);
            }
            
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
            
            ai(dt, spd) {
                let target = this.currentTarget;
                let targetDist = Infinity;

                if (target && target instanceof Entity && !target.dead && target.team !== this.team && target.isVisibleTo(this)) {
                    targetDist = Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
                    if (targetDist > 1000) {
                        target = null;
                        targetDist = Infinity;
                    }
                } else {
                    target = null;
                }

                if (!target) {
                    target = this.findTarget();
                    if (target) {
                        targetDist = Math.sqrt((target.x - this.x) ** 2 + (target.y - this.y) ** 2);
                    }
                } else {
                    let nearestEnemy = this.findTarget();
                    if (nearestEnemy && nearestEnemy !== target) {
                        let nearestDist = Math.sqrt((nearestEnemy.x - this.x) ** 2 + (nearestEnemy.y - this.y) ** 2);
                        if (nearestDist < targetDist - 180 || targetDist > 900) {
                            target = nearestEnemy;
                            targetDist = nearestDist;
                        }
                    }
                }

                this.currentTarget = target;

                if (target) {
                    let dx = target.x - this.x;
                    let dy = target.y - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        let moveX = (dx / dist) * spd * dt;
                        let moveY = (dy / dist) * spd * dt;
                        this.x += moveX;
                        this.y += moveY;
                    }

                    if (targetDist < 250 && this.basicCD <= 0) {
                        this.basicAtk();
                    }

                    if (Math.random() < 0.02 && this.qCD <= 0) this.createRoad();
                    if (Math.random() < 0.03 && this.eCD <= 0) this.sectorBuilding();
                    if (Math.random() < 0.01 && this.fCD <= 0) this.construction();

                    this.angle = Math.atan2(dy, dx);
                } else {
                    if (Math.random() < 0.1) {
                        this.angle = Math.random() * Math.PI * 2;
                    }
                    let moveX = Math.cos(this.angle) * spd * dt;
                    let moveY = Math.sin(this.angle) * spd * dt;
                    this.x += moveX;
                    this.y += moveY;
                }
                
                this.x = Math.max(20, Math.min(WORLD_SIZE - 20, this.x));
                this.y = Math.max(20, Math.min(WORLD_SIZE - 20, this.y));
                
                if (Math.random() < 0.01 && this.rCD <= 0) this.useGear();
            }
        }

        function init() {
            if(isInitialized)return; isInitialized=true;
            CANVAS=document.getElementById('gameCanvas');if(!CANVAS)return;CTX=CANVAS.getContext('2d');
            MINIMAP_CANVAS=document.getElementById('minimapCanvas');if(MINIMAP_CANVAS)MINIMAP_CTX=MINIMAP_CANVAS.getContext('2d');
            if(MINIMAP_CANVAS) {
                MINIMAP_CANVAS.addEventListener('click', function(e) {
                    if (!player) return;
                    let rect = MINIMAP_CANVAS.getBoundingClientRect();
                    let localX = e.clientX - rect.left;
                    let localY = e.clientY - rect.top;
                    let scale = 150 / WORLD_SIZE;
                    let targetX = (localX - 75) / scale + player.x;
                    let targetY = (localY - 75) / scale + player.y;
                    
                    // Noli teleport
                    if(player instanceof Noli && player.teleportCharges > 0) {
                        player.x = Math.max(20, Math.min(WORLD_SIZE - 20, targetX));
                        player.y = Math.max(20, Math.min(WORLD_SIZE - 20, targetY));
                        player.teleportCharges--;
                        for (let i = 0; i < 8; i++) {
                            particles.push(new Particle(player.x, player.y, '#800080', 5, 0.8));
                        }
                    }
                    // Teleportation gear
                    else if(player.gear === 'teleportation' && player.teleportWindup <= 0 && player.rCD <= 0) {
                        player.teleportTarget = {
                            x: Math.max(20, Math.min(WORLD_SIZE - 20, targetX)),
                            y: Math.max(20, Math.min(WORLD_SIZE - 20, targetY))
                        };
                        player.useGear();
                    }
                });
            }
            
            function rs(){if(CANVAS){CANVAS.width=window.innerWidth;CANVAS.height=window.innerHeight;}}
            window.addEventListener('resize',rs); rs();
            
            // Set camera zoom for mobile devices
            const isMobile = window.innerWidth <= 768 || window.innerHeight <= 500 || 'ontouchstart' in window;
            if (isMobile) {
                camera.zoom = 1.5; // Zoom in for better mobile gameplay
            }

            window.addEventListener('keydown',e=>{if(keys.hasOwnProperty(e.key.toLowerCase()))keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='l'&&typeof gameMode!=='undefined'&&gameMode==='training')switchTrainingDummy();if(e.key.toLowerCase()==='p'&&typeof gameMode!=='undefined'&&gameMode==='training')resetTrainingCounter();if(e.key.toLowerCase()==='o'&&typeof gameMode!=='undefined'&&gameMode==='training')resetTrainingCooldowns();if(e.key===' ')showLeaderboard();});
            window.addEventListener('keyup',e=>{if(keys.hasOwnProperty(e.key.toLowerCase()))keys[e.key.toLowerCase()]=false;if(e.key===' ')hideLeaderboard();});
            window.addEventListener('mousemove', e => { updateMouseFromClient(e.clientX, e.clientY); });
            window.addEventListener('mousedown', () => mouse.down = true);
            window.addEventListener('mouseup', () => mouse.down = false);
            
            // Mobile touch support (alongside existing mouse input, doesn't replace it)
            window.addEventListener('touchmove', e => {
                if (e.touches.length > 0) {
                    updateMouseFromClient(e.touches[0].clientX, e.touches[0].clientY);
                }
                e.preventDefault();
            }, { passive: false });
            
            window.addEventListener('touchstart', e => {
                if (e.touches.length > 0) {
                    updateMouseFromClient(e.touches[0].clientX, e.touches[0].clientY);
                    mouse.down = true;
                }
                e.preventDefault();
            }, { passive: false });
            
            window.addEventListener('touchend', e => {
                mouse.down = false;
                e.preventDefault();
            }, { passive: false });
            
            loop(0);
        }

        // Winston hero: speedster/mage
        class Winston extends Entity {
            constructor(x, y, p) {
                super(x, y, 16, p ? '#66ccff' : '#5599cc', 4300);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Winston)' : 'Enemy Winston';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                // Stats & movement
                this.baseSpd = 350; this.speed = this.baseSpd;

                // Passive wind buildup
                this.windCharge = 0; // 0..1
                this.windActive = false;
                this.windRadius = 140;

                // Ability timers
                this.hurricaneTimer = 0; this.hurricaneTick = 0;
                this.dashTimer = 0; this.dashDuration = 3;
                // short burst dash used by E
                this.dashBurst = 0; this.dashBurstVx = 0; this.dashBurstVy = 0;

                // Internal flags
                this.pendingQSeq = 0;
                this._qWas = false;
                this._eWas = false;
                this._fWas = false;
                this._rWas = false;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);

                // Passive: requires sustained movement to generate wind
                let moving = false;
                if (this.isPlayer) moving = keys && (keys.w || keys.a || keys.s || keys.d);
                else { moving = Math.abs(this.vx||0) + Math.abs(this.vy||0) > 0.01; }

                if (moving) {
                    this.windCharge = Math.min(1, this.windCharge + 0.6 * dt);
                } else {
                    // Wind disappears immediately when stopping
                    if (this.windActive) this.windActive = false;
                    this.windCharge = Math.max(0, this.windCharge - 1.0 * dt);
                }

                // Activate wind when fully charged and moving
                if (this.windCharge >= 1 && moving) this.windActive = true;

                // Passive wind effects
                if (this.windActive) {
                    // Push enemies away and slow projectiles
                    for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                        let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                        if (d < this.windRadius && d > 1) {
                            let push = 120; // px/s push
                            e.x += (dx / d) * push * dt;
                            e.y += (dy / d) * push * dt;
                            // small reveal and slow
                            e.revealTimer = Math.max(e.revealTimer || 0, 0.4);
                            e.slowTimer = Math.max(e.slowTimer || 0, 0.3);
                        }
                    }
                    // Slow projectiles (best-effort: particles with vx/vy)
                    for (let p of particles) {
                        if (p && typeof p.vx === 'number' && typeof p.vy === 'number') {
                            let dx = p.x - this.x, dy = p.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < this.windRadius) { p.vx *= 0.96; p.vy *= 0.96; }
                        }
                    }
                }

                // Hurricane ticking
                if (this.hurricaneTimer > 0) {
                    this.hurricaneTimer = Math.max(0, this.hurricaneTimer - dt);
                    this.hurricaneTick -= dt;
                    if (this.hurricaneTick <= 0) {
                        this.hurricaneTick += 1.0; // damage each second
                        let dmg = Math.floor(this.speed * 1.2);
                        for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < 320) { e.takeDamage(dmg, this); e.stunTimer = Math.max(e.stunTimer || 0, 0.25); }
                        }
                    }
                } else if (this.hurricaneTimer === 0 && this.shield > 0) {
                    // Remove shield when hurricane ends
                    this.shield = 0;
                }

                // Dash buff timer
                if (this.dashTimer > 0) {
                    this.dashTimer = Math.max(0, this.dashTimer - dt);
                    this.speed = 400;
                } else this.speed = this.baseSpd;

                // Dash burst movement (E)
                if (this.dashBurst > 0) {
                    let moveX = this.dashBurstVx * dt;
                    let moveY = this.dashBurstVy * dt;
                    this.x += moveX; this.y += moveY;
                    this.dashBurst = Math.max(0, this.dashBurst - dt);
                    // spawn small particles while dashing
                    if (Math.random() < 0.4) particles.push(new Particle(this.x - this.vx*0.02, this.y - this.vy*0.02, '#bfefff', 2, 0.35));
                }

                // Hurricane visual - damage only, no projectile spawning
                if (this.hurricaneTimer > 0) {
                    // extra particles for denser hurricane
                    if (Math.random() < 0.6) particles.push(new Particle(this.x + (Math.random()-0.5)*320, this.y + (Math.random()-0.5)*320, '#9fe1ff', 3, 0.9));
                }

                // Input handling
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    if (keys.r && this.rCD <= 0) this.useGear();
                    updateHUD(this);
                } else this.ai(dt, spd);
            }

            basicAtk() {
                if (this.basicCD > 0) return; this.basicCD = 0.6;
                this.revealTimer = 0.5;
                // Wind projectile basic attack
                let dmg = 90;
                let wx = this.x + Math.cos(this.angle) * (this.radius + 6);
                let wy = this.y + Math.sin(this.angle) * (this.radius + 6);
                let w = new WindProjectile(this, wx, wy, this.angle, 700, 600, dmg, '#bfefff', 18);
                if (typeof window.projectiles !== 'undefined') window.projectiles.push(w); else entities.push(w);
                for (let i = 0; i < 8; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#bfefff', 3, 0.5, (Math.random()-0.5)*120, (Math.random()-0.5)*120));
            }

            // Q: 3 running wind attacks with healing on hit
            skill1() {
                if (this.qCD > 0) return; this.qCD = 4; this.revealTimer = 0.5; let self = this;
                // spawn 3 wind ribbon projectiles in quick succession
                for (let i = 0; i < 3; i++) setTimeout(() => {
                    if (self.dead) return;
                    let baseAngle = self.angle;
                    let spread = 0.18; // radians
                    let ang = baseAngle + (i - 1) * spread;
                    let speed = 900;
                    let dmg = Math.floor(self.speed * 1.5);
                    let wx = self.x + Math.cos(ang) * (self.radius + 6);
                    let wy = self.y + Math.sin(ang) * (self.radius + 6);
                    let w = new WindProjectile(self, wx, wy, ang, speed, 700, dmg, '#aee7ff', 28);
                    // Add healing callback on hit
                    w.onHitEnemy = () => {
                        self.hp = Math.min(self.maxHp, self.hp + 200);
                        if (self.isPlayer) addKillMsg('Q Heal +200');
                    };
                    // Add to projectiles array instead of entities so update/cleanup occurs correctly
                    if (typeof window.projectiles !== 'undefined') window.projectiles.push(w); else entities.push(w);
                    particles.push(new Particle(self.x, self.y, '#cfefff', 3, 0.6));
                }, i * 120);
            }

            // E: swift dash that buffs base speed for 2.5s and heals
            doDash() {
                if (this.eCD > 0) return; this.eCD = 7; this.dashTimer = this.dashDuration;
                this.revealTimer = 0.5;
                // short burst forward movement
                this.dashBurst = 0.22; // seconds of burst
                let dashSpeed = 1200; // px/s burst speed
                this.dashBurstVx = Math.cos(this.angle) * dashSpeed;
                this.dashBurstVy = Math.sin(this.angle) * dashSpeed;
                // Heal on dash
                this.hp = Math.min(this.maxHp, this.hp + 200);
                if (this.isPlayer) addKillMsg('E Dash Heal +200');
                for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, '#88ddff', 4, 0.6, (Math.random()-0.5)*200, (Math.random()-0.5)*200));
            }

            // F: Hurricane
            doUlt() {
                if (this.fCD > 0) return; this.fCD = 18; this.hurricaneTimer = 6; this.hurricaneTick = 1.0;
                this.revealTimer = 0.5;
                // Grant shield on ultimate
                this.shield = 860;
                // make the hurricane feel windy: spawn lots of swirling particles and small wind bolts
                this._ultSpawnTimer = 0;
                for (let i = 0; i < 40; i++) particles.push(new Particle(this.x, this.y, '#7fd6ff', 6, 1.4, (Math.random()-0.5)*420, (Math.random()-0.5)*420));
            }

            input(dt, spd) {
                // Block input when stunned or frozen
                if ((this.stunTimer && this.stunTimer > 0) || (this.freezeTimer && this.freezeTimer > 0)) { this.vx = 0; this.vy = 0; return; }

                // Movement (WASD)
                let mx = (mouse.x || 0) + (camera.x || 0);
                let my = (mouse.y || 0) + (camera.y || 0);
                let moveX = 0, moveY = 0;
                if (keys.w) moveY -= 1;
                if (keys.s) moveY += 1;
                if (keys.a) moveX -= 1;
                if (keys.d) moveX += 1;
                if (moveX !== 0 || moveY !== 0) {
                    let m = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
                    // set velocity magnitude
                    this.vx = (moveX / m) * spd;
                    this.vy = (moveY / m) * spd;
                    // apply movement immediately (engine expects position updates per-frame)
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                } else { this.vx = 0; this.vy = 0; }

                // Face cursor
                this.angle = Math.atan2(my - this.y, mx - this.x);

                // Basic attack (mouse)
                if (mouse.down && this.basicCD <= 0) this.basicAtk();

                // Q (skill1)
                if (keys.q && this.qCD <= 0 && !this._qWas) { this._qWas = true; this.skill1(); }
                if (!keys.q) this._qWas = false;

                // E (dash)
                if (keys.e && this.eCD <= 0 && !this._eWas) { this._eWas = true; this.doDash(); }
                if (!keys.e) this._eWas = false;

                // F (ultimate)
                if (keys.f && this.fCD <= 0 && !this._fWas) { this._fWas = true; this.doUlt(); }
                if (!keys.f) this._fWas = false;

                // R (gear) - update() also guards rCD, but keep local debounce
                if (keys.r && this.rCD <= 0 && !this._rWas) { this._rWas = true; if (typeof this.useGear === 'function') this.useGear(); }
                if (!keys.r) this._rWas = false;
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 200) {
                    this.x += Math.cos(this.angle) * spd * dt;
                    this.y += Math.sin(this.angle) * spd * dt;
                } else {
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.qCD <= 0) this.skill1();
                    if (this.eCD <= 0 && d < 150) this.doDash();
                    if (this.fCD <= 0 && this.hp < this.maxHp * 0.3) this.doUlt();
                }
            }

            findTarget() {
                let c = null, md = 9999;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) {
                    let d = Math.sqrt((e.x-this.x)**2 + (e.y-this.y)**2);
                    if (d < md) { md = d; c = e; }
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
                // Draw wind charge bar above head (player only)
                if (this.isPlayer) {
                    let sx = this.x - camera.x - 30, sy = this.y - camera.y - this.radius - 26;
                    ctx.save();
                    ctx.fillStyle = '#222'; ctx.fillRect(sx, sy, 60, 6);
                    ctx.fillStyle = '#8be9ff'; ctx.fillRect(sx, sy, 60 * this.windCharge, 6);
                    ctx.strokeStyle = '#000'; ctx.strokeRect(sx, sy, 60, 6);
                    ctx.fillStyle = '#fff'; ctx.font = '11px Arial'; ctx.textAlign = 'center'; ctx.fillText(this.windActive ? 'Wind' : 'Charge', sx + 30, sy - 6);
                    ctx.restore();
                }

                // Draw hurricane visuals when active
                if (this.hurricaneTimer > 0) {
                    let screenX = this.x - camera.x, screenY = this.y - camera.y;
                    let prog = this.hurricaneTimer / 6;
                    ctx.save();
                    ctx.globalAlpha = 0.25 + 0.3 * Math.sin(Date.now() * 0.006);
                    ctx.strokeStyle = '#7fd6ff'; ctx.lineWidth = 6;
                    ctx.beginPath(); ctx.arc(screenX, screenY, 320, 0, Math.PI*2); ctx.stroke();
                    // rotating spiral
                    ctx.beginPath();
                    for (let a = 0; a < 10; a++) {
                        let angle = (Date.now()*0.002 + a) % (Math.PI*2);
                        let rx = screenX + Math.cos(angle) * (80 + a*12);
                        let ry = screenY + Math.sin(angle) * (80 + a*12);
                        ctx.lineTo(rx, ry);
                    }
                    ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 2; ctx.stroke();
                    ctx.restore();
                }
            }
        }

        // Amir: Indian Delivery Driver with Truck
        class Amir extends Entity {
            constructor(x, y, p) {
                super(x, y, 18, p ? '#ff6b35' : '#cc5428', 8700);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Amir)' : 'Enemy Amir';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                // Stats & movement
                this.baseSpd = 300; this.speed = this.baseSpd;

                // Passive: Damage Shield Bar (like Fred/Winston)
                this.damageShield = 0; // shields equal to 10% of damage taken
                this.shieldBar = 0; // visual bar 0..1
                
                // Passive movement-based charging
                // Increased gain so bar charges noticeably while moving; convert to real shield at cap
                // Nerfed: reduce movement-based charge to slow bar accumulation
                this.passiveMoveGain = 180; // shield points per second gained while moving (reduced from 300)
                this.damageShieldDecayRate = 25; // points per second decay when not actively charging
                // Truck state
                this.truckActive = false; this.truckTimer = 0; this.truckCooldown = 0;
                this.truckSpeedMult = 3;
                this.lastCrashTick = 0; this.crashTickInterval = 0.5;
                this.canExplodeTruck = false; this.truckExplodeDelay = 1.5;

                // Speed buff from Q
                this.speedBuffTimer = 0;
                
                // Gear integration
                this.gear = 'speedster'; this.rCD = 0; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
                
                // Input debounce variables
                this._qWas = false;
                this._eWas = false;
                this._fWas = false;
                this._rWas = false;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);

                // Speed buff timer
                if (this.speedBuffTimer > 0) this.speedBuffTimer -= dt;
                
                // Gear timers
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;

                // Truck logic
                if (this.truckActive && this.truckTimer > 0) {
                    this.truckTimer -= dt;
                    this.speed = this.baseSpd * this.truckSpeedMult;

                    // Crash damage every 0.5s
                    this.lastCrashTick -= dt;
                    if (this.lastCrashTick <= 0) {
                        this.lastCrashTick = this.crashTickInterval;
                            let crashDmg = Math.floor(this.baseSpd * 0.6);
                        for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                            let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                            if (d < 150) {
                                e.takeDamage(crashDmg, this);
                                // Apply knockback via status so physics/servers handle movement consistently
                                if (typeof e.applyStatus === 'function') e.applyStatus('knockback', { x: (dx / d) * 300, y: (dy / d) * 300 }, this);
                                else { e.x += (dx / d) * 100; e.y += (dy / d) * 100; }
                            }
                        }
                    }

                    // Can explode after minimum delay
                    if (this.truckTimer <= 8 - this.truckExplodeDelay) this.canExplodeTruck = true;

                    // Auto-explode when time runs out
                    if (this.truckTimer <= 0) this.explodeTruck();
                } else if (this.truckTimer <= 0 && this.truckActive) {
                    this.truckActive = false;
                    this.speed = this.baseSpd + (this.speedBuffTimer > 0 ? 50 : 0);
                }

                // Update base speed calculation
                if (this.speedBuffTimer <= 0) {
                    this.speed = this.truckActive ? this.baseSpd * this.truckSpeedMult : this.baseSpd;
                }

                // Movement-based passive charging and shield decay
                // Gain shield-like resource while moving, decay when idle. When resource reaches cap, convert to actual `shield`.
                let shieldCap = this.maxHp * 0.1;
                let isMoving = (this.vx && this.vx !== 0) || (this.vy && this.vy !== 0);
                // Fallback movement check when vx/vy are not set; compare position drift
                if (!isMoving && typeof this.prevX === 'number' && typeof this.prevY === 'number') {
                    isMoving = Math.hypot(this.x - this.prevX, this.y - this.prevY) > 0.001;
                }
                this.prevX = this.x; this.prevY = this.y;

                if (isMoving) {
                    this.damageShield = Math.min(this.damageShield + this.passiveMoveGain * dt, shieldCap);
                } else {
                    this.damageShield = Math.max(0, this.damageShield - dt * this.damageShieldDecayRate);
                }

                if (this.damageShield >= shieldCap) {
                    this.shield = Math.max(this.shield || 0, Math.floor(shieldCap));
                    this.damageShield = 0;
                    if (this.isPlayer) addKillMsg('Delivery Resilience: Shield ready!');
                    for (let i = 0; i < 12; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*40, this.y + (Math.random()-0.5)*40, '#ffcc00', 3 + Math.random()*3, 0.6));
                }

                // Show correspondent bar (charge or actual shield) above Amir.
                let chargeFraction = Math.min(1, this.damageShield / shieldCap);
                let activeShieldFraction = this.shield ? Math.min(1, this.shield / shieldCap) : 0;
                this.shieldBar = Math.max(chargeFraction, activeShieldFraction);

                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    if (keys.r && this.rCD <= 0) this.useGear();
                    updateHUD(this);
                } else this.ai(dt, spd);
            }

            basicAtk() {
                if (this.basicCD > 0) return; this.basicCD = 1.5;
                // Tool swing attack
                let range = 140; let dmg = 220;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < range) {
                        let ang = Math.atan2(dy, dx); let diff = Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle)));
                        if (diff < Math.PI/3) { e.takeDamage(dmg, this); e.x += (dx/d) * 40; e.y += (dy/d) * 40; }
                    }
                }
                // Improved visual: forward arc particles and bigger impact puffs
                for (let i = 0; i < 12; i++) {
                    let ang = this.angle + (Math.random() - 0.5) * (Math.PI / 2);
                    let dist = 30 + Math.random() * 120;
                    let px = this.x + Math.cos(ang) * dist;
                    let py = this.y + Math.sin(ang) * dist;
                    particles.push(new Particle(px + (Math.random()-0.5)*8, py + (Math.random()-0.5)*8, '#ff9a3d', 4 + Math.random() * 5, 0.5 + Math.random() * 0.5));
                }
                // strong central hit flash
                particles.push(new Particle(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, '#ffd27a', 14, 0.35));
                if (this.isPlayer) screenShake(6);
            }

            // Q: 2 Dolla Tip - throw bag
            skill1() {
                if (this.qCD > 0) return; this.qCD = 7;
                let speed = 850;
                let dmg = Math.floor(this.getEffectiveSpeed() * 2.8); // scale with current effective speed
                let wx = this.x + Math.cos(this.angle) * (this.radius + 6);
                let wy = this.y + Math.sin(this.angle) * (this.radius + 6);
                // larger bag, non-piercing: set to remove on first hit via callback
                let w = new BagProjectile(this, wx, wy, this.angle, speed, 700, dmg, '#ffd700', 20);
                // onHit receives the enemy hit; apply stun and speed buff and stop projectile
                w.onHitEnemy = (enemy) => {
                    if (!enemy || enemy.dead) return;
                    let stunAmount = Math.max(0.1, dmg * 0.001);
                    try { if (typeof enemy.applyStatus === 'function') enemy.applyStatus('stun', stunAmount, this); else enemy.stunTimer = Math.max(enemy.stunTimer || 0, stunAmount); } catch(_) {}
                    // Buff Amir speed +50 for 3s
                    this.speedBuffTimer = 3;
                    this.speed = Math.max(this.speed, this.baseSpd + 50);
                    // visual hit burst
                    for (let i = 0; i < 8; i++) particles.push(new Particle(enemy.x + (Math.random()-0.5)*30, enemy.y + (Math.random()-0.5)*30, '#fff2b8', 5 + Math.random()*6, 0.45));
                    if (this.isPlayer) addKillMsg('Your food is ready sir! +50 Spd');
                    // stop the bag from piercing further
                    try { w.del = true; } catch(_) {}
                };
                if (typeof window.projectiles !== 'undefined') window.projectiles.push(w); else entities.push(w);
                for (let i = 0; i < 5; i++) particles.push(new Particle(this.x, this.y, '#ffd700', 4, 0.6));
            }

            // E: Stunt - dash to mouse location with knockback
            doStunt() {
                if (this.eCD > 0) return; this.eCD = 6;
                let mx = (mouse.x || 0) + (camera.x || 0);
                let my = (mouse.y || 0) + (camera.y || 0);
                let dx = mx - this.x, dy = my - this.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 500) { dx = (dx/d) * 500; dy = (dy/d) * 500; }
                this.x += dx; this.y += dy;

                // Knockback enemies in 200 radius
                let dmg = Math.floor(this.getEffectiveSpeed() * 2.5); // scale with current effective speed
                let totalDamage = 0;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let edx = e.x - this.x, edy = e.y - this.y; let ed = Math.sqrt(edx*edx + edy*edy);
                    if (ed < 200) {
                        e.takeDamage(dmg, this);
                        e.x += (edx/ed) * 120; e.y += (edy/ed) * 120; // knockback
                        totalDamage += dmg;
                        for (let i = 0; i < 4; i++) particles.push(new Particle(e.x, e.y, '#ff6b35', 3, 0.4));
                    }
                }
                // Heal 50% of damage dealt
                this.hp = Math.min(this.maxHp, this.hp + Math.floor(totalDamage * 0.5));
                if (this.isPlayer && totalDamage > 0) addKillMsg('Stunt Heal +' + Math.floor(totalDamage * 0.5));
                for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, '#ff9a3d', 4, 0.6));
            }

            // F: Truck - speed boost with crash damage
            explodeTruck() {
                this.truckActive = false;
                this.truckTimer = 0;
                this.canExplodeTruck = false;
                this.speed = this.baseSpd + (this.speedBuffTimer > 0 ? 50 : 0);

                // Explosion: 200% speed damage + 1s stun
                let expDmg = Math.floor(this.baseSpd * 2.0);
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < 300) {
                        e.takeDamage(expDmg, this);
                        e.applyStatus('stun', 1.0, this);
                        if (typeof e.applyStatus === 'function') e.applyStatus('knockback', { x: (dx / d) * 450, y: (dy / d) * 450 }, this);
                        else { e.x += (dx/d) * 150; e.y += (dy/d) * 150; }
                    }
                }
                for (let i = 0; i < 30; i++) particles.push(new Particle(this.x + (Math.random()-0.5)*200, this.y + (Math.random()-0.5)*200, '#ff6b35', 5, 0.8));
            }

            doTruck() {
                if (this.fCD > 0) return;
                if (this.truckActive) {
                    // Can explode if enough time has passed
                    if (this.canExplodeTruck) {
                        this.explodeTruck();
                        this.fCD = 22;
                    }
                } else {
                    // Activate truck
                    this.truckActive = true;
                    this.truckTimer = 8;
                    this.lastCrashTick = 0;
                    this.canExplodeTruck = false;
                    for (let i = 0; i < 20; i++) particles.push(new Particle(this.x, this.y, '#ff9a3d', 5, 0.8));
                }
            }

            input(dt, spd) {
                if ((this.stunTimer && this.stunTimer > 0) || (this.freezeTimer && this.freezeTimer > 0)) { this.vx = 0; this.vy = 0; return; }

                let mx = (mouse.x || 0) + (camera.x || 0);
                let my = (mouse.y || 0) + (camera.y || 0);
                let moveX = 0, moveY = 0;
                if (keys.w) moveY -= 1;
                if (keys.s) moveY += 1;
                if (keys.a) moveX -= 1;
                if (keys.d) moveX += 1;
                if (moveX !== 0 || moveY !== 0) {
                    let m = Math.sqrt(moveX * moveX + moveY * moveY) || 1;
                    this.vx = (moveX / m) * spd;
                    this.vy = (moveY / m) * spd;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                } else { this.vx = 0; this.vy = 0; }

                this.angle = Math.atan2(my - this.y, mx - this.x);

                if (mouse.down && this.basicCD <= 0) this.basicAtk();
                if (keys.q && this.qCD <= 0 && !this._qWas) { this._qWas = true; this.skill1(); }
                if (!keys.q) this._qWas = false;
                if (keys.e && this.eCD <= 0 && !this._eWas) { this._eWas = true; this.doStunt(); }
                if (!keys.e) this._eWas = false;
                if (keys.f && this.fCD <= 0 && !this._fWas) { this._fWas = true; this.doTruck(); }
                if (!keys.f) this._fWas = false;
                if (keys.r && this.rCD <= 0 && !this._rWas) { this._rWas = true; if (typeof this.useGear === 'function') this.useGear(); }
                if (!keys.r) this._rWas = false;
            }

            ai(dt, spd) {
                if (this.handleSafeZone(dt)) return;
                let t = this.findTarget();
                if (!t) { this.wander(dt, spd); this.vx = 0; this.vy = 0; return; }
                let dx = t.x - this.x, dy = t.y - this.y;
                this.angle = Math.atan2(dy, dx);
                let d = Math.sqrt(dx*dx + dy*dy);
                if (d > 250) {
                    let vx = Math.cos(this.angle) * spd;
                    let vy = Math.sin(this.angle) * spd;
                    this.x += vx * dt;
                    this.y += vy * dt;
                    this.vx = vx;
                    this.vy = vy;
                } else {
                    this.vx = 0;
                    this.vy = 0;
                    if (this.basicCD <= 0) this.basicAtk();
                    if (this.qCD <= 0) this.skill1();
                    if (this.eCD <= 0 && Math.random() < 0.3) this.doStunt();
                }
            }

            findTarget() { let c = null, md = 9999; for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team && e.isVisibleTo(this)) { let d = Math.sqrt((e.x-this.x)**2+(e.y-this.y)**2); if (d < md) { md = d; c = e; } } return c; }
            wander(dt, spd) { if (Math.random() < 0.05) this.angle += (Math.random()-0.5)*1; this.x += Math.cos(this.angle) * spd * 0.5 * dt; this.y += Math.sin(this.angle) * spd * 0.5 * dt; }

            takeDamage(dmg, attacker) {
                if (this.dead) return;
                // Only charge passive on positive damage values (ignore heals/zero and non-damage events)
                // Increased conversion: more charge gained per damage taken so shield readies faster.
                if (typeof dmg === 'number' && dmg > 0) {
                    this.damageShield = Math.min(this.damageShield + dmg * 0.3, this.maxHp * 0.1);
                }
                super.takeDamage(dmg, attacker);
            }

            draw(ctx) {
                super.draw(ctx);

                // Draw damage shield bar
                if (this.shieldBar > 0) {
                    let sx = this.x - camera.x - 35, sy = this.y - camera.y - this.radius - 32;
                    ctx.save();
                    ctx.fillStyle = '#222';
                    ctx.fillRect(sx, sy, 70, 6);
                    ctx.fillStyle = '#ffcc00';
                    ctx.fillRect(sx, sy, 70 * this.shieldBar, 6);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(sx, sy, 70, 6);
                    ctx.restore();
                }

                // Draw truck visuals when active
                if (this.truckActive && this.truckTimer > 0) {
                    let screenX = this.x - camera.x, screenY = this.y - camera.y;
                    ctx.save();
                    // Main truck shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.25)';
                    ctx.beginPath(); ctx.ellipse(screenX, screenY + 28, 58, 18, 0, 0, Math.PI*2); ctx.fill();

                    // Truck body (cab + cargo)
                    ctx.fillStyle = '#ff6b35';
                    ctx.strokeStyle = '#b34724'; ctx.lineWidth = 3;
                    // cargo box
                    ctx.beginPath(); ctx.rect(screenX - 56, screenY - 36, 96, 56); ctx.fill(); ctx.stroke();
                    // cab
                    ctx.beginPath(); ctx.rect(screenX + 26, screenY - 16, 34, 34); ctx.fill(); ctx.stroke();

                    // windows
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(screenX + 30, screenY - 8, 20, 16);

                    // cargo stripes / decal
                    ctx.strokeStyle = 'rgba(255,220,160,0.9)'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(screenX - 46, screenY - 10); ctx.lineTo(screenX + 20, screenY - 10); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(screenX - 46, screenY + 8); ctx.lineTo(screenX + 20, screenY + 8); ctx.stroke();

                    // Grill / headlights
                    ctx.fillStyle = '#333'; ctx.fillRect(screenX + 52, screenY + 2, 10, 8);
                    ctx.fillStyle = '#fff7b2'; ctx.beginPath(); ctx.arc(screenX + 62, screenY + 6, 4, 0, Math.PI*2); ctx.fill();

                    // Truck wheels (bigger)
                    ctx.fillStyle = '#222';
                    ctx.beginPath(); ctx.arc(screenX - 28, screenY + 28, 12, 0, Math.PI*2); ctx.fill();
                    ctx.beginPath(); ctx.arc(screenX + 28, screenY + 28, 12, 0, Math.PI*2); ctx.fill();
                    ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(screenX - 28, screenY + 28, 6, 0, Math.PI*2); ctx.stroke();
                    ctx.beginPath(); ctx.arc(screenX + 28, screenY + 28, 6, 0, Math.PI*2); ctx.stroke();

                    // Speed indicator badge
                    ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
                    ctx.fillText('🚚 x' + this.truckSpeedMult, screenX, screenY - 20);
                    ctx.restore();
                }
            }

            getEffectiveSpeed() { let s = this.speed; if(this.speedsterTimer > 0) s *= 1.5; return s; }
            input(dt, spd) {
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                if (keys.q && !this._qWas) this.skill1();
                if (keys.e && !this._eWas) this.doStunt();
                if (keys.f && !this._fWas) this.doTruck();
                if (keys.r && !this._rWas) this.useGear();
                this._qWas = keys.q;
                this._eWas = keys.e;
                this._fWas = keys.f;
                this._rWas = keys.r;
                if (this.isPlayer) updateHUD(this);
            }
            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        class Steven extends Entity {
            constructor(x, y, p) {
                super(x, y, 20, p ? '#8B008B' : '#660066', 4800);
                this.isPlayer = p; this.countsAsFFAHero = true;
                this.name = p ? 'Player (Steven)' : 'Enemy Steven';
                this.basicCD = 0; this.qCD = 0; this.eCD = 0; this.fCD = 0; this.rCD = 0;

                // Stats & movement
                this.baseSpd = 225; this.speed = this.baseSpd;

                // Passive: Skill Points System
                this.skillPoints = 8;
                this.maxSkillPoints = 8;
                this.skillPointTimer = 0;
                this.skillPointRechargeTime = 3.0; // 3 seconds per point
                
                // Quantum shot tracking
                this.quantumSpeedBuffTimer = 0;
                this.fWindupSlowTimer = 0;
                
                // Magnitude break state
                this.magnitudeBreakActive = false;
                
                // Gear integration
                this.gear = 'speedster'; this.rageTimer = 0; this.speedsterTimer = 0; this.bandageTimer = 0;
                
                // Input debounce variables
                this._qWas = false;
                this._eWas = false;
                this._fWas = false;
                this._rWas = false;
            }

            update(dt) {
                if (this.dead) return;
                this.updateCommon(dt);

                if (this.basicCD > 0) this.basicCD = Math.max(0, this.basicCD - dt);
                if (this.qCD > 0) this.qCD = Math.max(0, this.qCD - dt);
                if (this.eCD > 0) this.eCD = Math.max(0, this.eCD - dt);
                if (this.fCD > 0) this.fCD = Math.max(0, this.fCD - dt);
                if (this.rCD > 0) this.rCD = Math.max(0, this.rCD - dt);

                // Skill point recharge
                if (this.skillPoints < this.maxSkillPoints) {
                    this.skillPointTimer += dt;
                    if (this.skillPointTimer >= this.skillPointRechargeTime) {
                        this.skillPoints = Math.min(this.maxSkillPoints, this.skillPoints + 1);
                        this.skillPointTimer = 0;
                        if (this.isPlayer) addKillMsg('Skill Point Recharged');
                    }
                }

                // Quantum speed buff timer
                if (this.quantumSpeedBuffTimer > 0) {
                    this.quantumSpeedBuffTimer -= dt;
                    if (this.quantumSpeedBuffTimer <= 0) {
                        this.speed = this.baseSpd;
                    }
                }
                if (this.fWindupSlowTimer > 0) {
                    this.fWindupSlowTimer = Math.max(0, this.fWindupSlowTimer - dt);
                    if (this.fWindupSlowTimer <= 0) {
                        this.speed = this.baseSpd;
                    }
                }

                // Gear timers
                if (this.rageTimer > 0) this.rageTimer -= dt;
                if (this.speedsterTimer > 0) this.speedsterTimer -= dt;
                if (this.bandageTimer > 0) this.bandageTimer -= dt;

                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
                let spd = this.getEffectiveSpeed();
                if (this.isPlayer) {
                    this.input(dt, spd);
                    updateHUD(this);
                } else this.ai(dt, spd);
            }

            basicAtk() {
                if (this.basicCD > 0) return; this.basicCD = 1.0;
                // Blade slash attack
                let range = 120; let dmg = 160;
                for (let e of entities) if (e !== this && !e.dead && e instanceof Entity && e.team !== this.team) {
                    let dx = e.x - this.x, dy = e.y - this.y; let d = Math.sqrt(dx*dx + dy*dy);
                    if (d < range) {
                        let ang = Math.atan2(dy, dx); let diff = Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle)));
                        if (diff < Math.PI/4) { // 45 degree arc
                            e.takeDamage(dmg, this);
                            e.x += (dx/d) * 30; e.y += (dy/d) * 30; // small knockback
                        }
                    }
                }
                // Visual effects
                for (let i = 0; i < 8; i++) {
                    let ang = this.angle + (Math.random() - 0.5) * (Math.PI / 2);
                    let dist = 20 + Math.random() * 100;
                    let px = this.x + Math.cos(ang) * dist;
                    let py = this.y + Math.sin(ang) * dist;
                    particles.push(new Particle(px + (Math.random()-0.5)*6, py + (Math.random()-0.5)*6, '#8B008B', 3 + Math.random() * 4, 0.4 + Math.random() * 0.3));
                }
                // Blade flash
                particles.push(new Particle(this.x + Math.cos(this.angle) * 50, this.y + Math.sin(this.angle) * 50, '#FFFFFF', 12, 0.25));
                if (this.isPlayer) {
                    screenShake(4);
                    visualEffects.push(new EnergyWave(this.x, this.y, '#8B008B', 140, 0.4));
                }
            }

            // Q: Crossing Blades (5s)
            skill1() {
                if (this.qCD > 0) return; this.qCD = 5;

                let owner = this;
                let baseAngle = this.angle;

                const createBlade = (startAngle) => {
                    return {
                        x: owner.x + Math.cos(startAngle) * 25,
                        y: owner.y + Math.sin(startAngle) * 25,
                        angle: startAngle,
                        speed: 450,
                        distance: 0,
                        maxDistance: 2000, // longer travel so teleport stays useful
                        damage: 320,
                        owner: owner,
                        penetration: owner.magnitudeBreakActive ? 1 : 0,
                        turnRate: Math.PI * 0.5, // slower turning for a longer curved path
                        other: null,
                        hitEnemies: new Set(),
                        collided: false,
                        collisionTimer: 0,
                        del: false,
                        update: function(dt) {
                            if (this.collided) {
                                // Keep flying after colliding so the blades travel their full range.
                                // The collision effect is already spawned when they first touch.
                                // Once collided we no longer need to curve toward each other.
                                this.other = null;
                            }

                            // Curve toward the other blade for crossing paths (only if still paired)
                            if (this.other) {
                                let desired = Math.atan2(this.other.y - this.y, this.other.x - this.x);
                                let diff = Math.atan2(Math.sin(desired - this.angle), Math.cos(desired - this.angle));
                                let maxTurn = this.turnRate * dt;
                                if (Math.abs(diff) > maxTurn) diff = Math.sign(diff) * maxTurn;
                                this.angle += diff;
                            }

                            this.x += Math.cos(this.angle) * this.speed * dt;
                            this.y += Math.sin(this.angle) * this.speed * dt;
                            this.distance += this.speed * dt;

                            // Blade collision (they slam into each other when crossing paths)
                            if (this.other && !this.other.collided && this.distance > 30 && this.other.distance > 30) {
                                let d = Math.hypot(this.other.x - this.x, this.other.y - this.y);
                                if (d < 25) {
                                    for (let i = 0; i < 15; i++) {
                                        particles.push(new Particle((this.x + this.other.x) / 2 + (Math.random() - 0.5) * 30,
                                                                   (this.y + this.other.y) / 2 + (Math.random() - 0.5) * 30,
                                                                   '#8B008B', 5, 0.8));
                                    }
                                    this.collided = true;
                                    this.other.collided = true;
                                }
                            }

                            // Hit detection
                            for (let e of entities) {
                                if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && !this.hitEnemies.has(e)) {
                                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                                    if (d < 40) {
                                        this.hitEnemies.add(e);
                                        // Apply defense penetration if magnitude break is active
                                        let prevPen = this.owner.penetration || 0;
                                        if (this.owner.magnitudeBreakActive) this.owner.penetration = 1;
                                        e.takeDamage(this.damage, this.owner);
                                        if (this.owner.magnitudeBreakActive) this.owner.penetration = prevPen;

                                        e.applyStatus('slowness', 1.5, this.owner);
                                        this.owner.skillPoints = Math.min(this.owner.maxSkillPoints, (this.owner.skillPoints || 0) + 1);

                                        // Teleport to first hit point if magnitude break is active
                                        if (this.owner.magnitudeBreakActive) {
                                            this.owner.x = this.x;
                                            this.owner.y = this.y;
                                            this.owner.magnitudeBreakActive = false;
                                            this.owner.invulnerableTimer = 1.0;
                                            for (let i = 0; i < 12; i++) {
                                                particles.push(new Particle(this.owner.x + (Math.random() - 0.5) * 60, this.owner.y + (Math.random() - 0.5) * 60, '#FFD700', 6, 1));
                                            }
                                            if (this.owner.isPlayer) addKillMsg('Magnitude Break: Teleported!');
                                        }

                                        // Visual hit
                                        for (let i = 0; i < 6; i++) {
                                            particles.push(new Particle(e.x + (Math.random() - 0.5) * 40, e.y + (Math.random() - 0.5) * 40, '#8B008B', 4, 0.6));
                                        }
                                    }
                                }
                            }

                            if (this.distance >= this.maxDistance) this.del = true;
                        },
                        draw: function(ctx) {
                            let screenX = this.x - camera.x, screenY = this.y - camera.y;
                            ctx.save();
                            ctx.translate(screenX, screenY);
                            ctx.rotate(this.angle);
                            // Blade shape
                            ctx.fillStyle = '#8B008B';
                            ctx.fillRect(-20, -3, 40, 6);
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(-15, -1, 30, 2);
                            ctx.restore();
                        }
                    };
                };

                // Position blades so they start slightly spread and then curve inward for a longer cross range
                // (keeps the launch direction consistent while still giving a wider path)
                let blade1Angle = baseAngle + Math.PI / 4; // 45° spread
                let blade2Angle = baseAngle - Math.PI / 4; // -45° spread

                let blade1 = createBlade(blade1Angle);
                let blade2 = createBlade(blade2Angle);
                blade1.other = blade2;
                blade2.other = blade1;

                // Blades start at player position
                blade1.x = this.x;
                blade1.y = this.y;
                blade2.x = this.x;
                blade2.y = this.y;

                if (typeof projectiles !== 'undefined') {
                    projectiles.push(blade1);
                    projectiles.push(blade2);
                } else {
                    entities.push(blade1);
                    entities.push(blade2);
                }

                // Cast effect
                for (let i = 0; i < 12; i++) {
                    particles.push(new Particle(this.x, this.y, '#8B008B', 5, 0.8));
                }

                // If magnitude break was active but not used, clear it after a short window
                if (this.magnitudeBreakActive) {
                    setTimeout(() => { this.magnitudeBreakActive = false; }, 4000);
                }
            }

            // E: Quantum Shot (12s)
            doQuantumShot() {
                if (this.eCD > 0) return;

                // Spend skill points to empower the shot
                let isEnhanced = false;
                if (this.skillPoints >= 2) {
                    this.skillPoints -= 2;
                    isEnhanced = true;
                    if (this.isPlayer) addKillMsg('Spent 2 Skill Points: Enhanced Quantum!');
                }

                this.eCD = 12;

                // Enhanced windup phase (0.4s) with quantum effects
                let windupTime = 0.4;
                let windupParticles = 0;
                let windupInterval = setInterval(() => {
                    if (this.dead) { clearInterval(windupInterval); return; }
                    
                    // Quantum energy gathering
                    for (let i = 0; i < 12; i++) {
                        let angle = (Math.PI * 2 * i / 12) + (windupParticles * 0.15);
                        let dist = 20 + windupParticles * 3;
                        particles.push(new Particle(
                            this.x + Math.cos(angle) * dist,
                            this.y + Math.sin(angle) * dist,
                            isEnhanced ? '#00FFFF' : '#8B008B', 4, 0.8
                        ));
                    }
                    
                    // Pulsing quantum waves
                    if (windupParticles % 2 === 0) {
                        visualEffects.push(new EnergyWave(this.x, this.y, isEnhanced ? '#00FFFF' : '#8B008B', 40 + windupParticles * 8, 0.4));
                    }
                    
                    // Quantum field distortion
                    if (windupParticles % 4 === 0) {
                        for (let i = 0; i < 6; i++) {
                            let randAngle = Math.random() * Math.PI * 2;
                            let randDist = Math.random() * 60;
                            particles.push(new Particle(
                                this.x + Math.cos(randAngle) * randDist,
                                this.y + Math.sin(randAngle) * randDist,
                                isEnhanced ? '#00FFFF' : '#8B008B', 2, 1.2
                            ));
                        }
                    }
                    
                    windupParticles++;
                }, 40);

                setTimeout(() => {
                    clearInterval(windupInterval);
                    if (this.dead) return;

                    let damage = isEnhanced ? 1000 : 900;
                    let healAmount = 450;

                    // Create quantum arrow projectile with enhanced effects
                    let arrow = {
                        x: this.x + Math.cos(this.angle) * 25,
                        y: this.y + Math.sin(this.angle) * 25,
                        angle: this.angle,
                        speed: 1400, // faster arrow
                        distance: 0,
                        maxDistance: 1300,
                        damage: damage,
                        healAmount: healAmount,
                        owner: this,
                        isEnhanced: isEnhanced,
                        hitEnemies: [],
                        del: false,
                        trailParticles: 0,
                        update: function(dt) {
                            this.x += Math.cos(this.angle) * this.speed * dt;
                            this.y += Math.sin(this.angle) * this.speed * dt;
                            this.distance += this.speed * dt;

                            // Quantum trail effect
                            this.trailParticles += dt * 20;
                            while (this.trailParticles >= 1) {
                                particles.push(new Particle(
                                    this.x + (Math.random() - 0.5) * 20,
                                    this.y + (Math.random() - 0.5) * 20,
                                    this.isEnhanced ? '#00FFFF' : '#8B008B', 3, 0.6
                                ));
                                this.trailParticles--;
                            }

                            // Hit detection
                            for (let e of entities) {
                                if (e !== this.owner && !e.dead && e instanceof Entity && e.team !== this.owner.team && !this.hitEnemies.includes(e)) {
                                    let d = Math.sqrt((e.x - this.x)**2 + (e.y - this.y)**2);
                                    if (d < 45) {
                                        e.takeDamage(this.damage, this.owner);
                                        this.hitEnemies.push(e);

                                        // Enhanced effects
                                        if (this.isEnhanced) {
                                            // Speed boost for owner
                                            this.owner.quantumSpeedBuffTimer = 1.0;
                                            this.owner.speed = this.owner.baseSpd * 2;
                                            if (this.owner.isPlayer) addKillMsg('Quantum Surge! 2x Speed');
                                        }

                                        // Heal owner
                                        this.owner.hp = Math.min(this.owner.maxHp, this.owner.hp + this.healAmount);
                                        if (this.owner.isPlayer) addKillMsg('Quantum Energy +' + this.healAmount + ' HP');

                                        // Enhanced quantum explosion
                                        for (let i = 0; i < 25; i++) {
                                            particles.push(new Particle(e.x + (Math.random()-0.5)*80, e.y + (Math.random()-0.5)*80, 
                                                this.isEnhanced ? '#00FFFF' : '#8B008B', 8, 1.2));
                                        }
                                        visualEffects.push(new ImpactFlash(e.x, e.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 80));
                                        visualEffects.push(new EnergyWave(e.x, e.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 120, 0.8));

                                        // Quantum field expansion
                                        for (let i = 0; i < 16; i++) {
                                            let angle = (i / 16) * Math.PI * 2;
                                            let dist = 40;
                                            particles.push(new Particle(
                                                e.x + Math.cos(angle) * dist,
                                                e.y + Math.sin(angle) * dist,
                                                this.isEnhanced ? '#00FFFF' : '#8B008B', 5, 1.0
                                            ));
                                        }

                                        // If enhanced and hit enemy, instantly recharge
                                        if (this.isEnhanced && this.hitEnemies.length > 0) {
                                            this.owner.eCD = 0;
                                            if (this.owner.isPlayer) addKillMsg('Quantum Shot Recharged!');
                                        }

                                        // Explosion on hit and stop moving
                                        this.explode();
                                        this.del = true;
                                        break;
                                    }
                                }
                            }

                            if (this.distance >= this.maxDistance) {
                                this.explode();
                                this.del = true;
                            }
                        },
                        explode: function() {
                            // Enhanced quantum explosion effect
                            for (let i = 0; i < 30; i++) {
                                let angle = (i / 30) * Math.PI * 2;
                                let dist = Math.random() * 100;
                                particles.push(new Particle(this.x + Math.cos(angle) * dist, this.y + Math.sin(angle) * dist, 
                                    this.isEnhanced ? '#00FFFF' : '#8B008B', 5, 1.5));
                            }
                            visualEffects.push(new EnergyWave(this.x, this.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 150, 1.0));
                            
                            // Quantum field rings
                            for (let ring = 0; ring < 3; ring++) {
                                setTimeout(() => {
                                    if (this.owner && !this.owner.dead) {
                                        visualEffects.push(new EnergyWave(this.x, this.y, this.isEnhanced ? '#00FFFF' : '#8B008B', 50 + ring * 30, 0.6));
                                    }
                                }, ring * 100);
                            }
                        },
                        draw: function(ctx) {
                            let screenX = this.x - camera.x, screenY = this.y - camera.y;
                            ctx.save();
                            ctx.translate(screenX, screenY);
                            ctx.rotate(this.angle);

                            // Enhanced arrow shaft with glow
                            ctx.shadowColor = this.isEnhanced ? '#00FFFF' : '#8B008B';
                            ctx.shadowBlur = 15;
                            ctx.fillStyle = this.isEnhanced ? '#00FFFF' : '#8B008B';
                            ctx.fillRect(-25, -2, 50, 4);

                            // Arrow head
                            ctx.beginPath();
                            ctx.moveTo(25, 0);
                            ctx.lineTo(15, -8);
                            ctx.lineTo(15, 8);
                            ctx.closePath();
                            ctx.fill();

                            // Quantum energy field
                            ctx.shadowBlur = 0;
                            ctx.fillStyle = this.isEnhanced ? 'rgba(0, 255, 255, 0.5)' : 'rgba(139, 0, 139, 0.5)';
                            ctx.fillRect(-30, -8, 60, 16);

                            // Inner energy core
                            ctx.fillStyle = this.isEnhanced ? 'rgba(0, 255, 255, 0.8)' : 'rgba(139, 0, 139, 0.8)';
                            ctx.fillRect(-20, -3, 40, 6);

                            ctx.restore();
                        }
                    };

                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(arrow);
                    } else {
                        entities.push(arrow);
                    }

                    // Enhanced cast effect
                    for (let i = 0; i < 20; i++) {
                        particles.push(new Particle(this.x, this.y, isEnhanced ? '#00FFFF' : '#8B008B', 7, 1.0));
                    }
                    visualEffects.push(new EnergyWave(this.x, this.y, isEnhanced ? '#00FFFF' : '#8B008B', 120, 0.6));

                }, windupTime * 1000); // 0.4s delay
            }

            // F: Magnitude Break (24s)
            doMagnitudeBreak() {
                if (this.fCD > 0) return; this.fCD = 24;
                
                this.fWindupSlowTimer = 0.6;
                this.speed = this.baseSpd;
                
                // Enhanced windup phase (0.6s) with magnitude buildup
                let windupTime = 0.6;
                let windupParticles = 0;
                let windupInterval = setInterval(() => {
                    if (this.dead) { clearInterval(windupInterval); return; }
                    
                    // Magnitude energy gathering - golden energy spheres
                    for (let i = 0; i < 16; i++) {
                        let angle = (Math.PI * 2 * i / 16) + (windupParticles * 0.1);
                        let dist = 25 + windupParticles * 4;
                        particles.push(new Particle(
                            this.x + Math.cos(angle) * dist,
                            this.y + Math.sin(angle) * dist,
                            '#FFD700', 5, 1.2
                        ));
                    }
                    
                    // Pulsing magnitude waves
                    if (windupParticles % 3 === 0) {
                        visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 60 + windupParticles * 10, 0.5));
                    }
                    
                    // Golden shockwaves
                    if (windupParticles % 5 === 0) {
                        for (let i = 0; i < 8; i++) {
                            let randAngle = Math.random() * Math.PI * 2;
                            let randDist = Math.random() * 80;
                            particles.push(new Particle(
                                this.x + Math.cos(randAngle) * randDist,
                                this.y + Math.sin(randAngle) * randDist,
                                '#FFD700', 3, 1.5
                            ));
                        }
                    }
                    
                    windupParticles++;
                }, 40);

                setTimeout(() => {
                    clearInterval(windupInterval);
                    if (this.dead) return;
                    
                    // Clear all immobilizing effects
                    this.stunTimer = 0;
                    this.freezeTimer = 0;
                    // Clear any other immobilizing effects here
                    
                    this.magnitudeBreakActive = true;
                    
                    // Q ability gets 100% defense penetration and teleport
                    // This will be applied when Q is next used
                    
                    // Enhanced magnitude break visual effect
                    for (let i = 0; i < 35; i++) {
                        particles.push(new Particle(this.x + (Math.random()-0.5)*120, this.y + (Math.random()-0.5)*120, '#FFD700', 10, 2.0));
                    }
                    visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 200, 1.2));
                    
                    // Magnitude field expansion - multiple rings
                    for (let ring = 0; ring < 4; ring++) {
                        setTimeout(() => {
                            if (this && !this.dead) {
                                visualEffects.push(new EnergyWave(this.x, this.y, '#FFD700', 80 + ring * 40, 0.8));
                            }
                        }, ring * 150);
                    }
                    
                    // Golden energy pillars
                    for (let i = 0; i < 12; i++) {
                        let angle = (i / 12) * Math.PI * 2;
                        let dist = 100;
                        for (let j = 0; j < 8; j++) {
                            setTimeout(() => {
                                if (this && !this.dead) {
                                    particles.push(new Particle(
                                        this.x + Math.cos(angle) * dist,
                                        this.y + Math.sin(angle) * dist,
                                        '#FFD700', 6, 1.0
                                    ));
                                }
                            }, j * 50);
                        }
                    }
                    
                    if (this.isPlayer) addKillMsg('Magnitude Break! Effects cleared, Q enhanced');
                }, windupTime * 1000);
            }

            input(dt, spd) {
                if (this.stunTimer > 0 || this.freezeTimer > 0) { if (this.isPlayer) updateHUD(this); return; }
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
                if (keys.q && !this._qWas) this.skill1();
                if (keys.e && !this._eWas) this.doQuantumShot();
                if (keys.f && !this._fWas) this.doMagnitudeBreak();
                if (keys.r && !this._rWas) this.useGear();
                this._qWas = keys.q;
                this._eWas = keys.e;
                this._fWas = keys.f;
                this._rWas = keys.r;
                if (this.isPlayer) updateHUD(this);
            }

            getEffectiveSpeed() { 
                let s = this.speed; 
                if (this.fWindupSlowTimer > 0) s *= 0.75;
                if (this.speedsterTimer > 0) s *= 1.5; 
                return s; 
            }
            
            getDamageMult() {
                return this.rageTimer > 0 ? 1.15 : 1;
            }

            draw(ctx) {
                super.draw(ctx);
                
                // Draw skill point indicator
                if (this.isPlayer) {
                    let barX = 20, barY = CANVAS.height - 60;
                    let barWidth = 200, barHeight = 20;
                    
                    // Background
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    // Skill points
                    ctx.fillStyle = '#FFD700';
                    let pointWidth = barWidth / this.maxSkillPoints;
                    for (let i = 0; i < this.skillPoints; i++) {
                        ctx.fillRect(barX + i * pointWidth + 2, barY + 2, pointWidth - 4, barHeight - 4);
                    }
                    
                    // Border
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(barX, barY, barWidth, barHeight);
                    
                    // Label
                    ctx.fillStyle = '#FFFFFF';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('SKILL POINTS', barX + barWidth/2, barY - 5);
                }
            }

            useGear() {
                if (typeof Entity.prototype.useGear === 'function') {
                    return Entity.prototype.useGear.call(this);
                }
            }
        }

        // Master list of ALL heroes - single source of truth for hero system
        // This is defined HERE after all hero classes are fully defined (line 20383+ for Austin)
        // This makes the system future-proof: add a hero here and it works everywhere
        // FUTURE-PROOF HERO LOOKUP: Dynamically find hero classes without hardcoded registry
        // This works for ANY new hero added - just define the class and use it!
        if(document.readyState==='complete'||document.readyState==='interactive'){init();initializeStatAnimations();}else document.addEventListener('DOMContentLoaded',()=>{init();initializeStatAnimations();});

        // Online FFA functionality
