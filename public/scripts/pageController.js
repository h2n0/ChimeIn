function getRoomCode(){
  return document.getElementById("roomCode").innerHTML;
}

function getHumanRoomCode(){
  let code = getRoomCode();
  let realCode = code.substring(0,3) + "-" + code.substring(3,6) + "-" + code.substring(6,9);
  return realCode;
}

function openTab(index){
  tabContainers = document.getElementsByClassName("tabContainer");
  for(let i = 0; i < tabContainers.length; i++){
    let ct = tabContainers[i];
    if(index == ct.getAttribute("index")){
      ct.classList.remove("hidden");
    }else{
      ct.classList.add("hidden");
    }
  }

  let tabs = document.getElementsByClassName("tabs")[0].children;
  for(let i = 0; i < tabs.length; i++){
    let ct = tabs[i];
    if(i == index){
      ct.classList.add("active");
    }else{
      ct.classList.remove("active");
    }
  }
}

function makePostObject(data){
  let res = {
    "room" : getRoomCode(),
    "guid" : genID(),
    "data": data || null
  }

  return res;
}

function giveSpotLife(spot, track){
  spot.onclick = (e) => {
    showRemoveTrack(makePostObject(track), (removed) => {
      if(removed){
        let id = track.id;

        let obj = {
          "id":id
        }

        post("/queue/remove", makePostObject(obj), (e,d) => {
          updateQueue();
        });
      }
    });
  };
}

function updateQueue(guid){
  let q = document.getElementById("queue");
  let hq = document.getElementById("qHead").children[0];

  let qIcon = document.getElementById("qIcon");

  post("/queue/human", makePostObject(), (err, tracks) => {
    if(err){
      return;
    }
    tracks = JSON.parse(tracks);
    let numTracks = tracks != null ? tracks.length : 0;
    let qc = q.childNodes.length;
    let children = q.childNodes;

    if(numTracks <= 2){
      qIcon.classList.add("lowSongs");
    }else{
      qIcon.classList.remove("lowSongs");
    }

    if(numTracks <= qc){ // Queue size is smaller than it was before
                         // So edit existing ones then delete the exesss
      for(let i = 0; i < numTracks; i++){
        let currentQueuePos = children[i];
        let track = tracks[i];
        let img = currentQueuePos.childNodes[0];
        let p = currentQueuePos.childNodes[1];

        if(currentQueuePos.childNodes[2]){ // Has an owner spot
          if(track.pusher != guid){
            currentQueuePos.removeChild(currentQueuePos.childNodes[2]);
          }
        }else{ // If not make sure it does
          if(track.pusher ==  guid){
            let spot = document.createElement("div");
            spot.classList.add("spot");
            let x = document.createElement("p");
            x.innerHTML = "&times";
            spot.appendChild(x);
            currentQueuePos.appendChild(spot);
            giveSpotLife(spot, track);
          }
        }

        p.innerHTML = track.name + " by " + track.artist;
        img.src = track.img;
      }

      let diff = qc - numTracks;
      while(diff > 0){
        q.removeChild(q.lastChild);
        diff--;
      }
    }else{ // If the queue is bigger than it was, just append till the end
      let off = numTracks - qc;
      for(let i = numTracks-off; i < numTracks; i++){
        let track = tracks[i];
        let li = document.createElement("li");
        let img = document.createElement("img");
        let p = document.createElement("p");
        let spot = document.createElement("div");
        p.innerHTML = track.name + " by " + track.artist;
        img.src = track.img;


        spot.classList.add("spot");
        let x = document.createElement("p");
        x.innerHTML = "&times";
        spot.appendChild(x);

        li.classList.add("queueItem");
        li.appendChild(img);
        li.appendChild(p);

        if(track.pusher ==  guid){
          li.appendChild(spot);
          giveSpotLife(spot, track);
        }

        q.appendChild(li);
      }
    }

    let noSongs = document.getElementById("noSongs");

    if(tracks){
      hq.innerHTML = "Queue (" + numTracks + ")";
      noSongs.style.display = "none";
    }else{
      hq.innerHTML = "Queue (0)";
      noSongs.style.display = "block";
    }
  });
}

