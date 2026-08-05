import type { Config } from "tailwindcss";
import { preset } from "@sk-web-gui/core";

const arial = "Arial, Helvetica, sans-serif";
const raleway = `var(--font-raleway), ${arial}`;

const config: Config = {
  presets: [preset()],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@sk-web-gui/**/dist/**/*.js",
  ],
  theme: {
    extend: {
      // The preset names Raleway literally, but next/font emits a hashed
      // family name, so point the header/display stacks at its variable.
      fontFamily: {
        header: raleway,
        display: raleway,
      },
    },
  },
};

export default config;
