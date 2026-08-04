import re

# Comprehensive mapping of player names to their correct country flag
PLAYER_FLAG_MAP = {
    # Arsenal
    "David Raya": "🇪🇸", "Neto": "🇧🇷", "Tommy Setford": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "William Saliba": "🇫🇷", "Gabriel Magalhães": "🇧🇷",
    "Riccardo Calafiori": "🇮🇹", "Jurriën Timber": "🇳🇱", "Ben White": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Oleksandr Zinchenko": "🇺🇦",
    "Takehiro Tomiyasu": "🇯🇵", "Kieran Tierney": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Jakub Kiwior": "🇵🇱", "Declan Rice": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Thomas Partey": "🇬🇭", "Jorginho": "🇮🇹", "Martin Ødegaard": "🇳🇴", "Mikel Merino": "🇪🇸",
    "Ethan Nwaneri": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Myles Lewis-Skelly": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Bukayo Saka": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Gabriel Martinelli": "🇧🇷",
    "Leandro Trossard": "🇧🇪", "Kai Havertz": "🇩🇪", "Gabriel Jesus": "🇧🇷", "Raheem Sterling": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",

    # Real Madrid
    "Thibaut Courtois": "🇧🇪", "Andriy Lunin": "🇺🇦", "Fran González": "🇪🇸", "Antonio Rüdiger": "🇩🇪",
    "Éder Militão": "🇧🇷", "David Alaba": "🇦🇹", "Jesus Vallejo": "🇪🇸", "Dani Carvajal": "🇪🇸",
    "Lucas Vázquez": "🇪🇸", "Ferland Mendy": "🇫🇷", "Fran García": "🇪🇸", "Aurelien Tchouaméni": "🇫🇷",
    "Eduardo Camavinga": "🇫🇷", "Federico Valverde": "🇺🇾", "Jude Bellingham": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Luka Modrić": "🇭🇷",
    "Dani Ceballos": "🇪🇸", "Arda Güler": "🇹🇷", "Brahim Díaz": "🇲🇦", "Vinícius Jr.": "🇧🇷",
    "Rodrygo": "🇧🇷", "Kylian Mbappé": "🇫🇷", "Endrick": "🇧🇷",

    # FC Barcelona
    "Marc-André ter Stegen": "🇩🇪", "Wojciech Szczęsny": "🇵🇱", "Iñaki Peña": "🇪🇸", "Ander Astralaga": "🇪🇸",
    "Ronald Araújo": "🇺🇾", "Jules Koundé": "🇫🇷", "Andreas Christensen": "🇩🇰", "Inigo Martínez": "🇪🇸",
    "Pau Cubarsí": "🇪🇸", "Eric García": "🇪🇸", "Alejandro Balde": "🇪🇸", "Héctor Fort": "🇪🇸",
    "Gerard Martín": "🇪🇸", "Frenkie de Jong": "🇳🇱", "Pedri": "🇪🇸", "Gavi": "🇪🇸", "Dani Olmo": "🇪🇸",
    "Marc Casadó": "🇪🇸", "Marc Bernal": "🇪🇸", "Fermín López": "🇪🇸", "Pablo Torre": "🇪🇸",
    "Lamine Yamal": "🇪🇸", "Raphinha": "🇧🇷", "Ferran Torres": "🇪🇸", "Ansu Fati": "🇪🇸",
    "Robert Lewandowski": "🇵🇱", "Pau Víctor": "🇪🇸",

    # Man City
    "Ederson": "🇧🇷", "Stefan Ortega": "🇩🇪", "Scott Carson": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ruben Dias": "🇵🇹",
    "John Stones": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Manuel Akanji": "🇨🇭", "Nathan Aké": "🇳🇱", "Josko Gvardiol": "🇭🇷",
    "Kyle Walker": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Rico Lewis": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Rodri": "🇪🇸", "Mateo Kovacic": "🇭🇷",
    "Ilkay Gündogan": "🇩🇪", "Kevin De Bruyne": "🇧🇪", "Bernardo Silva": "🇵🇹", "Phil Foden": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Matheus Nunes": "🇵🇹", "James McAtee": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Jeremy Doku": "🇧🇪", "Savinho": "🇧🇷",
    "Jack Grealish": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Oscar Bobb": "🇳🇴", "Erling Haaland": "🇳🇴",

    # Liverpool
    "Alisson": "🇧🇷", "Caoimhin Kelleher": "🇮🇪", "Vitezslav Jaros": "🇨🇿", "Virgil van Dijk": "🇳🇱",
    "Ibrahima Konate": "🇫🇷", "Jarell Quansah": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Joe Gomez": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Trent Alexander-Arnold": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Conor Bradley": "🇬🇧", "Andrew Robertson": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Kostas Tsimikas": "🇬🇷", "Alexis Mac Allister": "🇦🇷",
    "Dominik Szoboszlai": "🇭🇺", "Ryan Gravenberch": "🇳🇱", "Curtis Jones": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Harvey Elliott": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Wataru Endo": "🇯🇵", "Tyler Morton": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Mohamed Salah": "🇪🇬", "Federico Chiesa": "🇮🇹",
    "Luis Díaz": "🇨🇴", "Cody Gakpo": "🇳🇱", "Diogo Jota": "🇵🇹", "Darwin Núñez": "🇺🇾",

    # Bayern Munich
    "Manuel Neuer": "🇩🇪", "Sven Ulreich": "🇩🇪", "Daniel Peretz": "🇮🇱", "Dayot Upamecano": "🇫🇷",
    "Kim Min-jae": "🇰🇷", "Eric Dier": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Hiroki Ito": "🇯🇵", "Tarek Buchmann": "🇩🇪",
    "Alphonso Davies": "🇨🇦", "Raphaël Guerreiro": "🇵🇹", "Sacha Boey": "🇫🇷", "Josip Stanisic": "🇭🇷",
    "Joshua Kimmich": "🇩🇪", "Joao Palhinha": "🇵🇹", "Leon Goretzka": "🇩🇪", "Konrad Laimer": "🇦🇹",
    "Aleksandar Pavlovic": "🇩🇪", "Jamal Musiala": "🇩🇪", "Thomas Müller": "🇩🇪", "Michael Olise": "🇫🇷",
    "Leroy Sané": "🇩🇪", "Kingsley Coman": "🇫🇷", "Serge Gnabry": "🇩🇪", "Harry Kane": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Mathys Tel": "🇫🇷", "Arijon Ibrahimovic": "🇩🇪",

    # PSG
    "Gianluigi Donnarumma": "🇮🇹", "Matvey Safonov": "🇷🇺", "Arnau Tenas": "🇪🇸", "Marquinhos": "🇧🇷",
    "Willian Pacho": "🇪🇨", "Lucas Beraldo": "🇧🇷", "Lucas Hernández": "🇫🇷", "Presnel Kimpembe": "🇫🇷",
    "Achraf Hakimi": "🇲🇦", "Yoram Zague": "🇫🇷", "Nuno Mendes": "🇵🇹", "Vitinha": "🇵🇹",
    "João Neves": "🇵🇹", "Warren Zaïre-Emery": "🇫🇷", "Fabian Ruiz": "🇪🇸", "Senny Mayulu": "🇫🇷",
    "Ousmane Dembélé": "🇫🇷", "Kang-in Lee": "🇰🇷", "Desire Doué": "🇫🇷", "Bradley Barcola": "🇫🇷",
    "Marco Asensio": "🇪🇸", "Gonçalo Ramos": "🇵🇹", "Randal Kolo Muani": "🇫🇷", "Ibrahim Mbaye": "🇫🇷",

    # Inter Milan
    "Yann Sommer": "🇨🇭", "Josep Martínez": "🇪🇸", "Raffaele Di Gennaro": "🇮🇹", "Alessandro Bastoni": "🇮🇹",
    "Benjamin Pavard": "🇫🇷", "Stefan de Vrij": "🇳🇱", "Francesco Acerbi": "🇮🇹", "Yann Bisseck": "🇩🇪",
    "Tomas Palacios": "🇦🇷", "Denzel Dumfries": "🇳🇱", "Matteo Darmian": "🇮🇹", "Federico Dimarco": "🇮🇹",
    "Carlos Augusto": "🇧🇷", "Hakan Çalhanoğlu": "🇹🇷", "Kristjan Asllani": "🇦🇱", "Nicolò Barella": "🇮🇹",
    "Henrikh Mkhitaryan": "🇦🇲", "Piotr Zieliński": "🇵🇱", "Davide Frattesi": "🇮🇹", "Tajon Buchanan": "🇨🇦",
    "Lautaro Martínez": "🇦🇷", "Marcus Thuram": "🇫🇷", "Mehdi Taremi": "🇮🇷", "Joaquín Correa": "🇦🇷"
}

