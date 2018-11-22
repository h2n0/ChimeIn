function get(url, callback) {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
     callback(this.responseText)
    }
  };
  xhttp.open("GET", url, true);
  xhttp.send();
}


function post(url, data, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
     callback(this.responseText)
    }
  };
  xhttp.open("POST", url, true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send(data);
}


function playSong(token, songURI, callback){
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
     callback(this.responseText)
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
