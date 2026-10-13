"""Rebuild the complete project ZIP and offline HTML using the standard library."""
from pathlib import Path
import base64
import mimetypes
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT.parent
NAME = 'Durgesh-Patil-Portfolio'


def data_uri(relative_path):
    path = ROOT / relative_path
    mime = mimetypes.guess_type(str(path))[0] or 'application/octet-stream'
    if path.suffix == '.woff2':
        mime = 'font/woff2'
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'styles.css').read_text(encoding='utf-8')
js = (ROOT / 'script.js').read_text(encoding='utf-8')
css = re.sub(r"url\('([^']+)'\)", lambda m: f"url('{data_uri(m.group(1))}')", css)
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="script.js"></script>', '<script>\n' + js + '\n</script>')
html = re.sub(r'^\s*<link rel="preload"[^>]+>\n', '', html, flags=re.M)
html = re.sub(
    r'(?P<attr>data-src|src|poster|href)="(?P<path>assets/[^"\s]+)"',
    lambda match: f'{match.group("attr")}="{data_uri(match.group("path"))}"', html)
licenses = (ROOT / 'assets/FONT-LICENSES.txt').read_text(encoding='utf-8')
html = html.replace('</body>', '<script id="font-licenses" type="text/plain">\n' + licenses + '\n</script>\n</body>')
standalone = OUTPUT / (NAME + '.html')
standalone.write_text(html, encoding='utf-8')

archive_path = OUTPUT / (NAME + '.zip')
with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(ROOT.rglob('*')):
        # Generated download copies must never be recursively included in the ZIP.
        relative = path.relative_to(ROOT)
        if not path.is_file() or path.is_symlink() or any(part in {'downloads', '__pycache__'} for part in relative.parts):
            continue
        archive.write(path, Path(NAME) / relative)
    archive.write(standalone, Path(NAME) / 'standalone.html')

# Make the deliverables directly downloadable from the running preview server.
downloads = ROOT / 'downloads'
downloads.mkdir(exist_ok=True)
shutil.copy2(archive_path, downloads / archive_path.name)
shutil.copy2(standalone, downloads / standalone.name)

print(f'Self-contained website: {standalone} ({standalone.stat().st_size:,} bytes)')
print(f'Complete project ZIP: {archive_path} ({archive_path.stat().st_size:,} bytes)')
