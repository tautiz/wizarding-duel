import React from 'react';
import { TeamPlayer } from '../models/TeamPlayer';

interface TeamPracticeModeProps {
  player: TeamPlayer;
  onComplete: () => void;
  onSkip: () => void;
}

export const TeamPracticeMode: React.FC<TeamPracticeModeProps> = ({ 
  player, 
  onComplete,
  onSkip 
}) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="parchment p-12 rounded-[4rem] max-w-2xl border-[12px] border-double shadow-2xl text-center animate-in zoom-in duration-500">
        <div className="text-5xl mb-6">🎯</div>
        
        <h2 className="wizard-font text-5xl font-black text-[#2c1e14] mb-4">
          {player.name}
        </h2>
        
        <div className="bg-[#d4af37]/20 p-5 rounded-3xl border-2 border-[#d4af37] mb-6">
          <p className="text-xl font-bold text-[#2c1e14] mb-2">
            3 pratybų burtai
          </p>
          <p className="text-base text-[#4a3728] leading-relaxed">
            Taškai <strong>neskaičiuojami</strong>. Po trijų burtų<br />
            automatiškai prasidės žaidimas su taškų skaičiavimu.
          </p>
        </div>

        <div className="bg-black/5 p-4 rounded-2xl mb-6">
          <p className="text-xs font-bold text-[#4a3728] uppercase tracking-widest mb-2">
            Valdymas
          </p>
          <ul className="text-left text-[#2c1e14] text-sm space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-lg">👆</span>
              <span>Rodomasis pirštas - sekti kelią</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🤏</span>
              <span>Suspausti pirštus - spausti mygtukus</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">⏱️</span>
              <span>Laikas ribotas - judėkite greitai!</span>
            </li>
          </ul>
        </div>

        <button
          onClick={onComplete}
          className="wizard-font w-full px-16 py-5 rounded-full bg-[#2c1e14] text-[#f4e4bc] font-black text-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all border-4 border-[#d4af37]"
        >
          PRADĖTI PRATYBAS
        </button>
      </div>
    </div>
  );
};
