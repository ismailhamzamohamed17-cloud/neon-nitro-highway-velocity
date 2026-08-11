import React from 'react';
import { Heart, Zap, Shield, Flame } from 'lucide-react';

interface HUDProps {
  score: number;
  speedKmh: number;
  fuel: number;
  lives: number;
  chapterDistanceLeft: number;
  currentChapterIdx: number;
  totalChapters: number;
  combo: number;
  chapterName: string;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  speedKmh,
  fuel,
  lives,
  chapterDistanceLeft,
  currentChapterIdx,
  totalChapters,
  combo,
  chapterName,
}) => {
  const isFuelLow = fuel < 25;

  return (
    <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none z-10 select-none flex flex-col gap-2">
      {/* Top Bar: Score, Fuel Gauge, Speed */}
      <div className="flex justify-between items-start">
        {/* Left: Score & Combo */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 shadow-[0_0_15px_rgba(0,246,255,0.2)]">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">SCORE</div>
          <div className="text-xl font-bold font-mono text-white tracking-tight">{score.toLocaleString()}</div>
          {combo > 1 && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400 font-mono animate-bounce">
              <Flame className="w-3 h-3 fill-amber-400" />
              {combo}x MULTIPLIER
            </div>
          )}
        </div>

        {/* Center: Fuel Cell Bar */}
        <div className="flex-1 max-w-[180px] mx-2 bg-slate-950/80 backdrop-blur-md border border-amber-500/40 rounded-xl p-2 shadow-[0_0_15px_rgba(255,210,60,0.2)]">
          <div className="flex justify-between items-center text-[10px] font-mono text-amber-300 mb-1">
            <span className="flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 fill-amber-300" /> FUEL CELL
            </span>
            <span>{Math.round(fuel)}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-900 border border-amber-500/30 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                isFuelLow
                  ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]'
                  : 'bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400'
              }`}
              style={{ width: `${fuel}%` }}
            />
          </div>
        </div>

        {/* Right: Speedometer */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 text-right shadow-[0_0_15px_rgba(0,246,255,0.2)]">
          <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-mono">SPEED</div>
          <div className="text-xl font-bold font-mono text-cyan-300 tracking-tight">
            {speedKmh} <span className="text-xs text-slate-400 font-normal">km/h</span>
          </div>
        </div>
      </div>

      {/* Sub Bar: Distance, Lives, Chapter Title */}
      <div className="flex justify-between items-center text-xs font-mono">
        {/* Distance Remaining */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 rounded-lg px-2.5 py-1 text-emerald-400 shadow-[0_0_10px_rgba(18,255,158,0.2)] flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>DIST: <b className="text-white">{chapterDistanceLeft}m</b></span>
        </div>

        {/* Lives Counter */}
        <div className="flex gap-1.5 bg-slate-950/80 backdrop-blur-md border border-pink-500/40 rounded-lg px-2.5 py-1 shadow-[0_0_10px_rgba(255,43,214,0.2)]">
          {[0, 1, 2].map((idx) => (
            <Heart
              key={idx}
              className={`w-4 h-4 transition-all duration-300 ${
                idx < lives
                  ? 'text-pink-500 fill-pink-500 drop-shadow-[0_0_6px_rgba(255,43,214,0.8)] scale-100'
                  : 'text-slate-700 fill-slate-800 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Chapter Tracker */}
        <div className="bg-slate-950/80 backdrop-blur-md border border-purple-500/40 rounded-lg px-2.5 py-1 text-purple-300 shadow-[0_0_10px_rgba(123,43,255,0.2)] text-right">
          <span className="text-[10px] text-slate-400 block -mb-0.5">CH {currentChapterIdx + 1}/{totalChapters}</span>
          <span className="font-bold text-white text-[11px] truncate max-w-[100px] block">{chapterName}</span>
        </div>
      </div>
    </div>
  );
};
