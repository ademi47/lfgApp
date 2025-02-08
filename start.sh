#!/bin/bash
cd ~/apps/lfgApp/server

# Set up Node.js path
export PATH=$HOME/.node/node-v18.18.0-linux-x64/bin:$PATH
export NODE_PATH=$HOME/.node/node-v18.18.0-linux-x64/lib/node_modules

# Install PM2 globally if not installed
npm install -g pm2

# Remove old node_modules and install fresh
rm -rf node_modules
npm install

# Stop any existing processes
pm2 delete all

# Start the server with PM2
pm2 start index.js --name "lfg-api"

# Save PM2 process list
pm2 save

# Display logs
pm2 logs lfg-api 