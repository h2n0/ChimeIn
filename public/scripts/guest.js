const guests = true;
let lId = null;

function setCurrentInfo(){
  get("/queue/current", (data) => {
    let j = JSON.parse(data);
    let name = j.name
    let aName = j.artist.name;
    let img = j.images[1];

    let display = name + " by " + aName;

    document.getElementById("playing").src = img;
    document.getElementById("NAT").innerHTML = display;

    let now = Date.now();
    let then = j.started + j.next;
    let off = 20;

    let when = then - now - off;
    setTimeout( () => {
      console.log("Automated info checker!");
      updateQueue();
      setCurrentInfo();
    }, when)
  });
}

function updateQueue(){
  let q = document.getElementById("queue");
  q.innerHTML = "";
  get("/queue/human", (tracks) => {
    tracks = JSON.parse(tracks);
    for(let i = 0; i < tracks.length; i++){
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
  });
}
