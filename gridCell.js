// Possible values for a cell.
const EMPTY_CELL = 0;
const INACCESSABLE_CELL = 1;
const ROBOT_CELL = 2;

// The class will define the properties of a cell in the grid.
class GridCell {
  constructor() {
    this.value = EMPTY_CELL;
    // The target is unique. It has a color and a shape
    this.target = { color: 'color', shape: 'shape' };
    //
    this.walls = [];
  }

  // getCellValue function will return the value in cell.
  // returns an object
  getCellValue() {
    return this.value;
  }

  // setRobotOnCell function will set robot in the cell.
  setRobotOnCell() {
    if (this.value === EMPTY_CELL) {
      this.value = ROBOT_CELL;
    }
  }

  // setInaccessbleCell function will make a cell inaccesable.
  setInaccessableCell() {
    this.value = INACCESSABLE_CELL;
  }

  // setTargetOnCell function will set a target in the cell.
  setTargetOnCell(color, shape) {
    this.target.color = color;
    this.target.shape = shape;
  }

  // setWallonCell function will set walls on the cell given the side of the well .
  setWallonCell(side) {
    this.walls.push(side);
  }
}

export default GridCell;
