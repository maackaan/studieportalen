import tempfile
import unittest
import json
import socket
from pathlib import Path
from unittest.mock import patch, MagicMock

import desktop


class DesktopLauncherTests(unittest.TestCase):
    def test_self_test_uses_an_isolated_profile_and_records_result(self):
        webview = MagicMock()
        webview.settings = {}
        window = webview.create_window.return_value
        window.events.loaded.wait.return_value = True
        window.get_current_url.side_effect = lambda: webview.create_window.call_args.args[1]
        webview.start.side_effect = lambda **kwargs: kwargs['func']()
        with tempfile.TemporaryDirectory() as directory:
            report = Path(directory) / 'report.json'
            with patch.dict('sys.modules', {'webview': webview}), patch.object(desktop, 'storage_directory') as user_profile:
                desktop.main(report)
            self.assertTrue(json.loads(report.read_text())['ok'])
            user_profile.assert_not_called()
        self.assertTrue(webview.create_window.call_args.kwargs['hidden'])
        self.assertFalse(webview.create_window.call_args.kwargs['zoomable'])
        self.assertTrue(webview.settings['ALLOW_DOWNLOADS'])
        window.destroy.assert_called_once()

    def test_storage_directory_is_user_specific(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(desktop.sys, "platform", "linux"), patch.dict(
                "os.environ", {"XDG_DATA_HOME": directory, "LOCALAPPDATA": directory}
            ):
                path = desktop.storage_directory()
            self.assertEqual(path, Path(directory) / "Studieportalen" / "WebView")
            self.assertTrue(path.is_dir())

    def test_macos_storage_uses_application_support(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(desktop.sys, "platform", "darwin"), patch.object(Path, "home", return_value=Path(directory)):
                path = desktop.storage_directory()
            self.assertEqual(path, Path(directory) / "Library" / "Application Support" / "Studieportalen" / "WebView")
            self.assertTrue(path.is_dir())

    def test_windows_zip_keeps_the_existing_profile(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(desktop.sys, "platform", "win32"), patch.dict(
                "os.environ", {"LOCALAPPDATA": directory}
            ), patch.object(desktop, "windows_package_family_name", return_value=None):
                path = desktop.storage_directory()
            self.assertEqual(path, Path(directory) / "Studieportalen" / "WebView")

    def test_store_profile_is_stable_across_updates_and_separate_from_zip(self):
        with tempfile.TemporaryDirectory() as directory:
            family = "Studieportalen.Test_123456789abcd"
            legacy = Path(directory) / "Studieportalen" / "WebView"
            legacy.mkdir(parents=True)
            marker = legacy / "private-test-data.txt"
            marker.write_text("Do not migrate or overwrite raw browser files.")
            with patch.object(desktop.sys, "platform", "win32"), patch.dict(
                "os.environ", {"LOCALAPPDATA": directory}
            ), patch.object(desktop, "windows_package_family_name", return_value=family):
                first = desktop.storage_directory()
                updated = desktop.storage_directory()
            self.assertEqual(first, updated)
            self.assertEqual(first, Path(directory) / "Packages" / family / "LocalState" / "Studieportalen" / "WebView")
            self.assertTrue(marker.is_file())
            self.assertFalse((first / marker.name).exists())

    def test_local_server_uses_loopback(self):
        server, thread = desktop.start_local_server(port=0)
        try:
            self.assertEqual(server.server_address[0], "127.0.0.1")
            self.assertTrue(thread.is_alive())
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_server_refuses_to_attach_to_an_unknown_process(self):
        occupied = socket.socket()
        occupied.bind((desktop.HOST, 0))
        port = occupied.getsockname()[1]
        occupied.listen()
        try:
            with self.assertRaisesRegex(RuntimeError, "används redan"):
                desktop.start_local_server(port=port)
        finally:
            occupied.close()


if __name__ == "__main__":
    unittest.main()
