#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var os = require('os')
var fs = require('fs')
var pull = require('pull-stream')
var { read, write } = require('pull-files')
var { createHash } = require('crypto')
var mkdirp = require('mkdirp')

var instructions = `

  poirot

    usage:

      --update :: generates the file hashes saving to ~/.poirot/files.db.json
      --check  :: checks the file db for changes

`

if (Object.keys(argv).length < 2) return console.log(instructions)

function sha256sum (input) {
  var hash = createHash('sha256')
  hash.update(input);
  return hash.digest('hex')
}

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
      //'/etc/shadow',
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

    console.log('found ', files_found)
    console.log('missing ', files_missing)
    try { mkdirp.sync(os.homedir()+'/.poirot') } catch (e) {}
    pull(
      read(files_found),
      pull.through(function (i) {
        i.digest = sha256sum(Buffer.from(i.data))
        if (i.base) i.full_path = i.base+'/'+i.path
          else i.full_path = i.path
        delete i.data
        delete i.path
        delete i.base
        return i
      }),
      pull.collect((err, file) => {
        console.log('generated files db ', os.homedir()+'/.poirot/files.db.json')
        if (!err) fs.writeFileSync(os.homedir()+'/.poirot/files.db.json', JSON.stringify(file, void 0, 2))
          else console.log(err)
      })
    )
} else if (argv.check) {
  var files = JSON.parse(fs.readFileSync(os.homedir()+'/.poirot/files.db.json').toString())
  pull(
    pull.values(files),
    pull.through(function (i) {
      try {
      var file = fs.readFileSync(i.full_path)
      var hash = sha256sum(file)
      if (i.digest === hash) i.matches = true
        else i.matches = false
      } catch (e) {}
      return i
    }),
    pull.collect((err, file) => {
      if (!err) console.log('files changed ', file.filter(function (i) { return !i.matches }))
        else console.log(err)
    })
  )
}
