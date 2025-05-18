#!/bin/bash
# Import all HTML files in cleaned dir as articles in Directus via REST API
# Authenticates using username/password, not API token
# Requires: curl, jq, .env with DIRECTUS_URL

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLEANED_DIR="$SCRIPT_DIR/../extensions/google-to-html/html-files/cleaned"

# Load env vars
if [ -f "$SCRIPT_DIR/../.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/../.env" | xargs)
fi

DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
DIRECTUS_USER="nick@stump.works"
DIRECTUS_PASS="admin"

# Authenticate and get access token
LOGIN_RESP=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'$DIRECTUS_USER'","password":"'$DIRECTUS_PASS'"}')
ACCESS_TOKEN=$(echo "$LOGIN_RESP" | jq -r '.data.access_token')
if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to authenticate: $LOGIN_RESP" >&2
  exit 1
fi

echo "Authenticated with Directus as $DIRECTUS_USER"

for filepath in "$CLEANED_DIR"/*.html; do
  [ -e "$filepath" ] || continue
  filename="$(basename -- "$filepath")"
  title="${filename%.html}"
  content=$(<"$filepath")
  # Escape for JSON
  content_json=$(jq -Rs . <<< "$content")
  json="{\"name\":$(jq -Rn --arg t "$title" '$t'),\"title\":$(jq -Rn --arg t "$title" '$t'),\"content\":$content_json}"
  response=$(curl -s -X POST "$DIRECTUS_URL/items/articles" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$json")
  if echo "$response" | grep -q '"errors"'; then
    echo "Failed to import $title: $response" >&2
  else
    echo "Imported: $title"
  fi
done
