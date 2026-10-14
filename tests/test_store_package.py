import struct
import tempfile
import unittest
from pathlib import Path
from xml.etree import ElementTree as ET

from tools.package_store import FOUNDATION, UAP10, PREVIEW_IDENTITY, manifest, validate_app_directory, validate_identity


class StorePackageTests(unittest.TestCase):
    def test_manifest_preserves_identity_and_encodes_publisher_safely(self):
        identity = {**PREVIEW_IDENTITY, "publisher_display_name": "Test & utveckling"}
        root = ET.fromstring(manifest(validate_identity(identity)))
        ns = {"m": FOUNDATION}
        self.assertEqual(root.find("m:Identity", ns).get("Publisher"), identity["publisher"])
        self.assertEqual(root.find("m:Properties/m:PublisherDisplayName", ns).text, "Test & utveckling")
        app = root.find("m:Applications/m:Application", ns)
        self.assertEqual(app.get(f"{{{UAP10}}}TrustLevel"), "mediumIL")
        self.assertEqual(app.get("Executable"), "App\\Studieportalen.exe")

    def test_placeholder_identity_and_invalid_store_versions_are_rejected(self):
        for update in ({"publisher": "CN=REPLACE_WITH_REAL_PUBLISHER"}, {"version": "0.1.4.0"},
                       {"version": "1.0.4.1"}, {"version": "1.65536.0.0"}, {"identity_name": "../profile"}):
            with self.subTest(update=update), self.assertRaises(ValueError):
                validate_identity({**PREVIEW_IDENTITY, **update})

    def make_app(self, app):
        (app / "_internal" / "dist").mkdir(parents=True)
        (app / "_internal" / "dist" / "index.html").write_text("<html></html>")
        pe = bytearray(256)
        pe[:2] = b"MZ"
        pe[0x3C:0x40] = struct.pack("<I", 128)
        pe[128:134] = b"PE\0\0\x64\x86"
        (app / "Studieportalen.exe").write_bytes(pe)

    def test_profile_files_and_private_keys_cannot_enter_the_package(self):
        with tempfile.TemporaryDirectory() as directory:
            app = Path(directory)
            self.make_app(app)
            validate_app_directory(app)
            for relative in ("_internal/WebView/data", "_internal/studieportalen-backup-private.json", "_internal/signing.pfx"):
                path = app / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"private")
                with self.subTest(relative=relative), self.assertRaises(ValueError):
                    validate_app_directory(app)
                path.unlink()
                if path.parent.name == "WebView":
                    path.parent.rmdir()

    def test_x86_is_not_mislabeled_as_x64(self):
        with tempfile.TemporaryDirectory() as directory:
            app = Path(directory)
            self.make_app(app)
            executable = app / "Studieportalen.exe"
            pe = bytearray(executable.read_bytes())
            pe[132:134] = b"\x4c\x01"
            executable.write_bytes(pe)
            with self.assertRaisesRegex(ValueError, "x64"):
                validate_app_directory(app)


if __name__ == "__main__":
    unittest.main()
