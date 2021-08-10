#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2))
var toPull = require('stream-to-pull-stream')
var cliSpinners = require('cli-spinners')
var spinners = Object.keys(cliSpinners)
var pull = require('pull-stream')
var crypto = require('crypto')
var path = require('path')
var ora = require('ora')
var fs = require('fs')

var algo = 'BLAKE2s256'

var instructions = `

    poirot - file integrity checking tool

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
var count = 0
var _random_spinner = spinners[parseInt(Math.random()*spinners.length)]
var spinner = ora({ spinner: _random_spinner }).start()
var report_path = path.normalize(`${process.cwd()}/poirot-report-${new Date().toISOString()}.log`)
if (argv.output) report_path = argv.output
console.log('saving log to ', report_path)
var f = fs.createReadStream(files)
f.on('close', function () {
  process.nextTick(function () {
    spinner.stop()
  })
})
pull(
  toPull.source(f),
  pull.map(function (i, cb) {
    return i.toString().split('\n')
  }),
  pull.flatten(),
  pull.asyncMap(function (i, cb) {
    var segment = i.split(',')
    var file    = segment[0]
    var digest  = segment[1]
    if (!digest || !file || digest.length !== 64) return cb(null, { skipped: true, path: file })
    var hash = crypto.createHash(algo).setEncoding('hex')
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
  pull.drain(function (i) {
    spinner.text = 'Found '+count++;
    fs.appendFile(report_path, `${i.path}\n`, function () {})
  })
)
} else if (argv.update) {
// update
var count = 0
var files = path.normalize(argv.update)
var output = path.normalize(process.cwd()+'/db.csv')
if (argv.output) output = path.normalize(argv.output)
console.log('checking ', files)
console.log('saving file db to ', output)
var _random_spinner = spinners[parseInt(Math.random()*spinners.length)]
var spinner = ora({ spinner: _random_spinner }).start()
var f = fs.createReadStream(files)
f.on('close', function () {
  process.nextTick(function () {
    spinner.stop()
  })
})
pull(
  toPull.source(f),
  pull.map(function (i, cb) {
    return i.toString().split('\n')
  }),
  pull.flatten(),
  pull.asyncMap(function (i, cb) {
    if (typeof i !== 'string') return cb(null, 'must be a string')
    if (i && i.startsWith('/proc')) return cb(null, 'skipping /proc')
    if (i && i.startsWith('/boot')) return cb(null, 'skipping /boot')
    if (i && i.startsWith('/sys')) return cb(null, 'skipping /sys')
    var hash = crypto.createHash(algo).setEncoding('hex')
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
  pull.drain(function () {
    spinner.text = (count++)+' files added'
  })
)}

// ...

