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
let users_online = new Map();
let users_not_available = [];
let couple_users = [];
io.on('connection', (socket) => {
    console.log('a user connected');
    users_online.set(socket.id, "");
    socket.on('disconnect', () => {
        users_online.delete(socket.id);
        users_not_available = users_not_available.filter(id => id !== socket.id);
        console.log('user disconnected');
    });
    socket.on('start_game', (data) => {
        users_online.set(socket.id, data.player);
        const available_users = Array.from(users_online.keys()).filter(id => !users_not_available.includes(id));
        if (available_users.length > 0) {
            let randomIndex = Math.floor(Math.random() * available_users.length);
            let randomSocketId = available_users[randomIndex];
            while (randomSocketId === socket.id) {
                randomIndex = Math.floor(Math.random() * available_users.length);
                randomSocketId = available_users[randomIndex];
            }
            //const randomUser_name = users_online.get(randomSocketId);
            const shared_session_id = Math.random().toString(36).substring(7);
            io.sockets.sockets.get(randomSocketId).join(shared_session_id);
            socket.join(shared_session_id);
            couple_users.push({
                session_1: socket.id,
                session_2: randomSocketId,
                shared_session_id: shared_session_id
            });
            io.to(shared_session_id).emit('start_game', {
                message: `you are playing now !!`,
                players: [
                    {
                        session_id: randomSocketId,
                        name: "aziz"
                    },
                    {
                        session_id: socket.id,
                        name: "ahmed"
                    }
                ],
                shared_session_id: shared_session_id,
            });

            users_not_available.push(randomSocketId);
            users_not_available.push(socket.id);
        } else {
            socket.emit('waiting_for_player', "you are waiting for another player");
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