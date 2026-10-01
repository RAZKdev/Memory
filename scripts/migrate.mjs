/**
 * MemoryVault Supabase / PostgreSQL Migration Runner
 * 
 * Applies SQL schema migrations sequentially and tracks applied migrations in _schema_migrations.
 * Usage:
 *   npm run db:migrate
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables from .env.local or .env if present
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const envFile of envFiles) {
    const fullPath = path.join(rootDir, envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log("\n==================================================================");
  console.log("             MemoryVault Database Migration Runner               ");
  console.log("==================================================================");
  console.log("\nNotice: DATABASE_URL is not set in environment or .env.local.");
  console.log("\nTo apply migrations to your live Supabase / PostgreSQL instance:\n");
  console.log("Option A (Automated CLI Runner):");
  console.log("  1. Add your connection string to .env.local (see .env.example):");
  console.log("     DATABASE_URL=\"postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require\"");
  console.log("  2. Run: npm run db:migrate\n");
  console.log("Option B (Supabase Web SQL Editor):");
  console.log("  Copy and execute the migration files sequentially in the Supabase Dashboard:");
  console.log("  - supabase/migrations/001_initial_schema.sql");
  console.log("  - supabase/migrations/002_decisions_and_retrieval.sql");
  console.log("  - supabase/migrations/003_collections.sql\n");
  console.log("==================================================================\n");
  process.exit(0);
}

const migrationsDir = path.join(rootDir, "supabase", "migrations");
if (!fs.existsSync(migrationsDir)) {
  console.error(`Error: Migrations directory not found at ${migrationsDir}`);
  process.exit(1);
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

if (migrationFiles.length === 0) {
  console.log("No migration files found in supabase/migrations/.");
  process.exit(0);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

async function runMigrations() {
  console.log("\n==================================================================");
  console.log("             MemoryVault Database Migration Runner               ");
  console.log("==================================================================");
  console.log(`Connecting to database...`);

  await client.connect();
  console.log(`Connected successfully.\n`);

  // Ensure tracking table exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const { rows: appliedRows } = await client.query(
    "SELECT name FROM _schema_migrations;"
  );
  const appliedSet = new Set(appliedRows.map((r) => r.name));

  let appliedCount = 0;

  for (const file of migrationFiles) {
    if (appliedSet.has(file)) {
      console.log(`[SKIP] Already applied: ${file}`);
      continue;
    }

    console.log(`[APPLYING] ${file}...`);
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    try {
      await client.query("BEGIN;");
      await client.query(sql);
      await client.query(
        "INSERT INTO _schema_migrations (name) VALUES ($1);",
        [file]
      );
      await client.query("COMMIT;");
      console.log(`[OK] Successfully applied: ${file}`);
      appliedCount++;
    } catch (err) {
      await client.query("ROLLBACK;");
      console.error(`\n[FAILED] Error applying migration ${file}:`, err.message);
      process.exitCode = 1;
      break;
    }
  }

  await client.end();
  console.log("\n------------------------------------------------------------------");
  console.log(`Migration complete. Newly applied: ${appliedCount} / Total: ${migrationFiles.length}`);
  console.log("==================================================================\n");
}

runMigrations().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
