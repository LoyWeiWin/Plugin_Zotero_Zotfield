var ZotFields;
var pluginScope;
function install() {}
function uninstall() {}
async function startup(data) {
  await Zotero.initializationPromise;
  pluginScope = { Zotero, Services, Cc, Ci, ChromeUtils };
  Services.scriptloader.loadSubScript(data.rootURI + "core.js", pluginScope);
  Services.scriptloader.loadSubScript(data.rootURI + "csv.js", pluginScope);
  Services.scriptloader.loadSubScript(data.rootURI + "export.js", pluginScope);
  Services.scriptloader.loadSubScript(data.rootURI + "plugin.js", pluginScope);
  ZotFields = pluginScope.ZotFields;
  await ZotFields.start(data.rootURI);
}
async function shutdown() {
  if (ZotFields) await ZotFields.stop();
  ZotFields = undefined;
  pluginScope = undefined;
}
function onMainWindowLoad({window}) { if (ZotFields) ZotFields.addWindow(window); }
function onMainWindowUnload({window}) { if (ZotFields) ZotFields.removeWindow(window); }
