let express = require("express");
let app = express();
let port = 8888;
let cookie = require("cookie-parser");
let SpotifyWebApi = require('spotify-web-api-node');
let bodyParser = require("body-parser");
let Session = require("./backend/session.js");
let AutoTrack = require("./backend/autotrack.js");
let ChimeResponse = require("./backend/response.js");
let config = require("./backend/config.js");
let spotify = new SpotifyWebApi(config);
let request = require("request");
let sessionHolder = null;


let queue = [];
let currentId = null;
let currentData = null;
let currentHumanQueue = [];
let currentSession = new Session();
let recc = new AutoTrack();

app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(cookie());
app.use(bodyParser.urlencoded({extended: false}));


function checkExpire(){
  if(sessionHolder){
    if(sessionHolder.hasExpired()){
      console.log("Refreshing tokens!")
      spotify.refreshAccessToken( (err, data) =>{
        if(err){
          console.log("oh no");
          console.error(err);
        }else{
          let token = data.body.access_token;
          let expire = data.body.expires;
          sessionHolder.renewTokens(token, expire);
          spotify.setAccessToken(token);
        }
      });
    }
  }
}

app.get("/", (req, res) => {
  res.render("index", {user: req.cookies.spotName});
});

app.get("/about", (req, res) =>{
  res.render("about");
});

app.get("/login", (req, res) => {
  let scopes = "streaming user-read-birthdate user-read-private user-read-email user-modify-playback-state";
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

      sessionHolder = new Session();
      sessionHolder.setTokens(token, expire, refresh);

      res.cookie("spotID", token);
      spotify.setAccessToken(token);
      spotify.setRefreshToken(refresh);
      spotify.getMe( (err, data) => {
        name = data.body["display_name"];
        res.cookie("spotName", name);
        res.redirect("/session");
      });
    }
  });
});

app.get("/host", (req, res) => {
  res.cookie("sessionHost", "true");
  res.redirect("/login");
});

app.get("/session", (req, res) => {
  res.render("session", {host: req.cookies.sessionHost || false});
});


app.get("/track/:id", (req, res) => {
  spotify.getTrack(req.params.id).then( (data) =>{
    res.send(data);
  }, (err) =>{
    console.error(err);
    res.send("Error!");
  });
});

app.get("/search/:term", (req, res) => {

  checkExpire();

  let d = req.params.term.trim()

  if(d.indexOf(":") != -1){ // Spotify URI
                            // It's a very specific search
    let p = d.split(":");
    d = p[p.length-1];

    spotify.getTrack(d, (err,data) => {
      if(err){
        console.error(err);
      }else{
        res.send(data);
      }
    });
  }else{
    spotify.searchTracks(d, {limit:5}).then( (data) => {
      res.send(data);
    }, (err) => {
      res.send(JSON.stringify({error:err}))
    });
  }
});

app.get("/queue/current", (req,res) => {

  checkExpire();

  if(currentData){
    return res.send(currentData);
  }
  if(!currentId){
    let d = {
      status: 404
    }
    res.send(JSON.stringify(d));
  }else{
    let id = currentId.split(":");
    id = id[id.length-1];
    recc.addElement(id);
    spotify.getTrack(id, (err,data) =>{
      if(err) {
        let d = {
          status: 404
        }
        res.send(JSON.stringify(d));
      } else {
        let body = data.body;
        let name = body.name;
        let uri = body.uri;

        let d = {
          id: body.id,
          name: name,
          uri: uri,
          artist: { name:body.artists[0].name, id: body.artists[0].id},
          images: [
            body.album.images[0].url,
            body.album.images[1].url,
            body.album.images[2].url
          ],
          next: body.duration_ms,
          started: Date.now(),
          link: body["external_urls"]["spotify"],
          status: 200
        }

        currentData = d;
        res.send(d);
      }
    });
  }
});


app.get("/queue/next", (req,res) =>{

  checkExpire();

  let id = queue[0] || null;
  currentId = id;
  currentData = null;
  currentHumanQueue = null;

  let resp = {
    id : null,
    status : 404
  }

  if(id != null){
    resp.id = id;
    resp.status = 200;
    res.send(JSON.stringify(resp));
  }else{
    let recData = {
      min_energy: 0.4,
      seed_tracks: recc.getQueue(),
      min_populatiry: 50
    };
    spotify.getRecommendations(recData, (err,data) => {
      if(err){
        return null;
      }else{
        let tracks = data.body.tracks;
        let index = Math.floor(Math.random() * tracks.length);
        let t = tracks[index];
        resp.id = t.id;
        resp.status = 201;
        res.send(JSON.stringify(resp));
      }
    });
  }
});

app.get("/queue/pop", (req, res) => { // Remove song from front of queue
  queue.shift()
  res.send("done")
});

app.get("/queue/all", (req,res) => { // Simple queue getter
  res.send(JSON.stringify(queue || null));
});

app.get("/queue/human", (req,res) => { // Get queue and all the image data too
  let nq = [];
  for(let i = 0; i < queue.length; i++){
    let uri = queue[i].split(":");
    let id = uri[uri.length-1];
    nq.push(id);
  }

  if(nq == []){
    res.send([]);
  }else{
    spotify.getTracks(nq, (err,data) => {
      if(!data){
        res.send([]);
      }else{
        let j = data.body;
        let out = [];
        for(let l = 0; l < j.tracks.length; l++){
          let current = j.tracks[l];
          out.push({
            name: current.name,
            artist: current.artists[0].name,
            img: current.album.images[2].url
          })
        }
        currentHumanQueue = out;
        res.send(out);
      }
    });
  }
});

app.get("/queue/push/:id", (req,res) =>{
  let id = req.params.id;
  queue.push(id);
  console.log("Pushed to the queue: " + id);
  res.send("{error:null}");
});

app.get("/queue/set/:id", (req,res) =>{
  let id = req.params.id;
  currentId = id;
  console.log("Connection with id: " + id);
});

app.get("/test/:id", (req,res) => {
  let id = req.params.id;
  if(id.indexOf(":") != -1){
    let p = id.split(":")
    id = p[p.length-1];
  }
  spotify.getAudioFeaturesForTrack()
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
