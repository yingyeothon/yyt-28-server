#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"
readonly USER_ID="$1"
readonly TOPIC_NAME="$2"

if [ -z "${USER_ID}" ] || [ -z "${TOPIC_NAME}" ]; then
  echo "$0 user-id topic-name"
  exit 0
fi

set -eux

curl -XPOST \
  "${SERVER_URL}/api/user/${USER_ID}/topic" \
  -H "content-type: application/json" \
  -d '{"name":"'${TOPIC_NAME}'"}'
