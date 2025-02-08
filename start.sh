#!/bin/bash
cd ~/apps/lfgApp/server
export PATH=$HOME/.node/node-v18.18.0-linux-x64/bin:$PATH

# Create ecosystem file
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [{
    name: 'lfg-api',
    script: 'index.js',
    env: {
      DB_HOST: '127.0.0.1',
      DB_USER: 'u561042160_lfgadmin',
      DB_PASSWORD: '206#iCf!mk',
      DB_NAME: 'u561042160_lfgapp',
      NODE_ENV: 'production'
    }
  }]
}
EOL

npm install
~/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 delete all
~/.node/node-v18.18.0-linux-x64/lib/node_modules/pm2/bin/pm2 start ecosystem.config.js 