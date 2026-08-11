import { Chapter, TreeType, VehicleEntity, Particle, SkidMark, PlayerCustomization } from '../types';
import { CAR_MODELS, COLOR_OPTIONS, UNDERGLOW_OPTIONS } from './constants';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private asphaltTile: HTMLCanvasElement;
  private asphaltPattern: CanvasPattern | null = null;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.asphaltTile = this.createAsphaltTile();
    this.asphaltPattern = this.ctx.createPattern(this.asphaltTile, 'repeat');
  }

  private createAsphaltTile(): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const tctx = c.getContext('2d')!;
    tctx.fillStyle = '#08080c';
    tctx.fillRect(0, 0, 256, 256);

    // Fine speckled noise
    for (let i = 0; i < 2200; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const v = Math.random();
      const shade = v < 0.5 ? 18 + Math.random() * 25 : 38 + Math.random() * 45;
      tctx.fillStyle = `rgba(${shade},${shade},${shade + 8},${0.3 + Math.random() * 0.4})`;
      const s = Math.random() * 1.8 + 0.4;
      tctx.fillRect(x, y, s, s);
    }
    return c;
  }

  // Helper for rounded paths
  public roundedRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }

  // ==========================================
  // TREE RENDERING (Pine, Palm, Cyber, Sakura)
  // ==========================================
  public drawTree(x: number, y: number, ch: Chapter, elapsed: number = 0) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Wind Sway Animation Angle
    const sway = Math.sin(elapsed * 2.8 + x * 0.04 + y * 0.02) * 0.07;
    ctx.rotate(sway);

    // Ground contact shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.filter = 'blur(3px)';
    ctx.beginPath();
    ctx.ellipse(2, 14, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    switch (ch.treeType) {
      case 'pine':
        this.drawPineTree(ch, elapsed, x, y);
        break;
      case 'cyber':
        this.drawCyberTree(ch, elapsed, x, y);
        break;
      case 'palm':
        this.drawPalmTree(ch, elapsed, x, y);
        break;
      case 'sakura':
        this.drawSakuraTree(ch, elapsed, x, y);
        break;
    }

    ctx.restore();
  }

  private drawPineTree(ch: Chapter, elapsed: number, x: number, y: number) {
    const ctx = this.ctx;
    const isSnow = ch.weather === 'snow';
    const baseHue = isSnow ? 200 : ch.hue + 35;

    // Trunk
    const trunkGrad = ctx.createLinearGradient(-4, 0, 4, 0);
    trunkGrad.addColorStop(0, '#120a06');
    trunkGrad.addColorStop(0.5, '#482715');
    trunkGrad.addColorStop(1, '#24130a');
    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.lineTo(-4.5, 15);
    ctx.lineTo(4.5, 15);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();

    // 3 Foliage Tiers with 3D Radial Gradients and sway offsets
    const tiers = [
      { cy: -8, r: 18, dx: -2 },
      { cy: -22, r: 14, dx: 1.5 },
      { cy: -34, r: 10, dx: -1 },
    ];

    tiers.forEach((t, i) => {
      ctx.save();
      const tierSway = Math.sin(elapsed * 3.5 + i * 1.2 + x * 0.05) * (1.5 + i * 0.8);
      ctx.translate(t.dx + tierSway, t.cy);
      const grad = ctx.createRadialGradient(-t.r * 0.35, -t.r * 0.35, t.r * 0.1, 0, 0, t.r * 1.1);

      if (isSnow) {
        grad.addColorStop(0, 'rgba(255,255,255,0.98)');
        grad.addColorStop(0.6, 'rgba(215,230,250,0.92)');
        grad.addColorStop(1, 'rgba(140,160,190,0.85)');
      } else {
        grad.addColorStop(0, `hsla(${baseHue}, 70%, ${38 + i * 8}%, 1)`);
        grad.addColorStop(0.6, `hsla(${baseHue}, 60%, ${26 + i * 6}%, 1)`);
        grad.addColorStop(1, `hsla(${baseHue}, 50%, 14%, 1)`);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, -t.r * 1.2);
      ctx.quadraticCurveTo(t.r * 1.1, -t.r * 0.1, t.r * 0.75, t.r * 0.7);
      ctx.quadraticCurveTo(0, t.r * 1.0, -t.r * 0.75, t.r * 0.7);
      ctx.quadraticCurveTo(-t.r * 1.1, -t.r * 0.1, 0, -t.r * 1.2);
      ctx.closePath();
      ctx.fill();

      // Rim light accent
      ctx.strokeStyle = isSnow ? 'rgba(255,255,255,0.6)' : `hsla(${baseHue}, 90%, 75%, 0.4)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    });
  }

  private drawCyberTree(ch: Chapter, elapsed: number, x: number, y: number) {
    const ctx = this.ctx;
    const glowColor = ch.glow;

    // Holographic digital trunk with pulse
    const pulseGlow = 10 + Math.sin(elapsed * 6 + x) * 5;
    ctx.strokeStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = pulseGlow;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(0, -10);
    ctx.lineTo(-8, -22);
    ctx.moveTo(0, -10);
    ctx.lineTo(8, -22);
    ctx.stroke();

    // Geometric nodes
    const nodes = [
      { x: 0, y: -36, r: 11 },
      { x: -14, y: -24, r: 8 },
      { x: 14, y: -24, r: 8 },
    ];

    nodes.forEach((n, i) => {
      ctx.save();
      const nodePhase = Math.sin(elapsed * 5 + i * 2);
      ctx.translate(n.x, n.y);
      ctx.fillStyle = 'rgba(10,15,30,0.85)';
      ctx.beginPath();
      ctx.arc(0, 0, n.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Inner glowing core
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(0, 0, n.r * (0.35 + nodePhase * 0.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.shadowBlur = 0;
  }

  private drawPalmTree(ch: Chapter, elapsed: number, x: number, y: number) {
    const ctx = this.ctx;
    // Curved trunk with wind bend
    ctx.strokeStyle = '#3d2516';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.quadraticCurveTo(-6, 0, -2, -22);
    ctx.stroke();

    // Trunk ring details
    ctx.strokeStyle = '#6e442b';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const ty = 12 - i * 7;
      ctx.beginPath();
      ctx.moveTo(-3, ty);
      ctx.lineTo(3, ty);
      ctx.stroke();
    }

    // Sweeping fronds waving in wind
    ctx.save();
    ctx.translate(-2, -22);
    const frondColor = `hsla(${ch.hue + 20}, 85%, 55%, 1)`;
    ctx.strokeStyle = frondColor;
    ctx.shadowColor = frondColor;
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.2;

    const angles = [-2.4, -1.8, -1.1, -0.4, 0.3, 0.9];
    angles.forEach((a, i) => {
      const wave = Math.sin(elapsed * 4 + i * 1.2 + x * 0.1) * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const endX = Math.cos(a + wave) * 24;
      const endY = Math.sin(a + wave) * 18;
      ctx.quadraticCurveTo(endX * 0.5, endY * 0.3 - 6, endX, endY);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawSakuraTree(ch: Chapter, elapsed: number, x: number, y: number) {
    const ctx = this.ctx;
    // Dark organic trunk
    ctx.strokeStyle = '#22121e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.quadraticCurveTo(4, 0, -3, -18);
    ctx.stroke();

    // Blossom cloud clusters with floating pulse
    const clusters = [
      { x: -3, y: -22, r: 16, color: '#ff99dd' },
      { x: -16, y: -16, r: 12, color: '#ff66cb' },
      { x: 12, y: -18, r: 13, color: '#ffb3e6' },
    ];

    clusters.forEach((cl, i) => {
      ctx.save();
      const waveX = Math.sin(elapsed * 3 + i * 1.5 + x * 0.05) * 2;
      const waveY = Math.cos(elapsed * 2.5 + i * 1.5) * 1.5;
      ctx.translate(cl.x + waveX, cl.y + waveY);
      ctx.fillStyle = cl.color;
      ctx.shadowColor = cl.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, cl.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
  }

  public drawBird(x: number, y: number, size: number, wingPhase: number, color: string, isCyber: boolean) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    const wingOffset = Math.sin(wingPhase) * (size * 0.7);

    if (isCyber) {
      // Neon Cyber Drone Bird
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.fillStyle = color;

      // Central core
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Cyber angular wings
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-size * 1.2, -wingOffset);
      ctx.lineTo(-size * 0.6, -wingOffset * 0.3);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 1.2, -wingOffset);
      ctx.lineTo(size * 0.6, -wingOffset * 0.3);
      ctx.closePath();
      ctx.stroke();
    } else {
      // Natural Graceful Flapping Bird Silhouette
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(-size, -wingOffset);
      ctx.quadraticCurveTo(-size * 0.5, -wingOffset * 0.5 - size * 0.3, 0, 0);
      ctx.quadraticCurveTo(size * 0.5, -wingOffset * 0.5 - size * 0.3, size, -wingOffset);
      ctx.stroke();

      // Subtle tail feather
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, size * 0.35);
      ctx.stroke();
    }

    ctx.restore();
  }

  public drawRoadEdgeLamps(cx: number, hw: number, y: number, ch: Chapter) {
    const ctx = this.ctx;
    ctx.save();

    const lx = cx - hw - 8;
    const rx = cx + hw + 8;

    // Pole structure
    ctx.strokeStyle = '#2b3242';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(lx, y);
    ctx.lineTo(lx, y - 22);
    ctx.lineTo(lx + 8, y - 26);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rx, y);
    ctx.lineTo(rx, y - 22);
    ctx.lineTo(rx - 8, y - 26);
    ctx.stroke();

    // Lamp Bulb Glow
    ctx.fillStyle = ch.glow;
    ctx.shadowColor = ch.glow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(lx + 8, y - 26, 3, 0, Math.PI * 2);
    ctx.arc(rx - 8, y - 26, 3, 0, Math.PI * 2);
    ctx.fill();

    // Soft Light Cones on Road Edges
    ctx.fillStyle = ch.glow;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.ellipse(lx + 8, y, 18, 7, 0, 0, Math.PI * 2);
    ctx.ellipse(rx - 8, y, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // VEHICLE RENDERING (Player & Traffic)
  // ==========================================
  public drawWheels(len: number, wid: number, spinAngle: number) {
    const ctx = this.ctx;
    const wheelW = wid * 0.36;
    const wheelH = len * 0.35;
    const positions = [
      [-wid * 0.88, -len * 0.34],
      [wid * 0.88, -len * 0.34],
      [-wid * 0.92, len * 0.42],
      [wid * 0.92, len * 0.42],
    ];

    positions.forEach(([wx, wy]) => {
      ctx.save();
      ctx.translate(wx, wy);

      // Tread & rubber cylinder
      const tireGrad = ctx.createLinearGradient(-wheelW / 2, 0, wheelW / 2, 0);
      tireGrad.addColorStop(0, '#050508');
      tireGrad.addColorStop(0.5, '#22222a');
      tireGrad.addColorStop(1, '#050508');
      ctx.fillStyle = tireGrad;
      this.roundedRect(-wheelW / 2, -wheelH / 2, wheelW, wheelH, wheelW * 0.3);
      ctx.fill();

      // Spinning rim & brake caliper
      ctx.save();
      ctx.rotate(spinAngle || 0);
      const hubR = Math.min(wheelW, wheelH) * 0.38;

      ctx.fillStyle = '#ff3300'; // Brake caliper glow behind rim
      ctx.fillRect(-hubR * 0.5, -hubR * 0.5, hubR, hubR * 0.6);

      const hubGrad = ctx.createRadialGradient(-hubR * 0.3, -hubR * 0.3, 0.5, 0, 0, hubR);
      hubGrad.addColorStop(0, '#ffffff');
      hubGrad.addColorStop(1, '#8888a0');
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(0, 0, hubR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#333344';
      ctx.lineWidth = 0.9;
      for (let s = 0; s < 5; s++) {
        const ang = (s / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(ang) * hubR, Math.sin(ang) * hubR);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    });
  }

  public drawPlayerCar(
    x: number,
    y: number,
    spin: number,
    speedFrac: number,
    tilt: number,
    isBraking: boolean,
    customization: PlayerCustomization,
    wheelSpin: number,
    night: boolean
  ) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin + tilt);

    const model = CAR_MODELS.find((m) => m.id === customization.carModelId) || CAR_MODELS[0];
    const colorOpt = COLOR_OPTIONS.find((c) => c.id === customization.colorId) || COLOR_OPTIONS[0];
    const glowHex = UNDERGLOW_OPTIONS.find((g) => g.id === customization.neonUnderglowId)?.hex || colorOpt.glowHex;

    // 1. Neon Ground Underglow (Real-time ground bloom)
    ctx.save();
    ctx.fillStyle = glowHex;
    ctx.shadowColor = glowHex;
    ctx.shadowBlur = 28;
    ctx.globalAlpha = 0.65 + speedFrac * 0.25;
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Night Headlight Cones thrown forward
    if (night) {
      ctx.save();
      const cone = ctx.createRadialGradient(0, -45, 6, 0, -45, 150);
      cone.addColorStop(0, 'rgba(255,255,230,0.4)');
      cone.addColorStop(1, 'rgba(255,255,230,0)');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(-10, -20);
      ctx.lineTo(10, -20);
      ctx.lineTo(55, -170);
      ctx.lineTo(-55, -170);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 3. Dual Exhaust Flame Thrusters
    ctx.save();
    ctx.globalAlpha = 0.7 + speedFrac * 0.3;
    const flameLen = 18 + speedFrac * 26;
    const flameGrad = ctx.createLinearGradient(0, 18, 0, 18 + flameLen);
    flameGrad.addColorStop(0, '#ffffff');
    flameGrad.addColorStop(0.3, glowHex);
    flameGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flameGrad;

    [-7, 7].forEach((off) => {
      ctx.beginPath();
      ctx.moveTo(off - 3, 18);
      ctx.lineTo(off + 3, 18);
      ctx.lineTo(off + 1, 18 + flameLen);
      ctx.lineTo(off - 1, 18 + flameLen);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // 4. Vehicle Body rendering with unique model specifications
    let carLen = 23;
    let carWid = 12.5;
    let noseTaper = 0.65;
    let tailTaper = 0.55;

    if (model.bodyStyle === 'muscle') {
      carLen = 26;
      carWid = 15.5;
      noseTaper = 0.85;
      tailTaper = 0.80;
    } else if (model.bodyStyle === 'super') {
      carLen = 25;
      carWid = 14;
      noseTaper = 0.42;
      tailTaper = 0.38;
    } else if (model.bodyStyle === 'hyper') {
      carLen = 28;
      carWid = 14.5;
      noseTaper = 0.32;
      tailTaper = 0.30;
    }

    this.drawVehicleBody({
      len: carLen,
      wid: carWid,
      dark: colorOpt.darkHex,
      mid: colorOpt.midHex,
      light: colorOpt.lightHex,
      glow: glowHex,
      noseTaper,
      tailTaper,
      headlight: true,
      taillight: true,
      isBraking,
      spoiler: model.bodyStyle !== 'muscle',
      cargo: false,
      mirrors: true,
      spinAngle: wheelSpin,
      carbonHood: model.bodyStyle === 'hyper' || model.bodyStyle === 'super',
      bodyStyle: model.bodyStyle as 'sports' | 'muscle' | 'super' | 'hyper',
    });

    ctx.restore();
  }

  public drawVehicleBody(opts: {
    len: number;
    wid: number;
    dark: string;
    mid: string;
    light: string;
    glow: string;
    noseTaper: number;
    tailTaper: number;
    headlight: boolean;
    taillight: boolean;
    isBraking?: boolean;
    spoiler: boolean;
    cargo: boolean;
    mirrors: boolean;
    spinAngle: number;
    carbonHood?: boolean;
    bodyStyle?: 'sports' | 'muscle' | 'super' | 'hyper';
  }) {
    const ctx = this.ctx;
    const { len, wid, glow } = opts;
    const style = opts.bodyStyle || 'sports';

    ctx.save();

    // Ground Drop Shadow
    ctx.save();
    ctx.translate(2, len * 0.22);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.filter = 'blur(3px)';
    ctx.beginPath();
    ctx.ellipse(0, 0, wid * 1.15, len * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    this.drawWheels(len, wid, opts.spinAngle);

    // 1. SPECIFIC BODY ADDONS (Underbody / Flares)
    if (style === 'muscle') {
      // Wide Fender Flares on 4 corners
      ctx.fillStyle = opts.dark;
      ctx.strokeStyle = opts.mid;
      ctx.lineWidth = 1;
      [-len * 0.65, len * 0.55].forEach((yPos) => {
        ctx.beginPath();
        ctx.ellipse(-wid * 1.05, yPos, wid * 0.22, len * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(wid * 1.05, yPos, wid * 0.22, len * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    } else if (style === 'super') {
      // Front Aerodynamic Splitter & Side Ground Effect Winglets
      ctx.fillStyle = '#0a0d14';
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -len * 1.08);
      ctx.lineTo(wid * 0.85, -len * 0.95);
      ctx.lineTo(wid * 0.95, -len * 0.85);
      ctx.lineTo(-wid * 0.95, -len * 0.85);
      ctx.lineTo(-wid * 0.85, -len * 0.95);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Side Skirt Winglets
      ctx.fillRect(-wid * 1.12, -len * 0.3, wid * 0.15, len * 0.6);
      ctx.fillRect(wid * 0.97, -len * 0.3, wid * 0.15, len * 0.6);
    } else if (style === 'hyper') {
      // Prototype Corner Dive Planes (Canards)
      ctx.fillStyle = '#05070a';
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-wid * 0.8, -len * 0.82);
      ctx.lineTo(-wid * 1.15, -len * 0.72);
      ctx.lineTo(-wid * 0.85, -len * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(wid * 0.8, -len * 0.82);
      ctx.lineTo(wid * 1.15, -len * 0.72);
      ctx.lineTo(wid * 0.85, -len * 0.65);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Body metallic gradient
    const bodyGrad = ctx.createLinearGradient(-wid, 0, wid, 0);
    bodyGrad.addColorStop(0.0, opts.dark);
    bodyGrad.addColorStop(0.4, opts.mid);
    bodyGrad.addColorStop(0.5, opts.light);
    bodyGrad.addColorStop(0.6, opts.mid);
    bodyGrad.addColorStop(1.0, opts.dark);

    // Rounded car hull path
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.bezierCurveTo(wid * opts.noseTaper, -len, wid, -len * 0.45, wid, -len * 0.15);
    ctx.bezierCurveTo(wid * 1.05, len * 0.05, wid * 1.02, len * 0.55, wid * 0.88, len * 0.72);
    ctx.bezierCurveTo(wid * 0.82, len * 0.92, wid * opts.tailTaper, len, 0, len);
    ctx.bezierCurveTo(-wid * opts.tailTaper, len, -wid * 0.82, len * 0.92, -wid * 0.88, len * 0.72);
    ctx.bezierCurveTo(-wid * 1.02, len * 0.55, -wid * 1.05, len * 0.05, -wid, -len * 0.15);
    ctx.bezierCurveTo(-wid, -len * 0.45, -wid * opts.noseTaper, -len, 0, -len);
    ctx.closePath();

    ctx.fillStyle = bodyGrad;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = glow;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 2. UNIQUE CUSTOM HOOD / DECALS
    if (style === 'muscle') {
      // Dual Racing Stripes down center
      ctx.fillStyle = opts.light;
      ctx.globalAlpha = 0.85;
      [-wid * 0.26, wid * 0.08].forEach((xOff) => {
        ctx.fillRect(xOff, -len * 0.95, wid * 0.18, len * 1.88);
      });
      ctx.globalAlpha = 1.0;

      // Supercharger Blower Scoop sticking out of hood
      ctx.save();
      ctx.translate(0, -len * 0.52);
      ctx.fillStyle = '#222530';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-wid * 0.32, -len * 0.12, wid * 0.64, len * 0.22);
      ctx.strokeRect(-wid * 0.32, -len * 0.12, wid * 0.64, len * 0.22);

      // Red Dual Intake Butterflies
      ctx.fillStyle = '#ff2233';
      ctx.beginPath();
      ctx.arc(-wid * 0.15, -len * 0.02, wid * 0.1, 0, Math.PI * 2);
      ctx.arc(wid * 0.15, -len * 0.02, wid * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (style === 'hyper' || opts.carbonHood) {
      // Carbon Fiber Weave Hood
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.moveTo(-wid * 0.52, -len * 0.85);
      ctx.lineTo(wid * 0.52, -len * 0.85);
      ctx.lineTo(wid * 0.38, -len * 0.25);
      ctx.lineTo(-wid * 0.38, -len * 0.25);
      ctx.closePath();
      ctx.fill();

      // Hood Vents / Heat extractors
      ctx.fillStyle = '#000000';
      [-wid * 0.25, wid * 0.12].forEach((xOff) => {
        ctx.fillRect(xOff, -len * 0.65, wid * 0.13, len * 0.25);
      });
      ctx.restore();
    } else if (style === 'sports') {
      // Dual GT Bonnet Vents
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(-wid * 0.3, -len * 0.5, wid * 0.08, len * 0.18, -0.2, 0, Math.PI * 2);
      ctx.ellipse(wid * 0.3, -len * 0.5, wid * 0.08, len * 0.18, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. WINDSHIELD GLASS & CANOPY
    if (style === 'hyper') {
      // Fighter Jet Central Teardrop Canopy
      const glassGrad = ctx.createRadialGradient(0, -len * 0.1, 2, 0, -len * 0.1, len * 0.35);
      glassGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
      glassGrad.addColorStop(0.5, 'rgba(0,246,255,0.6)');
      glassGrad.addColorStop(1, 'rgba(10,15,30,0.9)');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.ellipse(0, -len * 0.1, wid * 0.42, len * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = glow;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Roof Air Scoop Intake
      ctx.fillStyle = '#0f1420';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.fillRect(-wid * 0.18, -len * 0.42, wid * 0.36, len * 0.18);
      ctx.strokeRect(-wid * 0.18, -len * 0.42, wid * 0.36, len * 0.18);
    } else {
      // Standard / Super / Muscle Windshield
      const glassGrad = ctx.createLinearGradient(0, -len * 0.55, 0, len * 0.05);
      glassGrad.addColorStop(0, 'rgba(220,245,255,0.9)');
      glassGrad.addColorStop(1, 'rgba(30,50,80,0.7)');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(-wid * 0.55, -len * 0.1);
      ctx.quadraticCurveTo(0, -len * 0.65, wid * 0.55, -len * 0.1);
      ctx.quadraticCurveTo(wid * 0.42, len * 0.08, 0, len * 0.12);
      ctx.quadraticCurveTo(-wid * 0.42, len * 0.08, -wid * 0.55, -len * 0.1);
      ctx.closePath();
      ctx.fill();
    }

    // Side Mirrors
    if (opts.mirrors) {
      ctx.fillStyle = opts.dark;
      ctx.fillRect(-wid * 1.08, -len * 0.06, wid * 0.18, len * 0.15);
      ctx.fillRect(wid * 0.9, -len * 0.06, wid * 0.18, len * 0.15);
    }

    // 4. HEADLIGHTS
    if (opts.headlight) {
      if (style === 'super') {
        // Continuous Laser LED Front Lightbar
        ctx.shadowColor = glow;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-wid * 0.75, -len * 0.88);
        ctx.lineTo(0, -len * 0.98);
        ctx.lineTo(wid * 0.75, -len * 0.88);
        ctx.stroke();
      } else if (style === 'hyper' || style === 'muscle') {
        // Quad Projector Headlights
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        [-wid * 0.68, -wid * 0.38, wid * 0.38, wid * 0.68].forEach((xPos) => {
          ctx.beginPath();
          ctx.arc(xPos, -len * 0.90, wid * 0.09, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Twin Oval Sports Headlights
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-wid * 0.58, -len * 0.92, wid * 0.15, len * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(wid * 0.58, -len * 0.92, wid * 0.15, len * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. TAILLIGHTS & BRAKES
    if (opts.taillight) {
      const brakeActive = opts.isBraking;
      ctx.shadowColor = brakeActive ? '#ff0033' : '#ff3344';
      ctx.shadowBlur = brakeActive ? 18 : 8;
      ctx.fillStyle = brakeActive ? '#ff0022' : '#ff3344';

      if (style === 'super') {
        // Full Width Neon Rear Laser Bar
        ctx.strokeStyle = brakeActive ? '#ff0022' : '#ff2b2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-wid * 0.72, len * 0.92);
        ctx.lineTo(wid * 0.72, len * 0.92);
        ctx.stroke();
      } else {
        // Dual Tail Light Pods
        ctx.beginPath();
        ctx.ellipse(-wid * 0.58, len * 0.92, wid * 0.18, len * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(wid * 0.58, len * 0.92, wid * 0.18, len * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.shadowBlur = 0;

    // 6. SPOILERS & REAR WINGS
    if (style === 'hyper') {
      // Swan-Neck Le Mans GT Wing with Endplates
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = glow;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;

      // Wing Blade
      ctx.beginPath();
      ctx.moveTo(-wid * 0.95, len * 0.82);
      ctx.lineTo(wid * 0.95, len * 0.82);
      ctx.stroke();

      // Wing Endplates
      ctx.fillStyle = glow;
      ctx.fillRect(-wid * 1.02, len * 0.72, wid * 0.1, len * 0.2);
      ctx.fillRect(wid * 0.92, len * 0.72, wid * 0.1, len * 0.2);

      // Central Plasma Core Thruster Glow
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, len * 0.88, wid * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (style === 'super') {
      // Dual Active Aero Split Wings
      ctx.save();
      ctx.strokeStyle = glow;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(-wid * 0.82, len * 0.85);
      ctx.lineTo(-wid * 0.18, len * 0.82);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(wid * 0.18, len * 0.82);
      ctx.lineTo(wid * 0.82, len * 0.85);
      ctx.stroke();

      ctx.restore();
    } else if (style === 'muscle' || opts.spoiler) {
      // Heavy Drag Spoiler / Sports Lip
      ctx.strokeStyle = glow;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-wid * 0.72, len * 0.88);
      ctx.lineTo(wid * 0.72, len * 0.88);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // Police Interceptor with Flashing Sirens
  public drawPoliceCar(x: number, y: number, spinAngle: number, animTime: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    this.drawVehicleBody({
      len: 21,
      wid: 11,
      dark: '#050508',
      mid: '#1a1a24',
      light: '#ffffff',
      glow: '#00f6ff',
      noseTaper: 0.68,
      tailTaper: 0.6,
      headlight: true,
      taillight: true,
      spoiler: false,
      cargo: false,
      mirrors: true,
      spinAngle,
    });

    // Flashing Red & Blue Police Lightbar
    const flashState = Math.floor(animTime * 12) % 2 === 0;

    ctx.save();
    ctx.shadowBlur = 16;

    // Left Blue Light
    ctx.shadowColor = flashState ? '#0066ff' : '#001144';
    ctx.fillStyle = flashState ? '#0099ff' : '#002266';
    ctx.fillRect(-6, -2, 5, 4);

    // Right Red Light
    ctx.shadowColor = !flashState ? '#ff0033' : '#440011';
    ctx.fillStyle = !flashState ? '#ff3344' : '#660011';
    ctx.fillRect(1, -2, 5, 4);

    ctx.restore();
    ctx.restore();
  }

  public drawFuelCell(x: number, y: number, bob: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y + Math.sin(bob) * 5);

    ctx.shadowColor = '#ffd23c';
    ctx.shadowBlur = 22;
    ctx.strokeStyle = '#ffd23c';
    ctx.fillStyle = 'rgba(255,210,60,0.4)';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(10, -5);
    ctx.lineTo(10, 9);
    ctx.lineTo(0, 16);
    ctx.lineTo(-10, 9);
    ctx.lineTo(-10, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Lightning icon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(1, -7);
    ctx.lineTo(-4, 2);
    ctx.lineTo(0, 2);
    ctx.lineTo(-1, 8);
    ctx.lineTo(5, -1);
    ctx.lineTo(1, -1);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
