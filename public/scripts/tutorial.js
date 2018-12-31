let userConnected = false;
let userPlaying = false;

let connectBox = document.createElement("div");
let title = document.createElement("h2");
title.innerHTML = "Let's connect";

let details = document.createElement("p");
connectBox.appendChild(title);
connectBox.appendChild(details);


window.addEventListener("load", (e) => {
  details.innerHTML = getHumanRoomCode();
  tutStep();
});




function tutStep(e){
  if(!userConnected){
    if(!isBoxShowing()){
      showBox(connectBox, {blurClose:false});
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
        });
      }
    }, (err) => {
      console.error(err);
    });
  }
}
