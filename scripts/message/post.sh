#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"
readonly USER_TOKEN="$1"
readonly TOPIC_NAME="$2"
readonly MESSAGE_BODY="$3"

if [ -z "${USER_TOKEN}" ] || [ -z "${TOPIC_NAME}" ] || [ -z "${MESSAGE_BODY}" ]; then
  echo "$0 user-token topic-name message-body"
  exit 0
fi

set -eux

curl -XPOST \
  "${SERVER_URL}/api/message/${TOPIC_NAME}?token=${USER_TOKEN}" \
  -H "content-type: text/plain" \
  -d "${MESSAGE_BODY}"
