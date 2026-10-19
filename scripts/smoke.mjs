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
const resultText = async () => (await page.locator('.overlay.result .inner').innerText().catch(() => 'NO RESULT')).replace(/\n+/g, ' | ').slice(0, 160);

async function openMenuAndStart(mode, stakeIndex = 0) {
  await page.mouse.click(200, 300);
  await page.waitForTimeout(500);
  await page.getByText(mode).click();
  await page.waitForTimeout(400);
  const stakes = page.locator('.stakebtn:not(:disabled)');
  if (await stakes.count()) {
    if (stakeIndex === 0) await shot(`stakes-${mode.split(' ')[0].toLowerCase()}`);
    await stakes.nth(Math.min(stakeIndex, (await stakes.count()) - 1)).click();
  }
  await page.waitForTimeout(2600); // dealing
}

/** Plays one match to the result overlay: opens packs on our turn, takes a card, answers prompts, acks minigames. */
async function playMatch(tag, opts = {}) {
  let picks = 0;
  for (let step = 0; step < 160; step++) {
    if (await page.locator('.overlay.result').count()) break;
    const mg = page.locator('.overlay.minigame');
    if (await mg.count()) {
      await page.waitForTimeout(2900);
      await mg.getByRole('button', { name: 'Continue' }).click();
      await page.waitForTimeout(400);
      continue;
    }
    const pr = page.locator('.overlay.prompt');
    if (await pr.count()) {
      const card = pr.locator('.picker .card');
      if (await card.count()) await card.first().click();
      else {
        const btns = pr.locator('.btn');
        await btns.nth((await btns.count()) - 1).click();
      }
      await page.waitForTimeout(500);
      continue;
    }
    const catb = page.locator('.catbtn');
    if (await catb.count()) { await catb.first().click(); await page.waitForTimeout(1000); continue; }
    const fan = page.locator('.fanitem .card');
    if (await fan.count()) {
      const n = await fan.count();
      for (let i = 0; i < n; i++) { if (await fan.nth(i).count()) await fan.nth(i).click(); await page.waitForTimeout(120); }
      await page.waitForTimeout(700);
      if (picks === 0) await shot(`${tag}-fan`);
      if (await page.locator('.catbtn').count()) { await page.locator('.catbtn').first().click(); await page.waitForTimeout(900); continue; }
      if (await fan.count()) { await fan.nth(0).click(); await page.waitForTimeout(300); }
      if ((await page.locator('.fanitem .card').count()) && (await page.locator('h2', { hasText: /goes under/ }).count())) await page.locator('.fanitem .card').nth(1).click();
      picks++;
      await page.waitForTimeout(900);
      if (picks === 3) await shot(`${tag}-mid`);
      if (picks === opts.reloadAfter) {
        await page.reload();
        await page.waitForTimeout(2500);
        console.log('resumed after reload:', (await page.locator('.board.you').count()) === 1);
      }
      continue;
    }
    const packs = page.locator('.board.you .pack:not(.gone):not(.locked):not(:disabled)');
    if ((await packs.count()) && (await page.locator('.ticker b', { hasText: 'Your move' }).count())) {
      await packs.first().click();
      await page.waitForTimeout(1000);
      continue;
    }
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(1500);
  await shot(`${tag}-result`);
  return picks;
}

await page.goto(base);
await page.evaluate(() => localStorage.clear());
await page.goto(base);
await page.waitForTimeout(600);
await shot('home');

// series: one round, then quit
await openMenuAndStart('Zero-sum');
await shot('table');
await playMatch('series');
console.log('series:', await resultText());
console.log('hud:', await page.locator('.hud-mid').innerText());
await page.locator('.overlay.result .btn', { hasText: 'Home' }).click();
await page.waitForTimeout(400);

// solitaire
await openMenuAndStart('Solitaire');
for (const k of [0, 0, 0, 1, 1, 2, 3]) await page.locator('.stepper button').nth(k * 2 + 1).click();
await shot('shop');
await page.getByRole('button', { name: 'Deal' }).click();
await page.waitForTimeout(2600);
await playMatch('solo');
console.log('solitaire:', await resultText());
await page.locator('.overlay.result .btn', { hasText: 'Home' }).click();
await page.waitForTimeout(400);

// margin with reload-resume mid-match and cash out
await openMenuAndStart('Margin of Victory', 1);
await playMatch('margin', { reloadAfter: 2 });
console.log('margin:', await resultText());
await page.locator('.overlay.result .btn', { hasText: /Cash out|Rematch/ }).click();
await page.waitForTimeout(600);
console.log('after cash out:', await resultText());
console.log('wallet:', await page.locator('.wallet').first().innerText());

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.length ? 1 : 0);
