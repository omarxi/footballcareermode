import re

def update_engine():
    with open('js/components/matchEngine.js', 'r', encoding='utf-8') as f:
        code = f.read()

    new_end_logic = '''
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
  }
}
'''

    code = re.sub(r'  fixture\.played = true;\s*fixture\.result = \{ homeScore, awayScore \};\s*const dataset = fixture\.competition.*?\}\s*\}', new_end_logic, code, flags=re.DOTALL)
    
    with open('js/components/matchEngine.js', 'w', encoding='utf-8') as f:
        f.write(code)

update_engine()
