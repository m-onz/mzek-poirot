# mzek-poirot

A file integrity monitoring tool (like aide or tripwire).

## install

```sh
npm i mzek-poirot -g
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
