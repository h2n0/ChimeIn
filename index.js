let express = require("express");
let app = express();
let port = 8888;
let cookie = require("cookie-parser");
let SpotifyWebApi = require('spotify-web-api-node');
let bodyParser = require("body-parser");
let config = require("./backend/config.js");
let ChimeSession = require("./backend/chimeSession.js");
let spotify = new SpotifyWebApi(config);
let request = require("request");
let currentSession = null;
let sessions = [];

app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(cookie());
app.use(bodyParser.json());


function checkExpire(){
  if(currentSession){
    if(currentSession.sessionHandler.hasExpired()){
      console.log("Refreshing tokens for session #"+currentSession.id);
      spotify.refreshAccessToken( (err, data) =>{
        if(err){
          console.log("oh no");
          console.error(err);
        }else{
          let token = data.body.access_token;
          let expire = data.body.expires_in;
          currentSession.sessionHandler.renewTokens(token, expire);
          currentSession.changeToThisSession(spotify);
        }
      });
    }
  }
}

function changeToRoom(id){
  if(currentSession){
    if(currentSession.id == id)return true;
  }
  let room = sessions[""+id];
  if(room){
    room.changeToThisSession(spotify);
    currentSession = room;
    return true;
  }else{
    console.log("No such room as #"+id);
    return false;
  }
}

function genId(){
  let id = "";
  for(let i = 0; i < 9; i++){
    id = id + Math.round((Math.random() * 9));
  }
  return id;
}

function sendNull(res){
  res.send(JSON.stringify(null));
}

app.get("/", (req, res) => {
  res.render("index", {user: req.cookies.spotName, canHost: req.cookies.spotPremium});
});

app.get("/about", (req, res) =>{
  res.render("about");
});


app.get("/newSession", (req, res) => {
  let id = genId();

  // Make sure we get an empty room
  while(sessions[""+id]){
    id = genId();
  }

  let ns = new ChimeSession(id);
  sessions[""+id] = ns;
  currentSession = ns;
  res.send(id);
});


app.get("/isSession/:id", (req, res) => {
  let id = req.params.id;
  let sesh = sessions[""+id];
  let free = sesh != undefined && sesh.isActive();
  res.send(free);
});

app.get("/login", (req, res) => {
  let scopes = "streaming user-read-playback-state user-read-birthdate user-read-private user-read-email user-modify-playback-state";
  let redirectUri = config.redirectUri;
  let clientId = config.clientId;
  let url = "https://accounts.spotify.com/authorize?response_type=code" + "&client_id=" + clientId + (scopes ? "&scope=" + encodeURIComponent(scopes) : '') + "&redirect_uri=" + encodeURIComponent(redirectUri);
  res.redirect(url);
});

app.get("/auth", (req,res) => {
  spotify.authorizationCodeGrant(req.query["code"], function(err, data){
    if(err){
      console.error("Something went wrong!", err)
    }else{
      let token = data.body["access_token"];
      let expire = data.body["expires_in"];
      let refresh = data.body["refresh_token"];

      sessionHolder = new ChimeSession();
      cSession = new ChimeSession("100");
      cSession.sessionHandler.setTokens(token, expire, refresh);
      cSession.changeToThisSession(spotify);

      res.cookie("spotID", token);
      spotify.getMe( (err, data) => {
        name = data.body["display_name"];
        premium = data.body["product"] == "premium";
        res.cookie("spotPremium", premium);
        res.cookie("spotName", name);
        res.redirect("/");
      });
    }
  });
});

app.get("/auth/refresh", (req, res) => {
  checkExpire();
  res.status(200).end();
});

app.get("/host", (req, res) => {
  res.cookie("sessionHost", "true");
  res.redirect("/login");
});

app.get("/session/:id", (req, res) => {
  let id = req.params.id;
  res.render("session", {host: req.cookies.sessionHost || false, id:id});
});

app.post("/search", (req, res) => {

  let data = req.body;

  if(changeToRoom(data.room)){
    let d = data.data.query.trim();
    let songReg = new RegExp("\/track\/([0-9A-Za-z]*)");
    let reg = d.match(songReg);

    if(d.indexOf(":") != -1 || reg){ // Spotify URI
                                     // It's a very specific search
      if(!reg){
        let p = d.split(":");
        d = p[p.length-1];
      }else{
        d = reg[1];
      }
      d = d.trim();
      spotify.getTrack(d, (err,data) => {
        if(err){
          console.error(err);
        }else{
          res.send(data);
        }
      });
    }else{
      spotify.searchTracks(d, {limit:5}, (err, data) => {
        if(err){
          console.error("Looking for a song failed!")
          console.error(err);
          res.send(JSON.stringify({error:err}))
        }else{
          res.send(data);
        }
      });
    }
  }else{
    sendNull(res);
  }
});

app.post("/search/track", (req, res) => {
  let body = req.body;
  if(changeToRoom(body.room)){
    spotify.getTrack(body.data.id, (err, data) => {
      res.send(JSON.stringify(data));
    });
  }else{
    sendNull(res);
  }
});

app.post("/queue/current", (req,res) => {
  let body = req.body;
  if(changeToRoom(body.room)){
    currentSession.getCurrentSong(spotify, (data) => {
      try{
        res.send(JSON.stringify(data));
      }catch(e){
        // BS error
      }
    });
  }else {
    sendNull(res);
  }
});


app.post("/queue/next", (req,res) =>{
  let body = req.body;
  if(changeToRoom(body.room)){
    currentSession.getNextSong(spotify, (data) =>{
      res.send(JSON.stringify(data));
    });
  }else{
    sendNull(res);
  }
});

app.post("/queue/pop", (req, res) => { // Remove song from front of queue
  let data = req.body;
  if(changeToRoom(data.room)){
    currentSession.popFromQueue();
  }
  res.send("done")
});

app.get("/queue/all", (req,res) => { // Simple queue getter
  res.send(JSON.stringify(queue || null));
});

// Get the queue and all the image data too
app.post("/queue/human", (req, res) => {
  let data = req.body;
  let roomId = data.room;
  if(changeToRoom(roomId)){
    currentSession.getHumanQueue(spotify, (data) => {
      res.send(JSON.stringify(data));
    });
  }else{
    sendNull(res);
  }
});

app.post("/queue/push", (req,res) =>{
  let data = req.body;
  let roomId = data.room;
  if(changeToRoom(roomId)){
    let songObj = {
      "id" : data.data.id,
      "pusher" : data.guid
    }
    currentSession.pushToQueue(songObj);
    sendNull(res);
  }else{
    sendNull(res);
  }
});

app.post("/queue/remove", (req, res) => {
  let body = req.body;
  let roomId = body.room;
  if(changeToRoom(roomId)){
    currentSession.removeFromQueue(body.data.id);
    res.status(200);
    sendNull(res);
  }else{
    res.status(400);
    sendNull(res);
  }
});

app.post("/queue/set", (req,res) => {
  let data = req.body;
  if(changeToRoom(data.room)){
    currentSession.setCurrentSong(data.id);
  }
  sendNull(res);
});

app.post("/session/data", (req,res) => {
  let data = res.body;
});

app.post("/test", (req, res) => {
  console.log(req.body);
  res.status(200).end();
});

app.get("/logout", (req,res) => {
  res.clearCookie("spotName");
  res.clearCookie("spotId");
  res.clearCookie("sessionHost");
  res.redirect("/");
});


app.listen(port, () => {
  console.log("listening on http://localhost:" + port + "!");
  console.log("Here we go!")
});
