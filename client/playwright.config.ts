import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', // Directory for your test files
  webServer: {
    command: 'deno run dev', // Start your SvelteKit app
    port: 3000, // Ensure this matches your app's port
    reuseExistingServer: !process.env.CI, // Reuse server in local dev
  },
  use: {
    baseURL: 'http://localhost:3000', // Base URL for your app
    headless: true, // Run tests in headless mode
  },
});