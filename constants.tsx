
import { Spell } from './types';

export interface Waypoint {
  x: number;
  y: number;
}

export interface DifficultyConfig {
  label: string;
  tolerance: number;
  startTime: number;
  scoreMultiplier: number;
}

export const DEFAULT_DIFFICULTY_ID = 'medium';

export const DIFFICULTIES: Record<string, DifficultyConfig> = {
  easy: {
    label: 'Mokinys',
    tolerance: 11,
    startTime: 45,
    scoreMultiplier: 1,
  },
  medium: {
    label: 'Burtininkas',
    tolerance: 6,
    startTime: 30,
    scoreMultiplier: 1.5,
  },
  hard: {
    label: 'Aurotas',
    tolerance: 3,
    startTime: 20,
    scoreMultiplier: 2,
  },
};

export const getDifficultyConfig = (difficultyId: string): DifficultyConfig => {
  return DIFFICULTIES[difficultyId] ?? DIFFICULTIES[DEFAULT_DIFFICULTY_ID];
};

export const getToleranceForDifficulty = (difficultyId: string) => {
  return getDifficultyConfig(difficultyId).tolerance;
};

export const SPELL_PATH_VISUALS = {
  lineWidthPx: 30,
  outlineWidthPx: 2,
  lineColor: 'rgba(212, 175, 55, 0.18)',
  outlineColor: 'rgba(0, 0, 0, 0.28)',

  flowColor: 'rgba(255, 255, 255, 0.12)',
  flowDashLengthPx: 14,
  flowDashGapPx: 16,
  flowSpeedPxPerSecond: 60,

  startArrowColor: 'rgba(212, 175, 55, 0.85)',
  startArrowOutlineColor: 'rgba(0, 0, 0, 0.55)',
  startArrowSizePx: 18,
  startArrowPulseAmplitude: 0.18,
  startArrowPulseSpeedHz: 1.2,
} as const;

export const COLLEGES = [
  { id: 'gryffindor', label: 'Grifų Gūžta', color: '#b91c1c' },
  { id: 'slytherin', label: 'Klastūnynas', color: '#166534' },
  { id: 'ravenclaw', label: 'Varnanagiai', color: '#1d4ed8' },
  { id: 'hufflepuff', label: 'Švilpynė', color: '#a16207' },
] as const;

export interface EnhancedSpell extends Spell {
  waypoints: Waypoint[];
}

