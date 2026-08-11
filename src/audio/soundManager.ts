import { AudioSettings } from '../types';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound
  private engineOsc: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;

  // Music state
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private currentStep = 0;

  private settings: AudioSettings = {
    masterVolume: 0.7,
    sfxVolume: 0.8,
    musicVolume: 0.5,
    engineSoundEnabled: true,
  };

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.settings.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    // SFX node
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this.settings.sfxVolume;
    this.sfxGain.connect(this.masterGain);

    // Music node
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = this.settings.musicVolume;
    this.musicGain.connect(this.masterGain);

    this.setupEngineSound();
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public updateSettings(newSettings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.settings.masterVolume, this.ctx.currentTime, 0.05);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, this.ctx.currentTime, 0.05);
    }
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, this.ctx.currentTime, 0.05);
    }
  }

  private setupEngineSound() {
    if (!this.ctx || !this.sfxGain) return;

    // Sawtooth main rev
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 65;

    // Sub bass rumble
    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'square';
    this.engineSubOsc.frequency.value = 32.5;

    // Lowpass filter for throatiness
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 800;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.0;

    this.engineOsc.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineSubOsc.start();
  }

  public stopEngineSound() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public setEngineSpeed(speedFrac: number, isAccelerating: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineSubOsc || !this.engineFilter || !this.engineGain) return;
    if (!this.settings.engineSoundEnabled) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      return;
    }

    const t = this.ctx.currentTime;
    const baseFreq = 60 + speedFrac * 280 + (isAccelerating ? 25 : 0);
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.05);

    this.engineFilter.frequency.setTargetAtTime(600 + speedFrac * 1800, t, 0.08);

    const targetGain = 0.04 + speedFrac * 0.07 + (isAccelerating ? 0.03 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.1);
  }

  public startMusic() {
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;

    const bassPattern = [55, 55, 110, 55, 82.4, 55, 110, 73.4]; // A1, A2, E2, D2
    const leadPattern = [220, 261.63, 329.63, 392.00, 329.63, 261.63, 440, 392.00];

    const playStep = () => {
      if (!this.isMusicPlaying || !this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;

      // 1. Synth Bass Note
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.value = bassPattern[this.currentStep % bassPattern.length];

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(350, t);
      bassFilter.frequency.exponentialRampToValueAtTime(100, t + 0.18);

      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.12, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(t);
      bassOsc.stop(t + 0.22);

      // 2. Arpeggiated Synth Lead
      if (this.currentStep % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        leadOsc.type = 'square';
        leadOsc.frequency.value = leadPattern[(this.currentStep / 2) % leadPattern.length];

        const leadFilter = this.ctx.createBiquadFilter();
        leadFilter.type = 'bandpass';
        leadFilter.frequency.value = 1200;

        const leadGain = this.ctx.createGain();
        leadGain.gain.setValueAtTime(0.05, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(this.musicGain);

        leadOsc.start(t);
        leadOsc.stop(t + 0.16);
      }

      // 3. Hi-hat noise
      if (this.currentStep % 2 === 1) {
        this.playNoiseHat(t);
      }

      this.currentStep++;
      this.musicInterval = window.setTimeout(playStep, 160);
    };

    playStep();
  }

  private playNoiseHat(t: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(t);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public playPickupChime() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [880, 1174.7, 1567.98, 2093.00].forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const g = this.ctx.createGain();
      const start = t + i * 0.05;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.25, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);

      osc.connect(g);
      g.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  public playTireScreech() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.linearRampToValueAtTime(1100, t + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2200;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playCrashBoom() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);

    // Deep sub drop
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + 0.4);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 0.45);
  }

  public playPassByDoppler() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(g);
    g.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playChapterSting() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = f;

      const g = this.ctx.createGain();
      const start = t + i * 0.08;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.22, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

      osc.connect(g);
      g.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.55);
    });
  }
}

export const audioManager = new SoundManager();
