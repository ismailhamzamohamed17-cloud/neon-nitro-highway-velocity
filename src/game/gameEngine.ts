import {
  Chapter,
  VehicleEntity,
  BirdEntity,
  Particle,
  SkidMark,
  PlayerCustomization,
  AudioSettings,
} from '../types';
import { CHAPTERS, GAME_CONFIG, CAR_MODELS } from './constants';
import { GameRenderer } from './renderer';
import { audioManager } from '../audio/soundManager';

export interface GameEngineCallbacks {
  onHUDUpdate: (hudData: {
    score: number;
    speedKmh: number;
    fuel: number;
    lives: number;
    chapterDistanceLeft: number;
    currentChapterIdx: number;
    totalChapters: number;
    combo: number;
  }) => void;
  onChapterComplete: (chapterIdx: number) => void;
  onGameOver: (finalStats: { score: number; distance: number; chapter: number; maxSpeed: number }) => void;
  onLifeLost: (livesLeft: number, reason: string) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  private callbacks: GameEngineCallbacks;

  // Viewport dimensions
  private W = 480;
  private H = 800;
  private DPR = 1;

  // Game state
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastTimestamp = 0;

  // Player state
  private player = {
    frac: 0, // -0.92 to 0.92
    y: 0,
    spin: 0,
    invuln: 0,
    tilt: 0,
    wheelSpin: 0,
  };

  private customization: PlayerCustomization = {
    carModelId: 'apex_gt',
    colorId: 'cyan',
    neonUnderglowId: 'cyan',
  };

  // Game metrics
  private score = 0;
  private fuel = 100;
  private speedKmh = 60;
  private maxSpeedAchieved = 60;
  private lives = GAME_CONFIG.MAX_LIVES;
  private chapterDistanceLeft = GAME_CONFIG.CHAPTER_LENGTH;
  private currentChapterIdx = 0;
  private scrollDist = 0;
  private elapsed = 0;
  private combo = 1;
  private shakeTime = 0;
  private spawnTimer = 0;

  // Entities & FX
  private entities: VehicleEntity[] = [];
  private birds: BirdEntity[] = [];
  private particles: Particle[] = [];
  private skidMarks: SkidMark[] = [];
  private finishLine: { y: number } | null = null;
  private finishSpawned = false;
  private nextEntityId = 1;

  // Input
  private keys = { left: false, right: false, brake: false };
  private touch = { left: false, right: false };

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.renderer = new GameRenderer(this.ctx);
    this.callbacks = callbacks;