export const SPELLS: EnhancedSpell[] = [
  // --- PUOLAMIEJI ---

  {
    id: 'expelliarmus',
    name: 'Expelliarmus',
    incantation: 'Expelliarmus',
    description: 'Kirsk orą horizontaliai iš kairės į dešinę!',
    gestureDescription: 'KIRSK Į ŠONĄ!',
    color: '#ff4d4d',
    difficulty: 2,
    gesturePath: 'M 15 50 L 85 50',
    waypoints: [{ x: 20, y: 50 }, { x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 }, { x: 80, y: 50 }]
  },
  {
    id: 'stupefy',
    name: 'Stupefy',
    incantation: 'Stupefy',
    description: 'Nupiešk staigų apskritimą!',
    gestureDescription: 'APSKRITIMAS!',
    color: '#ff0000',
    difficulty: 2,
    gesturePath: 'M 50 20 A 30 30 0 1 1 49 20',
    waypoints: [{ x: 50, y: 20 }, { x: 80, y: 50 }, { x: 50, y: 80 }, { x: 20, y: 50 }, { x: 45, y: 25 }]
  },
  // {
  //   id: 'crucio',
  //   name: 'Crucio',
  //   incantation: 'Crucio',
  //   description: 'Vesk ranką spirale į centrą!',
  //   gestureDescription: 'SPIRALĖ!',
  //   color: '#9b59b6',
  //   difficulty: 3,
  //   gesturePath: 'M 80 50 A 30 30 0 1 1 50 20 A 20 20 0 1 1 50 40',
  //   waypoints: [{ x: 80, y: 50 }, { x: 50, y: 80 }, { x: 20, y: 50 }, { x: 50, y: 20 }, { x: 70, y: 50 }, { x: 50, y: 65 }]
  // },
  // {
  //   id: 'avada-kedavra',
  //   name: 'Avada Kedavra',
  //   incantation: 'Avada Kedavra',
  //   description: 'Nubrėžk mirtiną žaibą ekrane!',
  //   gestureDescription: 'MIRTINAS ŽAIBAS!',
  //   color: '#2ecc71',
  //   difficulty: 3,
  //   gesturePath: 'M 20 20 L 80 20 L 20 80 L 80 80',
  //   waypoints: [{ x: 25, y: 20 }, { x: 50, y: 20 }, { x: 75, y: 20 }, { x: 50, y: 50 }, { x: 25, y: 80 }, { x: 50, y: 80 }, { x: 75, y: 80 }]
  // },
  // --- GYNYBINIAI ---
  {
    id: 'protego',
    name: 'Protego',
    incantation: 'Protego',
    description: 'Nupiešk gynybinį skydą - didelį trikampį!',
    gestureDescription: 'TRIKAMPIS!',
    color: '#4db8ff',
    difficulty: 2,
    gesturePath: 'M 50 20 L 80 80 L 20 80 Z',
    waypoints: [{ x: 50, y: 25 }, { x: 65, y: 50 }, { x: 80, y: 75 }, { x: 50, y: 75 }, { x: 20, y: 75 }, { x: 35, y: 50 }]
  },
  {
    id: 'expecto-patronum',
    name: 'Expecto Patronum',
    incantation: 'Expecto Patronum',
    description: 'Nubrėžk P raidę - pradėk nuo apačios į viršų!',
    gestureDescription: 'P RAIDĖ!',
    color: '#ecf0f1',
    difficulty: 3,
    gesturePath: 'M 35 80 L 35 25 Q 60 25 60 40 Q 60 55 35 55',
    waypoints: [{ x: 35, y: 80 }, { x: 35, y: 65 }, { x: 35, y: 50 }, { x: 35, y: 35 }, { x: 35, y: 25 }, { x: 48, y: 25 }, { x: 60, y: 32 }, { x: 60, y: 40 }, { x: 55, y: 50 }, { x: 35, y: 55 }]
  },

  // --- KONTROLĖS IR JUDĖJIMO ---
  {
    id: 'alohomora',
    name: 'Alohomora',
    incantation: 'Alohomora',
    description: 'Nubrėžk S formos raktą!',
    gestureDescription: 'S FORMA!',
    color: '#f39c12',
    difficulty: 2,
    gesturePath: 'M 70 20 C 20 20 20 50 50 50 C 80 50 80 80 30 80',
    waypoints: [{ x: 65, y: 25 }, { x: 40, y: 25 }, { x: 30, y: 40 }, { x: 50, y: 50 }, { x: 70, y: 60 }, { x: 60, y: 75 }, { x: 40, y: 75 }]
  },
  {
    id: 'wingardium-leviosa',
    name: 'Wingardium Leviosa',
    incantation: 'Wingardium Leviosa',
    description: 'Swish and Flick! L raidės judesys.',
    gestureDescription: 'SWISH AND FLICK!',
    color: '#bdc3c7',
    difficulty: 2,
    gesturePath: 'M 20 20 L 20 80 L 80 80',
    waypoints: [{ x: 20, y: 25 }, { x: 20, y: 50 }, { x: 20, y: 75 }, { x: 45, y: 80 }, { x: 75, y: 80 }]
  },

  // --- ELEMENTŲ ---
  {
    id: 'incendio',
    name: 'Incendio',
    incantation: 'Incendio',
    description: 'Nupiešk ugnies liepsną (W formą)!',
    gestureDescription: 'LIEPSNOS ŽENKLAS!',
    color: '#e67e22',
    difficulty: 2,
    gesturePath: 'M 20 20 L 40 80 L 50 40 L 60 80 L 80 20',
    waypoints: [{ x: 25, y: 30 }, { x: 35, y: 70 }, { x: 50, y: 45 }, { x: 65, y: 70 }, { x: 75, y: 30 }]
  },
  {
    id: 'aguamenti',
    name: 'Aguamenti',
    incantation: 'Aguamenti',
    description: 'Nubrėžk bangą!',
    gestureDescription: 'BANGA!',
    color: '#3498db',
    difficulty: 2,
    gesturePath: 'M 15 70 C 40 30 60 90 85 50',
    waypoints: [{ x: 20, y: 65 }, { x: 35, y: 50 }, { x: 50, y: 60 }, { x: 65, y: 70 }, { x: 80, y: 55 }]
  },
  {
    id: 'lumos',
    name: 'Lumos',
    incantation: 'Lumos',
    description: 'Vesk ranką tiesiai iš apačios į viršų!',
    gestureDescription: 'TIESIAI AUKŠTYN!',
    color: '#e2f9ff',
    difficulty: 1,
    gesturePath: 'M 50 85 L 50 15',
    waypoints: [{ x: 50, y: 80 }, { x: 50, y: 65 }, { x: 50, y: 50 }, { x: 50, y: 35 }, { x: 50, y: 20 }]
  },
  {
    id: 'nox',
    name: 'Nox',
    incantation: 'Nox',
    description: 'Gesink šviesą - vesk tiesiai žemyn!',
    gestureDescription: 'TIESIAI ŽEMYN!',
    color: '#2c3e50',
    difficulty: 1,
    gesturePath: 'M 50 15 L 50 85',
    waypoints: [{ x: 50, y: 20 }, { x: 50, y: 40 }, { x: 50, y: 60 }, { x: 50, y: 80 }]
  },
  {
    id: 'bombarda',
    name: 'Bombarda',
    incantation: 'Bombarda',
    description: 'Nupiešk sprogstamą X ženklą ore!',
    gestureDescription: 'X ŽENKLAS!',
    color: '#ff8c00',
    difficulty: 2,
    gesturePath: 'M 30 30 L 70 70 M 70 30 L 30 70',
    waypoints: [{ x: 35, y: 35 }, { x: 50, y: 50 }, { x: 65, y: 65 }, { x: 65, y: 35 }, { x: 35, y: 65 }]
  },
  {
    id: 'accio',
    name: 'Accio',
    incantation: 'Accio',
    description: 'Nubrėžk rodyklę į save!',
    gestureDescription: 'RODYKLĖ!',
    color: '#f1c40f',
    difficulty: 1,
    gesturePath: 'M 80 50 L 30 50 M 30 50 L 42 40 M 30 50 L 42 60',
    waypoints: [{ x: 78, y: 50 }, { x: 65, y: 50 }, { x: 50, y: 50 }, { x: 35, y: 50 }, { x: 30, y: 50 }, { x: 40, y: 42 }, { x: 30, y: 50 }, { x: 40, y: 58 }]
  },
  {
    id: 'reparo',
    name: 'Reparo',
    incantation: 'Reparo',
    description: 'Nupiešk pliusą (+) ore!',
    gestureDescription: 'PLIUSAS!',
    color: '#2ecc71',
    difficulty: 1,
    gesturePath: 'M 50 20 L 50 80 M 20 50 L 80 50',
    waypoints: [{ x: 50, y: 75 }, { x: 50, y: 60 }, { x: 50, y: 45 }, { x: 50, y: 30 }, { x: 50, y: 20 }, { x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 }, { x: 80, y: 50 }]
  },
  {
    id: 'finite-incantatem',
    name: 'Finite Incantatem',
    incantation: 'Finite Incantatem',
    description: 'Nubrėžk trumpą brūkšnį ir sustok!',
    gestureDescription: 'TRUMPAS BRŪKŠNYS!',
    color: '#95a5a6',
    difficulty: 1,
    gesturePath: 'M 30 50 L 70 50',
    waypoints: [{ x: 30, y: 50 }, { x: 40, y: 50 }, { x: 50, y: 50 }, { x: 60, y: 50 }, { x: 70, y: 50 }]
  },
  {
    id: 'riddikulus',
    name: 'Riddikulus',
    incantation: 'Riddikulus',
    description: 'Nubrėžk šypseną (U formą)!',
    gestureDescription: 'ŠYPSENA!',
    color: '#ff6b81',
    difficulty: 1,
    gesturePath: 'M 30 35 Q 50 75 70 35',
    waypoints: [{ x: 30, y: 35 }, { x: 38, y: 48 }, { x: 50, y: 60 }, { x: 62, y: 48 }, { x: 70, y: 35 }]
  },
  {
    id: 'petrificus-totalus',
    name: 'Petrificus Totalus',
    incantation: 'Petrificus Totalus',
    description: 'Nubrėžk I raidę (tiesiai aukštyn)!',
    gestureDescription: 'TIESIAI AUKŠTYN!',
    color: '#74b9ff',
    difficulty: 2,
    gesturePath: 'M 50 85 L 50 15',
    waypoints: [{ x: 50, y: 80 }, { x: 50, y: 65 }, { x: 50, y: 50 }, { x: 50, y: 35 }, { x: 50, y: 20 }]
  },
  {
    id: 'impedimenta',
    name: 'Impedimenta',
    incantation: 'Impedimenta',
    description: 'Nubrėžk stačią L raidę!',
    gestureDescription: 'L FORMA!',
    color: '#e17055',
    difficulty: 2,
    gesturePath: 'M 30 20 L 30 80 L 75 80',
    waypoints: [{ x: 30, y: 25 }, { x: 30, y: 45 }, { x: 30, y: 65 }, { x: 30, y: 80 }, { x: 50, y: 80 }, { x: 70, y: 80 }]
  },
  {
    id: 'expulso',
    name: 'Expulso',
    incantation: 'Expulso',
    description: 'Nubrėžk įstrižą brūkšnį per ekraną!',
    gestureDescription: 'ĮSTRIŽAI!',
    color: '#fdcb6e',
    difficulty: 2,
    gesturePath: 'M 25 75 L 75 25',
    waypoints: [{ x: 25, y: 75 }, { x: 38, y: 62 }, { x: 50, y: 50 }, { x: 62, y: 38 }, { x: 75, y: 25 }]
  },
  {
    id: 'reducto',
    name: 'Reducto',
    incantation: 'Reducto',
    description: 'Nubrėžk kvadratą!',
    gestureDescription: 'KVADRATAS!',
    color: '#e67e22',
    difficulty: 2,
    gesturePath: 'M 30 30 L 70 30 L 70 70 L 30 70 Z',
    waypoints: [{ x: 30, y: 30 }, { x: 50, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 50 }, { x: 70, y: 70 }, { x: 50, y: 70 }, { x: 30, y: 70 }, { x: 30, y: 50 }]
  },
  {
    id: 'obliviate',
    name: 'Obliviate',
    incantation: 'Obliviate',
    description: 'Nubrėžk O raidę (apskritimą)!',
    gestureDescription: 'O RAIDĖ!',
    color: '#a29bfe',
    difficulty: 2,
    gesturePath: 'M 50 20 A 30 30 0 1 1 49 20',
    waypoints: [{ x: 50, y: 20 }, { x: 70, y: 30 }, { x: 80, y: 50 }, { x: 70, y: 70 }, { x: 50, y: 80 }, { x: 30, y: 70 }, { x: 20, y: 50 }, { x: 30, y: 30 }]
  },
  {
    id: 'silencio',
    name: 'Silencio',
    incantation: 'Silencio',
    description: 'Nubrėžk Z raidę!',
    gestureDescription: 'Z RAIDĖ!',
    color: '#636e72',
    difficulty: 2,
    gesturePath: 'M 25 30 L 75 30 L 25 70 L 75 70',
    waypoints: [{ x: 25, y: 30 }, { x: 45, y: 30 }, { x: 65, y: 30 }, { x: 55, y: 45 }, { x: 45, y: 55 }, { x: 35, y: 65 }, { x: 25, y: 70 }, { x: 50, y: 70 }, { x: 75, y: 70 }]
  },
  {
    id: 'tarantallegra',
    name: 'Tarantallegra',
    incantation: 'Tarantallegra',
    description: 'Nubrėžk T raidę!',
    gestureDescription: 'T RAIDĖ!',
    color: '#fab1a0',
    difficulty: 2,
    gesturePath: 'M 50 80 L 50 25 L 25 25 L 75 25',
    waypoints: [{ x: 50, y: 80 }, { x: 50, y: 62 }, { x: 50, y: 45 }, { x: 50, y: 32 }, { x: 50, y: 25 }, { x: 38, y: 25 }, { x: 25, y: 25 }, { x: 50, y: 25 }, { x: 75, y: 25 }]
  },
  {
    id: 'locomotor',
    name: 'Locomotor',
    incantation: 'Locomotor',
    description: 'Nubrėžk žingsnį (laiptą)!',
    gestureDescription: 'LAIPTAI!',
    color: '#55efc4',
    difficulty: 2,
    gesturePath: 'M 25 70 L 45 70 L 45 50 L 65 50 L 65 30',
    waypoints: [{ x: 25, y: 70 }, { x: 35, y: 70 }, { x: 45, y: 70 }, { x: 45, y: 60 }, { x: 45, y: 50 }, { x: 55, y: 50 }, { x: 65, y: 50 }, { x: 65, y: 40 }, { x: 65, y: 30 }]
  },
  {
    id: 'avis',
    name: 'Avis',
    incantation: 'Avis',
    description: 'Nubrėžk V formą!',
    gestureDescription: 'V FORMA!',
    color: '#81ecec',
    difficulty: 1,
    gesturePath: 'M 25 25 L 50 75 L 75 25',
    waypoints: [{ x: 25, y: 25 }, { x: 35, y: 45 }, { x: 45, y: 65 }, { x: 50, y: 75 }, { x: 55, y: 65 }, { x: 65, y: 45 }, { x: 75, y: 25 }]
  },
  {
    id: 'opugno',
    name: 'Oppugno',
    incantation: 'Oppugno',
    description: 'Nubrėžk N raidę!',
    gestureDescription: 'N RAIDĖ!',
    color: '#ffeaa7',
    difficulty: 2,
    gesturePath: 'M 25 80 L 25 25 L 75 80 L 75 25',
    waypoints: [{ x: 25, y: 80 }, { x: 25, y: 60 }, { x: 25, y: 42 }, { x: 25, y: 25 }, { x: 45, y: 45 }, { x: 60, y: 60 }, { x: 75, y: 80 }, { x: 75, y: 55 }, { x: 75, y: 35 }, { x: 75, y: 25 }]
  },
  {
    id: 'muffliato',
    name: 'Muffliato',
    incantation: 'Muffliato',
    description: 'Nubrėžk M raidę!',
    gestureDescription: 'M RAIDĖ!',
    color: '#b2bec3',
    difficulty: 3,
    gesturePath: 'M 20 80 L 20 25 L 50 55 L 80 25 L 80 80',
    waypoints: [{ x: 20, y: 80 }, { x: 20, y: 62 }, { x: 20, y: 45 }, { x: 20, y: 25 }, { x: 32, y: 35 }, { x: 40, y: 45 }, { x: 50, y: 55 }, { x: 60, y: 45 }, { x: 68, y: 35 }, { x: 80, y: 25 }, { x: 80, y: 45 }, { x: 80, y: 62 }, { x: 80, y: 80 }]
  },
  {
    id: 'episkey',
    name: 'Episkey',
    incantation: 'Episkey',
    description: 'Nubrėžk tikrą „check“ ženklą!',
    gestureDescription: 'CHECK!',
    color: '#00b894',
    difficulty: 2,
    gesturePath: 'M 30 55 L 45 70 L 75 35',
    waypoints: [{ x: 30, y: 55 }, { x: 38, y: 62 }, { x: 45, y: 70 }, { x: 55, y: 58 }, { x: 65, y: 47 }, { x: 75, y: 35 }]
  },
  {
    id: 'confundo',
    name: 'Confundo',
    incantation: 'Confundo',
    description: 'Nubrėžk F raidę!',
    gestureDescription: 'F RAIDĖ!',
    color: '#6c5ce7',
    difficulty: 3,
    gesturePath: 'M 25 80 L 25 25 L 75 25 L 25 25 L 25 50 L 60 50',
    waypoints: [{ x: 25, y: 80 }, { x: 25, y: 62 }, { x: 25, y: 45 }, { x: 25, y: 32 }, { x: 25, y: 25 }, { x: 45, y: 25 }, { x: 60, y: 25 }, { x: 75, y: 25 }, { x: 40, y: 25 }, { x: 25, y: 25 }, { x: 25, y: 38 }, { x: 25, y: 50 }, { x: 42, y: 50 }, { x: 60, y: 50 }]
  },
  {
    id: 'levicorpus',
    name: 'Levicorpus',
    incantation: 'Levicorpus',
    description: 'Nubrėžk kablį (J formą)!',
    gestureDescription: 'KABLIS!',
    color: '#00cec9',
    difficulty: 3,
    gesturePath: 'M 55 20 L 55 70 Q 55 85 40 85',
    waypoints: [{ x: 55, y: 20 }, { x: 55, y: 35 }, { x: 55, y: 50 }, { x: 55, y: 65 }, { x: 55, y: 75 }, { x: 50, y: 82 }, { x: 40, y: 85 }]
  },
  {
    id: 'confringo',
    name: 'Confringo',
    incantation: 'Confringo',
    description: 'Nubrėžk stačiakampį (ilgesnį kvadratą)!',
    gestureDescription: 'STAČIAKAMPIS!',
    color: '#e84393',
    difficulty: 3,
    gesturePath: 'M 25 35 L 75 35 L 75 65 L 25 65 Z',
    waypoints: [{ x: 25, y: 35 }, { x: 45, y: 35 }, { x: 65, y: 35 }, { x: 75, y: 35 }, { x: 75, y: 50 }, { x: 75, y: 65 }, { x: 55, y: 65 }, { x: 35, y: 65 }, { x: 25, y: 65 }, { x: 25, y: 50 }]
  },
  {
    id: 'protego-maxima',
    name: 'Protego Maxima',
    incantation: 'Protego Maxima',
    description: 'Nubrėžk didesnį skydą (penkiakampį)!',
    gestureDescription: 'SKYDO FORMA!',
    color: '#4db8ff',
    difficulty: 3,
    gesturePath: 'M 50 18 L 78 35 L 68 78 L 32 78 L 22 35 Z',
    waypoints: [{ x: 50, y: 18 }, { x: 64, y: 26 }, { x: 78, y: 35 }, { x: 73, y: 58 }, { x: 68, y: 78 }, { x: 50, y: 78 }, { x: 32, y: 78 }, { x: 27, y: 58 }, { x: 22, y: 35 }, { x: 36, y: 26 }]
  }
];

export const SOUNDS = {
  swish: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  success: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
  lumos: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3',
  bombarda: 'https://assets.mixkit.co/active_storage/sfx/218/218-preview.mp3',
  protego: 'https://assets.mixkit.co/active_storage/sfx/1118/1118-preview.mp3',
  expelliarmus: 'https://assets.mixkit.co/active_storage/sfx/2704/2704-preview.mp3'
};

export const SYSTEM_INSTRUCTION = `
Esi Didysis Burtininkų Arbitras. 
Žaidėjas atlieka burtų kombinacijas (combos).
Būk teatrališkas. Jei žaidėjas sėkmingai užbaigia ilgą kombinaciją, vadink jį Didžiuoju Magu.
Naudok burtų pavadinimus iš Harry Potter visatos.
`;
