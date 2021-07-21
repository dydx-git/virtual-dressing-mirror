import * as THREE from "three/build/three.module";
import Stats from "stats.js/build/stats.min.js";
import { Camera } from './camera';
import { STATE } from "./params";
import { getPart, getFacePose, createDetector } from "./posenet";
import { getTHREEbasics, setUpModel, loadModel, setUpTHREEDCamera } from "./three";
import {Mask, Glasses, FaceRotation} from "./models";
import { TraverseBones} from "./models";

export function getImports() {
	return {
		THREE,
		Stats, 
		Camera,
		STATE,
		getFacePose, 
		getPart,
		createDetector,
		getTHREEbasics, 
		setUpModel,
		loadModel,
		setUpTHREEDCamera,
		Mask, 
		Glasses,
		FaceRotation,
		TraverseBones
	};
}
