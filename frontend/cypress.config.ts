import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:${process.env.PORT ?? "3000"}`,
    env: {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    },
    experimentalRunAllSpecs: true,
    defaultCommandTimeout: 10000,
    retries: 2,

    setupNodeEvents(_on, config) {
      return config;
    },
  },
});
