#!/bin/bash
for file in $(ls *.js *.css *.json); do
	MD5=`md5sum $file|awk '{ print $1 }'`
	sed -i -e "s/\(.*$file?md5=\)\w*\"/\1$MD5\"/" index.htm
done
