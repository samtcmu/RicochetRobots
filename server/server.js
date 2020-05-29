import * as path from "path";
import express from "express";
import socket_io from "socket.io";

import * as auction from "./auction.js";
import * as bid from "../client/bid.js";
import * as boardElements from "../client/boardElements.js";
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
const board = new ricochetGrid.RicochetGrid(16, 16);
board.setWalls(boardElements.walls);
board.setTargets(boardElements.targets);
board.initializedRobotPositions();
board.pickNextTarget();
board.selectedRobotColor = undefined;

let ricochetRobotsAuction = null;

io.on("connection", (socket) => {
    console.log(`player [${socket.id}] connected`);

    socket.on("set-player-name", (player) => {
        for (let socket_id in players) {
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

    socket.on("get-board", (unused) => {
        io.to(socket.id).emit("receive-board", board);
    });

    socket.on("bid", (bidToProcess) => {
        if (ricochetRobotsAuction === null) {
            ricochetRobotsAuction = new auction.RicochetRobotsAuction();
        }

        const now = Date.now();
        const ricochetRobotsBid = new bid.RicochetRobotsBid(
            players[socket.id].name, bidToProcess.steps, now);

        const succeeded = ricochetRobotsAuction.addBid(ricochetRobotsBid);
        io.emit("processed-bid", {
            bid: ricochetRobotsBid ,
            bidSucceeded: succeeded,
            auctionEndTimestamp: ricochetRobotsAuction.endTimestamp(),
        });
    });

    function sendAuctionResults(failedBids) {
        // Notify the sender whether they won the auction. Also give them the
        // winning bid.
        const winningBid = ricochetRobotsAuction.minBid(failedBids);
        if (winningBid === null) {
            // No bids remaining for this round; get confirmation from players
            // to start next round.
            return;
        }

        const showPathDeadlineTimestamp =
            ricochetRobotsAuction.minBidShowPathDeadlineTimestamp();
        if (winningBid.player() === players[socket.id].name) {
            io.to(socket.id).emit("auction-win", {
                winningBid: winningBid,
                failedBids: 0,
                showPathDeadlineTimestamp: showPathDeadlineTimestamp,
            });
        } else {
            io.to(socket.id).emit("auction-lose", {
                winningBid: winningBid,
                failedBids: 0,
                showPathDeadlineTimestamp: showPathDeadlineTimestamp,
            });
        }
    }

    socket.on("auction-over", (input) => {
        sendAuctionResults(0);
    });

    socket.on("show-path", (pathData) => {
        if (Date.now() <= ricochetRobotsAuction.endTimestamp()) {
            // Do nothing since the auction is still ongoing.
            return;
        }

        socket.broadcast.emit("display-path", pathData);

        if ((pathData.timestamp <=
             ricochetRobotsAuction.minBidShowPathDeadlineTimestamp()) &&
            (pathData.path.length <=
             ricochetRobotsAuction.minBid().steps()) &&
            board.checkPath(pathData.path)) {
            // The candidate path reaches the target within player's bid
            // amount for path produced within the show path deadline.
            io.emit("target-reached", pathData);
        }
    });

    socket.on("path-not-found", (input) => {
        sendAuctionResults(input.failedBids);
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
    io.to(socket.id).emit("board", board);
});
