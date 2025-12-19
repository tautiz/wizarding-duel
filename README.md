
# 🪄 Wizarding Duel: Gesture Master

Tai interaktyvus Harry Potter tematikos žaidimas, kuriame burtus leidžiate naudodami savo rankų judesius prieš kamerą.

## 🚀 Kaip paleisti lokaliai?

Tai yra **Vite + React (TypeScript)** projektas. Dėl to paprastas `npx serve .` (be build) nėra patikimas būdas, nes naršyklė nemoka vykdyti `.tsx` failų ir negauna Vite transformacijų.

### 1 būdas: VS Code (rekomenduojama)
1. Įdiekite priklausomybes:
```bash
npm install
```
2. Paleiskite Vite dev serverį:
```bash
npm run dev
```
3. Atidarykite `http://localhost:3000`.

### 2 būdas: Node.js (npx)
Jei norite patiekti **statinį** build (pvz., demonstracijai), pirma sugeneruokite build:
```bash
npm run build
```
Tada patiekite `dist` katalogą:
```bash
npx serve dist
```

### 3 būdas: Python
Jei norite patiekti **statinį** build su Python:
```bash
python -m http.server 8000 -d dist
```

## 🎮 Kaip žaisti?

1. **Suteikite leidimą naudoti kamerą.**
2. **Valdymas:** Jūsų rodomasis pirštas (index finger) veikia kaip burtų lazdelė. Ekrane matysite baltą švytėjimą ten, kur nukreipta jūsų ranka.
3. **Pasirinkimas (Click):** Suspauskite nykštį ir rodomąjį pirštą (**pinch**), kad paspaustumėte mygtukus.
4. **Burtų leidimas:** Sekite geltoną liniją ir praeikite per visus kontrolinius taškus.
5. **Kombinacijos:** Aukštesniuose lygiuose turėsite atlikti burtų sekas be klaidų.

## 🧪 Debug rėžimas

Debug rėžimas skirtas testuoti gesto sekimą ir burtų „waypoints“ logiką.

### Kaip įjungti

- **Per URL**
Atidarykite su parametru:
`?debug=1`

- **Klavišu**
Paspauskite `D` (toggle). Nustatymas išsaugomas naršyklėje (`localStorage`), todėl liks įjungtas po refresh.

### Ką rodo

- **Waypoint taškai**
Matysite visus `waypoints` taškus ant žaidimo vaizdo.

- **Būsenos spalvomis**
Praeiti (žalia), aktyvus (geltona), būsimi (pilka).

- **Tolerancijos zona**
Aplink aktyvų waypoint piešiamas brūkšniuotas ratas (tolerancijos riba pagal pasirinktą sudėtingumą).

- **Debug panelė**
Viršuje dešinėje rodoma:
`state`, `level`, `spell`, `queue`, `progress`, `tolerance`, `timeLeft`, `cursor`, `pinch`, `distToWp`.

### Debug valdymo panelė

Apačioje kairėje atsiranda **Debug Controls** panelė, kuri leidžia testuoti be laukimo:

- **Pause/Resume**
Sustabdo arba paleidžia žaidimo skaitliuką (timer).

- **-5s / +5s / Step -1s**
Rankiniu būdu koreguoja `timeLeft`.

- **Reset progress**
Atstato dabartinio burto waypoint progresą į pradžią.

- **Level (Set)**
Leidžia ranka nustatyti `level`.

- **Test spell + Apply & jump to PLAYING**
Pasirenkate burtą iš sąrašo ir iškart peršokate į `PLAYING` su pasirinktu burtu.

## 🛠 Technologijos
*   **React** UI logikai.
*   **MediaPipe Hands** rankų sekimui realiu laiku.
*   **Tailwind CSS** magiškam dizainui.
*   **Google Gemini API** (integruota sistemos instrukcijoms).

---
*Sukurta burtininkams, o ne žiobarams.*
