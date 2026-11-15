"use strict";

var ZFCSV = (() => {
  const core = typeof ZFCore === "undefined" ? require("./core.js") : ZFCore;

  function parse(source) {
    source = String(source).replace(/^\uFEFF/, "");
    const rows = [];
    let row = [], value = "", quoted = false, closedQuote = false;
    const endCell = () => { row.push(value); value = ""; closedQuote = false; };
    for (let i = 0; i < source.length; i++) {
      const char = source[i];
      if (quoted) {
        if (char === '"') {
          if (source[i + 1] === '"') { value += '"'; i++; }
          else { quoted = false; closedQuote = true; }
        } else value += char;
      } else if (char === ",") endCell();
      else if (char === "\r" || char === "\n") {
        endCell(); rows.push(row); row = [];
        if (char === "\r" && source[i + 1] === "\n") i++;
      } else if (char === '"' && !value && !closedQuote) quoted = true;
      else {
        if (closedQuote || char === '"') throw Error("Invalid CSV returned by Zotero's exporter.");
        value += char;
      }
    }
    if (quoted) throw Error("Unclosed quoted field in Zotero's CSV export.");
    if (row.length || value || closedQuote) { endCell(); rows.push(row); }
    return rows;
  }

  function cell(value) {
    let text = value == null ? "" : String(value);
    // Prevent text from being evaluated as a formula when opened in a spreadsheet.
    if (/^[\s\u0000-\u001f]*[=+@-]/u.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function stringify(rows) {
    return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
  }

  function append(source, schema, valuesByKey) {
    core.validate(schema);
    const rows = parse(source);
    if (!rows.length) throw Error("Zotero's CSV export is empty.");
    const header = rows[0], keyIndex = header.indexOf("Key"), originalWidth = header.length;
    if (keyIndex < 0) throw Error("Zotero's CSV export does not contain a Key column.");
    const used = new Set(header.map(label => label.toLowerCase()));
    for (const field of schema) {
      const base = "ZotFields: " + field.label;
      let label = base;
      if (used.has(label.toLowerCase())) label += " [" + field.id + "]";
      let suffix = 2;
      while (used.has(label.toLowerCase())) label = base + " [" + field.id + "] (" + suffix++ + ")";
      used.add(label.toLowerCase()); header.push(label);
    }
    const seen = new Set();
    for (const row of rows.slice(1)) {
      if (row.length !== originalWidth) throw Error("Zotero returned a CSV row with an unexpected number of fields.");
      const key = row[keyIndex];
      if (!valuesByKey.has(key) || seen.has(key)) throw Error("Could not match an exported row to its Zotero reference: " + key);
      seen.add(key);
      const values = valuesByKey.get(key);
      for (const field of schema) row.push(core.display(field, values[field.id]));
    }
    if (seen.size !== valuesByKey.size) throw Error("Zotero did not export every selected reference. No file was written.");
    return stringify(rows);
  }
  return { parse, stringify, append };
})();
if (typeof module !== "undefined") module.exports = ZFCSV;
