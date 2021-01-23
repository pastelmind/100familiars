/**
 * @file Commits build artifacts and dependencies to the release branch.
 */

import { execSync } from "child_process";

import chalk from "chalk";
import { program } from "commander";
import { copySync } from "fs-extra";

/**
 * Temporary directory used to store build artifacts and dependencies.
 * This must be .gitignore-ed!
 */
const DIST_DIR = "build/dist";

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

function run(cmd: string, options?: Parameters<typeof execSync>[1]) {
  console.log(chalk.green("Executing:", cmd));
  execSync(cmd, { stdio: "inherit", ...options });
}

/**
 * Commit all build artifacts and copied dependencies to the release branch.
 * @param releaseBranch Release branch name
 * @param commitMessage Commit message
 */
function updateReleaseBranch(releaseBranch: string, commitMessage?: string) {
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
    // Copy distributables into project root (moveSync fails)
    copySync(DIST_DIR, ".");
    // Stage release-worthy files
    run(`git -c core.excludesFile=${RELEASE_GITIGNORE_TEMP} add .`);
    // Create a new commit
    run("git commit -F -", {
      input: commitMessage ?? "New release",
      stdio: ["pipe", "inherit", "inherit"],
    });
  } finally {
    // Switch back to previous branch or commit
    run(`git switch --force ${PREV_POS}`);
  }
}

/**
 * Script entrypoint
 */
function main(argv: string[]) {
  program
    .arguments("[commit_message]")
    .option(
      "--branch <name>",
      "Name of the release branch",
      RELEASE_BRANCH_DEFAULT
    )
    .action((commitMessage, options) => {
      try {
        updateReleaseBranch(options.branch, commitMessage);
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
