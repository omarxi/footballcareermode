/* Main Application Controller & UI View Manager */










let selectedPitchSlot = null;
let currentMatchEngine = null;

// Global image error handler for clean, styled badge fallback without raw HTML corruption
window.handleCrestError = function(imgEl) {
  const shortName = imgEl.getAttribute('data-short') || 'FC';
  const color = imgEl.getAttribute('data-color') || '#00f0ff';
  const style = imgEl.getAttribute('style') || 'width:28px;height:28px;';

  const badge = document.createElement('span');
  badge.className = 'club-badge-fallback';
  badge.style.cssText = `${style}; display:inline-flex; align-items:center; justify-content:center; background: linear-gradient(135deg, ${color}, #111827); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 0.7rem; font-weight: 900; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.9); box-shadow: 0 2px 6px rgba(0,0,0,0.5); text-transform: uppercase; user-select:none; line-height:1;`;
  badge.innerText = shortName.slice(0, 3);

  imgEl.replaceWith(badge);
};

// Helper to render club crest images or fallback styled emblems
function renderCrestHtml(crestUrl, clubOrShort = 'FC', style = 'width:28px;height:28px;') {
  let shortName = 'FC';
  let color = '#00f0ff';

  if (typeof clubOrShort === 'object' && clubOrShort !== null) {
    shortName = clubOrShort.shortName || clubOrShort.name || 'FC';
    color = clubOrShort.color || '#00f0ff';
  } else if (typeof clubOrShort === 'string' && clubOrShort.length <= 4 && clubOrShort !== '🛡️' && clubOrShort !== '⚡' && clubOrShort !== '👑') {
    shortName = clubOrShort;
  }

  const tagText = shortName.length > 3 ? shortName.slice(0, 3) : shortName;

  const fallbackBadge = `<span class="club-badge-fallback" style="${style}; display:inline-flex; align-items:center; justify-content:center; background: linear-gradient(135deg, ${color}, #111827); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; font-size: 0.7rem; font-weight: 900; color: #ffffff; text-shadow: 0 1px 3px rgba(0,0,0,0.9); box-shadow: 0 2px 6px rgba(0,0,0,0.5); text-transform: uppercase; user-select:none; line-height:1;">${tagText}</span>`;

  if (!crestUrl || typeof crestUrl !== 'string' || crestUrl.trim() === '') {
    return fallbackBadge;
  }

  return `<img src="${crestUrl}" alt="${shortName}" style="${style}; object-fit: contain; vertical-align: middle; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));" data-short="${tagText}" data-color="${color}" onError="window.handleCrestError(this)" />`;
}

function bootApp() {
  initUI();
  renderTeamSelectGrid('ALL');
  
  updateHeaderStats();
  renderDashboard();
  renderSquadHub();
  renderTransfers();
  renderYouthAcademy();
  renderOffice();
  renderStandingsTable();
  renderUCLHub();
  renderCompetitionsHub();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootApp);
} else {
  bootApp();
}

function initUI() {
  // Navigation Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.classList.contains('league-filter-btn') || btn.classList.contains('comp-switch-btn')) return;
    btn.addEventListener('click', () => {
      state.playSound('click');
      document.querySelectorAll('.tab-btn:not(.league-filter-btn):not(.comp-switch-btn)').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');

      if (btn.dataset.tab === 'ucl') {
        renderUCLHub();
      }
    });
  });

  // Advance Day Button
  document.getElementById('btnAdvanceDay')?.addEventListener('click', () => {
    const unplayed = state.fixtures.filter(f => !f.played);
    if (unplayed.length === 0) {
      openEndOfSeasonModal();
      return;
    }
    state.advanceDay();

    // Youth League matchday & player rating growth
    if (state.currentDate.getDay() === 6) {
      youthEngine.simYouthMatchday();
    } else {
      youthEngine.processYouthGrowth(false);
    }

    updateHeaderStats();
    renderDashboard();
    renderUCLHub();
    renderYouthAcademy();
  });

  // Change Club Button
  document.getElementById('btnChangeTeam')?.addEventListener('click', () => {
    renderTeamSelectGrid('ALL');
    const modal = document.getElementById('teamSelectModal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  });

  // Team Selection League Filter Tabs
  document.querySelectorAll('.league-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.league-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTeamSelectGrid(btn.dataset.league);
    });
  });

  // Competition Switcher Buttons in Standings Widget
  document.querySelectorAll('.comp-switch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.comp-switch-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeCompetition = btn.dataset.comp;
      renderStandingsTable();
      renderDashboard();
    });
  });

  // Switch to UCL Button in UCL Tab
  document.getElementById('btnSwitchToUCL')?.addEventListener('click', () => {
    state.activeCompetition = 'UCL';
    openMatchModal();
  });

  // Formation Change Listener
  document.getElementById('formationSelect')?.addEventListener('change', (e) => {
    state.selectedFormationKey = e.target.value;
    state.playSound('click');
    renderSquadHub();
  });

  // Play / Sim Match Handlers
  document.getElementById('btnPlayMatch')?.addEventListener('click', () => {
    openMatchModal();
  });

  document.getElementById('btnQuickSim')?.addEventListener('click', () => {
    quickSimMatch();
  });

  document.getElementById('btnSimSeason')?.addEventListener('click', () => {
    simRestOfSeason();
  });

  document.getElementById('btnStartNextSeasonConfirm')?.addEventListener('click', () => {
    state.startNextSeason();
    const modal = document.getElementById('endOfSeasonModal');
    if (modal) modal.classList.remove('active');

    updateHeaderStats();
    renderDashboard();
    renderSquadHub();
    renderTransfers();
    renderYouthAcademy();
    renderStandingsTable();
    renderUCLHub();
    renderCompetitionsHub();
    state.playSound?.('goal');
  });

  // Chief Scout Consultation Modal Trigger
  document.getElementById('btnOpenScoutConsult')?.addEventListener('click', () => {
    openScoutModal();
  });

  // Modal Close Handlers — just remove 'active', don't set display:none (CSS handles it)
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });
}

function renderTeamSelectGrid(leagueFilter = 'ALL') {
  const grid = document.getElementById('teamSelectGrid');
  if (!grid) return;

  const filteredClubs = leagueFilter === 'ALL'
    ? state.clubs
    : state.clubs.filter(c => c.league === leagueFilter);

  grid.innerHTML = filteredClubs.map(club => `
    <div class="team-select-card ${club.id === state.myClubId ? 'active-club' : ''}" data-club-id="${club.id}">
      <div class="team-select-badge">
        ${renderCrestHtml(club.crest, club, 'width:68px;height:68px;')}
      </div>
      <div class="team-select-title">${club.name}</div>
      <div class="team-select-league">${club.league}</div>
      
      <div class="team-select-ratings">
        <span>ATT ${club.att}</span> • <span>MID ${club.mid}</span> • <span>DEF ${club.def}</span>
      </div>
      
      <div style="font-size:0.8rem;color:var(--accent-lime);font-weight:700;margin-bottom:0.8rem;">
        Budget: €${(club.budget / 1000000).toFixed(0)}M
      </div>

      <button class="btn-primary team-select-btn" data-club-id="${club.id}">
        <i class="fa-solid fa-check"></i> Choose Club
      </button>
    </div>
  `).join('');

  grid.querySelectorAll('.team-select-card').forEach(card => {
    const selectFn = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const clubId = card.dataset.clubId;
      if (!clubId) return;

      const nameInput = document.getElementById('managerNameInput');
      if (nameInput && nameInput.value.trim()) {
        state.managerName = nameInput.value.trim();
      }

      state.selectUserClub(clubId);
      state.playSound?.('click');

      const modal = document.getElementById('teamSelectModal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }

      updateHeaderStats();
      renderDashboard();
      renderSquadHub();
      renderTransfers();
      renderStandingsTable();
      renderUCLHub();
    };

    card.onclick = selectFn;
    const btn = card.querySelector('.team-select-btn');
    if (btn) btn.onclick = selectFn;
  });
}

function updateHeaderStats() {
  document.getElementById('headerDateText').innerText = state.getFormattedDate();
  document.getElementById('headerClubName').innerText = state.myClub.name;
  
  const seasonTitle = document.querySelector('.manager-title');
  if (seasonTitle) seasonTitle.innerText = `Manager Career • Season ${state.season}`;

  const crestEl = document.getElementById('headerClubCrest');
  if (crestEl) {
    crestEl.innerHTML = renderCrestHtml(state.myClub.crest, state.myClub, 'width:42px;height:42px;');
  }

  document.getElementById('headerManagerRating').innerText = `${state.managerRating}%`;
  document.getElementById('headerBudget').innerText = `€${(state.myClub.budget / 1000000).toFixed(1)}M`;
  document.getElementById('headerWageBudget').innerText = `€${(state.myClub.wageBudget / 1000).toFixed(0)}k/wk`;

  // Update Team Ratings
  const ratings = calculateTeamRatings();
  document.getElementById('headerTeamOvr').innerText = ratings.ovr;
  document.getElementById('attRating').innerText = ratings.att;
  document.getElementById('midRating').innerText = ratings.mid;
  document.getElementById('defRating').innerText = ratings.def;
}

