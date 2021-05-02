/**
 * @file Commits build artifacts and dependencies to the release branch.
 */

import {program} from 'commander';
import {copy} from 'fs-extra';
import simpleGit, {GitError} from 'simple-git';

/**
 * Temporary directory used to store build artifacts and dependencies.
 * This must be .gitignore-ed!
 */
const DIST_DIR = 'build';

/**
 * .gitignore file to filter out everything that does not belong in the release
 * branch.
 */
const RELEASE_GITIGNORE = 'release.gitignore';

/**
 * Default release branch name
 */
const RELEASE_BRANCH_DEFAULT = 'release';

/**
 * Commit all build artifacts and copied dependencies to the release branch.
 * @param releaseBranch Release branch name
 * @param commitMessage Commit message
 */
async function updateReleaseBranch(
  releaseBranch: string,
  commitMessage?: string
) {
  const git = simpleGit();

  // Retrieve the current branch, tag, or commit name
  const prevPos = (await git.raw('name-rev', '--name-only', 'HEAD')).trim();

  // Copy .gitignore to dist dir so that it can be copied back to root dir
  // before committing
  await copy(RELEASE_GITIGNORE, `${DIST_DIR}/.gitignore`);

  try {
    // Switch to release branch.
    // Since DIST_DIR is .gitignore-ed, it will be preserved after the switch.
    await git.checkout(releaseBranch);

    // Delete all previously committed files in the release branch
    try {
      await git.rm('*');
    } catch (e) {
      if (
        e instanceof GitError &&
        e.message.includes('did not match any files')
      ) {
        // Print error but continue
        console.warn(e.message);
      } else {
        throw e;
      }
    }

    // Copy distributables into project root (move fails)
    await copy(DIST_DIR, '.');

    // Stage release-worthy files
    await git.add('.');

    // Create a new commit
    const commitResult = await git.commit(commitMessage ?? 'New release');
    if (commitResult.commit) {
      console.log(
        `Created new commit ${commitResult.commit} at branch ${commitResult.branch}`
      );
    } else {
      console.log('No change detected, commit not created');
    }
  } finally {
    // Switch back to previous branch or commit
    await git.checkout(prevPos);
  }
}

/**
 * Script entrypoint
 */
function main(argv: string[]) {
  program
    .arguments('[commit_message]')
    .option(
      '--branch <name>',
      'Name of the release branch',
      RELEASE_BRANCH_DEFAULT
    )
    .action(async (commitMessage, options) => {
      try {
        await updateReleaseBranch(options.branch, commitMessage);
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
