# mzek-poirot

A file integrity and entropy monitoring tool.

## install

```sh

npm i mzek-poirot -g

```

## usage

Obtain a list of files...

```sh

find / -type f > files.csv
poirot --update files.csv
poirot --check --entropy

```

## licence

MIT