function renderDashboard() {
  // Next Fixture Widget
  const nextFix = state.getNextFixture();
  if (nextFix) {
    const homeCrestEl = document.getElementById('homeTeamCrest');
    if (homeCrestEl) homeCrestEl.innerHTML = renderCrestHtml(nextFix.homeClub.crest, nextFix.homeClub, 'width:64px;height:64px;');
    document.getElementById('homeTeamName').innerText = nextFix.homeClub.name;

    const awayCrestEl = document.getElementById('awayTeamCrest');
    if (awayCrestEl) awayCrestEl.innerHTML = renderCrestHtml(nextFix.awayClub.crest, nextFix.awayClub, 'width:64px;height:64px;');
    document.getElementById('nextOpponentName').innerText = nextFix.awayClub.name;

    const compLabel = nextFix.competition || nextFix.awayClub.league;
    document.getElementById('nextMatchdayText').innerText = `MATCHDAY ${nextFix.matchday} • ${compLabel.toUpperCase()}`;
    document.getElementById('nextOpponentRating').innerText = `${nextFix.awayClub.rating} OVR`;
  } else {
    document.getElementById('nextOpponentName').innerText = 'Season Completed!';
  }

  // News Ticker
  const newsContainer = document.getElementById('dashboardNewsFeed');
  if (newsContainer) {
    newsContainer.innerHTML = state.news.map(item => `
      <div class="chat-bubble agent">
        <div style="font-size: 0.72rem; color: var(--accent-cyan); font-weight: 800; text-transform: uppercase;">${item.category} • ${item.date}</div>
        <div style="font-weight: 700; margin-top: 2px;">${item.headline}</div>
      </div>
    `).join('');
  }

  // Inbox Roster
  const inboxContainer = document.getElementById('dashboardInboxList');
  if (inboxContainer) {
    inboxContainer.innerHTML = state.inbox.map((msg, idx) => `
      <div class="player-row-item inbox-row-item" data-inbox-index="${idx}" style="cursor: pointer; transition: transform 0.15s ease, background 0.15s ease;">
        <div class="player-row-left">
          <div class="player-ovr-pill" style="background: rgba(0, 240, 255, 0.15); color: var(--accent-cyan);">✉️</div>
          <div class="player-row-meta">
            <div class="player-row-name">${msg.title}</div>
            <div class="player-row-pos-age">${msg.sender} • ${msg.date}</div>
          </div>
        </div>
        <button class="btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.72rem; border-color: rgba(0, 240, 255, 0.3); color: var(--accent-cyan);">
          Open <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    `).join('');

    inboxContainer.querySelectorAll('.inbox-row-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(item.dataset.inboxIndex);
        const msg = state.inbox[idx];
        if (!msg) return;

        // Only open negotiation modal for STILL-PENDING transfer offers
        const matchingOffer = state.incomingOffers.find(o => 
          o.status === 'PENDING' && (msg.title.includes(o.playerName) || msg.body.includes(o.playerName))
        );

        if (matchingOffer) {
          openIncomingOfferModal(matchingOffer);
        } else {
          // Message refers to a completed/rejected deal or general notice — show inbox detail
          showInboxDetailModal(msg);
        }
      });
    });
  }

}

function renderSquadHub() {
  const pitchWrapper = document.getElementById('interactivePitch');
  if (pitchWrapper) {
    renderPitch(pitchWrapper, selectedPitchSlot, (slotIndex) => {
      selectedPitchSlot = slotIndex;
      renderSquadHub();
    });
  }

  const fullRosterContainer = document.getElementById('squadFullRosterList');
  const benchContainer = document.getElementById('squadBenchList');

  const allSquadPlayers = state.players.filter(p => p.clubId === state.myClubId);
  allSquadPlayers.sort((a, b) => b.ovr - a.ovr);

  // 1. Render Full Squad Roster on the LEFT SIDE (with Talk & For Sale buttons)
  if (fullRosterContainer) {
    fullRosterContainer.innerHTML = allSquadPlayers.map((player) => {
      const isStarter = state.starters.some(s => s.id === player.id);

      return `
      <div class="player-row-item ${selectedPitchSlot !== null && !isStarter ? 'bench-selectable' : ''}">
        <div class="player-row-left">
          <div class="player-ovr-pill">${player.ovr}</div>
          <div class="player-row-meta">
            <div class="player-row-name">
              ${player.name}
              ${isStarter 
                ? '<span style="background:rgba(0,255,137,0.15); color:var(--accent-lime); padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:800; border:1px solid rgba(0,255,137,0.3); margin-left:4px;">STARTING XI</span>' 
                : '<span style="background:rgba(255,255,255,0.08); color:var(--text-muted); padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:700; margin-left:4px;">BENCH</span>'}
              ${player.isTransferListed 
                ? '<span style="background:rgba(255,50,80,0.15); color:#ff4d6d; padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:800; border:1px solid rgba(255,50,80,0.3); margin-left:4px;"><i class="fa-solid fa-tag"></i> FOR SALE</span>' 
                : ''}
              ${player.isLoanListed 
                ? '<span style="background:rgba(0,240,255,0.15); color:var(--accent-cyan); padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:800; border:1px solid rgba(0,240,255,0.3); margin-left:4px;"><i class="fa-solid fa-handshake"></i> LOAN LISTED</span>' 
                : ''}
              ${player.isLoaned 
                ? `<span style="background:rgba(255,207,37,0.15); color:var(--accent-gold); padding:2px 6px; border-radius:4px; font-size:0.68rem; font-weight:800; border:1px solid rgba(255,207,37,0.3); margin-left:4px;"><i class="fa-solid fa-arrow-right-arrow-left"></i> ON LOAN AT ${player.loanClub || 'RIVAL'}</span>` 
                : ''}
            </div>
            <div class="player-row-pos-age"><strong style="color:var(--accent-lime);">${player.pos}</strong> • Age ${player.age} • ${player.nation} • Val: €${(player.val/1000000).toFixed(1)}M</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.35rem; align-items: center;">
          <button class="btn-secondary btn-toggle-list" data-player-id="${player.id}" style="padding: 0.35rem 0.55rem; font-size: 0.72rem; ${player.isTransferListed ? 'background:rgba(255,50,80,0.2); color:#ff4d6d;' : ''}">
            <i class="fa-solid fa-tag"></i> ${player.isTransferListed ? 'Unlist' : 'For Sale'}
          </button>
          <button class="btn-secondary btn-toggle-loan" data-player-id="${player.id}" style="padding: 0.35rem 0.55rem; font-size: 0.72rem; ${player.isLoanListed ? 'background:rgba(0,240,255,0.2); color:var(--accent-cyan);' : ''}">
            <i class="fa-solid fa-handshake"></i> ${player.isLoanListed ? 'Unlist Loan' : 'List Loan'}
          </button>
          <button class="btn-secondary btn-talk-player" data-player-id="${player.id}" style="padding: 0.35rem 0.55rem; font-size: 0.72rem;">
            <i class="fa-solid fa-comments"></i> Talk
          </button>
          ${(selectedPitchSlot !== null && !isStarter) ? `
            <button class="btn-primary btn-squad-swap" data-player-id="${player.id}" style="padding: 0.35rem 0.65rem; font-size: 0.72rem;">
              Swap
            </button>
          ` : ''}
        </div>
      </div>

      `;
    }).join('');

    fullRosterContainer.querySelectorAll('.btn-toggle-list').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.toggleTransferList(btn.dataset.playerId);
        renderSquadHub();
        renderTransfers();
      });
    });

    fullRosterContainer.querySelectorAll('.btn-toggle-loan').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.toggleLoanList(btn.dataset.playerId);
        renderSquadHub();
        renderTransfers();
      });
    });

    fullRosterContainer.querySelectorAll('.btn-talk-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const player = state.players.find(p => p.id === btn.dataset.playerId);
        if (player) openPlayerTalkModal(player);
      });
    });

    fullRosterContainer.querySelectorAll('.btn-squad-swap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        swapPlayerIntoPitchSlot(btn.dataset.playerId);
      });
    });
  }

  // 2. Render Substitutes & Bench on the RIGHT SIDE (under Pitch)
  if (benchContainer) {
    const benchPlayers = state.bench;
    benchContainer.innerHTML = benchPlayers.map((player) => `
      <div class="player-row-item ${selectedPitchSlot !== null ? 'bench-selectable' : ''}">
        <div class="player-row-left">
          <div class="player-ovr-pill" style="background:rgba(255,207,37,0.15); color:var(--accent-gold);">${player.ovr}</div>
          <div class="player-row-meta">
            <div class="player-row-name">${player.name}</div>
            <div class="player-row-pos-age"><strong style="color:var(--accent-lime);">${player.pos}</strong> • Age ${player.age} • Val: €${(player.val/1000000).toFixed(1)}M</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.35rem; align-items: center;">
          <button class="btn-secondary btn-talk-player" data-player-id="${player.id}" style="padding: 0.35rem 0.55rem; font-size: 0.72rem;">
            <i class="fa-solid fa-comments"></i> Talk
          </button>
          <button class="btn-primary btn-squad-swap" data-player-id="${player.id}" style="padding: 0.35rem 0.65rem; font-size: 0.72rem;">
            ${selectedPitchSlot !== null ? 'Swap' : 'Select'}
          </button>
        </div>
      </div>
    `).join('');

    benchContainer.querySelectorAll('.btn-talk-player').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const player = state.players.find(p => p.id === btn.dataset.playerId);
        if (player) openPlayerTalkModal(player);
      });
    });

    benchContainer.querySelectorAll('.btn-squad-swap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        swapPlayerIntoPitchSlot(btn.dataset.playerId);
      });
    });
  }
}

function swapPlayerIntoPitchSlot(targetPlayerId) {
  const targetPlayer = state.players.find(p => p.id === targetPlayerId);
  if (!targetPlayer) return;

  const isAlreadyStarter = state.starters.some(s => s.id === targetPlayerId);
  if (isAlreadyStarter) {
    // Starting XI players cannot be swapped into another slot from full roster
    return;
  }

  if (selectedPitchSlot === null) {
    selectedPitchSlot = 0;
  }

  const currentSlotPlayer = state.starters[selectedPitchSlot];
  const targetBenchIdx = state.bench.findIndex(s => s.id === targetPlayerId);

  if (targetBenchIdx !== -1) {
    state.starters[selectedPitchSlot] = targetPlayer;
    state.bench[targetBenchIdx] = currentSlotPlayer;
  } else {
    // If not in bench array yet (reserve player), swap into starters and put old starter into bench
    state.starters[selectedPitchSlot] = targetPlayer;
    state.bench = state.bench.filter(b => b.id !== targetPlayerId);
    if (currentSlotPlayer) state.bench.push(currentSlotPlayer);
  }

  selectedPitchSlot = null;
  state.playSound('click');
  updateHeaderStats();
  renderSquadHub();
}



