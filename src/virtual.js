import { Vector3 } from "three";
import { Vector2 } from "three/build/three.module";

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
  loadEnchancedHat,
  loadEnchancedMask,
  getFacePose,
  getAngle,
  getWorldCoords,
  getDirection,
  addKeybinding
} = getImports();

//#region  Static Variables
let mirrorAttributes = true;
let yOffsetPosition = 0
let xOffsetPosition = 0
let printResult = new Vector3();
let HIPS_OFFSET_CONSTANT_MIRROR

let MULTIPLYING_FACTOR_MIRROR_X = 5.5; // HACK: At distance of 83 inches
let X_OFFSET_POSITION_MIRROR_RIGGED = 20;
let Y_OFFSET_POSITION_MIRROR_RIGGED = 330;

let X_OFFSET_POSITION_MIRROR_UNRIGGED = 30;
let Y_OFFSET_POSITION_MIRROR_UNRIGGED = -190;
let MULTIPLYING_FACTOR_SHOULDER_MOVEMENT = 1.5;


// #region FPS Counter
const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.bottom = "0px";
document.body.appendChild(stats.domElement);
// #endregion

// #region Toggle Mirror Attributes
document.getElementById("bttn").addEventListener("click", onClickMirrorAttributesSwitch);

function onClickMirrorAttributesSwitch() {
  // White toggle -> true
  const isChecked = document.getElementById("bttn").checked;
  if (isChecked) {
    mirrorAttributes = true;
    //alert("Input is checked!");
  } else {
    mirrorAttributes = false;
  }
  console.log(mirrorAttributes);
}


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
let isAR = false;
const loader = document.querySelector('.spinner-loader');
const hadnWave = document.querySelector('.handwave-loader');
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

handTrackApp();

async function handTrackApp() {
  loader.style.display = "flex";
  if (isAR == false) {
    [camera, detector] = await Promise.all([
      Camera.setupCamera(STATE.camera),
      createDetector()
    ]);
    handTrackAnimate();
  }

}

async function handTrackAnimate() {
  const poses = await detector.estimatePoses(
      camera.video, {
      maxPoses: 1,
      flipHorizontal: false
  });
  if (poses.length > 0) {
      const rightWrist = getPart("right_wrist", poses[0])[0];
      if (rightWrist.score > 0.8) {
          rightHandCoords.push(rightWrist.x);
      }
      loader.style.display = "none";
      hadnWave.style.display = "flex";
      if (Date.now() - startedTime > 1000) {
          if (rightHandCoords.length > 10) {
              console.log(getDirection(rightHandCoords));
              if (getDirection(rightHandCoords) == "right") {
                  document.getElementById('handLeft').click();
              } 
              else if (getDirection(rightHandCoords) == "left") {
                  document.getElementById('handRight').click();
              }
          }
          rightHandCoords = [];
          startedTime = Date.now();
      }
  }  

  requestAnimationFrame(handTrackAnimate);
  
}

