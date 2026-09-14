#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/.studieportalen.pid"

if [[ ! -f "$PID_FILE" ]]; then
  printf 'Studieportalen verkar inte vara igång.\n'
  exit 0
fi

PID="$(cat "$PID_FILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  printf 'Studieportalen har stoppats.\n'
else
  printf 'Ingen aktiv server hittades.\n'
fi
rm -f "$PID_FILE"
