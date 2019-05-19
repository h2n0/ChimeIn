let userConnected = false;
let userPlaying = false;

let connectBox = document.createElement("div");
let title = document.createElement("h2");
title.innerHTML = "Let's connect";
connectBox.style = "text-align: center;";

let details = document.createElement("h1");
details.classList.add("tutCode");
connectBox.appendChild(title);
connectBox.appendChild(details);

let instructions = document.createElement("p");
instructions.innerHTML = "Connect to the ChimeIn session with this room id";
connectBox.appendChild(instructions);


let cancelButton = document.createElement("button");
cancelButton.classList.add("option");
cancelButton.innerHTML = "Canel";

cancelButton.onclick = (e) => {

  let seshInfo = {
    "event" : "closing"
  }

  post("/session/data", makePostObject(seshInfo), (err,data) =>{
    window.location = "https://chimein.live";
  });

};

connectBox.appendChild(cancelButton);


window.addEventListener("load", (e) => {
  details.innerHTML = getHumanRoomCode();
  tutStep();
});




function tutStep(e){
  if(!userConnected){
    if(!isBoxShowing()){
      showBox(connectBox, {blurClose:false});
      connectBox.classList.add("tutBox");
    }

    player.getCurrentState().then( (data) => {
      if(data == null){
        setTimeout( ()=>{
          tutStep(null);
        }, 1000);
      }
      else{
        closeBox();
        player.setVolume(0.25).then(() => {
          console.log('Volume updated!');

          let seshInfo = {
            "event" : "endTut"
          }

          post("/session/data", makePostObject(seshInfo), (err, data) => {
            if(err){
              console.error("Oh no");
            }else{
              this.canJoin = true;
            }
          });
        });
      }
    }, (err) => {
      console.error(err);
    });
  }
}
