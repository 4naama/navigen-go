const fs = require("fs");
const path = require("path");

// ✅ CONFIG
const projectDir = "."; // Adjust if your root is different
const filesToScan = [
  "frontend/public/app.js",
  "frontend/public/modal-injector.js",
  "frontend/public/index.html"
];
const i18nFile = "frontend/public/data/languages/en.json";
const outputFile = "vocabulary_data.json";

// ✅ Load existing translations
const en = fs.existsSync(i18nFile)
  ? JSON.parse(fs.readFileSync(i18nFile, "utf8"))
  : {};
const translationKeys = new Set(Object.keys(en));

// ✅ Extract translatable strings from JS/HTML
function extractStrings(content, fileName) {
  const results = [];
  const regex = /t\s*\(\s*(['"`])((?:\\\1|.)*?)\1\s*\)/g; // Only t("...") calls
  let match;
  while ((match = regex.exec(content))) {
    const raw = match[2].trim().normalize(); // 🧼 Normalize to preserve emoji

    // ⛔ Skip if too short, too long, or obviously not user-facing
    if (!raw) continue;
    if (/^[\s\-_.:/\\\[\]{}()0-9a-zA-Z]+$/.test(raw)) continue;
    if (raw.length < 2 || raw.length > 200) continue;

    results.push({
      string: raw,
      line: getLine(content, match.index),
      file: fileName
    });
  }
  return results;
}

function getLine(content, index) {
  return content.substring(0, index).split("\n").length;
}

// ✅ Main
(async () => {
  const found = [];

  for (const file of filesToScan) {
    const fullPath = path.resolve(projectDir, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found: ${fullPath}`);
      continue;
    }
    const content = fs.readFileSync(fullPath, "utf8"); // ✅ UTF-8 read
    const strings = extractStrings(content, file);
    found.push(...strings);
  }

  // ✅ Deduplicate by string (ignore line/file duplicates)
  const seenStrings = new Set();
  const final = found.filter(entry => {
    if (seenStrings.has(entry.string)) return false;
    seenStrings.add(entry.string);
    return true;
  });

  // ✅ Output preview
  console.log("\n📋 i18n Vocabulary Scan (Dry Run)");
  final.forEach(e => {
    console.log(`${e.file}:${e.line} → ${e.string}`);
  });

  // ✅ Write result as UTF-8 JSON
  fs.writeFileSync(outputFile, JSON.stringify(final, null, 2), { encoding: 'utf8' });
  console.log(`\n✅ Saved ${final.length} entries to ${outputFile}`);
})();
