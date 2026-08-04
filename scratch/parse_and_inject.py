import sys
import re

COUNTRY_FLAGS = {
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Spain': '🇪🇸', 'France': '🇫🇷', 'Germany': '🇩🇪', 'Italy': '🇮🇹',
    'Netherlands': '🇳🇱', 'Brazil': '🇧🇷', 'Argentina': '🇦🇷', 'Portugal': '🇵🇹', 'Belgium': '🇧🇪',
    'Norway': '🇳🇴', 'Croatia': '🇭🇷', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Uruguay': '🇺🇾',
    'Colombia': '🇨🇴', 'Mexico': '🇲🇽', 'Morocco': '🇲🇦', 'Senegal': '🇸🇳', 'Nigeria': '🇳🇬',
    'Cameroon': '🇨🇲', 'Egypt': '🇪🇬', 'United States': '🇺🇸', 'Canada': '🇨🇦', 'Australia': '🇦🇺',
    'Poland': '🇵🇱', 'Turkey': '🇹🇷', 'Denmark': '🇩🇰', 'Sweden': '🇸🇪', 'Switzerland': '🇨🇭',
    'Austria': '🇦🇹', 'Ukraine': '🇺🇦', 'Czech Republic': '🇨🇿', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'Republic of Ireland': '🇮🇪', 'Northern Ireland': '🇬🇧', 'Ivory Coast': '🇨🇮', 'Ghana': '🇬🇭',
    'Algeria': '🇩🇿', 'Mali': '🇲🇱', 'DR Congo': '🇨🇩', 'Serbia': '🇷🇸', 'Slovakia': '🇸🇰',
    'Slovenia': '🇸🇮', 'Hungary': '🇭🇺', 'Greece': '🇬🇷', 'Romania': '🇷🇴', 'Finland': '🇫🇮',
    'Jamaica': '🇯🇲', 'Ecuador': '🇪🇨', 'Paraguay': '🇵🇾', 'Chile': '🇨🇱', 'Peru': '🇵🇪',
    'Venezuela': '🇻🇪', 'Kosovo': '🇽🇰', 'Albania': '🇦🇱', 'Tunisia': '🇹🇳', 'Georgia': '🇬🇪',
    'Iceland': '🇮🇸', 'Montenegro': '🇲🇪', 'Bosnia and Herzegovina': '🇧🇦', 'Iraq': '🇮🇶',
    'Iran': '🇮🇷', 'Saudi Arabia': '🇸🇦', 'Uzbekistan': '🇺🇿', 'Burkina Faso': '🇧🇫', 'Gambia': '🇬🇲',
    'Togo': '🇹🇬', 'Gabon': '🇬🇦', 'Benin': '🇧🇯', 'Angola': '🇦🇴', 'Zimbabwe': '🇿🇼',
    'Estonia': '🇪🇪', 'North Macedonia': '🇲🇰', 'Equatorial Guinea': '🇬🇶', 'Armenia': '🇦🇲',
    'Cape Verde': '🇨🇻', 'Luxembourg': '🇱🇺', 'Mozambique': '🇲🇿', 'French Guiana': '🇬🇫',
    'Suriname': '🇸🇷', 'Guadeloupe': '🇬🇵', 'Central African Republic': '🇨🇫', 'Burundi': '🇧🇮',
    'Kenya': '🇰🇪', 'Malta': '🇲🇹', 'Guinea-Bissau': '🇬🇼', 'Indonesia': '🇮🇩', 'Lithuania': '🇱🇹',
    'Congo': '🇨🇬', 'Republic of the Congo': '🇨🇬', 'Madagascar': '🇲🇬', 'Guinea': '🇬🇳'
}

def get_flag_formatted(c_str):
    c = c_str.strip()
    flag = COUNTRY_FLAGS.get(c, '🏳️')
    return f"{flag} {c}"

# Parse the user prompt text file
db_file = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/scratch/db_prompt.txt'
if os.path.exists(db_file):
    with open(db_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    player_nat_map = {}
    for line in lines:
        if '|' in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 5 and parts[0] != 'No.' and not parts[0].startswith('----'):
                # Line format: No. | Player Name | Pos | OVR | Market Value | Country
                # Or: Player Name | Pos | OVR | Market Value | Country
                if parts[0].isdigit():
                    p_name = parts[1]
                    country = parts[5] if len(parts) >= 6 else parts[-1]
                else:
                    p_name = parts[0]
                    country = parts[-1]
                
                player_nat_map[p_name.strip()] = get_flag_formatted(country)

    print(f"Parsed {len(player_nat_map)} player nationalities from db_prompt.txt")

    # Update data.js
    data_js = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/data.js'
    with open(data_js, 'r', encoding='utf-8') as f:
        js_content = f.read()

    updated_count = 0
    def repl(m):
        global updated_count
        full_match = m.group(0)
        p_name = m.group(1)
        if p_name in player_nat_map:
            new_nat = player_nat_map[p_name]
            updated_count += 1
            return full_match.replace(m.group(2), f"nat: '{new_nat}'")
        return full_match

    # Pattern matches: { name: "David Raya", ..., nat: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ... }
    new_js_content = re.sub(r'{\s*name:\s*["\']([^"\']+)["\'][^}]+?(nat:\s*["\'][^"\']+["\'])', repl, js_content)

    with open(data_js, 'w', encoding='utf-8') as f:
        f.write(new_js_content)

    print(f"Successfully updated {updated_count} player nationalities in js/data.js!")
