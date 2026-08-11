import React from 'react';
import { AudioSettings } from '../types';
import { Volume2, VolumeX, Music, Gauge, X, Key, Smartphone } from 'lucide-react';

interface SettingsModalProps {
  settings: AudioSettings;
  onUpdateSettings: (newSettings: Partial<AudioSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-xl font-black font-mono text-cyan-400 tracking-wider">SETTINGS & AUDIO</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Volume */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <div className="flex justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-cyan-400" /> MASTER VOLUME
            </span>
            <span>{Math.round(settings.masterVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.masterVolume}
            onChange={(e) => onUpdateSettings({ masterVolume: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* SFX Volume */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <div className="flex justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" /> SFX VOLUME
            </span>
            <span>{Math.round(settings.sfxVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.sfxVolume}
            onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Music Volume */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <div className="flex justify-between text-slate-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Music className="w-4 h-4 text-purple-400" /> SYNTH MUSIC VOLUME
            </span>
            <span>{Math.round(settings.musicVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.musicVolume}
            onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
            className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Engine Sound Toggle */}
        <div className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs">
          <span className="text-slate-300 font-bold">PROCEDURAL ENGINE REV</span>
          <button
            onClick={() => onUpdateSettings({ engineSoundEnabled: !settings.engineSoundEnabled })}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              settings.engineSoundEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
          >
            {settings.engineSoundEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Controls Guide */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 flex flex-col gap-2">
          <div className="text-slate-200 font-bold flex items-center gap-1.5">
            <Key className="w-4 h-4 text-cyan-400" /> DESKTOP CONTROLS
          </div>
          <div>• Left / Right Arrow or A / D to steer</div>
          <div>• Down Arrow or S to brake & slow down</div>
          <div className="text-slate-200 font-bold flex items-center gap-1.5 mt-1">
            <Smartphone className="w-4 h-4 text-pink-400" /> TOUCH CONTROLS
          </div>
          <div>• Tap Left / Right side of screen to steer</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold rounded-xl transition text-xs uppercase"
        >
          CLOSE SETTINGS
        </button>
      </div>
    </div>
  );
};
