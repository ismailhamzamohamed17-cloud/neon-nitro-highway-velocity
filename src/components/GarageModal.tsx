import React from 'react';
import { CAR_MODELS, COLOR_OPTIONS, UNDERGLOW_OPTIONS } from '../game/constants';
import { PlayerCustomization } from '../types';
import { Gauge, Zap, Compass, Check, X } from 'lucide-react';
import { CarPreviewCanvas } from './CarPreviewCanvas';

interface GarageModalProps {
  customization: PlayerCustomization;
  onSaveCustomization: (newCust: PlayerCustomization) => void;
  onClose: () => void;
}

export const GarageModal: React.FC<GarageModalProps> = ({ customization, onSaveCustomization, onClose }) => {
  const [selectedModelId, setSelectedModelId] = React.useState(customization.carModelId);
  const [selectedColorId, setSelectedColorId] = React.useState(customization.colorId);
  const [selectedUnderglowId, setSelectedUnderglowId] = React.useState(customization.neonUnderglowId);

  const activeCustomization: PlayerCustomization = {
    carModelId: selectedModelId,
    colorId: selectedColorId,
    neonUnderglowId: selectedUnderglowId,
  };

  const selectedModel = CAR_MODELS.find((m) => m.id === selectedModelId) || CAR_MODELS[0];

  const handleApply = () => {
    onSaveCustomization({
      carModelId: selectedModelId,
      colorId: selectedColorId,
      neonUnderglowId: selectedUnderglowId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,246,255,0.25)] flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-2xl font-black font-mono text-cyan-400 tracking-wider">TUNING GARAGE</h2>
            <p className="text-xs text-slate-400 font-mono">CUSTOMIZE VEHICLE MODEL, METALLIC PAINT & NEON UNDERGLOW</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Live Car Preview */}
        <CarPreviewCanvas customization={activeCustomization} />

        {/* 1. Car Model Selector */}
        <div>
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block mb-2">
            1. SELECT VEHICLE BODY
          </label>
          <div className="grid grid-cols-2 gap-3">
            {CAR_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 relative overflow-hidden ${
                    isSelected
                      ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,246,255,0.3)]'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold font-mono text-sm text-white">{model.name}</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-1">{model.tagline}</div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 text-cyan-400">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Performance Specs */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 flex flex-col gap-2.5 font-mono text-xs">
          <div className="text-slate-400 font-bold uppercase tracking-wider mb-1">PERFORMANCE SPECIFICATIONS</div>

          {/* Top Speed */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-slate-400 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" /> TOP SPEED
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${(selectedModel.topSpeed / 460) * 100}%` }}
              />
            </div>
            <span className="w-16 text-right font-bold text-cyan-300">{selectedModel.topSpeed} km/h</span>
          </div>

          {/* Acceleration */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> ACCEL
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{ width: `${(selectedModel.acceleration / 1.5) * 100}%` }}
              />
            </div>
            <span className="w-16 text-right font-bold text-amber-300">{selectedModel.acceleration}x</span>
          </div>

          {/* Handling */}
          <div className="flex items-center gap-3">
            <span className="w-24 text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" /> HANDLING
            </span>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full"
                style={{ width: `${(selectedModel.handling / 1.5) * 100}%` }}
              />
            </div>
            <span className="w-16 text-right font-bold text-emerald-300">{selectedModel.handling}x</span>
          </div>
        </div>

        {/* 2. Paint Colors */}
        <div>
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block mb-2">
            2. METALLIC PAINT COLOR
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {COLOR_OPTIONS.map((c) => {
              const isSelected = c.id === selectedColorId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedColorId(c.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                    isSelected ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full border border-white/20 shadow-inner"
                    style={{ backgroundColor: c.glowHex }}
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate w-full text-center">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Underglow Options */}
        <div>
          <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest block mb-2">
            3. NEON GROUND UNDERGLOW
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {UNDERGLOW_OPTIONS.map((g) => {
              const isSelected = g.id === selectedUnderglowId;
              return (
                <button
                  key={g.id}
                  onClick={() => setSelectedUnderglowId(g.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition ${
                    isSelected ? 'border-cyan-400 bg-cyan-950/40' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full border border-white/20 shadow-[0_0_12px_currentColor]"
                    style={{ backgroundColor: g.hex, color: g.hex }}
                  />
                  <span className="text-[10px] font-mono text-slate-300 truncate w-full text-center">{g.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save & Apply */}
        <button
          onClick={handleApply}
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black font-mono tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,246,255,0.4)] transition text-sm uppercase"
        >
          CONFIRM SETUP
        </button>
      </div>
    </div>
  );
};
