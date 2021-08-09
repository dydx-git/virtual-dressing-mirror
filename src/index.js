import { math } from "@tensorflow/tfjs-core";
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
  TraverseBones,
  getWorldCoords
} = getImports();

const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.bottom = "0px";
document.body.appendChild(stats.domElement);

const RIGGED_MODELS = {
  COSTUME: "alien/alienSuit.gltf",
  MICKEY: "mickey.fbx",
  REMY: "Remy/Remy.gltf",
  ROTH: "Roth/Roth.gltf",
  ANDROM: "Androm/Androm.gltf",
  DOUG: "Doug/Doug.gltf",
  ELLY: "Elly/Elly.gltf",
  JASPER: "Jasper/Jasper.gltf",
  JODY: "Jody/Jody.gltf",
  KATE: "Kate/Kate.gltf",
  LOUISE: "Louise/Louise.gltf",
  MEGAN: "Megan/Megan.gltf"
};

const UNRIGGED_MODELS = {
  MASK: { Path: "Mask/mask.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 }},
  SPECTACLES: { Path: "glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 }},
  HEART_GLASSES: { Path: "heart-shaped_glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 }},
  BLACK_GLASSES: { Path: "kismet_glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 } },
  FUNK_GLASSES: { Path: "funk_glasses/scene.gltf",  concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 } },
  QUARTZ: { Path: "Quartz_glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 } },
  FMOUSE: { Path:"fluffy_mustach/scene.gltf", concernedKeyPoint: ["mouth_left", "mouth_right"], offsets: { x: 0 , y: 0 } },
  KMOUSE:  { Path: "kaiser_mustache/scene.gltf", concernedKeyPoint: ["mouth_left", "mouth_right"], offsets: { x: 0 , y: 0 } },
};

let selectedModel = "HEART_GLASSES";
let loadingMODEL = UNRIGGED_MODELS[selectedModel].Path;
console.log(loadingMODEL);

let concernedKeyPoint = UNRIGGED_MODELS[selectedModel].concernedKeyPoint;
let xOffset = UNRIGGED_MODELS[selectedModel].offsets.x;
let yOffset = UNRIGGED_MODELS[selectedModel].offsets.y;

let KeyPointPosition = new Vector3();

const renderer = new THREE.WebGLRenderer({
  antialias: true, // to get smoother output
  preserveDrawingBuffer: true, // to allow screenshot
  alpha: true,
});
webglContainer.appendChild(renderer.domElement);

const scene = getTHREEbasics();

let detector, camera;
let mesh, pivot, threeDCam
let multiplyingFactor = 1;
let shoulderAdjustment = 0;

let lips;



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
      console.log(concernedKeyPoint.length);
     
      if(concernedKeyPoint.length  == 2){
        const leftKeyPoint = getPart(concernedKeyPoint[0], poses[0])[0];
        const rightKeyPoint = getPart(concernedKeyPoint[1], poses[0])[0];
        KeyPointPosition.x = ((leftKeyPoint.x + rightKeyPoint.x) / 2);
        KeyPointPosition.y = ((leftKeyPoint.y + rightKeyPoint.y) / 2);
        // console.log(rightKeyPoint);
      }
      else{
        KeyPointPosition = getPart(concernedKeyPoint[0], poses[0])[0];
      }
    // const nose = getPart("nose", poses[0])[0]; // at pos: 0
    const leftElbow = getPart("left_elbow", poses[0])[0]; // at pos: 1
    const leftShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 2
    const leftWrist = getPart("left_wrist", poses[0])[0]; // at pos: 9
    const rightWrist = getPart("right_wrist", poses[0])[0]; // at pos: 10
    const rightShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 6
    const rightElbow = getPart("right_elbow", poses[0])[0]; // at pos: 8

    const cooridnates = getWorldCoords(KeyPointPosition.x, KeyPointPosition.y, camera.video.videoHeight, camera.video.videoWidth, threeDCam);



    pivot.position.set((cooridnates.x + xOffset) * (multiplyingFactor), cooridnates.y + yOffset, 1);
    const { yaw, pitch, roll } = getFacePose(poses[0])
    let normalizedYaw = (yaw - 90) * (Math.PI / 180);
    let normalizedPitch = (pitch - 75) * (Math.PI / 180);
    let leftShoulderAngle = 0;
    let rightShoulderAngle = 0;
    let UIElement = document.getElementById("valueLogger");
    UIElement.innerHTML = "";
    UIElement.innerHTML = `<h1 style="color:white">multiplier: ${multiplyingFactor}</h1>`

    if (UNRIGGED_MODELS[selectedModel] !== undefined) {
      console.log("an unrigged model was loaded");
      pivot.rotation.y = normalizedYaw; // Left Right
      pivot.rotation.x = -normalizedPitch; // Up down
      pivot.rotation.z = roll;
    } else {
      mesh.traverse(function (child) {
        if (child.isBone) {
          let angle;
  
          switch (child.name) {
            case "mixamorigLeftShoulder":
              angle = -getAngle(rightElbow, rightShoulder, 0, 0, -1);
              leftShoulderAngle = angle;
              child.rotation.y = angle;
              UIElement.innerHTML += `left shoulder angle: ${angle}<br>`;
              // UIElement.innerHTML += `left shoulder adjusment: ${shoulderAdjustment}`;
              break;
            case "mixamorigLeftForeArm":
              angle = getAngle(rightElbow, rightWrist, 0, 0, -1);
              angle = angle - Math.PI;
              child.rotation.x = angle + leftShoulderAngle;
            //   // UIElement.innerHTML += `forearm angle: <b>${angle}</b><br>`;
            //   // UIElement.innerHTML += `forearm angle after adj: <b>${angle - leftShoulderAngle}</b>`;
  
            //   break;
            case "mixamorigRightShoulder":
              angle = -getAngle(leftShoulder, leftElbow, 0, 0, -1);
              angle = angle + Math.sin(angle / 2) + 0.2;
              rightShoulderAngle = angle;
              //UIElement.innerHTML += `left shoulder angle: ${angle}<br>`;
              //UIElement.innerHTML += `left shoulder angle: ${angle}<br>`;
              child.rotation.y = angle;
              break;
            case "mixamorigRightForeArm":
              angle = -getAngle(leftWrist, leftElbow, 0, 0, -1);
              angle = angle - rightShoulderAngle - Math.PI;
              UIElement.innerHTML += `right forearm angle: ${angle}<br>`;
              child.rotation.x = angle;
              break;
  
            case "mixamorigHead":
              child.rotation.y = normalizedYaw; // Left Right
              child.rotation.x = -normalizedPitch; // Up down
              child.rotation.z = roll;
              break;
  
  
            default:
              if (child.isMesh) {
                pivot.rotation.y = normalizedYaw; // Left Right
                pivot.rotation.x = -normalizedPitch; // Up down
                pivot.rotation.z = roll;
              }
              break;
          }
        }
  
      });
    }
  }



  /* model manipulation region end */

  stats.update();

  requestAnimationFrame(animate);

};

// Arrow key bindings with ctrl & alt to position and scale the model. 
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
    switch (e.key) {
      case "ArrowUp": {
        //yOffset +=10;
        yOffset += 0.1;
        break;
      }
      case "ArrowDown": {
        //yOffset -=10;
        yOffset -= 0.1;
        break;
      }
      case "ArrowRight": {
        xOffset += 0.1;
        break;
      }
      case "ArrowLeft": {
        xOffset -= 0.1;
        break;
      }
    }
  }

  else if (e.shiftKey) {
    switch (e.key) {
      case "ArrowUp": {
        pivot.scale.x += 0.01;
        pivot.scale.y += 0.01;
        break;
      }
      case "ArrowDown": {
        pivot.scale.x -= 0.01;
        pivot.scale.y -= 0.01;
        break;
      }

    }
  }

  else if (e.key == "c") {
    console.log("Initial position: x:", pivot.position.x, "  y: ", pivot.position.y);
    console.log("Final position: x:", pivot.position.x + xOffset, "  y: ", pivot.position.y + yOffset);
    console.log("Factor added: x:", xOffset, "  y: ", yOffset);
    console.log("multiplyingFactor:", multiplyingFactor);
  }
  else if (e.key == "z") {
    multiplyingFactor += 0.5;
  }
});

async function app() {
  camera = await Camera.setupCamera(STATE.camera);
  // renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setSize(camera.video.videoWidth, camera.video.videoHeight);

  detector = await createDetector();
  let model;
  [camera, detector, model] = await Promise.all([
    Camera.setupCamera(STATE.camera),
    createDetector(),
    loadModel(loadingMODEL)
    //loadModel(RIGGED_MODELS.MEGAN)
  ]);

  [mesh, pivot] = setUpModel(model);

  pivot.scale.set(1, 1, 1);

  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

app();