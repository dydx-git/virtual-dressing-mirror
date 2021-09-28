import { Vector3 } from "three";
import {
  getImports
} from "./utils/imports";
const {
  THREE,
  Stats,
  Camera,
  STATE,
  RIGGED_MODELS,
  UNRIGGED_MODELS,
  getPart,
  createDetector,
  getTHREEbasics,
  setUpModel,
  loadModel,
  setUpTHREEDCamera,
  getFacePose,
  getAngle,
  getWorldCoords,
  getDirection,
  addKeybinding
} = getImports();


// #region FPS Counter
const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.bottom = "0px";
document.body.appendChild(stats.domElement);
// #endregion

// #region Renderer Setup
const renderer = new THREE.WebGLRenderer({
  antialias: true, // to get smoother output
  preserveDrawingBuffer: true, // to allow screenshot
  alpha: true,
});
webglContainer.appendChild(renderer.domElement);
// #endregion

// #region Page Variables
let modelType, selectedModel;
let detector, camera;
let scene, mesh, pivot, threeDCam;
let rightHandCoords = [];
let startedTime = Date.now();
let multiplyingFactor = 1;
let offsetX, offsetY, scaleX, scaleY, scaleZ;
// #endregion

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

  if (poses.length > 0) {
    // #region Model Position
    const concernedKeypoints = modelType[selectedModel].positionKeyPoint;
    const keyPointPosition = new Vector3();
    let confidenceScoreOfKeyPoints = 0;
    if (concernedKeypoints.length === 2) {
      const leftKeyPoint = getPart(concernedKeypoints[0], poses[0])[0];
      const rightKeyPoint = getPart(concernedKeypoints[1], poses[0])[0];
      keyPointPosition.x = ((leftKeyPoint.x + rightKeyPoint.x) / 2);
      keyPointPosition.y = ((leftKeyPoint.y + rightKeyPoint.y) / 2);

      confidenceScoreOfKeyPoints = ((leftKeyPoint.score + rightKeyPoint.score) / 2);

    } else if (concernedKeypoints.length === 1) {
      const keyPoint = getPart(concernedKeypoints[0], poses[0])[0];
      keyPointPosition.x = keyPoint.x;
      keyPointPosition.y = keyPoint.y;

      confidenceScoreOfKeyPoints = keyPoint.score;
    }

    const threeDPosition = getWorldCoords(keyPointPosition.x, keyPointPosition.y, camera.video.videoHeight, camera.video.videoWidth, threeDCam);
    if (confidenceScoreOfKeyPoints > 0.5) {
      pivot.position.set(threeDPosition.x, threeDPosition.y, 1);
    } else {
      pivot.position.set(1, 1, -6);
    }
    // #endregion

    // #region Model Rotation
    const { yaw, pitch, roll } = getFacePose(poses[0])
    const normalizedYaw = (yaw - 90) * (Math.PI / 180);
    const normalizedPitch = (pitch - 75) * (Math.PI / 180);

    if (modelType === RIGGED_MODELS) {
      let leftShoulderAngle = 0;
      let rightShoulderAngle = 0;

      const leftElbow = getPart("left_elbow", poses[0])[0]; // at pos: 1
      const leftWrist = getPart("left_wrist", poses[0])[0]; // at pos: 9
      const rightWrist = getPart("right_wrist", poses[0])[0]; // at pos: 10
      const rightElbow = getPart("right_elbow", poses[0])[0]; // at pos: 8
      const leftShoulder = getPart("left_shoulder", poses[0])[0]; // at pos: 2
      const rightShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 6

      mesh.traverse(function (child) {
        if (child.isBone) {
          switch (child.name) {
            case "mixamorigLeftShoulder": {
              const angle = -getAngle(rightElbow, rightShoulder, 0, 0, -1);
              leftShoulderAngle = angle;
              child.rotation.y = angle;
              break;
            }
            case "mixamorigLeftForeArm": {
              const angle = getAngle(rightElbow, rightWrist, 0, 0, -1) - Math.PI;
              child.rotation.x = angle + leftShoulderAngle;
              break;
            }
            case "mixamorigRightShoulder": {
              const angle = -getAngle(leftShoulder, leftElbow, 0, 0, -1);
              rightShoulderAngle = angle;
              child.rotation.y = angle;
              break;
            }
            case "mixamorigRightForeArm": {
              const angle = -getAngle(leftWrist, leftElbow, 0, 0, -1) - Math.PI;
              child.rotation.x = angle - rightShoulderAngle;
              break;
            }
            case "mixamorigHead": {
              child.rotation.y = normalizedYaw; // Left Right
              child.rotation.x = -normalizedPitch; // Up down
              child.rotation.z = roll;
              break;
            }

            default:
              break;
          }
        }
      });
    } else if (modelType === UNRIGGED_MODELS) {
      pivot.rotation.y = normalizedYaw; // Left Right
      pivot.rotation.x = -normalizedPitch; // Up down
      pivot.rotation.z = roll;
    }
    // #endregion

    // #region Hand Tracker
    const rightWrist = getPart("right_wrist", poses[0])[0];
    if (rightWrist.score > 0.8) {
      rightHandCoords.push(rightWrist.x);
    }
    if (Date.now() - startedTime > 1000) {
      if (rightHandCoords.length > 10) {
        //console.log(getDirection(rightHandCoords));
      }
      rightHandCoords = [];
      startedTime = Date.now();
    }
    // #endregion
  }

  stats.update();

  requestAnimationFrame(animate);

};

async function app(modelConfig) {
  camera = await Camera.setupCamera(STATE.camera);
  scene = getTHREEbasics();
  renderer.setSize(camera.video.videoWidth, camera.video.videoHeight);

  addKeybinding(scaleX, scaleY, offsetX, offsetY, multiplyingFactor);

  let model;

  [camera, detector, model] = await Promise.all([
    Camera.setupCamera(STATE.camera),
    createDetector(),
    loadModel(modelConfig.path)
  ]);

  [mesh, pivot] = setUpModel(model);

  // #region Model Configuration
  [offsetX, offsetY] = [modelConfig.offsets.x, modelConfig.offsets.y];
  [scaleX, scaleY, scaleZ] = [modelConfig.scale.x, modelConfig.scale.y, modelConfig.scale.z]
  pivot.scale.set(scaleX, scaleY, scaleZ);
  // #endregion

  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

let listOfModels = document.getElementById('model-select');
for (const model in RIGGED_MODELS) {
  let optionTag = document.createElement('OPTION');
  optionTag.setAttribute('value',`${model}`)
  optionTag.innerHTML = `${RIGGED_MODELS[model].desp}`;
  listOfModels.appendChild(optionTag)

}
for (const model in UNRIGGED_MODELS) {
  let optionTag = document.createElement('OPTION');
  optionTag.setAttribute('value',`${model}`)
  optionTag.innerHTML = `${UNRIGGED_MODELS[model].desp}`;
  listOfModels.appendChild(optionTag)
}

document.addEventListener('DOMContentLoaded', function() {
  var div = document.createElement('div');  
  div.id = 'container';
  for (const model in listOfModels) {
    div.innerHTML = <input type="radio" name="image" />;
    div.className = 'image';
  }
  console.log(div);
  document.body.appendChild(div);
}, false);

 
document.getElementById('model-select').addEventListener('change', function () {
  if (UNRIGGED_MODELS[this.value] != undefined) {
    modelType = UNRIGGED_MODELS;
  } else if (RIGGED_MODELS[this.value] != undefined) {
    modelType = RIGGED_MODELS;
  }
  selectedModel = this.value;
  app(modelType[selectedModel]);
});