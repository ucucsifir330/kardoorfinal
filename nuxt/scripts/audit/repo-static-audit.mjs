import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const root = process.cwd();
const outDir = path.join(root, "reports", "audit");
const scanRoots = ["app", "server", "public/themes"];
const textExts = new Set([".vue", ".ts", ".js", ".mjs", ".css"]);
const sourceExts = new Set([".vue", ".ts", ".js", ".mjs"]);
const cssExts = new Set([".css"]);
const ignoreParts = new Set(["node_modules", ".nuxt", ".output", ".git", "reports", "dist"]);

const normalizePath = (filePath) => path.relative(root, filePath).replaceAll(path.sep, "/");

const readText = async (filePath) => fs.readFile(filePath, "utf8");

const ensureDir = async (dir) => fs.mkdir(dir, { recursive: true });

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    if (ignoreParts.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(fullPath));
      continue;
    }

    if (entry.isFile() && textExts.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function extractClassNames(selector) {
  const classes = new Set();

  try {
    selectorParser((selectors) => {
      selectors.walkClasses((node) => classes.add(node.value));
    }).processSync(selector);
  } catch {
    // Keep parse failures in the selector map; they are still useful review targets.
  }

  return [...classes].sort();
}

function extractIdNames(selector) {
  const ids = new Set();

  try {
    selectorParser((selectors) => {
      selectors.walkIds((node) => ids.add(node.value));
    }).processSync(selector);
  } catch {}

  return [...ids].sort();
}

function findLine(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function collectClassLiteralSources(filesByPath) {
  const classToFiles = new Map();
  const classAttrRegex = /\bclass\s*=\s*["']([^"']+)["']/g;
  const dynamicClassStringRegex = /['"`]([A-Za-z][A-Za-z0-9_-]*(?:\s+[A-Za-z][A-Za-z0-9_-]*)*)['"`]/g;

  for (const [file, text] of filesByPath) {
    if (!sourceExts.has(path.extname(file))) continue;
    const rel = normalizePath(file);
    const candidates = new Set();
    let match;

    while ((match = classAttrRegex.exec(text))) {
      for (const token of match[1].split(/\s+/).filter(Boolean)) candidates.add(token);
    }

    while ((match = dynamicClassStringRegex.exec(text))) {
      for (const token of match[1].split(/\s+/).filter(Boolean)) {
        if (/^[A-Za-z][A-Za-z0-9_-]*$/.test(token) && token.includes("-")) candidates.add(token);
      }
    }

    for (const token of candidates) {
      if (!classToFiles.has(token)) classToFiles.set(token, new Set());
      classToFiles.get(token).add(rel);
    }
  }

  return Object.fromEntries(
    [...classToFiles.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, files]) => [name, [...files].sort()])
  );
}

function collectRawSourceHits(classNames, filesByPath) {
  const sourceEntries = [...filesByPath.entries()].filter(([file]) => sourceExts.has(path.extname(file)));
  const hits = {};

  for (const className of classNames) {
    hits[className] = [];
    for (const [file, text] of sourceEntries) {
      if (text.includes(className)) hits[className].push(normalizePath(file));
    }
  }

  return hits;
}

async function parseCss(file, text) {
  const rel = normalizePath(file);
  const rootNode = postcss.parse(text, { from: rel });
  const selectors = [];
  const declarations = [];
  const important = [];
  const emptyRules = [];
  const customProperties = [];
  const customPropertyUses = [];

  rootNode.walkRules((rule) => {
    const ruleDeclarations = [];

    rule.walkDecls((decl) => {
      const row = {
        file: rel,
        line: decl.source?.start?.line ?? null,
        selector: rule.selector,
        property: decl.prop,
        value: decl.value,
        important: decl.important
      };

      declarations.push(row);
      ruleDeclarations.push(row);

      if (decl.important) important.push(row);
      if (decl.prop.startsWith("--")) customProperties.push(row);

      for (const token of decl.value.matchAll(/var\((--[A-Za-z0-9_-]+)/g)) {
        customPropertyUses.push({
          file: rel,
          line: decl.source?.start?.line ?? null,
          selector: rule.selector,
          property: decl.prop,
          token: token[1]
        });
      }
    });

    const selector = rule.selector;
    selectors.push({
      file: rel,
      line: rule.source?.start?.line ?? null,
      selector,
      classes: extractClassNames(selector),
      ids: extractIdNames(selector),
      declarations: ruleDeclarations.length
    });

    if (ruleDeclarations.length === 0) {
      emptyRules.push({
        file: rel,
        line: rule.source?.start?.line ?? null,
        selector
      });
    }
  });

  return { selectors, declarations, important, emptyRules, customProperties, customPropertyUses };
}

function groupBy(items, getKey) {
  const groups = new Map();

  for (const item of items) {
    const key = getKey(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  return groups;
}

async function main() {
  await ensureDir(outDir);

  const files = [];
  for (const scanRoot of scanRoots) {
    files.push(...await walk(path.join(root, scanRoot)));
  }

  const filesByPath = new Map();
  for (const file of files) filesByPath.set(file, await readText(file));

  const cssFiles = files.filter((file) => cssExts.has(path.extname(file)));
  const cssResults = [];

  for (const file of cssFiles) {
    cssResults.push(await parseCss(file, filesByPath.get(file)));
  }

  const selectors = cssResults.flatMap((result) => result.selectors);
  const declarations = cssResults.flatMap((result) => result.declarations);
  const important = cssResults.flatMap((result) => result.important);
  const emptyRules = cssResults.flatMap((result) => result.emptyRules);
  const customProperties = cssResults.flatMap((result) => result.customProperties);
  const customPropertyUses = cssResults.flatMap((result) => result.customPropertyUses);
  const classNames = [...new Set(selectors.flatMap((entry) => entry.classes))].sort();
  const classLiteralSources = collectClassLiteralSources(filesByPath);
  const rawSourceHits = collectRawSourceHits(classNames, filesByPath);
  const selectorGroups = groupBy(selectors, (entry) => entry.selector);
  const duplicateSelectors = [...selectorGroups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([selector, entries]) => ({ selector, count: entries.length, entries }))
    .sort((a, b) => b.count - a.count || a.selector.localeCompare(b.selector));

  const selectorSourceCandidates = classNames
    .map((className) => ({
      className,
      cssSelectorCount: selectors.filter((entry) => entry.classes.includes(className)).length,
      literalSourceFiles: classLiteralSources[className] ?? [],
      rawSourceFiles: rawSourceHits[className] ?? []
    }))
    .filter((entry) => entry.rawSourceFiles.length === 0)
    .sort((a, b) => b.cssSelectorCount - a.cssSelectorCount || a.className.localeCompare(b.className));

  const importantByFile = [...groupBy(important, (entry) => entry.file).entries()]
    .map(([file, entries]) => ({ file, count: entries.length, entries }))
    .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));

  const customPropertyDefs = [...groupBy(customProperties, (entry) => entry.property).entries()]
    .map(([token, entries]) => ({ token, count: entries.length, entries }))
    .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const customPropertyUseMap = [...groupBy(customPropertyUses, (entry) => entry.token).entries()]
    .map(([token, entries]) => ({ token, count: entries.length, entries }))
    .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token));

  const cssFileSummary = cssFiles.map((file) => {
    const rel = normalizePath(file);
    const fileSelectors = selectors.filter((entry) => entry.file === rel);
    const fileDeclarations = declarations.filter((entry) => entry.file === rel);
    const fileImportant = important.filter((entry) => entry.file === rel);

    return {
      file: rel,
      selectors: fileSelectors.length,
      declarations: fileDeclarations.length,
      important: fileImportant.length,
      emptyRules: emptyRules.filter((entry) => entry.file === rel).length
    };
  }).sort((a, b) => b.declarations - a.declarations || a.file.localeCompare(b.file));

  const componentMap = [...filesByPath.keys()]
    .filter((file) => path.extname(file) === ".vue")
    .map((file) => ({
      file: normalizePath(file),
      classLiterals: [...new Set((filesByPath.get(file).match(/\bclass\s*=\s*["']([^"']+)["']/g) ?? [])
        .flatMap((attr) => attr.replace(/\bclass\s*=\s*["']|["']$/g, "").split(/\s+/))
        .filter(Boolean))]
        .sort()
    }))
    .sort((a, b) => a.file.localeCompare(b.file));

  const summary = {
    generatedAt: new Date().toISOString(),
    files: {
      totalTextFiles: files.length,
      cssFiles: cssFiles.length,
      vueFiles: componentMap.length
    },
    css: {
      selectors: selectors.length,
      uniqueClassNames: classNames.length,
      declarations: declarations.length,
      importantDeclarations: important.length,
      duplicateSelectorGroups: duplicateSelectors.length,
      emptyRules: emptyRules.length,
      classNamesWithoutRawSourceHit: selectorSourceCandidates.length
    },
    warning:
      "These are audit candidates, not delete instructions. Runtime routes, theme layers, hover, modal and responsive states must be verified before cleanup."
  };

  const writeJson = async (name, data) => {
    await fs.writeFile(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`);
  };

  await writeJson("summary.json", summary);
  await writeJson("css-file-summary.json", cssFileSummary);
  await writeJson("css-selector-map.json", selectors);
  await writeJson("duplicate-selectors.json", duplicateSelectors);
  await writeJson("important-map.json", importantByFile);
  await writeJson("empty-rules.json", emptyRules);
  await writeJson("selector-source-candidates.json", selectorSourceCandidates);
  await writeJson("component-map.json", componentMap);
  await writeJson("custom-property-definitions.json", customPropertyDefs);
  await writeJson("custom-property-uses.json", customPropertyUseMap);

  const markdown = [
    "# Kardoor Static Audit",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Counts",
    "",
    `- CSS files: ${summary.files.cssFiles}`,
    `- Vue files: ${summary.files.vueFiles}`,
    `- Selectors: ${summary.css.selectors}`,
    `- Unique CSS class names: ${summary.css.uniqueClassNames}`,
    `- Declarations: ${summary.css.declarations}`,
    `- !important declarations: ${summary.css.importantDeclarations}`,
    `- Duplicate selector groups: ${summary.css.duplicateSelectorGroups}`,
    `- Empty CSS rules: ${summary.css.emptyRules}`,
    `- Class names without raw source hit: ${summary.css.classNamesWithoutRawSourceHit}`,
    "",
    "## Highest !important Files",
    "",
    ...importantByFile.slice(0, 15).map((entry) => `- ${entry.file}: ${entry.count}`),
    "",
    "## Largest CSS Files By Declaration Count",
    "",
    ...cssFileSummary.slice(0, 15).map((entry) => `- ${entry.file}: ${entry.declarations} declarations, ${entry.important} !important`),
    "",
    "## Read This Before Deleting",
    "",
    "This report is intentionally conservative. A selector missing from static source can still be created by data, route state, theme switches, hover, modal, transitions or browser-only code. Use runtime-browser-audit before deleting CSS."
  ].join("\n");

  await fs.writeFile(path.join(outDir, "README.md"), `${markdown}\n`);
  await fs.writeFile(
    path.join(outDir, "needs-human-review.md"),
    [
      "# Needs Human Review",
      "",
      "The following reports contain candidates only:",
      "",
      "- selector-source-candidates.json",
      "- duplicate-selectors.json",
      "- important-map.json",
      "- empty-rules.json",
      "",
      "Do not delete from these reports without runtime cascade or screenshot verification."
    ].join("\n") + "\n"
  );

  console.log(`[audit:repo] Wrote static audit reports to ${normalizePath(outDir)}`);
  console.log(`[audit:repo] CSS selectors: ${selectors.length}, !important: ${important.length}, duplicate selector groups: ${duplicateSelectors.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
