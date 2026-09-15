import "../lib/db/load-env";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { closeDb, getDb } from "../lib/db/client";

const migrationsFolder = fileURLToPath(
  new URL("./migrations", import.meta.url),
);

async function main() {
  try {
    await migrate(getDb(), { migrationsFolder });
    console.log("Database migrations completed.");
  } finally {
    await closeDb();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exitCode = 1;
});