function renderTransfers() {
  const searchInput = document.getElementById('transferSearchInput');
  const resultsContainer = document.getElementById('transferResultsList');
  
  // Render Incoming Bids
  const renderIncomingBids = () => {
    const listEl = document.getElementById('incomingBidsList');
    const badgeEl = document.getElementById('incomingBidsCountBadge');
    if (!listEl) return;

    const pendingOffers = state.incomingOffers.filter(o => o.status === 'PENDING');
    if (badgeEl) badgeEl.textContent = `${pendingOffers.length} Pending`;

    if (!pendingOffers.length) {
      listEl.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.6rem; text-align: center;">No active transfer bids for your players at this time. Advance days to receive offers!</div>`;
      return;
    }

    listEl.innerHTML = pendingOffers.map(o => `
      <div style="background: rgba(0,0,0,0.3); padding: 0.7rem 0.9rem; border-radius: 8px; border: 1px solid rgba(0,255,137,0.2); display: flex; align-items: center; justify-content: space-between; gap: 0.8rem;">
        <div>
          <div style="font-weight: 800; color: #fff; font-size: 0.92rem;">${o.playerName} <span style="color: var(--accent-lime); font-size: 0.8rem;">(${o.playerPos} • ${o.playerOvr} OVR)</span></div>
          <div style="font-size: 0.78rem; color: var(--text-muted);">Bid from <strong style="color: #fff;">${o.biddingClubName}</strong> • Offered: <strong style="color: var(--accent-lime);">€${(o.bidAmount / 1000000).toFixed(1)}M</strong></div>
        </div>
        <button class="btn-primary btn-review-bid" data-offer-id="${o.id}" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; background: linear-gradient(135deg, var(--accent-lime), #00b359); color: #001a0d; font-weight: 800; border: none; border-radius: 6px; cursor: pointer;">
          <i class="fa-solid fa-file-signature"></i> Respond
        </button>
      </div>
    `).join('');

    listEl.querySelectorAll('.btn-review-bid').forEach(btn => {
      btn.onclick = () => {
        const oId = btn.dataset.offerId;
        const offer = state.incomingOffers.find(x => x.id === oId);
        if (offer) openIncomingOfferModal(offer);
      };
    });
  };

  renderIncomingBids();

  if (!resultsContainer) return;

  const renderPlayers = (query = '') => {
    const availablePlayers = state.players.filter(p => 
      p.clubId !== state.myClubId && 
      (p.name.toLowerCase().includes(query.toLowerCase()) || 
       p.pos.toLowerCase().includes(query.toLowerCase()) ||
       p.clubId.toLowerCase().includes(query.toLowerCase()))
    );

    resultsContainer.innerHTML = availablePlayers.map(p => {
      const club = state.clubs.find(c => c.id === p.clubId);
      const clubName = club ? club.name : p.clubId;
      const clubCrest = club ? club.crest : '';

      return `
        <div class="player-row-item">
          <div class="player-row-left">
            <div class="player-ovr-pill">${p.ovr}</div>
            <div class="player-row-meta">
              <div class="player-row-name">${p.name} (<strong style="color:var(--accent-lime);">${p.pos}</strong>) ${p.nation}</div>
              <div class="player-row-pos-age" style="display:flex;align-items:center;gap:0.4rem;margin-top:2px;">
                ${renderCrestHtml(clubCrest, club ? club : p.clubId, 'width:16px;height:16px;')}
                <span>${clubName} • Val: €${(p.val / 1000000).toFixed(1)}M • Wage: €${(p.wage / 1000).toFixed(0)}k/wk</span>
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            <button class="btn-secondary btn-loan-negotiate" data-player-id="${p.id}" style="border: 1px solid var(--accent-cyan); color: var(--accent-cyan); font-size: 0.78rem; padding: 0.4rem 0.75rem;">
              <i class="fa-solid fa-handshake"></i> Loan
            </button>
            <button class="btn-primary btn-negotiate" data-player-id="${p.id}" style="font-size: 0.78rem; padding: 0.4rem 0.85rem;">Approach to Buy</button>
          </div>
        </div>
      `;
    }).join('');

    resultsContainer.querySelectorAll('.btn-negotiate').forEach(btn => {
      btn.addEventListener('click', () => {
        const player = state.players.find(p => p.id === btn.dataset.playerId);
        if (player) openNegotiationModal(player);
      });
    });

    resultsContainer.querySelectorAll('.btn-loan-negotiate').forEach(btn => {
      btn.addEventListener('click', () => {
        const player = state.players.find(p => p.id === btn.dataset.playerId);
        if (player) openLoanNegotiationModal(player);
      });
    });
  };

  renderPlayers();

  if (searchInput) {
    searchInput.addEventListener('input', (e) => renderPlayers(e.target.value));
  }
}

function openNegotiationModal(player) {
  // Fully reset before starting a new negotiation
  transferEngine.activeNegotiation = null;
  const neg = transferEngine.startNegotiation(player);
  const modal = document.getElementById('negotiationModal');
  if (!modal) return;

  const priceLabel = document.getElementById('negAskingPriceLabel');
  const offerLabel = document.getElementById('negOfferInputLabel');
  const durationGroup = document.getElementById('loanDurationGroup');
  if (priceLabel) priceLabel.textContent = 'Asking Price';
  if (offerLabel) offerLabel.textContent = 'Your Offer (€ Millions)';
  if (durationGroup) durationGroup.style.display = 'none';

  // Clear all input fields
  const feeInput = document.getElementById('feeOfferInput');
  const wageInput = document.getElementById('wageOfferInput');
  const chatInput = document.getElementById('playerChatInput');
  if (feeInput) {
    feeInput.value = '';
    feeInput.placeholder = 'e.g. 110';
  }
  if (wageInput) wageInput.value = '';
  if (chatInput) chatInput.value = '';

  // Reset all section visibility
  document.getElementById('feeNegotiationSection').style.display = 'block';
  document.getElementById('negPlayerChatSection').style.display = 'none';
  document.getElementById('contractNegotiationSection').style.display = 'none';
  document.getElementById('negPlayerChatLog').innerHTML = '';
  document.getElementById('negStageLabel').innerText = 'PHASE 1 — Club Fee Negotiation';
  document.getElementById('negMoodBar').innerText = '';

  document.getElementById('negPlayerName').innerText = `${player.name} (${player.pos} - ${player.ovr} OVR) ${player.nation}`;
  document.getElementById('negAskingPrice').innerText = `€${(neg.askingPrice / 1000000).toFixed(1)}M`;
  document.getElementById('negChatLog').innerHTML = `
    <div class="chat-bubble agent">
      <strong>Opposing Manager:</strong> "We're open to discussing ${player.name}'s future. Our valuation stands at €${(neg.askingPrice / 1000000).toFixed(1)}M. What can you offer?"
    </div>
  `;

  modal.classList.add('active');

  // Wire close button — use onclick (not addEventListener) to avoid listener stacking
  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      transferEngine.activeNegotiation = null;
      modal.classList.remove('active');
    };
  }

  // Wire fee offer button with onclick to avoid duplicate handlers
  document.getElementById('btnSubmitFeeOffer').onclick = () => {
    const offer = parseFloat(document.getElementById('feeOfferInput').value) * 1000000;
    if (!offer || isNaN(offer)) return;
    const result = transferEngine.submitFeeOffer(offer);
    renderNegotiationChat(result);
  };
}


function renderNegotiationChat(neg) {
  const logEl = document.getElementById('negChatLog');
  logEl.innerHTML = neg.history.map(h => `
    <div class="chat-bubble ${h.status}">
      <strong>${h.sender}:</strong> ${h.text}
    </div>
  `).join('');
  logEl.scrollTop = logEl.scrollHeight;

  if (neg.stage === 'FAILED') {
    document.getElementById('feeNegotiationSection').style.display = 'none';
    document.getElementById('negStageLabel').innerText = '❌ Negotiation Collapsed';
    return;
  }

  if (neg.stage === 'PLAYER_CHAT') {
    document.getElementById('feeNegotiationSection').style.display = 'none';
    document.getElementById('negPlayerChatSection').style.display = 'block';
    document.getElementById('contractNegotiationSection').style.display = 'none';
    document.getElementById('negStageLabel').innerText = `PHASE 2 — Talk to ${neg.player.name} Personally`;
    renderPlayerChatPhase(neg);
    return;
  }

  if (neg.stage === 'AGENT_CONTRACT') {
    document.getElementById('negPlayerChatSection').style.display = 'none';
    document.getElementById('contractNegotiationSection').style.display = 'block';
    document.getElementById('negStageLabel').innerText = `PHASE 3 — Contract with ${neg.player.name}'s Agent`;
    const targetWage = Math.round(neg.player.wage * 1.12);
    document.getElementById('negAgentMinWage').innerText = `Min: ~€${(targetWage / 1000).toFixed(0)}k/wk (hint)`;

    const btn = document.getElementById('btnSubmitContractOffer');
    btn.onclick = () => {
      if (neg.stage === 'COMPLETED') return;
      const wage = parseFloat(document.getElementById('wageOfferInput').value) * 1000;
      if (!wage || isNaN(wage)) return;
      const result = transferEngine.submitContractOffer(wage, 4);
      renderContractChat(result);
    };
    return;
  }

  if (neg.stage === 'COMPLETED') {
    document.getElementById('contractNegotiationSection').style.display = 'none';
    document.getElementById('negStageLabel').innerText = '✅ Transfer Complete!';
    updateHeaderStats();
    renderSquadHub();
    renderTransfers();
  }
}

function renderPlayerChatPhase(neg) {
  const chatLog = document.getElementById('negPlayerChatLog');
  const renderLog = () => {
    chatLog.innerHTML = neg.playerChatHistory.map(h => `
      <div class="chat-bubble ${h.status}">
        <strong>${h.sender}:</strong> ${h.text}
      </div>
    `).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
    const moods = { neutral: '😐 Neutral', interested: '🤔 Interested', excited: '😃 Excited!', reluctant: '😒 Reluctant' };
    document.getElementById('negMoodBar').innerText = `Player Mood: ${moods[neg.playerMood] || '😐'}`;
  };
  renderLog();

  document.getElementById('btnSendPlayerMessage').onclick = () => {
    if (neg.stage !== 'PLAYER_CHAT') return;
    const input = document.getElementById('playerChatInput');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';
    const result = transferEngine.talkToPlayer(msg);
    renderLog();
    if (result.stage === 'AGENT_CONTRACT') {
      setTimeout(() => renderNegotiationChat(result), 600);
    }
  };

  document.getElementById('playerChatInput').onkeydown = (e) => {
    if (e.key === 'Enter') document.getElementById('btnSendPlayerMessage').click();
  };
}

function renderContractChat(neg) {
  const logEl = document.getElementById('negChatLog');
  const contractEntry = neg.history[neg.history.length - 1];
  if (contractEntry) {
    logEl.innerHTML += `
      <div class="chat-bubble ${contractEntry.status}">
        <strong>${contractEntry.sender}:</strong> ${contractEntry.text}
      </div>
    `;
    logEl.scrollTop = logEl.scrollHeight;
  }
  if (neg.stage === 'COMPLETED') {
    document.getElementById('contractNegotiationSection').style.display = 'none';
    document.getElementById('negStageLabel').innerText = '✅ Transfer Complete!';
    updateHeaderStats();
    renderSquadHub();
    renderTransfers();
  }
}

