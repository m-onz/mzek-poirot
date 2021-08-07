# mzek-poirot

A simple file integrity monitoring tool (like aide or tripwire).

## install

A global command line tool

```sh
npm i mzek-poirot -g
```

of as a library

```sh
npm i mzek-poirot --save
```

```js

var Poirot = require('mzek-poirot')([ 'helloWorld.txt' ])

Poirot.update(console.log)

fs.appendFileSync('./helloWorld.txt', 'test\n')

Poirot.check(function () {
  Poirot.watch(function () {
    Poirot.ev.on('change', function (message) {
      console.log(message)
      Poirot.unwatch()
    })
  })
})

```

## run the tests

```sh
npm run test
```

## usage

Update the file database hashes

```sh

poirot --update

```

Check if any of the files have been changed

```sh

poirot --check

```

watch continuously

```sh

poirot --watch

```
