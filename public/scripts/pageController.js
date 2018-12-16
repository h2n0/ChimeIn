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

  let tabs = document.getElementsByTagName("button");
  for(let i = 0; i < tabs.length; i++){
    let ct = tabs[i];
    if(i == index){
      ct.classList.add("active");
    }else{
      ct.classList.remove("active");
    }
  }
}

function updateQueue(guid){
  let q = document.getElementById("queue");
  let hq = document.getElementById("qHead");

  get("/queue/human", (tracks) => {
    tracks = JSON.parse(tracks);
    let numTracks = tracks.length;
    let qc = q.childNodes.length;
    let children = q.childNodes;

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
            li.appendChild(spot);
            spot.onclick = (e) => {
              showRemoveTrack(track, (removed) => {
                if(removed){
                  let id = track.id;

                  let obj = {
                    "id":id
                  }
                  post("/queue/remove", obj, (e,d) => {
                    updateQueue();
                  });
                }
              });
            };
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
          spot.onclick = (e) => {
            showRemoveTrack(track, (removed) => {
              if(removed){
                let id = track.id;

                let obj = {
                  "id":id
                }
                post("/queue/remove", obj, (e,d) => {
                  updateQueue();
                });
              }
            });
          };
        }

        q.appendChild(li);
      }
    }

    if(tracks){
      hq.innerHTML = "Queue (" + numTracks + ")";
    }else{
      hq.innerHTML = "Queue";
    }
  });
}

function setCurrentInfo(){
  get("/queue/current", (data) => {
    let j = JSON.parse(data);
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
      showAddTrack(track, (added) =>{
        if(added){
          let uri = track.uri;

          let obj = {
            "pusher" : guid,
            "id" : uri
          }

          post("/queue/push", obj, (err, data) => {
            if(err){
              console.error("Something has gone wrong while queueing a song");
            }else{
              console.log("Added song to queue!");
              updateQueue(guid);
            }
          });

          /**
          get("/queue/push/"+track.uri, (data) => {
            console.log("Added song to queue!");
            updateQueue();
          });
          **/
        }
      });
    }
    list.appendChild(nl);
  }
}


window.onload = function(){
  let searchBox = document.getElementById("songSearch");
  let list = document.getElementById("q");
  let guid = genID();

  searchBox.onkeydown = (e) => {
    if(e.keyCode != 13)return; // Press enter to search!
    let v = searchBox.value.trim();

    if(v == "")return;

    let data = {
      "query" : v
    }

    post("/search", data, (err, d) =>{
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

  // WINDOW load
  autoCheck(guid);
}
