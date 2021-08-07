#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var os = require('os')
var fs = require('fs')
var pull = require('pull-stream')
var { read, write } = require('pull-files')
var { createHash } = require('crypto')
var mkdirp = require('mkdirp')
var Poirot = require('.')

var instructions = `

  mzek-poirot

    usage:

      poirot --update :: generates the file hashes saving to ~/.poirot/files.db.json
      poirot --check  :: checks the file db for changes

`

if (Object.keys(argv).length < 2) return console.log(instructions)

if (argv.update) {
    var files = [
      os.homedir()+'/.bash_logout',
      os.homedir()+'/.bash_profile',
      os.homedir()+'/.bashrc',
      '/etc/aliases',
      '/etc/hosts.deny',
      '/etc/hosts.allow',
      '/etc/inittab',
      '/etc/issue',
      '/etc/mtab',
      '/etc/passwd',
      '/etc/group',
      '/etc/fstab',
      '/etc/hosts',
      '/etc/modules.conf',
      '/etc/resolv.conf',
    ]
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
}
