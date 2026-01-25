import React, { useEffect } from 'react';
import { TeamSession } from '../models/TeamGameState';
import { storageService } from '../services/storageService';

interface TeamResultsProps {
  session: TeamSession;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const TeamResults: React.FC<TeamResultsProps> = ({ 
  session, 
  onPlayAgain, 
  onBackToMenu 
}) => {
  useEffect(() => {
    const finalSession = {
      ...session,
      completedAt: new Date(),
    };
    storageService.saveTeamSession(finalSession);
  }, [session]);

  const sortedPlayers = [...session.players].sort((a, b) => b.score - a.score);
  const bestPlayer = sortedPlayers[0];
  const averageScore = Math.round(session.totalScore / session.players.length);
  const totalLevels = session.players.reduce((sum, p) => sum + p.levelsCompleted, 0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="z-20 parchment p-16 rounded-[5rem] text-center max-w-6xl border-[16px] border-double border-[#4a3728] shadow-2xl animate-in zoom-in duration-700">
      <h2 className="wizard-font text-6xl font-bold mb-4 text-[#2c1e14]">KOMANDOS REZULTATAI</h2>
      
      <div className="bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/10 p-8 rounded-[3rem] border-4 border-[#d4af37] mb-10">
        <p className="text-xl font-bold text-[#4a3728] uppercase tracking-widest mb-2">
          Bendras Komandos Rezultatas
        </p>
        <p className="wizard-font text-8xl font-black text-[#2c1e14]">
          {session.totalScore}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/40 p-4 rounded-2xl">
            <p className="text-sm font-bold text-[#4a3728] uppercase tracking-widest mb-1">
              Vidutinis rezultatas
            </p>
            <p className="text-3xl font-black text-[#2c1e14]">{averageScore}</p>
          </div>
          <div className="bg-white/40 p-4 rounded-2xl">
            <p className="text-sm font-bold text-[#4a3728] uppercase tracking-widest mb-1">
              Iš viso lygių
            </p>
            <p className="text-3xl font-black text-[#2c1e14]">{totalLevels}</p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-2xl font-bold text-[#2c1e14] mb-6 uppercase tracking-widest">
          Individualūs Rezultatai
        </h3>
        <div className="grid gap-3">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center justify-between bg-black/5 rounded-3xl px-8 py-5 border-2 transition-all ${
                player.id === bestPlayer.id
                  ? 'border-[#d4af37] bg-gradient-to-r from-[#d4af37]/20 to-transparent scale-105'
                  : 'border-[#4a3728]/20'
              }`}
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl ${
                  player.id === bestPlayer.id
                    ? 'bg-[#d4af37] text-white'
                    : 'bg-[#2c1e14] text-white'
                }`}>
                  {idx === 0 ? '🏆' : idx + 1}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-[#2c1e14] text-3xl">{player.name}</span>
                    {player.id === bestPlayer.id && (
                      <span className="px-3 py-1 bg-[#d4af37] text-white text-xs font-black rounded-full uppercase tracking-widest">
                        Geriausias
                      </span>
                    )}
                  </div>
                  <div className="flex gap-6 mt-2 text-sm font-bold text-[#4a3728]">
                    <span>Lygiai: {player.levelsCompleted}</span>
                    <span>Laikas: {formatTime(player.timeUsed)}</span>
                  </div>
                </div>
              </div>
              <div className="text-5xl font-black text-[#2c1e14] tabular-nums">
                {player.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-6 justify-center">
        <button
          onClick={onBackToMenu}
          className="px-12 py-6 rounded-full border-4 border-[#4a3728] bg-white/50 text-[#2c1e14] wizard-font font-black text-2xl hover:bg-white/80 transition-all hover:scale-105 active:scale-95"
        >
          MENIU
        </button>
        <button
          onClick={onPlayAgain}
          className="wizard-font bg-[#2c1e14] text-white px-20 py-6 rounded-full text-3xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-[#d4af37]"
        >
          ŽAISTI DAR KARTĄ
        </button>
      </div>
    </div>
  );
};
