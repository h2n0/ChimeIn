let player = null;
let defVol = 0.25;
let connected = false;
let lconnected = false;
let lastID = null;
var guests = false;

let flag1 = false;


function getNextAndPlay(token){
  get("/queue/next", (data) => {
    let j = JSON.parse(data);
    let status = j.status
    if(status == 404){// Nothing next in the queue so lets try again soon
      setTimeout( () => {
        console.log("Nothing in q")
        getNextAndPlay(token);
      }, 1000 * 2);
    }else{// Something was in the queue so we are going to try and play it
      if(status == 201){ // Song was recommended
        let uri = "spotify:track:" + j.id;
        console.log("Rec");
        get("/queue/push/" + uri);
        getNextAndPlay(token);
        get("/queue/pop"); // Remove the rec from the queue
      }else{
        playSong(token, j.id);
      }
    }
  });
}

window.onSpotifyWebPlaybackSDKReady = () => {
  const token = getCookie("spotID");
  player = new Spotify.Player({
    name: 'Chime',
    getOAuthToken: cb => { cb(token); }
  });

  let lpos = 0;
  let lId = 0;
  let lState = null;

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('authentication_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', ({ message }) => { console.error(message); });

  // Playback status updates
  player.addListener('player_state_changed', state => {
    if(!state){
      connected = false;
    }else{
      connected = true;
    }

    if(connected && !lconnected){ // User has connected
      let uri = state.track_window.current_track.uri;
      let p = uri.split(":");
      lastID = p[p.length-1];
      get("/queue/set/"+uri);
    }

    lconnected = connected;
    if(!state)return;
    let pos = state.position;
    let current = state.track_window.current_track;
    let duration = state.duration;

    if(pos > 0 && duration > 0 && !state.paused && !flag1){
      flag1 = true;
    }

    // Next song check
    if(pos == 0 && (state.paused || !state.paused) && flag1){
      flag1 = false;
      getNextAndPlay(token);
      get("/queue/pop");
      console.log("New song is playing!");
    }
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
  player.connect().then( success => {
    console.log("HUI");
    if(success){
      console.log("Ready");
    }else{
      console.log("Nope!");
    }
  });
};
