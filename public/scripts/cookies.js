function setCookie(name, value, exp){
  document.cookie = document.cookie + name + "=" + value + ";"
}


function getCookie(name){
  let cs = document.cookie.trim();
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
