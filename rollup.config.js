import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";

/**
 * Temporary directory used to store build artifacts and dependencies.
 * This must be .gitignore-ed!
 */
const DIST_DIR = "build/dist";

/** @type {import("rollup").RollupOptions} */
const kolmafiaScriptOptions = {
  input: "src/relay/relay_100familiars.tsx",
  output: {
    dir: `${DIST_DIR}/relay`,
    format: "cjs",
  },
  // Transpiled 3rd-party code uses 'this' at module root.
  // Don't change foreign code so that they operate properly
  context: "this",
  external: "kolmafia",
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: "src/tsconfig.json",
      // Disable composite to prevent generating .tsbuildinfo files
      composite: false,
      module: "ES2015",
      outDir: `${DIST_DIR}/relay`,
    }),
  ],
};

/** @type {import("rollup").RollupOptions} */
const browserScriptOptions = {
  input: "src/relay/100familiars/100familiars.ts",
  output: {
    dir: `${DIST_DIR}/relay/100familiars`,
    format: "iife",
  },
  plugins: [
    typescript({
      tsconfig: "src/relay/100familiars/tsconfig.json",
      // Disable composite to prevent generating .tsbuildinfo files
      composite: false,
      outDir: `${DIST_DIR}/relay/100familiars`,
    }),
    copy({
      targets: [
        {
          // Copy DataTables CSS to /images/100familiars/, because it expects
          // the images to be in the ../images/ relative path
          src: "node_modules/datatables.net-dt/css/jquery.Datatables.min.css",
          dest: `${DIST_DIR}/images/100familiars/css/`,
        },
        {
          // Copy DataTables images to /images/100familiars/, because KoLmafia
          // does not serve images inside /relay/
          src: "node_modules/datatables.net-dt/images/*",
          dest: `${DIST_DIR}/images/100familiars/images/`,
        },
        {
          src: [
            "node_modules/datatables.net-dt/js/dataTables.dataTables.min.js",
            "node_modules/datatables.net/js/jquery.Datatables.min.js",
            "node_modules/jquery/dist/jquery.slim.min.js",
            "node_modules/jquery/dist/jquery.slim.min.map",
            "src/relay/100familiars/style.css",
          ],
          dest: `${DIST_DIR}/relay/100familiars/`,
        },
      ],
    }),
  ],
};

export default [kolmafiaScriptOptions, browserScriptOptions];