function openLoanNegotiationModal(player) {
  transferEngine.activeNegotiation = null;
  const modal = document.getElementById('negotiationModal');
  if (!modal) return;

  const priceLabel = document.getElementById('negAskingPriceLabel');
  const offerLabel = document.getElementById('negOfferInputLabel');
  const durationGroup = document.getElementById('loanDurationGroup');
  const durationInput = document.getElementById('loanDurationInput');

  if (priceLabel) priceLabel.textContent = 'Player Weekly Wage';
  if (offerLabel) offerLabel.textContent = 'Wage Coverage (%)';
  if (durationGroup) durationGroup.style.display = 'block';

  const feeInput = document.getElementById('feeOfferInput');
  if (feeInput) {
    feeInput.value = '70'; // Default 70% wage offer
    feeInput.placeholder = 'Enter wage % (e.g. 70)';
  }

  const initialSeasons = durationInput ? parseInt(durationInput.value) || 1 : 1;
  const neg = transferEngine.startLoanNegotiation(player, 'LOAN', initialSeasons);

  document.getElementById('feeNegotiationSection').style.display = 'block';
  document.getElementById('negPlayerChatSection').style.display = 'none';
  document.getElementById('contractNegotiationSection').style.display = 'none';
  document.getElementById('negPlayerChatLog').innerHTML = '';
  document.getElementById('negStageLabel').innerText = 'LOAN PROPOSAL — Wage Split & Terms';
  document.getElementById('negMoodBar').innerText = '';

  document.getElementById('negPlayerName').innerText = `[LOAN] ${player.name} (${player.pos} - ${player.ovr} OVR) ${player.nation}`;
  document.getElementById('negAskingPrice').innerText = `€${(player.wage / 1000).toFixed(0)}k/wk wage`;
  
  if (neg.stage === 'FAILED') {
    renderNegotiationChat(neg);
  } else {
    document.getElementById('negChatLog').innerHTML = `
      <div class="chat-bubble agent">
        <strong>Opposing Manager:</strong> "We are open to loaning out ${player.name}. What percentage of his wage (€${(player.wage / 1000).toFixed(0)}k/wk) will your club pay?"
      </div>
    `;
  }

  modal.classList.add('active');

  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      transferEngine.activeNegotiation = null;
      modal.classList.remove('active');
    };
  }

  document.getElementById('btnSubmitFeeOffer').onclick = () => {
    if (neg.stage === 'FAILED') return;
    const split = parseInt(document.getElementById('feeOfferInput').value);
    const seasons = parseInt(document.getElementById('loanDurationInput').value) || 1;
    if (!split || isNaN(split)) return;

    const result = transferEngine.submitLoanOffer(split, 0, seasons);
    renderNegotiationChat(result);
    if (result.stage === 'PLAYER_CHAT') {
      setTimeout(() => {
        transferEngine.completeLoan(player, split, 0, seasons);
        document.getElementById('negStageLabel').innerText = '✅ Loan Complete!';
        updateHeaderStats();
        renderSquadHub();
        renderTransfers();
      }, 1000);
    }
  };
}

function openIncomingOfferModal(offer) {
  const modal = document.getElementById('incomingBidModal');
  if (!modal) return;

  const typeBadge = document.getElementById('bidModalTypeBadge');
  const titleEl = document.getElementById('bidModalTitle');
  const detailsEl = document.getElementById('bidModalDetails');

  if (offer.type === 'TRANSFER') {
    if (typeBadge) typeBadge.textContent = 'INCOMING TRANSFER BID';
    if (titleEl) titleEl.textContent = `Buy Offer for ${offer.playerName}`;
    if (detailsEl) {
      detailsEl.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${offer.playerName} (${offer.playerPos} - ${offer.playerOvr} OVR)</div>
        <div style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
          Bidding Club: <strong style="color: #fff;">${offer.biddingClubName}</strong><br>
          Market Value: <strong>€${(offer.playerVal / 1000000).toFixed(1)}M</strong><br>
          Offered Fee: <strong style="color: var(--accent-lime); font-size: 1.1rem;">€${(offer.bidAmount / 1000000).toFixed(1)}M</strong>
        </div>
      `;
    }
  } else {
    if (typeBadge) typeBadge.textContent = 'INCOMING LOAN PROPOSAL';
    if (titleEl) titleEl.textContent = `Loan Offer for ${offer.playerName}`;
    if (detailsEl) {
      const optionText = offer.buyOptionFee > 0 ? `<br>Option to Buy Fee: <strong style="color: var(--accent-gold);">€${(offer.buyOptionFee / 1000000).toFixed(1)}M</strong>` : '';
      detailsEl.innerHTML = `
        <div style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem;">${offer.playerName} (${offer.playerPos} - ${offer.playerOvr} OVR)</div>
        <div style="color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;">
          Interested Club: <strong style="color: #fff;">${offer.biddingClubName}</strong><br>
          Loan Duration: <strong>1 Season</strong><br>
          Wage Coverage: <strong style="color: var(--accent-cyan);">${offer.wageSplit}% covered by borrower</strong>${optionText}
        </div>
      `;
    }
  }

  modal.classList.add('active');

  const closeBtn = modal.querySelector('.modal-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => modal.classList.remove('active');
  }

  document.getElementById('btnAcceptBid').onclick = () => {
    state.acceptIncomingOffer(offer.id);
    modal.classList.remove('active');
    updateHeaderStats();
    renderSquadHub();
    renderTransfers();
  };

  document.getElementById('btnRejectBid').onclick = () => {
    state.rejectIncomingOffer(offer.id);
    modal.classList.remove('active');
    updateHeaderStats();
    renderSquadHub();
    renderTransfers();
  };
}

function renderYouthAcademy() {
  const container = document.getElementById('youthAcademyList');
  if (!container) return;

  // Ensure minimum squad size guarantee
  youthEngine.ensureMinimumRoster();

  // Badge count
  const badgeEl = document.getElementById('youthRosterCountBadge');
  if (badgeEl) badgeEl.textContent = `${youthEngine.academy.length} Prospects`;

  // Render Prospects Roster with Management Controls (Promote, Train, Release)
  const renderAcademy = () => {
    container.innerHTML = youthEngine.academy.map(p => {
      const growthBadge = p.growthThisSeason > 0
        ? `<span style="font-size: 0.7rem; color: #00ff87; font-weight: 800; margin-left: 0.3rem;">+${p.growthThisSeason} 🟢</span>`
        : '';

      return `
        <div class="player-row-item" style="padding: 0.6rem 0.8rem;">
          <div class="player-row-left">
            <div class="player-ovr-pill" style="background: rgba(0, 240, 255, 0.15); color: var(--accent-cyan); font-weight: 900;">${p.ovr}</div>
            <div class="player-row-meta">
              <div class="player-row-name" style="font-weight: 800; font-size: 0.92rem;">${p.name} (${p.pos}) ${p.nation} ${growthBadge}</div>
              <div class="player-row-pos-age" style="font-size: 0.78rem;">Age ${p.age} • Potential: <strong style="color: var(--accent-lime);">${p.pot} POT</strong> • Val €${(p.val / 1000000).toFixed(1)}M</div>
            </div>
          </div>
          <div style="display: flex; gap: 0.35rem; align-items: center;">
            <button class="btn-secondary btn-train-youth" data-youth-id="${p.id}" title="Intensity Training (+OVR)" style="font-size: 0.72rem; padding: 0.3rem 0.55rem; background: rgba(0, 255, 137, 0.12); color: var(--accent-lime); border: 1px solid rgba(0, 255, 137, 0.3);">
              <i class="fa-solid fa-bolt"></i> Train
            </button>
            <button class="btn-primary btn-promote" data-youth-id="${p.id}" style="font-size: 0.72rem; padding: 0.3rem 0.6rem;">
              <i class="fa-solid fa-user-plus"></i> Promote
            </button>
            <button class="btn-secondary btn-release-youth" data-youth-id="${p.id}" title="Release Prospect" style="font-size: 0.72rem; padding: 0.3rem 0.5rem; background: rgba(255, 50, 80, 0.15); color: #ff4d6d; border: 1px solid rgba(255, 50, 80, 0.3);">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.btn-promote').forEach(btn => {
      btn.addEventListener('click', () => {
        youthEngine.promoteToFirstTeam(btn.dataset.youthId);
        renderYouthAcademy();
        renderSquadHub();
        updateHeaderStats();
      });
    });

    container.querySelectorAll('.btn-train-youth').forEach(btn => {
      btn.addEventListener('click', () => {
        const ok = youthEngine.trainProspect(btn.dataset.youthId);
        if (ok) {
          renderYouthAcademy();
        }
      });
    });

    container.querySelectorAll('.btn-release-youth').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Release this prospect from the Youth Academy?')) {
          youthEngine.releaseProspect(btn.dataset.youthId);
          renderYouthAcademy();
        }
      });
    });
  };

  // Render Youth League Standings Table
  const renderStandings = () => {
    const standingsBody = document.getElementById('youthLeagueStandingsBody');
    if (!standingsBody) return;

    standingsBody.innerHTML = youthEngine.standings.map((st, idx) => {
      const isUser = st.isUser;
      const rowStyle = isUser ? 'background: rgba(0, 240, 255, 0.12); font-weight: 800; color: var(--accent-cyan);' : '';
      const gdSign = st.gd > 0 ? `+${st.gd}` : st.gd;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); ${rowStyle}">
          <td style="padding: 0.45rem;">${idx + 1}</td>
          <td style="padding: 0.45rem;">${st.name} ${isUser ? '⭐' : ''}</td>
          <td style="padding: 0.45rem; text-align: center;">${st.mp}</td>
          <td style="padding: 0.45rem; text-align: center;">${st.w}</td>
          <td style="padding: 0.45rem; text-align: center;">${st.d}</td>
          <td style="padding: 0.45rem; text-align: center;">${st.l}</td>
          <td style="padding: 0.45rem; text-align: center;">${gdSign}</td>
          <td style="padding: 0.45rem; text-align: center; color: var(--accent-gold); font-weight: 800;">${st.pts}</td>
        </tr>
      `;
    }).join('');

    // Render Recent Results
    const resultsEl = document.getElementById('youthRecentResults');
    if (resultsEl) {
      if (!youthEngine.recentResults.length) {
        resultsEl.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem;">No matches played yet. Advance dates to simulate Youth League matchdays!</div>`;
      } else {
        resultsEl.innerHTML = youthEngine.recentResults.map(res => `
          <div style="background: rgba(255,255,255,0.04); padding: 0.3rem 0.6rem; border-radius: 6px; border-left: 3px solid var(--accent-cyan);">
            ${res}
          </div>
        `).join('');
      }
    }
  };

  renderAcademy();
  renderStandings();

  // Scout Buttons
  const btnScoutEurope = document.getElementById('btnScoutEurope');
  if (btnScoutEurope) {
    btnScoutEurope.onclick = () => {
      youthEngine.scoutRegion('Europe');
      renderYouthAcademy();
    };
  }

  const btnScoutSAmerica = document.getElementById('btnScoutSAmerica');
  if (btnScoutSAmerica) {
    btnScoutSAmerica.onclick = () => {
      youthEngine.scoutRegion('South America');
      renderYouthAcademy();
    };
  }

  // Sim Matchday Button
  const btnSim = document.getElementById('btnSimYouthMatch');
  if (btnSim) {
    btnSim.onclick = () => {
      youthEngine.simYouthMatchday();
      renderYouthAcademy();
    };
  }
}

