// Browser smoke test: plays through every mode against a running preview server.
// usage: npm run build && npm run preview &  then  node scripts/smoke.mjs [mobile|desktop] [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const mobile = (process.argv[2] ?? 'mobile') === 'mobile';
const base = process.argv[3] ?? 'http://localhost:4173/';
const SHOTS = 'smoke-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 860 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const shot = (n) => page.screenshot({ path: `${SHOTS}/${mobile ? 'm' : 'd'}-${n}.png` });
const resultText = async () => (await page.locator('.overlay.result .inner').innerText()).replace(/\n+/g, ' | ').slice(0, 160);

async function openMenuAndStart(mode) {
  await page.mouse.click(200, 300);
  await page.waitForTimeout(500);
  await page.getByText(mode).click();
  await page.waitForTimeout(2600); // dealing
}
async function draftAll() {
  for (let i = 0; i < 25; i++) {
    const packs = page.locator('.board.you .pack:not(.gone):not(.locked):not(:disabled)');
    if ((await packs.count()) === 0) break;
    await packs.first().click();
    await page.waitForTimeout(950);
    const cat = page.locator('.catbtn');
    if (await cat.count()) {
      await cat.nth(i % 5).click();
      await page.waitForTimeout(950);
    }
    const sw = page.locator('.switch input');
    if ((await sw.count()) && !(await sw.isChecked())) await sw.click();
    await page.waitForTimeout(1900);
    const cards = page.locator('.fanitem .card');
    const c = await cards.count();
    if (c) {
      await cards.nth(c - 1).click();
      await page.waitForTimeout(150);
      await page.getByRole('button', { name: /^Keep/ }).click();
      await page.waitForTimeout(2500);
    } else {
      const close = page.getByRole('button', { name: 'Close' });
      if (await close.count()) await close.click();
    }
  }
  await page.waitForTimeout(1000);
}
async function playRound() {
  for (let t = 0; t < 30; t++) {
    if (await page.locator('.overlay.result').count()) break;
    const hand = page.locator('.board.you .slot .card.tappable');
    if (await hand.count()) {
      await hand.first().click();
      await page.waitForTimeout(200);
      const cta = page.getByRole('button', { name: /^Play / });
      if (await cta.count()) await cta.click();
      if (t === 2) await shot('play');
    }
    await page.waitForTimeout(1300);
  }
  await page.waitForTimeout(2800);
}

await page.goto(base);
await page.waitForTimeout(600);
await shot('home');

// series: one round
await openMenuAndStart('Zero-sum Series');
await shot('table');
await draftAll();
await shot('deck');
await page.getByRole('button', { name: /Lock in/ }).click();
await playRound();
await shot('result');
console.log('series:', await resultText());
await page.locator('.overlay.result .btn', { hasText: 'Quit' }).click();
await page.waitForTimeout(400);

// solitaire
await openMenuAndStart('Solitaire');
for (const k of [0, 0, 0, 1, 1, 2, 3]) await page.locator('.stepper button').nth(k * 2 + 1).click();
await shot('shop');
await page.getByRole('button', { name: 'Deal' }).click();
await page.waitForTimeout(2600);
await shot('solo-table');
await draftAll();
console.log('solitaire:', await resultText());
await page.locator('.overlay.result .btn', { hasText: 'Home' }).click();
await page.waitForTimeout(400);

// margin with reload-resume and cash out
await openMenuAndStart('Margin of Victory');
await draftAll();
await page.getByRole('button', { name: /Lock in/ }).click();
await page.waitForTimeout(500);
await page.locator('.board.you .slot .card.tappable').first().click();
await page.getByRole('button', { name: /^Play / }).click();
await page.reload();
await page.waitForTimeout(2500);
console.log('resumed after reload:', (await page.locator('.board.you').count()) === 1);
await playRound();
await page.locator('.overlay.result .btn', { hasText: /Cash out|Rematch/ }).click();
await page.waitForTimeout(400);
console.log('margin:', await resultText());
console.log('wallet:', await page.locator('.wallet').first().innerText());

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.length ? 1 : 0);
