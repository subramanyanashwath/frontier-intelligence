import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";

type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { frontierSql?: ReturnType<typeof postgres>; frontierDb?: Database };

export function databaseUrl(): string | undefined {
  return process.env.DATABASE_URL || undefined;
}

export function getDb(): Database | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!globalForDb.frontierSql) {
    globalForDb.frontierSql = postgres(url, { max: 1, prepare: false });
    globalForDb.frontierDb = drizzle(globalForDb.frontierSql, { schema });
  }
  return globalForDb.frontierDb ?? null;
}
