# Gestai: kaip pridėti naujus (produkcinio lygio gairės)

Šis projektas naudoja `MediaPipe Hands` rankų landmark’us ir gestus apdoroja realiu laiku.

Tikslas: kad `App.tsx` būtų atsakingas už **veiksmus** (pvz. pauzė, išėjimas), o gestų atpažinimo logika būtų izoliuota ir palaikoma atskirai.

## Esama architektūra

- **Gestų detektoriai**: `gestures/GestureDetectors.ts`
  - `createGestureDetectors(options?)`
  - `update(multiHandLandmarks, enabled) -> GestureEvents`
  - `reset()`

- **Veiksmai ir „cooldown“**: `App.tsx`
  - `pauseToggleCooldownUntilRef` ir `exitCooldownUntilRef` užtikrina, kad tas pats „edge“ neįvyktų per dažnai.
  - `exitToSetup()` resetina būseną ir iškviečia `gestureDetectorsRef.current.reset()`.

### Kodėl taip?

- `GestureDetectors` modulis:
  - yra lengviau testuojamas ir refaktorizuojamas
  - nekaupia UI būsenos
  - grąžina „signalus“ (`...Edge`) vietoje to, kad pats vykdytų veiksmus

- `App.tsx`:
  - valdo tik domeninius veiksmus
  - kontroliuoja „cooldown“ ir žaidimo režimų (PLAYING/PAUSED/SETUP) taisykles

## Pagrindiniai principai kuriant gestus

### 1) Stabilumas (stable frames)

Realiame streame vieno kadro klasifikacija yra triukšminga.
Todėl gestas laikomas aktyviu tik kai sąlyga išlieka `N` kadrų iš eilės.

- Pvz. open palm naudoja `openPalmStableFrames`.
- Pvz. crossed hands (X) naudoja `crossedHandsStableFrames`.

Rekomendacija:
- pradėk nuo `N=4..8`
- mažesnis `N` = greitesnis, bet daugiau false-positive

### 2) Rising edge (perėjimas false -> true)

Veiksmas turi įvykti **tik perėjimo momentu**, o ne kiekvieną kadrą laikant gestą.
Todėl detektorius turi grąžinti:

- `gestureActive` (ar šiuo metu aktyvu)
- `gestureEdge` (ar ką tik tapo aktyvu)

Produkcinė taisyklė:
- UI/žaidimo veiksmai turi būti triggerinami nuo `...Edge`, ne nuo `...Active`.

### 3) Cooldown (debounce tarp edge)

Net su `stable frames` kartais būna, kad detektorius trumpam „paleidžia“ ir vėl suaktyvina gestą.
Todėl veiksmus saugiausia dar filtruoti ir `App` lygyje:

- `if (now < cooldownUntil) return;`
- `cooldownUntil = now + X ms;`

Rekomendacija:
- 700–1200ms toggle tipo veiksmams (pauzė)
- 1200–2000ms „exit/critical“ veiksmams

### 4) Įjungimas pagal režimą (enabled)

`update(..., enabled)` turi būti iškviečiamas kiekviename kadre, bet kai `enabled=false` detektorius turi:

- išvalyti vidinę būseną (`reset`)
- grąžinti „false“ visiems signalams

Tai apsaugo nuo situacijų, kai gestas buvo laikomas prieš pereinant į kitą ekraną ir suveikia iš karto grįžus.

## Kaip pridėti naują gestą (žingsniai)

### 1) Apibrėžk gestą kaip aiškią, lokalią matematinę sąlygą

Gestas turėtų remtis:
- atstumais (`Math.hypot(dx, dy)`), kampais (trijų taškų kampas), arba
- kelių landmark’ų tarpusavio padėtimis

Venk:
- vieno landmark’o „y < threshold“ be papildomų kriterijų
- logikos, kuri priklauso nuo konkretaus ekrano dydžio (naudok normalizuotas koordinates)

### 2) Pridėk konfigūruojamus slenksčius į `GestureDetectorOptions`

Pvz.:
- `peaceSignStableFrames`
- `peaceSignMinSeparation`

Slenksčių tikslas:
- kad būtų galima tuning’inti be logikos perrašymo

### 3) Implementuok gestą `GestureDetectors.ts`

Rekomenduojamas pattern:
- apskaičiuoji `candidate: boolean`
- tvarkai `stableCount`
- gauni `active = stableCount >= N`
- gauni `edge = active && !wasActive`

### 4) Integruok į `App.tsx` tik per edge

`onResults` viduje:
- `const events = gestureDetectorsRef.current.update(...)`
- `if (events.<newGesture>Edge) { ... }`

**Svarbu**: `App` lygyje pridėk `cooldown` jei veiksmas kritinis.

### 5) Reset logika

Kai įvyksta „hard transition“ (pvz. `exitToSetup()`):
- visada kviesk `gestureDetectorsRef.current.reset()`

## Landmark’ų nuoroda (MediaPipe Hands)

Dažniausiai naudojami indeksai:
- `0` wrist
- `4` thumb tip
- `8` index tip
- `12` middle tip
- `16` ring tip
- `20` pinky tip

Pastaba: detektorius dirba su normalizuotomis koordinatėmis (0..1), todėl slenksčiai turi būti „unitless“.

## False-positive mažinimo checklist

- **Naudok 2–3 kriterijus** tam pačiam gestui (ne vieną).
- **Stabilumo kadrai** (`N>=4`).
- **Rising edge** (trigger tik perėjime).
- **Cooldown** kritiniams veiksmams.
- **Enabled pagal režimą** (tik `PLAYING`).

## Testavimas ir priežiūra

Rekomendacijos:
- Jei pridėsi test runnerį, `GestureDetectors.ts` galima unit-testinti su „synthetic“ landmark’ais.
- Debug režime verta vizualizuoti:
  - atstumus/kampus
  - ar `candidate` true/false
  - `stableCount`

Tai leidžia tuning’inti slenksčius realiame apšvietime ir kamerų kokybėje.
