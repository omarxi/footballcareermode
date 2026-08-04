import json
import re

transcript_path = '/home/omar/.gemini/antigravity/brain/b3036828-15ef-4166-9699-36392be0df92/.system_generated/logs/transcript_full.jsonl'

user_text = ""
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get("type") == "USER_INPUT":
                content = data.get("content", "")
                if "LEAGUE: PREMIER LEAGUE" in content:
                    user_text = content
        except Exception as e:
            pass

if not user_text:
    print("User text not found in transcript!")
    exit(1)

print(f"Extracted user text of length: {len(user_text)}")

FLAG_MAP = {
    "Spain": "🇪🇸",
    "France": "🇫🇷",
    "Brazil": "🇧🇷",
    "Argentina": "🇦🇷",
    "Germany": "🇩🇪",
    "Italy": "🇮🇹",
    "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Netherlands": "🇳🇱",
    "Portugal": "🇵🇹",
    "Croatia": "🇭🇷",
    "Japan": "🇯🇵",
    "Belgium": "🇧🇪",
    "Uruguay": "🇺🇾",
    "Norway": "🇳🇴",
    "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Ukraine": "🇺🇦",
    "Poland": "🇵🇱",
    "Ghana": "🇬🇭",
    "Colombia": "🇨🇴",
    "Senegal": "🇸🇳",
    "Cameroon": "🇨🇲",
    "Ivory Coast": "🇨🇮",
    "Denmark": "🇩🇰",
    "Sweden": "🇸🇪",
    "United States": "🇺🇸",
    "Turkey": "🇹🇷",
    "Morocco": "🇲🇦",
    "Nigeria": "🇳🇬",
    "Ecuador": "🇪🇨",
    "Algeria": "🇩🇿",
    "Austria": "🇦🇹",
    "Switzerland": "🇨🇭",
    "South Korea": "🇰🇷",
    "Canada": "🇨🇦",
    "Mexico": "🇲🇽",
    "Paraguay": "🇵🇾",
    "Czech Republic": "🇨🇿",
    "Slovakia": "🇸🇰",
    "Hungary": "🇭🇺",
    "Romania": "🇷🇴",
    "Serbia": "🇷🇸",
    "Greece": "🇬🇷",
    "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "Republic of Ireland": "🇮🇪",
    "Northern Ireland": "🇬🇧",
    "Jamaica": "🇯🇲",
    "Australia": "🇦🇺",
    "Egypt": "🇪🇬",
    "Mali": "🇲🇱",
    "Georgia": "🇬🇪",
    "Venezuela": "🇻🇪",
    "Albania": "🇦🇱",
    "Finland": "🇫🇮",
    "Slovenia": "🇸🇮",
    "Bosnia and Herzegovina": "🇧🇦",
    "DR Congo": "🇨🇩",
    "Burkina Faso": "🇧🇫",
    "Gambia": "🇬🇲",
    "Kosovo": "🇽🇰",
    "Montenegro": "🇲🇪",
    "Iraq": "🇮🇶",
    "Zambia": "🇿🇲",
    "Chile": "🇨🇱",
    "New Zealand": "🇳🇿",
    "Togo": "🇹🇬",
    "Mozambique": "🇲🇿",
    "Cape Verde": "🇨🇻",
    "Suriname": "🇸🇷",
    "North Macedonia": "🇲🇰",
    "Peru": "🇵🇪",
    "Equatorial Guinea": "🇬🇶",
    "Estonia": "🇪🇪",
    "Armenia": "🇦🇲",
    "Israel": "🇮🇱",
    "Tunisia": "🇹🇳",
    "Benin": "🇧🇯",
    "Luxembourg": "🇱🇺",
    "Iran": "🇮🇷",
    "Central African Republic": "🇨🇫",
    "Uzbekistan": "🇺🇿",
    "Saudi Arabia": "🇸🇦",
    "Indonesia": "🇮🇩",
    "French Guiana": "🇬🇫",
    "Republic of the Congo": "🇨🇬",
    "Congo": "🇨🇬",
    "Haiti": "🇭🇹",
    "Madagascar": "🇲🇬",
    "Zimbabwe": "🇿🇼",
    "Angola": "🇦🇴",
    "Guinea-Bissau": "🇬🇼",
    "Guinea": "🇬🇳",
    "Panama": "🇵🇦",
    "Burundi": "🇧🇮",
    "Guadeloupe": "🇬🇵",
    "Costa Rica": "🇨🇷"
}

def parse_val(val_str):
    val_str = val_str.replace("€", "").replace(" ", "").upper()
    if "M" in val_str:
        num = float(val_str.replace("M", ""))
        return int(num * 1000000)
    elif "K" in val_str:
        num = float(val_str.replace("K", ""))
        return int(num * 1000)
    try:
        return int(float(val_str))
    except:
        return 5000000

