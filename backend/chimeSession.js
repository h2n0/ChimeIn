const AutoTrack = require("./autotrack.js");
const Session = require("./session.js");
const ChimeResponse = require("./response.js");
const User = require("./user.js");


// First song to ever be played over the internet
// https://open.spotify.com/track/44AyOl4qVkzS48vBsbNXaC?si=NUFHmJvuTM6hEmKJKg9yDw

class ChimeSession{

  constructor(spotify, id, country){
    this.id = id;
    this.users = [];
    this.queue = [];
    this.currentId = null;
    this.currentData = null;
    this.currentHumanQueue = null;
    this.sessionHandler = new Session();
    this.isActive = false;
    this.songsPlayed = 0;
    this.country = country || "US";
    this.canJoin = false;
    this.canDeleteSession = false;
    console.log("New session #" + id + " from " + country);
  }

  init(spotify){
    this.reccs = new AutoTrack(spotify, this.country);
  }

  changeToThisSession(spotify){
    spotify.setAccessToken(this.sessionHandler.token);
    spotify.setRefreshToken(this.sessionHandler.refresh);
  }

  pushToQueue(spotify, data){
    this.queue.push(data);
    this.currentHumanQueue = null; // So we know we need to refresh it
    this.reccs.add(spotify, data);
  }

  popFromQueue(){
    this.songsPlayed++;
    this.queue.shift();
    this.currentHumanQueue = null;
    this.currentData = null;
  }

  removeFromQueue(id){
    if(id.indexOf(":") == -1){
      id = "spotify:track:" + id;
    }
    for(let i = 0; i < this.queue.length; i++){
      if(this.queue[i].id == id){
        this.queue.splice(i,1);
        this.currentHumanQueue = null;
        break;
      }
    }
  }

  setCurrentSong(id){
    this.currentId = id;
  }

  getCurrentSong(spotify, callback){
    // Check if we have the data set already, no need to recompute values
    if(this.currentData){
      callback(this.currentData);
      return;
    }

    console.log("Getting new data!");

    // Current ID isn't set, normally because a song isn't playing
    if(!this.currentId){
      let d = {
        status : 404
      }
      callback(d);
    }else{ // Is set so we just need to find out the info we need
      let id = this.currentId.split(":");
      id = id[id.length-1];

      spotify.getTrack(id, {market: this.country}, (err,data) => {
        //console.log("Track data ", data);

        if(err){
          callback(null);
        }else{
          let body = data.body;
          let name = body.name;
          let uri = body.uri;

          let d = {
            id: body.id,
            name: name,
            uri: uri,
            artist: { name:body.artists[0].name, id: body.artists[0].id},
            images: [
              body.album.images[0].url,
              body.album.images[1].url,
              body.album.images[2].url
            ],
            next: body.duration_ms,
            started: Date.now(),
            link: body["external_urls"]["spotify"],
            status: 200
          }

          this.currentData = d;
          callback(d);
        }
      });
    }
  }

  getReccSong(spotify, cb){
    spotify.getRecommendations(this.reccs.getRecommendations(spotify), (err,data) => {
      if(err){
        console.error("Error getting recomended songs", err);
        if(cb){
          cb(null);
        }
      }else{
        cb(data);
      }
    });
  }

  getNextSong(spotify, callback){
    let nextInQueue = this.queue[0] || null;
    this.currentId = null;
    this.currentData = null;
    this.currentHumanQueue = null;

    let resp = {
      id: null,
      status: 404,
      pushedBy: null
    }

    if(nextInQueue){
      this.currentId = nextInQueue.id;
      resp.id = this.currentId;
      resp.status = 200;
      resp.pushedBy = nextInQueue.pusher;
      callback(resp);
    }else{ // Isn't a song next in the queue so get a reccomendation
      this.getReccSong(spotify, (err, data) => {
        if(err){
          console.error("Error with reccomendations", err);
          callback(null);
        }else{
          if(data == null){
            console.error("No suggested song", err);
            callback(null);
            return;
          }
          let tracks = data.body.tracks;
          let index = Math.floor(Math.random() * tracks.length);
          let t = tracks[index];
          this.currentId = t.id;
          resp.id = t.id;
          resp.status = 201;
          resp.pushedBy = -1;
          callback(resp);
        }
      });
    }
  }

