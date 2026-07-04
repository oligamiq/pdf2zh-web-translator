import { readFileSync, existsSync } from "node:fs";

// The script might be run from root or from frontend/
const baseDir = existsSync("frontend/dist") ? "frontend/dist" : "dist";

const checks = [
  [`${baseDir}/index.html`, "PDF翻訳 - 翻訳済みPDFと対訳PDFを作成", "https://pdftr.pages.dev/"],
  [`${baseDir}/about.html`, "利用制限と注意事項 - PDF翻訳", "https://pdftr.pages.dev/about"],
  [`${baseDir}/licenses.html`, "ライセンス - PDF翻訳", "https://pdftr.pages.dev/licenses"],
];

let failed = false;

for (const [file, title, canonical] of checks) {
  let html;
  try {
    html = readFileSync(file, "utf8");
  } catch (err) {
    console.error(`Could not read file: ${file}`);
    failed = true;
    continue;
  }
  const head = html.split("</head>")[0] ?? "";

  if (!head.includes("<title") || !head.includes(title)) {
    console.error(`Missing title in <head>: ${file}`);
    failed = true;
  }

  if (!head.includes('name="description"')) {
    console.error(`Missing description in <head>: ${file}`);
    failed = true;
  }

  if (!head.includes(`href="${canonical}"`)) {
    console.error(`Missing canonical in <head>: ${file}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("SUCCESS: Static page metadata is in <head>.");
