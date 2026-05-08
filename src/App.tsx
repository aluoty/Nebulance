import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Planet() {
  return (
    <mesh>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export default function App() {
  return (
    <Canvas camera={{ position: [0, 0, 3] }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 3, 3]} />

      <Planet />

      <OrbitControls />
    </Canvas>
  );
}
