import React, { useEffect, useRef } from 'react';
import { PlayerCustomization } from '../types';
import { GameRenderer } from '../game/renderer';

interface CarPreviewCanvasProps {
  customization: PlayerCustomization;
  className?: string;
}

export const CarPreviewCanvas: React.FC<CarPreviewCanvasProps> = ({ customization, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let animTime = 0;
    const renderer = new GameRenderer(ctx);

    // Cyber floating background particles
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * 380,
      y: Math.random() * 220,
      radius: Math.random() * 1.8 + 0.6,
      speedY: Math.random() * 0.4 + 0.15,
      alpha: Math.random() * 0.7 + 0.2,
    }));

    const renderPreview = () => {
      animTime += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Dark Showroom Floor Gradient
      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7);
      bgGrad.addColorStop(0, '#0e1224');
      bgGrad.addColorStop(0.6, '#060812');
      bgGrad.addColorStop(1, '#020306');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Moving Neon Showroom Floor Perspective Grid
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 246, 255, 0.09)';
      ctx.lineWidth = 1;
      const gridSize = 22;
      const offsetY = (animTime * 15) % gridSize;

      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = -gridSize; y <= h + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + offsetY);
        ctx.lineTo(w, y + offsetY);
        ctx.stroke();
      }
      ctx.restore();

      // Floating Cyber Ambient Particles
      ctx.save();
      particles.forEach((p) => {
        p.y -= p.speedY;
        if (p.y < 0) {
          p.y = h;
          p.x = Math.random() * w;
        }
        ctx.fillStyle = `rgba(0, 246, 255, ${p.alpha * (0.6 + 0.4 * Math.sin(animTime * 2 + p.x))})`;
        ctx.shadowColor = 'rgba(0, 246, 255, 0.8)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
      ctx.restore();

      // Showroom Pedestal Platform Ring with Pulsing Glow
      ctx.save();
      ctx.translate(w / 2, h / 2 + 10);
      const pulseGlow = 0.15 + Math.sin(animTime * 3) * 0.05;
      const ringGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 115);
      ringGrad.addColorStop(0, `rgba(0, 246, 255, ${pulseGlow})`);
      ringGrad.addColorStop(0.7, 'rgba(0, 246, 255, 0.03)');
      ringGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 115, 68, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pedestal Ring Edge
      ctx.strokeStyle = `rgba(0, 246, 255, ${0.4 + Math.sin(animTime * 2) * 0.15})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 246, 255, 0.7)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, 102, 60, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Headlight Projection Beams on Ground
      ctx.save();
      const carX = w / 2;
      const carY = h / 2 - 5 + Math.sin(animTime * 2.5) * 3;
      const engineRumbleX = (Math.random() - 0.5) * 0.4;
      const engineRumbleY = (Math.random() - 0.5) * 0.4;

      const beamGrad = ctx.createLinearGradient(carX, carY - 20, carX, carY - 110);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      beamGrad.addColorStop(0.5, 'rgba(0, 246, 255, 0.15)');
      beamGrad.addColorStop(1, 'rgba(0, 246, 255, 0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(carX - 10, carY - 20);
      ctx.lineTo(carX - 45, carY - 105);
      ctx.lineTo(carX + 45, carY - 105);
      ctx.lineTo(carX + 10, carY - 20);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw Car Centered with engine vibration, float bob, tilt & wheel spin
      const tilt = Math.sin(animTime * 1.8) * 0.05;
      const wheelSpin = animTime * 6;

      renderer.drawPlayerCar(
        carX + engineRumbleX,
        carY + engineRumbleY,
        0, // spin angle
        0.5, // speedFrac
        tilt, // tilt angle
        false, // isBraking
        customization, // customization object
        wheelSpin, // wheelSpin
        true // night mode for ground glow & headlights
      );

      // Sweeping Cyber Scanner Beam Effect
      ctx.save();
      const scanY = ((animTime * 60) % (h + 60)) - 30;
      if (scanY >= 30 && scanY <= h - 30) {
        const scanGrad = ctx.createLinearGradient(0, scanY - 4, 0, scanY + 4);
        scanGrad.addColorStop(0, 'rgba(0, 246, 255, 0)');
        scanGrad.addColorStop(0.5, 'rgba(0, 246, 255, 0.4)');
        scanGrad.addColorStop(1, 'rgba(0, 246, 255, 0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(carX - 70, scanY - 3, 140, 6);
      }
      ctx.restore();

      animId = requestAnimationFrame(renderPreview);
    };

    renderPreview();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [customization]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-cyan-500/40 shadow-[0_0_35px_rgba(0,246,255,0.2)] bg-slate-950 ${className}`}>
      <canvas
        ref={canvasRef}
        width={380}
        height={220}
        className="w-full h-auto block"
      />
      <div className="absolute top-2.5 left-3 text-[10px] font-mono font-bold text-cyan-400 bg-slate-950/85 px-2.5 py-1 rounded-lg border border-cyan-500/40 tracking-widest uppercase flex items-center gap-1.5 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        SHOWROOM PREVIEW
      </div>
    </div>
  );
};
