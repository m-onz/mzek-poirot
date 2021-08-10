#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))
var toPull = require('stream-to-pull-stream')
var paramap = require('pull-paramap')
var pull = require('pull-stream')
var crypto = require('crypto')
var path = require('path')
var fs = require('fs')

var instructions = `

    poirot - file integrity checking tool (sha256 hash)

    find / -type f > files.csv
    poirot --update files.csv
    poirot --check

    poirot --update files.csv --output=custom.named.db.csv
    poirot --check custom.named.db.csv

    credits: mzek-poirot. m-onz@mzek 2021.

`

if (Object.keys(argv).length < 2) return console.log(instructions)
// check
if (argv.check) {
if (typeof argv.check !== 'string') argv.check = `${process.cwd()}/db.csv`
var files = path.normalize(argv.check)
console.log('checking ', files)
pull(
  toPull.source(fs.createReadStream(files)),
  pull.map(function (i, cb) {
    return i.toString().split('\n')
  }),
  pull.flatten(),
  pull.asyncMap(function (i, cb) {
    var segment = i.split(',')
    var file    = segment[0]
    var digest  = segment[1]
    if (!digest || !file || digest.length !== 64) return cb(null, { skipped: true, path: file })
    var hash = crypto.createHash('sha256').setEncoding('hex')
    var f = fs.createReadStream(file)
    f.on('error', function () { cb(null, { skipped: true }) })
    f.pipe(hash).once('finish', function () {
      var latest = hash.read()
      cb(null, { path: file, digest: latest, matches: digest === latest })
    })
  }),
  pull.filter(function (i) {
    return !i.matches && !i.skipped
  }),
  pull.drain(function (i) { console.log(i.path); })
)} else if (argv.update) {
// update
var files = path.normalize(argv.update)
var output = path.normalize(process.cwd()+'/db.csv')
if (argv.output) output = path.normalize(argv.output)
console.log('checking ', files)
pull(
  toPull.source(fs.createReadStream(files)),
  pull.map(function (i, cb) {
    return i.toString().split('\n')
  }),
  pull.flatten(),
  pull.asyncMap(function (i, cb) {
    if (typeof i !== 'string') return cb(null, 'must be a string')
    if (i && i.startsWith('/proc')) return cb(null, 'skipping /proc')
    if (i && i.startsWith('/boot')) return cb(null, 'skipping /boot')
    if (i && i.startsWith('/sys')) return cb(null, 'skipping /sys')
    var hash = crypto.createHash('sha256').setEncoding('hex')
    var f = fs.createReadStream(i)
    f.on('error', function () { cb(null, { skipped: true, path: i }) })
    f.pipe(hash).once('finish', function () {
      var digest = hash.read()
      var line = `${i},${digest}\n`
      fs.appendFile(output, line, function (err) {
        if (err) return cb(null. err)
        cb(null, line)
      })
    })
  }),
  pull.drain(function () {})
)}

// ...
