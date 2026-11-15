const A=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const m=JSON.parse(fs.readFileSync(path.join(__dirname,'manifest.json'))),app=m.applications.zotero;
for(const k of ['id','update_url','strict_min_version','strict_max_version'])A.equal(typeof app[k],'string');
A.equal(m.version,'1.1.0');A.equal(app.strict_max_version,'10.0.*');A.equal(new URL(app.update_url).protocol,'https:');
for(const icon of Object.values(m.icons))A(fs.existsSync(path.join(__dirname,icon)));
console.log('PASS required installation metadata and icon files');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zf-preflight-'));
try{fs.copyFileSync(path.join(__dirname,'build.py'),path.join(dir,'build.py'));const broken=JSON.parse(JSON.stringify(m));delete broken.applications.zotero.update_url;fs.writeFileSync(path.join(dir,'manifest.json'),JSON.stringify(broken));const r=cp.spawnSync('python3',[path.join(dir,'build.py')],{encoding:'utf8'});A.notEqual(r.status,0);A.match(r.stderr,/Missing required applications.zotero.update_url/);console.log('PASS build rejects absent update URL');}finally{fs.rmSync(dir,{recursive:true,force:true});}
