class Session{
  constructor(){
    this.users = [];
    this.queue = [];
    this.token = null;
    this.refresh = null;
    this.expire = null;
  }

  addUser(user){
    this.users.push(user);
  }

  getUsers(){
    return this.users;
  }

  getQueue(){
    return this.queue;
  }

  setTokens(newToken, newExpire, newRefresh){
    this.token = newToken;
    this.refresh = newRefresh;
    let d = new Date().getTime();
    let minutes = newExpire * 1000;
    let newExp = d + minutes;
    this.expire = new Date(newExp);
  }
}

module.exports = Session;
