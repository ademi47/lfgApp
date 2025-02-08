#!/bin/bash
cd ~/apps/lfgApp/server
export PATH=$HOME/.node/node-v18.18.0-linux-x64/bin:$PATH

# Add these environment variables directly
export DB_HOST=127.0.0.1
export DB_USER=u561042160_lfgadmin
export DB_PASSWORD=206#iCf!mk
export DB_NAME=u561042160_lfgapp

# Print environment variables for debugging
echo "DB_HOST: $DB_HOST"
echo "DB_USER: $DB_USER"
echo "DB_NAME: $DB_NAME"

npm install
~/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 stop lfg-api
~/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 start index.js --name "lfg-api" --env production 