var express = require("express");
var bodyParser = require("body-parser");
const hbs = require('hbs');
const path = require('path');
const base = require.resolve('dictionary-pl');
const fs          = require('fs');
const affix       = fs.readFileSync(base.split("index.js").join("") + 'index.aff');
const dictionary  = fs.readFileSync(base.split("index.js").join("") + 'index.dic');
const { Nodehun }          = require('nodehun');
const nodehun     = new Nodehun(affix, dictionary)
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
const polishSigns = "aioeznrwstcykdpmujlłbgęhąóżśćfńqźvx".split("");
const polishSignsObj = {}
polishSigns.forEach((character, index) => {
  polishSignsObj[character] = index;
});
const singleChars = "awiozu";
polishSignsWithoutSingleLetters = "enrstcykdpmjlłbgęhąóżśćfńqźvx".split("");

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


app.get("/cryptogram", async(req, res) => {
  res.render('cryptogram', {
    min : 0,
    max : signs.length
  });
})

app.post("/cryptogram", async(req, res) => {
  var inputText = req.body.text || '';
  // inputText = removeNotValidChars(inputText.trim().toLowerCase(), polishSigns);
  inputText = inputText.trim().toLowerCase();
  if(inputText.length < 300) {
    res.render('result', {
      title : `Error:`,
      result: "Text too short (min 300 signs)",
      route : "cryptogram"
    });
  } else {
    var words = inputText.split(/[^aioeznrwstcykdpmujlłbgęhąóżśćfńqźvx]/).filter(word => word.length > 0);
    console.log(words.join(" "));
    var countOfChars = {};
    words.join("").split("").forEach(character => {
        countOfChars[character] = countOfChars[character] || 0;
        countOfChars[character] += 1;
    });
    let arrayWithCounts = [];
    for (var prop in countOfChars) {
      if (Object.prototype.hasOwnProperty.call(countOfChars, prop)) {
          arrayWithCounts.push({
            letter : prop,
            count : countOfChars[prop]
          })
      }
    }
    arrayWithCounts.sort((a,b) => a.count > b.count ? -1 : 1);
    let computedWords = [];
    let n = 3;
    let done = false;
    let knownMappings = {};
    let probableMappings = {};
    var singleLetterWords = removeDuplicateCharacters(words.filter(word => word.length == 1).join(""));
    singleLetterWords.split("").forEach(singleLetterWord => {
      probableMappings[singleLetterWord] = singleChars.split("");
    });
    console.log(singleLetterWords.length);
    if(singleLetterWords.length != 6 ) {
      res.render('result', {
        title : `Error:`,
        result: "Text not possible to decrypt",
        route : "cryptogram"
      });
      return;
    }
    // let filteredPolishSigns = singleLetterWords.length == singleChars.length ? polishSignsWithoutSingleLetters : polishSigns;
    let sortedArray = removeDuplicateCharacters(arrayWithCounts.map(obj => obj.letter).join("") + polishSigns.join("")).split("");
    sortedArray.forEach((character, index) => {
      probableMappings[character] = fetchProbableLetters(index, polishSigns);
    });
    console.log(sortedArray);
    probableMappings = adjustMapping(probableMappings, singleLetterWords, sortedArray, req.body.knownLetters);
    // res.json("XDD");
    // return;
    while(n < 7) {
      computedWords = computedWords.concat(words.filter(word => word.length == n));
      while(computedWords.length >= 5) {
        done = await validateWords(computedWords, probableMappings, knownMappings);
        computedWords = computedWords.slice(5);
      }
      n += 1;
    }
    let knownMappingsWithProp = JSON.stringify(knownMappings, undefined, 1);
    for (var prop in knownMappings) {
      if (Object.prototype.hasOwnProperty.call(knownMappings, prop)) {
        let letters = knownMappings[prop].letters;
        let maxVal = 0;
        let res = '';
        for (var prop2 in letters) {
          if (Object.prototype.hasOwnProperty.call(letters, prop2)) {
            if(letters[prop2] > maxVal) {
              maxVal = letters[prop2];
              res = prop2;
            }
          }
        }
        knownMappings[prop] = res;
      }
    }
    console.log(knownMappings);
    res.render('resultCrypto', {
      title : `decoded text:`,
      sortedArray,
      polishSigns,
      singleLetterWords : singleLetterWords.split(""),
      result : decodeText(inputText, knownMappings),
      polishSingleLetters : singleChars.split(""),
      knownMappingsWithProp,
      route : "cryptogram"
    });
  }
});

let decodeText = (inputText, knownMappings) => {
  return inputText.split("").map(char => knownMappings[char] != null ? knownMappings[char] : char).join("");
}

