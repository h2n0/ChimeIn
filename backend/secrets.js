class Secrets {


  constructor(server){
    this.server = server;
    this.kettle = null;
    this.base = "/secrets";
  }

  hideSercets(){

    this.get("/kettelSet", (req, res) => {
      this.kettle = new Date();
      res.status(200).end();
    });

    this.get("/kettelGet", (req, res) =>{
      res.send(""+this.kettle);
    });
  }


  get(route, f){
    this.server.get(this.base + route, (req, res) => {
      f(req, res);
    });
  }


}



module.exports = Secrets;
