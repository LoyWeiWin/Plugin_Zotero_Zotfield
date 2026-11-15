async function runZotFieldsUISmoke(ZotFields, Core) {
  await Zotero.uiReadyPromise;
  const result = { version: Zotero.version, checks: [] };
  const win = Zotero.getMainWindow();
  const doc = win.document;
  const wait = ms => new Promise(resolve => win.setTimeout(resolve, ms));
  function check(condition, name) {
    if (!condition) throw Error(name);
    result.checks.push(name);
  }
  async function until(predicate, name) {
    for (let n = 0; n < 100; n++) {
      if (predicate()) return;
      await wait(50);
    }
    throw Error('Timed out: ' + name);
  }
  const values = item => {
    const record = item.getField('extra').split(/\r?\n/).find(line => line.startsWith('ZotFields: '));
    return record ? JSON.parse(record.slice(11)) : {};
  };
  const fieldset = (root, name) => [...root.querySelectorAll('fieldset')].find(box => box.querySelector('legend').textContent === name);
  const change = async (element, value) => {
    if (element.type === 'checkbox') element.checked = value;
    else element.value = value;
    element.dispatchEvent(new element.ownerDocument.defaultView.Event('change', { bubbles: true }));
    await ZotFields.queue;
    await wait(30);
  };
  try {
    await wait(300);
    const a = new Zotero.Item('journalArticle');
    a.setField('title', 'ZotFields regression item A');
    a.setField('extra', 'Original metadata: keep this');
    await a.saveTx();
    const b = new Zotero.Item('book');
    b.setField('title', 'ZotFields regression item B');
    await b.saveTx();
    result.itemIDs = [a.id, b.id];
    async function select(item) {
      win.focus();
      await win.ZoteroPane.selectItem(item.id);
      await until(() => [...doc.querySelectorAll('item-pane-custom-section')].some(node => node.paneID === ZotFields.section && node.item?.id === item.id), 'Selected item reaches the item pane');
      const section = [...doc.querySelectorAll('item-pane-custom-section')].find(node => node.paneID === ZotFields.section && node.item?.id === item.id);
      if (!section) throw Error('Registered section is missing');
      section.open = true;
      section.scrollIntoView();
      await section._forceRenderAll();
      await doc.l10n.translateFragment(section);
      await wait(30);
      return section;
    }
    let section = await select(a);
    check(section.querySelectorAll('fieldset').length === 3, 'Three default fields remain visible after Fluent translation');
    check(section.querySelector('[data-type="body"]')?.isConnected, 'The item panel body remains connected');
    check(section.querySelector('collapsible-section').label === 'Research metadata', 'Section heading is applied as a label');
    check(!!section.querySelector('collapsible-section .head'), 'Collapsible section header controls survive translation');
    check(a.getField('extra') === 'Original metadata: keep this', 'Displaying blank fields does not modify the item');
    const initial = section.querySelectorAll('select, input');
    check(initial.length === 7, 'Single choice, boolean and five multiple-choice inputs are available');
    await change(fieldset(section, 'Read status').querySelector('select'), 'reading');
    await change(fieldset(section, 'Foundational paper').querySelector('input'), true);
    const methodInputs = fieldset(section, 'Methods').querySelectorAll('input');
    await change(methodInputs[0], true);
    await change(methodInputs[1], true);
    check(values(a).read === 'reading' && values(a).foundation === true, 'Reading status and boolean changes are saved');
    check(values(a).methods.join(',') === 'interview,observation', 'Multiple-choice selections are saved together');
    check(a.getField('extra').startsWith('Original metadata: keep this\n'), 'Unrelated Extra metadata is preserved');
    section = await select(b);
    check(fieldset(section, 'Read status').querySelector('select').value === '', 'Another item starts with its own blank values');
    check(!fieldset(section, 'Foundational paper').querySelector('input').checked, 'The boolean does not leak between items');
    await change(fieldset(section, 'Read status').querySelector('select'), 'read');
    check(values(b).read === 'read' && values(a).read === 'reading', 'Each bibliographic item stores independent values');
    section = await select(a);
    check(fieldset(section, 'Read status').querySelector('select').value === 'reading', 'Reading status is restored when returning to an item');
    check(fieldset(section, 'Foundational paper').querySelector('input').checked, 'Boolean state is restored when returning to an item');
    check([...fieldset(section, 'Methods').querySelectorAll('input')].filter(input => input.checked).length === 2, 'Multiple-choice states are restored when returning to an item');
    check(!!doc.getElementById('zotfields-edit'), 'The direct item editor is available in Tools');
    const editor = ZotFields.editSelected(win);
    await until(() => editor.document.querySelectorAll('fieldset').length === 3, 'Direct editor loads');
    check(editor.document.getElementById('item-title').textContent === a.getField('title'), 'The direct editor identifies the selected item');
    await change(fieldset(editor.document, 'Read status').querySelector('select'), 'unread');
    check(values(a).read === 'unread', 'The direct editor saves metadata to the selected item');
    const schema = ZotFields.schema();
    schema.push({ id: 'test-text', label: 'Research notes', type: 'text', column: false });
    await ZotFields.setSchema(schema);
    check(section.querySelectorAll('fieldset').length === 4, 'Changing definitions immediately refreshes the item panel');
    check(editor.document.querySelectorAll('fieldset').length === 4, 'Changing definitions immediately refreshes the direct editor');
    await change(fieldset(section, 'Research notes').querySelector('textarea'), 'A note stored only on item A');
    check(values(a)['test-text'] === 'A note stored only on item A', 'Custom text fields save per-item values');
    const manager = ZotFields.manage(win);
    await until(() => manager.document.querySelectorAll('#fields > fieldset').length === 4, 'Manager loads');
    manager.document.getElementById('add').click();
    check(!manager.document.getElementById('new-field-form').hidden, 'Add field displays the input form');
    manager.document.getElementById('field-label').value = 'Evidence type';
    manager.document.getElementById('field-type').value = 'choice';
    manager.document.getElementById('new-field-form').dispatchEvent(new manager.Event('submit', { bubbles: true, cancelable: true }));
    await until(() => ZotFields.schema().length === 5 && manager.document.getElementById('new-field-form').hidden, 'Manager saves a new field');
    check(section.querySelectorAll('fieldset').length === 5 && editor.document.querySelectorAll('fieldset').length === 5, 'New fields appear on the current item without re-selection');
    const withOptions = ZotFields.schema();
    const evidence = withOptions.find(field => field.label === 'Evidence type');
    evidence.options.push({ id: 'technical', label: 'Technical feasibility' });
    await ZotFields.setSchema(withOptions);
    await change(fieldset(editor.document, 'Evidence type').querySelector('select'), 'technical');
    check(values(a)[evidence.id] === 'technical', 'A newly created choice field saves a selected option');
    section = await select(b);
    check(fieldset(section, 'Research notes').querySelector('textarea').value === '', 'New fields are available with independent values on other items');
    check(fieldset(section, 'Evidence type').querySelector('select').value === '', 'Custom choice values do not leak to other items');
    const readonly = doc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    ZotFields.render({ body: readonly, item: b, editable: false });
    check([...readonly.querySelectorAll('fieldset')].every(box => box.disabled), 'Read-only items disable all value controls');
    const invalid = new Zotero.Item('journalArticle');
    invalid.setField('title', 'Malformed metadata test');
    invalid.setField('extra', 'ZotFields: {broken');
    await invalid.saveTx();
    let refused = false;
    try { await ZotFields.enqueue(invalid, { id: 'read' }, 'read'); } catch (_) { refused = true; }
    check(refused && invalid.getField('extra') === 'ZotFields: {broken', 'Malformed stored metadata is refused without being overwritten');
    result.savedState = { a: values(a), b: values(b), aKey: a.key, bKey: b.key };
    await ZotFields.stop();
    await until(() => editor.closed && manager.closed, 'The add-on windows finish closing');
    check(editor.closed && manager.closed, 'Disabling the add-on closes its editor and manager windows');
    check(!doc.getElementById('zotfields-edit') && !doc.getElementById('zotfields-manage'), 'Disabling the add-on removes its Tools commands');
    check(ZotFields.panels.size === 0 && ZotFields.columns.length === 0, 'Disabling the add-on clears section callbacks and column registrations');
    result.passed = true;
  } catch (error) { result.passed = false; result.error = String(error); result.stack = error.stack; }
  if (!result.passed) throw Error(result.error + "\n" + result.stack);
  return result;
}
