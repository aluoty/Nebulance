import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRef, useMemo } from "react";
import type { Star as StarType } from "../types/starSystem";
import { gravitySystem } from "../systems/gravity";
import { deformGeometry } from "../systems/deformation";

type Props = {
  star: StarType;
  systemPosition?: [number, number, number];
};

export default function Star({ star, systemPosition = [0,0,0] }: Props) {
  const starRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => new THREE.SphereGeometry(star.radius, 64, 64), [star.radius]);
  const starId = `star-${systemPosition[0]}-${systemPosition[1]}`;

  useFrame(() => {
    if (!starRef.current) return;
    starRef.current.rotation.y += 0.0015;

    const worldPos = new THREE.Vector3(systemPosition[0], systemPosition[1], systemPosition[2]).add(new THREE.Vector3(...star.position));

    gravitySystem.registerBody({
       id: starId,
       position: worldPos,
       size: star.radius,
       isStar: true
    });

    const hits = gravitySystem.pullHits(starId);
    if (hits.length > 0) {
      deformGeometry(geometry, starRef.current, hits);
    }
  });

  return (
    <>
      <pointLight color={star.color} intensity={star.intensity} distance={300} decay={2} position={star.position} />
      <mesh ref={starRef} position={star.position} geometry={geometry}>
        <meshBasicMaterial color={star.color} toneMapped={false} />
      </mesh>
      <mesh position={star.position}>
        <sphereGeometry args={[star.radius * 2.5, 32, 32]} />
        <meshBasicMaterial color={star.color} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </>
  );
}
