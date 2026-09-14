import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleaseSafetyTests(unittest.TestCase):
    def test_app_starts_with_an_empty_profile(self):
        app_source = (ROOT / "dist" / "app.js").read_text(encoding="utf-8")
        match = re.search(r"const sampleData = \{(?P<body>.*?)\n\};", app_source, re.DOTALL)

        self.assertIsNotNone(match, "Standardprofilen kunde inte hittas.")
        compact = re.sub(r"\s+", "", match.group("body"))
        self.assertEqual(compact, "courses:[],resources:[],events:[],")

    def test_start_page_does_not_load_third_party_assets(self):
        start_page = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
        external_assets = re.findall(
            r"<(?:script|link)[^>]+(?:src|href)=[\"']https?://",
            start_page,
            flags=re.IGNORECASE,
        )

        self.assertEqual(external_assets, [])
        self.assertIn('Content-Security-Policy', start_page)
        self.assertIn("object-src 'none'", start_page)

    def test_offline_cache_uses_the_current_assets(self):
        start_page = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
        worker = (ROOT / "dist" / "sw.js").read_text(encoding="utf-8")

        stylesheet = re.search(r'href="\./(styles\.css\?v=\d+)"', start_page)
        script = re.search(r'src="\./(app\.js\?v=\d+)"', start_page)
        calendar_script = re.search(r'src="\./(calendar-import\.js\?v=\d+)"', start_page)
        self.assertIsNotNone(stylesheet)
        self.assertIsNotNone(script)
        self.assertIsNotNone(calendar_script)
        self.assertIn(f"./{stylesheet.group(1)}", worker)
        self.assertIn(f"./{script.group(1)}", worker)
        self.assertIn(f"./{calendar_script.group(1)}", worker)

    def test_windows_package_only_adds_the_empty_web_app(self):
        workflow = (ROOT / ".github" / "workflows" / "build-windows.yml").read_text(encoding="utf-8")

        self.assertIn('--add-data "dist;dist"', workflow)
        self.assertIn('--version-file tools/windows-version-info.txt', workflow)
        self.assertIn('--self-test-report', workflow)
        self.assertIn('tools/package_windows.py', workflow)
        self.assertIn('requirements-build-lock.txt', workflow)
        self.assertNotIn("studieportalen-backup-", workflow)
        self.assertNotIn("WebView", workflow.split("--add-data", 1)[1].split("desktop.py", 1)[0])

    def test_release_package_includes_notices_but_no_profile(self):
        packager = (ROOT / "tools" / "package_windows.py").read_text(encoding="utf-8")

        self.assertIn("TREDJEPARTSLICENSER.txt", packager)
        self.assertIn("INTEGRITET.txt", packager)
        self.assertNotIn("studieportalen-backup-", packager)


if __name__ == "__main__":
    unittest.main()
