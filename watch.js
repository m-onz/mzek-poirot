var pull = require('pull-stream')
var watch = require('pull-watch')

var watcher = watch(['/home/monz/Desktop/test.txt', '/home/monz/Desktop/test2.txt'])

pull(
  watcher.listen(),
  pull.drain(function (event) {
    console.log('event', event)
  }, function (err) {
     console.log(err)
     watcher.end()
  })
)
