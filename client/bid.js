export class RicochetRobotsBid {
  constructor(player, steps, timestamp) {
    this._player = player;
    this._steps = steps;
    this._timestamp = timestamp;
  }

  player() {
    return this._player;
  }

  steps() {
    return this._steps;
  }

  timestamp() {
    return this._timestamp;
  }
}

