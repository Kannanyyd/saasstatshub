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

test("recovers the cloud computing market-size URL", async () => {
  const expected = {
    destination: "/analytics/cloud-computing-statistics-2026/",
    status: "301",
  };

  assert.deepEqual(await resolveRedirect("/analytics/cloud-computing-market-size-2026/"), {
    source: "/analytics/cloud-computing-market-size-2026/",
    ...expected,
  });
  assert.deepEqual(await resolveRedirect("/analytics/cloud-computing-market-size-2026"), {
    source: "/analytics/cloud-computing-market-size-2026",
    ...expected,
  });
});
