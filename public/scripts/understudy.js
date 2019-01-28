class UnderStudy{

  constructor(elm, options){
    this.elm = elm;
    this.options = options;
    this.value = "";
    this.formattedValue = "";
    this.fake = document.createElement("input");
    this.fake.classList = this.elm.classList;



    this.container = document.createElement("div");

    this.elm.parentNode.insertBefore(this.container, this.elm);
    this.container.appendChild(this.elm);
    this.container.appendChild(this.fake);

    let bound = this.elm.getBoundingClientRect();

    let bb = this.elm.currentStyle || window.getComputedStyle(this.elm);
    let off = this.removePX(bb.marginBottom) + this.removePX(bb.paddingBottom);
    let ntop = bound.top - 30;
    let style = "width: {}px; top: {}px; left: {}px;".format(bound.width, ntop, bound.left);
    style += "position: absolute; margin-bottom: 25px";

    if(this.options){
      if(this.options.style){
        style += this.options.style;
      }
    }

    this.fake.style = style;
    this.fake.style.zIndex = -1;
    this.hideFake();

    let fakeStyle = this.fake.currentStyle || window.getComputedStyle(this.fake);
    off = this.removePX(bb.marginBottom);
    this.initHeight = this.removePX(fakeStyle.height) + off/4;

    this.init();
  }

  init(){
    this.elm.addEventListener("keyup", (e) => {
      this.formatValue();
      if(this.elm.value.length == 0){
        this.hideFake();
      }else{
        this.showFake();
      }
    });

    this.fake.addEventListener("focus", (e) => {
      this.elm.click();
    });

    this.elm.addEventListener("blur", (e) => {
      this.elm.classList.remove("active");
      this.fake.classList.remove("active");
      if(this.elm.value.length == 0){
        this.hideFake();
      }else{
        this.showFake();
      }
    });

    this.elm.addEventListener("focus", (e) => {
      this.elm.classList.add("active");
      this.fake.classList.add("active");

      this.elm.select();
    });
  }

  formatValue(){
    let out = "";
    let tempV = this.elm.value;

    let spacer = "-";
    let block = 3;

    if(this.options){
      spacer = this.options.spacer;
      block = this.options.block;
    }

    while(tempV.length > 0){
      let part = tempV.substring(0, block);
      let rest = tempV.substring(block);
      let current = part.substring(0,1);
      if(current == spacer){
        tempV = res.substring(1);
      }else{
        tempV = rest;
        out += part + spacer;
      }
    }

    if(out.length % (block+1) != 1){
      out = out.substring(0, out.length - 1);
    }

    this.formattedValue = out;
    this.fake.value = this.formattedValue;

    let shrink = 1.5;
    let fs = 5 - ((this.fake.value.length / 11) * shrink);
    this.copyLook();
    this.fake.style.fontSize = fs + "em";
    this.fake.style.height = this.initHeight;
  }


  hideFake(){
    this.elm.style.opacity = "1";
    this.fake.style.opacity = "0";
  }

  showFake(){
    this.elm.style.opacity = "0";
    this.fake.style.opacity = "1";
  }

  removePX(val){
    return parseInt(val.trim().substring(0, val.length-2));
  }

  copyLook(){
    let style = this.elm.currentStyle || window.getComputedStyle(this.elm, "");
    console.log(style.getPropertyValue("border"));
    this.fake.style.border = style.border;
  }
}

window.addEventListener("load", (e) => {
  let d = new UnderStudy(document.getElementById("sessionId"));
  //alert(window.innerWidth + " " + window.innerHeight);
});
