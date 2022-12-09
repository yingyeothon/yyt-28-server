#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"
readonly EMAIL="$1"

if [ -z "${EMAIL}" ]; then
  echo "$0 email"
  exit 0
fi

set -eux

curl -XPOST \
  "${SERVER_URL}/api/user" \
  -H "cookie: login=${ADMIN_TOKEN}" \
  -H "content-type: application/json" \
  -d '{"email":"'$1'"}'
