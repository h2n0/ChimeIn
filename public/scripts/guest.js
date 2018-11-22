const guests = true;
let lId = null;

function setCurrentInfo(){
  get("/queue/current", (data) => {
    let j = JSON.parse(data);
    let name = j.name
    let aName = j.artist.name;
    let img = j.images[1];

    let display = name + " by " + aName;

    document.getElementById("playing").src = img;
    document.getElementById("NAT").innerHTML = display;

    let now = Date.now();
    let then = j.started + j.next;
    let off = 100;

    let when = then - now - off;
    setTimeout( () => {
      console.log("Automated info checker!");
      setCurrentInfo();
    }, when)
  });
}
