
import { Spell } from './types';

export interface Waypoint {
  x: number;
  y: number;
}

export const getToleranceForDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
  return difficulty === 'easy' ? 22 : difficulty === 'medium' ? 16 : 10;
};

export interface EnhancedSpell extends Spell {
  waypoints: Waypoint[];
}

export const SPELLS: EnhancedSpell[] = [
  // --- PUOLAMIEJI ---
  {
    id: 'avada-kedavra',
    name: 'Avada Kedavra',
    incantation: 'Avada Kedavra',
    description: 'Nubrėžk mirtiną žaibą ekrane!',
    gestureDescription: 'MIRTINAS ŽAIBAS!',
    color: '#2ecc71',
    difficulty: 3,
    gesturePath: 'M 20 20 L 80 20 L 20 80 L 80 80',
    waypoints: [{ x: 25, y: 20 }, { x: 50, y: 20 }, { x: 75, y: 20 }, { x: 50, y: 50 }, { x: 25, y: 80 }, { x: 50, y: 80 }, { x: 75, y: 80 }]
  },
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
  {
    id: 'crucio',
    name: 'Crucio',
    incantation: 'Crucio',
    description: 'Vesk ranką spirale į centrą!',
    gestureDescription: 'SPIRALĖ!',
    color: '#9b59b6',
    difficulty: 3,
    gesturePath: 'M 80 50 A 30 30 0 1 1 50 20 A 20 20 0 1 1 50 40',
    waypoints: [{ x: 80, y: 50 }, { x: 50, y: 80 }, { x: 20, y: 50 }, { x: 50, y: 20 }, { x: 70, y: 50 }, { x: 50, y: 65 }]
  },

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
    description: 'Nubrėžk didelį sidabrinį pusmėnulį!',
    gestureDescription: 'PUSMĖNULIS!',
    color: '#ecf0f1',
    difficulty: 3,
    gesturePath: 'M 80 20 A 40 40 0 1 1 80 80',
    waypoints: [{ x: 80, y: 25 }, { x: 60, y: 25 }, { x: 40, y: 50 }, { x: 60, y: 75 }, { x: 80, y: 75 }]
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
