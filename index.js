let express = require("express");
let app = express();
let port = 8888;
let cookie = require("cookie-parser");
let SpotifyWebApi = require('spotify-web-api-node');
let bodyParser = require("body-parser");
let User = require("./backend/user.js");
let Session = require("./backend/session.js");
let AutoTrack = require("./backend/autotrack.js");
let config = require("./backend/config.js");
let spotify = new SpotifyWebApi(config);
let request = require("request");


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

      res.cookie("spotID", token);
      spotify.setAccessToken(token);
      spotify.setRefreshToken(refresh);
      spotify.getMe( (err, data) => {
        name = data.body["display_name"];
        res.cookie("spotName", name);
        res.redirect("/");
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
  });
});

app.get("/search/:term", (req, res) => {
  let d = req.params.term.trim()
  spotify.searchTracks(d, {limit:5}).then( (data) => {
    res.send(data);
  }, (err) => {
    res.send(JSON.stringify({error:err}))
  });
});

app.get("/queue/current", (req,res) => {
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
        res.send(JSON.stringify(null));
      } else {
        let body = data.body;
        let name = body.name;
        let uri = body.uri;

        let d = {
          name:name,
          uri:uri,
          artist: { name:body.artists[0].name, id: body.artists[0].id},
          images: [
            body.album.images[0].url,
            body.album.images[1].url,
            body.album.images[2].url
          ],
          next: body.duration_ms,
          started: Date.now(),
          link: body["external_urls"]["spotify"],
          status: 100
        }

        currentData = d;
        res.send(d);
      }
    });
  }
});


app.get("/queue/next", (req,res) =>{
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
  }

  res.send(JSON.stringify(resp));
});

app.get("/queue/pop", (req, res) => {
  queue.shift()
  res.send("done")
});

app.get("/queue/all", (req,res) => {
  res.send(JSON.stringify(queue || null));
});

app.get("/queue/human", (req,res) => {
  let nq = [];
  for(let i = 1; i < queue.length; i++){
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
  console.log("Pushed to the queue: " + id)
  res.send("{error:null}");
});

app.get("/queue/set/:id", (req,res) =>{
  let id = req.params.id;
  currentId = id;
  console.log("Connection with id: " + id);
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
