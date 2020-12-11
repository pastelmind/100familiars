"use strict";
/**
 * @file Display your familiars and your best ascension run records with them.
 *
 * This script is largely based on matt.chugg's Familiar Collector/Ascension
 * Familiar Chooser script. For his work, see:
 * https://kolmafia.us/threads/familiar-collector-ascension-familiar-chooser.7433/
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = void 0;
var kolmafia_1 = require("kolmafia");
/**
 * Represents an exception thrown when the current KoLmafia version does not
 * match an expected condition.
 */
var KolmafiaVersionError = /** @class */ (function (_super) {
    __extends(KolmafiaVersionError, _super);
    function KolmafiaVersionError(message) {
        return _super.call(this, message) || this;
    }
    return KolmafiaVersionError;
}(Error));
sinceKolmafiaRevision(20550);
/**
 * Retrieves your highest familiar % run records.
 * For convenience, this does NOT check pre-NS13 ascension records.
 * @returns Mapping of familiar => best familiar run info
 */
function getFamiliarRuns() {
    var runs = new Map();
    var page = kolmafia_1.visitUrl("ascensionhistory.php?who=" + kolmafia_1.myId());
    var nodes = kolmafia_1.xpath(page, '//table[@id="history"]//tr[position() > 1]//img');
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        var match = /title="(.+?)\s*\((.+?)%/.exec(node);
        // Some challenge paths (e.g. Avatar of Boris) can have no familiar records
        if (!match)
            continue;
        // Use toFamiliar() because Familiar.get() crashes if it encounters an
        // unknown familiar name
        var familiarName = match[1];
        var fam = kolmafia_1.toFamiliar(familiarName);
        var runPercent = parseFloat(match[2]);
        // Skip unknown familiar
        if (fam === Familiar.get("none")) {
            kolmafia_1.print("Unknown familiar name: " + familiarName, "red");
            continue;
        }
        // Skip if this is not the best run for this familiar
        var prevRecord = runs.get(fam);
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
 * @returns Array of familiars in your terrarium. This may not include your
 *    currently active familiar.
 */
function getTerrarium() {
    var terrariumFamiliars = [];
    var page = kolmafia_1.visitUrl("familiar.php");
    var familiarIdPattern = /fam\((\d+)\)/g;
    var match;
    while ((match = familiarIdPattern.exec(page))) {
        // As of r20550, toFamiliar() in JS has a bug where many familiar IDs
        // incorrectly return Familiar.get("none").
        // This is why we're using Familiar.get() here, despite knowing that it will
        // crash if KoLmafia encounters an unknown familiar ID.
        var familiarId = Number(match[1]);
        // @ts-expect-error kolmafia-js 1.0.3 is missing type definitions for
        // Familiar.get() that accepts numbers
        var fam = Familiar.get(familiarId);
        // Skip unknown familiar
        if (fam === Familiar.get("none")) {
            kolmafia_1.print("Unknown familiar ID: " + familiarId, "red");
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
    var html = "\n<table class=\"familiars\">\n  <thead>\n    <tr>\n      <th class=\"no-sort\" data-sort-method=\"none\"></th>\n      <th>Familiar</th>\n      <th>Owned?</th>\n      <th>Best Run %</th>\n    </tr>\n  </thead>\n  <tbody>";
    var familiarRuns = getFamiliarRuns();
    var terrariumFamiliars = new Set(getTerrarium());
    for (var _i = 0, _a = Familiar.all(); _i < _a.length; _i++) {
        var fam = _a[_i];
        var bestRunText = "";
        var runPercentClasses = "col-run-pct";
        var ownedSymbol = void 0;
        var ownedClasses = "col-owned";
        if (kolmafia_1.haveFamiliar(fam) ||
            terrariumFamiliars.has(fam) ||
            familiarRuns.has(fam)) {
            var bestRunRecord = familiarRuns.get(fam);
            if (bestRunRecord) {
                var bestRunPercent = bestRunRecord.bestRunPercent;
                bestRunText = kolmafia_1.toString(bestRunPercent, "%.1f");
                if (bestRunPercent === 100) {
                    // Perfect run
                    runPercentClasses += " col-run-pct--perfect";
                }
                else if (bestRunPercent >= 90 && bestRunPercent < 100) {
                    // Contributes to an Amateur/Professional Tour Guide trophy
                    runPercentClasses += " col-run-pct--tourguide";
                }
            }
            ownedSymbol = "&#x2714;"; // Checkmark
            ownedClasses += " col-owned--yes";
        }
        else {
            ownedSymbol = "&#x2718;"; // X mark
            ownedClasses += " col-owned--no";
        }
        html += "\n    <tr>\n      <td class=\"col-img\"><img src=\"/images/itemimages/" + fam.image + "\"></td>\n      <td>" + String(fam) + "</td>\n      <td class=\"" + ownedClasses + "\">" + ownedSymbol + "</td>\n      <td class=\"" + runPercentClasses + "\">" + bestRunText + "</td>\n    </tr>";
    }
    html += "\n  </tbody>\n</table>\n";
    return html;
}
/**
 * Entrypoint of the relay script
 */
function main() {
    kolmafia_1.write("<!DOCTYPE html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"UTF-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n    <title>100familiars</title>\n    <script src=\"/100familiars/tablesort.min.js\"></script>\n    <script src=\"/100familiars/tablesort.number.min.js\"></script>\n    <link rel=\"stylesheet\" href=\"/100familiars/tablesort.css\">\n    <link rel=\"stylesheet\" href=\"/100familiars/style.css\">\n  </head>\n  <body>");
    kolmafia_1.write(generateFamiliarTable());
    kolmafia_1.write("\n  <script>\n    new Tablesort(document.getElementsByClassName('familiars')[0]);\n  </script>\n  </body>\n</html>");
}
exports.main = main;
/**
 * Checks if the current KoLmafia's revision number is same or greater than
 * `revision`.
 * This behaves like the `since rXXX;` statement in ASH.
 * @param revision Revision number
 * @throws {KolmafiaVersionError} If the current KoLmafia's revision number is
 *    less than `revision`.
 * @throws {TypeError} If `revision` is not an integer
 */
function sinceKolmafiaRevision(revision) {
    if (!Number.isInteger(revision)) {
        throw new TypeError("Invalid revision number " + revision + " (must be an integer)");
    }
    // Based on net.sourceforge.kolmafia.textui.Parser.sinceException()
    if (kolmafia_1.getRevision() < revision) {
        throw new KolmafiaVersionError("This script requires revision r" + revision + " of kolmafia or higher (current: " + kolmafia_1.getRevision() + "). Up-to-date builds can be found at https://ci.kolmafia.us/.");
    }
}
