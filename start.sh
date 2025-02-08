#!/bin/bash
cd ~/apps/lfgApp/server

# Set up Node.js path
export PATH=$HOME/.node/node-v18.18.0-linux-x64/bin:$PATH
export NODE_PATH=$HOME/.node/node-v18.18.0-linux-x64/lib/node_modules

# Remove old node_modules and install fresh
rm -rf node_modules
$HOME/.node/node-v18.18.0-linux-x64/bin/npm install

# Stop any existing PM2 processes
NODE_EXEC=$HOME/.node/node-v18.18.0-linux-x64/bin/node
$NODE_EXEC $HOME/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 delete all

# Start the server with PM2
$NODE_EXEC $HOME/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 start index.js --name "lfg-api" --interpreter $NODE_EXEC

# Save PM2 process list
$NODE_EXEC $HOME/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 save

# Display logs
$NODE_EXEC $HOME/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 logs lfg-api 