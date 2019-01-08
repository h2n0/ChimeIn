class Session{
  constructor(){
    this.token = null;
    this.refresh = null;
    this.expire = null;
    this.waitingForTokens = false;
  }

  setTokens(newToken, newExpire, newRefresh){
    this.token = newToken;
    this.refresh = newRefresh;
    this.setExpire(newExpire);
  }

  renewTokens(newToken, expires){
    this.token = newToken;
    this.setExpire(expires);
    this.waitingForTokens = false;
    console.log("New expire:" + this.expire)
  }

  setExpire(newExpire){
    let d = new Date();
    d.setSeconds(d.getSeconds() + parseInt(newExpire));
    this.expire = d;
  }


  hasExpired(){
    return Date.now() > this.expire;
  }
}

module.exports = Session;
