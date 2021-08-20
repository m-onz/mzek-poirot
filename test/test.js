
// todo use tape and add unit tests

var fs = require('fs')
var path = require('path')
var pull = require('pull-stream')
var test = require('tape')
var Poirot = require('..')

test('Poirot.update', function (t) {
  t.plan(3)
  fs.writeFileSync('./files.csv', __dirname+'/test.txt\n')
  fs.writeFileSync(__dirname+'/test.txt', 'hello123')
  var poirot = Poirot()
  var f = fs.createReadStream('./files.csv')
  pull(
    poirot.update(f),
    pull.collect(function (err, result) {
      if (err) t.ok(false)
      var r = result[0]
      t.ok(r.hasOwnProperty('path') && typeof r.path === 'string')
      t.ok(r.hasOwnProperty('digest') && typeof r.digest === 'string')
      t.ok(r.hasOwnProperty('entropy') && typeof r.entropy === 'object')
      var obj = r
      console.log(obj)
      var line = `${obj.path},${obj.digest},${obj.entropy.average},${obj.entropy.max}\n`
      fs.writeFileSync(__dirname+'/db.csv', line)
    })
  )
})

test('Poirot.check', function (t) {
  t.plan(3)
  var poirot = Poirot()
  fs.writeFileSync(__dirname+'/test.txt', 'file_changed!')
  var f = fs.createReadStream(__dirname+'/db.csv')
  pull(
    poirot.check(f),
    pull.collect(function (e, result) {
      if (e) { console.log(e); t.ok(false); }
      console.log(result)
      var r = result[0]
      t.ok(r.hasOwnProperty('path'))
      t.ok(r.hasOwnProperty('digest'))
      t.ok(r.hasOwnProperty('entropy'))
      fs.unlinkSync(process.cwd()+'/files.csv')
    })
  )
})
