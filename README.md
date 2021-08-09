# mzek-poirot

A file integrity monitoring tool (using sha256).

## install

A global command line tool

```sh

npm i mzek-poirot -g

```

Obtain a list of files...

```sh

find / -type f > ./files.csv

```

## usage

``sh

poirot --update ./files.csv --output ./db.csv
time poirot --check ./db.csv
```

It can check 170000 files in around 30 seconds on my computer

## licence

MIT


