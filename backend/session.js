class Session{
  constructor(){
    this.token = null;
    this.refresh = null;
    this.expire = null;
  }

  setTokens(newToken, newExpire, newRefresh){
    this.token = newToken;
    this.refresh = newRefresh;
    this.setExpire(newExpire);
  }

  renewTokens(newToken, expires){
    this.token = newToken;
    this.setExpire(expires);
  }

  setExpire(newExpire){
    let d = new Date().getTime();
    let minutes = newExpire * 1000;
    let newExp = d + minutes;
    this.expire = new Date(newExp);
    console.log(this.expire);
  }


  hasExpired(){
    return Date.now() > this.expire;
  }
}

module.exports = Session;
