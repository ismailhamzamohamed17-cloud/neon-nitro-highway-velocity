import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/gameEngine';
import { HUD } from './components/HUD';
import { GarageModal } from './components/GarageModal';
import { ChapterSelectModal } from './components/ChapterSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { ChapterCompleteModal } from './components/ChapterCompleteModal';
import { ControlsOverlay } from './components/ControlsOverlay';
import { CarPreviewCanvas } from './components/CarPreviewCanvas';
import { PlayerCustomization, AudioSettings } from './types';
import { CHAPTERS, CAR_MODELS, COLOR_OPTIONS, UNDERGLOW_OPTIONS } from './game/constants';
import { audioManager } from './audio/soundManager';
import { Play, Wrench, Map, Settings, Pause, Sparkles, ChevronRight, Palette, SunMedium } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initial Boot Loading State
  const [initialStage, setInitialStage] = useState<'loading' | 'touchToContinue' | 'ready'>('loading');
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStatusText, setLoadStatusText] = useState('INITIALIZING CYBER ENGINE...');

  // Game State
  const [gameState, setGameState] = useState<'start' | 'playing' | 'paused' | 'chapterComplete' | 'gameOver'>('start');

  // Chapter unlock progression state (saved in localStorage)
  const [unlockedChapterIdx, setUnlockedChapterIdx] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('neon_nitro_unlocked_ch');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [hudData, setHudData] = useState({
    score: 0,
    speedKmh: 60,
    fuel: 100,
    lives: 3,
    chapterDistanceLeft: 2000,
    currentChapterIdx: 0,
    totalChapters: 28,
    combo: 1,
  });

  const [finalStats, setFinalStats] = useState({
    score: 0,
    distance: 0,
    chapter: 1,
    maxSpeed: 0,
  });

  const [lifeToast, setLifeToast] = useState<{ show: boolean; msg: string; sub: string }>({
    show: false,
    msg: '',
    sub: '',
  });

  // Customization & Settings
  const [customization, setCustomization] = useState<PlayerCustomization>({
    carModelId: 'apex_gt',
    colorId: 'cyan',
    neonUnderglowId: 'cyan',
  });

  const [audioSettings, setAudioSettings] = useState<AudioSettings>({
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    engineSoundEnabled: true,
  });

  // Active Modals
  const [activeModal, setActiveModal] = useState<'garage' | 'chapters' | 'settings' | null>(null);

  // Boot Loading Sequence
  useEffect(() => {
    let progress = 0;
    const statuses = [
      'INITIALIZING CYBER ENGINE...',
      'TUNING TURBO SUPERCHARGERS...',
      'CALIBRATING HIGHWAY LIGHTING...',
      'SYNCHRONIZING NEURAL DRIFT...',
      'SYSTEM ONLINE!',
    ];
    const interval = setInterval(() => {
      progress += 2.5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setInitialStage('touchToContinue');
        }, 300);
      }
      setLoadProgress(progress);
      const statusIdx = Math.min(statuses.length - 1, Math.floor((progress / 100) * statuses.length));
      setLoadStatusText(statuses[statusIdx]);
    }, 25);

    return () => clearInterval(interval);
  }, []);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current, {
      onHUDUpdate: (data) => setHudData(data),
      onChapterComplete: (chIdx) => {
        setGameState('chapterComplete');
        // Unlock next chapter
        const nextCh = chIdx + 1;
        setUnlockedChapterIdx((prev) => {
          const updated = Math.max(prev, nextCh);
          try {
            localStorage.setItem('neon_nitro_unlocked_ch', updated.toString());
          } catch {
            // ignore
          }
          return updated;
        });
      },
      onGameOver: (stats) => {
        setFinalStats(stats);
        setGameState('gameOver');
      },
      onLifeLost: (livesLeft, reason) => {
        setLifeToast({
          show: true,
          msg: 'CRASH!',
          sub: reason,
        });
        setTimeout(() => setLifeToast({ show: false, msg: '', sub: '' }), 1200);
      },
    });

    engine.setCustomization(customization);
    engine.updateAudioSettings(audioSettings);
    engineRef.current = engine;

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.pause();
    };
  }, []);

  const handleTouchContinue = () => {
    audioManager.init();
    audioManager.resume();
    audioManager.playPickupChime();
    setInitialStage('ready');
  };

  const handleStartRun = () => {
    if (engineRef.current) {
      engineRef.current.setCustomization(customization);
      engineRef.current.start(hudData.currentChapterIdx);
      setGameState('playing');
    }
  };

  const handlePause = () => {
    if (engineRef.current) {
      engineRef.current.pause();
      setGameState('paused');
    }
  };

  const handleResume = () => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
      setGameState('playing');
    }
  };

  const handleSaveCustomization = (newCust: PlayerCustomization) => {
    setCustomization(newCust);
    if (engineRef.current) {
      engineRef.current.setCustomization(newCust);
    }
  };

  const handleUpdateAudioSettings = (newSettings: Partial<AudioSettings>) => {
    const updated = { ...audioSettings, ...newSettings };
    setAudioSettings(updated);
    if (engineRef.current) {
      engineRef.current.updateAudioSettings(updated);
    }
  };

  const currentChapterObj = CHAPTERS[hudData.currentChapterIdx] || CHAPTERS[0];
  const activeCarModel = CAR_MODELS.find((m) => m.id === customization.carModelId) || CAR_MODELS[0];

  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Arcade Cabinet Container */}
      <div className="relative w-full max-w-[500px] h-full bg-slate-950 border-x border-cyan-500/20 shadow-[0_0_80px_rgba(0,246,255,0.15)] overflow-hidden flex flex-col">
        
        {/* Canvas Game Area */}
        <div className="relative flex-1 w-full h-full">
          <canvas ref={canvasRef} className="block w-full h-full touch-none" />

          {/* 1. INITIAL LOADING BAR STAGE */}
          {initialStage === 'loading' && (
            <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              {/* Background Cyber Rays */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,246,255,0.12)_0%,transparent_70%)] animate-pulse pointer-events-none" />

              <div className="relative z-10 flex flex-col items-center">
                <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-500/40 rounded-full text-cyan-400 font-mono text-xs font-bold mb-4 shadow-[0_0_20px_rgba(0,246,255,0.3)]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> ARCADE HIGHWAY RACER
                </div>
                <h1 className="text-4xl sm:text-5xl font-black font-mono text-cyan-400 tracking-wider mb-1 drop-shadow-[0_0_30px_rgba(0,246,255,0.9)] animate-pulse">
                  NEON NITRO
                </h1>
                <p className="text-xs font-mono tracking-[0.4em] text-pink-500 font-bold mb-10">HIGHWAY VELOCITY</p>

                {/* Progress Bar Container */}
                <div className="w-full max-w-xs bg-slate-900 border border-cyan-500/30 rounded-full p-1 shadow-[0_0_20px_rgba(0,246,255,0.15)] mb-3">
                  <div
                    className="h-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-75 shadow-[0_0_20px_rgba(0,246,255,0.9)]"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>

                <div className="text-xs font-mono font-bold text-cyan-300 tracking-widest animate-pulse">
                  {loadProgress}% - {loadStatusText}
                </div>
              </div>
            </div>
          )}

          {/* 2. TOUCH ON SCREEN TO CONTINUE STAGE */}
          {initialStage === 'touchToContinue' && (
            <div
              onClick={handleTouchContinue}
              className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none overflow-hidden"
            >
              {/* Animated Background Cyber Pulse */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,246,255,0.18)_0%,transparent_75%)] animate-pulse pointer-events-none" />

              {/* NEON NITRO LOGO */}
              <div className="relative z-10 flex flex-col items-center mb-10">
                <div className="flex items-center gap-2 px-3.5 py-1 bg-cyan-950/80 border border-cyan-500/50 rounded-full text-cyan-400 font-mono text-xs font-bold mb-4 shadow-[0_0_20px_rgba(0,246,255,0.4)]">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> ARCADE HIGHWAY RACER
                </div>
                <h1 className="text-4xl sm:text-5xl font-black font-mono text-cyan-400 tracking-wider mb-1 drop-shadow-[0_0_35px_rgba(0,246,255,1)]">
                  NEON NITRO
                </h1>
                <p className="text-xs font-mono tracking-[0.4em] text-pink-500 font-bold">HIGHWAY VELOCITY</p>
              </div>

              {/* TAP TO CONTINUE CALLOUT WITH PULSING NEON GLOW RING */}
              <div className="relative z-10 flex flex-col items-center animate-bounce">
                <div className="relative p-5 bg-cyan-950/90 border-2 border-cyan-400 rounded-full mb-4 shadow-[0_0_40px_rgba(0,246,255,0.6)]">
                  <Play className="w-10 h-10 text-cyan-300 fill-cyan-300 ml-1" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-mono text-cyan-300 tracking-wider mb-2 drop-shadow-[0_0_25px_rgba(0,246,255,0.9)]">
                  TOUCH ON SCREEN TO CONTINUE
                </h2>
                <p className="text-xs font-mono text-slate-400 tracking-widest uppercase">
                  TAP OR CLICK ANYWHERE TO ENTER GARAGE
                </p>
              </div>
            </div>
          )}

          {/* HUD Overlay (Playing or Paused) */}
          {(gameState === 'playing' || gameState === 'paused') && initialStage === 'ready' && (
            <>
              <HUD
                score={hudData.score}
                speedKmh={hudData.speedKmh}
                fuel={hudData.fuel}
                lives={hudData.lives}
                chapterDistanceLeft={hudData.chapterDistanceLeft}
                currentChapterIdx={hudData.currentChapterIdx}
                totalChapters={hudData.totalChapters}
                combo={hudData.combo}
                chapterName={currentChapterObj.name}
              />

              <ControlsOverlay
                onSteerLeft={(active) => engineRef.current?.setTouchControls(active, false)}
                onSteerRight={(active) => engineRef.current?.setTouchControls(false, active)}
              />

              {/* Pause Button */}
              <button
                onClick={handlePause}
                className="absolute top-14 right-3 z-30 p-2 bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl text-cyan-400 hover:text-white transition shadow-lg"
              >
                <Pause className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Life Toast Alert */}
          {lifeToast.show && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 text-center pointer-events-none animate-bounce">
              <div className="text-3xl font-black font-mono text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]">
                {lifeToast.msg}
              </div>
              <div className="text-xs font-mono text-red-200 mt-1 uppercase tracking-widest">{lifeToast.sub}</div>
            </div>
          )}

          {/* 3. MAIN GARAGE & RACE SELECT OVERLAY */}
          {gameState === 'start' && initialStage === 'ready' && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto">
              
              {/* Top Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px] font-bold tracking-widest">
                    <Sparkles className="w-3 h-3" /> TUNING GARAGE & RACE SELECT
                  </div>
                  <h1 className="text-2xl font-black font-mono text-white tracking-wider">NEON NITRO</h1>
                </div>
                <button
                  onClick={() => setActiveModal('settings')}
                  className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>

              {/* Central Garage Interactive Car Display */}
              <div className="my-3 flex flex-col gap-2.5">
                <CarPreviewCanvas customization={customization} />

                {/* Car Spec & Quick Customization Strip */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-1.5">
                    <span className="font-bold text-slate-300">{activeCarModel.name}</span>
                    <span className="text-cyan-400 text-[11px] font-bold">{activeCarModel.tagline}</span>
                  </div>

                  {/* Paint Color Quick Select */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <Palette className="w-3 h-3 text-cyan-400" /> PAINT:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto py-0.5">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCustomization((prev) => ({ ...prev, colorId: c.id }))}
                          className={`w-5 h-5 rounded-full border transition ${
                            customization.colorId === c.id ? 'border-white scale-110 shadow-[0_0_8px_white]' : 'border-transparent opacity-70'
                          }`}
                          style={{ backgroundColor: c.glowHex }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Underglow Quick Select */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                      <SunMedium className="w-3 h-3 text-purple-400" /> GLOW:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto py-0.5">
                      {UNDERGLOW_OPTIONS.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => setCustomization((prev) => ({ ...prev, neonUnderglowId: u.id }))}
                          className={`w-5 h-5 rounded-full border transition ${
                            customization.neonUnderglowId === u.id ? 'border-white scale-110 shadow-[0_0_8px_white]' : 'border-transparent opacity-70'
                          }`}
                          style={{ backgroundColor: u.hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stage Select & Race Launch */}
              <div className="flex flex-col gap-2 mb-2">
                {/* Stage Button */}
                <button
                  onClick={() => setActiveModal('chapters')}
                  className="w-full p-3 bg-slate-900 border border-purple-500/40 hover:border-purple-400 rounded-xl text-slate-200 font-mono text-xs flex items-center justify-between transition shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-purple-400" />
                    <span className="font-bold">
                      STAGE {hudData.currentChapterIdx + 1}: {currentChapterObj.name.toUpperCase()}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-400" />
                </button>

                {/* Garage Full Tuning Button */}
                <button
                  onClick={() => setActiveModal('garage')}
                  className="w-full p-2.5 bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-cyan-400 font-mono text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <Wrench className="w-4 h-4" /> OPEN FULL TUNING GARAGE
                </button>

                {/* RACE START BUTTON */}
                <button
                  onClick={handleStartRun}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black font-mono tracking-widest rounded-xl shadow-[0_0_25px_rgba(0,246,255,0.5)] transition text-base flex items-center justify-center gap-2 uppercase mt-1"
                >
                  <Play className="w-5 h-5 fill-slate-950" /> START RACE
                </button>
              </div>

            </div>
          )}

          {/* Pause Menu Overlay */}
          {gameState === 'paused' && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-lg p-6 flex flex-col items-center justify-center text-center gap-5">
              <h2 className="text-3xl font-black font-mono text-cyan-400 tracking-wider">GAME PAUSED</h2>

              <div className="w-full max-w-xs flex flex-col gap-3">
                <button
                  onClick={handleResume}
                  className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-mono tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,246,255,0.4)] transition uppercase text-sm"
                >
                  RESUME RACE
                </button>

                <button
                  onClick={() => {
                    if (engineRef.current) engineRef.current.pause();
                    setGameState('start');
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold rounded-xl transition text-xs uppercase"
                >
                  QUIT TO GARAGE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'garage' && (
        <GarageModal
          customization={customization}
          onSaveCustomization={handleSaveCustomization}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'chapters' && (
        <ChapterSelectModal
          currentChapterIdx={hudData.currentChapterIdx}
          unlockedChapterIdx={unlockedChapterIdx}
          onSelectChapter={(idx) => setHudData((prev) => ({ ...prev, currentChapterIdx: idx }))}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={audioSettings}
          onUpdateSettings={handleUpdateAudioSettings}
          onClose={() => setActiveModal(null)}
        />
      )}

      {gameState === 'gameOver' && (
        <GameOverModal
          finalStats={finalStats}
          onRestart={handleStartRun}
          onOpenGarage={() => {
            setGameState('start');
            setActiveModal('garage');
          }}
        />
      )}

      {gameState === 'chapterComplete' && (
        <ChapterCompleteModal
          chapter={currentChapterObj}
          totalChapters={CHAPTERS.length}
          onNextChapter={() => {
            engineRef.current?.nextChapter();
            setGameState('playing');
          }}
        />
      )}
    </div>
  );
}
