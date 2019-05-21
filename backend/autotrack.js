// First song to ever be suggested: https://open.spotify.com/track/3aS8qJ2zl30WllXN4J24zV

class AutoTrack{

  constructor(spotify, country){
    this.country = country;
    this.size = 5;
    this.songs = [];
    this.genres = [];
    this.avaliable = null;

    spotify.getAvailableGenreSeeds((err,data)=>{
      if(err){

      }else{
        this.avaliable = data.body.genres;
      }
    });
  }


  _getAmtAll(){
    return this.songs.length + this.genres.length;
  }

  _addSong(song){
    if(this._getAmtAll() >= this.size){
      this.songs.shift();
    }
    this.songs.push(song);
  }

  _addGenre(artist){
    if(this._getAmtAll() >= this.size){
      this.genres.shift();
    }
    this.genres.push(artist);
  }

  add(spotify, data){
    let song = data.id;
    let artist = data.artist;
    this._addSong(song);

    spotify.getArtist(artist, (err, data) => {
      let gs = data.body.genres;


      for(let i = 0; i < gs.length; i++){
        let g = gs[i].trim().toLowerCase();
        let gf = g.charAt(0);
        let done = false;
        for(let j = 0; j < this.avaliable.length; j++){
          let a = this.avaliable[j].trim().toLowerCase();
          let af = a.charAt(0);


          if(g == a){
            done = true;
            this._addGenre(g);
            break;
          }

          if(gf > af){
            done = true;
            break;
          }
        }

        if(done){
          break;
        }
      }
    });
  }

  getQueue(){
    let out = "";
    for(let i = 0; i < this.queue.length; i++){
      out = out + this.queue[i] + ",";
    }
    return out.substring(0,out.length-1);
  }


  getRecommendations(spotify){
    let recData = {
      min_energy: 0.4,
      seed_tracks: this.songs,
      seed_genres: this.genres,
      min_populatiry: 50,
      market: this.country
    };

    return recData;
  }
}

module.exports = AutoTrack;
