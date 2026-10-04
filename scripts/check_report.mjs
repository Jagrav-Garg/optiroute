import { chromium } from "playwright";
import { existsSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const report = process.argv[2];
if (!report) throw new Error("Usage: node scripts/check_report.mjs <plan.html path>");
const candidates = [process.env.PLAYWRIGHT_BROWSER_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].filter(Boolean);
const executablePath = candidates.find(existsSync);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const output = resolve("data/report-qa");
mkdirSync(output, { recursive: true });
try {
  for (const [name, viewport] of [["desktop", { width: 1280, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(pathToFileURL(resolve(report)).href);
    await page.locator("h1").waitFor();
    await page.evaluate(async () => {
      await Promise.all([...document.images].map((image) => {
        image.loading = "eager";
        return image.decode().catch(() => {});
      }));
    });
    const state = await page.evaluate(() => ({
      title: document.querySelector("h1").textContent,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      images: [...document.images].map((image) => ({ src: image.src, loaded: image.naturalWidth > 0 })),
      bodyTextLength: document.body.innerText.length,
    }));
    await page.screenshot({ path: join(output, `${name}.png`), fullPage: true });
    console.log(JSON.stringify({ viewport: name, ...state, errors }));
    if (state.horizontalOverflow || errors.length || state.bodyTextLength < 500 || state.images.some((image) => !image.loaded)) {
      throw new Error(`${name} report did not pass visual checks`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
