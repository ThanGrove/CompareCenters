import { chromium, type Browser } from "playwright";
import * as cheerio from "cheerio";
import { writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { prisma } from "@/lib/db";
import type { CrawledPage } from "./types";

const MAX_PAGES = Number(process.env.CRAWL_MAX_PAGES_PER_CENTER ?? 25);
const THROTTLE_MS = Number(process.env.CRAWL_THROTTLE_MS ?? 1500);
const RAW_DIR = path.join(process.cwd(), "data", "crawl");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Pages most likely to carry comparison-relevant content. Used to prioritize the
// crawl frontier so we spend the page budget well.
const PRIORITY_HINTS = [
  "about",
  "program",
  "research",
  "people",
  "faculty",
  "mission",
  "event",
  "course",
  "study",
];

function priority(url: string): number {
  const u = url.toLowerCase();
  return PRIORITY_HINTS.reduce((n, h) => (u.includes(h) ? n + 1 : n), 0);
}

// Turn a fetched HTML document into cleaned, readable text + a title.
function cleanHtml(html: string): { title: string; text: string } {
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript, svg").remove();
  const title = $("title").first().text().trim();
  const text = $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000); // cap per-page text to keep extraction cost bounded
  return { title, text };
}

// Collect same-host links worth following.
function sameHostLinks(html: string, base: URL): string[] {
  const $ = cheerio.load(html);
  const out = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const u = new URL(href, base);
      if (u.hostname !== base.hostname) return;
      if (!/^https?:$/.test(u.protocol)) return;
      u.hash = "";
      out.add(u.toString());
    } catch {
      /* ignore malformed urls */
    }
  });
  return [...out];
}

// Politely crawl one center: same-host BFS, prioritized frontier, throttled,
// capped at MAX_PAGES. Returns the cleaned pages (raw HTML saved to disk).
async function crawlSite(
  homepage: string,
  browser: Browser,
): Promise<CrawledPage[]> {
  const start = new URL(homepage);
  const visited = new Set<string>();
  const frontier: string[] = [start.toString()];
  const pages: CrawledPage[] = [];
  const page = await browser.newPage();

  try {
    while (frontier.length && pages.length < MAX_PAGES) {
      // Take the highest-priority URL next.
      frontier.sort((a, b) => priority(b) - priority(a));
      const url = frontier.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      let html: string;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        html = await page.content();
      } catch {
        continue; // skip pages that fail to load
      }

      const { title, text } = cleanHtml(html);
      if (text.length > 200) {
        pages.push({ url, title, text, rawHtml: html });
      }

      for (const link of sameHostLinks(html, start)) {
        if (!visited.has(link)) frontier.push(link);
      }

      await sleep(THROTTLE_MS); // be polite to peer institutions
    }
  } finally {
    await page.close();
  }

  return pages;
}

// Crawl a center and persist a snapshot (Crawl + Page rows). Returns the crawlId.
export async function runCrawl(centerId: string): Promise<string> {
  const center = await prisma.center.findUniqueOrThrow({ where: { id: centerId } });
  const crawl = await prisma.crawl.create({
    data: { centerId, status: "running" },
  });

  const browser = await chromium.launch();
  try {
    const pages = await crawlSite(center.homepage, browser);
    const rawBase = path.join(RAW_DIR, crawl.id);
    await mkdir(rawBase, { recursive: true });

    for (const p of pages) {
      const hash = createHash("sha1").update(p.url).digest("hex").slice(0, 16);
      const rawPath = path.join("data", "crawl", crawl.id, `${hash}.html`);
      await writeFile(path.join(process.cwd(), rawPath), p.rawHtml);
      await prisma.page.create({
        data: { crawlId: crawl.id, url: p.url, title: p.title, text: p.text, rawPath },
      });
    }

    await prisma.crawl.update({
      where: { id: crawl.id },
      data: { status: "complete", finishedAt: new Date(), pageCount: pages.length },
    });
    console.log(`  crawled ${pages.length} pages for ${center.name}`);
    return crawl.id;
  } catch (err) {
    await prisma.crawl.update({
      where: { id: crawl.id },
      data: { status: "failed", finishedAt: new Date(), error: String(err) },
    });
    throw err;
  } finally {
    await browser.close();
  }
}
