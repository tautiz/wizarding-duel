# Wizarding Duel - Projekto Architektūra ir Planas

## 📋 Projekto Apžvalga

**Wizarding Duel** - rankų gestais valdomas žaidimas, kuriame žaidėjai atlieka burtus sekdami švytinčius kelius ekrane. Projektas turi du režimus: **Solo** (vienas žaidėjas) ir **Team** (komandinis režimas iki 5 žaidėjų).

---

## 🎯 Naujų Funkcijų Specifikacija

### Komandinis Režimas (Team Mode)

#### Pagrindinės Charakteristikos:
- **Žaidėjų skaičius**: 1-5 žaidėjai komandoje
- **Laiko limitas**: Iki 10 minučių vienai komandai
- **Laiko paskirstymas**: Automatinis pagal žaidėjų skaičių (10 min / žaidėjų skaičius)
- **Vardų įvedimas**: 
  1. Pirmenybė - Web Speech API (lietuviški vardai)
  2. Fallback - Google Gemini AI (kai Speech API nepalaiko/nepasiekiama)
  3. Fallback - Rankinis įvedimas (kai nėra interneto)
- **Test/Practice režimas**: Kiekvienas žaidėjas turi individualią pasibandymo galimybę
- **Rezultatai**: Rodoma individuali ir bendroji komandos suvestinė
- **Duomenų saugojimas**: LocalStorage (individualūs ir komandos rezultatai)

---

## 🏗️ Architektūra (SOLID Principai)

### 1. Models (`/models`)

#### `TeamGameState.ts`
```typescript
export interface TeamGameState {
  mode: 'solo' | 'team';
  teamId: string;
  totalTimeLimit: number; // sekundėmis (max 600)
  playerCount: number;
  timePerPlayer: number;
  currentPlayerIndex: number;
  teamScore: number;
  startedAt?: Date;
}

export interface TeamSession {
  id: string;
  teamName?: string;
  players: TeamPlayer[];
  totalScore: number;
  difficulty: string;
  completedAt?: Date;
  createdAt: Date;
}
```

#### `TeamPlayer.ts`
```typescript
export interface TeamPlayer extends Player {
  hasCompletedPractice: boolean; // ar užbaigė test režimą
  practiceStartedAt?: Date;
  gameStartedAt?: Date;
  gameEndedAt?: Date;
  timeUsed: number; // sekundėmis
  levelsCompleted: number;
}
```

---

### 2. Services (`/services`)

#### `teamGameService.ts`
**Atsakomybė**: Komandinio žaidimo logikos valdymas

```typescript
class TeamGameService {
  // Komandos sukūrimas
  createTeamSession(playerCount: number, totalTime: number): TeamSession
  
  // Laiko paskirstymas
  calculateTimePerPlayer(totalTime: number, playerCount: number): number
  
  // Žaidėjo progreso valdymas
  startPlayerPractice(sessionId: string, playerId: number): void
  completePlayerPractice(sessionId: string, playerId: number): void
  startPlayerGame(sessionId: string, playerId: number): void
  endPlayerGame(sessionId: string, playerId: number, score: number): void
  
  // Sekančio žaidėjo nustatymas
  getNextPlayer(session: TeamSession): TeamPlayer | null
  
  // Komandos būsenos tikrinimas
  isSessionComplete(session: TeamSession): boolean
  calculateTeamScore(session: TeamSession): number
}
```

#### `storageService.ts`
**Atsakomybė**: Duomenų saugojimas LocalStorage

```typescript
class StorageService {
  private static readonly TEAM_SESSIONS_KEY = 'wd_team_sessions';
  private static readonly SOLO_RESULTS_KEY = 'wd_solo_results';
  
  // Komandos sesijų valdymas
  saveTeamSession(session: TeamSession): void
  getTeamSession(sessionId: string): TeamSession | null
  getAllTeamSessions(): TeamSession[]
  updateTeamSession(sessionId: string, updates: Partial<TeamSession>): void
  
  // Solo rezultatų valdymas
  saveSoloResult(result: SoloResult): void
  getAllSoloResults(): SoloResult[]
  
  // Top rezultatai
  getTopTeamScores(limit: number): TeamSession[]
  getTopSoloScores(limit: number): SoloResult[]
  
  // Valymas
  clearAllData(): void
  clearTeamSessions(): void
}
```

#### `speechRecognitionService.ts`
**Atsakomybė**: Balso atpažinimas su multi-fallback sistema

