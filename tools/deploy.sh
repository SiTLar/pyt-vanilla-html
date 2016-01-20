#!/bin/bash
while getopts ":d:b:" opt; do
	case $opt in
	d)
		dest=$OPTARG
		;;
	b)
		backup=$OPTARG
		;;
	esac
done
if [ -z $dest ]
then
	echo "Deploy destenation should be set"
	echo "usage: $0 -d dest_dir [-b backup_dir]"
	exit 1;
fi
if [ ! -d $dest ]
then
	mkdir $dest
fi

echo "Will deploy to $dest"
if [ $backup ]
then
	echo "Will backup to $backup"
fi
dir=`mktemp -d`
git clone -b master . $dir
cd $dir
npm install
./node_modules/.bin/webpack --config config.js

for file in $(ls *.js *.css *.json); do
	MD5=`md5sum $file|awk '{ print $1 }'`
	sed -i -e "s/\(.*$file?md5=\)\w*\"/\1$MD5\"/" index.htm
done
if [ $backup ] 
then
	if [ ! -d $backup]
	then
		mkdir $backup
	fi
	cp -f $dest/*  $backup
fi

cat release.lst | xargs -l -i  cp -f "{}" $dest

cd /tmp
rm -rf $dir
