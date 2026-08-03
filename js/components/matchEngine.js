/* ─────────────────────────────────────────────────────────────────────────────
   EA Sports FC 26 Real-Time Multi-Agent AI Match Engine v5.1 (Bug Fix & Polish)
   
   Bug Fixes & Improvements:
     • Single-Trigger Goal Detection (guarantees score increases by exactly 1 per goal)
     • Goal Cooldown & Kickoff Reset Lock (prevents 60FPS multi-increment bug)
     • Realistic Shot & Goal Probability Engine (authentic football scores, e.g. 2-1, 1-0)
     • Out-of-Bounds & Goal Kick Reset Mechanics
     • Smooth Multi-Agent Player AI (Dribbling, Passing, Pressing, Shooting, GK Diving)
   ───────────────────────────────────────────────────────────────────────────── */





// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    const rad = Math.min(r, Math.min(w, h) / 2);
    this.beginPath();
    this.moveTo(x + rad, y);
    this.arcTo(x + w, y, x + w, y + h, rad);
    this.arcTo(x + w, y + h, x, y + h, rad);
    this.arcTo(x, y + h, x, y, rad);
    this.arcTo(x, y, x + w, y, rad);
    this.closePath();
    return this;
  };
}

const W = 840, H = 450;
const PITCH_M = 18;
const GOAL_TOP = H / 2 - 42;
const GOAL_BOT = H / 2 + 42;
const MAX_COMM = 35;

class LiveMatchEngine {
  constructor(canvasId, fixture, onMatchFinished) {
    this.canvasId   = canvasId;
    this.fixture    = fixture;
    this.onFinished = onMatchFinished;
    this.canvas     = document.getElementById(canvasId);

    this.home = fixture.homeClub;
    this.away = fixture.awayClub;

    // Match State
    this.homeScore = 0;
    this.awayScore = 0;
    this.minute    = 0;
    this.running   = false;
    this.speed     = 1;
    this.mentality = 'balanced';

    // Possession & Stats
    this.homePossTicks  = 0;
    this.awayPossTicks  = 0;
    this.possessionSide = 'home';
    this.commentary     = [];
    this.goalEvents     = [];
    this.stats = {
      home: { shots: 0, sot: 0, xG: 0, saves: 0, corners: 0, fouls: 0 },
      away: { shots: 0, sot: 0, xG: 0, saves: 0, corners: 0, fouls: 0 },
    };

    // Goal Lock Flag to prevent multi-trigger
    this.isGoalCooldown = false;

    // Loops & Timers
    this._rafId        = null;
    this._simTimerId   = null;
    this.goalFlashTime = 0;
    this.goalFlashSide = null;

    this._setupCanvas();
    this._initMatch();
    this._drawFrame();
  }

  _setupCanvas() {
    if (!this.canvas) return;
    this.canvas.width  = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');
  }

  // ─── Match & Player AI Initialization ──────────────────────────────────────
  _initMatch() {
    this.isGoalCooldown = false;

    const mkPlayer = (role, side, num, bx, by, posName) => {
      let name = posName || role;
      const clubId = side === 'home' ? this.home.id : this.away.id;
      if (side === 'home' && state.starters?.length) {
        const match = state.starters.find(p => p.pos === role || p.pos === posName);
        if (match) name = match.name.split(' ').pop();
      } else {
        const pool = INITIAL_PLAYERS.filter(p => p.clubId === clubId && p.pos === role);
        if (pool.length) name = pool[0].name.split(' ').pop();
      }

      return {
        id: `${side}_${num}_${role}`,
        role, side, num, name,
        x: bx, y: by,
        bx, by,
        vx: 0, vy: 0,
        facing: side === 'home' ? 0 : Math.PI,
        maxSpeed: role === 'ST' || role === 'LW' || role === 'RW' ? 2.6 : role === 'GK' ? 1.8 : 2.1,
        actionTimer: Math.floor(Math.random() * 15),
        state: 'IDLE',
      };
    };

    // Home Team 4-3-3 (Attacking Right ->)
    this.homePlayers = [
      mkPlayer('GK',  'home', 1,  PITCH_M + 25,  H / 2, 'GK'),
      mkPlayer('LB',  'home', 3,  PITCH_M + 130, H * 0.15, 'LB'),
      mkPlayer('CB',  'home', 4,  PITCH_M + 115, H * 0.38, 'CB'),
      mkPlayer('CB',  'home', 5,  PITCH_M + 115, H * 0.62, 'CB'),
      mkPlayer('RB',  'home', 2,  PITCH_M + 130, H * 0.85, 'RB'),
      mkPlayer('CM',  'home', 8,  PITCH_M + 250, H * 0.28, 'CM'),
      mkPlayer('CDM', 'home', 6,  PITCH_M + 220, H / 2,    'CDM'),
      mkPlayer('CM',  'home', 10, PITCH_M + 250, H * 0.72, 'CM'),
      mkPlayer('LW',  'home', 7,  PITCH_M + 380, H * 0.18, 'LW'),
      mkPlayer('ST',  'home', 9,  PITCH_M + 400, H / 2,    'ST'),
      mkPlayer('RW',  'home', 11, PITCH_M + 380, H * 0.82, 'RW'),
    ];

    // Away Team 4-3-3 (Attacking Left <-)
    this.awayPlayers = [
      mkPlayer('GK',  'away', 1,  W - PITCH_M - 25,  H / 2, 'GK'),
      mkPlayer('LB',  'away', 3,  W - PITCH_M - 130, H * 0.85, 'LB'),
      mkPlayer('CB',  'away', 4,  W - PITCH_M - 115, H * 0.62, 'CB'),
      mkPlayer('CB',  'away', 5,  W - PITCH_M - 115, H * 0.38, 'CB'),
      mkPlayer('RB',  'away', 2,  W - PITCH_M - 130, H * 0.15, 'RB'),
      mkPlayer('CM',  'away', 8,  W - PITCH_M - 250, H * 0.72, 'CM'),
      mkPlayer('CDM', 'away', 6,  W - PITCH_M - 220, H / 2,    'CDM'),
      mkPlayer('CM',  'away', 10, W - PITCH_M - 250, H * 0.28, 'CM'),
      mkPlayer('LW',  'away', 7,  W - PITCH_M - 380, H * 0.85, 'LW'),
      mkPlayer('ST',  'away', 9,  W - PITCH_M - 400, H / 2,    'ST'),
      mkPlayer('RW',  'away', 11, W - PITCH_M - 380, H * 0.18, 'RW'),
    ];

    // Ball Simulation State
    const initialOwner = Math.random() > 0.5 ? this.homePlayers[6] : this.awayPlayers[6];
    this.ball = {
      x: initialOwner.x + 8, y: initialOwner.y, z: 0,
      vx: 0, vy: 0, vz: 0,
      owner: initialOwner,
      state: 'CARRIED',
    };
  }

  // ─── Public Controls ───────────────────────────────────────────────────────
  start() {
    if (this.running) return;
    this._resetMatch();
    this.running = true;
    state.playSound?.('whistle');
    this._addComm(`⚽ KICK-OFF! ${this.home.name} vs ${this.away.name}`, 'kickoff');
    this._startSimLoop();
    this._startRenderLoop();
  }

