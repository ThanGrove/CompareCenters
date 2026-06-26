// Seeds the Center table from src/config/centers.ts. Idempotent — upserts by
// slug, so editing the config list and re-running keeps things in sync.
import { PrismaClient } from "@prisma/client";
import { CENTERS } from "../src/config/centers";

const prisma = new PrismaClient();

async function main() {
  for (const c of CENTERS) {
    await prisma.center.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        name: c.name,
        homepage: c.homepage,
        isFocus: c.isFocus ?? false,
        notes: c.notes,
      },
      update: {
        name: c.name,
        homepage: c.homepage,
        isFocus: c.isFocus ?? false,
        notes: c.notes,
      },
    });
    console.log(`seeded ${c.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
