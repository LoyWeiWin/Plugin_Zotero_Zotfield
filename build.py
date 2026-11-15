"""Build the installable XPI without packaging docs, tests or repository metadata."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json
p=Path(__file__).resolve().parent
manifest=json.loads((p/'manifest.json').read_text())
app=manifest.get('applications',{}).get('zotero',{})
for key in ['id','update_url','strict_min_version','strict_max_version']:
    if not app.get(key):
        raise ValueError(f'Missing required applications.zotero.{key}')
version=manifest['version']
out=p/'dist'/f'ZotFields_v{version}.xpi'
out.parent.mkdir(exist_ok=True)
runtime=['manifest.json','bootstrap.js','core.js','plugin.js','manager.js','manager.xhtml','editor.js','editor.xhtml','csv.js','export.js','export-ui.js','export.xhtml']
files=[p/name for name in runtime]
for directory in ['icons','locale']:
    files.extend(f for f in (p/directory).rglob('*') if f.is_file())
with ZipFile(out,'w',ZIP_DEFLATED) as z:
    for f in sorted(files):
        info=__import__('zipfile').ZipInfo(f.relative_to(p).as_posix(),(2026,1,1,0,0,0))
        info.compress_type=ZIP_DEFLATED
        info.external_attr=0o644 << 16
        z.writestr(info,f.read_bytes())
print(out)
