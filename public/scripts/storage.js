function _hasStorage(){
  return typeof(Storage) !== "undefined";
}

function storeInfo(key, value){
  if(_hasStorage()){
    window.localStorage.setItem(key, value);
    return true;
  }else{
    return false;
  }
}

function getInfo(key){
  if(_hasStorage()){
    return window.localStorage.getItem(key);
  }else{
    return null;
  }
}

function removeInfo(key){
  if(_hasStorage()){
    window.localStorage.removeItem(key);
    return true;
  }else{
    return false;
  }
}
