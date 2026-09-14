"""Package only explicitly selected release files; never include a user profile."""
import hashlib
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parents[1]

if __name__ == '__main__':
    output = ROOT / 'build-output'
    executable = output / 'Studieportalen.exe'
    notices = ROOT / 'build' / 'THIRD_PARTY_NOTICES.txt'
    if not executable.is_file():
        raise SystemExit('Bygg Windows-programmet först.')
    if not notices.is_file():
        raise SystemExit('Skapa tredjepartslicenser med tools/collect_licenses.py först.')
    package = output / 'Studieportalen-Windows-x64.zip'
    with ZipFile(package, 'w', compression=ZIP_DEFLATED) as archive:
        archive.write(executable, 'Studieportalen.exe')
        for source, name in [('README.md', 'README.txt'), ('PRIVACY.md', 'INTEGRITET.txt'), ('BETA_CHECKLIST.md', 'BETASTATUS.txt')]:
            archive.write(ROOT / source, name)
        archive.write(notices, 'TREDJEPARTSLICENSER.txt')
    with package.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    package.with_suffix('.sha256').write_text(f'{digest}  {package.name}\n', encoding='ascii')
    print(f'Paket klart: {package.name} ({package.stat().st_size / 1024 / 1024:.1f} MB)')
