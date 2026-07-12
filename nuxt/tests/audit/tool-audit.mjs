import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "reports", "audit", "tools");
const normalizePath = (filePath) => path.relative(root, filePath).replaceAll(path.sep, "/");

const commands = [
  {
    name: "stylelint",
    command: "npx stylelint \"app/assets/styles/**/*.css\" \"public/themes/*.css\" --formatter json",
    json: true
  },
  {
    name: "dependency-cruiser",
    command: "npx depcruise \"app/**/*.{ts,js,vue}\" \"server/**/*.{ts,js}\" --no-config --output-type json",
    json: true
  },
  {
    name: "madge-circular-ts-js",
    command: "npx madge app server --extensions ts,js --circular --json",
    json: true
  },
  {
    name: "madge-orphans-ts-js",
    command: "npx madge app server --extensions ts,js --orphans --json",
    json: true
  },
  {
    name: "knip",
    command: "npx knip --reporter json",
    json: true
  }
];

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function runCommand(command) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: root,
      shell: true,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function parseJson(stdout) {
  try {
    return JSON.parse(stdout);
  } catch {
    return null;
  }
}

function summarizeStylelint(parsed) {
  if (!Array.isArray(parsed)) return null;

  const warnings = parsed.flatMap((file) =>
    (file.warnings || []).map((warning) => ({
      file: file.source ? normalizePath(file.source) : "unknown",
      line: warning.line,
      column: warning.column,
      severity: warning.severity,
      rule: warning.rule,
      text: warning.text
    }))
  );

  const byRule = new Map();
  const byFile = new Map();

  for (const warning of warnings) {
    byRule.set(warning.rule, (byRule.get(warning.rule) || 0) + 1);
    byFile.set(warning.file, (byFile.get(warning.file) || 0) + 1);
  }

  return {
    total: warnings.length,
    errors: warnings.filter((warning) => warning.severity === "error").length,
    warnings: warnings.filter((warning) => warning.severity === "warning").length,
    byRule: [...byRule.entries()].map(([rule, count]) => ({ rule, count })).sort((a, b) => b.count - a.count),
    byFile: [...byFile.entries()].map(([file, count]) => ({ file, count })).sort((a, b) => b.count - a.count),
    firstFindings: warnings.slice(0, 100)
  };
}

function summarizeDependencyCruiser(parsed) {
  if (!parsed || !Array.isArray(parsed.modules)) return null;
  const modules = parsed.modules;
  const orphans = modules.filter((module) => module.orphan).map((module) => module.source).sort();
  const errors = parsed.summary?.error || 0;
  const warnings = parsed.summary?.warn || 0;

  return {
    modules: modules.length,
    dependencies: modules.reduce((count, module) => count + (module.dependencies?.length || 0), 0),
    orphans: orphans.length,
    orphanModules: orphans.slice(0, 200),
    ruleErrors: errors,
    ruleWarnings: warnings
  };
}

function summarizeKnip(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  return Object.fromEntries(
    Object.entries(parsed).map(([key, value]) => {
      if (Array.isArray(value)) return [key, value.length];
      if (value && typeof value === "object") return [key, Object.keys(value).length];
      return [key, value];
    })
  );
}

async function main() {
  await ensureDir(outDir);
  const summary = [];

  for (const item of commands) {
    console.log(`[audit:tools] ${item.name}`);
    const result = await runCommand(item.command);
    const parsed = item.json ? parseJson(result.stdout || result.stderr) : null;
    const payload = {
      name: item.name,
      command: item.command,
      exitCode: result.code,
      parsed,
      stdout: parsed ? undefined : result.stdout,
      stderr: result.stderr
    };

    await fs.writeFile(path.join(outDir, `${item.name}.json`), `${JSON.stringify(payload, null, 2)}\n`);

    let details = null;
    if (item.name === "stylelint") details = summarizeStylelint(parsed);
    if (item.name === "dependency-cruiser") details = summarizeDependencyCruiser(parsed);
    if (item.name === "knip") details = summarizeKnip(parsed);
    if (item.name.startsWith("madge")) details = Array.isArray(parsed) ? { count: parsed.length, entries: parsed } : null;

    summary.push({
      name: item.name,
      command: item.command,
      exitCode: result.code,
      parsed: Boolean(parsed),
      details
    });
  }

  await fs.writeFile(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);

  const markdown = [
    "# Kardoor Tool Audit",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    ...summary.flatMap((item) => [
      `## ${item.name}`,
      "",
      `- Exit code: ${item.exitCode}`,
      `- Parsed JSON: ${item.parsed ? "yes" : "no"}`,
      item.details ? `- Details: \`${JSON.stringify(item.details).slice(0, 500)}\`` : "- Details: see JSON file",
      ""
    ]),
    "Tool exit codes are preserved as evidence. A non-zero exit code usually means findings were detected, not that the audit wrapper failed."
  ].join("\n");

  await fs.writeFile(path.join(outDir, "README.md"), `${markdown}\n`);
  console.log(`[audit:tools] Wrote tool reports to ${normalizePath(outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
