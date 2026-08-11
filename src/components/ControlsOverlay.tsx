import React from 'react';
import { ChevronLeft, ChevronRight, Disc } from 'lucide-react';

interface ControlsOverlayProps {
  onSteerLeft: (active: boolean) => void;
  onSteerRight: (active: boolean) => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({ onSteerLeft, onSteerRight }) => {
  return (
    <div className="absolute inset-x-0 bottom-0 top-1/2 z-20 pointer-events-none flex select-none">
      {/* Touch Left Zone */}
      <div
        className="flex-1 h-full pointer-events-auto active:bg-cyan-500/10 transition-colors flex items-center justify-start p-6 text-cyan-500/30 active:text-cyan-400"
        onTouchStart={(e) => {
          e.preventDefault();
          onSteerLeft(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onSteerLeft(false);
        }}
        onMouseDown={() => onSteerLeft(true)}
        onMouseUp={() => onSteerLeft(false)}
        onMouseLeave={() => onSteerLeft(false)}
      >
        <ChevronLeft className="w-12 h-12 stroke-[3]" />
      </div>

      {/* Touch Right Zone */}
      <div
        className="flex-1 h-full pointer-events-auto active:bg-cyan-500/10 transition-colors flex items-center justify-end p-6 text-cyan-500/30 active:text-cyan-400"
        onTouchStart={(e) => {
          e.preventDefault();
          onSteerRight(true);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onSteerRight(false);
        }}
        onMouseDown={() => onSteerRight(true)}
        onMouseUp={() => onSteerRight(false)}
        onMouseLeave={() => onSteerRight(false)}
      >
        <ChevronRight className="w-12 h-12 stroke-[3]" />
      </div>
    </div>
  );
};
