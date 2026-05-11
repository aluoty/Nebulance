import * as THREE from 'three';

export type RegisteredBody = {
  id: string;
  position: THREE.Vector3;
  size: number;
  atmosphereColor?: string;
  isStar?: boolean;
};

class GravitySystem {
  private bodies: Map<string, RegisteredBody> = new Map();
  private bodyHits: Map<string, Array<{ position: THREE.Vector3, radius: number }>> = new Map();

  registerBody(body: RegisteredBody) {
    this.bodies.set(body.id, body);
  }

  updateBodyPosition(id: string, position: THREE.Vector3) {
    const p = this.bodies.get(id);
    if (p) p.position.copy(position);
  }

  unregisterBody(id: string) {
    this.bodies.delete(id);
  }

  recordHit(id: string, position: THREE.Vector3, radius: number) {
    if (!this.bodyHits.has(id)) this.bodyHits.set(id, []);
    this.bodyHits.get(id)!.push({ position: position.clone(), radius });
  }

  pullHits(id: string) {
    const hits = this.bodyHits.get(id) || [];
    this.bodyHits.set(id, []);
    return hits;
  }

  // Returns the combined gravitational pull vector
  getGravityForce(shipPos: THREE.Vector3, delta: number): THREE.Vector3 {
    let gravityForce = new THREE.Vector3();

    for (const pData of this.bodies.values()) {
      const dist = shipPos.distanceTo(pData.position);

      // Only apply gravity if within 15x planet radius, and outside the solid core
      if (dist < pData.size * 15 && dist > pData.size) {
        const dir = pData.position.clone().sub(shipPos).normalize();
        // GM/r^2 smooth pull. Tune multiplier for "feel"
        const forceMag = (pData.size * 5) / (dist * dist);
        gravityForce.add(dir.multiplyScalar(forceMag * delta));
      }
    }

    return gravityForce;
  }

  // Returns info about the nearest atmosphere
  getAtmosphereState(shipPos: THREE.Vector3) {
    let nearestPlanet: RegisteredBody | null = null;
    let nearestDist = Infinity;

    for (const pData of this.bodies.values()) {
      if (pData.isStar) continue; // Ignore star atmospheres for now
      const dist = shipPos.distanceTo(pData.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestPlanet = pData;
      }
    }

    if (nearestPlanet && nearestPlanet.atmosphereColor && nearestDist < nearestPlanet.size * 4) {
      // ratio: 1 when at surface, 0 when at edge of atmosphere (4x radius)
      const ratio = 1 - Math.max(0, (nearestDist - nearestPlanet.size) / (nearestPlanet.size * 3));
      return {
        inAtmosphere: true,
        color: nearestPlanet.atmosphereColor,
        ratio,
        planetSize: nearestPlanet.size,
        distance: nearestDist,
      };
    }

    return { inAtmosphere: false };
  }

  // Dynamic collision avoidance for planets
  resolvePlanetCollisions(id: string, currentPos: THREE.Vector3, size: number): THREE.Vector3 {
    let repulsion = new THREE.Vector3();
    for (const pData of this.bodies.values()) {
      if (pData.id === id || pData.isStar) continue;
      const dist = currentPos.distanceTo(pData.position);
      const minSafeDist = size + pData.size + 10; // 10 unit buffer
      if (dist < minSafeDist && dist > 0) {
        const pushDir = currentPos.clone().sub(pData.position).normalize();
        const overlap = minSafeDist - dist;
        // Soft push apart
        repulsion.add(pushDir.multiplyScalar(overlap * 0.1));
      }
    }
    return repulsion;
  }

  // Returns physics modifiers when near the surface
  getLandingFeel(shipPos: THREE.Vector3) {
    const state = this.getAtmosphereState(shipPos);

    if (state.inAtmosphere && state.ratio !== undefined && state.ratio > 0.7) {
      // 0.7 to 1.0 (approaching surface) -> heavier controls
      const intensity = (state.ratio - 0.7) / 0.3; // 0 to 1

      return {
        accelerationMult: 1 - (intensity * 0.4), // 40% slower acceleration
        maxSpeedMult: 1 - (intensity * 0.3),     // 30% lower max speed
        turnMult: 1 - (intensity * 0.5),         // 50% slower turning
        shake: intensity * 0.02                  // Optional camera shake intensity
      };
    }

    return { accelerationMult: 1, maxSpeedMult: 1, turnMult: 1, shake: 0 };
  }

  // Ship physical collision detection
  checkShipCollision(shipPos: THREE.Vector3, shipRadius: number) {
    let collisionNormal: THREE.Vector3 | null = null;
    let overlap = 0;
    for (const pData of this.bodies.values()) {
      const dist = shipPos.distanceTo(pData.position);
      if (dist < pData.size + shipRadius) {
        collisionNormal = shipPos.clone().sub(pData.position).normalize();
        overlap = (pData.size + shipRadius) - dist;
      }
    }
    return { collisionNormal, overlap };
  }

  // Laser collision detection
  checkLaserCollision(laserPos: THREE.Vector3, laserRadius: number) {
    for (const [id, body] of this.bodies.entries()) {
      if (laserPos.distanceTo(body.position) < body.size + laserRadius) {
        return { bodyId: id };
      }
    }
    return null;
  }
}

export const gravitySystem = new GravitySystem();
