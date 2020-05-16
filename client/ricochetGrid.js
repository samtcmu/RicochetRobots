import * as gridCell from "./gridCell.js";
import * as utils from "./utils.js";

// import GridCell from './gridCell';
// Possible colors for robots.
export const GREEN_ROBOT = 0;
export const RED_ROBOT = 1;
export const BLUE_ROBOT = 2;
export const YELLOW_ROBOT = 3;

// Maps robot color to target color.
const targetRobotColorMap = {};
targetRobotColorMap[gridCell.GREEN_TARGET] = GREEN_ROBOT;
targetRobotColorMap[gridCell.RED_TARGET] = RED_ROBOT;
targetRobotColorMap[gridCell.BLUE_TARGET] = BLUE_ROBOT;
targetRobotColorMap[gridCell.YELLOW_TARGET] = YELLOW_ROBOT;
targetRobotColorMap[gridCell.WILD_TARGET] = undefined;

// Move Directions
export const MOVE_UP = 0;
export const MOVE_DOWN = 1;
export const MOVE_RIGHT = 2;
export const MOVE_LEFT = 3;

// The class will define the Ricochet Grid
export class RicochetGrid {
  constructor(rows, columns) {
    this.rows = rows;
    this.columns = columns;
    this.robots = {};
    this.robots[GREEN_ROBOT] = {
      color: GREEN_ROBOT,
      row: undefined,
      column: undefined,
    };
    this.robots[RED_ROBOT] = {
      color: RED_ROBOT,
      row: undefined,
      column: undefined,
    };
    this.robots[BLUE_ROBOT] = {
      color: BLUE_ROBOT,
      row: undefined,
      column: undefined,
    };
    this.robots[YELLOW_ROBOT] = {
      color: YELLOW_ROBOT,
      row: undefined,
      column: undefined,
    };

    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      let row = [];
      for (let c = 0; c < this.columns; ++c) {
        // push a new grid cell into each column
        row.push(new gridCell.GridCell());
      }
      this.grid.push(row);
    }

    // make center inaccessable cells
    // the inaccessableCells are the four cells in the center of the board.
    let centerPoint = Math.floor(this.rows / 2);

    this.setValue(centerPoint - 1, centerPoint - 1, gridCell.INACCESSABLE_CELL);
    this.setValue(centerPoint - 1, centerPoint, gridCell.INACCESSABLE_CELL);
    this.setValue(centerPoint, centerPoint - 1, gridCell.INACCESSABLE_CELL);
    this.setValue(centerPoint, centerPoint, gridCell.INACCESSABLE_CELL);

    // set up board walls
    // The top and bottom boarders
    for (let c = 0; c < this.columns; c++) {
      this.setWall(0, c, gridCell.UP);
      this.setWall(this.rows - 1, c, gridCell.DOWN);
    }

    // The left and right boarders
    for (let r = 0; r < this.rows; r++) {
      this.setWall(r, 0, gridCell.LEFT);
      this.setWall(r, this.columns - 1, gridCell.RIGHT);
    }

    // set up inaccessable walls
    this.setWall(centerPoint - 1, centerPoint - 1, gridCell.LEFT);
    this.setWall(centerPoint - 1, centerPoint - 1, gridCell.UP);

    this.setWall(centerPoint - 1, centerPoint, gridCell.UP);
    this.setWall(centerPoint - 1, centerPoint, gridCell.RIGHT);

    this.setWall(centerPoint, centerPoint - 1, gridCell.LEFT);
    this.setWall(centerPoint, centerPoint - 1, gridCell.DOWN);

    this.setWall(centerPoint, centerPoint, gridCell.RIGHT);
    this.setWall(centerPoint, centerPoint, gridCell.DOWN);

    // A list of targets.
    this.targets = [];

    // A list of perviousTargets
    this.previousTargets = [];

    // The current Target.
    this.currentTarget = undefined;

