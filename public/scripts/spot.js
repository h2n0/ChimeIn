let player = null;
let defVol = 0.25;
let connected = false;
let lconnected = false;
let lastID = null;
var guests = false;


function getNextAndPlay(token){
  get("/queue/next", (data) => {
    let j = JSON.parse(data);
    if(j.status != 200){// Nothing next in the queue so lets try again soon
      setTimeout( () => {
        getNextAndPlay(token);
      }, 1000 * 2);
    }else{// SOmething was in the queue so we are going to try and play it
      playSong(token, j.id, (err, data) => {
        get("/queue/current", (data) => {
          let j = JSON.parse(data);
          if(j.status == 404){
            console.log("Currently no song playing!");
            return;
          }else{
            console.log("Playing " + j.name + " by " + j.artist.name);
          }
        });
      });
    }
  });
}

window.onSpotifyWebPlaybackSDKReady = () => {
  const token = getCookie("spotID");
  player = new Spotify.Player({
    name: 'Chimein',
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
      getNextAndPlay(token);
    }

    lconnected = connected;
    if(!state)return;
    let npos = state.position;
    let current = state.track_window.current_track;
    let id = current.id;
    if(npos == 0 && state.paused == true && id != lId){
      console.log("New song!");
      get("/queue/pop");
      getNextAndPlay(token);
      lId = id;
    }

    lpos = npos;
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
