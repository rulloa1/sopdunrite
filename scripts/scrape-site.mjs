/**
 * scrape-site.mjs — capture a public web page as screenshot + links + JSON.
 *
 * Uses Playwright + Chromium. Honors an HTTPS_PROXY if one is set (so it works
 * inside the Claude Code on the web sandbox *when the environment's network
 * policy allows the target host* — otherwise the proxy returns 403 and the
 * navigation fails; run it locally, or widen the egress allowlist).
 *
 * Usage:
 *   node scripts/scrape-site.mjs <url> [outDir]
 *   node scripts/scrape-site.mjs https://dunriteconstructiongroup.com ./scrape-out
 *
 * Outputs into outDir (default ./scrape-out):
 *   - screenshot.png   full-page screenshot
 *   - content.json     { status, url, title, metaDescription, headings, links, images, bodyText }
 *   - links.txt        de-duplicated "text  ->  href" list
 *
 * Requires the `playwright` package (npm i -D playwright, or a global install)
 * and a Chromium build. In the web sandbox the browser is pre-installed under
 * /opt/pw-browsers; set PW_CHROME to override the executable path.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadChromium() {
  // Prefer a local/global `playwright`; fall back to a known sandbox path.
  try {
    return require("playwright").chromium;
  } catch {
    const { execSync } = require("node:child_process");
    const gRoot = execSync("npm root -g").toString().trim();
    return require(gRoot + "/playwright").chromium;
  }
}

const url = process.argv[2];
const outDir = process.argv[3] || "./scrape-out";
if (!url) {
  console.error("Usage: node scripts/scrape-site.mjs <url> [outDir]");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });

const chromium = loadChromium();
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;

const launch = { headless: true };
if (process.env.PW_CHROME) launch.executablePath = process.env.PW_CHROME;
if (proxy) launch.proxy = { server: proxy };

const browser = await chromium.launch(launch);
const ctx = await browser.newContext({
  ignoreHTTPSErrors: true,
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();

let resp;
try {
  resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
} catch (e) {
  console.error("networkidle navigation failed, retrying with domcontentloaded:", e.message);
  resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
}
await page.waitForTimeout(1500);

await page.screenshot({ path: `${outDir}/screenshot.png`, fullPage: true });

const data = await page.evaluate(() => {
  const txt = (el) => (el?.innerText || "").trim().replace(/\s+/g, " ");
  return {
    url: location.href,
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.content || null,
    headings: [...document.querySelectorAll("h1,h2,h3")]
      .map((h) => ({ tag: h.tagName.toLowerCase(), text: txt(h) }))
      .filter((h) => h.text),
    links: [...document.querySelectorAll("a[href]")]
      .map((a) => ({ text: txt(a).slice(0, 120), href: a.href }))
      .filter((l) => l.href && !l.href.startsWith("javascript:")),
    images: [...document.querySelectorAll("img[src]")].map((i) => ({
      alt: i.alt || null,
      src: i.src,
    })),
    bodyText: document.body.innerText.trim().replace(/\n{3,}/g, "\n\n"),
  };
});

const seen = new Set();
data.links = data.links.filter((l) => (seen.has(l.href) ? false : seen.add(l.href)));

writeFileSync(
  `${outDir}/content.json`,
  JSON.stringify({ status: resp?.status() ?? null, ...data }, null, 2),
);
writeFileSync(
  `${outDir}/links.txt`,
  data.links.map((l) => `${l.text || "(no text)"}  ->  ${l.href}`).join("\n"),
);

console.log(`status=${resp?.status()} title=${JSON.stringify(data.title)}`);
console.log(
  `links=${data.links.length} images=${data.images.length} headings=${data.headings.length} bodyChars=${data.bodyText.length}`,
);
console.log(`wrote ${outDir}/screenshot.png, content.json, links.txt`);

await browser.close();
