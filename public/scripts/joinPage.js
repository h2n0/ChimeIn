let roomValue = 0;

window.onload = function(){


  if( "serviceWorker" in navigator){
    navigator.serviceWorker.register("/pwa.js").then( (reg)=>{
      console.log("PWA worker registered!", reg);
    });
  }


  let join = document.getElementById("join");
  let host = document.getElementById("create");
  let idContainer = document.getElementById("sessionId");

  let status = host.children[0].children[0].getAttribute("status");
  if(status == 0){
    let newUrl = "/host";
    host.onclick = (e)=>{
      document.location.href = newUrl;
    }
  }else if(status == -1){

  }else{ // Status == 1 so we can host
    host.onclick = (e) => {
      get("/newSession", (data) =>{
        let newUrl = "/session/"+data;
        document.location.href = newUrl;
      });
    };
  }


  var url_string = window.location.href
  var url = new URL(url_string);
  var error = url.searchParams.get("error");
  if(error){
    if(error == 1){ // Couldn't get user info
      showOkayDialog("Error!", "Unable to get user data, make sure your login info was correct");
    }else if(error == 2){ // User isn't premium
      showOkayDialog("Error!", "Sorry, you need to have Spotify premium to host a session");
    }
  }


  join.onclick = (e) => {
    joinSession(stripInput(idContainer.value.trim()));
  }

  idContainer.onkeyup = (e) => {

    if(e.keyCode != 13){
      return;
    }

    joinSession(stripInput(idContainer.value.trim()));
  }
}

function formatInput(input){
  let out = "";
  while(input.length > 0){
    let part = input.substring(0,3);
    if(part.substring(0,1) == "-"){
      input = input.substring(1);
    }else{
      input = input.substring(3);
      out = out + part + "-";
    }
  }
  if(out.length % 4 != 1){
    out = out.substring(0, out.length - 1);
  }
  return out;
}

function stripInput(input){
  let out = "";
  let test = /([0-9]{3})/g
  let found = input.match(test);
  if(found){
    for(let i = 0; i < found.length; i++){
      out += found[i];
    }
  }
  return out;
}


function joinSession(id){
  if(id == "" || id.length < 8){
    showOkayDialog("One second", "You need to enter a 9 digit room code");
    return;
  }

  let test = /([0-9]{3})/g
  let found = id.match(test);
  if(found){
    id = found[0] + found[1] + found[2];
  }

  get("/isSession/"+id, (data) => {
    if(!data){
      showOkayDialog("Are you sure?", "The room you are looking for dosen't exist");
    }else{
      data = JSON.parse(data);
      if(data.isLive && data.isActive){
        let newUrl = "/session/"+id;
        document.location.href = newUrl;
      }else{
        showOkayDialog("Pssst!", "Looks like the host is still setting things up");
      }
    }
  });
}
