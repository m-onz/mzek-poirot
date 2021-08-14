
// todo use tape and add unit tests

var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var Poirot = require('.')()

var path = path.normalize('./files.log')
var readStream = fs.createReadStream(path)

/*
pull(
  Poirot.scanFromCSV(readStream, function (line, cb) {
   cb(null, line)
  }),
  pull.drain(console.log)
)
*/

/*
pull(
  Poirot.update(fs.createReadStream('./files.csv')),
  pull.filter(function (i) {
    if (i.hasOwnProperty('entropy')) {
      return i.entropy.max === 8 && i.entropy.average === 8
    }
  }),
  pull.drain(console.log)
)
*/


pull(
  Poirot.check(fs.createReadStream('./db.csv')),
  pull.drain(console.log)
)

