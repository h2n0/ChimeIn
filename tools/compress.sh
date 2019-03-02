#!/usr/bin/env bash

echo "Running build script"
folder="./public/scripts"
files=$(ls $folder | grep ".js")
for f in $files; do
	name=$(echo "$f" | awk -F. '{print $1}')
	echo "Uglifying: $name > ${name}.min.js"
	uglifyjs "${folder}/${f}" > "${folder}/min/${name}.min.js"
done
folder="./public/style"

printf "Compiling CSS... "
sass "$folder/main.scss" "./public/style.out.css" > /dev/null
if [ $? -eq 0 ]; then
	printf "Done"
else
	printf "Failed!"
fi
printf "\n"
echo "Done"
