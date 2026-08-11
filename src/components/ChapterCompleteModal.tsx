import React from 'react';
import { Play, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Chapter } from '../types';

interface ChapterCompleteModalProps {
  chapter: Chapter;
  totalChapters: number;
  onNextChapter: () => void;
}

export const ChapterCompleteModal: React.FC<ChapterCompleteModalProps> = ({
  chapter,
  totalChapters,
  onNextChapter,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
      <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-[0_0_60px_rgba(18,255,158,0.25)] flex flex-col gap-5 text-center">
        {/* Banner */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 border border-emerald-500/40 rounded-full text-emerald-400 font-mono text-xs font-bold mb-2">
            <CheckCircle2 className="w-4 h-4" /> STAGE CLEARED
          </div>
          <h2 className="text-3xl font-black font-mono text-white tracking-wider uppercase">
            {chapter.name}
          </h2>
          <p className="text-xs text-purple-300 font-mono mt-1">
            CHAPTER {chapter.index + 1} OF {totalChapters} COMPLETED
          </p>
        </div>

        {/* Stage Specs */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-left font-mono text-xs flex flex-col gap-2">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">ENVIRONMENT WEATHER</span>
            <span className="capitalize font-bold text-cyan-300">{chapter.weather}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">ROADSIDE FLORA</span>
            <span className="capitalize font-bold text-emerald-300">{chapter.treeType} Trees</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-500">FUEL CELLS RECHARGED</span>
            <span className="font-bold text-amber-300">100% MAXIMUM</span>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={onNextChapter}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-mono tracking-wider rounded-xl shadow-[0_0_20px_rgba(18,255,158,0.4)] transition text-sm flex items-center justify-center gap-2 uppercase"
        >
          <Play className="w-5 h-5 fill-slate-950" /> CONTINUE TO NEXT CHAPTER
        </button>
      </div>
    </div>
  );
};
