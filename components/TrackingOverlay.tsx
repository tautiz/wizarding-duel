
import React, { useEffect, useRef } from 'react';
import { Spell } from '../types';
import { EnhancedSpell, getToleranceForDifficulty, SPELL_PATH_VISUALS } from '../constants';

interface TrackingOverlayProps {
  landmarks: any[][];
  targetSpell?: EnhancedSpell;
  difficulty: string;
  pathLineWidthPx?: number;
  debug?: boolean;
  debugShowHand?: boolean;
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

export const TrackingOverlay: React.FC<TrackingOverlayProps> = ({ landmarks, targetSpell, difficulty, pathLineWidthPx, debug = false, debugShowHand = false, debugInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<{x: number, y: number, life: number}[]>([]);
  const indicatorRef = useRef<{ x: number; y: number; morphT: number } | null>(null);
  const lastFrameMsRef = useRef<number | null>(null);
  const stateRef = useRef({ landmarks, targetSpell, difficulty, pathLineWidthPx, debug, debugShowHand, debugInfo });

  // Update logic Ref to keep animation loop clean
  useEffect(() => {
    stateRef.current = { landmarks, targetSpell, difficulty, pathLineWidthPx, debug, debugShowHand, debugInfo };
  }, [landmarks, targetSpell, difficulty, pathLineWidthPx, debug, debugShowHand, debugInfo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { landmarks, targetSpell, difficulty, pathLineWidthPx, debug, debugShowHand, debugInfo } = stateRef.current;
      const tolerance = getToleranceForDifficulty(difficulty);

      const nowMs = performance.now();
      const dtMs = lastFrameMsRef.current === null ? 16 : (nowMs - lastFrameMsRef.current);
      lastFrameMsRef.current = nowMs;
      const dt = Math.min(0.05, Math.max(0, dtMs / 1000));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (targetSpell) {
        // Draw ghost path
        const scaleX = canvas.width / 100;
        const scaleY = canvas.height / 100;
        const scaleForLineWidth = Math.max(scaleX, scaleY);

        ctx.save();
        ctx.scale(scaleX, scaleY);
        
        const path = new Path2D(targetSpell.gesturePath);

        const lineWidthPx = pathLineWidthPx ?? SPELL_PATH_VISUALS.lineWidthPx;

        const flowDashLengthPx = Math.max(6, lineWidthPx * 1.2);
        const flowDashGapPx = Math.max(8, lineWidthPx * 1.6);
        const flowSpeedPxPerSecond = Math.max(40, lineWidthPx * 3.2);

        // Flow layer (subtle dashed animation as instruction)
        ctx.save();
        ctx.strokeStyle = SPELL_PATH_VISUALS.flowColor;
        ctx.lineWidth = lineWidthPx / scaleForLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.setLineDash([
          flowDashLengthPx / scaleForLineWidth,
          flowDashGapPx / scaleForLineWidth,
        ]);
        const flowOffset = (nowMs / 1000) * (flowSpeedPxPerSecond / scaleForLineWidth);
        ctx.lineDashOffset = -flowOffset;
        ctx.stroke(path);
        ctx.restore();

        // Outline (thin border around the main stroke)
        ctx.strokeStyle = SPELL_PATH_VISUALS.outlineColor;
        ctx.lineWidth = (lineWidthPx + SPELL_PATH_VISUALS.outlineWidthPx * 2) / scaleForLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.setLineDash([]);
        ctx.stroke(path);

        // Main line
        ctx.strokeStyle = SPELL_PATH_VISUALS.lineColor;
        ctx.lineWidth = lineWidthPx / scaleForLineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.stroke(path);

        // Direction arrow for the active checkpoint (pulsing teardrop)
        const activeIdxRaw = debugInfo?.pathProgress ?? 0;
        const activeIdx = Math.max(0, Math.min(targetSpell.waypoints.length - 1, activeIdxRaw));
        const wFrom = targetSpell.waypoints[activeIdx];
        const wTo = targetSpell.waypoints[activeIdx + 1];
        if (wFrom) {
          if (!indicatorRef.current) {
            indicatorRef.current = { x: wFrom.x, y: wFrom.y, morphT: wTo ? 0 : 1 };
          }

          const followSpeed = 14;
          const alpha = 1 - Math.exp(-followSpeed * dt);
          indicatorRef.current.x = indicatorRef.current.x + (wFrom.x - indicatorRef.current.x) * alpha;
          indicatorRef.current.y = indicatorRef.current.y + (wFrom.y - indicatorRef.current.y) * alpha;

          const morphDurationSec = 0.28;
          const morphStep = morphDurationSec > 0 ? (dt / morphDurationSec) : 1;
          if (wTo) {
            indicatorRef.current.morphT = Math.max(0, indicatorRef.current.morphT - morphStep);
          } else {
            indicatorRef.current.morphT = Math.min(1, indicatorRef.current.morphT + morphStep);
          }

          const pulse = 1 + SPELL_PATH_VISUALS.startArrowPulseAmplitude * Math.sin(2 * Math.PI * SPELL_PATH_VISUALS.startArrowPulseSpeedHz * (nowMs / 1000));
          const arrowBaseSizePx = lineWidthPx * 3;
          const sizePx = arrowBaseSizePx * pulse;

          const circlePulse = 1 + (SPELL_PATH_VISUALS.startArrowPulseAmplitude * 0.65) * Math.sin(2 * Math.PI * SPELL_PATH_VISUALS.startArrowPulseSpeedHz * (nowMs / 1000));
          const circleRadiusPx = (lineWidthPx * 1.15) * circlePulse;

          const arrowAlpha = 1 - indicatorRef.current.morphT;
          const circleAlpha = indicatorRef.current.morphT;

          // Draw in pixel-space to avoid distortion when scaleX != scaleY.
          // IMPORTANT: at this point the context is still scaled (ctx.scale(scaleX, scaleY)),
          // so we temporarily reset the transform to identity.
          const indXpx = indicatorRef.current.x * scaleX;
          const indYpx = indicatorRef.current.y * scaleY;

          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);

          const drawTeardrop = (angleRad: number) => {
            // Normalized size in px; keep proportions constant regardless of segment length
            const r = sizePx * 0.45;
            const tip = sizePx * 1.05;
            const back = -sizePx * 0.55;
            const ctrl = sizePx * 0.35;

            ctx.save();
            ctx.translate(indXpx, indYpx);
            ctx.rotate(angleRad);
            ctx.beginPath();
            ctx.moveTo(tip, 0);
            ctx.bezierCurveTo(ctrl, r, back, r, back, 0);
            ctx.bezierCurveTo(back, -r, ctrl, -r, tip, 0);
            ctx.closePath();

            ctx.fillStyle = SPELL_PATH_VISUALS.startArrowColor;
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = SPELL_PATH_VISUALS.startArrowOutlineColor;
            ctx.stroke();
            ctx.restore();
          };

          if (circleAlpha > 0.001) {
            ctx.save();
            ctx.globalAlpha = circleAlpha;
            ctx.beginPath();
            ctx.arc(indXpx, indYpx, circleRadiusPx, 0, Math.PI * 2);
            ctx.fillStyle = SPELL_PATH_VISUALS.startArrowColor;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = SPELL_PATH_VISUALS.startArrowOutlineColor;
            ctx.stroke();
            ctx.restore();
          }

          if (wTo && arrowAlpha > 0.001) {
            const dxPx = (wTo.x - wFrom.x) * scaleX;
            const dyPx = (wTo.y - wFrom.y) * scaleY;
            const angle = Math.atan2(dyPx, dxPx);

            ctx.save();
            ctx.globalAlpha = arrowAlpha;
            drawTeardrop(angle);
            ctx.restore();
          }

          ctx.restore();
        }

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
      if (debug && debugShowHand) {
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

        // Hand visuals (debug-only)
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

        // Intentionally no cursor marker here: WandCursor is the single on-screen cursor.
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
