
import React, { useEffect, useRef } from 'react';
import { Spell } from '../types';
import { EnhancedSpell } from '../constants';

interface TrackingOverlayProps {
  landmarks: any[][];
  targetSpell?: EnhancedSpell;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const TrackingOverlay: React.FC<TrackingOverlayProps> = ({ landmarks, targetSpell, difficulty }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{x: number, y: number, life: number}[]>([]);
  const stateRef = useRef({ landmarks, targetSpell, difficulty });

  // Update logic Ref to keep animation loop clean
  useEffect(() => {
    stateRef.current = { landmarks, targetSpell, difficulty };
  }, [landmarks, targetSpell, difficulty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { landmarks, targetSpell, difficulty } = stateRef.current;
      const tolerance = difficulty === 'easy' ? 20 : difficulty === 'medium' ? 15 : 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (targetSpell) {
        // Draw ghost path
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(3, 3);
        ctx.translate(-50, -50);
        
        const path = new Path2D(targetSpell.gesturePath);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
        ctx.lineWidth = 4;
        ctx.stroke(path);

        // Draw Waypoints
        targetSpell.waypoints.forEach((wp, idx) => {
          ctx.beginPath();
          const visualRadius = tolerance / 3; 
          ctx.arc(wp.x, wp.y, visualRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 175, 55, ${0.1 + (idx * 0.1)})`;
          ctx.fill();
          
          if (idx === 0) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        });

        ctx.restore();
      }

      // Trail update
      trailRef.current = trailRef.current
        .map(p => ({ ...p, life: p.life - 0.03 }))
        .filter(p => p.life > 0);

      trailRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6 * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = targetSpell?.color || 'white';
        ctx.fill();
      });

      // Hand visuals
      if (landmarks && landmarks.length > 0) {
        const win = window as any;
        const drawConnectors = win.drawConnectors;
        const HAND_CONNECTIONS = win.HAND_CONNECTIONS;

        landmarks.forEach((hand) => {
          const indexTip = hand[8];
          if (indexTip) {
            trailRef.current.push({
              x: indexTip.x * canvas.width,
              y: indexTip.y * canvas.height,
              life: 1.0
            });

            ctx.beginPath();
            ctx.arc(indexTip.x * canvas.width, indexTip.y * canvas.height, 10, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'white';
            ctx.fill();
          }

          if (drawConnectors && HAND_CONNECTIONS) {
            drawConnectors(ctx, hand, HAND_CONNECTIONS, {
              color: 'rgba(212, 175, 55, 0.15)',
              lineWidth: 1,
            });
          }
        });
      }

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []); // Run loop once, it uses stateRef

  return (
    <canvas 
      ref={canvasRef} 
      width={1280} 
      height={720} 
      className="absolute inset-0 w-full h-full pointer-events-none z-10 scale-x-[-1]"
    />
  );
};
