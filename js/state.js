/* FIFA Career Mode State Engine & Multi-Competition Manager */



class CareerState {
  constructor() {
    this.currentDate = new Date(2026, 6, 1); // 01 July 2026
    this.seasonIndex = 0;
    this.season = '2026/27';
    this.myClubId = 'real_madrid';
    this.managerName = 'Carlo Ancelotti';
    this.managerRating = 88;
    this.selectedFormationKey = '4-3-3';
    this.activeCompetition = 'LEAGUE'; // 'LEAGUE' | 'UCL' | 'UEL'
    
    this.clubs = JSON.parse(JSON.stringify(INITIAL_CLUBS));
    this.players = JSON.parse(JSON.stringify(INITIAL_PLAYERS));
    
    this.myClub = this.clubs.find(c => c.id === this.myClubId) || this.clubs[0];
    
    // Squad lineup state
    this.starters = [];
    this.bench = [];
    
    // Incoming Transfer Bids from rival clubs
    this.incomingOffers = [];

    // History of finished seasons
    this.seasonHistory = [];

    // Inbox / Notifications
    this.inbox = [
      { id: 'm1', title: 'Welcome to the New Season!', sender: 'Board of Directors', date: '01 Jul 2026', body: 'Welcome Manager! Your objective is to win both the Domestic League and UEFA Champions League titles.' },
      { id: 'm2', title: 'Champions & Europa League Draw Complete', sender: 'UEFA Board', date: '01 Jul 2026', body: 'Group Stage draw confirmed! Top 2 teams from each league qualify for Champions League, 3rd & 4th qualify for Europa League.' }
    ];
    
    // News Ticker
    this.news = [
      { headline: 'EUROPEAN PREVIEW: Top 2 teams locked for UCL, 3rd & 4th fighting for Europa League!', date: '01 Jul 2026', category: 'UEFA COMPETITIONS' },
      { headline: 'Transfer Window officially OPEN across European leagues.', date: '01 Jul 2026', category: 'TRANSFERS' }
    ];
    
    // League Table, UCL, UEL & Fixtures Initialization
    this.initLeagueTable();
    this.initEuropeanCompetitions();
    this.initDomesticCup();
    this.initFixtures();
    this.initSquad();
    this.initAudio();
  }

  selectUserClub(clubId) {
    const club = this.clubs.find(c => c.id === clubId);
    if (!club) return;
    
    this.myClubId = clubId;
    this.myClub = club;
    this.currentDate = new Date(2026, 6, 1);
    
    this.initSquad();
    this.initLeagueTable();
    this.initEuropeanCompetitions();
    this.initDomesticCup();
    this.initFixtures();
    if (typeof youthEngine !== 'undefined') {
      youthEngine.initYouthLeague();
    }

    this.news.unshift({
      headline: `APPOINTMENT: ${this.managerName} announced as Manager of ${club.name}! Target: Domestic & Champions League glory.`,
      date: this.getFormattedDate(),
      category: 'BREAKING NEWS'
    });
  }

  initSquad() {
    const myPlayers = this.players.filter(p => p.clubId === this.myClubId);
    const starters = [];

    const findPos = (posList) => myPlayers.find(p => posList.includes(p.pos) && !starters.includes(p));
    
    const roleMap = [
      ['GK'],
      ['LB', 'LWB'],
      ['CB'],
      ['CB'],
      ['RB', 'RWB'],
      ['CDM', 'CM'],
      ['CM'],
      ['CAM', 'CM'],
      ['LW', 'LM'],
      ['ST', 'CF'],
      ['RW', 'RM']
    ];

    roleMap.forEach(roles => {
      const found = findPos(roles) || myPlayers.find(p => !starters.includes(p));
      if (found) starters.push(found);
    });

    this.starters = starters.slice(0, 11);
    this.bench = myPlayers.filter(p => !this.starters.includes(p));
  }

