import React, { useState } from 'react';
import { GameState } from '../types';
import { SPELLS, EnhancedSpell } from '../constants';

interface DebugPanelProps {
  // State info
  gameState: GameState;
  gameMode: 'solo' | 'team';
  currentLevel: number;
  timeLeft: number;
  teamTimeLeft: number;
  pathProgress: number;
  magicIntensity: number;
  activeSpell: EnhancedSpell | undefined;
  activeQueueIndex: number;
  spellQueueLength: number;
  isPracticeMode: boolean;
  practiceSpellsCompleted: number;
  currentTeamPlayerName?: string;
  currentTeamPlayerScore?: number;
  
  // Debug state
  debugPaused: boolean;
  debugShowHand: boolean;
  
  // Handlers
  onTogglePause: () => void;
  onToggleShowHand: () => void;
  onTimeAdjust: (amount: number) => void;
  onResetProgress: () => void;
  onSetLevel: (level: number) => void;
  onApplySpell: (spellId: string, level: number) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  gameState,
  gameMode,
  currentLevel,
  timeLeft,
  teamTimeLeft,
  pathProgress,
  magicIntensity,
  activeSpell,
  activeQueueIndex,
  spellQueueLength,
  isPracticeMode,
  practiceSpellsCompleted,
  currentTeamPlayerName,
  currentTeamPlayerScore,
  debugPaused,
  debugShowHand,
  onTogglePause,
  onToggleShowHand,
  onTimeAdjust,
  onResetProgress,
  onSetLevel,
  onApplySpell,
}) => {
  const [debugSpellId, setDebugSpellId] = useState<string>(SPELLS[0].id);
  const [debugLevelInput, setDebugLevelInput] = useState<string>('1');

  const handleSetLevel = () => {
    const parsed = Number(debugLevelInput);
    if (Number.isFinite(parsed) && parsed > 0) {
      onSetLevel(Math.floor(parsed));
    }
  };

  const handleApplySpell = () => {
    const parsed = Number(debugLevelInput);
    const level = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : currentLevel;
    onApplySpell(debugSpellId, level);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9998] pointer-events-auto select-text">
      <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-3xl p-4 text-white w-[360px]">
        <div className="flex items-center justify-between mb-3">
          <div className="font-mono font-bold text-amber-200">DEBUG CONTROLS</div>
          <button
            onClick={onTogglePause}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
          >
            {debugPaused ? 'Resume' : 'Pause'}
          </button>
        </div>

        <button
          onClick={onToggleShowHand}
          className="w-full mb-3 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
        >
          Hand overlay: {debugShowHand ? 'ON' : 'OFF'}
        </button>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => onTimeAdjust(-5)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">-5s</button>
          <button onClick={() => onTimeAdjust(5)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">+5s</button>
          <button onClick={() => onTimeAdjust(-1)} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">Step -1s</button>
          <button onClick={onResetProgress} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">Reset progress</button>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Level</label>
          <div className="flex gap-2">
            <input
              value={debugLevelInput}
              onChange={(e) => setDebugLevelInput(e.target.value)}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none"
              inputMode="numeric"
            />
            <button onClick={handleSetLevel} className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-sm font-bold text-amber-200">Set</button>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Test spell</label>
          <select
            value={debugSpellId}
            onChange={(e) => setDebugSpellId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none"
          >
            {SPELLS.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleApplySpell}
          className="w-full px-4 py-3 rounded-2xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/30 text-sm font-black uppercase tracking-widest text-amber-100"
        >
          Apply & jump to PLAYING
        </button>

        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Game Info</div>
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-white/60">Mode:</span>
              <span className="text-white font-bold">{gameMode === 'team' ? 'TEAM' : 'SOLO'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">State:</span>
              <span className="text-white font-bold">{gameState}</span>
            </div>
            {gameMode === 'team' && currentTeamPlayerName && (
              <>
                <div className="flex justify-between">
                  <span className="text-white/60">Player:</span>
                  <span className="text-white font-bold">{currentTeamPlayerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Mode:</span>
                  <span className={`font-bold ${isPracticeMode ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isPracticeMode ? 'PRACTICE' : 'PLAYING'}
                  </span>
                </div>
                {isPracticeMode && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Practice:</span>
                    <span className="text-yellow-400 font-bold">{practiceSpellsCompleted}/3</span>
                  </div>
                )}
                {!isPracticeMode && currentTeamPlayerScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Score:</span>
                    <span className="text-green-400 font-bold">{currentTeamPlayerScore}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/60">Time:</span>
                  <span className="text-white font-bold">{teamTimeLeft}s</span>
                </div>
              </>
            )}
            {gameMode === 'solo' && (
              <div className="flex justify-between">
                <span className="text-white/60">Time:</span>
                <span className="text-white font-bold">{timeLeft}s</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/60">Spell:</span>
              <span className="text-white font-bold">{activeSpell?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Waypoints:</span>
              <span className="text-cyan-400 font-bold">
                {pathProgress}/{activeSpell?.waypoints.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Queue:</span>
              <span className="text-white font-bold">{activeQueueIndex + 1}/{spellQueueLength}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Intensity:</span>
              <span className="text-white font-bold">{Math.round(magicIntensity)}%</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-[11px] font-mono text-white/60">
          Press <span className="text-white">D</span> to toggle debug.
        </div>
      </div>
    </div>
  );
};
