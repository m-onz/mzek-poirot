
var toPull = require('stream-to-pull-stream')
var entropy = require('binary-shannon-entropy')
var pull = require('pull-stream')
var crypto = require('crypto')
var path = require('path')
var fs = require('fs')

function Poirot (options) {
  if (! (this instanceof Poirot)) return new Poirot (options)
  this.defaults = {
    excluded: [],
    output: path.normalize(process.cwd()+'/db.csv'),
    algo: 'BLAKE2s256'
  }
  this.options = Object.assign(this.defaults, options)
}

function checkExcludes (path, excluded) {
  var exclude = false
  excluded.forEach(function (i) {
    if (path.startsWith(i)) exclude = true
  })
  return exclude
}

Poirot.prototype.update = function (readStream) {
  var self = this
  return self.scanFromCSV(readStream, function (i, cb) {
    if (typeof i !== 'string' || !i.length) return cb(null, {message:'skipped'})
    if (i && checkExcludes(i, self.options.excluded)) return cb(null, {message:'skipping excluded path'})
    var hash = crypto.createHash(self.options.algo).setEncoding('hex')
    var f = fs.createReadStream(i)
    var entropyScore = 0
    var recentHighest = 0
    var count = 0
    f.on('data', function (d) {
      var e = entropy(d)
      if (e > recentHighest) recentHighest = e
      entropyScore += e;
      count++;
    })
    f.on('error', function () { cb(null, { skipped: true, path: i }) })
    f.pipe(hash).once('finish', () => {
      var digest = hash.read()
      entropyScore = entropyScore / count
      if (isNaN(entropyScore)) entropyScore = 0
      cb(null, {
        path: i,
        digest: digest,
        entropy: {
          average: parseFloat(entropyScore.toFixed(2)),
          max: parseFloat(recentHighest.toFixed(2))
        }
      })
    })
  })
}

Poirot.prototype.check = function (readStream) {
  var self = this
  return self.scanFromCSV(readStream, function (i, cb) {
    var segment = i.split(',')
    var file    = segment [0]
    var digest  = segment [1]
    var oldEntropyAvg = segment [2]
    var oldMaxEntropy = segment [3]
    if (!digest || !file || digest.length !== 64) {
      return cb(null, { skipped: true, path: file })
    }
    var hash = crypto.createHash(self.options.algo).setEncoding('hex')
    var f = fs.createReadStream(file)
    var latestEntropyScore = 0
    var recentHighest = 0
    var count = 0
    f.on('data', function (d) {
      var e = entropy(d)
      if (e > recentHighest) recentHighest = e
      latestEntropyScore += e;
      count++;
    })
    f.on('error', function () { cb(null, { skipped: true }) })
    f.pipe(hash).once('finish', function () {
      var latest = hash.read()
      var latestEntropy = latestEntropyScore / count
      if (isNaN(latestEntropy)) latestEntropy = 0
      cb(null, {
        path: file,
        digest: latest,
        matches: digest === latest,
        entropy: {
          average: parseFloat(latestEntropy.toFixed(2)),
          max: parseFloat(recentHighest.toFixed(2)),
          increased: (latestEntropy > oldEntropyAvg || recentHighest > oldMaxEntropy)
        }
      })
    })
  })
}

Poirot.prototype.scanFromCSV = function (readStream, cb) {
  return pull(
    toPull.source(readStream),
    pull.map(function (i, cb) {
      return i.toString().split('\n')
    }),
    pull.flatten(),
    pull.filter(function (i) { return i.length; }),
    pull.asyncMap(cb)
  )
}

module.exports = Poirot
