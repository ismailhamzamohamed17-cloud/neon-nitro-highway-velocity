import React from 'react';
import { CHAPTERS } from '../game/constants';
import { Sun, CloudRain, CloudFog, Snowflake, X, Lock } from 'lucide-react';

interface ChapterSelectModalProps {
  currentChapterIdx: number;
  unlockedChapterIdx: number;
  onSelectChapter: (idx: number) => void;
  onClose: () => void;
}

export const ChapterSelectModal: React.FC<ChapterSelectModalProps> = ({
  currentChapterIdx,
  unlockedChapterIdx,
  onSelectChapter,
  onClose,
}) => {
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'rain':
        return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
      case 'fog':
        return <CloudFog className="w-3.5 h-3.5 text-slate-400" />;
      case 'snow':
        return <Snowflake className="w-3.5 h-3.5 text-cyan-300" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
      <div className="w-full max-w-2xl bg-slate-900 border border-purple-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(123,43,255,0.25)] flex flex-col gap-4 max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-2xl font-black font-mono text-purple-400 tracking-wider">STAGE SELECT</h2>
            <p className="text-xs text-slate-400 font-mono">
              UNLOCKED: {Math.min(CHAPTERS.length, unlockedChapterIdx + 1)} / {CHAPTERS.length} STAGES
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1">
          {CHAPTERS.map((ch) => {
            const isSelected = ch.index === currentChapterIdx;
            const isUnlocked = ch.index <= unlockedChapterIdx;

            return (
              <button
                key={ch.index}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectChapter(ch.index);
                    onClose();
                  }
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition ${
                  !isUnlocked
                    ? 'bg-slate-950/30 border-slate-900 opacity-50 cursor-not-allowed'
                    : isSelected
                    ? 'bg-purple-950/60 border-purple-400 shadow-[0_0_15px_rgba(123,43,255,0.3)]'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-black font-mono text-sm border border-white/10 shrink-0"
                  style={{
                    backgroundColor: isUnlocked ? ch.glow + '22' : '#1e293b',
                    color: isUnlocked ? ch.glow : '#64748b',
                  }}
                >
                  {isUnlocked ? ch.index + 1 : <Lock className="w-4 h-4 text-slate-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold font-mono text-xs text-white truncate">
                    {ch.name.toUpperCase()}
                  </div>
                  {isUnlocked ? (
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                      <span className="flex items-center gap-1">
                        {getWeatherIcon(ch.weather)}
                        <span className="capitalize">{ch.weather}</span>
                      </span>
                      <span>•</span>
                      <span className="capitalize">{ch.treeType} Trees</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      COMPLETE STAGE {ch.index} TO UNLOCK
                    </div>
                  )}
                </div>

                {isSelected ? (
                  <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950 border border-purple-500/40 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                ) : !isUnlocked ? (
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                    LOCKED
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
