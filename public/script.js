const roomId = location.pathname.substring(1);
const localStream = new MediaStream();
const remoteStream = new MediaStream();

const btnCamera = document.getElementById('btn-camera');
const btnMic = document.getElementById('btn-mic');

let peerMediaConnection;
const socket = io();
const peer = new Peer(undefined, {
  host: location.hostname,
  secure: false,
  port: location.port,
  path: 'peerjs'
})

peer.on('open', peerId => {
  console.log('peer => open', peerId, 'socket emit new-user')
  socket.emit('new-user', { roomId, peerId })
})

socket.on('another-user', async remotePeerId => {
  console.log('sokcet.on => another-user')
  try {
    const [videoTrack, audioTrack] = await getLocalTracks({ video: true, audio: true })
    localStream.addTrack(videoTrack)
    localStream.addTrack(audioTrack)
    showStream('local');
  } catch (error) {
    alert('get track error:', error)
  }
  const call = peer.call(remotePeerId, localStream)
  peerMediaConnection = call.peerConnection;
  call.on('stream', stream => {
    remoteStream.addTrack(stream.getVideoTracks()[0]);
    remoteStream.addTrack(stream.getAudioTracks()[0]);
    showStream('remote')
  })
})

peer.on('call', async call => {
  try {
    const [videoTrack, audioTrack] = await getLocalTracks({ video: true, audio: true });
    localStream.addTrack(videoTrack);
    localStream.addTrack(audioTrack);
    showStream('local');
  } catch (error) {
    alert('call get track error:', error)
  }
  call.answer(localStream);
  peerMediaConnection = call.peerConnection;
  call.on('stream', stream => {
    remoteStream.addTrack(stream.getVideoTracks()[0]);
    remoteStream.addTrack(stream.getAudioTracks()[0]);
    showStream('remote')
  })
})
function getLocalTracks(constraint) {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices.getUserMedia(constraint).then(stream => {
      if (constraint.video && constraint.audio) {
        resolve([stream.getVideoTracks()[0], stream.getAudioTracks()[0]]);
      } else if (constraint.video) {
        resolve([stream.getVideoTracks()[0]])
      } else if (constraint.audio) {
        resolve([stream.getAudioTracks()[0]])
      }
    }).catch(err => {
      reject(err)
    })
  })
}

function showStream(type) {
  console.log('showStram => ', type)
  const videoElement = type === 'local' ? document.getElementById('local-video') : document.getElementById('remote-video');
  videoElement.srcObj = type === 'local' ? localStream : remoteStream
  videoElement.onloadedmetadata = () => { videoElement.play() }
}