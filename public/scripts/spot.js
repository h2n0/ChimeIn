let player = null;
let defVol = 0.25;
let connected = false;
let lconnected = false;
let lastID = null;
var guests = false;

let flag1 = false;


function getNextAndPlay(token, callback){
  get("/queue/next", (data) => {
    let j = JSON.parse(data);
    let status = j.status
    if(status == 404){// Nothing next in the queue so lets try again soon
      setTimeout( () => {
        console.log("Nothing in q")
        getNextAndPlay(token, callback);
      }, 1000 * 2);
    }else{// Something was in the queue so we are going to try and play it
      let uri = j.id;
      if(status == 201){ // Song was recommended
        uri = "spotify:track:" + j.id;
      }
      playSong(token, uri);
      if(callback){
        callback();
      }
    }
  });
}

window.onSpotifyWebPlaybackSDKReady = () => {
  const token = getCookie("spotID");
  player = new Spotify.Player({
    name: 'Chime In',
    getOAuthToken: cb => { cb(token); }
  });

  let lpos = 0;
  let lId = -1;
  let lState = null;

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', ({ message }) => {
    get("/auth/refresh", (data) => {
      getNextAndPlay(token, () => {
        get("/queue/pop");
      });
    });
    console.error(message);
  });

  player.addListener('authentication_error', ({ message }) => {
    console.log("Authentication failed, need to sign in first")
    get("/auth/refresh");
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
      get("/queue/set/"+uri);
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
      getNextAndPlay(token, () => {
        get("/queue/pop");
        console.log("New song is playing!");
      });
    }

    lpos = pos;
  });

  // Ready
  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    player.setVolume(defVol).then(() => {
      console.log('Volume updated!');
    });
  });

  // Not Ready
  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  // Connect to the player!
  player.connect();
};
