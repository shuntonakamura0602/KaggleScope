import "../lib/db/load-env";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../lib/db/client";
import {
  kagglers as kagglersTable,
  kagglerScores,
  specialtyScores,
} from "./schema";
import { getRankForKaggler } from "../lib/rankings";
import { kagglers as seedKagglers, specialties } from "../seed/kagglers";

const tierValues = {
  Expert: 1,
  Master: 2,
  Grandmaster: 3,
} as const;

function getSpecialtyRank(username: string, specialtyName: string) {
  const ranked = seedKagglers
    .map((kaggler) => ({
      username: kaggler.username,
      score:
        kaggler.specialties.find((item) => item.name === specialtyName)
          ?.score ?? null,
    }))
    .filter((item): item is { username: string; score: number } =>
      Number.isFinite(item.score),
    )
    .sort((a, b) => b.score - a.score);

  return ranked.findIndex((item) => item.username === username) + 1;
}

async function seed() {
  const db = getDb();
  const now = new Date();

  await db.transaction(async (transaction) => {
    for (const [index, kaggler] of seedKagglers.entries()) {
      // Negative ids keep preview fixtures separate from real Meta Kaggle ids.
      const kaggleUserId = -1 - index;
      const [storedKaggler] = await transaction
        .insert(kagglersTable)
        .values({
          kaggleUserId,
          username: kaggler.username,
          displayName: kaggler.displayName,
          registeredAt: new Date(`${kaggler.joinedYear}-01-01T00:00:00.000Z`),
          competitionTier: tierValues[kaggler.tier],
          officialPoints: Number((kaggler.careerPower * 10).toFixed(4)),
          officialRank: kaggler.officialRank,
          highestRank: kaggler.highestRank,
          goldCount: kaggler.medals.gold,
          silverCount: kaggler.medals.silver,
          bronzeCount: kaggler.medals.bronze,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: kagglersTable.username,
          set: {
            kaggleUserId,
            displayName: kaggler.displayName,
            registeredAt: new Date(`${kaggler.joinedYear}-01-01T00:00:00.000Z`),
            competitionTier: tierValues[kaggler.tier],
            officialPoints: Number((kaggler.careerPower * 10).toFixed(4)),
            officialRank: kaggler.officialRank,
            highestRank: kaggler.highestRank,
            goldCount: kaggler.medals.gold,
            silverCount: kaggler.medals.silver,
            bronzeCount: kaggler.medals.bronze,
            updatedAt: now,
          },
        })
        .returning({ id: kagglersTable.id });

      if (!storedKaggler) {
        throw new Error(`Failed to store seed Kaggler: ${kaggler.username}`);
      }

      const soloCompetitionCount =
        kaggler.soloPower === null
          ? 0
          : Math.max(3, Math.floor(kaggler.competitionCount * 0.35));

      await transaction
        .insert(kagglerScores)
        .values({
          kagglerId: storedKaggler.id,
          scoreVersion: "0.1",
          careerRaw: kaggler.careerPower * kaggler.competitionCount,
          careerPower: kaggler.careerPower,
          careerRank: getRankForKaggler(kaggler.username, "overall") ?? 0,
          soloRaw:
            kaggler.soloPower === null
              ? null
              : kaggler.soloPower * soloCompetitionCount,
          soloPower: kaggler.soloPower,
          soloRank: getRankForKaggler(kaggler.username, "solo"),
          consistencyRaw: kaggler.consistency / 100,
          consistencyScore: kaggler.consistency,
          consistencyRank:
            getRankForKaggler(kaggler.username, "consistency") ?? 0,
          momentumRaw: kaggler.momentum * 2,
          momentumScore: kaggler.momentum,
          momentumRank: getRankForKaggler(kaggler.username, "momentum") ?? 0,
          competitionCount: kaggler.competitionCount,
          soloCompetitionCount,
          calculatedAt: now,
        })
        .onConflictDoUpdate({
          target: kagglerScores.kagglerId,
          set: {
            scoreVersion: "0.1",
            careerRaw: kaggler.careerPower * kaggler.competitionCount,
            careerPower: kaggler.careerPower,
            careerRank: getRankForKaggler(kaggler.username, "overall") ?? 0,
            soloRaw:
              kaggler.soloPower === null
                ? null
                : kaggler.soloPower * soloCompetitionCount,
            soloPower: kaggler.soloPower,
            soloRank: getRankForKaggler(kaggler.username, "solo"),
            consistencyRaw: kaggler.consistency / 100,
            consistencyScore: kaggler.consistency,
            consistencyRank:
              getRankForKaggler(kaggler.username, "consistency") ?? 0,
            momentumRaw: kaggler.momentum * 2,
            momentumScore: kaggler.momentum,
            momentumRank: getRankForKaggler(kaggler.username, "momentum") ?? 0,
            competitionCount: kaggler.competitionCount,
            soloCompetitionCount,
            calculatedAt: now,
          },
        });

      await transaction
        .delete(specialtyScores)
        .where(eq(specialtyScores.kagglerId, storedKaggler.id));

      for (const specialty of kaggler.specialties) {
        await transaction
          .insert(specialtyScores)
          .values({
            kagglerId: storedKaggler.id,
            specialty: specialty.name,
            rawScore: specialty.score * 2,
            score: specialty.score,
            rank: getSpecialtyRank(kaggler.username, specialty.name),
            competitionCount: Math.max(
              2,
              Math.floor(kaggler.competitionCount / specialties.length),
            ),
            goldCount: Math.min(kaggler.medals.gold, 3),
            silverCount: Math.min(kaggler.medals.silver, 5),
            bronzeCount: Math.min(kaggler.medals.bronze, 7),
            calculatedAt: now,
          })
          .onConflictDoUpdate({
            target: [specialtyScores.kagglerId, specialtyScores.specialty],
            set: {
              rawScore: specialty.score * 2,
              score: specialty.score,
              rank: getSpecialtyRank(kaggler.username, specialty.name),
              competitionCount: Math.max(
                2,
                Math.floor(kaggler.competitionCount / specialties.length),
              ),
              goldCount: Math.min(kaggler.medals.gold, 3),
              silverCount: Math.min(kaggler.medals.silver, 5),
              bronzeCount: Math.min(kaggler.medals.bronze, 7),
              calculatedAt: now,
            },
          });
      }
    }
  });

  console.log(`Seeded ${seedKagglers.length} preview Kagglers.`);
}

seed()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Database seed failed.",
    );
    process.exitCode = 1;
  })
  .finally(closeDb);
