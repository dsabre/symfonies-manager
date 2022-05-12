#!/bin/bash

# get selected port
PORT=$(cut -d '=' -f 2 <<< "$(cat .env |grep PORT)" |sed 's/"//g')
echo "Server port detected: $PORT"

# kill previous process from port
fuser $PORT/tcp