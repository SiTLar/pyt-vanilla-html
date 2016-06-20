#!/bin/bash
while getopts ":d:b:p:" opt; do
	case $opt in
	d)
		dest=$OPTARG
		;;
	b)
		backup=$OPTARG
		;;
	p)	
		SRVPATH=$OPTARG
		;;
	esac
done
if [ -z $dest ]
then
	echo "Deploy destenation should be set"
	echo "usage: $0 -d dest_dir [-b backup_dir] [-p path_on_server]"
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
if [ $SRVPATH ]
then
	echo "Will serve from $SRVPATH"
else
	echo "Will serve from /"
fi
dir=`mktemp -d`
git clone -b master . $dir
cd $dir
npm install
./node_modules/.bin/webpack --config config.js --define ___BUILD___=\"stable_`git log -n 1 --oneline |awk '{ print $1 }'`\"

for file in $(ls *.js *.css *.json); do
	MD5=`md5sum $file|awk '{ print $1 }'`
	sed -i -e "s/\(.*$file?md5=\)\w*\"/\1$MD5\"/" index.htm
done
if [ $SRVPATH ]
then
	sed -i -e "s?/s/?$SRVPATH/s/?" index.htm
fi
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
