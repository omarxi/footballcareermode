# 🎮 FC 27 Manager Career Mode (Web Edition)

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)

A feature-rich, high-performance web-based **Football Manager Career Mode** simulation. Experience European football management with authentic clubs, player rosters, tactical engines, multi-competition progression, youth academies, transfer windows, and a dedicated Trophy Cabinet.

---

## 🌟 Key Features

### ⚽ 1. Authentic Leagues & Rosters
- **5 Major European Leagues**: La Liga, Premier League, Serie A, Bundesliga, Ligue 1.
- **95+ Official Clubs**: Real Madrid, FC Barcelona, Manchester City, Arsenal, Bayern München, Inter Milan, PSG, and more.
- **2,100+ Authentic Players**: Real ratings, positions, market values, wages, and country flag nationalities.

### 🏆 2. UEFA Champions League (UCL) & UEFA Europa League (UEL)
- **UEFA Champions League (13 Clubs)**:
  - 8-matchday League Phase.
  - **Knockout Bracket**: 1st & 2nd place receive Byes to the Semi-Finals; 3rd & 4th receive Byes to the Quarter-Finals; 5th–8th compete in the Playoff Round.
- **UEFA Europa League (10 Clubs)**:
  - 6-matchday League Phase.
  - **Knockout Bracket**: 1st & 2nd receive Byes to the Semi-Finals; 3rd, 4th & 5th receive Byes to the Quarter-Finals; 6th & 7th compete in the Playoff Round.

### 🥇 3. Domestic Cup Competitions
- Authentic 16-team knockout tournaments:
  - 🏴󠁧󠁢󠁥󠁮󠁧󠁿 **FA Cup** (Premier League)
  - 🇪🇸 **Copa del Rey** (La Liga)
  - 🇮🇹 **Coppa Italia** (Serie A)
  - 🇩🇪 **DFB-Pokal** (Bundesliga)
  - 🇫🇷 **Coupe de France** (Ligue 1)

### 👟 4. Golden Boot & Realistic League Simulation
- **Full Round-Robin League Fixtures**: All CPU vs CPU matches simulate matchday-by-matchday alongside your club.
- **Realistic Goal Attribution**: Top strikers (Haaland, Mbappé, Kane, Lewandowski, Salah, Saka, Vinícius Jr., etc.) score goals and record appearances across CPU matches, making the **Golden Boot Race** dynamic and competitive.

### 🏆 5. Interactive Trophy Cabinet
- Celebrates every silverware won under your managerial reign:
  - **League Titles**
  - **UEFA Champions League Trophies**
  - **UEFA Europa League Trophies**
  - **Domestic Cup Trophies**
- Displays trophy counts, season years, 3D metallic icons, and glowing victory halos.
- Pre-populates historical honours for world-class clubs upon starting your career.

### 👔 6. Manager Customization & Board Expectations
- **Custom Manager Name**: Personalize your manager persona at career launch.
- **Manager Office**: Monitor board rating, budget management, wage allocation, press coverage, and breaking news.

### 📋 7. Squad Hub, Tactics & Live Pitch Engine
- **Tactical Formations**: Toggle between 4-3-3, 4-2-3-1, 3-5-2, 5-3-2, etc.
- **Interactive Pitch**: Visual squad lineup with Drag & Drop replacement and position badges.
- **Match Engine**: Choose between Quick Sim or 2D Match Simulation with commentary and live stats.

### 🌱 8. Youth Academy
- **U19 Youth League**: 6-team youth tournament running concurrently with your senior team.
- **Prospect Scouting**: Generate prospective talent, process growth cycles, and promote academy prospects directly to your senior squad roster.

---

## 🚀 Quick Start Guide

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge, Safari).
- Python 3 installed (or any local web server).

### Installation & Local Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fifa-career-mode.git
   cd fifa-career-mode
   ```

2. **Start a local HTTP server**:
   ```bash
   python3 -m http.server 8080
   ```

3. **Open in your browser**:
   Navigate to `http://localhost:8080` to launch the game!

---

## 📁 Project Architecture

```
fifa-career-mode/
├── index.html               # Main UI Layout & Tab Views
├── styles.css               # Global Glassmorphism & Modern UI Styling
├── js/
│   ├── app.js               # Application Orchestrator & UI Renderers
│   ├── state.js             # Core Career State Engine & Competition Logic
│   ├── data.js              # 95 Clubs & 2,100+ Player Roster Database
│   └── components/
│       ├── matchEngine.js   # Poisson Simulation & Match Engine
│       ├── pitch.js         # Interactive Tactical Pitch Renderer
│       ├── transfers.js     # Transfer Window & Contract Negotiations
│       ├── youth.js         # U19 Youth Academy & Development System
│       └── office.js        # Manager Office & Board Objectives
└── LICENSE                  # MIT License
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to fork, modify, and build upon it!
