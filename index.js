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
const extendedSigns = (signs.join("") + " ").split("");

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

app.get("/playFair", async(req, res) => {
  res.render('playFair', {
    min : 0,
    max : signs.length
  });
})

app.post("/playFair", async(req, res) => {
  var inputText = req.body.text || '';
  var decode = req.body.decode == true;
  if(checkIfValid(req.body.key, res, {
    title : `Error:`,
    result: "invalid key",
    route : "playFair"
  }, extendedSigns)) {
    var result = encodePlayFair(inputText, req.body.key, decode);
    res.render('result', {
      title : `${decode ? 'decoded' : 'encoded'} text:`,
      result,
      route : "playFair"
    });
  }
})

let removeNotValidChars = (string, validChars) => {
  return string.split("").filter(character => validChars.indexOf(character) >=0 ).join("");
}

let encodePlayFair = (originalText, key, decode) => {
  let shift = decode ? -1 : 1;
  let pfSigns = removeDuplicateCharacters(key + extendedSigns.join(""));
  let playFairSigns = {};
  let playFairSignsTable = {};
  let pfShift = 9;
  let result = "";
  pfSigns.split("").forEach((character, index) => {
    let row = Math.floor(index/pfShift);
    let column = index%pfShift;
    playFairSigns[character] = {
        row,
        column
    };
    playFairSignsTable[row] = playFairSignsTable[row] || [];
    playFairSignsTable[row][column] = character;
  });
  let validStr = removeNotValidChars(originalText, extendedSigns);
  validStr = (validStr.length%2 == 0) ? validStr : (validStr + ' ');
  validStr.match(/.{1,2}/g).forEach(charactersData => {
    let chr1 = playFairSigns[charactersData[0]];
    let chr2 = playFairSigns[charactersData[1]];
    if(chr1.column == chr2.column) {
      result += playFairSignsTable[(pfShift + chr1.row + shift)%pfShift][chr1.column]
      result += playFairSignsTable[(pfShift + chr2.row + shift)%pfShift][chr2.column]
    } else if (chr1.row == chr2.row) {
      result += playFairSignsTable[chr1.row][(pfShift + chr1.column + shift)%pfShift]
      result += playFairSignsTable[chr2.row][(pfShift + chr2.column + shift)%pfShift]
    } else {
      result += playFairSignsTable[chr2.row][chr1.column];
      result += playFairSignsTable[chr1.row][chr2.column];
    }
  });
  originalText.split("").forEach((character, index) => {
    if(!isValid(character, pfSigns)) {
      result = result.slice(0, index) + character + result.slice(index);
    }
  })
  return result;
}

let removeDuplicateCharacters = (string) => {
  return string
    .split('')
    .filter(function(item, pos, self) {
      return self.indexOf(item) == pos;
    })
    .join('');
}

let checkIfValid = (str, res, data, signsToCheck) => {
  signsToCheck = signsToCheck || signs;
  if(str == null || str.split("").filter(character => !isValid(character, signsToCheck)).length > 0){
      res.render('result', data);
      return false;
  } else {
    return true;
  }
}

let isValid = (character, signsToCheck) => {
  return signsToCheck.indexOf(character) >= 0;
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
