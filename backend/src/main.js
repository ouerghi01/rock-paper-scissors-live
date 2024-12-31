import express from 'express';
import http  from "http";
import {Server,Socket} from "socket.io";
import path from "path";
import { fileURLToPath } from 'url';
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
app.use(express.static(path.join(__dirname, 'public')));
let users_online = [];
let users_not_available = [];
io.on('connection', (socket) => {
    console.log('a user connected');
    users_online.push(socket.id);
    socket.on('disconnect', () => {
        users_online = users_online.filter((id) => id!== socket.id);  // remove the disconnected user from the list of users_online
        console.log('user disconnected');
    });
    socket.on('start_game', () => {
        console.log("start game");
        if(users_online.length >1) {
          const randomIndex = Math.floor(Math.random() * users_online.length);
          while(users_not_available.includes(randomIndex)){
            console.log("randomIndex is not available");
            randomIndex = Math.floor(Math.random() * users_online.length);
          }
          const randomUser = users_online[randomIndex];
          
        
          io.to(randomUser).emit('start_game', {
            message: `you are playing now with ${socket.id} player`,
            player: socket.id
          });
          io.to(socket.id).emit('start_game', {
            message: `you are playing now with ${randomUser} player`,
            player: randomUser
          });
          users_not_available.push(randomUser);
          users_not_available.push(socket.id);
          
        }
        else {
         
          
          socket.emit('waiting_for_player', "you are waiting for another player")
        }
    });
    socket.on('waiting_for_player', (msg) => {
      console.log("waiting for another player");
      socket.emit('waiting_for_player', msg);
    })
    
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});