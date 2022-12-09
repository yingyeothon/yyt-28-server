#!/bin/bash

readonly SERVER_URL="${SERVER_URL:-"http://localhost:3000"}"
readonly USER_TOKEN="$1"
readonly TOPIC_NAME="$2"
readonly MESSAGE_ID="$3"

if [ -z "${USER_TOKEN}" ] || [ -z "${TOPIC_NAME}" ]; then
  echo "$0 user-token topic-name [message-id]"
  exit 0
fi

set -eux

curl -XGET \
  "${SERVER_URL}/api/message/${TOPIC_NAME}?token=${USER_TOKEN}&messageId=${MESSAGE_ID}"