function renderOffice() {
  const btnPress = document.getElementById('btnStartPressConference');
  if (btnPress) {
    btnPress.onclick = () => {
      const nextFix = state.getNextFixture();
      const oppName = nextFix ? nextFix.awayClub.name : 'FC Barcelona';
      const pressData = officeEngine.generatePressConference(oppName);
      
      const modal = document.getElementById('pressModal');
      document.getElementById('pressTitle').innerText = pressData.title;
      
      const q = pressData.questions[0];
      document.getElementById('pressQuestionText').innerText = q.text;
      
      const optionsContainer = document.getElementById('pressOptionsContainer');
      optionsContainer.innerHTML = q.options.map((opt, idx) => `
        <button class="btn-secondary press-opt-btn" data-opt-idx="${idx}" style="text-align: left; width: 100%; margin-bottom: 0.5rem;">
          ${opt.text}
        </button>
      `).join('');

      optionsContainer.querySelectorAll('.press-opt-btn').forEach(btn => {
        btn.onclick = () => {
          const opt = q.options[parseInt(btn.dataset.optIdx, 10)];
          officeEngine.answerQuestion(opt);
          updateHeaderStats();
          modal.classList.remove('active');
        };
      });

      modal.classList.add('active');
    };
  }

  // Render Trophy Room Cabinet
  const trophyGrid = document.getElementById('trophyCabinetGrid');
  const countBadge = document.getElementById('trophyTotalCount');

  if (trophyGrid) {
    if (countBadge) {
      countBadge.textContent = `${state.trophies.length} Silverware`;
    }

    if (state.trophies.length === 0) {
      trophyGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,215,0,0.2);">
          <i class="fa-solid fa-trophy" style="font-size: 2.5rem; color: rgba(255,215,0,0.3); margin-bottom: 0.8rem; display: block;"></i>
          <div>No trophies won yet this career!</div>
          <div style="font-size: 0.8rem; margin-top: 0.3rem;">Win your Domestic League, UEFA Champions League, or Youth League to fill your Cabinet.</div>
        </div>
      `;
    } else {
      trophyGrid.innerHTML = state.trophies.map(tr => `
        <div style="background: radial-gradient(circle at top, rgba(255,215,0,0.12) 0%, rgba(10,18,30,0.9) 100%); border: 1px solid rgba(255,215,0,0.4); border-radius: 12px; padding: 1.2rem; text-align: center; box-shadow: 0 0 20px rgba(255,215,0,0.1);">
          <div style="font-size: 2.4rem; color: ${tr.badgeColor || '#ffd700'}; margin-bottom: 0.5rem; text-shadow: 0 0 15px ${tr.badgeColor || '#ffd700'};">
            <i class="fa-solid ${tr.icon || 'fa-trophy'}"></i>
          </div>
          <div style="font-weight: 900; font-size: 1rem; color: #fff;">${tr.name}</div>
          <div style="font-size: 0.78rem; color: var(--accent-lime); font-weight: 700; margin-top: 0.25rem;">Season ${tr.season}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">${tr.club}</div>
        </div>
      `).join('');
    }
  }
}

function renderStandingsTable() {
  const container = document.getElementById('standingsTableBody');
  const titleEl = document.getElementById('standingsCardTitle');
  if (!container) return;

  const isUCL = state.activeCompetition === 'UCL';
  if (titleEl) {
    titleEl.innerHTML = isUCL
      ? `<i class="fa-solid fa-star" style="color:var(--accent-cyan);"></i> UCL Group Standings`
      : `<i class="fa-solid fa-list-ol"></i> League Standings`;
  }

  const dataset = isUCL ? state.uclStandings : state.standings;

  container.innerHTML = dataset.map((row, idx) => {
    const club = state.clubs.find(c => c.id === row.clubId) || row;
    const isTop2 = idx < 2;
    const is3rd4th = idx >= 2 && idx < 4;

    let qualBadge = '';
    if (!isUCL) {
      if (isTop2) qualBadge = `<span style="font-size:0.65rem; background:rgba(0,240,255,0.15); color:var(--accent-cyan); padding:2px 5px; border-radius:4px; margin-left:4px; font-weight:800;">UCL</span>`;
      else if (is3rd4th) qualBadge = `<span style="font-size:0.65rem; background:rgba(255,159,67,0.15); color:#ff9f43; padding:2px 5px; border-radius:4px; margin-left:4px; font-weight:800;">UEL</span>`;
    }

    return `
      <tr class="${row.clubId === state.myClubId ? 'my-club' : ''}">
        <td><strong>${idx + 1}</strong></td>
        <td style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.8rem;">
          ${renderCrestHtml(row.crest, club, 'width:24px;height:24px;')}
          <span style="font-weight:700;">${row.name} ${qualBadge}</span>
        </td>
        <td>${row.played}</td>
        <td>${row.won}</td>
        <td>${row.drawn}</td>
        <td>${row.lost}</td>
        <td>${row.gd > 0 ? '+' + row.gd : row.gd}</td>
        <td><strong>${row.pts}</strong></td>
      </tr>
    `;
  }).join('');
}

function renderUCLHub() {
  const uclTableContainer = document.getElementById('uclStandingsTableBody');
  if (uclTableContainer) {
    uclTableContainer.innerHTML = state.uclStandings.map((row, idx) => {
      const club = state.clubs.find(c => c.id === row.clubId) || row;
      return `
        <tr class="${row.clubId === state.myClubId ? 'my-club' : ''}">
          <td><strong>${idx + 1}</strong></td>
          <td style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.8rem;">
            ${renderCrestHtml(row.crest, club, 'width:24px;height:24px;')}
            <span style="font-weight:700;">${row.name}</span>
          </td>
          <td>${row.played}</td>
          <td>${row.won}</td>
          <td>${row.drawn}</td>
          <td>${row.lost}</td>
          <td>${row.gd > 0 ? '+' + row.gd : row.gd}</td>
          <td><strong>${row.pts}</strong></td>
        </tr>
      `;
    }).join('');
  }

  const uelTableContainer = document.getElementById('uelStandingsTableBody');
  if (uelTableContainer) {
    uelTableContainer.innerHTML = (state.uelStandings || []).map((row, idx) => {
      const club = state.clubs.find(c => c.id === row.clubId) || row;
      return `
        <tr class="${row.clubId === state.myClubId ? 'my-club' : ''}">
          <td><strong>${idx + 1}</strong></td>
          <td style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.8rem;">
            ${renderCrestHtml(row.crest, club, 'width:24px;height:24px;')}
            <span style="font-weight:700;">${row.name}</span>
          </td>
          <td>${row.played}</td>
          <td>${row.won}</td>
          <td>${row.drawn}</td>
          <td>${row.lost}</td>
          <td>${row.gd > 0 ? '+' + row.gd : row.gd}</td>
          <td><strong>${row.pts}</strong></td>
        </tr>
      `;
    }).join('');
  }
}

function openMatchModal() {
  const fixture = state.getNextFixture();
  if (!fixture) {
    openEndOfSeasonModal();
    return;
  }

  const modal = document.getElementById('matchModal');
  if (!modal) return;

  if (currentMatchEngine) {
    currentMatchEngine.stop();
    currentMatchEngine = null;
  }

  document.getElementById('matchHomeName').innerText = fixture.homeClub.name;
  document.getElementById('matchAwayName').innerText = fixture.awayClub.name;
  document.getElementById('matchScoreDisplay').innerText = '0 – 0';
  document.getElementById('matchScoreDisplay').style.color = '';
  document.getElementById('matchScoreDisplay').style.textShadow = '';
  document.getElementById('matchClockText').innerText = "0'";
  document.getElementById('matchCommentaryFeed').innerHTML = '';
  document.getElementById('matchLiveStats').innerHTML = 'Match starting...';

  // Populate Home XI & Away XI Roster Displays
  const homeSquadList = document.getElementById('matchHomeSquadList');
  const awaySquadList = document.getElementById('matchAwaySquadList');

  let homePlayers = [];
  if (fixture.homeClub.id === state.myClubId && state.starters?.length) {
    homePlayers = state.starters;
  } else {
    homePlayers = INITIAL_PLAYERS.filter(p => p.clubId === fixture.homeClub.id).slice(0, 11);
  }

  let awayPlayers = [];
  if (fixture.awayClub.id === state.myClubId && state.starters?.length) {
    awayPlayers = state.starters;
  } else {
    awayPlayers = INITIAL_PLAYERS.filter(p => p.clubId === fixture.awayClub.id).slice(0, 11);
  }

  if (homeSquadList) {
    document.getElementById('matchHomeHeaderTitle').textContent = `${fixture.homeClub.name} (XI)`;
    homeSquadList.innerHTML = homePlayers.map(p => `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,255,137,0.05); padding: 0.35rem 0.6rem; border-radius: 6px; border: 1px solid rgba(0,255,137,0.15);">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span style="background: rgba(0,255,137,0.2); color: var(--accent-lime); padding: 1px 5px; border-radius: 3px; font-size: 0.68rem; font-weight: 800;">${p.pos}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${p.name}</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 900; color: var(--accent-lime);">${p.ovr}</span>
      </div>
    `).join('');
  }

  if (awaySquadList) {
    document.getElementById('matchAwayHeaderTitle').textContent = `${fixture.awayClub.name} (XI)`;
    awaySquadList.innerHTML = awayPlayers.map(p => `
      <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(0,240,255,0.05); padding: 0.35rem 0.6rem; border-radius: 6px; border: 1px solid rgba(0,240,255,0.15);">
        <div style="display: flex; align-items: center; gap: 0.4rem;">
          <span style="background: rgba(0,240,255,0.2); color: var(--accent-cyan); padding: 1px 5px; border-radius: 3px; font-size: 0.68rem; font-weight: 800;">${p.pos}</span>
          <span style="font-size: 0.78rem; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;">${p.name}</span>
        </div>
        <span style="font-size: 0.75rem; font-weight: 900; color: var(--accent-cyan);">${p.ovr}</span>
      </div>
    `).join('');
  }

  document.querySelectorAll('.mentality-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.mentality-btn[data-mentality="balanced"]')?.classList.add('active');
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.speed-btn[data-speed="1"]')?.classList.add('active');


  modal.classList.add('active');

  currentMatchEngine = new LiveMatchEngine('matchPitchCanvas', fixture, (homeScore, awayScore) => {
    updateHeaderStats();
    renderDashboard();
    renderStandingsTable();
    renderUCLHub();
    renderCompetitionsHub();
    checkEndOfSeasonTrigger();
  });

  currentMatchEngine.start();

  document.querySelectorAll('.mentality-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.mentality-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (currentMatchEngine) currentMatchEngine.setMentality(btn.dataset.mentality);
    };
  });

  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (currentMatchEngine) currentMatchEngine.setSpeed(parseInt(btn.dataset.speed, 10));
    };
  });

  document.getElementById('matchModalClose').onclick = () => {
    if (currentMatchEngine) { currentMatchEngine.stop(); currentMatchEngine = null; }
    modal.classList.remove('active');
  };
}

function quickSimMatch() {
  const fixture = state.getNextFixture();
  if (!fixture) {
    openEndOfSeasonModal();
    return;
  }

  const res = engineQuickSim(fixture, calculateTeamRatings, state);
  if (!res) return;

  const modal = document.getElementById('quickSimModal');
  if (!modal) return;

  document.getElementById('quickSimCompTitle').textContent = fixture.competition || 'MATCH RESULT';
  document.getElementById('qsHomeName').textContent = fixture.homeClub.name;
  document.getElementById('qsAwayName').textContent = fixture.awayClub.name;
  document.getElementById('qsScore').textContent = `${res.homeScore} – ${res.awayScore}`;

  // Populate Goal Timeline
  const goalsContainer = document.getElementById('qsGoalsList');
  if (goalsContainer) {
    if (res.allScorers.length === 0) {
      goalsContainer.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">No goals scored (0-0 draw)</div>`;
    } else {
      goalsContainer.innerHTML = res.allScorers.map(s => {
        const align = s.side === 'home' ? 'flex-start' : 'flex-end';
        const color = s.side === 'home' ? 'var(--accent-lime)' : 'var(--accent-cyan)';
        return `<div style="display: flex; justify-content: ${align}; align-items: center; gap: 0.5rem; font-size: 0.88rem;">
          <span style="font-weight: 800; color: ${color};">${s.min}'</span>
          <span>⚽ ${s.name} (${s.side === 'home' ? fixture.homeClub.name : fixture.awayClub.name})</span>
        </div>`;
      }).join('');
    }
  }

  // Populate Stats
  const statsContainer = document.getElementById('qsStatsContainer');
  if (statsContainer) {
    const st = res.stats;
    statsContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 140px 1fr; gap: 0.4rem; font-size: 0.85rem; align-items: center;">
        <span style="text-align: right; font-weight: 800; color: var(--accent-lime);">${st.homePoss}%</span>
        <span style="text-align: center; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Possession</span>
        <span style="font-weight: 800; color: var(--accent-cyan);">${st.awayPoss}%</span>

        <span style="text-align: right; font-weight: 700;">${st.homeShots}</span>
        <span style="text-align: center; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Shots</span>
        <span style="font-weight: 700;">${st.awayShots}</span>

        <span style="text-align: right; font-weight: 700;">${st.homeSot}</span>
        <span style="text-align: center; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">On Target</span>
        <span style="font-weight: 700;">${st.awaySot}</span>

        <span style="text-align: right; font-weight: 700;">${st.homeXG}</span>
        <span style="text-align: center; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">xG</span>
        <span style="font-weight: 700;">${st.awayXG}</span>
      </div>`;
  }

  modal.classList.add('active');

  const closeModal = () => {
    modal.classList.remove('active');
    for (let i = 0; i < 7; i++) state.advanceDay?.();
    renderDashboard();
    renderStandingsTable();
    renderUCLHub();
    renderCompetitionsHub();
    updateHeaderStats();
    checkEndOfSeasonTrigger();
  };

  document.getElementById('quickSimModalClose').onclick = closeModal;
  document.getElementById('qsContinueBtn').onclick = closeModal;
}

function simRestOfSeason() {
  let unplayed = state.fixtures.filter(f => !f.played);
  if (unplayed.length === 0) {
    openEndOfSeasonModal();
    return;
  }

  while (true) {
    const nextFix = state.getNextFixture();
    if (!nextFix) break;
    engineQuickSim(nextFix, calculateTeamRatings, state);
  }

  updateHeaderStats();
  renderDashboard();
  renderStandingsTable();
  renderUCLHub();
  renderCompetitionsHub();
  openEndOfSeasonModal();
}

function checkEndOfSeasonTrigger() {
  const remaining = state.fixtures.filter(f => !f.played);
  if (remaining.length === 0) {
    openEndOfSeasonModal();
  }
}

function openEndOfSeasonModal() {
  const modal = document.getElementById('endOfSeasonModal');
  if (!modal) return;

  const sortedLeague = [...state.standings].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const myRankIdx = sortedLeague.findIndex(s => s.clubId === state.myClubId);
  const pos = myRankIdx !== -1 ? myRankIdx + 1 : 1;

  document.getElementById('eosSeasonLabel').innerText = `SEASON ${state.season} COMPLETED`;
  document.getElementById('eosLeaguePos').innerText = pos === 1 ? '🥇 #1 CHAMPION' : `#${pos} Place`;
  
  let euroStatus = 'UCL Qualified';
  if (pos > 2 && pos <= 4) euroStatus = 'UEL Qualified';
  else if (pos > 4) euroStatus = 'Domestic Cup';
  document.getElementById('eosEuroQual').innerText = euroStatus;

  const prize = pos === 1 ? 40000000 : (pos <= 4 ? 25000000 : 15000000);
  document.getElementById('eosPrizeMoney').innerText = `+€${(prize / 1000000).toFixed(0)}.0M`;

  const nextStart = 2026 + state.seasonIndex + 1;
  const nextEndShort = String(nextStart + 1).slice(-2);
  const nextSeasonLabel = `${nextStart}/${nextEndShort}`;
  document.getElementById('eosNextSeasonYear').innerText = nextSeasonLabel;

  const highlights = document.getElementById('eosHighlightsLog');
  if (highlights) {
    const champ = sortedLeague[0] ? sortedLeague[0].name : 'Real Madrid';
    highlights.innerHTML = `
      <div style="font-size:0.88rem; color:#fff; line-height:1.6;">
        🏆 <strong>League Champion:</strong> ${champ}<br/>
        💰 <strong>Board Allocation:</strong> €${(prize / 1000000).toFixed(0)}M prize bonus added to transfer budget.<br/>
        ⚡ <strong>Squad Development:</strong> Young players have gained +1 to +3 OVR attributes!<br/>
        🌍 <strong>European Qualification:</strong> Top 2 (UCL) & 3rd-4th (UEL) slots sealed for ${nextSeasonLabel}.
      </div>
    `;
  }

  modal.classList.add('active');

  const btnConfirm = document.getElementById('btnStartNextSeasonConfirm');
  if (btnConfirm) {
    btnConfirm.onclick = () => {
      state.startNextSeason();
      modal.classList.remove('active');
      
      // Update all UI views in-place without page reload
      updateHeaderStats();
      renderDashboard();
      renderSquadHub();
      renderTransfers();
      renderYouthAcademy();
      renderStandingsTable();
      renderUCLHub();
      state.playSound?.('goal');
    };
  }
}

