const peerConnections = {};
const config = {
  iceServers: [
    { 
      "urls": "stun:stun.l.google.com:19302",
    },
    // { 
    //   "urls": "turn:TURN_IP?transport=tcp",
    //   "username": "TURN_USERNAME",
    //   "credential": "TURN_CREDENTIALS"
    // }
  ]
};


let video  = document.querySelector('video');

socket.on("answer", (id, description) => {
  peerConnections[id].setRemoteDescription(description);
});

socket.on("watcher", id => {
  const peerConnection = new RTCPeerConnection(config);
  peerConnections[id] = peerConnection;
  let stream = video.captureStream ? video.captureStream() : video.mozCaptureStreamUntilEnded();
  console.log(stream);
 
  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    
  

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("candidate", id, event.candidate);
    }
  };

  peerConnection
    .createOffer()
    .then(sdp => peerConnection.setLocalDescription(sdp))
    .then(() => {
      socket.emit("offer", id, peerConnection.localDescription);
    });
  
 
 
  
});

socket.on("candidate", (id, candidate) => {
  peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
  peerConnections[id].close();
  delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
  socket.close();
};

// Get camera and microphone

const vidContainer = document.getElementsByClassName("vid-container")[0]
const mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2';
let urls =['https://storage.googleapis.com/evbp-adixy-1651468419.appspot.com/ED1UV4GUBDV2/st25_0_lupin-iii-2015--episode-2-HD.mp4', 'https://www07.gogocdn.stream/videos/hls/aGCb7ArGNfiEkI-aNus2Ng/1660288918/69066/0c8795ea8650b7540d40db06647418c8/ep.1.1647220049.m3u8', 'https://storage.googleapis.com/zkjs-wykke-1651630828.appspot.com/WNE2B1YA2_A/st25_0_lupin-iii-2015--episode-10-HD.mp4', 
'https://storage.googleapis.com/wksf-lbeon-1651382321.appspot.com/NC74LS2AOTM/st25_6_hataraki-man-episode-1-HD.mp4'];
let urlIndex = 0;



var mediaSource = null;


let stream;

gotStream(urls[0]);


function maybeCreateStream() {
  if (stream) {
    return;
  }
  if (video.captureStream) {
    stream = video.captureStream()
    socket.emit("broadcaster", room);
    
    
  } else if (video.mozCaptureStream) {
    stream = video.mozCaptureStream();
    socket.emit("broadcaster", room);
    
  } else {
    console.log('captureStream() not supported');
  }
}

video.oncanplay = maybeCreateStream

if (video.readyState >= 3) { // HAVE_FUTURE_DATA
  // Video is already ready to play, call maybeCreateStream in case oncanplay
  // fired before we registered the event handler.
  maybeCreateStream();
}

video.addEventListener('error', (e) => {
  console.log(video.readyState)
  
  if(video.networkState  === 1){
    if(urlIndex + 1 < urls.length){
      urlIndex += 1
      gotStream(urls[urlIndex]);
      video.play()
      socket.emit("broadcaster", room);
      
    }
  
    
    else{
      console.log("Stream Ended");
    }
  }
  else if(video.readyState == 0){
    console.log('Downloading File')
    downloadVideo(urls[urlIndex]).then(() => {
      socket.emit("broadcaster", room);
      video.play()
      console.log("Download Complete")
    })
  }
  
})

video.addEventListener("ended", () => {
  if(urlIndex + 1 < urls.length){
    urlIndex += 1
    gotStream(urls[urlIndex]);
    video.play()
    socket.emit("broadcaster");
    console.log(urls);
  }
  else{
    console.log("Stream Ended");
    socket.emit("disconnect")
  }
  

})

function tryLoad () {
 
    if(video.readyState >= 1){
      console.log("Success")
      socket.emit("broadcaster");
      return true
    }
    else{
      throw "Load Failed!";
    }

} 

 let downloadVideo = (url) => fetch('/convert', {method: "POST",headers:{"Content-Type": "application/json"}, body: JSON.stringify({'url': url })})
 .then( resp =>  resp.json())
 .then( json => {
  video.src = json.url;
  video.load()
 });

function gotStream(url) {
  
  if(!url.includes(".m3u8")){
    
      
      
     
    
    
    console.log('Preparing Video Player')
   video.src = `/playlist/${url.split('/')[url.split('/').length -1]}`;
   //video.src = '/play/deeznuts.mp4' 
   video.load()
   console.log(video.readyState)
   socket.emit("broadcaster", room);
    /*
   fetch('/convert', {method: "POST",headers:{"Content-Type": "application/json"}, body: JSON.stringify({'url': url })})
   .then( resp =>  resp.json())
   .then( json => {
    
    video.src = json.url;
    video.load()
   }) */
   
   
  
   
   
  }else{
    if (Hls.isSupported()) {
  
  
      var hls = new Hls();
      // bind them together
      
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        console.log('video and hls.js are now bound together !');
        loadSource(hls, url)
        
      });
    
      
      
      
    }
  }


  
  
}

function loadSource(hls, url){
  hls.loadSource(url);
    hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
      console.log(
        'manifest loaded, found ' + data.levels.length + ' quality level'
      );
      hls.on(Hls.Events.LEVEL_LOADED, function(e,frag) {
        if(video.src !== null){
          
          socket.emit("broadcaster", room);
          video.play()
          console.log("Broadcasting...")
          
       
        }
      })

     
        
    });
}

function handleError(error) {
  console.error("Error: ", error);
}