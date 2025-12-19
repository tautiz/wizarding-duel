
export enum GameState {
  LANDING = 'LANDING',
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  RESULTS = 'RESULTS'
}

export interface Spell {
  id: string;
  name: string;
  incantation: string;
  description: string;
  gestureDescription: string;
  color: string;
  difficulty: number;
  gesturePath: string; // SVG path for visualization
}

export interface Player {
  id: number;
  name: string;
  score: number;
  activeSpell?: string;
}

export interface GameConfig {
  voiceEnabled: boolean;
  playerCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const WIZARD_NAMES = [
  'Haris', 'Hermiona', 'Ronis', 'Albas', 'Severas', 
  'Drakas', 'Luna', 'Nevilis', 'Minerva', 'Sirijus',
  'Belatriks', 'Gilderojus', 'Remas', 'Rubėjus'
];
