$(document).ready(function() {
  let jsonVal = JSON.parse(document.getElementById("json").innerHTML);
  console.log(jsonVal);
  document.getElementById("json").innerHTML = JSON.stringify(jsonVal, undefined, 2);
});
