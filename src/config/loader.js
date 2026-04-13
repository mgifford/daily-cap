import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { validateConfig } from "./schema.js";

const DEFAULT_CONFIG_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "config.yaml"
);

/**
 * Load and validate the Daily CAP config from a YAML file.
 *
 * @param {string} [configPath] - Path to the YAML file. Defaults to src/config/config.yaml.
 * @returns {object} Validated, frozen config object.
 * @throws {Error} If the file cannot be read, parsed, or fails validation.
 */
export function loadConfig(configPath = DEFAULT_CONFIG_PATH) {
  let raw;
  try {
    raw = fs.readFileSync(configPath, "utf8");
  } catch (err) {
    throw new Error(`Failed to read config file at ${configPath}: ${err.message}`);
  }

  let parsed;
  try {
    parsed = yaml.load(raw);
  } catch (err) {
    throw new Error(`Failed to parse config YAML at ${configPath}: ${err.message}`);
  }

  const { valid, errors } = validateConfig(parsed);
  if (!valid) {
    throw new Error(
      `Config validation failed for ${configPath}:\n  - ${errors.join("\n  - ")}`
    );
  }

  return Object.freeze(parsed);
}

/**
 * Apply runtime overrides (e.g. from CLI flags) on top of a loaded config.
 * Returns a new plain object (not frozen) with overrides merged in.
 *
 * @param {object} config - A validated config object from loadConfig().
 * @param {{ urlLimit?: number, concurrency?: number }} [overrides]
 * @returns {object} New config with overrides applied.
 */
export function applyRuntimeOverrides(config, overrides = {}) {
  const merged = {
    ...config,
    scan: { ...config.scan }
  };

  if (overrides.urlLimit !== undefined) {
    merged.scan.url_limit = overrides.urlLimit;
  }

  if (overrides.concurrency !== undefined) {
    merged.scan.concurrency = overrides.concurrency;
  }

  const { valid, errors } = validateConfig(merged);
  if (!valid) {
    throw new Error(
      `Config validation failed after applying overrides:\n  - ${errors.join("\n  - ")}`
    );
  }

  return merged;
}
