export interface LevelScoreInput {
  difficultyMultiplier: number;
  comboLength: number;
  timeLeftSeconds: number;
  basePoints?: number;
  comboPointsPerSpell?: number;
  timePointsPerSecond?: number;
}

export const calculateLevelScore = (input: LevelScoreInput): number => {
  const basePoints = input.basePoints ?? 100;
  const comboPointsPerSpell = input.comboPointsPerSpell ?? 50;
  const timePointsPerSecond = input.timePointsPerSecond ?? 2;

  const comboLength = Math.max(1, Math.floor(input.comboLength));
  const timeLeftSeconds = Math.max(0, Math.floor(input.timeLeftSeconds));
  const difficultyMultiplier = Number.isFinite(input.difficultyMultiplier) ? input.difficultyMultiplier : 1;

  const comboBonus = comboLength * comboPointsPerSpell;
  const speedBonus = timeLeftSeconds * timePointsPerSecond;

  const raw = (basePoints + comboBonus + speedBonus) * difficultyMultiplier;
  return Math.max(0, Math.round(raw));
};
