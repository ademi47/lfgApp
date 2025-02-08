#!/bin/bash
cd ~/apps/lfgApp/server
export PATH=$HOME/.node/node-v18.18.0-linux-x64/bin:$PATH

# Remove old node_modules and install fresh
rm -rf node_modules
npm install

# Stop all PM2 processes
~/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 delete all

# Start the server directly
~/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 start index.js --name "lfg-api" 