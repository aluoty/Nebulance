import { useGLTF } from "@react-three/drei";
import type { SpaceStationData } from "../types/station";
import { stationConfig } from "../data/worldConfig";
import stationModelUrl from "../assets/International Space Station.glb?url";

useGLTF.preload(stationModelUrl);

type Props = {
  station: SpaceStationData;
  linkHighlight?: boolean;
  linkProgress?: number;
};

export default function SpaceStation({ station, linkHighlight = false, linkProgress = 0 }: Props) {
  const { scene } = useGLTF(stationModelUrl);
  const model = scene.clone();
  const glowIntensity = linkHighlight ? 0.55 + linkProgress * 0.45 : 0.35;

  return (
    <group position={station.position} rotation={station.rotation}>
      <primitive object={model} scale={stationConfig.modelScale} />
      <pointLight color="#aaccff" intensity={glowIntensity} distance={160} decay={2} />
    </group>
  );
}
