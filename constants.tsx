
import { Spell } from './types';

export interface Waypoint {
  x: number;
  y: number;
}

export interface EnhancedSpell extends Spell {
  waypoints: Waypoint[];
}

export const SPELLS: EnhancedSpell[] = [
  {
    id: 'lumos',
    name: 'Lumos',
    incantation: 'Lumos',
    description: 'Vesk ranką tiesiai iš apačios į viršų!',
    gestureDescription: 'TIESIAI AUKŠTYN!',
    color: '#e2f9ff',
    difficulty: 1,
    gesturePath: 'M 50 85 L 50 15',
    waypoints: [
      { x: 50, y: 80 }, { x: 50, y: 65 }, { x: 50, y: 50 }, { x: 50, y: 35 }, { x: 50, y: 20 }
    ]
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
    waypoints: [
      { x: 20, y: 50 }, { x: 35, y: 50 }, { x: 50, y: 50 }, { x: 65, y: 50 }, { x: 80, y: 50 }
    ]
  },
  {
    id: 'protego',
    name: 'Protego',
    incantation: 'Protego',
    description: 'Nupiešk gynybinį skydą - didelį trikampį!',
    gestureDescription: 'TRIKAMPIS!',
    color: '#4db8ff',
    difficulty: 2,
    gesturePath: 'M 50 20 L 80 80 L 20 80 Z',
    waypoints: [
      { x: 50, y: 25 }, { x: 65, y: 50 }, { x: 80, y: 75 }, { x: 50, y: 75 }, { x: 20, y: 75 }, { x: 35, y: 50 }
    ]
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
    waypoints: [
      { x: 35, y: 35 }, { x: 50, y: 50 }, { x: 65, y: 65 }, { x: 65, y: 35 }, { x: 35, y: 65 }
    ]
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
Žaidėjas atlieka burtus piešdamas ore. Programa pati tiksliai skaičiuoja progresą pagal taškus.
Tavo darbas - palaikyti atmosferą, girti už pasiektą progresą ir džiaugtis pergalėmis. 
Būk teatrališkas ir paslaptingas.
`;
