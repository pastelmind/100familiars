/**
 * Display your familiars and your best ascension run records with them.
 *
 * This script is largely based on matt.chugg's Familiar Collector/Ascension
 * Familiar Chooser script. For his work, see:
 * https://kolmafia.us/threads/familiar-collector-ascension-familiar-chooser.7433/
 */

script "100familiars";
notify "philmasterplus";
since 20.7;


/**
 * Utility function. Appends a string to a buffer followed by a newline.
 * @param buf Buffer to modify
 * @param str String to append to buffer
 * @return The original buffer, modified
 */
buffer appendln(buffer buf, string str) {
  return buf.append(str + "\n");
}

/** Represents information about a single familiar % run. */
record FamiliarRunInfo {
  /** Highest familiar % ever achieved in a run */
  float best_run_pct;
};

/**
 * Retrieves your highest familiar % run records.
 * For convenience, this does NOT check pre-NS13 ascension records.
 * @return Mapping of familiar => best familiar run info
 */
FamiliarRunInfo [familiar] get_familiar_run_infos() {
  FamiliarRunInfo [familiar] run_infos;

	string ascensions = visit_url("ascensionhistory.php?who=" + my_id());
  matcher familiar_run_matcher = create_matcher('title="(.+?)\\s*\\((.+?)%', "");
  foreach key, node in xpath(ascensions, '//table[@id="history"]//tr[position() > 1]//img') {
    // Some challenge paths (e.g. Avatar of Boris) can have no familiar records
    if (!familiar_run_matcher.reset(node).find()) continue;

    familiar fam = to_familiar(familiar_run_matcher.group(1));
    float run_pct = to_float(familiar_run_matcher.group(2));

    // Skip if this is not the best run for this familiar
    if (run_infos contains fam && run_infos[fam].best_run_pct >= run_pct) {
      continue;
    }
    run_infos[fam] = new FamiliarRunInfo(run_pct);
  }

  return run_infos;
}

/**
 * Generates a sortable HTML table of all familiars.
 */
string generate_familiar_table() {
  buffer html;
  html.appendln('<table class="familiars">');
  html.appendln("  <thead>");
  html.appendln("    <tr>");
  html.appendln('      <th class="no-sort" data-sort-method="none"></th>');
  html.appendln('      <th>Familiar</th>');
  html.appendln("      <th>Owned?</th>");
  html.appendln("      <th>Best Run %</th>");
  html.appendln("    </tr>");
  html.appendln("  </thead>");
  html.appendln("  <tbody>");

  FamiliarRunInfo [familiar] familiar_run_infos =  get_familiar_run_infos();
  foreach fam in $familiars[] {
    string best_run_text = "";
    string run_pct_class = "col-run-pct";
    if (have_familiar(fam) && familiar_run_infos contains fam) {
      float best_run_pct = familiar_run_infos[fam].best_run_pct;
      best_run_text = to_string(best_run_pct, "%.1f");
      if (best_run_pct == 100) {
        // Perfect run
        run_pct_class += " col-run-pct--perfect";
      } else if (best_run_pct >= 90 && best_run_pct < 100) {
        // Contributes to an Amateur/Professional Tour Guide trophy
        run_pct_class += " col-run-pct--tourguide";
      }
    }

    html.appendln("    <tr>");
    html.appendln(`      <td class="col-img"><img src="/images/itemimages/{fam.image}"></td>`);
    html.appendln(`      <td>{fam}</td>`);
    html.appendln(`      <td class="col-owned {have_familiar(fam) ? "col-owned--yes" : "col-owned--no"}">`);
    html.appendln(`        {have_familiar(fam) ? "&#x2714;" : "&#x2718;"}`);
    html.appendln("      </td>");
    html.appendln(`      <td class="{run_pct_class}">{best_run_text}</td>`);
    html.appendln("    </tr>");
  }

  html.appendln("  </tbody>");
  html.appendln("</table>");
  return html;
}

/**
 * Entrypoint of the relay script
 */
void main()	{
  writeln('<!DOCTYPE html>');
  writeln('<html lang="en">');
  writeln('  <head>');
  writeln('    <meta charset="UTF-8" />');
  writeln('    <meta name="viewport" content="width=device-width, initial-scale=1.0" />');
  writeln('    <title>100familiars</title>');
  writeln('    <script src="/100familiars/tablesort.min.js"></script>');
  writeln('    <script src="/100familiars/tablesort.number.min.js"></script>');
  writeln('    <link rel="stylesheet" href="/100familiars/tablesort.css">');
  writeln('    <link rel="stylesheet" href="/100familiars/style.css">');
  writeln('  </head>');
  writeln('  <body>');

  writeln(generate_familiar_table());

  writeln("  <script>");
  writeln("    new Tablesort(document.getElementsByClassName('familiars')[0]);");
  writeln("  </script>");
  writeln('  </body>');
  writeln('  </body>');
  writeln('  </body>');
  writeln('</html>');
}