```typescript
interface VoiceRecognitionResult {
  success: boolean;
  name?: string;
  method: 'speech' | 'ai' | 'manual' | 'error';
  error?: string;
}

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private geminiClient: GoogleGenAI | null = null;
  
  // Inicializacija
  initialize(apiKey?: string): void
  
  // Web Speech API metodas
  recognizeNameWithSpeech(language: 'lt-LT' | 'en-US'): Promise<VoiceRecognitionResult>
  
  // AI fallback metodas (Gemini)
  recognizeNameWithAI(audioBlob: Blob): Promise<VoiceRecognitionResult>
  
  // Galimybių tikrinimas
  isSpeechRecognitionAvailable(): boolean
  isOnline(): boolean
  
  // Cleanup
  destroy(): void
}
```

---

### 3. Components (`/components`)

#### `ModeSelect.tsx`
**Funkcija**: Režimo pasirinkimo ekranas
- Solo režimas (esamas funkcionalumas)
- Team režimas (naujas funkcionalumas)
- Dizainas: 2 dideli kortelių tipo mygtukai

#### `TeamSetup.tsx`
**Funkcija**: Komandos konfigūravimas
- Žaidėjų skaičiaus pasirinkimas (1-5)
- Laiko limito nustatymas (slider: 1-10 min)
- Vardų įvedimas su balso atpažinimu
- Sunkumo lygio pasirinkimas
- Rodomas laiko paskirstymas per žaidėją

#### `VoiceInput.tsx`
**Funkcija**: Universalus balso įvesties komponentas
- Mikrofono aktyvavimo mygtukas
- Gyvos balso atpažinimo indikacija
- Fallback į rankinę įvestį
- Error handling su aiškiais pranešimais

#### `TeamPracticeMode.tsx`
**Funkcija**: Individualus pasibandymo režimas
- Žaidėjo vardo rodymas
- "Tai pasibandymas - taškai neskaičiuojami" pranešimas
- Vieno burto praktika (lengvas burtas)
- Patvirtinimo mygtukas "Pasirengęs"
- Skip galimybė

#### `TeamResults.tsx`
**Funkcija**: Komandos rezultatų rodymas
- Individualūs rezultatai (kiekvieno žaidėjo):
  - Vardas
  - Taškai
  - Lygių skaičius
  - Panaudotas laikas
- Bendra komandos statistika:
  - Bendras komandos rezultatas
  - Vidutinis rezultatas
  - Geriausias žaidėjas
- Mygtukų blokas:
  - "Žaisti dar kartą"
  - "Grįžti į meniu"
- Automatinis išsaugojimas į LocalStorage

---

## 🎮 Žaidimo Srautas (Game Flow)

```
┌─────────────────┐
│   LANDING       │
│   (sveikinimai) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MODE_SELECT    │ ◄─── NAUJAS EKRANAS
│  Solo / Team    │
└────┬───────┬────┘
     │       │
Solo │       │ Team
     │       │
     ▼       ▼
┌─────────┐ ┌──────────────────┐
│  SETUP  │ │   TEAM_SETUP     │ ◄─── NAUJAS
│ (solo)  │ │  (konfigūracija) │
└────┬────┘ └────────┬─────────┘
     │               │
     │               ▼
     │      ┌────────────────────┐
     │      │ TEAM_PRACTICE      │ ◄─── NAUJAS
     │      │ (individualus test)│
     │      │ [kiekvienam žaidėjui]
     │      └────────┬───────────┘
     │               │
     │               │ (kartojama visiems)
     │               ▼
     │      ┌────────────────────┐
     │      │  TEAM_PLAYING      │ ◄─── NAUJAS
     │      │  (realus žaidimas) │
     │      │  [eilės tvarka]    │
     │      └────────┬───────────┘
     │               │
     ▼               ▼
┌─────────┐ ┌──────────────────┐
│ PLAYING │ │  TEAM_RESULTS    │ ◄─── NAUJAS
│ (solo)  │ │  (suvestinė)     │
└────┬────┘ └────────┬─────────┘
     │               │
     ▼               │
┌─────────┐         │
│ RESULTS │         │
│ (solo)  │         │
└────┬────┘         │
     │              │
     └──────┬───────┘
            │
            ▼
     [Grįžti į MODE_SELECT]
```

---

## 📊 State Management

### Nauja GameState Enum Reikšmės

```typescript
export enum GameState {
  LANDING = 'LANDING',
  MODE_SELECT = 'MODE_SELECT',        // NAUJAS
  SETUP = 'SETUP',                     // Solo setup
  TEAM_SETUP = 'TEAM_SETUP',          // NAUJAS
  TEAM_PRACTICE = 'TEAM_PRACTICE',    // NAUJAS
  PLAYING = 'PLAYING',                 // Solo žaidimas
  TEAM_PLAYING = 'TEAM_PLAYING',      // NAUJAS
  RESULTS = 'RESULTS',                 // Solo rezultatai
  TEAM_RESULTS = 'TEAM_RESULTS'       // NAUJAS
}
```

