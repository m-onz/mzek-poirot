var EventEmitter = require('events').EventEmitter
var { read, write } = require('pull-files')
var { createHash } = require('crypto')
var paramap = require('pull-paramap')
var watch = require('pull-watch')
var pull = require('pull-stream')
var mkdirp = require('mkdirp')
var util = require('util')
var os = require('os')
var fs = require('fs')

function sha256sum (input) {
  var hash = createHash('sha256')
  hash.update(input)
  return hash.digest('hex')
}

function Poirot (files) {
  if (! (this instanceof Poirot)) return new Poirot (files)
  if (! Array.isArray(files)) throw Error('files must be an array')
  this.files = Object.assign([], files)
  this.poirot_dir = `${os.homedir()}/.poirot`
  this.db_path = `${this.poirot_dir}/files.db.json`
  console.log(this.db_path)
  mkdirp.sync(this.poirot_dir)
}

util.inherits(Poirot, EventEmitter)

Poirot.prototype.sha256sum = sha256sum

Poirot.prototype.update = function (cb) {
  var self = this
  if (typeof cb !== 'function') throw Error('needs a callback')
  console.log('using... ', self.files)
  pull(
      read(self.files),
      paramap(function (i, cb) {
	if (!i) return cb(void 0, i)
        i.digest = sha256sum(Buffer.from(i.data))
        if (i.base) i.full_path = `${i.base}/${i.path}`
          else i.full_path = i.path
        delete i.data
        delete i.path
        delete i.base
        console.log('added ', i.full_path)
        cb(void 0, i)
      }),
      pull.collect(function (err, file) {
        if (!err) {
          fs.writeFileSync(
            self.db_path,
            JSON.stringify(file, void 0, 2)
          )
          if (typeof cb === 'function') cb(void 0, true)
        } else { if (typeof cb === 'function') cb(err); }
      })
    )
}

Poirot.prototype.check = function (cb) {
  var self = this
  var matches = []
  if (typeof cb !== 'function') throw Error('needs a callback')
  var files = JSON.parse(fs.readFileSync(self.db_path).toString())
  pull(
    pull.values(files),
    paramap(function (i, cb) {
      try {
        var file = fs.readFileSync(i.full_path)
        var hash = sha256sum(file)
        if (i.digest === hash) i.matches = true
          else i.matches = false
        } catch (e) {}
      cb(void 0, i)
    }),
    pull.collect(function (err, file) {
      if (!err) cb (null, file.filter(function (i) { return !i.matches }))
        else cb (err)
    })
  )
}

Poirot.prototype.watch  = function (cb) {
  if (typeof cb !== 'function') throw Error('needs a callback')
  var self = this
  var files = JSON.parse(fs.readFileSync(self.db_path).toString())
  console.log(files.map(function (i) { return i.full_path }))
  self.watcher = watch(files.map(function (i) { return i.full_path }))
  pull(
    self.watcher.listen(),
    pull.drain(function (event) {
      files.forEach(function (file) {
        if (file.full_path === event.path) {
          var contents = fs.readFileSync(event.path).toString()
          var hash = sha256sum(contents)
          if (hash !== file.digest) self.emit('change', {
            path: event.path,
            contents: contents.split('\n').filter(function (i) { return i.length; })
          })
        }
      })
    }, function (err) {
      self.watcher.end()
    })
  )
  cb(null, true)
}

Poirot.prototype.unwatch = function (cb) {
  var self = this
  if (typeof self.watcher === 'object') self.watcher.end()
  if (typeof cb === 'function') cb(null, true)
}

module.exports = Poirot;
