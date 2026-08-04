import re

app_file = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/app.js'
state_file = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/state.js'

# --- 1. UPDATE app.js ---
with open(app_file, 'r', encoding='utf-8') as f:
    app_code = f.read()

# Make sure bootApp calls renderCompetitionsHub()
if 'renderCompetitionsHub();' not in app_code.split('function bootApp()')[1].split('}')[0]:
    app_code = app_code.replace(
        'renderUCLHub();\n}',
        'renderUCLHub();\n  renderCompetitionsHub();\n}'
    )

# Make sure tab click listener calls renderCompetitionsHub() when switching tabs
tab_click_patch = '''      if (btn.dataset.tab === 'ucl') {
        renderUCLHub();
      }
      if (btn.dataset.tab === 'competitions') {
        renderCompetitionsHub();
      }'''

if "btn.dataset.tab === 'competitions'" not in app_code:
    app_code = app_code.replace(
        "if (btn.dataset.tab === 'ucl') {\n        renderUCLHub();\n      }",
        tab_click_patch
    )

# Make sure advance day updates renderCompetitionsHub()
if 'renderCompetitionsHub();' not in app_code.split("document.getElementById('btnAdvanceDay')")[1].split('});')[0]:
    app_code = app_code.replace(
        'renderYouthAcademy();\n  });',
        'renderYouthAcademy();\n    renderCompetitionsHub();\n  });'
    )

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(app_code)

print("app.js updated with renderCompetitionsHub calls!")

# --- 2. UPDATE state.js ---
with open(state_file, 'r', encoding='utf-8') as f:
    state_code = f.read()

# Make sure selectUserClub initializes all competition data properly
select_club_patch = '''  selectUserClub(clubId) {
    const club = this.clubs.find(c => c.id === clubId);
    if (!club) return;
    
    this.myClubId = clubId;
    this.myClub = club;
    this.currentDate = new Date(2026, 6, 1);
    
    this.initSquad();
    this.initLeagueTable();
    this.init13TeamUCL();
    this.initDomesticCup();
    this.initFixtures();
  }'''

state_code = re.sub(r'selectUserClub\(clubId\)\s*\{.*?\}\n\}', select_club_patch.strip() + '\n}', state_code, flags=re.DOTALL)

with open(state_file, 'w', encoding='utf-8') as f:
    f.write(state_code)

print("state.js selectUserClub fixed!")
