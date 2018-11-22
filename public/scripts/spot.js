let player = null;
let defVol = 0.25;
let connected = false;
let lconnected = false;

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

    if(connected && !lconnected){// User has connected
      let uri = state.track_window.current_track.uri;
      get("/queue/set/"+uri, (data) =>{ // Set the queue to this

      });
    }

    lconnected = connected;
    if(!state)return;
    let npos = state.position;
    let current = state.track_window.current_track;
    let id = current.id;
    if(npos < lpos && id != lId && npos == 0){
      console.log("New song!");
      get("/queue/next", (id) => {
        if(id == null)return;
        playSong(token, id);
      });
      lId = id;
      lpos = npos;
    }

    lpos = npos;
    let album = current.album;
    let albumArt = album.images[0].url;
    let artist = current.artists[0].name;
    let songName = current.name;
    document.getElementById("playing").src = albumArt;
    let displayLink = songName + " by " + artist;
    document.getElementById("NAT").innerHTML = displayLink;

    get("/track/"+id, (data) => {
      let j = JSON.parse(data).body;
      document.getElementById("imageLink").href = j["external_urls"]["spotify"];
    });
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
