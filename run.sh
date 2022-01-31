#!/bin/bash

NODE_VERSION=$(find /home/"$(whoami)"/.nvm/versions/node -mindepth 1 -maxdepth 1 -type d -exec basename "{}" \; |tail -n1)
export PATH=$PATH:/home/dsabre/.nvm/versions/node/"$NODE_VERSION"/bin

# run installation if required
if [ ! -f ".env" ] || [ ! -f "db.json" ]; then
  yarn install
  npm run install
fi

# get selected port
PORT=$(cut -d '=' -f 2 <<< "$(cat .env |grep PORT)")

# kill previous process from port
fuser -sk $PORT/tcp

# launch Symfonies manager
nohup npm run start >> /dev/null 2>&1 &