### App.tsx Būsenos Papildymai

```typescript
// Nauji state:
const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
const [teamSession, setTeamSession] = useState<TeamSession | null>(null);
const [currentTeamPlayer, setCurrentTeamPlayer] = useState<TeamPlayer | null>(null);
const [teamTimeLeft, setTeamTimeLeft] = useState(0);
const [isPracticeMode, setIsPracticeMode] = useState(false);
```

---

## 🔧 Implementacijos Detalės

### 1. Balso Atpažinimo Logika

```typescript
// VoiceInput komponente
const handleVoiceCapture = async () => {
  // 1. Bandyti Web Speech API
  if (speechService.isSpeechRecognitionAvailable()) {
    const result = await speechService.recognizeNameWithSpeech('lt-LT');
    if (result.success) return result.name;
  }
  
  // 2. Fallback į AI (Gemini)
  if (speechService.isOnline() && hasGeminiAPI) {
    const result = await speechService.recognizeNameWithAI(audioBlob);
    if (result.success) return result.name;
  }
  
  // 3. Fallback į rankinę įvestį
  setShowManualInput(true);
};
```

### 2. Laiko Valdymas

```typescript
// teamGameService.ts
calculateTimePerPlayer(totalTime: number, playerCount: number): number {
  return Math.floor(totalTime / playerCount);
}

// App.tsx - Team žaidimo timeris
useEffect(() => {
  if (gameState === GameState.TEAM_PLAYING && !paused) {
    const interval = setInterval(() => {
      setTeamTimeLeft(t => {
        if (t <= 1) {
          endCurrentPlayerTurn();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }
}, [gameState, paused]);
```

### 3. Practice Režimo Implementacija

```typescript
// App.tsx
const startPracticeForPlayer = (player: TeamPlayer) => {
  setCurrentTeamPlayer(player);
  setIsPracticeMode(true);
  setGameState(GameState.TEAM_PRACTICE);
  
  // Practice: vienas paprastas burtas, netinka laikas
  const practiceSpell = SPELLS.find(s => s.difficulty === 1) || SPELLS[0];
  setSpellQueue([practiceSpell]);
  setActiveQueueIndex(0);
  setPathProgress(0);
  setStatusMessage(`${player.name}, tai tik pasibandymas!`);
};

const completePractice = () => {
  if (teamSession && currentTeamPlayer) {
    teamGameService.completePlayerPractice(teamSession.id, currentTeamPlayer.id);
    setIsPracticeMode(false);
    startRealGameForPlayer(currentTeamPlayer);
  }
};
```

### 4. LocalStorage Struktura

```typescript
// Storage formatas
{
  "wd_team_sessions": [
    {
      "id": "team_1234567890",
      "teamName": "Grifindoras",
      "players": [
        {
          "id": 1,
          "name": "Tomas",
          "score": 450,
          "hasCompletedPractice": true,
          "timeUsed": 118,
          "levelsCompleted": 8
        },
        // ... kiti žaidėjai
      ],
      "totalScore": 2150,
      "difficulty": "medium",
      "completedAt": "2026-01-20T19:30:00Z",
      "createdAt": "2026-01-20T19:00:00Z"
    }
  ],
  "wd_solo_results": [...]
}
```

---

## 🎨 UI/UX Dizaino Gairės

### Spalvų Paletė (Išlaikoma esama)
- **Pergamentas**: `#f4e4bc`
- **Tamsus rudas**: `#2c1e14`
- **Šviesus rudas**: `#4a3728`
- **Auksinis**: `#d4af37`
- **Fonas**: `#05050a`

### Nauji Komponentų Stiliai

#### ModeSelect
- 2 stambios kortelės šalia viena kitos
- Hover efektas su scale-105
- Ikona + Pavadinimas + Trumpas aprašymas

#### TeamSetup
- Grid layoutas: Žaidėjai | Laikas | Sunkumas
- Kiekvienas žaidėjas turi:
  - Numerį
  - Balso įvesties mygtuką
  - Rankinio įvedimo lauką
  - Būsenos indikatorių (✓/○)

#### TeamPracticeMode
- Centruotas pranešimas:
  ```
  🎯 [Vardas], tai tik pasibandymas!
  
  Taškai neskaičiuojami.
  Pamėgink atlikti šį burtą:
  
  [Burto vizualizacija]
  
  [Skip] [Pasirengęs]
  ```

#### TeamResults
- Lentelės formatais individualūs rezultatai
- Didelis bendras komandos rezultatas viršuje
- Geriausias žaidėjas su 🏆 ikona
- Animuotas rezultatų pasirodymas (fade-in)

---

## 📝 Implementacijos Žingsniai

