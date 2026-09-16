import assert from "node:assert/strict";
import test from "node:test";
import { buildHeadToHead, compareRanks } from "../lib/compare";
import type { CompetitionResult } from "../seed/competitions";

function result(slug: string, rank: number): CompetitionResult {
  return {
    slug,
    title: slug,
    date: "Jan 01, 2026",
    rank,
    teams: 100,
    medal: null,
    teamSize: 1,
    specialty: "Tabular",
  };
}

test("compareRanks rewards the lower final rank and preserves draws", () => {
  assert.equal(compareRanks(3, 8), "left");
  assert.equal(compareRanks(12, 4), "right");
  assert.equal(compareRanks(5, 5), "draw");
});

test("buildHeadToHead includes only shared competitions", () => {
  const comparison = buildHeadToHead(
    [result("shared-left", 2), result("draw", 7), result("left-only", 1)],
    [result("shared-left", 9), result("draw", 7), result("right-only", 1)],
  );

  assert.deepEqual(
    comparison.competitions.map((competition) => competition.slug),
    ["shared-left", "draw"],
  );
  assert.equal(comparison.leftWins, 1);
  assert.equal(comparison.rightWins, 0);
  assert.equal(comparison.draws, 1);
});