async function animate() {
  const poses = await detector.estimatePoses(
    camera.video, {
    maxPoses: STATE.modelConfig.maxPoses,
    flipHorizontal: false
  });
  // console.log(STATE.modelConfig);

  await renderResult(poses);

  if (poses.length > 0) {
    // #region Model Position
    const concernedKeypoints = modelType[selectedModel].positionKeyPoint;
    console.log(modelType);
    const keyPointPosition = new Vector3();
    let confidenceScoreOfKeyPoints = 0;
      if (concernedKeypoints.length === 4) {
        const leftKeyPoint1 = getPart(concernedKeypoints[0], poses[0])[0];
        const rightKeyPoint1 = getPart(concernedKeypoints[1], poses[0])[0];
        const leftKeyPoint2 = getPart(concernedKeypoints[2], poses[0])[0];
        const rightKeyPoint2 = getPart(concernedKeypoints[3], poses[0])[0];

        if (mirrorAttributes) {
          keyPointPosition.x = ((((leftKeyPoint2.x + leftKeyPoint1.x)/2) + ((rightKeyPoint2.x+rightKeyPoint1.x)/2))/2) + X_OFFSET_POSITION_MIRROR_RIGGED;
          keyPointPosition.y = ((((leftKeyPoint2.y + leftKeyPoint1.y)/2) + ((rightKeyPoint2.y+rightKeyPoint1.y)/2))/2) + Y_OFFSET_POSITION_MIRROR_RIGGED;
        } else {
          keyPointPosition.x = ((((leftKeyPoint2.x + leftKeyPoint1.x)/2) + ((rightKeyPoint2.x+rightKeyPoint1.x)/2))/2);
          keyPointPosition.y = ((((leftKeyPoint2.y + leftKeyPoint1.y)/2) + ((rightKeyPoint2.y+rightKeyPoint1.y)/2))/2);
        }
  
        confidenceScoreOfKeyPoints = ((leftKeyPoint1.score + rightKeyPoint1.score + leftKeyPoint2.score + rightKeyPoint2.score) / 4);
  
      } else if (concernedKeypoints.length === 2) {
        const leftKeyPoint = getPart(concernedKeypoints[0], poses[0])[0];
        const rightKeyPoint = getPart(concernedKeypoints[1], poses[0])[0];
        if (mirrorAttributes) { // MIGHT HAVE TO SEE THIS 
          keyPointPosition.x = ((leftKeyPoint.x + rightKeyPoint.x) / 2) + X_OFFSET_POSITION_MIRROR_UNRIGGED;
          keyPointPosition.y = ((leftKeyPoint.y + rightKeyPoint.y) / 2) + Y_OFFSET_POSITION_MIRROR_UNRIGGED;
        } else {          
          keyPointPosition.x = ((leftKeyPoint.x + rightKeyPoint.x) / 2);
          keyPointPosition.y = ((leftKeyPoint.y + rightKeyPoint.y) / 2);
        }
  
        confidenceScoreOfKeyPoints = (leftKeyPoint.score + rightKeyPoint.score)/2;
      }

    const threeDPosition = getWorldCoords(keyPointPosition.x, keyPointPosition.y, camera.video.videoHeight, camera.video.videoWidth, threeDCam);
    if (confidenceScoreOfKeyPoints > 0.5) {
      //pivot.position.set(1+xOffsetPosition,1+yOffsetPosition,1);
      if (mirrorAttributes) {
        pivot.position.set(threeDPosition.x * MULTIPLYING_FACTOR_MIRROR_X, threeDPosition.y, 1);
      } else {
        pivot.position.set(threeDPosition.x , threeDPosition.y, 1);
      }
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
              if(mirrorAttributes) {
                child.rotation.y = angle * MULTIPLYING_FACTOR_SHOULDER_MOVEMENT;
              } else {
                child.rotation.y = angle;
              }
              break;
            }
            case "mixamorigLeftForeArm": {
              const angle = getAngle(rightElbow, rightWrist, 0, 0, -1) - Math.PI;
              if (mirrorAttributes) {
                child.rotation.x = (angle + leftShoulderAngle) * MULTIPLYING_FACTOR_SHOULDER_MOVEMENT;
              } else {
                child.rotation.x = angle + leftShoulderAngle;
              }
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
        console.log(getDirection(rightHandCoords));
        if (getDirection(rightHandCoords) == "right") {
          document.getElementById('handLeft').click();
        }
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
  scene = getTHREEbasics();

  addKeybinding(scaleX, scaleY, offsetX, offsetY, multiplyingFactor);

  let model;

  if (modelType === UNRIGGED_MODELS && modelConfig.isEnhanced) {
    if (modelConfig.importFunction === "loadEnchancedMask") {
      [camera, detector, scene] = await Promise.all([
        Camera.setupCamera(STATE.camera),
        createDetector(),
        loadEnchancedMask(modelConfig.path, scene)
      ]);
    } else if (modelConfig.importFunction === "loadEnchancedHat") {
      [camera, detector, scene] = await Promise.all([
        Camera.setupCamera(STATE.camera),
        createDetector(),
        loadEnchancedHat(modelConfig.path, camera.video, scene)
      ]);
    }
    scene.traverse(function (child) {
      if (child.isMesh) {
        model = child;
        scene.remove(model);
      }
      if (child.type === "Object3D") {
        mesh = child;
        pivot = child;
      }
    });
  } else {
    [camera, detector, model] = await Promise.all([
      Camera.setupCamera(STATE.camera),
      createDetector(),
      loadModel(modelConfig.path)
    ]);
  }

  if (mirrorAttributes) {
    renderer.setSize(window.innerWidth,window.innerHeight);
  } else {
    renderer.setSize(camera.video.videoWidth, camera.video.videoHeight);
  }
  [mesh, pivot] = setUpModel(model);

  // #region Model Configuration
  [offsetX, offsetY] = [modelConfig.offsets.x, modelConfig.offsets.y];
  [scaleX, scaleY, scaleZ] = [modelConfig.scale.x, modelConfig.scale.y, modelConfig.scale.z]
  if (mirrorAttributes && modelType[selectedModel].positionKeyPoint.length == 4) {
    pivot.scale.set(18, 4, 4);
  }
  else if (mirrorAttributes && modelType[selectedModel].positionKeyPoint.length == 2) {
    pivot.scale.set(1.36,1.36,1)
  }
  else {
    pivot.scale.set(scaleX, scaleY, scaleZ);
  }
  // #endregion

  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

let listOfModels = document.getElementById('model-select');
for (const model in RIGGED_MODELS) {
  let optionTag = document.createElement('OPTION');
  optionTag.setAttribute('value', `${model}`)
  optionTag.innerHTML = `${RIGGED_MODELS[model].desp}`;
  listOfModels.appendChild(optionTag)

}
for (const model in UNRIGGED_MODELS) {
  let optionTag = document.createElement('OPTION');
  optionTag.setAttribute('value', `${model}`)
  optionTag.innerHTML = `${UNRIGGED_MODELS[model].desp}`;
  listOfModels.appendChild(optionTag)

}

document.getElementById('model-select').addEventListener('change', function () {
  if (UNRIGGED_MODELS[this.value] != undefined) {
    modelType = UNRIGGED_MODELS;
  } else if (RIGGED_MODELS[this.value] != undefined) {
    modelType = RIGGED_MODELS;
  }
  selectedModel = this.value;
  isAR = true;
  app(modelType[selectedModel]);
});

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
    switch (e.key) {
      case "ArrowUp": {
        yOffsetPosition +=1;
        //pivot.position.y += 0.1;
        //yOffsetPositionMask +=10;
        break;
      }
      case "ArrowDown": {
        yOffsetPosition -=1;
        //yOffsetPositionMask -=10;
        //pivot.position.y -= 1;
        break;
      }
      case "ArrowRight": {
        xOffsetPosition += 1;
        //xOffsetPositionMask +=10;
        break;
      }
      case "ArrowLeft": {
        xOffsetPosition -=1;
        //xOffsetPositionMask -=10;
        break;
      }
    }
  }

  else if (e.key == "m") {
    console.log("m pressed");
    console.log('printResult:', printResult)
    //document.getElementsByClassName ("toggle-switch").style.display = "none";  //hide
  }
});