### Žingsnis 1: Modeliai ir Tipai
- [ ] Sukurti `models/TeamGameState.ts`
- [ ] Sukurti `models/TeamPlayer.ts`
- [ ] Atnaujinti `types.ts` su naujais GameState

### Žingsnis 2: Servisai
- [ ] Sukurti `services/teamGameService.ts`
- [ ] Sukurti `services/storageService.ts`
- [ ] Sukurti `services/speechRecognitionService.ts`

### Žingsnis 3: Komponentai
- [ ] Sukurti `components/ModeSelect.tsx`
- [ ] Sukurti `components/TeamSetup.tsx`
- [ ] Sukurti `components/VoiceInput.tsx`
- [ ] Sukurti `components/TeamPracticeMode.tsx`
- [ ] Sukurti `components/TeamResults.tsx`

### Žingsnis 4: App.tsx Integracija
- [ ] Pridėti naujus state kintamuosius
- [ ] Implementuoti MODE_SELECT routing
- [ ] Implementuoti Team flow logiką
- [ ] Pridėti practice režimo logiką
- [ ] Integruoti storage service

### Žingsnis 5: Testavimas
- [ ] Testuoti balso atpažinimą (LT vardai)
- [ ] Testuoti fallback mechanizmus
- [ ] Testuoti laiko valdymą
- [ ] Testuoti practice → real game srautą
- [ ] Testuoti storage išsaugojimą/skaityimą
- [ ] Testuoti visą team flow nuo pradžios iki pabaigos

---

## 🔐 Saugumo ir Duomenų Valdymas

### LocalStorage Limitai
- Maksimalus dydis: ~5-10MB
- Saugome tik paskutinius 50 team sessions
- Saugome tik paskutinius 100 solo results
- Auto-cleanup senesni nei 90 dienų

### Privacy
- Visi duomenys saugomi tik vartotojo naršyklėje
- Nėra išorinių duomenų perdavimų (išskyrus AI API)
- Gemini API naudojama tik balso atpažinimui

---

## 🚀 Būsimos Plėtros Galimybės

1. **Online Multiplayer**: Realaus laiko dvikova tarp komandų
2. **Achievements System**: Pasiekimų sistema
3. **Leaderboard**: Globalus rezultatų lentelė
4. **Custom Spells**: Žaidėjai gali kurti savo burtus
5. **Tournaments**: Turnyriniai formatai
6. **Voice Commands**: Burtų valdymas balsu
7. **AR Mode**: Papildytos realybės režimas su telefono kamera

---

## 📚 Naudojamos Technologijos

- **React 18+**: UI framework
- **TypeScript**: Type safety
- **MediaPipe Hands**: Rankų sekimas
- **Web Speech API**: Balso atpažinimas
- **Google Gemini AI**: AI fallback balso atpažinimui
- **LocalStorage**: Duomenų saugojimas
- **TailwindCSS**: Stilizavimas
- **Vite**: Build tool

---

## 👨‍💻 Kodavimo Standartai

### SOLID Principai
- **S** - Single Responsibility: Kiekvienas servisas turi vieną aiškią atsakomybę
- **O** - Open/Closed: Servisai atviri plėtrai (extension), uždaryti modifikacijai
- **L** - Liskov Substitution: TeamPlayer extends Player
- **I** - Interface Segregation: Smulkios sąsajos (VoiceRecognitionResult, etc.)
- **D** - Dependency Inversion: Servisai nepriklauso nuo konkrečių implementacijų

### Kodavimo Stilius
- Funkcijos: camelCase
- Komponentai: PascalCase
- Konstantos: UPPER_SNAKE_CASE
- Interfaces: PascalCase su `I` prefiksu (optional)
- Failų vardai: kebab-case.ts arba PascalCase.tsx (komponentams)

### Komentavimas
- JSDoc komentarai viešiems metodams
- Inline komentarai tik sudėtingai logikai
- TypeScript types kaip dokumentacija

---

## 🐛 Žinomi Apribojimai ir Sprendimai

### Web Speech API
- **Problema**: Nepalaikoma Safari (iOS)
- **Sprendimas**: Fallback į AI arba rankinę įvestį

### Lietuviški Vardai
- **Problema**: Speech API gali netiksliai atpažinti lietuviškus vardus
- **Sprendimas**: Vartotojas gali koreguoti atpažintą vardą prieš patvirtinimą

### Offline Režimas
- **Problema**: Be interneto neveikia AI fallback
- **Sprendimas**: Automatinis fallback į rankinę įvestį su aiškiu pranešimu

### LocalStorage
- **Problema**: Ribotas dydis (~5MB)
- **Sprendimas**: Auto-cleanup senų įrašų, limituojamas įrašų skaičius

---

**Dokumentas atnaujintas**: 2026-01-20
**Versija**: 1.0.0
**Autorius**: AI Agent (Cascade)
