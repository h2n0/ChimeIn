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

function updateQueue(){
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
        p.innerHTML = track.name + " by " + track.artist
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
        p.innerHTML = track.name + " by " + track.artist
        img.src = track.img;

        li.classList.add("queueItem")
        li.appendChild(img)
        li.appendChild(p);
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
      console.log("No song yet!");
      setTimeout( () => {
        setCurrentInfo();
      }, 1000 * 10);
    }else{
      let name = j.name
      let aName = j.artist.name;
      let img = j.images[1];

      let display = name + " by " + aName;

      document.getElementById("playing").src = img;
      document.getElementById("NAT").innerHTML = display;
      document.getElementById("imageLink").href = j.link;

      let now = Date.now();
      let then = j.started + j.next;
      let off = 20;

      let when = then - now - off;
      if(when < 0)when = 2000; // Spotiy needs time to load the new track so let's give it some
      setTimeout( () => {
        console.log("Automated info checker!");
        setCurrentInfo();
        updateQueue();
      }, when);
    }
  });
}

function autoCheck(){
  updateQueue();
  setCurrentInfo();
  setTimeout( () => {
    autoCheck();
  }, 1000 * 5);
}


window.onload = function(){
  let searchBox = document.getElementById("songSearch");
  let list = document.getElementById("q");

  searchBox.onkeydown = (e) => {
    if(e.keyCode != 13)return; // Press enter to search!
    let v = searchBox.value.trim();
    v = encodeURI(v);
    get("/search/"+v, (data) =>{
      let d = JSON.parse(data);
      if(d.statusCode == 401){
        console.log(d.error);
      }else{
        let tracks = d.body.tracks.items;
        list.innerHTML = "";
        for(let i = 0; i < tracks.length; i++){
          let track = tracks[i];
          let banding = i % 2 == 0;

          let nl = document.createElement("li");
          nl.innerHTML = track.name + " - " + track.artists[0].name;
          nl.classList.add("search" + (banding?"even":"odd"));
          nl.onmousedown = (e) => {
            get("/queue/push/"+track.uri, (data) => {
              console.log("Added song to queue!");
              alert("Added song!");
              updateQueue();
            });
          }
          list.appendChild(nl);
        }
      }
    });
  }

  // WINDOW load
  autoCheck();
}
