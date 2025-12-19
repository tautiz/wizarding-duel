
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

## 🛠 Technologijos
*   **React** UI logikai.
*   **MediaPipe Hands** rankų sekimui realiu laiku.
*   **Tailwind CSS** magiškam dizainui.
*   **Google Gemini API** (integruota sistemos instrukcijoms).

---
*Sukurta burtininkams, o ne žiobarams.*
