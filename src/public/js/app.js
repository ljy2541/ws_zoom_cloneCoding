const socket = io()

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const cameraSelect = document.getElementById('cameras')

const welcome = document.getElementById('welcome')
const call = document.getElementById('call')

call.hidden = true

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput')
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement("option")
      option.value = camera.deviceId
      if (currentCamera.label == camera.label) {
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

async function handleCameraChange() {
  await getMedia(cameraSelect.value)
}

muteBtn.addEventListener('click', handleMuteBtnClick)
cameraBtn.addEventListener('click', handleCameraBtnClick)
cameraSelect.addEventListener('input', handleCameraChange)


welcomeForm = welcome.querySelector('form');

async function startMedia() {
  welcome.hidden = true
  call.hidden = false
  await getMedia();
  makeConnection();
}

function handleWelcomeSubmit(event) {
  event.preventDefault()
  const input = welcomeForm.querySelector('input');
  socket.emit('join_room', input.value, startMedia)
  roomName = input.value
  input.value = ''
}

welcomeForm.addEventListener('submit', handleWelcomeSubmit)

//Socket Code

socket.on('welcome', async () => {
  const offer = await myPeerConnection.createOffer()
  myPeerConnection.setLocalDescription(offer)
  console.log("send the offer");
  socket.emit('offer', offer, roomName)
})

socket.on('offer', offer => {
  console.log(offer)
})

// RTC Code

function makeConnection() {
  myPeerConnection = new RTCPeerConnection();
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream))
}