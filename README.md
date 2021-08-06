# mzek-poirot

A simple ile integrity checking tool.

## progress

* POC tool working
* in development

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

## todo

* integrate IOC checks
* add alerts on telemetry data
* more file analysis checks
* split into library and cli tool (allow library usage)
* better configuration (allow users to specify files to check)
* watch files in real time
* run as a daemon & integrate with mzek p2p log host system
* allow client / server modes

