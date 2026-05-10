import * as THREE from 'three';

export function deformGeometry(
  geometry: THREE.BufferGeometry, 
  mesh: THREE.Mesh, 
  hits: Array<{position: THREE.Vector3, radius: number}>
) {
  const positionAttr = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  
  hits.forEach(hit => {
    // hit.position is in WORLD coordinates. We need it in LOCAL geometry coordinates.
    const localHitPos = mesh.worldToLocal(hit.position.clone());
    
    for (let i = 0; i < positionAttr.count; i++) {
      vertex.fromBufferAttribute(positionAttr, i);
      const dist = vertex.distanceTo(localHitPos);
      if (dist < hit.radius) {
         // Push the vertex inward towards the local center (0,0,0)
         const pull = 1 - (dist / hit.radius); // 1 at center, 0 at edge
         // Create a crater by lerping towards the core
         vertex.lerp(new THREE.Vector3(0,0,0), pull * 0.8);
         positionAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
    }
  });
  
  positionAttr.needsUpdate = true;
  geometry.computeVertexNormals();
}
