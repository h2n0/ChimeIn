
window.onload = () =>{
  let sessionForm = document.getElementById("sessionForm");

  sessionForm.onsubmit = () => {
    let id = sessionForm.elements["id"].value.trim();
    let res = /[0-9]{3}-?[0-9]{3}-?[0-9]{3}/.test(id);

    if(!res){// ID isn't XXX-XXX-XXX or XXXXXXXXX

    }

    return res;
  }
}
