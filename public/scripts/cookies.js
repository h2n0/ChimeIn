function setCookie(name, value, hours){
  document.cookie = document.cookie + name + "=" + value + ";"
}


function getCookie(name){
  let cs = document.cookie.trim();
  console.log(cs);
  if(cs == "")return null;
  let parts = cs.split(";");
  for(let i = 0; i < parts.length; i++){
    let cc = parts[i];
    let pcc = cc.split("=");
    if(pcc.length == 0)continue;
    let cname = pcc[0].trim();
    let cvalue = pcc[1].trim();
    if(cname == name){
      return cvalue
    }
  }
  return null;
}

function checkCookie(name){
  return getCookie(name) != null;
}


window.addEventListener("load", (e) => {
  let cookieString = document.cookie.trim();
  let missingColon = cookieString.substring(cookieString.length-1) != ";";
  if(missingColon && cookieString.length > 0){
    //console.log("Malformed cookies");
    document.cookie = document.cookie.trim() + "; ";
    //console.log(document.cookie);
  }else{
    //console.log("Cookies are all good");
  }
});
