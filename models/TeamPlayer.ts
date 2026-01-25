import { Player } from '../types';

export interface TeamPlayer extends Player {
  hasCompletedPractice: boolean;
  practiceStartedAt?: Date;
  gameStartedAt?: Date;
  gameEndedAt?: Date;
  timeUsed: number;
  levelsCompleted: number;
}

export const createTeamPlayer = (id: number, name: string): TeamPlayer => ({
  id,
  name,
  score: 0,
  hasCompletedPractice: false,
  timeUsed: 0,
  levelsCompleted: 0,
});
