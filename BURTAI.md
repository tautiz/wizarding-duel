
# 🧙‍♂️ Kaip sukurti savo burtus?

Norėdami pridėti naują burtą į „Magišką Dvikovą“, turite atlikti pakeitimus trijose vietose: `constants.tsx`, `components/MagicEffect.tsx` ir (pasirinktinai) pridėti garsą.

## 1. Burtų konfigūracija (`constants.tsx`)

Visi burtai saugomi `SPELLS` masyve. Kiekvienas burtas turi šiuos parametrus:

```typescript
{
  id: 'mano-burtas',           // Unikalus ID (naudojamas efektams)
  name: 'Burtas',              // Rodomas pavadinimas
  incantation: 'Burtas!',      // Burtas balsu (ateities funkcijoms)
  description: 'Aprašymas...', // Paaiškinimas apačioje
  gestureDescription: 'JUDESYS',// Trumpa instrukcija (pvz. "Z RAIDĖ")
  color: '#ffffff',            // Švytėjimo spalva
  difficulty: 2,               // Sunkumas (1-3)
  gesturePath: 'M 20 20 L 80 80', // SVG kelio duomenys (100x100 koordinačių sistema)
  waypoints: [                 // Nematomi taškai, kuriuos žaidėjas TURI paliesti
    { x: 20, y: 20 }, 
    { x: 50, y: 50 }, 
    { x: 80, y: 80 }
  ]
}
```

### Kaip sukurti `gesturePath` ir `waypoints`?
*   **Koordinačių sistema:** Naudojamas 100x100 kvadratas. `0,0` yra viršutinis kairysis kampas, `100,100` – apatinis dešinysis.
*   **gesturePath:** Tai standartinis SVG Path formatas. `M` – move (pradėti), `L` – line (linija), `A` – arc (lankas), `C` – curve (kreivė).
*   **waypoints:** Tai svarbiausia dalis. Žaidėjas laimi burtą tik tada, kai jo pirštas prabėga per visus šiuos taškus nurodyta seka. Rekomenduojama dėti taškus kas 15-20 vienetų palei SVG liniją.

---

## 2. Vizualiniai efektai (`components/MagicEffect.tsx`)

Norėdami, kad burtas turėtų unikalų vizualinį efektą jį užbaigus, pridėkite naują `case` bloką `renderEffect` funkcijoje:

```tsx
case 'mano-burtas':
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-64 h-64 bg-white animate-ping" />
      {/* Čia galite dėti bet kokius Tailwind elementus */}
    </div>
  );
```

Galite naudoti paruoštas animacijas: `animate-flash`, `animate-bomb-blast`, `animate-shield-pulse`.

---

## 3. Garsai (`constants.tsx`)

Pridėkite nuorodą į `.mp3` failą `SOUNDS` objekte:

```typescript
export const SOUNDS = {
  // ... esami garsai
  'mano-burtas': 'https://nuoroda-i-garsa.mp3'
};
```
*Pastaba: Garsas bus automatiškai paleistas, jei jo raktas (`key`) sutaps su burto `id`.*
