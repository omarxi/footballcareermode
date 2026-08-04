import re
import os

# Country to Flag mapping
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
    'Estonia': '🇪🇪', 'North Macedonia': '🇲🇰', 'Equatorial Guinea': '🇬GQ', 'Armenia': '🇦🇲',
    'Cape Verde': '🇨🇻', 'Luxembourg': '🇱🇺', 'Mozambique': '🇲🇿', 'French Guiana': '🇬🇫',
    'Suriname': '🇸🇷', 'Guadeloupe': '🇬🇵', 'Central African Republic': '🇨🇫', 'Burundi': '🇧🇮',
    'Kenya': '🇰🇪', 'Malta': '🇲🇹', 'Guinea-Bissau': '🇬🇼', 'Indonesia': '🇮🇩', 'Lithuania': '🇱🇹',
    'Congo': '🇨🇬', 'Republic of the Congo': '🇨🇬', 'Madagascar': '🇲🇬', 'Guinea': '🇬🇳'
}

def get_flag(c):
    c = c.strip()
    flag = COUNTRY_FLAGS.get(c, '🏳️')
    return f"{flag} {c}"

# Read data.js
data_js_path = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/data.js'
with open(data_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

print("data.js read successfully")
