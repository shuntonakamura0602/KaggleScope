import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getDatabaseUrl } from "@/lib/db/env";

let connection: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase(sql: ReturnType<typeof postgres>) {
  return drizzle(sql, { schema });
}

export function getDb() {
  if (!connection) {
    connection = postgres(getDatabaseUrl(), {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }

  database ??= createDatabase(connection);
  return database;
}

export async function closeDb() {
  if (connection) {
    await connection.end({ timeout: 5 });
    connection = undefined;
    database = undefined;
  }
}
