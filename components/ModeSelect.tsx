import React from 'react';

interface ModeSelectProps {
  onSelectSolo: () => void;
  onSelectTeam: () => void;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({ onSelectSolo, onSelectTeam }) => {
  return (
    <div className="z-20 parchment p-16 rounded-[3rem] text-center shadow-2xl max-w-5xl animate-in zoom-in duration-700">
      <h1 className="wizard-font text-6xl font-bold mb-12 text-[#2c1e14]">PASIRINKITE REŽIMĄ</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <button
          onClick={onSelectSolo}
          className="group relative bg-gradient-to-br from-[#2c1e14] to-[#4a3728] p-12 rounded-[3rem] border-4 border-[#d4af37] shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <div className="absolute inset-0 bg-[#d4af37]/10 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-7xl mb-6">⚔️</div>
            <h2 className="wizard-font text-4xl font-black text-[#f4e4bc] mb-4">SOLO</h2>
            <p className="text-lg text-[#f4e4bc]/80 leading-relaxed">
              Vienas žaidėjas prieš laiką.<br />
              Tobulėk ir gerink savo rezultatus!
            </p>
          </div>
        </button>

        <button
          onClick={onSelectTeam}
          className="group relative bg-gradient-to-br from-[#2c1e14] to-[#4a3728] p-12 rounded-[3rem] border-4 border-[#d4af37] shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <div className="absolute inset-0 bg-[#d4af37]/10 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="text-7xl mb-6">🏆</div>
            <h2 className="wizard-font text-4xl font-black text-[#f4e4bc] mb-4">KOMANDA</h2>
            <p className="text-lg text-[#f4e4bc]/80 leading-relaxed">
              Iki 5 žaidėjų komandoje.<br />
              Varžykitės ir siektie bendro tikslo!
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
