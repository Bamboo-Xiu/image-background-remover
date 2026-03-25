#!/bin/bash

# Fix for @cloudflare/next-on-pages bug where "/" route gets incorrectly mapped to favicon.ico
# See: https://github.com/cloudflare/next-on-pages/issues/XXX

WORKER_FILE=".vercel/output/static/_worker.js/index.js"

if [ -f "$WORKER_FILE" ]; then
  # Fix the root route mapping from favicon.ico override to function
  sed -i '' 's|"/":{type:"override",path:"/favicon.ico",headers:{"content-type":"image/x-icon"}}|"/":{type:"function",entrypoint:"__next-on-pages-dist__/functions/index.func.js"}|g' "$WORKER_FILE"
  echo "Fixed root route mapping in $WORKER_FILE"
else
  echo "Worker file not found: $WORKER_FILE"
  exit 1
fi
