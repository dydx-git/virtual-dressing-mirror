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
let leftEye, rightEye, nose;
let yOffset = 120;

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
    const leftShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 2
    const leftWrist = getPart("left_wrist", poses[0])[0]; // at pos: 9
    const rightWrist = getPart("right_wrist", poses[0])[0]; // at pos: 10
    const rightShoulder = getPart("right_shoulder", poses[0])[0]; // at pos: 6
    const rightElbow = getPart("right_elbow", poses[0])[0]; // at pos: 8

    leftEye = getPart("left_eye", poses[0])[0];
    rightEye = getPart("right_eye", poses[0])[0];
    nose =  getPart("nose", poses[0])[0];

    eyesPosition.x = (leftEye.x + rightEye.x) / 2;
    eyesPosition.y = ((leftEye.y + rightEye.y) / 2 ) + yOffset;

    const cooridnates = getWorldCoords(eyesPosition.x,eyesPosition.y,camera.video.videoHeight,camera.video.videoWidth,threeDCam);
    pivot.position.set(cooridnates.x,cooridnates.y,1);

    const {yaw, pitch, roll} = getFacePose(poses[0])
    let normalizedYaw = (yaw - 90) * (Math.PI / 180);
    let normalizedPitch = (pitch - 75) * (Math.PI / 180);
    
    mesh.traverse(function (child) {
      if (child.isBone) {
        let angle;
        console.log()
        switch (child.name) {
          case "mixamorigRightShoulder":
            angle = getAngle(rightElbow, rightShoulder, 0, 0, -1);
            child.rotation.y = angle - Math.sin(angle/2);
            console.log(angle);
            break;
          case "mixamorigRightForeArm":
            angle = getAngle(rightWrist, rightElbow, 0, 0, -1);
            child.rotation.x = angle;
            
            break;
          case "mixamorigLeftShoulder":
            angle = getAngle(leftShoulder, leftElbow, 0, 0, -1);
            child.rotation.y = angle;
            break;
          case "mixamorigLeftForeArm":
            angle = getAngle(leftElbow,leftWrist, 0, 0, -1);
            child.rotation.x = -angle;  
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

// Arrow key bindings with ctrl & alt to position and scale the model. 
window.addEventListener('keydown',(e)=> {
  if(e.ctrlKey) {
    switch(e.key) {
      case "ArrowUp": {
        yOffset +=10;
        break;
      }
      case "ArrowDown": {
        yOffset -=10;
        break;
      }
      case "ArrowRight": {
        pivot.position.x += 0.1;
        break;
      }
      case "ArrowLeft": {
        pivot.position.x -= 0.1;
        break;
      }
    }
  }

  else if (e.shiftKey) {
    switch(e.key) {
      case "ArrowUp": {
        pivot.scale.x += 0.01;
        pivot.scale.y += 0.01;
        break;
      }
      case "ArrowDown": {
        pivot.scale.x -= 0.01;
        pivot.scale.y -=0.01;
        break;
      }

    }
  }

  else if (e.key == "c") {
    console.log(yOffset);

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
      loadModel(MODELS.MICKEY)
  ]);
  
  [mesh, pivot] = setUpModel(model);

  pivot.scale.set(0.05, 0.05, 0.05);
  
  scene.add(pivot);

  threeDCam = setUpTHREEDCamera(camera.video.videoWidth, camera.video.videoHeight);
  scene.add(threeDCam);

  animate();
};

app();