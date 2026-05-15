import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type Props = {
  stationPosition: [number, number, number];
  active: boolean;
  linkProgress: number;
};

export default function StationLinkRing({ stationPosition, active, linkProgress }: Props) {
  const ringRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!ringRef.current || !materialRef.current || !active) return;
    const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.5;
    const scale = 18 + linkProgress * 12 + pulse * 4;
    ringRef.current.scale.setScalar(scale);
    materialRef.current.opacity = 0.08 + linkProgress * 0.2 + pulse * 0.08;
  });

  if (!active) return null;

  return (
    <mesh ref={ringRef} position={stationPosition} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.85, 1, 48]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#00ffff"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
