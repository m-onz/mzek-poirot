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
poirot --update ./files.csv --output db.csv
```

This file looks like this..

```csv
/home/computer/.node_repl_history,67bb4496d74e7924c86fb49cdb034aeb22e7080a7cb65b163ad76cafb77efea2
/home/computer/.gitconfig,ef1c6b7a311cbb1103c3608d082f2bb97a70be20dc298fb08a5eec74c524d1c8
/home/computer/.npmrc,aa9bc9412604d87b671d2e929e0acac3590d56e378c42f0ecca9ee7941a675aa
```

With the absolute file path and sha256 digest in csv format.

# check the db for changes

```sh

time poirot --check ./db.csv

```

# generating the db using bash

You can create the db csv using any method you choose for example...
using `./examples/gen_file_db.sh`

## licence

MIT


