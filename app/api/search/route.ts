import { searchKagglers } from "@/lib/data/kagglers";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const results = await searchKagglers(query);
    return Response.json(
      { results },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Kaggler search failed", error);
    return Response.json(
      { error: "Search is temporarily unavailable." },
      { status: 500 },
    );
  }
}
