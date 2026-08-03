/* Youth Academy & Scouting Engine */



class YouthEngine {
  constructor() {
    this.academy = [];
    this.generateRandomAcademy();
    this.initYouthLeague();
  }

  generateRandomNation() {
    const nations = [
      { name: 'Spain', flag: '🇪🇸' },
      { name: 'France', flag: '🇫🇷' },
      { name: 'Brazil', flag: '🇧🇷' },
      { name: 'Argentina', flag: '🇦🇷' },
      { name: 'Germany', flag: '🇩🇪' },
      { name: 'Italy', flag: '🇮🇹' },
      { name: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'Netherlands', flag: '🇳🇱' },
      { name: 'Portugal', flag: '🇵🇹' },
      { name: 'Croatia', flag: '🇭🇷' },
      { name: 'Japan', flag: '🇯🇵' },
      { name: 'Belgium', flag: '🇧🇪' }
    ];
    return nations[Math.floor(Math.random() * nations.length)].flag;
  }

  generateRandomAcademy() {
    this.academy = [];
    this.ensureMinimumRoster();
  }

  ensureMinimumRoster() {
    const minPlayers = 12;
    if (this.academy.length >= minPlayers) return;

    const needed = minPlayers - this.academy.length;
    const positions = ['GK', 'RB', 'CB', 'LB', 'CM', 'CDM', 'CAM', 'RW', 'LW', 'ST'];
    const firstNames = ['Liam', 'Noah', 'Oliver', 'Ethan', 'Lucas', 'Mateo', 'Alex', 'Jack', 'Sandro', 'Milan', 'Enzo', 'Gabriel', 'Julian', 'Marco', 'Leo', 'Kai', 'Luka', 'Hugo', 'Rafael', 'Carlos'];
    const lastNames = ['Smith', 'Garcia', 'Martin', 'Bauer', 'Novak', 'Silva', 'Conti', 'Dubois', 'Nielsen', 'Kovacs', 'Santos', 'Moreno', 'Rossi', 'Müller', 'Schneider', 'Fernandez', 'Alvarez', 'Zhao', 'Vargas', 'Ramos'];

    for (let i = 0; i < needed; i++) {
      const pos = positions[i % positions.length];
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      const ovr = Math.floor(Math.random() * 8) + 60; // 60-67 OVR
      const pot = Math.floor(Math.random() * 13) + 80; // 80-92 Potential
      const nation = this.generateRandomNation();

      this.academy.push({
        id: `y_auto_${Date.now()}_${Math.floor(Math.random()*10000)}_${i}`,
        name: `${fn} ${ln}`,
        pos,
        ovr,
        pot,
        age: Math.floor(Math.random() * 3) + 15,
        nation,
        pac: Math.floor(Math.random() * 20) + 65,
        sho: Math.floor(Math.random() * 20) + 55,
        pas: Math.floor(Math.random() * 20) + 60,
        dri: Math.floor(Math.random() * 20) + 62,
        def: Math.floor(Math.random() * 20) + 50,
        phy: Math.floor(Math.random() * 20) + 55,
        val: Math.round(ovr * 45000),
        wage: 2500,
        growthThisSeason: 0
      });
    }
  }

  getUserYouthName() {
    if (typeof state !== 'undefined' && state.myClub && state.myClub.name) {
      return `${state.myClub.name} U19`;
    }
    return 'Youth Academy U19';
  }

  initYouthLeague() {
    const userTeamName = this.getUserYouthName();
    const userClubId = (typeof state !== 'undefined' && state.myClubId) ? state.myClubId : 'real_madrid';

    const opponentPool = [
      { id: 'rm_u19', name: 'Real Madrid U19', rating: 70, parent: 'real_madrid' },
      { id: 'barca_u19', name: 'FC Barcelona U19', rating: 71, parent: 'barcelona' },
      { id: 'bayern_u19', name: 'Bayern Munich U19', rating: 69, parent: 'bayern' },
      { id: 'mancity_u19', name: 'Man City U19', rating: 70, parent: 'man_city' },
      { id: 'psg_u19', name: 'PSG U19', rating: 68, parent: 'psg' },
      { id: 'juve_u19', name: 'Juventus U19', rating: 67, parent: 'juventus' },
      { id: 'arsenal_u19', name: 'Arsenal U19', rating: 69, parent: 'arsenal' }
    ];

    const filteredOpponents = opponentPool.filter(o => o.parent !== userClubId).slice(0, 5);

    this.leagueTeams = [
      { id: 'user_u19', name: userTeamName, isUser: true },
      ...filteredOpponents
    ];

    this.standings = this.leagueTeams.map(t => ({
      teamId: t.id,
      name: t.name,
      isUser: !!t.isUser,
      mp: 0,
      w: 0,
      d: 0,
      l: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      pts: 0
    }));

    this.recentResults = [];
    this.generateSchedule();
  }

