import { revalidateTag } from "next/cache";
import { env } from "cloudflare:workers";
import { DATA_CACHE_TAG } from "@/lib/data/cache";

async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function secretsMatch(candidate: string, expected: string) {
  const [candidateDigest, expectedDigest] = await Promise.all([
    digest(candidate),
    digest(expected),
  ]);
  let difference = 0;
  for (let index = 0; index < candidateDigest.length; index += 1) {
    difference |= candidateDigest[index] ^ expectedDigest[index];
  }
  return difference === 0;
}

export async function POST(request: Request) {
  const runtimeEnv = env as Cloudflare.Env;
  const expectedSecret = (
    runtimeEnv.REVALIDATE_SECRET ?? process.env.REVALIDATE_SECRET
  )?.trim();
  if (!expectedSecret) {
    return Response.json(
      { error: "Cache revalidation is not configured." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const candidate = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!(await secretsMatch(candidate, expectedSecret))) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  revalidateTag(DATA_CACHE_TAG, "max");
  return Response.json({ revalidated: true, tag: DATA_CACHE_TAG });
}
