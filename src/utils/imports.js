import * as THREE from "three/build/three.module";
import Stats from "stats.js/build/stats.min.js";
import { Camera } from './camera';
import { STATE } from "./params";
import { RIGGED_MODELS, UNRIGGED_MODELS } from "./models";
import { getPart, createDetector } from "./posenet";
import { getTHREEbasics, setUpModel, loadModel, setUpTHREEDCamera, loadEnchancedHat, loadEnchancedMask } from "./three";
import { getFacePose, getAngle, getWorldCoords, getDirection } from "./transform";
import { addKeybinding } from "./keyboard";

export function getImports() {
	return {
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
	};
}