// ─── PLAYER TALK MODAL ────────────────────────────────────────────────────────
const playerTalkHistory = {};

function openPlayerTalkModal(player) {
  const modal = document.getElementById('playerTalkModal');
  if (!modal) return;

  document.getElementById('talkPlayerName').innerText = `${player.name} (${player.pos} - ${player.ovr} OVR)`;
  document.getElementById('talkPlayerMorale').innerText = `Morale: ${player.morale}%`;

  if (!playerTalkHistory[player.id]) {
    playerTalkHistory[player.id] = [
      { sender: player.name, text: getPlayerGreeting(player) }
    ];
  }
  const history = playerTalkHistory[player.id];

  const log = document.getElementById('playerTalkLog');
  const renderTalkLog = () => {
    if (log) {
      log.innerHTML = history.map(h => `
        <div class="chat-bubble ${h.sender === 'You' ? 'counter' : 'agent'}">
          <strong>${h.sender}:</strong> ${h.text}
        </div>
      `).join('');
      log.scrollTop = log.scrollHeight;
    }
  };

  renderTalkLog();
  modal.classList.add('active');

  const input = document.getElementById('playerTalkInput');
  if (input) {
    input.value = '';
    input.focus();
  }

  const handleSend = () => {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    history.push({ sender: 'You', text: msg });
    const reply = generatePlayerReply(player, msg);
    history.push({ sender: player.name, text: reply.text });

    if (reply.moraleImpact) {
      player.morale = Math.max(10, Math.min(99, player.morale + reply.moraleImpact));
      document.getElementById('talkPlayerMorale').innerText = `Morale: ${player.morale}%`;
    }

    renderTalkLog();
  };

  const btnSend = document.getElementById('btnSendTalkMessage');
  if (btnSend) btnSend.onclick = handleSend;
  if (input) input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(); };
}

function getPlayerGreeting(player) {
  if (player.morale >= 85) return `Good to see you, Boss! What can I do for you?`;
  if (player.morale >= 65) return `Hi Manager. I've been wanting to speak with you actually.`;
  if (player.morale >= 45) return `...Manager. I suppose we need to talk.`;
  return `Manager. I'll be honest — things aren't great right now.`;
}

