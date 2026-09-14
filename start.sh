#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${STUDIEPORTALEN_PORT:-4173}"
PID_FILE="$APP_DIR/.studieportalen.pid"
LOG_FILE="$APP_DIR/.studieportalen.log"
URL="http://localhost:$PORT"

if ! command -v python3 >/dev/null 2>&1; then
  printf 'Python 3 saknas i WSL. Installera det och försök igen.\n' >&2
  exit 1
fi

server_is_ready() {
  python3 - "$PORT" <<'PY' >/dev/null 2>&1
import socket, sys
with socket.create_connection(("127.0.0.1", int(sys.argv[1])), timeout=0.25):
    pass
PY
}

if ! server_is_ready; then
  nohup python3 "$APP_DIR/server.py" "$PORT" >"$LOG_FILE" 2>&1 &
  printf '%s\n' "$!" >"$PID_FILE"
  for _ in $(seq 1 40); do
    server_is_ready && break
    sleep 0.1
  done
fi

if ! server_is_ready; then
  printf 'Studieportalen kunde inte startas. Se %s\n' "$LOG_FILE" >&2
  exit 1
fi

if [[ "${STUDIEPORTALEN_NO_BROWSER:-0}" != "1" ]]; then
  /mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe \
    -NoProfile -NonInteractive -Command "Start-Process 'msedge.exe' -ArgumentList '--app=$URL'" >/dev/null 2>&1
fi

printf 'Studieportalen är igång på %s\n' "$URL"
