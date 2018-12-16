const AutoTrack = require("./autotrack.js");
const Session = require("./session.js");
const ChimeResponse = require("./backend/response.js");


class ChimeSession{
  constructor(id){
    this.id = id;
    this.recc = new AutoTrack();
    this.queue = [];
    this.currentId = null;
    this.currentData = null;
    this.currentHumanQueue = null;
    this.sessionHandler = new Session();
  }


  changeToThisSession(spotify){
    spotify.setAccessToken(this.sessionHandler.token);
    spotify.setRefreshToken(this.sessionHandler.refresh);
  }


  pushToQueue(id){
    this.queue.push(id);
    this.currentHumanQueue = null; // So we know we need to refresh it
  }
}


module.exports = ChimeSession;
