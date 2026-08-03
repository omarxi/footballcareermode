/* FIFA Career Mode State Engine & Multi-Competition Manager */

import { INITIAL_CLUBS, INITIAL_PLAYERS, FORMATIONS } from './data.js';

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
    this.initFixtures();

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

  initEuropeanCompetitions(customUCLClubIds = null, customUELClubIds = null) {
    let uclClubIds = customUCLClubIds;
    let uelClubIds = customUELClubIds;

    if (!uclClubIds || !uclClubIds.length || !uelClubIds || !uelClubIds.length) {
      const userLeague = this.myClub ? this.myClub.league : 'La Liga';
      const allLeagues = ['La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1'];

      uclClubIds = [];
      uelClubIds = [];

      allLeagues.forEach(leagueName => {
        const leagueClubs = this.clubs.filter(c => c.league === leagueName);
        if (leagueName === userLeague && this.standings && this.standings.length) {
          const sorted = [...this.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
          if (sorted.length >= 2) uclClubIds.push(sorted[0].clubId, sorted[1].clubId);
          if (sorted.length >= 4) uelClubIds.push(sorted[2].clubId, sorted[3].clubId);
        } else {
          // Pick 2 random clubs for UCL and 2 random clubs for UEL from foreign league
          const shuffled = [...leagueClubs].sort(() => Math.random() - 0.5);
          if (shuffled.length >= 2) uclClubIds.push(shuffled[0].id, shuffled[1].id);
          if (shuffled.length >= 4) uelClubIds.push(shuffled[2].id, shuffled[3].id);
        }
      });
    }

    // Always ensure user club is in UCL or UEL if missing
    if (!uclClubIds.includes(this.myClubId) && !uelClubIds.includes(this.myClubId)) {
      uclClubIds[0] = this.myClubId;
    }

    const uclClubs = this.clubs.filter(c => uclClubIds.includes(c.id));
    const uelClubs = this.clubs.filter(c => uelClubIds.includes(c.id));

    this.uclStandings = uclClubs.map(club => ({
      clubId: club.id,
      name: club.name,
      shortName: club.shortName,
      crest: club.crest,
      league: 'UEFA Champions League',
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));

    this.uelStandings = uelClubs.map(club => ({
      clubId: club.id,
      name: club.name,
      shortName: club.shortName,
      crest: club.crest,
      league: 'UEFA Europa League',
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));

    // Generate UCL Fixtures for user club
    this.uclFixtures = [];
    if (uclClubIds.includes(this.myClubId)) {
      const uclOpps = uclClubs.filter(c => c.id !== this.myClubId);
      let uclDate = new Date(this.currentDate);
      uclDate.setDate(uclDate.getDate() + 10); // Midweek

      uclOpps.slice(0, 6).forEach((opp, idx) => {
        this.uclFixtures.push({
          id: `ucl_fix_${idx + 1}`,
          matchday: idx + 1,
          date: new Date(uclDate),
          competition: 'UEFA Champions League',
          homeClub: this.myClub,
          awayClub: opp,
          played: false,
          result: null
        });
        uclDate.setDate(uclDate.getDate() + 14);
      });
    }

    // Generate UEL Fixtures for user club
    this.uelFixtures = [];
    if (uelClubIds.includes(this.myClubId)) {
      const uelOpps = uelClubs.filter(c => c.id !== this.myClubId);
      let uelDate = new Date(this.currentDate);
      uelDate.setDate(uelDate.getDate() + 11);

      uelOpps.slice(0, 6).forEach((opp, idx) => {
        this.uelFixtures.push({
          id: `uel_fix_${idx + 1}`,
          matchday: idx + 1,
          date: new Date(uelDate),
          competition: 'UEFA Europa League',
          homeClub: this.myClub,
          awayClub: opp,
          played: false,
          result: null
        });
        uelDate.setDate(uelDate.getDate() + 14);
      });
    }
  }

  // Alias for backward compatibility
  initUCL() {
    this.initEuropeanCompetitions();
  }

  initFixtures() {
    const targetLeague = this.myClub ? this.myClub.league : 'La Liga';
    const leagueClubs = this.clubs.filter(c => c.league === targetLeague);
    const opponentClubs = leagueClubs.filter(c => c.id !== this.myClubId);
    const opps = opponentClubs.length > 0 ? opponentClubs : this.clubs.filter(c => c.id !== this.myClubId);

    // League Weekend Fixtures
    const leagueFix = [];
    let fixtureDate = new Date(this.currentDate);
    fixtureDate.setDate(fixtureDate.getDate() + 4);

    opps.forEach((opp, idx) => {
      leagueFix.push({
        id: `fix_${idx + 1}`,
        matchday: idx + 1,
        date: new Date(fixtureDate),
        competition: targetLeague,
        homeClub: this.myClub,
        awayClub: opp,
        played: false,
        result: null
      });
      fixtureDate.setDate(fixtureDate.getDate() + 7);
    });

    // Interleave League + UCL + UEL into ONE master chronological schedule
    const eurFix = [...(this.uclFixtures || []), ...(this.uelFixtures || [])];
    const allUnplayed = [...leagueFix, ...eurFix];
    allUnplayed.sort((a, b) => new Date(a.date) - new Date(b.date));

    this.fixtures = allUnplayed;
  }

  getNextFixture() {
    return this.fixtures.find(f => !f.played) || null;
  }

  simRestOfLeagueMatchday(isEuropean = false, type = 'UCL') {
    let dataset = this.standings;
    if (isEuropean) {
      dataset = type === 'UEL' ? this.uelStandings : this.uclStandings;
    }
    if (!dataset || !dataset.length) return;

    const otherClubs = dataset.filter(s => s.clubId !== this.myClubId);
    const shuffled = [...otherClubs].sort(() => Math.random() - 0.5);

    const poissonRand = (lambda) => {
      let L = Math.exp(-lambda), k = 0, p = 1;
      do { k++; p *= Math.random(); } while (p > L);
      return k - 1;
    };

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      const homeRow = shuffled[i];
      const awayRow = shuffled[i + 1];

      const homeClub = this.clubs.find(c => c.id === homeRow.clubId);
      const awayClub = this.clubs.find(c => c.id === awayRow.clubId);

      const hPow = homeClub?.rating || 80;
      const aPow = awayClub?.rating || 80;
      const hProb = hPow / (hPow + aPow);

      const expectedGoals = 2.5;
      const hScore = poissonRand(expectedGoals * hProb);
      const aScore = poissonRand(expectedGoals * (1 - hProb));

      homeRow.played++; awayRow.played++;
      homeRow.gf += hScore; homeRow.ga += aScore;
      awayRow.gf += aScore; awayRow.ga += hScore;
      homeRow.gd = homeRow.gf - homeRow.ga;
      awayRow.gd = awayRow.gf - awayRow.ga;

      if (hScore > aScore) { homeRow.won++; homeRow.pts += 3; awayRow.lost++; }
      else if (hScore < aScore) { awayRow.won++; awayRow.pts += 3; homeRow.lost++; }
      else { homeRow.drawn++; homeRow.pts += 1; awayRow.drawn++; awayRow.pts += 1; }
    }

    dataset.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }

  toggleTransferList(playerId) {
    const p = this.players.find(x => x.id === playerId);
    if (p) {
      p.isTransferListed = !p.isTransferListed;
      this.playSound?.('click');
      return p.isTransferListed;
    }
    return false;
  }

  generateIncomingOffer() {
    const myPlayers = this.players.filter(p => p.clubId === this.myClubId);
    if (!myPlayers.length) return;

    const availablePlayers = myPlayers.filter(p => !this.incomingOffers.some(o => o.playerId === p.id && o.status === 'PENDING'));
    if (!availablePlayers.length) return;

    // Balance selection between transfer-listed and unlisted squad players
    const listedPlayers = availablePlayers.filter(p => p.isTransferListed);
    let player = null;
    if (listedPlayers.length && Math.random() < 0.50) {
      player = listedPlayers[Math.floor(Math.random() * listedPlayers.length)];
    } else {
      player = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    }

    const rivalClubs = this.clubs.filter(c => c.id !== this.myClubId);
    const biddingClub = rivalClubs[Math.floor(Math.random() * rivalClubs.length)];

    // Unlisted players command higher premium bids (120%-150% value) from rival clubs
    const feeMultiplier = player.isTransferListed ? (1.05 + Math.random() * 0.25) : (1.20 + Math.random() * 0.30);
    const bidAmount = Math.round((player.val * feeMultiplier) / 100000) * 100000;

    const offer = {
      id: 'offer_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
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

    const tag = player.isTransferListed ? '[FOR SALE] ' : '[UNLISTED STAR] ';
    this.news.unshift({
      headline: `TRANSFER BID: ${biddingClub.name} submit €${(bidAmount / 1000000).toFixed(1)}M offer for ${tag}${player.name}!`,
      date: this.getFormattedDate(),
      category: 'TRANSFERS'
    });

    this.inbox.unshift({
      id: 'msg_' + Date.now(),
      title: `Transfer Offer for ${player.name}`,
      sender: biddingClub.name + ' Representative',
      date: this.getFormattedDate(),
      body: `${biddingClub.name} have officially submitted a ${player.isTransferListed ? '' : 'surprise '}transfer offer of €${(bidAmount / 1000000).toFixed(1)}M for ${player.name} (${player.pos} - ${player.ovr} OVR). Head to the Transfers tab to respond!`
    });

    this.playSound?.('click');
  }

  advanceDay() {
    this.currentDate.setDate(this.currentDate.getDate() + 1);
    this.playSound('tick');
    
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
    // Snapshot the final standings BEFORE we reset anything
    const sortedLeagueStandings = [...this.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);

    const userRankIdx = sortedLeagueStandings.findIndex(s => s.clubId === this.myClubId);
    const userFinishPos = userRankIdx !== -1 ? userRankIdx + 1 : 1;
    const champClub = this.clubs.find(c => c.id === sortedLeagueStandings[0]?.clubId);

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

    // Determine European qualification from final standings of last season
    const qualifiedUCL = [];
    const qualifiedUEL = [];
    const userLeague = this.myClub ? this.myClub.league : 'La Liga';
    const allLeagues = ['La Liga', 'Premier League', 'Serie A', 'Bundesliga', 'Ligue 1'];

    allLeagues.forEach(leagueName => {
      if (leagueName === userLeague) {
        // User's league: top 2 -> UCL, 3rd & 4th -> UEL (based on just-finished season)
        if (sortedLeagueStandings.length >= 2) qualifiedUCL.push(sortedLeagueStandings[0].clubId, sortedLeagueStandings[1].clubId);
        if (sortedLeagueStandings.length >= 4) qualifiedUEL.push(sortedLeagueStandings[2].clubId, sortedLeagueStandings[3].clubId);
      } else {
        // Foreign leagues: 2 random clubs -> UCL, 2 different random clubs -> UEL
        const foreignClubs = this.clubs.filter(c => c.league === leagueName);
        const shuffled = [...foreignClubs].sort(() => Math.random() - 0.5);
        if (shuffled.length >= 2) qualifiedUCL.push(shuffled[0].id, shuffled[1].id);
        if (shuffled.length >= 4) qualifiedUEL.push(shuffled[2].id, shuffled[3].id);
      }
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

    // Re-initialize all tables and fixtures for the new season
    this.initLeagueTable();
    this.initEuropeanCompetitions(qualifiedUCL, qualifiedUEL);
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
      headline: `NEW SEASON BEGINS: ${this.season} officially kicks off — European draw confirmed!`,
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

export const state = new CareerState();
