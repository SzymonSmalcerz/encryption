var express = require("express");
var bodyParser = require("body-parser");
const hbs = require('hbs');
const path = require('path');



// initialize express variable
var app = express();
// tell express to use body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Define paths for Express config
const publicDirectoryPath = path.join(__dirname, '/public')
const viewsPath = path.join(__dirname, '/templates/views')
const partialsPath = path.join(__dirname, '/templates/partials')


// Setup handlebars engine
app.set('view engine', 'hbs')
// Register paths to express - this step lets us use all of files in this folders
// Set views location - thanks to this view engine knows where
// to find dynamic html templates
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)
// Setup static directory to serve -we can use all
// of files in this folder as if they were in main folder
app.use(express.static(publicDirectoryPath))

const signs = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻaąbcćdeęfghijklłmnńoópqrsśtuvwxyzźż0123456789".split("");

app.get("/", async(req, res) => {
  res.render('index');
})


app.get("/cesar", async(req, res) => {
  res.render('index', {
    min : 0,
    max : signs.length
  });
})

app.post("/cesar", async(req, res) => {
  var inputText = req.body.text;
  var result;
  var title = "encoded text:";
  if(inputText == null || inputText.trim() == "") {
    title = "Error";
    result = "Error - Input text empty"
  } else if(inputText.split("").filter(char => signs.indexOf(char) < 0).length > 0) {
    title = "Error";
    result = `Error - found not permitted  character: "${inputText.split("").filter(char => signs.indexOf(char) < 0)[0]}"`
  } else {
    var decode = req.body.decode == true;
    var shift = parseInt(req.body.shift) || 0;
    result = inputText.split("").map((character) => signs[wantedIndex(signs, character, decode, shift)]).join("");
  }
  res.render('result', {
    title,
    result,
    route : "cesar"
  });
})

let wantedIndex = (signs, character, decode, shift) => {
  return (signs.indexOf(character) + (decode ? (-shift) : shift))%signs.length;
}

// all other routes - return 404
app.get("*", (req,res) => {
  res.render('404', {
      error: 'You are lost.'
  })
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
