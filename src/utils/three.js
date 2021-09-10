
import * as THREE from "three/build/three.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";

export function getTHREEbasics(){    
  const scene = new THREE.Scene();

  const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
  scene.add(hemiLight);

  const light = new THREE.SpotLight(0xffa95c,4);

  light.position.set(-50,50,50);
  light.castShadow = true;
  scene.add( light );

  return scene;
}

export function setUpModel(model) {
  let mesh;

  if (model.scene) {
    mesh = model.scene;
  } else {
    mesh = model;
  }
  const box = new THREE.Box3().setFromObject(mesh);
  box.getCenter(mesh.position);
  mesh.position.multiplyScalar(-1);
  mesh.traverse(child => {
    if (child.type == 'SkinnedMesh') {
      child.frustumCulled = false;
      console.log(`${child.name} should not be culled anymore`);
    }
    if (child.type == 'Bone') {
      console.log(child?.name);
    }
  })
  const pivot = new THREE.Group();
  pivot.add(mesh);
  
  return [mesh, pivot];
}

export async function loadModel(modelName) {
  const PATH = "./assets/models/";
  const ext = modelName.split('.')[1];
  let loader;
  if (ext == "gltf") {
    loader = new GLTFLoader();
  } else if (ext == "fbx") {
    loader = new FBXLoader();
  }
  return await loader.loadAsync(PATH + modelName, function (xhr) {
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