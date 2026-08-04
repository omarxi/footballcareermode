import re

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/state.js', 'r', encoding='utf-8') as f:
    code = f.read()

swiss_and_cup_code = '''
  initDomesticCup() {
    const userLeague = this.myClub ? this.myClub.league : 'La Liga';
    const compInfo = (typeof LEAGUE_COMPETITIONS !== 'undefined' && LEAGUE_COMPETITIONS[userLeague])
      ? LEAGUE_COMPETITIONS[userLeague]
      : { cupTitle: 'Copa del Rey' };

    const leagueClubs = this.clubs.filter(c => c.league === userLeague);
    const shuffled = [...leagueClubs].sort(() => Math.random() - 0.5);
    const cupClubs = shuffled.slice(0, 16);

    // Ensure user club is in cup if not already picked
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

  simDomesticCupRound(roundKey) {
    if (!this.domesticCup || !this.domesticCup.bracket[roundKey]) return;
    const matches = this.domesticCup.bracket[roundKey];

    matches.forEach(m => {
      if (m.played || !m.homeClub || !m.awayClub) return;

      const hRating = m.homeClub.rating || 78;
      const aRating = m.awayClub.rating || 78;
      const diff = hRating - aRating;

      let hG = Math.max(0, Math.floor(Math.random() * 3 + (diff > 0 ? 1 : 0)));
      let aG = Math.max(0, Math.floor(Math.random() * 3 + (diff < 0 ? 1 : 0)));

      if (hG === aG) {
        // Extra time / penalties decider
        if (Math.random() > 0.5) hG++; else aG++;
      }

      m.homeScore = hG;
      m.awayScore = aG;
      m.played = true;
      m.winner = hG > aG ? m.homeClub : m.awayClub;
    });

    // Advance winners to next round
    if (roundKey === 'r16') {
      const winners = matches.map(m => m.winner);
      const qf = this.domesticCup.bracket.qf;
      for (let i = 0; i < 4; i++) {
        qf[i].homeClub = winners[i * 2];
        qf[i].awayClub = winners[i * 2 + 1];
      }
    } else if (roundKey === 'qf') {
      const winners = matches.map(m => m.winner);
      const sf = this.domesticCup.bracket.sf;
      for (let i = 0; i < 2; i++) {
        sf[i].homeClub = winners[i * 2];
        sf[i].awayClub = winners[i * 2 + 1];
      }
    } else if (roundKey === 'sf') {
      const winners = matches.map(m => m.winner);
      const fn = this.domesticCup.bracket.final[0];
      fn.homeClub = winners[0];
      fn.awayClub = winners[1];
    }
  }

  initSwissUCL() {
    // Select top 36 European teams sorted by rating
    const sortedClubs = [...this.clubs].sort((a, b) => (b.rating || 75) - (a.rating || 75));
    let uclClubs = sortedClubs.slice(0, 36);

    // Ensure user's club is included in 36-team Swiss UCL
    if (this.myClub && !uclClubs.some(c => c.id === this.myClubId)) {
      uclClubs[35] = this.myClub;
      uclClubs.sort((a, b) => (b.rating || 75) - (a.rating || 75));
    }

    // Divide into 4 Pots of 9 teams each
    const pot1 = uclClubs.slice(0, 9);
    const pot2 = uclClubs.slice(9, 18);
    const pot3 = uclClubs.slice(18, 27);
    const pot4 = uclClubs.slice(27, 36);

    const pots = [pot1, pot2, pot3, pot4];

    // Build 36-team Swiss Standings
    this.uclSwissStandings = uclClubs.map((club, idx) => {
      const potNum = idx < 9 ? 1 : (idx < 18 ? 2 : (idx < 27 ? 3 : 4));
      return {
        clubId: club.id,
        name: club.name,
        shortName: club.shortName,
        crest: club.crest,
        rating: club.rating,
        league: club.league,
        pot: potNum,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        gd: 0,
        pts: 0
      };
    });

    // Generate 8 matchday fixtures per team (2 opponents from each Pot, country protection)
    this.uclSwissFixtures = [];
    this.uclSwissCurrentMatchday = 1;
    this.uclSwissPhase = 'LEAGUE'; // 'LEAGUE', 'PLAYOFFS', 'ROUND_OF_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'FINAL'

    // Create 8 matchdays of 18 matches each = 144 matches total
    for (let m = 1; m <= 8; m++) {
      const matchdayFixtures = [];
      const paired = new Set();
      const shuffledClubs = [...uclClubs].sort(() => Math.random() - 0.5);

      for (let i = 0; i < shuffledClubs.length; i++) {
        const home = shuffledClubs[i];
        if (paired.has(home.id)) continue;

        // Find opponent from a different country/league if possible
        const opponent = shuffledClubs.find(away => 
          away.id !== home.id && 
          !paired.has(away.id) && 
          away.league !== home.league
        ) || shuffledClubs.find(away => away.id !== home.id && !paired.has(away.id));

        if (opponent) {
          paired.add(home.id);
          paired.add(opponent.id);
          matchdayFixtures.push({
            id: `ucl_swiss_m${m}_${i}`,
            matchday: m,
            homeClub: home,
            awayClub: opponent,
            homeGoals: 0,
            awayGoals: 0,
            played: false,
            result: null
          });
        }
      }

      this.uclSwissFixtures.push(...matchdayFixtures);
    }

    // Prepare UCL Knockout Bracket Structure
    this.uclKnockoutBracket = {
      playoffs: [], // 16 teams (Ranks 9-24)
      r16: [],      // 16 teams (Top 8 + 8 Play-off Winners)
      qf: [],       // 8 teams
      sf: [],       // 4 teams
      final: []     // 2 teams
    };
  }

  simSwissUCLMatchday() {
    if (this.uclSwissPhase !== 'LEAGUE') return;

    const currentMatches = this.uclSwissFixtures.filter(f => f.matchday === this.uclSwissCurrentMatchday && !f.played);

    currentMatches.forEach(m => {
      const hRating = m.homeClub.rating || 78;
      const aRating = m.awayClub.rating || 78;
      const diff = hRating - aRating;

      const hG = Math.max(0, Math.floor(Math.random() * 3 + (diff > 0 ? 1 : 0)));
      const aG = Math.max(0, Math.floor(Math.random() * 3 + (diff < 0 ? 1 : 0)));

      m.homeGoals = hG;
      m.awayGoals = aG;
      m.played = true;

      // Update Swiss Standings
      const hStand = this.uclSwissStandings.find(s => s.clubId === m.homeClub.id);
      const aStand = this.uclSwissStandings.find(s => s.clubId === m.awayClub.id);

      if (hStand && aStand) {
        hStand.played++;
        aStand.played++;
        hStand.gf += hG;
        hStand.ga += aG;
        aStand.gf += aG;
        aStand.ga += hG;
        hStand.gd = hStand.gf - hStand.ga;
        aStand.gd = aStand.gf - aStand.ga;

        if (hG > aG) {
          hStand.won++;
          hStand.pts += 3;
          aStand.lost++;
        } else if (aG > hG) {
          aStand.won++;
          aStand.pts += 3;
          hStand.lost++;
        } else {
          hStand.drawn++;
          aStand.drawn++;
          hStand.pts += 1;
          aStand.pts += 1;
        }
      }
    });

    // Re-sort standings: 1. Pts, 2. GD, 3. GF, 4. Won
    this.uclSwissStandings.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || b.won - a.won);

    if (this.uclSwissCurrentMatchday < 8) {
      this.uclSwissCurrentMatchday++;
    } else {
      // End of League Phase -> Generate Knockouts!
      this.uclSwissPhase = 'PLAYOFFS';
      this.generateUCLKnockouts();
    }
  }

  generateUCLKnockouts() {
    const sorted = [...this.uclSwissStandings];
    const top8 = sorted.slice(0, 8);
    const playoffTeams = sorted.slice(8, 24); // 9th to 24th

    // Generate 8 Play-off Ties (2 legs)
    const playoffMatches = [];
    for (let i = 0; i < 8; i++) {
      const seeded = playoffTeams[i]; // 9th - 16th
      const unseeded = playoffTeams[15 - i]; // 17th - 24th
      const homeClub = this.clubs.find(c => c.id === unseeded.clubId) || { name: unseeded.name, rating: unseeded.rating };
      const awayClub = this.clubs.find(c => c.id === seeded.clubId) || { name: seeded.name, rating: seeded.rating };

      playoffMatches.push({
        id: `ucl_po_${i+1}`,
        matchName: `Play-off ${i+1}`,
        homeClub,
        awayClub,
        leg1: null,
        leg2: null,
        aggregateHome: 0,
        aggregateAway: 0,
        played: false,
        winner: null
      });
    }

    this.uclKnockoutBracket.playoffs = playoffMatches;
  }
'''

# Add methods to class State
code = code.replace("  selectUserClub(clubId) {", swiss_and_cup_code + "\n  selectUserClub(clubId) {")

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/state.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated state.js with domestic cups and 36-team Swiss UCL methods!")
