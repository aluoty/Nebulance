import type { PlanetType, StarType } from "../types/starSystem";

/** Radius multiplier applied to stars and planets (4× radius ≈ 16× area). */
export const BODY_RADIUS_SCALE = 4;

/** Extra scale for star bodies (visual + gravity). */
export const STAR_RADIUS_SCALE = 1.75;

export const galaxyConfig = {
  /** Balanced density — not empty, not stacked on top of each other. */
  systemCountMin: 12,
  systemCountMax: 18,
  /** World span for placing star systems (galaxies). */
  universeSpread: 30000,
  /** Min distance between any two systems. */
  minSystemSeparation: 4000,
} as const;

export const starSystemConfig = {
  planetCountMin: 2,
  planetCountMax: 4,
  initialOrbitRadius: 90,
  orbitGapRandomMin: 55,
  orbitGapRandomMax: 130,
  orbitTrailingGap: 80,
  planetSizeMin: 40,
  planetSizeMax: 160,
  orbitalPeriodMin: 22,
  orbitalPeriodMax: 110,
  inclinationRange: 0.18,
  moonCountMax: 2,
  ringChance: 0.4,
  asteroidBeltCountMin: 1,
  asteroidBeltCountMax: 1,
} as const;

export const starTypes: Array<{
  type: StarType;
  color: string;
  radius: number;
  intensity: number;
}> = [
  { type: "Red Dwarf", color: "#ff9966", radius: 4.5 * BODY_RADIUS_SCALE * STAR_RADIUS_SCALE, intensity: 1.8 },
  { type: "Yellow Star", color: "#fff3b0", radius: 6.8 * BODY_RADIUS_SCALE * STAR_RADIUS_SCALE, intensity: 2.4 },
  { type: "Blue Giant", color: "#89d5ff", radius: 9.2 * BODY_RADIUS_SCALE * STAR_RADIUS_SCALE, intensity: 3.6 },
  { type: "White Star", color: "#ffffff", radius: 7.6 * BODY_RADIUS_SCALE * STAR_RADIUS_SCALE, intensity: 2.8 },
  { type: "Orange Star", color: "#ffb74d", radius: 6.2 * BODY_RADIUS_SCALE * STAR_RADIUS_SCALE, intensity: 2.2 },
];

export const planetTypes: PlanetType[] = [
  "Desert",
  "Ice",
  "Ocean",
  "Lava",
  "Gas giant",
  "Dead moon",
  "Forest",
  "Toxic",
];

export const starNames = ["Aether", "Nova", "Vortex", "Orion", "Zephos", "Eclipse", "Titan", "Nyx"];

export const ringPalettes = [
  { primary: "#c8b8ff", accent: "#88eeff" },
  { primary: "#ffd4a8", accent: "#ff88cc" },
  { primary: "#a8e8ff", accent: "#ffffff" },
  { primary: "#e8c8ff", accent: "#88ffcc" },
  { primary: "#ffe8b0", accent: "#ffaa66" },
];

/** Subtle background starfield (drei Stars). */
export const backgroundStarsConfig = {
  radius: 280,
  depth: 70,
  count: 2200,
  factor: 3,
  saturation: 0.12,
  fade: true,
  speed: 0.15,
} as const;

export const sceneScaleConfig = {
  cameraFar: 350000,
  fogNear: 2500,
  fogFar: 280000,
  galaxyFogScale: 4000,
  starLightDistance: 45000,
  starLightDecay: 1.2,
  ambientLightIntensity: 0.65,
  /** Point-light multiplier (keep low for performance). */
  starLightIntensityMult: 1.0,
} as const;

/** Default ship spawn; home station is placed within nearSpawnHalfExtent of this point. */
export const defaultSpawn = { x: 0, y: 55, z: 95 } as const;

export const stationConfig = {
  /** Home station placement cube (150×150×150) centered on origin. */
  placementBoxSize: 150,
  /** Min gap between station and nearest planet surface. */
  minPlanetClearance: 50,
  /** Extra stations outside the home box use this world span. */
  outerSpawnVolume: 100,
  countMin: 2,
  countMax: 3,
  minSeparation: 28,
  proximityRange: 55,
  modelScale: 0.068,
  linkDurationMs: 1400,
  /** Ship gravity multiplier when docked near a station. */
  dockedGravityMult: 0.02,
} as const;

export const audioConfig = {
  ambientVolume: 0.35,
  engineVolume: 0.22,
  boostVolume: 0.28,
  laserVolume: 0.45,
} as const;

export const defaultInventory = [
  { id: "fuel-cell", name: "Fuel Cell", qty: 3, icon: "⛽" },
  { id: "ore", name: "Raw Ore", qty: 12, icon: "🪨" },
  { id: "water", name: "Water Pack", qty: 5, icon: "💧" },
  { id: "circuit", name: "Circuits", qty: 2, icon: "🔌" },
] as const;

export const laserConfig = {
  hitRadius: 4,
  craterRadius: 24,
  maxTravelDistance: 20000,
} as const;
