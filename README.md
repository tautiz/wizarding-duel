
# 🪄 Wizarding Duel: Gesture Master

Tai interaktyvus Harry Potter tematikos žaidimas, kuriame burtus leidžiate naudodami savo rankų judesius prieš kamerą.

## 🚀 Kaip paleisti lokaliai?

Kadangi projektas naudoja modernius ES modulius ir MediaPipe bibliotekas, jį reikia paleisti per vietinį serverį (HTTP server).

### 1 būdas: VS Code (rekomenduojama)
1. Atidarykite projektą su **VS Code**.
2. Įsidiekite papildinį **"Live Server"**.
3. Apatiniame dešiniame kampe spauskite **"Go Live"**.
4. Naršyklėje atsidarys `http://127.0.0.1:5500`.

### 2 būdas: Node.js (npx)
Jei turite įdiegtą Node.js, paleiskite šią komandą projekto aplanke:
```bash
npx serve .
```

### 3 būdas: Python
Jei naudojate Python:
```bash
python -m http.server 8000
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
