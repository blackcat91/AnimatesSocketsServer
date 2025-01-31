
const express = require("express");
const app = express();
const cors = require("cors");



app.use(express.json());
app.use(cors());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use("/",function(req, res) {
  res.send("Everything Checks Out!")
});
app.use(express.static(__dirname + "/public"));
let broadcaster;
const port = process.env.PORT ?? 8080;

const http = require("http");
const server = http.createServer(app);
// server.js or app.js



const io = require("socket.io")(server, {cors: {
  origin: "*",
  methods: ["GET", "POST"]
}});
const rooms = io.of("/rooms");
rooms.on("error", e => console.log(e));
rooms.on("connection",socket => {
  socket.send(JSON.stringify({
    type: "hello from server",
    content: [ 1, "2" ]
  }));
  socket.on("createRoom", (room) => {
    console.log("Creating Room!", room)
    socket.join(room);
   
    socket.to(room).emit("broadcaster",  room ,socket.id);
  })
  socket.on("joinRoom", (room, broadcast) => {
    socket.join(room);
    console.log("Room Broadcaster", room, broadcast)
    socket.to(broadcast).emit("watcher", socket.id);
    
  })
  socket.on("leaveRoom", (room) => {
    socket.leave(room);
  });
  socket.on("broadcaster", (room, broadcast) => {

    socket.to(room).emit("broadcaster", broadcast); 
  });

  socket.on("getTime", (broadcaster) => {
    console.log("Getting Current Time:")
    socket.to(broadcaster).emit("getTime", socket.id);
  });
  socket.on("sendTime", (watcher, time) => {
    console.log("Sending Current Time:", time)
    socket.to(watcher).emit("sendTime", time);
  });

  socket.on("videoEnded", (room) => {
    console.log("Video Ended")
    socket.to(room).emit("videoEnded");
  });
  socket.on("streamEnded", (room) => {
    console.log("Stream Ended")
    socket.to(room).emit("streamEnded");
  });
  
  socket.on("watcher", (broadcaster) => {
    console.log("Watching:", broadcaster)
    socket.to(broadcaster).emit("watcher", socket.id);
  });
  socket.on("watcherRoom", (room) => {
    console.log("Watching:", room)
    socket.to(room).emit("watcher", socket.id);
  });
  socket.on("offer", (id, message) => {
    socket.to(id).emit("offer", socket.id, message);
  });
  socket.on("answer", (id, message) => {
    socket.to(id).emit("answer", socket.id, message);
  });
  socket.on("candidate", (id, message) => {
    socket.to(id).emit("candidate", socket.id, message);
  });
  socket.on("disconnect", (broadcaster) => {
    console.log("Disconnected")
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
  
  socket.conn.on("disconnectAll", (room) => {
    console.log("Disconnected Room:", room);
    rooms.in(room).socketsLeave();
    
  });
  socket.on("sendMessage", (room, message) =>{
    console.log(message)
    socket.to(room).emit("sendMessage", message);
  })

});

const convos = io.of("/convos");
convos.on("error", e => console.log(e));
convos.on("connection",socket => {
  socket.send(JSON.stringify({
    type: "hello from server",
    content: [ 1, "2" ]
  }));
  socket.on("createConvo", (convo) => {
    console.log("Creating Convo!", convo)
    socket.join(convo);
   
    
  })
  socket.on("joinConvo", (convo) => {
    socket.join(convo);
    
    
  })
  socket.on("leaveConvo", (convo) => {
    socket.leave(convo);
  });
  socket.on("disconnect", () => {
    socket.broadcast.emit("disconnectPeer", socket.id);
  });
  socket.on("sendMessage", (convo, message) =>{
    console.log(message)
    socket.to(convo).emit("sendMessage", message);
  })

});

server.listen(port, () => console.log(`Server is running on port ${port}`));
