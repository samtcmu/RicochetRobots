const path = require('path');
const express = require('express');
const socket_io = require('socket.io')

const app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/chat/index.html'));
});

app.use(express.static(path.join(__dirname, '../client/chat')));

const port = process.argv[2]
const server = app.listen(port, function () {
   const host = server.address().address
   const port = server.address().port
   
   console.log(`Example app listening at http://${host}:${port}`)
})

// Create the websocket server.
const io = socket_io(server);

io.on('connection', (socket) => {
    // When receiving a chat message broadcast to all other peers connect to
    // this websocket server.
    socket.on('chat message', (message) => {
        io.emit('chat message', message);
    });
});
