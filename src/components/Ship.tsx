import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import spaceshipUrl from "../assets/Spaceship.glb?url";
import { gravitySystem } from "../systems/gravity";

type InputKeys = {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  q: boolean;
  e: boolean;
  shift: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

type Laser = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
};

const coreGeometry = new THREE.CylinderGeometry(0.15, 0.15, 150, 8);
coreGeometry.rotateX(Math.PI / 2);
const coreMaterial = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 1, blending: THREE.AdditiveBlending });

const glowGeometry = new THREE.CylinderGeometry(0.6, 0.6, 150, 8);
glowGeometry.rotateX(Math.PI / 2);
const laserGlowMaterial = new THREE.MeshBasicMaterial({ color: "#ff2222", transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });

const smokeGeometry = new THREE.IcosahedronGeometry(0.15, 1);
const smokeMaterial = new THREE.MeshBasicMaterial({
  color: "#ffffff",
  transparent: true,
  opacity: 0.4,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

type SmokeData = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  isBoost: boolean;
};
const MAX_SMOKE = 600;

function CameraController({ ship, rotation }: { ship: React.RefObject<THREE.Object3D>; rotation: React.RefObject<THREE.Euler> }) {
  const { camera } = useThree();
  const lookAtTarget = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!ship.current || !rotation.current) return;

    const offset = new THREE.Vector3(0, 2, 10);
    offset.applyEuler(rotation.current);

    const targetPos = new THREE.Vector3().copy(ship.current.position).add(offset);

    camera.position.lerp(targetPos, 1 - Math.exp(-8 * delta));

    lookAtTarget.current.lerp(ship.current.position, 1 - Math.exp(-12 * delta));
    camera.lookAt(lookAtTarget.current);
  });

  return null;
}

