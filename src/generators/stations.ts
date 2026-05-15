import * as THREE from "three";
import type { SpaceStationData } from "../types/station";
import type { StarSystem } from "../types/starSystem";
import { stationConfig } from "../data/worldConfig";
import { createPRNG } from "./starSystem";
import { computeOrbitPosition } from "../systems/orbit";

export type GalaxyEntry = { position: [number, number, number]; system: StarSystem };

type GravityAnchor = { position: THREE.Vector3; size: number };

function distSq(a: [number, number, number], b: [number, number, number]) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

function inPlacementBox(position: [number, number, number]) {
  const half = stationConfig.placementBoxSize / 2;
  return (
    Math.abs(position[0]) <= half &&
    Math.abs(position[1]) <= half &&
    Math.abs(position[2]) <= half
  );
}

function outsidePlacementBox(position: [number, number, number]) {
  return !inPlacementBox(position);
}

/** Sample planet/star positions for safe station clearance checks. */
export function collectGravityAnchors(galaxy: GalaxyEntry[]): GravityAnchor[] {
  const anchors: GravityAnchor[] = [];
  const phaseSamples = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

  for (const { position: sysPos, system } of galaxy) {
    const sysVec = new THREE.Vector3(sysPos[0], sysPos[1], sysPos[2]);
    anchors.push({ position: sysVec.clone(), size: system.star.radius });

    for (const planet of system.planets) {
      for (const phaseOffset of phaseSamples) {
        const orbit = computeOrbitPosition(
          [0, 0, 0],
          planet.orbitalRadius,
          planet.phase + phaseOffset,
          planet.inclination
        );
        anchors.push({ position: orbit.clone().add(sysVec), size: planet.size });
      }
    }
  }

  return anchors;
}

function minSurfaceGap(station: [number, number, number], anchors: GravityAnchor[]) {
  let minGap = Infinity;
  for (const anchor of anchors) {
    const dist = Math.hypot(
      station[0] - anchor.position.x,
      station[1] - anchor.position.y,
      station[2] - anchor.position.z
    );
    minGap = Math.min(minGap, dist - anchor.size);
  }
  return minGap;
}

function placeHomeStation(random: () => number, anchors: GravityAnchor[]): [number, number, number] {
  const minGap = stationConfig.minPlanetClearance;
  const half = stationConfig.placementBoxSize / 2;

  for (let attempt = 0; attempt < 160; attempt++) {
    const candidate: [number, number, number] = [
      (random() - 0.5) * stationConfig.placementBoxSize,
      (random() - 0.5) * stationConfig.placementBoxSize,
      (random() - 0.5) * stationConfig.placementBoxSize,
    ];
    if (minSurfaceGap(candidate, anchors) >= minGap) {
      return candidate;
    }
  }

  // Deterministic fallback: upper region of the placement cube, away from the ecliptic
  return [0, half * 0.55, half * 0.25];
}

export function generateStations(worldSeed: string, galaxy: GalaxyEntry[]): SpaceStationData[] {
  const random = createPRNG(`${worldSeed}-stations`);
  const anchors = collectGravityAnchors(galaxy);
  const count =
    stationConfig.countMin +
    Math.floor(random() * (stationConfig.countMax - stationConfig.countMin + 1));
  const minSepSq = stationConfig.minSeparation * stationConfig.minSeparation;
  const positions: [number, number, number][] = [placeHomeStation(random, anchors)];

  for (let i = 1; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 48; attempt++) {
      const candidate: [number, number, number] = [
        (random() - 0.5) * stationConfig.outerSpawnVolume,
        (random() - 0.5) * stationConfig.outerSpawnVolume,
        (random() - 0.5) * stationConfig.outerSpawnVolume,
      ];
      const ok =
        positions.every((p) => distSq(p, candidate) >= minSepSq) &&
        outsidePlacementBox(candidate) &&
        minSurfaceGap(candidate, anchors) >= stationConfig.minPlanetClearance;
      if (ok) {
        positions.push(candidate);
        placed = true;
        break;
      }
    }
    if (!placed) {
      positions.push([
        (random() - 0.5) * stationConfig.outerSpawnVolume * 1.5,
        (random() - 0.5) * stationConfig.outerSpawnVolume,
        (random() - 0.5) * stationConfig.outerSpawnVolume * 1.5,
      ]);
    }
  }

  return positions.map((position, index) => ({
    id: `station-${index}`,
    name: index === 0 ? "Station Alpha" : `Station ${String.fromCharCode(65 + index)}${index + 1}`,
    position,
    rotation: [0, 0, 0] as [number, number, number],
    isHome: index === 0,
  }));
}

export function getHomeStation(stations: SpaceStationData[]): SpaceStationData | undefined {
  return stations.find((s) => s.isHome) ?? stations[0];
}

/** Ship pose for a new game: behind home station, facing it. */
export function getNewGameShipPose(homeStation: SpaceStationData) {
  const [sx, sy, sz] = homeStation.position;
  return {
    position: { x: sx, y: sy + 8, z: sz + 48 },
    rotation: { _x: 0, _y: 0, _z: 0 },
  };
}

/** Spawn offset used when no saved game (near home station region). */
export function getDefaultSpawnNear(home: SpaceStationData) {
  const pose = getNewGameShipPose(home);
  return pose.position;
}
