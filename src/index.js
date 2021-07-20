import {
  getImports
} from "./utils/imports";

const {
  THREE,
  Stats,
  Camera,
  STATE,
  getFacePose,
  getPart,
  createDetector,
  getTHREEbasics,
  setUpModel,
  loadModel,
  Mask,
  Glasses,
  FaceRotation,
  TraverseBones
} = getImports();

const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.bottom = "0px";
document.body.appendChild(stats.domElement);

const MODELS = {
  MASK: "mask.gltf",
  SPECTACLES: "glasses/scene.gltf",
  COSTUME: "alien/alienSuit.gltf",
};

const renderer = new THREE.WebGLRenderer({
  antialias: true, // to get smoother output
  preserveDrawingBuffer: true, // to allow screenshot
  alpha: true,
});

const scene = getTHREEbasics();

let detector, camera;
let mesh, pivot, threeDCam;

async function renderResult(poses) {
  if (camera.video.readyState < 2) {
      await new Promise((resolve) => {
          camera.video.onloadeddata = () => {
              resolve(video);
          };
      });
  }

  camera.drawCtx();


  if (poses.length > 0) {
      camera.drawResults(poses);
  }
}

async function animate() {
  const poses = await detector.estimatePoses(
      camera.video, {
          maxPoses: STATE.modelConfig.maxPoses,
          flipHorizontal: false
      });

  await renderResult(poses);

  stats.update();

  requestAnimationFrame(animate);
};

async function app() {
  camera = await Camera.setupCamera(STATE.camera);
  detector = await createDetector();
  let model;
  [camera, detector, model] = await Promise.all([
      Camera.setupCamera(STATE.camera),
      createDetector(),
      loadModel(MODELS.MASK)
  ]);

  [mesh, pivot] = setUpModel(model);
  pivot.add(mesh);
  scene.add(pivot);
  camera = setUpCamera(VIDEO_WIDTH, VIDEO_HEIGHT);
  scene.add(camera);
  animate();
};

app();