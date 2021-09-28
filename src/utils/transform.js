import {getPart} from "./posenet";
import { Vector3 } from "three";

export function getFacePose(keypoints) {
	const nose = getPart("nose", keypoints)[0];
	const leftEye = getPart("left_eye", keypoints)[0];
	const rightEye = getPart("right_eye", keypoints)[0];
	const leftEar = getPart("left_ear", keypoints)[0];
	const rightEar = getPart("right_ear", keypoints)[0];
	//const leftShoulder = getPart("left_shoulder", keypoints)[0];
	//const rightShoulder = getPart("right_shoulder", keypoints)[0];
  
	//console.log(nose);

	const nosePosition = [nose.x, nose.y];
	const leftEyePosition = [leftEye.x, leftEye.y];
	const rightEyePosition = [rightEye.x, rightEye.y];
	const leftEarPosition = [leftEar.x, leftEar.y];
	const rightEarPosition = [rightEar.x, rightEar.y];

	//console.log(leftEarPosition);

	const _yaw = Math.atan2(
		2 * nosePosition[0] - leftEyePosition[0] - rightEyePosition[0],
		leftEyePosition[0] - rightEyePosition[0]
	);
	return {
		yaw: getYaw(_yaw),
		pitch: getPitch(_yaw, nosePosition, leftEarPosition, rightEarPosition),
        roll: getRoll(leftEyePosition, rightEyePosition)
	//	leftShoulder: leftShoulder,
    //rightShoulder: rightShoulder,
	};
}

function getYaw(yaw) {
	return (yaw * -180) / Math.PI + 90;
}

function getPitch(yaw, nosePosition, leftEarPosition, rightEarPosition) {
	const earYAvg = (leftEarPosition[1] + rightEarPosition[1]) / 2;
	return (
		(Math.asin(
			(2 * (nosePosition[1] - earYAvg) * Math.cos(yaw)) /
        Math.abs(rightEarPosition[0] - leftEarPosition[0])
		) *
      -180) /
      Math.PI +
    90
	);
}

function getRoll(leftEye, rightEye) {
    return Math.atan(
        (rightEye[1] - leftEye[1]) / 
        (rightEye[0] - leftEye[0])
    );
}

export function getAngle(p1, p2, c1, c2, m) {
    const CONFIDENCE = 0.65;
    if(p1.score > CONFIDENCE && p2.score > CONFIDENCE){
      return (Math.atan2(p2.y - p1.y, p2.x - p1.x) + c1) * m;
    }
    return c2 * m
}

export function getWorldCoords(x, y, height, width, camera) {
    const normalizedPointOnScreen = new Vector3();
    normalizedPointOnScreen.x = -((x / width) * 2 - 1);
    normalizedPointOnScreen.y = -(y / height) * 2 + 1;
    normalizedPointOnScreen.z = 0.0; // set to z position of mesh objects
    normalizedPointOnScreen.unproject(camera);
    normalizedPointOnScreen.sub(camera.position).normalize();
    const distance = -camera.position.z / normalizedPointOnScreen.z,
        scaled = normalizedPointOnScreen.multiplyScalar(distance),
        coords = camera.position.clone().add(scaled);
    return new Vector3(coords.x, coords.y, coords.z);
}

export function getDirection(coords) {
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

export function rotateJoint(firstPoint, secondPoint, joint) {

}

function getLeftShoulderRotation(params) {
    
}

function getRightShoulderRotation(params) {
    
}

function getRightForearmRotation(params) {
    
}

function getLeftForearmRotation(params) {
    
}