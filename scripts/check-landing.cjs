const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

const origin = process.env.LANDING_URL || 'http://localhost:3102';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function scrollTo(page, selector) {
  await page.locator(selector).first().evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
}
async function draws(page, duration = 350) {
  const before = await page.evaluate(() => window.__gl.draws);
  await pause(duration);
  return (await page.evaluate(() => window.__gl.draws)) - before;
}

async function revealPage(page) {
  // Natural scrolling visits every reveal target; jumping between section
  // centres can legitimately skip headings and cards in tall sections.
  const { height, step } = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, step: innerHeight * 0.65 }));
  for (let y = 0; y < height; y += step) {
    await page.evaluate(position => window.scrollTo({ top: position, behavior: 'instant' }), y);
    await pause(150);
  }
  await pause(1200);
}

async function main() {
  fs.mkdirSync('artifacts/landing', { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(30000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__gl = { draws: 0, counts: [] };
      for (const name of ['WebGLRenderingContext', 'WebGL2RenderingContext']) {
        const proto = window[name]?.prototype;
        if (!proto) continue;
        const original = proto.drawArrays;
        proto.drawArrays = function(mode, first, count) {
          window.__gl.draws++;
          if (!window.__gl.counts.includes(count)) window.__gl.counts.push(count);
          return original.call(this, mode, first, count);
        };
      }
    });

    console.log('Checking the complete 3D scene, not just initial HTML…');
    const response = await page.goto(origin, { waitUntil: 'networkidle' });
    const html = await response.text();
    const initialScripts = [...html.matchAll(/<script[^>]+src="([^"]+\.js[^"]*)"/g)].map(match => new URL(match[1], origin).href);
    await page.waitForFunction(() => window.__gl.draws > 4);
    await page.waitForLoadState('networkidle');
    const metrics = await page.evaluate(initial => {
      const resources = performance.getEntriesByType('resource');
      const scripts = resources.filter(r => new URL(r.name).pathname.endsWith('.js'));
      return {
        title: document.title,
        heading: document.querySelector('h1')?.textContent,
        javascriptBytes: scripts.reduce((sum, r) => sum + r.encodedBodySize, 0),
        initialJavascriptBytes: scripts.filter(r => initial.includes(r.name)).reduce((sum, r) => sum + r.encodedBodySize, 0),
        deferredJavascriptBytes: scripts.filter(r => !initial.includes(r.name)).reduce((sum, r) => sum + r.encodedBodySize, 0),
        scriptRequests: scripts.length,
        sessionRequests: resources.filter(r => r.name.includes('/api/auth/session')).length,
        canvases: document.querySelectorAll('canvas').length,
        particleDrawCounts: window.__gl.counts,
        firstContentfulPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        firstDeferredScriptMs: Math.min(...scripts.filter(r => r.name.includes('/_next/static/') && !initial.includes(r.name)).map(r => r.startTime)),
        overflow: document.documentElement.scrollWidth > innerWidth,
        brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter(a => !document.getElementById(a.hash.slice(1))).map(a => a.getAttribute('href')),
      };
    }, initialScripts);
    assert.equal(metrics.sessionRequests, 0);
    assert.equal(metrics.canvases, 1);
    assert.ok(metrics.particleDrawCounts.includes(5200), 'Full torus density must remain');
    assert.ok(metrics.particleDrawCounts.includes(1200), 'Accent ring must remain');
    assert.equal(metrics.overflow, false);
    assert.deepEqual(metrics.brokenAnchors, []);
    assert.deepEqual(errors, []);
    assert.ok(metrics.firstDeferredScriptMs >= metrics.firstContentfulPaintMs, 'WebGL assets should start after content paints');
    assert.ok(await draws(page) > 0, 'Visible WebGL must animate');
    await page.screenshot({ path: 'artifacts/landing/optimized-hero-desktop.png' });

    // Magnetic interaction still works; route changes stay in the same document.
    const button = page.getByRole('link', { name: 'Get started with Friends AI' });
    const rect = await button.boundingBox();
    await page.mouse.move(rect.x + rect.width * 0.8, rect.y + rect.height / 2);
    await page.waitForFunction(() => document.querySelector('a[aria-label="Get started with Friends AI"]').style.transform !== 'none');
    await page.mouse.move(0, 0);

    console.log('Checking offscreen suspension and waveform transforms…');
    await scrollTo(page, '[data-voice-waveform]');
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]').dataset.rendering === 'paused');
    await pause(100);
    metrics.offscreenDraws = await draws(page);
    assert.equal(metrics.offscreenDraws, 0, 'Offscreen WebGL must stop rendering');
    const waveform = page.locator('[data-voice-waveform] span').first();
    await pause(350);
    const waveBefore = await waveform.evaluate(el => getComputedStyle(el).transform);
    await pause(350);
    const waveAfter = await waveform.evaluate(el => getComputedStyle(el).transform);
    assert.notEqual(waveBefore, waveAfter, 'Waveform must still animate');
    assert.equal(await waveform.evaluate(el => getComputedStyle(el).height), '80px', 'Waveform should scale without relayout');

    // Trigger entrance animations for visual QA of every original section.
    await revealPage(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]').dataset.rendering === 'active');
    assert.ok(await draws(page) > 0, 'Scene must resume without remounting');
    await page.screenshot({ path: 'artifacts/landing/optimized-desktop.png', fullPage: true });

    // Dispatch a visibility state change to exercise the app's tab-pause handler.
    console.log('Checking hidden-tab pause/resume and SPA navigation…');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]').dataset.rendering === 'paused');
    await pause(100);
    metrics.hiddenTabDraws = await draws(page);
    assert.equal(metrics.hiddenTabDraws, 0);
    assert.equal(await page.locator('.v2-aurora').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]').dataset.rendering === 'active');
    assert.ok(await draws(page) > 0);
    await page.evaluate(() => { window.__sameDocument = true; });
    await page.getByRole('link', { name: 'Sign in to Friends AI' }).click();
    await page.waitForURL('**/signin');
    assert.equal(await page.evaluate(() => window.__sameDocument), true);
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    await page.goBack({ waitUntil: 'networkidle' });

    console.log('Checking mobile navigation, layout, and retained animation…');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded'), 'false');
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Pricing' }).click();
    await page.getByRole('button', { name: 'Open navigation' }).waitFor();
    await revealPage(page);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await pause(500);
    await page.screenshot({ path: 'artifacts/landing/optimized-hero-mobile.png' });
    await page.screenshot({ path: 'artifacts/landing/optimized-mobile.png', fullPage: true });
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Overflow at ' + width);
    }
    const alias = await page.request.get(origin + '/v2', { maxRedirects: 0 });
    assert.equal(alias.status(), 308);
    assert.equal(alias.headers().location, '/');
    const protectedPage = await page.request.get(origin + '/chat', { maxRedirects: 0 });
    assert.equal(protectedPage.status(), 307);
    assert.match(protectedPage.headers().location, /\/signin\?callbackUrl=%2Fchat$/);

    console.log('Checking no-JavaScript content and reduced-motion preference…');
    const noJS = await browser.newContext({ javaScriptEnabled: false });
    const staticPage = await noJS.newPage();
    await staticPage.goto(origin);
    await staticPage.getByRole('heading', { level: 1 }).waitFor({ state: 'visible' });
    assert.equal(await staticPage.locator('#hero-heading').evaluate(el => el.style.opacity), '');
    await scrollTo(staticPage, '#pricing');
    await staticPage.getByRole('heading', { name: 'Simple, two-tier.' }).waitFor({ state: 'visible' });
    assert.equal(await staticPage.locator('#pricing [data-v2-reveal]').first().evaluate(el => getComputedStyle(el).opacity), '1');
    await noJS.close();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(origin);
    await page.waitForFunction(() => document.querySelector('[data-hero-scene]').dataset.rendering === 'still');
    await page.locator('canvas').waitFor();
    await pause(500);
    assert.equal(await draws(page), 0);
    assert.equal(await page.locator('.v2-aurora').evaluate(el => getComputedStyle(el).animationName), 'none');
    assert.deepEqual(errors, []);
    fs.writeFileSync('artifacts/landing/optimized.json', JSON.stringify({ ...metrics, errors, checks: 'passed' }, null, 2));
    console.log(JSON.stringify({ ...metrics, errors, checks: 'passed' }, null, 2));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
