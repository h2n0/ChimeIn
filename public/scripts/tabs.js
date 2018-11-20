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

var queue = [];


window.onload = function(){
  let searchBox = document.getElementById("songSearch");
  let list = document.getElementById("q");
  searchBox.onkeyup = (e) => {
    let v = searchBox.value.trim();
    get("/search/"+v, (data) =>{
      let d = JSON.parse(data)
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
          });
        }
        list.appendChild(nl);
      }
    });
  }
}
