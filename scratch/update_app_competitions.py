import re

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

comp_hub_renderer = '''
function renderCompetitionsHub() {
  const userLeague = state.myClub ? state.myClub.league : 'La Liga';
  const compInfo = (typeof LEAGUE_COMPETITIONS !== 'undefined' && LEAGUE_COMPETITIONS[userLeague])
    ? LEAGUE_COMPETITIONS[userLeague]
    : { cupTitle: 'Copa del Rey' };

  // Update Hero Titles
  const badgeEl = document.getElementById('domLeagueNameBadge');
  const titleEl = document.getElementById('domLeagueTitle');
  const treeTitleEl = document.getElementById('domCupTreeTitle');

  if (badgeEl) badgeEl.textContent = `${userLeague.toUpperCase()} • DOMESTIC COMPETITIONS`;
  if (titleEl) titleEl.textContent = `${userLeague} & ${compInfo.cupTitle}`;
  if (treeTitleEl) treeTitleEl.innerHTML = `<i class="fa-solid fa-sitemap"></i> ${compInfo.cupTitle} Bracket Tree (Knockout / Elimination)`;

  // Setup Sub-Tab Switchers
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

  // Sim Buttons
  const btnCup = document.getElementById('btnSimDomesticCupRound');
  if (btnCup) {
    btnCup.onclick = () => {
      if (!state.domesticCup || !state.domesticCup.bracket) return;
      const b = state.domesticCup.bracket;

      if (b.r16.some(m => !m.played)) {
        state.simDomesticCupRound('r16');
      } else if (b.qf.some(m => !m.played)) {
        state.simDomesticCupRound('qf');
      } else if (b.sf.some(m => !m.played)) {
        state.simDomesticCupRound('sf');
      } else if (b.final.some(m => !m.played)) {
        state.simDomesticCupRound('final');
      }
      renderDomesticCupBracketTree();
      updateHeaderStats();
    };
  }

  const btnSwiss = document.getElementById('btnSimSwissMatchday');
  if (btnSwiss) {
    btnSwiss.onclick = () => {
      state.simSwissUCLMatchday();
      renderSwissUCLTable();
      renderUCLKnockoutBracket();
      updateHeaderStats();
    };
  }
}

function renderDomesticLeagueTable() {
  const container = document.getElementById('domLeagueTableBody');
  if (!container) return;

  const sorted = [...state.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  container.innerHTML = sorted.map((st, idx) => {
    const isUser = st.clubId === state.myClubId;
    const rowStyle = isUser ? 'background: rgba(0, 240, 255, 0.12); font-weight: 800; color: var(--accent-cyan);' : '';

    return `
      <tr style="${rowStyle}">
        <td style="padding: 0.45rem;">${idx + 1}</td>
        <td style="padding: 0.45rem;">${st.name} ${isUser ? '⭐' : ''}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.played}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.won}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.drawn}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.lost}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.gd > 0 ? '+' + st.gd : st.gd}</td>
        <td style="padding: 0.45rem; text-align: center; color: var(--accent-gold); font-weight: 800;">${st.pts}</td>
      </tr>
    `;
  }).join('');
}

function renderDomesticCupBracketTree() {
  const container = document.getElementById('domesticCupBracketTree');
  if (!container || !state.domesticCup || !state.domesticCup.bracket) return;

  const b = state.domesticCup.bracket;

  const renderNode = (m) => {
    if (!m) return `<div class="bracket-node-card" style="opacity: 0.4;">TBD</div>`;
    const isUser = (m.homeClub && m.homeClub.id === state.myClubId) || (m.awayClub && m.awayClub.id === state.myClubId);
    const hWin = m.winner && m.homeClub && m.winner.id === m.homeClub.id;
    const aWin = m.winner && m.awayClub && m.winner.id === m.awayClub.id;

    return `
      <div class="bracket-node-card ${isUser ? 'user-team' : ''}">
        <div class="bracket-team-row ${hWin ? 'winner' : ''}">
          <span>${m.homeClub ? m.homeClub.name : 'TBD'}</span>
          <span class="bracket-score-pill">${m.played ? m.homeScore : '-'}</span>
        </div>
        <div style="height: 1px; background: rgba(255,255,255,0.06); margin: 0.2rem 0;"></div>
        <div class="bracket-team-row ${aWin ? 'winner' : ''}">
          <span>${m.awayClub ? m.awayClub.name : 'TBD'}</span>
          <span class="bracket-score-pill">${m.played ? m.awayScore : '-'}</span>
        </div>
      </div>
    `;
  };

  // Left Octavos (1-4)
  const leftR16 = b.r16.slice(0, 4).map(m => renderNode(m)).join('');
  // Right Octavos (5-8)
  const rightR16 = b.r16.slice(4, 8).map(m => renderNode(m)).join('');

  // Left Cuartos (1-2)
  const leftQF = b.qf.slice(0, 2).map(m => renderNode(m)).join('');
  // Right Cuartos (3-4)
  const rightQF = b.qf.slice(2, 4).map(m => renderNode(m)).join('');

  // Semifinals (1 & 2)
  const leftSF = renderNode(b.sf[0]);
  const rightSF = renderNode(b.sf[1]);

  // Final
  const finalNode = renderNode(b.final[0]);

  container.innerHTML = `
    <div class="bracket-column">
      <div class="bracket-round-header">Octavos (1-4)</div>
      ${leftR16}
    </div>
    <div class="bracket-column">
      <div class="bracket-round-header">Cuartos (1-2)</div>
      ${leftQF}
    </div>
    <div class="bracket-column">
      <div class="bracket-round-header">Semifinal 1</div>
      ${leftSF}
    </div>
    <div class="bracket-column" style="background: rgba(255,215,0,0.05); padding: 0.5rem; border-radius: 12px; border: 1px solid rgba(255,215,0,0.2);">
      <div class="bracket-round-header" style="background: var(--accent-gold); color: #000;">🏆 GRAN FINAL</div>
      ${finalNode}
    </div>
    <div class="bracket-column">
      <div class="bracket-round-header">Semifinal 2</div>
      ${rightSF}
    </div>
    <div class="bracket-column">
      <div class="bracket-round-header">Cuartos (3-4)</div>
      ${rightQF}
    </div>
    <div class="bracket-column">
      <div class="bracket-round-header">Octavos (5-8)</div>
      ${rightR16}
    </div>
  `;
}

function renderSwissUCLTable() {
  const container = document.getElementById('uclSwissTableBody');
  const badge = document.getElementById('uclSwissMatchdayBadge');

  if (badge) {
    badge.textContent = state.uclSwissPhase === 'LEAGUE' 
      ? `MD ${state.uclSwissCurrentMatchday}/8`
      : state.uclSwissPhase;
  }

  if (!container || !state.uclSwissStandings) return;

  container.innerHTML = state.uclSwissStandings.map((st, idx) => {
    const isUser = st.clubId === state.myClubId;
    const rank = idx + 1;
    let rankBadge = '';

    if (rank <= 8) {
      rankBadge = 'background: rgba(0, 255, 137, 0.15); border-left: 4px solid #00ff87;';
    } else if (rank <= 24) {
      rankBadge = 'background: rgba(0, 240, 255, 0.12); border-left: 4px solid #00f0ff;';
    } else {
      rankBadge = 'background: rgba(255, 50, 80, 0.1); border-left: 4px solid #ff4d6d;';
    }

    const userStyle = isUser ? 'font-weight: 900; color: var(--accent-gold);' : '';

    return `
      <tr style="${rankBadge} ${userStyle}">
        <td style="padding: 0.4rem; font-weight: 800;">${rank}</td>
        <td style="padding: 0.4rem;">${st.name} ${isUser ? '⭐' : ''}</td>
        <td style="padding: 0.4rem; text-align: center;"><span style="background: rgba(255,255,255,0.08); padding: 0.1rem 0.4rem; border-radius: 4px;">Pot ${st.pot}</span></td>
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
}

function renderUCLKnockoutBracket() {
  const container = document.getElementById('uclKnockoutBracketView');
  if (!container || !state.uclKnockoutBracket) return;

  const po = state.uclKnockoutBracket.playoffs;
  if (!po || po.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(0,240,255,0.2);">
        <i class="fa-solid fa-shield-halved" style="font-size: 2rem; color: var(--accent-cyan); margin-bottom: 0.5rem; display: block;"></i>
        <div>UCL League Phase in progress (Matchday ${state.uclSwissCurrentMatchday}/8)</div>
        <div style="font-size: 0.8rem; margin-top: 0.25rem;">Complete 8 matchdays to unlock the 16-Team Knockout Play-offs & Round of 16 Brackets!</div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
        ${po.map(m => `
          <div class="bracket-node-card">
            <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 800; margin-bottom: 0.3rem;">${m.matchName}</div>
            <div class="bracket-team-row">
              <span>${m.homeClub ? m.homeClub.name : 'TBD'}</span>
              <span class="bracket-score-pill">${m.played ? m.aggregateHome : '-'}</span>
            </div>
            <div class="bracket-team-row">
              <span>${m.awayClub ? m.awayClub.name : 'TBD'}</span>
              <span class="bracket-score-pill">${m.played ? m.aggregateAway : '-'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}
'''

# Update tab switching in app.js to call renderCompetitionsHub()
app_code = app_code + "\n" + comp_hub_renderer

# Add renderCompetitionsHub call when tab competitions is clicked
app_code = re.sub(
    r'(if\s*\(\s*tabName\s*===\s*[\'\"]office[\'\"]\s*\)\s*renderOffice\(\);)',
    r'\1\n  if (tabName === "competitions") renderCompetitionsHub();',
    app_code
)

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/app.js', 'w', encoding='utf-8') as f:
    f.write(app_code)

print("Updated app.js with Competitions Hub & Visual Bracket Tree renderer!")
