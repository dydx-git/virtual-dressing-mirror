import * as mpPose from '@mediapipe/pose';
import * as posedetection from '@tensorflow-models/pose-detection';

export function getPart(partname, pose) {
	return pose["keypoints"].filter(function (partpoint) {
		if (partpoint.name == partname) return true;
	});
}

export async function createDetector() {
	return posedetection.createDetector("BlazePose", {
	  runtime: "mediapipe",
	  modelType: "full",
	  solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`
	});
  }