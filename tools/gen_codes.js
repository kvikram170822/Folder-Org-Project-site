const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const COUNT = parseInt(process.argv[2] || "20", 10);
const OUT_DIR = process.argv[3];
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code() {
  let raw = "";
  for (let i = 0; i < 8; i++) raw += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `IE-${raw.slice(0, 4)}-${raw.slice(4)}`;
}

const codes = [];
const seen = new Set();
while (codes.length < COUNT) {
  const c = code();
  if (!seen.has(c)) { seen.add(c); codes.push(c); }
}

const digests = codes.map((c) => crypto.createHash("sha256").update(c).digest("hex"));

fs.writeFileSync(
  path.join(OUT_DIR, "codes.js"),
  "window.INVITE_DIGESTS = " + JSON.stringify(digests, null, 2) + ";\n",
);

const priv = path.join(OUT_DIR, "_private");
fs.mkdirSync(priv, { recursive: true });
fs.writeFileSync(path.join(priv, "codes.txt"), codes.join("\n") + "\n");

console.log(`Generated ${codes.length} codes.`);
console.log("First 3:");
codes.slice(0, 3).forEach((c) => console.log("  " + c));