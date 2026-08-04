import os
import re
import random
import json

# Full Club mapping from Header text to JS Club ID
CLUB_MAP = {
    'ARSENAL': 'arsenal',
    'ASTON VILLA': 'aston_villa',
    'BOURNEMOUTH': 'bournemouth',
    'BRENTFORD': 'brentford',
    'BRIGHTON & HOVE ALBION': 'brighton',
    'CHELSEA': 'chelsea',
    'CRYSTAL PALACE': 'crystal_palace',
    'EVERTON': 'everton',
    'FULHAM': 'fulham',
    'IPSWICH TOWN': 'ipswich',
    'LEICESTER CITY': 'leicester',
    'LIVERPOOL': 'liverpool',
    'MANCHESTER CITY': 'man_city',
    'MANCHESTER UNITED': 'man_united',
    'NEWCASTLE UNITED': 'newcastle',
    'NOTTINGHAM FOREST': 'nottingham',
    'SOUTHAMPTON': 'southampton',
    'TOTTENHAM HOTSPUR': 'tottenham',
    'WEST HAM UNITED': 'west_ham',
    'WOLVERHAMPTON WANDERERS': 'wolves',
    'REAL MADRID': 'real_madrid',
    'FC BARCELONA': 'barcelona',
    'ATLÉTICO MADRID': 'atletico_madrid',
    'ATHLETIC BILBAO': 'athletic_bilbao',
    'REAL SOCIEDAD': 'real_sociedad',
    'VILLARREAL': 'villarreal',
    'BETIS (REAL BETIS)': 'real_betis',
    'GIRONA': 'girona',
    'SEVILLA': 'sevilla',
    'CELTA VIGO': 'celta_vigo',
    'ESPANYOL': 'espanyol',
    'GETAFE': 'getafe',
    'LAS PALMAS': 'las_palmas',
    'LEGANÉS': 'leganes',
    'MALLORCA': 'mallorca',
    'OSASUNA': 'osasuna',
    'RAYO VALLECANO': 'rayo_vallecano',
    'REAL VALLADOLID': 'valladolid',
    'ALAVÉS': 'alaves',
    'BAYERN MUNICH': 'bayern_munich',
    'BAYER LEVERKUSEN': 'bayer_leverkusen',
    'BORUSSIA DORTMUND': 'dortmund',
    'RB LEIPZIG': 'rb_leipzig',
    'EINTRACHT FRANKFURT': 'frankfurt',
    'VFB STUTTGART': 'stuttgart',
    'BORUSSIA MÖNCHENGLADBACH': 'monchengladbach',
    'VFL WOLFSBURG': 'wolfsburg',
    'SC FREIBURG': 'freiburg',
    'WERDER BREMEN': 'werder_bremen',
    'FC AUGSBURG': 'augsburg',
    'TSG HOFFENHEIM': 'hoffenheim',
    'UNION BERLIN': 'union_berlin',
    '1. FSV MAINZ 05': 'mainz',
    'VFL BOCHUM': 'bochum',
    '1. FC HEIDENHEIM': 'heidenheim',
    'FC ST. PAULI': 'st_pauli',
    'HOLSTEIN KIEL': 'holstein_kiel',
    'INTER MILAN': 'inter_milan',
    'JUVENTUS': 'juventus',
    'AC MILAN': 'ac_milan',
    'NAPOLI': 'napoli',
    'ATALANTA': 'atalanta',
    'ROMA': 'roma',
    'LAZIO': 'lazio',
    'FIORENTINA': 'fiorentina',
    'BOLOGNA': 'bologna',
    'TORINO': 'torino',
    'MONZA': 'monza',
    'GENOA': 'genoa',
    'UDINESE': 'udinese',
    'CAGLIARI': 'cagliari',
    'EMPOLI': 'empoli',
    'PARMA': 'parma',
    'VERONA (HELLAS VERONA)': 'verona',
    'COMO': 'como',
    'VENEZIA': 'venezia',
    'LECCE': 'lecce',
    'PARIS SAINT-GERMAIN': 'psg',
    'AS MONACO': 'monaco',
    'MARSEILLE (OLYMPIQUE DE MARSEILLE)': 'marseille',
    'LOSC LILLE': 'lille',
    'LYON (OLYMPIQUE LYONNAIS)': 'lyon',
    'RC LENS': 'lens',
    'OGC NICE': 'nice',
    'RENNES (STADE RENNAIS)': 'rennes',
    'STRASBOURG': 'strasbourg',
    'TOULOUSE': 'toulouse',
    'REIMS (STADE DE REIMS)': 'reims',
    'NANTES': 'nantes',
    'MONTPELLIER': 'montpellier',
    'BREST (STADE BRESTOIS)': 'brest',
    'AUXERRE': 'auxerre',
    'ANGERS': 'angers',
    'LE HAVRE': 'le_havre',
    'SAINT-ÉTIENNE': 'saint_etienne'
}

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

def parse_val(val_str):
    val_str = val_str.replace('€', '').strip()
    if 'M' in val_str:
        return int(float(val_str.replace('M', '')) * 1000000)
    elif 'k' in val_str:
        return int(float(val_str.replace('k', '')) * 1000)
    elif 'K' in val_str:
        return int(float(val_str.replace('K', '')) * 1000)
    return 1000000

def get_flag(country):
    c = country.strip()
    flag = COUNTRY_FLAGS.get(c, '🏳️')
    return f"{flag} {c}"

print("Script template ready.")