function generatePlayerReply(player, message) {
  const lowerMsg = message.toLowerCase();
  const isYoung = player.age <= 22;
  const isVet = player.age >= 31;
  const highMorale = player.morale >= 75;
  const lowMorale = player.morale < 55;

  if (lowerMsg.includes('play') || lowerMsg.includes('start') || lowerMsg.includes('bench') || lowerMsg.includes('minutes')) {
    if (lowMorale) return { text: `I need more game time, Boss. I'm ${player.age} years old — I can't be sitting on the bench.`, moraleImpact: 0 };
    if (highMorale) return { text: `I trust your judgment on team selection. But I want to start every week.`, moraleImpact: +2 };
    return { text: `Playing time is important to me. I've been training hard.`, moraleImpact: +1 };
  }

  if (lowerMsg.includes('contract') || lowerMsg.includes('wage') || lowerMsg.includes('deal') || lowerMsg.includes('renew') || lowerMsg.includes('extend')) {
    if (lowMorale) return { text: `My agent has been in contact with other clubs. If we can't agree on a new deal soon, I may have to explore my options.`, moraleImpact: -2 };
    return { text: `I love it here and I'd be open to discussing a new deal. Let's make it happen.`, moraleImpact: +3 };
  }

  if (lowerMsg.includes('great') || lowerMsg.includes('amazing') || lowerMsg.includes('proud') || lowerMsg.includes('brilliant') || lowerMsg.includes('love') || lowerMsg.includes('best')) {
    return { text: `That means a lot coming from you, Boss. I'll give everything I have for this club.`, moraleImpact: +5 };
  }

  if (lowerMsg.includes('disappoint') || lowerMsg.includes('poor') || lowerMsg.includes('bad') || lowerMsg.includes('not good') || lowerMsg.includes('need to improve')) {
    if (lowMorale) return { text: `I know things haven't been ideal. But I need your support right now, not criticism.`, moraleImpact: -3 };
    return { text: `You're right. I've not been at my best. I'll work harder in training.`, moraleImpact: -2 };
  }

  if (lowerMsg.includes('sell') || lowerMsg.includes('leave') || lowerMsg.includes('transfer') || lowerMsg.includes('move') || lowerMsg.includes('go')) {
    if (lowMorale) return { text: `Honestly? If the right offer came in... I'd be lying if I said I hadn't thought about it.`, moraleImpact: -5 };
    return { text: `Boss, I'm committed to this club. I want to win trophies here.`, moraleImpact: +2 };
  }

  if (lowerMsg.includes('captain') || lowerMsg.includes('armband') || lowerMsg.includes('leader')) {
    return { text: `Captain? I'd be honoured. Thank you for believing in me.`, moraleImpact: +8 };
  }

  if (lowerMsg.includes('train') || lowerMsg.includes('fitness') || lowerMsg.includes('shape') || lowerMsg.includes('work')) {
    return { text: `I've been putting in extra hours on the training ground. I'm ready.`, moraleImpact: +1 };
  }

  if (isVet && (lowerMsg.includes('retire') || lowerMsg.includes('age') || lowerMsg.includes('old'))) {
    return { text: `I've got at least two or three years left at the top level. Don't count me out just yet, Boss.`, moraleImpact: -1 };
  }
  if (isYoung && (lowerMsg.includes('young') || lowerMsg.includes('potential') || lowerMsg.includes('future'))) {
    return { text: `I know I'm young, but I'm ready to compete with anyone. Give me the chance.`, moraleImpact: +4 };
  }

  const lowReplies = [
    `I just feel like things aren't working out. I need a change in my situation here.`,
    `To be honest, Boss, I'm not feeling great about things right now.`,
    `I've been struggling mentally. It's hard to perform when you're not feeling appreciated.`
  ];
  const highReplies = [
    `Things are going well. I'm happy, the team is playing well.`,
    `Great conversation, Boss. I feel good. Let's keep winning.`,
    `I love this club. I'm giving everything in training.`
  ];
  const neutralReplies = [
    `I'm taking it day by day, Boss. Just focusing on training.`,
    `Fair enough. Let's keep working hard and see where the season takes us.`,
    `Understood. I'll keep my head down and give my best whenever called upon.`
  ];

  if (lowMorale) return { text: lowReplies[Math.floor(Math.random() * lowReplies.length)], moraleImpact: 0 };
  if (highMorale) return { text: highReplies[Math.floor(Math.random() * highReplies.length)], moraleImpact: +1 };
  return { text: neutralReplies[Math.floor(Math.random() * neutralReplies.length)], moraleImpact: 0 };
}

// ─── CHIEF SCOUT CONSULTATION ENGINE ──────────────────────────────────────────
const scoutChatHistory = [
  {
    sender: 'Scout',
    text: `Greetings Boss! I'm Chief Scout Paolo Rossi. Our global scouting network is tracking over 1,500+ top talents across Europe. What profile are you looking to sign for our squad?`
  }
];

function openScoutModal() {
  const modal = document.getElementById('scoutModal');
  if (!modal) return;

  const log = document.getElementById('scoutChatLog');
  const input = document.getElementById('scoutInput');

  const renderScoutChat = () => {
    if (!log) return;
    log.innerHTML = scoutChatHistory.map(msg => {
      if (msg.sender === 'You') {
        return `<div class="chat-bubble counter"><strong>You:</strong> ${msg.text}</div>`;
      } else {
        let playersHtml = '';
        if (msg.players && msg.players.length > 0) {
          playersHtml = `<div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.6rem;">` +
            msg.players.map(p => `
              <div style="background: rgba(0,0,0,0.35); padding: 0.6rem 0.8rem; border-radius: 8px; border: 1px solid rgba(0, 240, 255, 0.2); display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                <div>
                  <div style="font-weight: 800; color: #fff; font-size: 0.92rem;">${p.nation || '⚽'} ${p.name} <span style="color: var(--accent-lime); font-size: 0.82rem;">(${p.ovr} OVR)</span></div>
                  <div style="font-size: 0.76rem; color: var(--text-muted);">${p.pos} • Age ${p.age} • Val: €${(p.val / 1000000).toFixed(1)}M</div>
                  <div style="font-size: 0.74rem; color: #00e5ff; margin-top: 2px;"><em>"${p.insight}"</em></div>
                </div>
                <button class="btn-primary scout-negotiate-btn" data-player-id="${p.id}" style="padding: 0.35rem 0.75rem; font-size: 0.76rem; white-space: nowrap; background: linear-gradient(135deg, var(--accent-lime), #00b359); color: #001a0d; font-weight: 800; border: none; border-radius: 6px; cursor: pointer;">
                  <i class="fa-solid fa-handshake"></i> Sign
                </button>
              </div>
            `).join('') + `</div>`;
        }

        return `<div class="chat-bubble agent" style="max-width: 90%;">
          <strong>Chief Scout Paolo:</strong> ${msg.text}
          ${playersHtml}
        </div>`;
      }
    }).join('');

    log.scrollTop = log.scrollHeight;

    // Attach click handlers to Sign buttons inside chat
    document.querySelectorAll('.scout-negotiate-btn').forEach(btn => {
      btn.onclick = () => {
        const pId = btn.getAttribute('data-player-id');
        const p = state.players.find(x => x.id === pId);
        if (p) {
          modal.classList.remove('active');
          openNegotiationModal(p);
        }
      };
    });
  };

  renderScoutChat();
  modal.classList.add('active');

  const sendQuery = (qText) => {
    const text = qText || (input ? input.value.trim() : '');
    if (!text) return;
    if (input) input.value = '';

    scoutChatHistory.push({ sender: 'You', text });
    
    // Generate Scout Analysis
    const result = evaluateScoutRequest(text);
    scoutChatHistory.push({
      sender: 'Scout',
      text: result.intro,
      players: result.recommendations
    });

    renderScoutChat();
  };

  const btnSend = document.getElementById('btnSendScoutMsg');
  if (btnSend) btnSend.onclick = () => sendQuery();
  if (input) input.onkeydown = (e) => { if (e.key === 'Enter') sendQuery(); };

  // Setup Pill buttons
  document.querySelectorAll('.scout-pill-btn').forEach(pill => {
    pill.onclick = () => {
      const q = pill.getAttribute('data-query');
      if (q) sendQuery(q);
    };
  });

  const closeBtn = document.getElementById('scoutModalClose');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');
}

function evaluateScoutRequest(q) {
  const query = q.toLowerCase();
  const availablePlayers = state.players.filter(p => p.clubId !== state.myClubId);

  let filtered = [...availablePlayers];

  // Position detection
  let targetPos = null;
  if (query.includes('striker') || query.includes('st') || query.includes('forward')) targetPos = ['ST', 'CF'];
  else if (query.includes('winger') || query.includes('lw') || query.includes('rw')) targetPos = ['LW', 'RW', 'LM', 'RM'];
  else if (query.includes('midfielder') || query.includes('cm') || query.includes('cam') || query.includes('cdm')) targetPos = ['CM', 'CAM', 'CDM'];
  else if (query.includes('defender') || query.includes('cb') || query.includes('lb') || query.includes('rb')) targetPos = ['CB', 'LB', 'RB', 'LWB', 'RWB'];
  else if (query.includes('goalkeeper') || query.includes('gk')) targetPos = ['GK'];

  if (targetPos) {
    filtered = filtered.filter(p => targetPos.includes(p.pos));
  }

  // Age / Wonderkid detection
  const isWonderkid = query.includes('wonderkid') || query.includes('young') || query.includes('prospect') || query.includes('<22') || query.includes('future') || query.includes('22');
  if (isWonderkid) {
    filtered = filtered.filter(p => p.age <= 22);
    filtered.sort((a, b) => (b.pot || b.ovr + 5) - (a.pot || a.ovr + 5));
  }

  // Budget / Bargain detection
  const isBargain = query.includes('bargain') || query.includes('cheap') || query.includes('budget') || query.includes('40m') || query.includes('50m');
  if (isBargain) {
    filtered = filtered.filter(p => p.val <= 50000000);
    filtered.sort((a, b) => b.ovr / (a.val || 1) - a.ovr / (b.val || 1));
  }

  // Quality / World-class detection
  const isWorldClass = query.includes('world-class') || query.includes('star') || query.includes('elite') || query.includes('top') || query.includes('best');
  if (isWorldClass) {
    filtered = filtered.filter(p => p.ovr >= 82);
    filtered.sort((a, b) => b.ovr - a.ovr);
  }

  if (!isWonderkid && !isBargain && !isWorldClass) {
    filtered.sort((a, b) => b.ovr - a.ovr);
  }

  const topRecs = filtered.slice(0, 3).map(p => {
    let insight = `Top quality ${p.pos} with ${p.ovr} OVR.`;
    if (p.age <= 21) insight = `High-potential prospect (${p.pot || p.ovr + 5} potential). Phenomenal growth upside.`;
    else if (p.ovr >= 87) insight = `World-class star. Instant starter for any elite club.`;
    else if (p.val < 35000000) insight = `Excellent value deal at €${(p.val/1000000).toFixed(1)}M valuation.`;
    return { ...p, insight };
  });
  let intro = `Boss, I've run our scouting algorithms across the market. Here are my top scout recommendations matching your request:`;
  if (!topRecs.length) {
    intro = `Boss, I've scanned the database but couldn't find any available targets matching those exact criteria. Try broadening the search parameters!`;
  } else if (isWonderkid) {
    intro = `Here are the brightest young wonderkids currently available on our scouting radar, Boss:`;
  } else if (isBargain) {
    intro = `Found high-value bargain targets that fit within sensible transfer budgets:`;
  } else if (isWorldClass) {
    intro = `Here are elite, world-class superstars ready for top-tier competition:`;
  }

  return { intro, recommendations: topRecs };
}

