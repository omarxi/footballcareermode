/* Office, Press Conferences & Board Objectives */



class OfficeEngine {
  constructor() {
    this.boardObjectives = [
      { id: 'b1', desc: 'Win the League Championship', category: 'DOMESTIC', progress: 0, status: 'In Progress' },
      { id: 'b2', desc: 'Maintain wage budget under €2.5M/wk', category: 'FINANCIAL', progress: 100, status: 'On Track' },
      { id: 'b3', desc: 'Promote 2 Youth Academy players to first team', category: 'YOUTH', progress: 0, status: '0/2 Promoted' }
    ];
  }

  generatePressConference(opponentName) {
    return {
      title: `Pre-Match Press Conference vs ${opponentName}`,
      questions: [
        {
          id: 'q1',
          text: `Journalist: "How confident are you feeling heading into this crucial fixture against ${opponentName}?"`,
          options: [
            { text: `"We've prepared rigorously. The lads are fully ready to claim 3 points!"`, moraleImpact: +3, boardImpact: +2 },
            { text: `"It's going to be extremely difficult. We are the underdogs."`, moraleImpact: -2, boardImpact: -1 },
            { text: `"No comment. We focus strictly on the pitch."`, moraleImpact: 0, boardImpact: 0 }
          ]
        },
        {
          id: 'q2',
          text: `Journalist: "There are rumours of player unhappiness regarding squad rotation. What is your response?"`,
          options: [
            { text: `"Every player is vital to our squad depth. Opportunities will come."`, moraleImpact: +4, boardImpact: +1 },
            { text: `"If anyone is unhappy, the door is open in January."`, moraleImpact: -5, boardImpact: -2 }
          ]
        }
      ]
    };
  }

  answerQuestion(option) {
    state.managerRating = Math.max(0, Math.min(99, state.managerRating + option.boardImpact));
    state.starters.forEach(p => {
      p.morale = Math.max(0, Math.min(99, p.morale + option.moraleImpact));
    });
    state.playSound('click');
  }
}

const officeEngine = new OfficeEngine();
