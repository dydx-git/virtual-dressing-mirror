import {getPart} from "./posenet";

export function  rotateJoint(jointA,jointB,jointC,poses) {
    let jA = getPart(jointA, poses)[0];
    let jB = getPart(jointB, poses)[0];
    let jC = getPart(jointC, poses)[0];

   // console.log(jA);
    //console.log(jB);
    //console.log(jC);
    
    let angle = (p1,p2,p3) => {
        const p13 = Math.sqrt(Math.pow((p1.x - p3.x), 2) + Math.pow((p1.y - p3.y), 2));
        const p12 = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
        const p23 = Math.sqrt(Math.pow((p2.x - p3.x), 2) + Math.pow((p2.y - p3.y), 2));
        const resultRadian = Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13));
        return resultRadian;
    }
    let Angle = angle(jA,jB,jC)
    return {Angle};
}

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