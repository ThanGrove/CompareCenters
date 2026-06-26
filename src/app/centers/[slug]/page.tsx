import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { DIMENSIONS } from "@/config/dimensions";
import type { DimensionExtraction } from "@/lib/types";

// Per-center drill-down: the extracted picture per dimension, and — for peers —
// the side-by-side comparison against CSC.
export const dynamic = "force-dynamic";

export default async function CenterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const center = await prisma.center.findUnique({
    where: { slug },
    include: {
      extractions: true,
      comparisons: true,
    },
  });
  if (!center) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-stone-500 hover:underline">
          ← Landscape
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{center.name}</h1>
        <a
          href={center.homepage}
          className="text-sm text-emerald-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {center.homepage}
        </a>
        {center.notes && <p className="mt-2 text-stone-600">{center.notes}</p>}
      </div>

      {DIMENSIONS.map((dim) => {
        const extraction = center.extractions.find((e) => e.dimension === dim.id);
        const comparison = center.comparisons.find((c) => c.dimension === dim.id);
        const data = extraction
          ? (JSON.parse(extraction.data) as DimensionExtraction)
          : null;

        return (
          <section
            key={dim.id}
            className="rounded-lg border border-stone-200 bg-white p-5"
          >
            <h2 className="text-lg font-semibold">{dim.label}</h2>

            {data ? (
              <div className="mt-3 space-y-2">
                <p className="text-stone-700">{data.summary}</p>
                {data.items?.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
                    {data.items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-stone-400">
                Not extracted yet — run `npm run extract`.
              </p>
            )}

            {!center.isFocus && comparison && (
              <div className="mt-4 rounded border border-emerald-100 bg-emerald-50/50 p-4">
                <h3 className="text-sm font-semibold text-emerald-800">
                  CSC vs {center.name}
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                  {comparison.assessment}
                </p>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
