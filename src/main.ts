import Peer, { MediaConnection } from "peerjs";

const peer = new Peer();
const $ = (id: string) => document.getElementById(id);

const localIdInput = $("localId") as HTMLInputElement;
const remoteIdInput = $("remoteId") as HTMLInputElement;
const connectBtn = $("connect") as HTMLButtonElement;
const localPlayerVideo = $("localPlayer") as HTMLVideoElement;
const remotePlayerVideo = $("remotePlayer") as HTMLVideoElement;

let localStream: MediaStream;
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    localStream = stream;
    localPlayerVideo.srcObject = stream;
    localPlayerVideo.onloadedmetadata = () => localPlayerVideo.play();
  })
  .catch((err) => {
    console.log("err:", err);
  });

peer.on("open", (id) => {
  localIdInput.value = id
});

peer.on("call", (call) => {
  call.answer(localStream);
  setRemoteStream(call)
});

connectBtn.onclick = () => {
  const remoteId = remoteIdInput.value;
  const call = peer.call(remoteId, localStream);
  setRemoteStream(call)
};


function setRemoteStream(call:MediaConnection){
  call.on('stream', remoteStream => {
    remotePlayerVideo.srcObject = remoteStream
    remotePlayerVideo.onloadedmetadata = () => remotePlayerVideo.play()
  })
}