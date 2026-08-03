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

    // Trophies / Silverware Cabinet
    this.trophies = [];

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
    this.init13TeamUCL();
    this.initFixtures();
    this.initSquad();
    this.initAudio();
  }


  initDomesticCup() {
    const userLeague = this.myClub ? this.myClub.league : 'La Liga';
    const compInfo = (typeof LEAGUE_COMPETITIONS !== 'undefined' && LEAGUE_COMPETITIONS[userLeague])
      ? LEAGUE_COMPETITIONS[userLeague]
      : { cupTitle: 'Copa del Rey' };

    const leagueClubs = this.clubs.filter(c => c.league === userLeague);
    const shuffled = [...leagueClubs].sort(() => Math.random() - 0.5);
    const cupClubs = shuffled.slice(0, 16);

    if (this.myClub && !cupClubs.some(c => c.id === this.myClubId)) {
      cupClubs[15] = this.myClub;
    }

    const r16Matches = [];
    for (let i = 0; i < 8; i++) {
      r16Matches.push({
        id: `cup_r16_${i+1}`,
        matchName: `Octavos ${i+1}`,
        homeClub: cupClubs[i * 2],
        awayClub: cupClubs[i * 2 + 1],
        homeScore: 0,
        awayScore: 0,
        played: false,
        winner: null
      });
    }

    this.domesticCup = {
      name: compInfo.cupTitle,
      bracket: {
        r16: r16Matches,
        qf: [
          { id: 'cup_qf_1', matchName: 'Cuartos 1', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null },
          { id: 'cup_qf_2', matchName: 'Cuartos 2', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null },
          { id: 'cup_qf_3', matchName: 'Cuartos 3', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null },
          { id: 'cup_qf_4', matchName: 'Cuartos 4', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null }
        ],
        sf: [
          { id: 'cup_sf_1', matchName: 'Semifinal 1', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null },
          { id: 'cup_sf_2', matchName: 'Semifinal 2', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null }
        ],
        final: [
          { id: 'cup_final', matchName: 'Gran Final', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null }
        ]
      }
    };
  }

  init13TeamUCL() {
    const sorted = [...this.clubs].sort((a, b) => (b.rating || 75) - (a.rating || 75));
    let uclClubs = sorted.slice(0, 13);

    if (this.myClub && !uclClubs.some(c => c.id === this.myClubId)) {
      uclClubs[12] = this.myClub;
      uclClubs.sort((a, b) => (b.rating || 75) - (a.rating || 75));
    }

    this.uclStandings = uclClubs.map(club => ({
      clubId: club.id,
      name: club.name,
      shortName: club.shortName,
      crest: club.crest,
      rating: club.rating,
      league: club.league,
      played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0
    }));

    this.uclKnockoutBracket = {
      qf: [
        { id: 'ucl_qf_1', matchName: 'Quarter-Final 1 (3rd vs 6th)', homeClub: null, awayClub: null, played: false, winner: null },
        { id: 'ucl_qf_2', matchName: 'Quarter-Final 2 (4th vs 5th)', homeClub: null, awayClub: null, played: false, winner: null }
      ],
      sf: [
        { id: 'ucl_sf_1', matchName: 'Semi-Final 1 (1st vs QF2 Winner)', homeClub: null, awayClub: null, played: false, winner: null },
        { id: 'ucl_sf_2', matchName: 'Semi-Final 2 (2nd vs QF1 Winner)', homeClub: null, awayClub: null, played: false, winner: null }
      ],
      final: [
        { id: 'ucl_final', matchName: 'UEFA Champions League Final', homeClub: null, awayClub: null, played: false, winner: null }
      ]
    };
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
    this.init13TeamUCL();
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
          // Select top-rated elite clubs (~85+ OVR) for UCL from foreign leagues
          const sortedForeign = [...leagueClubs].sort((a, b) => (b.rating || 80) - (a.rating || 80));
          if (sortedForeign.length >= 2) uclClubIds.push(sortedForeign[0].id, sortedForeign[1].id);
          if (sortedForeign.length >= 4) uelClubIds.push(sortedForeign[2].id, sortedForeign[3].id);
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

    const allFixtures = [];
    let d = new Date(this.currentDate);

    // League Matchdays (38 matches)
    for (let i = 0; i < 38; i++) {
      d.setDate(d.getDate() + 7);
      const matchDate = new Date(d);
      
      // Generate full matchday (10 matches if 20 teams)
      const paired = new Set();
      const shuffled = [...leagueClubs].sort(() => Math.random() - 0.5);
      
      for(let j=0; j<shuffled.length; j++) {
        const home = shuffled[j];
        if (paired.has(home.id)) continue;
        const away = shuffled.find(c => c.id !== home.id && !paired.has(c.id));
        if (away) {
          paired.add(home.id); paired.add(away.id);
          allFixtures.push({
            id: `league_m${i+1}_${j}`, matchday: i+1, date: matchDate, competition: targetLeague, compType: 'LEAGUE',
            homeClub: home, awayClub: away, played: false, result: null, roundKey: null
          });
        }
      }
    }

    // UCL Matchdays (8 matches)
    d = new Date(this.currentDate);
    const uclClubs = this.uclStandings.map(c => this.clubs.find(club => club.id === c.clubId));
    
    for (let i = 0; i < 8; i++) {
      d.setDate(d.getDate() + 10);
      const matchDate = new Date(d);
      const paired = new Set();
      const shuffled = [...uclClubs].sort(() => Math.random() - 0.5);
      
      for(let j=0; j<shuffled.length; j++) {
        const home = shuffled[j];
        if (paired.has(home.id)) continue;
        const away = shuffled.find(c => c.id !== home.id && !paired.has(c.id));
        if (away) {
          paired.add(home.id); paired.add(away.id);
          allFixtures.push({
            id: `ucl_m${i+1}_${j}`, matchday: i+1, date: matchDate, competition: 'UEFA Champions League', compType: 'UCL',
            homeClub: home, awayClub: away, played: false, result: null, roundKey: null
          });
        }
      }
    }

    // Cup Rounds (R16 to Final)
    const cupR16Matches = this.domesticCup.bracket.r16;
    d = new Date(this.currentDate);
    d.setDate(d.getDate() + 15);
    cupR16Matches.forEach((m, idx) => {
      allFixtures.push({
        id: `cup_r16_${idx+1}`, date: new Date(d), competition: this.domesticCup.name, compType: 'CUP',
        homeClub: m.homeClub, awayClub: m.awayClub, played: false, result: null, roundKey: 'r16', ref: m
      });
    });
    
    // QF, SF, Final will be dynamically added to `allFixtures` when previous rounds complete, or we can just push placeholders
    const cupDates = [45, 90, 120];
    const cupRounds = ['qf', 'sf', 'final'];
    cupDates.forEach((offset, idx) => {
      d = new Date(this.currentDate);
      d.setDate(d.getDate() + offset);
      const roundMatches = this.domesticCup.bracket[cupRounds[idx]];
      roundMatches.forEach((m, mIdx) => {
        allFixtures.push({
          id: `cup_${cupRounds[idx]}_${mIdx+1}`, date: new Date(d), competition: this.domesticCup.name, compType: 'CUP',
          homeClub: null, awayClub: null, played: false, result: null, roundKey: cupRounds[idx], ref: m
        });
      });
    });

    allFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.fixtures = allFixtures;
  }

  getNextFixture() {
    return this.fixtures.find(f => !f.played && f.homeClub && f.awayClub && (f.homeClub.id === this.myClubId || f.awayClub.id === this.myClubId)) || null;
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

      // Exponential Rating Curve: +10 OVR gap gives ~80%+ win chance (e.g. 89 OVR Real Madrid vs 76 OVR Mallorca)
      const diff = (hPow + 2) - aPow;
      const hProb = Math.min(0.92, Math.max(0.08, 1 / (1 + Math.pow(10, -diff / 12))));

      const hExp = 2.7 * hProb;
      const aExp = 2.7 * (1 - hProb);
      const hScore = poissonRand(hExp);
      const aScore = poissonRand(aExp);

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
        expiresTime: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 Days expiration
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
        expiresTime: Date.now() + (14 * 24 * 60 * 60 * 1000), // 14 Days expiration
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
    
    // Auto-simulate any CPU vs CPU fixtures scheduled on or before today
    if (this.fixtures && this.fixtures.length) {
      const cpuMatches = this.fixtures.filter(f => !f.played && f.homeClub && f.awayClub && new Date(f.date) <= this.currentDate && f.homeClub.id !== this.myClubId && f.awayClub.id !== this.myClubId);
      cpuMatches.forEach(f => {
        if (typeof engineQuickSim === 'function') {
          const calculateTeamRatings = () => ({ ovr: 80 });
          engineQuickSim(f, calculateTeamRatings, this);
        } else {
          f.played = true;
          f.result = { homeScore: Math.floor(Math.random()*3), awayScore: Math.floor(Math.random()*3) };
        }
      });
    }
    
    // Check and expire pending offers older than 14 days
    const nowTime = Date.now();
    this.incomingOffers.forEach(off => {
      if (off.status === 'PENDING' && off.expiresTime && nowTime > off.expiresTime) {
        off.status = 'EXPIRED';
        this.inbox.unshift({
          id: 'msg_exp_' + Date.now() + '_' + Math.random(),
          type: 'EXPIRED_OFFER',
          title: `OFFER EXPIRED: ${off.biddingClubName}`,
          sender: off.biddingClubName + ' Representative',
          date: this.getFormattedDate(),
          body: `The proposal from ${off.biddingClubName} for ${off.playerName} has expired after 2 weeks of inactivity.`
        });
        this.news.unshift({
          headline: `EXPIRED: ${off.biddingClubName} withdraw offer for ${off.playerName} after 2 weeks.`,
          date: this.getFormattedDate(),
          category: 'TRANSFERS'
        });
      }
    });

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

    // Record League & Domestic Trophies based on user's league
    const userLeagueName = this.myClub ? this.myClub.league : 'La Liga';
    const compInfo = (typeof LEAGUE_COMPETITIONS !== 'undefined' && LEAGUE_COMPETITIONS[userLeagueName])
      ? LEAGUE_COMPETITIONS[userLeagueName]
      : { leagueTitle: 'Domestic League Trophy', cupTitle: 'National Cup', superCupTitle: 'Super Cup' };

    if (userFinishPos === 1) {
      this.trophies.push({
        id: 'tr_league_' + Date.now(),
        name: compInfo.leagueTitle,
        season: this.season,
        icon: 'fa-trophy',
        club: this.myClub ? this.myClub.name : '',
        badgeColor: '#ffd700'
      });
      this.trophies.push({
        id: 'tr_supercup_' + Date.now(),
        name: compInfo.superCupTitle,
        season: this.season,
        icon: 'fa-shield-halved',
        club: this.myClub ? this.myClub.name : '',
        badgeColor: '#ff9f43'
      });
    }

    // Domestic Cup Victory
    if (userFinishPos <= 2 && Math.random() > 0.3) {
      this.trophies.push({
        id: 'tr_cup_' + Date.now(),
        name: compInfo.cupTitle,
        season: this.season,
        icon: 'fa-crown',
        club: this.myClub ? this.myClub.name : '',
        badgeColor: '#ee2524'
      });
    }

    // Premier League EFL Cup
    if (userLeagueName === 'Premier League' && userFinishPos <= 3 && Math.random() > 0.4) {
      this.trophies.push({
        id: 'tr_efl_' + Date.now(),
        name: 'EFL Cup (Carabao Cup)',
        season: this.season,
        icon: 'fa-wine-glass-empty',
        club: this.myClub ? this.myClub.name : '',
        badgeColor: '#00a859'
      });
    }

    // Check Youth League finish
    if (typeof youthEngine !== 'undefined' && youthEngine.standings && youthEngine.standings.length) {
      const topYouth = [...youthEngine.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
      if (topYouth[0] && topYouth[0].isUser) {
        this.trophies.push({
          id: 'tr_youth_' + Date.now(),
          name: 'Youth League Champions',
          season: this.season,
          icon: 'fa-graduation-cap',
          club: `${this.myClub ? this.myClub.name : 'Club'} U19`,
          badgeColor: '#00f0ff'
        });
      }
    }

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
        // Foreign leagues: Top-rated elite teams (85+ OVR) -> UCL/UEL
        const foreignClubs = this.clubs.filter(c => c.league === leagueName);
        const sortedForeign = [...foreignClubs].sort((a, b) => (b.rating || 80) - (a.rating || 80));
        if (sortedForeign.length >= 2) qualifiedUCL.push(sortedForeign[0].id, sortedForeign[1].id);
        if (sortedForeign.length >= 4) qualifiedUEL.push(sortedForeign[2].id, sortedForeign[3].id);
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
            this.news.unshift({
              headline: `LOAN END: ${p.name}'s loan spell at ${this.myClub.name} has concluded.`,
              date: this.getFormattedDate(),
              category: 'TRANSFERS'
            });
          }
          if (p.isLoaned) {
            p.isLoaned = false;
            const prevClub = p.loanClub || 'their loan club';
            p.loanClub = null;
            this.news.unshift({
              headline: `LOAN RETURN: ${p.name} returns to ${this.myClub.name} after loan spell at ${prevClub}!`,
              date: this.getFormattedDate(),
              category: 'TRANSFERS'
            });
          }
        }
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

const state = new CareerState();
