/**
 * @file Commits build artifacts and dependencies to the release branch.
 */

const { execSync } = require("child_process");

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
 * @param {string} cmd
 * @param {Parameters<execSync>[1]} [options]
 */
function run(cmd, options) {
  console.log("Executing:", cmd);
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

const FILES_AND_DIRS_TO_COPY = {
  "relay/100familiars/": `${DIST_DIR}/relay/100familiars/`,
  "node_modules/tablesort/dist/sorts/tablesort.number.min.js": `${DIST_DIR}/relay/100familiars/tablesort.number.min.js`,
  "node_modules/tablesort/dist/tablesort.min.js": `${DIST_DIR}/relay/100familiars/tablesort.min.js`,
  "node_modules/tablesort/tablesort.css": `${DIST_DIR}/relay/100familiars/tablesort.css`,
};

/**
 * Script entrypoint
 * @param {string[]} argv
 */
function main(argv) {
  program
    .arguments("[commit_message]")
    .option("--branch <name>", "Name of the release branch", "release")
    .action((commitMessage, cmd) => {
      try {
        for (const [source, dest] of Object.entries(FILES_AND_DIRS_TO_COPY)) {
          console.log(`Copying: ${source} -> ${dest}`);
          copySync(source, dest);
        }

        updateReleaseBranch(cmd.branch, commitMessage);
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
