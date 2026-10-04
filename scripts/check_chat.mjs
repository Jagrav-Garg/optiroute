import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.CHAT_URL || 'http://127.0.0.1:8000';
const live = process.argv.includes('--live');
const savedRun = process.argv.find(arg => arg.startsWith('--run='))?.slice(6);
const output = `data/chat-qa/${live ? 'live' : 'demo'}`;
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.on('pageerror', error => errors.push(error.message));
page.setDefaultTimeout(30000);

async function screenshot(name) { await page.screenshot({ path: `${output}/${name}.png` }); }
async function noOverflow(target) {
  const dimensions = await target.evaluate(() => ({
    page: document.documentElement.scrollWidth - window.innerWidth,
    thread: document.querySelector('.thread').scrollWidth - document.querySelector('.thread').clientWidth,
  }));
  assert(dimensions.page <= 1 && dimensions.thread <= 1, `Horizontal overflow: ${JSON.stringify(dimensions)}`);
}

try {
  if (savedRun) {
    const saved = await (await page.request.get(`${base}/chats/${savedRun}`)).json();
    assert.equal(saved.status, 'completed');
    await page.goto(`${base}/?chat=${savedRun}`);
    await page.getByTestId('final-report').waitFor();
    // A long replay must not regress the snapshot to historical running states.
    let missing = 0;
    for (let i = 0; i < 40; i++) { if (!await page.getByTestId('final-report').isVisible()) missing++; await page.waitForTimeout(50); }
    assert.equal(missing, 0, 'Final report flickered during replay');
    await page.waitForFunction(() => [...document.querySelectorAll('.agent-card .agent-state')].length === 3 && [...document.querySelectorAll('.agent-card .agent-state')].every(el => el.textContent.includes('Complete')));
    await noOverflow(page);
    await page.evaluate(() => { document.querySelector('.thread').scrollTop = document.querySelector('.report-message').offsetTop - 100; });
    await page.locator('.report-message img').evaluateAll(images => images.forEach(img => img.loading = 'eager'));
    await page.waitForTimeout(5000);
    await screenshot('final-desktop');
    for (const tab of ['Travel & stays', 'Budget', 'Sources', 'Itinerary']) { await page.getByRole('tab', { name: tab, exact: true }).click(); await noOverflow(page); }
    for (const role of ['transit', 'hotels', 'places', 'planner']) {
      if (role === 'planner') await page.locator('.planner-progress').click(); else await page.getByTestId(`agent-${role}`).click();
      await page.getByRole('tab', { name: 'Output', exact: true }).click();
      assert(await page.locator('.draft-output').innerText());
      await screenshot(`saved-${role}`);
      await page.getByRole('button', { name: 'Close agent panel', exact: true }).last().click();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByTestId('final-report').waitFor();
    await page.waitForTimeout(1500);
    await noOverflow(page);
    await page.evaluate(() => { document.querySelector('.thread').scrollTop = document.querySelector('.report-message').offsetTop - 70; });
    await screenshot('final-mobile');
    await page.getByTestId('agent-places').click();
    await page.getByRole('tab', { name: 'Output', exact: true }).click();
    await screenshot('agent-mobile');
    await noOverflow(page);
    await page.keyboard.press('Escape');
    const images = await page.locator('.report-message img').evaluateAll(items => items.map(img => img.complete && img.naturalWidth > 0));
    assert(images.length && images.every(Boolean), 'Saved photos must load');
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(JSON.stringify({ run_id: savedRun, status: saved.status, replay_flickers: missing, sources: saved.result.plan.sources.length, photos: images.length, errors, screenshots: output }, null, 2));
  } else {
  await page.goto(base);
  await page.getByRole('button', { name: 'New trip', exact: true }).click();
  await page.getByRole('combobox', { name: 'Model provider' }).selectOption(live ? 'cline' : 'demo');
  await screenshot('empty-desktop');
  await page.getByRole('textbox', { name: 'Trip prompt' }).fill(live ? 'Plan a trip to Switzerland. This is a streaming UI test; follow-up answers will provide explicit sample assumptions.' : 'Plan a weekend in Jaipur');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('textbox', { name: 'Follow-up answers' }).waitFor({ timeout: 150000 });
  await screenshot('followup');
  await page.getByRole('textbox', { name: 'Follow-up answers' }).fill(live
    ? 'Test assumptions, not confirmed personal preferences: Delhi to Switzerland, 7-13 June 2027, 2 adults, CHF 6000 total group budget. Relaxed pace; vegetarian food, scenic lakes, mountain views and old towns. Zurich, Lucerne and Interlaken. One budget double room for 6 nights; international return flights and public trains. Avoid strenuous hiking and use no more than 4 activities per day. Include flights, lodging, meals, Swiss transport, sightseeing and contingency. Disclose uncertain costs rather than inventing quotes. No other constraints; proceed with these preferences.'
    : 'Delhi, two travelers, total INR 14000, two days next month. History, vegetarian food, trains and a central budget stay. Use the demo fixture dates and preferences.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByTestId('agent-places').waitFor({ timeout: 150000 });
  assert.equal(await page.locator('.agent-card').count(), 3);
  await page.getByTestId('agent-places').click();
  await page.getByRole('tab', { name: 'Output', exact: true }).click();
  await page.locator('.draft-output > p').first().waitFor({ timeout: 180000 });
  await screenshot('agents-streaming');
  await noOverflow(page);
  await page.getByRole('tab', { name: 'Activity', exact: true }).click();
  await page.locator('.log-sources a').first().waitFor();
  await screenshot('agent-activity');
  await page.getByRole('button', { name: 'Close agent panel', exact: true }).last().click();
  await page.getByTestId('final-report').waitFor({ timeout: 300000 });
  await noOverflow(page);
  const runId = new URL(page.url()).searchParams.get('chat');
  const chat = await (await page.request.get(`${base}/chats/${runId}`)).json();
  assert.equal(chat.status, 'completed');
  for (const research of Object.values(chat.result.research)) assert(research.data, 'Specialist must have completed');
  assert.equal(chat.result.cost.run_accounted_usd, 0, 'Live test must remain free');
  if (live) { assert(chat.result.plan.images.length > 0); assert.equal(chat.result.plan.days.length, 7); }
  const eventText = await (await page.request.get(`${base}/chats/${runId}/events`)).text();
  const drafts = eventText.split('\n').filter(line => line.includes('"kind": "agent_draft"')).length;
  assert(drafts > 6, `Expected incremental drafts, got ${drafts}`);
  const recorded = eventText.split('\n').filter(line => line.startsWith('data: ') && line.includes('"kind":')).map(line => JSON.parse(line.slice(6)));
  for (const role of ['transit', 'hotels', 'places']) {
    const streamed = recorded.filter(e => e.kind === 'agent_draft' && e.payload.role === role);
    const completed = recorded.find(e => e.kind === 'agent_completed' && e.payload.role === role);
    assert(streamed.length > 1 && completed && streamed[0].id < completed.id, `${role} must stream before completing`);
  }
  assert(!eventText.includes('"reasoning"') && !eventText.includes('"reasoning_details"'));
  await page.getByRole('tab', { name: 'Budget', exact: true }).click();
  await screenshot('budget');
  await page.getByRole('tab', { name: 'Sources', exact: true }).click();
  assert(await page.locator('.source-list a').count() > 0);
  await page.getByRole('tab', { name: 'Itinerary', exact: true }).click();
  await page.getByRole('button', { name: 'All days', exact: true }).click();
  assert.equal(await page.locator('.day-plan').count(), chat.result.plan.days.length);
  await page.evaluate(() => { document.querySelector('.thread').scrollTop = document.querySelector('.report-message').offsetTop - 100; });
  await page.waitForTimeout(700);
  await page.locator('.report-message img').evaluateAll(images => images.forEach(img => img.loading = 'eager'));
  await page.waitForTimeout(live ? 5000 : 300);
  await screenshot('final-desktop');
  await page.reload();
  await page.getByTestId('final-report').waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.agent-card .agent-state')].every(el => el.textContent.includes('Complete')));
  assert.equal(await page.locator('.user-message').count(), 2);
  await noOverflow(page);
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
  const phone = await mobile.newPage();
  phone.on('pageerror', error => errors.push(error.message));
  await phone.goto(`${base}/?chat=${runId}`);
  await phone.getByTestId('final-report').waitFor();
  await noOverflow(phone);
  await phone.evaluate(() => { document.querySelector('.thread').scrollTop = document.querySelector('.report-message').offsetTop - 70; });
  await phone.locator('.report-message img').evaluateAll(images => images.forEach(img => img.loading = 'eager'));
  await phone.waitForTimeout(live ? 5000 : 300);
  await phone.screenshot({ path: `${output}/final-mobile.png` });
  await phone.getByTestId('agent-places').click();
  await phone.getByRole('tab', { name: 'Output', exact: true }).click();
  await noOverflow(phone);
  await phone.screenshot({ path: `${output}/agent-mobile.png` });
  await phone.keyboard.press('Escape');
  await phone.getByRole('button', { name: 'Open chat history' }).click();
  await phone.getByRole('button', { name: 'Close chat history', exact: true }).last().click();
  const photos = await page.locator('.report-message img').evaluateAll(images => images.map(img => ({ loaded: img.complete && img.naturalWidth > 0, src: img.src })));
  assert(photos.every(photo => photo.loaded), 'Report images must load');
  assert.equal(errors.length, 0, errors.join('\n'));
  await page.getByRole('button', { name: 'New trip', exact: true }).click();
  await page.getByRole('combobox', { name: 'Model provider' }).selectOption('demo');
  await page.getByRole('textbox', { name: 'Trip prompt' }).fill('Cancellation smoke test');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('button', { name: 'Stop request' }).click();
  await page.getByText('Request stopped. Partial activity has been preserved.').waitFor();
  assert.equal((await (await page.request.get(`${base}/chats/${new URL(page.url()).searchParams.get('chat')}`)).json()).status, 'cancelled');
  console.log(JSON.stringify({ run_id: runId, mode: live ? 'cline' : 'demo', status: chat.status, drafts,
    sources: chat.result.plan.sources.length, photos: photos.length, cost_usd: chat.result.cost.run_accounted_usd,
    validation: chat.result.plan.validation.status, errors, screenshots: output }, null, 2));
  }
} finally {
  await browser.close();
}
