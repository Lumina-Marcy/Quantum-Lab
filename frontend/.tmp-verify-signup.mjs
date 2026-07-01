import { chromium } from 'playwright';

const TMP = '/home/tylek/.claude/jobs/f402e4b8/tmp/shots';
const consoleErrors = [];
const networkErrors = [];

const browser = await chromium.launch({
  args: ['--no-sandbox'],
  executablePath: '/home/tylek/.cache/ms-playwright/chromium-1228/chrome-linux/chrome',
});
const page = await browser.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});
page.on('requestfailed', (req) => {
  networkErrors.push(`${req.method()} ${req.url()} -> ${req.failure()?.errorText}`);
});
page.on('response', async (res) => {
  if (res.status() >= 400) {
    networkErrors.push(`${res.status()} ${res.url()}`);
  }
});

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForSelector('text=Create your account');
await page.locator('text=Create your account').scrollIntoViewIfNeeded();
await page.screenshot({ path: `${TMP}/01_before.png` });

const email = `pwtest_${Date.now()}@example.com`;

await page.fill('#firstName', 'Play');
await page.fill('#lastName', 'Wright');
await page.fill('#email', email);
await page.fill('#password', 'testpassword123');
await page.screenshot({ path: `${TMP}/02_filled.png` });

await page.click('button[type="submit"]');
await page.waitForSelector('text=Account created! You can now log in.', { timeout: 10000 });
await page.screenshot({ path: `${TMP}/03_success.png` });

await page.fill('#firstName', 'Play');
await page.fill('#lastName', 'Wright');
await page.fill('#email', email);
await page.fill('#password', 'testpassword123');
await page.click('button[type="submit"]');
await page.waitForSelector('text=An account with that email already exists', { timeout: 10000 });
await page.screenshot({ path: `${TMP}/04_duplicate_error.png` });

console.log('RESULT: success and duplicate-error flows both rendered correctly');
console.log('CONSOLE_ERRORS:', JSON.stringify(consoleErrors));
console.log('NETWORK_ERRORS:', JSON.stringify(networkErrors));

await browser.close();
