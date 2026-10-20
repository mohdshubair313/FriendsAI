// Browser integration test. Provider, session and persistence APIs are mocked;
// the actual app, SSE reader, React components and canvas rendering run unchanged.
// Run against `next start`: node --env-file=.env scripts/check-ai-kit.cjs
const { chromium } = require('playwright');
const { encode } = require('next-auth/jwt');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const origin = process.env.AI_KIT_URL || 'http://localhost:3102';
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const search = {
  sources: [{ id: '1', title: 'Next.js documentation', url: 'https://nextjs.org/docs' }],
  queries: ['Next.js documentation'],
  suggestionsHtml: '<div style="padding:12px;border-radius:12px;background:#1c1c1c;color:white;font:14px sans-serif">Google Search · <a style="color:#a5b4fc" href="https://www.google.com/search?q=nextjs">Next.js</a></div>',
};
async function main() {
  assert(process.env.AUTH_SECRET, 'AUTH_SECRET required for a local test session');
  fs.mkdirSync('artifacts/ai-kit', { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const token = await encode({ secret: process.env.AUTH_SECRET, token: { id: '000000000000000000000001', name: 'UI Test' }, maxAge: 3600 });
    await context.addCookies([{ name: 'next-auth.session-token', value: token, url: origin, httpOnly: true }]);
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => {
      const path = new URL(route.request().url()).pathname;
      const body = path === '/api/auth/session' ? { user: { id: '000000000000000000000001', name: 'UI Test', email: 'test@example.com' }, expires: '2099-01-01' }
        : path === '/api/check-subscription' ? { isPremium: true, tier: 'pro', features: { voiceConversational: true }, remaining: {} }
        : path.endsWith('/messages') ? { messages: [{ id: 'saved', role: 'assistant', content: 'A saved grounded reply [1](<https://nextjs.org/docs>)', imageUrl: null, search }] }
        : path === '/api/conversations' ? { conversations: [] } : { user: { buddyPersona: 'friendly' } };
      return route.fulfill({ json: body });
    });
    await page.addInitScript(() => {
      const original = window.fetch.bind(window);
      window.__test = { requests: [], draws: 0, micStarts: 0, micStops: 0 };
      const draw = WebGLRenderingContext.prototype.drawArrays;
      WebGLRenderingContext.prototype.drawArrays = function(...args) { window.__test.draws++; return draw.apply(this, args); };
      class Recognition {
        constructor() { window.__test.recognition = this; }
        start() { window.__test.micStarts++; this.onstart?.(); }
        stop() { window.__test.micStops++; this.onend?.(); }
      }
      window.SpeechRecognition = Recognition;
      window.fetch = async (input, init) => {
        if (String(input) !== '/api/orchestrate') return original(input, init);
        window.__test.requests.push(JSON.parse(init.body));
        let closed = false;
        const body = new ReadableStream({ start(controller) {
          window.__test.emit = payload => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`));
          window.__test.close = () => { closed = true; controller.close(); };
          init.signal.addEventListener('abort', () => {
            if (!closed) { closed = true; controller.error(new DOMException('Stopped', 'AbortError')); }
          });
        } });
        return new Response(body, { headers: { 'Content-Type': 'text/event-stream' } });
      };
    });
    const emit = event => page.evaluate(event => window.__test.emit(event), event);
    const send = async text => {
      const count = await page.evaluate(() => window.__test.requests.length);
      await page.getByRole('textbox', { name: 'Message Friends AI' }).fill(text);
      await page.getByRole('button', { name: 'Send message' }).click();
      await page.waitForFunction(count => window.__test.requests.length > count, count);
    };
    const done = async () => { await emit({ type: 'done' }); await page.evaluate(() => window.__test.close()); await page.getByRole('button', { name: 'Send message' }).waitFor(); };

    await page.goto(origin + '/chat');
    await page.locator('[data-slot="matrix-orb"]').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Web search', exact: true }).getAttribute('aria-pressed'), 'true');
    await send('Find current Next.js documentation');
    await page.locator('[data-slot="ai-status"][data-state="thinking"]').waitFor();
    await emit({ type: 'start', mode: 'chat' });
    await emit({ type: 'conversation', id: '000000000000000000000002' });
    await emit({ type: 'search_start' });
    await page.locator('[data-slot="web-search"][data-status="searching"]').waitFor();
    await emit({ type: 'token', content: 'Here is the documentation.' });
    await page.locator('[data-slot="ai-status"][data-state="writing"]').waitFor();
    await emit({ type: 'search_done', content: 'Here is the documentation. [1](<https://nextjs.org/docs>)', search });
    await done();
    await page.locator('[data-slot="web-search-citation"]').waitFor();
    await page.locator('iframe[title="Google Search suggestions"]').waitFor();
    assert.equal(await page.locator('[data-slot="web-search-source"]').count(), 1);
    assert.equal(await page.locator('[data-slot="web-search-citation"] a').getAttribute('href'), 'https://nextjs.org/docs');
    assert(await page.locator('iframe').getAttribute('sandbox') === 'allow-popups allow-popups-to-escape-sandbox');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-slot="ai-status"]');
      const sources = document.querySelector('[data-slot="web-search-sources"]');
      return status?.querySelectorAll('[data-slot="ai-status-label"]').length === 1 && sources?.querySelectorAll('li[aria-hidden]').length === 0;
    }).catch(async error => {
      console.log(await page.evaluate(() => ({
        labels: [...document.querySelectorAll('[data-slot="ai-status-label"]')].map(el => ({ text: el.textContent, opacity: getComputedStyle(el).opacity, html: el.outerHTML.slice(0, 700) })),
        skeletons: [...document.querySelectorAll('[data-slot="web-search-sources"] li[aria-hidden]')].map(el => ({ opacity: getComputedStyle(el).opacity, html: el.outerHTML.slice(0, 700) })),
      })));
      throw error;
    });
    await delay(500);
    await page.screenshot({ path: 'artifacts/ai-kit/chat-desktop.png' });

    await page.getByRole('button', { name: 'Web search', exact: true }).click();
    await send('Explain it');
    assert.equal(await page.evaluate(() => window.__test.requests.at(-1).webSearch), false);
    assert((await page.evaluate(() => window.__test.requests.at(-1).messages.length)) > 1, 'follow-up includes context');
    await emit({ type: 'token', content: 'A partial answer' });
    await page.getByRole('button', { name: 'Stop generating' }).click();
    await page.locator('[data-slot="ai-status"][data-state="stopped"]').waitFor();

    await send('Fail this request');
    await emit({ type: 'error', code: 'provider_quota', content: 'Test provider failure' });
    await page.locator('[data-slot="ai-status"][data-state="error"]').waitFor();
    await page.getByText("Gemini's quota or rate limit has been reached.", { exact: false }).waitFor();
    await page.evaluate(() => window.__test.close());

    await send('/image a violet landscape');
    await emit({ type: 'start', mode: 'image' });
    await page.locator('[data-slot="grid-reveal"]').waitFor();
    await emit({ type: 'image_progress', phase: 'uploading' });
    await page.locator('[data-slot="ai-status"][data-state="uploading"]').waitFor();
    const image = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 100; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#818cf8'; ctx.fillRect(0, 0, 100, 100); return canvas.toDataURL(); });
    await emit({ type: 'image_done', url: image, prompt: 'A violet landscape' });
    await done();
    await page.getByText('Open full image').waitFor();
    await delay(3000);
    await page.screenshot({ path: 'artifacts/ai-kit/image-reveal.png' });

    await page.getByTitle('Live Audio Link').click();
    await page.getByRole('dialog').waitFor();
    await page.waitForFunction(() => window.__test.draws > 3);
    await page.getByRole('button', { name: 'Start microphone' }).click();
    await page.locator('[data-slot="matrix-orb"][data-state="listening"]').waitFor();
    await page.screenshot({ path: 'artifacts/ai-kit/voice-desktop.png' });
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
    const before = await page.evaluate(() => window.__test.draws); await delay(300);
    assert.equal(await page.evaluate(() => window.__test.draws), before, 'hidden voice orb does not render');
    await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'detached' });
    assert((await page.evaluate(() => window.__test.micStops)) > 0, 'closing stops microphone');

    await page.reload();
    await page.getByText('A saved grounded reply', { exact: false }).waitFor();
    await page.locator('[data-slot="web-search-citation"]').waitFor();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      await delay(300);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `No horizontal overflow at ${width}`);
      await page.getByRole('textbox', { name: 'Message Friends AI' }).scrollIntoViewIfNeeded();
      assert(await page.getByRole('button', { name: 'Send message' }).isVisible());
      assert((await page.getByRole('textbox', { name: 'Message Friends AI' }).boundingBox()).width > 90, 'input must not be clipped by desktop sidebar');
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'artifacts/ai-kit/chat-mobile.png' });
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('dialog', { name: 'App navigation' }).waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog', { name: 'App navigation' }).waitFor({ state: 'detached' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByTitle('Live Audio Link').click();
    await page.locator('[data-slot="fluid-orb"] canvas').waitFor();
    await delay(350);
    const staticBefore = await page.evaluate(() => window.__test.draws); await delay(300);
    assert.equal(await page.evaluate(() => window.__test.draws), staticBefore, 'reduced motion shows a still orb');
    await page.screenshot({ path: 'artifacts/ai-kit/voice-mobile.png' });
    assert.deepEqual(errors, []);
    console.log('AI Kit browser checks passed: streamed states, native sources/citations, history, search toggle/context, stop/error, image reveal, voice cleanup, hidden tab, reduced motion, responsive layout.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
