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

const MODELS = {
  MASK: "Mask/mask.gltf",
  SPECTACLES: "glasses/scene.gltf",
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

const renderer = new THREE.WebGLRenderer({
  antialias: true, // to get smoother output
  preserveDrawingBuffer: true, // to allow screenshot
  alpha: true,
});
webglContainer.appendChild(renderer.domElement);

const scene = getTHREEbasics();

let detector, camera;
let mesh, pivot, threeDCam;
let leftEye, rightEye, nose;
let yOffsetPosition = 420; // Knee = 240, Hips = 420
let xOffsetPosition = 0
let startedTime = Date.now();
let rightHandCoords = [];
let rightShoulder, leftShoulder, rightHip, leftHip;
let shoulderAdjustment = 0;

let lips;
// Testing variables 
let rightAnkle, leftAnkle; // Position: 28, 27
let rightKnee, leftKnee; // Position: 26, 25
let rightFootIndex, leftFootIndex; // Position: 32,31

//
let eyesPosition = new Vector3();

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
    const leftWrist = getPart("left_wrist", poses[0])[0]; // at pos: 9
    const rightWrist = getPart("right_wrist", poses[0])[0]; // at pos: 10
    const rightElbow = getPart("right_elbow", poses[0])[0]; // at pos: 8

    leftEye = getPart("left_eye", poses[0])[0];
    rightEye = getPart("right_eye", poses[0])[0];
    nose = getPart("nose", poses[0])[0];

    leftShoulder = getPart("left_shoulder", poses[0])[0]; // at pos: 2
    rightShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 6

    leftHip = getPart("left_hip", poses[0])[0];
    rightHip = getPart("right_hip", poses[0])[0];

    leftFootIndex = getPart("left_foot_index", poses[0])[0];
    rightFootIndex = getPart("right_foot_index", poses[0])[0];

    leftKnee = getPart("left_knee", poses[0])[0];
    rightKnee = getPart("right_knee", poses[0])[0];

    leftAnkle = getPart("left_ankle", poses[0])[0];
    rightAnkle = getPart("right_ankle", poses[0])[0];

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

    const MeanPosition = new Vector3();
    const hipMeanPosition = new Vector3();
    const kneeMeanPosition = new Vector3();

    // MeanPosition.x = (((leftShoulder.x + leftHip.x)/2) + ((rightShoulder.x+rightHip.x)/2))/2;
    // MeanPosition.y = (((leftShoulder.y + leftHip.y)/2) + ((rightShoulder.y+rightHip.y)/2))/2;

    // eyesPosition.x = (leftEye.x + rightEye.x) / 2;
    // eyesPosition.y = ((leftEye.y + rightEye.y) / 2) + yOffset;
              /*ACTUAL POSITION COMMIT */
    hipMeanPosition.x = ((leftHip.x + rightHip.x)/2) + xOffsetPosition;
    //hipMeanPosition.y = ((leftHip.y + rightHip.y)/2) + yOffsetPosition + (leftAnkle.y + rightAnkle.y)/2 ; //HACK: Model ankle score low so behaving finicky
    hipMeanPosition.y = ((leftHip.y + rightHip.y)/2) + yOffsetPosition ; //STATIC VALUE: 420 HACK: Model ankle score low so behaving finicky.
              /* END COMMIT */
    /* HACK: The model was behaving abnormal cause it can't get good score for ankles. What I did was take distance from hip 
    to ankle and that comes around in the range of 390-440, so I took 420 as the median value. */
    
    // hipMeanPosition.x = (leftAnkle.x + rightAnkle.x)/2;
    // hipMeanPosition.y = (leftAnkle.y + rightAnkle.y)/2;

    // kneeMeanPosition.x = (leftKnee.x + rightKnee.x)/2;
    // kneeMeanPosition.y = (leftKnee.y + rightKnee.y)/2 + yOffsetPosition; // STATIC VALUE: 240

    const cooridnates = getWorldCoords(hipMeanPosition.x, hipMeanPosition.y, camera.video.videoHeight, camera.video.videoWidth, threeDCam);
    pivot.position.set(cooridnates.x, cooridnates.y, 1);

    const { yaw, pitch, roll } = getFacePose(poses[0])
    let normalizedYaw = (yaw - 90) * (Math.PI / 180);
    let normalizedPitch = (pitch - 75) * (Math.PI / 180);
    let leftShoulderAngle = 0;
    let rightShoulderAngle = 0;
    let UIElement = document.getElementById("valueLogger");
    UIElement.innerHTML = "";

    UIElement.innerHTML += `rightWristScore: ${rightWrist.score}`;
    mesh.traverse(function (child) {
      if (child.isBone) {
        let angle;
        //console.log()
        switch (child.name) {
          case "mixamorigLeftShoulder":
            angle = -getAngle(rightElbow, rightShoulder, 0, 0, -1);
            leftShoulderAngle = angle;
            child.rotation.y = angle;
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
            // angle = angle + 0.2;
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
            break;
        }
      }
    });
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
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
    switch (e.key) {
      case "ArrowUp": {
        yOffsetPosition +=10;
        //pivot.position.y += 0.1;
        break;
      }
      case "ArrowDown": {
        yOffsetPosition -=10;
        //pivot.position.y -= 1;
        break;
      }
      case "ArrowRight": {
        pivot.scale.x += 0.1;
        pivot.scale.y += 0.1;
        pivot.scale.z += 0.1;
        break;
      }
      case "ArrowLeft": {
        pivot.scale.x -= 0.1
        pivot.scale.y -= 0.1;
        pivot.scale.z -= 0.1;
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
    //console.log(yOffset);
    // console.log("Left shoulder: ",leftShoulder);
    // console.log("Right shoulder: ",rightShoulder);
    console.log("Left hip: ",leftHip);
    console.log("Right hip: ",rightHip);
    // console.log("Right foot index: ",rightFootIndex);
    // console.log("Left foot index: ",leftFootIndex);
    console.log("Left ankle: ",leftAnkle);
    console.log("Right ankle: ",rightAnkle);
    console.log("XOffset: ",xOffset);
    console.log("YOffset: ",yOffset);
  }
});

async function app() {
  camera = await Camera.setupCamera(STATE.camera);

  renderer.setSize(camera.video.videoWidth, camera.video.videoHeight);

  detector = await createDetector();
  let model;
  [camera, detector, model] = await Promise.all([
    Camera.setupCamera(STATE.camera),
    createDetector(),
    loadModel(MODELS.KATE)
  ]);

  [mesh, pivot] = setUpModel(model);

  pivot.scale.set(4,4,4);

  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

app();