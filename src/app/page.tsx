import Link from "next/link";
import { prisma } from "@/lib/db";
import { DIMENSIONS } from "@/config/dimensions";

// Landscape overview: the focus center, the peers, and how far the pipeline has
// gotten for each. Reads straight from the database the pipeline populates.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const centers = await prisma.center.findMany({
    orderBy: [{ isFocus: "desc" }, { name: "asc" }],
    include: {
      crawls: { where: { status: "complete" }, orderBy: { finishedAt: "desc" }, take: 1 },
      extractions: true,
      comparisons: true,
    },
  });

  if (centers.length === 0) {
    return (
      <EmptyState message="No centers yet. Seed them with `npm run db:seed`, then run `npm run pipeline`." />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold">Landscape</h1>
        <p className="mt-1 text-stone-600">
          {centers.length} centers tracked across {DIMENSIONS.length} dimensions:{" "}
          {DIMENSIONS.map((d) => d.label).join(", ")}.
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left text-stone-600">
            <tr>
              <th className="px-4 py-2 font-medium">Center</th>
              <th className="px-4 py-2 font-medium">Pages crawled</th>
              <th className="px-4 py-2 font-medium">Dimensions extracted</th>
              <th className="px-4 py-2 font-medium">Comparisons</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c.id} className="border-t border-stone-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/centers/${c.slug}`}
                    className="font-medium text-emerald-700 hover:underline"
                  >
                    {c.name}
                  </Link>
                  {c.isFocus && (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800">
                      focus
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {c.crawls[0]?.pageCount ?? 0}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {c.extractions.length} / {DIMENSIONS.length}
                </td>
                <td className="px-4 py-3 text-stone-600">
                  {c.isFocus ? "—" : c.comparisons.length}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
      {message}
    </div>
  );
}
