/**
 * @license
 * Copyright 2021 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
 import * as posedetection from '@tensorflow-models/pose-detection';

 import * as params from './params';
 
 export class Camera {
   constructor() {
     this.video = document.getElementById('video');
     this.canvas = document.getElementById('output');
     this.ctx = this.canvas.getContext('2d');
   }
 
   /**
    * Initiate a Camera instance and wait for the camera stream to be ready.
    * @param cameraParam From app `STATE.camera`.
    */
   static async setupCamera(cameraParam) {
     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
       throw new Error(
           'Browser API navigator.mediaDevices.getUserMedia not available');
     }
 
     const {targetFPS, sizeOption} = cameraParam;
     const $size = params.VIDEO_SIZE[sizeOption];
     const videoConfig = {
       'audio': false,
       'video': {
         facingMode: 'user',
         // Only setting the video to a specified size for large screen, on
         // mobile devices accept the default size.
         width: 1080,
         height: 1920,
         frameRate: {
           ideal: targetFPS,
         }
       }
     };
 
     const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
 
     const camera = new Camera();
     camera.video.srcObject = stream;
 
     await new Promise((resolve) => {
       camera.video.onloadedmetadata = () => {
         resolve(video);
       };
     });
 
     camera.video.play();
 
     const videoWidth = camera.video.videoWidth;
     const videoHeight = camera.video.videoHeight;
     // Must set below two lines, otherwise video element doesn't show.
     camera.video.width = videoWidth;
     camera.video.height = videoHeight;
 
     camera.canvas.width = videoWidth;
     camera.canvas.height = videoHeight;
     const canvasContainer = document.querySelector('.canvas-wrapper');
     canvasContainer.style = `width: ${window.innerWidth}px; height: ${window.innerHeight}px`;
 
     // Because the image from camera is mirrored, need to flip horizontally.
     camera.ctx.translate(camera.video.videoWidth, 0);
     camera.ctx.scale(-1, 1);
 
     return camera;
   }
 
   drawCtx() {
     this.ctx.drawImage(
         this.video, 0, 0, this.video.videoWidth, this.video.videoHeight);
   }
 
   clearCtx() {
     this.ctx.clearRect(0, 0, this.video.videoWidth, this.video.videoHeight);
   }
 
   /**
    * Draw the keypoints and skeleton on the video.
    * @param poses A list of poses to render.
    */
   drawResults(poses) {
     for (const pose of poses) {
       this.drawResult(pose);
     }
   }
 
   /**
    * Draw the keypoints and skeleton on the video.
    * @param pose A pose with keypoints to render.
    */
   drawResult(pose) {
     if (pose.keypoints != null) {
       this.drawKeypoints(pose.keypoints);
       this.drawSkeleton(pose.keypoints);
     }
   }
 
   /**
    * Draw the keypoints on the video.
    * @param keypoints A list of keypoints.
    */
   drawKeypoints(keypoints) {
     const keypointInd =
         posedetection.util.getKeypointIndexBySide("BlazePose");
     this.ctx.fillStyle = 'White';
     this.ctx.strokeStyle = 'White';
     this.ctx.lineWidth = params.DEFAULT_LINE_WIDTH;
 
     for (const i of keypointInd.middle) {
       this.drawKeypoint(keypoints[i]);
     }
 
     this.ctx.fillStyle = 'Green';
     for (const i of keypointInd.left) {
       this.drawKeypoint(keypoints[i]);
     }
 
     this.ctx.fillStyle = 'Orange';
     for (const i of keypointInd.right) {
       this.drawKeypoint(keypoints[i]);
     }
   }
 
   drawKeypoint(keypoint) {
     // If score is null, just show the keypoint.
     const score = keypoint.score != null ? keypoint.score : 1;
     const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;
 
     if (score >= scoreThreshold) {
       const circle = new Path2D();
       circle.arc(keypoint.x, keypoint.y, params.DEFAULT_RADIUS, 0, 2 * Math.PI);
       this.ctx.fill(circle);
       this.ctx.stroke(circle);
     }
   }
 
   /**
    * Draw the skeleton of a body on the video.
    * @param keypoints A list of keypoints.
    */
   drawSkeleton(keypoints) {
     this.ctx.fillStyle = 'White';
     this.ctx.strokeStyle = 'White';
     this.ctx.lineWidth = params.DEFAULT_LINE_WIDTH;
 
     posedetection.util.getAdjacentPairs("BlazePose").forEach(([
                                                                       i, j
                                                                     ]) => {
       const kp1 = keypoints[i];
       const kp2 = keypoints[j];
 
       // If score is null, just show the keypoint.
       const score1 = kp1.score != null ? kp1.score : 1;
       const score2 = kp2.score != null ? kp2.score : 1;
       const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;
 
       if (score1 >= scoreThreshold && score2 >= scoreThreshold) {
         this.ctx.beginPath();
         this.ctx.moveTo(kp1.x, kp1.y);
         this.ctx.lineTo(kp2.x, kp2.y);
         this.ctx.stroke();
       }
     });
   }
 }
 