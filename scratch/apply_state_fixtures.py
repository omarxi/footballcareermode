import re

def update_state_js():
    with open('js/state.js', 'r', encoding='utf-8') as f:
        code = f.read()

    init_fixtures_code = '''  initFixtures() {
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
  }'''

    # Use re.sub but CAREFULLY targeting ONLY initFixtures
    code = re.sub(r'  initFixtures\(\)\s*\{[\s\S]*?this\.fixtures\s*=\s*allUnplayed;\s*\}', init_fixtures_code, code)

    with open('js/state.js', 'w', encoding='utf-8') as f:
        f.write(code)

update_state_js()
