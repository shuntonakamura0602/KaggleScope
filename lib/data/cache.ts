import { unstable_cache } from "next/cache";

export const DATA_CACHE_TAG = "kagglescope-data";
export const DATA_CACHE_SECONDS = 60 * 60;

export function cacheDataQuery<Args extends unknown[], Result>(
  query: (...args: Args) => Promise<Result>,
  keyParts: string[],
) {
  return unstable_cache(query, keyParts, {
    revalidate: DATA_CACHE_SECONDS,
    tags: [DATA_CACHE_TAG],
  });
}
