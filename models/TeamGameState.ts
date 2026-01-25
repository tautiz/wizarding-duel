import { TeamPlayer } from './TeamPlayer';

export interface TeamGameState {
  mode: 'solo' | 'team';
  teamId: string;
  totalTimeLimit: number;
  playerCount: number;
  timePerPlayer: number;
  currentPlayerIndex: number;
  teamScore: number;
  startedAt?: Date;
}

export interface TeamSession {
  id: string;
  teamName?: string;
  players: TeamPlayer[];
  totalScore: number;
  difficulty: string;
  completedAt?: Date;
  createdAt: Date;
}

export interface SoloResult {
  id: string;
  playerName: string;
  score: number;
  levelsCompleted: number;
  difficulty: string;
  completedAt: Date;
}

export const createTeamSession = (
  playerCount: number,
  totalTime: number,
  difficulty: string
): TeamSession => ({
  id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  players: [],
  totalScore: 0,
  difficulty,
  createdAt: new Date(),
});
