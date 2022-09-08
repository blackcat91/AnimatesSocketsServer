
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
  
  socket.on("watcher", (broadcaster) => {
    console.log("Watching:", broadcaster)
    socket.to(broadcaster).emit("watcher", socket.id);
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
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
  socket.on("sendMessage", (room, message) =>{
    console.log(message)
    socket.to(room).emit("sendMessage", message);
  })

});

const convos = io.of("/convos");
convos.on("error", e => console.log(e));
convos.on("connection",socket => {
  
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
  socket.on("disconnect", (broadcaster) => {
    socket.to(broadcaster).emit("disconnectPeer", socket.id);
  });
  socket.on("sendMessage", (convo, message) =>{
    console.log(message)
    socket.to(convo).emit("sendMessage", message);
  })

});

server.listen(port, () => console.log(`Server is running on port ${port}`));
