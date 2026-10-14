"""Open a disposable desktop UI preview with test courses/events, no user data."""
from datetime import datetime, timedelta
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import desktop


def main():
    with tempfile.TemporaryDirectory(prefix="studieportalen-ui-", ignore_cleanup_errors=True) as directory:
        # .NET refuses to load assemblies from a WSL UNC share. Stage only the
        # developer runtime locally; this does not change the product or profile.
        if os.name == "nt" and str(ROOT).startswith("\\\\"):
            runtime = Path(directory) / "runtime"
            shutil.copytree(ROOT / ".venv" / "Lib" / "site-packages", runtime,
                            ignore=shutil.ignore_patterns("__pycache__"))
            sys.path.insert(0, str(runtime))
        import webview
        server, _ = desktop.start_local_server(port=0)
        now = datetime.now().replace(hour=10, minute=15, second=0, microsecond=0)
        day = now + timedelta(days=1)
        fixtures = {
            "courses": [{"id": "preview-course", "name": "Mobila nätverk och mycket långa kursnamn", "code": "TDTS04", "color": "purple", "archived": False}],
            "resources": [],
            "events": [
                {"id": "preview-reading", "name": "Slutseminarium", "courseId": "preview-course", "type": "reading", "date": day.isoformat(), "endDate": (day + timedelta(hours=2)).isoformat(), "note": "Testdata i en tillfällig profil."},
                {"id": "preview-exam", "name": "Kontrollskrivning", "courseId": "", "type": "exam", "date": (day + timedelta(days=1)).replace(hour=8, minute=0).isoformat(), "endDate": (day + timedelta(days=1)).replace(hour=12, minute=0).isoformat()},
                {"id": "preview-deadline", "name": "Milestone 2", "courseId": "preview-course", "type": "deadline", "date": day.replace(hour=23, minute=59).isoformat(), "endDate": (day.replace(hour=23, minute=59) + timedelta(hours=1)).isoformat()},
            ],
        }
        window = webview.create_window("Studieportalen – tillfällig UI-testprofil", f"http://127.0.0.1:{server.server_port}",
                                       width=1280, height=820, min_size=(360, 600), zoomable=False)

        def populate():
            window.evaluate_js(f"state = {json.dumps(fixtures)}; saveState(); renderAll();")

        window.events.loaded += populate
        webview.settings["ALLOW_DOWNLOADS"] = True
        try:
            webview.start(private_mode=False, storage_path=str(Path(directory) / "profile"))
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
