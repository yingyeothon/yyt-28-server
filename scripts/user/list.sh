#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"

set -eux

curl -XGET \
  "${SERVER_URL}/api/user" \
  -H "cookie: login=${ADMIN_TOKEN}"
