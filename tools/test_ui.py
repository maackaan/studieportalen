"""Run isolated browser tests with a temporary loopback server (requires npm install)."""
import os
import argparse
import subprocess
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from server import Handler

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--store-screenshots', action='store_true', help='Skapa Store-bilder med en isolerad exempelprofil.')
    options = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        environment = {**os.environ, 'APP_URL': f'http://127.0.0.1:{server.server_port}'}
        script = 'tools/store_screenshots.cjs' if options.store_screenshots else 'tests/ui-smoke.cjs'
        result = subprocess.run(['node', script], cwd=ROOT, env=environment)
        sys.exit(result.returncode)
    finally:
        server.shutdown()
        server.server_close()
