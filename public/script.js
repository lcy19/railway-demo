'use strict';
const roomId = location.pathname.substring(1);
const localStream = new MediaStream();
const remoteStream = new MediaStream();

const btnCamera = document.getElementById('btn-camera');
const btnMic = document.getElementById('btn-mic');

let peerMediaConnection;
const socket = io();
const peer = new Peer(undefined, {
  host: location.hostname,
  secure: true,
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
  videoElement.srcObject = type === 'local' ? localStream : remoteStream
  videoElement.onloadedmetadata = () => { videoElement.play() }
}

function stopTrack({ stream, kind = "both" }) {
  const tracks = kind === 'both' ? stream.getTracks() : stream.getTracks().filter(track => track.kind === kind);
  tracks.forEach(track => {
    track.enabled = false
    setTimeout(() => {
      track.stop()
      stream.removeTrack(track)
    }, 1000)
  });
}

function replaceTrackBeingSended({ track, kind }) {
  if (!peerMediaConnection) return;
  const rtpSenders = peerMediaConnection.getSenders();
  const filterRtpSenders = rtpSenders.filter(rtpSenders => rtpSenders.track.kind === kind);
  if (filterRtpSenders.length === 0) return
  const rtpSender = filterRtpSenders[0]
  rtpSender.replaceTrack(track)
}

async function buttonHandler(e) {
  const element = e.target
  const kind = element.dataset.kind
  if (element.dataset.state === 'active') {
    stopTrack({ stream: localStream, kind })
    element.dataset.state = 'stop'
  } else {
    try {
      const [track] = await getLocalTracks({ [kind]: true })
      localStream.addTrack(track)
      replaceTrackBeingSended({ track, kind })
    } catch (error) {
      alert('replace stream error')
    } finally {
      element.dataset.state = 'active'
    }
  }
}
btnCamera.onclick = buttonHandler
btnMic.onclick = buttonHandler