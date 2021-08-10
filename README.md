# mzek-poirot

A file integrity monitoring tool (using sha256).

## install

A global command line tool

```sh

npm i mzek-poirot -g

poirot

```

## usage

Obtain a list of files...

```sh

find / -type f > ./files.csv

```

## create a file db

turn this into a db file with...

```sh
poirot --update ./files.csv
```

This creates a db.csv with file,digest on each line (csv format basically)...

```csv
/home/computer/.node_repl_history,67bb4496d74e7924c86fb49cdb034aeb22e7080a7cb65b163ad76cafb77efea2
```

With the absolute file path and sha256 digest in csv format.

## check the db for changes

```sh

time poirot --check

```

## licence

MIT


