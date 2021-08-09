#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var toPull = require('stream-to-pull-stream')
var paramap = require('pull-paramap')
var pull = require('pull-stream')
var crypto = require('crypto')
var path = require('path')
var fs = require('fs')

function sha256sum (input) {
  var hash = crypto.createHash('sha256')
  hash.update(input)
  return hash.digest('hex')
}

var instructions = `

  mzek-poirot

    poirot --update ./files.csv --output ./db.csv
    poirot --check ./db.csv

`

if (Object.keys(argv).length < 2) return console.log(instructions)
// check
if (argv.check) {
var files = path.normalize(argv.check)
pull(
  toPull.source(fs.createReadStream(files)),
  pull.map(function (i, cb) {
    return i.toString().split('\n')
  }),
  pull.flatten(),
  paramap(function (i, cb) {
    var segment = i.split(',')
    var file = segment[0]
    var digest = segment[1]
    if (!digest || !file || digest.length !== 64) return cb(null, { skipped: true })
    fs.readFile(file, function (err, data) {
      if (data) cb(null, { path: file, matches: sha256sum(data) === digest, digest: digest })
        else cb(null, { skipped: true })
    })
  }),
  pull.filter(function (i) {
    return !i.matches && !i.skipped
  }),
  pull.drain(function (i) { console.log(i.path); })
)} else if (argv.update) {
var files = path.normalize(argv.update)
var output = path.normalize(process.cwd()+'/db.csv')
if (argv.output) output = path.normalize(argv.output)
pull(
  toPull.source(fs.createReadStream(files)),
  pull.map(function (i, cb) {
    return i.toString().split('\n')
  }),
  pull.flatten(),
  paramap(function (i, cb) {
    if (typeof i !== 'string') return cb(null, 'must be a string')
    if (i && i.startsWith('/proc')) return cb(null, 'skipping /proc')
    if (i && i.startsWith('/boot')) return cb(null, 'skipping /boot')
    if (i && i.startsWith('/sys')) return cb(null, 'skipping /sys')
    fs.readFile(i, function (err, data) {
      if (err) { return console.log(err); cb(null, err) }
      var line = `${i},${sha256sum(data)}\n`
      fs.appendFile(output, line, function (err) {
        if (err) return cb(null. err)
        cb(null, line)
      })
    })
    cb(null, i)
  }),
  pull.drain(console.log)
)}

// ...
