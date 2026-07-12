import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "reports", "audit");

async function readJson(name, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(outDir, name), "utf8"));
  } catch {
    return fallback;
  }
}

function groupCount(items, getKey) {
  const map = new Map();

  for (const item of items) {
    const key = getKey(item) || "unknown";
    map.set(key, (map.get(key) || 0) + 1);
  }

  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function linesForGroup(title, rows, limit = 12) {
  return [
    `## ${title}`,
    "",
    ...rows.slice(0, limit).map((row) => `- ${row.key}: ${row.count}`),
    rows.length > limit ? `- ... ${rows.length - limit} more` : "",
    ""
  ].filter(Boolean);
}

async function main() {
  const staticSummary = await readJson("summary.json", null);
  const cssFileSummary = await readJson("css-file-summary.json", []);
  const duplicateSelectors = await readJson("duplicate-selectors.json", []);
  const emptyRules = await readJson("empty-rules.json", []);
  const selectorSourceCandidates = await readJson("selector-source-candidates.json", []);
  const runtimeSummary = await readJson("runtime-summary.json", null);
  const neverMatched = await readJson("runtime-never-matched-selectors.json", []);
  const alwaysLosing = await readJson("runtime-always-losing-declarations.json", []);
  const toolSummary = await readJson(path.join("tools", "summary.json"), []);

  const neverMatchedBySource = groupCount(neverMatched, (entry) => entry.source);
  const alwaysLosingBySource = groupCount(alwaysLosing, (entry) => entry.source);
  const duplicateByFile = groupCount(
    duplicateSelectors.flatMap((entry) => entry.entries || []),
    (entry) => entry.file
  );

  const toolLines = toolSummary.flatMap((tool) => [
    `- ${tool.name}: exit ${tool.exitCode}, parsed ${tool.parsed ? "yes" : "no"}`
  ]);

  const markdown = [
    "# Kardoor Audit Action Plan",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "This is a read-only cleanup map. It ranks evidence; it does not authorize automatic deletion.",
    "",
    "## Static Totals",
    "",
    staticSummary
      ? `- CSS files: ${staticSummary.files.cssFiles}
- Vue files: ${staticSummary.files.vueFiles}
- Selectors: ${staticSummary.css.selectors}
- Declarations: ${staticSummary.css.declarations}
- !important declarations: ${staticSummary.css.importantDeclarations}
- Duplicate selector groups: ${staticSummary.css.duplicateSelectorGroups}
- Empty rules: ${staticSummary.css.emptyRules}
- Class names without raw source hit: ${staticSummary.css.classNamesWithoutRawSourceHit}`
      : "- Static summary not found.",
    "",
    "## Runtime Totals",
    "",
    runtimeSummary
      ? `- Base URL: ${runtimeSummary.baseUrl}
- Scenarios: ${runtimeSummary.scenarios}
- Selector rows: ${runtimeSummary.selectorRows}
- Never matched selectors: ${runtimeSummary.neverMatchedSelectors}
- Always losing declarations: ${runtimeSummary.alwaysLosingDeclarations}`
      : "- Runtime summary not found. Run `npm run audit:runtime` with a Nuxt dev server.",
    "",
    "## Tool Status",
    "",
    ...toolLines,
    "",
    ...linesForGroup("Largest CSS Files", cssFileSummary.map((entry) => ({
      key: `${entry.file} (${entry.important} !important)`,
      count: entry.declarations
    }))),
    ...linesForGroup("Duplicate Selectors By File", duplicateByFile),
    ...linesForGroup("Runtime Never-Matched Selectors By Source", neverMatchedBySource),
    ...linesForGroup("Runtime Always-Losing Declarations By Source", alwaysLosingBySource),
    "## First Cleanup Batches",
    "",
    "1. Fix low-risk mechanical CSS issues first: empty rules, redundant shorthand values, duplicate selector blocks that are adjacent or clearly same-scope.",
    "2. Treat `home-catalog.css`, `home-footer.css`, `light.css`, and `dark.css` as priority zones because they carry most declarations and `!important` load.",
    "3. Review dependency-cruiser and madge orphan reports manually; Nuxt auto-imports, pages, server routes and plugins can look orphaned while still being live.",
    "4. Use `runtime-always-losing-declarations.json` only as a ranked review list. Verify each batch with screenshots/typecheck/build before deleting.",
    "5. Never delete theme overrides from `light.css` or `dark.css` without checking both themes and mobile/desktop.",
    "",
    "## Key Report Files",
    "",
    "- `reports/audit/README.md`",
    "- `reports/audit/RUNTIME.md`",
    "- `reports/audit/tools/README.md`",
    "- `reports/audit/important-map.json`",
    "- `reports/audit/duplicate-selectors.json`",
    "- `reports/audit/runtime-never-matched-selectors.json`",
    "- `reports/audit/runtime-always-losing-declarations.json`",
    "- `reports/audit/tools/summary.json`",
    "",
    "## Candidate Samples",
    "",
    "### Empty Rules",
    "",
    ...emptyRules.slice(0, 20).map((entry) => `- ${entry.file}:${entry.line} ${entry.selector}`),
    "",
    "### Static Class Names Without Raw Source Hit",
    "",
    ...selectorSourceCandidates.slice(0, 20).map((entry) => `- ${entry.className}: ${entry.cssSelectorCount} CSS selectors`)
  ].join("\n");

  await fs.writeFile(path.join(outDir, "ACTION_PLAN.md"), `${markdown}\n`);
  console.log("Wrote reports/audit/ACTION_PLAN.md");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
