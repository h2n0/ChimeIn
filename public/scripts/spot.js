let player = null;
let defVol = 0.25;


window.onSpotifyWebPlaybackSDKReady = () => {
  const token = getCookie("spotID");
  player = new Spotify.Player({
    name: 'Chimein',
    getOAuthToken: cb => { cb(token); }
  });

  let lpos = 0;
  let lId = 0;

  // Error handling
  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('authentication_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('playback_error', ({ message }) => { console.error(message); });

  // Playback status updates
  player.addListener('player_state_changed', state => {
    if(!state)return;
    let npos = state.position;
    let current = state.track_window.current_track;
    let id = current.id;
    if(npos < lpos && id != lId){
      console.log("New Song!");
      get("/queue/next", (data) => {
        let d = data.substring(1, data.length-1);
        if(d == null)return;
        playSong(token, d, (res) => {
          console.log(res);
        });
      });
      lId = id;
    }

    lpos = npos;
    let album = current.album;
    let albumArt = album.images[0].url;
    let artist = current.artists[0].name;
    let songName = current.name;
    document.getElementById("playing").src = albumArt;
    document.getElementById("NAT").innerHTML = g + encodeURI(songName + " by " + artist);

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
