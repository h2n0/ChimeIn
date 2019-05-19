let player = null;
let defVol = 0.25;
let connected = false;
let lconnected = false;
let lastID = null;
var guests = false;
let flag1 = false;
let globalToken = null;


function getNextAndPlay(callback){
  post("/queue/next", makePostObject(), (err, data) => {
    if(err){// Nothing next in the queue so lets try again soon
      setTimeout( () => {
        console.log("Nothing in q")
        getNextAndPlay(globalToken, callback);
      }, 1000 * 2);
    }else{// Something was in the queue so we are going to try and play it
      let j = JSON.parse(data);
      console.log(j);
      let status = j.status
      let uri = j.id;
      if(status == 201){ // Song was recommended
        uri = "spotify:track:" + j.id;
      }
      playSong(globalToken, uri);
      if(callback){
        callback();
      }
    }
  });
}


function createPlayer(autoConnect){
  let token = null;
  player = new Spotify.Player({
    name: 'Chime In',
    getOAuthToken: (cb) => {
      console.log("Getting tokens");
      post("/session/auth", makePostObject(), (err,data) => {
        if(err){
          console.error("unable to get auth tokens");
          cb(-1);
        }else{
          let code = data.substring(1, data.length-1);
          globalToken = code;
          cb(code);
        }
      });
    }
  });

  let lpos = 0;
  let lId = -1;
  let lState = null;

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', (e) => {
    console.log(e);
  });

  player.addListener('authentication_error', ({ message }) => {
    createPlayer(true);
  });

  // Playback status updates
  player.addListener('player_state_changed', state => {

    let connected = true;

    if(!state){
      connected = false;
    }

    if((connected && !lconnected) && lId == -1){ // User has connected
      let uri = state.track_window.current_track.id;
      let p = uri.split(":");
      lId = p[p.length-1];
      let setObj = {
        "room": getRoomCode(),
        "id": uri
      }
      post("/queue/set", setObj, (err, data) => {
        if(err)return;
      });

      console.log("Setting sesison to be active!");
      console.log("Set current: " + uri);
    }

    lconnected = connected;
    if(!state)return;
    let pos = state.position;
    let current = state.track_window.current_track;
    let duration = state.duration;
    lId = current.id;

    if(pos > 0 && duration > 0 && !state.paused && !flag1){
      flag1 = true;
    }

    // Next song check
    if(pos == 0 && (state.paused || !state.paused) && flag1){
      flag1 = false;
      getNextAndPlay(() => {
        post("/queue/pop", makePostObject());
        console.log("New song is playing!");
      });
    }

    lpos = pos;
  });


  getCurrentDevices()

  // Ready
  player.addListener('ready', ({ device_id }) => {

    console.log('Ready with Device ID', device_id);
    player.setName("Chime In: " + getHumanRoomCode());

    if(autoConnect){
      swapFromSpotToChime(globalToken, device_id, (a)=>{
        console.log("Should have swapped");
      });
    }

    console.log(token);
    getCurrentDevices(globalToken, (err, data) => {
      console.log(data);
    });

    autoCheck(genID());
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
}

window.onSpotifyWebPlaybackSDKReady = () => {
  createPlayer(false);
};
