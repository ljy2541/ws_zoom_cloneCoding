import http from "http";
import { Server } from "socket.io";
import express from "express";
import { fileURLToPath } from "url";   // 👈 추가

const __dirname = fileURLToPath(new URL(".", import.meta.url));   // 👈 추가
const __filename = fileURLToPath(import.meta.url);   // 👈 추가


const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const wsServer = new Server(httpServer);

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "익명";
  wsServer.sockets.emit("room_change", publicRooms());
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event => ${event}`);
  });
  socket.on("enter_room", (roomName, done) => {
    console.log("방제 : ", roomName);
    socket.join(roomName);
    done();
    // socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) =>
      socket.to(room).emit("bye", socket.nickname, countRoom(room) - 1)
    );
  });
  socket.on("disconnect", () => {
    wsServer.sockets.emit("room_change", publicRooms());
  });
  socket.on("new_message", (msg, room, done) => {
    socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
    done();
  });
  socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
});

// const wss = new WebSocket.Server({ server })
// const sockets = [];

// wss.on("connection", (socket) => {
//     sockets.push(socket)
//     socket["nickname"] = 'Anon'
//     console.log('Connected to Browser✔');
//     socket.on('close', () => {
//         console.log('Disconnect to Browser❌')
//     })
//     socket.on('message', (msg) => {
//         const message = JSON.parse(msg)
//         switch(message.type){
//             case "new_message":
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname} : ${message.payload}`))
//                 break;
//             case "nickname":
//                 socket["nickname"] = message.payload
//         }
//     })
// })

httpServer.listen(3000, handleListen);
