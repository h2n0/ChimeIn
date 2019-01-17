#!/usr/bin/env bash

cd ~/ChimeIn
mv ./backend/config.js ~/
cd ~/
rm -Rf ChimeIn
git clone https://github.com/h2n0/ChimeIn.git
mv config.js ~/ChimeIn/backend/
cd ~/ChimeIn
npm install
