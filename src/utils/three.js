import * as THREE from "three/build/three.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export function getTHREEbasics() {
  const scene = new THREE.Scene();

  const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
  scene.add(hemiLight);

  const light = new THREE.SpotLight(0xffa95c, 4);

  light.position.set(-50, 50, 50);
  light.castShadow = true;
  scene.add(light);

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
  mesh.traverse((child) => {
    if (child.type == "SkinnedMesh") {
      child.frustumCulled = false;
      console.log(`${child.name} should not be culled anymore`);
    }
    if (child.type == "Bone") {
      console.log(child?.name);
    }
  });
  const pivot = new THREE.Group();
  pivot.add(mesh);

  return [mesh, pivot];
}

export async function loadEnchancedMask(modelName, scene) {
  const PATH = "./assets/models/";
  const rgbeLoader = new RGBELoader().setPath(PATH + modelName);

  const gltfLoader = new GLTFLoader().setPath(PATH + modelName);

  const [texture, gltf] = await Promise.all([
    rgbeLoader.loadAsync("texture.hdr"),
    gltfLoader.loadAsync("DamagedHelmet.gltf"),
  ]);
  // texture
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;

  gltf.scene.traverse(function (child) {
    if (child.isMesh) {
      let mesh = child;
      scene.add(mesh);
    }
  });

  return scene;
}

export async function loadEnchancedHat(modelName, video, scene) {
  const PATH = "./assets/models/";
  const bufferLoader = new THREE.BufferGeometryLoader().setPath(
    PATH + modelName
  );
  const textureLoader = new THREE.TextureLoader().setPath(PATH + modelName);
  const hatObj = new THREE.Object3D();

  const [geometry, texture, maskBufferGeometry] = await Promise.all([
    bufferLoader.loadAsync("hat/luffys_hat.json"),
    textureLoader.loadAsync("hat/Texture2.jpg"),
    bufferLoader.loadAsync("mask/faceLowPolyEyesEarsFill2.json"),
  ]);

  const mat = new THREE.MeshBasicMaterial({
    map: texture,
  });

  const hatMesh = new THREE.Mesh(geometry, mat);
  hatMesh.scale.multiplyScalar(1.1 * 1.1);
  hatMesh.side = THREE.DoubleSide;

  const vertexShaderSource =
    "uniform mat2 videoTransformMat2;\n\
        varying vec2 vUVvideo;\n\
        varying float vY, vNormalDotZ;\n\
        const float THETAHEAD = 0.25;\n\
        \n\
        void main() {\n\
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);\n\
          vec4 projectedPosition = projectionMatrix * mvPosition;\n\
          gl_Position = projectedPosition;\n\
          \n\
          // compute UV coordinates on the video texture:\n\
          vec4 mvPosition0 = modelViewMatrix * vec4( position, 1.0 );\n\
          vec4 projectedPosition0 = projectionMatrix * mvPosition0;\n\
          // flip the video on vertical axis:\n\
          vUVvideo = vec2(0.5, 0.5) + videoTransformMat2 * projectedPosition0.xy / projectedPosition0.w;\n\
          vY = position.y * cos(THETAHEAD)-position.z*sin(THETAHEAD);\n\
          vec3 normalView = vec3(modelViewMatrix * vec4(normal,0.));\n\
          vNormalDotZ = pow(abs(normalView.z), 1.5);\n\
        }";

  const fragmentShaderSource =
    "precision lowp float;\n\
        uniform sampler2D samplerVideo;\n\
        varying vec2 vUVvideo;\n\
        varying float vY, vNormalDotZ;\n\
        void main() {\n\
          vec3 videoColor = texture2D(samplerVideo, vUVvideo).rgb;\n\
          float darkenCoeff = smoothstep(-0.15, 0.15, vY);\n\
          float borderCoeff = smoothstep(0.0, 0.85, vNormalDotZ);\n\
          gl_FragColor = vec4(videoColor * (1.-darkenCoeff), borderCoeff );\n\
          // gl_FragColor=vec4(borderCoeff, 0., 0., 1.);\n\
          // gl_FragColor=vec4(darkenCoeff, 0., 0., 1.);\n\
        }";

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.minFilter = THREE.LinearFilter;

  const mat2 = new THREE.ShaderMaterial({
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
    transparent: true,
    flatShading: false,
    uniforms: {
      videoTransformMat2: { value: [-0.5, 0, 0, 0.5] },
      samplerVideo: { value: videoTexture },
    },
    transparent: true,
  });

  maskBufferGeometry.computeVertexNormals();

  const faceMesh = new THREE.Mesh(maskBufferGeometry, mat2);
  faceMesh.scale.multiplyScalar(1.12 * 1.1);

  hatMesh.position.set(0.0, 0.7, -0.3);
  faceMesh.position.set(0, 0.5, -0.75);

  console.log(hatMesh);

  hatObj.add(hatMesh);
  hatObj.add(faceMesh);

  scene.add(hatObj);
  
  return scene;
  // texture
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;

  gltf.scene.traverse(function (child) {
    if (child.isMesh) {
      let mesh = child;
      scene.add(mesh);
    }
  });

  return scene;
}

export async function loadModel(modelName) {
  const PATH = "./assets/models/";
  const ext = modelName.split(".")[1];
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
