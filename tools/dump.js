/* Evaluate the site's data files and print them as JSON on stdout.
 *
 * The data files are hand-written JavaScript — comments, string concatenation,
 * template literals full of HTML — so they are not JSON and cannot be parsed as
 * such. Rather than write a fragile JS-subset parser in Python, serve.py shells
 * out to node and lets a real engine do it.
 *
 * They all assign to `window.CELICA`, so a bare global `window` is all the
 * scaffolding they need.
 *
 *   node tools/dump.js site/data/issues.js site/data/mods.js ...
 */
'use strict';
const path = require('path');

global.window = {};

for (const f of process.argv.slice(2)) {
  require(path.resolve(f));
}

process.stdout.write(JSON.stringify(global.window.CELICA || {}));
