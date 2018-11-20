window.onload = () =>{
  let sessionForm = document.getElementById("sessionForm");
  let inputBox = sessionForm.elements["id"]
  let createSession = document.getElementById("create");
  let joinSession = document.getElementById("join");


  function validID(){
    let id = inputBox.value.trim();
    return /([0-9]{3})-?([0-9]{3})-?([0-9]{3})/.test(id);
  }

  inputBox.onkeyup = function(e){
    let v = inputBox.value.trim;
    if(v.length > 0){
      let lastChr = v.substring(v.length-1,v.length);
      console.log(lastChr);
    }
  }

  joinSession.onmousedown = (e) => {
    if(validID()){
      let id = inputBox.value.trim();
      let nid = /([0-9]{3})-?([0-9]{3})-?([0-9]{3})/.exec(id)
      let accID = "" + nid[1] + nid[2] + nid[3]
      get("/join/"+accID, (res) => {
        console.log("HUI");
      });
    }else{
      alert("Need to enter a valid session ID!");
    }
  }
}
