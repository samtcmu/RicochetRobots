import * as bid from "./bid.js";
import * as boardElements from "./boardElements.js";
import * as gridCell from "./gridCell.js";
import * as ricochetGrid from "./ricochetGrid.js";

const robotIdMap = {};
robotIdMap[ricochetGrid.GREEN_ROBOT] = 'green-robot';
robotIdMap[ricochetGrid.RED_ROBOT] = 'red-robot';
robotIdMap[ricochetGrid.BLUE_ROBOT] = 'blue-robot';
robotIdMap[ricochetGrid.YELLOW_ROBOT] = 'yellow-robot';

class RicochetRobots {
  constructor(board) {
    this.board = board;

    this.currentRobots = this.deepCopyRobots(this.board.getRobots());

    const pathDiv = document.getElementById("path");
    this.clearDiv(pathDiv);
    pathDiv.innerHTML = "Candidate path: <br />";

    this.countdownEnd = undefined;
    this.auctionStatusDiv = document.getElementById("auction-status");
    this.auctionStatusDiv.innerHTML = `Auction Timer: - s`;

    this.instructionsDiv = document.getElementById("instruction-panel");
    this.instructionsDiv.innerHTML =
        "Find a path that brings the target robot to the target cell.";

    this.disableMovingRobots = false;
  }

  selectNewTarget() {
    // Deselect
    this.toggleTargetHightlight();
    this.board.pickNextTarget();
    this.toggleTargetHightlight();
    const solutionDiv = document.getElementById("solution");
    this.clearDiv(solutionDiv);
    const pathDiv = document.getElementById("path");
    this.clearDiv(pathDiv);
    pathDiv.innerHTML = "Candidate path: <br />";

    // Save the current robots for the reset function.
    this.currentRobots = this.deepCopyRobots(this.board.getRobots());

    this.countdownEnd = undefined;

    this.instructionsDiv.innerHTLM =
        "Find a path that brings the target robot to the target cell.";
  }

  resetRobots() {
    const robotSpans = {}

    const robots = this.board.getRobots()
    for (let key in robots) {
      let robotRowPosition = robots[key].row;
      let robotColumnPosition = robots[key].column;
      let robotColor = robots[key].color;

      // Remove the robot span and move it to the new position.
      // get the cell the contains the robot removeChild.
      let robotSpan = document.getElementById(`${robotIdMap[key]}`);
      robotSpan.parentNode.removeChild(robotSpan);
      robotSpans[robotColor] = robotSpan;
    }

    this.board.moveAllRobots(this.currentRobots);

    for (let key in this.currentRobots) {
      let row = this.currentRobots[key].row;
      let column = this.currentRobots[key].column;
      let robotColor = this.currentRobots[key].color;
      let cellSpan = document.getElementById(`${row}, ${column}`);
      cellSpan.appendChild(robotSpans[robotColor]);
    }

    const pathDiv = document.getElementById("path");
    this.clearDiv(pathDiv);
    pathDiv.innerHTML = "Candidate path: <br />";
  }

