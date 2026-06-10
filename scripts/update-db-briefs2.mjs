#!/usr/bin/env node
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^#=]+)=(.+)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Test one update to debug
const testId = "bb412de7-5508-492f-a080-253cfabd1937";
const testMd = "## Overview\n\nTest brief content.\n\n## What You'll Learn\n\n- Item 1\n- Item 2";

async function test() {
  console.log("URL:", SUPABASE_URL);
  console.log("Key prefix:", SERVICE_KEY?.substring(0, 20) + "...");

  // Try PATCH with service role
  const url = `${SUPABASE_URL}/rest/v1/projects?id=eq.${testId}`;
  console.log("\nPATCH:", url);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`,
      "Prefer": "return=representation",
    },
    body: JSON.stringify({ description_md: testMd }),
  });

  console.log("Status:", res.status, res.statusText);
  const body = await res.text();
  console.log("Body:", body.substring(0, 500));
}

test().catch(console.error);
