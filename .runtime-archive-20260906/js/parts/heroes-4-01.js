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
            } else if(p instanceof Jimeka || p instanceof Buster || p instanceof Noli || p instanceof Kai || p instanceof Kaiser || p instanceof Ming || p instanceof Gamb || p instanceof Neo || p instanceof Chimera || p instanceof Ash || p instanceof RacingDuo || p instanceof Vival || p instanceof Dayum || p instanceof BountyHunter || p instanceof Cornelius || p instanceof Twins || p instanceof Guest || p instanceof Trent || p instanceof Max) {
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
                // Update projectiles (Trent's F ability)
                if(window.projectiles) {
                    for(let i=window.projectiles.length-1;i>=0;i--){try{window.projectiles[i].update(dt);}catch(err){console.error('projectile.update error',err);}if(window.projectiles[i].del)window.projectiles.splice(i,1);}
                }
                // Update world zones (Twins zone damage)
                if(window.worldZones) {
                    for(let i=window.worldZones.length-1;i>=0;i--){
                        try{window.worldZones[i].update(dt);}catch(err){console.error('worldZone.update error',err);}
                        if(window.worldZones[i].duration <= 0) window.worldZones.splice(i,1);
                    }
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
                                
                                console.log(`👤 Drew player ${otherPlayer.name} at screen (${screenX}, ${screenY})`);
                            }
                        }
                    }
                    
                    // Draw entities from other online players (projectiles, sentries, tripmines)
                    if(window.onlineEntities && gameMode === 'ffa_online') {
                        // Log entity data once every 3 seconds for debugging
                        let now = Date.now();
                        let entitiesLogTime = window.entitiesLogTime || 0;
                        if(now - entitiesLogTime > 3000) {
                            console.log('🎯 Online entities data:', window.onlineEntities);
                            window.entitiesLogTime = now;
                        }
                        
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

