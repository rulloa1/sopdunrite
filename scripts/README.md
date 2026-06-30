# scripts

## scrape-site.mjs

Capture a public web page as a full-page screenshot, a de-duplicated link list,
and a structured JSON document (title, meta description, headings, links, images,
body text). Built on Playwright + Chromium.

### Run it

```bash
# one-time, if playwright isn't already available
npm i -D playwright
npx playwright install chromium   # skip in the web sandbox; the browser is pre-installed

node scripts/scrape-site.mjs https://dunriteconstructiongroup.com ./scrape-out
```

Outputs in `./scrape-out` (default): `screenshot.png`, `content.json`, `links.txt`.

### Network note (Claude Code on the web)

The script honors `HTTPS_PROXY`. Inside the web sandbox it only reaches a host
the environment's **network policy** allows; otherwise the proxy returns `403`
and navigation fails. Either run it locally (unrestricted outbound) or add the
target domain to the environment's egress allowlist. In the sandbox the Chromium
binary lives under `/opt/pw-browsers`; set `PW_CHROME=/path/to/chrome` to point
at a specific build if auto-detection misses.

### Alternative: xcrawl MCP

For an off-the-shelf hosted scrape, the `xcrawl-mcp` MCP server works from a
local client (Cursor / VS Code / Claude Desktop). Add it to that client's MCP
config with your `XCRAWL_API_KEY` and prompt it to scrape the URL — it returns
screenshot, links, and JSON without a local browser. (Keep the API key in your
client config / a secret store, not in this repo.)
