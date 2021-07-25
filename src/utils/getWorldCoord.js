import * as THREE from "three/build/three.module";
export function getWorldCoords(x, y, height, width,camera) {
    // (-1,1), (1,1), (-1,-1), (1, -1)
    var normalizedPointOnScreen = new THREE.Vector3();
    normalizedPointOnScreen.x = -((x / width) * 2 - 1);
    normalizedPointOnScreen.y = -(y / height) * 2 + 1;
    normalizedPointOnScreen.z = 0.0; // set to z position of mesh objects
    normalizedPointOnScreen.unproject(camera);
    normalizedPointOnScreen.sub(camera.position).normalize();
    var distance = -camera.position.z / normalizedPointOnScreen.z,
      scaled = normalizedPointOnScreen.multiplyScalar(distance),
      coords = camera.position.clone().add(scaled);
    return new THREE.Vector3(coords.x, coords.y, coords.z);
  }