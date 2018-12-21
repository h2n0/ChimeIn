window.onload = function(){

  let join = document.getElementById("join");
  let host = document.getElementById("create");

  let text = host.children[0].children[0].innerHTML;
  if(text == "Sign in to Spotify to host"){
    let newUrl = "/host";
    host.onclick = (e)=>{
      document.location.href = newUrl;
    }
  }else if(text == "Need premium to host"){

  }else{
    host.onclick = (e) => {
      get("/newSession", (data) =>{
        let newUrl = "/session/"+data;
        document.location.href = newUrl;
      });
    };
  }


  join.onclick = (e) => {
    let id = document.getElementById("sessionId").value.trim();
    if(id == "" || id.length < 8)return;
    get("/isSession/"+id, (data) => {
      if(data == "false"){
        alert("No room with that name");
      }else{
        let newUrl = "/session/"+id;
        document.location.href = newUrl;
      }
    });
  }
}
