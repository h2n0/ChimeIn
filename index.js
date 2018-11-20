let express = require("express");
let app = express();
let port = 8888;
let cookie = require("cookie-parser");
let SpotifyWebApi = require('spotify-web-api-node');
let bodyParser = require("body-parser");
let User = require("./backend/user.js");
let Session = require("./backend/session.js");
let config = require("./backend/config.js");
let spotify = new SpotifyWebApi(config);
let request = require("request");
let queue = [];

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
    console.error(err);
    res.send("{error:'"+err+"'}")
  });
});

app.get("/queue/next", (req,res) =>{
  res.send(JSON.stringify(queue.shift() || null));
});

app.get("/queue/all", (req,res) => {
  res.send(JSON.stringify(queue || null));
});

app.get("/queue/push/:id", (req,res) =>{
  let t = req.params.id;
  queue.push(t);
  res.send("{error:null}");
});

app.get("/logout", (req,res) => {
  res.clearCookie("spotName");
  res.clearCookie("spotId");
  res.clearCookie("sessionHost");
  res.redirect("/");
});


app.get("/search/:term", (req, res) => {
  let user = users[req.param.user]
  let out = {body:{}, error:""}

  if(!user){
    out.error = "Not a valid user!";
  }else{
    user
  }

  res.send(out);
});

app.get("/set/:uri", (req, res) =>{
  let uri = req.params.uri;
  currentSongURI = uri;
  res.send("{res:\"Done!\"}")
});


app.listen(port, () => {
  console.log("listening on http://localhost:" + port + "!");
  console.log("Here we go!")
});
