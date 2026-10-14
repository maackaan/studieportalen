"""Build and start-test a clean Windows onedir app, then package it as MSIX."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--preview", action="store_true")
    selection.add_argument("--identity", type=Path)
    options = parser.parse_args()
    if os.name != "nt":
        parser.error("Windows-bygget kräver Windows och Windows SDK.")
    identity = options.identity.resolve() if options.identity else None
    # Validate identity before an expensive build. Keep stage paths on local NTFS
    # even when the source repository is accessed through WSL/UNC.
    sys.path.insert(0, str(ROOT))
    from tools.package_store import PREVIEW_IDENTITY, sdk_tool, validate_identity
    if identity:
        values = validate_identity(json.loads(identity.read_text(encoding="utf-8-sig")))
        if values["identity_name"] == PREVIEW_IDENTITY["identity_name"]:
            raise SystemExit("Lokal testidentitet får inte skickas till Store.")
    sdk_tool()
    stage = Path(tempfile.mkdtemp(prefix="studieportalen-store-"))

    def run(*arguments: str) -> None:
        subprocess.run([sys.executable, *map(str, arguments)], cwd=ROOT, check=True)

    run("-m", "unittest", "discover", "-s", "tests", "-v")
    run("tools/build_icon.py")
    run("-m", "PyInstaller", "--noconfirm", "--clean", "--onedir", "--windowed", "--noupx",
        "--name", "Studieportalen", "--distpath", stage / "dist", "--workpath", stage / "work",
        "--specpath", stage, "--hidden-import", "webview", "--icon", ROOT / "build" / "icon.ico",
        "--version-file", ROOT / "tools" / "windows-version-info.txt",
        "--add-data", f"{ROOT / 'dist'};dist", ROOT / "desktop.py")
    app = stage / "dist" / "Studieportalen"
    report = stage / "startup.json"
    subprocess.run([str(app / "Studieportalen.exe"), "--self-test-report", str(report)],
                   cwd=stage, check=True, timeout=45)
    if not report.is_file() or not json.loads(report.read_text(encoding="utf-8"))["ok"]:
        raise SystemExit("Det paketerade fönstret klarade inte starttestet.")
    run("tools/collect_licenses.py")
    identity_arguments = ["--identity", identity] if identity else ["--preview"]
    run("tools/package_store.py", "--app", app, *identity_arguments)
    # Retained for scoped package/UI inspection. No real user profile is opened.
    print(f"Byggmapp för fortsatt lokal granskning: {stage}")


if __name__ == "__main__":
    main()
