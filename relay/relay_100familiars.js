'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var kolmafia = require('kolmafia');

/**
 * @file Functions for sending Kmails and gifts to other players.
 */
/** Error class used when sending a kmail to another player fails. */
var KmailError = /*@__PURE__*/(function (Error) {
    function KmailError(recipent, message) {
        if (message === undefined) {
            message = "Failed to send gift to '" + recipent + "'";
        }
        Error.call(this, message);
        this.message = message;
        this.recipent = recipent;
    }

    if ( Error ) { KmailError.__proto__ = Error; }
    KmailError.prototype = Object.create( Error && Error.prototype );
    KmailError.prototype.constructor = KmailError;

    return KmailError;
}(Error));
KmailError.prototype.name = 'KmailError';

/**
 * @file Utilities for writing JavaScript code that runs in KoLmafia.
 */
/**
 * Represents an exception thrown when the current KoLmafia version does not
 * match an expected condition.
 */
var KolmafiaVersionError = /*@__PURE__*/(function (Error) {
    function KolmafiaVersionError(message) {
        Error.call(this, message);
        // Explicitly set the prototype, so that 'instanceof' still works in Node.js
        // even when the class is transpiled down to ES5
        // See: https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
        // Note that this code isn't needed for Rhino.
        Object.setPrototypeOf(this, KolmafiaVersionError.prototype);
    }

    if ( Error ) { KolmafiaVersionError.__proto__ = Error; }
    KolmafiaVersionError.prototype = Object.create( Error && Error.prototype );
    KolmafiaVersionError.prototype.constructor = KolmafiaVersionError;

    return KolmafiaVersionError;
}(Error));
// Manually set class name, so that the stack trace shows proper name in Rhino
KolmafiaVersionError.prototype.name = 'KolmafiaVersionError';
/**
 * Returns the currently executing script name, suitable for embedding in an
 * error message.
 * @returns Path of the main script wrapped in single-quotes, or `"This script"`
 *    if the path cannot be determined
 */
function getScriptName() {
    var _a;
    // In Rhino, the current script name is available in require.main.id
    var scriptName = (_a = require.main) === null || _a === void 0 ? void 0 : _a.id;
    return scriptName ? ("'" + scriptName + "'") : 'This script';
}
/**
 * If KoLmafia's revision number is less than `revision`, throws an exception.
 * Otherwise, does nothing.
 *
 * This behaves like the `since rXXX;` statement in ASH.
 * @param revision Revision number
 * @throws {KolmafiaVersionError}
 *    If KoLmafia's revision number is less than `revision`.
 * @throws {TypeError} If `revision` is not an integer
 */
