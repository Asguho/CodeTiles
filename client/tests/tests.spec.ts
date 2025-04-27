import { test, expect, type Page } from '@playwright/test';


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
  


// Function to log in
async function login(page: Page, username: string, password: string): Promise<Page> {
  await page.goto('/login.html'); // Adjust the path to your login page
  // Fill in the login form
  await page.fill('input[name="username"]', username); // Adjust selector as needed
  await page.fill('input[name="password"]', password); // Adjust selector as needed
  await page.click('button[type="submit"]'); // Adjust selector as needed
  // Wait for navigation after login
  await page.waitForNavigation();
  return page;
}


/* AUTH TESTS */
test.describe('Authentication Tests', () => {
  test.beforeAll(() => {
  });

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
  await page.context().clearCookies();
  await page.goto('/signup.html'); // Adjust the path to your signup page
  // Fill in the signup form
  await page.fill('input[name="username"]', randomName); // Adjust selector as needed
  await page.fill('input[name="password"]', randomPassword); // Adjust selector as needed
  await page.click('button[type="submit"]'); // Adjust selector as needed
  // Wait for navigation after signup
  await page.waitForNavigation();
  //await auth session cookie
  const cookies = await page.context().cookies();

  // Find the cookie with the name 'auth-session'
  const authSessionCookie = cookies.find(cookie => cookie.name === 'auth-session');

  // Assert that the cookie exists
  expect(authSessionCookie).toBeDefined();

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
    await page.context().clearCookies();
    await page.goto('/login.html'); // Adjust the path to your login page
    // Fill in the login form
    await page.fill('input[name="username"]', randomName); // Adjust selector as needed
    await page.fill('input[name="password"]', randomPassword); // Adjust selector as needed
    await page.click('button[type="submit"]'); // Adjust selector as needed
    // Wait for navigation after login
    await page.waitForNavigation();
    //await auth session cookie
    const cookies = await page.context().cookies();

    // Find the cookie with the name 'auth-session'
    const authSessionCookie = cookies.find(cookie => cookie.name === 'auth-session');

    // Assert that the cookie exists
    expect(authSessionCookie).toBeDefined();

  });



test('AUTH - redirects if no auth cookie', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/'); // Adjust the path to your protected page
  // Check if redirected to login page
  await expect(page).toHaveURL(/.*login.html/); // Adjust the URL pattern as needed
});

  /*
  test('AUTH - login fails with wrong password', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login.html'); // Adjust the path to your login page
    // Fill in the login form with wrong password
    await page.fill('input[name="username"]', randomName); // Adjust selector as needed
    await page.fill('input[name="password"]', 'wrongpassword'); // Adjust selector as needed
    await page.click('button[type="submit"]'); // Adjust selector as needed
    // Wait for navigation after login
    await page.waitForNavigation();
    // Check for error message
    const errorMessage = page.locator('.error-message'); // Adjust selector as needed
    await expect(errorMessage).toBeVisible();
  });
  */


});


/* GAME TESTS */
test.describe('Game Tests', () => {
  test.beforeAll(() => {
  });
/*Game has editor, console and canvas pane test*/
test('GAME - has all three divs', async ({ page }) => {
  await login(page, randomName, randomPassword); // Log in before testing
  const canvasPaneDiv = page.locator('div[data-pane][data-pane-id="canvas-pane"]');
  const consolePaneDiv = page.locator('div[data-pane][data-pane-id="console-pane"]');
  const editorPaneDiv = page.locator('div[data-pane][data-pane-id="console-pane"]');

  // Assert that the divs are visible
  await expect(canvasPaneDiv).toBeVisible();
  await expect(consolePaneDiv).toBeVisible();
  await expect(editorPaneDiv).toBeVisible();

  // Assert that the divs are enabled
  await expect(canvasPaneDiv).toBeEnabled();
  await expect(consolePaneDiv).toBeEnabled();
  await expect(editorPaneDiv).toBeEnabled();

  // Assert that the divs are not empty
  const canvasPaneText = await canvasPaneDiv.textContent();
  const consolePaneText = await consolePaneDiv.textContent();
  const editorPaneText = await editorPaneDiv.textContent();
  expect(canvasPaneText).not.toBeNull();
  expect(consolePaneText).not.toBeNull();
  expect(editorPaneText).not.toBeNull();

  // check if there is only one such element
  await expect(canvasPaneDiv).toHaveCount(1);
  await expect(consolePaneDiv).toHaveCount(1);
  await expect(editorPaneDiv).toHaveCount(1);
});
});