# Mapping club name strings in prompt to internal club IDs
CLUB_ID_MAP = {
    "ARSENAL": "arsenal",
    "ASTON VILLA": "aston_villa",
    "BOURNEMOUTH": "bournemouth",
    "BRENTFORD": "brentford",
    "BRIGHTON & HOVE ALBION": "brighton",
    "CHELSEA": "chelsea",
    "CRYSTAL PALACE": "crystal_palace",
    "EVERTON": "everton",
    "FULHAM": "fulham",
    "IPSWICH TOWN": "ipswich",
    "LEICESTER CITY": "leicester",
    "LIVERPOOL": "liverpool",
    "MANCHESTER CITY": "man_city",
    "MANCHESTER UNITED": "man_united",
    "NEWCASTLE UNITED": "newcastle",
    "NOTTINGHAM FOREST": "nottingham",
    "SOUTHAMPTON": "southampton",
    "TOTTENHAM HOTSPUR": "tottenham",
    "WEST HAM UNITED": "west_ham",
    "WOLVERHAMPTON WANDERERS": "wolves",
    "REAL MADRID": "real_madrid",
    "FC BARCELONA": "barcelona",
    "ATLÉTICO MADRID": "atletico_madrid",
    "ATHLETIC BILBAO": "athletic_bilbao",
    "REAL SOCIEDAD": "real_sociedad",
    "VILLARREAL": "villarreal",
    "BETIS (REAL BETIS)": "real_betis",
    "GIRONA": "girona",
    "SEVILLA": "sevilla",
    "CELTA VIGO": "celta_vigo",
    "ESPANYOL": "espanyol",
    "GETAFE": "getafe",
    "LAS PALMAS": "las_palmas",
    "LEGANÉS": "leganes",
    "MALLORCA": "mallorca",
    "OSASUNA": "osasuna",
    "RAYO VALLECANO": "rayo_vallecano",
    "REAL VALLADOLID": "valladolid",
    "ALAVÉS": "alaves",
    "BAYERN MUNICH": "bayern",
    "BAYER LEVERKUSEN": "leverkusen",
    "BORUSSIA DORTMUND": "dortmund",
    "RB LEIPZIG": "leipzig",
    "EINTRACHT FRANKFURT": "frankfurt",
    "VFB STUTTGART": "stuttgart",
    "BORUSSIA MÖNCHENGLADBACH": "mgladbach",
    "VFL WOLFSBURG": "wolfsburg",
    "SC FREIBURG": "freiburg",
    "WERDER BREMEN": "bremen",
    "FC AUGSBURG": "augsburg",
    "TSG HOFFENHEIM": "hoffenheim",
    "UNION BERLIN": "union_berlin",
    "1. FSV MAINZ 05": "mainz",
    "VFL BOCHUM": "bochum",
    "1. FC HEIDENHEIM": "heidenheim",
    "FC ST. PAULI": "st_pauli",
    "HOLSTEIN KIEL": "holstein_kiel",
    "INTER MILAN": "inter_milan",
    "JUVENTUS": "juventus",
    "AC MILAN": "ac_milan",
    "NAPOLI": "napoli",
    "ATALANTA": "atalanta",
    "ROMA": "roma",
    "LAZIO": "lazio",
    "FIORENTINA": "fiorentina",
    "BOLOGNA": "bologna",
    "TORINO": "torino",
    "MONZA": "monza",
    "GENOA": "genoa",
    "UDINESE": "udinese",
    "CAGLIARI": "cagliari",
    "EMPOLI": "empoli",
    "PARMA": "parma",
    "VERONA (HELLAS VERONA)": "verona",
    "COMO": "como",
    "VENEZIA": "venezia",
    "LECCE": "lecce",
    "PARIS SAINT-GERMAIN": "psg",
    "AS MONACO": "monaco",
    "MARSEILLE (OLYMPIQUE DE MARSEILLE)": "marseille",
    "LOSC LILLE": "lille",
    "LYON (OLYMPIQUE LYONNAIS)": "lyon",
    "RC LENS": "lens",
    "OGC NICE": "nice",
    "RENNES (STADE RENNAIS)": "rennes",
    "STRASBOURG": "strasbourg",
    "TOULOUSE": "toulouse",
    "REIMS (STADE DE REIMS)": "reims",
    "NANTES": "nantes",
    "MONTPELLIER": "montpellier",
    "BREST (STADE BRESTOIS)": "brest",
    "AUXERRE": "auxerre",
    "ANGERS": "angers",
    "LE HAVRE": "le_havre",
    "SAINT-ÉTIENNE": "saint_etienne"
}

club_blocks = re.split(r'------------------------------------------------------------------------------------------------------------------------\n CLUB: ', user_text)

club_rosters = {}
total_parsed_players = 0

for block in club_blocks[1:]:
    lines = block.strip().split('\n')
    header = lines[0]
    club_name_match = re.search(r'^([^\(]+(?:\([^\)]+\))?)', header)
    club_name_raw = club_name_match.group(1).strip() if club_name_match else header.split('  (')[0].strip()
    
    club_id = CLUB_ID_MAP.get(club_name_raw)
    if not club_id:
        for k in CLUB_ID_MAP:
            if k in club_name_raw or club_name_raw in k:
                club_id = CLUB_ID_MAP[k]
                break
    
    if not club_id:
        print(f"WARNING: Could not map club name '{club_name_raw}'")
        continue

    players_list = []
    for line in lines:
        if '|' in line and not line.startswith('No.') and not line.startswith('----'):
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 6 and parts[0].isdigit():
                p_name = parts[1]
                pos_raw = parts[2]
                primary_pos = pos_raw.split('/')[0].strip()
                ovr = int(parts[3])
                val_str = parts[4]
                val = parse_val(val_str)
                country = parts[5]
                flag = FLAG_MAP.get(country, '🌐')
                
                # Estimate wage based on value
                wage = max(2000, int(val * 0.0035))
                # Random age 18-34 based on hash of name
                age = 19 + (hash(p_name) % 15)

                players_list.append({
                    "name": p_name,
                    "pos": primary_pos,
                    "ovr": ovr,
                    "age": age,
                    "nat": flag,
                    "val": val,
                    "wage": wage
                })

    club_rosters[club_id] = players_list
    total_parsed_players += len(players_list)

print(f"Successfully parsed {len(club_rosters)} clubs with {total_parsed_players} players!")

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/scratch/parsed_rosters.json', 'w', encoding='utf-8') as f:
    json.dump(club_rosters, f, ensure_ascii=False, indent=2)

print("Saved to parsed_rosters.json")
