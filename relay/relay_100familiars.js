/**
 * @file Display your familiars and your best ascension run records with them.
 *
 * This script is largely based on matt.chugg's Familiar Collector/Ascension
 * Familiar Chooser script. For his work, see:
 * https://kolmafia.us/threads/familiar-collector-ascension-familiar-chooser.7433/
 */

"use strict";

const {
  getRevision,
  haveFamiliar,
  myId,
  print,
  toFamiliar,
  toString: formatString,
  visitUrl,
  writeln,
  xpath,
} = require("kolmafia");

/**
 * Represents an exception thrown when the current KoLmafia version does not
 * match an expected condition.
 * @param {string} [message]
 * @class
 */
function KolmafiaVersionError(message) {
  this.name = "KolmafiaVersionError";
  this.message = message;
}
KolmafiaVersionError.prototype = Object.create(Error.prototype);

sinceKolmafiaRevision(20550);

/**
 * @typedef {object} FamiliarRunInfo
 *    Represents information about a single familiar % run.
 * @property {number} bestRunPercent
 *    Highest familiar % ever achieved in a run with this familiar
 */

/**
 * Retrieves your highest familiar % run records.
 * For convenience, this does NOT check pre-NS13 ascension records.
 * @returns {Map<Familiar, FamiliarRunInfo>}
 *    Mapping of familiar => best familiar run info
 */
function getFamiliarRuns() {
  /** @type {Map<Familiar, FamiliarRunInfo>} */
  const runs = new Map();

  const page = visitUrl("ascensionhistory.php?who=" + myId());
  const nodes = xpath(page, '//table[@id="history"]//tr[position() > 1]//img');

  for (let node of nodes) {
    let match = /title="(.+?)\s*\((.+?)%/.exec(node);
    // Some challenge paths (e.g. Avatar of Boris) can have no familiar records
    if (!match) continue;

    // Use toFamiliar() because Familiar.get() crashes if it encounters an
    // unknown familiar name
    let familiarName = match[1];
    let fam = toFamiliar(familiarName);
    let runPercent = parseFloat(match[2]);

    // Skip unknown familiar
    if (fam === Familiar.get("none")) {
      print("Unknown familiar name: " + familiarName, "red");
      continue;
    }

    // Skip if this is not the best run for this familiar
    let prevRecord = runs.get(fam);
    if (prevRecord && prevRecord.bestRunPercent >= runPercent) {
      continue;
    }

    runs.set(fam, { bestRunPercent: runPercent });
  }

  return runs;
}

/**
 * Check your terrarium to see what familiars you have.
 * This function is needed because `haveFamiliar()` always returns `false` if
 * you are in a challenge path that restricts familiars (e.g. Avatar of Boris).
 * @returns {Familiar[]} Array of familiars in your terrarium. This may not
 *    include your currently active familiar.
 */
function getTerrarium() {
  /** @type {Familiar[]} */
  const terrariumFamiliars = [];
  const page = visitUrl("familiar.php");
  const familiarIdPattern = /fam\((\d+)\)/g;
  let match;

  while ((match = familiarIdPattern.exec(page))) {
    // As of r20550, toFamiliar() in JS has a bug where many familiar IDs
    // incorrectly return Familiar.get("none").
    // This is why we're using Familiar.get() here, despite knowing that it will
    // crash if KoLmafia encounters an unknown familiar ID.
    let familiarId = Number(match[1]);
    // @ts-expect-error kolmafia-js 1.0.3 is missing type definitions for
    // Familiar.get() that accepts numbers
    let fam = Familiar.get(familiarId);

    // Skip unknown familiar
    if (fam === Familiar.get("none")) {
      print("Unknown familiar ID: " + familiarId, "red");
      continue;
    }

    terrariumFamiliars.push(fam);
  }

  return terrariumFamiliars;
}

/**
 * Generates a sortable HTML table of all familiars.
 * @returns {string} HTML for the familiar table
 */
