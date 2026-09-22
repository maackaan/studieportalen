import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from tools import collect_licenses


class LicenseCollectionTests(unittest.TestCase):
    def test_pyobjc_framework_without_own_file_uses_core_license(self):
        with tempfile.TemporaryDirectory() as directory:
            license_file = Path(directory) / "LICENSE.txt"
            license_file.write_text("PyObjC test license", encoding="utf-8")
            core = SimpleNamespace(
                files=(Path("LICENSE.txt"),),
                locate_file=lambda _item: license_file,
            )

            with patch.object(collect_licenses.metadata, "distribution", return_value=core):
                texts = collect_licenses.license_texts(
                    SimpleNamespace(files=()), "pyobjc-framework-Security"
                )

            self.assertEqual(texts, [("LICENSE.txt", "PyObjC test license")])


if __name__ == "__main__":
    unittest.main()
