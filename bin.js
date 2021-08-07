#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var { read, write } = require('pull-files')
var { createHash } = require('crypto')
var pull = require('pull-stream')
var mkdirp = require('mkdirp')
var Poirot = require('.')
var os = require('os')
var fs = require('fs')
var recursive = require("recursive-readdir")

var instructions = `

  mzek-poirot
    usage:
      poirot --update --files ./files.json
      poirot --update :: generates the file hashes db
      poirot --check  :: checks the file db for changes
      poirot --watch :: watch for changes
      poirot --readdir :: print folder contents recursively
      poirot --readdir --save :: save the file to disk

`

if (Object.keys(argv).length < 2) return console.log(instructions)

var files = []
if (argv.files) files = JSON.parse(fs.readFileSync(argv.files).toString())

if (argv.update) {
var files_found = []
var files_missing = []
files.forEach(function (path) {
  try {
    var x = fs.statSync(path)
    if (typeof x === 'object') files_found.push(path)
    } catch (e) { files_missing.push(path) }
  })
  var poirot = Poirot(files_found)
  console.log('found ', files_found)
  console.log('missing ', files_missing)
  poirot.update(function () {
    console.log('created db at ', poirot.db_path)
  })
} else if (argv.check) {
  var poirot = Poirot([])
  poirot.check(function (err, result) {
    if (!err) console.log(result.length, ' files changed ', result)
      else throw err
  })
} else if (argv.watch) {
  var poirot = Poirot([])
  poirot.watch(function () {
    poirot.ev.on('change', console.log)
  })
} else if (argv.readdir) {
  recursive(process.cwd()).then(function (data) {
    var path = process.cwd()+'/mzek-'+Date.now()+'-files.list.json'
    if (argv.save) fs.writeFileSync(path, JSON.stringify(data, void 0, 2))
      else console.log('> ', data)
  }).catch(console.log)

/*, function (err, files) {
    if (!err) console.log(files)
      else console.log(err)
  })*/
}
