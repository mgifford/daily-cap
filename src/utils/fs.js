import fs from "node:fs/promises";
import path from "node:path";

async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeJsonFile(filePath, payload) {
  await ensureParentDir(filePath);
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

export async function writeTextFile(filePath, content) {
  await ensureParentDir(filePath);
  await fs.writeFile(filePath, content, "utf8");
}
