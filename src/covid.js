import { Camera } from './utils/camera';
import { STATE } from "./utils/params";
import {getPart, createDetector} from "./utils/posenet";
import {getDirection } from "./utils/transform";

let totalConfirmed = document.querySelector('.total-confirmed')
let totalRecovered = document.querySelector('.total-recovered')
let totalDeaths = document.querySelector('.total-deaths')
const loader = document.querySelector('.spinner-loader');
const hadnWave = document.querySelector('.handwave-loader');
let notificationData;
let camera,detector;
let poses;
let rightHandCoords = [];
let startedTime = Date.now();
let coronaData = fetch("https://corona.lmao.ninja/v2/countries/Pakistan?yesterday&strict&query")
coronaData.then(response => response.json())
.then(res => {
    console.log(res.cases)
    totalConfirmed.innerHTML = `${res.cases}`;
    totalRecovered.innerHTML = `${res.recovered}`;
    totalDeaths.innerHTML = `${res.deaths}`;
    covidGraph(res);
})


// console.log(Initializer.camera);

async function app () {
    [camera, detector] = await Promise.all([
        Camera.setupCamera(STATE.camera),
        createDetector(),
    ])
    repeatAnimate();
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    image_data_url = canvas.toDataURL('image/jpeg');
    $.ajax({
        type: "POST",
        url: "http://localhost:3000",
        data: { url: image_data_url},
        datatyoe: 'json'
      }).done(function( res ) {
        //console.log(res.json());
        console.log("Worked?");
        $("#mask-detection").show();
      });
    
}


async function repeatAnimate() {
    poses = await detector.estimatePoses(
        camera.video, {
        maxPoses: 1,
        flipHorizontal: false
    });
    if (poses.length > 0) {
        const rightWrist = getPart("right_wrist", poses[0])[0];
        if (rightWrist.score > 0.8) {
            rightHandCoords.push(rightWrist.x);
        }
        loader.style.display = "none";
        hadnWave.style.display = "flex";
        if (Date.now() - startedTime > 1000) {
            if (rightHandCoords.length > 10) {
                console.log(getDirection(rightHandCoords));
                if (getDirection(rightHandCoords) == "right") {
                    document.getElementById('handLeft').click();
                } else if (getDirection(rightHandCoords) == "left") {
                    document.getElementById('handRight').click();
                }
            }
            rightHandCoords = [];
            startedTime = Date.now();
        }
    }  

    requestAnimationFrame(repeatAnimate);
    
}


function spinner() {
    loader.style.display = "flex";
    app();

}


spinner();



function covidGraph(results) {
    const labels = [
        'Confirmed',
        'Recovered',
        'Deaths'
    ];
    const data = {
        labels: labels,
        datasets: [{
            label: 'My First dataset',
            backgroundColor: [
                'rgb(153, 102, 255, 0.5)',
                'rgb(75, 192, 192, 0.5)',
                'rgb(255, 99, 132, 0.5)'
            ],
            borderColor: [
                'rgb(153, 102, 255)',
                'rgb(75, 192, 192)',
                'rgb(255, 99, 132)'
            ],
            borderWidth: 5,
            // barThickness: 60,
            data: [results.cases,results.recovered,results.deaths],
        }]
    };
    
    const config = {
        type: 'bar',
        data,
        options: {
            scales: {
                x: {
                    title: {
                        font: {
                            size:20,
                            weight: "bold"
                        },
                        color: '#FEF7DC'
                    },
                    
                    ticks: {
                        font: {
                            size: 30,
                            weight: "lighter"
                        },
                        color: '#FEF7DC'
                    },
                },
                y: {
                    title: {
                        font: {
                            size:20,
                            weight: "bold"
                        },
                        color: '#FEF7DC'
                    },
                    
                    ticks: {
                        font: {
                            size: 30,
                            weight: "lighter"
                        },
                        color: '#FEF7DC'
                    },
                }
            },
            plugins: {
                legend: {
                    labels: {
                        fontFamily: "'Roboto', sans-serif"
                    },
                    display: false,
                }
            }
        }
    };
    var myChart = new Chart(
        document.getElementById('covidChart'),
        config
        );
    }
    
    