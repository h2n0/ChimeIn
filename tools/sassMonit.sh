#!/usr/bin/env bash
folder="./public/style"
sass --watch "${folder}/main.scss:${folder}/out.css"
