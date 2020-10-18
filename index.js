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
// const signs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

app.get("/", async(req, res) => {
  res.render('index');
})


app.get("/cesar", async(req, res) => {
  res.render('cesar', {
    min : 0,
    max : signs.length
  });
})

app.post("/cesar", async(req, res) => {
  var inputText = req.body.text || '';
  var decode = req.body.decode == true;
  var shift = parseInt(req.body.shift) || 0;
  var result = inputText.split("").map((character) => getCesarShift(character, shift, decode)).join("");
  res.render('result', {
    title : `${decode ? 'decoded' : 'encoded'} text:`,
    result,
    route : "cesar"
  });
})


app.get("/vigener", async(req, res) => {
  res.render('vigener', {
    min : 0,
    max : signs.length
  });
})

app.post("/vigener", async(req, res) => {
  var inputText = req.body.text || '';
  var decode = req.body.decode == true;
  if(checkIfValid(req.body.key, res, {
    title : `Error:`,
    result: "invalid key",
    route : "vigener"
  })) {
    var key = decode ? reverse(req.body.key) : req.body.key;
    var result = encodeVigener(inputText, key);
    res.render('result', {
      title : `${decode ? 'decoded' : 'encoded'} text:`,
      result,
      route : "vigener"
    });
  }
})

let checkIfValid = (str, res, data) => {
  console.log(str);
  console.log(str.split("").filter(character => signs.indexOf(character)  < 0).length > 0);
  if(str == null || str.split("").filter(character => signs.indexOf(character) < 0).length > 0){
      res.render('result', data);
      return false;
  } else {
    return true;
  }
}

let reverse = (key) => {
  return key.split("").map(character => signs[(signs.length - signs.indexOf(character))%signs.length]).join("");
}

let encodeVigener = (inputText, key) => {
  let result = "";
  let ommited = 0;
  inputText.split("").forEach((character, index) => {
    if(signs.indexOf(character) >= 0) {
      let shift = signs.indexOf(key[(index - ommited)%key.length]);
      result += getCesarShift(character, shift, false);
    } else {
      ommited += 1;
      result += character;
    }
  });
  console.log(result);
  return result;
}

let decodeVigener = (inputText, key) => {

}

let getCesarShift = (character, shift, decode) => {
  return signs.indexOf(character) < 0 ? character : signs[wantedIndex(character, decode, shift)]
}

let wantedIndex = (character, decode, shift) => {
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
