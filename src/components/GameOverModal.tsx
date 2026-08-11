import React from 'react';
import { RotateCcw, Trophy, Gauge, Flag, Compass } from 'lucide-react';

interface GameOverModalProps {
  finalStats: {
    score: number;
    distance: number;
    chapter: number;
    maxSpeed: number;
  };
  onRestart: () => void;
  onOpenGarage: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ finalStats, onRestart, onOpenGarage }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.25)] flex flex-col gap-5 text-center">
        {/* Title */}
        <div>
          <h2 className="text-3xl font-black font-mono text-red-500 tracking-wider drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]">
            RUN TERMINATED
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">OUT OF FUEL OR WRECKED IN HIGHWAY TRAFFIC</p>
        </div>

        {/* Stats Grid */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 grid grid-cols-2 gap-3 font-mono text-left">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> FINAL SCORE
            </div>
            <div className="text-xl font-bold text-white mt-1">{finalStats.score.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-purple-400" /> CHAPTER REACHED
            </div>
            <div className="text-xl font-bold text-purple-300 mt-1">{finalStats.chapter} / 28</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> DISTANCE COVERED
            </div>
            <div className="text-xl font-bold text-emerald-300 mt-1">{finalStats.distance.toLocaleString()}m</div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP SPEED
            </div>
            <div className="text-xl font-bold text-cyan-300 mt-1">{finalStats.maxSpeed} km/h</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRestart}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black font-mono tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,246,255,0.4)] transition text-sm flex items-center justify-center gap-2 uppercase"
          >
            <RotateCcw className="w-5 h-5" /> RETRY HIGHWAY RUN
          </button>

          <button
            onClick={onOpenGarage}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold rounded-xl border border-slate-700 transition text-xs uppercase"
          >
            TUNE VEHICLE IN GARAGE
          </button>
        </div>
      </div>
    </div>
  );
};
