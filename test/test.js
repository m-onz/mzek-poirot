var fs = require('fs')
var os = require('os')
var test = require('tape')
var Poirot = require('..')

var mock = [
  `${__dirname}/data/test_1.txt`,
]

try {
  fs.writeFileSync(os.homedir()+'/.poirot/files.db.json', '[]')
} catch(e){}

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
  p.update(function (err) {
  var filesDB = JSON.parse(
    fs.readFileSync(os.homedir()+'/.poirot/files.db.json').toString()
  )
  console.log(filesDB)
  filesDB.forEach(function (i, index) {
    if (i.digest === p.sha256sum(fs.readFileSync(i.full_path).toString())) {
      console.log('imported ', i.full_path, ' and integrity check passes')
      t.ok(true)
    }
  })
  })
})

test('can check the files integrity', function (t) {
  t.plan(1)
  var p = Poirot(mock)
  p.update(function () {
    fs.appendFileSync(__dirname+'/data/test_1.txt', 'test\n')
    p.check(function (err, results) {
      if (!err) console.log('.... ', results)
      t.ok(!err && results.length)
    })
  })
})

test('can monitor files', function (t) {
  t.plan(2)
  var p = Poirot(mock)
  p.update(function (err) {
    t.ok(!err)
    p.watch(function () {
      p.ev.on('change', function () {
        console.log('change detected '); t.ok(true);
        process.nextTick(function () { p.unwatch() })
      })
      setTimeout(function () {
        fs.appendFileSync(__dirname+'/data/test_1.txt', 'test\n')
      }, 11)
    })
  })
})
