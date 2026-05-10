import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Planet as PlanetData, Moon as MoonData } from "../types/starSystem";
import { computeOrbitPosition } from "../systems/orbit";
import { gravitySystem } from "../systems/gravity";
import { deformGeometry } from "../systems/deformation";

type PlanetProps = {
  planet: PlanetData;
  center: [number, number, number];
  systemPosition?: [number, number, number];
};

const typeConfig: Record<PlanetData["type"], { color: string; atmosphere: string; roughness: number; metalness: number; terrain: number; emissive: string }> = {
  Desert: { color: "#d9b27c", atmosphere: "#f4d5a2", roughness: 0.8, metalness: 0.05, terrain: 0.18, emissive: "#000000" },
  Ice: { color: "#cce7ff", atmosphere: "#9dd7ff", roughness: 0.6, metalness: 0.03, terrain: 0.08, emissive: "#bfe8ff" },
  Ocean: { color: "#1a66cc", atmosphere: "#72b1ff", roughness: 0.3, metalness: 0.1, terrain: 0.05, emissive: "#3465ff" },
  Lava: { color: "#ff533a", atmosphere: "#ffb57a", roughness: 0.9, metalness: 0.15, terrain: 0.3, emissive: "#bb2200" },
  "Gas giant": { color: "#d8a84e", atmosphere: "#ffe4aa", roughness: 0.4, metalness: 0.05, terrain: 0.1, emissive: "#f6d68b" },
  "Dead moon": { color: "#8b8b8b", atmosphere: "#cccccc", roughness: 1.0, metalness: 0.0, terrain: 0.12, emissive: "#444444" },
  Forest: { color: "#197d3b", atmosphere: "#72c96b", roughness: 0.8, metalness: 0.05, terrain: 0.16, emissive: "#1f3f1e" },
  Toxic: { color: "#76ff03", atmosphere: "#b8ff59", roughness: 0.7, metalness: 0.02, terrain: 0.22, emissive: "#5dd300" },
};

function noise(seed: number) {
  return Math.sin(seed * 12.9898) * 43758.5453 - Math.floor(Math.sin(seed * 12.9898) * 43758.5453);
}

function createTerrainGeometry(size: number, type: PlanetData["type"], seed: number) {
  const geometry = new THREE.SphereGeometry(size, 64, 64);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const vertex = new THREE.Vector3();
  const config = typeConfig[type];

  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    const normal = vertex.clone().normalize();
    const variation = Math.sin(normal.x * 8 + normal.y * 6 + normal.z * 10 + seed) * 0.5;
    const detail = Math.sin(normal.x * 15 + normal.y * 9 + normal.z * 12 - seed * 0.7) * 0.25;
    const random = noise((normal.x + normal.y + normal.z) * 10 + seed) * 0.35;
    const displacement = (variation + detail + random) * config.terrain * size * 0.15;
    const radius = size + displacement;
    vertex.normalize().multiplyScalar(radius);
    position.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  return geometry;
}

function Moon({ parentRef, moon }: { parentRef: React.RefObject<THREE.Mesh>; moon: MoonData }) {
  const ref = useRef<THREE.Mesh>(null!);
  const phaseRef = useRef(moon.phase);

  useFrame((_, delta) => {
    if (!ref.current || !parentRef.current) return;

    phaseRef.current += (Math.PI * 2 * delta) / moon.orbitalPeriod;
    const localPosition = new THREE.Vector3(
      Math.cos(phaseRef.current) * moon.orbitalRadius,
      Math.sin(phaseRef.current * 0.5) * moon.orbitalRadius * 0.15,
      Math.sin(phaseRef.current) * moon.orbitalRadius
    );
    localPosition.applyAxisAngle(new THREE.Vector3(1, 0, 0), moon.inclination);
    ref.current.position.copy(parentRef.current.position.clone().add(localPosition));
    ref.current.rotation.y += 0.02;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[moon.size, 16, 16]} />
      <meshStandardMaterial color={moon.color} roughness={1} metalness={0.02} />
    </mesh>
  );
}

export default function Planet({ planet, center, systemPosition = [0,0,0] }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const phaseRef = useRef(planet.phase);
  const geometry = useMemo(() => createTerrainGeometry(planet.size, planet.type, planet.seed), [planet.size, planet.type, planet.seed]);
  const config = typeConfig[planet.type];

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    phaseRef.current += planet.orbitalSpeed * delta;
    const orbitPosition = computeOrbitPosition(center, planet.orbitalRadius, phaseRef.current, planet.inclination);
    meshRef.current.position.copy(orbitPosition);
    meshRef.current.rotation.y += planet.rotationSpeed;

    const worldPos = new THREE.Vector3(systemPosition[0], systemPosition[1], systemPosition[2]).add(orbitPosition);
    
    const repulsion = gravitySystem.resolvePlanetCollisions(`${planet.seed}`, worldPos, planet.size);
    worldPos.add(repulsion);
    meshRef.current.position.add(repulsion);

    gravitySystem.registerBody({
       id: `${planet.seed}`,
       position: worldPos,
       size: planet.size,
       atmosphereColor: config.atmosphere
    });

    const hits = gravitySystem.pullHits(`${planet.seed}`);
    if (hits.length > 0) {
      deformGeometry(geometry, meshRef.current, hits);
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshStandardMaterial color={config.color} roughness={config.roughness} metalness={config.metalness} emissive={config.emissive} />
      </mesh>
      <mesh geometry={geometry.clone()} scale={1.05}>
        <meshBasicMaterial color={config.atmosphere} transparent opacity={0.25} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh geometry={geometry.clone()} scale={1.2}>
        <meshBasicMaterial color={config.atmosphere} transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {planet.hasRings && (
        <mesh rotation={[Math.PI / 2 + 0.2, 0, 0]}>
          <ringGeometry args={[planet.size * 1.5, planet.size * 2.2, 64]} />
          <meshStandardMaterial color={planet.ringColor} side={THREE.DoubleSide} transparent opacity={0.6} />
        </mesh>
      )}
      {planet.moons.map((moon) => (
        <Moon key={moon.id} parentRef={meshRef} moon={moon} />
      ))}
    </group>
  );
}
