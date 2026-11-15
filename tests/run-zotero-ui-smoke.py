from pathlib import Path
import argparse, json, shutil, subprocess, time, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--binary',required=True)
parser.add_argument('--xpi',required=True)
parser.add_argument('--workspace',required=True)
parser.add_argument('--smoke',required=True)
parser.add_argument('--csv-translator',help='Path to an installed official CSV.js to seed the isolated test profile')
args=parser.parse_args()
root=Path(args.workspace).resolve()
root.mkdir(parents=True,exist_ok=True)
if any(root.iterdir()):
    raise SystemExit('Choose an empty workspace for this isolated test.')
profile=root/'profile'
data=root/'data'
profile.mkdir(parents=True,exist_ok=True)
data.mkdir(exist_ok=True)
if args.csv_translator:
    (data/'translators').mkdir(exist_ok=True)
    shutil.copyfile(args.csv_translator,data/'translators/CSV.js')
prefs={
    'extensions.zotero.dataDir':str(data),
    'extensions.zotero.useDataDir':True,
    'extensions.zotero.sync.autoSync':False,
    'extensions.zotero.firstRun':False,
    'browser.shell.checkDefaultBrowser':False,
    'app.update.auto':False,
    'extensions.autoDisableScopes':0,
    'extensions.enabledScopes':15,
    'xpinstall.signatures.required':False
}
(profile/'user.js').write_text(''.join('user_pref('+json.dumps(k)+', '+json.dumps(v)+');\n' for k,v in prefs.items()))
extension=profile/'extensions'/'zotfields@loy.local'
extension.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.xpi) as package:
    package.extractall(extension)
(extension/'ui-smoke.js').write_bytes(Path(args.smoke).read_bytes())
result_path=root/'result.json'
if result_path.exists():result_path.unlink()
startup=(extension/'bootstrap.js').read_text()
needle='  await ZotFields.start(data.rootURI);'
injection='''
  const testScope = { ...pluginScope };
  Services.scriptloader.loadSubScript(data.rootURI + "ui-smoke.js", testScope);
  testScope.runZotFieldsUISmoke(ZotFields, pluginScope.ZFCore)
    .then(result => IOUtils.writeJSON(RESULT_PATH, { ok:true, ...result }))
    .catch(error => IOUtils.writeJSON(RESULT_PATH, { ok:false, error:error.message, stack:error.stack }))
    .finally(() => Services.startup.quit(Ci.nsIAppStartup.eForceQuit));
'''.replace('RESULT_PATH',json.dumps(str(result_path)))
assert needle in startup
(extension/'bootstrap.js').write_text(startup.replace(needle,needle+injection))
with (root/'zotero.log').open('w') as log:
    proc=subprocess.Popen([str(Path(args.binary).resolve()),'--headless','--no-remote','--profile',str(profile)],stdout=log,stderr=log)
    try:
        for attempt in range(350):
            if result_path.exists():break
            if proc.poll() is not None:break
            time.sleep(0.1)
        if result_path.exists():
            result=json.loads(result_path.read_text())
            print(json.dumps(result,indent=2),flush=True)
            raise SystemExit(0 if result.get('ok') else 1)
        print('No result; Zotero log: '+str(root/'zotero.log'),flush=True)
        metadata=profile/'extensions.json'
        if metadata.exists():
            info=json.loads(metadata.read_text())
            print(json.dumps([{'id':x['id'],'version':x['version'],'active':x.get('active'),'appDisabled':x.get('appDisabled')} for x in info.get('addons',[])],indent=2))
        raise SystemExit(2)
    finally:
        if proc.poll() is None:proc.terminate()
        try:proc.wait(timeout=3)
        except subprocess.TimeoutExpired:proc.kill()
