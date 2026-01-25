import { TeamSession } from '../models/TeamGameState';
import { TeamPlayer, createTeamPlayer } from '../models/TeamPlayer';
import { storageService } from './storageService';

class TeamGameService {
  createTeamSession(
    playerCount: number,
    totalTime: number,
    difficulty: string,
    playerNames: string[]
  ): TeamSession {
    const timePerPlayer = this.calculateTimePerPlayer(totalTime, playerCount);
    const session: TeamSession = {
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      players: playerNames.map((name, idx) => createTeamPlayer(idx + 1, name)),
      totalTimeLimit: totalTime,
      timePerPlayer,
      totalScore: 0,
      difficulty,
      createdAt: new Date(),
    };

    storageService.saveTeamSession(session);
    return session;
  }

  calculateTimePerPlayer(totalTime: number, playerCount: number): number {
    return Math.floor(totalTime / playerCount);
  }

  startPlayerPractice(session: TeamSession, playerId: number): TeamSession {
    const updatedPlayers = session.players.map(p =>
      p.id === playerId
        ? { ...p, practiceStartedAt: new Date() }
        : p
    );

    const updatedSession = { ...session, players: updatedPlayers };
    storageService.updateTeamSession(session.id, updatedSession);
    return updatedSession;
  }

  completePlayerPractice(session: TeamSession, playerId: number): TeamSession {
    const updatedPlayers = session.players.map(p =>
      p.id === playerId
        ? { ...p, hasCompletedPractice: true }
        : p
    );

    const updatedSession = { ...session, players: updatedPlayers };
    storageService.updateTeamSession(session.id, updatedSession);
    return updatedSession;
  }

  startPlayerGame(session: TeamSession, playerId: number): TeamSession {
    const updatedPlayers = session.players.map(p =>
      p.id === playerId
        ? { ...p, gameStartedAt: new Date() }
        : p
    );

    const updatedSession = { ...session, players: updatedPlayers };
    storageService.updateTeamSession(session.id, updatedSession);
    return updatedSession;
  }

  endPlayerGame(
    session: TeamSession,
    playerId: number,
    score: number,
    levelsCompleted: number
  ): TeamSession {
    const player = session.players.find(p => p.id === playerId);
    if (!player || !player.gameStartedAt) return session;

    const timeUsed = Math.floor(
      (new Date().getTime() - new Date(player.gameStartedAt).getTime()) / 1000
    );

    const updatedPlayers = session.players.map(p =>
      p.id === playerId
        ? {
            ...p,
            score,
            levelsCompleted,
            timeUsed,
            gameEndedAt: new Date(),
          }
        : p
    );

    const totalScore = this.calculateTeamScore({ ...session, players: updatedPlayers });
    const updatedSession = {
      ...session,
      players: updatedPlayers,
      totalScore,
    };

    storageService.updateTeamSession(session.id, updatedSession);
    return updatedSession;
  }

  getNextPlayer(session: TeamSession): TeamPlayer | null {
    const nextPlayer = session.players.find(p => !p.hasCompletedPractice);
    if (nextPlayer) return nextPlayer;

    const nextGamePlayer = session.players.find(p => !p.gameEndedAt);
    return nextGamePlayer || null;
  }

  isSessionComplete(session: TeamSession): boolean {
    return session.players.every(p => p.gameEndedAt !== undefined);
  }

  calculateTeamScore(session: TeamSession): number {
    return session.players.reduce((sum, p) => sum + p.score, 0);
  }

  finalizeSession(session: TeamSession): TeamSession {
    const finalSession = {
      ...session,
      completedAt: new Date(),
      totalScore: this.calculateTeamScore(session),
    };

    storageService.updateTeamSession(session.id, finalSession);
    return finalSession;
  }

  getPlayerProgress(session: TeamSession, playerId: number): {
    hasCompletedPractice: boolean;
    hasStartedGame: boolean;
    hasCompletedGame: boolean;
  } {
    const player = session.players.find(p => p.id === playerId);
    if (!player) {
      return {
        hasCompletedPractice: false,
        hasStartedGame: false,
        hasCompletedGame: false,
      };
    }

    return {
      hasCompletedPractice: player.hasCompletedPractice,
      hasStartedGame: player.gameStartedAt !== undefined,
      hasCompletedGame: player.gameEndedAt !== undefined,
    };
  }
}

export const teamGameService = new TeamGameService();
