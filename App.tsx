
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GameState, Player, GameConfig, Spell, WIZARD_NAMES } from './types';
import { SPELLS, SYSTEM_INSTRUCTION, SOUNDS, EnhancedSpell, getToleranceForDifficulty } from './constants';
import { MagicEffect } from './components/MagicEffect';
import { SpellGuide } from './components/SpellGuide';
import { TrackingOverlay } from './components/TrackingOverlay';
import { WandCursor } from './components/WandCursor';
import { encode, decode, decodeAudioData } from './services/audioUtils';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LANDING);
  const [config, setConfig] = useState<GameConfig>({ voiceEnabled: false, playerCount: 1, difficulty: 'medium' });
  const [players, setPlayers] = useState<Player[]>([{ id: 1, name: 'Haris', score: 0 }]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [spellQueue, setSpellQueue] = useState<EnhancedSpell[]>([SPELLS[0]]);
  const [activeQueueIndex, setActiveQueueIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeEffects, setActiveEffects] = useState({p1: false, p2: false});
  const [statusMessage, setStatusMessage] = useState<string>("Pasiruoškite dvikovai!");
  const [handLandmarks, setHandLandmarks] = useState<any[][]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 });
  const [isPinching, setIsPinching] = useState(false);
  const [magicIntensity, setMagicIntensity] = useState(0);
  const [isLevelSuccess, setIsLevelSuccess] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLastDistance, setDebugLastDistance] = useState<number | null>(null);
  const [debugPaused, setDebugPaused] = useState(false);
  const [debugSpellId, setDebugSpellId] = useState<string>(SPELLS[0].id);
  const [debugLevelInput, setDebugLevelInput] = useState<string>('1');

  const activeSpell = spellQueue[activeQueueIndex];
  const tolerance = getToleranceForDifficulty(config.difficulty);

  // Refs for tracking and stability
  const gameStateRef = useRef(gameState);
  const currentSpellRef = useRef<EnhancedSpell>(spellQueue[0]);
  const pathProgressRef = useRef(pathProgress);
  const isLevelSuccessRef = useRef(isLevelSuccess);
  const configRef = useRef(config);
  const activeQueueIndexRef = useRef(0);
  const spellQueueRef = useRef<EnhancedSpell[]>(spellQueue);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qs = params.get('debug');
    if (qs === '1' || qs === 'true') {
      setDebugMode(true);
      return;
    }
    try {
      const saved = window.localStorage.getItem('wd_debug');
      if (saved === '1') setDebugMode(true);
    } catch {}
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebugMode(prev => {
          const next = !prev;
          try { window.localStorage.setItem('wd_debug', next ? '1' : '0'); } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    setDebugLevelInput(String(currentLevel));
  }, [currentLevel]);

  useEffect(() => {
    if (activeSpell?.id) setDebugSpellId(activeSpell.id);
  }, [activeSpell?.id]);

  // Sync refs to avoid stale closures in the frame loop
  useEffect(() => {
    gameStateRef.current = gameState;
    currentSpellRef.current = spellQueue[activeQueueIndex];
    pathProgressRef.current = pathProgress;
    isLevelSuccessRef.current = isLevelSuccess;
    configRef.current = config;
    activeQueueIndexRef.current = activeQueueIndex;
    spellQueueRef.current = spellQueue;
  }, [gameState, spellQueue, activeQueueIndex, pathProgress, isLevelSuccess, config]);

  // Audio Preload
  useEffect(() => {
    Object.entries(SOUNDS).forEach(([key, url]) => {
      audioRefs.current[key] = new Audio(url);
      audioRefs.current[key].volume = 0.3;
    });
  }, []);

  const playSound = (key: string) => {
    const s = audioRefs.current[key];
    if (s) { s.currentTime = 0; s.play().catch(() => {}); }
  };

  const generateSpellQueue = (level: number) => {
    // Increase combo length every 3 levels
    const queueSize = Math.min(5, Math.floor((level - 1) / 3) + 1);
    const newQueue: EnhancedSpell[] = [];
    for (let i = 0; i < queueSize; i++) {
      let randomSpell;
      do {
        randomSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];
      } while (newQueue.length > 0 && randomSpell.id === newQueue[newQueue.length - 1].id);
      newQueue.push(randomSpell);
    }
    return newQueue;
  };

  const handleLevelComplete = useCallback(() => {
    if (isLevelSuccessRef.current) return;
    setIsLevelSuccess(true);
    isLevelSuccessRef.current = true;
    
    const mult = configRef.current.difficulty === 'easy' ? 1 : configRef.current.difficulty === 'medium' ? 1.5 : 2;
    const comboBonus = spellQueueRef.current.length * 50;
    setPlayers(p => p.map(x => ({ ...x, score: x.score + Math.round((100 * mult) + comboBonus) })));
    setActiveEffects({ p1: true, p2: false });
    setStatusMessage("GRANDINĖ UŽBAIGTA!");
    playSound('success');
  }, []);

  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      setHandLandmarks(results.multiHandLandmarks);
      
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      const x = 1 - indexTip.x;
      const y = indexTip.y;
      setCursorPos({ x, y });

      const dist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
      const pinching = dist < 0.08;
      setIsPinching(pinching);

      // GAMEPLAY logic
      if (gameStateRef.current === GameState.PLAYING && !isLevelSuccessRef.current) {
        const spell = currentSpellRef.current;
        if (!spell) return;
        
        const currentWp = spell.waypoints[pathProgressRef.current];
        if (currentWp) {
          const hX = indexTip.x * 100;
          const hY = indexTip.y * 100;
          const d = Math.sqrt(Math.pow(hX - currentWp.x, 2) + Math.pow(hY - currentWp.y, 2));
          const tolerance = getToleranceForDifficulty(configRef.current.difficulty);

          setDebugLastDistance(d);
          
          if (d < tolerance) {
            const nextIdx = pathProgressRef.current + 1;
            setPathProgress(nextIdx);
            pathProgressRef.current = nextIdx;
            setMagicIntensity((nextIdx / spell.waypoints.length) * 100);
            playSound('swish');
            
            // Check if current spell finished
            if (nextIdx >= spell.waypoints.length) {
              const nextQueueIdx = activeQueueIndexRef.current + 1;
              if (nextQueueIdx < spellQueueRef.current.length) {
                // Move to next spell in COMBO
                setActiveQueueIndex(nextQueueIdx);
                setPathProgress(0);
                pathProgressRef.current = 0;
                setMagicIntensity(0);
                setStatusMessage("TĘSKITE GRANDINĘ!");
                playSound('success');
              } else {
                // Entire queue finished
                handleLevelComplete();
              }
            }
          }
        }
      }

      // INTERACTION logic (Pinch to click)
      if (pinching && !(window as any)._isPunched) {
        (window as any)._isPunched = true;
        const cx = x * window.innerWidth;
        const cy = y * window.innerHeight;

        if (isLevelSuccessRef.current && nextButtonRef.current) {
          const r = nextButtonRef.current.getBoundingClientRect();
          if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
            nextButtonRef.current.click();
          }
        } else {
          const target = document.elementFromPoint(cx, cy);
          if (target instanceof HTMLElement) target.click();
        }
        setTimeout(() => (window as any)._isPunched = false, 800);
      }
    } else {
      setHandLandmarks([]);
      setIsPinching(false);
    }
  }, [handleLevelComplete]);

  useEffect(() => {
    let active = true;
    const initTracking = async () => {
      if (!(window as any).Hands) return;
      const hands = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      hands.setOptions({
        maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
      });
      hands.onResults((res: any) => { if (active) onResults(res); });
      handsRef.current = hands;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            const processFrame = async () => {
              if (active && videoRef.current && videoRef.current.readyState >= 2) {
                try { await hands.send({ image: videoRef.current }); } catch (err) {}
              }
              animationFrameRef.current = requestAnimationFrame(processFrame);
            };
            animationFrameRef.current = requestAnimationFrame(processFrame);
          };
        }
      } catch (err) {}
    };
    initTracking();
    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (handsRef.current) handsRef.current.close();
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onResults]);

  const startGame = () => {
    const s = config.difficulty === 'easy' ? 45 : config.difficulty === 'medium' ? 30 : 20;
    setPlayers([{ id: 1, name: players[0].name, score: 0 }]);
    setCurrentLevel(1);
    const initialQueue = [SPELLS[0]];
    setSpellQueue(initialQueue);
    setActiveQueueIndex(0);
    setTimeLeft(s);
    setMagicIntensity(0);
    setPathProgress(0);
    setIsLevelSuccess(false);
    setGameState(GameState.PLAYING);
    setStatusMessage("Atlikite burtą!");
    playSound('swish');
  };

  const nextLvl = () => {
    setIsLevelSuccess(false);
    const newLevel = currentLevel + 1;
    const newQueue = generateSpellQueue(newLevel);
    
    setSpellQueue(newQueue);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    setCurrentLevel(newLevel);
    
    // Add time based on combo length
    const timeBonus = newQueue.length * 8;
    setTimeLeft(t => Math.min(120, t + timeBonus));
    setStatusMessage(newQueue.length > 1 ? "PASIRUOŠKITE KOMBINACIJAI!" : "Atlikite burtą!");
    playSound('swish');
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING && !isLevelSuccess && !debugPaused) {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { setGameState(GameState.RESULTS); clearInterval(timer); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, isLevelSuccess, debugPaused]);

  const applyDebugSpell = () => {
    const chosen = SPELLS.find(s => s.id === debugSpellId);
    if (!chosen) return;

    setGameState(GameState.PLAYING);
    gameStateRef.current = GameState.PLAYING;

    setCurrentLevel(prev => {
      const parsed = Number(debugLevelInput);
      return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : prev;
    });

    setSpellQueue([chosen]);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    setIsLevelSuccess(false);
    setStatusMessage('Atlikite burtą!');

    activeQueueIndexRef.current = 0;
    pathProgressRef.current = 0;
    isLevelSuccessRef.current = false;
    spellQueueRef.current = [chosen];
    currentSpellRef.current = chosen;
  };

  const applyDebugLevelOnly = () => {
    const parsed = Number(debugLevelInput);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setCurrentLevel(Math.floor(parsed));
  };

  const resetDebugProgress = () => {
    setPathProgress(0);
    setMagicIntensity(0);
    setIsLevelSuccess(false);
    setStatusMessage('Atlikite burtą!');
    pathProgressRef.current = 0;
    isLevelSuccessRef.current = false;
  };

  return (
    <div className="min-h-screen bg-[#05050a] text-[#f4e4bc] relative flex flex-col items-center justify-center cursor-none select-none overflow-hidden">
      <video ref={videoRef} className={`fixed inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${gameState === GameState.PLAYING ? 'opacity-40' : 'opacity-20'}`} playsInline muted />
      <WandCursor x={cursorPos.x} y={cursorPos.y} isPinching={isPinching} />

      {debugMode && (
        <div className="fixed bottom-6 left-6 z-[9998] pointer-events-auto cursor-auto select-text">
          <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-3xl p-4 text-white w-[360px]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono font-bold text-amber-200">DEBUG CONTROLS</div>
              <button
                onClick={() => setDebugPaused(p => !p)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
              >
                {debugPaused ? 'Resume' : 'Pause'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button onClick={() => setTimeLeft(t => Math.max(0, t - 5))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">-5s</button>
              <button onClick={() => setTimeLeft(t => Math.min(999, t + 5))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">+5s</button>
              <button onClick={() => setTimeLeft(t => Math.max(0, t - 1))} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">Step -1s</button>
              <button onClick={resetDebugProgress} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold">Reset progress</button>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Level</label>
              <div className="flex gap-2">
                <input
                  value={debugLevelInput}
                  onChange={(e) => setDebugLevelInput(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                  inputMode="numeric"
                />
                <button onClick={applyDebugLevelOnly} className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-sm font-bold text-amber-200">Set</button>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Test spell</label>
              <select
                value={debugSpellId}
                onChange={(e) => setDebugSpellId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none"
              >
                {SPELLS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={applyDebugSpell}
              className="w-full px-4 py-3 rounded-2xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/30 text-sm font-black uppercase tracking-widest text-amber-100"
            >
              Apply & jump to PLAYING
            </button>

            <div className="mt-3 text-[11px] font-mono text-white/60">
              Press <span className="text-white">D</span> to toggle debug.
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.LANDING && (
        <div className="z-20 parchment p-16 rounded-[3rem] text-center shadow-2xl max-w-2xl animate-in zoom-in duration-700">
          <h1 className="wizard-font text-7xl font-bold mb-8 text-[#2c1e14]">MAGIŠKA DVIKOVA</h1>
          <p className="text-xl italic mb-12 text-[#4a3728] font-serif leading-relaxed">Valdykite lazdelę ranka. Suspauskite pirštus pasirinkimui.<br/>Aukštesniuose lygiuose junkite burtus į grandines!</p>
          <button onClick={() => setGameState(GameState.SETUP)} className="wizard-font bg-[#2c1e14] text-[#f4e4bc] px-16 py-6 rounded-full text-3xl font-black hover:scale-110 transition-all border-4 border-[#4a3728] active:scale-95">PRADĖTI</button>
        </div>
      )}

      {gameState === GameState.SETUP && (
        <div className="z-20 parchment p-12 rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in slide-in-from-bottom duration-500">
          <h2 className="wizard-font text-4xl text-center mb-8 font-bold uppercase tracking-widest">Burtininko Registracija</h2>
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="bg-black/10 p-6 rounded-3xl border border-[#4a3728]/20">
              <h3 className="font-bold mb-4 text-xl font-serif text-[#2c1e14]">LYGIS</h3>
              <div className="flex flex-col gap-3">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button key={d} onClick={() => setConfig({...config, difficulty: d})} className={`py-3 rounded-xl font-bold border-2 transition-all ${config.difficulty === d ? 'bg-[#2c1e14] text-white border-[#d4af37]' : 'bg-white/50 text-[#2c1e14] border-transparent hover:bg-white/80'}`}>{d === 'easy' ? 'Mokinys' : d === 'medium' ? 'Burtininkas' : 'Aurotas'}</button>
                ))}
              </div>
            </div>
            <div className="bg-black/10 p-6 rounded-3xl border border-[#4a3728]/20">
              <h3 className="font-bold mb-4 text-xl font-serif text-[#2c1e14]">VARDAS</h3>
              <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {WIZARD_NAMES.map(n => (
                  <button key={n} onClick={() => setPlayers([{...players[0], name: n}])} className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${players[0].name === n ? 'bg-[#2c1e14] text-white' : 'bg-white/50 text-[#2c1e14]'}`}>{n}</button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={startGame} className="w-full wizard-font bg-[#2c1e14] text-white py-6 rounded-full text-4xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all">PRADĖTI DVIKOVĄ</button>
        </div>
      )}

      {gameState === GameState.PLAYING && (
        <div className="z-20 w-full h-full flex flex-col p-6 items-center justify-between">
          <div className="w-full max-w-7xl flex justify-between items-start">
            <div className="parchment px-8 py-3 rounded-2xl border-4 border-[#4a3728] shadow-2xl">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{players[0].name}</p>
              <p className="text-4xl font-black tabular-nums">{players[0].score}</p>
            </div>
            
            <div className="flex flex-col items-center">
              {/* COMBO SEQUENCE UI */}
              <div className="flex gap-2 mb-4">
                {spellQueue.map((spell, idx) => (
                  <div key={idx} className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${idx === activeQueueIndex ? 'bg-[#d4af37] text-black border-white scale-110 shadow-[0_0_20px_gold]' : idx < activeQueueIndex ? 'bg-green-800 text-white border-green-400 opacity-50' : 'bg-black/60 text-white/40 border-white/20'}`}>
                    <span className="wizard-font font-bold text-lg">{spell.name}</span>
                    {idx < activeQueueIndex && <span className="text-xl">✓</span>}
                  </div>
                ))}
              </div>
              <div className={`px-10 py-2 rounded-full font-mono text-3xl font-bold shadow-xl border-2 border-[#d4af37] ${timeLeft < 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2c1e14] text-[#f4e4bc]'}`}>
                {timeLeft}s
              </div>
            </div>

            <div className="parchment px-8 py-3 rounded-2xl border-4 border-[#4a3728] shadow-2xl text-center">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Lygis</p>
              <p className="text-4xl font-black tabular-nums">{currentLevel}</p>
            </div>
          </div>

          <div className="relative w-full max-w-6xl aspect-video rounded-[4rem] border-[16px] border-[#2c1e14] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black/40">
            <TrackingOverlay
              landmarks={handLandmarks}
              targetSpell={isLevelSuccess ? undefined : activeSpell}
              difficulty={config.difficulty}
              debug={debugMode}
              debugInfo={{
                gameState,
                level: currentLevel,
                spellId: activeSpell?.id,
                spellName: activeSpell?.name,
                pathProgress,
                queueIndex: activeQueueIndex,
                queueLength: spellQueue.length,
                timeLeft,
                tolerance,
                cursorPos,
                isPinching,
                lastDistance: debugLastDistance
              }}
            />
            <div className="absolute top-10 left-10 scale-75 origin-top-left"> 
              {!isLevelSuccess && <SpellGuide spell={activeSpell} />} 
            </div>
            <MagicEffect side="left" active={activeEffects.p1} color={activeSpell.color} spellId={activeSpell.id} />
            
            {isLevelSuccess && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="text-center parchment p-16 rounded-[4rem] border-[12px] border-double shadow-2xl">
                  <h3 className="wizard-font text-8xl font-black text-[#2c1e14] mb-8">PUIKU!</h3>
                  <div className="mb-8 bg-black/5 p-4 rounded-2xl">
                    <p className="text-[#4a3728] font-bold uppercase tracking-widest text-sm">Combo bonusas</p>
                    <p className="text-4xl font-black text-[#2c1e14]">+{spellQueue.length * 50} taškų</p>
                  </div>
                  <button ref={nextButtonRef} onClick={nextLvl} className="wizard-font bg-[#2c1e14] text-[#f4e4bc] px-24 py-8 rounded-full text-5xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all">TOLIAU</button>
                  <p className="mt-8 text-xl font-bold italic text-[#4a3728] animate-pulse">Sujunkite pirštus virš mygtuko</p>
                </div>
              </div>
            )}

            {!isLevelSuccess && (
              <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-4">
                 <div className="w-[450px] h-5 bg-black/80 rounded-full border-2 border-[#d4af37]/30 overflow-hidden shadow-inner">
                    <div className="h-full bg-gradient-to-r from-amber-600 via-white to-amber-600 transition-all duration-300 shadow-[0_0_20px_rgba(255,215,0,0.5)]" style={{ width: `${magicIntensity}%` }} />
                 </div>
                 <div className="bg-black/90 px-12 py-3 rounded-full border-2 border-[#d4af37] text-2xl font-bold italic shadow-2xl text-white tracking-widest wizard-font">
                  {statusMessage}
                 </div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === GameState.RESULTS && (
        <div className="z-20 parchment p-16 rounded-[5rem] text-center max-w-3xl border-[16px] border-double border-[#4a3728] shadow-2xl animate-in zoom-in duration-700">
          <h2 className="wizard-font text-6xl font-bold mb-10 text-[#2c1e14]">DVIKOVA BAIGTA</h2>
          <div className="mb-14">
            <p className="text-[10rem] font-black text-[#2c1e14] leading-none drop-shadow-lg">{players[0].score}</p>
            <p className="text-3xl mt-6 font-bold text-[#4a3728]">Išburta {currentLevel - 1} lygių</p>
          </div>
          <button onClick={startGame} className="wizard-font bg-[#2c1e14] text-white px-20 py-8 rounded-full text-4xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all">BANDYTI DAR KARTĄ</button>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2c1e14; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
