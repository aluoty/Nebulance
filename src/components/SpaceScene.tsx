import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Ship from "./Ship";
import Planet from "./Planet";
import Star from "./Star";
import Asteroid from "./Asteroid";
import { generateGalaxy } from "../generators/starSystem";

function GalaxyFog({ seed }: { seed: string }) {
  const fogTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.1)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const numSeed = useMemo(() => seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0), [seed]);

  const colors = ["#5511aa", "#1188aa", "#770088", "#0099aa", "#440077"];
  const fogCount = 6;
  const scale = 1000; 

  const random = (s: number) => {
    return Math.sin(s * 12.9898) * 43758.5453 - Math.floor(Math.sin(s * 12.9898) * 43758.5453);
  };

  return (
    <group>
      {Array.from({ length: fogCount }).map((_, i) => {
        const x = (random(numSeed + i * 1.1) - 0.5) * scale * 0.5;
        const y = (random(numSeed + i * 1.2) - 0.5) * scale * 0.2;
        const z = (random(numSeed + i * 1.3) - 0.5) * scale * 0.5;
        const s = scale * (0.6 + random(numSeed + i * 1.4) * 0.4);
        const spriteColor = colors[(numSeed + i) % colors.length];
        return (
          <sprite key={i} position={[x, y, z]} scale={[s, s, 1]}>
            <spriteMaterial map={fogTexture} color={spriteColor} transparent blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.6} />
          </sprite>
        );
      })}
    </group>
  );
}

export default function SpaceScene({ worldSeed }: { worldSeed: string }) {
  const savedPos = localStorage.getItem("nebulance_shipPos");
  const savedRot = localStorage.getItem("nebulance_shipRot");

  const initialPos = savedPos ? JSON.parse(savedPos) : { x: 0, y: 8, z: 28 };
  const initialRot = savedRot ? JSON.parse(savedRot) : { _x: 0, _y: 0, _z: 0 };

  const shipPos = useRef(new THREE.Vector3(initialPos.x, initialPos.y, initialPos.z));
  const shipRot = useRef(new THREE.Euler(initialRot._x, initialRot._y, initialRot._z));

  const galaxy = useMemo(() => generateGalaxy(worldSeed), [worldSeed]);

  return (
    <Canvas camera={{ position: [0, 18, 42], fov: 60, far: 10000 }}>
      <fog attach="fog" args={["#000000", 100, 10000]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[40, 40, 20]} intensity={1.2} />
      <directionalLight position={[-30, 15, -60]} intensity={0.8} />

      <Stars radius={350} depth={150} count={15000} factor={8} fade speed={0.4} />

      {galaxy.map((item) => (
        <group key={item.system.seed} position={item.position}>
          <GalaxyFog seed={item.system.seed} />
          <Star star={item.system.star} systemPosition={item.position} />
          {item.system.planets.map((planet) => (
            <Planet key={planet.id} planet={planet} center={[0, 0, 0]} systemPosition={item.position} />
          ))}
          {item.system.asteroidBelts.map((belt) => (
            <Asteroid key={belt.id} belt={belt} center={[0, 0, 0]} />
          ))}
        </group>
      ))}

      <Ship position={shipPos} rotation={shipRot} />
    </Canvas>
  );
}
