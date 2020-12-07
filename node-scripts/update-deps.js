/**
 * @file Update NPM dependencies that are committed into this repository.
 */

const { copyFileSync } = require("fs");

const FILES_TO_COPY = {
  "node_modules/tablesort/dist/sorts/tablesort.number.min.js":
    "release/relay/100familiars/tablesort.number.min.js",
  "node_modules/tablesort/dist/tablesort.min.js":
    "release/relay/100familiars/tablesort.min.js",
  "node_modules/tablesort/tablesort.css":
    "release/relay/100familiars/tablesort.css",
};

try {
  for (const [source, dest] of Object.entries(FILES_TO_COPY)) {
    console.log(`Copying ${source} -> ${dest}`);
    copyFileSync(source, dest);
  }
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
