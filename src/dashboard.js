const weatherTemperature = document.querySelector('.weather-temperature');
const weatherCondition = document.querySelector('.weather-condition');
const weatherImage = document.querySelector('.weather-image');
const currentTime = document.querySelector('.current-time');
const currentDate = document.querySelector('.current-date');
const notificationList = document.querySelector('.notification-list');
// const swup = new Swup();
const date = new Date();
const API_KEY = '505e050c400e4b41872161802211508';
const CITY = 'Karachi';
let notificationData;

const weatherData = fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${CITY}`)
    .then(res => res.json())
    .then(data => {
        console.log(data)
        weatherTemperature.innerHTML = `${data.current.temp_c}&deg;C`;
        weatherImage.src = `https:${data.current.condition.icon}`
        weatherCondition.innerHTML = `${data.current.condition.text}`;
    });

function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = currentTime.innerHTML = `${hours}:${minutes} ${ampm}`;
    return strTime;
}

console.log(formatAMPM(new Date));
const slicedDate = date.toDateString().slice(0,10);
currentDate.innerHTML = `${slicedDate}`;

var firebaseConfig = {
    apiKey: "AIzaSyAv04XTFzk34PLHsCnDRWjqvOJBE9Nsvuc",
    authDomain: "notification-listener-firebase.firebaseapp.com",
    databaseURL: "https://notification-listener-firebase-default-rtdb.firebaseio.com",
    projectId: "notification-listener-firebase",
    storageBucket: "notification-listener-firebase.appspot.com",
    messagingSenderId: "489976206937",
    appId: "1:489976206937:web:c016bc0888056bc55c4348",
    measurementId: "G-X9K7REV08C"
  };
  // Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const db = firebase.database();
const ref = db.ref("notifications");
ref.on('value', (notificationObject) => {
    notificationData = notificationObject.val();
    console.log(notificationData);
    for (let index = 0; index < 4; index++) {
        const liTag = document.createElement('li');
        liTag.innerHTML = `<i class="fab fa-whatsapp show"></i>&nbsp&nbsp${notificationData.notification_title[index+1]}`;
        notificationList.appendChild(liTag);
        setTimeout(function(){
            liTag.classList.add('show')
            liTag.classList.add('fade')
        },20);
    }
}, (errorObject) => {
console.log('The read failed: ' + errorObject.name);
});


