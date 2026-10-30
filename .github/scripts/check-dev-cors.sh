#!/usr/bin/env bash
set -euo pipefail

back_url="${1:?Backend URL is required}"
origins="${2:?Allowed frontend origins are required}"
headers="$(mktemp)"
trap 'rm -f "$headers"' EXIT

check_preflight() {
  local origin="$1"
  curl --fail --silent --show-error --retry 5 --retry-all-errors --max-time 60 \
    --request OPTIONS --dump-header "$headers" --output /dev/null \
    --header "Origin: ${origin}" \
    --header 'Access-Control-Request-Method: POST' \
    --header 'Access-Control-Request-Headers: authorization,content-type' \
    "${back_url}/api/auth/ensure"
}

IFS=',' read -r -a frontend_origins <<< "$origins"
for origin in "${frontend_origins[@]}"; do
  check_preflight "$origin"
  if ! awk -v expected="$origin" '
    tolower($1) == "access-control-allow-origin:" {
      gsub("\r", "", $2);
      if ($2 == expected) found = 1;
    }
    END { exit !found }
  ' "$headers"; then
    echo "::error::CORS preflight did not allow ${origin}"
    exit 1
  fi
  echo "CORS preflight passed: ${origin}"
done

check_preflight 'https://untrusted-origin.invalid'
if awk 'tolower($1) == "access-control-allow-origin:" { found = 1 } END { exit !found }' "$headers"; then
  echo '::error::CORS unexpectedly allowed an unrelated origin.'
  exit 1
fi
echo 'CORS rejected an unrelated origin.'
