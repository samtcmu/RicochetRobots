const path = require("path");
const express = require("express");
const socket_io = require("socket.io")

const app = express();

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/chat/index.html"));
});

app.use(express.static(path.join(__dirname, "../client/chat")));

const port = process.argv[2]
const server = app.listen(port, function () {
   const host = server.address().address
   const port = server.address().port
   
   console.log(`Example app listening at http://${host}:${port}`)
})

// Create the websocket server.
const io = socket_io(server);

const users = {}
const chats = []

io.on("connection", (socket) => {
    console.log('user connected');

    socket.on("set-username", (username) => {
        for (socket_id in users) {
            if ((socket.id === socket_id) || (users[socket_id] === username)) {
                io.to(socket.id).emit(
                    "unable-to-set-username", `username "${username}" is taken.`);
                return;
            }
        }
        users[socket.id] = username;
    })

    // When receiving a chat message broadcast to all other peers connect to
    // this websocket server.
    socket.on("chat message", (message) => {
        const chatEntry = {
            user: users[socket.id],
            message: message,
        }
        chats.push(chatEntry);
        io.emit("chat message", chatEntry);
    });

    io.to(socket.id).emit("chat history", JSON.stringify(chats));

    socket.on('disconnect', () => {
        // Remove the disconnecting socket's username mapping.
        delete users[socket.id];

        console.log('user disconnected');
    });
});
