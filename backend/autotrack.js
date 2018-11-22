class AutoTrack{
  constructor(){
    this.size = 5;
    this.queue = [];
  }

  addElement(e){
    if(this.queue.length > this.size){
      this.queue.shift();
    }
    this.queue.push(e);
  }

  getQueue(){
    let out = "";
    for(let i = 0; i < this.queue.length; i++){
      out = out + this.queue[i] + ",";
    }
    return out.substring(0,out.length-1);
  }
}

module.exports = AutoTrack;
