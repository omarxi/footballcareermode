import os
import re
import json

# Read the raw text from prompt text file or process direct python string
# We will create a dictionary of player_name -> country from the user's provided list

USER_DATABASE_TEXT = """
CLUB: ARSENAL  (Full Roster Size: 25 Players)
David Raya | GK | 84 | €35M | Spain
Neto | GK | 77 | €5M | Brazil
Tommy Setford | GK | 64 | €2M | England
William Saliba | CB | 87 | €80M | France
Gabriel Magalhães | CB | 86 | €70M | Brazil
Riccardo Calafiori | CB/LB | 81 | €45M | Italy
Jurriën Timber | RB/LB | 80 | €40M | Netherlands
Ben White | RB/CB | 83 | €55M | England
Oleksandr Zinchenko | LB/CM | 79 | €25M | Ukraine
Takehiro Tomiyasu | RB/LB | 78 | €20M | Japan
Kieran Tierney | LB | 77 | €12M | Scotland
Jakub Kiwior | CB/LB | 77 | €20M | Poland
Declan Rice | CDM/CM | 86 | €110M | England
Thomas Partey | CDM | 82 | €20M | Ghana
Jorginho | CM/CDM | 80 | €15M | Italy
Martin Ødegaard | CAM | 89 | €110M | Norway
Mikel Merino | CM | 83 | €50M | Spain
Ethan Nwaneri | CAM/RW | 74 | €15M | England
Myles Lewis-Skelly | CDM/LB | 70 | €10M | England
Bukayo Saka | RW | 87 | €140M | England
Gabriel Martinelli | LW | 84 | €70M | Brazil
Leandro Trossard | LW/ST | 82 | €35M | Belgium
Kai Havertz | ST/CAM | 83 | €55M | Germany
Gabriel Jesus | ST/RW | 82 | €45M | Brazil
Raheem Sterling | LW/RW | 81 | €25M | England
"""

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

def get_flag_str(country):
    flag = COUNTRY_FLAGS.get(country, '🏳️')
    return f"{flag} {country}"

print("Helper ready")
