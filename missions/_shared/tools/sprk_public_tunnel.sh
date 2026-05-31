#!/usr/bin/env bash
# Start a Cloudflare Quick Tunnel to a local SPRK mission backend port.
# Usage: bash missions/_shared/tools/sprk_public_tunnel.sh [port]
# Example: bash missions/_shared/tools/sprk_public_tunnel.sh 8010
#
# See docs/SPRK_Cloud_Facilitator_Hosting_Guide.md for classroom steps.

set -euo pipefail

PORT="${1:-8010}"
TARGET="http://127.0.0.1:${PORT}"
CLOUDFLARED="${CLOUDFLARED:-/tmp/cloudflared}"

if ! curl -s -o /dev/null --connect-timeout 1 "${TARGET}/"; then
  echo "Warning: nothing responded at ${TARGET}/"
  echo "Start the mission backend first, for example:"
  echo "  cd missions/10-SpaceInvaders-1P-nP && python3 server.py"
  echo
fi

if [[ ! -x "${CLOUDFLARED}" ]]; then
  echo "Downloading cloudflared to ${CLOUDFLARED} ..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "${CLOUDFLARED}"
  chmod +x "${CLOUDFLARED}"
fi

echo "Opening Cloudflare Quick Tunnel -> ${TARGET}"
echo "Share the https://....trycloudflare.com URL with students."
echo "Press Ctrl+C to stop the tunnel."
echo

exec "${CLOUDFLARED}" tunnel --url "${TARGET}"
