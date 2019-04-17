/**

  This file allows us to trick chimein into thinking the user is still on the tab

**/

importScripts("ajax.js")


let interval = null;
let v = 0;
let room = null;
let guid = null;

onmessage = (e) => {
  let data = JSON.parse(e.data);
  this.room = data.room;
  this.guid = data.guid;
  let event = data.on;
  if(event){
    interval = setInterval(action, 1000);
  }else{
    clearInterval(interval);
  }
}


function makePostObject(data){
  let res = {
    "room" : this.room,
    "guid" : this.id,
    "data": data || null
  }

  return res;
}

function action(){
  post("/session/data", makePostObject({"event": "ping"}), (err,data) => {

  });
}
