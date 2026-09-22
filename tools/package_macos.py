"""Create a macOS ZIP without including any user profile or development files."""
from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


if __name__ == "__main__":
    output = ROOT / "build-output"
    app = output / "Studieportalen.app"
    notices = ROOT / "build" / "THIRD_PARTY_NOTICES-MACOS.txt"
    if not app.is_dir():
        raise SystemExit("Bygg macOS-programmet först.")
    if not notices.is_file():
        raise SystemExit("Skapa macOS-licenser med tools/collect_licenses.py först.")

    architecture = os.environ.get("MACOS_ARCH", "native")
    staging = output / f"Studieportalen-macOS-{architecture}"
    if staging.exists():
        shutil.rmtree(staging)
    staging.mkdir(parents=True)
    shutil.copytree(app, staging / app.name, symlinks=True)
    for source, name in (
        ("README.md", "README.txt"),
        ("PRIVACY.md", "INTEGRITET.txt"),
        ("BETA_CHECKLIST.md", "BETASTATUS.txt"),
    ):
        shutil.copy2(ROOT / source, staging / name)
    shutil.copy2(notices, staging / "TREDJEPARTSLICENSER.txt")

    package = output / f"Studieportalen-macOS-{architecture}.zip"
    package.unlink(missing_ok=True)
    subprocess.run(
        ["ditto", "-c", "-k", "--sequesterRsrc", "--keepParent", str(staging), str(package)],
        check=True,
    )
    with package.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    package.with_suffix(".sha256").write_text(f"{digest}  {package.name}\n", encoding="ascii")
    print(f"Mac-paket klart: {package.name} ({package.stat().st_size / 1024 / 1024:.1f} MB)")
