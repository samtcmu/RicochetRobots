const AUCTION_DURATION_MS = 60 * 1000;

export class RicochetRobotsAuction {
  constructor() {
    this._bids = {}; 
    this._endTimestamp = null;
    this._minBid = null;
    this._failedBids = {};
  }

  // Returns true if the bid was successfully made.
  addBid(bid) {
    if (this._endTimestamp === null) {
      // This is the first bid in the auction.
      this._endTimestamp = bid.timestamp() + AUCTION_DURATION_MS;
      this._minBid = bid;
    } else if (bid.timestamp() < this._endTimestamp) {
      if ((bid.player() in this._bids) &&
          (this._bids[bid.player()].steps() <= bid.steps())) {
        // The player who made the current bid has already made a loweor bid.
        // So discard the current bid.
        return false;
      }
    } else {
      // This bid was made after the auction ended; so don't store it.
      return false;
    }

    // Store the bid for the player.
    this._bids[bid.player()] = bid;

    if (bid.steps() < this._minBid.steps()) {
      // Check if this bid is the minimum bid so far.
      this._minBid = bid;
    }

    return true;
  }

  // Returns the minimum bid.
  minBid() {
    return this._minBid;
  }

  minBidFailed() {
    // Store the failed bids just in case.
    this._failedBids[this._minBid.player()] = this._minBid;

    // Delete the minimum bid from the list of active bids.
    delete this._bids[this._minBid.player()];

    // Find the bid with the smallest number of steps. If multiple bids have
    // the same number of steps pick the one that was made first.
    this._minBid = null;
    for (player in this._bids) {
      if ((this._minBids == null) ||
          (this._bids[player].steps() < this._minBid.steps()) ||
          ((this._bids[player].steps() == this._minBid.steps()) &&
           (this._bids[player].timestamp() < this._minBid.timestamp()))) {
        this._minBid = this._bids[player];
      }
    }
  }

  endTimestamp() {
    return this._endTimestamp;
  }
}
