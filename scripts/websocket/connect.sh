#!/bin/bash

readonly WEB_SOCKET_SERVER_URL="${WEB_SOCKET_SERVER_URL:-"ws://localhost:3000"}"
readonly USER_TOKEN="$1"
readonly TOPIC_NAME="$2"

if [ -z "${USER_TOKEN}" ] || [ -z "${TOPIC_NAME}" ]; then
  echo "$0 user-token topic-name"
  exit 0
fi

set -eux

wscat -c "${WEB_SOCKET_SERVER_URL}/websocket/${TOPIC_NAME}?token=${USER_TOKEN}"
