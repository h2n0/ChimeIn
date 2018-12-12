class ChimeResponse{

  constructor(){
    this.status = 200;
    this.body = {};
  }

  error(code){
    this.status = 400 + (code || 0);
    return this;
  }

  success(code){
    this.status = 200 + (code || 0);
    return this;
  }

  addTrack(track){
    if(this.body.track){
      this.body.track = [this.body.track];
      this.body.track.push(track);
    }else{
      this.body.track = track;
    }

    return this;
  }

  addArtist(artist){
    if(this.body.artist){
      this.body.artist = [this.body.artist];
      this.body.artist.push(artist);
    }else{
      this.body.artist = artist;
    }

    return this;
  }

  clear(){
    this.status = 100;
    this.body = {};
    return this;
  }
}

module.export = ChimeResponse;
