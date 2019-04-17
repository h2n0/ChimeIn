class User{

  constructor(guid){
    this.id = guid;
    this.ping();
  }

  ping(){
    this.lastActive = new Date();
  }

  getLastActive(){
    return this.lastActive;
  }

  isActive(){
    let diff = new Date() - this.lastActive;
    let min = 1000 * 60 * 1; // 5 minutes
    return diff < min;
  }


}



module.exports = User;
