#!/usr/bin/env node
// Scrapes a single site: full-page screenshot, internal/external links, and
// structured content (title, meta, headings, paragraphs, images) as JSON.
//
// Usage:
//   node scripts/scrape-site.mjs <url> [--out <dir>]
//
// Output (default scrape-output/<hostname>/):
//   screenshot.png
//   content.json
//   links.txt

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function parseArgs(argv) {
  const [url, ...rest] = argv;
  if (!url) {
    console.error("Usage: node scripts/scrape-site.mjs <url> [--out <dir>]");
    process.exit(1);
  }
  let outDir;
  const outIndex = rest.indexOf("--out");
  if (outIndex !== -1) outDir = rest[outIndex + 1];
  return { url, outDir };
}

async function scrape(url, outDir) {
  const target = new URL(url);
  const resolvedOutDir = outDir
    ? path.resolve(outDir)
    : path.resolve("scrape-output", target.hostname);
  await mkdir(resolvedOutDir, { recursive: true });

  const proxyServer = process.env.HTTPS_PROXY || process.env.https_proxy;
  const proxyBypass = process.env.NO_PROXY || process.env.no_proxy;
  // PLAYWRIGHT_CHROMIUM_PATH overrides the browser binary playwright picks by
  // default, for environments where the installed revision doesn't match the
  // pinned playwright package version. proxy lets the browser process go
  // through the same egress proxy as the rest of the toolchain, if set.
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    proxy: proxyServer ? { server: proxyServer, bypass: proxyBypass || undefined } : undefined,
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(target.href, { waitUntil: "networkidle" });

    const screenshotPath = path.join(resolvedOutDir, "screenshot.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const content = await page.evaluate(() => {
      const text = (el) => el?.textContent?.trim().replace(/\s+/g, " ") ?? "";
      return {
        title: document.title,
        metaDescription:
          document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
        headings: Array.from(document.querySelectorAll("h1, h2, h3")).map((el) => ({
          level: el.tagName.toLowerCase(),
          text: text(el),
        })),
        paragraphs: Array.from(document.querySelectorAll("p")).map(text).filter(Boolean),
        images: Array.from(document.querySelectorAll("img")).map((img) => ({
          src: img.src,
          alt: img.alt || null,
        })),
      };
    });

    const rawLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => a.href),
    );
    const links = Array.from(new Set(rawLinks)).sort();
    const internalLinks = links.filter((href) => {
      try {
        return new URL(href).hostname === target.hostname;
      } catch {
        return false;
      }
    });
    const externalLinks = links.filter((href) => !internalLinks.includes(href));

    const result = {
      url: target.href,
      scrapedAt: new Date().toISOString(),
      ...content,
      links: { internal: internalLinks, external: externalLinks },
    };

    await writeFile(path.join(resolvedOutDir, "content.json"), JSON.stringify(result, null, 2));
    await writeFile(path.join(resolvedOutDir, "links.txt"), links.join("\n") + "\n");

    console.log(`Saved to ${resolvedOutDir}`);
    console.log(`  - screenshot.png`);
    console.log(`  - content.json`);
    console.log(`  - links.txt (${links.length} links)`);
  } finally {
    await browser.close();
  }
}

const { url, outDir } = parseArgs(process.argv.slice(2));
await scrape(url, outDir);
