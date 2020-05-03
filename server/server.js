import * as path from "path";
import express from "express";
import socket_io from "socket.io";

import * as ricochetGrid from "../client/ricochetGrid.js";

const app = express();

const dirname = path.resolve();
app.get("/", (req, res) => {
    // This paths is relative to the directory where `npm start` is run.
    res.sendFile(path.join(dirname, "client/index.html"));
});

// This paths is relative to the directory where `npm start` is run.
app.use(express.static(path.join(dirname, "client")));

const port = process.argv[2]
const server = app.listen(port, function () {
   const host = server.address().address
   const port = server.address().port
   
   console.log(`Example app listening at http://${host}:${port}`)
})

// Create the websocket server.
const io = socket_io(server);

const players = {};

io.on("connection", (socket) => {
    console.log(`player [${socket.id}] connected`);

    socket.on("set-player-name", (player) => {
        for (socket_id in players) {
            if (players[socket_id] === player.name) {
                io.to(socket.id).emit(
                    "unable-to-set-playername", `username "${player.name}" is taken.`);
                return;
            }
        }
        players[socket.id] = {
            name: player.name,
        }
        io.emit("players", players);
    })

    socket.on("send-message", (message) => {
        message.sender = players[socket.id].name;
        io.emit("receive-message", message);
    });

    socket.on("disconnect", () => {
        // Remove the disconnecting socket's username mapping.
        io.emit("player-disconnected", socket.id);
        delete players[socket.id];

        console.log("user disconnected");
    });

    players[socket.id] = {
        name: "player name (click to edit)",
    }
    io.emit("players", players);
});
