import re

# Comprehensive dictionary mapping player names (normalized) to their authentic country flag & name
PLAYER_NATIONS = {
    # ARSENAL
    "David Raya": "🇪🇸 Spain", "Neto": "🇧🇷 Brazil", "Tommy Setford": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "William Saliba": "🇫🇷 France",
    "Gabriel Magalhães": "🇧🇷 Brazil", "Riccardo Calafiori": "🇮🇹 Italy", "Jurriën Timber": "🇳🇱 Netherlands",
    "Ben White": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Oleksandr Zinchenko": "🇺🇦 Ukraine", "Takehiro Tomiyasu": "🇯🇵 Japan",
    "Kieran Tierney": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland", "Jakub Kiwior": "🇵🇱 Poland", "Declan Rice": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Thomas Partey": "🇬🇭 Ghana", "Jorginho": "🇮🇹 Italy", "Martin Ødegaard": "🇳🇴 Norway",
    "Mikel Merino": "🇪🇸 Spain", "Ethan Nwaneri": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Myles Lewis-Skelly": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Bukayo Saka": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Gabriel Martinelli": "🇧🇷 Brazil", "Leandro Trossard": "🇧🇪 Belgium",
    "Kai Havertz": "🇩🇪 Germany", "Gabriel Jesus": "🇧🇷 Brazil", "Raheem Sterling": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",

    # ASTON VILLA
    "Emiliano Martínez": "🇦🇷 Argentina", "Robin Olsen": "🇸🇪 Sweden", "Joe Gauci": "🇦🇺 Australia",
    "Ezri Konsa": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Pau Torres": "🇪🇸 Spain", "Diego Carlos": "🇧🇷 Brazil",
    "Tyrone Mings": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Matty Cash": "🇵🇱 Poland", "Lucas Digne": "🇫🇷 France",
    "Ian Maatsen": "🇳🇱 Netherlands", "Kosta Nedeljkovic": "🇷🇸 Serbia", "Amadou Onana": "🇧🇪 Belgium",
    "Boubacar Kamara": "🇫🇷 France", "Youri Tielemans": "🇧🇪 Belgium", "John McGinn": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland",
    "Ross Barkley": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Jacob Ramsey": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Morgan Rogers": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Leon Bailey": "🇯🇲 Jamaica", "Emiliano Buendía": "🇦🇷 Argentina", "Jaden Philogene": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Ollie Watkins": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Jhon Durán": "🇨🇴 Colombia",

    # BOURNEMOUTH
    "Kepa Arrizabalaga": "🇪🇸 Spain", "Mark Travers": "🇮🇪 Republic of Ireland", "Will Dennis": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Illia Zabarnyi": "🇺🇦 Ukraine", "Marcos Senesi": "🇦🇷 Argentina", "Dean Huijsen": "🇪🇸 Spain",
    "James Hill": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Milos Kerkez": "🇭🇺 Hungary", "Julian Araujo": "🇲🇽 Mexico",
    "Adam Smith": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Max Aarons": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Lewis Cook": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Ryan Christie": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland", "Alex Scott": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Philip Billing": "🇩🇰 Denmark",
    "Tyler Adams": "🇺🇸 United States", "Marcus Tavernier": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Justin Kluivert": "🇳🇱 Netherlands",
    "Antoine Semenyo": "🇬🇭 Ghana", "Dango Ouattara": "🇧🇫 Burkina Faso", "Luis Sinisterra": "🇨🇴 Colombia",
    "Evanilson": "🇧🇷 Brazil", "Enes Ünal": "🇹🇷 Turkey",

    # BRENTFORD
    "Mark Flekken": "🇳🇱 Netherlands", "Hákon Valdimarsson": "🇮🇸 Iceland", "Matthew Cox": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Ethan Pinnock": "🇯🇲 Jamaica", "Nathan Collins": "🇮🇪 Republic of Ireland", "Sepp van den Berg": "🇳🇱 Netherlands",
    "Ben Mee": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Kristoffer Ajer": "🇳🇴 Norway", "Rico Henry": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Aaron Hickey": "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland", "Mad Roerslev": "🇩🇰 Denmark", "Jayden Meghoma": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Christian Nørgaard": "🇩🇰 Denmark", "Vitaly Janelt": "🇩🇪 Germany", "Mathias Jensen": "🇩🇰 Denmark",
    "Mikkel Damsgaard": "🇩🇰 Denmark", "Yunus Emre Konak": "🇹🇷 Turkey", "Paris Maghoma": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Bryan Mbeumo": "🇨🇲 Cameroon", "Yoane Wissa": "🇨🇩 DR Congo", "Kevin Schade": "🇩🇪 Germany",
    "Keane Lewis-Potter": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Igor Thiago": "🇧🇷 Brazil", "Gustavo Nunes": "🇧🇷 Brazil",

    # BRIGHTON
    "Bart Verbruggen": "🇳🇱 Netherlands", "Jason Steele": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Lewis Dunk": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Jan Paul van Hecke": "🇳🇱 Netherlands", "Adam Webster": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Igor Julio": "🇧🇷 Brazil",
    "Pervis Estupiñán": "🇪🇨 Ecuador", "Ferdi Kadıoğlu": "🇹🇷 Turkey", "Tariq Lamptey": "🇬🇭 Ghana",
    "Joel Veltman": "🇳🇱 Netherlands", "Carlos Baleba": "🇨🇲 Cameroon", "Mats Wieffer": "🇳🇱 Netherlands",
    "Matt O'Riley": "🇩🇰 Denmark", "Yasin Ayari": "🇸🇪 Sweden", "James Milner": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Brajan Gruda": "🇩🇪 Germany", "Kaoru Mitoma": "🇯🇵 Japan", "Simon Adingra": "🇨🇮 Ivory Coast",
    "Yankuba Minteh": "🇬🇲 Gambia", "Solly March": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Joao Pedro": "🇧🇷 Brazil",
    "Evan Ferguson": "🇮🇪 Republic of Ireland", "Danny Welbeck": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Georginio Rutter": "🇫🇷 France",
    "Julio Enciso": "🇵🇾 Paraguay",

    # CHELSEA
    "Robert Sánchez": "🇪🇸 Spain", "Filip Jørgensen": "🇩🇰 Denmark", "Marcus Bettinelli": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Levi Colwill": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Wesley Fofana": "🇫🇷 France", "Axel Disasi": "🇫🇷 France",
    "Benoît Badiashile": "🇫🇷 France", "Tosin Adarabioyo": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Reece James": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Malo Gusto": "🇫🇷 France", "Marc Cucurella": "🇪🇸 Spain", "Renato Veiga": "🇵🇹 Portugal",
    "Ben Chilwell": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Moisés Caicedo": "🇪🇨 Ecuador", "Enzo Fernández": "🇦🇷 Argentina",
    "Romeo Lavia": "🇧🇪 Belgium", "Kiernan Dewsbury-Hall": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Cole Palmer": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Christopher Nkunku": "🇫🇷 France", "João Félix": "🇵🇹 Portugal", "Pedro Neto": "🇵🇹 Portugal",
    "Noni Madueke": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Jadon Sancho": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "Mykhailo Mudryk": "🇺🇦 Ukraine",
    "Nicolas Jackson": "🇸🇳 Senegal", "Marc Guiu": "🇪🇸 Spain", "Carney Chukwuemeka": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Cesare Casadei": "🇮🇹 Italy",

    # REAL MADRID
    "Thibaut Courtois": "🇧🇪 Belgium", "Andriy Lunin": "🇺🇦 Ukraine", "Fran González": "🇪🇸 Spain",
    "Antonio Rüdiger": "🇩🇪 Germany", "Éder Militão": "🇧🇷 Brazil", "David Alaba": "🇦🇹 Austria",
    "Jesus Vallejo": "🇪🇸 Spain", "Dani Carvajal": "🇪🇸 Spain", "Lucas Vázquez": "🇪🇸 Spain",
    "Ferland Mendy": "🇫🇷 France", "Fran García": "🇪🇸 Spain", "Aurelien Tchouaméni": "🇫🇷 France",
    "Eduardo Camavinga": "🇫🇷 France", "Federico Valverde": "🇺🇾 Uruguay", "Jude Bellingham": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Luka Modrić": "🇭🇷 Croatia", "Dani Ceballos": "🇪🇸 Spain", "Arda Güler": "🇹🇷 Turkey",
    "Brahim Díaz": "🇲🇦 Morocco", "Vinícius Jr.": "🇧🇷 Brazil", "Rodrygo": "🇧🇷 Brazil",
    "Kylian Mbappé": "🇫🇷 France", "Endrick": "🇧🇷 Brazil",

    # BARCELONA
    "Marc-André ter Stegen": "🇩🇪 Germany", "Wojciech Szczęsny": "🇵🇱 Poland", "Iñaki Peña": "🇪🇸 Spain",
    "Ander Astralaga": "🇪🇸 Spain", "Ronald Araújo": "🇺🇾 Uruguay", "Jules Koundé": "🇫🇷 France",
    "Andreas Christensen": "🇩🇰 Denmark", "Inigo Martínez": "🇪🇸 Spain", "Pau Cubarsí": "🇪🇸 Spain",
    "Eric García": "🇪🇸 Spain", "Alejandro Balde": "🇪🇸 Spain", "Héctor Fort": "🇪🇸 Spain",
    "Gerard Martín": "🇪🇸 Spain", "Frenkie de Jong": "🇳🇱 Netherlands", "Pedri": "🇪🇸 Spain",
    "Gavi": "🇪🇸 Spain", "Dani Olmo": "🇪🇸 Spain", "Marc Casadó": "🇪🇸 Spain",
    "Marc Bernal": "🇪🇸 Spain", "Fermín López": "🇪🇸 Spain", "Pablo Torre": "🇪🇸 Spain",
    "Lamine Yamal": "🇪🇸 Spain", "Raphinha": "🇧🇷 Brazil", "Ferran Torres": "🇪🇸 Spain",
    "Ansu Fati": "🇪🇸 Spain", "Robert Lewandowski": "🇵🇱 Poland", "Pau Víctor": "🇪🇸 Spain",

    # BAYERN MUNICH
    "Manuel Neuer": "🇩🇪 Germany", "Sven Ulreich": "🇩🇪 Germany", "Daniel Peretz": "🇮🇱 Israel",
    "Dayot Upamecano": "🇫🇷 France", "Kim Min-jae": "🇰🇷 South Korea", "Eric Dier": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Hiroki Ito": "🇯🇵 Japan", "Tarek Buchmann": "🇩🇪 Germany", "Alphonso Davies": "🇨🇦 Canada",
    "Raphaël Guerreiro": "🇵🇹 Portugal", "Sacha Boey": "🇫🇷 France", "Josip Stanisic": "🇭🇷 Croatia",
    "Joshua Kimmich": "🇩🇪 Germany", "Joao Palhinha": "🇵🇹 Portugal", "Leon Goretzka": "🇩🇪 Germany",
    "Konrad Laimer": "🇦🇹 Austria", "Aleksandar Pavlovic": "🇩🇪 Germany", "Jamal Musiala": "🇩🇪 Germany",
    "Thomas Müller": "🇩🇪 Germany", "Michael Olise": "🇫🇷 France", "Leroy Sané": "🇩🇪 Germany",
    "Kingsley Coman": "🇫🇷 France", "Serge Gnabry": "🇩🇪 Germany", "Harry Kane": "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England",
    "Mathys Tel": "🇫🇷 France", "Arijon Ibrahimovic": "🇩🇪 Germany",

    # INTER MILAN
    "Yann Sommer": "🇨🇭 Switzerland", "Josep Martínez": "🇪🇸 Spain", "Raffaele Di Gennaro": "🇮🇹 Italy",
    "Alessandro Bastoni": "🇮🇹 Italy", "Benjamin Pavard": "🇫🇷 France", "Stefan de Vrij": "🇳🇱 Netherlands",
    "Francesco Acerbi": "🇮🇹 Italy", "Yann Bisseck": "🇩🇪 Germany", "Tomas Palacios": "🇦🇷 Argentina",
    "Denzel Dumfries": "🇳🇱 Netherlands", "Matteo Darmian": "🇮🇹 Italy", "Federico Dimarco": "🇮🇹 Italy",
    "Carlos Augusto": "🇧🇷 Brazil", "Hakan Çalhanoğlu": "🇹🇷 Turkey", "Kristjan Asllani": "🇦🇱 Albania",
    "Nicolò Barella": "🇮🇹 Italy", "Henrikh Mkhitaryan": "🇦🇲 Armenia", "Piotr Zieliński": "🇵🇱 Poland",
    "Davide Frattesi": "🇮🇹 Italy", "Tajon Buchanan": "🇨🇦 Canada", "Lautaro Martínez": "🇦🇷 Argentina",
    "Marcus Thuram": "🇫🇷 France", "Mehdi Taremi": "🇮🇷 Iran", "Joaquín Correa": "🇦🇷 Argentina",

    # PSG
    "Gianluigi Donnarumma": "🇮🇹 Italy", "Matvey Safonov": "🇷🇺 Russia", "Arnau Tenas": "🇪🇸 Spain",
    "Marquinhos": "🇧🇷 Brazil", "Willian Pacho": "🇪🇨 Ecuador", "Lucas Beraldo": "🇧🇷 Brazil",
    "Lucas Hernández": "🇫🇷 France", "Presnel Kimpembe": "🇫🇷 France", "Achraf Hakimi": "🇲🇦 Morocco",
    "Yoram Zague": "🇫🇷 France", "Nuno Mendes": "🇵🇹 Portugal", "Vitinha": "🇵🇹 Portugal",
    "João Neves": "🇵🇹 Portugal", "Warren Zaïre-Emery": "🇫🇷 France", "Fabian Ruiz": "🇪🇸 Spain",
    "Senny Mayulu": "🇫🇷 France", "Ousmane Dembélé": "🇫🇷 France", "Kang-in Lee": "🇰🇷 South Korea",
    "Desire Doué": "🇫🇷 France", "Bradley Barcola": "🇫🇷 France", "Marco Asensio": "🇪🇸 Spain",
    "Gonçalo Ramos": "🇵🇹 Portugal", "Randal Kolo Muani": "🇫🇷 France", "Ibrahim Mbaye": "🇫🇷 France"
}

# Country flag lookup fallback map for any player names not individually listed above
COUNTRY_FLAGS_LOOKUP = {
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

data_js_path = '/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/data.js'
with open(data_js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

count = 0
def replace_nat(m):
    global count
    name = m.group(1)
    old_nat = m.group(2)
    if name in PLAYER_NATIONS:
        count += 1
        return m.group(0).replace(old_nat, f"nat: '{PLAYER_NATIONS[name]}'")
    return m.group(0)

# Replace in js_content
new_content = re.sub(r'{\s*name:\s*["\']([^"\']+)["\'][^}]+?(nat:\s*["\'][^"\']+["\'])', replace_nat, js_content)

with open(data_js_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Updated {count} player nationalities in js/data.js!")
