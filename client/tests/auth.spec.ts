import { test, expect } from '@playwright/test';

//get a random string for name and password
function getRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
const randomName = "Test" + getRandomString(10);
const randomPassword = "Test" + getRandomString(10);
  
  
/* SIGN UP TESTS */

test('AUTH - signup has fields', async ({ page }) => {
  await page.goto('/signup.html'); // Adjust the path to your login page

// Check for the presence of specific fields
const usernameField = page.locator('input[name="username"]'); // Adjust selector as needed
const passwordField = page.locator('input[name="password"]'); // Adjust selector as needed
const loginButton = page.locator('button[type="submit"]'); // Adjust selector as needed

// Assert that the fields are visible
await expect(usernameField).toBeVisible();
await expect(passwordField).toBeVisible();
await expect(loginButton).toBeVisible();
});


test('AUTH - signup works', async ({ page }) => {
  await page.goto('/signup.html'); // Adjust the path to your signup page
  // Fill in the signup form
  await page.fill('input[name="username"]', randomName); // Adjust selector as needed
  await page.fill('input[name="password"]', randomPassword); // Adjust selector as needed
  await page.click('button[type="submit"]'); // Adjust selector as needed
  // Wait for navigation after signup
  await page.waitForNavigation();
  // Check if signup was successful by looking for a specific element on the next page
  const monacoAriaContainer = page.locator('div.monaco-aria-container');
  await expect(monacoAriaContainer).toBeVisible();
});


/* LOG-IN TESTS */

test('AUTH - login has fields', async ({ page }) => {
  await page.goto('/login.html'); // Adjust the path to your login page

  // Check for the presence of specific fields
  const usernameField = page.locator('input[name="username"]'); // Adjust selector as needed
  const passwordField = page.locator('input[name="password"]'); // Adjust selector as needed
  const loginButton = page.locator('button[type="submit"]'); // Adjust selector as needed

  // Assert that the fields are visible
  await expect(usernameField).toBeVisible();
  await expect(passwordField).toBeVisible();
  await expect(loginButton).toBeVisible();
});








  test('AUTH - login works', async ({ page }) => {
    await page.goto('/login.html'); // Adjust the path to your login page
    // Fill in the login form
    await page.fill('input[name="username"]', randomName); // Adjust selector as needed
    await page.fill('input[name="password"]', randomPassword); // Adjust selector as needed
    await page.click('button[type="submit"]'); // Adjust selector as needed
    // Wait for navigation after login
    await page.waitForNavigation();
    // Check if login was successful by looking for a specific element on the next page
    const monacoAriaContainer = page.locator('div.monaco-aria-container');
    await expect(monacoAriaContainer).toBeVisible();
  });
