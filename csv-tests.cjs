const A = require('node:assert/strict');
const C = require('./core.js');
const CSV = require('./csv.js');
let count = 0;
function test(name, fn) { fn(); console.log('PASS ' + name); count++; }
const schema = C.defaults().concat([{id:'notes',label:'Research notes',type:'text',column:false}]);
const native = '\uFEFF"Key","Title","Author","DOI","Extra"\n"AAAA0001","A, quoted ""title""","Loy, Wei Win","10.123/a","Original Extra"\n"BBBB0002","第二篇","Smith, Jane","",""';
const values = new Map([
  ['AAAA0001',{read:'reading',foundation:false,methods:['interview','observation'],notes:'Line one\nLine two, "quoted"'}],
  ['BBBB0002',{}]
]);
const result = CSV.parse(CSV.append(native,schema,values));
test('appends every custom field after the original Zotero columns',()=>{
  A.deepEqual(result[0],['Key','Title','Author','DOI','Extra','ZotFields: Read status','ZotFields: Foundational paper','ZotFields: Methods','ZotFields: Research notes']);
});
test('keeps native metadata including quotes and commas',()=>{
  A.deepEqual(result[1].slice(0,5),CSV.parse(native)[1]);
});
test('exports readable option labels and false as No',()=>A.deepEqual(result[1].slice(5,8),['Reading','No','Interviews; Observation']));
test('keeps unset research fields blank',()=>A.deepEqual(result[2].slice(5),['','','','']));
test('retains custom multiline text and Unicode',()=>{
  A.equal(result[1][8],'Line one\nLine two, "quoted"'); A.equal(result[2][1],'第二篇');
});
test('exports fields hidden from library columns',()=>A.equal(result[0][8],'ZotFields: Research notes'));
test('resolves merged option IDs in exported values',()=>{
  const s=C.defaults();s[2].aliases={old:'interview'};
  const rows=CSV.parse(CSV.append('"Key"\n"A"',s,new Map([['A',{methods:['old','interview']}]])));
  A.equal(rows[1][3],'Interviews');
});
test('preserves unknown option IDs',()=>{
  const rows=CSV.parse(CSV.append('Key\nA',C.defaults(),new Map([['A',{read:'custom-unknown'}]])));
  A.equal(rows[1][1],'custom-unknown');
});
test('disambiguates duplicate custom headings',()=>{
  const s=[{id:'a',label:'Title',type:'text'},{id:'b',label:'Title',type:'text'}];
  const rows=CSV.parse(CSV.append('Key,Title\nA,Paper',s,new Map([['A',{}]])));
  A.deepEqual(rows[0],['Key','Title','ZotFields: Title','ZotFields: Title [b]']);
});
test('refuses missing, duplicated or mismatched reference keys',()=>{
  A.throws(()=>CSV.append('Title\nPaper',schema,values),/Key column/);
  A.throws(()=>CSV.append('Key\nAAAA0001\nAAAA0001',schema,values),/match/);
  A.throws(()=>CSV.append('Key\nUNKNOWN',schema,values),/match/);
  A.throws(()=>CSV.append('Key\nAAAA0001',schema,values),/every selected/);
});
test('refuses malformed CSV instead of shifting columns',()=>{
  A.throws(()=>CSV.append('Key,Title\nAAAA0001',schema,values),/number of fields/);
  A.throws(()=>CSV.parse('Key\n"unclosed'),/Unclosed/);
  A.throws(()=>CSV.parse('"Key"oops'),/Invalid/);
});
test('exports formula-like values as spreadsheet text',()=>{
  const cells=CSV.parse(CSV.stringify([['=HYPERLINK("https://example.test")',' \t+1','-2','@SUM(A1)','normal']]))[0];
  for(let i=0;i<4;i++)A(cells[i].startsWith("'"));
  A.equal(cells[4],'normal');
});
test('writes a single UTF-8 BOM and CRLF row endings',()=>{
  const text=CSV.append(native,schema,values);A(text.startsWith('\uFEFF"Key"'));A(!text.startsWith('\uFEFF\uFEFF'));A(text.endsWith('\r\n'));
});
console.log(count+' CSV export tests passed');
