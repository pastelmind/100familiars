import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

/** @type {import("rollup").RollupOptions} */
const options = {
  input: "relay/relay_100familiars.tsx",
  output: {
    dir: "relay",
    format: "cjs",
  },
  external: "kolmafia",
  plugins: [commonjs(), typescript()],
};

export default options;
