class Session{
  constructor(){
    this.users = [];
    this.queue = [];
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
}

module.exports = Session;