function sinceKolmafiaRevision(revision) {
    if (!Number.isInteger(revision)) {
        throw new TypeError(("Invalid revision number " + revision + " (must be an integer)"));
    }
    // Based on net.sourceforge.kolmafia.textui.Parser.sinceException()
    if (kolmafia.getRevision() < revision) {
        throw new KolmafiaVersionError(((getScriptName()) + " requires revision r" + revision + " of kolmafia or higher (current: " + (kolmafia.getRevision()) + "). Up-to-date builds can be found at https://ci.kolmafia.us/."));
    }
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var vhtml = {exports: {}};

(function (module, exports) {
	(function (global, factory) {
		module.exports = factory() ;
	}(commonjsGlobal, (function () {
	var emptyTags = ['area', 'base', 'br', 'col', 'command', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

	var esc = function esc(str) {
		return String(str).replace(/[&<>"']/g, function (s) {
			return '&' + map[s] + ';';
		});
	};
	var map = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' };
	var setInnerHTMLAttr = 'dangerouslySetInnerHTML';
	var DOMAttributeNames = {
		className: 'class',
		htmlFor: 'for'
	};

	var sanitized = {};

	function h(name, attrs) {
		var stack = [],
		    s = '';
		attrs = attrs || {};
		for (var i = arguments.length; i-- > 2;) {
			stack.push(arguments[i]);
		}

		if (typeof name === 'function') {
			attrs.children = stack.reverse();
			return name(attrs);
		}

		if (name) {
			s += '<' + name;
			if (attrs) { for (var _i in attrs) {
				if (attrs[_i] !== false && attrs[_i] != null && _i !== setInnerHTMLAttr) {
					s += ' ' + (DOMAttributeNames[_i] ? DOMAttributeNames[_i] : esc(_i)) + '="' + esc(attrs[_i]) + '"';
				}
			} }
			s += '>';
		}

		if (emptyTags.indexOf(name) === -1) {
			if (attrs[setInnerHTMLAttr]) {
				s += attrs[setInnerHTMLAttr].__html;
			} else { while (stack.length) {
				var child = stack.pop();
				if (child) {
					if (child.pop) {
						for (var _i2 = child.length; _i2--;) {
							stack.push(child[_i2]);
						}
					} else {
						s += sanitized[child] === true ? child : esc(child);
					}
				}
			} }

			s += name ? '</' + name + '>' : '';
		}

		sanitized[s] = true;
		return s;
	}

	return h;

	})));
	
} (vhtml));

var h = vhtml.exports;

/**
 * @file Display your familiars and your best ascension run records with them.
 *
 * This script is largely based on matt.chugg's Familiar Collector/Ascension
 * Familiar Chooser script. For his work, see:
 * https://kolmafia.us/threads/familiar-collector-ascension-familiar-chooser.7433/
 */
sinceKolmafiaRevision(20550);
/**
 * Retrieves your highest familiar % run records.
 * For convenience, this does NOT check pre-NS13 ascension records.
 * @returns Mapping of familiar => best familiar run info
 */
function getFamiliarRuns() {
    var runs = new Map();
    var page = kolmafia.visitUrl('ascensionhistory.php?who=' + kolmafia.myId());
    var nodes = kolmafia.xpath(page, '//table[@id="history"]//tr[position() > 1]//img');
    for (var node of nodes) {
        var match = /title="(.+?)\s*\((.+?)%/.exec(node);
        // Some challenge paths (e.g. Avatar of Boris) can have no familiar records
        if (!match)
            { continue; }
        // Use toFamiliar() because Familiar.get() crashes if it encounters an
        // unknown familiar name
        var familiarName = kolmafia.entityDecode(match[1]);
        var fam = kolmafia.toFamiliar(familiarName);
        var runPercent = parseFloat(match[2]);
        // Skip unknown familiar
        if (fam === Familiar.get('none')) {
            kolmafia.print('Unknown familiar name: ' + familiarName, 'red');
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
    var page = kolmafia.visitUrl('familiar.php');
    var familiarIdPattern = /fam\((\d+)\)/g;
    var match;
    while ((match = familiarIdPattern.exec(page))) {
        // As of r20550, toFamiliar() returns the 'none' familiar for many IDs
        // converted using Number() or parseInt(). To properly convert integers,
        // we need to use toInt().
        var familiarId = kolmafia.toInt(match[1]);
        var fam = Familiar.get(familiarId);
        // Skip unknown familiar
        if (fam === Familiar.get('none')) {
            kolmafia.print('Unknown familiar ID: ' + familiarId, 'red');
            continue;
        }
        terrariumFamiliars.push(fam);
    }
    return terrariumFamiliars;
}
/**
 * Generates a sortable HTML table of all familiars.
 * @returns HTML for the familiar table
 */
function FamiliarTable() {
    var familiarRuns = getFamiliarRuns();
    var terrariumFamiliars = new Set(getTerrarium());
    return (h("table", { class: "familiars display compact", "data-length-menu": '[[-1, 10, 25, 50, 100], ["All", 10, 25, 50, 100]]', "data-order": '[[1, "asc"]]' },
        h("thead", null,
            h("tr", null,
                h("th", { "data-orderable": "false" }),
                h("th", null, "ID"),
                h("th", null, "Familiar"),
                h("th", { "data-orderable": "false" }, "Links"),
                h("th", null, "Owned?"),
                h("th", null, "Best Run %"))),
        h("tbody", null, Familiar.all().map(fam => {
            var bestRunText = '';
            var runPercentClasses = 'col-run-pct';
            var ownedSymbol;
            var ownedClasses = 'col-owned';
            if (kolmafia.haveFamiliar(fam) ||
                terrariumFamiliars.has(fam) ||
                familiarRuns.has(fam)) {
                var bestRunRecord = familiarRuns.get(fam);
                if (bestRunRecord) {
                    var bestRunPercent = bestRunRecord.bestRunPercent;
                    bestRunText = kolmafia.toString(bestRunPercent, '%.1f');
                    if (bestRunPercent === 100) {
                        // Perfect run
                        runPercentClasses += ' col-run-pct--perfect';
                    }
                    else if (bestRunPercent >= 90 && bestRunPercent < 100) {
                        // Contributes to an Amateur/Professional Tour Guide trophy
                        runPercentClasses += ' col-run-pct--tourguide';
                    }
                }
                ownedSymbol = '&#x2714;'; // Checkmark
                ownedClasses += ' col-owned--yes';
            }
            else {
                ownedSymbol = '&#x2718;'; // X mark
                ownedClasses += ' col-owned--no';
            }
            return (h("tr", null,
                h("td", { class: "col-img" },
                    h("img", { src: '/images/itemimages/' + fam.image })),
                h("td", { class: "col-familiar-id" }, kolmafia.toInt(fam)),
                h("td", null, String(fam)),
                h("td", { class: "col-links" },
                    h("a", { class: "popup-link", href: '/desc_familiar.php?which=' + kolmafia.toInt(fam), rel: "noreferrer noopener", target: "_blank" },
                        h("img", { class: "link-image", src: "images/otherimages/tinyglass.gif", alt: "See in-game description", title: "See in-game description" })),
                    "\u00A0",
                    h("a", { href: 'https://kol.coldfront.net/thekolwiki/index.php/' +
                            encodeURI(String(fam)), rel: "noreferrer noopener", target: "_blank" },
                        h("img", { class: "link-image", src: "images/otherimages/letters/w.gif", alt: "Visit KoL wiki", title: "Visit KoL wiki" }))),
                h("td", { class: ownedClasses, dangerouslySetInnerHTML: { __html: ownedSymbol } }),
                h("td", { class: runPercentClasses }, bestRunText)));
        }))));
}
/**
 * Entrypoint of the relay script
 */
function main() {
    kolmafia.write('<!DOCTYPE html>' +
        (h("html", { lang: "en" },
            h("head", null,
                h("meta", { charset: "UTF-8" }),
                h("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
                h("title", null, "100familiars"),
                h("script", { src: "/100familiars/jquery.slim.min.js" }),
                h("script", { src: "/100familiars/jquery.Datatables.min.js" }),
                h("script", { src: "/100familiars/dataTables.dataTables.min.js" }),
                h("script", { src: "/100familiars/100familiars.js" }),
                h("link", { rel: "stylesheet", href: "/images/relayimages/100familiars/css/jquery.Datatables.min.css" }),
                h("link", { rel: "stylesheet", href: "/100familiars/style.css" })),
            h("body", null,
                h(FamiliarTable, null)))));
}

exports.main = main;
