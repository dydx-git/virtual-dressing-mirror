import * as faceapi from "face-api.js/dist/face-api.min";
import {gsap} from "gsap/dist/gsap.min";
import images from "../dist/utils/labelled images/*/*.jpg";


const container = document.querySelector('.container');
const container2 = document.querySelector('.container2');
const lottieSvg = document.querySelector('.lottie-svg');
const searchingFace = document.querySelector('.searching-tag');
const btn = document.querySelector('.btn');
const video = document.getElementById('videoInput')
const t1 = gsap.timeline()
const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models/"
let loopCompleted = 0;
let animLottie;
let banner;
//                                      BANNER ANIMATION
// console.log(anime());
function authBegin () {
    Promise.all([
        // faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), //heavier/accurate version of tiny face detector
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), //heavier/accurate version of tiny face detector
        console.log("Tiny Loaded models"),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        console.log("Loaded models"),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        console.log("Loaded models"),
        navigator.getUserMedia(
            { video:{} },
            stream => { video.srcObject = stream;
                        console.log(stream);
            },
            err => console.error(err)
        ),
    ])
    .then( () => {
        console.log('this is banner');
        banner = anime({
            targets: '#usmani path',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 2500,
            delay: function(el, i) { return i * 250 },
            endDelay: 400,
            direction: 'alternate',
            loop: true,
            loopComplete: function(anim) {
                loopCompleted++;
                if (loopCompleted == 2) {
                    console.log('Models Loaded')
                    
                    // console.log(banner)
                    banner.pause();
                    console.log(t1);
                    t1.to(container, {clipPath: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)'}, '+=9')
                    container.style.display = 'none';
                    container2.style.display = 'flex';
                    container2.style.opacity = '1';
                    animLottie = bodymovin.loadAnimation( {
                        wrapper: lottieSvg,
                        animType: 'svg',
                        loop: true,
                        autoplay: false,
                        path: "https://assets6.lottiefiles.com/packages/lf20_wK2ITq.json",
                        playMode: 'bounce'
                    });
                    animLottie.play();
                    searchingFace.innerHTML = "Seaching for Face...";
                    // start();
                }
                recognizeFaces()
            }
            });
    })
};

authBegin();


function start() {
    recognizeFaces()
}
    


async function recognizeFaces() {

    const labeledDescriptors = await loadLabeledImages()
    console.log(labeledDescriptors)
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.7)


    
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors()

        const results = detections.map((d) => {
            return faceMatcher.findBestMatch(d.descriptor)
        })
        if (results.length != 0) {
            results.forEach( (result, i) => {
                searchingFace.innerHTML = `Welcome ${result._label}`; 
                searchingFace.style.animation = 'none';
            })
            dashboard();
        } 
    }, 100)
}


function loadLabeledImages() {
    return Promise.all(
        Object.entries(images).map(async (label)=>{
            const descriptions = []
            for(let i=1; i<=2; i++) {
                let img;
                img = await faceapi.fetchImage(label[1][i])
                const detections = await faceapi.detectSingleFace(img,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor()
                descriptions.push(detections.descriptor)
            }
            console.log(label[0]+' Faces Loaded | ')
            return new faceapi.LabeledFaceDescriptors(label[0], descriptions)
        })
    )
};



function dashboard() {
    document.getElementById('goingLeft').click();
};