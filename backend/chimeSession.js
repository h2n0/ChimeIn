const AutoTrack = require("./autotrack.js");
const Session = require("./session.js");
const ChimeResponse = require("./response.js");


// First song to ever be played over the internet
// https://open.spotify.com/track/44AyOl4qVkzS48vBsbNXaC?si=NUFHmJvuTM6hEmKJKg9yDw

class ChimeSession{

  constructor(id){
    this.id = id;
    this.reccs = new AutoTrack();
    this.users = [];
    this.queue = [];
    this.currentId = null;
    this.currentData = null;
    this.currentHumanQueue = null;
    this.sessionHandler = new Session();
    this.isActive = false;
    this.songsPlayed = 0;
  }

  changeToThisSession(spotify){
    spotify.setAccessToken(this.sessionHandler.token);
    spotify.setRefreshToken(this.sessionHandler.refresh);
  }

  pushToQueue(data){
    this.queue.push(data);
    this.currentHumanQueue = null; // So we know we need to refresh it
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
    }

    // Current ID isn't set, normally because a song isn't playing
    if(!this.currentId){
      let d = {
        status : 404
      }
      callback(d);
    }else{ // Is set so we just need to find out the info we need
      let id = this.currentId.split(":");
      id = id[id.length-1];
      this.reccs.addElement(id);

      spotify.getTrack(id, (err,data) => {
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
      let recData = {
        min_energy: 0.4,
        seed_tracks: this.reccs.getQueue(),
        min_populatiry: 50
      };

      spotify.getRecommendations(recData, (err,data) => {
        if(err){
          console.error(err.statusCode);
          callback(null);
        }else{
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

  handleEvent(body){
    let user = body.guid;

    let event = body.data.event;

    if(event == "leaving"){ // User left session
      for(let i = 0; i < this.users.length; i++){
        if(this.users[i] == user){
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
      this.users.push(user);
    }
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

}


module.exports = ChimeSession;
