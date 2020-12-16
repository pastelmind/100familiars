import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";

/** @type {import("rollup").RollupOptions} */
const kolmafiaScriptOptions = {
  input: "relay/relay_100familiars.tsx",
  output: {
    dir: "dist/relay",
    format: "cjs",
  },
  external: "kolmafia",
  plugins: [nodeResolve(), commonjs(), typescript()],
};

/** @type {import("rollup").RollupOptions} */
const browserScriptOptions = {
  input: "relay/100familiars/100familiars.ts",
  output: {
    dir: "dist/relay/100familiars",
    format: "iife",
  },
  plugins: [typescript({ tsconfig: "tsconfig.browser.json" })],
};

export default [kolmafiaScriptOptions, browserScriptOptions];
