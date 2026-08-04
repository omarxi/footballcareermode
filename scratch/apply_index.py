with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Fix broken dashboard table header
html = html.replace(
    '<th>GD</th>\\n                    <th>Pts</th>\\n                  </tr>\\n                </thead>\\n                <tbody id="standingsTableBody">',
    '''<th>#</th>
                    <th>Club</th>
                    <th>P</th>
                    <th>W</th>
                    <th>D</th>
                    <th>L</th>
                    <th>GD</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody id="standingsTableBody">'''
)

# Remove manual simulation buttons
html = html.replace(
    '''<button class="btn-primary" id="btnSimDomesticCupRound" style="font-size: 0.82rem; padding: 0.5rem 1rem;">
                <i class="fa-solid fa-play"></i> Sim Domestic Cup Round
              </button>''',
    ''
)

html = html.replace(
    '''<button class="btn-primary" id="btnSimSwissMatchday" style="font-size: 0.85rem; padding: 0.6rem 1.1rem; background: linear-gradient(135deg, var(--accent-cyan), #0080ff);">
                <i class="fa-solid fa-play"></i> Sim UCL Matchday (<span id="uclSwissMatchdayBadge">MD 1/8</span>)
              </button>''',
    ''
)

# Update textual labels for UCL to 13-team Top-6 format
html = html.replace(
    '36-Team UEFA Champions League (Swiss Format)',
    '13-Team UEFA Champions League'
)

html = html.replace(
    'UEFA CHAMPIONS LEAGUE (36 TEAMS)',
    'UEFA CHAMPIONS LEAGUE (13 TEAMS • TOP 6 KNOCKOUTS)'
)

html = html.replace(
    '''Single 36-team combined table. 8 matches vs 8 different opponents (2 from Pot 1, 2 from Pot 2, 2 from Pot 3, 2 from Pot 4). 
                  <strong style="color: #00ff87;">Ranks 1–8:</strong> Direct R16 • 
                  <strong style="color: #00f0ff;">Ranks 9–24:</strong> Knockout Play-offs • 
                  <strong style="color: #ff4d6d;">Ranks 25–36:</strong> Eliminated''',
    '''13 Elite European Clubs in 1 Combined League Table. 
                  <strong style="color: #00ff87;">Ranks 1 & 2:</strong> Bye to Semi-Finals • 
                  <strong style="color: #00f0ff;">Ranks 3–6:</strong> Quarter-Finals (3rd vs 6th, 4th vs 5th) • 
                  <strong style="color: #ff4d6d;">Ranks 7–13:</strong> Eliminated'''
)

html = html.replace(
    '<span class="card-title"><i class="fa-solid fa-table"></i> 36-Team Combined League Table</span>',
    '<span class="card-title"><i class="fa-solid fa-table"></i> 13-Team Combined League Table</span>'
)

html = html.replace(
    '''<span style="color: #00ff87;">🟢 1-8 Direct R16</span>
                  <span style="color: #00f0ff;">🔵 9-24 Play-offs</span>
                  <span style="color: #ff4d6d;">🔴 25-36 Eliminated</span>''',
    '''<span style="color: #00ff87;">🟢 1-2 Direct to SF</span>
                  <span style="color: #00f0ff;">🔵 3-6 Play QF</span>
                  <span style="color: #ff4d6d;">🔴 7-13 Eliminated</span>'''
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
