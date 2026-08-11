export type WeatherType = 'clear' | 'rain' | 'fog' | 'snow';
export type TreeType = 'pine' | 'palm' | 'cyber' | 'sakura';
export type VehicleType = 'sedan' | 'truck' | 'pickup' | 'motorbike' | 'police' | 'erratic' | 'fuel';

export interface Chapter {
  name: string;
  index: number;
  hue: number;
  style: 'grid' | 'stars' | 'scan' | 'dots';
  roadType: 'two-way';
  weather: WeatherType;
  vehicles: VehicleType[];
  night: boolean;
  tarmac: string;
  tarmacEdge: string;
  barrier: string;
  lane: string;
  glow: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  patternColor: string;
  mountainNear: string;
  mountainFar: string;
  sunColor: string;
  curveScale: number;
  curveScale2: number;
  pinchScale: number;
  twoWay: boolean;
  treeType: TreeType;
}

export interface PlayerCustomization {
  carModelId: string;
  colorId: string;
  neonUnderglowId: string;
}

export interface CarModel {
  id: string;
  name: string;
  tagline: string;
  topSpeed: number; // km/h
  acceleration: number; // multiplier
  handling: number; // steering responsiveness
  bodyStyle: 'sports' | 'super' | 'hyper' | 'muscle';
  darkColor: string;
  midColor: string;
  lightColor: string;
  glowColor: string;
  price: number;
  unlocked: boolean;
}

export interface ColorOption {
  id: string;
  name: string;
  darkHex: string;
  midHex: string;
  lightHex: string;
  glowHex: string;
}

export interface VehicleEntity {
  id: number;
  type: VehicleType;
  frac: number; // -1 to 1 (lane position)
  targetFrac?: number;
  tilt?: number;
  y: number; // pixel position on screen
  switchT: number;
  dir: number;
  w: number;
  h: number;
  bob: number;
  hue: number;
  wheelSpin: number;
  brakeLights: boolean;
  speedMult: number; // relative speed
}

export interface BirdEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  wingPhase: number;
  wingSpeed: number;
  color: string;
}

export interface Particle {
  kind: 'spark' | 'exhaust' | 'shard' | 'leaf' | 'nitroFire' | 'rain' | 'snow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  age: number;
  size: number;
  color: string;
  rot?: number;
  rotSpd?: number;
}

export interface SkidMark {
  x: number;
  y: number;
  life: number;
  width: number;
}

export interface HighScoreRecord {
  score: number;
  chapter: number;
  distance: number;
  maxSpeed: number;
  date: string;
}

export interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  engineSoundEnabled: boolean;
}
