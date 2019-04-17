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
let mysql = require("mysql");
let db = mysql.createConnection(config.sql);
let currentSession = null;
let sessions = [];
let sessionIds = [];
let Secrets = require("./backend/secrets.js");

app.set('view engine', 'pug');
app.use(express.static('./public'));
app.use(cookie());
app.use(bodyParser.json());

if(config.minimisedScripts){
  console.error("Using minimised scripts, use normal scripts if in development!");
}


function checkExpire(){
  if(currentSession){
    let handler = currentSession.sessionHandler;
    if(handler.hasExpired() && !handler.waitingForTokens){
      console.log("Refreshing tokens for session #"+currentSession.id);
      handler.waitingForTokens = true;
      spotify.refreshAccessToken( (err, data) =>{
        if(err){
          console.log("oh no");
          console.error(err.message);
        }else{
          let token = data.body.access_token;
          let expire = data.body.expires_in;
          handler.renewTokens(token, expire);
          spotify.setAccessToken(token);
        }
      });
    }
  }
}

function changeToRoom(id){
  if(currentSession){
    if(currentSession.id == id){
      checkExpire();
      return true;
    }
  }
  let room = sessions[""+id];
  if(room){
    room.changeToThisSession(spotify);
    currentSession = room;
    checkExpire();
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


let s = new Secrets(app);
s.hideSercets();

app.get("/", (req, res) => {
  let min = config.minimisedScripts;
  let scriptLoc = min?"/scripts/min":"/scripts";
  let scriptEnd = min?".min.js":".js";
  req.session = null;
  res.clearCookie("sessionHost", {path:"/session/"});
  res.render("index", {scripts: scriptLoc, scriptEnding: scriptEnd, user: req.cookies.spotName, canHost: req.cookies.spotPremium});
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
  sessionIds.push(id);
  res.send(id);
});


app.get("/isSession/:id", (req, res) => {
  let id = req.params.id;
  let sesh = sessions[""+id];

  let data = {
    isLive: sesh != null,
    isActive: sesh != null ? sesh.canJoinNow() : false
  }

  res.send(JSON.stringify(data));
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

      spotify.setAccessToken(token);
      spotify.setRefreshToken(refresh);
      spotify.getMe( (err, data) => {
        if(err){
          console.error(err);
          res.redirect("/?error=1");
        }else{
          name = data.body["display_name"];
          premium = data.body["product"] == "premium";
          if(premium){
            let id = genId();
            // Make sure we get an empty room
            while(sessions[""+id]){
              id = genId();
            }

            let ns = new ChimeSession(id, data.body.country);
            sessions[""+id] = ns;
            currentSession = ns;
            ns.sessionHandler.setTokens(token, expire, refresh);
            sessionIds.push(id);
            res.cookie("sessionHost", "true", {path:"/"});
            res.redirect("/session/"+id);
          }else{
            res.redirect("/?error=2");
          }
        }
      });
    }
  });
});

app.get("/host", (req, res) => {
  res.redirect("/login");
});

app.get("/update", (req, res) => {
  let room = req.query.session;
  if(!room){
    res.redirect("/");
  }else{
    console.log(room);
    res.render("update");
  }
});

app.get("/session/:id", (req, res) => {
  let id = req.params.id;
  if(sessions[""+id]){
    let min = config.minimisedScripts;
    let scriptLoc = min?"/scripts/min":"/scripts";
    let scriptEnd = min?".min.js":".js";
    res.render("session", {scripts: scriptLoc, scriptEnding: scriptEnd, host: req.cookies.sessionHost || false, id:id});
  }else{ // Session isn't valid, stop rendering these pages
    res.redirect("/");
  }
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
  console.log(body);
  if(changeToRoom(body.room)){
    console.log("In the room!");
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

app.post("/session/limit", (req,res) => {
  let data = req.body;
  if(changeToRoom(data.room)){
    let amt = currentSession.getSongsBy(data.guid);
    res.send(JSON.stringify(amt));
  }else{
    sendNull(res);
  }
});

app.post("/session/auth", (req, res) => {
  let data = req.body;
  if(changeToRoom(data.room)){
    let code = currentSession.sessionHandler.getToken();
    res.send(JSON.stringify(code));
  }else{
    sendNull(res);
  }
});

app.post("/session/data", (req,res) => {
  let data = req.body;
  if(changeToRoom(data.room)){
    currentSession.handleEvent(data);
    sendNull(res);
  }else{
    sendNull(res);
  }

});

app.get("/session/data/:room/:info", (req,res) =>{
  let room = req.params.room;
  let info = req.params.info;

  if(!room || !info){
    res.status(400).send("Missing room number or specific data")
  }else{
    if(changeToRoom(room)){
      res.send(currentSession.getInfo(info));
    }else{
      sendNull(res);
    }
  }
});

app.post("/test", (req, res) => {
  console.log(req.body);
  res.status(200).end();
});

app.get("/secret/all", (req, res) => {
  let out = "";
  let numSessions = sessionIds.length;


  out = "Num sessions: " + numSessions;

  let avg = 0;
  for(let i = 0; i < sessionIds.length; i++){
    let sid = sessionIds[i];
    if(changeToRoom(sid)){
      avg += currentSession.songsPlayed;
    }
  }
  avg = avg / numSessions;
  out += "\n"
  out += "Avg songs played: " + avg + "\n";
  res.send(out);


});

app.get("/logout", (req,res) => {
  res.clearCookie("spotName");
  res.clearCookie("spotID");
  res.clearCookie("sessionHost");
  res.clearCookie("spotPremium");
  res.redirect("/");
});


app.listen(port, () => {
  console.log("listening on http://localhost:" + port + "!");
  console.log("Here we go!")
});