  generateSchedule() {
    const teams = this.leagueTeams.map(t => t.id);
    this.schedule = [];

    // Simple 10-matchday round robin generator for 6 teams
    const n = teams.length;
    for (let round = 0; round < (n - 1) * 2; round++) {
      const matchday = [];
      for (let i = 0; i < n / 2; i++) {
        const homeIdx = (round + i) % (n - 1);
        let awayIdx = (n - 1 - i + round) % (n - 1);
        if (i === 0) awayIdx = n - 1;

        if (round >= n - 1) {
          matchday.push({ home: teams[awayIdx], away: teams[homeIdx], played: false, homeGoals: 0, awayGoals: 0 });
        } else {
          matchday.push({ home: teams[homeIdx], away: teams[awayIdx], played: false, homeGoals: 0, awayGoals: 0 });
        }
      }
      this.schedule.push(matchday);
    }
    this.currentMatchdayIndex = 0;
  }

  simYouthMatchday() {
    if (this.currentMatchdayIndex >= this.schedule.length) return;

    const matchday = this.schedule[this.currentMatchdayIndex];
    let userMatchResult = null;

    matchday.forEach(m => {
      if (m.played) return;

      const homeTeam = this.leagueTeams.find(t => t.id === m.home);
      const awayTeam = this.leagueTeams.find(t => t.id === m.away);

      const hRating = homeTeam.isUser ? this.getUserYouthRating() : homeTeam.rating;
      const aRating = awayTeam.isUser ? this.getUserYouthRating() : awayTeam.rating;

      const diff = hRating - aRating;
      const hExp = 1.4 + (diff * 0.05);
      const aExp = 1.4 - (diff * 0.05);

      const hG = Math.max(0, Math.floor(Math.random() * (hExp + 1.2)));
      const aG = Math.max(0, Math.floor(Math.random() * (aExp + 1.2)));

      m.homeGoals = hG;
      m.awayGoals = aG;
      m.played = true;

      // Update Standings
      const hSt = this.standings.find(s => s.teamId === m.home);
      const aSt = this.standings.find(s => s.teamId === m.away);

      hSt.mp++;
      aSt.mp++;
      hSt.gf += hG;
      hSt.ga += aG;
      aSt.gf += aG;
      aSt.ga += hG;
      hSt.gd = hSt.gf - hSt.ga;
      aSt.gd = aSt.gf - aSt.ga;

      if (hG > aG) {
        hSt.w++; hSt.pts += 3;
        aSt.l++;
      } else if (aG > hG) {
        aSt.w++; aSt.pts += 3;
        hSt.l++;
      } else {
        hSt.d++; hSt.pts += 1;
        aSt.d++; aSt.pts += 1;
      }

      if (homeTeam.isUser || awayTeam.isUser) {
        userMatchResult = `${homeTeam.name} ${hG} - ${aG} ${awayTeam.name}`;
      }
    });

    this.standings.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    this.currentMatchdayIndex++;

    if (userMatchResult) {
      this.recentResults.unshift(userMatchResult);
      if (this.recentResults.length > 5) this.recentResults.pop();
    }

    // Match experience boosts rating growth for academy players
    this.processYouthGrowth(true);
  }

  getUserYouthRating() {
    if (!this.academy.length) return 60;
    const top11 = [...this.academy].sort((a, b) => b.ovr - a.ovr).slice(0, 11);
    const avg = top11.reduce((sum, p) => sum + p.ovr, 0) / top11.length;
    return Math.round(avg);
  }

