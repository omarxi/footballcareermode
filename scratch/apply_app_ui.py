import re

def update_app_js():
    with open('js/app.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update bootApp, initUI, etc to call renderCompetitionsHub
    # Wait, the user's issue initially was that renderCompetitionsHub wasn't called anywhere except when clicking the tab, or it was completely missing from advanceDay.
    # We will inject renderCompetitionsHub into bootApp, btnAdvanceDay click, and closeModal.
    
    # In bootApp (near the end)
    if 'renderCompetitionsHub();' not in code.split('function bootApp()')[1].split('}')[0]:
        code = code.replace('  renderDashboard();\n  renderTeamSelectGrid();', '  renderDashboard();\n  renderTeamSelectGrid();\n  renderCompetitionsHub();')
        code = code.replace('  renderUCLHub();\n}', '  renderUCLHub();\n  renderCompetitionsHub();\n}')

    # In btnAdvanceDay (near the end of advanceDay function in app.js or btnAdvanceDay event listener)
    code = code.replace('    renderStandingsTable();\n    renderUCLHub();', '    renderStandingsTable();\n    renderUCLHub();\n    renderCompetitionsHub();')
    
    # In closeModal
    code = code.replace('  renderDashboard();\n  renderStandingsTable();\n  renderUCLHub();', '  renderDashboard();\n  renderStandingsTable();\n  renderUCLHub();\n  renderCompetitionsHub();')

    # 2. Refactor renderCompetitionsHub
    new_hub = '''function renderCompetitionsHub() {
  const userLeague = state.myClub ? state.myClub.league : 'La Liga';
  const compInfo = (typeof LEAGUE_COMPETITIONS !== 'undefined' && LEAGUE_COMPETITIONS[userLeague])
    ? LEAGUE_COMPETITIONS[userLeague]
    : { cupTitle: 'Copa del Rey' };

  const badgeEl = document.getElementById('domLeagueNameBadge');
  const titleEl = document.getElementById('domLeagueTitle');
  const treeTitleEl = document.getElementById('domCupTreeTitle');

  if (badgeEl) badgeEl.textContent = `${userLeague.toUpperCase()} • DOMESTIC COMPETITIONS`;
  if (titleEl) titleEl.textContent = `${userLeague} & ${compInfo.cupTitle}`;
  if (treeTitleEl) treeTitleEl.innerHTML = `<i class="fa-solid fa-sitemap"></i> ${compInfo.cupTitle} Bracket Tree (Knockout / Elimination)`;

  document.querySelectorAll('.sub-comp-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.sub-comp-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.subcomp-pane').forEach(p => { p.classList.remove('active'); p.style.display = 'none'; });

      btn.classList.add('active');
      const target = document.getElementById(`subview-${btn.dataset.subcomp}`);
      if (target) {
        target.classList.add('active');
        target.style.display = 'block';
      }
    };
  });

  renderDomesticLeagueTable();
  renderDomesticCupBracketTree();
  renderSwissUCLTable();
  renderUCLKnockoutBracket();
}'''

    code = re.sub(r'function renderCompetitionsHub\(\)\s*\{[\s\S]*?\}\s*function renderDomesticLeagueTable', new_hub + '\n\nfunction renderDomesticLeagueTable', code)

    # 3. Refactor renderSwissUCLTable -> uses state.uclStandings
    new_ucl = '''function renderSwissUCLTable() {
  const container = document.getElementById('uclSwissTableBody');
  const badge = document.getElementById('uclSwissMatchdayBadge');

  if (badge) {
    const uclFix = state.fixtures.filter(f => f.compType === 'UCL' && f.played);
    const md = Math.floor(uclFix.length / 6) + 1;
    badge.textContent = `MD ${Math.min(md, 8)}/8`;
  }

  if (!container || !state.uclStandings) return;

  container.innerHTML = state.uclStandings.map((st, idx) => {
    const isUser = st.clubId === state.myClubId;
    const rank = idx + 1;
    let rankBadge = '';

    if (rank <= 2) {
      rankBadge = 'background: rgba(0, 255, 137, 0.15); border-left: 4px solid #00ff87;';
    } else if (rank <= 6) {
      rankBadge = 'background: rgba(0, 240, 255, 0.12); border-left: 4px solid #00f0ff;';
    } else {
      rankBadge = 'background: rgba(255, 50, 80, 0.1); border-left: 4px solid #ff4d6d;';
    }

    const userStyle = isUser ? 'font-weight: 900; color: var(--accent-gold);' : '';

    return `
      <tr style="${rankBadge} ${userStyle}">
        <td style="padding: 0.4rem; font-weight: 800;">${rank}</td>
        <td style="padding: 0.4rem;">${st.name} ${isUser ? '⭐' : ''}</td>
        <td style="padding: 0.4rem; text-align: center;"><span style="background: rgba(255,255,255,0.08); padding: 0.1rem 0.4rem; border-radius: 4px;">Top 13</span></td>
        <td style="padding: 0.4rem; text-align: center;">${st.played}</td>
        <td style="padding: 0.4rem; text-align: center;">${st.won}</td>
        <td style="padding: 0.4rem; text-align: center;">${st.drawn}</td>
        <td style="padding: 0.4rem; text-align: center;">${st.lost}</td>
        <td style="padding: 0.4rem; text-align: center;">${st.gf}</td>
        <td style="padding: 0.4rem; text-align: center;">${st.ga}</td>
        <td style="padding: 0.4rem; text-align: center;">${st.gd > 0 ? '+' + st.gd : st.gd}</td>
        <td style="padding: 0.4rem; text-align: center; color: var(--accent-gold); font-weight: 900;">${st.pts}</td>
      </tr>
    `;
  }).join('');
}'''

    code = re.sub(r'function renderSwissUCLTable\(\)\s*\{[\s\S]*?\}\s*function renderUCLKnockoutBracket', new_ucl + '\n\nfunction renderUCLKnockoutBracket', code)

    # 4. Refactor renderUCLKnockoutBracket -> uses state.uclKnockoutBracket
    new_bracket = '''function renderUCLKnockoutBracket() {
  const container = document.getElementById('uclKnockoutBracketView');
  if (!container || !state.uclKnockoutBracket) return;

  if (!state.uclKnockoutSeeded) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(0,240,255,0.2);">
        <i class="fa-solid fa-shield-halved" style="font-size: 2rem; color: var(--accent-cyan); margin-bottom: 0.5rem; display: block;"></i>
        <div>UCL League Phase in progress</div>
        <div style="font-size: 0.8rem; margin-top: 0.25rem;">Complete the 8 matchdays for the Top 6 Knockout bracket to populate!</div>
      </div>
    `;
  } else {
    const qf = state.uclKnockoutBracket.qf || [];
    const sf = state.uclKnockoutBracket.sf || [];
    const fn = state.uclKnockoutBracket.final || [];
    
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
        ${qf.map(m => `
          <div class="bracket-node-card">
            <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 800; margin-bottom: 0.3rem;">${m.matchName}</div>
            <div class="bracket-team-row">
              <span>${m.homeClub ? m.homeClub.name : 'TBD'}</span>
            </div>
            <div class="bracket-team-row">
              <span>${m.awayClub ? m.awayClub.name : 'TBD'}</span>
            </div>
          </div>
        `).join('')}
        ${sf.map(m => `
          <div class="bracket-node-card">
            <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 800; margin-bottom: 0.3rem;">${m.matchName}</div>
            <div class="bracket-team-row">
              <span>${m.homeClub ? m.homeClub.name : 'TBD'}</span>
            </div>
            <div class="bracket-team-row">
              <span>${m.awayClub ? m.awayClub.name : 'TBD'}</span>
            </div>
          </div>
        `).join('')}
        ${fn.map(m => `
          <div class="bracket-node-card" style="border: 1px solid var(--accent-gold);">
            <div style="font-size: 0.72rem; color: var(--accent-gold); font-weight: 800; margin-bottom: 0.3rem;">🏆 ${m.matchName}</div>
            <div class="bracket-team-row">
              <span>${m.homeClub ? m.homeClub.name : 'TBD'}</span>
            </div>
            <div class="bracket-team-row">
              <span>${m.awayClub ? m.awayClub.name : 'TBD'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}'''

    code = re.sub(r'function renderUCLKnockoutBracket\(\)\s*\{[\s\S]*?\}\s*function checkEndOfSeasonTrigger', new_bracket + '\n\nfunction checkEndOfSeasonTrigger', code)

    # Note: "checkEndOfSeasonTrigger" is what comes after renderUCLKnockoutBracket (Wait! actually we just saw it's at the end, so I'll just match until end or a known function)
    # Let me ensure I match properly using a more forgiving regex
    code = re.sub(r'function renderUCLKnockoutBracket\(\)\s*\{[\s\S]*?(?=\n\nfunction|\Z)', new_bracket, code)
    
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(code)

update_app_js()
