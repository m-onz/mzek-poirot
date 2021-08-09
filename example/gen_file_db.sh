#!/bin/bash

echo "obtaining files list"

find / -type f > ./.file.log

echo "creating digests"

touch output.csv

while IFS= read -r line; do
  read -r digest rest <<<"$(sha256sum  $line)"
  case $line in
    *"/proc/"*)
    break
  ;;
  esac
  #printf "%s::$digest\n" "$line"
  echo "$line,$digest" >> ./db.csv
done < ./.file.log

rm ./.file.log

echo "created ./db.csv"

