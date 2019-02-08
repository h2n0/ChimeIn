let box = null;

let acceptColor = "#9F9";
let declineColor = "#F99";

function showBox(content, options){
  if(!content)return;


  let blurClose = true;
  if(options){
    if(options.blurClose != undefined){
      blurClose = options.blurClose;
    }
  }

  let b = document.createElement("div");
  b.classList.add("modal");

  let all = document.createElement("div");
  all.appendChild(content);
  all.classList.add("modalContent");

  b.appendChild(all);

  document.body.appendChild(b);
  b.style.display = "block";
  box = b;
  popin();

  window.onclick = (e) => {
    if(e.target == box && blurClose){
      closeBox();
    }
  };
}

function popin(){
  box.children[0].style = "transform: scale(0, 0);";
  setTimeout( () => {
    box.children[0].style = "transform: scale(1, 1);";
  }, 50);
}

function popout(){
  box.children[0].style = "transform: scale(1, 1);";
  setTimeout( ()=>{
    box.children[0].style = "transform: scale(0, 0);";
  }, 10);
}

function showAddTrack(track, callback){
  let content = document.createElement("div");
  let img = document.createElement("img");
  img.src = track.album.images[1].url;
  img.style = "display: block; margin: 0 auto;";

  let name = document.createElement("h2");
  name.style = "text-align: center;";
  name.innerHTML = track.name + "<br>" + track.artists[0].name;

  let addBtn = document.createElement("div");
  addBtn.innerHTML = "Add to queue";

  let sharedStyle = "width: 50%; text-align: center; cursor: pointer;"
  sharedStyle = sharedStyle + "padding-top: 10%; padding-bottom: 10%;";
  addBtn.style = "float: left;" + sharedStyle + "background-color: #9F9;";

  addBtn.onclick = (e) => {
    if(callback)callback(true);
    closeBox();
  }

  let canBtn = document.createElement("div");
  canBtn.innerHTML = "Cancel";
  //canBtn.style = "float: right;" + sharedStyle + "background-color: " + declineColor + ";";
  canBtn.style = "float: right; {} background-color: {};".format(sharedStyle, declineColor);
  canBtn.onclick = (e) => {
    if(callback)callback(false);
    closeBox();
  }

  let buttons = document.createElement("div");
  buttons.appendChild(canBtn);
  buttons.appendChild(addBtn);

  content.appendChild(img);
  content.appendChild(name);
  content.appendChild(buttons);

  showBox(content);
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

    let sharedStyle = "width: 50%; height: 70px; text-align: center; cursor: pointer;"
    sharedStyle = sharedStyle + "padding-top: 10%; padding-bottom: 10%;";
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

    showBox(content);
  });
}

function showHoldUp(){
  let cont = document.createElement("div");
  let phrase = document.createElement("h1");
  let reason = "You've already got a load of songs in the queue<br>why not wait a while";
  phrase.innerHTML = "Hol' Up!"; // Dom's correction
  cont.style = "text-align: center; color: black;";

  let okbtn = document.createElement("div");
  okbtn.innerHTML = "Okay";
  okbtn.style = "margin: 0 auto; width: 50%; height: 70px; text-align: center; cursor: pointer; line-height: 70px; background-color: #9F9; position: relative; bottom: -70px";

  okbtn.onclick = (e) => {
    closeBox();
  }

  cont.appendChild(phrase);
  let p = document.createElement("p");
  p.style="padding-top: 10%";
  p.innerHTML = reason;
  cont.appendChild(p);
  cont.appendChild(okbtn);
  showBox(cont);
}

function showOkayDialog(title, inner){

  let content = document.createElement("div");
  let header = document.createElement("h1");
  header.innerHTML = title;
  header.style = "text-align: center";

  let p = document.createElement("p");
  p.innerHTML = inner;
  p.style = "font-size: 1.5em; text-align: center;";
  content.appendChild(header);
  content.appendChild(p);

  let okbtn = document.createElement("div");
  okbtn.innerHTML = "Okay";
  okbtn.style = "margin: 0 auto; width: 50%; height: 70px; text-align: center; cursor: pointer; line-height: 70px; background-color: #9F9; position: relative; bottom: -70px";

  okbtn.onclick = (e) => {
    closeBox();
  }

  content.appendChild(okbtn);
  showBox(content);
}

function closeBox(){
  popout();
  setTimeout( () => {
    document.body.removeChild(box);
    box = null;
  }, 500);
}

function isBoxShowing(){
  return box != null;
}


String.prototype.format = function(...replace){
  let pat = /{}/gi;
  let res = null
  let arr = [];
  while( (res = pat.exec(this)) != null){
    arr.push(res);
  }

  let others = this.split("{}");
  let out = "";

  for(let i = 0; i < others.length; i++){
    let part = replace[i];
    let cur = arr[i];
    let base = others[i];

    out += base;

    if(part == null || part == undefined || cur == null || cur == undefined){
      continue;
    }

    out += part;
  }

  return new String(out.trim());
}
