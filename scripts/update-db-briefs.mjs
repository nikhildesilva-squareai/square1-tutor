#!/usr/bin/env node
/**
 * Updates description_md for all projects in Supabase
 * Reads project data + generates briefs inline
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read .env.local for Supabase config
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Read project briefs SQL
const sqlContent = readFileSync(join(__dirname, "update-briefs.sql"), "utf8");
const statements = sqlContent.split(/;\n\n/).filter(s => s.trim());

async function runSQL(sql) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  return res;
}

// Use the Supabase REST API to update each project
async function updateProject(id, descriptionMd) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ description_md: descriptionMd }),
  });
  return res.ok;
}

// Parse SQL to extract id and description_md
function parseSQL(sql) {
  const idMatch = sql.match(/WHERE id = '([^']+)'/);
  const mdMatch = sql.match(/description_md = '([\s\S]*?)' WHERE/);
  if (!idMatch || !mdMatch) return null;
  return {
    id: idMatch[1],
    description_md: mdMatch[1].replace(/''/g, "'"),
  };
}

async function main() {
  console.log(`Updating ${statements.length} projects in Supabase...`);
  let ok = 0, fail = 0;

  for (const stmt of statements) {
    const parsed = parseSQL(stmt + ";");
    if (!parsed) {
      console.log("  SKIP (parse failed)");
      fail++;
      continue;
    }

    const success = await updateProject(parsed.id, parsed.description_md);
    if (success) {
      ok++;
      if (ok % 10 === 0) console.log(`  Updated ${ok}/${statements.length}...`);
    } else {
      console.log(`  FAIL ${parsed.id}`);
      fail++;
    }
  }

  console.log(`\nDone! Updated: ${ok}, Failed: ${fail}`);
}

main().catch(console.error);
