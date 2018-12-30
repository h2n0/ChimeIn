#!/usr/bin/env bash
cd tools 2> /dev/null
folder="../public/scripts"
files=$(ls $folder | grep ".js")
for f in $files; do
	name=$(echo "$f" | awk -F. '{print $1}')
	echo "Uglifying: $name"
	uglifyjs "${folder}/${f}" > "${folder}/min/${name}.min.js"
done
echo "Done"
