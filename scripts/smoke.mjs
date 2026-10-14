// Browser smoke test: plays through every mode against a running preview server.
// usage: npm run build && npm run preview &  then  node scripts/smoke.mjs [mobile|desktop] [baseUrl]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const mobile = (process.argv[2] ?? 'mobile') === 'mobile';
const base = process.argv[3] ?? 'http://localhost:4173/';
const SHOTS = 'smoke-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const shot = (n) => page.screenshot({ path: `${SHOTS}/${mobile ? 'm' : 'd'}-${n}.png` });

async function draftAll() {
  for (let i = 0; i < 25; i++) {
    const packs = page.locator('.pack:not(.opened):not(.locked)');
    if ((await packs.count()) === 0) break;
    await packs.first().click();
    await page.waitForTimeout(850);
    const cat = page.locator('.catgrid .btn');
    if (await cat.count()) {
      await cat.nth(i % 5).click();
      await page.waitForTimeout(850);
    }
    const cards = page.locator('.reveal .card');
    if (await cards.count()) {
      await cards.last().click();
      await page.getByRole('button', { name: /^Keep/ }).click();
    } else {
      const close = page.getByRole('button', { name: 'Close' });
      if (await close.count()) await close.click();
    }
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(900);
}
async function playRound() {
  for (let t = 0; t < 30; t++) {
    if (await page.locator('.result').count()) break;
    const swap = page.locator('.placecol .btn.small:not([disabled])');
    if (await swap.count()) await swap.click();
    const hand = page.locator('.side.you .hand .card.tappable');
    if (await hand.count()) {
      await hand.first().click();
      await page.getByRole('button', { name: /^Play / }).click();
      if (t === 2) await shot('play');
    }
    await page.waitForTimeout(1100);
  }
  await page.waitForTimeout(2600);
}
const text = async () => (await page.locator('.result').innerText()).replace(/\n+/g, ' | ').slice(0, 160);

await page.goto(base);
await shot('home');

// series: one round
await page.getByText('Zero-sum Series').click();
await page.waitForTimeout(400);
await draftAll();
await shot('deck');
await page.getByRole('button', { name: 'Lock in and play' }).click();
await playRound();
await shot('result');
console.log('series:', await text());
await page.getByRole('button', { name: 'Quit' }).click();

// solitaire
await page.getByText('Solitaire').click();
for (const k of [0, 0, 0, 1, 1, 2, 3]) await page.locator('.stepper button').nth(k * 2 + 1).click();
await page.getByRole('button', { name: 'Open packs' }).click();
await draftAll();
console.log('solitaire:', await text());
await page.getByRole('button', { name: 'Home' }).click();

// margin with reload-resume and cash out
await page.getByText('Margin of Victory').click();
await draftAll();
await page.getByRole('button', { name: 'Lock in and play' }).click();
await page.locator('.side.you .hand .card.tappable').first().click();
await page.getByRole('button', { name: /^Play / }).click();
await page.reload();
await page.waitForTimeout(2500);
console.log('resumed after reload:', (await page.locator('.side.you').count()) === 1);
await playRound();
await page.getByRole('button', { name: /Cash out|Rematch/ }).click();
console.log('margin:', await text());

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.length ? 1 : 0);
