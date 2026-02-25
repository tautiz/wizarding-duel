
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GameState, Player, GameConfig, WIZARD_NAMES } from './types';
import { COLLEGES, SPELLS, SYSTEM_INSTRUCTION, SOUNDS, EnhancedSpell, getToleranceForDifficulty, DIFFICULTIES, DEFAULT_DIFFICULTY_ID, getDifficultyConfig, SPELL_PATH_VISUALS } from './constants';
import { MagicEffect } from './components/MagicEffect';
import { SpellGuide } from './components/SpellGuide';
import { TrackingOverlay } from './components/TrackingOverlay';
import { WandCursor } from './components/WandCursor';
import { ModeSelect } from './components/ModeSelect';
import { TeamSetup } from './components/TeamSetup';
import { TeamPracticeMode } from './components/TeamPracticeMode';
import { TeamResults } from './components/TeamResults';
import { DebugPanel } from './components/DebugPanel';
import { encode, decode, decodeAudioData } from './services/audioUtils';
import { createGestureDetectors } from './gestures/GestureDetectors';
import { calculateLevelScore } from './services/scoring';
import { TeamSession } from './models/TeamGameState';
import { TeamPlayer } from './models/TeamPlayer';
import { teamGameService } from './services/teamGameService';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LANDING);
  const [config, setConfig] = useState<GameConfig>({ voiceEnabled: false, playerCount: 1, difficulty: DEFAULT_DIFFICULTY_ID });
  const [players, setPlayers] = useState<Player[]>([{ id: 1, name: 'Haris', score: 0 }]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [spellQueue, setSpellQueue] = useState<EnhancedSpell[]>([SPELLS[0]]);
  const [activeQueueIndex, setActiveQueueIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeEffects, setActiveEffects] = useState({p1: false, p2: false});
  const [statusMessage, setStatusMessage] = useState<string>("Pasiruoškite dvikovai!");
  const [handLandmarks, setHandLandmarks] = useState<any[][]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0.5, y: 0.5 });
  const [cursorGamePos, setCursorGamePos] = useState({ x: 0.5, y: 0.5 });
  const [isPinching, setIsPinching] = useState(false);
  const [magicIntensity, setMagicIntensity] = useState(0);
  const [isLevelSuccess, setIsLevelSuccess] = useState(false);
  const [pathProgress, setPathProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugLastDistance, setDebugLastDistance] = useState<number | null>(null);
  const [debugPaused, setDebugPaused] = useState(false);
  const [debugShowHand, setDebugShowHand] = useState(false);
  const [debugPathLineWidthPx, setDebugPathLineWidthPx] = useState<number>(SPELL_PATH_VISUALS.lineWidthPx);
  const [debugAdminOpen, setDebugAdminOpen] = useState(false);
  const [adminRefreshKey, setAdminRefreshKey] = useState(0);
  const [adminDate, setAdminDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showSystemCursor, setShowSystemCursor] = useState(false);
  const [debugSpellId, setDebugSpellId] = useState<string>(SPELLS[0].id);
  const [debugLevelInput, setDebugLevelInput] = useState<string>('1');
  const [lastScoreAward, setLastScoreAward] = useState<number | null>(null);

  const [gameMode, setGameMode] = useState<'solo' | 'team'>('solo');
  const [teamSession, setTeamSession] = useState<TeamSession | null>(null);
  const [currentTeamPlayer, setCurrentTeamPlayer] = useState<TeamPlayer | null>(null);
  const [teamTimeLeft, setTeamTimeLeft] = useState(0);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showPracticeOverlay, setShowPracticeOverlay] = useState(false);
  const [practiceSpellsCompleted, setPracticeSpellsCompleted] = useState(0);

  const activeSpell = spellQueue[activeQueueIndex];
  const tolerance = getToleranceForDifficulty(config.difficulty);

  // Refs for tracking and stability
  const gameStateRef = useRef(gameState);
  const currentSpellRef = useRef<EnhancedSpell>(spellQueue[0]);
  const pathProgressRef = useRef(pathProgress);
  const isLevelSuccessRef = useRef(isLevelSuccess);
  const pausedRef = useRef(paused);
  const configRef = useRef(config);
  const timeLeftRef = useRef(timeLeft);
  const activeQueueIndexRef = useRef(0);
  const spellQueueRef = useRef<EnhancedSpell[]>(spellQueue);
  const teamSessionRef = useRef<TeamSession | null>(null);
  const currentTeamPlayerRef = useRef<TeamPlayer | null>(null);
  const teamTimeLeftRef = useRef(0);

  const gestureDetectorsRef = useRef(createGestureDetectors());
  const pauseToggleCooldownUntilRef = useRef(0);
  const exitCooldownUntilRef = useRef(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const handsRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const exitToSetup = useCallback(() => {
    setPaused(false);
    pausedRef.current = false;
    setDebugPaused(false);
    setIsLevelSuccess(false);
    isLevelSuccessRef.current = false;
    setMagicIntensity(0);
    setPathProgress(0);
    pathProgressRef.current = 0;
    setActiveQueueIndex(0);
    activeQueueIndexRef.current = 0;
    setSpellQueue([SPELLS[0]]);
    spellQueueRef.current = [SPELLS[0]];
    currentSpellRef.current = SPELLS[0];
    setActiveEffects({ p1: false, p2: false });
    setStatusMessage('Pasiruoškite dvikovai!');
    setTimeLeft(getDifficultyConfig(configRef.current.difficulty).startTime);
    setLastScoreAward(null);

    gestureDetectorsRef.current.reset();
    pauseToggleCooldownUntilRef.current = 0;
    exitCooldownUntilRef.current = 0;

    setGameState(GameState.SETUP);
  }, []);

  const exitTeamToSetup = useCallback(() => {
    setPaused(false);
    pausedRef.current = false;
    setDebugPaused(false);
    setIsLevelSuccess(false);
    isLevelSuccessRef.current = false;
    setShowPracticeOverlay(false);
    setIsPracticeMode(false);

    setMagicIntensity(0);
    setPathProgress(0);
    pathProgressRef.current = 0;
    setActiveQueueIndex(0);
    activeQueueIndexRef.current = 0;

    setTeamTimeLeft(0);
    setCurrentLevel(1);
    setLastScoreAward(null);
    setStatusMessage('');
    setActiveEffects({ p1: false, p2: false });

    setTeamSession(null);
    setCurrentTeamPlayer(null);

    setGameMode('team');
    setGameState(GameState.TEAM_SETUP);
  }, []);

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
    try {
      const saved = window.localStorage.getItem('wd_show_system_cursor');
      if (saved === '1') setShowSystemCursor(true);
    } catch {}
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }

      if (e.key === 'Escape') {
        if (e.repeat) return;
        if (gameStateRef.current === GameState.PLAYING || gameStateRef.current === GameState.RESULTS) {
          e.preventDefault();
          const now = Date.now();
          if (now < exitCooldownUntilRef.current) return;
          exitCooldownUntilRef.current = now + 800;
          exitToSetup();
        }

        if (
          gameStateRef.current === GameState.TEAM_PLAYING ||
          gameStateRef.current === GameState.TEAM_PRACTICE
        ) {
          e.preventDefault();
          const now = Date.now();
          if (now < exitCooldownUntilRef.current) return;
          exitCooldownUntilRef.current = now + 800;
          exitTeamToSetup();
        }

        if (gameStateRef.current === GameState.TEAM_SETUP) {
          e.preventDefault();
          const now = Date.now();
          if (now < exitCooldownUntilRef.current) return;
          exitCooldownUntilRef.current = now + 800;
          setGameMode('solo');
          setGameState(GameState.MODE_SELECT);
        }
        return;
      }

      if (e.code === 'Space') {
        if (e.repeat) return;
        if (gameStateRef.current !== GameState.PLAYING) return;
        e.preventDefault();
        const now = Date.now();
        if (now < pauseToggleCooldownUntilRef.current) return;
        pauseToggleCooldownUntilRef.current = now + 700;
        setPaused(p => !p);
        return;
      }

      if (e.key === 'd' || e.key === 'D') {
        setDebugMode(prev => {
          const next = !prev;
          try { window.localStorage.setItem('wd_debug', next ? '1' : '0'); } catch {}
          return next;
        });
      }

      if (e.key === 'm' || e.key === 'M') {
        if (e.repeat) return;
        setShowSystemCursor(prev => {
          const next = !prev;
          try { window.localStorage.setItem('wd_show_system_cursor', next ? '1' : '0'); } catch {}
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exitToSetup, exitTeamToSetup]);

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
    pausedRef.current = paused;
    configRef.current = config;
    timeLeftRef.current = timeLeft;
    activeQueueIndexRef.current = activeQueueIndex;
    spellQueueRef.current = spellQueue;
    teamSessionRef.current = teamSession;
    currentTeamPlayerRef.current = currentTeamPlayer;
    teamTimeLeftRef.current = teamTimeLeft;
  }, [gameState, spellQueue, activeQueueIndex, pathProgress, isLevelSuccess, paused, config, timeLeft, teamSession, currentTeamPlayer, teamTimeLeft]);

  useEffect(() => {
    if (gameState !== GameState.PLAYING) setPaused(false);
  }, [gameState]);

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
    
    const mult = getDifficultyConfig(configRef.current.difficulty).scoreMultiplier;
    const scoreToAdd = calculateLevelScore({
      difficultyMultiplier: mult,
      comboLength: spellQueueRef.current.length,
      timeLeftSeconds: timeLeftRef.current,
    });
    setLastScoreAward(scoreToAdd);
    setPlayers(p => p.map((x, idx) => (idx === activePlayerIndex ? { ...x, score: x.score + scoreToAdd } : x)));
    setActiveEffects({ p1: true, p2: false });
    setStatusMessage("GRANDINĖ UŽBAIGTA!");
    playSound('success');
  }, [activePlayerIndex]);

  const handleTeamSpellComplete = useCallback(() => {
    const session = teamSessionRef.current;
    const player = currentTeamPlayerRef.current;
    if (!session || !player) return;

    const mult = getDifficultyConfig(configRef.current.difficulty).scoreMultiplier;
    const scoreToAdd = calculateLevelScore({
      difficultyMultiplier: mult,
      comboLength: spellQueueRef.current.length,
      timeLeftSeconds: teamTimeLeftRef.current,
    });

    const nextScore = player.score + scoreToAdd;
    const nextLevels = player.levelsCompleted + 1;

    setCurrentTeamPlayer(prev => prev ? { ...prev, score: nextScore, levelsCompleted: nextLevels } : null);
    setTeamSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => (p.id === player.id ? { ...p, score: nextScore, levelsCompleted: nextLevels } : p)),
      };
    });
    setLastScoreAward(scoreToAdd);
    setActiveEffects({ p1: true, p2: false });
    playSound('success');

    setCurrentLevel(l => l + 1);

    const randomSpell = SPELLS[Math.floor(Math.random() * SPELLS.length)];
    setSpellQueue([randomSpell]);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    setStatusMessage('Atlikite burtą!');

    activeQueueIndexRef.current = 0;
    pathProgressRef.current = 0;
    spellQueueRef.current = [randomSpell];
    currentSpellRef.current = randomSpell;
  }, []);

  const onResults = useCallback((results: any) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      setHandLandmarks(results.multiHandLandmarks);
      
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];

      const rawX = indexTip.x;
      const rawY = indexTip.y;
      const mirroredX = 1 - rawX;

      const videoEl = videoRef.current;
      let screenX = mirroredX * window.innerWidth;
      let screenY = rawY * window.innerHeight;

      if (videoEl) {
        const rect = videoEl.getBoundingClientRect();
        const containerW = rect.width;
        const containerH = rect.height;

        const intrinsicW = videoEl.videoWidth || containerW;
        const intrinsicH = videoEl.videoHeight || containerH;

        const scale = Math.max(containerW / intrinsicW, containerH / intrinsicH);
        const drawnW = intrinsicW * scale;
        const drawnH = intrinsicH * scale;
        const offsetX = (containerW - drawnW) / 2;
        const offsetY = (containerH - drawnH) / 2;

        screenX = rect.left + (mirroredX * drawnW) + offsetX;
        screenY = rect.top + (rawY * drawnH) + offsetY;
      }

      const normScreenX = Math.max(0, Math.min(1, screenX / window.innerWidth));
      const normScreenY = Math.max(0, Math.min(1, screenY / window.innerHeight));
      setCursorPos({ x: normScreenX, y: normScreenY });

      let gameX = 0.5;
      let gameY = 0.5;
      const gameEl = gameAreaRef.current;
      if (gameEl) {
        const r = gameEl.getBoundingClientRect();
        gameX = (screenX - r.left) / r.width;
        gameY = (screenY - r.top) / r.height;
        gameX = Math.max(0, Math.min(1, gameX));
        gameY = Math.max(0, Math.min(1, gameY));
      }
      setCursorGamePos({ x: gameX, y: gameY });

      const dist = Math.sqrt(Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2));
      const pinching = dist < 0.08;
      setIsPinching(pinching);

      const now = Date.now();

      const gestureEvents = gestureDetectorsRef.current.update(
        results.multiHandLandmarks,
        gameStateRef.current === GameState.PLAYING
      );

      if (gestureEvents.crossedHandsEdge) {
        if (now >= exitCooldownUntilRef.current) {
          exitCooldownUntilRef.current = now + 1500;
          exitToSetup();
          return;
        }
      }

      if (gestureEvents.openPalmEdge) {
        if (now >= pauseToggleCooldownUntilRef.current) {
          pauseToggleCooldownUntilRef.current = now + 1200;
          setPaused(p => !p);
        }
      }

      // GAMEPLAY logic (Solo and Team)
      const isGameplayState = gameStateRef.current === GameState.PLAYING || 
                              gameStateRef.current === GameState.TEAM_PLAYING ||
                              gameStateRef.current === GameState.TEAM_PRACTICE;
      
      if (isGameplayState && !isLevelSuccessRef.current && !pausedRef.current) {
        const spell = currentSpellRef.current;
        if (!spell) return;
        
        const currentWp = spell.waypoints[pathProgressRef.current];
        if (currentWp) {
          const hX = gameX * 100;
          const hY = gameY * 100;
          const wpX = 100 - currentWp.x;
          const wpY = currentWp.y;
          const d = Math.sqrt(Math.pow(hX - wpX, 2) + Math.pow(hY - wpY, 2));
          const tolerance = getToleranceForDifficulty(configRef.current.difficulty);

          setDebugLastDistance(d);
          
          if (d < tolerance) {
            const nextIdx = pathProgressRef.current + 1;
            setPathProgress(nextIdx);
            pathProgressRef.current = nextIdx;
            
            // Update magic intensity - ensure it reaches 100% on last waypoint
            const intensity = Math.min(100, (nextIdx / spell.waypoints.length) * 100);
            setMagicIntensity(intensity);
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
                // Entire queue finished - ensure 100% intensity first
                setMagicIntensity(100);
                
                if (gameStateRef.current === GameState.TEAM_PLAYING) {
                  handleTeamSpellComplete();
                } else if (gameStateRef.current === GameState.TEAM_PRACTICE) {
                  // Practice complete - show success overlay
                  setIsLevelSuccess(true);
                  isLevelSuccessRef.current = true;
                  setActiveEffects({ p1: true, p2: false });
                  setStatusMessage("PUIKU!");
                  playSound('success');
                } else {
                  handleLevelComplete();
                }
              }
            }
          }
        }
      }

      // INTERACTION logic (Pinch to click)
      if (!pausedRef.current && pinching && !(window as any)._isPunched) {
        (window as any)._isPunched = true;
        const cx = screenX;
        const cy = screenY;

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
      gestureDetectorsRef.current.update(null, false);
    }
  }, [handleLevelComplete, handleTeamSpellComplete, exitToSetup]);

  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    let active = true;
    const initTracking = async () => {
      if (!(window as any).Hands) return;
      const hands = new (window as any).Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });
      hands.setOptions({
        maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5
      });
      hands.onResults((res: any) => onResultsRef.current(res));
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
  }, []);

  const startGame = () => {
    const s = getDifficultyConfig(config.difficulty).startTime;
    const desiredCount = Math.max(1, Math.min(3, Math.floor(config.playerCount || 1)));
    setPlayers(prev => {
      const base = prev.length ? prev : [{ id: 1, name: 'Haris', score: 0 }];
      const out: Player[] = [];
      for (let i = 0; i < desiredCount; i++) {
        const existing = base[i];
        out.push({
          id: i + 1,
          name: existing?.name ?? WIZARD_NAMES[i % WIZARD_NAMES.length],
          score: 0,
        });
      }
      return out;
    });
    setActivePlayerIndex(0);
    setCurrentLevel(1);
    const initialQueue = [SPELLS[0]];
    setSpellQueue(initialQueue);
    setActiveQueueIndex(0);
    setTimeLeft(s);
    setMagicIntensity(0);
    setPathProgress(0);
    setIsLevelSuccess(false);
    setLastScoreAward(null);
    setGameState(GameState.PLAYING);
    setStatusMessage("Atlikite burtą!");
    playSound('swish');
  };

  const handleAdminPrint = () => {
    const targetDate = adminDate;
    const sessions = storageService.getAllTeamSessions().filter(s => s.completedAt);

    const sameDay = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const daySessions = sessions.filter(s => {
      const completed = s.completedAt ? new Date(s.completedAt) : null;
      if (!completed) return false;
      return sameDay(completed) === targetDate;
    });

    const byCollege = new Map<string, { sessionsPlayed: number; totalScore: number; bestScore: number; totalLevels: number }>();
    daySessions.forEach(s => {
      const key = s.collegeId || 'unknown';
      const prev = byCollege.get(key) ?? { sessionsPlayed: 0, totalScore: 0, bestScore: 0, totalLevels: 0 };
      const totalLevels = s.players.reduce((sum, p) => sum + (p.levelsCompleted ?? 0), 0);
      byCollege.set(key, {
        sessionsPlayed: prev.sessionsPlayed + 1,
        totalScore: prev.totalScore + (s.totalScore ?? 0),
        bestScore: Math.max(prev.bestScore, s.totalScore ?? 0),
        totalLevels: prev.totalLevels + totalLevels,
      });
    });

    const rows = [...byCollege.entries()]
      .map(([collegeId, v]) => {
        const label = COLLEGES.find(c => c.id === collegeId)?.label ?? collegeId;
        return `<tr>
          <td>${label}</td>
          <td style="text-align:right">${v.sessionsPlayed}</td>
          <td style="text-align:right">${v.totalScore}</td>
          <td style="text-align:right">${v.bestScore}</td>
          <td style="text-align:right">${v.totalLevels}</td>
        </tr>`;
      })
      .join('');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Wizarding Duel – Koledžų statistika (${targetDate})</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 12px; }
      .meta { color: #444; font-size: 12px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border-bottom: 1px solid #ddd; padding: 8px 6px; font-size: 12px; }
      th { text-align: left; background: #f5f5f5; }
      .empty { color: #666; font-size: 12px; }
    </style>
  </head>
  <body>
    <h1>Koledžų statistika – ${targetDate}</h1>
    <div class="meta">Sesijų: ${daySessions.length}</div>
    ${rows.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Koledžas</th>
            <th style="text-align:right">Sesijos</th>
            <th style="text-align:right">Suma</th>
            <th style="text-align:right">Geriausias</th>
            <th style="text-align:right">Lygiai</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    ` : `<div class="empty">Nėra užbaigtų sesijų pasirinktai dienai.</div>`}
  </body>
</html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const nextLvl = () => {
    setIsLevelSuccess(false);
    setLastScoreAward(null);
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

    setActivePlayerIndex(prev => {
      const count = Math.max(1, players.length);
      return (prev + 1) % count;
    });
    playSound('swish');
  };

  const setPlayerCount = (count: number) => {
    const nextCount = Math.max(1, Math.min(3, Math.floor(count)));
    setConfig(prev => ({ ...prev, playerCount: nextCount }));
    setPlayers(prev => {
      const out: Player[] = [];
      for (let i = 0; i < nextCount; i++) {
        out.push({
          id: i + 1,
          name: prev[i]?.name ?? WIZARD_NAMES[i % WIZARD_NAMES.length],
          score: prev[i]?.score ?? 0,
        });
      }
      return out;
    });
    setActivePlayerIndex(p => Math.min(p, nextCount - 1));
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING && !isLevelSuccess && !debugPaused && !paused) {
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { setGameState(GameState.RESULTS); clearInterval(timer); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, isLevelSuccess, debugPaused, paused]);

  useEffect(() => {
    if (gameState === GameState.TEAM_PLAYING && !isLevelSuccess && !debugPaused && !paused) {
      const timer = setInterval(() => {
        setTeamTimeLeft(t => {
          if (t <= 1) {
            endCurrentPlayerTurn();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, isLevelSuccess, debugPaused, paused]);

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

  const handleDebugApplySpell = (spellId: string, level: number) => {
    const chosen = SPELLS.find(s => s.id === spellId);
    if (!chosen) return;

    setGameState(GameState.PLAYING);
    gameStateRef.current = GameState.PLAYING;
    setCurrentLevel(level);
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

  const handleDebugTimeAdjust = (amount: number) => {
    if (gameMode === 'team') {
      setTeamTimeLeft(t => Math.max(0, Math.min(999, t + amount)));
    } else {
      setTimeLeft(t => Math.max(0, Math.min(999, t + amount)));
    }
  };

  const endCurrentPlayerTurn = useCallback(() => {
    const session = teamSessionRef.current;
    const player = currentTeamPlayerRef.current;
    if (!session || !player) return;

    const playerInSession = session.players.find(p => p.id === player.id);
    const finalScore = playerInSession?.score ?? player.score;
    const finalLevelsCompleted = playerInSession?.levelsCompleted ?? player.levelsCompleted;

    const updatedSession = teamGameService.endPlayerGame(
      session,
      player.id,
      finalScore,
      finalLevelsCompleted
    );
    setTeamSession(updatedSession);

    const nextPlayer = teamGameService.getNextPlayer(updatedSession);
    if (nextPlayer) {
      if (!nextPlayer.hasCompletedPractice) {
        startPlayerPractice(updatedSession, nextPlayer);
      } else {
        setCurrentTeamPlayer(nextPlayer);
        startRealGameForPlayer(updatedSession, nextPlayer);
      }
    } else {
      const finalSession = teamGameService.finalizeSession(updatedSession);
      setTeamSession(finalSession);
      setGameState(GameState.TEAM_RESULTS);
    }
  }, [currentLevel]);

  const startTeamGame = (playerNames: string[], totalTime: number, difficulty: string, collegeId: string) => {
    const session = teamGameService.createTeamSession(playerNames.length, totalTime, difficulty, playerNames, collegeId);
    setTeamSession(session);
    setConfig(prev => ({ ...prev, difficulty }));
    setGameMode('team');
    
    const firstPlayer = session.players[0];
    if (firstPlayer) {
      startPlayerPractice(session, firstPlayer);
    }
  };

  const startPlayerPractice = (session: TeamSession, player: TeamPlayer) => {
    setCurrentTeamPlayer(player);
    setIsPracticeMode(true);
    setShowPracticeOverlay(true);
    setGameState(GameState.TEAM_PRACTICE);
    setPracticeSpellsCompleted(0);
    
    const practiceSpell = SPELLS.find(s => s.difficulty === 1) || SPELLS[0];
    setSpellQueue([practiceSpell]);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    setIsLevelSuccess(false);
    setStatusMessage(`${player.name}, 3 pratybų burtai!`);

    activeQueueIndexRef.current = 0;
    pathProgressRef.current = 0;
    isLevelSuccessRef.current = false;
    spellQueueRef.current = [practiceSpell];
    currentSpellRef.current = practiceSpell;
    
    const updatedSession = teamGameService.startPlayerPractice(session, player.id);
    setTeamSession(updatedSession);
  };

  const startPracticeSpells = () => {
    setShowPracticeOverlay(false);
    setIsLevelSuccess(false);
    isLevelSuccessRef.current = false;
    setStatusMessage('Atlikite burtą!');
  };

  const skipPracticeAndStart = () => {
    if (!teamSession || !currentTeamPlayer) return;
    
    const updatedSession = teamGameService.completePlayerPractice(teamSession, currentTeamPlayer.id);
    setTeamSession(updatedSession);
    setShowPracticeOverlay(false);
    
    startRealGameForPlayer(updatedSession, currentTeamPlayer);
  };

  const nextPracticeSpell = () => {
    const newCount = practiceSpellsCompleted + 1;
    setPracticeSpellsCompleted(newCount);
    
    if (newCount >= 3) {
      // Po 3 burtų automatiškai pradėti žaidimą
      if (teamSession && currentTeamPlayer) {
        const updatedSession = teamGameService.completePlayerPractice(teamSession, currentTeamPlayer.id);
        setTeamSession(updatedSession);
        setShowPracticeOverlay(false);
        startRealGameForPlayer(updatedSession, currentTeamPlayer);
      }
      return;
    }
    
    setIsLevelSuccess(false);
    isLevelSuccessRef.current = false;
    
    const easySpells = SPELLS.filter(s => s.difficulty <= 2);
    const randomSpell = easySpells[Math.floor(Math.random() * easySpells.length)];
    
    setSpellQueue([randomSpell]);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    pathProgressRef.current = 0;
    activeQueueIndexRef.current = 0;
    spellQueueRef.current = [randomSpell];
    currentSpellRef.current = randomSpell;
    
    setStatusMessage(`Pratimas ${newCount + 1}/3`);
    playSound('swish');
  };

  const startRealGameForPlayer = (session: TeamSession, player: TeamPlayer) => {
    setIsPracticeMode(false);
    setGameState(GameState.TEAM_PLAYING);

    setTeamTimeLeft(session.timePerPlayer);
    
    setCurrentLevel(1);
    const initialQueue = [SPELLS[0]];
    setSpellQueue(initialQueue);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    setIsLevelSuccess(false);
    setStatusMessage(`${player.name}, pradėkite!`);

    activeQueueIndexRef.current = 0;
    pathProgressRef.current = 0;
    isLevelSuccessRef.current = false;
    spellQueueRef.current = initialQueue;
    currentSpellRef.current = initialQueue[0];
    
    const updatedSession = teamGameService.startPlayerGame(session, player.id);
    setTeamSession(updatedSession);
    
    playSound('swish');
  };

  const handleTeamLevelComplete = useCallback(() => {
    if (isLevelSuccessRef.current || !teamSession || !currentTeamPlayer) return;
    setIsLevelSuccess(true);
    isLevelSuccessRef.current = true;
    
    const mult = getDifficultyConfig(configRef.current.difficulty).scoreMultiplier;
    const scoreToAdd = calculateLevelScore({
      difficultyMultiplier: mult,
      comboLength: spellQueueRef.current.length,
      timeLeftSeconds: teamTimeLeft,
    });
    setLastScoreAward(scoreToAdd);
    
    const nextScore = currentTeamPlayer.score + scoreToAdd;
    const nextLevels = currentTeamPlayer.levelsCompleted + 1;

    setCurrentTeamPlayer(prev => prev ? { ...prev, score: nextScore, levelsCompleted: nextLevels } : null);
    setTeamSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p => (p.id === currentTeamPlayer.id ? { ...p, score: nextScore, levelsCompleted: nextLevels } : p)),
      };
    });
    
    setActiveEffects({ p1: true, p2: false });
    setStatusMessage("GRANDINĖ UŽBAIGTA!");
    playSound('success');
  }, [teamSession, currentTeamPlayer, teamTimeLeft]);

  const nextTeamLevel = () => {
    setIsLevelSuccess(false);
    setLastScoreAward(null);
    const newLevel = currentLevel + 1;
    const newQueue = generateSpellQueue(newLevel);
    
    setSpellQueue(newQueue);
    setActiveQueueIndex(0);
    setPathProgress(0);
    setMagicIntensity(0);
    setCurrentLevel(newLevel);

    setStatusMessage(newQueue.length > 1 ? "PASIRUOŠKITE KOMBINACIJAI!" : "Atlikite burtą!");
    playSound('swish');
  };

  return (
    <div className={`min-h-screen bg-[#05050a] text-[#f4e4bc] relative flex flex-col items-center justify-center ${showSystemCursor ? 'cursor-auto' : 'cursor-none'} select-none overflow-hidden`}>
      <video ref={videoRef} className={`fixed inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-1000 ${gameState === GameState.PLAYING ? 'opacity-40' : 'opacity-20'}`} playsInline muted />
      <WandCursor x={cursorPos.x} y={cursorPos.y} isPinching={isPinching} />

      {debugMode && (
        <div className="fixed bottom-6 left-6 z-[9998] pointer-events-auto select-text">
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

            <button
              onClick={() => setDebugShowHand(v => !v)}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
            >
              Hand overlay: {debugShowHand ? 'ON' : 'OFF'}
            </button>

            <button
              onClick={() => setDebugAdminOpen(true)}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
            >
              Admin stats
            </button>

            <div className="mb-3">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Path line width: {debugPathLineWidthPx}px</label>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={debugPathLineWidthPx}
                onChange={(e) => setDebugPathLineWidthPx(Number(e.target.value))}
                className="w-full"
              />
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

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Game Info</div>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-white/60">Mode:</span>
                  <span className="text-white font-bold">{gameMode === 'team' ? 'TEAM' : 'SOLO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">State:</span>
                  <span className="text-white font-bold">{gameState}</span>
                </div>
                {gameMode === 'team' && currentTeamPlayer && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-white/60">Player:</span>
                      <span className="text-white font-bold">{currentTeamPlayer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Mode:</span>
                      <span className={`font-bold ${isPracticeMode ? 'text-yellow-400' : 'text-green-400'}`}>
                        {isPracticeMode ? 'PRACTICE' : 'PLAYING'}
                      </span>
                    </div>
                    {isPracticeMode && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Practice:</span>
                        <span className="text-yellow-400 font-bold">{practiceSpellsCompleted}/3</span>
                      </div>
                    )}
                    {!isPracticeMode && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Score:</span>
                        <span className="text-green-400 font-bold">{currentTeamPlayer.score}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/60">Time:</span>
                      <span className="text-white font-bold">{teamTimeLeft}s</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-white/60">Spell:</span>
                  <span className="text-white font-bold">{activeSpell?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Waypoints:</span>
                  <span className="text-cyan-400 font-bold">
                    {pathProgress}/{activeSpell?.waypoints.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Queue:</span>
                  <span className="text-white font-bold">{activeQueueIndex + 1}/{spellQueue.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Intensity:</span>
                  <span className="text-white font-bold">{Math.round(magicIntensity)}%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 text-[11px] font-mono text-white/60">
              Press <span className="text-white">D</span> to toggle debug.
            </div>
          </div>
        </div>
      )}

      {debugMode && debugAdminOpen && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto" key={adminRefreshKey}>
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDebugAdminOpen(false)}
          />
          <div className="absolute inset-6 md:inset-10 bg-black/80 backdrop-blur-md border border-white/10 rounded-3xl text-white overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="font-mono font-bold text-amber-200">ADMIN STATS (localStorage)</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    storageService.unlockAllColleges();
                    setAdminRefreshKey(k => k + 1);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
                >
                  Atrakinti visus
                </button>
                <button
                  onClick={() => setDebugAdminOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-bold"
                >
                  Uždaryti
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Dienos ataskaita</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={adminDate}
                      onChange={(e) => setAdminDate(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none"
                    />
                    <button
                      onClick={handleAdminPrint}
                      className="px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 border border-amber-400/30 text-sm font-black uppercase tracking-widest text-amber-100"
                    >
                      Spausdinti
                    </button>
                  </div>
                </div>
                <div className="text-xs font-mono text-white/60">
                  Tip: spausdinimas filtruoja pagal <span className="text-white">completedAt</span> datą.
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Koledžų suvestinės</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="text-white/70">
                        <th className="text-left py-2">Koledžas</th>
                        <th className="text-right py-2">Sesijos</th>
                        <th className="text-right py-2">Suma</th>
                        <th className="text-right py-2">Geriausias</th>
                        <th className="text-right py-2">Paskutinį kartą</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {storageService.getCollegeSummaries().map(s => {
                        const label = COLLEGES.find(c => c.id === s.collegeId)?.label ?? s.collegeId;
                        const lastPlayed = s.lastPlayedAt ? new Date(s.lastPlayedAt).toLocaleString('lt-LT') : '-';
                        return (
                          <tr key={s.collegeId}>
                            <td className="py-2">{label}</td>
                            <td className="py-2 text-right">{s.sessionsPlayed}</td>
                            <td className="py-2 text-right">{s.totalScore}</td>
                            <td className="py-2 text-right">{s.bestScore}</td>
                            <td className="py-2 text-right">{lastPlayed}</td>
                          </tr>
                        );
                      })}
                      {storageService.getCollegeSummaries().length === 0 && (
                        <tr>
                          <td className="py-3 text-white/60" colSpan={5}>Nėra užbaigtų komandos sesijų.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Užrakinti koledžai</div>
                <div className="flex flex-wrap gap-2">
                  {storageService.getLockedColleges().map(id => {
                    const label = COLLEGES.find(c => c.id === id)?.label ?? id;
                    return (
                      <span key={id} className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm font-mono">
                        <span>{label}</span>
                        <button
                          onClick={() => {
                            storageService.unlockCollege(id);
                            setAdminRefreshKey(k => k + 1);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 text-[11px] font-bold"
                        >
                          Atrakinti
                        </button>
                      </span>
                    );
                  })}
                  {storageService.getLockedColleges().length === 0 && (
                    <div className="text-sm font-mono text-white/60">Nėra užrakintų koledžų.</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-2">Paskutinės komandos sesijos</div>
                <div className="space-y-2">
                  {[...storageService.getAllTeamSessions()]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map(sess => {
                      const collegeLabel = sess.collegeId ? (COLLEGES.find(c => c.id === sess.collegeId)?.label ?? sess.collegeId) : '-';
                      const created = sess.createdAt ? new Date(sess.createdAt).toLocaleString('lt-LT') : '-';
                      const completed = sess.completedAt ? new Date(sess.completedAt).toLocaleString('lt-LT') : '-';
                      const totalLevels = sess.players.reduce((sum, p) => sum + (p.levelsCompleted ?? 0), 0);
                      return (
                        <div key={sess.id} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="font-mono font-bold">{sess.id}</div>
                            <div className="text-white/70 font-mono text-xs">{collegeLabel}</div>
                          </div>
                          <div className="mt-1 text-xs font-mono text-white/70">
                            Sukurta: {created} | Užbaigta: {completed}
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-mono">
                            <div className="bg-black/30 border border-white/10 rounded-xl px-2 py-1">Score: <span className="text-white font-bold">{sess.totalScore ?? 0}</span></div>
                            <div className="bg-black/30 border border-white/10 rounded-xl px-2 py-1">Lygiai: <span className="text-white font-bold">{totalLevels}</span></div>
                            <div className="bg-black/30 border border-white/10 rounded-xl px-2 py-1">Žaidėjai: <span className="text-white font-bold">{sess.players.length}</span></div>
                          </div>
                        </div>
                      );
                    })}

                  {storageService.getAllTeamSessions().length === 0 && (
                    <div className="text-sm font-mono text-white/60">Nėra komandos sesijų.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameState === GameState.LANDING && (
        <div className="z-20 parchment p-16 rounded-[3rem] text-center shadow-2xl max-w-2xl animate-in zoom-in duration-700">
          <h1 className="wizard-font text-7xl font-bold mb-8 text-[#2c1e14]">MAGIŠKA DVIKOVA</h1>
          <p className="text-xl italic mb-12 text-[#4a3728] font-serif leading-relaxed">Valdykite lazdelę ranka. Suspauskite pirštus pasirinkimui.<br/>Aukštesniuose lygiuose junkite burtus į grandines!</p>
          <button onClick={() => setGameState(GameState.MODE_SELECT)} className="wizard-font bg-[#2c1e14] text-[#f4e4bc] px-16 py-6 rounded-full text-3xl font-black hover:scale-110 transition-all border-4 border-[#4a3728] active:scale-95">PRADĖTI</button>
        </div>
      )}

      {gameState === GameState.MODE_SELECT && (
        <ModeSelect
          onSelectSolo={() => {
            setGameMode('solo');
            setGameState(GameState.SETUP);
          }}
          onSelectTeam={() => {
            setGameMode('team');
            setGameState(GameState.TEAM_SETUP);
          }}
        />
      )}

      {gameState === GameState.TEAM_SETUP && (
        <TeamSetup
          onStartTeam={startTeamGame}
          onBack={() => setGameState(GameState.MODE_SELECT)}
        />
      )}

      {gameState === GameState.SETUP && (
        <div className="z-20 parchment p-12 rounded-[3rem] w-full max-w-4xl shadow-2xl animate-in slide-in-from-bottom duration-500">
          <h2 className="wizard-font text-4xl text-center mb-8 font-bold uppercase tracking-widest">Burtininko Registracija</h2>
          <div className="grid grid-cols-3 gap-8 mb-10">
            <div className="bg-black/10 p-6 rounded-3xl border border-[#4a3728]/20">
              <h3 className="font-bold mb-4 text-xl font-serif text-[#2c1e14]">LYGIS</h3>
              <div className="flex flex-col gap-3">
                {Object.entries(DIFFICULTIES).map(([id, cfg]) => (
                  <button key={id} onClick={() => setConfig({...config, difficulty: id})} className={`py-3 rounded-xl font-bold border-2 transition-all ${config.difficulty === id ? 'bg-[#2c1e14] text-white border-[#d4af37]' : 'bg-white/50 text-[#2c1e14] border-transparent hover:bg-white/80'}`}>{cfg.label}</button>
                ))}
              </div>
            </div>
            <div className="bg-black/10 p-6 rounded-3xl border border-[#4a3728]/20">
              <h3 className="font-bold mb-4 text-xl font-serif text-[#2c1e14]">ŽAIDĖJAI</h3>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setPlayerCount(n)} className={`py-3 rounded-xl font-bold border-2 transition-all ${config.playerCount === n ? 'bg-[#2c1e14] text-white border-[#d4af37]' : 'bg-white/50 text-[#2c1e14] border-transparent hover:bg-white/80'}`}>{n} žaidėjai</button>
                ))}
              </div>
            </div>
            <div className="bg-black/10 p-6 rounded-3xl border border-[#4a3728]/20">
              <h3 className="font-bold mb-4 text-xl font-serif text-[#2c1e14]">VARDŲ PARINKIMAS</h3>
              <div className="flex flex-col gap-3">
                {players.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#2c1e14] text-white flex items-center justify-center font-black">{idx + 1}</div>
                    <select
                      value={p.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setPlayers(prev => prev.map((x, i) => (i === idx ? { ...x, name } : x)));
                      }}
                      className="flex-1 bg-white/60 border border-[#4a3728]/30 rounded-xl px-3 py-2 text-sm font-bold text-[#2c1e14] outline-none"
                    >
                      {WIZARD_NAMES.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
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
            <div className="flex gap-3">
              {players.map((p, idx) => (
                <div key={p.id} className={`parchment px-6 py-3 rounded-2xl border-4 shadow-2xl transition-all ${idx === activePlayerIndex ? 'border-[#d4af37] scale-105' : 'border-[#4a3728] opacity-90'}`}>
                  <p className="text-xs font-bold opacity-70 uppercase tracking-widest">{p.name}</p>
                  <p className="text-4xl font-black tabular-nums">{p.score}</p>
                  <p className={`text-[11px] font-black uppercase tracking-widest mt-1 ${idx === activePlayerIndex ? 'text-[#2c1e14]' : 'opacity-60'}`}>{idx === activePlayerIndex ? 'Eilė dabar' : 'Laukia'}</p>
                </div>
              ))}
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
            <div ref={gameAreaRef} className="absolute inset-0" />
            <TrackingOverlay
              landmarks={handLandmarks}
              targetSpell={isLevelSuccess ? undefined : activeSpell}
              difficulty={config.difficulty}
              pathLineWidthPx={debugMode ? debugPathLineWidthPx : undefined}
              debug={debugMode}
              debugShowHand={debugShowHand}
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
                cursorPos: cursorGamePos,
                isPinching,
                lastDistance: debugLastDistance
              }}
            />

            {paused && (
              <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md">
                <div className="text-center parchment p-12 rounded-[4rem] border-[10px] border-double shadow-2xl">
                  <h3 className="wizard-font text-7xl font-black text-[#2c1e14] mb-6">PAUZĖ</h3>
                  <p className="text-xl font-bold text-[#4a3728] mb-3">Spauskite <span className="font-black">SPACE</span> arba parodykite išskleistą delną.</p>
                  <p className="text-lg italic text-[#4a3728]">Tas pats gestas / SPACE grąžins į žaidimą.</p>
                </div>
              </div>
            )}

            <MagicEffect side="left" active={activeEffects.p1} color={activeSpell.color} spellId={activeSpell.id} />
            
            {isLevelSuccess && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="text-center parchment p-16 rounded-[4rem] border-[12px] border-double shadow-2xl">
                  <h3 className="wizard-font text-8xl font-black text-[#2c1e14] mb-8">PUIKU!</h3>
                  {lastScoreAward !== null && (
                    <div className="mb-8 bg-black/5 p-4 rounded-2xl">
                      <p className="text-[#4a3728] font-bold uppercase tracking-widest text-sm">Taškai už užduotį</p>
                      <p className="text-4xl font-black text-[#2c1e14]">+{lastScoreAward}</p>
                    </div>
                  )}
                  <button ref={nextButtonRef} onClick={nextLvl} className="wizard-font bg-[#2c1e14] text-[#f4e4bc] px-24 py-8 rounded-full text-5xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all">TOLIAU</button>
                  <p className="mt-8 text-xl font-bold italic text-[#4a3728] animate-pulse">Sujunkite pirštus virš mygtuko</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {(gameState === GameState.TEAM_PLAYING || gameState === GameState.TEAM_PRACTICE) && currentTeamPlayer && (
        <div className="z-20 w-full h-full flex flex-col p-6 items-center justify-between">
          <div className="w-full max-w-7xl flex justify-between items-start">
            <div className="parchment px-8 py-4 rounded-2xl border-4 border-[#d4af37] shadow-2xl">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Žaidėjas</p>
              <p className="text-3xl font-black text-[#2c1e14]">{currentTeamPlayer.name}</p>
              {isPracticeMode ? (
                <p className="text-xl font-bold text-[#d4af37] mt-1">Pratybos {practiceSpellsCompleted}/3</p>
              ) : (
                <p className="text-2xl font-bold text-[#4a3728] mt-1">{currentTeamPlayer.score} tšk</p>
              )}
            </div>
            
            <div className="flex flex-col items-center">
              <div className="flex gap-2 mb-4">
                {spellQueue.map((spell, idx) => (
                  <div key={idx} className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${idx === activeQueueIndex ? 'bg-[#d4af37] text-black border-white scale-110 shadow-[0_0_20px_gold]' : idx < activeQueueIndex ? 'bg-green-800 text-white border-green-400 opacity-50' : 'bg-black/60 text-white/40 border-white/20'}`}>
                    <span className="wizard-font font-bold text-lg">{spell.name}</span>
                    {idx < activeQueueIndex && <span className="text-xl">✓</span>}
                  </div>
                ))}
              </div>
              <div className={`px-10 py-2 rounded-full font-mono text-3xl font-bold shadow-xl border-2 border-[#d4af37] ${teamTimeLeft < 10 ? 'bg-red-600 text-white animate-pulse' : 'bg-[#2c1e14] text-[#f4e4bc]'}`}>
                {teamTimeLeft}s
              </div>
            </div>

            <div className="parchment px-8 py-3 rounded-2xl border-4 border-[#4a3728] shadow-2xl text-center">
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Lygis</p>
              <p className="text-4xl font-black tabular-nums">{currentLevel}</p>
            </div>
          </div>

          <div className="relative w-full max-w-6xl aspect-video rounded-[4rem] border-[16px] border-[#2c1e14] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-black/40">
            <div ref={gameAreaRef} className="absolute inset-0" />
            <TrackingOverlay
              landmarks={handLandmarks}
              targetSpell={isLevelSuccess ? undefined : activeSpell}
              difficulty={config.difficulty}
              pathLineWidthPx={debugMode ? debugPathLineWidthPx : undefined}
              debug={debugMode}
              debugShowHand={debugShowHand}
              debugInfo={{
                gameState,
                level: currentLevel,
                spellId: activeSpell?.id,
                spellName: activeSpell?.name,
                pathProgress,
                queueIndex: activeQueueIndex,
                queueLength: spellQueue.length,
                timeLeft: teamTimeLeft,
                tolerance,
                cursorPos: cursorGamePos,
                isPinching,
                lastDistance: debugLastDistance
              }}
            />

            {showPracticeOverlay && (
              <TeamPracticeMode
                player={currentTeamPlayer}
                onComplete={startPracticeSpells}
                onSkip={skipPracticeAndStart}
              />
            )}

            {paused && (
              <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md">
                <div className="text-center parchment p-12 rounded-[4rem] border-[10px] border-double shadow-2xl">
                  <h3 className="wizard-font text-7xl font-black text-[#2c1e14] mb-6">PAUZĖ</h3>
                  <p className="text-xl font-bold text-[#4a3728] mb-3">Spauskite <span className="font-black">SPACE</span> arba parodykite išskleistą delną.</p>
                  <p className="text-lg italic text-[#4a3728]">Tas pats gestas / SPACE grąžins į žaidimą.</p>
                </div>
              </div>
            )}

            <MagicEffect side="left" active={activeEffects.p1} color={activeSpell.color} spellId={activeSpell.id} />
            
            {isLevelSuccess && !showPracticeOverlay && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <div className="text-center parchment p-16 rounded-[4rem] border-[12px] border-double shadow-2xl">
                  <h3 className="wizard-font text-8xl font-black text-[#2c1e14] mb-8">PUIKU!</h3>
                  {isPracticeMode ? (
                    <div className="mb-8 bg-[#d4af37]/20 p-6 rounded-2xl border-2 border-[#d4af37]">
                      <p className="text-[#4a3728] font-bold uppercase tracking-widest text-sm">Pratybų progresas</p>
                      <p className="text-5xl font-black text-[#2c1e14] my-2">{practiceSpellsCompleted + 1}/3</p>
                      <p className="text-sm text-[#4a3728] italic">
                        {practiceSpellsCompleted + 1 < 3 ? 'Tęskite pratybas' : 'Pratybos baigtos - prasidės žaidimas'}
                      </p>
                    </div>
                  ) : (
                    lastScoreAward !== null && (
                      <div className="mb-8 bg-black/5 p-4 rounded-2xl">
                        <p className="text-[#4a3728] font-bold uppercase tracking-widest text-sm">Taškai už užduotį</p>
                        <p className="text-4xl font-black text-[#2c1e14]">+{lastScoreAward}</p>
                      </div>
                    )
                  )}
                  <button 
                    ref={nextButtonRef} 
                    onClick={isPracticeMode ? nextPracticeSpell : nextTeamLevel} 
                    className="wizard-font bg-[#2c1e14] text-[#f4e4bc] px-24 py-8 rounded-full text-5xl font-black shadow-2xl hover:scale-110 active:scale-95 transition-all"
                  >
                    {isPracticeMode && practiceSpellsCompleted + 1 >= 3 ? 'PRADĖTI ŽAIDIMĄ' : 'TOLIAU'}
                  </button>
                  <p className="mt-8 text-xl font-bold italic text-[#4a3728] animate-pulse">Sujunkite pirštus virš mygtuko</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {gameState === GameState.TEAM_RESULTS && teamSession && (
        <TeamResults
          session={teamSession}
          onPlayAgain={() => {
            setTeamSession(null);
            setCurrentTeamPlayer(null);
            setGameState(GameState.TEAM_SETUP);
          }}
          onBackToMenu={() => {
            setTeamSession(null);
            setCurrentTeamPlayer(null);
            setGameMode('solo');
            setGameState(GameState.MODE_SELECT);
          }}
        />
      )}

      {gameState === GameState.RESULTS && (
        <div className="z-20 parchment p-16 rounded-[5rem] text-center max-w-3xl border-[16px] border-double border-[#4a3728] shadow-2xl animate-in zoom-in duration-700">
          <h2 className="wizard-font text-6xl font-bold mb-10 text-[#2c1e14]">DVIKOVA BAIGTA</h2>
          <div className="mb-14">
            <div className="mb-10">
              <p className="text-3xl mt-6 font-bold text-[#4a3728]">Išburta {currentLevel - 1} lygių</p>
            </div>
            <div className="grid gap-4">
              {[...players]
                .sort((a, b) => b.score - a.score)
                .map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between bg-black/5 rounded-3xl px-8 py-4 border border-[#4a3728]/20">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#2c1e14] text-white flex items-center justify-center font-black">{idx + 1}</div>
                      <div className="text-left">
                        <div className="font-black text-[#2c1e14] text-2xl">{p.name}</div>
                        <div className="text-sm font-bold text-[#4a3728] uppercase tracking-widest">Taškai</div>
                      </div>
                    </div>
                    <div className="text-4xl font-black text-[#2c1e14] tabular-nums">{p.score}</div>
                  </div>
                ))}
            </div>
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
