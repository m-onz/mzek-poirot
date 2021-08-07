# mzek-poirot

A simple file integrity monitoring tool (like aide or tripwire).

## install

A global command line tool

```sh
npm i mzek-poirot -g
```

of as a libray

```sh
npm i mzek-poirot --save
```

```js

var Poirot = require('mzek-poirot')([ 'helloWorld.txt' ])

Poirot.update(console.log)

fs.appendFileSync('./helloWorld.txt', 'test\n')

Poirot.check(console.log)

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