  startCountdown(endTimestamp, timerEndCallback) {
    // Return early if there is already an ongoing countdownm.
    if (this.countdownEnd !== undefined) {
      return;
    }

    const updateCountdown = () => {
      if (this.countdownEnd === undefined) {
        timerEndCallback();
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const secondsRemaining = Math.max(this.countdownEnd - now, 0);
      this.auctionStatusDiv.innerHTML = `Auction Timer: ${secondsRemaining} s`;

      if (secondsRemaining == 0) {
        this.countdownEnd = undefined;
      }

      window.requestAnimationFrame(updateCountdown);
    }

    this.countdownEnd = endTimestamp;
    window.requestAnimationFrame(updateCountdown);
  }

  toggleTargetHightlight() {
    let target = this.board.getCurrentTarget();
    let targetRow = target.row;
    let targetColumn = target.column;
    let targetCell = document.getElementById(`${targetRow}, ${targetColumn}`);
    targetCell.classList.toggle('target-cell');
  }

  moveSelectedRobot(direction) {
    if (this.board.selectedRobotColor === undefined) {
      return;
    }

    // Remove the robot span and move it to the new position.
    // get the cell the contains the robot removeChild.
    let robotSpan = document.getElementById(
      `${robotIdMap[this.board.selectedRobotColor]}`
    );
    robotSpan.parentNode.removeChild(robotSpan);

    // when there is a selected robot.
    this.board.moveRobot(this.board.selectedRobotColor, direction);

    // move it to the span it belongs to.
    let robots = this.board.getRobots();
    let row = robots[this.board.selectedRobotColor].row;
    let column = robots[this.board.selectedRobotColor].column;
    let cellSpan = document.getElementById(`${row}, ${column}`);
    cellSpan.appendChild(robotSpan);

    let pathDiv = document.getElementById("path");
    pathDiv.appendChild(
        this.pathComponentSpan(this.board.selectedRobotColor, direction));
  }

  keyboardHandler(key) {
    let moveDirection = null;
    if (key === 'ArrowUp') {
      moveDirection = ricochetGrid.MOVE_UP;
    } else if (key === 'ArrowDown') {
      moveDirection = ricochetGrid.MOVE_DOWN;
    } else if (key === 'ArrowLeft') {
      moveDirection = ricochetGrid.MOVE_LEFT;
    } else if (key === 'ArrowRight') {
      moveDirection = ricochetGrid.MOVE_RIGHT;
    }

    if (moveDirection !== null) {
      if (!this.disableMovingRobots) {
        this.moveSelectedRobot(moveDirection);
      }
      return true;
    }

    return false;
  }

  getRobotsAsString() {
    return JSON.stringify(this.board.getRobots());
  }

  deepCopyRobots(object) {
    return JSON.parse(JSON.stringify(object));
  }

  robotToString(robotId) {
    let output = "";

    if (robotId == ricochetGrid.GREEN_ROBOT) {
      output = "green robot";
    } else if (robotId == ricochetGrid.RED_ROBOT) {
      output = "red robot";
    } else if (robotId == ricochetGrid.BLUE_ROBOT) {
      output = "blue robot";
    } else if (robotId == ricochetGrid.YELLOW_ROBOT) {
      output = "yellow robot";
    }

    return output;
  }

  moveToString(move) {
    let output = "";

    if (move == gridCell.UP) {
      output = "&uarr;";
    } else if (move == gridCell.DOWN) {
      output = "&darr;";
    } else if (move == gridCell.RIGHT) {
      output = "&rarr;";
    } else if (move == gridCell.LEFT) {
      output = "&larr;";
    }

    return output;
  }

  clearDiv(div) {
      while (div.firstChild) {
        div.removeChild(div.firstChild)
      }
  }

  solveWithBfs() {
    let solution = this.bfs();
    this.drawSolution(solution);
  }

  solveWithDfs() {
    const solutionDiv = document.getElementById("solution");

    let solution = []
    for (let maxDepth = 0; maxDepth < 10; ++maxDepth) {
      const start = performance.now();
      solution = this.dfs(maxDepth);
      const end = performance.now();
      console.log(`Finished depth ${maxDepth} (${end - start} ms)`);
      if (solution !== undefined) {
        break;
      }
    }

    this.drawSolution(solution);
  }

  pathComponentSpan(robotColor, direction) {
    const cellSpan = document.createElement('span');
    cellSpan.classList.toggle('grid-cell');
    cellSpan.classList.toggle('empty-grid-cell');

    const robotSpan = document.createElement('span');
    robotSpan.classList.toggle('robot');
    if (robotColor === ricochetGrid.GREEN_ROBOT) {
      robotSpan.classList.toggle('green-robot');
    } else if (robotColor === ricochetGrid.RED_ROBOT) {
      robotSpan.classList.toggle('red-robot');
    } else if (robotColor === ricochetGrid.BLUE_ROBOT) {
      robotSpan.classList.toggle('blue-robot');
    } else if (robotColor === ricochetGrid.YELLOW_ROBOT) {
      robotSpan.classList.toggle('yellow-robot');
    }

    robotSpan.innerHTML = this.moveToString(direction);

    cellSpan.appendChild(robotSpan);

    return cellSpan;
  }

  drawSolution(solution) {
    // Draw the path.
    if (solution !== undefined) {
      // Clear the contnts of the solution div.
      const solutionDiv = document.getElementById("solution");
      this.clearDiv(solutionDiv);
      solutionDiv.innerHTML = "Found solution: <br />";

      for (let i = 0; i < solution.length; ++i) {
        const robotColor = solution[i][0];
        const direction = solution[i][1];
        const cellSpan = this.pathComponentSpan(robotColor, direction);
        solutionDiv.appendChild(cellSpan);
      }
    }
  }

  bfs() {
    let start = performance.now();
    let end = null;
    let maxDepthSoFar = 0;
    let initalRobots = this.deepCopyRobots(this.board.getRobots());
    let visited = new Set();
    let queue = [{ robots: initalRobots, depth: 0 , path: []}];
    while (queue.length > 0) {
      let currentState = queue.shift();
      let currentRobots = currentState.robots;
      let currentDepth = currentState.depth;
      visited.add(currentRobots);

      if (currentDepth > maxDepthSoFar) {
        end = performance.now();
        console.log(`Finished Depth: ${maxDepthSoFar} (${end - start} ms)`);
        maxDepthSoFar = currentDepth;
        start = end;
      }

      // This reset the robots position
      this.board.moveAllRobots(currentRobots);

      // Check if final target has been reached.
      if (this.board.reachedTarget()) {
        this.board.moveAllRobots(initalRobots);
        return currentState.path;
      }

      for (let key in currentRobots) {
        let movesForRobot = this.board.movesForRobot(currentRobots[key].color);
        for (let i = 0; i < movesForRobot.length; i++) {
          this.board.moveRobot(currentRobots[key].color, movesForRobot[i]);
          let newRobotPostions = this.deepCopyRobots(this.board.getRobots());
          this.board.moveAllRobots(currentRobots);

          if (!visited.has(newRobotPostions)) {
            let path = [...currentState.path];
            path.push([currentRobots[key].color, movesForRobot[i]]);

            queue.push({
                robots: newRobotPostions,
                depth: currentDepth + 1,
                path: path
            });
          }
        }
      }
    }

    this.board.moveAllRobots(initalRobots);
    return undefined;
  }

  dfs(maxDepth) {
    let initalRobots = this.deepCopyRobots(this.board.getRobots());
    let visited = new Set();
    let stack = [{ robots: initalRobots, depth: 0 , path: []}];
    while (stack.length > 0) {
      let currentState = stack.pop();
      let currentRobots = currentState.robots;
      let currentDepth = currentState.depth;
      visited.add(currentRobots);

      // This reset the robots position
      this.board.moveAllRobots(currentRobots);

      // If we've reached the maximum depth from the start state don't visit
      // any neighbors.
      if (currentDepth >= maxDepth) {
        // Check if final target has been reached.
        if (this.board.reachedTarget()) {
          this.board.moveAllRobots(initalRobots);
          return currentState.path;
        }
        continue;
      }

      for (let key in currentRobots) {
        let movesForRobot = this.board.movesForRobot(currentRobots[key].color);
        for (let i = 0; i < movesForRobot.length; i++) {
          this.board.moveRobot(currentRobots[key].color, movesForRobot[i]);
          let newRobotPostions = this.deepCopyRobots(this.board.getRobots());
          this.board.moveAllRobots(currentRobots);

          if (!visited.has(newRobotPostions)) {
            let path = [...currentState.path];
            path.push([currentRobots[key].color, movesForRobot[i]]);

            stack.push({
                robots: newRobotPostions,
                depth: currentDepth + 1,
                path: path
            });
          }
        }
      }
    }

    this.board.moveAllRobots(initalRobots);
    return undefined;
  }

  draw(parentNode) {
    // Draw empty cells for the board.
    for (let r = 0; r < this.board.getRows(); r++) {
      let newDiv = document.createElement('div');
      newDiv.classList.toggle('grid-row');
      for (let c = 0; c < this.board.getColumns(); c++) {
        let newSpan = document.createElement('span');
        newSpan.id = `${r}, ${c}`;

        // Draw cell.
        newSpan.classList.toggle('grid-cell');
        if (this.board.getValue(r, c) === gridCell.INACCESSABLE_CELL) {
          newSpan.classList.toggle('inaccessable-grid-cell');
        } else {
          newSpan.classList.toggle('empty-grid-cell');
        }

        // Draw walls.
        let cellWalls = this.board.getWalls(r, c);
        if (cellWalls.includes(gridCell.UP)) {
          newSpan.classList.toggle('top-wall');
        }
        if (cellWalls.includes(gridCell.DOWN)) {
          newSpan.classList.toggle('bottom-wall');
        }
        if (cellWalls.includes(gridCell.LEFT)) {
          newSpan.classList.toggle('left-wall');
        }
        if (cellWalls.includes(gridCell.RIGHT)) {
          newSpan.classList.toggle('right-wall');
        }

        newDiv.appendChild(newSpan);
      }
      parentNode.appendChild(newDiv);
    }

    // Draw targets.
    let targets = this.board.getTargets();
    for (let i = 0; i < targets.length; i++) {
      let targetRow = targets[i].row;
      let targetColumn = targets[i].column;
      let targetColor = targets[i].color;
      let targetShape = targets[i].shape;

      let targetSpan = document.createElement('span');

      if (targetColor === gridCell.RED_TARGET) {
        targetSpan.classList.toggle('red-target');
      } else if (targetColor === gridCell.GREEN_TARGET) {
        targetSpan.classList.toggle('green-target');
      } else if (targetColor === gridCell.BLUE_TARGET) {
        targetSpan.classList.toggle('blue-target');
      } else if (targetColor === gridCell.YELLOW_TARGET) {
        targetSpan.classList.toggle('yellow-target');
      } else if (targetColor === gridCell.WILD_TARGET) {
        targetSpan.classList.toggle('wild-target');
      }

      if (targetShape === gridCell.SQUARE_TARGET) {
        targetSpan.classList.toggle('square-target');
      } else if (targetShape === gridCell.CRICLE_TARGET) {
        targetSpan.classList.toggle('circle-target');
      } else if (targetShape === gridCell.TRIANGLE_TARGET) {
        targetSpan.classList.toggle('triangle-target');
      } else if (targetShape === gridCell.HEXAGON_TARGET) {
        targetSpan.classList.toggle('hexagon-target');
      } else if (targetShape === gridCell.VORTEX_TARGET) {
        targetSpan.classList.toggle('vortex-target');
      }

      let cellSpan = document.getElementById(`${targetRow}, ${targetColumn}`);
      cellSpan.appendChild(targetSpan);
    }

    // Draw Robots
    let robots = this.board.getRobots();
    for (let key in robots) {
      let robotRowPosition = robots[key].row;
      let robotColumnPosition = robots[key].column;
      let robotColor = robots[key].color;

      let robotSpan = document.createElement('span');
      robotSpan.classList.toggle('robot');

      robotSpan.addEventListener('mouseup', event => {
        if (this.disableMovingRobots) {
          return;
        }

        // Deselect the previously selected robot.
        if (this.board.selectedRobotColor !== undefined) {
          let robotId = robotIdMap[this.board.selectedRobotColor];
          let selectedRobotSpan = document.getElementById(robotId);
          selectedRobotSpan.classList.toggle('selected-robot');
        }

        // Select a the clicked robot.
        event.target.classList.toggle('selected-robot');
        if (event.target.id === 'green-robot') {
          this.board.selectedRobotColor = ricochetGrid.GREEN_ROBOT;
        } else if (event.target.id === 'red-robot') {
          this.board.selectedRobotColor = ricochetGrid.RED_ROBOT;
        } else if (event.target.id === 'blue-robot') {
          this.board.selectedRobotColor = ricochetGrid.BLUE_ROBOT;
        } else if (event.target.id === 'yellow-robot') {
          this.board.selectedRobotColor = ricochetGrid.YELLOW_ROBOT;
        }
      });

      if (robotColor === ricochetGrid.GREEN_ROBOT) {
        robotSpan.id = 'green-robot';
        robotSpan.classList.toggle('green-robot');
      } else if (robotColor === ricochetGrid.RED_ROBOT) {
        robotSpan.id = 'red-robot';
        robotSpan.classList.toggle('red-robot');
      } else if (robotColor === ricochetGrid.BLUE_ROBOT) {
        robotSpan.id = 'blue-robot';
        robotSpan.classList.toggle('blue-robot');
      } else if (robotColor === ricochetGrid.YELLOW_ROBOT) {
        robotSpan.id = 'yellow-robot';
        robotSpan.classList.toggle('yellow-robot');
      }

      let cellSpan = document.getElementById(
        `${robotRowPosition}, ${robotColumnPosition}`
      );
      cellSpan.appendChild(robotSpan);
    }

    // Hightlight current target cell.
    this.toggleTargetHightlight();
  }
}

window.ricochetRobots = undefined;
const socket = io();

window.loadApp = function loadApp() {
  const playersList = document.getElementById("players-list");
  const playerNode = document.createElement("li");
  playerNode.classList.toggle("player");
  playerNode.textContent = "player name (click to edit)";
  playerNode.contentEditable = true;
  playerNode.spellcheck = false;
  playerNode.id = socket.id;
  playerNode.addEventListener('keydown', event => {
    if (event.key === "Enter") {
      socket.emit("set-player-name", {
        name: event.target.textContent
      });
      event.preventDefault();
    }
  });
  playersList.appendChild(playerNode);

  socket.on("players", (players) => {
    playerNode.id = socket.id;
    for (let socketId in players) {
      let playerNodeToUpdate = document.getElementById(socketId);
      if (playerNodeToUpdate === null) {
        playerNodeToUpdate = document.createElement("li");
        playerNodeToUpdate.classList.toggle("player");
        playerNodeToUpdate.id = socketId;
        playersList.appendChild(playerNodeToUpdate);
      }

      playerNodeToUpdate.textContent = players[socketId].name;
    }
  });

  socket.on("player-disconnected", (playerSocketId) => {
    let playerNodeToDelete = document.getElementById(playerSocketId);
    playersList.removeChild(playerNodeToDelete);
  });

  const sendMessageForm = document.getElementById("send-message-form");
  sendMessageForm.addEventListener('submit', event => {
    event.preventDefault();

    let messageFieldNode = event.target.querySelector("input#message-field");
    socket.emit("send-message", {
       content: messageFieldNode.value,
    });
    messageFieldNode.value = "";
  })

  const messageList = document.getElementById("message-list");
  socket.on("receive-message", (message) => {
    let messageNode = document.createElement("li");
    messageNode.classList.toggle("message");
    messageNode.textContent = `${message.sender}: ${message.content}`;
    messageList.appendChild(messageNode);
    messageList.scrollTop = messageList.scrollHeight;
  });

  socket.on("board", (board) => {
    // TODO(samt): Find another way to do this since use of
    // Object.setPrototypeOf is discouraged due to its poor performance.
    Object.setPrototypeOf(board, ricochetGrid.RicochetGrid.prototype);
    for (let r = 0; r < board.getRows(); ++r) {
      for (let c = 0; c < board.getColumns(); ++c) {
        Object.setPrototypeOf(board.grid[r][c], gridCell.GridCell.prototype);
      }
    }
    window.ricochetRobots = new RicochetRobots(board);
    window.ricochetRobots.draw(document.getElementById('grid-canvas'));
    document.addEventListener('keydown', event => {
      if (event.target.nodeName == "BODY") {
        if (window.ricochetRobots.keyboardHandler(event.key)) {
          event.preventDefault();
        }
      }
    });
  })

  const sendBidForm = document.getElementById("send-bid-form");
  sendBidForm.addEventListener('submit', event => {
    event.preventDefault();

    let bidFieldNode = event.target.querySelector("input#bid-field");
    socket.emit("bid", {
       steps: Number(bidFieldNode.value),
    });
  })

  const bidList = document.getElementById("bid-list");
  socket.on("processed-bid", (processedBid) => {
    Object.setPrototypeOf(processedBid.bid, bid.RicochetRobotsBid.prototype);

    window.ricochetRobots.startCountdown(
        Math.floor(processedBid.auctionEndTimestamp / 1000),
        () => socket.emit("auction-over", {}));

    let bidNode = document.createElement("li");
    bidNode.classList.toggle("bid");
    if (!processedBid.bidSucceeded) {
      bidNode.classList.toggle("failed-bid");
    }
    bidNode.id = `${processedBid.bid.player()}:${processedBid.bid.steps()}`;
    bidNode.textContent =
        `${processedBid.bid.player()}: ${processedBid.bid.steps()}`;
    bidList.appendChild(bidNode);
    bidList.scrollTop = bidList.scrollHeight;
  });

  const instructionsDiv = document.getElementById("instruction-panel");
  socket.on("auction-win", (auctionData) => {
    Object.setPrototypeOf(auctionData.winningBid, bid.RicochetRobotsBid.prototype);

    let instructions = 
        `Winner: ${auctionData.winningBid.player()} (${auctionData.winningBid.steps()} steps)`;
    instructions += "<br />Present your proposed path.";
    instructionsDiv.innerHTML = instructions;
  });
  socket.on("auction-lose", (auctionData) => {
    Object.setPrototypeOf(auctionData.winningBid, bid.RicochetRobotsBid.prototype);

    let instructions = 
        `Winner: ${auctionData.winningBid.player()} (${auctionData.winningBid.steps()} steps)`;
    instructions += `<br />Wait for ${auctionData.winningBid.player()} to present their path.`;
    instructionsDiv.innerHTML = instructions;
    window.ricochetRobots.disableMovingRobots = true;
  });
}
