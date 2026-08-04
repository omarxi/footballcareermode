import re

# 1. FIX index.html
with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/index.html', 'r', encoding='utf-8') as f:
    html_code = f.read()

# Fix broken dashboard table header
broken_header_pattern = r'<div class="card-header">\s*<span class="card-title" id="standingsCardTitle"><i class="fa-solid fa-list-ol"></i> League Standings</span>\s*<div style="display:flex;gap:0.3rem;">\s*<button class="btn-secondary comp-switch-btn active" data-comp="LEAGUE" style="font-size:0.72rem;padding:0.25rem 0.6rem;">League</button>\s*<button class="btn-secondary comp-switch-btn" data-comp="UCL" style="font-size:0.72rem;padding:0.25rem 0.6rem;">⭐ UCL</button>\s*</div>\s*</div>\s*<th>GD</th>'

fixed_dashboard_table = '''<div class="card-header">
                <span class="card-title" id="standingsCardTitle"><i class="fa-solid fa-list-ol"></i> League Standings</span>
                <div style="display:flex;gap:0.3rem;">
                  <button class="btn-secondary comp-switch-btn active" data-comp="LEAGUE" style="font-size:0.72rem;padding:0.25rem 0.6rem;">League</button>
                  <button class="btn-secondary comp-switch-btn" data-comp="UCL" style="font-size:0.72rem;padding:0.25rem 0.6rem;">⭐ UCL</button>
                </div>
              </div>
              <table class="standings-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Club</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody id="standingsTableBody">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>'''

if '<th>GD</th>' in html_code and '<table class="standings-table">' not in html_code.split('standingsCardTitle')[1][:300]:
    html_code = re.sub(r'<div class="card-header">\s*<span class="card-title" id="standingsCardTitle">.*?</div>\s*<th>GD</th>\s*<th>Pts</th>\s*</tr>\s*</thead>\s*<tbody id="standingsTableBody">', fixed_dashboard_table, html_code, flags=re.DOTALL)

# Update UCL Banner in tab-competitions to 13-Team Top 6 Format
html_code = html_code.replace(
  '36-Team UEFA Champions League (Swiss Format)',
  '13-Team UEFA Champions League'
).replace(
  'UEFA CHAMPIONS LEAGUE (36 TEAMS)',
  'UEFA CHAMPIONS LEAGUE (13 TEAMS • TOP 6 KNOCKOUTS)'
).replace(
  'Single 36-team combined table. 8 matches vs 8 different opponents (2 from Pot 1, 2 from Pot 2, 2 from Pot 3, 2 from Pot 4). \n                  <strong style="color: #00ff87;">Ranks 1–8:</strong> Direct R16 • \n                  <strong style="color: #00f0ff;">Ranks 9–24:</strong> Knockout Play-offs • \n                  <strong style="color: #ff4d6d;">Ranks 25–36:</strong> Eliminated',
  '13 Elite European Clubs in 1 Combined League Table. \n                  <strong style="color: #00ff87;">Ranks 1 & 2:</strong> Bye to Semi-Finals • \n                  <strong style="color: #00f0ff;">Ranks 3–6:</strong> Quarter-Finals (3rd vs 6th, 4th vs 5th) • \n                  <strong style="color: #ff4d6d;">Ranks 7–13:</strong> Eliminated'
)

# Remove manual standalone sim buttons from HTML (since matches are now played via calendar advance)
html_code = re.sub(r'<button class="btn-primary" id="btnSimDomesticCupRound".*?</button>', '', html_code, flags=re.DOTALL)
html_code = re.sub(r'<button class="btn-primary" id="btnSimSwissMatchday".*?</button>', '', html_code, flags=re.DOTALL)

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/index.html', 'w', encoding='utf-8') as f:
    f.write(html_code)

print("index.html fixed successfully!")
