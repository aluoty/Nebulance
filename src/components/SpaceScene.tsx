import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Planet from "./Planet";
import Ship from "./Ship";

const colors = ["orange", "skyblue", "purple", "green", "red"];

const planets = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  position: [
    (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * 10,
    (Math.random() - 0.5) * 30,
  ] as [number, number, number],
  size: Math.random() * 1.5 + 0.5,
  color: colors[Math.floor(Math.random() * colors.length)],
  speed: Math.random() * 0.01 + 0.001,
}));

function Scene() {
  const [keys, setKeys] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  const shipPosition = useRef(new THREE.Vector3(0, 0, 0));
  const { camera } = useThree();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "w") setKeys((k) => ({ ...k, w: true }));
      if (e.key === "a") setKeys((k) => ({ ...k, a: true }));
      if (e.key === "s") setKeys((k) => ({ ...k, s: true }));
      if (e.key === "d") setKeys((k) => ({ ...k, d: true }));
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === "w") setKeys((k) => ({ ...k, w: false }));
      if (e.key === "a") setKeys((k) => ({ ...k, a: false }));
      if (e.key === "s") setKeys((k) => ({ ...k, s: false }));
      if (e.key === "d") setKeys((k) => ({ ...k, d: false }));
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useFrame(() => {
    camera.position.lerp(
      new THREE.Vector3(
        shipPosition.current.x,
        shipPosition.current.y + 5,
        shipPosition.current.z + 10
      ),
      0.1
    );

    camera.lookAt(shipPosition.current);
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={2} />

      <Stars radius={100} depth={50} count={5000} factor={4} fade />

      <Ship keys={keys} position={shipPosition.current} />

      {planets.map((p) => (
        <Planet key={p.id} {...p} />
      ))}

      <OrbitControls enableZoom={false} />
    </>
  );
}

export default function SpaceScene() {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 75 }}>
      <Scene />
    </Canvas>
  );
}
