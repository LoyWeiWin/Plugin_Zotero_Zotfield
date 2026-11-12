var ZFCore = (() => {
  const prefix = "ZotFields: ";
  const defaults = () => [
    {id:"read",label:"Read status",type:"choice",column:true,options:[{id:"unread",label:"Unread"},{id:"reading",label:"Reading"},{id:"read",label:"Read"}]},
    {id:"foundation",label:"Foundational paper",type:"boolean",column:true},
    {id:"methods",label:"Methods",type:"multi",column:true,options:[{id:"interview",label:"Interviews"},{id:"observation",label:"Observation"},{id:"experiment",label:"Experiment"},{id:"case-study",label:"Case study"},{id:"thematic",label:"Thematic analysis"}]}
  ];
  function read(extra) {
    const lines=extra.split(/\r?\n/).filter(x=>x.startsWith(prefix));
    if (lines.length>1) throw new Error("Multiple ZotFields records in Extra. Resolve them before editing.");
    if (!lines.length) return {};
    const value=JSON.parse(lines[0].slice(prefix.length));
    if (!value || Array.isArray(value) || typeof value!=="object") throw new Error("Invalid ZotFields record");
    return value;
  }
  function write(extra,values) {
    read(extra); // Refuse malformed or duplicate records; preserve unrelated text.
    const line=prefix+JSON.stringify(values);
    return extra.split(/\r?\n/).some(x=>x.startsWith(prefix))
      ? extra.replace(/^ZotFields: .*$/m,line) : extra+(extra && !extra.endsWith("\n")?"\n":"")+line;
  }
  function resolve(field,id) {
    const seen=new Set();
    while(field.aliases?.[id]) {if(seen.has(id)) throw new Error("Option alias cycle");seen.add(id);id=field.aliases[id];}
    return id;
  }
  function normal(field,value) {
    if(field.type==="multi") return [...new Set((Array.isArray(value)?value:[]).map(x=>resolve(field,x)))];
    return field.type==="choice"?resolve(field,value):value;
  }
  function display(field,value) {
    value=normal(field,value);
    const label=id=>field.options?.find(o=>o.id===id)?.label||id||"";
    if(field.type==="boolean") return value===true?"Yes":value===false?"No":"";
    return field.type==="multi"?value.map(label).join("; "):field.type==="choice"?label(value):value||"";
  }
  function validate(fields) {
    if(!Array.isArray(fields)||fields.length>100) throw new Error("Expected up to 100 field definitions");
    const ids=new Set();
    for(const f of fields) {
      if(!f.id||typeof f.id!=="string"||ids.has(f.id)||!f.label?.trim()||!["choice","multi","boolean","text"].includes(f.type)) throw new Error("Invalid or duplicate field");
      ids.add(f.id);
      if(["choice","multi"].includes(f.type)) {
        if(!Array.isArray(f.options)) throw new Error("Missing options");
        const options=new Set();
        for(const o of f.options) {if(!o.id||!o.label?.trim()||options.has(o.id)) throw new Error("Invalid option");options.add(o.id);}
        for(const key of Object.keys(f.aliases||{})) if(!options.has(resolve(f,key))) throw new Error("Alias target missing");
      }
    }
    return fields;
  }
  return {defaults,read,write,normal,display,validate,resolve};
})();
if(typeof module!=="undefined") module.exports=ZFCore;
