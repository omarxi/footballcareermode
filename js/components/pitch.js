/* Squad Hub Interactive Pitch Component */




function renderPitch(containerElement, selectedSlotIndex = null, onSelectSlot) {
  const formation = FORMATIONS[state.selectedFormationKey] || FORMATIONS['4-3-3'];
  const starters = state.starters;

  let slotsHtml = '';
  formation.positions.forEach((posConfig, idx) => {
    const player = starters[idx];
    const isSelected = selectedSlotIndex === idx;
    const ovr = player ? player.ovr : '--';
    const name = player ? player.name.split(' ').pop() : 'Empty';
    const role = posConfig.role;

    slotsHtml += `
      <div class="pitch-player-slot" 
           style="left: ${posConfig.x}%; top: ${posConfig.y}%;" 
           data-slot-index="${idx}">
        <div class="slot-node ${isSelected ? 'selected' : ''}">
          ${ovr}
        </div>
        <div class="slot-info">
          <div class="slot-name">${name}</div>
          <div class="slot-pos-badge">${role}</div>
        </div>
      </div>
    `;
  });

  containerElement.innerHTML = `
    <div class="pitch-lines"></div>
    <div class="pitch-half-line"></div>
    <div class="pitch-center-circle"></div>
    <div class="pitch-penalty-area-top"></div>
    <div class="pitch-penalty-area-bottom"></div>
    ${slotsHtml}
  `;

  // Attach click listeners to player slots
  containerElement.querySelectorAll('.pitch-player-slot').forEach(slotEl => {
    slotEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(slotEl.dataset.slotIndex, 10);
      onSelectSlot(idx);
    });
  });
}

// Calculate team rating metrics
function calculateTeamRatings() {
  const starters = state.starters;
  if (!starters || starters.length === 0) return { att: 80, mid: 80, def: 80, ovr: 80 };

  const forwards = starters.filter(p => ['ST', 'LW', 'RW', 'CF'].includes(p.pos));
  const midfielders = starters.filter(p => ['CAM', 'CM', 'CDM', 'LM', 'RM'].includes(p.pos));
  const defenders = starters.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB', 'GK'].includes(p.pos));

  const avg = arr => arr.length ? Math.round(arr.reduce((s, p) => s + p.ovr, 0) / arr.length) : 80;

  const att = avg(forwards.length ? forwards : starters);
  const mid = avg(midfielders.length ? midfielders : starters);
  const def = avg(defenders.length ? defenders : starters);
  const ovr = Math.round((att + mid + def) / 3);

  return { att, mid, def, ovr };
}
