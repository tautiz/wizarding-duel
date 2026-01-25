import React, { useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { DIFFICULTIES } from '../constants';

interface TeamSetupProps {
  onStartTeam: (playerNames: string[], totalTime: number, difficulty: string) => void;
  onBack: () => void;
}

export const TeamSetup: React.FC<TeamSetupProps> = ({ onStartTeam, onBack }) => {
  const [playerCount, setPlayerCount] = useState(2);
  const [totalTime, setTotalTime] = useState(300);
  const [difficulty, setDifficulty] = useState('medium');
  const [playerNames, setPlayerNames] = useState<string[]>([]);

  const handleNameReceived = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    if (playerNames.length > count) {
      setPlayerNames(playerNames.slice(0, count));
    }
  };

  const allNamesEntered = playerNames.filter(n => n && n.trim()).length === playerCount;
  const timePerPlayer = Math.floor(totalTime / playerCount);

  const handleStart = () => {
    if (allNamesEntered) {
      onStartTeam(playerNames.filter(n => n && n.trim()), totalTime, difficulty);
    }
  };

  return (
    <div className="z-20 parchment p-6 rounded-[3rem] w-full max-w-5xl shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-[#f4e4bc] pb-2 z-10">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-[#4a3728]/20 text-[#2c1e14] border-2 border-[#4a3728]/30 font-bold hover:bg-[#4a3728]/30 transition-all text-sm"
        >
          ← Atgal
        </button>
        <h2 className="wizard-font text-2xl text-center font-bold uppercase tracking-widest">
          Komandos Registracija
        </h2>
        <div className="w-24" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/10 p-4 rounded-2xl border border-[#4a3728]/20">
          <h3 className="font-bold mb-3 text-lg font-serif text-[#2c1e14]">LYGIS</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(DIFFICULTIES).map(([id, cfg]) => (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                className={`py-2 rounded-lg font-bold border-2 transition-all text-sm ${
                  difficulty === id
                    ? 'bg-[#2c1e14] text-white border-[#d4af37]'
                    : 'bg-white/50 text-[#2c1e14] border-transparent hover:bg-white/80'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-black/10 p-4 rounded-2xl border border-[#4a3728]/20">
          <h3 className="font-bold mb-3 text-lg font-serif text-[#2c1e14]">ŽAIDĖJAI</h3>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => handlePlayerCountChange(n)}
                className={`py-2 rounded-lg font-bold border-2 transition-all text-sm ${
                  playerCount === n
                    ? 'bg-[#2c1e14] text-white border-[#d4af37]'
                    : 'bg-white/50 text-[#2c1e14] border-transparent hover:bg-white/80'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-black/10 p-4 rounded-2xl border border-[#4a3728]/20 col-span-2">
          <h3 className="font-bold mb-3 text-lg font-serif text-[#2c1e14]">BENDRAS LAIKAS</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-center mb-2">
                <span className="text-3xl font-black text-[#2c1e14]">{Math.floor(totalTime / 60)}</span>
                <span className="text-lg font-bold text-[#4a3728]"> min</span>
              </div>
              <input
                type="range"
                min="60"
                max="600"
                step="30"
                value={totalTime}
                onChange={(e) => setTotalTime(Number(e.target.value))}
                className="w-full accent-[#2c1e14]"
              />
            </div>
            <div className="bg-white/50 p-3 rounded-xl border border-[#4a3728]/20">
              <p className="text-xs font-bold text-[#4a3728] uppercase tracking-widest mb-1">
                Per žaidėją
              </p>
              <p className="text-xl font-black text-[#2c1e14]">
                {Math.floor(timePerPlayer / 60)}:{(timePerPlayer % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-black/10 p-4 rounded-2xl border border-[#4a3728]/20 mb-4">
        <h3 className="font-bold mb-3 text-lg font-serif text-[#2c1e14]">ŽAIDĖJŲ VARDAI</h3>
        <div className="flex flex-col gap-3 max-h-[280px] overflow-y-auto custom-scrollbar pr-2">
          {Array.from({ length: playerCount }).map((_, idx) => (
            <VoiceInput
              key={idx}
              playerNumber={idx + 1}
              existingName={playerNames[idx]}
              onNameReceived={(name) => handleNameReceived(idx, name)}
            />
          ))}
        </div>
        
        {!allNamesEntered && (
          <div className="mt-3 text-center text-xs text-[#4a3728] italic">
            Įveskite visų žaidėjų vardus, kad galėtumėte pradėti
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={!allNamesEntered}
        className="w-full wizard-font bg-[#2c1e14] text-white py-4 rounded-full text-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {allNamesEntered ? 'PRADĖTI DVIKOVĄ' : 'ĮVESKITE VARDUS'}
      </button>
    </div>
  );
};
