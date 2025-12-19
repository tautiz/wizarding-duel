
import React from 'react';

interface WandCursorProps {
  x: number;
  y: number;
  isPinching: boolean;
}

export const WandCursor: React.FC<WandCursorProps> = ({ x, y, isPinching }) => {
  if (x === 0 && y === 0) return null;

  return (
    <div 
      className="fixed pointer-events-none z-[9999] transition-transform duration-75 ease-out"
      style={{ 
        left: `${x * 100}%`, 
        top: `${y * 100}%`,
        transform: 'translate(-50%, -50%)' 
      }}
    >
      {/* Wand Tip Sparkle */}
      <div className={`relative flex items-center justify-center`}>
        <div className={`absolute w-8 h-8 rounded-full bg-amber-200 blur-md animate-pulse ${isPinching ? 'scale-150' : 'scale-100'}`} />
        <div className={`absolute w-4 h-4 rounded-full bg-white shadow-[0_0_15px_white] ${isPinching ? 'scale-125' : 'scale-100'}`} />
        
        {/* Particle Trail */}
        {!isPinching && (
          <div className="absolute w-12 h-12 border border-amber-500/30 rounded-full animate-ping" />
        )}
        
        {/* Pinch Click Effect */}
        {isPinching && (
          <div className="absolute inset-0">
             <div className="absolute w-16 h-16 -inset-4 border-2 border-white rounded-full animate-[ping_0.5s_ease-out_infinite]" />
             <div className="absolute w-1 h-16 -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-t from-transparent via-amber-200 to-transparent rotate-45" />
             <div className="absolute w-1 h-16 -top-8 left-1/2 -translate-x-1/2 bg-gradient-to-t from-transparent via-amber-200 to-transparent -rotate-45" />
          </div>
        )}
      </div>
      
      {/* Hand Prompt */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-amber-200 whitespace-nowrap uppercase tracking-widest font-bold border border-amber-500/30">
        {isPinching ? 'Pasirinkta' : 'Valdykite ranka'}
      </div>
    </div>
  );
};
