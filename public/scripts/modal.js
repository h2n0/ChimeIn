box = null;

function showBox(title, content){
  if(!content)return;
  let b = document.createElement("div");
  b.classList.add("modal");

  let t = document.createElement("h1");
  t.innerHTML = title || "Chime in";

  let all = document.createElement("div");
  all.appendChild(content);
  all.classList.add("modalContent");

  b.appendChild(all);

  document.body.appendChild(b);
  b.style.display = "block";
  box = b;

  window.onclick = (e) => {
    if(e.target == box){
      closeBox();
    }
  };
}

function showAddTrack(track, callback){
  let content = document.createElement("div");
  let img = document.createElement("img");
  img.src = track.album.images[1].url;
  img.style = "display: block; margin: 0 auto;";

  let name = document.createElement("h2");
  name.style = "text-align: center;";
  name.innerHTML = track.name + " by " + track.artists[0].name;

  let addBtn = document.createElement("div");
  addBtn.innerHTML = "Add to queue";

  let sharedStyle = "width: 50%; text-align: center; cursor: pointer; padding-top: 10%; padding-bottom: 10%;";
  addBtn.style = "float: left;" + sharedStyle + "background-color: #9F9;";

  addBtn.onclick = (e) => {
    if(callback)callback(true);
    closeBox();
  }

  let canBtn = document.createElement("div");
  canBtn.innerHTML = "Cancel";
  canBtn.style = "float: right;" + sharedStyle + "background-color: #F99;";
  canBtn.onclick = (e) => {
    if(callback)callback(false);
    closeBox();
  }

  content.appendChild(img);
  content.appendChild(name);
  content.appendChild(canBtn);
  content.appendChild(addBtn);

  showBox("ChimeIn", content);
}

function showRemoveTrack(trackObj, callback){
  post("/search/track", trackObj, (err, data) =>{
    let track = JSON.parse(data).body;
    let content = document.createElement("div");
    let img = document.createElement("img");
    img.src = track.album.images[1].url;
    img.style = "display: block; margin: 0 auto;";

    let name = document.createElement("h2");
    name.style = "text-align: center;";
    name.innerHTML = track.name + " by " + track.artists[0].name;

    let addBtn = document.createElement("div");
    addBtn.innerHTML = "Remove from queue";

    let sharedStyle = "width: 50%; text-align: center; cursor: pointer; padding-top: 10%; padding-bottom: 10%;";
    addBtn.style = "float: left;" + sharedStyle + "background-color: #9F9;";

    addBtn.onclick = (e) => {
      if(callback)callback(true);
      closeBox();
    }

    let canBtn = document.createElement("div");
    canBtn.innerHTML = "Cancel";
    canBtn.style = "float: right;" + sharedStyle + "background-color: #F99;";
    canBtn.onclick = (e) => {
      if(callback)callback(false);
      closeBox();
    }

    content.appendChild(img);
    content.appendChild(name);
    content.appendChild(canBtn);
    content.appendChild(addBtn);

    showBox("ChimeIn", content);
  });
}

function closeBox(){
  document.body.removeChild(box);
  box = null;
}
