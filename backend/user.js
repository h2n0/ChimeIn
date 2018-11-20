class User{
  constructor(name){
    this.name = name
    this.token = null;
    this.expire = null;
    this.refresh = null;
    this.isAdmin = false;
  }

  hasExpired(){
    return Date.now() > this.expire;
  }

  setTokens(newToken, newExpire, newRefresh){
    this.token = newToken;
    this.refresh = newRefresh;
    let d = new Date().getTime();
    let minutes = newExpire * 1000;
    let newExp = d + minutes;
    this.expire = new Date(newExp);
  }

  setName(nName){
    this.name = nName;
  }

  setAdmin(){
    this.admin = true;
  }

  isAdmin(){
    return this.admin;
  }
}


module.exports = User;
