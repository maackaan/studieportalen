"""py2app-inställning för Studieportalens fristående macOS-app."""
from pathlib import Path

from setuptools import setup


ROOT = Path(__file__).resolve().parents[1]

OPTIONS = {
    "argv_emulation": False,
    "strip": True,
    "iconfile": str(ROOT / "build" / "icon.icns"),
    "includes": ["Foundation", "WebKit", "webview", "server"],
    "resources": [str(ROOT / "dist")],
    "plist": {
        "CFBundleIdentifier": "se.maackaan.studieportalen",
        "CFBundleDisplayName": "Studieportalen",
        "CFBundleName": "Studieportalen",
        "CFBundleShortVersionString": "0.1.0",
        "CFBundleVersion": "3",
        "NSHighResolutionCapable": True,
    },
}

setup(
    name="Studieportalen",
    version="0.1.0b3",
    app=[str(ROOT / "desktop.py")],
    options={"py2app": OPTIONS},
    setup_requires=["py2app"],
)
