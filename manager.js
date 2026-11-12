"use strict";
const {plugin:P,core:C}=window.arguments[0].wrappedJSObject;
const $=id=>document.getElementById(id);
function node(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e;}
function button(parent,label,fn){const b=node("button",label);b.onclick=()=>Promise.resolve().then(fn).catch(e=>{$("message").textContent=e.message;});parent.append(b);}
async function update(schema){await P.setSchema(schema);render();$("message").textContent="Saved. Re-select the item to refresh its panel.";}
function render(){const root=$("fields");root.replaceChildren();for(const f of P.schema()){
 const box=node("fieldset");box.append(node("legend",f.label+" ("+f.type+")"));
 button(box,"Rename field…",async()=>{const label=P.ask(window,"Field label",f.label);if(!label)return;const s=P.schema();s.find(x=>x.id===f.id).label=label;await update(s);});
 const label=node("label"),check=node("input");check.type="checkbox";check.checked=!!f.column;check.onchange=async()=>{try{const s=P.schema();s.find(x=>x.id===f.id).column=check.checked;await update(s);}catch(e){$("message").textContent=e.message;}};label.append(check,document.createTextNode(" Available as a library column"));box.append(label);
 if(f.options){const select=node("select");select.setAttribute("aria-label",f.label+" options");for(const o of f.options){const option=node("option",o.label);option.value=o.id;select.append(option);}box.append(select);
 button(box,"Add option…",async()=>{const name=P.ask(window,"New option","");if(!name)return;const s=P.schema(),field=s.find(x=>x.id===f.id);if(field.options.some(o=>o.label.toLowerCase()===name.toLowerCase()))throw Error("Option already exists");field.options.push({id:P.uid(),label:name});await update(s);});
 button(box,"Rename option…",async()=>{const old=f.options.find(o=>o.id===select.value);if(!old)return;const name=P.ask(window,"New option label",old.label);if(!name)return;if(f.options.some(o=>o.id!==old.id&&o.label.toLowerCase()===name.toLowerCase()))throw Error("Use Merge to combine duplicate options");const s=P.schema();s.find(x=>x.id===f.id).options.find(o=>o.id===old.id).label=name;await update(s);});
 button(box,"Merge / reassign option…",async()=>{const old=f.options.find(o=>o.id===select.value);if(!old)return;const name=P.ask(window,"Enter the existing destination option label. The selected option will be reassigned on display and on future saves.","");if(!name)return;const target=f.options.find(o=>o.label.toLowerCase()===name.toLowerCase());if(!target||target.id===old.id)throw Error("Choose a different existing option");const s=P.schema(),field=s.find(x=>x.id===f.id);field.aliases={...field.aliases,[old.id]:target.id};field.options=field.options.filter(o=>o.id!==old.id);await update(s);});
 }
 root.append(box);
}}
$("add").onclick=async()=>{try{const label=P.ask(window,"New field label","");if(!label)return;const type=P.ask(window,"Type: text, boolean, choice, or multi","multi");if(!type)return;const s=P.schema();if(s.some(f=>f.label.toLowerCase()===label.toLowerCase()))throw Error("Field label already exists");s.push({id:P.uid(),label,type,column:false,...(["choice","multi"].includes(type)?{options:[]}: {})});await update(s);}catch(e){$("message").textContent=e.message;}};
$("export").onclick=()=>{$("json").value=JSON.stringify(P.schema(),null,2);};
$("import").onclick=async()=>{try{const schema=C.validate(JSON.parse($("json").value));if(!window.confirm("Replace field definitions? Export the current definitions first if you need to restore them."))return;await update(schema);}catch(e){$("message").textContent=e.message;}};
render();
