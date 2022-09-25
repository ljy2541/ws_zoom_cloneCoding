const socket = io()

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const cameraSelect = document.getElementById('cameras')

let myStream;
let muted = false;
let cameraOff = false;

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput')
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement("option")
      option.value = camera.deviceId
      if(currentCamera.label == camera.label){
        option.selected = true
      }
      cameraSelect.appendChild(option)
      option.innerText = camera.label
    })
    console.log(cameras)
  } catch (e) {
    console.log(e)
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: 'user' }
  }
  const cameraConnstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } }
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId ? cameraConnstraints : initialConstrains)
    myFace.srcObject = myStream
    if (!deviceId) {
      await getCameras()
    }
  } catch (e) {
    console.log(e)
  }
}

getMedia()

function handleMuteBtnClick() {
  myStream.getAudioTracks().forEach(track => track.enabled = !track.enabled)
  if (!muted) {
    muteBtn.innerText = 'Unmute'
    muted = true
  } else {
    muteBtn.innerText = 'Mute'
    muted = false
  }
}
function handleCameraBtnClick() {
  myStream.getVideoTracks().forEach(track => track.enabled = !track.enabled)
  if (!cameraOff) {
    cameraBtn.innerText = 'Camera On'
    cameraOff = true
  } else {
    cameraBtn.innerText = 'Camera Off'
    cameraOff = false
  }
}

async function handleCameraSelect() {
  getMedia(cameraSelect.value)
}

muteBtn.addEventListener('click', handleMuteBtnClick)
cameraBtn.addEventListener('click', handleCameraBtnClick)
cameraSelect.addEventListener('input', handleCameraChange)