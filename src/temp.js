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
  getFacePose,
  getAngle,
  getWorldCoords
} = getImports();

const stats = new Stats();
stats.domElement.style.position = "absolute";
stats.domElement.style.bottom = "0px";
document.body.appendChild(stats.domElement);

const RIGGED_MODELS = {
  COSTUME: { Path: "alien/alienSuit.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  MICKEY: { Path: "mickey.fbx", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 3.5 , y: 0 }, scale: { x: 0.1, y: 0.1, z: 0.1} },
  REMY: { Path: "Remy/Remy.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -6.099999999999994 }, scale: { x: 2.0699999999999994, y: 2.0699999999999994, z: 1} },
  ROTH: { Path: "Roth/Roth.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  ANDROM: { Path: "Androm/Androm.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  DOUG: { Path: "Doug/Doug.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  ELLY: { Path: "Elly/Elly.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  JASPER: { Path: "Jasper/Jasper.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  JODY: { Path: "Jody/Jody.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  KATE: { Path: "Kate/Kate.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  LOUISE: { Path: "Louise/Louise.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
  MEGAN: { Path: "Megan/Megan.gltf", concernedKeyPoint: ["left_shoulder", "left_elbow", "left_wrist", "right_shoulder", "right_elbow", "right_wrist" ], offsets: { x: 0.7999999999999999 , y: -5.899999999999995 }, scale: { x: 4.299999999999952, y: 4.299999999999952, z: 1} },
};

const UNRIGGED_MODELS = {
  MASK: { Path: "Mask/mask.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 }, scale: { x: 2.459999999999991, y: 2.459999999999991, z: 1} },
  SPECTACLES: { Path: "glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0.1 , y: -0.5 }, scale: { x: 2.549999999999989, y: 2.549999999999989, z: 1 } },
  HEART_GLASSES: { Path: "heart-shaped_glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: -0.5 }, scale: { x: 1.1, y: 1.1, z: 1} },
  BLACK_GLASSES: { Path: "kismet_glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0.1 ,  y:  -0.2 }, scale: { x: 11.219999999999805, y: 11.219999999999805, z: 1} },
  FUNK_TIARA: { Path: "funk_glasses/scene.gltf",  concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: -0.20000000000000004 ,  y:  3.0000000000000013 }, scale: { x: 0.7799999999999998, y: 0.7799999999999998, z: 1} },
  QUARTZ: { Path: "Quartz_glasses/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: -0.2 }, scale: { x: 4.799999999999941, y: 4.799999999999941, z: 1} },
  FMOUSE: { Path:"fluffy_mustach/scene.gltf", concernedKeyPoint: ["mouth_left", "mouth_right"], offsets: { x: 0 , y: 0.1 }, scale: { x: 21.23000000000052, y: 21.23000000000052, z: 1} },
  KMOUSE:  { Path: "kaiser_mustache/scene.gltf", concernedKeyPoint: ["mouth_left", "mouth_right"], offsets: { x: 0 , y: 0.12 }, scale: { x: 15, y: 15, z: 15} },
  EYES:  { Path: "eyes/scene.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: 0 }, scale: { x: 1, y: 1, z: 1} },
  LENS: { Path: "Lens.gltf", concernedKeyPoint: ["left_eye", "right_eye"], offsets: { x: 0 , y: -0.19999999999999982 }, scale: { x: 0.2099999999999993, y: 0.2099999999999993, z: 1} },
};
selectedArray[selectedModel].concernedKeyPoint
let selectedArray = RIGGED_MODELS;
let selectedModel = "ROTH";
let loadingMODEL = selectedArray[selectedModel].Path;
console.log(loadingMODEL);

let concernedKeyPoint = selectedArray[selectedModel].concernedKeyPoint;
let xOffset = selectedArray[selectedModel].offsets.x;
let yOffset = selectedArray[selectedModel].offsets.y;
let ScaleX = selectedArray[selectedModel].scale.x;
let ScaleY = selectedArray[selectedModel].scale.y;
let ScaleZ = selectedArray[selectedModel].scale.z;

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

let startedTime = Date.now();
let rightHandCoords = [];

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
      //console.log(concernedKeyPoint.length);
     
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

    const leftShoulder = getPart(concernedKeyPoint[0], poses[0])[0]; // at pos: 2
    //console.log(leftShoulder);
    const leftElbow = getPart(concernedKeyPoint[1], poses[0])[0]; // at pos: 1
    const leftWrist = getPart(concernedKeyPoint[2], poses[0])[0]; // at pos: 9
    const rightShoulder = getPart(concernedKeyPoint[3], poses[0])[0]; // at pos: 6
    const rightElbow = getPart(concernedKeyPoint[4], poses[0])[0]; // at pos: 8
    const rightWrist = getPart("right_wrist", poses[0])[0]; // at pos: 10
    

    if (rightWrist.score > 0.8) {
      rightHandCoords.push(rightWrist.x);
    }
    if (Date.now() - startedTime > 1000) {
      if (rightHandCoords.length > 10) {
        console.log(getDirection(rightHandCoords));
      }
      rightHandCoords = [];
      startedTime = Date.now();
    }

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
             // UIElement.innerHTML += `left shoulder angle: ${angle}<br>`;
              //console.log("hi");
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
              //angle = angle + Math.sin(angle / 2) + 0.2;
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


function getDirection(coords) {
  const summed_nums = coords.reduce(function (a, b) { return a + b; }, 0);
  let multiplied_data = 0;
  let summed_index = 0;
  let squared_index = 0;

  coords.forEach((num, index) => {
    index += 1;
    multiplied_data += index * num;
    summed_index += index;
    squared_index += index ** 2;
  });

  const numerator = (coords.length * multiplied_data) - (summed_nums * summed_index)
  const denominator = (coords.length * squared_index) - summed_index ** 2;
  if (denominator == 0) return 0;
  const direction = numerator / denominator;
  if (direction > 5) {
    return "left";
  } else if (direction < -5) {
    return "right";
  }
  return direction;
}

// Arrow key bindings with ctrl & alt to position and scale the model. 
// window.addEventListener('keydown', (e) => {
//   if (e.ctrlKey) {
//     switch (e.key) {
//       case "ArrowUp": {
//         //yOffset +=10;
//         yOffset += 0.1;
//         break;
//       }
//       case "ArrowDown": {
//         //yOffset -=10;
//         yOffset -= 0.1;
//         break;
//       }
//       case "ArrowRight": {
//         xOffset += 0.1;
//         break;
//       }
//       case "ArrowLeft": {
//         xOffset -= 0.1;
//         break;
//       }
//     }
//   }

//   else if (e.shiftKey) {
//     switch (e.key) {
//       case "ArrowUp": {
//         pivot.scale.x += 0.01;
//         pivot.scale.y += 0.01;
//         break;
//       }
//       case "ArrowDown": {
//         pivot.scale.x -= 0.01;
//         pivot.scale.y -= 0.01;
//         break;
//       }

//     }
//   }

//   else if (e.key == "c") {
//     console.log("Initial position: x:", pivot.position.x, "  y: ", pivot.position.y);
//     console.log("Final position: x:", pivot.position.x + xOffset, "  y: ", pivot.position.y + yOffset);
//     console.log("Factor added: x:", xOffset, "  y: ", yOffset);
//     console.log("multiplyingFactor:", multiplyingFactor);
//     console.log("pivot.scale: ", pivot.scale )
//   }
//   else if (e.key == "z") {
//     multiplyingFactor += 0.5;
//   }
// });

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

  pivot.scale.set( ScaleX, ScaleY, ScaleZ);

  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

app();