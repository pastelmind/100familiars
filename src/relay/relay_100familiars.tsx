/**
 * @file Display your familiars and your best ascension run records with them.
 *
 * This script is largely based on matt.chugg's Familiar Collector/Ascension
 * Familiar Chooser script. For his work, see:
 * https://kolmafia.us/threads/familiar-collector-ascension-familiar-chooser.7433/
 */

import {
  entityDecode,
  haveFamiliar,
  myId,
  print,
  toFamiliar,
  toString as formatString,
  visitUrl,
  write,
  xpath,
} from "kolmafia";
import { sinceKolmafiaRevision } from "kolmafia-util";

import h from "vhtml";

sinceKolmafiaRevision(20550);

/**
 * Represents information about a single familiar % run.
 */
interface FamiliarRunInfo {
  /**
   * Highest familiar % ever achieved in a run with this familiar
   */
  bestRunPercent: number;
}

/**
 * Retrieves your highest familiar % run records.
 * For convenience, this does NOT check pre-NS13 ascension records.
 * @returns Mapping of familiar => best familiar run info
 */
function getFamiliarRuns(): Map<Familiar, FamiliarRunInfo> {
  const runs = new Map<Familiar, FamiliarRunInfo>();

  const page = visitUrl("ascensionhistory.php?who=" + myId());
  const nodes = xpath(page, '//table[@id="history"]//tr[position() > 1]//img');

  for (let node of nodes) {
    let match = /title="(.+?)\s*\((.+?)%/.exec(node);
    // Some challenge paths (e.g. Avatar of Boris) can have no familiar records
    if (!match) continue;

    // Use toFamiliar() because Familiar.get() crashes if it encounters an
    // unknown familiar name
    let familiarName = entityDecode(match[1]);
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
 * @returns Array of familiars in your terrarium. This may not include your
 *    currently active familiar.
 */
function getTerrarium(): Familiar[] {
  const terrariumFamiliars: Familiar[] = [];
  const page = visitUrl("familiar.php");
  const familiarIdPattern = /fam\((\d+)\)/g;
  let match;

  while ((match = familiarIdPattern.exec(page))) {
    // As of r20550, toFamiliar() in JS has a bug where many familiar IDs
    // incorrectly return Familiar.get("none").
    // This is why we're using Familiar.get() here, despite knowing that it will
    // crash if KoLmafia encounters an unknown familiar ID.
    let familiarId = Number(match[1]);
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
 * @returns HTML for the familiar table
 */
function FamiliarTable(): string {
  const familiarRuns = getFamiliarRuns();
  const terrariumFamiliars = new Set(getTerrarium());

  return (
    <table
      class="familiars display compact"
      data-length-menu='[[-1, 10, 25, 50, 100], ["All", 10, 25, 50, 100]]'
      data-order='[[1, "asc"]]'
    >
      <thead>
        <tr>
          <th data-orderable="false"></th>
          <th>ID</th>
          <th>Familiar</th>
          <th data-orderable="false">Links</th>
          <th>Owned?</th>
          <th>Best Run %</th>
        </tr>
      </thead>
      <tbody>
        {Familiar.all().map((fam) => {
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

          return (
            <tr>
              <td class="col-img">
                <img src={"/images/itemimages/" + fam.image} />
              </td>
              <td class="col-familiar-id">{Number(fam)}</td>
              <td>{String(fam)}</td>
              <td class="col-links">
                <a
                  class="popup-link"
                  href={"/desc_familiar.php?which=" + Number(fam)}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <img
                    class="link-image"
                    src="images/otherimages/tinyglass.gif"
                    alt="See in-game description"
                    title="See in-game description"
                  />
                </a>
                &nbsp;
                <a
                  href={
                    "https://kol.coldfront.net/thekolwiki/index.php/" +
                    encodeURI(String(fam))
                  }
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  <img
                    class="link-image"
                    src="images/otherimages/letters/w.gif"
                    alt="Visit KoL wiki"
                    title="Visit KoL wiki"
                  />
                </a>
              </td>
              <td
                class={ownedClasses}
                dangerouslySetInnerHTML={{ __html: ownedSymbol }}
              ></td>
              <td class={runPercentClasses}>{bestRunText}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * Entrypoint of the relay script
 */
export function main(): void {
  write(
    "<!DOCTYPE html>" +
    (
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>100familiars</title>
          <script src="/100familiars/jquery.slim.min.js"></script>
          <script src="/100familiars/jquery.Datatables.min.js"></script>
          <script src="/100familiars/dataTables.dataTables.min.js"></script>
          <script src="/100familiars/100familiars.js"></script>
          <link
            rel="stylesheet"
            href="/images/100familiars/css/jquery.Datatables.min.css"
          />
          <link rel="stylesheet" href="/100familiars/style.css" />
        </head>
        <body>
          <FamiliarTable />
        </body>
      </html>
    )
  );
}
