#!/usr/bin/env python3
"""Skrivbordsstartare för den paketerade versionen av Studieportalen."""

from __future__ import annotations

import json
import os
import sys
import threading
import tempfile
import argparse
from http.server import ThreadingHTTPServer
from pathlib import Path

from server import Handler


HOST = "127.0.0.1"
PORT = 4173
URL = f"http://{HOST}:{PORT}"


def storage_directory() -> Path:
    """Returnera en stabil, användarspecifik mapp för WebView-profilen."""
    if sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    elif os.name == "nt":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    path = base / "Studieportalen" / "WebView"
    path.mkdir(parents=True, exist_ok=True)
    return path


def start_local_server(host: str = HOST, port: int = PORT) -> tuple[ThreadingHTTPServer, threading.Thread]:
    try:
        server = ThreadingHTTPServer((host, port), Handler)
    except OSError as error:
        raise RuntimeError(
            f"Den lokala porten {port} används redan. Stäng ett eventuellt öppet "
            "Studieportalen-fönster och försök igen."
        ) from error
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, name="studieportalen-server", daemon=True)
    thread.start()
    return server, thread


def main(smoke_report: Path | None = None) -> None:
    import webview

    webview.settings['ALLOW_DOWNLOADS'] = True
    temporary_profile = tempfile.TemporaryDirectory(ignore_cleanup_errors=True) if smoke_report else None
    server, _ = start_local_server(port=0 if smoke_report else PORT)
    url = f"http://{HOST}:{server.server_port}" if smoke_report else URL
    try:
        window = webview.create_window(
            "Studieportalen",
            url,
            width=1280,
            height=820,
            min_size=(360, 600),
            background_color="#f5f6fa",
            text_select=True,
            zoomable=False,
            hidden=bool(smoke_report),
        )
        if smoke_report:
            def check_window():
                try:
                    if not window.events.loaded.wait(30):
                        raise RuntimeError('Appfönstret laddades inte inom 30 sekunder.')
                    result = window.evaluate_js("({title: document.title, courses: document.querySelector('#courseCount').textContent, calendar: typeof importCalendar, ready: document.readyState})")
                    if result != {'title': 'Studieportalen', 'courses': '0', 'calendar': 'function', 'ready': 'complete'}:
                        raise RuntimeError(str(result))
                    smoke_report.write_text(json.dumps({'ok': True, 'window': result}), encoding='utf-8')
                except Exception as error:
                    smoke_report.write_text(json.dumps({'ok': False, 'error': str(error)}), encoding='utf-8')
                finally:
                    window.destroy()
        else:
            check_window = None
        webview.start(
            func=check_window,
            debug=False,
            private_mode=False,
            storage_path=temporary_profile.name if temporary_profile else str(storage_directory()),
        )
    finally:
        server.shutdown()
        server.server_close()
        if temporary_profile:
            temporary_profile.cleanup()


def show_startup_error(message: str) -> None:
    """Visa ett läsbart startfel även från ett fönsterprogram utan terminal."""
    if os.name == "nt":
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, message, "Studieportalen kunde inte starta", 0x10)
    elif sys.platform == "darwin":
        from AppKit import NSAlert, NSAlertStyleCritical
        alert = NSAlert.alloc().init()
        alert.setAlertStyle_(NSAlertStyleCritical)
        alert.setMessageText_("Studieportalen kunde inte starta")
        alert.setInformativeText_(message)
        alert.runModal()
    else:
        print(f"Studieportalen kunde inte starta: {message}", file=sys.stderr)


def run() -> None:
    parser = argparse.ArgumentParser(description='Studieportalen')
    parser.add_argument('--self-test-report', type=Path, help='Testa ett dolt fönster med tillfällig, tom profil.')
    smoke_report = parser.parse_args().self_test_report
    try:
        main(smoke_report)
    except Exception as error:
        message = str(error) or "Ett oväntat fel inträffade."
        if smoke_report:
            smoke_report.write_text(json.dumps({'ok': False, 'error': message}), encoding='utf-8')
        else:
            show_startup_error(message)
        raise SystemExit(1) from error


if __name__ == "__main__":
    run()
