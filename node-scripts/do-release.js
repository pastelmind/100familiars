/**
 * @file Commits build artifacts and dependencies to the release branch.
 */

const { execSync } = require("child_process");
const { copyFileSync } = require("fs");

const { program } = require("commander");

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

  try {
    // Switch to release branch without changing the working directory.
    // This preserves the current working directory and index
    // Taken from https://stackoverflow.com/a/6070417
    run(`git symbolic-ref HEAD refs/heads/${releaseBranch}`);
    // Synchronize the index (but not the working tree) with the release branch
    run("git reset --quiet");
    // Stage release-worthy files
    run("git -c core.excludesFile=release.gitignore add .");
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

const FILES_TO_COPY = {
  "node_modules/tablesort/dist/sorts/tablesort.number.min.js":
    "relay/100familiars/tablesort.number.min.js",
  "node_modules/tablesort/dist/tablesort.min.js":
    "relay/100familiars/tablesort.min.js",
  "node_modules/tablesort/tablesort.css": "relay/100familiars/tablesort.css",
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
        for (const [source, dest] of Object.entries(FILES_TO_COPY)) {
          console.log(`Copying ${source} -> ${dest}`);
          copyFileSync(source, dest);
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
