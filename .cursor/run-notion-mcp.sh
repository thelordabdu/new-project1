#!/usr/bin/env sh
DIR="$(CDPATH='' cd "$(dirname "$0")" && pwd)"
ENV_FILE="$DIR/.env.local"

if [ ! -f "$ENV_FILE" ]; then
  printf '%s\n' "run-notion-mcp: missing $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

if [ -z "${NOTION_TOKEN:-}" ]; then
  printf '%s\n' "run-notion-mcp: NOTION_TOKEN is empty" >&2
  exit 1
fi

export OPENAPI_MCP_HEADERS="{\"Authorization\": \"Bearer ${NOTION_TOKEN}\", \"Notion-Version\": \"2022-06-28\"}"

exec npx -y @notionhq/notion-mcp-server