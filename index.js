let express = require("express")
let app = express()
let config = require("config.js")
let port = 8888;

let sessions = [];
console.log(config);

function isActiveSession(addr){
  return sessions[addr] != null;
}

function generateSessionID(){
  let out = "";
  let l = 9;
  let j = 0;
  let dic = "0123456789";
  for (let i = 0; i < l; i++){
    let index = Math.random() * dic.length;
    out += dic.substring(index, index+1);
    j++;
    if(j == 3){
      out += "-";
      j = 0;
    }
  }
  out = out.substring(0,out.length-1);
  while(isActiveSession(out)){
    out = generateSessionID();
  }
  return out;
}

function createSession(uname){
  let id = generateSessionID();
  let sesh = {users: [],id:id}
  sesh.users.push({name:uname, isAdmin: true});
  sessions[id] = sesh;
  console.log("Session created: " + sesh.id)
  return sesh;
}

function joinSession(id, name){
  sessions[id].users.push({name:name, isAdmin: false});
  console.log("Update #" + id + ": " + name + " joined the party!")
  return sessions[id];
}

app.set('view engine', 'pug');
app.use(express.static('public'))

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/about", (req, res) =>{
  res.render("about");
});

app.get("/login", (req, res) => {
  let scopes = "user-read-private user-read-email";
  let redirect_uri = "localhost:"+port+"/";
  let client_id = "NOTHING!";
  res.redirect('https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + my_client_id +
  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +'&redirect_uri=' + encodeURIComponent(redirect_uri));
});

app.get("/create", (req, res) =>{

  let sesh = createSession("tester!");
  res.render("create", {sessionID:sesh.id});
});

app.get("/join", (req, res) =>{
  let id = req.query.id;
  if(id){
    if(isActiveSession(id)){
      let sesh = joinSession(id,"New Guy!");
      res.redirect("/session/"+id)
    }else{
      console.log("No session with ID: " + id)
    }
  }
  res.render("join");
});
app.get("/list", (req, res) => {
  console.log(sessions)
});

app.get("/session/:id", (req, res) => {
  let id = req.params.id;
  let error = null;
  if(!isActiveSession(id)){
    error = "Couldn't find session with that ID";
  }
  res.render("session",{sessionID:id, error:error, session:sessions[id]});
});



app.listen(port, () => {
  console.log("listening on " + port + "!");
});
