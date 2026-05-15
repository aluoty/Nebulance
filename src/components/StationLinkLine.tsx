import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useState } from "react";
import * as THREE from "three";

type Props = {
  shipPos: React.RefObject<THREE.Vector3>;
  stationPosition: [number, number, number];
  visible: boolean;
  linkProgress: number;
};

export default function StationLinkLine({ shipPos, stationPosition, visible, linkProgress }: Props) {
  const stationVec = useMemo(
    () => new THREE.Vector3(stationPosition[0], stationPosition[1], stationPosition[2]),
    [stationPosition]
  );
  const [points, setPoints] = useState(() => [new THREE.Vector3(), stationVec.clone()]);

  useFrame(() => {
    if (!visible || !shipPos.current) return;
    setPoints([shipPos.current.clone(), stationVec.clone()]);
  });

  if (!visible) return null;

  return (
    <Line
      points={points}
      color="#00ffff"
      lineWidth={1.2}
      dashed
      dashSize={0.8}
      gapSize={0.55}
      transparent
      opacity={0.28 + linkProgress * 0.52}
      depthWrite={false}
    />
  );
}
