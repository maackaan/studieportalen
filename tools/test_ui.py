"""Run isolated browser tests with a temporary loopback server (requires npm install)."""
import os
import subprocess
import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from server import Handler

if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        environment = {**os.environ, 'APP_URL': f'http://127.0.0.1:{server.server_port}'}
        result = subprocess.run(['node', 'tests/ui-smoke.cjs'], cwd=ROOT, env=environment)
        sys.exit(result.returncode)
    finally:
        server.shutdown()
        server.server_close()
