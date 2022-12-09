#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"
readonly USER_ID="$1"

if [ -z "${USER_ID}" ]; then
  echo "$0 user-id"
  exit 0
fi

set -eux

curl -XPOST \
  "${SERVER_URL}/api/user/${USER_ID}/activate" \
  -H "cookie: login=${ADMIN_TOKEN}"
