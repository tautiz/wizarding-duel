
import React, { useEffect, useRef } from 'react';
import { Spell } from '../types';
import { EnhancedSpell, getToleranceForDifficulty } from '../constants';

interface TrackingOverlayProps {
  landmarks: any[][];
  targetSpell?: EnhancedSpell;
  difficulty: 'easy' | 'medium' | 'hard';
  debug?: boolean;
  debugInfo?: {
    gameState: string;
    level: number;
    spellId?: string;
    spellName?: string;
    pathProgress: number;
    queueIndex: number;
    queueLength: number;
    timeLeft: number;
    tolerance: number;
    cursorPos: { x: number; y: number };
    isPinching: boolean;
    lastDistance: number | null;
  };
}

export const TrackingOverlay: React.FC<TrackingOverlayProps> = ({ landmarks, targetSpell, difficulty, debug = false, debugInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{x: number, y: number, life: number}[]>([]);
  const stateRef = useRef({ landmarks, targetSpell, difficulty, debug, debugInfo });

  // Update logic Ref to keep animation loop clean
  useEffect(() => {
    stateRef.current = { landmarks, targetSpell, difficulty, debug, debugInfo };
  }, [landmarks, targetSpell, difficulty, debug, debugInfo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { landmarks, targetSpell, difficulty, debug, debugInfo } = stateRef.current;
      const tolerance = getToleranceForDifficulty(difficulty);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (targetSpell) {
        // Draw ghost path
        const scaleX = canvas.width / 100;
        const scaleY = canvas.height / 100;
        const scaleForLineWidth = Math.max(scaleX, scaleY);

        ctx.save();
        ctx.scale(scaleX, scaleY);
        
        const path = new Path2D(targetSpell.gesturePath);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
        ctx.lineWidth = 4 / scaleForLineWidth;
        ctx.stroke(path);

        // Draw Waypoints
        targetSpell.waypoints.forEach((wp, idx) => {
          ctx.beginPath();
          const visualRadius = (tolerance / 3) / scaleForLineWidth;
          ctx.arc(wp.x, wp.y, visualRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(212, 175, 55, ${0.1 + (idx * 0.1)})`;
          ctx.fill();
          
          if (idx === 0) {
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1 / scaleForLineWidth;
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

      if (debug && targetSpell) {
        const activeIdx = Math.max(0, Math.min(targetSpell.waypoints.length - 1, (debugInfo?.pathProgress ?? 0)));

        // Waypoints
        targetSpell.waypoints.forEach((wp, idx) => {
          const x = (wp.x / 100) * canvas.width;
          const y = (wp.y / 100) * canvas.height;

          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;
          const baseRadius = isActive ? 10 : 7;

          ctx.save();

          // tolerance ring for active waypoint
          if (isActive) {
            ctx.beginPath();
            const tolX = (tolerance / 100) * canvas.width;
            const tolY = (tolerance / 100) * canvas.height;
            ctx.ellipse(x, y, tolX, tolY, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          ctx.beginPath();
          ctx.arc(x, y, baseRadius, 0, Math.PI * 2);
          ctx.fillStyle = isDone ? 'rgba(34,197,94,0.9)' : isActive ? 'rgba(250,204,21,0.95)' : 'rgba(148,163,184,0.65)';
          ctx.shadowBlur = isActive ? 18 : 8;
          ctx.shadowColor = isDone ? 'rgba(34,197,94,1)' : isActive ? 'rgba(250,204,21,1)' : 'rgba(148,163,184,1)';
          ctx.fill();

          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(0,0,0,0.6)';
          ctx.stroke();

          // index label
          ctx.font = 'bold 12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(idx + 1), x, y);

          ctx.restore();
        });

        // Cursor marker + distance
        if (debugInfo) {
          const cx = debugInfo.cursorPos.x * canvas.width;
          const cy = debugInfo.cursorPos.y * canvas.height;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fillStyle = debugInfo.isPinching ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)';
          ctx.fill();
          ctx.restore();
        }
      }

      requestAnimationFrame(render);
    };

    const animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []); // Run loop once, it uses stateRef

  return (
    <>
      <canvas 
        ref={canvasRef} 
        width={1280} 
        height={720} 
        className="absolute inset-0 w-full h-full pointer-events-none z-10 scale-x-[-1]"
      />
      {debug && debugInfo && (
        <div className="absolute top-6 right-6 z-50 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-[12px] leading-relaxed font-mono text-white max-w-[360px]">
            <div className="font-bold text-amber-200">DEBUG</div>
            <div>state: {debugInfo.gameState}</div>
            <div>level: {debugInfo.level}</div>
            <div>spell: {debugInfo.spellName} ({debugInfo.spellId})</div>
            <div>queue: {debugInfo.queueIndex + 1}/{debugInfo.queueLength}</div>
            <div>progress: {debugInfo.pathProgress}</div>
            <div>tolerance: {debugInfo.tolerance}</div>
            <div>timeLeft: {debugInfo.timeLeft}s</div>
            <div>cursor: {debugInfo.cursorPos.x.toFixed(3)}, {debugInfo.cursorPos.y.toFixed(3)}</div>
            <div>pinch: {debugInfo.isPinching ? 'true' : 'false'}</div>
            <div>distToWp: {debugInfo.lastDistance === null ? 'n/a' : debugInfo.lastDistance.toFixed(2)}</div>
          </div>
        </div>
      )}
    </>
  );
};
