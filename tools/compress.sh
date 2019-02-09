#!/usr/bin/env bash


folder="./public/scripts"
files=$(ls $folder | grep ".js")

for f in $files; do
	name=$(echo "$f" | awk -F. '{print $1}')
	echo "Uglifying: $name > ${name}.min.js"
	uglifyjs "${folder}/${f}" > "${folder}/min/${name}.min.js"
done


folder="./public/style"
sass "$folder/main.scss" "./public/style.out.css"
rm "$temp"
#echo "Done"
