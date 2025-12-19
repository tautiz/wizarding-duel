
import React, { useEffect, useState } from 'react';

interface MagicEffectProps {
  color: string;
  side: 'left' | 'right';
  active: boolean;
  spellId?: string;
}

export const MagicEffect: React.FC<MagicEffectProps> = ({ color, side, active, spellId }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!visible) return null;

  const renderEffect = () => {
    switch (spellId) {
      case 'avada-kedavra':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full bg-green-500/30 blur-3xl animate-flash" />
            <div className="w-1 h-[200vh] bg-green-400 shadow-[0_0_50px_#2ecc71] rotate-[30deg] animate-pulse" />
          </div>
        );
      case 'incendio':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-orange-600 rounded-full blur-3xl animate-bomb-blast opacity-60" />
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-32 bg-gradient-to-t from-red-600 to-yellow-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        );
      case 'aguamenti':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-32 bg-blue-500/40 blur-2xl animate-slice-horizontal" />
            <div className="w-64 h-64 border-8 border-blue-200/50 rounded-full animate-ping" />
          </div>
        );
      case 'expecto-patronum':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full bg-white/40 blur-[100px] animate-flash" />
            <div className="w-96 h-96 border-4 border-white/20 rounded-full animate-[spin_10s_linear_infinite] shadow-[0_0_100px_white]" />
          </div>
        );
      case 'bombarda':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-orange-500 rounded-full animate-bomb-blast blur-2xl opacity-80" />
            <div className="w-32 h-32 bg-yellow-200 rounded-full animate-bomb-core blur-lg" />
          </div>
        );
      case 'protego':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="w-80 h-80 border-4 border-blue-400 rounded-xl animate-shield-pulse flex items-center justify-center bg-blue-500/10"
              style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, rgba(59, 130, 246, 0.2) 21%, transparent 22%)', backgroundSize: '15px 15px' }}
            >
              <div className="w-full h-full border-2 border-blue-200/30 rounded-lg animate-pulse" />
            </div>
          </div>
        );
      case 'lumos':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full bg-white/20 blur-3xl animate-flash" />
            <div className="w-20 h-20 bg-white rounded-full shadow-[0_0_100px_white] animate-pulse" />
          </div>
        );
      default:
        return (
          <div 
            className="w-48 h-48 rounded-full animate-ping"
            style={{ 
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              boxShadow: `0 0 50px ${color}`
            }}
          />
        );
    }
  };

  return (
    <div className={`absolute top-1/2 ${side === 'left' ? 'left-1/4' : 'right-1/4'} -translate-y-1/2 pointer-events-none z-50`}>
      {renderEffect()}
      <style>{`
        @keyframes bomb-blast {
          0% { transform: scale(0.1); opacity: 1; filter: blur(10px); }
          50% { transform: scale(1.5); opacity: 0.8; filter: blur(30px); }
          100% { transform: scale(2); opacity: 0; filter: blur(50px); }
        }
        @keyframes bomb-core {
          0% { transform: scale(0.1); opacity: 1; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes shield-pulse {
          0% { transform: scale(0.8); opacity: 0; }
          20% { opacity: 1; transform: scale(1.05); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.1); }
        }
        @keyframes slice-horizontal {
          0% { transform: scaleX(0); opacity: 0; }
          20% { transform: scaleX(1); opacity: 1; }
          100% { transform: scaleX(2); opacity: 0; }
        }
        @keyframes flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-bomb-blast { animation: bomb-blast 0.8s ease-out forwards; }
        .animate-bomb-core { animation: bomb-core 0.5s ease-out forwards; }
        .animate-shield-pulse { animation: shield-pulse 1.5s ease-in-out forwards; }
        .animate-slice-horizontal { animation: slice-horizontal 0.6s ease-out forwards; }
        .animate-flash { animation: flash 1s ease-out forwards; }
      `}</style>
    </div>
  );
};
