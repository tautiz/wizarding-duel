
import React from 'react';
import { Spell } from '../types';

interface SpellGuideProps {
  spell: Spell;
}

export const SpellGuide: React.FC<SpellGuideProps> = ({ spell }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl p-6 rounded-[2.5rem] border-4 border-[#d4af37] shadow-2xl max-w-[280px]">
      <div className="text-[#d4af37] text-xl uppercase tracking-widest mb-4 font-black wizard-font text-center leading-tight">
        {spell.gestureDescription}
      </div>
      
      <div className="relative w-48 h-48 bg-white/5 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/10">
        <svg viewBox="0 0 100 100" className="w-40 h-40">
          {/* Kelio fonas */}
          <path
            id="spell-path"
            d={spell.gesturePath}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          
          {/* Kibirkštis, kuri juda */}
          <circle r="5" fill="white">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path={spell.gesturePath}
              rotate="auto"
            />
          </circle>

          {/* Švytėjimas aplink kibirkštį */}
          <circle r="8" fill={spell.color} opacity="0.4">
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              path={spell.gesturePath}
              rotate="auto"
            />
          </circle>
        </svg>

        {/* Starto indikatorius */}
        <div className="absolute w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-ping opacity-70" style={{ left: '46%', top: '78%' }} />
      </div>

      <div className="mt-4 text-amber-100/70 text-xs italic text-center font-serif leading-relaxed px-2">
        {spell.description}
      </div>
    </div>
  );
};
