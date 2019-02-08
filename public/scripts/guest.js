let setId = null;

function genID(){

  if(setId){
    return setId;
  }

  let nav = window.navigator;
  let screen = window.screen;

  let ua = nav.userAgent.replace(/\D+/g, "");
  let plugs = nav.plugins.length;
  let mimes = nav.mimeTypes.length;

  let guid = mimes;
  guid += ua;
  guid += plugs;
  guid += screen.height || "";
  guid += screen.width || "";
  guid += screen.pixelDepth || "";
  guid += screen.colorDepth || "";
  
  setId = btoa(parseInt(guid).toString(16));
  return setId;
}


function tester(){
  obj = { "name" : "tester" };
  post("/test", obj, (d) => {
    console.log("Callback!");
  });
}