let adjustMapping = (probableMappings, singleLetterWords, sortedArray, knownLetters) => {
  let singleCharsTemp = singleChars.split("");

  singleLetterWords.split("").forEach((item, i) => {
    if(singleChars.indexOf(probableMappings[item][0]) >= 0 && sortedArray.indexOf(item) == polishSigns.indexOf(probableMappings[item][0])) {
      probableMappings[item] = [probableMappings[item][0]];
      singleCharsTemp.splice(singleCharsTemp.indexOf(probableMappings[item][0]), 1);
    }
  })

  singleLetterWords.split("").forEach((item, i) => {
    for (var prop in probableMappings) {
      if (Object.prototype.hasOwnProperty.call(probableMappings, prop)) {
        if(singleLetterWords.indexOf(prop) < 0) {
          probableMappings[prop] = probableMappings[prop].filter(char => singleChars.indexOf(char) < 0);
        }
      }
    }
    let itemVal = probableMappings[item].filter(chr => singleCharsTemp.indexOf(chr) >= 0);
    if(itemVal != null && itemVal.length > 0) {
      console.log(itemVal);
      console.log(prop);
      if(itemVal.length == 1 && singleCharsTemp.indexOf(itemVal[0]) >= 0) {
        singleCharsTemp.splice(singleCharsTemp.indexOf(itemVal), 1);
        probableMappings[item] = [itemVal[0]];
      }
    }
  });

  singleLetterWords.split("").forEach((item, i) => {
    if(probableMappings[item].length > 1) {
      probableMappings[item] = probableMappings[item].filter(char => singleCharsTemp.indexOf(char) >= 0);
    }

    if(probableMappings[item].length == 0) {
      probableMappings[item] = singleCharsTemp;
    }
  });
  if(knownLetters != null) {
    let knownLettersStr = '';
    let knownLettersArr = [];
    knownLetters.split(",").forEach(data => {
      if(data.length == 2) {
        knownLettersStr += data[1];
        knownLettersArr.push({
          letter : data[0],
          val : data[1]
        })
      }
    });
    console.log(knownLettersArr);
    console.log(knownLettersStr);
    for (var prop in probableMappings) {
      if (Object.prototype.hasOwnProperty.call(probableMappings, prop)) {
        if(singleLetterWords.indexOf(prop) < 0) {
          probableMappings[prop] = probableMappings[prop].filter(char => knownLettersStr.indexOf(char) < 0);
        }
      }
    }
    knownLettersArr.forEach(data => {
      probableMappings[data.letter] = [data.val];
    });
  }
  // probableMappings['j'] = ['o'];
  // probableMappings['q'] = ['i'];
  // probableMappings['c'] = ['d'];
  // probableMappings['l'] = ['m'];
  // probableMappings['n'] = ['t'];
  // probableMappings['u'] = ['j'];
  // probableMappings['a'] = ['e'];
  // probableMappings['s'] = ['l'];
  // probableMappings['k'] = ['n'];
  // probableMappings['t'] = ['k'];
  // probableMappings['m'] = ['g'];
  // probableMappings['p'] = ['r'];
  // probableMappings['h'] = ['b'];
  // probableMappings['o'] = ['c'];
  // probableMappings['d'] = ['h'];
  // probableMappings['g'] = ['p'];
  // probableMappings['y'] = ['f'];
  console.log(probableMappings);
  return probableMappings;
}

let validateWords = async (computedWords, probableMappings, knownMappings) => {
  for(let i=0;i<5;i++) {
    let word = computedWords[i];
    let arrayOfProbableLetters = word.split("").map(letter => {
      return (knownMappings[letter] != null && knownMappings[letter].mostProbableLetter != null) ? [knownMappings[letter].mostProbableLetter] : probableMappings[letter]
    });
    await recursiveSearch(arrayOfProbableLetters, knownMappings, '', word.split(""));
  }
  return false;
}

let recursiveSearch = async (arrayOfProbableLetters, knownMappings, word, originalLetters) => {
  let letters = arrayOfProbableLetters[0];
  if(arrayOfProbableLetters.length == 0 || letters == null) {
    let knownWord = await nodehun.spell(capitalizeFirstLetter(word));
    if(knownWord) {
      word.split("").forEach((mappedLetter, index) => {
        knownMappings[originalLetters[index]] = knownMappings[originalLetters[index]] || { letters : {}};
        knownMappings[originalLetters[index]].letters[mappedLetter] = knownMappings[originalLetters[index]].letters[mappedLetter] || 0;
        knownMappings[originalLetters[index]].letters[mappedLetter] += 1;
        if(knownMappings[originalLetters[index]].letters[mappedLetter] >= 150) {
          knownMappings[originalLetters[index]].mostProbableLetter = mappedLetter;
        }
      });
    }
  } else {
    for(let i=0; i<letters.length; i++) {
      await recursiveSearch(arrayOfProbableLetters.slice(1), knownMappings, word + letters[i], originalLetters);
    }
  }

}

let fetchProbableLetters = (index, filteredPolishSigns) => {
  let minIndex = index - 5;
  let maxIndex = index + 5;
  while(maxIndex > filteredPolishSigns.length) {
    maxIndex -= 1;
    minIndex -= 1;
  }
  if(minIndex <0){
    minIndex = 0;
    maxIndex = 10;
  }
  return filteredPolishSigns.map((char, i) => {
    return {
      index : i,
      char
    }
  }).sort((a,b) => Math.abs(index-a.index) > Math.abs(index-b.index) ? 1 : -1).slice(0, 11).map(a => a.char);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

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
  if(str == null || str == "" || str.split("").filter(character => !isValid(character, signsToCheck)).length > 0){
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
