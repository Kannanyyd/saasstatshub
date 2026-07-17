import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const redirectsPath = fileURLToPath(new URL("../../public/_redirects", import.meta.url));

function parseRedirects(contents) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [source, destination, status = "301"] = line.split(/\s+/);
      return { source, destination, status };
    });
}

function matchesSource(source, pathname) {
  if (source === pathname) return true;
  if (!source.includes("*")) return false;

  const pattern = `^${source
    .split("*")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join(".*")}$`;
  return new RegExp(pattern).test(pathname);
}

async function resolveRedirect(pathname) {
  const rules = parseRedirects(await readFile(redirectsPath, "utf8"));
  return rules.find(({ source }) => matchesSource(source, pathname));
}

const recoveryCases = [
  {
    source: "/analytics/cloud-computing-market-size-2026",
    destination: "/analytics/cloud-computing-statistics-2026/",
  },
  {
    source: "/ai/ai-statistics-2026",
    destination: "/analytics/artificial-intelligence-statistics-2026/",
  },
  {
    source: "/crm/crm-statistics-2026",
    destination: "/crm/crm-software-statistics-2026/",
  },
  {
    source: "/hr/hr-software-statistics-2026",
    destination: "/hr/hr-hcm-statistics-2026/",
  },
];

for (const { source, destination } of recoveryCases) {
  test(`recovers ${source}`, async () => {
    for (const suffix of ["/", ""]) {
      const pathname = `${source}${suffix}`;
      assert.deepEqual(await resolveRedirect(pathname), {
        source: pathname,
        destination,
        status: "301",
      });
    }
  });
}
