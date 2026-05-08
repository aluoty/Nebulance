import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import Planet from "./Planet";

const colors = [
  "orange",
  "skyblue",
  "purple",
  "green",
  "red",
  "yellow",
  "pink",
  "cyan",
];

const planets = Array.from({ length: 12 }, (_, i) => ({
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

export default function SpaceScene() {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 75 }}>
      <ambientLight intensity={1.5} />

      <pointLight position={[10, 10, 10]} intensity={2} />

      <Stars
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />

      {planets.map((planet) => (
        <Planet
          key={planet.id}
          position={planet.position}
          size={planet.size}
          color={planet.color}
          speed={planet.speed}
        />
      ))}

      <OrbitControls />
    </Canvas>
  );
}
