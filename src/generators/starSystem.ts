import type { StarSystem, Star, PlanetType, StarType, Moon, AsteroidBelt } from "../types/starSystem";

export function createPRNG(seedStr: string) {
  let h = 0xdeadbeef;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
  }
  let a = h ^ (h >>> 16);
  return function () {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const starTypes: Array<{ type: StarType; color: string; radius: number; intensity: number }> = [
  { type: "Red Dwarf", color: "#ff9966", radius: 4.5, intensity: 1.8 },
  { type: "Yellow Star", color: "#fff3b0", radius: 6.8, intensity: 2.4 },
  { type: "Blue Giant", color: "#89d5ff", radius: 9.2, intensity: 3.6 },
  { type: "White Star", color: "#ffffff", radius: 7.6, intensity: 2.8 },
  { type: "Orange Star", color: "#ffb74d", radius: 6.2, intensity: 2.2 },
];

const planetTypes: PlanetType[] = [
  "Desert",
  "Ice",
  "Ocean",
  "Lava",
  "Gas giant",
  "Dead moon",
  "Forest",
  "Toxic",
];

const starNames = ["Aether", "Nova", "Vortex", "Orion", "Zephos", "Eclipse", "Titan", "Nyx"];

function makeMoon(id: number, planetSize: number, random: () => number): Moon {
  return {
    id,
    name: `${starNames[Math.floor(random() * starNames.length)]}-Moon-${id}`,
    size: random() * (5 - 1) + 1,
    orbitalRadius: random() * (planetSize * 2.8 - planetSize * 1.4) + planetSize * 1.4,
    orbitalPeriod: random() * (18 - 6) + 6,
    inclination: random() * (0.18 - (-0.18)) + (-0.18),
    color: "#d5d5d5",
    phase: random() * (Math.PI * 2 - 0) + 0,
  };
}

function makeAsteroidBelt(id: number, random: () => number): AsteroidBelt {
  const innerRadius = random() * (48 - 24) + 24;
  const thickness = random() * (16 - 6) + 6;
  return {
    id,
    innerRadius,
    outerRadius: innerRadius + thickness,
    count: Math.floor(random() * (44 - 24) + 24),
    height: random() * (14 - (-14)) + (-14),
    speed: random() * (0.014 - 0.005) + 0.005,
  };
}

export function generateStarSystem(worldSystemSeed: string): StarSystem {
  const worldRandom = createPRNG(worldSystemSeed);

  const starIndex = Math.floor(worldRandom() * starTypes.length);
  const starConfig = starTypes[starIndex];
  const star: Star = {
    name: `${starNames[Math.floor(worldRandom() * starNames.length)]} ${String.fromCharCode(65 + Math.floor(worldRandom() * 26))}${String.fromCharCode(65 + Math.floor(worldRandom() * 26))}${String.fromCharCode(65 + Math.floor(worldRandom() * 26))}${String.fromCharCode(65 + Math.floor(worldRandom() * 26))}`,
    type: starConfig.type,
    color: starConfig.color,
    radius: starConfig.radius,
    intensity: starConfig.intensity,
    position: [0, 0, 0],
  };

  const planetCount = Math.max(3, Math.floor(worldRandom() * 5) + 3);
  let currentMinRadius = 18;
  const planets = Array.from({ length: planetCount }, (_, index) => {
    const planetRandom = createPRNG(`${worldSystemSeed}-planet-${index}`);

    const type = planetTypes[Math.floor(planetRandom() * planetTypes.length)];
    const size = planetRandom() * (40 - 10) + 10;
    const orbitalRadius = currentMinRadius + size / 2 + planetRandom() * 15 + 10;
    currentMinRadius = orbitalRadius + size / 2 + 15;
    const orbitalPeriod = planetRandom() * (110 - 22) + 22;
    const inclination = planetRandom() * (0.18 - (-0.18)) + (-0.18);
    const moonCount = Math.floor(planetRandom() * 3);

    const moons = Array.from({ length: moonCount }, (_, moonIndex) =>
      makeMoon(index * 10 + moonIndex, size, planetRandom)
    );

    const hasRings = planetRandom() > 0.6;
    const ringColor = `#${Math.floor(planetRandom() * 16777215).toString(16).padStart(6, '0')}`;

    return {
      id: index,
      name: `${starNames[Math.floor(planetRandom() * starNames.length)]}-${index + 1}`,
      size,
      type,
      orbitalRadius,
      orbitalPeriod,
      orbitalSpeed: (Math.PI * 2) / orbitalPeriod,
      inclination,
      rotationSpeed: planetRandom() * (0.012 - 0.003) + 0.003,
      phase: planetRandom() * (Math.PI * 2 - 0) + 0,
      seed: Math.floor(planetRandom() * 1000000),
      moons,
      hasRings,
      ringColor,
    };
  });

  const asteroidBelts = Array.from({ length: Math.max(1, Math.floor(worldRandom() * 2)) }, (_, index) =>
    makeAsteroidBelt(index, worldRandom)
  );

  return {
    seed: worldSystemSeed,
    star,
    planets,
    asteroidBelts,
  };
}

export function generateGalaxy(worldSeed: string): { position: [number, number, number]; system: StarSystem }[] {
  const worldRandom = createPRNG(worldSeed);
  const systemCount = 10 + Math.floor(worldRandom() * 10);
  return Array.from({ length: systemCount }, (_, i) => {
    const position: [number, number, number] = [
      (worldRandom() - 0.5) * 2000,
      (worldRandom() - 0.5) * 2000,
      (worldRandom() - 0.5) * 2000,
    ];
    return { position, system: generateStarSystem(`${worldSeed}-sys-${i}`) };
  });
}
