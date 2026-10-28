import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "extension", "newtab");
const dest = path.join(root, "public");

if (!fs.existsSync(src)) {
  throw new Error(`Missing build output: ${src}`);
}

fs.mkdirSync(dest, { recursive: true });

fs.cpSync(src, dest, {
  recursive: true,
  force: true,
  errorOnExist: false,
});

console.log(`[build-web] Copied ${src} -> ${dest}`);