function showInboxDetailModal(msg) {
  const modal = document.getElementById('inboxDetailModal');
  if (!modal) return;

  document.getElementById('idMsgTitle').textContent = msg.title;
  document.getElementById('idMsgMeta').textContent = `From: ${msg.sender} • Date: ${msg.date}`;
  document.getElementById('idMsgBody').textContent = msg.body;

  modal.classList.add('active');

  const closeFn = () => {
    modal.classList.remove('active');
    renderDashboard();
  };

  const btnClose = document.getElementById('inboxDetailModalClose');
  const btnCloseBtn = document.getElementById('btnCloseInboxDetail');
  if (btnClose) btnClose.onclick = closeFn;
  if (btnCloseBtn) btnCloseBtn.onclick = closeFn;
}


function openIncomingOfferModal(offer) {
  const modal = document.getElementById('incomingOfferModal');
  if (!modal) return;

  const btnReject = document.getElementById('btnRejectIncomingOffer');
  const btnClose = document.getElementById('incomingOfferModalClose');
  const chatLog = document.getElementById('ioManagerChatLog');
  const counterInput = document.getElementById('ioCounterInput');
  const talkInput = document.getElementById('ioManagerTalkInput');
  const moodBadge = document.getElementById('ioManagerMood');

  if (counterInput) counterInput.value = '';
  if (talkInput) talkInput.value = '';

  let managerPatience = 3;
  let chatHistory = [
    {
      sender: `${offer.biddingClubName} Representative`,
      text: `Greetings Manager. We are extremely interested in signing ${offer.playerName} (${offer.playerPos} • ${offer.playerOvr} OVR). We have submitted an initial offer of €${(offer.bidAmount / 1000000).toFixed(1)}M. Can we finalize terms?`
    }
  ];

  const updateModalDisplay = () => {
    document.getElementById('ioPlayerName').textContent = offer.playerName;
    document.getElementById('ioPlayerMeta').textContent = `${offer.playerPos} • ${offer.playerOvr} OVR • Age ${offer.playerAge}`;
    document.getElementById('ioPlayerVal').textContent = `Market Value: €${(offer.playerVal / 1000000).toFixed(1)}M`;
    document.getElementById('ioOfferFee').textContent = `€${(offer.bidAmount / 1000000).toFixed(1)}M`;
    document.getElementById('ioBiddingClub').textContent = `From: ${offer.biddingClubName}`;

    if (moodBadge) {
      if (managerPatience >= 3) {
        moodBadge.innerHTML = `<i class="fa-solid fa-handshake"></i> Manager Interest: High`;
        moodBadge.style.color = `var(--accent-lime)`;
        moodBadge.style.background = `rgba(0, 255, 137, 0.12)`;
      } else if (managerPatience === 2) {
        moodBadge.innerHTML = `<i class="fa-solid fa-face-thinking"></i> Manager Interest: Deliberating`;
        moodBadge.style.color = `var(--accent-cyan)`;
        moodBadge.style.background = `rgba(0, 240, 255, 0.12)`;
      } else {
        moodBadge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Manager Interest: Impatient`;
        moodBadge.style.color = `#ff4d6d`;
        moodBadge.style.background = `rgba(255, 50, 80, 0.12)`;
      }
    }

    if (chatLog) {
      chatLog.innerHTML = chatHistory.map(msg => `
        <div class="chat-bubble ${msg.sender === 'You' ? 'user' : 'agent'}" style="margin-bottom: 0.2rem;">
          <div style="font-size: 0.7rem; color: ${msg.sender === 'You' ? 'var(--accent-cyan)' : 'var(--accent-lime)'}; font-weight: 800; text-transform: uppercase;">
            ${msg.sender}
          </div>
          <div style="font-size: 0.85rem; color: #fff; margin-top: 2px;">
            ${msg.text}
          </div>
        </div>
      `).join('');
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  };

  const sendDialogueMessage = () => {
    const text = talkInput ? talkInput.value.trim() : '';
    if (!text) return;

    chatHistory.push({ sender: 'You', text });
    if (talkInput) talkInput.value = '';

    const lower = text.toLowerCase();
    let replyText = '';

    if (lower.includes('vital') || lower.includes('key') || lower.includes('starter')) {
      const bonusBid = Math.round((offer.bidAmount * 1.06) / 100000) * 100000;
      offer.bidAmount = bonusBid;
      replyText = `We understand how key ${offer.playerName} is to your lineup. We are prepared to raise our proposal to €${(bonusBid / 1000000).toFixed(1)}M.`;
    } else if (lower.includes('bonus') || lower.includes('performance')) {
      const bonusBid = Math.round((offer.bidAmount * 1.05 + 2000000) / 100000) * 100000;
      offer.bidAmount = bonusBid;
      replyText = `Agreed. We will structure the proposal to €${(bonusBid / 1000000).toFixed(1)}M including performance incentive clauses.`;
    } else if (lower.includes('final')) {
      replyText = `Understood. We are reviewing our budget limit for ${offer.playerName}. Please state your required counter fee.`;
    } else {
      replyText = `We note your comments regarding ${offer.playerName}. Please submit your counter fee proposal or accept our current bid of €${(offer.bidAmount / 1000000).toFixed(1)}M.`;
    }

    chatHistory.push({ sender: `${offer.biddingClubName} Representative`, text: replyText });
    updateModalDisplay();
    state.playSound?.('click');
  };

  updateModalDisplay();
  modal.classList.add('active');

  // Handle Pill Buttons
  document.querySelectorAll('.io-pill-btn').forEach(btn => {
    btn.onclick = () => {
      if (talkInput) {
        talkInput.value = btn.dataset.text;
        sendDialogueMessage();
      }
    };
  });

  const btnSendTalk = document.getElementById('btnSendManagerTalkMsg');
  if (btnSendTalk) btnSendTalk.onclick = sendDialogueMessage;

  const btnCounter = document.getElementById('btnCounterIncomingOffer');
  if (btnCounter) {
    btnCounter.onclick = () => {
      const val = parseFloat(counterInput.value);
      if (!val || isNaN(val) || val <= 0) return;

      const counterAmount = val * 1000000;
      chatHistory.push({ sender: 'You', text: `We request a counter fee of €${val.toFixed(1)}M for ${offer.playerName}.` });

      const ratio = counterAmount / offer.bidAmount;

      if (ratio <= 1.12) {
        // Buyer accepts counter!
        offer.bidAmount = counterAmount;
        chatHistory.push({
          sender: `${offer.biddingClubName} Representative`,
          text: `€${val.toFixed(1)}M is acceptable! We agree to your terms. Deal finalized!`
        });

        executeSale(offer);
      } else if (ratio <= 1.32) {
        // Buyer counters halfway
        const splitAmount = Math.round(((offer.bidAmount + counterAmount) / 2) / 100000) * 100000;
        offer.bidAmount = splitAmount;
        managerPatience--;

        chatHistory.push({
          sender: `${offer.biddingClubName} Representative`,
          text: `€${val.toFixed(1)}M is higher than our budget target. However, we offer a compromise fee of €${(splitAmount / 1000000).toFixed(1)}M.`
        });
        updateModalDisplay();
        state.playSound?.('click');
      } else {
        // Buyer finds price too high
        managerPatience--;
        if (managerPatience > 0) {
          chatHistory.push({
            sender: `${offer.biddingClubName} Representative`,
            text: `€${val.toFixed(1)}M is far too steep for our valuation! Please present a realistic counter figure.`
          });
          updateModalDisplay();
          state.playSound?.('click');
        } else {
          // Walked away
          offer.status = 'REJECTED';
          chatHistory.push({
            sender: `${offer.biddingClubName} Representative`,
            text: `We cannot reach a deal at these numbers. Negotiations are officially terminated.`
          });
          updateModalDisplay();
          state.news.unshift({
            headline: `NEGOTIATION COLLAPSED: ${offer.biddingClubName} walked away from €${val.toFixed(1)}M demand for ${offer.playerName}.`,
            date: state.getFormattedDate(),
            category: 'TRANSFERS'
          });
          setTimeout(() => {
            modal.classList.remove('active');
            renderTransfers();
          }, 1800);
        }
      }
    };
  }

  const executeSale = (off) => {
    off.status = 'ACCEPTED';
    state.myClub.budget += off.bidAmount;

    const player = state.players.find(p => p.id === off.playerId);
    if (player) player.clubId = off.biddingClubId;

    const sIdx = state.starters.findIndex(p => p.id === off.playerId);
    if (sIdx !== -1) {
      if (state.bench.length > 0) state.starters[sIdx] = state.bench.shift();
      else state.starters.splice(sIdx, 1);
    } else {
      const bIdx = state.bench.findIndex(p => p.id === off.playerId);
      if (bIdx !== -1) state.bench.splice(bIdx, 1);
    }

    // Remove offer from incomingOffers list and inbox
    state.incomingOffers = state.incomingOffers.filter(o => o.id !== off.id);
    state.inbox = state.inbox.filter(m => !(m.title.includes(off.playerName) || m.body.includes(off.playerName)));

    state.news.unshift({
      headline: `🔴 DONE DEAL: ${off.playerName} sold to ${off.biddingClubName} for €${(off.bidAmount / 1000000).toFixed(1)}M!`,
      date: state.getFormattedDate(),
      category: 'TRANSFERS'
    });

    state.playSound?.('goal');
    updateModalDisplay();

    setTimeout(() => {
      modal.classList.remove('active');
      renderDashboard();
      renderSquadHub();
      renderTransfers();
      updateHeaderStats();
    }, 1600);
  };


  if (btnReject) {
    btnReject.onclick = () => {
      offer.status = 'REJECTED';

      // Remove offer and its inbox email immediately
      state.incomingOffers = state.incomingOffers.filter(o => o.id !== offer.id);
      state.inbox = state.inbox.filter(m => !(m.title.includes(offer.playerName) || m.body.includes(offer.playerName)));

      state.news.unshift({
        headline: `TRANSFER REJECTED: Manager turned down €${(offer.bidAmount / 1000000).toFixed(1)}M bid from ${offer.biddingClubName} for ${offer.playerName}.`,
        date: state.getFormattedDate(),
        category: 'TRANSFERS'
      });
      modal.classList.remove('active');
      renderDashboard();
      renderTransfers();
    };
  }

  if (btnClose) {
    btnClose.onclick = () => modal.classList.remove('active');
  }
}


function renderCompetitionsHub() {
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
}

function renderUCLKnockoutBracket() {
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
}