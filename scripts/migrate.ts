import "dotenv/config";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb } from "../lib/db/client";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL. Demo mode uses the in-memory seed. Skipping migrate.");
    return;
  }
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL was set but the client did not start.");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
