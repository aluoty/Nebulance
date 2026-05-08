import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

type Keys = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
};

export default function Ship({
  keys,
  position,
}: {
  keys: Keys;
  position: THREE.Vector3;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const speed = 0.15;

  useFrame(() => {
    if (!ref.current) return;

    if (keys.w) position.z -= speed;
    if (keys.s) position.z += speed;
    if (keys.a) position.x -= speed;
    if (keys.d) position.x += speed;

    ref.current.position.copy(position);
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[0.5, 0.5, 1]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}