  processYouthGrowth(fromMatch = false) {
    this.ensureMinimumRoster();

    this.academy.forEach(p => {
      if (p.ovr >= p.pot) return;

      // Growth chance: higher if far below potential or after match
      const chance = fromMatch ? 0.35 : 0.08;
      if (Math.random() < chance) {
        p.ovr += 1;
        p.growthThisSeason = (p.growthThisSeason || 0) + 1;

        // Boost individual sub-attributes
        p.pac = Math.min(99, p.pac + 1);
        p.sho = Math.min(99, p.sho + 1);
        p.pas = Math.min(99, p.pas + 1);
        p.dri = Math.min(99, p.dri + 1);
        p.val = Math.round(p.ovr * 55000);
      }
    });
  }

  scoutRegion(regionName) {
    state.playSound('click');
    const firstNames = ['Lucas', 'Gabriel', 'Carlos', 'Enzo', 'Julian', 'Marco', 'Leo', 'Sandro'];
    const lastNames = ['Torres', 'Fernandez', 'Santos', 'Rossi', 'Schmidt', 'Moreno', 'Silva', 'Barella'];

    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const positions = ['ST', 'CAM', 'RW', 'LW', 'CM', 'CB', 'LB', 'RB', 'GK'];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const ovr = Math.floor(Math.random() * 8) + 62;
    const pot = Math.floor(Math.random() * 10) + 85;

    const prospect = {
      id: `y_${Date.now()}`,
      name,
      pos,
      ovr,
      pot,
      age: Math.floor(Math.random() * 3) + 15,
      nation: regionName === 'South America' ? '🇧🇷' : regionName === 'Europe' ? '🇪🇸' : '🇯🇵',
      pac: Math.floor(Math.random() * 20) + 70,
      sho: Math.floor(Math.random() * 20) + 60,
      pas: Math.floor(Math.random() * 20) + 65,
      dri: Math.floor(Math.random() * 20) + 70,
      def: Math.floor(Math.random() * 20) + 50,
      phy: Math.floor(Math.random() * 20) + 55,
      val: Math.round(ovr * 60000),
      wage: 3000,
      growthThisSeason: 0
    };

    this.academy.unshift(prospect);

    state.news.unshift({
      headline: `SCOUT REPORT: Scout discovered ${prospect.name} (${prospect.pos}, Potential ${prospect.pot}) in ${regionName}!`,
      date: state.getFormattedDate(),
      category: 'SCOUT'
    });

    return prospect;
  }

  promoteToFirstTeam(prospectId) {
    const idx = this.academy.findIndex(p => p.id === prospectId);
    if (idx !== -1) {
      const prospect = this.academy.splice(idx, 1)[0];
      prospect.clubId = state.myClubId;
      state.bench.push(prospect);
      state.players.push(prospect); // Crucial fix: Add to main players array so it shows in Squad Hub

      state.news.unshift({
        headline: `YOUTH PROMOTION: ${prospect.name} (${prospect.ovr} OVR) has been promoted to ${state.myClub ? state.myClub.name : 'First Team'}!`,
        date: state.getFormattedDate(),
        category: 'ACADEMY'
      });

      // Auto-replenish to maintain full youth squad
      this.ensureMinimumRoster();

      state.playSound?.('goal');
      return prospect;
    }
    return null;
  }

  trainProspect(prospectId) {
    const prospect = this.academy.find(p => p.id === prospectId);
    if (!prospect) return false;
    if (prospect.ovr >= prospect.pot) return false;

    const gain = Math.floor(Math.random() * 2) + 1; // +1 or +2 OVR
    prospect.ovr = Math.min(prospect.pot, prospect.ovr + gain);
    prospect.growthThisSeason += gain;
    prospect.val = Math.round(prospect.ovr * 50000);

    state.playSound?.('click');
    return true;
  }

  releaseProspect(prospectId) {
    const idx = this.academy.findIndex(p => p.id === prospectId);
    if (idx !== -1) {
      this.academy.splice(idx, 1);
      this.ensureMinimumRoster();
      state.playSound?.('click');
      return true;
    }
    return false;
  }
}

const youthEngine = new YouthEngine();

