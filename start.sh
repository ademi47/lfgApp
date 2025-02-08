#!/bin/bash
cd ~/apps/lfgApp/server

# Set up Node.js path
export PATH=$HOME/.node/node-v18.18.0-linux-x64/bin:$PATH
export NODE_PATH=$HOME/.node/node-v18.18.0-linux-x64/lib/node_modules

# Remove old node_modules and install fresh
rm -rf node_modules
npm install

# Stop all PM2 processes
$HOME/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 delete all

# Start the server with full path to node
$HOME/.node/node-v18.18.0-linux-x64/bin/node index.js 