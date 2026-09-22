"""Collect license texts for components shipped in a desktop executable."""
from __future__ import annotations

import importlib.metadata as metadata
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WINDOWS_RUNTIME_DISTRIBUTIONS = (
    "pywebview",
    "pythonnet",
    "clr_loader",
    "proxy_tools",
    "bottle",
    "cffi",
    "pycparser",
    "typing_extensions",
    "setuptools",
    "packaging",
    "pyinstaller",  # Its bootloader forms part of the generated executable.
)
MACOS_RUNTIME_DISTRIBUTIONS = (
    "pywebview",
    "pyobjc-core",
    "pyobjc-framework-Cocoa",
    "pyobjc-framework-Quartz",
    "pyobjc-framework-WebKit",
    "pyobjc-framework-Security",
    "pyobjc-framework-UniformTypeIdentifiers",
    "proxy_tools",
    "bottle",
    "typing_extensions",
    "py2app",
    "modulegraph",
    "macholib",
    "altgraph",
)


def license_texts(distribution: metadata.Distribution, name: str) -> list[tuple[str, str]]:
    candidates = sorted(
        (
        item for item in (distribution.files or ())
        if "license" in item.name.lower() or "copying" in item.name.lower()
        ),
        key=lambda item: str(item).lower(),
    )
    if candidates:
        return [
            (
                str(item).replace("\\", "/"),
                distribution.locate_file(item).read_text(encoding="utf-8", errors="replace").strip(),
            )
            for item in candidates
        ]
    if name == "proxy_tools":
        return [
            (
                "licenses/proxy_tools-LICENSE.txt",
                (ROOT / "licenses" / "proxy_tools-LICENSE.txt").read_text(encoding="utf-8").strip(),
            )
        ]
    raise RuntimeError(f"Ingen licenstext hittades för {name}.")


def main() -> None:
    is_macos = sys.platform == "darwin"
    output = ROOT / "build" / ("THIRD_PARTY_NOTICES-MACOS.txt" if is_macos else "THIRD_PARTY_NOTICES.txt")
    runtime_distributions = MACOS_RUNTIME_DISTRIBUTIONS if is_macos else WINDOWS_RUNTIME_DISTRIBUTIONS
    python_license = Path(sys.base_prefix) / "LICENSE.txt"
    if not python_license.is_file():
        raise RuntimeError(f"Python-licensen saknas: {python_license}")
    sections = [
        "STUDIEPORTALEN — TREDJEPARTSLICENSER\n",
        f"Denna fil gäller komponenter som följer med {'macOS' if is_macos else 'Windows'}-paketet. "
        "Den bestämmer inte licensen för Studieportalens egen källkod.\n",
        f"{'=' * 78}\nPython {sys.version.split()[0]}\n{'=' * 78}\n"
        + python_license.read_text(encoding="utf-8", errors="replace").strip(),
    ]
    for name in runtime_distributions:
        distribution = metadata.distribution(name)
        heading = f"{distribution.metadata['Name']} {distribution.version}"
        texts = license_texts(distribution, name)
        body = "\n\n".join(f"--- {path} ---\n{text}" for path, text in texts)
        sections.append(f"{'=' * 78}\n{heading}\n{'=' * 78}\n{body}")
    if not is_macos:
        webview2_license = ROOT / "licenses" / "Microsoft.Web.WebView2-LICENSE.txt"
        if not webview2_license.is_file():
            raise RuntimeError(f"WebView2-licensen saknas: {webview2_license}")
        sections.append(
            f"{'=' * 78}\nMicrosoft.Web.WebView2 1.0.3856.49\n{'=' * 78}\n"
            + webview2_license.read_text(encoding="utf-8").strip()
        )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n\n".join(sections) + "\n", encoding="utf-8")
    print(f"Licensfil klar: {output}")


if __name__ == "__main__":
    main()