function generateFamiliarTable() {
  let html =
    '<table class="familiars">\n' +
    "  <thead>\n" +
    "    <tr>\n" +
    '      <th class="no-sort" data-sort-method="none"></th>\n' +
    "      <th>Familiar</th>\n" +
    "      <th>Owned?</th>\n" +
    "      <th>Best Run %</th>\n" +
    "    </tr>\n" +
    "  </thead>\n" +
    "  <tbody>\n";

  const familiarRuns = getFamiliarRuns();
  const terrariumFamiliars = new Set(getTerrarium());

  for (let fam of Familiar.all()) {
    let bestRunText = "";
    let runPercentClasses = "col-run-pct";
    let ownedSymbol;
    let ownedClasses = "col-owned";

    if (
      haveFamiliar(fam) ||
      terrariumFamiliars.has(fam) ||
      familiarRuns.has(fam)
    ) {
      let bestRunRecord = familiarRuns.get(fam);
      if (bestRunRecord) {
        let { bestRunPercent } = bestRunRecord;
        bestRunText = formatString(bestRunPercent, "%.1f");

        if (bestRunPercent === 100) {
          // Perfect run
          runPercentClasses += " col-run-pct--perfect";
        } else if (bestRunPercent >= 90 && bestRunPercent < 100) {
          // Contributes to an Amateur/Professional Tour Guide trophy
          runPercentClasses += " col-run-pct--tourguide";
        }
      }

      ownedSymbol = "&#x2714;"; // Checkmark
      ownedClasses += " col-owned--yes";
    } else {
      ownedSymbol = "&#x2718;"; // X mark
      ownedClasses += " col-owned--no";
    }

    let imageUrl = "/images/itemimages/" + fam.image;

    html += "    <tr>\n";
    html += '      <td class="col-img"><img src="' + imageUrl + '"></td>\n';
    html += "      <td>" + fam + "</td>\n";
    html += '      <td class="' + ownedClasses + '">' + ownedSymbol + "</td>\n";
    html +=
      '      <td class="' + runPercentClasses + '">' + bestRunText + "</td>\n";
    html += "    </tr>\n";
  }

  html += "  </tbody>\n</table>\n";
  return html;
}

/**
 * Entrypoint of the relay script
 */
module.exports.main = () => {
  writeln("<!DOCTYPE html>");
  writeln('<html lang="en">');
  writeln("  <head>");
  writeln('    <meta charset="UTF-8" />');
  writeln(
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />'
  );
  writeln("    <title>100familiars</title>");
  writeln('    <script src="/100familiars/tablesort.min.js"></script>');
  writeln('    <script src="/100familiars/tablesort.number.min.js"></script>');
  writeln('    <link rel="stylesheet" href="/100familiars/tablesort.css">');
  writeln('    <link rel="stylesheet" href="/100familiars/style.css">');
  writeln("  </head>");
  writeln("  <body>");

  writeln(generateFamiliarTable());

  writeln("  <script>");
  writeln(
    "    new Tablesort(document.getElementsByClassName('familiars')[0]);"
  );
  writeln("  </script>");
  writeln("  </body>");
  writeln("  </body>");
  writeln("  </body>");
  writeln("</html>");
};

/**
 * Checks if the current KoLmafia's revision number is same or greater than
 * `revision`.
 * This behaves like the `since rXXX;` statement in ASH.
 * @param {number} revision Revision number
 * @throws {KolmafiaVersionError} If the current KoLmafia's revision number is
 *    less than `revision`.
 * @throws {TypeError} If `revision` is not an integer
 */
function sinceKolmafiaRevision(revision) {
  if (!Number.isInteger(revision)) {
    throw new TypeError(
      "Invalid revision number " + revision + " (must be an integer)"
    );
  }

  // Based on net.sourceforge.kolmafia.textui.Parser.sinceException()
  if (getRevision() < revision) {
    throw new KolmafiaVersionError(
      "This script requires requires revision r" +
        revision +
        " of kolmafia or higher (current: " +
        getRevision() +
        "). Up-to-date builds can be found at https://ci.kolmafia.us/."
    );
  }
}