export default function Ship({ position, rotation }: { position: React.RefObject<THREE.Vector3>; rotation: React.RefObject<THREE.Euler> }) {
  const ref = useRef<THREE.Object3D>(null!);
  const laserGroup = useRef<THREE.Group>(null);
  const smokeInstancedMesh = useRef<THREE.InstancedMesh>(null);
  const smokeRef = useRef<SmokeData[]>([]);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const tempAccel = useRef(new THREE.Vector3(0, 0, 0));
  const lasers = useRef<Laser[]>([]);
  const savedEnergy = localStorage.getItem("nebulance_energy");
  const energyRef = useRef(savedEnergy ? parseFloat(savedEnergy) : 100);
  const boostCooldown = useRef(energyRef.current <= 0);
  const keys = useRef<InputKeys>({
    w: false,
    a: false,
    s: false,
    d: false,
    q: false,
    e: false,
    shift: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const { scene } = useGLTF(spaceshipUrl);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "w") keys.current.w = true;
      if (e.key === "s") keys.current.s = true;
      if (e.key === "a") keys.current.a = true;
      if (e.key === "d") keys.current.d = true;
      if (e.key === "q") keys.current.q = true;
      if (e.key === "e") keys.current.e = true;

      if (e.key === "Shift") keys.current.shift = true;

      if (e.key === "ArrowLeft") keys.current.left = true;
      if (e.key === "ArrowRight") keys.current.right = true;
      if (e.key === "ArrowUp") keys.current.up = true;
      if (e.key === "ArrowDown") keys.current.down = true;

      if (e.code === "Space") {
        e.preventDefault();
        const newLaser: Laser = {
          position: position.current.clone(),
          direction: new THREE.Vector3(0, 0, -1).applyEuler(rotation.current).normalize(),
        };
        lasers.current.push(newLaser);
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === "w") keys.current.w = false;
      if (e.key === "s") keys.current.s = false;
      if (e.key === "a") keys.current.a = false;
      if (e.key === "d") keys.current.d = false;
      if (e.key === "q") keys.current.q = false;
      if (e.key === "e") keys.current.e = false;

      if (e.key === "Shift") keys.current.shift = false;

      if (e.key === "ArrowLeft") keys.current.left = false;
      if (e.key === "ArrowRight") keys.current.right = false;
      if (e.key === "ArrowUp") keys.current.up = false;
      if (e.key === "ArrowDown") keys.current.down = false;
    };

    document.addEventListener("keydown", down);
    document.addEventListener("keyup", up);

    const saveInterval = setInterval(() => {
      if (position.current && rotation.current) {
        localStorage.setItem("nebulance_shipPos", JSON.stringify(position.current));
        localStorage.setItem("nebulance_shipRot", JSON.stringify(rotation.current));
        localStorage.setItem("nebulance_energy", energyRef.current.toString());
      }
    }, 1000);

    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("keyup", up);
      clearInterval(saveInterval);
    };
  }, []);

  useFrame((state, delta) => {
    if (!ref.current || !position.current || !rotation.current) return;

    let isBoosting = keys.current.shift && !boostCooldown.current;

    if (isBoosting) {
      energyRef.current -= delta * 30;
      if (energyRef.current <= 0) {
        energyRef.current = 0;
        boostCooldown.current = true;
        isBoosting = false;
      }
    } else {
      energyRef.current += delta * 15;
      if (energyRef.current >= 100) {
        energyRef.current = 100;
        boostCooldown.current = false;
      }
    }

    const energyBar = document.getElementById("energy-bar-fill");
    if (energyBar) {
      energyBar.style.width = `${energyRef.current}%`;
      energyBar.style.backgroundColor = boostCooldown.current ? "#ff4444" : "#00ffff";
      energyBar.style.boxShadow = boostCooldown.current ? "0 0 10px #ff4444" : "0 0 10px #00ffff";
    }

    const feel = gravitySystem.getLandingFeel(position.current);

    const accelerationStrength = (isBoosting ? 0.04 : 0.014) * feel.accelerationMult;
    const maxSpeed = (isBoosting ? 1.8 : 0.65) * feel.maxSpeedMult;
    const rollSpeed = 0.06 * feel.turnMult;
    const turnSpeed = 0.04 * feel.turnMult;

    if (keys.current.left) {
      rotation.current.y += turnSpeed;
    }
    if (keys.current.right) {
      rotation.current.y -= turnSpeed;
    }

    if (keys.current.q) {
      rotation.current.z += rollSpeed;
    } else if (keys.current.e) {
      rotation.current.z -= rollSpeed;
    } else {
      rotation.current.z *= 0.96;
    }

    const forward = new THREE.Vector3(0, 0, -1).applyEuler(rotation.current);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(rotation.current);
    const upDirection = new THREE.Vector3(0, 1, 0);

    tempAccel.current.set(0, 0, 0);
    if (keys.current.w) tempAccel.current.add(forward);
    if (keys.current.s) tempAccel.current.addScaledVector(forward, -1);
    if (keys.current.a) tempAccel.current.addScaledVector(right, -1);
    if (keys.current.d) tempAccel.current.add(right);
    if (keys.current.up) tempAccel.current.add(upDirection);
    if (keys.current.down) tempAccel.current.addScaledVector(upDirection, -1);

    if (tempAccel.current.lengthSq() > 0) {
      tempAccel.current.normalize().multiplyScalar(accelerationStrength);
      velocity.current.addScaledVector(tempAccel.current, delta * 60);
    }

    const gravityForce = gravitySystem.getGravityForce(position.current, delta);
    velocity.current.add(gravityForce);

    velocity.current.multiplyScalar(0.98);
    if (velocity.current.length() > maxSpeed) {
      velocity.current.setLength(maxSpeed);
    }

    position.current.addScaledVector(velocity.current, delta * 60);

    // Collision detection
    const { collisionNormal, overlap } = gravitySystem.checkShipCollision(position.current, 0.5);
    if (collisionNormal) {
      position.current.add(collisionNormal.multiplyScalar(overlap));
      const dot = velocity.current.dot(collisionNormal);
      if (dot < 0) {
        // Bounce with slight dampening
        velocity.current.sub(collisionNormal.multiplyScalar(dot * 1.6));
      }
    }

    if (feel.shake > 0) {
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * feel.shake,
        (Math.random() - 0.5) * feel.shake,
        (Math.random() - 0.5) * feel.shake
      );
      ref.current.position.copy(position.current).add(shakeOffset);
    } else {
      ref.current.position.copy(position.current);
    }

    ref.current.rotation.copy(rotation.current);

    if (state.scene.fog instanceof THREE.Fog) {
      const atmos = gravitySystem.getAtmosphereState(position.current);
      if (atmos.inAtmosphere && atmos.color && atmos.distance !== undefined && atmos.planetSize !== undefined) {
        state.scene.fog.color.lerp(new THREE.Color(atmos.color), 0.05);
        state.scene.fog.near = THREE.MathUtils.lerp(state.scene.fog.near, Math.max(10, atmos.distance - atmos.planetSize * 1.5), 0.05);
        state.scene.fog.far = THREE.MathUtils.lerp(state.scene.fog.far, atmos.planetSize * 6, 0.05);
      } else {
        state.scene.fog.color.lerp(new THREE.Color("#000000"), 0.02);
        state.scene.fog.near = THREE.MathUtils.lerp(state.scene.fog.near, 100, 0.02);
        state.scene.fog.far = THREE.MathUtils.lerp(state.scene.fog.far, 10000, 0.02);
      }
    }

    lasers.current = lasers.current.filter((laser) => {
      laser.position.addScaledVector(laser.direction, delta * 60 * 70);

      const hit = gravitySystem.checkLaserCollision(laser.position, 2.0);
      if (hit) {
        gravitySystem.recordHit(hit.bodyId, laser.position, 6.0);
        return false;
      }

      return laser.position.distanceTo(position.current) < 5000;
    });

    if (laserGroup.current) {
      while (laserGroup.current.children.length < lasers.current.length) {
        const group = new THREE.Group();
        group.add(new THREE.Mesh(coreGeometry, coreMaterial));
        group.add(new THREE.Mesh(glowGeometry, laserGlowMaterial));
        laserGroup.current.add(group);
      }

      while (laserGroup.current.children.length > lasers.current.length) {
        const child = laserGroup.current.children[laserGroup.current.children.length - 1];
        if (child) {
          laserGroup.current.remove(child);
        }
      }

      for (let index = 0; index < lasers.current.length; index += 1) {
        const laser = lasers.current[index];
        const group = laserGroup.current.children[index] as THREE.Group;

        group.position.copy(laser.position);
        const target = laser.position.clone().add(laser.direction);
        group.lookAt(target);
        group.position.addScaledVector(laser.direction, 75);
      }
    }

    let spawnCount = 0;
    if (isBoosting) spawnCount = 3;

    for (let i = 0; i < spawnCount; i++) {
      const offset = new THREE.Vector3((Math.random() - 0.5) * 1.5, (Math.random() - 0.5) * 1.5, 3);
      offset.applyEuler(rotation.current);
      const spawnPos = position.current.clone().add(offset);

      const backward = new THREE.Vector3(0, 0, 1).applyEuler(rotation.current);
      const spread = new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);

      const speed = isBoosting ? Math.random() * 0.8 + 0.8 : Math.random() * 0.3 + 0.2;
      const initialVel = backward.multiplyScalar(speed).add(spread);

      smokeRef.current.push({
        position: spawnPos,
        velocity: initialVel,
        scale: isBoosting ? Math.random() * 0.4 + 0.4 : Math.random() * 0.2 + 0.2,
        life: 0,
        maxLife: isBoosting ? Math.random() * 0.5 + 0.5 : Math.random() * 0.3 + 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 5,
        isBoost: isBoosting,
      });
    }

    if (smokeRef.current.length > MAX_SMOKE) {
      smokeRef.current = smokeRef.current.slice(-MAX_SMOKE);
    }

    smokeRef.current = smokeRef.current.filter((s) => s.life < s.maxLife);

    if (smokeInstancedMesh.current) {
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();
      for (let i = 0; i < MAX_SMOKE; i++) {
        if (i < smokeRef.current.length) {
          const s = smokeRef.current[i];
          s.life += delta;
          s.position.addScaledVector(s.velocity, delta * 60);
          s.rotation += s.rotationSpeed * delta;

          const progress = s.life / s.maxLife;
          const currentScale = s.scale * (1 + progress * 2);

          dummy.position.copy(s.position);
          dummy.rotation.set(s.rotation, s.rotation, s.rotation);
          dummy.scale.setScalar(currentScale);
          dummy.updateMatrix();
          smokeInstancedMesh.current.setMatrixAt(i, dummy.matrix);

          if (s.isBoost) {
            color.setHSL(0.55, 1.0, Math.max(0, 0.8 - progress * 0.8));
          } else {
            color.setHSL(0, 0, Math.max(0, 0.4 - progress * 0.4));
          }
          smokeInstancedMesh.current.setColorAt(i, color);
        } else {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          smokeInstancedMesh.current.setMatrixAt(i, dummy.matrix);
        }
      }
      smokeInstancedMesh.current.instanceMatrix.needsUpdate = true;
      if (smokeInstancedMesh.current.instanceColor) {
        smokeInstancedMesh.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <group ref={ref}>
        <primitive object={scene} scale={0.1} rotation={[0, Math.PI, 0]} />
      </group>
      <CameraController ship={ref} rotation={rotation} />
      <group ref={laserGroup} />
      <instancedMesh ref={smokeInstancedMesh} args={[smokeGeometry, smokeMaterial, MAX_SMOKE]} />
    </>
  );
}
