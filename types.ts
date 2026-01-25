
export enum GameState {
  LANDING = 'LANDING',
  MODE_SELECT = 'MODE_SELECT',
  SETUP = 'SETUP',
  TEAM_SETUP = 'TEAM_SETUP',
  TEAM_PRACTICE = 'TEAM_PRACTICE',
  PLAYING = 'PLAYING',
  TEAM_PLAYING = 'TEAM_PLAYING',
  RESULTS = 'RESULTS',
  TEAM_RESULTS = 'TEAM_RESULTS'
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
  difficulty: string;
}

export const WIZARD_NAMES = [
  'Haris', 'Hermiona', 'Ronis', 'Albas', 'Severas', 
  'Drakas', 'Luna', 'Nevilis', 'Minerva', 'Sirijus',
  'Belatriks', 'Gilderojus', 'Remas', 'Rubėjus'
];
