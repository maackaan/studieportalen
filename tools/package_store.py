"""Build a validated, unsigned MSIX for Store submission, never a user profile.

The Store signs approved MSIX submissions. Preview identity is only for local
package validation; it cannot be submitted or installed as a trusted release.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
FOUNDATION = "http://schemas.microsoft.com/appx/manifest/foundation/windows10"
UAP = "http://schemas.microsoft.com/appx/manifest/uap/windows10"
UAP10 = "http://schemas.microsoft.com/appx/manifest/uap/windows10/10"
RESCAP = "http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
PREVIEW_IDENTITY = {
    "identity_name": "maackaan.Studieportalen.LocalPreview",
    "publisher": "CN=Studieportalen Local Preview",
    "publisher_display_name": "Studieportalen lokal testversion",
    "display_name": "Studieportalen Preview",
    "version": "1.0.4.0",
}
FORBIDDEN_PARTS = {"user data", "indexeddb", "local storage", "local state", "preferences", ".git", ".venv", "node_modules"}


def validate_identity(identity: dict) -> dict[str, str]:
    required = set(PREVIEW_IDENTITY)
    if not isinstance(identity, dict) or not required <= identity.keys():
        raise ValueError("Store-identiteten måste innehålla alla fält i exempelfilen.")
    result = {key: identity[key] for key in required}
    if any(not isinstance(value, str) or not value.strip() or "REPLACE_" in value
           or any(ord(character) < 32 for character in value) for value in result.values()):
        raise ValueError("Fyll i den riktiga appidentiteten från Partner Center först.")
    name = result["identity_name"]
    if not re.fullmatch(r"[A-Za-z0-9.-]{3,50}", name):
        raise ValueError("Package Identity Name måste vara 3–50 bokstäver, siffror, punkter eller bindestreck.")
    if not result["publisher"].startswith("CN="):
        raise ValueError("Package Identity Publisher måste kopieras exakt, inklusive CN=.")
    if not re.fullmatch(r"\d+\.\d+\.\d+\.0", result["version"]):
        raise ValueError("MSIX-versionen ska vara fyra heltal och sluta på .0, exempelvis 1.0.4.0.")
    parts = [int(part) for part in result["version"].split(".")]
    if parts[0] == 0 or any(part > 65535 for part in parts):
        raise ValueError("Första versionsdelen måste vara minst 1 och alla delar högst 65535.")
    if any(len(result[key]) > 256 for key in ("publisher_display_name", "display_name")):
        raise ValueError("Visningsnamn får vara högst 256 tecken.")
    return result


def verify_x64(executable: Path) -> None:
    with executable.open("rb") as stream:
        if stream.read(2) != b"MZ":
            raise ValueError("Programfilen är inte ett Windows-program.")
        stream.seek(0x3C)
        offset = struct.unpack("<I", stream.read(4))[0]
        stream.seek(offset)
        if stream.read(4) != b"PE\x00\x00" or stream.read(2) != b"\x64\x86":
            raise ValueError("Store-paketet kräver en x64-programfil.")


def validate_app_directory(app: Path) -> None:
    if {path.name for path in app.iterdir()} != {"Studieportalen.exe", "_internal"}:
        raise ValueError("Använd endast den rena PyInstaller --onedir-mappen, med EXE och _internal.")
    if not (app / "_internal" / "dist" / "index.html").is_file():
        raise ValueError("Den paketerade webbappen saknas.")
    verify_x64(app / "Studieportalen.exe")
    for path in app.rglob("*"):
        relative = path.relative_to(app)
        # Lowercase webview is a required Python runtime package. WebView (the
        # profile directory) and Chromium's storage directories must never ship.
        if path.is_symlink() or "WebView" in relative.parts or any(part.lower() in FORBIDDEN_PARTS for part in relative.parts):
            raise ValueError(f"Otillåtet innehåll i byggmappen: {relative}")
        if path.suffix.lower() in {".pfx", ".p12", ".key"} or path.name.startswith(("studieportalen-backup-", ".studieportalen.")):
            raise ValueError(f"Privata filer får inte paketeras: {relative}")


def manifest(identity: dict[str, str]) -> bytes:
    ET.register_namespace("", FOUNDATION)
    ET.register_namespace("uap", UAP)
    ET.register_namespace("uap10", UAP10)
    ET.register_namespace("rescap", RESCAP)
    root = ET.Element(f"{{{FOUNDATION}}}Package", {"IgnorableNamespaces": "uap uap10 rescap"})
    ET.SubElement(root, "Identity", {"Name": identity["identity_name"], "Publisher": identity["publisher"],
                                      "Version": identity["version"], "ProcessorArchitecture": "x64"})
    properties = ET.SubElement(root, "Properties")
    for name, value in {"DisplayName": identity["display_name"], "PublisherDisplayName": identity["publisher_display_name"],
                        "Description": "Lokala kurser, resurser och studieplanering", "Logo": "Assets\\StoreLogo.png"}.items():
        ET.SubElement(properties, name).text = value
    dependencies = ET.SubElement(root, "Dependencies")
    ET.SubElement(dependencies, "TargetDeviceFamily", {"Name": "Windows.Desktop", "MinVersion": "10.0.19041.0", "MaxVersionTested": "10.0.26100.0"})
    ET.SubElement(ET.SubElement(root, "Resources"), "Resource", {"Language": "sv-SE"})
    app = ET.SubElement(ET.SubElement(root, "Applications"), "Application", {
        "Id": "Studieportalen", "Executable": "App\\Studieportalen.exe",
        f"{{{UAP10}}}RuntimeBehavior": "packagedClassicApp", f"{{{UAP10}}}TrustLevel": "mediumIL",
    })
    ET.SubElement(app, f"{{{UAP}}}VisualElements", {
        "DisplayName": identity["display_name"], "Description": "Kurser, resurser och kalender på din egen dator",
        "Square150x150Logo": "Assets\\Square150x150Logo.png", "Square44x44Logo": "Assets\\Square44x44Logo.png",
        "BackgroundColor": "transparent",
    })
    capabilities = ET.SubElement(root, "Capabilities")
    ET.SubElement(capabilities, "Capability", {"Name": "internetClient"})
    ET.SubElement(capabilities, f"{{{RESCAP}}}Capability", {"Name": "runFullTrust"})
    ET.indent(root)
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def sdk_tool() -> Path:
    on_path = shutil.which("makeappx.exe")
    if on_path:
        return Path(on_path)
    sdk = Path(os.environ.get("ProgramFiles(x86)", "C:/Program Files (x86)")) / "Windows Kits" / "10" / "bin"
    versions = sorted((path for path in sdk.glob("10.*") if (path / "x64" / "makeappx.exe").is_file()),
                      key=lambda path: tuple(int(part) for part in path.name.split(".")), reverse=True)
    if not versions:
        raise ValueError("Windows SDK saknas. Installera SDK:s MSIX-paketeringsverktyg på byggdatorn.")
    return versions[0] / "x64" / "makeappx.exe"


def create_assets(destination: Path) -> None:
    from PIL import Image
    destination.mkdir()
    with Image.open(ROOT / "build" / "icon.ico") as icon:
        for name, size in (("StoreLogo", 50), ("Square44x44Logo", 44), ("Square150x150Logo", 150)):
            icon.convert("RGBA").resize((size, size), Image.Resampling.LANCZOS).save(destination / f"{name}.png")


def package(app: Path, identity: dict[str, str], preview: bool) -> Path:
    identity = validate_identity(identity)
    validate_app_directory(app)
    notices = ROOT / "build" / "THIRD_PARTY_NOTICES.txt"
    if not notices.is_file() or not (ROOT / "build" / "icon.ico").is_file():
        raise ValueError("Skapa ikon och tredjepartslicenser innan paketering.")
    tool = sdk_tool()
    output = ROOT / "build-output"
    output.mkdir(exist_ok=True)
    filename = f"Studieportalen-{'Preview' if preview else 'Store'}-{identity['version']}-x64.msix"
    with tempfile.TemporaryDirectory(prefix="studieportalen-msix-") as temporary:
        temp = Path(temporary)
        stage = temp / "package"
        stage.mkdir()
        shutil.copytree(app, stage / "App")
        create_assets(stage / "Assets")
        (stage / "AppxManifest.xml").write_bytes(manifest(identity))
        shutil.copyfile(notices, stage / "TREDJEPARTSLICENSER.txt")
        shutil.copyfile(ROOT / "PRIVACY.md", stage / "INTEGRITET.txt")
        temporary_package = temp / filename
        # No /nv: retain the SDK's schema and semantic validation.
        result = subprocess.run([str(tool), "pack", "/d", str(stage), "/p", str(temporary_package), "/h", "SHA256"],
                                capture_output=True, text=True, errors="replace")
        if result.returncode:
            raise ValueError(f"Windows SDK avvisade paketet:\n{result.stdout}\n{result.stderr}")
        print("Windows SDK: manifest och MSIX-paketering godkända.")
        with ZipFile(temporary_package) as archive:
            names = {name.replace("\\", "/") for name in archive.namelist()}
            if not {"AppxManifest.xml", "AppxBlockMap.xml", "App/Studieportalen.exe", "App/_internal/dist/index.html"} <= names:
                raise ValueError("MSIX-paketet saknar nödvändiga appfiler.")
            if "AppxSignature.p7x" in names:
                raise ValueError("Store-underlaget ska vara osignerat tills Microsoft behandlar det.")
        destination = output / filename
        shutil.copyfile(temporary_package, destination)
    digest = hashlib.sha256(destination.read_bytes()).hexdigest()
    destination.with_suffix(".sha256").write_text(f"{digest}  {filename}\n", encoding="ascii")
    destination.with_suffix(".json").write_text(json.dumps({
        "identity": identity, "preview": preview, "signed": False,
        "sha256": digest, "size_bytes": destination.stat().st_size,
        "status": "local-validation-only" if preview else "pending-store-certification",
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return destination


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--app", type=Path, required=True, help="Ren PyInstaller --onedir-mapp.")
    selection = parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--identity", type=Path, help="Exakt identitet från Partner Center (JSON).")
    selection.add_argument("--preview", action="store_true", help="Lokal testidentitet, kan inte skickas till Store.")
    options = parser.parse_args()
    try:
        identity = validate_identity(PREVIEW_IDENTITY if options.preview else json.loads(options.identity.read_text(encoding="utf-8-sig")))
        if not options.preview and identity.get("identity_name") == PREVIEW_IDENTITY["identity_name"]:
            raise ValueError("Lokal testidentitet får inte användas för en Store-inlämning.")
        result = package(options.app.resolve(), identity, options.preview)
        print(f"MSIX skapat: {result.name} ({result.stat().st_size / 1024 / 1024:.1f} MB)")
        print("Osignerat underlag. Installation och Store-certifiering är separata steg.")
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        raise SystemExit(str(error)) from error


if __name__ == "__main__":
    main()