  stop() {
    this.running = false;
    if (this._simTimerId) { clearInterval(this._simTimerId); this._simTimerId = null; }
    if (this._rafId)      { cancelAnimationFrame(this._rafId);  this._rafId = null; }
  }

  setMentality(m) {
    if (this.mentality === m) return;
    this.mentality = m;
    const labels = { defensive: '🛡 DEFENSIVE', balanced: '⚖ BALANCED', attacking: '⚡ ATTACKING' };
    this._addComm(`Tactical switch → ${labels[m]}`, 'tactic');
  }

  setSpeed(s) {
    if (s === 0) {
      this.running = false;
      if (this._simTimerId) { clearInterval(this._simTimerId); this._simTimerId = null; }
      this._addComm(`⏸ MATCH PAUSED`, 'tactic');
    } else {
      this.speed = s;
      const wasRunning = this.running;
      this.running = true;
      if (!wasRunning) {
        this._startSimLoop();
        this._startRenderLoop();
      } else {
        this._startSimLoop();
      }
    }
  }


  _resetMatch() {
    this.minute        = 0;
    this.homeScore     = 0;
    this.awayScore     = 0;
    this.homePossTicks = 0;
    this.awayPossTicks = 0;
    this.possessionSide = 'home';
    this.commentary    = [];
    this.goalEvents    = [];
    this.stats = {
      home: { shots: 0, sot: 0, xG: 0, saves: 0, corners: 0, fouls: 0 },
      away: { shots: 0, sot: 0, xG: 0, saves: 0, corners: 0, fouls: 0 },
    };
    this.isGoalCooldown = false;
    this._initMatch();
  }

  _startSimLoop() {
    if (this._simTimerId) clearInterval(this._simTimerId);
    const msMap = { 1: 1000, 2: 400, 3: 150, 4: 60 };
    this._simTimerId = setInterval(() => this._simMinuteTick(), msMap[this.speed] || 1000);
  }

