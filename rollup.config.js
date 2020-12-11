import typescript from "@rollup/plugin-typescript";

/** @type {import("rollup").RollupOptions} */
const options = {
  input: "relay/relay_100familiars.ts",
  output: {
    dir: "relay",
    format: "cjs",
  },
  external: "kolmafia",
  plugins: [typescript()],
};

export default options;
