import fs from "node:fs";
import path from "node:path";

const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".md"]);
const IGNORED_DIRS = new Set([".git", ".next", "node_modules"]);
const issues = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }

    const buffer = fs.readFileSync(fullPath);
    const relativePath = path.relative(process.cwd(), fullPath);

    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      issues.push(`${relativePath}: UTF-8 BOM detected`);
    }

    const content = buffer.toString("utf8");

    if (content.includes("\uFFFD")) {
      issues.push(`${relativePath}: replacement character detected`);
    }

    if (content.slice(1).includes("\uFEFF")) {
      issues.push(`${relativePath}: unexpected zero-width no-break space detected`);
    }
  }
}

walk(process.cwd());

if (issues.length > 0) {
  console.error("Encoding check failed:");
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log("Encoding check passed.");