# Country string to flag fallback dictionary for any players
COUNTRY_FLAGS = {
    "Spain": "🇪🇸", "France": "🇫🇷", "Brazil": "🇧🇷", "Argentina": "🇦🇷", "Germany": "🇩🇪",
    "Italy": "🇮🇹", "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Netherlands": "🇳🇱", "Portugal": "🇵🇹", "Croatia": "🇭🇷",
    "Japan": "🇯🇵", "Belgium": "🇧🇪", "Uruguay": "🇺🇾", "Norway": "🇳🇴", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "Ukraine": "🇺🇦", "Poland": "🇵🇱", "Ghana": "🇬🇭", "Colombia": "🇨🇴", "Senegal": "🇸🇳",
    "Cameroon": "🇨🇲", "Ivory Coast": "🇨🇮", "Denmark": "🇩🇰", "Sweden": "🇸🇪", "United States": "🇺🇸",
    "Turkey": "🇹🇷", "Morocco": "🇲🇦", "Nigeria": "🇳🇬", "Ecuador": "🇪🇨", "Algeria": "🇩🇿",
    "Austria": "🇦🇹", "Switzerland": "🇨🇭", "South Korea": "🇰🇷", "Canada": "🇨🇦", "Mexico": "🇲🇽",
    "Paraguay": "🇵🇾", "Czech Republic": "🇨🇿", "Slovakia": "🇸🇰", "Hungary": "🇭🇺", "Romania": "🇷🇴",
    "Serbia": "🇷🇸", "Greece": "🇬🇷", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Republic of Ireland": "🇮🇪", "Northern Ireland": "🇬🇧",
    "Jamaica": "🇯🇲", "Australia": "🇦🇺", "Egypt": "🇪🇬", "Mali": "🇲🇱", "Georgia": "🇬🇪",
    "Venezuela": "🇻🇪", "Albania": "🇦🇱", "Finland": "🇫🇮", "Slovenia": "🇸🇮", "Bosnia and Herzegovina": "🇧🇦",
    "DR Congo": "🇨🇩", "Burkina Faso": "🇧🇫", "Gambia": "🇬🇲", "Kosovo": "🇽🇰", "Montenegro": "🇲🇪",
    "Iraq": "🇮🇶", "Zambia": "🇿🇲", "Chile": "🇨🇱", "New Zealand": "🇳🇿", "Togo": "🇹🇬",
    "Mozambique": "🇲🇿", "Cape Verde": "🇨🇻", "Suriname": "🇸🇷", "North Macedonia": "🇲🇰", "Peru": "🇵🇪",
    "Equatorial Guinea": "🇬🇶", "Estonia": "🇪🇪", "Armenia": "🇦🇲", "Israel": "🇮🇱", "Tunisia": "🇹🇳",
    "Benin": "🇧🇯", "Luxembourg": "🇱🇺", "Iran": "🇮🇷", "Central African Republic": "🇨🇫", "Uzbekistan": "🇺🇿",
    "Saudi Arabia": "🇸🇦", "Indonesia": "🇮🇩", "French Guiana": "🇬🇫", "Republic of the Congo": "🇨🇬",
    "Congo": "🇨🇬", "Haiti": "🇭🇹", "Madagascar": "🇲🇬", "Zimbabwe": "🇿🇼", "Angola": "🇦🇴",
    "Guinea-Bissau": "🇬🇼", "Guinea": "🇬🇳", "Panama": "🇵🇦", "Burundi": "🇧🇮", "Guadeloupe": "🇬🇵", "Costa Rica": "🇨🇷"
}

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace nat: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' with actual flags based on player name match or fallback lookup
def replace_nat(match):
    full = match.group(0)
    name_m = re.search(r'name:\s*["\']([^"\']+)["\']', full)
    if name_m:
        name = name_m.group(1)
        if name in PLAYER_FLAG_MAP:
            flag = PLAYER_FLAG_MAP[name]
            return re.sub(r"nat:\s*['\"][^'\"]+['\"]", f"nat: '{flag}'", full)
    return full

updated_content = re.sub(r'\{\s*name:\s*["\'][^"\']+["\'].*?nat:\s*[\'"][^\'"]+[\'"].*?\}', replace_nat, content)

with open('/home/omar/.gemini/antigravity/scratch/fifa-career-mode/js/data.js', 'w', encoding='utf-8') as f:
    f.write(updated_content)

print("Updated js/data.js player flags successfully!")
