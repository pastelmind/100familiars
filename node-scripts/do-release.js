/**
 * @file Commits build artifacts and dependencies to the release branch.
 */

const { execSync } = require("child_process");

const chalk = require("chalk");
const { program } = require("commander");
const { copySync } = require("fs-extra");

/**
 * Temporary directory used to store build artifacts and dependencies.
 * This must be .gitignore-ed!
 */
const DIST_DIR = "dist";

/**
 * .gitignore file to filter out everything that does not belong in the release
 * branch.
 */
const RELEASE_GITIGNORE = "release.gitignore";
/**
 * Where the release.gitignore file will be copied to during the release process
 */
const RELEASE_GITIGNORE_TEMP = "temp/release.gitignore";

/**
 * Default release branch name
 */
const RELEASE_BRANCH_DEFAULT = "release";

/**
 * @param {string} cmd
 * @param {Parameters<execSync>[1]} [options]
 */
function run(cmd, options) {
  console.log(chalk.green("Executing:", cmd));
  execSync(cmd, { stdio: "inherit", ...options });
}

/**
 * Commit all build artifacts and copied dependencies to the release branch.
 * @param {string} releaseBranch Release branch name
 * @param {string} [commitMessage] Commit message
 */
function updateReleaseBranch(releaseBranch, commitMessage) {
  const PREV_POS = execSync("git name-rev --name-only HEAD", {
    encoding: "utf8",
  });
  // Copy release.gitignore to temp dir so that it survives the branch switch
  copySync(RELEASE_GITIGNORE, RELEASE_GITIGNORE_TEMP);

  try {
    // Switch to release branch.
    // Since DIST_DIR is .gitignore-ed, it will be preserved after the switch.
    run(`git switch ${releaseBranch}`);
    // Delete all previously committed files in the release branch
    run(`git rm -r .`);
    // Copy contents of dist/ into project root (moveSync fails)
    copySync(DIST_DIR, ".");
    // Stage release-worthy files
    run(`git -c core.excludesFile=${RELEASE_GITIGNORE_TEMP} add .`);
    // Create a new commit
    run("git commit -F -", {
      input: commitMessage ? commitMessage : "New release",
      stdio: ["pipe", "inherit", "inherit"],
    });
  } finally {
    // Switch back to previous branch or commit
    run(`git switch --force ${PREV_POS}`);
  }
}

// Copy DataTables images to /images/100familiars/, because KoLmafia does not
// serve images inside /relay/
// Also copy DataTables CSS to /images/100familiars/, because it expects the
// images to be in ../images/
const FILES_AND_DIRS_TO_COPY = {
  "node_modules/datatables.net-dt/css/jquery.Datatables.min.css": `${DIST_DIR}/images/100familiars/css/jquery.Datatables.min.css`,
  "node_modules/datatables.net-dt/images/sort_asc_disabled.png": `${DIST_DIR}/images/100familiars/images/sort_asc_disabled.png`,
  "node_modules/datatables.net-dt/images/sort_asc.png": `${DIST_DIR}/images/100familiars/images/sort_asc.png`,
  "node_modules/datatables.net-dt/images/sort_both.png": `${DIST_DIR}/images/100familiars/images/sort_both.png`,
  "node_modules/datatables.net-dt/images/sort_desc_disabled.png": `${DIST_DIR}/images/100familiars/images/sort_desc_disabled.png`,
  "node_modules/datatables.net-dt/images/sort_desc.png": `${DIST_DIR}/images/100familiars/images/sort_desc.png`,
  "node_modules/datatables.net-dt/js/dataTables.dataTables.min.js": `${DIST_DIR}/relay/100familiars/dataTables.dataTables.min.js`,
  "node_modules/datatables.net/js/jquery.Datatables.min.js": `${DIST_DIR}/relay/100familiars/jquery.Datatables.min.js`,
  "node_modules/jquery/dist/jquery.slim.min.js": `${DIST_DIR}/relay/100familiars/jquery.slim.min.js`,
  "node_modules/jquery/dist/jquery.slim.min.map": `${DIST_DIR}/relay/100familiars/jquery.slim.min.map`,
  "relay/100familiars/style.css": `${DIST_DIR}/relay/100familiars/style.css`,
};

/**
 * Script entrypoint
 * @param {string[]} argv
 */
function main(argv) {
  program
    .arguments("[commit_message]")
    .option(
      "--branch <name>",
      "Name of the release branch",
      RELEASE_BRANCH_DEFAULT
    )
    .option("--no-commit", "Don't make a commit. Cannot be used with --branch.")
    .action((commitMessage, cmd) => {
      if (!cmd.commit && cmd.branch !== RELEASE_BRANCH_DEFAULT) {
        console.error("Error: --branch cannot be used with --no-commit");
        process.exitCode = 1;
        return;
      }

      try {
        for (const [source, dest] of Object.entries(FILES_AND_DIRS_TO_COPY)) {
          console.log(chalk.green(`Copying: ${source} -> ${dest}`));
          copySync(source, dest);
        }

        if (cmd.commit) {
          updateReleaseBranch(cmd.branch, commitMessage);
        } else if (commitMessage) {
          console.warn("Warning: Commit message is ignored due to --no-commit");
        }
      } catch (e) {
        console.error(e);
        process.exitCode = 1;
      }
    });
  program.parse(argv);
}

if (require.main === module) {
  main(process.argv);
}
