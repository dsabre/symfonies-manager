#!/bin/bash

# set log file
LOG=/tmp/symfonies_manager_log

# go to correct directory
cd "$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> $LOG && pwd )" || exit 1

echo "Symfonies manager started at: $(date)" >> $LOG

# using nvm maybe the path must be set to PATH variable
NODE_VERSION=$(find /home/"$(whoami)"/.nvm/versions/node -mindepth 1 -maxdepth 1 -type d -exec basename "{}" \; |tail -n1)
export PATH=$PATH:/home/dsabre/.nvm/versions/node/"$NODE_VERSION"/bin

# run installation if required
if [ ! -f ".env" ] || [ ! -f "db.json" ]; then
  yarn install
  npm run install
fi

# get selected port
PORT=$(cut -d '=' -f 2 <<< "$(cat .env |grep PORT)" |sed 's/"//g')
echo "Server port detected: $PORT" >> $LOG

# kill previous process from port
fuser -sk $PORT/tcp >> $LOG

# launch Symfonies manager
nohup npm run start >> $LOG 2>&1 &
