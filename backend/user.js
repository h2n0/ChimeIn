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
