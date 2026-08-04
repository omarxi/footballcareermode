import re

app_file = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/app.js'

with open(app_file, 'r', encoding='utf-8') as f:
    app_code = f.read()

render_code = '''
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

  const leftR16 = b.r16.slice(0, 4).map(m => renderNode(m)).join('');
  const rightR16 = b.r16.slice(4, 8).map(m => renderNode(m)).join('');
  const leftQF = b.qf.slice(0, 2).map(m => renderNode(m)).join('');
  const rightQF = b.qf.slice(2, 4).map(m => renderNode(m)).join('');
  const leftSF = renderNode(b.sf[0]);
  const rightSF = renderNode(b.sf[1]);
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
  if (!container || !state.uclStandings) return;

  const sorted = [...state.uclStandings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);

  container.innerHTML = sorted.map((st, idx) => {
    const isUser = st.clubId === state.myClubId;
    const rank = idx + 1;
    let rankBadge = '';

    if (rank <= 2) {
      rankBadge = 'background: rgba(0, 255, 137, 0.15); border-left: 4px solid #00ff87;';
    } else if (rank <= 6) {
      rankBadge = 'background: rgba(0, 240, 255, 0.12); border-left: 4px solid #00f0ff;';
    } else {
      rankBadge = 'background: rgba(255, 50, 80, 0.08); border-left: 4px solid #ff4d6d;';
    }

    const userStyle = isUser ? 'font-weight: 900; color: var(--accent-gold);' : '';

    return `
      <tr style="${rankBadge} ${userStyle}">
        <td style="padding: 0.45rem; font-weight: 800;">${rank}</td>
        <td style="padding: 0.45rem;">${st.name} ${isUser ? '⭐' : ''}</td>
        <td style="padding: 0.45rem; text-align: center;"><span style="font-weight:700;">${rank <= 2 ? '🟢 Semi-Finals' : (rank <= 6 ? '🔵 Play-offs (QF)' : '🔴 Out')}</span></td>
        <td style="padding: 0.45rem; text-align: center;">${st.played}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.won}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.drawn}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.lost}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.gf}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.ga}</td>
        <td style="padding: 0.45rem; text-align: center;">${st.gd > 0 ? '+' + st.gd : st.gd}</td>
        <td style="padding: 0.45rem; text-align: center; color: var(--accent-gold); font-weight: 900;">${st.pts}</td>
      </tr>
    `;
  }).join('');
}

function renderUCLKnockoutBracket() {
  const container = document.getElementById('uclKnockoutBracketView');
  if (!container || !state.uclKnockoutBracket) return;

  const kb = state.uclKnockoutBracket;

  const renderNode = (m) => {
    if (!m) return `<div class="bracket-node-card" style="opacity: 0.4;">TBD</div>`;
    const isUser = (m.homeClub && m.homeClub.id === state.myClubId) || (m.awayClub && m.awayClub.id === state.myClubId);

    return `
      <div class="bracket-node-card ${isUser ? 'user-team' : ''}">
        <div style="font-size: 0.7rem; color: var(--accent-cyan); font-weight: 800; margin-bottom: 0.2rem;">${m.matchName}</div>
        <div class="bracket-team-row">
          <span>${m.homeClub ? m.homeClub.name : 'TBD'}</span>
          <span class="bracket-score-pill">${m.played ? m.homeScore : '-'}</span>
        </div>
        <div class="bracket-team-row">
          <span>${m.awayClub ? m.awayClub.name : 'TBD'}</span>
          <span class="bracket-score-pill">${m.played ? m.awayScore : '-'}</span>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem;">
      <div class="card-tile">
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--accent-cyan); margin-bottom: 0.5rem;">QUARTER-FINALS (3rd–6th)</div>
        ${kb.qf.map(m => renderNode(m)).join('')}
      </div>
      <div class="card-tile">
        <div style="font-size: 0.8rem; font-weight: 800; color: var(--accent-gold); margin-bottom: 0.5rem;">SEMI-FINALS (1st & 2nd Bye)</div>
        ${kb.sf.map(m => renderNode(m)).join('')}
      </div>
      <div class="card-tile" style="border: 1px solid var(--accent-gold);">
        <div style="font-size: 0.8rem; font-weight: 800; color: #fff; background: var(--accent-gold); color: #000; padding: 0.2rem 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">🏆 GRAND FINAL</div>
        ${renderNode(kb.final[0])}
      </div>
    </div>
  `;
}
'''

# Update app.js
app_code = re.sub(r'function renderCompetitionsHub\(\)\s*\{.*?function renderUCLKnockoutBracket\(\)\s*\{.*?\}\n\}', render_code.strip(), app_code, flags=re.DOTALL)

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_code)

print("app.js updated with 13-team UCL & integrated calendar rendering!")
