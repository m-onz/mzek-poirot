
var os = require('os')
var fs = require('fs')
var pull = require('pull-stream')
var { read, write } = require('pull-files')
var { createHash } = require('crypto')
var mkdirp = require('mkdirp')

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

Poirot.prototype.sha256sum = sha256sum

Poirot.prototype.update = function (cb) {
  var self = this
  if (typeof cb !== 'function') throw Error('needs a callback')
  console.log('using... ', self.files)
  pull(
      read(self.files),
      pull.through(function (i) {
	if (!i) return i
        i.digest = sha256sum(Buffer.from(i.data))
        if (i.base) i.full_path = `${i.base}/${i.path}`
          else i.full_path = i.path
        delete i.data
        delete i.path
        delete i.base
        return i
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
    pull.through(function (i) {
      try {
        var file = fs.readFileSync(i.full_path)
        var hash = sha256sum(file)
        if (i.digest === hash) i.matches = true
          else i.matches = false
        } catch (e) {}
      return i
    }),
    pull.collect(function (err, file) {
      if (!err) cb (null, file.filter(function (i) { return !i.matches }))
        else cb (err)
    })
  )
}

Poirot.prototype.watch  = function () {}

module.exports = Poirot;
