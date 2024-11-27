// 음악 파일 경로 설정 (각 감정별 음악 파일 준비 필요)
const emotionMusic = {
    anger: './music/anger.mp3',
    happy: './music/happy.mp3',
    sad: './music/sad.mp3',
    neutral: './music/neutral.mp3',
    surprised: './music/surprised.mp3',
    fear: './music/fear.mp3',
};

let currentAudio = null; // 현재 재생 중인 오디오
let fadeInterval = null; // 페이드 효과를 위한 interval

function playMusic(emotion) {
    if (currentAudio && !currentAudio.paused) {
        fadeOutAudio(currentAudio); // 기존 음악 페이드아웃
    }

    const audio = new Audio(emotionMusic[emotion]);
    audio.loop = true;
    audio.volume = 0;
    audio.play();

    fadeInAudio(audio); // 새로운 음악 페이드인
    currentAudio = audio;
}

function fadeInAudio(audio) {
    let volume = 0;
    fadeInterval = setInterval(() => {
        if (volume < 1) {
            volume += 0.05;
            audio.volume = volume;
        } else {
            clearInterval(fadeInterval);
        }
    }, 100);
}

function fadeOutAudio(audio) {
    let volume = audio.volume;
    fadeInterval = setInterval(() => {
        if (volume > 0) {
            volume -= 0.05;
            audio.volume = volume;
        } else {
            audio.pause();
            clearInterval(fadeInterval);
        }
    }, 100);
}

const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox');

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            playMusic(highestExpression); // 감정에 따른 음악 재생

            const emotionColors = {
                anger: 'rgb(255, 0, 0)',
                happy: 'rgb(255, 255, 0)',
                sad: 'rgb(0, 0, 255)',
                neutral: 'rgb(128, 128, 128)',
                surprised: 'rgb(255, 165, 0)',
                fear: 'rgb(128, 0, 128)',
            };

            const dominantColor = emotionColors[highestExpression] || 'white';
            colorBox.style.background = `linear-gradient(to bottom, ${dominantColor}, white)`;

            if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
        } else {
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
            colorBox.style.background = 'white';
        }
    }, 100);
});