function setCurrentInfo(){

  post("/queue/current", makePostObject(), (err, data) => {
    if(err)return;
    let j = JSON.parse(data);
    if(j == null)return;
    if(j.status == 404){

    }else{
      let name = j.name
      let aName = j.artist.name;
      let img = j.images[1];

      let display = name + " by " + aName;

      document.getElementById("playing").src = img;
      document.getElementById("NAT").innerHTML = display;
      document.getElementById("imageLink").href = j.link;
    }
  });
}

function autoCheck(guid){
  updateQueue(guid);
  setCurrentInfo();
  setTimeout( () => {
    autoCheck(guid);
  }, 1000 * 5);
}

function populateSearchList(list, guid, tracks){
  list.innerHTML = "";
  for(let i = 0; i < tracks.length; i++){
    let track = tracks[i];
    let nl = document.createElement("li");
    let trackImg = document.createElement("img");
    trackImg.src = track.album.images[2].url;

    let title = document.createElement("p");
    title.innerHTML = track.name + " by " + track.artists[0].name;
    nl.appendChild(trackImg);
    nl.appendChild(title);
    nl.classList.add("searchItem");
    nl.onmousedown = (e) => {

      post("/session/limit", makePostObject(), (err,data) => {
        if(err){
          console.error(err)
        }else{
          let amt = parseInt(data)
          if(amt < 5){ // Isn't currenly hogging the queue
            showAddTrack(track, (added) =>{
              if(added){
                let uri = track.uri;
                let obj = {
                  "id" : uri,
                }
                post("/queue/push", makePostObject(obj), (err, data) => {
                  if(err){
                    console.error("Something has gone wrong while queueing a song");
                  }else{
                    console.log("Added song to queue!");
                    updateQueue(guid);
                  }
                });
              }
            });
          }else{
            showHoldUp();
          }
        }
      });
    }
    list.appendChild(nl);
  }
}

function copyText(text){
  let ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}


window.onload = function(){
  let searchBox = document.getElementById("songSearch");
  let list = document.getElementById("q");
  let guid = genID();

  searchBox.onkeydown = (e) => {
    if(e.keyCode != 13)return; // Press enter to search!
    let v = searchBox.value.trim();
    searchBox.blur();

    if(v == "")return;

    let data = {
      "query" : v
    }

    post("/search", makePostObject(data), (err, d) =>{
      if(err){
        console.error("Error while searching");
        console.group("Chime In");
        console.log(data);
        console.groupEnd();
      }
      d = JSON.parse(d);

      if(d.error != undefined){
        d = d.error;
      }
      if(d.statusCode == 401){
        console.error(d.message);
      }else{
        let tracks = [];
        if(d.body.tracks){
          tracks = d.body.tracks.items;
        }else{ // Single track has been returned, make an array
          tracks = [d.body];
        }
        populateSearchList(list, guid, tracks);
      }
    });
  }

  console.log("I");
  let location = window.location.href;
  let url = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="+location;
  document.getElementById("roomQr").src =  url;

  let room = getRoomCode();
  let realCode = room.substring(0,3) + "-" + room.substring(3,6) + "-" + room.substring(6,9);
  let humanCode = document.getElementById("humanCode");
  humanCode.innerHTML = realCode;
  document.title = "ChimeIn: " + realCode;

  humanCode.onclick = (e) => {
    copyText("http://chimein.live/session/" + room);
  };



  let obj = {
    "event": "joining"
  }
  //post("/session/data", makePostObject(obj));
}


window.onbeforeunload = function(){
  let obj = {
    "event": "leaving"
  }
  post("/session/data", makePostObject(obj));
}