    // Initial robot positions for the current round.
    this.initialRobots = undefined;
  }

  getRows() {
    return this.rows;
  }

  getColumns() {
    return this.columns;
  }

  _getValue(grid, row, column) {
    return grid[row][column].getCellValue();
  }

  // getValue function will return the value in the cell at the input coordinate
  getValue(row, column) {
    return this._getValue(this.grid, row, column);
  }

  _setValue(grid, row, column, value) {
    grid[row][column].setCellValue(value);
  }

  // setValue function will set the property of the cell.
  setValue(row, column, value) {
    return this._setValue(grid, row, column, value);
  }

  // setTarget function will set the target in the cell.
  setTarget(row, column, color, shape) {
    this.grid[row][column].setTargetOnCell(color, shape);
    this.targets.push({ row: row, column: column, color: color, shape: shape });
  }

  // setWall function will set the wall(s) in the cell.
  setWall(row, column, side) {
    this.grid[row][column].setWallOnCell(side);
    if (side === gridCell.LEFT && column > 0) {
      this.grid[row][column - 1].setWallOnCell(gridCell.RIGHT);
    } else if (side === gridCell.RIGHT && column < this.columns - 1) {
      this.grid[row][column + 1].setWallOnCell(gridCell.LEFT);
    } else if (side === gridCell.UP && row > 0) {
      this.grid[row - 1][column].setWallOnCell(gridCell.DOWN);
    } else if (side === gridCell.DOWN && row < this.rows - 1) {
      this.grid[row + 1][column].setWallOnCell(gridCell.UP);
    }
  }

  // getRobotPosition function will generate a random number used for row and
  // column of robot.
  generateRandomNumber(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }

  // robotPosition function will set the row and column for the input color of
  // robot. While loop. Keep generating row and column number until you find an
  // empty cell.
  initializedRobotPositions() {
    for (let key in this.robots) {
      let row = this.generateRandomNumber(this.rows);
      let column = this.generateRandomNumber(this.columns);
      while (this.getValue(row, column) !== gridCell.EMPTY_CELL) {
        row = this.generateRandomNumber(this.rows);
        column = this.generateRandomNumber(this.columns);
      }
      this.robots[key].row = row;
      this.robots[key].column = column;
      this.setValue(row, column, gridCell.ROBOT_CELL);
    }

    this.initialRobots = utils.deepCopy(this.robots);
  }

  // setRobotPostion function takes a color, row, and column and places robot
  // in cell.
  _setRobotPostion(robotColor, row, column) {
    this.robots[robotColor].row = row;
    this.robots[robotColor].column = column;
    this.setValue(row, column, gridCell.ROBOT_CELL);
  }

  getRobots() {
    return this.robots;
  }

  getInitialRobots() {
    return this.initialRobots;
  }

  // setInteriorWalls function will set the walls on the grid. given an array
  // of all the walls
  setWalls(walls) {
    for (let i = 0; i < walls.length; i++) {
      this.setWall(walls[i].row, walls[i].column, walls[i].side);
    }
  }

  // getTargets function will return the targets on the grid.
  getTargets() {
    return this.targets;
  }

  // setTargets function will set the targets on the grid given an array of all
  // the targets.
  setTargets(targets) {
    for (let i = 0; i < targets.length; i++) {
      this.setTarget(
        targets[i].row,
        targets[i].column,
        targets[i].color,
        targets[i].shape
      );
    }
  }

  // pickNextTarget function will return the next target.
  pickNextTarget() {
    let randomTargetIdx = this.generateRandomNumber(this.targets.length - 1);
    let currentTarget = this.targets[randomTargetIdx];
    while (this.previousTargets.includes(currentTarget)) {
      randomTargetIdx = this.generateRandomNumber(this.targets.length - 1);
      currentTarget = this.targets[randomTargetIdx];
    }
    this.currentTarget = currentTarget;
    this.previousTargets.push(currentTarget);
    this.initialRobots = utils.deepCopy(this.robots);
  }

  // getCurrentTarget function returns the currentTarget.
  getCurrentTarget() {
    return this.currentTarget;
  }

  // getWalls function will return the walls in a given cell.
  getWalls(row, column) {
    return this.grid[row][column].walls;
  }

  _movesForRobot(grid, robots, robotColor) {
    let possibleMoves = [];
    let robot = robots[robotColor];
    let row = robot.row;
    let column = robot.column;
    let robotWalls = grid[robot.row][robot.column].getWalls();
    if (
      !robotWalls.includes(gridCell.UP) &&
      this._getValue(grid, row - 1, column) === gridCell.EMPTY_CELL
    ) {
      possibleMoves.push(MOVE_UP);
    }
    if (
      !robotWalls.includes(gridCell.DOWN) &&
      this._getValue(grid, row + 1, column) === gridCell.EMPTY_CELL
    ) {
      possibleMoves.push(MOVE_DOWN);
    }
    if (
      !robotWalls.includes(gridCell.LEFT) &&
      this._getValue(grid, row, column - 1) === gridCell.EMPTY_CELL
    ) {
      possibleMoves.push(MOVE_LEFT);
    }
    if (
      !robotWalls.includes(gridCell.RIGHT) &&
      this._getValue(grid, row, column + 1) === gridCell.EMPTY_CELL
    ) {
      possibleMoves.push(MOVE_RIGHT);
    }
    return possibleMoves;
  }

  // movesForRobot function will return the possible directions a given robot
  // can move.
  movesForRobot(robotColor) {
    return this._moveRobot(this.grid, this.robots, robotColor);
  }

  // Stateless implementation of moveRobot. Instead of modifying instance
  // variables on the RicochetGrid instance this function is called on it only
  // modifies its inputs.
  _moveRobot(grid, robots, robotColor, direction) {
    let initialRow = robots[robotColor].row;
    let initialColumn = robots[robotColor].column;
    this._setValue(grid, initialRow, initialColumn, gridCell.EMPTY_CELL);
    while (this._movesForRobot(grid, robots, robotColor).includes(direction)) {
      if (direction === MOVE_UP) {
        // update the row of the robot.
        robots[robotColor].row--;
      } else if (direction === MOVE_DOWN) {
        robots[robotColor].row++;
      } else if (direction === MOVE_LEFT) {
        robots[robotColor].column--;
      } else if (direction === MOVE_RIGHT) {
        robots[robotColor].column++;
      }
    }
    this._setValue(
      grid,
      robots[robotColor].row,
      robots[robotColor].column,
      gridCell.ROBOT_CELL
    );
  }

  // moveRobot function will set the given robot in the new cell base on the
  // given direction.
  moveRobot(robotColor, direction) {
    return this._moveRobot(this.grid, this.robots, robotColor, direction);
  }

  _moveAllRobots(grid, robots, newRobotsPostions) {
    for (let key in newRobotsPostions) {
      let initialRow = robots[key].row;
      let initialColumn = robots[key].column;
      this._setValue(grid, initialRow, initialColumn, gridCell.EMPTY_CELL);

      let newRow = newRobotsPostions[key].row;
      let newColumn = newRobotsPostions[key].column;
      robots[key].row = newRow;
      robots[key].column = newColumn;
      this._setValue(grid, newRow, newColumn, gridCell.ROBOT_CELL);
    }
  }

  moveAllRobots(newRobotsPostions) {
    return _moveAllRobots(this.grid, this.robots, newRobotsPostions);
  }

  _reachedTarget(grid, robots) {
    let targetColor = this.currentTarget.color;
    let targetRow = this.currentTarget.row;
    let targetColumn = this.currentTarget.column;
    // If there is not robot in the target cell, the target has not been
    // reached and function will return false.
    if (this._getValue(grid, targetRow, targetColumn) !== gridCell.ROBOT_CELL) {
      return false;
    }
    // We know that there is a robot in the target cell. Any robot can reach
    // the wild target.
    if (targetColor === gridCell.WILD_TARGET) {
      return true;
    }

    let robotColor = targetRobotColorMap[targetColor];
    return (
      robots[robotColor].row === targetRow &&
      robots[robotColor].column === targetColumn
    );
  }

  // reachedTarget function will return true if a robot with the same color of
  // the target reached the target.
  // get the location of the target. this.currentTarget
  reachedTarget() {
    return this._reachedTarget(this.grid, this.robots);
  }

  _resetRobots(grid, robots, initialRobots) {
    this._moveAllRobots(grid, robots, this.getInitialRobots());
  }

  resetRobots() {
    return this._resetRobots(this.grid, this.robots);
  }

  _cloneGrid() {
    const clone = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.columns; ++c) {
        const cell = new gridCell.GridCell();

        cell.setCellValue(this.grid[r][c].getCellValue());
        const target = this.grid[r][c].getTargetOnCell();
        if (target !== undefined) {
            cell.setTargetOnCell(target.color, target.shape);
        }
        const walls = this.grid[r][c].getWalls();
        for (let i = 0; i < walls.length; ++i) {
            cell.setWallOnCell(walls[i]);
        }

        row.push(cell);
      }
      clone.push(row);
    }

    return clone;
  }

  // Checks whether the input path reaches the target without modifying
  // instance variables on the current RicochetGrid instance; i.e. this
  // function is stateless.
  checkPath(path) {
    // To make this function stateless we need to set up our own version of
    // this.robots and this.grid that is local to this function. All operations
    // on these will be local to this function.
    const robots = utils.deepCopy(this.getRobots());
    const grid = this._cloneGrid();
    this._resetRobots(grid, robots);

    for (let i = 0; i < path.length; ++i) {
        this._moveRobot(grid, robots, path[i].robot, path[i].direction);
    }

    return this._reachedTarget(grid, robots);
  }
}
