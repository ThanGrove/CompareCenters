// Pipeline runner. Usage (via package.json scripts):
//   npm run crawl     -> crawl every center
//   npm run extract   -> extract dimensions from the latest crawl of each center
//   npm run compare   -> compare CSC vs each peer across all dimensions
//   npm run pipeline  -> crawl + extract + compare, end to end
//
// Run individual stages while iterating; run `all` for a full refresh.
import { prisma } from "@/lib/db";
import { runCrawl } from "./crawl";
import { runExtract } from "./extract";
import { runCompare } from "./compare";
import { runDiscover } from "./discover";

async function crawlAll() {
  const centers = await prisma.center.findMany();
  for (const c of centers) {
    console.log(`crawling ${c.name}…`);
    try {
      await runCrawl(c.id);
    } catch (err) {
      console.error(`  failed: ${err}`);
    }
  }
}

async function extractAll() {
  const centers = await prisma.center.findMany();
  for (const c of centers) {
    console.log(`extracting ${c.name}…`);
    await runExtract(c.id);
  }
}

async function main() {
  const stage = process.argv[2] ?? "all";
  switch (stage) {
    case "discover":
      await runDiscover();
      break;
    case "crawl":
      await crawlAll();
      break;
    case "extract":
      await extractAll();
      break;
    case "compare":
      await runCompare();
      break;
    case "all":
      await crawlAll();
      await extractAll();
      await runCompare();
      break;
    default:
      console.error(`unknown stage: ${stage}`);
      process.exit(1);
  }
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
