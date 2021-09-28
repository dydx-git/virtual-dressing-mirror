import {createDetector} from "./posenet";
import { Camera } from "./camera";
import { STATE } from "./params";

export class Initializer {
    static async initialize() {
        if (this.camera && this.detector) {
            return true;
        }
        this.camera = await Camera.setupCamera(STATE.camera);
        this.detector = await createDetector();
        return true;
    };
}