function genID(){
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

  return guid;
}


function tester(){
  obj = { "name" : "tester" };
  post("/test", obj, (d) => {
    console.log("Callback!");
  });
}