  _startRenderLoop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    const loop = () => {
      if (!this.running) return;
      this._updateEngineAI();
      this._drawFrame();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  // ─── Match Clock Minute Tick ───────────────────────────────────────────────
  _simMinuteTick() {
    if (!this.running) return;
    this.minute++;

    // Trigger interactive key decision moments at minute 24, 62, and 81
    if (this.minute === 24 || this.minute === 62 || this.minute === 81) {
      this.triggerInteractiveMoment();
      return;
    }

    if (this.ball.owner) {
      if (this.ball.owner.side === 'home') {
        this.homePossTicks++;
        this.possessionSide = 'home';
      } else {
        this.awayPossTicks++;
        this.possessionSide = 'away';
      }
    }

    if (this.minute === 45) {
      this._addComm(`🔔 HALF-TIME — ${this.home.name} ${this.homeScore}–${this.awayScore} ${this.away.name}`, 'halftime');
    } else if (this.minute >= 90) {
      this._finishMatch();
      return;
    }

    this._updateUI();
  }

  // ─── Interactive Key Moment Decision Engine ───────────────────────────────
  triggerInteractiveMoment() {
    this.running = false;
    this.isGoalCooldown = true;
    if (this._simTimerId) { clearInterval(this._simTimerId); this._simTimerId = null; }
    const modal = document.getElementById('matchDecisionModal');
    if (!modal) return;

    const isAttacking = Math.random() < 0.60;
    const minute = this.minute;

    const starters = state.starters && state.starters.length ? state.starters : [];
    const attacker = starters.find(p => ['ST', 'LW', 'RW', 'CAM', 'CF'].includes(p.pos)) || starters[0] || { name: 'Forward', ovr: 82, pos: 'ST' };
    const defender = starters.find(p => ['GK'].includes(p.pos)) || { name: 'Goalkeeper', ovr: 84, pos: 'GK' };

    let eventType = isAttacking ? 'ATTACK_SHOT' : 'GK_SAVE';
    if (Math.random() < 0.20) eventType = 'PENALTY_KICK';

    const mdBadge = document.getElementById('mdBadge');
    const mdMinute = document.getElementById('mdMinute');
    const mdTitle = document.getElementById('mdTitle');
    const mdSubtitle = document.getElementById('mdSubtitle');
    const mdPlayerName = document.getElementById('mdPlayerName');
    const mdPlayerStats = document.getElementById('mdPlayerStats');
    const mdChancePercent = document.getElementById('mdChancePercent');
    const mdGrid = document.getElementById('mdGridContainer');
    const mdBanner = document.getElementById('mdResultBanner');

    if (mdMinute) mdMinute.textContent = `${minute}'`;
    if (mdBanner) mdBanner.style.display = 'none';

    let baseProb = 0.70;
    let targetOptions = [];

    if (eventType === 'ATTACK_SHOT') {
      baseProb = Math.min(0.88, Math.max(0.45, (attacker.ovr - 50) / 45));
      if (mdBadge) mdBadge.innerHTML = `⚽ BIG GOAL CHANCE • ${minute}'`;
      if (mdTitle) mdTitle.textContent = `1-on-1 Goal Chance! Choose Shot Placement`;
      if (mdSubtitle) mdSubtitle.textContent = `${attacker.name} breaks past defender into the 18-yard box! Where should he shoot?`;
      if (mdPlayerName) mdPlayerName.textContent = attacker.name;
      if (mdPlayerStats) mdPlayerStats.textContent = `${attacker.pos} • ${attacker.ovr} OVR • Shooting Power`;
      if (mdChancePercent) mdChancePercent.textContent = `${Math.round(baseProb * 100)}% Base`;

      targetOptions = [
        { label: '🎯 Top-Left Corner', probMod: 1.15, text: 'Top-Left Corner Finesse' },
        { label: '🎯 Top-Right Corner', probMod: 1.15, text: 'Top-Right Top Shelf' },
        { label: '⚽ Low Driven Left', probMod: 1.05, text: 'Low Driven Shot' },
        { label: '⚽ Low Driven Right', probMod: 1.05, text: 'Low Bottom Corner' },
        { label: '🚀 Power Center Strike', probMod: 0.95, text: 'Central Power Blast' },
        { label: '👟 Delicate Chip', probMod: 0.85, text: 'Over GK Chip' }
      ];
    } else if (eventType === 'GK_SAVE') {
      baseProb = Math.min(0.85, Math.max(0.40, (defender.ovr - 50) / 45));
      if (mdBadge) mdBadge.innerHTML = `🧤 DEFENSIVE EMERGENCY • ${minute}'`;
      if (mdTitle) mdTitle.textContent = `Direct ${defender.name} to Make the Save!`;
      if (mdSubtitle) mdSubtitle.textContent = `Opposing striker fires a rocket toward goal! Direct your Goalkeeper:`;
      if (mdPlayerName) mdPlayerName.textContent = defender.name;
      if (mdPlayerStats) mdPlayerStats.textContent = `${defender.pos} • ${defender.ovr} OVR • Diving & Reflexes`;
      if (mdChancePercent) mdChancePercent.textContent = `${Math.round(baseProb * 100)}% Save`;

      targetOptions = [
        { label: '🧤 Full Extension Dive Left', probMod: 1.10, text: 'Leaping Left Save' },
        { label: '🧤 Full Extension Dive Right', probMod: 1.10, text: 'Leaping Right Save' },
        { label: '🧤 Stand Ground & Reflex Block', probMod: 1.00, text: 'Reflex Block' },
        { label: '🧤 Rush Out & Smother', probMod: 0.90, text: 'Aggressive Smother' }
      ];
    } else {
      baseProb = 0.82;
      if (mdBadge) mdBadge.innerHTML = `🎯 PENALTY SPOT KICK • ${minute}'`;
      if (mdTitle) mdTitle.textContent = `Penalty Kick Awarded!`;
      if (mdSubtitle) mdSubtitle.textContent = `${attacker.name} steps up to take the penalty kick! Choose target placement:`;
      if (mdPlayerName) mdPlayerName.textContent = attacker.name;
      if (mdPlayerStats) mdPlayerStats.textContent = `${attacker.pos} • ${attacker.ovr} OVR • Penalty Taker`;
      if (mdChancePercent) mdChancePercent.textContent = `82% Penalty Rate`;

      targetOptions = [
        { label: '🎯 Top Corner Left', probMod: 1.10, text: 'Top Left Penalty' },
        { label: '🎯 Top Corner Right', probMod: 1.10, text: 'Top Right Penalty' },
        { label: '⚽ Low Driven Left', probMod: 1.00, text: 'Bottom Left Spot Kick' },
        { label: '⚽ Low Driven Right', probMod: 1.00, text: 'Bottom Right Spot Kick' },
        { label: '👑 Panenka Center Chip', probMod: 0.85, text: 'Panenka Chip Center' }
      ];
    }

    if (mdGrid) {
      mdGrid.innerHTML = targetOptions.map((opt, idx) => `
        <button class="btn-secondary md-target-btn" data-idx="${idx}" style="padding: 1rem 0.5rem; font-size: 0.84rem; font-weight: 800; border-radius: 8px; background: rgba(0,0,0,0.5); border: 1px solid rgba(0,255,137,0.3); color: #fff; cursor: pointer; transition: transform 0.15s ease, background 0.15s ease;">
          ${opt.label}
        </button>
      `).join('');

      mdGrid.querySelectorAll('.md-target-btn').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.idx);
          const choice = targetOptions[idx];
          const finalProb = Math.min(0.95, baseProb * choice.probMod);
          const success = Math.random() < finalProb;

          if (mdGrid) mdGrid.style.pointerEvents = 'none';

          if (eventType === 'ATTACK_SHOT' || eventType === 'PENALTY_KICK') {
            if (success) {
              this.homeScore++;
              this.stats.home.shots++;
              this.stats.home.sot++;
              this.stats.home.xG += 0.65;
              this.goalEvents.push({ minute, side: 'home', scorer: attacker.name, home: this.homeScore, away: this.awayScore });
              this._addComm(`⚽ GOAL! ${attacker.name} strikes with precision (${choice.text})! (${this.homeScore}–${this.awayScore})`, 'goal');
              state.playSound?.('goal');

              if (mdBanner) {
                mdBanner.style.display = 'block';
                mdBanner.style.background = 'rgba(0, 255, 137, 0.2)';
                mdBanner.style.color = 'var(--accent-lime)';
                mdBanner.style.border = '1px solid rgba(0, 255, 137, 0.4)';
                mdBanner.innerHTML = `⚽ GOAL! ${attacker.name} scores fantastic ${choice.text}!`;
              }
            } else {
              this.stats.home.shots++;
              this.stats.home.sot++;
              this._addComm(`💨 SAVED! Opposing keeper denies ${attacker.name}'s ${choice.text}!`, 'miss');
              state.playSound?.('whistle');

              if (mdBanner) {
                mdBanner.style.display = 'block';
                mdBanner.style.background = 'rgba(255, 50, 80, 0.2)';
                mdBanner.style.color = '#ff4d6d';
                mdBanner.style.border = '1px solid rgba(255, 50, 80, 0.4)';
                mdBanner.innerHTML = `🧤 SAVED! Opposing Goalkeeper turns away the strike!`;
              }
            }
          } else {
            // GK SAVE EVENT
            if (success) {
              this.stats.away.shots++;
              this.stats.away.sot++;
              this.stats.home.saves++;
              this._addComm(`🧤 WHAT A SAVE! ${defender.name} pulls off incredible ${choice.text}!`, 'save');
              state.playSound?.('whistle');

              if (mdBanner) {
                mdBanner.style.display = 'block';
                mdBanner.style.background = 'rgba(0, 240, 255, 0.2)';
                mdBanner.style.color = 'var(--accent-cyan)';
                mdBanner.style.border = '1px solid rgba(0, 240, 255, 0.4)';
                mdBanner.innerHTML = `🧤 OUTSTANDING SAVE! ${defender.name} denies the goal!`;
              }
            } else {
              this.awayScore++;
              this.stats.away.shots++;
              this.stats.away.sot++;
              this.stats.away.xG += 0.55;
              this.goalEvents.push({ minute, side: 'away', scorer: 'Opponent Striker', home: this.homeScore, away: this.awayScore });
              this._addComm(`⚽ GOAL CONCEDED! Opponent scores despite ${defender.name}'s attempt! (${this.homeScore}–${this.awayScore})`, 'goal');
              state.playSound?.('goal');

              if (mdBanner) {
                mdBanner.style.display = 'block';
                mdBanner.style.background = 'rgba(255, 50, 80, 0.2)';
                mdBanner.style.color = '#ff4d6d';
                mdBanner.style.border = '1px solid rgba(255, 50, 80, 0.4)';
                mdBanner.innerHTML = `⚽ GOAL CONCEDED! Opponent scores into the net!`;
              }
            }
          }

          this._updateUI();

          setTimeout(() => {
            modal.classList.remove('active');
            if (mdGrid) mdGrid.style.pointerEvents = 'auto';
            this.isGoalCooldown = false;
            this.running = true;
            this._startSimLoop();
            this._startRenderLoop();
          }, 1600);
        };
      });
    }

    modal.classList.add('active');
  }


  // ─── Real-Time 60FPS Multi-Agent AI Engine ─────────────────────────────────
  _updateEngineAI() {
    const allPlayers = [...this.homePlayers, ...this.awayPlayers];
    const b = this.ball;

    // 1. Ball Carrier AI
    if (b.owner) {
      const owner = b.owner;
      this.possessionSide = owner.side;

      const footDist = 10;
      b.x = owner.x + Math.cos(owner.facing) * footDist;
      b.y = owner.y + Math.sin(owner.facing) * footDist;
      b.z = 0;
      b.vx = owner.vx;
      b.vy = owner.vy;

      if (!this.isGoalCooldown) {
        owner.actionTimer = (owner.actionTimer || 0) + 1;
        if (owner.actionTimer > 22) { // Action decision every ~0.35s
          owner.actionTimer = 0;
          this._evaluateOwnerAction(owner);
        }
      }
    } else {
      // 2. Ball Physics Trajectory
      b.x += b.vx;
      b.y += b.vy;
      b.z += b.vz;

      if (b.z > 0) {
        b.vz -= 0.15;
      } else {
        b.z = 0;
        b.vz = 0;
        b.vx *= 0.93;
        b.vy *= 0.93;
      }

      // Trajectory Interception / Control
      if (!this.isGoalCooldown && (b.state === 'ROLLING' || (b.state === 'IN_AIR' && b.z < 15))) {
        for (const p of allPlayers) {
          if (p.role === 'GK' && Math.abs(b.vx) > 3.5) continue;
          const dist = Math.hypot(p.x - b.x, p.y - b.y);
          if (dist < 14) {
            b.owner = p;
            b.state = 'CARRIED';
            p.facing = p.side === 'home' ? 0 : Math.PI;
            break;
          }
        }
      }

      // Check Goal Line & Out of Bounds
      this._checkGoalScored();
      this._checkOutOfBounds();
    }

    // 3. Off-the-ball Tactical AI
    this._updateOffTheBallAI(allPlayers);

    if (this.goalFlashTime > 0) this.goalFlashTime--;
  }

  _evaluateOwnerAction(owner) {
    const isHome = owner.side === 'home';
    const teammates = (isHome ? this.homePlayers : this.awayPlayers).filter(p => p !== owner && p.role !== 'GK');
    const goalX     = isHome ? W - PITCH_M : PITCH_M;
    const goalDist  = Math.hypot(goalX - owner.x, H / 2 - owner.y);

    // A. SHOOT: Increased range (~280px) and realistic goal scoring rate
    if (goalDist < 280 && Math.random() < (goalDist < 160 ? 0.65 : 0.35)) {
      this._executeShot(owner, isHome, goalX);
      return;
    }

    // B. PASS: Find best open teammate
    const openTeammates = teammates.filter(p => {
      const dist = Math.hypot(p.x - owner.x, p.y - owner.y);
      return dist > 40 && dist < 320;
    });

    if (openTeammates.length && Math.random() < 0.78) {
      // Prioritize teammates upfield
      openTeammates.sort((a, b) => isHome ? b.x - a.x : a.x - b.x);
      const target = openTeammates[0];
      this._executePass(owner, target);
      return;
    }

    // C. DRIBBLE: Advance forward into space
    owner.state = 'DRIBBLE';
  }

  _executePass(passer, receiver) {
    const b = this.ball;
    b.owner = null;
    b.state = 'ROLLING';

    const dx = receiver.x - passer.x;
    const dy = receiver.y - passer.y;
    const dist = Math.hypot(dx, dy);

    const passSpeed = Math.min(7.0, Math.max(4.5, dist * 0.035));
    b.vx = (dx / dist) * passSpeed;
    b.vy = (dy / dist) * passSpeed;

    passer.facing = Math.atan2(dy, dx);
  }

  _executeShot(shooter, isHome, goalX) {
    const b = this.ball;
    b.owner = null;
    b.state = 'IN_AIR';

    const stat    = this.stats[isHome ? 'home' : 'away'];
    const oppStat = this.stats[isHome ? 'away' : 'home'];
    stat.shots++;

    const targetY = GOAL_TOP + 10 + Math.random() * (GOAL_BOT - GOAL_TOP - 20);
    const dx = goalX - shooter.x;
    const dy = targetY - shooter.y;
    const dist = Math.hypot(dx, dy);

    const shotSpeed = 8.0 + Math.random() * 2.5;
    b.vx = (dx / dist) * shotSpeed;
    b.vy = (dy / dist) * shotSpeed;
    b.vz = 1.8 + Math.random() * 1.5;

    shooter.facing = Math.atan2(dy, dx);

    const xG = parseFloat((Math.max(0.10, 1 - dist / 320)).toFixed(2));
    stat.xG = parseFloat((stat.xG + xG).toFixed(2));

    const onTarget = Math.random() < 0.65;
    if (onTarget) stat.sot++;

    const gk = isHome ? this.awayPlayers[0] : this.homePlayers[0];

    // Balanced keeper save logic (not overpowered)
    if (onTarget && Math.random() < 0.45 && dist > 140) {
      // Keeper Save
      oppStat.saves++;
      gk.y += (targetY - gk.y) * 0.50;
      this._addComm(`🧤 SAVE by ${gk.name}!`, 'save');
    } else if (!onTarget) {
      this._addComm(`Shot from ${shooter.name} goes wide!`, 'miss');
    }
  }

  // ─── Single-Trigger Goal Detection System ──────────────────────────────────
  _checkGoalScored() {
    if (this.isGoalCooldown || !this.running) return;
    const b = this.ball;

    // Check Home Goal (Left Goal Net)
    if (b.x < PITCH_M + 4 && b.y > GOAL_TOP + 4 && b.y < GOAL_BOT - 4 && b.z < 25) {
      this.isGoalCooldown = true;
      this.awayScore++;
      this._onGoalScored('away');
    }
    // Check Away Goal (Right Goal Net)
    else if (b.x > W - PITCH_M - 4 && b.y > GOAL_TOP + 4 && b.y < GOAL_BOT - 4 && b.z < 25) {
      this.isGoalCooldown = true;
      this.homeScore++;
      this._onGoalScored('home');
    }
  }

  _onGoalScored(scoringSide) {
    // Freeze ball motion
    const b = this.ball;
    b.vx = 0; b.vy = 0; b.vz = 0;

    this.goalFlashTime = 75;
    this.goalFlashSide = scoringSide;
    state.playSound?.('goal');

    const scorerClub = scoringSide === 'home' ? this.home.name : this.away.name;
    this._addComm(`⚽ GOAL! ${scorerClub} score! (${this.homeScore}–${this.awayScore})`, 'goal');

    this.goalEvents.push({ minute: this.minute, side: scoringSide, scorer: scorerClub, home: this.homeScore, away: this.awayScore });

    const scoreEl = document.getElementById('matchScoreDisplay');
    if (scoreEl) {
      scoreEl.textContent = `${this.homeScore} – ${this.awayScore}`;
      scoreEl.style.color = 'var(--accent-lime)';
      scoreEl.style.textShadow = '0 0 30px rgba(0,255,135,0.9)';
      setTimeout(() => { if (scoreEl) { scoreEl.style.color = ''; scoreEl.style.textShadow = ''; }}, 1600);
    }

    // Reset pitch to Kickoff after celebration
    setTimeout(() => {
      if (this.running) this._initMatch();
    }, 1400);
  }

  _checkOutOfBounds() {
    if (this.isGoalCooldown) return;
    const b = this.ball;

    // Pitch touchline bounds
    if (b.y < PITCH_M + 4) { b.y = PITCH_M + 6; b.vy = Math.abs(b.vy) * 0.4; }
    if (b.y > H - PITCH_M - 4) { b.y = H - PITCH_M - 6; b.vy = -Math.abs(b.vy) * 0.4; }

    // Endlines outside of goal net -> Goal kick / Keeper restart
    if (b.x < PITCH_M - 8 || b.x > W - PITCH_M + 8) {
      if (b.y < GOAL_TOP || b.y > GOAL_BOT) {
        const side = b.x < W / 2 ? 'home' : 'away';
        const gk = side === 'home' ? this.homePlayers[0] : this.awayPlayers[0];
        b.owner = gk;
        b.state = 'CARRIED';
        b.x = gk.x;
        b.y = gk.y;
        b.vx = 0; b.vy = 0; b.vz = 0;
      }
    }
  }

  _updateOffTheBallAI(allPlayers) {
    const b = this.ball;
    const isHomePoss = this.possessionSide === 'home';

    const defendingTeam = isHomePoss ? this.awayPlayers : this.homePlayers;
    const attackingTeam = isHomePoss ? this.homePlayers : this.awayPlayers;
    
    // Nearest defender is the primary presser
    let presser = null, minDist = 9999;
    for (const p of defendingTeam) {
      if (p.role === 'GK') continue;
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      if (d < minDist) { minDist = d; presser = p; }
    }

    allPlayers.forEach(p => {
      const isCarrier = p === b.owner;
      const isGK      = p.role === 'GK';
      const isOnAttackingTeam = (p.side === 'home') === isHomePoss;

      let targetX = p.bx;
      let targetY = p.by;
      
      const goalDir = p.side === 'home' ? 1 : -1;
      const ownGoalX = p.side === 'home' ? PITCH_M : W - PITCH_M;

      if (isGK) {
        // Goalkeeper hugs goal line & tracks ball Y angle
        targetX = p.bx;
        targetY = p.by + (b.y - p.by) * 0.45;
        targetY = Math.max(GOAL_TOP + 8, Math.min(GOAL_BOT - 8, targetY));

      } else if (isCarrier) {
        // Carrier dribbles towards opponent goal smoothly
        targetX = p.x + goalDir * 50;
        targetY = p.y * 0.8 + p.by * 0.2;

      } else if (p === presser) {
        // Presser closes down ball carrier directly
        targetX = b.x;
        targetY = b.y;
        
        // Tackle check when close
        if (b.owner && minDist < 15) {
          if (Math.random() < 0.15) {
            b.owner = p;
            b.state = 'CARRIED';
            this.possessionSide = p.side;
            this._addComm(`Tackle! ${p.name} dispossesses the ball!`, 'normal');
          }
        }

      } else if (!isOnAttackingTeam) {
        // Dynamic Defensive Line (Entire team shifts relative to ball position)
        // Defending team drops back as ball gets closer to their goal, and pushes up when ball is far
        const ballDistFromOwnGoal = Math.abs(b.x - ownGoalX);
        const shiftFactor = (ballDistFromOwnGoal / W) * 0.70;
        
        // Target position moves dynamically with the ball across the pitch
        const dynamicX = ownGoalX + (b.x - ownGoalX) * 0.65;
        targetX = p.bx * 0.35 + dynamicX * 0.65;
        targetY = p.by + (b.y - H / 2) * 0.45;
        
      } else if (isOnAttackingTeam) {
        // Attacking team pushes up and supports the ball carrier
        const dynamicX = b.x + (goalDir * 40);
        targetX = p.bx * 0.4 + dynamicX * 0.6;
        targetY = p.by + (b.y - p.by) * 0.30;
      }

      // Smooth Physics Movement
      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1.5) {
        const targetSpeed = Math.min(p.maxSpeed, dist * 0.08);
        const desiredVx = (dx / dist) * targetSpeed;
        const desiredVy = (dy / dist) * targetSpeed;

        p.vx += (desiredVx - p.vx) * 0.15;
        p.vy += (desiredVy - p.vy) * 0.15;
        p.x += p.vx;
        p.y += p.vy;

        // Smooth facing rotation
        const targetAngle = Math.atan2(p.vy, p.vx);
        let diff = targetAngle - p.facing;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        p.facing += diff * 0.20;
      } else {
        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += p.vx;
        p.y += p.vy;
      }

      // Bounds check
      p.x = Math.max(PITCH_M + 6, Math.min(W - PITCH_M - 6, p.x));
      p.y = Math.max(PITCH_M + 6, Math.min(H - PITCH_M - 6, p.y));
    });
  }

  // ─── Visual Presentation ───────────────────────────────────────────────────
  _drawFrame() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    this._drawPitch(ctx);

    if (this.goalFlashTime > 0) {
      const alpha = (this.goalFlashTime / 75) * 0.25;
      ctx.fillStyle = this.goalFlashSide === 'home' ? `rgba(0, 255, 137, ${alpha})` : `rgba(0, 240, 255, ${alpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    this._drawPlayers(ctx, this.awayPlayers, '#00e5ff', '#001833');
    this._drawPlayers(ctx, this.homePlayers, '#00ff87', '#003322');
    this._drawBall(ctx);
    this._drawPossessionIndicator(ctx);
  }

  _drawPitch(ctx) {
    const grassGrad = ctx.createLinearGradient(0, 0, 0, H);
    grassGrad.addColorStop(0, '#0c3b1d');
    grassGrad.addColorStop(1, '#072b14');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, W, H);

    for (let x = 0; x < W; x += 55) {
      if (Math.floor(x / 55) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.02)';
        ctx.fillRect(x, 0, 55, H);
      }
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.5;

    ctx.strokeRect(PITCH_M, PITCH_M, W - PITCH_M * 2, H - PITCH_M * 2);

    ctx.beginPath();
    ctx.moveTo(W / 2, PITCH_M);
    ctx.lineTo(W / 2, H - PITCH_M);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 58, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    const paW = 135, paH = 210;
    ctx.strokeRect(PITCH_M, (H - paH) / 2, paW, paH);
    ctx.strokeRect(W - PITCH_M - paW, (H - paH) / 2, paW, paH);

    const gbW = 46, gbH = 104;
    ctx.strokeRect(PITCH_M, (H - gbH) / 2, gbW, gbH);
    ctx.strokeRect(W - PITCH_M - gbW, (H - gbH) / 2, gbW, gbH);

    [[PITCH_M + 92, H / 2], [W - PITCH_M - 92, H / 2]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });

    ctx.restore();

    const goalH = GOAL_BOT - GOAL_TOP;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(0, GOAL_TOP, PITCH_M, goalH);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.strokeRect(0, GOAL_TOP, PITCH_M, goalH);

    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(W - PITCH_M, GOAL_TOP, PITCH_M, goalH);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.strokeRect(W - PITCH_M, GOAL_TOP, PITCH_M, goalH);
  }

  _drawPlayers(ctx, players, fillColor, strokeColor) {
    players.forEach(p => {
      const px = Number.isFinite(p.x) ? p.x : (p.bx || 0);
      const py = Number.isFinite(p.y) ? p.y : (p.by || 0);
      const facing = Number.isFinite(p.facing) ? p.facing : (p.side === 'home' ? 0 : Math.PI);

      const isCarrier = this.ball && this.ball.owner === p;

      if (isCarrier) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, 16, 0, Math.PI * 2);
        ctx.strokeStyle = p.side === 'home' ? '#00ff87' : '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = p.side === 'home' ? '#00ff87' : '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(px + 2, py + 5, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      ctx.restore();

      // Directional Notch Pointer (Subtle notch on circle edge)
      ctx.save();
      ctx.beginPath();
      const pointerX = px + Math.cos(facing) * 12;
      const pointerY = py + Math.sin(facing) * 12;
      if (Number.isFinite(pointerX) && Number.isFinite(pointerY)) {
        ctx.arc(pointerX, pointerY, 2.5, 0, Math.PI * 2);
      }
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fillStyle   = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth   = 2.2;
      ctx.stroke();

      ctx.fillStyle    = p.side === 'home' ? '#001a0d' : '#001520';
      ctx.font         = 'bold 9px Outfit, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(p.num || ''), px, py);
      ctx.restore();
    });
  }

  _drawBall(ctx) {
    const b = this.ball;
    const shadowY = b.y + 5 + b.z * 0.2;

    ctx.save();
    ctx.beginPath();
    const shadowRadius = Math.max(3, 7 - b.z * 0.15);
    ctx.ellipse(b.x + 2, shadowY, shadowRadius, shadowRadius * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.35 - b.z * 0.01)})`;
    ctx.fill();
    ctx.restore();

    const drawY = b.y - b.z;

    const glow = ctx.createRadialGradient(b.x, drawY, 0, b.x, drawY, 13);
    glow.addColorStop(0, 'rgba(255,235,80,0.7)');
    glow.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(b.x, drawY, 13, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(b.x, drawY, 6.5, 0, Math.PI * 2);
    ctx.fillStyle   = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth   = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(b.x, drawY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#111111';
    ctx.fill();
    ctx.restore();
  }

  _drawPossessionIndicator(ctx) {
    const barW = 160, barH = 6, barX = (W - barW) / 2, barY = H - 8;
    const totalTicks = this.homePossTicks + this.awayPossTicks || 1;
    const homeRatio  = this.homePossTicks / totalTicks;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    ctx.fillStyle = '#00ff87';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * homeRatio, barH, 3);
    ctx.fill();

    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.roundRect(barX + barW * homeRatio, barY, barW * (1 - homeRatio), barH, 3);
    ctx.fill();
    ctx.restore();
  }

  _updateUI() {
    const clockEl = document.getElementById('matchClockText');
    if (clockEl) clockEl.textContent = `${this.minute}'`;

    const scoreEl = document.getElementById('matchScoreDisplay');
    if (scoreEl && !scoreEl.style.color) {
      scoreEl.textContent = `${this.homeScore} – ${this.awayScore}`;
    }

    const totalTicks  = this.homePossTicks + this.awayPossTicks || 1;
    const homePoss    = Math.round((this.homePossTicks / totalTicks) * 100);
    const awayPoss    = 100 - homePoss;

    const statsEl = document.getElementById('matchLiveStats');
    if (statsEl) {
      const hs = this.stats.home, as_ = this.stats.away;
      statsEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 130px 1fr;gap:0.35rem 0.8rem;font-size:0.84rem;align-items:center;">
          <span style="text-align:right;color:var(--accent-lime);font-weight:800;">${homePoss}%</span>
          <span style="color:var(--text-muted);font-size:0.7rem;text-align:center;text-transform:uppercase;letter-spacing:1px;">Possession</span>
          <span style="color:var(--accent-cyan);font-weight:800;">${awayPoss}%</span>

          <span style="text-align:right;font-weight:700;">${hs.shots}</span>
          <span style="color:var(--text-muted);font-size:0.7rem;text-align:center;text-transform:uppercase;letter-spacing:1px;">Shots</span>
          <span style="font-weight:700;">${as_.shots}</span>

          <span style="text-align:right;font-weight:700;">${hs.sot}</span>
          <span style="color:var(--text-muted);font-size:0.7rem;text-align:center;text-transform:uppercase;letter-spacing:1px;">On Target</span>
          <span style="font-weight:700;">${as_.sot}</span>

          <span style="text-align:right;font-weight:700;">${hs.xG.toFixed(2)}</span>
          <span style="color:var(--text-muted);font-size:0.7rem;text-align:center;text-transform:uppercase;letter-spacing:1px;">xG</span>
          <span style="font-weight:700;">${as_.xG.toFixed(2)}</span>
        </div>`;
    }

    const feedEl = document.getElementById('matchCommentaryFeed');
    if (feedEl && this.commentary.length) {
      feedEl.innerHTML = this.commentary.map(c => {
        const cls = { goal:'goal-entry', save:'save-entry', miss:'miss-entry', kickoff:'kickoff-entry', halftime:'halftime-entry', tactic:'tactic-entry', normal:'normal-entry' }[c.type] || 'normal-entry';
        const iconMap = { goal:'⚽', save:'🧤', miss:'💨', kickoff:'🏁', halftime:'🔔', tactic:'📋', normal:'💬' };
        return `<div class="comm-entry ${cls}">
          <span class="comm-min">${c.min}'</span>
          <span class="comm-icon">${iconMap[c.type] || '💬'}</span>
          <span class="comm-text">${c.text}</span>
        </div>`;
      }).join('');
      feedEl.scrollTop = 0;
    }

    this._updateGoalTimeline();
  }

  _updateGoalTimeline() {
    const el = document.getElementById('matchGoalTimeline');
    if (!el || !this.goalEvents.length) return;
    el.innerHTML = this.goalEvents.map(g => {
      const cls = g.side === 'home' ? 'home-goal' : 'away-goal';
      return `<div class="goal-event ${cls}">
        <span class="goal-min">${g.minute}'</span>
        <span class="goal-scorer">⚽ ${g.scorer}</span>
        <span class="goal-score">${g.home}–${g.away}</span>
      </div>`;
    }).join('');
  }

  _addComm(text, type = 'normal') {
    this.commentary.unshift({ min: this.minute, text, type });
    if (this.commentary.length > MAX_COMM) this.commentary.pop();
  }

  _finishMatch() {
    this.stop();
    state.playSound?.('whistle');
    const result = `${this.homeScore}–${this.awayScore}`;
    this._addComm(`🏁 FULL TIME — ${this.home.name} ${result} ${this.away.name}`, 'kickoff');
    this._updateUI();

    this.fixture.played = true;
    this.fixture.result = { homeScore: this.homeScore, awayScore: this.awayScore };
    this._updateStandings();
    state.simRestOfLeagueMatchday?.(this.fixture.competition === 'UEFA Champions League');

    for (let i = 0; i < 7; i++) state.advanceDay?.();

    if (this.onFinished) {
      setTimeout(() => this.onFinished(this.homeScore, this.awayScore, this.stats.home, this.stats.away), 500);
    }
  }

  _updateStandings() {
    const dataset = (this.fixture.competition === 'UEFA Champions League') ? state.uclStandings : state.standings;
    const hr = dataset?.find(s => s.clubId === this.home.id);
    const ar = dataset?.find(s => s.clubId === this.away.id);
    if (!hr || !ar) return;

    hr.played++; ar.played++;
    hr.gf += this.homeScore; hr.ga += this.awayScore;
    ar.gf += this.awayScore; ar.ga += this.homeScore;
    hr.gd = hr.gf - hr.ga;
    ar.gd = ar.gf - ar.ga;

    if (this.homeScore > this.awayScore) {
      hr.won++; hr.pts += 3; ar.lost++;
    } else if (this.homeScore < this.awayScore) {
      ar.won++; ar.pts += 3; hr.lost++;
    } else {
      hr.drawn++; hr.pts += 1; ar.drawn++; ar.pts += 1;
    }

    dataset.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }
}

function engineQuickSim(fixture, calculateTeamRatingsFn, stateRef) {
  if (!fixture) return null;
  const myRatings = calculateTeamRatingsFn();
  const isUserHome = fixture.homeClub.id === stateRef.myClubId;
  const homeRating = isUserHome ? (myRatings.ovr || fixture.homeClub.rating) : fixture.homeClub.rating;
  const awayRating = isUserHome ? fixture.awayClub.rating : (myRatings.ovr || fixture.awayClub.rating);

  // Exponential Rating Curve: +10 OVR gap gives ~80%+ win chance (e.g. 89 OVR Real Madrid vs 76 OVR Mallorca)
  const diff = (homeRating + 2) - awayRating;
  const hProb = Math.min(0.92, Math.max(0.08, 1 / (1 + Math.pow(10, -diff / 12))));

  const hExp = 2.7 * hProb;
  const aExp = 2.7 * (1 - hProb);

  const poissonRand = (lambda) => {
    let L = Math.exp(-lambda), k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  };

  let homeScore = poissonRand(hExp);
  let awayScore = poissonRand(aExp);

  // Generate Goal Scorers with Realistic Position Weights
  const getScorers = (clubId, side, score) => {
    const scorers = [];
    let pool = [];
    if (side === 'home' && isUserHome && stateRef.starters?.length) {
      pool = stateRef.starters.filter(p => p.pos !== 'GK');
    } else if (side === 'away' && !isUserHome && fixture.awayClub.id === stateRef.myClubId && stateRef.starters?.length) {
      pool = stateRef.starters.filter(p => p.pos !== 'GK');
    } else {
      pool = stateRef.players?.filter(p => p.clubId === clubId && p.pos !== 'GK');
      if (!pool || !pool.length) {
        pool = (typeof INITIAL_PLAYERS !== 'undefined' ? INITIAL_PLAYERS : []).filter(p => p.clubId === clubId && p.pos !== 'GK');
      }
    }
    if (!pool || !pool.length) pool = [{ name: 'Forward', pos: 'ST', clubId }];

    const getPosWeight = (pos) => {
      const p = (pos || '').toUpperCase();
      if (['ST', 'CF', 'LW', 'RW'].includes(p)) return 75;
      if (['CAM', 'LM', 'RM'].includes(p)) return 40;
      if (['CM', 'CDM'].includes(p)) return 15;
      if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p)) return 4;
      return 10;
    };

    const weightedPick = (playerPool) => {
      const weightedList = [];
      playerPool.forEach(player => {
        const w = getPosWeight(player.pos);
        for (let k = 0; k < w; k++) {
          weightedList.push(player);
        }
      });
      if (!weightedList.length) return playerPool[Math.floor(Math.random() * playerPool.length)];
      return weightedList[Math.floor(Math.random() * weightedList.length)];
    };

    for (let i = 0; i < score; i++) {
      const p = weightedPick(pool);
      const min = Math.floor(Math.random() * 88) + 2;
      scorers.push({ name: p.name, min, side, clubId });
      p.goals = (p.goals || 0) + 1;
    }
    return scorers;
  };

  const homeScorers = getScorers(fixture.homeClub.id, 'home', homeScore);
  const awayScorers = getScorers(fixture.awayClub.id, 'away', awayScore);
  const allScorers = [...homeScorers, ...awayScorers].sort((a, b) => a.min - b.min);

  if (isUserHome || fixture.awayClub.id === stateRef.myClubId) {
    stateRef.starters?.forEach(p => { p.apps = (p.apps || 0) + 1; });
  }

  // Generate Stats
  const homeShots = homeScore + Math.floor(Math.random() * 8) + 4;
  const awayShots = awayScore + Math.floor(Math.random() * 7) + 3;
  const homeSot   = homeScore + Math.floor(Math.random() * 3) + 1;
  const awaySot   = awayScore + Math.floor(Math.random() * 3) + 1;
  const homePoss  = Math.min(68, Math.max(32, Math.round(hProb * 100 + (Math.random() * 12 - 6))));
  const awayPoss  = 100 - homePoss;
  const homeXG    = (homeScore * 0.45 + Math.random() * 0.6).toFixed(2);
  const awayXG    = (awayScore * 0.45 + Math.random() * 0.5).toFixed(2);


  fixture.played = true;
  fixture.result = { homeScore, awayScore };

  if (fixture.compType === 'LEAGUE' || fixture.compType === 'UCL') {
    const dataset = fixture.compType === 'UCL' ? stateRef.uclStandings : stateRef.standings;
    const homeRow = dataset?.find(s => s.clubId === fixture.homeClub.id);
    const awayRow = dataset?.find(s => s.clubId === fixture.awayClub.id);

    if (homeRow && awayRow) {
      homeRow.played++; awayRow.played++;
      homeRow.gf += homeScore; homeRow.ga += awayScore;
      awayRow.gf += awayScore; awayRow.ga += homeScore;
      homeRow.gd = homeRow.gf - homeRow.ga;
      awayRow.gd = awayRow.gf - awayRow.ga;

      if (homeScore > awayScore) { homeRow.won++; homeRow.pts += 3; awayRow.lost++; }
      else if (homeScore < awayScore) { awayRow.won++; awayRow.pts += 3; homeRow.lost++; }
      else { homeRow.drawn++; homeRow.pts += 1; awayRow.drawn++; awayRow.pts += 1; }
    }
    dataset?.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    
    // Check if UCL league phase is done, if so seed knockouts
    if (fixture.compType === 'UCL') {
        const uclFix = stateRef.fixtures.filter(f => f.compType === 'UCL');
        if (uclFix.length > 0 && uclFix.every(f => f.played) && !stateRef.uclKnockoutSeeded) {
             stateRef.uclKnockoutSeeded = true;
             const sorted = [...stateRef.uclStandings]; // Already sorted above
             // Seed knockouts:
             // 1st & 2nd bye to SF
             // 3rd vs 6th -> QF1, 4th vs 5th -> QF2
             if (stateRef.uclKnockoutBracket) {
                const qf = stateRef.uclKnockoutBracket.qf;
                const clubs = (id) => stateRef.clubs.find(c => c.id === id);
                qf[0].homeClub = clubs(sorted[2].clubId); qf[0].awayClub = clubs(sorted[5].clubId);
                qf[1].homeClub = clubs(sorted[3].clubId); qf[1].awayClub = clubs(sorted[4].clubId);
                
                // Add QF fixtures to calendar
                let d = new Date(stateRef.currentDate); d.setDate(d.getDate() + 7);
                stateRef.fixtures.push({ id: 'ucl_qf_1', date: new Date(d), competition: 'UCL Knockouts', compType: 'CUP', homeClub: qf[0].homeClub, awayClub: qf[0].awayClub, played: false, result: null, roundKey: 'ucl_qf_1' });
                stateRef.fixtures.push({ id: 'ucl_qf_2', date: new Date(d), competition: 'UCL Knockouts', compType: 'CUP', homeClub: qf[1].homeClub, awayClub: qf[1].awayClub, played: false, result: null, roundKey: 'ucl_qf_2' });
                
                // Push SF + Final placeholders
                d.setDate(d.getDate() + 14);
                stateRef.fixtures.push({ id: 'ucl_sf_1', date: new Date(d), competition: 'UCL Knockouts', compType: 'CUP', homeClub: null, awayClub: null, played: false, result: null, roundKey: 'ucl_sf_1' });
                stateRef.fixtures.push({ id: 'ucl_sf_2', date: new Date(d), competition: 'UCL Knockouts', compType: 'CUP', homeClub: null, awayClub: null, played: false, result: null, roundKey: 'ucl_sf_2' });
                d.setDate(d.getDate() + 14);
                stateRef.fixtures.push({ id: 'ucl_final', date: new Date(d), competition: 'UCL Final', compType: 'CUP', homeClub: null, awayClub: null, played: false, result: null, roundKey: 'ucl_final' });
                
                stateRef.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
             }
        }
    }
  } else if (fixture.compType === 'CUP') {
    // Cup Knockout logic (Extra time/pens if draw)
    if (homeScore === awayScore) {
       if (Math.random() > 0.5) homeScore++; else awayScore++;
       fixture.result = { homeScore, awayScore, pens: true };
    }
    const winner = homeScore > awayScore ? fixture.homeClub : fixture.awayClub;
    
    // Update ref in state
    if (fixture.ref) {
       fixture.ref.homeScore = homeScore;
       fixture.ref.awayScore = awayScore;
       fixture.ref.played = true;
       fixture.ref.winner = winner;
    }
    
    // Advance Domestic Cup Bracket
    if (fixture.roundKey === 'r16') {
      const qfMatches = stateRef.domesticCup.bracket.qf;
      const idx = parseInt(fixture.id.split('_').pop()) - 1; // 1 to 8
      const qfIdx = Math.floor(idx / 2);
      if (idx % 2 === 0) qfMatches[qfIdx].homeClub = winner;
      else qfMatches[qfIdx].awayClub = winner;
      
      // Update calendar placeholder
      const qfFix = stateRef.fixtures.find(f => f.id === `cup_qf_${qfIdx+1}`);
      if (qfFix) {
         if (idx % 2 === 0) { qfFix.homeClub = winner; qfFix.ref = qfMatches[qfIdx]; }
         else { qfFix.awayClub = winner; qfFix.ref = qfMatches[qfIdx]; }
      }
    } else if (fixture.roundKey === 'qf') {
      const sfMatches = stateRef.domesticCup.bracket.sf;
      const idx = parseInt(fixture.id.split('_').pop()) - 1;
      const sfIdx = Math.floor(idx / 2);
      if (idx % 2 === 0) sfMatches[sfIdx].homeClub = winner;
      else sfMatches[sfIdx].awayClub = winner;
      
      const sfFix = stateRef.fixtures.find(f => f.id === `cup_sf_${sfIdx+1}`);
      if (sfFix) {
         if (idx % 2 === 0) { sfFix.homeClub = winner; sfFix.ref = sfMatches[sfIdx]; }
         else { sfFix.awayClub = winner; sfFix.ref = sfMatches[sfIdx]; }
      }
    } else if (fixture.roundKey === 'sf') {
      const fn = stateRef.domesticCup.bracket.final[0];
      const idx = parseInt(fixture.id.split('_').pop()) - 1;
      if (idx === 0) fn.homeClub = winner; else fn.awayClub = winner;
      
      const fnFix = stateRef.fixtures.find(f => f.id === `cup_final_1`);
      if (fnFix) {
         if (idx === 0) { fnFix.homeClub = winner; fnFix.ref = fn; }
         else { fnFix.awayClub = winner; fnFix.ref = fn; }
      }
    }
    
    // Advance UCL Knockout Bracket
    if (fixture.roundKey === 'ucl_qf_1') {
       const uclsf = stateRef.fixtures.find(f => f.id === 'ucl_sf_2');
       if (uclsf) uclsf.awayClub = winner; // 2nd vs QF1 winner
    }
    if (fixture.roundKey === 'ucl_qf_2') {
       const uclsf = stateRef.fixtures.find(f => f.id === 'ucl_sf_1');
       if (uclsf) uclsf.awayClub = winner; // 1st vs QF2 winner
    }
    // Seed 1st and 2nd for SF when SF fixtures are reached?
    // Let's seed them as soon as QF ends
    if (fixture.roundKey.startsWith('ucl_qf')) {
        const sorted = [...stateRef.uclStandings];
        const clubs = (id) => stateRef.clubs.find(c => c.id === id);
        const sf1 = stateRef.fixtures.find(f => f.id === 'ucl_sf_1');
        const sf2 = stateRef.fixtures.find(f => f.id === 'ucl_sf_2');
        if (sf1 && !sf1.homeClub) sf1.homeClub = clubs(sorted[0].clubId);
        if (sf2 && !sf2.homeClub) sf2.homeClub = clubs(sorted[1].clubId);
    }
    if (fixture.roundKey === 'ucl_sf_1') {
       const uclfn = stateRef.fixtures.find(f => f.id === 'ucl_final');
       if (uclfn) uclfn.homeClub = winner;
    }
    if (fixture.roundKey === 'ucl_sf_2') {
       const uclfn = stateRef.fixtures.find(f => f.id === 'ucl_final');
       if (uclfn) uclfn.awayClub = winner;
    }
    if (fixture.roundKey === 'ucl_final' && winner && winner.id === stateRef.myClubId) {
       stateRef.trophies = stateRef.trophies || [];
       if (!stateRef.trophies.some(t => t.id === 'ucl_' + stateRef.season)) {
         stateRef.trophies.push({
           id: 'ucl_' + stateRef.season,
           name: 'UEFA Champions League',
           season: stateRef.season,
           icon: 'fa-star',
           club: winner.name,
           badgeColor: '#00f0ff'
         });
       }
    }
    if ((fixture.roundKey === 'cup_final' || fixture.id === 'cup_final_1') && winner && winner.id === stateRef.myClubId) {
       stateRef.trophies = stateRef.trophies || [];
       if (!stateRef.trophies.some(t => t.id === 'cup_' + stateRef.season)) {
         stateRef.trophies.push({
           id: 'cup_' + stateRef.season,
           name: stateRef.domesticCup ? stateRef.domesticCup.name : 'Domestic Cup',
           season: stateRef.season,
           icon: 'fa-crown',
           club: winner.name,
           badgeColor: '#ee2524'
         });
       }
    }
  }

  if (isUserHome || fixture.awayClub.id === stateRef.myClubId) {
    stateRef.playSound?.('whistle');
  }
  stateRef.news.unshift({
    headline: `RESULT: ${fixture.homeClub.name} ${homeScore}–${awayScore} ${fixture.awayClub.name}`,
    date: stateRef.getFormattedDate?.() || '',
    category: 'MATCH RESULT',
  });

  return {
    fixture,
    homeScore,
    awayScore,
    allScorers,
    stats: {
      homePoss, awayPoss,
      homeShots, awayShots,
      homeSot, awaySot,
      homeXG, awayXG
    }
  };
}
