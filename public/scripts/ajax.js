function get(url, callback) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if(callback)callback(this.responseText)
    }
  };

  xhttp.open("GET", url, true);
  xhttp.setRequestHeader("Access-Control-Allow-Origin","*");
  xhttp.send();
}


function post(url, data, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4) {
      if(callback)callback(this.status != 200, this.responseText)
    }
  };
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(data));
}


function playSong(token, songURI, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.statusCode == 204) {
      if(callback){
        callback(null, this.responseText);
      }
    }
  };
  let url = "https://api.spotify.com/v1/me/player/play";
  let data = JSON.stringify({"uris": [songURI]});
  xhttp.open("PUT", url, true);
  xhttp.setRequestHeader("Accept", "application/json");
  xhttp.setRequestHeader("Authorization","Bearer " + token);
  xhttp.setRequestHeader("Content-Type","application/json");
  xhttp.send(data);
}

function swapFromSpotToChime(token, deviceId, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 204) {
      if(callback){
        callback(null, this.responseText);
      }
    }
  };
  let url = "https://api.spotify.com/v1/me/player";
  let data = JSON.stringify({"device_ids": [deviceId]});
  xhttp.open("PUT", url, true);
  xhttp.setRequestHeader("Accept", "application/json");
  xhttp.setRequestHeader("Authorization","Bearer " + token);
  xhttp.setRequestHeader("Content-Type","application/json");
  xhttp.send(data);
}

function getCurretDeviceId(token, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if(callback){
        callback(null, this.responseText);
      }
    }
  };
  let url = "https://api.spotify.com/v1/me/player";
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader("Accept", "application/json");
  xhttp.setRequestHeader("Authorization","Bearer " + token);
  xhttp.send();
}


function getCurrentDevices(token, cb){
  if(!token){
    if(cb){
      cb("No given token");
    }
    return;
  }
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      if(cb){
        cb(null, JSON.parse(this.responseText).devices);
      }
    }
  };
  let url = "https://api.spotify.com/v1/me/player/devices";
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader("Accept", "application/json");
  xhttp.setRequestHeader("Authorization","Bearer " + token);
  xhttp.send();
}


function getCurrentPlayingSong(token, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status >= 200) {
      let code = this.status - 200;
      if(code == 0){ // Okay
        callback(this.responseText);
      }else if(code == 4){// Private or no devices
        callback(null);
      }
    }
  };
  let url = "https://api.spotify.com/v1/me/player/currently-playing?market=GB";
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader("Accept", "application/json");
  xhttp.setRequestHeader("Authorization","Bearer " + token);
  xhttp.send();
}
