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

var Poirot = require('.')

var algo = 'BLAKE2s256'

var instructions = `

    poirot

    description:
      file integriry monitoring

       --update
         create a db file (in csv format) from a csv of file paths

       --check
         check the db file for changes

       --entropy
         show entropy increases in check report output

       --output
         change default output names

    help:
      generate a files list using find
      find / -type f > files.csv

    credits:
      mzek 2021.

`

if (Object.keys(argv).length < 2) return console.log(instructions)

// check
//
if (argv.check) {
  if (typeof argv.check !== 'string') argv.check = `${process.cwd()}/db.csv`
  var files = path.normalize(argv.check)
  var poirot = Poirot({ output: files })
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
    poirot.check(f),
    pull.filter(function (i) {
      return !i.matches && !i.skipped
    }),
    pull.drain(function (i) {
      spinner.text = 'Found '+count++;
      var data = ''
      console.log(i)
      if (argv.entropy) data = `${i.path},${i.entropy.increased}\n`
        else data = `${i.path}\n`
      fs.appendFile(report_path, data, function () {})
    })
  )

} else if (argv.update) {
  // update
  //
  var count = 0
  var files = path.normalize(argv.update)
  var output = path.normalize(process.cwd()+'/db.csv')
  if (argv.output) output = path.normalize(argv.output)
  var poirot = Poirot({ output })
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
    poirot.update(f),
    pull.drain(function (obj) {
      if (!obj.hasOwnProperty('entropy')) return;
      var line = `${obj.path},${obj.digest},${obj.entropy.average},${obj.entropy.max}\n`
      fs.appendFile(poirot.options.output, line, (err) => {
        if (!err) spinner.text = (count++)+' files added'
          else spinner.text = `Error found in ${obj.path}`
      })
    })
  )
}

// ...