  getHumanQueue(spotify, callback){
    if(this.currentHumanQueue){
      callback(this.currentHumanQueue);
    }else{
      let nq = [];
      let pushers = [];
      for(let i = 0; i < this.queue.length; i++){
        let current = this.queue[i];
        let uri = current.id.split(":");
        let id = uri[uri.length-1];
        nq.push(id);
        pushers.push([id, current.pusher || null]);
      }

      if(nq.length == 0){
        callback(null);
      }else{
        spotify.getTracks(nq, (err,data) => {
          if(err){
            callback(null);
          }else{
            let j = data.body;
            let out = [];
            for(let l = 0; l < j.tracks.length; l++){
              let current = j.tracks[l];
              out.push({
                id: current.id,
                name: current.name,
                artist: current.artists[0].name,
                img: current.album.images[2].url
              })
            }

            // Queue needs to know who pushed them
            for(let l = 0; l < out.length; l++){
              for(let m = 0; m < pushers.length; m++){
                if(out[l].id == pushers[m][0]){
                  out[l].pusher = pushers[m][1];
                  pushers.splice(m,1);
                  break;
                }
              }
            }
            this.currentHumanQueue = out;
            callback(out);
          }
        });
      }
    }
  }


  setActive(){
    this.active = true;
  }

  isActive(){
    return this.active;
  }

  canJoinNow(){
    return this.canJoin;
  }

  handleEvent(body){
    let user = body.guid;
    let event = body.data.event;
    if(event == "leaving"){ // User left session
      for(let i = 0; i < this.users.length; i++){
        if(this.users[i].id == user){
          this.users.splice(i,1);
        }

        for(let j = 0; j < this.queue.length;){
          let c = this.queue[j];
          if(c.pusher == user){
            this.queue.splice(j, 1);
          }else{
            j++;
          }
        }
      }
    }else if(event == "joining"){ // User joined session
      for(let i = 0; i < this.users.length; i++){
        if(this.users[i].id == user)return;
      }
      this.users.push(new User(user));
    }else if(event == "endTut"){ // Host has completed the tutorial
      this.canJoin = true;
    }else if(event == "ping"){
      for(let i = 0; i < this.users.length; i++){
        if(this.users[i].id == user){
          this.users[i].ping();
          break;
        }
      }
    }else if(event == "closing"){ // Session closed before it could start
      this.canDeleteSession = true;
      this.canJoin = false;
    }
  }

  getInfo(info){
    let out = null;

    if(info == "members"){
      out = {"members": this.users.length, "active": this.getNumberOfActiveUsers() }
    }

    return JSON.stringify(out);
  }

  getSongsBy(guid){
    let amt = 0;
    for(let i = this.queue.length-1; i >= 0; i--){
      let c = this.queue[i];
      if(c.pusher == guid){
        amt = amt + 1;
      }else{
        break;
      }
    }
    return amt;
  }


  moreThanAnHour(d1, d2){
    let diff = d1 - d2;
    let dDay = new Date(diff);
    return dDay.getHours() >= 1 || (dDay.getDate() - 1) > 0;
  }


  getNumberOfActiveUsers(){
    let d = new Date();
    let out = 0;
    for(let i = 0; i < this.users.length; i++){
      let d2 = this.users[i].getLastActive();
      if(!this.moreThanAnHour(d, d2)){
        out++;
      }
    }
    return out;
  }


  // Shall be called every hour that the sesison is active
  hourCheck(){

    let now = new Date();

    // No users so just remove it
    if(this.users.length == 0){
      this.canDeleteSession = true;
      return;
    }

    let anyoneActive = false;

    for(let i = 0; i < this.users.length; i++){
      if(!moreThanAnHour(now, this.users[i].getLastActive())){
        anyoneActive = true;
        break;
      }
    }

    if(!anyoneActive){
      this.canDeleteSession = true;
    }
  }

}


module.exports = ChimeSession;
