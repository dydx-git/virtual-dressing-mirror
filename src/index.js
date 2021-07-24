import { Vector3 } from "three";
import {
  getImports
} from "./utils/imports";

const {
  THREE,
  Stats,
  Camera,
  STATE,
  getPart,
  createDetector,
  getTHREEbasics,
  setUpModel,
  loadModel,
  setUpTHREEDCamera,
  Mask,
  Glasses,
  FaceRotation,
  getFacePose,
  getAngle,
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
  MICKEY: "mickey.fbx"
};

const renderer = new THREE.WebGLRenderer({
  antialias: true, // to get smoother output
  preserveDrawingBuffer: true, // to allow screenshot
  alpha: true,
});
webglContainer.appendChild(renderer.domElement);

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

  renderer.render(scene, threeDCam);

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

  /* model manipulation region start */
  if (poses.length > 0) {
    // const nose = getPart("nose", poses[0])[0]; // at pos: 0
    const leftElbow = getPart("left_elbow", poses[0])[0]; // at pos: 1
    const leftShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 2
    const leftWrist = getPart("left_wrist", poses[0])[0]; // at pos: 9
    const rightWrist = getPart("right_wrist", poses[0])[0]; // at pos: 10
    const rightShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 6
    const rightElbow = getPart("right_elbow", poses[0])[0]; // at pos: 8
    console.log(poses[0])
    // const headRotation = Math.atan(
    //   (rightEye.y - leftEye.y) / 
    //   (rightEye.x - leftEye.x)
    // );
    const {yaw, pitch, roll} = getFacePose(poses[0])
    let normalizedYaw = (yaw - 90) * (Math.PI / 180);
    let normalizedPitch = (pitch - 75) * (Math.PI / 180);
    
    mesh.traverse(function (child) {
      if (child.isBone) {
        let angle;
        switch (child.name) {
          case "mixamorigRightShoulder":
            angle = getAngle(rightElbow, rightShoulder, 0, 0, -1);
            if (angle >= -0.5 && angle <= 1.0) {
              // -0.5-1.0; direction and angle value inversely proportional
              // child.rotation.y = angle;
              child.rotation.y = angle;
            }
            break;
          case "mixamorigRightForeArm":
            angle = getAngle(rightWrist, rightElbow, 0, 0, -1);
            if (angle >= -2.1 && angle <= 2.0) {
              child.rotation.x = angle;
              console.log(angle);

              // console.log(`right forearm: ${getAngle(rightWrist, rightElbow, 0, 0, -1)}`);
            }
            // child.rotation.x = getAngle(rightWrist, rightElbow, 0, 0, -1);
            break;
          case "mixamorigLeftShoulder":
            angle = getAngle(leftShoulder, leftElbow, 0, 0, -1);
            if (angle >= -0.5 && angle <= 1.0) {
              // -0.5-1.0; direction and angle value inversely proportional
              // child.rotation.y = angle;
              child.rotation.y = angle;
            }
            // child.rotation.y = getAngle(leftElbow, leftShoulder, 0, 0, -1);
            break;
          case "mixamorigLeftForeArm":
            // child.rotation.x = getAngle(leftWrist, leftElbow, 0, 0, -1);
            angle = getAngle(leftElbow,leftWrist, 0, 0, -1);
            if (angle >= -2.1 && angle <= 2.0) {
              child.rotation.x = -angle;
              console.log(angle);
            }
            break;
          case "mixamorigHead":
            child.rotation.y = normalizedYaw; // Left Right
            child.rotation.x = -normalizedPitch; // Up down
            child.rotation.z = roll;
            break;
        
          default:
            break;
        }
      }
    });
  }

  /* model manipulation region end */
  
  stats.update();

  requestAnimationFrame(animate);
};

async function app() {
  camera = await Camera.setupCamera(STATE.camera);
  
  renderer.setSize(camera.video.videoWidth, camera.video.videoHeight);

  detector = await createDetector();
  let model;
  [camera, detector, model] = await Promise.all([
      Camera.setupCamera(STATE.camera),
      createDetector(),
      loadModel(MODELS.MICKEY)
  ]);
  
  [mesh, pivot] = setUpModel(model);
  pivot.position.set(0,0,0);
  pivot.scale.set(0.05, 0.05, 0.05);

  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

app();