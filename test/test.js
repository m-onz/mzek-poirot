var fs = require('fs')
var os = require('os')
var test = require('tape')
var Poirot = require('..')

var mock = [
  `${__dirname}/data/test_1.txt`,
  `${__dirname}/data/test_2.txt`,
  `${__dirname}/data/test_3.txt`,
  `${__dirname}/data/test_4.txt`,
]

test('can create Poirot', function (t) {
  t.plan(1)
  var p = Poirot (mock)
  t.ok(typeof p === 'object')
})

test('can import files', function (t) {
  t.plan(1)
  var p = Poirot (mock)
  t.ok(Array.isArray(p.files))
})

test('can update the files integrity db', function (t) {
  var p = Poirot (mock)
  t.plan(p.files.length)
  p.update()
  var filesDB = JSON.parse(
    fs.readFileSync(os.homedir()+'/.poirot/files.db.json').toString()
  )
  console.log(filesDB)
  filesDB.forEach(function (i, index) {
    var path = mock[index].base+'/'+mock[index].pattern
    if (i.digest === p.sha256sum(fs.readFileSync(path).toString())) {
      console.log('imported ', path, ' and integrity check passes')
      t.ok(true)
    }
  })
})

test('can check the files integrity', function (t) {
  t.plan(1)
  t.ok(false)
})

/*
test('check ', function (t) {
  t.plan(1)
  t.ok(true)
})
*/
