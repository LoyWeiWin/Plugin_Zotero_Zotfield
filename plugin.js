var ZotFields = {
  id:"zotfields@loy.local", pref:"extensions.zotfields.schema", columns:[], windows:new Set(), queue:Promise.resolve(),
  schema() {const raw=Zotero.Prefs.get(this.pref,true);return raw?ZFCore.validate(JSON.parse(raw)):ZFCore.defaults();},
  async start(root) {
    this.root=root;
    this.chrome=Cc["@mozilla.org/addons/addon-manager-startup;1"].getService(Ci.amIAddonManagerStartup)
      .registerChrome(Services.io.newURI(root+"manifest.json"),[["content","zotfields","./"]]);
    this.section=Zotero.ItemPaneManager.registerSection({paneID:"zotfields-research",pluginID:this.id,
      header:{l10nID:"zotfields-title",icon:root+"icons/icon-16.png"},sidenav:{l10nID:"zotfields-title",icon:root+"icons/icon-20.png"},
      onInit:({doc})=>doc.defaultView.MozXULElement.insertFTLIfNeeded("zotfields.ftl"),
      onRender:ctx=>this.render(ctx)});
    await this.refreshColumns();
    for(const win of Zotero.getMainWindows()) this.addWindow(win);
  },
  addWindow(win) {
    if(this.windows.has(win)) return;this.windows.add(win);
    win.MozXULElement.insertFTLIfNeeded("zotfields.ftl");
    const menu=win.document.createXULElement("menuitem"); menu.id="zotfields-manage";menu.setAttribute("label","ZotFields: Manage custom fields…");
    menu.addEventListener("command",()=>this.manage(win));win.document.getElementById("menu_ToolsPopup")?.append(menu);
  },
  removeWindow(win) {win.document.getElementById("zotfields-manage")?.remove();win.document.querySelector('[href="zotfields.ftl"]')?.remove();this.windows.delete(win);},
  element(doc,tag,text) {const e=doc.createElementNS("http://www.w3.org/1999/xhtml",tag);if(text!==undefined)e.textContent=text;return e;},
  error(win,e) {Zotero.logError(e);Services.prompt.alert(win,"ZotFields",e.message||String(e));},
  enqueue(item,field,value) {
    const task=this.queue.then(async()=>{
      const values=ZFCore.read(item.getField("extra"));values[field.id]=value;
      item.setField("extra",ZFCore.write(item.getField("extra"),values));await item.saveTx();
    });this.queue=task.catch(()=>{});return task;
  },
  render({body,item,editable}) {
    const doc=body.ownerDocument,win=doc.defaultView;body.replaceChildren();
    if(!item?.isRegularItem()) {body.append(this.element(doc,"p","Select a bibliographic item."));return;}
    let values;try{values=ZFCore.read(item.getField("extra"));}catch(e){body.append(this.element(doc,"p",e.message));return;}
    const status=this.element(doc,"p");status.setAttribute("role","status");
    const save=async(f,v)=>{status.textContent="Saving…";try{await this.enqueue(item,f,v);status.textContent="Saved";}catch(e){status.textContent="Not saved: "+e.message;this.error(win,e);}};
    for(const f of this.schema()) {
      const box=this.element(doc,"fieldset"),legend=this.element(doc,"legend",f.label);box.append(legend);box.disabled=!editable;box.style.cssText="margin:8px 0;padding:8px;border:1px solid GrayText;border-radius:5px";
      const value=ZFCore.normal(f,values[f.id]);
      if(f.type==="boolean") {const label=this.element(doc,"label"),input=this.element(doc,"input");input.type="checkbox";input.checked=value===true;input.addEventListener("change",()=>save(f,input.checked));label.append(input,doc.createTextNode(" Yes"));box.append(label);}
      else if(f.type==="text") {const input=this.element(doc,"textarea");input.value=value||"";input.style.width="95%";input.setAttribute("aria-label",f.label);input.addEventListener("change",()=>save(f,input.value));box.append(input);}
      else {
        if(f.type==="choice") {const select=this.element(doc,"select");select.setAttribute("aria-label",f.label);const empty=this.element(doc,"option","— Not set —");empty.value="";select.append(empty);for(const o of f.options){const opt=this.element(doc,"option",o.label);opt.value=o.id;select.append(opt);}select.value=value||"";select.addEventListener("change",()=>save(f,select.value));box.append(select);}
        else {const selected=new Set(value||[]);for(const o of f.options) {const label=this.element(doc,"label"),input=this.element(doc,"input");label.style.cssText="display:block;margin:4px";input.type="checkbox";input.checked=selected.has(o.id);input.addEventListener("change",()=>{input.checked?selected.add(o.id):selected.delete(o.id);save(f,[...selected]);});label.append(input,doc.createTextNode(" "+o.label));box.append(label);}}
        const add=this.element(doc,"button","Add option…");add.type="button";add.style.margin="6px";add.addEventListener("click",async()=>{try{const name=this.ask(win,"New option","");if(!name)return;const schema=this.schema(),field=schema.find(x=>x.id===f.id);if(field.options.some(o=>o.label.toLowerCase()===name.toLowerCase()))throw new Error("That option already exists");field.options.push({id:this.uid(),label:name});await this.setSchema(schema);this.render({body,item,editable});}catch(e){this.error(win,e);}});box.append(add);
      }
      body.append(box);
    }
    body.append(status);const manage=this.element(doc,"button","Manage custom fields…");manage.type="button";manage.addEventListener("click",()=>this.manage(win));body.append(manage);
  },
  uid(){return "f"+Services.uuid.generateUUID().toString().replace(/[^a-z0-9]/gi,"");},
  ask(win,title,value) {const result={value};return Services.prompt.prompt(win,"ZotFields",title,result,null,{})?result.value.trim():null;},
  async setSchema(schema) {ZFCore.validate(schema);Zotero.Prefs.set(this.pref,JSON.stringify(schema),true);await this.refreshColumns();},
  async refreshColumns() {
    for(const key of this.columns) await Zotero.ItemTreeManager.unregisterColumn(key);this.columns=[];
    for(const f of this.schema().filter(f=>f.column)) this.columns.push(await Zotero.ItemTreeManager.registerColumn({dataKey:"zf_"+f.id,label:f.label,pluginID:this.id,dataProvider:item=>{try{return ZFCore.display(f,ZFCore.read(item.getField("extra"))[f.id]);}catch(_){return "Invalid ZotFields data";}}}));
  },
  manage(win) {win.openDialog("chrome://zotfields/content/manager.xhtml","zotfields-manager","chrome,centerscreen,resizable,width=760,height=650",{wrappedJSObject:{plugin:this,core:ZFCore}});},
  async stop() {await this.queue;for(const win of [...this.windows])this.removeWindow(win);if(this.section)Zotero.ItemPaneManager.unregisterSection(this.section);for(const key of this.columns)await Zotero.ItemTreeManager.unregisterColumn(key);this.chrome?.destruct();}
};