  initLeagueTable() {
    const targetLeague = this.myClub ? this.myClub.league : 'La Liga';
    const leagueClubs = this.clubs.filter(c => c.league === targetLeague);
    
    this.standings = leagueClubs.map(club => ({
      clubId: club.id,
      name: club.name,
      shortName: club.shortName,
      crest: club.crest,
      league: club.league,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));
  }

  initEuropeanCompetitions(customUCLClubIds = null) {
    let uclClubIds = customUCLClubIds;
    let uelClubIds = [];

    // Authentic Fixed 13 UCL Clubs for Season 1:
    const defaultUCLIds = [
      'real_madrid', 'barcelona',           // La Liga 1st & 2nd
      'man_city', 'arsenal',                 // Premier League 1st & 2nd
      'inter_milan', 'juventus',             // Serie A 1st & 2nd
      'bayern_munich', 'bayer_leverkusen',   // Bundesliga 1st & 2nd
      'psg', 'monaco',                       // Ligue 1 1st & 2nd
      'atletico_madrid', 'chelsea', 'liverpool' // 3 European wildcards
    ];

    // Authentic Fixed 10 UEL Clubs for Season 1:
    const defaultUELIds = [
      'athletic_bilbao', 'real_sociedad',    // La Liga 3rd & 4th
      'man_united', 'tottenham',             // Premier League 3rd & 4th
      'ac_milan', 'napoli',                  // Serie A 3rd & 4th
      'dortmund', 'rb_leipzig',              // Bundesliga 3rd & 4th
      'lille', 'marseille'                   // Ligue 1 3rd & 4th
    ];

    if (!uclClubIds || !uclClubIds.length) {
      if (this.seasonNumber && this.seasonNumber > 1 && this.standings && this.standings.length) {
        // Subsequent Seasons: Dynamic qualification based on previous season league standings
        uclClubIds = [];
        const userLeague = this.myClub ? this.myClub.league : 'La Liga';
        const allLeagues = ['La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1'];

        allLeagues.forEach(leagueName => {
          const leagueClubs = this.clubs.filter(c => c.league === leagueName);
          if (leagueName === userLeague) {
            const sorted = [...this.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
            if (sorted.length >= 2) uclClubIds.push(sorted[0].clubId, sorted[1].clubId);
            if (sorted.length >= 4) uelClubIds.push(sorted[2].clubId, sorted[3].clubId);
          } else {
            const sortedForeign = [...leagueClubs].sort((a, b) => (b.rating || 80) - (a.rating || 80));
            if (sortedForeign.length >= 2) uclClubIds.push(sortedForeign[0].id, sortedForeign[1].id);
            if (sortedForeign.length >= 4) uelClubIds.push(sortedForeign[2].id, sortedForeign[3].id);
          }
        });

        const remainingClubs = this.clubs.filter(c => !uclClubIds.includes(c.id)).sort((a, b) => (b.rating || 80) - (a.rating || 80));
        while (uclClubIds.length < 13 && remainingClubs.length > 0) {
          uclClubIds.push(remainingClubs.shift().id);
        }
        uclClubIds = uclClubIds.slice(0, 13);

        uelClubIds = uelClubIds.filter(id => !uclClubIds.includes(id)).slice(0, 10);
        const uelRemaining = this.clubs.filter(c => !uclClubIds.includes(c.id) && !uelClubIds.includes(c.id)).sort((a, b) => (b.rating || 80) - (a.rating || 80));
        while (uelClubIds.length < 10 && uelRemaining.length > 0) {
          uelClubIds.push(uelRemaining.shift().id);
        }
      } else {
        // Season 1: Strict Authentic Fixed Lists!
        uclClubIds = [...defaultUCLIds];
        uelClubIds = [...defaultUELIds];
      }
    } else {
      uelClubIds = [...defaultUELIds];
    }

    // 1. UCL Setup (13 teams, 8 matchdays)
    const uclClubs = this.clubs.filter(c => uclClubIds.includes(c.id));
    this.uclStandings = uclClubs.map(club => ({
      clubId: club.id,
      name: club.name,
      shortName: club.shortName,
      crest: club.crest,
      league: 'UEFA Champions League',
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));

    this.uclTree = {
      playoffs: [],
      qf: [],
      sf: [],
      final: null,
      generatedKnockouts: false
    };

    this.uclFixtures = [];
    if (uclClubIds.includes(this.myClubId)) {
      const uclOpps = uclClubs.filter(c => c.id !== this.myClubId);
      let uclDate = new Date(this.currentDate);
      uclDate.setDate(uclDate.getDate() + 10);

      const selectedOpps = uclOpps.slice(0, 8);
      selectedOpps.forEach((opp, idx) => {
        this.uclFixtures.push({
          id: `ucl_fix_${idx + 1}`,
          matchday: idx + 1,
          date: new Date(uclDate),
          competition: 'UEFA Champions League',
          homeClub: (idx % 2 === 0) ? this.myClub : opp,
          awayClub: (idx % 2 === 0) ? opp : this.myClub,
          played: false,
          result: null
        });
        uclDate.setDate(uclDate.getDate() + 14);
      });
    }

    // 2. UEL Setup (10 teams, 6 matchdays)
    const uelClubs = this.clubs.filter(c => uelClubIds.includes(c.id));
    this.uelStandings = uelClubs.map(club => ({
      clubId: club.id,
      name: club.name,
      shortName: club.shortName,
      crest: club.crest,
      league: 'UEFA Europa League',
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));

    this.uelTree = {
      playoffs: [],
      qf: [],
      sf: [],
      final: null,
      generatedKnockouts: false
    };

    this.uelFixtures = [];
    if (uelClubIds.includes(this.myClubId)) {
      const uelOpps = uelClubs.filter(c => c.id !== this.myClubId);
      let uelDate = new Date(this.currentDate);
      uelDate.setDate(uelDate.getDate() + 12);

      const selectedOpps = uelOpps.slice(0, 6);
      selectedOpps.forEach((opp, idx) => {
        this.uelFixtures.push({
          id: `uel_fix_${idx + 1}`,
          matchday: idx + 1,
          date: new Date(uelDate),
          competition: 'UEFA Europa League',
          homeClub: (idx % 2 === 0) ? this.myClub : opp,
          awayClub: (idx % 2 === 0) ? opp : this.myClub,
          played: false,
          result: null
        });
        uelDate.setDate(uelDate.getDate() + 14);
      });
    }
  }

  initDomesticCup() {
    const userLeague = this.myClub ? this.myClub.league : 'La Liga';
    const cupTitles = {
      'Premier League': 'FA Cup',
      'La Liga': 'Copa del Rey',
      'Serie A': 'Coppa Italia',
      'Bundesliga': 'DFB-Pokal',
      'Ligue 1': 'Coupe de France'
    };
    this.domesticCupTitle = cupTitles[userLeague] || 'Domestic Cup';

    const leagueClubs = this.clubs.filter(c => c.league === userLeague);
    const shuffled = [...leagueClubs].sort(() => Math.random() - 0.5);
    const cupClubs = shuffled.slice(0, 16);

    if (this.myClub && !cupClubs.some(c => c.id === this.myClubId)) {
      cupClubs[15] = this.myClub;
    }

    // Build 16-Team Tournament Tree (8 R16 ties)
    const r16 = [];
    for (let i = 0; i < 16; i += 2) {
      r16.push({
        id: `cup_r16_${i/2 + 1}`,
        home: cupClubs[i],
        away: cupClubs[i+1],
        scoreHome: null,
        scoreAway: null,
        winner: null,
        isUserTie: (cupClubs[i].id === this.myClubId || cupClubs[i+1].id === this.myClubId)
      });
    }

    this.cupTree = {
      r16: r16,
      qf: Array(4).fill(null).map((_, idx) => ({ id: `cup_qf_${idx+1}`, home: { name: 'TBD' }, away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null })),
      sf: Array(2).fill(null).map((_, idx) => ({ id: `cup_sf_${idx+1}`, home: { name: 'TBD' }, away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null })),
      final: { id: 'cup_final', home: { name: 'TBD' }, away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null }
    };
    
    this.cupFixtures = [];
    let d = new Date(this.currentDate);
    d.setDate(d.getDate() + 45); 

    this.cupTree.r16.forEach(match => {
      this.cupFixtures.push({
        id: match.id,
        matchday: 'Round of 16',
        date: new Date(d),
        competition: this.domesticCupTitle,
        homeClub: match.home,
        awayClub: match.away,
        played: false,
        result: null
      });
      d.setDate(d.getDate() + 1); // stagger them slightly
    });
  }

  initFixtures() {
    const targetLeague = this.myClub ? this.myClub.league : 'La Liga';
    const leagueClubs = this.clubs.filter(c => c.league === targetLeague);
    if (!leagueClubs.length) return;

    const clubs = [...leagueClubs];
    const n = clubs.length;
    if (n % 2 !== 0) clubs.push({ id: 'bye', name: 'Bye' });
    const numTeams = clubs.length;
    const rounds = numTeams - 1;

    let fixtureDate = new Date(this.currentDate);
    fixtureDate.setDate(fixtureDate.getDate() + 4);

    const leagueFix = [];
    let fixIdCounter = 1;

    // First Half of Season
    for (let round = 0; round < rounds; round++) {
      const matchdayNumber = round + 1;
      for (let i = 0; i < numTeams / 2; i++) {
        const homeIdx = (round + i) % (numTeams - 1);
        let awayIdx = (numTeams - 1 - i + round) % (numTeams - 1);
        if (i === 0) awayIdx = numTeams - 1;

        const home = clubs[homeIdx];
        const away = clubs[awayIdx];

        if (home.id !== 'bye' && away.id !== 'bye') {
          const finalHome = (round % 2 === 0) ? home : away;
          const finalAway = (round % 2 === 0) ? away : home;

          leagueFix.push({
            id: `fix_lg_${fixIdCounter++}`,
            matchday: `MD ${matchdayNumber}`,
            date: new Date(fixtureDate),
            competition: targetLeague,
            homeClub: finalHome,
            awayClub: finalAway,
            played: false,
            result: null
          });
        }
      }
      fixtureDate.setDate(fixtureDate.getDate() + 7);
    }

    // Second Half of Season (Reverse Fixtures)
    for (let round = 0; round < rounds; round++) {
      const matchdayNumber = rounds + round + 1;
      for (let i = 0; i < numTeams / 2; i++) {
        const homeIdx = (round + i) % (numTeams - 1);
        let awayIdx = (numTeams - 1 - i + round) % (numTeams - 1);
        if (i === 0) awayIdx = numTeams - 1;

        const home = clubs[homeIdx];
        const away = clubs[awayIdx];

        if (home.id !== 'bye' && away.id !== 'bye') {
          const finalHome = (round % 2 === 0) ? away : home;
          const finalAway = (round % 2 === 0) ? home : away;

          leagueFix.push({
            id: `fix_lg_${fixIdCounter++}`,
            matchday: `MD ${matchdayNumber}`,
            date: new Date(fixtureDate),
            competition: targetLeague,
            homeClub: finalHome,
            awayClub: finalAway,
            played: false,
            result: null
          });
        }
      }
      fixtureDate.setDate(fixtureDate.getDate() + 7);
    }

    const eurFix = this.uclFixtures || [];
    const cupFix = this.cupFixtures || [];
    const allUnplayed = [...leagueFix, ...eurFix, ...cupFix];
    allUnplayed.sort((a, b) => new Date(a.date) - new Date(b.date));

    this.fixtures = allUnplayed;
  }

  getNextFixture() {
    return this.fixtures.find(f => !f.played && (f.homeClub.id === this.myClubId || f.awayClub.id === this.myClubId)) || null;
  }

  simCpuMatches() {
    const nextUser = this.getNextFixture();
    const maxDate = nextUser ? new Date(nextUser.date) : new Date(2090, 0, 1);

    // Auto sim all CPU vs CPU fixtures scheduled on or before maxDate
    const cpuFixes = this.fixtures.filter(f => !f.played && f.homeClub.id !== this.myClubId && f.awayClub.id !== this.myClubId && new Date(f.date) <= maxDate);

    cpuFixes.forEach(fix => {
      if (typeof engineQuickSim === 'function' && typeof calculateTeamRatings === 'function') {
        engineQuickSim(fix, calculateTeamRatings, this);
      } else {
        fix.played = true;
        let h = Math.floor(Math.random() * 3) + 1;
        let a = Math.floor(Math.random() * 2);
        if (h === a) h++;
        fix.result = { homeScore: h, awayScore: a };
        this.processTournamentResult(fix, h, a);
      }
    });
  }

  processTournamentResult(fixture, homeScore, awayScore) {
    if (!fixture.id.includes('cup_') && !fixture.id.includes('ucl_')) return;
    
    // Force tie-breaker if draw in knockout
    if (homeScore === awayScore) {
      if (Math.random() < 0.5) homeScore++;
      else awayScore++;
      fixture.result = { homeScore, awayScore };
    }

    const winner = homeScore > awayScore ? fixture.homeClub : fixture.awayClub;
    
    const updateNode = (tree) => {
      ['playoffs', 'r16', 'qf', 'sf'].forEach(round => {
        if (tree[round]) {
          const match = tree[round].find(m => m.id === fixture.id);
          if (match) { match.scoreHome = homeScore; match.scoreAway = awayScore; match.winner = winner; }
        }
      });
      if (tree.final && tree.final.id === fixture.id) {
        tree.final.scoreHome = homeScore; tree.final.scoreAway = awayScore; tree.final.winner = winner;
      }
    };

    if (fixture.id.includes('cup_') && this.cupTree) updateNode(this.cupTree);
    if (fixture.id.includes('ucl_') && this.uclTree) updateNode(this.uclTree);
  }

  checkTournamentProgression() {
    this.simCpuMatches();

    const generateNextRound = (tree, currentRound, nextRound, prefix, title) => {
      if (!tree[currentRound] || !tree[nextRound]) return;
      
      const allDone = tree[currentRound].every(m => m.winner);
      const isPlaceholder = tree[nextRound][0] && tree[nextRound][0].home && tree[nextRound][0].home.name === 'TBD';

      if (allDone && isPlaceholder) {
        let d = new Date(this.currentDate);
        d.setDate(d.getDate() + 14);
        const matches = tree[currentRound];
        for (let i = 0; i < tree[nextRound].length; i++) {
          const m1 = matches[i * 2], m2 = matches[i * 2 + 1];
          tree[nextRound][i].id = `${prefix}_gen_${i+1}`;
          tree[nextRound][i].home = m1.winner; 
          tree[nextRound][i].away = m2.winner;
          tree[nextRound][i].isUserTie = (m1.winner.id === this.myClubId || m2.winner.id === this.myClubId);
          
          this.fixtures.push({
            id: tree[nextRound][i].id,
            matchday: nextRound.toUpperCase(),
            date: new Date(d),
            competition: title,
            homeClub: m1.winner,
            awayClub: m2.winner,
            played: false,
            result: null
          });
          d.setDate(d.getDate() + 1);
        }
        this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    };

    // 1. Domestic Cup Progression
    if (this.cupTree) {
      generateNextRound(this.cupTree, 'r16', 'qf', 'cup_qf', this.domesticCupTitle);
      generateNextRound(this.cupTree, 'qf', 'sf', 'cup_sf', this.domesticCupTitle);
      
      if (this.cupTree.sf.every(m => m.winner) && this.cupTree.final.home.name === 'TBD') {
        this.cupTree.final.id = 'cup_final_gen';
        this.cupTree.final.home = this.cupTree.sf[0].winner;
        this.cupTree.final.away = this.cupTree.sf[1].winner;
        this.cupTree.final.isUserTie = (this.cupTree.final.home.id === this.myClubId || this.cupTree.final.away.id === this.myClubId);
        
        let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
        this.fixtures.push({
          id: this.cupTree.final.id,
          matchday: 'FINAL',
          date: new Date(d),
          competition: this.domesticCupTitle,
          homeClub: this.cupTree.final.home,
          awayClub: this.cupTree.final.away,
          played: false,
          result: null
        });
        this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
    }

    // 2. UCL League Phase Completion & Playoff Generation
    const userUclDone = !this.uclFixtures || this.uclFixtures.length === 0 || this.uclFixtures.every(f => f.played);
    
    if (this.uclStandings && userUclDone && !this.uclTree.generatedKnockouts) {
      this.uclTree.generatedKnockouts = true;

      // Simulate rest of UCL group stage for all AI teams if needed
      this.uclStandings.forEach(s => {
        while (s.played < 8) {
          s.played++;
          const h = Math.floor(Math.random() * 3);
          const a = Math.floor(Math.random() * 2);
          s.gf += h; s.ga += a; s.gd = s.gf - s.ga;
          if (h > a) { s.won++; s.pts += 3; }
          else if (h < a) { s.lost++; }
          else { s.drawn++; s.pts += 1; }
        }
      });

      const sorted = [...this.uclStandings].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
      const top8 = sorted.slice(0, 8).map(s => this.clubs.find(c => c.id === s.clubId));
      this.uclTree.top8Clubs = top8;

      // 1st & 2nd Bye to SF; 3rd & 4th Bye to QF; 5th vs 8th, 6th vs 7th in Playoffs
      this.uclTree.playoffs = [
        { id: 'ucl_po_gen_1', home: top8[4], away: top8[7], scoreHome: null, scoreAway: null, winner: null, isUserTie: top8[4].id === this.myClubId || top8[7].id === this.myClubId },
        { id: 'ucl_po_gen_2', home: top8[5], away: top8[6], scoreHome: null, scoreAway: null, winner: null, isUserTie: top8[5].id === this.myClubId || top8[6].id === this.myClubId }
      ];
      this.uclTree.qf = [
        { id: 'ucl_qf_stub_1', home: top8[2], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false },
        { id: 'ucl_qf_stub_2', home: top8[3], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false }
      ];
      this.uclTree.sf = [
        { id: 'ucl_sf_stub_1', home: top8[0], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false },
        { id: 'ucl_sf_stub_2', home: top8[1], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false }
      ];
      this.uclTree.final = { id: 'ucl_final_stub', home: { name: 'TBD' }, away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.uclTree.playoffs.forEach(match => {
        this.fixtures.push({ id: match.id, matchday: 'UCL PLAYOFFS', date: new Date(d), competition: 'UEFA Champions League', homeClub: match.home, awayClub: match.away, played: false, result: null });
        d.setDate(d.getDate() + 1);
      });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 3. UCL Playoffs -> QF
    if (this.uclTree && this.uclTree.playoffs && this.uclTree.playoffs.every(m => m.winner) && (!this.uclTree.qf[0] || this.uclTree.qf[0].away.name === 'TBD')) {
      const top8 = this.uclTree.top8Clubs || [];
      const po1Winner = this.uclTree.playoffs[0].winner; // 5th vs 8th winner
      const po2Winner = this.uclTree.playoffs[1].winner; // 6th vs 7th winner

      this.uclTree.qf[0] = { id: 'ucl_qf_gen_1', home: top8[2], away: po2Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top8[2].id === this.myClubId || po2Winner.id === this.myClubId };
      this.uclTree.qf[1] = { id: 'ucl_qf_gen_2', home: top8[3], away: po1Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top8[3].id === this.myClubId || po1Winner.id === this.myClubId };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.uclTree.qf.forEach(match => {
        this.fixtures.push({ id: match.id, matchday: 'UCL QF', date: new Date(d), competition: 'UEFA Champions League', homeClub: match.home, awayClub: match.away, played: false, result: null });
        d.setDate(d.getDate() + 1);
      });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 4. UCL QF -> SF (1st & 2nd waiting in SF!)
    if (this.uclTree && this.uclTree.qf && this.uclTree.qf.every(m => m.winner) && (!this.uclTree.sf[0] || this.uclTree.sf[0].away.name === 'TBD')) {
      const top8 = this.uclTree.top8Clubs || [];
      const qf1Winner = this.uclTree.qf[0].winner;
      const qf2Winner = this.uclTree.qf[1].winner;

      this.uclTree.sf[0] = { id: 'ucl_sf_gen_1', home: top8[0], away: qf1Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top8[0].id === this.myClubId || qf1Winner.id === this.myClubId };
      this.uclTree.sf[1] = { id: 'ucl_sf_gen_2', home: top8[1], away: qf2Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top8[1].id === this.myClubId || qf2Winner.id === this.myClubId };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.uclTree.sf.forEach(match => {
        this.fixtures.push({ id: match.id, matchday: 'UCL SF', date: new Date(d), competition: 'UEFA Champions League', homeClub: match.home, awayClub: match.away, played: false, result: null });
        d.setDate(d.getDate() + 1);
      });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 5. UCL SF -> Final
    if (this.uclTree && this.uclTree.sf && this.uclTree.sf.every(m => m.winner) && (!this.uclTree.final || this.uclTree.final.home.name === 'TBD')) {
      const sf1Winner = this.uclTree.sf[0].winner;
      const sf2Winner = this.uclTree.sf[1].winner;

      this.uclTree.final = { id: 'ucl_final_gen', home: sf1Winner, away: sf2Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: sf1Winner.id === this.myClubId || sf2Winner.id === this.myClubId };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.fixtures.push({ id: this.uclTree.final.id, matchday: 'UCL FINAL', date: new Date(d), competition: 'UEFA Champions League', homeClub: sf1Winner, awayClub: sf2Winner, played: false, result: null });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // 6. UEL League Phase Completion & Playoff/Knockout Generation (10 Teams)
    const userUelDone = !this.uelFixtures || this.uelFixtures.length === 0 || this.uelFixtures.every(f => f.played);
    
    if (this.uelStandings && userUelDone && (!this.uelTree || !this.uelTree.generatedKnockouts)) {
      this.uelTree = this.uelTree || {};
      this.uelTree.generatedKnockouts = true;

      // Simulate rest of UEL group stage for all AI teams if needed
      this.uelStandings.forEach(s => {
        while (s.played < 6) {
          s.played++;
          const h = Math.floor(Math.random() * 3);
          const a = Math.floor(Math.random() * 2);
          s.gf += h; s.ga += a; s.gd = s.gf - s.ga;
          if (h > a) { s.won++; s.pts += 3; }
          else if (h < a) { s.lost++; }
          else { s.drawn++; s.pts += 1; }
        }
      });

      const sortedUel = [...this.uelStandings].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
      const top6 = sortedUel.slice(0, 6).map(s => this.clubs.find(c => c.id === s.clubId));
      this.uelTree.top6Clubs = top6;

      // 1st & 2nd Bye to SF; 3rd & 4th Bye to QF; 5th vs 6th in Playoff
      this.uelTree.playoffs = [
        { id: 'uel_po_gen_1', home: top6[4], away: top6[5], scoreHome: null, scoreAway: null, winner: null, isUserTie: top6[4].id === this.myClubId || top6[5].id === this.myClubId }
      ];
      this.uelTree.qf = [
        { id: 'uel_qf_stub_1', home: top6[2], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false },
        { id: 'uel_qf_stub_2', home: top6[3], away: top6[4], scoreHome: null, scoreAway: null, winner: null, isUserTie: false }
      ];
      this.uelTree.sf = [
        { id: 'uel_sf_stub_1', home: top6[0], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false },
        { id: 'uel_sf_stub_2', home: top6[1], away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null, isUserTie: false }
      ];
      this.uelTree.final = { id: 'uel_final_stub', home: { name: 'TBD' }, away: { name: 'TBD' }, scoreHome: null, scoreAway: null, winner: null };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.uelTree.playoffs.forEach(match => {
        this.fixtures.push({ id: match.id, matchday: 'UEL PLAYOFFS', date: new Date(d), competition: 'UEFA Europa League', homeClub: match.home, awayClub: match.away, played: false, result: null });
        d.setDate(d.getDate() + 1);
      });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // UEL Playoffs -> QF
    if (this.uelTree && this.uelTree.playoffs && this.uelTree.playoffs.every(m => m.winner) && (!this.uelTree.qf[0] || this.uelTree.qf[0].away.name === 'TBD')) {
      const top6 = this.uelTree.top6Clubs || [];
      const poWinner = this.uelTree.playoffs[0].winner;

      this.uelTree.qf[0] = { id: 'uel_qf_gen_1', home: top6[2], away: poWinner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top6[2].id === this.myClubId || poWinner.id === this.myClubId };
      this.uelTree.qf[1] = { id: 'uel_qf_gen_2', home: top6[3], away: top6[4], scoreHome: null, scoreAway: null, winner: null, isUserTie: top6[3].id === this.myClubId || top6[4].id === this.myClubId };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.uelTree.qf.forEach(match => {
        this.fixtures.push({ id: match.id, matchday: 'UEL QF', date: new Date(d), competition: 'UEFA Europa League', homeClub: match.home, awayClub: match.away, played: false, result: null });
        d.setDate(d.getDate() + 1);
      });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // UEL QF -> SF
    if (this.uelTree && this.uelTree.qf && this.uelTree.qf.every(m => m.winner) && (!this.uelTree.sf[0] || this.uelTree.sf[0].away.name === 'TBD')) {
      const top6 = this.uelTree.top6Clubs || [];
      const qf1Winner = this.uelTree.qf[0].winner;
      const qf2Winner = this.uelTree.qf[1].winner;

      this.uelTree.sf[0] = { id: 'uel_sf_gen_1', home: top6[0], away: qf1Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top6[0].id === this.myClubId || qf1Winner.id === this.myClubId };
      this.uelTree.sf[1] = { id: 'uel_sf_gen_2', home: top6[1], away: qf2Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: top6[1].id === this.myClubId || qf2Winner.id === this.myClubId };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.uelTree.sf.forEach(match => {
        this.fixtures.push({ id: match.id, matchday: 'UEL SF', date: new Date(d), competition: 'UEFA Europa League', homeClub: match.home, awayClub: match.away, played: false, result: null });
        d.setDate(d.getDate() + 1);
      });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // UEL SF -> Final
    if (this.uelTree && this.uelTree.sf && this.uelTree.sf.every(m => m.winner) && (!this.uelTree.final || this.uelTree.final.home.name === 'TBD')) {
      const sf1Winner = this.uelTree.sf[0].winner;
      const sf2Winner = this.uelTree.sf[1].winner;

      this.uelTree.final = { id: 'uel_final_gen', home: sf1Winner, away: sf2Winner, scoreHome: null, scoreAway: null, winner: null, isUserTie: sf1Winner.id === this.myClubId || sf2Winner.id === this.myClubId };

      let d = new Date(this.currentDate); d.setDate(d.getDate() + 14);
      this.fixtures.push({ id: this.uelTree.final.id, matchday: 'UEL FINAL', date: new Date(d), competition: 'UEFA Europa League', homeClub: sf1Winner, awayClub: sf2Winner, played: false, result: null });
      this.fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    this.simCpuMatches();
  }

  simRestOfLeagueMatchday(isEuropean = false, type = 'UCL') {
    // No-op: League and European fixtures are now fully scheduled and simulated via simCpuMatches()
    return;
  }

  toggleTransferList(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (p) {
      p.isTransferListed = !p.isTransferListed;
      if (p.isTransferListed) p.isLoanListed = false; // Mutually exclusive list
      this.playSound?.('click');
      return p.isTransferListed;
    }
    return false;
  }

  toggleLoanList(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (p) {
      p.isLoanListed = !p.isLoanListed;
      if (p.isLoanListed) p.isTransferListed = false;
      this.playSound?.('click');
      return p.isLoanListed;
    }
    return false;
  }

  generateIncomingOffer() {
    const myPlayers = this.players.filter(p => p.clubId === this.myClubId && !p.isLoaned);
    if (!myPlayers.length) return;

    const availablePlayers = myPlayers.filter(p => !this.incomingOffers.some(o => o.playerId === p.id && o.status === 'PENDING'));
    if (!availablePlayers.length) return;

    // Prioritize listed players (loan or transfer), otherwise random squad player
    const listedPlayers = availablePlayers.filter(p => p.isTransferListed || p.isLoanListed);
    let player = null;
    if (listedPlayers.length && Math.random() < 0.60) {
      player = listedPlayers[Math.floor(Math.random() * listedPlayers.length)];
    } else {
      player = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    }

    const rivalClubs = this.clubs.filter(c => c.id !== this.myClubId);
    const biddingClub = rivalClubs[Math.floor(Math.random() * rivalClubs.length)];

    // Determine offer type: LOAN vs TRANSFER
    // Young (<22) or OVR <= 76 or loan listed -> High probability of Loan offer
    let offerType = 'TRANSFER';
    if (player.isLoanListed || (player.age <= 22 && player.ovr < 78) || (player.ovr < 75 && Math.random() < 0.65)) {
      offerType = Math.random() < 0.40 ? 'LOAN_OPTION' : 'LOAN';
    }

    if (offerType === 'TRANSFER') {
      const feeMultiplier = player.isTransferListed ? (1.05 + Math.random() * 0.25) : (1.20 + Math.random() * 0.30);
      const bidAmount = Math.round((player.val * feeMultiplier) / 100000) * 100000;

      const offer = {
        id: 'offer_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: 'TRANSFER',
        playerId: player.id,
        playerName: player.name,
        playerPos: player.pos,
        playerOvr: player.ovr,
        playerAge: player.age,
        playerVal: player.val,
        biddingClubId: biddingClub.id,
        biddingClubName: biddingClub.name,
        bidAmount: bidAmount,
        date: this.getFormattedDate(),
        status: 'PENDING'
      };

      this.incomingOffers.unshift(offer);

      const tag = player.isTransferListed ? '[FOR SALE] ' : '[UNLISTED] ';
      this.news.unshift({
        headline: `TRANSFER BID: ${biddingClub.name} submit €${(bidAmount / 1000000).toFixed(1)}M offer for ${tag}${player.name}!`,
        date: this.getFormattedDate(),
        category: 'TRANSFERS'
      });

      this.inbox.unshift({
        id: 'msg_' + Date.now(),
        offerId: offer.id,
        type: 'OFFER_TRANSFER',
        title: `Transfer Offer for ${player.name}`,
        sender: biddingClub.name + ' Representative',
        date: this.getFormattedDate(),
        body: `${biddingClub.name} have officially submitted a transfer offer of €${(bidAmount / 1000000).toFixed(1)}M for ${player.name} (${player.pos} - ${player.ovr} OVR).`
      });
    } else {
      // Loan Offer
      const wageSplit = Math.choice ? Math.choice([60, 70, 80, 100]) : [60, 70, 80, 100][Math.floor(Math.random() * 4)];
      const buyOptionFee = Math.round(player.val * (1.10 + Math.random() * 0.25));

      const offer = {
        id: 'offer_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        type: offerType, // 'LOAN' or 'LOAN_OPTION'
        playerId: player.id,
        playerName: player.name,
        playerPos: player.pos,
        playerOvr: player.ovr,
        playerAge: player.age,
        playerVal: player.val,
        biddingClubId: biddingClub.id,
        biddingClubName: biddingClub.name,
        wageSplit: wageSplit, // % paid by borrowing club
        buyOptionFee: offerType === 'LOAN_OPTION' ? buyOptionFee : 0,
        date: this.getFormattedDate(),
        status: 'PENDING'
      };

      this.incomingOffers.unshift(offer);

      const desc = offerType === 'LOAN_OPTION' 
        ? `1-Season Loan with €${(buyOptionFee / 1000000).toFixed(1)}M Option to Buy (${wageSplit}% wage covered)`
        : `1-Season Loan (${wageSplit}% wage covered)`;

      this.news.unshift({
        headline: `LOAN PROPOSAL: ${biddingClub.name} want ${player.name} on loan!`,
        date: this.getFormattedDate(),
        category: 'TRANSFERS'
      });

      this.inbox.unshift({
        id: 'msg_' + Date.now(),
        offerId: offer.id,
        type: 'OFFER_LOAN',
        title: `Loan Proposal for ${player.name}`,
        sender: biddingClub.name + ' Manager',
        date: this.getFormattedDate(),
        body: `${biddingClub.name} have submitted a 1-season loan proposal for ${player.name} (${player.pos} - ${player.ovr} OVR). Terms: ${desc}.`
      });
    }

    this.playSound?.('click');
  }

  acceptIncomingOffer(offerId) {
    const offer = this.incomingOffers.find(o => o.id === offerId);
    if (!offer || offer.status !== 'PENDING') return false;

    const player = this.players.find(p => p.id === offer.playerId);
    if (!player) return false;

    if (offer.type === 'TRANSFER') {
      offer.status = 'ACCEPTED';
      this.myClub.budget += offer.bidAmount;

      // Remove from starters/bench and change clubId
      this.starters = this.starters.filter(p => p.id !== player.id);
      this.bench = this.bench.filter(p => p.id !== player.id);
      player.clubId = offer.biddingClubId;

      this.news.unshift({
        headline: `🔴 SOLD: ${player.name} transferred to ${offer.biddingClubName} for €${(offer.bidAmount / 1000000).toFixed(1)}M!`,
        date: this.getFormattedDate(),
        category: 'DONE DEAL'
      });
    } else {
      // LOAN or LOAN_OPTION
      offer.status = 'ACCEPTED';
      player.isLoaned = true;
      player.loanClub = offer.biddingClubName;
      player.loanType = offer.type;
      player.loanBuyFee = offer.buyOptionFee;

      this.starters = this.starters.filter(p => p.id !== player.id);
      this.bench = this.bench.filter(p => p.id !== player.id);

      this.news.unshift({
        headline: `🔄 LOAN AGREED: ${player.name} joins ${offer.biddingClubName} on loan for 1 season!`,
        date: this.getFormattedDate(),
        category: 'DONE DEAL'
      });
    }

    this.playSound?.('goal');
    return true;
  }

  rejectIncomingOffer(offerId) {
    const offer = this.incomingOffers.find(o => o.id === offerId);
    if (!offer) return false;

    offer.status = 'REJECTED';
    this.news.unshift({
      headline: `REJECTED: Offer from ${offer.biddingClubName} for ${offer.playerName} rejected.`,
      date: this.getFormattedDate(),
      category: 'TRANSFERS'
    });
    this.playSound?.('click');
    return true;
  }

  advanceDay() {
    this.currentDate.setDate(this.currentDate.getDate() + 1);
    this.playSound('tick');
    this.simCpuMatches();
    
    // Increased chance to receive incoming transfer offers for any squad player (~45% chance per day advance)
    if (Math.random() < 0.45) {
      this.generateIncomingOffer();
    }


    if (Math.random() > 0.7) {
      const randomHeadlines = [
        'Scouting reports indicate rising wonderkids in South American academies.',
        'Champions League night approaching fast — tactical briefings underway.',
        'Manager rating praised by press ahead of European showdown.',
        'Transfer deadline day approaching fast!'
      ];
      const randomText = randomHeadlines[Math.floor(Math.random() * randomHeadlines.length)];
      this.news.unshift({
        headline: randomText,
        date: this.getFormattedDate(),
        category: 'UPDATE'
      });
      if (this.news.length > 8) this.news.pop();
    }
  }

  startNextSeason() {
    this.trophyCabinet = this.trophyCabinet || [];
    
    // Snapshot the final standings BEFORE we reset anything
    const sortedLeagueStandings = [...this.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);

    const userRankIdx = sortedLeagueStandings.findIndex(s => s.clubId === this.myClubId);
    const userFinishPos = userRankIdx !== -1 ? userRankIdx + 1 : 1;
    const champClub = this.clubs.find(c => c.id === sortedLeagueStandings[0]?.clubId);
    
    if (champClub && champClub.id === this.myClubId) {
      this.trophyCabinet.push({ name: this.myClub.league + ' Title', year: this.season });
    }

    // Board prize money
    const prizeMoney = userFinishPos === 1 ? 40000000 : (userFinishPos <= 4 ? 25000000 : 15000000);
    this.myClub.budget += prizeMoney;

    // Save season to history
    this.seasonHistory.unshift({
      season: this.season,
      champion: champClub ? champClub.name : 'Unknown',
      userFinish: userFinishPos,
      budgetBonus: prizeMoney
    });

    // Advance the season index & labels
    this.seasonIndex++;
    const startYear = 2026 + this.seasonIndex;
    const endYearShort = String(startYear + 1).slice(-2);
    this.season = `${startYear}/${endYearShort}`;
    this.currentDate = new Date(startYear, 6, 1); // 01 July of new season

    // Reset player goals and apps
    this.players.forEach(p => {
      p.goals = 0;
      p.apps = 0;
    });

    // Player Development: ageing + growth
    this.players.forEach(p => {
      p.age += 1;
      if (p.age <= 23 && p.ovr < p.pot) {
        const growth = Math.floor(Math.random() * 3) + 1; // +1 to +3 OVR
        p.ovr = Math.min(p.pot, p.ovr + growth);
        p.val = Math.round(p.val * 1.15);
      } else if (p.age >= 33) {
        p.ovr = Math.max(65, p.ovr - 1);
        p.val = Math.round(p.val * 0.85);
      }
    });

    // Return loaned out players or decrement multi-season loans
    this.players.forEach(p => {
      if (p.isLoaned || p.isLoanedIn) {
        p.loanSeasonsLeft = (p.loanSeasonsLeft || 1) - 1;
        if (p.loanSeasonsLeft <= 0) {
          if (p.isLoanedIn) {
            p.isLoanedIn = false;
            p.clubId = p.loanParentClub || p.clubId;
            this.starters = this.starters.filter(s => s.id !== p.id);
            this.bench = this.bench.filter(s => s.id !== p.id);
          }
          if (p.isLoaned) {
            p.isLoaned = false;
            p.loanClub = null;
          }
        }
      }
    });

    // Re-initialize all tables and fixtures for the new season
    this.initLeagueTable();
    this.initEuropeanCompetitions(); // 13-team UCL
    this.initDomesticCup();
    this.initFixtures();
    this.initSquad();

    // Reset active competition view to League
    this.activeCompetition = 'LEAGUE';

    // Welcome message for new season
    this.inbox.unshift({
      id: `m_new_season_${this.seasonIndex}`,
      title: `Welcome to Season ${this.season}!`,
      sender: 'Board of Directors',
      date: this.getFormattedDate(),
      body: `Congratulations on completing the ${this.seasonHistory[0]?.season || 'previous'} season! You finished #${userFinishPos} — the board has granted €${(prizeMoney / 1000000).toFixed(0)}M in prize money. Good luck for ${this.season}!`
    });

    this.news.unshift({
      headline: `NEW SEASON BEGINS: ${this.season} officially kicks off!`,
      date: this.getFormattedDate(),
      category: 'SEASON LAUNCH'
    });
  }

  getFormattedDate() {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return this.currentDate.toLocaleDateString('en-GB', options);
  }

  // Web Audio API Procedural Sound Synthesizer
  initAudio() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playSound(type) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    if (type === 'click' || type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'click' ? 600 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'whistle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2500, now);
      osc.frequency.setValueAtTime(2800, now + 0.08);
      osc.frequency.setValueAtTime(2500, now + 0.16);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'goal') {
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(now);
    }
  }
}

const state = new CareerState();
