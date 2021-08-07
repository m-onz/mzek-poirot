
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
  this.files = files
  this.poirot_dir = `${os.homedir()}/.poirot`
  mkdirp.sync(this.poirot_dir)
}

Poirot.prototype.sha256sum = sha256sum

Poirot.prototype.update = function (cb) {
  var self = this
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
            `${self.poirot_dir}/files.db.json`,
            JSON.stringify(file, void 0, 2)
          )
          if (typeof cb === 'function') cb(void 0, true)
        } else { if (typeof cb === 'function') cb(err); }
      })
    )
}

Poirot.prototype.check  = function () {}
Poirot.prototype.watch  = function () {}

module.exports = Poirot;
