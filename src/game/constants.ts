import { Chapter, CarModel, ColorOption, VehicleType, TreeType, WeatherType } from '../types';

export const GAME_CONFIG = {
  CHAPTER_LENGTH: 2000, // meters per chapter
  BASE_TOP_SPEED: 420, // km/h
  MAX_LIVES: 3,
  FUEL_START: 100,
  FUEL_PICKUP_GAIN: 30,
  FUEL_CRASH_PENALTY: 25,
  FUEL_DRAIN_BASE: 1.1,
  FUEL_DRAIN_SPEED_MULT: 0.85,
  FINISH_APPROACH_SPEED: 0.75,
};

export const CAR_MODELS: CarModel[] = [
  {
    id: 'apex_gt',
    name: 'Apex Horizon GT',
    tagline: 'Precision engineered twin-turbo GT cruiser',
    topSpeed: 380,
    acceleration: 1.0,
    handling: 1.0,
    bodyStyle: 'sports',
    darkColor: '#003a42',
    midColor: '#0090a8',
    lightColor: '#aef8ff',
    glowColor: '#00f6ff',
    price: 0,
    unlocked: true,
  },
  {
    id: 'spectre_demon',
    name: 'Spectre Demon V8',
    tagline: 'Raw mechanical torque with high-output supercharger',
    topSpeed: 400,
    acceleration: 1.25,
    handling: 0.9,
    bodyStyle: 'muscle',
    darkColor: '#4a0000',
    midColor: '#b31212',
    lightColor: '#ff9999',
    glowColor: '#ff2b2b',
    price: 1500,
    unlocked: true,
  },
  {
    id: 'cyber_valkyrie',
    name: 'Cyber Valkyrie EV',
    tagline: 'Aerodynamic active-aero electric hypercar',
    topSpeed: 430,
    acceleration: 1.15,
    handling: 1.2,
    bodyStyle: 'super',
    darkColor: '#300042',
    midColor: '#8e12b3',
    lightColor: '#f299ff',
    glowColor: '#ff2bd6',
    price: 3500,
    unlocked: true,
  },
  {
    id: 'phantom_apex_x',
    name: 'Phantom Apex X',
    tagline: 'Experimental plasma-core prototype hypercar',
    topSpeed: 460,
    acceleration: 1.35,
    handling: 1.25,
    bodyStyle: 'hyper',
    darkColor: '#003d1c',
    midColor: '#0f9e52',
    lightColor: '#adffd2',
    glowColor: '#12ff9e',
    price: 8000,
    unlocked: true,
  },
];

export const COLOR_OPTIONS: ColorOption[] = [
  { id: 'cyan', name: 'Cyber Cyan', darkHex: '#003a42', midHex: '#0090a8', lightHex: '#aef8ff', glowHex: '#00f6ff' },
  { id: 'magenta', name: 'Neon Magenta', darkHex: '#4a0038', midHex: '#b3128b', lightHex: '#ff99eb', glowHex: '#ff2bd6' },
  { id: 'gold', name: 'Solar Gold', darkHex: '#4a3800', midHex: '#b38812', lightHex: '#ffeb99', glowHex: '#ffd23c' },
  { id: 'emerald', name: 'Toxic Emerald', darkHex: '#003d1c', midHex: '#0f9e52', lightHex: '#adffd2', glowHex: '#12ff9e' },
  { id: 'purple', name: 'Ultra Violet', darkHex: '#22004a', midHex: '#5b12b3', lightHex: '#cc99ff', glowHex: '#7b2bff' },
  { id: 'obsidian', name: 'Obsidian Black', darkHex: '#0f0f14', midHex: '#2d2d38', lightHex: '#8e8ea6', glowHex: '#00f6ff' },
];

export const UNDERGLOW_OPTIONS = [
  { id: 'cyan', name: 'Electric Cyan', hex: '#00f6ff' },
  { id: 'pink', name: 'Hot Pink', hex: '#ff2bd6' },
  { id: 'purple', name: 'Plasma Purple', hex: '#7b2bff' },
  { id: 'gold', name: 'Amber Gold', hex: '#ffd23c' },
  { id: 'green', name: 'Toxic Lime', hex: '#12ff9e' },
  { id: 'crimson', name: 'Crimson Red', hex: '#ff2b2b' },
];

const CHAPTER_NAMES = [
  "Neon Ignition", "Chrome Boulevard", "Violet Underpass", "Static Sunset",
  "Crimson Skyline", "Azure Drift", "Solar Flare Strip", "Frozen Circuit",
  "Toxic Overpass", "Emerald Tunnel", "Magenta Causeway", "Copper Wastes",
  "Indigo Speedway", "Golden Hour Run", "Obsidian Freeway", "Plasma Canyon",
  "Rose Quartz Route", "Steel Horizon", "Amber Circuit", "Void Highway",
  "Coral Rush", "Sapphire Sprint", "Ember Drive", "Lime Static",
  "Phantom Byway", "Aurora Pass", "Blood Moon Run", "NEON APEX"
];

const STYLE_CYCLE: ('grid' | 'stars' | 'scan' | 'dots')[] = ['grid', 'stars', 'scan', 'dots'];
const WEATHER_CYCLE: WeatherType[] = ['clear', 'rain', 'fog', 'snow'];
const TREE_CYCLE: TreeType[] = ['pine', 'cyber', 'palm', 'sakura'];

function vehiclePoolForChapter(i: number): VehicleType[] {
  const pool: VehicleType[] = ['sedan'];
  if (i >= 2) pool.push('truck');
  if (i >= 5) pool.push('motorbike');
  if (i >= 8) pool.push('pickup');
  if (i >= 12) pool.push('police');
  if (i >= 15) pool.push('erratic');
  if (i >= 20) pool.push('motorbike');
  return pool;
}

function hsl(h: number, s: number, l: number, a?: number): string {
  h = ((h % 360) + 360) % 360;
  return `hsla(${h.toFixed(1)},${s}%,${l}%,${a === undefined ? 1 : a})`;
}

export const CHAPTERS: Chapter[] = CHAPTER_NAMES.map((name, i) => {
  const hue = (i * 360) / 28;
  const style = STYLE_CYCLE[i % STYLE_CYCLE.length];
  const weather = WEATHER_CYCLE[i % WEATHER_CYCLE.length];
  const treeType = TREE_CYCLE[i % TREE_CYCLE.length];
  const vehicles = vehiclePoolForChapter(i);
  const night = style === 'stars' || weather === 'fog' || i % 2 === 1;

  return {
    name,
    index: i,
    hue,
    style,
    roadType: 'two-way',
    weather,
    vehicles,
    night,
    tarmac: hsl(hue, 28, 8),
    tarmacEdge: hsl(hue, 32, 14),
    barrier: hsl(hue, 95, 62),
    lane: hsl(hue, 90, 72),
    glow: hsl(hue, 95, 65),
    skyTop: hsl(hue, 60, night ? 7 : 16),
    skyMid: hsl(hue + 14, 65, night ? 4 : 11),
    skyBottom: hsl(hue + 26, 70, 4),
    patternColor: hsl(hue, 85, 65),
    mountainNear: hsl(hue + 8, 45, night ? 9 : 18),
    mountainFar: hsl(hue + 4, 38, night ? 5 : 12),
    sunColor: hsl(hue + 30, 95, night ? 85 : 68),
    curveScale: 0.22,
    curveScale2: 0.0,
    pinchScale: 0.28,
    twoWay: true,
    treeType,
  };
});
