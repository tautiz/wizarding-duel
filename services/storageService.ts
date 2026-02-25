import { TeamSession, SoloResult } from '../models/TeamGameState';

class StorageService {
  private static readonly TEAM_SESSIONS_KEY = 'wd_team_sessions';
  private static readonly SOLO_RESULTS_KEY = 'wd_solo_results';
  private static readonly LOCKED_COLLEGES_KEY = 'wd_locked_colleges';
  private static readonly MAX_TEAM_SESSIONS = 50;
  private static readonly MAX_SOLO_RESULTS = 100;
  private static readonly MAX_AGE_DAYS = 90;

  saveTeamSession(session: TeamSession): void {
    try {
      const sessions = this.getAllTeamSessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      this.cleanupOldSessions(sessions);
      localStorage.setItem(StorageService.TEAM_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save team session:', error);
    }
  }

  getTeamSession(sessionId: string): TeamSession | null {
    try {
      const sessions = this.getAllTeamSessions();
      return sessions.find(s => s.id === sessionId) || null;
    } catch (error) {
      console.error('Failed to get team session:', error);
      return null;
    }
  }

  getAllTeamSessions(): TeamSession[] {
    try {
      const data = localStorage.getItem(StorageService.TEAM_SESSIONS_KEY);
      if (!data) return [];
      
      const sessions = JSON.parse(data) as TeamSession[];
      return sessions.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt),
        completedAt: s.completedAt ? new Date(s.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to load team sessions:', error);
      return [];
    }
  }

  updateTeamSession(sessionId: string, updates: Partial<TeamSession>): void {
    try {
      const sessions = this.getAllTeamSessions();
      const index = sessions.findIndex(s => s.id === sessionId);
      
      if (index >= 0) {
        sessions[index] = { ...sessions[index], ...updates };
        localStorage.setItem(StorageService.TEAM_SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Failed to update team session:', error);
    }
  }

  saveSoloResult(result: SoloResult): void {
    try {
      const results = this.getAllSoloResults();
      results.push(result);
      
      this.cleanupOldSoloResults(results);
      localStorage.setItem(StorageService.SOLO_RESULTS_KEY, JSON.stringify(results));
    } catch (error) {
      console.error('Failed to save solo result:', error);
    }
  }

  getAllSoloResults(): SoloResult[] {
    try {
      const data = localStorage.getItem(StorageService.SOLO_RESULTS_KEY);
      if (!data) return [];
      
      const results = JSON.parse(data) as SoloResult[];
      return results.map(r => ({
        ...r,
        completedAt: new Date(r.completedAt),
      }));
    } catch (error) {
      console.error('Failed to load solo results:', error);
      return [];
    }
  }

  getTopTeamScores(limit: number = 10): TeamSession[] {
    const sessions = this.getAllTeamSessions()
      .filter(s => s.completedAt)
      .sort((a, b) => b.totalScore - a.totalScore);
    
    return sessions.slice(0, limit);
  }

  getTopSoloScores(limit: number = 10): SoloResult[] {
    const results = this.getAllSoloResults()
      .sort((a, b) => b.score - a.score);
    
    return results.slice(0, limit);
  }

  getLockedColleges(): string[] {
    try {
      const data = localStorage.getItem(StorageService.LOCKED_COLLEGES_KEY);
      if (!data) return [];
      const ids = JSON.parse(data) as string[];
      return Array.isArray(ids) ? ids : [];
    } catch {
      return [];
    }
  }

  lockCollege(collegeId: string): void {
    try {
      const locked = new Set(this.getLockedColleges());
      locked.add(collegeId);
      localStorage.setItem(StorageService.LOCKED_COLLEGES_KEY, JSON.stringify([...locked]));
    } catch (error) {
      console.error('Failed to lock college:', error);
    }
  }

  unlockCollege(collegeId: string): void {
    try {
      const locked = new Set(this.getLockedColleges());
      locked.delete(collegeId);
      localStorage.setItem(StorageService.LOCKED_COLLEGES_KEY, JSON.stringify([...locked]));
    } catch (error) {
      console.error('Failed to unlock college:', error);
    }
  }

  unlockAllColleges(): void {
    try {
      localStorage.setItem(StorageService.LOCKED_COLLEGES_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to unlock all colleges:', error);
    }
  }

  isCollegeLocked(collegeId: string): boolean {
    return this.getLockedColleges().includes(collegeId);
  }

  getCollegeSummaries(): Array<{
    collegeId: string;
    sessionsPlayed: number;
    totalScore: number;
    bestScore: number;
    lastPlayedAt?: Date;
  }> {
    const sessions = this.getAllTeamSessions().filter(s => s.completedAt);

    const map = new Map<string, {
      sessionsPlayed: number;
      totalScore: number;
      bestScore: number;
      lastPlayedAt?: Date;
    }>();

    sessions.forEach(s => {
      const key = s.collegeId || 'unknown';
      const prev = map.get(key) ?? { sessionsPlayed: 0, totalScore: 0, bestScore: 0, lastPlayedAt: undefined };
      const playedAt = s.completedAt ? new Date(s.completedAt) : undefined;
      const lastPlayedAt = !prev.lastPlayedAt || (playedAt && playedAt > prev.lastPlayedAt) ? playedAt : prev.lastPlayedAt;

      map.set(key, {
        sessionsPlayed: prev.sessionsPlayed + 1,
        totalScore: prev.totalScore + (s.totalScore ?? 0),
        bestScore: Math.max(prev.bestScore, s.totalScore ?? 0),
        lastPlayedAt,
      });
    });

    return [...map.entries()]
      .map(([collegeId, v]) => ({ collegeId, ...v }))
      .sort((a, b) => b.bestScore - a.bestScore);
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(StorageService.TEAM_SESSIONS_KEY);
      localStorage.removeItem(StorageService.SOLO_RESULTS_KEY);
      localStorage.removeItem(StorageService.LOCKED_COLLEGES_KEY);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  clearTeamSessions(): void {
    try {
      localStorage.removeItem(StorageService.TEAM_SESSIONS_KEY);
    } catch (error) {
      console.error('Failed to clear team sessions:', error);
    }
  }

  private cleanupOldSessions(sessions: TeamSession[]): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - StorageService.MAX_AGE_DAYS);

    const filtered = sessions
      .filter(s => new Date(s.createdAt) > cutoffDate)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, StorageService.MAX_TEAM_SESSIONS);

    if (filtered.length < sessions.length) {
      localStorage.setItem(StorageService.TEAM_SESSIONS_KEY, JSON.stringify(filtered));
    }
  }

  private cleanupOldSoloResults(results: SoloResult[]): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - StorageService.MAX_AGE_DAYS);

    const filtered = results
      .filter(r => new Date(r.completedAt) > cutoffDate)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, StorageService.MAX_SOLO_RESULTS);

    if (filtered.length < results.length) {
      localStorage.setItem(StorageService.SOLO_RESULTS_KEY, JSON.stringify(filtered));
    }
  }
}

export const storageService = new StorageService();