    this.resize();
    this.setupInputs();
  }

  public setCustomization(cust: PlayerCustomization) {
    this.customization = cust;
  }

  public updateAudioSettings(settings: Partial<AudioSettings>) {
    audioManager.updateSettings(settings);
  }

  public resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    this.W = rect.width;
    this.H = rect.height;
    this.DPR = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.floor(this.W * this.DPR);
    this.canvas.height = Math.floor(this.H * this.DPR);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);

    this.player.y = this.H * 0.78;
  }

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.keys.left = true;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) this.keys.right = true;
      if (['ArrowDown', 's', 'S', ' '].includes(e.key)) this.keys.brake = true;
    });

    window.addEventListener('keyup', (e) => {
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.keys.left = false;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) this.keys.right = false;
      if (['ArrowDown', 's', 'S', ' '].includes(e.key)) this.keys.brake = false;
    });
  }

  public setTouchControls(left: boolean, right: boolean) {
    this.touch.left = left;
    this.touch.right = right;
  }

  public getCurrentChapter(): Chapter {
    return CHAPTERS[Math.min(CHAPTERS.length - 1, Math.max(0, this.currentChapterIdx))];
  }

  // ==========================================
  // ROAD GEOMETRY
  // ==========================================
  public roadHalfWidth(y: number): number {
    const base = Math.min(this.W * 0.42, 175);
    const pinch = Math.sin(this.scrollDist * 0.0009) * base * 0.12;
    return Math.max(base * 0.75, base + pinch);
  }

  public roadCenterX(y: number): number {
    const ch = this.getCurrentChapter();
    const depth = Math.max(0, Math.min(1, 1 - y / this.H));
    const bendPhase = Math.sin(this.scrollDist * 0.00026);
    const bend = bendPhase * this.W * 0.065 * ch.curveScale;

    const hw = this.roadHalfWidth(y);
    const minC = hw + 4;
    const maxC = this.W - hw - 4;
    let cx = this.W / 2 + bend * depth;
    if (minC <= maxC) {
      cx = Math.max(minC, Math.min(maxC, cx));
    } else {
      cx = this.W / 2;
    }
    return cx;
  }

  public fracToX(frac: number, y: number): number {
    return this.roadCenterX(y) + frac * this.roadHalfWidth(y);
  }

  // ==========================================
  // GAME LIFECYCLE
  // ==========================================
  public start(chapterIdx = 0) {
    audioManager.init();
    audioManager.resume();

    this.currentChapterIdx = chapterIdx;
    this.resetRun();
    this.isRunning = true;
    this.lastTimestamp = performance.now();

    audioManager.startMusic();
    this.loop(this.lastTimestamp);
  }

  public resetRun() {
    this.player.frac = 0;
    this.player.spin = 0;
    this.player.invuln = 0;
    this.player.tilt = 0;
    this.player.wheelSpin = 0;
    this.player.y = this.H * 0.78;

    this.entities = [];
    this.particles = [];
    this.skidMarks = [];

    // Initialize Flying Birds in sky
    const ch = this.getCurrentChapter();
    this.birds = Array.from({ length: 7 }, (_, idx) => ({
      x: (idx / 7) * (this.W + 100) - 50,
      y: 35 + Math.random() * 85,
      vx: 18 + Math.random() * 25,
      vy: (Math.random() - 0.5) * 5,
      size: 5 + Math.random() * 4,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 9 + Math.random() * 6,
      color: ch.night ? '#00f6ff' : '#283044',
    }));

    this.score = 0;
    this.fuel = GAME_CONFIG.FUEL_START;
    this.speedKmh = 60;
    this.maxSpeedAchieved = 60;
    this.lives = GAME_CONFIG.MAX_LIVES;
    this.chapterDistanceLeft = GAME_CONFIG.CHAPTER_LENGTH;
    this.scrollDist = 0;
    this.elapsed = 0;
    this.combo = 1;
    this.shakeTime = 0;
    this.spawnTimer = 0;
    this.finishLine = null;
    this.finishSpawned = false;
  }

  public pause() {
    this.isRunning = false;
    audioManager.stopMusic();
    audioManager.stopEngineSound();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public resumeGame() {
    if (this.isRunning) return;
    this.isRunning = true;
    audioManager.startMusic();
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp);
  }

  // ==========================================
  // MAIN LOOP
  // ==========================================
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(0.05, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.elapsed += dt;

    const carModel = CAR_MODELS.find((m) => m.id === this.customization.carModelId) || CAR_MODELS[0];

    // Steer & Handling
    const steerSpeed = 2.1 * carModel.handling;
    const wantLeft = this.keys.left || this.touch.left;
    const wantRight = this.keys.right || this.touch.right;

    if (wantLeft && !wantRight) this.player.frac -= steerSpeed * dt;
    else if (wantRight && !wantLeft) this.player.frac += steerSpeed * dt;
    this.player.frac = Math.max(-0.92, Math.min(0.92, this.player.frac));

    // Vehicle Tilt on steering
    const targetTilt = wantLeft && !wantRight ? -0.1 : wantRight && !wantLeft ? 0.1 : 0;
    this.player.tilt += (targetTilt - this.player.tilt) * Math.min(1, dt * 9);

    if (this.player.spin > 0) {
      this.player.spin = Math.max(0, this.player.spin - dt * 3.5);
    }

    // Speed & Acceleration
    let targetSpeed = 150 + Math.min(this.elapsed * 8, carModel.topSpeed - 150) * carModel.acceleration;
    if (this.keys.brake) targetSpeed *= 0.45; // Braking deceleration

    this.speedKmh += (targetSpeed - this.speedKmh) * Math.min(1, dt * 0.8);
    this.speedKmh = Math.max(30, Math.min(carModel.topSpeed, this.speedKmh));
    if (this.speedKmh > this.maxSpeedAchieved) this.maxSpeedAchieved = this.speedKmh;

    const speedFrac = this.speedKmh / carModel.topSpeed;
    const scrollSpeed = 80 + speedFrac * 360;
    this.scrollDist += scrollSpeed * dt;
    this.player.wheelSpin += scrollSpeed * dt * 0.14;

    this.score += this.speedKmh * dt * 0.15 * this.combo;

    // Fuel Drain
    this.fuel -= (GAME_CONFIG.FUEL_DRAIN_BASE + speedFrac * GAME_CONFIG.FUEL_DRAIN_SPEED_MULT) * dt;
    this.fuel = Math.max(0, Math.min(100, this.fuel));

    if (this.fuel <= 0) {
      this.handleGameOver('OUT OF FUEL');
      return;
    }

    audioManager.setEngineSpeed(speedFrac, !this.keys.brake);

    // Chapter Distance
    if (!this.finishSpawned) {
      this.chapterDistanceLeft -= this.speedKmh * dt * 0.048;
      if (this.chapterDistanceLeft <= 0) {
        this.chapterDistanceLeft = 0;
        this.finishSpawned = true;
        this.finishLine = { y: -60 };
      }
    }

    // Spawning Traffic
    if (!this.finishSpawned) {
      this.spawnTimer -= dt;
      const spawnInterval = Math.max(0.4, 1.25 - speedFrac * 0.7);
      if (this.spawnTimer <= 0) {
        this.spawnEntity();
        this.spawnTimer = spawnInterval * (0.7 + Math.random() * 0.6);
      }
    }

    // Finish Line Collision
    if (this.finishLine) {
      this.finishLine.y += scrollSpeed * dt * GAME_CONFIG.FINISH_APPROACH_SPEED;
      if (this.finishLine.y >= this.player.y - 10) {
        this.handleChapterComplete();
        return;
      }
    }

    // Entity updates
    const ch = this.getCurrentChapter();
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.y += scrollSpeed * dt * e.speedMult;
      e.bob += dt * 3.2;
      e.wheelSpin += scrollSpeed * dt * 0.1;

      // Dynamic Traffic Movement: Lane switching, smooth drifting, and steering tilt
      e.switchT -= dt;
      if (e.switchT <= 0) {
        e.switchT = e.type === 'erratic' ? 1 + Math.random() * 1.5 : 2.5 + Math.random() * 3.5;
        if (e.type === 'erratic') {
          e.targetFrac = Math.random() * 1.7 - 0.85;
        } else if (e.type !== 'fuel') {
          // Standard vehicles periodically shift or weave gently left/right
          const shift = (Math.random() - 0.5) * 0.5;
          e.targetFrac = Math.max(-0.85, Math.min(0.85, (e.targetFrac || e.frac) + shift));
        }
      }

      if (e.targetFrac !== undefined && e.type !== 'fuel') {
        const diff = e.targetFrac - e.frac;
        const moveSpeed = e.type === 'erratic' ? 0.8 : 0.28;
        if (Math.abs(diff) > 0.01) {
          const stepFrac = Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed * dt);
          e.frac += stepFrac;
          e.tilt = stepFrac * 1.8; // Steering tilt while lane-changing
        } else {
          // Subtle micro-sine drift in lane
          const drift = Math.sin(this.elapsed * 1.5 + e.id) * 0.0008;
          e.frac += drift;
          e.tilt = drift * 2.0;
        }
      }

      if (e.y > this.H + 100) {
        this.entities.splice(i, 1);
        continue;
      }

      // Collision Check
      if (this.player.invuln <= 0) {
        const dy = Math.abs(e.y - this.player.y);
        if (dy < e.h / 2 + 20) {
          const ex = this.fracToX(e.frac, e.y);
          const px = this.fracToX(this.player.frac, this.player.y);
          const dx = Math.abs(ex - px);

          if (dx < e.w / 2 + 14) {
            if (e.type === 'fuel') {
              this.fuel = Math.min(100, this.fuel + GAME_CONFIG.FUEL_PICKUP_GAIN);
              this.score += 250;
              this.combo += 1;
              audioManager.playPickupChime();
              this.entities.splice(i, 1);
              continue;
            } else {
              this.handleCrash();
            }
          }
        }
      }
    }

    if (this.player.invuln > 0) this.player.invuln -= dt;

    // Particles & FX
    if (ch.treeType === 'sakura') {
      if (Math.random() < 0.4) {
        this.particles.push({
          kind: 'leaf',
          x: Math.random() * this.W,
          y: -10,
          vx: 1 + Math.random() * 2,
          vy: 2 + Math.random() * 2,
          life: 2.5,
          age: 0,
          size: 3 + Math.random() * 3,
          color: '#ff99dd',
        });
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.life) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
    }

    // Flying Birds updates
    for (const b of this.birds) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.wingPhase += b.wingSpeed * dt;
      if (b.x > this.W + 60) {
        b.x = -60;
        b.y = 30 + Math.random() * 85;
      }
    }

    if (this.shakeTime > 0) this.shakeTime -= dt;

    // Update HUD Callback
    this.callbacks.onHUDUpdate({
      score: Math.floor(this.score),
      speedKmh: Math.floor(this.speedKmh),
      fuel: Math.floor(this.fuel),
      lives: this.lives,
      chapterDistanceLeft: Math.floor(this.chapterDistanceLeft),
      currentChapterIdx: this.currentChapterIdx,
      totalChapters: CHAPTERS.length,
      combo: this.combo,
    });
  }

  private spawnEntity() {
    const ch = this.getCurrentChapter();
    const roll = Math.random();
    let type = roll < 0.14 ? ('fuel' as const) : ch.vehicles[Math.floor(Math.random() * ch.vehicles.length)];

    const frac = Math.random() * 1.7 - 0.85;
    const dims = {
      truck: { w: 42, h: 80, speedMult: 0.68 },
      pickup: { w: 34, h: 60, speedMult: 0.72 },
      fuel: { w: 22, h: 22, speedMult: 0.78 },
      motorbike: { w: 18, h: 36, speedMult: 0.82 },
      sedan: { w: 28, h: 50, speedMult: 0.74 },
      police: { w: 28, h: 50, speedMult: 0.76 },
      erratic: { w: 28, h: 48, speedMult: 0.75 },
    }[type] || { w: 28, h: 50, speedMult: 0.74 };

    this.entities.push({
      id: this.nextEntityId++,
      type,
      frac,
      targetFrac: frac,
      tilt: 0,
      y: -80,
      switchT: Math.random() * 2 + 1,
      dir: Math.random() < 0.5 ? -1 : 1,
      w: dims.w,
      h: dims.h,
      bob: Math.random() * Math.PI * 2,
      hue: Math.random() * 360,
      wheelSpin: 0,
      brakeLights: false,
      speedMult: dims.speedMult,
    });
  }

  private handleCrash() {
    this.fuel = Math.max(0, this.fuel - GAME_CONFIG.FUEL_CRASH_PENALTY);
    this.player.spin = Math.PI * 2;
    this.player.invuln = 1.2;
    this.shakeTime = 0.35;
    this.combo = 1;

    audioManager.playCrashBoom();
    const px = this.fracToX(this.player.frac, this.player.y);

    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6;
      this.particles.push({
        kind: 'shard',
        x: px,
        y: this.player.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.6,
        age: 0,
        size: 3 + Math.random() * 4,
        color: Math.random() < 0.5 ? '#ff8a1e' : '#ff3b3b',
      });
    }

    this.lives = Math.max(0, this.lives - 1);

    if (this.lives <= 0) {
      this.callbacks.onLifeLost(0, 'OUT OF LIVES');
      this.handleGameOver('WRECKED');
    } else {
      this.callbacks.onLifeLost(this.lives, `${this.lives} LIVES REMAINING`);
    }
  }

  private handleChapterComplete() {
    this.isRunning = false;
    audioManager.stopMusic();
    audioManager.stopEngineSound();
    audioManager.playChapterSting();
    this.callbacks.onChapterComplete(this.currentChapterIdx);
  }

  public nextChapter() {
    this.currentChapterIdx++;
    if (this.currentChapterIdx >= CHAPTERS.length) {
      this.handleGameOver('VICTORY LAP COMPLETED');
      return;
    }
    this.entities = [];
    this.finishLine = null;
    this.finishSpawned = false;
    this.chapterDistanceLeft = GAME_CONFIG.CHAPTER_LENGTH;
    this.fuel = 100;
    this.speedKmh = 50;
    this.player.invuln = 0.8;
    this.resumeGame();
  }

  private handleGameOver(reason: string) {
    this.isRunning = false;
    audioManager.stopMusic();
    audioManager.stopEngineSound();
    const totalDistance = this.currentChapterIdx * GAME_CONFIG.CHAPTER_LENGTH + (GAME_CONFIG.CHAPTER_LENGTH - this.chapterDistanceLeft);
    this.callbacks.onGameOver({
      score: Math.floor(this.score),
      distance: Math.floor(totalDistance),
      chapter: this.currentChapterIdx + 1,
      maxSpeed: Math.floor(this.maxSpeedAchieved),
    });
  }

  // ==========================================
  // RENDERING ENGINE
  // ==========================================
  private render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTime > 0) {
      const mag = this.shakeTime * 14;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    const ch = this.getCurrentChapter();

    // 1. Sky & Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.H * 0.5);
    skyGrad.addColorStop(0, ch.skyTop);
    skyGrad.addColorStop(0.55, ch.skyMid);
    skyGrad.addColorStop(1, ch.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.W, this.H * 0.5);
    ctx.fillStyle = ch.skyBottom;
    ctx.fillRect(0, this.H * 0.5, this.W, this.H * 0.5);

    // Render Flying Birds / Cyber Drones in Sky
    for (const b of this.birds) {
      this.renderer.drawBird(b.x, b.y, b.size, b.wingPhase, b.color, ch.night);
    }

    // 2. Road Tarmac & Wet Reflection Sheen
    const step = 8;
    for (let y = 0; y <= this.H; y += step) {
      const cx = this.roadCenterX(y);
      const hw = this.roadHalfWidth(y);
      ctx.fillStyle = ch.tarmac;
      ctx.fillRect(cx - hw, y, hw * 2, step + 1);

      // Tarmac edge borders
      ctx.fillStyle = ch.tarmacEdge;
      ctx.fillRect(cx - hw, y, 4, step + 1);
      ctx.fillRect(cx + hw - 4, y, 4, step + 1);
    }

    // Wet Asphalt Surface Reflection Streak down center
    const wetSheen = ctx.createLinearGradient(this.W / 2 - 20, 0, this.W / 2 + 20, 0);
    wetSheen.addColorStop(0, 'rgba(255,255,255,0)');
    wetSheen.addColorStop(0.5, ch.night ? 'rgba(0,246,255,0.06)' : 'rgba(255,255,255,0.08)');
    wetSheen.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wetSheen;
    ctx.fillRect(this.W / 2 - 40, this.H * 0.1, 80, this.H * 0.9);

    // Barriers
    ctx.lineWidth = 3;
    ctx.strokeStyle = ch.barrier;
    ctx.shadowColor = ch.barrier;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    for (let y = 0; y <= this.H; y += 6) {
      const cx = this.roadCenterX(y), hw = this.roadHalfWidth(y);
      if (y === 0) ctx.moveTo(cx - hw, y); else ctx.lineTo(cx - hw, y);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let y = 0; y <= this.H; y += 6) {
      const cx = this.roadCenterX(y), hw = this.roadHalfWidth(y);
      if (y === 0) ctx.moveTo(cx + hw, y); else ctx.lineTo(cx + hw, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glowing Cat's Eye Road Edge Reflectors
    const studSpacing = 45;
    const studOff = this.scrollDist % studSpacing;
    for (let y = -studSpacing + studOff; y < this.H + studSpacing; y += studSpacing) {
      const cx = this.roadCenterX(y);
      const hw = this.roadHalfWidth(y);
      ctx.fillStyle = ch.glow;
      ctx.shadowColor = ch.glow;
      ctx.shadowBlur = 6;
      ctx.fillRect(cx - hw + 5, y - 2, 3, 5);
      ctx.fillRect(cx + hw - 8, y - 2, 3, 5);
    }
    ctx.shadowBlur = 0;

    // 3. Scrolling White Lane Divider Dashes (-0.42 & +0.42)
    ctx.save();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.setLineDash([18, 18]);
    ctx.lineDashOffset = -this.scrollDist;

    [-0.42, 0.42].forEach((laneFrac) => {
      ctx.beginPath();
      for (let y = 0; y <= this.H; y += 8) {
        const x = this.fracToX(laneFrac, y);
        if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.restore();

    // 4. Scrolling Yellow Center Dashed Line
    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffd23c';
    ctx.shadowColor = '#ffd23c';
    ctx.shadowBlur = 6;
    ctx.setLineDash([22, 16]);
    ctx.lineDashOffset = -this.scrollDist;

    [-3, 3].forEach((off) => {
      ctx.beginPath();
      for (let y = 0; y <= this.H; y += 8) {
        const x = this.fracToX(0, y) + off;
        if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.restore();

    // 5. Roadside Light Poles / Street Lamps
    const lampSpacing = 220;
    const lampOff = this.scrollDist % lampSpacing;
    for (let y = -lampSpacing + lampOff; y < this.H + lampSpacing; y += lampSpacing) {
      const cx = this.roadCenterX(y);
      const hw = this.roadHalfWidth(y);
      this.renderer.drawRoadEdgeLamps(cx, hw, y, ch);
    }

    // 6. Roadside Animated Trees with Wind Sway
    const treeSpacing = 140;
    const treeOff = this.scrollDist % treeSpacing;
    for (let y = -treeSpacing + treeOff; y < this.H + treeSpacing; y += treeSpacing) {
      const cx = this.roadCenterX(y);
      const hw = this.roadHalfWidth(y);
      this.renderer.drawTree(cx - hw - 32, y, ch, this.elapsed);
      this.renderer.drawTree(cx + hw + 32, y, ch, this.elapsed);
    }

    // Finish Line
    if (this.finishLine) {
      const fy = this.finishLine.y;
      const cx = this.roadCenterX(fy);
      const hw = this.roadHalfWidth(fy);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(cx - hw, fy - 15, hw * 2, 30);
      ctx.strokeStyle = ch.glow;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - hw, fy - 15, hw * 2, 30);
    }

    // Entities
    for (const e of this.entities) {
      const x = this.fracToX(e.frac, e.y);
      if (e.type === 'police') {
        this.renderer.drawPoliceCar(x, e.y, e.wheelSpin, this.elapsed);
      } else if (e.type === 'fuel') {
        this.renderer.drawFuelCell(x, e.y, e.bob);
      } else {
        ctx.save();
        ctx.translate(x, e.y);
        if (e.tilt) {
          ctx.rotate(e.tilt);
        }
        const dark = `hsl(${e.hue}, 60%, 15%)`;
        const mid = `hsl(${e.hue}, 70%, 35%)`;
        const light = `hsl(${e.hue}, 80%, 65%)`;
        this.renderer.drawVehicleBody({
          len: e.h * 0.45,
          wid: e.w * 0.45,
          dark,
          mid,
          light,
          glow: ch.glow,
          noseTaper: e.type === 'motorbike' ? 0.35 : 0.65,
          tailTaper: 0.6,
          headlight: true,
          taillight: true,
          spoiler: e.type === 'erratic',
          cargo: e.type === 'truck' || e.type === 'pickup',
          mirrors: true,
          spinAngle: e.wheelSpin,
        });
        ctx.restore();
      }
    }

    // Particles
    for (const p of this.particles) {
      const a = 1 - p.age / p.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Player Car
    const px = this.fracToX(this.player.frac, this.player.y);
    const speedFrac = this.speedKmh / CAR_MODELS[0].topSpeed;
    this.renderer.drawPlayerCar(
      px,
      this.player.y,
      this.player.spin,
      speedFrac,
      this.player.tilt,
      this.keys.brake,
      this.customization,
      this.player.wheelSpin,
      ch.night
    );

    ctx.restore();
  }
}
