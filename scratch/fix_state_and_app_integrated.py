import re

state_file = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/state.js'
app_file = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/app.js'

with open(state_file, 'r', encoding='utf-8') as f:
    state_code = f.read()

# Replace initDomesticCup, initSwissUCL, initEuropeanCompetitions, initFixtures in state.js with fully integrated logic
integrated_methods = '''
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
          { id: 'cup_qf_3', matchName: 'Cuartos 3', matchName: 'Cuartos 3', homeClub: null, awayClub: null, homeScore: 0, awayScore: 0, played: false, winner: null },
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

  initFixtures() {
    const targetLeague = this.myClub ? this.myClub.league : 'La Liga';
    const compInfo = (typeof LEAGUE_COMPETITIONS !== 'undefined' && LEAGUE_COMPETITIONS[targetLeague])
      ? LEAGUE_COMPETITIONS[targetLeague]
      : { cupTitle: 'Copa del Rey' };

    const leagueClubs = this.clubs.filter(c => c.league === targetLeague);
    const opps = leagueClubs.filter(c => c.id !== this.myClubId);

    const allFixtures = [];

    // 1. League Weekend Fixtures
    let currentDateCursor = new Date(this.currentDate);
    currentDateCursor.setDate(currentDateCursor.getDate() + 3);

    opps.forEach((opp, idx) => {
      allFixtures.push({
        id: `fix_league_${idx + 1}`,
        matchday: idx + 1,
        date: new Date(currentDateCursor),
        competition: targetLeague,
        homeClub: this.myClub,
        awayClub: opp,
        played: false,
        result: null
      });
      currentDateCursor.setDate(currentDateCursor.getDate() + 7);
    });

    // 2. Domestic Cup Midweek Fixtures
    if (this.domesticCup && this.domesticCup.bracket && this.domesticCup.bracket.r16) {
      const userCupMatch = this.domesticCup.bracket.r16.find(m => 
        (m.homeClub && m.homeClub.id === this.myClubId) || (m.awayClub && m.awayClub.id === this.myClubId)
      );

      if (userCupMatch) {
        let cupDate = new Date(this.currentDate);
        cupDate.setDate(cupDate.getDate() + 10);
        allFixtures.push({
          id: userCupMatch.id,
          matchday: 'Octavos',
          date: new Date(cupDate),
          competition: compInfo.cupTitle,
          homeClub: userCupMatch.homeClub,
          awayClub: userCupMatch.awayClub,
          played: false,
          result: null,
          isCupMatch: true
        });
      }
    }

    // 3. 13-Team UCL Fixtures (6 Matchdays for User Club)
    if (this.uclStandings && this.uclStandings.some(s => s.clubId === this.myClubId)) {
      const uclOpps = this.uclStandings.filter(s => s.clubId !== this.myClubId);
      let uclDate = new Date(this.currentDate);
      uclDate.setDate(uclDate.getDate() + 17);

      for (let i = 0; i < Math.min(6, uclOpps.length); i++) {
        const oppClub = this.clubs.find(c => c.id === uclOpps[i].clubId) || { name: uclOpps[i].name };
        allFixtures.push({
          id: `fix_ucl_${i + 1}`,
          matchday: `UCL MD ${i + 1}`,
          date: new Date(uclDate),
          competition: 'UEFA Champions League',
          homeClub: i % 2 === 0 ? this.myClub : oppClub,
          awayClub: i % 2 === 0 ? oppClub : this.myClub,
          played: false,
          result: null,
          isUCLMatch: true
        });
        uclDate.setDate(uclDate.getDate() + 14);
      }
    }

    // Sort chronologically
    allFixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    this.fixtures = allFixtures;
  }
'''

# Update state.js
with open(state_file, 'w', encoding='utf-8') as f:
    # Replace old competition init methods
    pattern = r'initDomesticCup\(\)\s*\{.*?\}\s*simDomesticCupRound.*?\}\s*initSwissUCL\(\)\s*\{.*?\}\s*simSwissUCLMatchday\(\)\s*\{.*?\}\s*generateUCLKnockouts\(\)\s*\{.*?\}'
    state_code = re.sub(pattern, integrated_methods.strip(), state_code, flags=re.DOTALL)
    
    # Ensure constructor & selectUserClub call init13TeamUCL instead of initSwissUCL
    state_code = state_code.replace('this.initSwissUCL();', 'this.init13TeamUCL();')
    state_code = state_code.replace('this.initEuropeanCompetitions();', 'this.init13TeamUCL();')
    
    f.write(state_code)

print("state.js integrated with 13-Team UCL & Calendar Domestic Cup!")
