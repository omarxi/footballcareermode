/* Youth Academy & Scouting Engine */

import { state } from '../state.js';

export class YouthEngine {
  constructor() {
    this.academy = [
      { id: 'y1', name: 'Diego Silva', pos: 'CAM', ovr: 68, pot: 92, age: 16, nation: '🇧🇷', pac: 82, sho: 70, pas: 75, dri: 80, def: 40, phy: 55, val: 4500000, wage: 5000 },
      { id: 'y2', name: 'Mateo Kovac', pos: 'CB', ovr: 65, pot: 89, age: 15, nation: '🇭🇷', pac: 74, sho: 40, pas: 65, dri: 62, def: 72, phy: 70, val: 3200000, wage: 4000 }
    ];
  }

  scoutRegion(regionName) {
    state.playSound('click');
    const firstNames = ['Lucas', 'Gabriel', 'Carlos', 'Enzo', 'Julian', 'Marco', 'Leo', 'Sandro'];
    const lastNames = ['Torres', 'Fernandez', 'Santos', 'Rossi', 'Schmidt', 'Moreno', 'Silva', 'Barella'];

    const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const positions = ['ST', 'CAM', 'RW', 'LW', 'CM', 'CB', 'LB', 'RB', 'GK'];
    const pos = positions[Math.floor(Math.random() * positions.length)];
    const ovr = Math.floor(Math.random() * 8) + 62; // 62 - 70
    const pot = Math.floor(Math.random() * 10) + 85; // 85 - 95

    const prospect = {
      id: `y_${Date.now()}`,
      name,
      pos,
      ovr,
      pot,
      age: Math.floor(Math.random() * 3) + 15, // 15 - 17
      nation: regionName === 'South America' ? '🇧🇷' : regionName === 'Europe' ? '🇪🇸' : '🇯🇵',
      pac: Math.floor(Math.random() * 20) + 70,
      sho: Math.floor(Math.random() * 20) + 60,
      pas: Math.floor(Math.random() * 20) + 65,
      dri: Math.floor(Math.random() * 20) + 70,
      def: Math.floor(Math.random() * 20) + 50,
      phy: Math.floor(Math.random() * 20) + 55,
      val: Math.round(ovr * 60000),
      wage: 3000
    };

    this.academy.unshift(prospect);

    state.news.unshift({
      headline: `SCOUT REPORT: Scout discovered ${prospect.name} (${prospect.pos}, Potential ${prospect.pot}) in ${regionName}!`,
      date: state.getFormattedDate(),
      category: 'SCOUT'
    });

    return prospect;
  }

  promoteToFirstTeam(prospectId) {
    const idx = this.academy.findIndex(p => p.id === prospectId);
    if (idx !== -1) {
      const prospect = this.academy.splice(idx, 1)[0];
      prospect.clubId = state.myClubId;
      state.bench.push(prospect);

      state.news.unshift({
        headline: `YOUTH PROMOTION: ${prospect.name} (${prospect.ovr} OVR) has been promoted to ${state.myClub.name} first team!`,
        date: state.getFormattedDate(),
        category: 'ACADEMY'
      });

      state.playSound('goal');
      return prospect;
    }
    return null;
  }
}

export const youthEngine = new YouthEngine();
