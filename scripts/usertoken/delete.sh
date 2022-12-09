#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"
readonly USER_ID="$1"
readonly TOKEN="$2"

if [ -z "${USER_ID}" ] || [ -z "${TOKEN}" ]; then
  echo "$0 user-id token"
  exit 0
fi

set -eux

curl -XDELETE \
  "${SERVER_URL}/api/user/${USER_ID}/token/${TOKEN}"
