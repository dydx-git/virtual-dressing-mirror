
import * as THREE from "three/build/three.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function getTHREEbasics(){    
  const scene = new THREE.Scene();

  const light = new THREE.PointLight(0xffffcc, 10, 200);
  light.position.set(4, 30, -20);
  scene.add(light);

  const light2 = new THREE.AmbientLight(0x20202a, 20, 100);
  light2.position.set(30, -10, 30);
  scene.add(light2);
    
    return scene;
}

export function setUpModel(model) {
  const mesh = model.scene;
  const box = new THREE.Box3().setFromObject(mesh);
  box.getCenter(mesh.position);
  mesh.position.multiplyScalar(-1);
  const pivot = new THREE.Group();
  pivot.add(mesh);
  
  return [mesh, pivot];
}

export async function loadModel(modelName) {
  const PATH = "./assets/models/";
  const gltfLoader = new GLTFLoader();
  
  return await gltfLoader.loadAsync(PATH + modelName, function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% model loaded");
  });
}

export function setUpTHREEDCamera(width, height) {
  const camera = new THREE.OrthographicCamera(
    -width / 200,
    width / 200,
    height / 200,
    -height / 200,
    0.1,
    10
  );
  camera.zoom = 0.2;
  camera.position.set(0, 0, 5);
  return camera;
}