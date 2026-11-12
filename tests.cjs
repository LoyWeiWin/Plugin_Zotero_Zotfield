const A=require('node:assert/strict'),C=require('./core.js'),fs=require('fs'),vm=require('vm');
let n=0;function t(name,fn){fn();console.log('PASS '+name);n++;}
t('preserves unrelated Extra',()=>{const x=C.write('DOI: abc\nNote', {a:true});A(x.startsWith('DOI: abc\nNote\n'));A.deepEqual(C.read(x),{a:true});});
t('replaces own line only',()=>A.equal(C.write('A\nZotFields: {}\nB',{x:1}),'A\nZotFields: {"x":1}\nB'));
t('blocks malformed JSON',()=>A.throws(()=>C.write('ZotFields: broken',{})));
t('blocks duplicate records',()=>A.throws(()=>C.read('ZotFields: {}\nZotFields: {}')));
t('blocks non-object',()=>A.throws(()=>C.read('ZotFields: []')));
t('valid defaults',()=>C.validate(C.defaults()));
t('blocks duplicate fields',()=>A.throws(()=>C.validate([C.defaults()[0],C.defaults()[0]])));
t('blocks invalid types',()=>A.throws(()=>C.validate([{id:'x',label:'X',type:'bad'}])));
const f={id:'m',label:'Methods',type:'multi',options:[{id:'b',label:'Interviews'}],aliases:{a:'b'}};
t('renames and merges resolve',()=>A.equal(C.display(f,['a']),'Interviews'));
t('merges deduplicate',()=>A.deepEqual(C.normal(f,['a','b']),['b']));
t('unknown IDs preserved',()=>A.equal(C.display(f,['unknown']),'unknown'));
t('blocks alias cycles',()=>A.throws(()=>C.validate([{...f,aliases:{a:'c',c:'a'}}])));
t('blocks missing alias targets',()=>A.throws(()=>C.validate([{...f,aliases:{a:'missing'}}])));
t('false differs from missing',()=>{A.equal(C.display({type:'boolean'},false),'No');A.equal(C.display({type:'boolean'},undefined),'');});
(async()=>{const ctx={ZFCore:C};vm.createContext(ctx);vm.runInContext(fs.readFileSync('./plugin.js','utf8'),ctx);let extra='Original';const item={getField:()=>extra,setField:(_,v)=>extra=v,saveTx:async()=>new Promise(r=>setTimeout(r,3))};await Promise.all([ctx.ZotFields.enqueue(item,{id:'read'},'reading'),ctx.ZotFields.enqueue(item,{id:'methods'},['a'])]);A.deepEqual(C.read(extra),{read:'reading',methods:['a']});console.log('PASS queued saves preserve edits');console.log(`${n+1} tests passed`);})().catch(e=>{console.error(e);process.exitCode=1;});
